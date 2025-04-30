#!/bin/bash
set -e

# === Config ===
CHAIN_ID="2tmrrBo1Lgt1mzzvPSFt73kkQKFas5d1AP88tv9cicwoFp8BSn"
UPGRADE_URL="https://raw.githubusercontent.com/BuildOnBeam/beam-subnet/main/subnets/beam-mainnet/upgrade.json"
UPGRADE_PATH="$HOME/.avalanchego/configs/chains/$CHAIN_ID"
ALIASES_PATH="$HOME/.avalanchego/configs/vms"
ALIASES_FILE="$ALIASES_PATH/aliases.json"
DOCKER_COMPOSE_FILE="docker-compose.yml"
VM_ID="kLPs8zGsTVZ28DhP1VefPCFbCgS7o5bDNez8JUxPVw9E6Ubbz"
ALIAS_TARGET="srEXiWaHuhNyGwPUi444Tu47ZEDwxTWrbQiuD7FmgSAQ6X7Dy"
SUBNET_ID="eYwmVU67LmSfZb1RwqCMhBYkFyG8ftxn6jAwqzFmxC9STBWLC"
IMAGE_TAG="v0.7.3"
NODE_INFO_FILE="node-info.json"

# === Start ===
echo "==> Preparing Beam Validator setup..."

command -v curl >/dev/null || { sudo apt update && sudo apt install -y curl; }

mkdir -p "$UPGRADE_PATH" "$ALIASES_PATH"

if [ ! -f "$UPGRADE_PATH/upgrade.json" ] || ! diff -q <(curl -fsSL "$UPGRADE_URL") "$UPGRADE_PATH/upgrade.json" >/dev/null; then
  echo "==> Downloading new upgrade.json..."
  curl -fsSL "$UPGRADE_URL" -o "$UPGRADE_PATH/upgrade.json"
else
  echo "==> upgrade.json is already up-to-date."
fi

if [ ! -f "$ALIASES_FILE" ]; then
  echo "==> Writing VM alias mapping file..."
  cat > "$ALIASES_FILE" <<EOF
{
  "$VM_ID": ["$ALIAS_TARGET"]
}
EOF
else
  echo "==> aliases.json already exists. Skipping."
fi

if [ ! -f "$DOCKER_COMPOSE_FILE" ] || ! grep -q "$IMAGE_TAG" "$DOCKER_COMPOSE_FILE"; then
  echo "==> Writing docker-compose.yml with image tag $IMAGE_TAG..."
  cat > "$DOCKER_COMPOSE_FILE" <<EOF
services:
  avago:
    image: avaplatform/subnet-evm:$IMAGE_TAG
    container_name: avago
    restart: unless-stopped
    ports:
      - "127.0.0.1:9650:9650"
      - "9651:9651"
    environment:
      AVAGO_PARTIAL_SYNC_PRIMARY_NETWORK: "true"
      AVAGO_PUBLIC_IP_RESOLUTION_SERVICE: "opendns"
      AVAGO_HTTP_HOST: "0.0.0.0"
      AVAGO_TRACK_SUBNETS: "$SUBNET_ID"
      VM_ID: "$VM_ID"
    volumes:
      - ~/.avalanchego:/root/.avalanchego
EOF
fi

CURRENT_IMAGE=$(docker ps --filter "name=avago" --format '{{.Image}}' || true)

if [ "$CURRENT_IMAGE" != "avaplatform/subnet-evm:$IMAGE_TAG" ]; then
  docker pull avaplatform/subnet-evm:$IMAGE_TAG
  docker compose up -d
else
  echo "==> Container already running with the correct image. Skipping restart."
fi

until NODE_INFO=$(curl -sf -X POST --data '{"jsonrpc":"2.0","id":1,"method":"info.getNodeID"}' \
    -H "content-type:application/json" \
    http://127.0.0.1:9650/ext/info); do
  echo "Waiting for Avalanche node..."
  sleep 5
done

echo "$NODE_INFO" | tee "$NODE_INFO_FILE"

echo "✅ Beam validator setup complete!"
echo "📄 Node info saved to: $NODE_INFO_FILE"
