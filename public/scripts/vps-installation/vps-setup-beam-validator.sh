#!/bin/bash

# ---------------------------------------
# Beam Validator Node Installer Script
# Ubuntu 22.04 / 24.04 LTS
# ---------------------------------------
# Downloads and runs the official AvalancheGo installer
# Includes prompts for network, IP, RPC settings, state sync
# Ends with clear post-install steps and service info
# Installs Beam's Subnet-EVM binary for AvalancheGo
# Configures node to track the Beam subnet
# Applies upgrade rules and restarts AvalancheGo
# Displays the NodeID for staking and monitoring
# ---------------------------------------

set -e  # Exit on any error

# Update system packages
echo "🔄 Updating system packages..."
sudo apt update -y && sudo apt upgrade -y

# Install prerequisites
echo "🔧 Installing required packages..."
sudo apt install -y wget tar jq

# Download AvalancheGo installer
echo "⬇️ Downloading AvalancheGo installer..."
wget -nd -m https://raw.githubusercontent.com/ava-labs/avalanche-docs/master/scripts/avalanchego-installer.sh

# Set execute permissions
echo "🔐 Setting executable permissions..."
chmod 755 avalanchego-installer.sh

# Display pre-install instructions
cat <<EOF

🚀 Starting AvalancheGo installation...

You will be prompted for the following inputs:

1️⃣  🔌 Connection Type:
     - [1] Residential (Dynamic IP)
     - [2] Cloud (Static IP)

2️⃣  🌐 Public IP:
     - Confirms detected public IP or allows manual entry.

3️⃣  🔓 RPC Port Exposure:
     - [private]: Local access only (recommended for validators)
     - [public]: Open to all interfaces (required for public API nodes)

⚠️ If choosing 'public', you must secure your RPC port via firewall rules
   to restrict access to trusted IPs. Leaving it open is a serious risk.

4️⃣  ⚡ State Sync:
     - [on]: Fast sync with current state (great for validators)
     - [off]: Full archive node with history (needed for analytics or archival needs)

EOF

# Wait a moment before continuing
sleep 6

# Run the interactive installer
./avalanchego-installer.sh

# Post-installation
cat <<EOF

✅ AvalancheGo installation complete.
--------------------------------------

🔧 The node is now running in the background as a systemd service.

Proceeding to install Beam Network...

EOF

# Start the Beam Network installation

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

✅ Beam Validator Node installation complete!
-----------------------------------------

🟢 To check the service status:
  sudo systemctl status avalanchego
  (Press 'q' to exit)

📄 Config paths:
  - Node config:     /home/ubuntu/.avalanchego/configs/node.json
  - C-Chain config:  /home/ubuntu/.avalanchego/configs/chains/C/config.json
  - Plugins:         /home/ubuntu/.avalanchego/plugins

🔌 Subnet-EVM plugin installed:      $PLUGIN_DIR/$VM_ID
🧩 Node config file:                $NODE_CONFIG
📈 Upgrade config path:             $CHAIN_CONFIG_DIR/upgrade.json

📡 To monitor real-time logs:
  sudo journalctl -u avalanchego -f

EOF