# Nastavenie Google prihlásenia (gIVEMEGAME.IO)

Google login používa **Supabase Auth** s OAuth 2.0. Ak prihlásenie nefunguje, skontrolujte:

## 1. Supabase Dashboard

1. Otvorte [Supabase Dashboard](https://supabase.com/dashboard) → váš projekt
2. **Authentication** → **Providers** → **Google** — zapnite a vložte **Client ID** a **Client Secret** z Google Cloud
3. **Authentication** → **URL Configuration**:
   - **Site URL**: `http://localhost:3000` (dev) alebo vaša produkčná URL
   - **Redirect URLs**: pridajte `http://localhost:3000/login.html` (a produkčnú URL ak máte)

## 2. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. Vytvorte **OAuth 2.0 Client ID** (Web application)
3. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https:// vášadoména` (produkcia)
4. **Authorized redirect URIs**:
   - `https://vhpkkbixshfyytohkruv.supabase.co/auth/v1/callback`
   - (URL vášho Supabase projektu + `/auth/v1/callback`)

## 3. Spustenie

```bash
npm start
```

Otvor: `http://localhost:3000` → presmeruje na login → **Sign in with Google**

## Riešenie problémov

- **Chyba pri redirecte**: Skontrolujte, či je `http://localhost:3000/login.html` v Redirect URLs v Supabase
- **Chyba pri autorizácii**: Skontrolujte, či je `https://...supabase.co/auth/v1/callback` v Google Cloud redirect URIs
- **Session sa nestaví**: Otvorte DevTools (F12) → Console a zistite, či sa objavujú chyby
