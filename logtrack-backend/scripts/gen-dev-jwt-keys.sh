#!/usr/bin/env bash
# Gera o par de chaves RSA usado pra assinar/verificar JWT localmente (profile %dev).
# Roda uma vez por checkout - os .pem sao gitignored (*.pem em .gitignore), entao sem
# isso o login falha com "SRJWT05021: Please set 'smallrye.jwt.sign.key.location'..."
# tanto no jar empacotado (docker compose) quanto rodando java -jar direto.
# Nao precisa disso pra `./mvnw quarkus:dev` - o Quarkus gera uma chave efemera sozinho
# nesse modo (live coding), so nao faz isso pra um jar ja empacotado.
set -euo pipefail
cd "$(dirname "$0")/.."

DIR=src/main/resources
PRIVATE="$DIR/dev-privateKey.pem"
PUBLIC="$DIR/dev-publicKey.pem"

if [[ -f "$PRIVATE" && -f "$PUBLIC" ]]; then
  echo "Já existem $PRIVATE e $PUBLIC - nada a fazer."
  exit 0
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

openssl genrsa -out "$TMP/traditional.pem" 2048 2>/dev/null
openssl pkcs8 -topk8 -inform PEM -outform PEM -in "$TMP/traditional.pem" -out "$PRIVATE" -nocrypt 2>/dev/null
openssl rsa -in "$TMP/traditional.pem" -pubout -out "$PUBLIC" 2>/dev/null

echo "Gerado: $PRIVATE e $PUBLIC"
