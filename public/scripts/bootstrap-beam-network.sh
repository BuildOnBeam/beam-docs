#!/bin/bash

# Exit on any error
set -e

echo "Starting subnet-evm installation on Ubuntu..."

# Install required dependencies
echo "Installing dependencies..."
sudo apt-get update
sudo apt-get install -y wget tar jq

# Create and setup subnetevm directory
mkdir subnetevm
cd subnetevm

# Download and extract subnet-evm
wget https://github.com/ava-labs/subnet-evm/releases/download/v0.7.2/subnet-evm_0.7.2_linux_amd64.tar.gz
tar -xvzf subnet-evm_0.7.2_linux_amd64.tar.gz
cp subnet-evm ~/.avalanchego/plugins/kLPs8zGsTVZ28DhP1VefPCFbCgS7o5bDNez8JUxPVw9E6Ubbz

# Ensure config directory exists
mkdir -p ~/.avalanchego/configs
NODE_CONFIG=~/.avalanchego/configs/node.json

# Create or modify node.json
if [ ! -f "$NODE_CONFIG" ]; then
    echo '{
    "track-subnets": "eYwmVU67LmSfZb1RwqCMhBYkFyG8ftxn6jAwqzFmxC9STBWLC",
    "partial-sync-primary-network": true
}' > "$NODE_CONFIG"
else
    jq '. + {"track-subnets": "eYwmVU67LmSfZb1RwqCMhBYkFyG8ftxn6jAwqzFmxC9STBWLC", "partial-sync-primary-network": true}' "$NODE_CONFIG" > tmp.json
    mv tmp.json "$NODE_CONFIG"
fi

# Create chain config directory and download upgrade.json
mkdir -p ~/.avalanchego/configs/chains/2tmrrBo1Lgt1mzzvPSFt73kkQKFas5d1AP88tv9cicwoFp8BSn
cd ~/.avalanchego/configs/chains/2tmrrBo1Lgt1mzzvPSFt73kkQKFas5d1AP88tv9cicwoFp8BSn
wget https://raw.githubusercontent.com/BuildOnBeam/beam-subnet/main/subnets/beam-mainnet/upgrade.json

# Restart avalanchego service
echo "Restarting avalanchego service..."
sudo systemctl restart avalanchego

echo "Installation and configuration completed successfully!"
