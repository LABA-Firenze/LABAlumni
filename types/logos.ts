/** Tipi per le API LOGOS (gestionale LABA) */

export interface LogosApiError {
  code: string
  message: string
}

export interface LogosStudentPayload {
  oid: string
  nome: string
  cognome: string
  numMatricola: string
  emailPersonale?: string
  emailLABA?: string
  telefono?: string
  cellulare?: string
  dataNascita?: string
  indirizzo?: string
  cap?: string
  citta?: string
  provincia?: string
  nazione?: string
  codiceFiscale?: string
  [key: string]: unknown
}

export interface LogosStudentsResponse {
  success: boolean
  errors?: LogosApiError[]
  payload?: LogosStudentPayload
  totalCount?: number
  errorSummary?: string
}

/** Risposta da endpoint di login custom (es. POST /api/Auth/Login) */
export interface LogosAuthResponse {
  success?: boolean
  token?: string
  accessToken?: string
  access_token?: string
  errors?: LogosApiError[]
}

/** Risposta OAuth2 IdentityServer (connect/token, grant_type=password) */
export interface LogosOAuth2TokenResponse {
  access_token: string
  token_type?: string
  expires_in?: number
  error?: string
  error_description?: string
}

/** Payload GET /api/Enrollments (iscrizione, piano di studi, anno) */
export interface LogosEnrollmentPayload {
  pianoStudi?: string
  annoAttuale?: number
  stato?: string
  classeLaurea?: string
  [key: string]: unknown
}

export interface LogosEnrollmentsResponse {
  success: boolean
  errors?: LogosApiError[]
  payload?: LogosEnrollmentPayload
  errorSummary?: string
}
