#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LittleFS.h>
#include <esp_random.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <freertos/queue.h>
#include <freertos/semphr.h>

// Comente essa linha se você tiver o RC522 disponível no Wokwi
// #define USE_BUTTON_SIMULATION

#ifndef USE_BUTTON_SIMULATION
#include <SPI.h>
#include <MFRC522.h>
#define SS_PIN 5
#define RST_PIN 22
MFRC522 rfid(SS_PIN, RST_PIN);
#else
#define BUTTON_PIN 4
#endif

// Botão + LEDs para simular online/offline manualmente, independente do WiFi real
#define MODE_BUTTON_PIN 27
#define LED_RED_PIN 25
#define LED_GREEN_PIN 26

bool modoOfflineSimulado = false; // true = força offline (fila) mesmo com WiFi real conectado
bool estadoBotaoModoAnterior = HIGH;

// Rede padrão da simulação do Wokwi (não precisa senha)
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// backendHost é o endereço que o ESP32 REALMENTE consegue alcançar (usado tanto pra
// autenticar quanto pra enviar leituras) — pode ser diferente do valor "lógico" que o
// backend espera ver no header Origin (backendOrigin, abaixo). "localhost" não funciona
// aqui dentro do simulador: isso aponta pro próprio ESP32 virtual, não pro seu PC. Use
// host.wokwi.internal (gateway do Wokwi pro host, confirme na doc do Wokwi que sua versão
// suporta) ou uma URL pública (tunnel cloudflared/ngrok) apontando pro backend Quarkus.
// Pra hardware real na mesma rede, normalmente é o IP LAN da máquina rodando o backend.
#ifndef BACKEND_HOST
#define BACKEND_HOST "http://localhost:8080"
#endif
const char* backendHost = BACKEND_HOST;

// Token de ativação do portal desta zona (um por env do firmware — veja platformio.ini:
// env:zona-a/b/c, gerado/hasheado em DevDataSeeder no backend). setupUrl é montado em
// runtime a partir de backendHost + esse token, não mais como uma URL fixa só.
#ifndef PORTAL_TOKEN
#define PORTAL_TOKEN "cc613c7959d0f0a0eaf5196f307ae667b1fc4f5361c21614722f40784d1eab03"
#endif
const char* portalToken = PORTAL_TOKEN;
String setupUrl; // montada em setup(): backendHost + "/ativar/" + portalToken

// A API rejeita POST cujo header Origin não bater EXATAMENTE com logtrack.backend-origin
// configurado no backend Quarkus (OriginGuard, proteção contra CSRF) — isso é o valor
// lógico do backend, não necessariamente o endereço de rede usado pra alcançá-lo (esse é
// backendHost, acima). Se mudar LOGTRACK_BACKEND_ORIGIN no backend, mude aqui também.
const char* backendOrigin = "http://localhost:8080";

const char* queueFile = "/fila.jsonl";

struct TagLote {
  const char* tagId;
  const char* loteId; // UUID do lote no backend Quarkus (tabela lotes, seed fixo em DevDataSeeder)
};

const TagLote tagsLotes[] = {
  { "01020304", "9c672cd2-dc86-4f94-8c5b-7662675c18f8" }, // LOTE-001
  { "11223344", "d897e388-6d2f-41c6-8f5e-0844f27cd161" }, // LOTE-002
  { "55667788", "eb75d176-55b8-4585-9cdc-413cf85cd308" }, // LOTE-003
  { "AABBCCDD", "33910e43-3ecf-4796-9291-d26de847a3ec" }, // LOTE-004
};
const int NUM_TAGS_LOTES = sizeof(tagsLotes) / sizeof(tagsLotes[0]);

String stationCookie = ""; // cookie de sessão obtido em setupUrl, reenviado em toda leitura
String loteId = "";        // UUID do lote associado à tag lida, resolvido a cada leitura
String apiOrigin = "";     // schema://host:porta do backend (igual pra todos os lotes)

