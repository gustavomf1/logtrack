#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LittleFS.h>
#include <esp_random.h>

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
// "localhost" não funciona aqui: dentro do simulador isso aponta pro próprio ESP32
// virtual, não pro seu PC. Use uma URL pública (ex: tunnel cloudflared/ngrok) que
// encaminhe para o seu servidor local, ou o host.wokwi.internal (Wokwi IoT Gateway).
// Cada sensor de zona é o mesmo firmware — só o setupUrl muda, embutido via build
// flag -D SETUP_URL na env do PlatformIO (veja platformio.ini: env:zona-a/b/c).
#ifndef SETUP_URL
#define SETUP_URL "https://logtrack-self.vercel.app/ativar/2fa2fb5a3ee14741b23f0720160bf385485d9506355f205982b2b6a4d54141df"
#endif
const char* setupUrl = SETUP_URL;

// A API rejeita POST cujo header Origin não bate com NEXTAUTH_URL do backend (proteção
// contra CSRF em src/app/api/[...resource]/route.ts) — isso é fixo, não é a URL do tunnel.
const char* backendOrigin = "https://logtrack-self.vercel.app";

const char* queueFile = "/fila.jsonl";

struct TagLote {
  const char* tagId;
  const char* url; // página do lote; usamos só para extrair o loteId
};

const TagLote tagsLotes[] = {
  { "01020304", "https://logtrack-self.vercel.app/l/e2a57714-d356-4126-b08b-3513502ff43f" }, // LT-2026-0005
  { "11223344", "https://logtrack-self.vercel.app/l/70051fa4-923e-4dec-ba4e-e3bc0a351858" }, // LT-2026-0002
  { "55667788", "https://logtrack-self.vercel.app/l/037d275a-3655-47e3-bd46-5c7b42fb95ac" }, // LT-2026-0003
  { "AABBCCDD", "https://logtrack-self.vercel.app/l/fe6c018b-82ee-4c82-a835-a527d26ae744" }, // LT-2026-0004
};
const int NUM_TAGS_LOTES = sizeof(tagsLotes) / sizeof(tagsLotes[0]);

String stationCookie = ""; // cookie de sessão obtido em setupUrl, reenviado em toda leitura
String loteId = "";        // extraído da url do lote associado à tag lida, a cada leitura
String apiOrigin = "";     // schema://host:porta do backend (igual pra todos os lotes)

void setup() {
  Serial.begin(115200);

  apiOrigin = backendOrigin;

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

  if (estaOnline()) {
    autenticarEstacao();
  }
}

void loop() {
  verificarBotaoModo();

  if (estaOnline()) {
    if (stationCookie.length() == 0) {
      autenticarEstacao(); // tenta de novo caso o setup tenha ficado offline
    }
    reenviarFila();
  }

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
  delay(300); // debounce
#endif

  Serial.println("Tag detectada: " + tagId);

  if (!buscarLoteParaTag(tagId, loteId)) {
    Serial.println("Tag sem lote associado, ignorando: " + tagId);
    delay(1000);
    return;
  }

  String payload = montarPayload();

  if (estaOnline()) {
    if (!enviarLeitura(payload)) {
      salvarNaFila(payload);
    }
  } else {
    salvarNaFila(payload);
  }

  delay(1000); // evita leitura duplicada
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

String extrairLoteId(const char* url) {
  String s(url);
  int barra = s.lastIndexOf('/');
  return barra == -1 ? s : s.substring(barra + 1);
}

bool buscarLoteParaTag(const String& tagId, String& loteIdEncontrado) {
  for (int i = 0; i < NUM_TAGS_LOTES; i++) {
    if (tagId.equalsIgnoreCase(tagsLotes[i].tagId)) {
      loteIdEncontrado = extrairLoteId(tagsLotes[i].url);
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
  File file = LittleFS.open(queueFile, "a");
  if (file) {
    file.println(payload);
    file.close();
    Serial.println("Salvo offline: " + payload);
  } else {
    Serial.println("Erro ao salvar na fila offline");
  }
}

void reenviarFila() {
  if (!LittleFS.exists(queueFile)) return;

  File file = LittleFS.open(queueFile, "r");
  if (!file) return;

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
}