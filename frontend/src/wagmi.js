import { createConfig, configureChains } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { InjectedConnector } from 'wagmi/connectors/injected'

// Uses the public Linea Sepolia RPC endpoint by default. Set
// REACT_APP_LINEA_SEPOLIA_RPC_URL in a local .env file (see .env.example)
// to use your own Infura project ID instead.
const lineaSepoliaRpcUrl =
  process.env.REACT_APP_LINEA_SEPOLIA_RPC_URL || 'https://rpc.sepolia.linea.build'

const lineaSepolia = {
  id: 59141,
  name: 'Linea Sepolia',
  network: 'linea-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Linea Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: [lineaSepoliaRpcUrl] },
    default: { http: [lineaSepoliaRpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://sepolia.lineascan.build/' },
  },
  testnet: true,
}

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [lineaSepolia],
  [publicProvider()]
)

export const config = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({ 
      chains,
      options: {
        name: 'Linea Sepolia',
        shimDisconnect: true,
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
})

export { lineaSepolia }