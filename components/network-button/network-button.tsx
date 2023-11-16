import { Button } from "nextra/components";

const NETWORK_PARAMS = {
  13337: {
    chainId: "0x3419",
    chainName: "Beam Testnet",
    nativeCurrency: {
      name: "Beam,",
      symbol: "$Beam",
      decimals: 18,
    },
    rpcUrls: ["https://subnets.avax.network/beam/testnet/rpc"],
    blockExplorerUrls: ["https://subnets-test.avax.network/beam"],
  },
  4337: {
    chainId: "0x10f1",
    chainName: "Beam",
    nativeCurrency: {
      name: "Beam",
      symbol: "$Beam",
      decimals: 18,
    },
    rpcUrls: ["https://subnets.avax.network/beam/mainnet/rpc"],
    blockExplorerUrls: ["https://subnets.avax.network/beam"],
  },
};

function NetworkButton({ chainId, label }) {
  async function handleClick() {
    // @ts-ignore
    const ethereum = window.ethereum;

    if (ethereum && chainId && NETWORK_PARAMS[chainId]) {
      try {
        // switch network
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [
            {
              chainId: NETWORK_PARAMS[chainId].chainId,
            },
          ],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          // add network
          try {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [NETWORK_PARAMS[chainId]],
            });
          } catch (addError) {
            console.error("Error adding wallet network", addError);
          }
        } else {
          console.error("Error switching wallet network", switchError);
        }
      }
    } else {
      console.error("No injected wallet provider detected");
    }
  }

  return (
    <Button onClick={handleClick}>
      {label || `Add ${NETWORK_PARAMS[chainId]?.chainName} to MetaMask`}
    </Button>
  );
}

export default NetworkButton;
