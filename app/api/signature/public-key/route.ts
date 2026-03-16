import { NextResponse } from 'next/server'
import { getServerKeyPair } from '@/lib/server-keys'

/**
 * @swagger
 * /api/signature/public-key:
 *   get:
 *     tags: [Signature]
 *     summary: "Сценарий 2: Получить публичный ключ сервера"
 *     description: Клиент запрашивает публичный ключ сервера для верификации подписанных сервером сообщений.
 *     responses:
 *       200:
 *         description: Публичный ключ сервера в формате PEM
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
