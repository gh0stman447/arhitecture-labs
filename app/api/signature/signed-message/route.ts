import { NextResponse } from 'next/server'
import { signMessage } from '@/lib/crypto'
import { getServerKeyPair } from '@/lib/server-keys'
import crypto from 'crypto'

/**
 * @swagger
 * /api/signature/signed-message:
 *   get:
 *     tags: [Signature]
 *     summary: "Сценарий 2: Получить случайное подписанное сообщение от сервера"
 *     description: Сервер генерирует случайное сообщение, подписывает его своим приватным ключом и возвращает оба значения. Клиент может верифицировать подпись публичным ключом сервера.
 *     responses:
 *       200:
 *         description: Подписанное сообщение от сервера
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
