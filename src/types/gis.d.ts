/** Google Identity Services (GIS) — OAuth2 token model */
declare namespace google.accounts.oauth2 {
  interface TokenResponse {
    access_token: string
    expires_in: number
    scope: string
    token_type: string
    error?: string
    error_description?: string
    error_uri?: string
  }

  interface TokenClientConfig {
    client_id: string
    scope: string
    callback: (response: TokenResponse) => void
    error_callback?: (error: { type: string; message: string }) => void
    prompt?: string
  }

  interface TokenClient {
    requestAccessToken: (overrides?: { prompt?: string }) => void
  }

  function initTokenClient(config: TokenClientConfig): TokenClient
}
