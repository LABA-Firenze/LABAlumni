'use client'

import { Card } from '@/components/ui/Card'
import { FileText, Video, BookOpen, MessageCircle } from 'lucide-react'
import Link from 'next/link'

const RESOURCES = [
  {
    title: 'Come candidarsi efficacemente',
    description: 'Consigli per scrivere una candidatura che attira l\'attenzione dell\'azienda.',
    icon: FileText,
    items: [
      'Personalizza il messaggio per ogni annuncio',
      'Evidenzia esperienze rilevanti',
      'Sii conciso ma completo',
      'Controlla errori di battitura',
    ],
  },
  {
    title: 'Template CV',
    description: 'Struttura base per un curriculum creativo.',
    icon: BookOpen,
    items: [
      'Dati personali e contatti',
      'Formazione e corso di studi',
      'Competenze tecniche e trasversali',
      'Esperienze (lavoro, progetti, tirocini)',
      'Portfolio e link',
    ],
  },
  {
    title: 'Consigli per il colloquio',
    description: 'Come prepararti e presentarti al meglio.',
    icon: MessageCircle,
    items: [
      'Informati sull\'azienda prima del colloquio',
      'Prepara esempi concreti dei tuoi progetti',
      'Mostra il tuo portfolio',
      'Fai domande sull\'esperienza di tirocinio',
    ],
  },
]

const VIDEOS = [
  { title: 'Come candidarsi', url: '#', placeholder: 'Video in arrivo' },
  { title: 'Come usare i messaggi', url: '#', placeholder: 'Video in arrivo' },
  { title: 'Come costruire il portfolio', url: '#', placeholder: 'Video in arrivo' },
]

export default function RisorsePage() {
  return (
    <div className="space-y-8">
      <Card variant="elevated" className="p-6 bg-gradient-to-br from-primary-50/60 to-white border-primary-100/60">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary-600" />
          Risorse utili
        </h1>
        <p className="text-gray-600 mt-2">
          Guide, template e consigli per trovare il tirocinio giusto e affrontare il mondo del lavoro
        </p>
      </Card>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Guide</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {RESOURCES.map((r) => (
            <Card key={r.title} variant="elevated" className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <r.icon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{r.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{r.description}</p>
                  <ul className="mt-4 space-y-2">
                    {r.items.map((item) => (
                      <li key={item} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-primary-500">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Video className="w-5 h-5" />
          Videotutorial
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VIDEOS.map((v) => (
            <Card key={v.title} variant="elevated" className="p-6">
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                {v.placeholder}
              </div>
              <p className="font-medium mt-3">{v.title}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
