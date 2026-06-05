const configuredApiBaseUrl =
  import.meta?.env?.VITE_ADMIN_API_BASE_URL?.trim() || ''

const getDefaultApiBaseUrl = () => {
  // Production fallback
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