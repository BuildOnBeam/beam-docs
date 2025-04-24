#!/bin/bash

# -------------------------------------------------
# Beam Subnet-EVM Installer Script
# Ubuntu 22.04 / 24.04 LTS
# -------------------------------------------------
# Installs Beam's Subnet-EVM binary for AvalancheGo
# Configures node to track the Beam subnet
# Applies upgrade rules and restarts AvalancheGo
# -------------------------------------------------

set -e  # Exit on any error

# Step 0: Install prerequisites
echo "🔧 Installing required packages..."
sudo apt update -y && sudo apt install -y wget tar jq

# Constants
PLUGIN_DIR="$HOME/.avalanchego/plugins"
SUBNET_EVM_VERSION="0.7.3"
SUBNET_EVM_URL="https://github.com/ava-labs/subnet-evm/releases/download/v${SUBNET_EVM_VERSION}/subnet-evm_${SUBNET_EVM_VERSION}_linux_amd64.tar.gz"
VM_ID="kLPs8zGsTVZ28DhP1VefPCFbCgS7o5bDNez8JUxPVw9E6Ubbz"
BLOCKCHAIN_ID="2tmrrBo1Lgt1mzzvPSFt73kkQKFas5d1AP88tv9cicwoFp8BSn"
UPGRADE_URL="https://raw.githubusercontent.com/BuildOnBeam/beam-subnet/main/subnets/beam-mainnet/upgrade.json"

# Step 1: Download and install Subnet-EVM
echo ""
echo "⬇️ Downloading Subnet-EVM v${SUBNET_EVM_VERSION}..."
mkdir -p subnetevm && cd subnetevm
wget -O subnet-evm.tar.gz "$SUBNET_EVM_URL"
tar -xvzf subnet-evm.tar.gz

echo "📁 Moving Subnet-EVM to plugins directory..."
mkdir -p "$PLUGIN_DIR"
cp subnet-evm "$PLUGIN_DIR/$VM_ID"

echo "✅ Subnet-EVM installed at: $PLUGIN_DIR/$VM_ID"
cd ..

# Step 2: Update AvalancheGo node config
echo ""
echo "🛠️  Configuring AvalancheGo to track the Beam subnet..."

NODE_CONFIG="$HOME/.avalanchego/configs/node.json"
mkdir -p "$(dirname "$NODE_CONFIG")"

if [[ -f "$NODE_CONFIG" ]]; then
  jq '. + {
    "track-subnets": "eYwmVU67LmSfZb1RwqCMhBYkFyG8ftxn6jAwqzFmxC9STBWLC",
    "partial-sync-primary-network": true
  }' "$NODE_CONFIG" > temp_node.json && mv temp_node.json "$NODE_CONFIG"
else
  cat <<EOF > "$NODE_CONFIG"
{
  "track-subnets": "eYwmVU67LmSfZb1RwqCMhBYkFyG8ftxn6jAwqzFmxC9STBWLC",
  "partial-sync-primary-network": true
}
EOF
fi

echo "✅ Node config updated: $NODE_CONFIG"

# Step 3: Apply network upgrades
echo ""
echo "🔧 Applying Beam subnet upgrade rules..."

CHAIN_CONFIG_DIR="$HOME/.avalanchego/configs/chains/$BLOCKCHAIN_ID"
mkdir -p "$CHAIN_CONFIG_DIR"
cd "$CHAIN_CONFIG_DIR"

wget -O upgrade.json "$UPGRADE_URL"

if [[ -f "upgrade.json" ]]; then
  echo "✅ upgrade.json downloaded successfully."
else
  echo "❌ Failed to download upgrade.json"
  exit 1
fi

cd ~

# Step 4: Restart AvalancheGo to apply all changes
echo ""
echo "🔄 Restarting AvalancheGo node service..."
sudo systemctl restart avalanchego
sleep 3
sudo systemctl status avalanchego --no-pager

# Step 5: Extract and display NodeID
echo ""
echo "🔎 Extracting NodeID from logs..."

NODE_ID=$(sudo journalctl -u avalanchego | grep -oP '"nodeID":\s*"(NodeID-[a-zA-Z0-9]+)"' | tail -n1 | grep -oP 'NodeID-[a-zA-Z0-9]+')

if [[ -n "$NODE_ID" ]]; then
  echo ""
  echo "✅ Your NodeID is:"
  echo ""
  echo "    🆔  $NODE_ID"
  echo ""
  echo "💡 Save this NodeID — it's required for staking and node monitoring."
else
  echo "⚠️  Could not extract NodeID from logs. Try manually with:"
  echo "    sudo journalctl -u avalanchego | grep 'nodeID'"
fi

# Wrap-up message
cat <<EOF

✅ Beam Subnet-EVM installation complete!
-----------------------------------------

🔌 Subnet-EVM plugin installed:      $PLUGIN_DIR/$VM_ID
🧩 Node config file:                $NODE_CONFIG
📈 Upgrade config path:             $CHAIN_CONFIG_DIR/upgrade.json

📡 To monitor real-time logs:
  sudo journalctl -u avalanchego -f

EOF
