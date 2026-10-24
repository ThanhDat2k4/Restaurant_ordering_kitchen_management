const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000')
  .replace(/\/+$/, '')

export async function getHealth(signal) {
  const response = await fetch(`${apiBaseUrl}/api/health`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
  })

  if (!response.ok) {
    throw new Error(`API returned HTTP ${response.status}`)
  }

  const data = await response.json()

  if (data.success !== true || typeof data.message !== 'string') {
    throw new Error('Invalid health response')
  }

  return data
}
