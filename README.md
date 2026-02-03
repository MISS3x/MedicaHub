# Medica Hub

**Platform pro lékařskou administrativu na autopilot.**

> "Vy lečíte. My řešíme ten zbytek."

## 🌟 O projektu

Medica Hub je SaaS platforma postavená jako ekosystém nezávislých smart micro-apps sdílející jednotný Design System. Uživatelé mohou mít přístup k jedné aplikaci (např. VoiceLog) nebo ke všem.

**Produkční URL:** [www.medicahub.cz](https://www.medicahub.cz)

## 🏗️ Architektura

Projekt využívá **Modular Monolith** architekturu s Next.js App Router:

```
app/
├── (marketing)/      # Veřejný marketing web
├── (auth)/          # Autentizační flow
├── (platform)/      # Chráněné SaaS aplikace
│   ├── medlog/      # Správa medikace
│   ├── termolog/    # Sledování teplot
│   ├── eventlog/    # Správa událostí
│   ├── sterilog/    # Sterilizace
│   ├── dashboard/   # Hlavní dashboard
│   └── hub/        # Aplikační hub
└── api/            # API routes
```

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **UI Components:** Shadcn UI, Lucide React
- **Payments:** Stripe
- **AI:** Google Gemini API
- **Hosting:** Vercel

## 🚀 Vývoj

### Instalace
```bash
npm install
```

### Dev Server
```bash
npm run dev
```

Aplikace poběží na `http://localhost:3000`

### Build
```bash
npm run build
npm start
```

## 📁 Struktura projektu

- `/app` - Next.js App Router pages a layouts
- `/components` - Sdílené React komponenty
- `/utils` - Utility funkce (Supabase client, atd.)
- `/public` - Statické assety
- `/database` - SQL migrace a skripty

## 🔐 Environment Variables

Vytvořte `.env.local` soubor s:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
GEMINI_API_KEY=your_gemini_api_key
```

## 📝 Klíčové funkce

1. **AI VoiceLog** - Speech-to-text lékařské hlášení (Gemini)
2. **Provozní Autopilot** - Automatizovaná správa provozu
3. **Modulární systém** - "Plaťte jen za to, co používáte"
4. **Row Level Security** - Uživatelé vidí pouze svá data

## 🎨 Design Systém

Všechny styly jsou centralizované v `app/globals.css` s CSS Variables. Aplikace podporuje Light/Dark režim napříč všemi micro-apps.

## 📄 Licence

© 2026 FineMedica s.r.o.
