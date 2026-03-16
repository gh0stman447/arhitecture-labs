import crypto from 'crypto'

export function generateKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })
}

export function signMessage(message: string, privateKeyPem: string): string {
  const sign = crypto.createSign('SHA256')
  sign.update(message)
  sign.end()
  return sign.sign(privateKeyPem, 'base64')
}

export function verifySignature(message: string, signature: string, publicKeyPem: string): boolean {
  try {
    const verify = crypto.createVerify('SHA256')
    verify.update(message)
    verify.end()
    return verify.verify(publicKeyPem, signature, 'base64')
  } catch {
    return false
  }
}
