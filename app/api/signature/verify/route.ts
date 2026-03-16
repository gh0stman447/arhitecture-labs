import { NextRequest, NextResponse } from 'next/server'
import { verifySignature } from '@/lib/crypto'

/**
 * @swagger
 * /api/signature/verify:
 *   post:
 *     tags: [Signature]
 *     summary: "Scenario 1: Server verifies client's signature"
 *     description: Client signs a message with their private key and sends the message, signature, and public key. Server verifies authenticity.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message, signature, publicKey]
 *             properties:
 *               message:
 *                 type: string
 *               signature:
 *                 type: string
 *                 description: Base64-encoded signature
 *               publicKey:
 *                 type: string
 *                 description: PEM-encoded RSA public key
 *     responses:
 *       200:
 *         description: Verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing required fields
 */
export async function POST(req: NextRequest) {
  const { message, signature, publicKey } = await req.json()

  if (!message || !signature || !publicKey) {
    return NextResponse.json({ error: 'message, signature and publicKey are required' }, { status: 400 })
  }

  const valid = verifySignature(message, signature, publicKey)

  return NextResponse.json({
    valid,
    message: valid ? 'Signature is valid. Message authenticity confirmed.' : 'Signature is invalid. Message may be tampered.',
  })
}
