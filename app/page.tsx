import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Briefcase, Users, MessageSquare, Newspaper, Palette, Camera, Film, Brush, PenTool, Sparkles, GraduationCap, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const motivationalQuotes = [
  {
    text: "L'arte non è ciò che vedi, ma ciò che fai vedere agli altri",
    icon: Palette,
  },
  {
    text: "Cattura l'istante, crea l'eternità",
    icon: Camera,
  },
  {
    text: "Racconta storie che il mondo non ha ancora visto",
    icon: Film,
  },
  {
    text: "Trasforma le tue idee in opere che ispirano",
    icon: Brush,
  },
  {
    text: "Il design è dove la scienza e l'arte raggiungono l'equilibrio",
    icon: PenTool,
  },
  {
    text: "La creatività è l'intelligenza che si diverte",
    icon: Sparkles,
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100/90">
      <Navbar />
      
      {/* Hero Section with Animated Background */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 py-32">
        {/* Animated background pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }}></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Branding and scrolling quotes */}
            <div className="text-white">
              <div className="flex items-center gap-3 mb-6 animate-fade-in">
                <GraduationCap className="w-12 h-12" />
                <div>
                  <h1 className="text-4xl font-bold">LABA Firenze</h1>
                  <p className="text-white/90">Libera Accademia di Belle Arti</p>
                </div>
              </div>
              
              <h2 className="text-5xl font-bold mb-6 animate-slide-up">
                Benvenuto su <span className="text-blue-200">LABAlumni</span>
              </h2>
              
              <p className="text-xl text-white/90 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                La piattaforma dove studenti e aziende si incontrano. 
                Crea la tua rete, trova opportunità, costruisci il tuo futuro.
              </p>

              {/* Scrolling quotes section */}
              <div className="relative h-32 mb-8 overflow-hidden">
                <div className="absolute inset-0 flex items-center">
                  <div className="flex animate-scroll-horizontal whitespace-nowrap">
                    {[...motivationalQuotes, ...motivationalQuotes].map((quote, index) => {
                      const Icon = quote.icon
                      return (
                        <div key={index} className="flex items-center gap-4 mx-8 flex-shrink-0">
                          <Icon className="w-8 h-8 text-blue-200" />
                          <p className="text-lg font-medium">{quote.text}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <Link href="/registrati">
                  <Button variant="secondary" size="lg" className="bg-white text-primary-600 hover:bg-white/90 hover:scale-105 transition-transform flex items-center">
                    <span>Inizia Gratis</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/accedi">
                  <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white/10">
                    Accedi
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right side - Floating icons */}
            <div className="relative h-96 hidden lg:block">
              <div className="absolute top-0 left-0 w-20 h-20 animate-float">
                <Palette className="w-20 h-20 text-white" />
              </div>
              <div className="absolute top-20 right-0 w-16 h-16 animate-float" style={{ animationDelay: '1s' }}>
                <Camera className="w-16 h-16 text-white" />
              </div>
              <div className="absolute bottom-20 left-1/4 w-24 h-24 animate-float" style={{ animationDelay: '2s' }}>
                <Film className="w-24 h-24 text-white" />
              </div>
              <div className="absolute bottom-0 right-1/4 w-18 h-18 animate-float" style={{ animationDelay: '3s' }}>
                <Brush className="w-18 h-18 text-white" />
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 animate-float" style={{ animationDelay: '0.5s' }}>
                <GraduationCap className="w-32 h-32 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-100/80 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Cosa puoi fare
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="elevated" className="hover:shadow-lg transition-shadow">
              <Briefcase className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Trova Opportunità</h3>
              <p className="text-gray-600">
                Annunci di lavoro e tirocini mirati per il tuo corso
              </p>
            </Card>
            
            <Card variant="elevated" className="hover:shadow-lg transition-shadow">
              <Users className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Connetterti</h3>
              <p className="text-gray-600">
                Conosci aziende del settore creativo e altri studenti
              </p>
            </Card>
            
            <Card variant="elevated" className="hover:shadow-lg transition-shadow">
              <MessageSquare className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Messaggistica</h3>
              <p className="text-gray-600">
                Comunica direttamente con chi ti interessa
              </p>
            </Card>
            
            <Card variant="elevated" className="hover:shadow-lg transition-shadow">
              <Newspaper className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Bacheca</h3>
              <p className="text-gray-600">
                Resta aggiornato con news e articoli del settore
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works - Simplified */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Semplice e diretto</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Registrati</h3>
              <p className="text-gray-600">
                Crea il tuo profilo in pochi passi
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Esplora</h3>
              <p className="text-gray-600">
                Trova annunci e connettiti con le aziende
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Inizia</h3>
              <p className="text-gray-600">
                Candidati e costruisci la tua carriera
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto a iniziare?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Unisciti alla community oggi
          </p>
          <Link href="/registrati">
            <Button variant="secondary" size="lg">Registrati Gratis</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">LABAlumni</p>
            <p className="text-gray-400">Piattaforma di job placement per LABA Firenze</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
