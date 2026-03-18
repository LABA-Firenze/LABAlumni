import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

/**
 * Client Supabase per componenti browser.
 * Usa i cookie per la sessione (BrowserCookieAuthStorageAdapter) così il
 * middleware può leggere la sessione e non reindirizza a /accedi dopo il login.
 */
export const supabase = createClientComponentClient()
