#!/bin/bash

# ---------------------------------------
# AvalancheGo Automated Installer Script
# Ubuntu 22.04 / 24.04 LTS
# ---------------------------------------
# Downloads and runs the official AvalancheGo installer
# Includes prompts for network, IP, RPC settings, state sync
# Ends with clear post-install steps and service info
# ---------------------------------------

set -e  # Exit on any error

# Update system packages
echo "🔄 Updating system packages..."
sudo apt update -y && sudo apt upgrade -y

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

# Post-installation instructions
cat <<EOF

✅ AvalancheGo installation complete.
--------------------------------------

🔧 The node is now running in the background as a systemd service.

🟢 To check the service status:
  sudo systemctl status avalanchego
  (Press 'q' to exit)

📄 Config paths:
  - Node config:     /home/ubuntu/.avalanchego/configs/node.json
  - C-Chain config:  /home/ubuntu/.avalanchego/configs/chains/C/config.json
  - Plugins:         /home/ubuntu/.avalanchego/plugins

📡 To follow real-time logs (Ctrl+C to stop):
  sudo journalctl -u avalanchego -f

EOF

echo "🔎 Fetching your NodeID..."

# Extract only the NodeID value from the log
NODE_ID_RAW=$(sudo journalctl -u avalanchego | grep -m 1 '"nodeID":' | sed 's/.*"nodeID": "\([^"]*\)".*/\1/')

if [[ -n "$NODE_ID_RAW" ]]; then
  echo ""
  echo "✅ Your NodeID is:"
  echo ""
  echo "    🆔  $NODE_ID_RAW"
  echo ""
  echo "💡 Save this NodeID — it's needed for staking or monitoring your node."
else
  echo "⚠️  Unable to extract NodeID from logs. Try manually with:"
  echo "    sudo journalctl -u avalanchego | grep 'nodeID'"
fi