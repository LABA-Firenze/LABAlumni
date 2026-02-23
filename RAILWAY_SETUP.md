# Setup Railway per LABAlumni

## Variabili d'ambiente necessarie

Nel dashboard Railway, configura queste variabili d'ambiente:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deploy su Railway

### Metodo 1: Dashboard Web (Consigliato)
1. Vai su https://railway.app
2. Clicca su "New Project"
3. Seleziona "Deploy from GitHub repo"
4. Connetti il repository: `SAzzinelli/LABAlumni`
5. Railway rileverà automaticamente Next.js
6. Aggiungi le variabili d'ambiente nella sezione "Variables"
7. Il deploy partirà automaticamente

### Metodo 2: Railway CLI
```bash
# Login
railway login

# Inizializza progetto
railway init

# Collega a progetto esistente o creane uno nuovo
railway link

# Aggiungi variabili d'ambiente
railway variables set NEXT_PUBLIC_SUPABASE_URL=your_url
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# Deploy
railway up
```

## Note

- Railway rileverà automaticamente Next.js dal `package.json`
- Il build command è: `npm run build`
- Il start command è: `npm start`
- Railway usa la porta definita nella variabile `PORT` (default: 3000)


