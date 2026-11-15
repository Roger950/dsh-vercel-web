export const PACKAGE_NAME = 'dsh-vercel-web'
export const NAMESPACE = 'vercel-web'
export const ROW_ID = 'vercel-web'
export const BASE_URL = 'https://ai-gateway.vercel.sh/v4/ai'
export const DEFAULTS = Object.freeze({
  apiKeyEnv: 'AI_GATEWAY_API_KEY',
  model: 'meta/muse-spark-open',
  maxResults: 3,
  timeoutMs: 60000,
  maxOutputTokens: 512,
  maxContentChars: 100000,
})
export const FIELDS = Object.keys(DEFAULTS)
export function readConfig(config = {}) {
  const result = { ...DEFAULTS }
  for (const key of FIELDS) {
    const field = config[key]
    const value = field && typeof field.get === 'function' ? field.get() : field
    if (value !== undefined) result[key] = value
  }
  return validateConfig(result)
}
export function validateConfig(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value.apiKeyEnv)) throw new Error('Invalid credential reference')
  if (typeof value.model !== 'string' || !/^[\w.-]+\/[\w./:-]+$/.test(value.model)) throw new Error('Use a creator/model identifier')
  for (const [key, min, max] of [
    ['maxResults', 1, 50], ['timeoutMs', 1000, 120000],
    ['maxOutputTokens', 1, 2048], ['maxContentChars', 1000, 500000],
  ]) {
    if (!Number.isInteger(value[key]) || value[key] < min || value[key] > max) throw new Error(`Invalid ${key}: expected ${min}–${max}`)
  }
  return value
}
