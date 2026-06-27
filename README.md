# ELIÁ Consultoria — PWA de gestão

App mobile (PWA instalável) para gestão da consultoria: **Financeiro, Administrativo, Marketing e Assistente de IA**. Frontend em React + Vite + TypeScript; backend em Firebase (Auth, Firestore, Storage, Cloud Functions, Cloud Messaging). A camada de IA é **abstraída** — funciona com **Gemini (gratuito)** ou **Claude (pago)** trocando uma variável de ambiente.

> Status atual: **Setup base + módulo Financeiro completos e funcionais**. Administrativo, Marketing e Assistente IA estão como stubs navegáveis (próximos módulos). As Cloud Functions de todas as áreas já estão implementadas/prontas para deploy; integrações pagas (WhatsApp, Meta/Google Ads, Vision, Calendar) são stubs até as chaves serem configuradas.

---

## Stack

- **Frontend:** React 18, Vite 5, TypeScript, React Router 6, TanStack Query 5, `vite-plugin-pwa`.
- **Backend:** Firebase — Auth (e-mail/senha + Google), Firestore (cache offline persistente), Storage, Cloud Functions (Node 20), Cloud Messaging (push).
- **IA:** Gemini (Google AI Studio) ou Claude (Anthropic), via Cloud Functions.

## Estrutura

```
elia-app/
├── src/
│   ├── components/      # Layout, BottomNav, UI, ProtectedRoute
│   ├── pages/           # Login, Home, financeiro/*, Notificações, Configurações, Stub
│   ├── hooks/           # useAuth, useClients, useExpenses, useInvoices, useTaxes...
│   ├── lib/firebase/    # config, auth, firestore, functions, messaging
│   └── types/           # tipos de todas as coleções do Firestore
├── functions/           # Cloud Functions (IA + integrações)
├── public/              # manifest, ícones, firebase-messaging-sw.js
├── firebase.json, firestore.rules, storage.rules, firestore.indexes.json
└── vercel.json
```

---

## 1. Configuração local

```bash
npm install
cp .env.example .env      # preencha as chaves VITE_FIREBASE_*
npm run dev               # http://localhost:5173
```

### Variáveis do frontend (`.env`)
Pegue em **Firebase Console → Configurações do projeto → Seus apps (Web)**:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...   # Cloud Messaging → Web Push certificates
```

> O app abre mesmo sem `.env` (mostra aviso na tela de login). Para autenticar de verdade, preencha as chaves.

---

## 2. Firebase (uma vez)

1. Plano **Blaze** (necessário para Functions). Tem cota gratuita generosa.
2. **Authentication** → ative *E-mail/senha* e *Google*.
3. **Firestore** → criar banco em produção (região recomendada: `southamerica-east1`).
4. **Storage** → criar (mesma região).
5. **Cloud Messaging** → gerar *Web Push certificate* (VAPID).

### Deploy de regras, índices e Functions

```bash
npm install -g firebase-tools
firebase login
firebase use --add               # selecione seu projeto

# variáveis das Functions (IA e integrações) — não commitar
cp functions/.env.example functions/.env   # preencha GEMINI_API_KEY

firebase deploy --only firestore:rules,firestore:indexes,storage
firebase deploy --only functions
```

### Chave de IA (gratuita)
- Gemini: https://aistudio.google.com/app/apikey → coloque em `functions/.env` como `GEMINI_API_KEY` (com `AI_PROVIDER=gemini`).
- Para usar Claude depois: `AI_PROVIDER=claude` + `ANTHROPIC_API_KEY`.

---

## 3. Deploy do frontend na Vercel

1. Suba o repositório no GitHub.
2. Na Vercel: **New Project → Import** o repo. Framework detectado: **Vite**.
3. Em **Environment Variables**, adicione todas as `VITE_FIREBASE_*` (mesmos valores do `.env`).
4. Deploy. O `vercel.json` já trata o roteamento SPA e o header do service worker.
5. Após o deploy, adicione o domínio da Vercel em **Firebase → Authentication → Settings → Authorized domains**.

Instalar no celular: abra a URL no navegador → menu → **Adicionar à tela inicial**.

---

## Cloud Functions implementadas

| Função | Tipo | O que faz |
|---|---|---|
| `ocrExpense` | callable | Lê recibo (visão do Gemini ou Google Vision) → estrutura valor/data/categoria |
| `parseContract` | callable | Extrai datas/valor/obrigações de contrato |
| `generateInvoiceDraft` | callable | Gera descrição de serviço para NF |
| `estimateTaxes` | callable | Estima imposto do mês conforme regime |
| `calcLateTaxPenalty` | callable | Calcula multa/juros de imposto atrasado |
| `generatePost` | callable | Gera legenda + hashtags |
| `fetchRelevantNews` | agendada | Popula feed de notícias (NewsAPI) |
| `generateAdAnalysis` | agendada | Análise diária de ADS + recomendações |
| `generateEmailCopy` | callable | Gera assunto + corpo de e-mail |
| `sendWhatsAppConfirmation` | callable | Redige e envia confirmação (Z-API/Twilio) |
| `syncCalendar` | callable | Sincroniza com Google Calendar (OAuth) |
| `aiAssistant` | callable | Chat com **function calling** sobre o Firestore |
| `scheduleReminders` | agendada | Vencimentos → notificações + push |

Funções marcadas como *stub* retornam erro amigável `failed-precondition` até a integração ser configurada — o app trata isso e cai para fluxo manual.

---

## Segurança

- Regras do Firestore e Storage restringem cada documento/arquivo ao `ownerId`/uid.
- Chaves de IA e de terceiros ficam **apenas** nas Functions, nunca no client.
- `.env`, `functions/.env` e `serviceAccount.json` estão no `.gitignore`.

## Scripts

```bash
npm run dev       # dev server
npm run build     # type-check + build de produção (gera PWA)
npm run preview   # serve o build
node scripts/gen-icons.mjs   # regenera ícones do PWA
```
