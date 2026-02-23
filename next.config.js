/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/login', destination: '/accedi', permanent: true },
      { source: '/register', destination: '/registrati', permanent: true },
      { source: '/register/company', destination: '/registrazione/azienda', permanent: true },
      { source: '/profile', destination: '/profilo', permanent: true },
      { source: '/dashboard', destination: '/pannello', permanent: true },
      { source: '/dashboard/student', destination: '/pannello/studente', permanent: true },
      { source: '/dashboard/company', destination: '/pannello/azienda', permanent: true },
      { source: '/portfolio/new', destination: '/portfolio/nuovo', permanent: true },
      { source: '/portfolio/:id/edit', destination: '/portfolio/:id/modifica', permanent: true },
      { source: '/jobs', destination: '/annunci', permanent: true },
      { source: '/jobs/manage', destination: '/annunci/gestisci', permanent: true },
      { source: '/jobs/:id', destination: '/annunci/:id', permanent: true },
      { source: '/community', destination: '/bacheca', permanent: true },
      { source: '/messages', destination: '/messaggi', permanent: true },
      { source: '/network', destination: '/rete', permanent: true },
      { source: '/thesis', destination: '/tesi', permanent: true },
      { source: '/thesis/new', destination: '/tesi/nuova', permanent: true },
      { source: '/thesis/:id', destination: '/tesi/:id', permanent: true },
      { source: '/applications', destination: '/candidature', permanent: true },
      { source: '/applications/manage', destination: '/candidature/gestisci', permanent: true },
      { source: '/post/company/new', destination: '/post/azienda/nuovo', permanent: true },
      { source: '/requests/new', destination: '/richieste/nuova', permanent: true },
    ]
  },
}

module.exports = nextConfig



