import { generateKeyPair } from './crypto'

// Server key pair — generated once on server start
let serverKeyPair: { publicKey: string; privateKey: string } | null = null

export function getServerKeyPair() {
  if (!serverKeyPair) {
    serverKeyPair = generateKeyPair()
  }
  return serverKeyPair
}
