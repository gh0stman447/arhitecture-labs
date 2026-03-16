import { NextRequest, NextResponse } from 'next/server'
import { verifySignature } from '@/lib/crypto'

/**
 * @swagger
 * /api/signature/verify:
 *   post:
 *     tags: [Signature]
 *     summary: "Сценарий 1: Сервер верифицирует подпись клиента"
 *     description: Клиент подписывает сообщение своим приватным ключом и отправляет сообщение, подпись и публичный ключ. Сервер проверяет подлинность.
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
 *                 description: Подпись в формате Base64
 *               publicKey:
 *                 type: string
 *                 description: Публичный RSA ключ в формате PEM
 *     responses:
 *       200:
 *         description: Результат верификации
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
 *         description: Отсутствуют обязательные поля
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
