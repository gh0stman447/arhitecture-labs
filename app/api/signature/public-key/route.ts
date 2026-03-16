import { NextResponse } from 'next/server'
import { getServerKeyPair } from '@/lib/server-keys'

/**
 * @swagger
 * /api/signature/public-key:
 *   get:
 *     tags: [Signature]
 *     summary: "Scenario 2: Get server's public key"
 *     description: Client requests the server's public key to verify server-signed messages.
 *     responses:
 *       200:
 *         description: Server's public key in PEM format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 publicKey:
 *                   type: string
 */
export async function GET() {
  const { publicKey } = getServerKeyPair()
  return NextResponse.json({ publicKey })
}
