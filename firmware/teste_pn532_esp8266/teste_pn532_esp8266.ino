#include <ESP8266WiFi.h>
#include <DNSServer.h>
#include <ESP8266WebServer.h>
#include <WiFiManager.h> // https://github.com/tzapu/WiFiManager
#include <WiFiClientSecure.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <SD.h>
#include <Wire.h>
#include <Adafruit_PN532.h>

// ---- PN532 (I2C) ----
#define PN532_IRQ (255) // sem pino de IRQ ligado — 255 faz a lib usar polling por timeout em vez de interrupção
#define PN532_RESET (16) // D0
#define PN532_SDA (4)   // D2
#define PN532_SCL (5)   // D1
Adafruit_PN532 nfc(PN532_IRQ, PN532_RESET);

// ---- Cartão SD (fila offline) ----
#define SD_CS_PIN (15) // D8 — SCK/MISO/MOSI usam os pinos fixos do SPI de hardware do ESP8266 (D5/D6/D7), não precisa declarar

// ---- LED de status (pisca a cada leitura tratada, ligado ou não) ----
#define LED_PIN (2) // D4 — LED interno do NodeMCU; aceso em LOW

// Nome/senha do AP de configuração do WiFiManager: abre esse AP quando não há rede
// salva (ou ela falha), você conecta por celular/notebook e escolhe a rede do local
// onde está — sem precisar hardcodar SSID/senha no firmware.
const char* setupApName = "LogTrack-Setup";
const char* setupApPassword = "logtrack123"; // min. 8 caracteres, exigido pelo AP

// Link de ativação da estação — troque pelo da zona/estação que está testando.
#ifndef SETUP_URL
#define SETUP_URL "https://logtrack-self.vercel.app/ativar/2fa2fb5a3ee14741b23f0720160bf385485d9506355f205982b2b6a4d54141df"
#endif
const char* setupUrl = SETUP_URL;

// A API rejeita POST cujo header Origin não bate com NEXTAUTH_URL do backend.
const char* backendOrigin = "https://logtrack-self.vercel.app";

// Nome curto (8.3): a lib SD do ESP8266 é baseada em FAT16/32 clássico e não aceita
// extensão com mais de 3 caracteres (então "fila.jsonl" quebraria).
const char* queueFile = "/fila.log";

struct TagLote {
  const char* tagId;
  const char* url; // página do lote; usamos só pra extrair o loteId
};

// UIDs de exemplo — troque pelas tags físicas reais que você vai usar (aproxime cada
// tag do PN532, o Serial Monitor imprime o UID lido em "Tag detectada: ...") e pelas
// URLs de lote reais do backend.
const TagLote tagsLotes[] = {
  { "01020304", "https://logtrack-self.vercel.app/l/e2a57714-d356-4126-b08b-3513502ff43f" }, // LT-2026-0005
  { "11223344", "https://logtrack-self.vercel.app/l/70051fa4-923e-4dec-ba4e-e3bc0a351858" }, // LT-2026-0002
  { "55667788", "https://logtrack-self.vercel.app/l/037d275a-3655-47e3-bd46-5c7b42fb95ac" }, // LT-2026-0003
  { "AABBCCDD", "https://logtrack-self.vercel.app/l/fe6c018b-82ee-4c82-a835-a527d26ae744" }, // LT-2026-0004
};
const int NUM_TAGS_LOTES = sizeof(tagsLotes) / sizeof(tagsLotes[0]);

String stationCookie = ""; // cookie de sessão obtido em setupUrl, reenviado em toda leitura
String loteId = "";        // extraído da url do lote associado à tag lida, a cada leitura
String apiOrigin = "";     // schema://host:porta do backend
bool sdDisponivel = false;

void setup() {
  Serial.begin(115200);
  delay(100);

  apiOrigin = backendOrigin;

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH); // apagado (lógica invertida no LED interno do NodeMCU)

  Wire.begin(PN532_SDA, PN532_SCL);
  nfc.begin();
  uint32_t versaoFirmware = nfc.getFirmwareVersion();
  if (!versaoFirmware) {
    Serial.println("PN532 não encontrado — confira a fiação I2C (SDA/SCL/VCC/GND)");
  } else {
    Serial.print("PN532 encontrado, firmware: ");
    Serial.println(versaoFirmware, HEX);
    nfc.SAMConfig();
  }

  SPI.begin();
  sdDisponivel = SD.begin(SD_CS_PIN);
  if (!sdDisponivel) {
    Serial.println("Erro ao montar cartão SD — fila offline fica desativada nesse teste");
  }

  WiFiManager wifiManager;
  // Se não conectar em 3 min (rede salva não encontrada e ninguém configurou o AP),
  // desiste e segue em modo offline em vez de travar o setup() esperando pra sempre.
  wifiManager.setConfigPortalTimeout(180);
  Serial.println("Conectando ao WiFi (WiFiManager)...");
  if (wifiManager.autoConnect(setupApName, setupApPassword)) {
    Serial.println("WiFi conectado: " + WiFi.SSID());
  } else {
    Serial.println("Sem conexão inicial — modo offline");
  }

  if (estaOnline()) {
    autenticarEstacao();
  }
}

void loop() {
  if (estaOnline()) {
    if (stationCookie.length() == 0) {
      autenticarEstacao(); // tenta de novo caso o setup tenha ficado offline
    }
    reenviarFila();
  }

  uint8_t uid[7];
  uint8_t uidLength;

  // timeout curto (ms) pra não travar o loop esperando uma tag aparecer
  if (!nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 50)) {
    return;
  }

  String tagId = lerUID(uid, uidLength);
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

  piscarLed(2);
  delay(1000); // evita leitura duplicada
}

bool estaOnline() {
  return WiFi.status() == WL_CONNECTED;
}

void piscarLed(int vezes) {
  for (int i = 0; i < vezes; i++) {
    digitalWrite(LED_PIN, LOW);
    delay(100);
    digitalWrite(LED_PIN, HIGH);
    delay(100);
  }
}

String lerUID(uint8_t* buffer, uint8_t bufferSize) {
  String uid = "";
  for (uint8_t i = 0; i < bufferSize; i++) {
    if (buffer[i] < 0x10) uid += "0";
    uid += String(buffer[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

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
  for (int i = 0; i < 16; i++) b[i] = RANDOM_REG32 & 0xFF; // gerador de hardware do ESP8266 (equivalente ao esp_random() do ESP32)
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
  WiFiClientSecure client;
  client.setInsecure(); // sem validação de certificado — ok pra teste de bancada; ver nota no chat
  HTTPClient http;
  const char* headersDesejados[] = {"Set-Cookie"};
  http.collectHeaders(headersDesejados, 1);
  http.begin(client, setupUrl);
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
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, apiOrigin + "/api/leituras");
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
  if (!sdDisponivel) {
    Serial.println("SD indisponível, leitura perdida: " + payload);
    return;
  }
  File file = SD.open(queueFile, FILE_WRITE);
  if (file) {
    file.println(payload);
    file.close();
    Serial.println("Salvo offline: " + payload);
  } else {
    Serial.println("Erro ao salvar na fila offline");
  }
}

void reenviarFila() {
  if (!sdDisponivel || !SD.exists(queueFile)) return;

  File file = SD.open(queueFile, FILE_READ);
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

  // a lib SD não tem "truncar": remove e recria com só o que sobrou
  SD.remove(queueFile);
  if (linhasRestantes.length() > 0) {
    File out = SD.open(queueFile, FILE_WRITE);
    if (out) {
      out.print(linhasRestantes);
      out.close();
    }
  }
}
