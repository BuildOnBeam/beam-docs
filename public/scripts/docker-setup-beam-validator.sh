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

echo "==> Ensuring curl is installed..."
sudo apt update >/dev/null && sudo apt install -y curl >/dev/null

echo "==> Creating Beam config directories..."
mkdir -p "$UPGRADE_PATH"
mkdir -p "$ALIASES_PATH"

echo "==> Downloading upgrade.json..."
curl -fsSL "$UPGRADE_URL" -o "$UPGRADE_PATH/upgrade.json"

echo "==> Writing VM alias mapping file..."
cat > "$ALIASES_FILE" <<EOF
{
  "$VM_ID": ["$ALIAS_TARGET"]
}
EOF

echo "==> Writing docker-compose.yml..."
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

echo "==> Pulling Docker image: avaplatform/subnet-evm:$IMAGE_TAG"
docker pull avaplatform/subnet-evm:$IMAGE_TAG

echo "==> Starting Avalanche node with Docker Compose..."
docker compose up -d

echo "==> Waiting 10 seconds for the node to initialize..."
sleep 10

echo "==> Fetching NodeID and BLS Public Key + Proof..."
NODE_INFO=$(curl -s -X POST --data '{"jsonrpc":"2.0","id":1,"method":"info.getNodeID"}' \
  -H "content-type:application/json" \
  http://127.0.0.1:9650/ext/info
)

echo "$NODE_INFO" | tee "$NODE_INFO_FILE"

echo "✅ Beam validator setup complete!"
echo "📄 Node info saved to: $NODE_INFO_FILE"
