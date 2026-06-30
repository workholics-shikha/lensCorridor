const configuredApiBaseUrl =
  import.meta?.env?.VITE_ADMIN_API_BASE_URL?.trim() || ''

const getDefaultApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location
    const isLocalHost =
      hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname === '::1'
      || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)

    if (isLocalHost && /^https?:$/.test(protocol)) {
      return `${protocol}//${hostname}:10000`
    }
  }

  return 'https://lenscorridor-api.onrender.com'
}

const resolvedApiBaseUrl =
  configuredApiBaseUrl || getDefaultApiBaseUrl()

export const apiBaseUrl = resolvedApiBaseUrl.replace(/\/+$/, '')

export const buildApiUrl = (path = '') => {
  if (!path) {
    return apiBaseUrl
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${apiBaseUrl}${normalizedPath}`
}
