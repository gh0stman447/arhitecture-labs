'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Browser-side RSA key generation via WebCrypto API
async function generateClientKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  )
  const pubKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey)
  const toPem = (buf: ArrayBuffer, type: string) => {
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
    return `-----BEGIN ${type}-----\n${b64.match(/.{1,64}/g)!.join('\n')}\n-----END ${type}-----`
  }
  return {
    publicKeyPem: toPem(pubKeyBuffer, 'PUBLIC KEY'),
    privateKey: keyPair.privateKey,
  }
}

async function signWithClientKey(message: string, privateKey: CryptoKey): Promise<string> {
  const encoded = new TextEncoder().encode(message)
  const signature = await window.crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, encoded)
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

async function verifyWithPublicKey(message: string, signatureB64: string, publicKeyPem: string): Promise<boolean> {
  const pemBody = publicKeyPem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')
  const keyBuffer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))
  const pubKey = await window.crypto.subtle.importKey(
    'spki', keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['verify']
  )
  const sigBuffer = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0))
  const encoded = new TextEncoder().encode(message)
  return window.crypto.subtle.verify('RSASSA-PKCS1-v1_5', pubKey, sigBuffer, encoded)
}

export default function SignaturePage() {
  const router = useRouter()

  // Scenario 1
  const [s1Message, setS1Message] = useState('Hello, this is a signed message from client!')
  const [s1Result, setS1Result] = useState<{ valid: boolean; message: string } | null>(null)
  const [s1Loading, setS1Loading] = useState(false)

  // Scenario 2
  const [s2Data, setS2Data] = useState<{ message: string; signature: string; publicKey: string; valid?: boolean } | null>(null)
  const [s2Loading, setS2Loading] = useState(false)

  async function runScenario1() {
    setS1Loading(true)
    setS1Result(null)
    try {
      const { publicKeyPem, privateKey } = await generateClientKeyPair()
      const signature = await signWithClientKey(s1Message, privateKey)

      const res = await fetch('/api/signature/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: s1Message, signature, publicKey: publicKeyPem }),
      })
      setS1Result(await res.json())
    } catch (e) {
      setS1Result({ valid: false, message: String(e) })
    }
    setS1Loading(false)
  }

  async function runScenario2() {
    setS2Loading(true)
    setS2Data(null)
    try {
      // Step 1: get server public key
      const pkRes = await fetch('/api/signature/public-key')
      const { publicKey } = await pkRes.json()

      // Step 2: get signed message from server
      const msgRes = await fetch('/api/signature/signed-message')
      const { message, signature } = await msgRes.json()

      // Step 3: verify locally in browser
      const valid = await verifyWithPublicKey(message, signature, publicKey)

      setS2Data({ message, signature, publicKey, valid })
    } catch (e) {
      console.error(e)
    }
    setS2Loading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-700 font-medium hover:text-gray-900">
            ← Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Digital Signature (ЭЦП)</h1>
        </div>

        {/* Scenario 1 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-1 text-gray-900">Scenario 1 — Client signs, server verifies</h2>
          <p className="text-sm text-gray-700 mb-4">
            Browser generates RSA key pair → signs message with private key → server verifies with public key
          </p>

          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            value={s1Message}
            onChange={e => setS1Message(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 mb-3"
          />

          <button
            onClick={runScenario1}
            disabled={s1Loading || !s1Message}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {s1Loading ? 'Signing & Verifying...' : 'Sign & Send to Server'}
          </button>

          {s1Result && (
            <div className={`mt-4 p-3 rounded text-sm ${s1Result.valid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <span className="font-medium">{s1Result.valid ? '✓ Valid' : '✗ Invalid'}</span> — {s1Result.message}
            </div>
          )}
        </div>

        {/* Scenario 2 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-1 text-gray-900">Scenario 2 — Server signs, client verifies</h2>
          <p className="text-sm text-gray-700 mb-4">
            Client gets server's public key → requests a signed message → verifies signature in browser
          </p>

          <button
            onClick={runScenario2}
            disabled={s2Loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {s2Loading ? 'Fetching & Verifying...' : 'Get Signed Message from Server'}
          </button>

          {s2Data && (
            <div className="mt-4 space-y-3">
              <div className={`p-3 rounded text-sm ${s2Data.valid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <span className="font-medium">{s2Data.valid ? '✓ Valid' : '✗ Invalid'}</span> — Signature verified in browser using server's public key
              </div>
              <div className="text-xs text-gray-700 space-y-1">
                <p><span className="font-medium">Message:</span> {s2Data.message}</p>
                <p className="break-all"><span className="font-medium">Signature:</span> {s2Data.signature.slice(0, 60)}...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
