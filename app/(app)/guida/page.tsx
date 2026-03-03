'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import {
  Search,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Briefcase,
  Users,
  MessageSquare,
  FileText,
  HelpCircle,
} from 'lucide-react'

interface FaqItem {
  id: string
  q: string
  a: string
  role?: 'student' | 'company' | 'docente'
}

const FAQ: FaqItem[] = [
  { id: '1', q: 'Come mi registro?', a: 'Clicca su Registrati e scegli il tipo di account: Studente, Docente o Azienda. Compila il modulo con i tuoi dati.', role: 'student' },
  { id: '2', q: 'Come completo il mio profilo?', a: 'Vai su Profilo dal menu. Aggiungi una foto, una breve bio e i link ai tuoi social (LinkedIn, sito, ecc.).', role: 'student' },
  { id: '3', q: 'Come aggiungo lavori al portfolio?', a: 'Dal menu laterale clicca su Aggiungi Lavoro. Carica immagini o video e descrivi il progetto.', role: 'student' },
  { id: '4', q: 'Come mi candido a un tirocinio?', a: 'Apri l\'annuncio che ti interessa e clicca su Candidati. Scrivi un messaggio di presentazione e invia.', role: 'student' },
  { id: '5', q: 'Come contatto le aziende?', a: 'Puoi inviare messaggi direttamente dalla pagina dell\'annuncio o dalla sezione Messaggi nel menu.', role: 'student' },
  { id: '6', q: 'Come funziona la Rete?', a: 'La Rete ti permette di connetterti con altri studenti, docenti e aziende LABA. Cerca il profilo e invia una richiesta di connessione.', role: 'student' },
  { id: '7', q: 'Come pubblico un annuncio di tirocinio?', a: 'Vai su Tirocini > Gestisci annunci > Nuovo annuncio. Compila titolo, descrizione, tipo e corsi interessati.', role: 'company' },
  { id: '8', q: 'Come gestisco le candidature?', a: 'Vai su Tirocini > Gestisci annunci oppure su Candidature dalla dashboard. Da lì puoi vedere, accettare o rifiutare le candidature.', role: 'company' },
  { id: '9', q: 'Come contatto uno studente?', a: 'Clicca su Messaggi nel menu, poi Nuovo messaggio e seleziona lo studente dalla lista.', role: 'company' },
  { id: '10', q: 'Come funziona la tesi di laurea?', a: 'Gli studenti pubblicano proposte di tesi e i docenti possono candidarsi come relatore o corelatore. Tutto si gestisce dalla sezione Tesi di laurea.', role: 'docente' },
  { id: '11', q: 'Posso modificare o eliminare un annuncio?', a: 'Sì. Vai su Tirocini > Gestisci annunci, apri l\'annuncio e usa Modifica o Elimina.', role: 'company' },
  { id: '12', q: 'Cosa significa "profilo completo"?', a: 'È una checklist che ti guida: nome, foto, bio, almeno un lavoro nel portfolio e almeno una connessione. Un profilo completo attira più attenzione dalle aziende.', role: 'student' },
]

export default function GuidaPage() {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const filtered = FAQ.filter(
    (item) =>
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <Card variant="elevated" className="p-6 bg-gradient-to-br from-primary-50/60 to-white border-primary-100/60">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-primary-600" />
          Guida e FAQ
        </h1>
        <p className="text-gray-600 mt-2">Domande frequenti e risposte per studenti, aziende e docenti</p>
      </Card>

      <Card variant="elevated" className="p-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cerca nelle FAQ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <div className="space-y-2">
        {filtered.map((item) => (
          <Card key={item.id} variant="elevated" className="overflow-hidden">
            <button
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-gray-50/50 transition-colors"
            >
              <span className="font-medium text-gray-900">{item.q}</span>
              {expanded.has(item.id) ? (
                <ChevronUp className="w-5 h-5 text-gray-500 shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
              )}
            </button>
            {expanded.has(item.id) && (
              <div className="px-4 pb-4 pt-0 text-gray-600 text-sm border-t border-gray-100 pt-4">
                {item.a}
              </div>
            )}
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card variant="elevated" className="p-12 text-center">
          <p className="text-gray-600">Nessun risultato per &quot;{search}&quot;</p>
        </Card>
      )}
    </div>
  )
}
