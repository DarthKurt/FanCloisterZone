import { v4 as uuidv4 } from 'uuid'

export function randomId () {
  return uuidv4().replaceAll('-', '')
}

export function randomLong () {
  // Return a signed 64-bit BigInt generated with Web Crypto when available.
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint8Array(8)
    window.crypto.getRandomValues(arr)
    let n = 0n
    for (let i = 0; i < 8; i++) {
      n = (n << 8n) + BigInt(arr[i])
    }
    // convert unsigned to signed
    if (n & (1n << 63n)) n = n - (1n << 64n)
    return n
  }

  // Fallback to Math.random if crypto not available (less secure)
  const hi = BigInt(Math.floor(Math.random() * 0x100000000))
  const lo = BigInt(Math.floor(Math.random() * 0x100000000))
  let n = (hi << 32n) + lo
  if (n & (1n << 63n)) n = n - (1n << 64n)
  return n
}

export function randomInt (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min)
}
