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

/** Risposta attesa da un eventuale endpoint di login LOGOS (es. POST /api/Auth/Login) */
export interface LogosAuthResponse {
  success?: boolean
  token?: string
  accessToken?: string
  errors?: LogosApiError[]
}
