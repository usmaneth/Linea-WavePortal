import { createConfig, configureChains } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { InjectedConnector } from 'wagmi/connectors/injected'

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
    public: { http: ['https://linea-sepolia.infura.io/v3/5c571f64067d4a169439de0dac0ad467'] },
    default: { http: ['https://linea-sepolia.infura.io/v3/5c571f64067d4a169439de0dac0ad467'] },
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