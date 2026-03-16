import { NextResponse } from 'next/server'
import { signMessage } from '@/lib/crypto'
import { getServerKeyPair } from '@/lib/server-keys'
import crypto from 'crypto'

/**
 * @swagger
 * /api/signature/signed-message:
 *   get:
 *     tags: [Signature]
 *     summary: "Scenario 2: Get a randomly signed message from server"
 *     description: Server generates a random message, signs it with its private key, and returns both. Client can verify using the server's public key.
 *     responses:
 *       200:
 *         description: Signed message from server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 signature:
 *                   type: string
 *                   description: Base64-encoded signature
 */
export async function GET() {
  const { privateKey } = getServerKeyPair()
  const message = `Server authenticated message [${crypto.randomUUID()}] at ${new Date().toISOString()}`
  const signature = signMessage(message, privateKey)
  return NextResponse.json({ message, signature })
}
