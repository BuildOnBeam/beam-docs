# 🚀 Beam Subnet-EVM Node Setup

This guide walks you through setting up an AvalancheGo node and configuring it to track the **Beam L1 Subnet** using Beam's **Subnet-EVM**.

Tested on: **Ubuntu 22.04 / 24.04 LTS**

---

## 📁 Contents

- [1. Overview](#1-overview)
- [2. Prerequisites](#2-prerequisites)
- [3. Step-by-Step Installation](#3-step-by-step-installation)
  - [3.1 Install AvalancheGo](#31-install-avalanchego)
  - [3.2 Install Beam Subnet-EVM](#32-install-beam-subnet-evm)
  - [3.3 Configure the Node](#33-configure-the-node)
  - [3.4 Apply Beam Network Upgrades](#34-apply-beam-network-upgrades)
  - [3.5 Restart Node and Verify](#35-restart-node-and-verify)
- [4. Node Monitoring](#4-node-monitoring)
- [5. Notes](#5-notes)

---

## 1. Overview

This repo provides two automated Bash scripts to:

1. Install the [AvalancheGo](https://github.com/ava-labs/avalanchego) validator node.
2. Configure the node to track the [Beam Subnet](https://buildonbeam.com/) and apply its upgrade rules.

---

## 2. Prerequisites

- A clean Ubuntu 22.04 or 24.04 server (cloud or on-prem)
- Root or sudo access
- An open port (default `9651`) and optionally exposing it publicly

---

## 3. Step-by-Step Installation

---

### 3.1 Install AvalancheGo

Run the following script to install AvalancheGo:

```bash
bash 1-install_avalanchego.sh
```

This script will:

- Prompt you to choose connection type, public IP, and RPC exposure
- Allow you to enable **State Sync** for faster sync times
- Install AvalancheGo as a systemd service
- Show your NodeID at the end

Example prompts:
- IP auto-detection and override
- Private vs. public RPC
- State sync: enabled or full archive

After install, the node will be running in the background.

---

### 3.2 Install Beam Subnet-EVM

Run the Beam Subnet-EVM setup script:

```bash
bash 2-install_beam_network.sh
```

This script will:

- Install required packages: `wget`, `tar`, `jq`
- Download and install Subnet-EVM v0.7.3
- Place it into the AvalancheGo plugin directory with the proper VMID
- Print success confirmation and paths

---

#### 3.2.1 Configure the Node

The script will also update your AvalancheGo config at:

```bash
~/.avalanchego/configs/node.json
```

It adds:

```json
{
  "track-subnets": "eYwmVU67LmSfZb1RwqCMhBYkFyG8ftxn6jAwqzFmxC9STBWLC",
  "partial-sync-primary-network": true
}
```

This ensures your node tracks only the Beam subnet and performs a partial sync to save resources.

---

#### 3.2.2 Apply Beam Network Upgrades

The script will create the following chain config directory:

```bash
~/.avalanchego/configs/chains/2tmrrBo1Lgt1mzzvPSFt73kkQKFas5d1AP88tv9cicwoFp8BSn/
```

And download the Beam subnet upgrade file:

```bash
upgrade.json
```

This contains necessary configuration rules for proper syncing and upgrades.

---

#### 3.2.3 Restart Node and Verify

The script will restart the AvalancheGo node and display its status:

```bash
sudo systemctl restart avalanchego
sudo systemctl status avalanchego
```

It will also extract your **NodeID** from the logs:

```bash
🔎 Your NodeID is: NodeID-XXXX...
```

This ID is essential for staking and network registration.

---

## 4. Node Monitoring

Follow logs in real time:

```bash
sudo journalctl -u avalanchego -f
```

Or just to check status:

```bash
sudo systemctl status avalanchego
```

---

## 5. Notes

- Always use the latest [Subnet-EVM release](https://github.com/ava-labs/subnet-evm/releases) compatible with Beam.
- VMID and BlockchainID are predefined and specific to Beam:
  - **VMID**: `kLPs8zGsTVZ28DhP1VefPCFbCgS7o5bDNez8JUxPVw9E6Ubbz`
  - **BlockchainID**: `2tmrrBo1Lgt1mzzvPSFt73kkQKFas5d1AP88tv9cicwoFp8BSn`
- If you modify the config path or structure, make sure to update the scripts accordingly.

---

## ✅ Done!

You're now ready to operate a Beam L1 node and contribute to its decentralized infrastructure.

Happy validating 🚀