// stationCookie e toda chamada HTTPClient (autenticarEstacao/enviarLeitura/reenviarFila)
// só são tocadas dentro de taskRede — nunca em loop(). Isso evita tanto o loop() bloquear
// esperando rede quanto uma String global sendo lida/escrita de duas tasks ao mesmo tempo.
#define TAM_PAYLOAD_MAX 128
#define TAM_FILA_ENVIO 8
#define MAX_TENTATIVAS_IMEDIATAS 3
#define DEBOUNCE_MESMA_TAG_MS 1000

struct ItemEnvio {
  char payload[TAM_PAYLOAD_MAX];
};

QueueHandle_t filaEnvio;           // loop() -> taskRede: leituras prontas pra enviar
SemaphoreHandle_t mutexArquivoFila; // protege fila.jsonl, acessado por loop() e taskRede

String ultimaTagId = "";
unsigned long ultimaLeituraMillis = 0;

void setup() {
  Serial.begin(115200);

  setupUrl = String(backendHost) + "/ativar/" + portalToken;
  apiOrigin = backendHost;

  // LEDs e botão de modo primeiro: dão feedback visual mesmo que o RC522 trave/demore
  // pra inicializar (com várias boards RC522 juntas numa simulação só, a sim pode ficar
  // lenta — assim pelo menos o LED acende e mostra que a board está viva).
  pinMode(MODE_BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);
  atualizarLedModo();

#ifndef USE_BUTTON_SIMULATION
  SPI.begin();
  rfid.PCD_Init();
#else
  pinMode(BUTTON_PIN, INPUT_PULLUP);
#endif

  if (!LittleFS.begin(true)) {
    Serial.println("Erro ao montar LittleFS");
  } else {
    // Garante que o arquivo já existe: LittleFS.exists() abre em modo leitura por baixo
    // dos panos e loga um erro no core toda vez que o arquivo não existe ainda — abrir em
    // modo "a" aqui evita esse log poluir o Serial em todo loop() até a primeira fila salva.
    File initFila = LittleFS.open(queueFile, "a");
    if (initFila) initFila.close();
  }

  WiFi.begin(ssid, password);
  Serial.print("Conectando ao WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println(WiFi.status() == WL_CONNECTED ? "WiFi conectado" : "Sem conexão inicial — modo offline");

  filaEnvio = xQueueCreate(TAM_FILA_ENVIO, sizeof(ItemEnvio));
  mutexArquivoFila = xSemaphoreCreateMutex();

  // Toda chamada de rede (autenticação, POST de leitura, drenagem da fila offline) roda
  // nessa task, no outro núcleo — loop() nunca fica bloqueado esperando HTTP, então o
  // RFID continua sendo consultado mesmo com um envio em andamento.
  xTaskCreatePinnedToCore(taskRede, "taskRede", 10240, NULL, 1, NULL, 0);
}

void loop() {
  verificarBotaoModo();

  String tagId = "";

#ifndef USE_BUTTON_SIMULATION
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }
  tagId = lerUID(rfid.uid.uidByte, rfid.uid.size);
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
#else
  if (digitalRead(BUTTON_PIN) == HIGH) {
    return; // botão solto, nada a fazer
  }
  tagId = "01020304"; // simula a tag da LT-2026-0005; troque por outra do tagsLotes pra testar outro lote
  delay(300); // debounce do botão físico
#endif

  // Debounce por tag: ignora releitura da MESMA tag em menos de 1s (ainda parada no
  // campo do leitor), mas nunca segura uma tag DIFERENTE lida logo em seguida — não tem
  // mais delay() fixo nem envio HTTP aqui dentro, então o RFID nunca fica de fora.
  if (tagId == ultimaTagId && millis() - ultimaLeituraMillis < DEBOUNCE_MESMA_TAG_MS) {
    return;
  }
  ultimaTagId = tagId;
  ultimaLeituraMillis = millis();

  Serial.println("Tag detectada: " + tagId);

  if (!buscarLoteParaTag(tagId, loteId)) {
    Serial.println("Tag sem lote associado, ignorando: " + tagId);
    return;
  }

  String payload = montarPayload();

  // Só enfileira (não bloqueia); taskRede é quem de fato manda pra API. Cai na fila
  // offline em disco se estiver sem rede ou se a fila de envio estiver cheia (taskRede
  // sobrecarregada/travada em retries).
  if (!estaOnline() || !enfileirarEnvio(payload)) {
    salvarNaFila(payload);
  }
}

