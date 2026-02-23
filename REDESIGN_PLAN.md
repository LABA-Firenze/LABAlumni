# LABAlumni - Piano di Redesign Completo
## Trasformazione in Social Network per Studenti LABA

### 🎯 Obiettivo
Trasformare LABAlumni da semplice piattaforma job placement a **social network completo** per studenti LABA, con funzionalità moderne, UX ricca e grafica all'avanguardia.

---

## 📋 Funzionalità Principali

### 1. **Feed Social/Timeline (Dashboard Principale)**
- **Feed principale** con post/stati di:
  - Aziende (annunci, progetti, contenuti)
  - Studenti (portfolio, lavori, progetti)
  - Eventi e notizie della community
- **Like, commenti, condivisioni**
- **Filtri**: Tutti / Solo Aziende / Solo Studenti / Solo Eventi
- **Infinite scroll** con caricamento progressivo
- **Storie/Hi-light** in cima al feed (opzionale, stile Instagram)

### 2. **Profilo Studente Completo**
- **Bio e foto profilo/copertina**
- **Portfolio interattivo**:
  - Caricamento progetti con immagini/gallery
  - Video embed (YouTube, Vimeo)
  - Link a portfolio esterni (Behance, Dribbble, etc.)
- **Lavori pubblicati**: progetti completati
- **Skills e competenze** (tag)
- **Connessioni**: lista studenti collegati
- **Statistiche**: visualizzazioni profilo, lavori più visti

### 3. **Network & Connessioni**
- **Cerca studenti** per nome, corso, skills
- **Connettiti** con altri studenti
- **Lista connessioni**: vedi la rete di ogni studente
- **Suggerimenti di connessioni** basati su:
  - Stesso corso/anno
  - Skills simili
  - Connessioni comuni

### 4. **Portfolio & Lavori**
- **Pubblica lavori/progetti**:
  - Titolo, descrizione
  - Immagini multiple (gallery)
  - Video
  - Categoria (grafica, foto, video, design, etc.)
  - Tag/Skills
  - Anno di realizzazione
- **Galleria portfolio** sul profilo
- **Like e commenti** sui lavori
- **Condivisione** sul feed

### 5. **Proposte Tesi ai Relatori**
- **Sezione dedicata** "Proposte Tesi"
- Studente può:
  - Pubblicare proposta di tesi
  - Descrivere argomento, obiettivi, metodologia
  - Allegare documenti/bozze
- Relatori possono:
  - Vedere proposte degli studenti
  - Contattare studenti interessati
  - Pubblicare disponibilità come relatore

### 6. **Annunci Lavoro Migliorati**
- **Card più ricche** con immagini, badge, preview
- **Filtri avanzati**: tipo, corso, location, remote
- **Salva annunci** preferiti
- **Notifiche** per nuovi annunci nei tuoi filtri
- **Candidatura rapida** con CV pre-salvato

### 7. **Aziende - Profilo & Post**
- **Profilo azienda completo**
- **Pubblica post/stati**:
  - Annunci di lavoro
  - Progetti completati
  - Eventi e workshop
  - Contenuti educativi
- **Timeline azienda** visibile a tutti
- **Segui aziende** per vedere i loro post nel feed

---

## 🎨 Design System & UX

### Layout Principale
```
┌─────────────────────────────────────────┐
│           NAVBAR (sticky)               │
├──────────┬──────────────────┬───────────┤
│          │                  │           │
│ SIDEBAR  │   FEED/CONTENT   │  WIDGET   │
│ (left)   │   (center)       │  (right)  │
│          │                  │           │
│ - Logo   │  - Feed post     │ - Suggeriti│
│ - Nav    │  - Timeline      │ - Eventi  │
│ - Stats  │  - Annunci       │ - Annunci │
│          │                  │   popolari│
└──────────┴──────────────────┴───────────┘
```

### Componenti UI Moderni
- **Card interattive** con hover effects
- **Modal** per dettagli e azioni rapide
- **Toast notifications** per feedback
- **Skeleton loaders** durante caricamento
- **Micro-animazioni** per transizioni fluide
- **Dark mode toggle** (opzionale)
- **Responsive design** mobile-first

### Palette Colori
- Mantenere palette blu attuale ma con:
  - **Gradient** più pronunciati
  - **Shadow** e depth per cards
  - **Accent colors** per azioni/CTA

---

## 📊 Database Schema (Nuove Tabelle)

### `posts` (Feed Social)
```sql
- id, user_id, type (text/image/video/job), content
- images (array), video_url, job_post_id (nullable)
- likes_count, comments_count, shares_count
- created_at, updated_at
```

### `post_likes`
```sql
- id, post_id, user_id, created_at
```

### `post_comments`
```sql
- id, post_id, user_id, content
- created_at, updated_at
```

### `student_connections` (Network)
```sql
- id, student1_id, student2_id, status (pending/accepted)
- created_at
```

### `portfolio_items`
```sql
- id, student_id, title, description
- images (array), video_url, category, tags (array)
- year, created_at
```

### `thesis_proposals`
```sql
- id, student_id, title, description, objectives
- methodology, documents (array), status
- created_at, updated_at
```

### `company_follows`
```sql
- id, student_id, company_id, created_at
```

---

## 🚀 Implementazione - Fasi

### **Fase 1: Fix & Foundation** (1-2 giorni)
- ✅ Fix logo navbar redirect
- Fix layout generale
- Migliorare Navbar (più moderna)
- Preparare nuovo schema database

### **Fase 2: Dashboard Feed** (2-3 giorni)
- Creare feed principale con post
- Implementare post aziende
- Aggiungere like/commenti base
- Infinite scroll

### **Fase 3: Profilo Studente** (2-3 giorni)
- Redesign completo profilo
- Portfolio gallery
- Pubblicazione lavori
- Stats e metriche

### **Fase 4: Network & Social** (2-3 giorni)
- Sistema connessioni studenti
- Cerca studenti
- Suggerimenti connessioni
- Lista network

### **Fase 5: Tesi & Features Extra** (2-3 giorni)
- Proposte tesi
- Annunci migliorati
- Notifiche
- Features finali

---

## 💡 Inspiration
- **LinkedIn** per network e professionale
- **Instagram** per feed e visual
- **Behance** per portfolio
- **Facebook** per social features
- **Pinterest** per gallerie

---

## ✅ Priorità Implementazione

**HIGH:**
1. Feed dashboard con post aziende
2. Profilo studente completo con portfolio
3. Sistema connessioni base
4. Pubblicazione lavori/portfolio

**MEDIUM:**
5. Like/commenti avanzati
6. Proposte tesi
7. Cerca studenti avanzato
8. Notifiche

**LOW:**
9. Storie/highlights
10. Dark mode
11. Analytics avanzati
12. Features premium


