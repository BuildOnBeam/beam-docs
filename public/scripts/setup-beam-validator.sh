#!/bin/bash
set -e

# === Config ===
CHAIN_ID="2tmrrBo1Lgt1mzzvPSFt73kkQKFas5d1AP88tv9cicwoFp8BSn"
UPGRADE_URL="https://raw.githubusercontent.com/BuildOnBeam/beam-subnet/main/subnets/beam-mainnet/upgrade.json"
UPGRADE_PATH="$HOME/.avalanchego/configs/chains/$CHAIN_ID"
DOCKER_COMPOSE_FILE="docker-compose.yml"
ENTRYPOINT_SCRIPT="start-avago.sh"
VM_ID="kLPs8zGsTVZ28DhP1VefPCFbCgS7o5bDNez8JUxPVw9E6Ubbz"
SUBNET_ID="eYwmVU67LmSfZb1RwqCMhBYkFyG8ftxn6jAwqzFmxC9STBWLC"
IMAGE_TAG="v0.7.3"
VOLUME_NAME="$(basename "$(pwd)")_avago_data"
NODE_INFO_FILE="node-info.json"

echo "==> Checking Docker volume reuse..."
if docker volume ls | grep -q "$VOLUME_NAME"; then
  echo "✅ Reusing existing Docker volume: $VOLUME_NAME"
else
  echo "⚠️  No existing volume detected. A new one will be created."
fi

echo "==> Creating Beam upgrade config directory..."
mkdir -p "$UPGRADE_PATH"

echo "==> Downloading latest upgrade.json..."
curl -fsSL "$UPGRADE_URL" -o "$UPGRADE_PATH/upgrade.json"

echo "==> Writing entrypoint script: $ENTRYPOINT_SCRIPT"
cat > "$ENTRYPOINT_SCRIPT" <<EOF
#!/bin/sh

PLUGIN_PATH="/avalanchego/build/plugins/$VM_ID"

if [ ! -e "\$PLUGIN_PATH" ]; then
  echo "Beam VM not found. Renaming..."
  mv /avalanchego/build/plugins/* "\$PLUGIN_PATH"
fi

exec /avalanchego/build/avalanchego
EOF

chmod +x "$ENTRYPOINT_SCRIPT"

echo "==> Writing docker-compose.yml..."
cat > "$DOCKER_COMPOSE_FILE" <<EOF
version: '3.9'

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
    entrypoint: /start-avago.sh
    volumes:
      - ./start-avago.sh:/start-avago.sh:ro
      - avago_data:/root/.avalanchego

volumes:
  avago_data:
    driver: local
EOF

echo "==> Pulling latest compatible image: avaplatform/subnet-evm:$IMAGE_TAG"
docker pull avaplatform/subnet-evm:$IMAGE_TAG

echo "==> Starting Avalanche node with Docker Compose..."
docker compose up -d

echo "==> Waiting 10 seconds for the node to initialize..."
sleep 10

echo "==> Fetching NodeID and BLS Proof..."
NODE_INFO=$(docker exec avago sh -c '
  apt update >/dev/null && apt install -y curl >/dev/null &&
  curl -s -X POST --data "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"info.getNodeID\"}" -H "content-type:application/json" 127.0.0.1:9650/ext/info
')

echo "$NODE_INFO" | tee "$NODE_INFO_FILE"

echo "✅ Beam validator setup complete!"
echo "📄 Node info saved to: $NODE_INFO_FILE"