bool estaOnline() {
  return WiFi.status() == WL_CONNECTED && !modoOfflineSimulado;
}

void atualizarLedModo() {
  digitalWrite(LED_RED_PIN, modoOfflineSimulado ? HIGH : LOW);
  digitalWrite(LED_GREEN_PIN, modoOfflineSimulado ? LOW : HIGH);
}

void verificarBotaoModo() {
  bool estado = digitalRead(MODE_BUTTON_PIN);
  if (estadoBotaoModoAnterior == HIGH && estado == LOW) {
    modoOfflineSimulado = !modoOfflineSimulado;
    atualizarLedModo();
    Serial.println(modoOfflineSimulado ? "Modo simulado: OFFLINE" : "Modo simulado: ONLINE");
    delay(300); // debounce
  }
  estadoBotaoModoAnterior = estado;
}

#ifndef USE_BUTTON_SIMULATION
String lerUID(byte *buffer, byte bufferSize) {
  String uid = "";
  for (byte i = 0; i < bufferSize; i++) {
    if (buffer[i] < 0x10) uid += "0";
    uid += String(buffer[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}
#endif

bool buscarLoteParaTag(const String& tagId, String& loteIdEncontrado) {
  for (int i = 0; i < NUM_TAGS_LOTES; i++) {
    if (tagId.equalsIgnoreCase(tagsLotes[i].tagId)) {
      loteIdEncontrado = tagsLotes[i].loteId;
      return true;
    }
  }
  return false;
}

String gerarUUID() {
  uint8_t b[16];
  for (int i = 0; i < 16; i++) b[i] = esp_random() & 0xFF;
  b[6] = (b[6] & 0x0F) | 0x40; // versão 4
  b[8] = (b[8] & 0x3F) | 0x80; // variante RFC 4122
  char buf[37];
  snprintf(buf, sizeof(buf), "%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x",
    b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[8], b[9], b[10], b[11], b[12], b[13], b[14], b[15]);
  return String(buf);
}

String montarPayload() {
  StaticJsonDocument<200> doc;
  doc["loteId"] = loteId;
  doc["requestId"] = gerarUUID();
  String payload;
  serializeJson(doc, payload);
  return payload;
}

// Copia o payload pra um item de tamanho fixo e empilha na fila de envio sem bloquear
// (timeout 0): se a fila estiver cheia, devolve false e quem chamou trata a leitura como
// se tivesse falhado (cai na fila offline em disco).
bool enfileirarEnvio(const String& payload) {
  ItemEnvio item;
  payload.toCharArray(item.payload, sizeof(item.payload));
  return xQueueSend(filaEnvio, &item, 0) == pdTRUE;
}

// Tenta reenviar algumas vezes com um pequeno backoff antes de desistir e cair na fila
// offline em disco. Roda só dentro de taskRede, então os delays aqui não afetam loop().
void processarEnvio(const String& payload) {
  for (int tentativa = 1; tentativa <= MAX_TENTATIVAS_IMEDIATAS; tentativa++) {
    if (enviarLeitura(payload)) {
      return; // enviarLeitura já loga o sucesso
    }
    if (tentativa < MAX_TENTATIVAS_IMEDIATAS) {
      Serial.println("Retentando envio (" + String(tentativa + 1) + "/" + String(MAX_TENTATIVAS_IMEDIATAS) + "): " + payload);
      vTaskDelay(pdMS_TO_TICKS(500 * tentativa));
    }
  }
  Serial.println("Esgotadas as tentativas imediatas, indo pra fila offline: " + payload);
  salvarNaFila(payload);
}

// Task de rede: autentica, drena a fila offline e processa a fila de envio, tudo em
// background. loop() nunca chama HTTPClient diretamente — só lê o RFID e enfileira.
void taskRede(void* parametro) {
  for (;;) {
    if (!estaOnline()) {
      vTaskDelay(pdMS_TO_TICKS(500));
      continue;
    }

    if (stationCookie.length() == 0) {
      autenticarEstacao(); // tenta de novo caso tenha ficado offline antes de autenticar
    }

    reenviarFila();

    ItemEnvio item;
    if (xQueueReceive(filaEnvio, &item, pdMS_TO_TICKS(500)) == pdTRUE) {
      processarEnvio(String(item.payload));
    }
  }
}

void autenticarEstacao() {
  HTTPClient http;
  const char* headersDesejados[] = {"Set-Cookie"};
  http.collectHeaders(headersDesejados, 1);
  http.begin(setupUrl);
  // setupUrl responde com um redirect (302); o cookie vem nesse redirect, não na página final
  http.setFollowRedirects(HTTPC_DISABLE_FOLLOW_REDIRECTS);

  int codigo = http.GET();
  if (codigo > 0 && http.hasHeader("Set-Cookie")) {
    String setCookie = http.header("Set-Cookie");
    int fimValor = setCookie.indexOf(';');
    stationCookie = fimValor == -1 ? setCookie : setCookie.substring(0, fimValor);
    Serial.println("Estação autenticada, cookie: " + stationCookie);
  } else {
    Serial.println("Falha ao autenticar estação, código: " + String(codigo));
  }
  http.end();
}

bool enviarLeitura(String payload) {
  HTTPClient http;
  http.begin(apiOrigin + "/api/leituras");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Origin", backendOrigin);
  if (stationCookie.length() > 0) {
    http.addHeader("Cookie", stationCookie);
  }

  int codigo = http.POST(payload);
  Serial.println("Código HTTP: " + String(codigo));
  http.end();

  if (codigo > 0 && codigo < 300) {
    Serial.println("Enviado com sucesso: " + payload);
    return true;
  }

  Serial.println("Falha no envio, código: " + String(codigo));
  return false;
}

void salvarNaFila(String payload) {
  if (xSemaphoreTake(mutexArquivoFila, pdMS_TO_TICKS(1000)) != pdTRUE) {
    Serial.println("Timeout ao acessar fila offline, leitura perdida: " + payload);
    return;
  }

  File file = LittleFS.open(queueFile, "a");
  if (file) {
    file.println(payload);
    file.close();
    Serial.println("Salvo offline: " + payload);
  } else {
    Serial.println("Erro ao salvar na fila offline");
  }

  xSemaphoreGive(mutexArquivoFila);
}

void reenviarFila() {
  if (xSemaphoreTake(mutexArquivoFila, pdMS_TO_TICKS(1000)) != pdTRUE) {
    return; // não conseguiu o lock a tempo, tenta de novo no próximo ciclo da taskRede
  }

  if (!LittleFS.exists(queueFile)) {
    xSemaphoreGive(mutexArquivoFila);
    return;
  }

  File file = LittleFS.open(queueFile, "r");
  if (!file) {
    xSemaphoreGive(mutexArquivoFila);
    return;
  }

  String linhasRestantes = "";
  bool houveFalha = false;

  while (file.available()) {
    String linha = file.readStringUntil('\n');
    linha.trim();
    if (linha.length() == 0) continue;

    if (!houveFalha && enviarLeitura(linha)) {
      // enviado, não reescreve essa linha
    } else {
      houveFalha = true;
      linhasRestantes += linha + "\n";
    }
  }
  file.close();

  File out = LittleFS.open(queueFile, "w");
  if (out) {
    out.print(linhasRestantes);
    out.close();
  }

  xSemaphoreGive(mutexArquivoFila);
}