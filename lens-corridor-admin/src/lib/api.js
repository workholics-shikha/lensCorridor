const configuredApiBaseUrl =
  import.meta?.env?.VITE_ADMIN_API_BASE_URL?.trim() || ''

const getDefaultApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://192.168.29.202:5000'
  }

  const protocol =
    import.meta?.env?.VITE_ADMIN_API_PROTOCOL?.trim() ||
    window.location.protocol
  const hostname = window.location.hostname || '192.168.29.202'
  const port = import.meta?.env?.VITE_ADMIN_API_PORT?.trim() || '5000'

  return `${protocol}//${hostname}:${port}`
}

const resolvedApiBaseUrl = configuredApiBaseUrl || getDefaultApiBaseUrl()

export const apiBaseUrl = resolvedApiBaseUrl.replace(/\/+$/, '')

export const buildApiUrl = (path = '') => {
  if (!path) {
    return apiBaseUrl
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${apiBaseUrl}${normalizedPath}`
}
