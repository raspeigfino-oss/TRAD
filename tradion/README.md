# TRADION — Plateforme d'Investissement Fintech

TRADION est une application web complète de type fintech/trading avec espace utilisateur, panel administrateur, système de parrainage, gestion de cycles d'investissement, codes signaux Telegram et bien plus.

---

## Stack technique

- **Next.js 14** (App Router)
- **TypeScript strict**
- **Tailwind CSS**
- **Prisma ORM**
- **PostgreSQL**
- **JWT** (cookie HttpOnly)
- **Recharts** (graphiques)
- **Lucide React** (icônes)

---

## Installation

### 1. Prérequis

- Node.js >= 18
- PostgreSQL en local (ou via Docker)
- npm ou pnpm

### 2. Cloner et installer

```bash
git clone <repo-url>
cd tradion
npm install
```

### 3. Configuration `.env`

Copier le fichier d'exemple :

```bash
cp .env.example .env
```

Remplir `.env` :

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/tradion"
JWT_SECRET="changez-cette-valeur-en-production-avec-une-chaine-aleatoire-longue"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="TRADION"

# Telegram (optionnel)
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
TELEGRAM_AUTO_SEND="false"
```

### 4. Créer la base de données

```bash
createdb tradion
```

Ou via Docker :

```bash
docker run --name tradion-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=tradion -p 5432:5432 -d postgres
```

### 5. Migrations Prisma

```bash
npm run db:generate   # Génère le client Prisma
npm run db:push       # Applique le schéma sans migration (dev rapide)
# OU
npm run db:migrate    # Crée une migration nommée
```

### 6. Seed (données de test)

```bash
npm run db:seed
```

### 7. Lancer le projet

```bash
npm run dev
```

Accès : [http://localhost:3000](http://localhost:3000)

---

## Comptes de test

| Rôle  | Email                  | Mot de passe |
|-------|------------------------|-------------|
| Admin | admin@tradion.app      | admin123!   |
| User  | alice@example.com      | user123!    |
| User  | bob@example.com        | user123!    |
| User  | carol@example.com      | user123!    |

---

## Pages disponibles

### Utilisateur
| Route              | Description                         |
|--------------------|-------------------------------------|
| `/login`           | Connexion                           |
| `/register`        | Inscription (avec code de parrain)  |
| `/dashboard`       | Tableau de bord principal           |
| `/profile`         | Profil & code de parrainage         |
| `/deposits`        | Dépôts USDT                         |
| `/withdrawals`     | Demandes de retrait                 |
| `/team`            | Équipe de parrainage                |
| `/rewards`         | Récompenses en attente              |
| `/history`         | Historique complet                  |

### Admin
| Route                  | Description                      |
|------------------------|----------------------------------|
| `/admin/login`         | Connexion admin                  |
| `/admin/dashboard`     | Vue d'ensemble                   |
| `/admin/users`         | Liste des utilisateurs           |
| `/admin/users/[id]`    | Détail utilisateur               |
| `/admin/withdrawals`   | Gestion des retraits             |
| `/admin/signals`       | Codes signal                     |
| `/admin/rewards`       | Attribution de récompenses       |
| `/admin/stats`         | Statistiques globales            |

---

## API Routes

### Auth
- `POST /api/auth/register` — Inscription
- `POST /api/auth/login` — Connexion
- `POST /api/auth/logout` — Déconnexion

### User
- `GET /api/user/me` — Profil utilisateur
- `GET /api/user/dashboard` — Données dashboard
- `GET /api/user/team` — Équipe de parrainage
- `GET /api/user/history` — Historique
- `GET /api/user/rewards` — Récompenses
- `POST /api/user/claim-rewards` — Réclamer les gains

### Signaux
- `POST /api/signals` — Utiliser un code signal

### Dépôts
- `GET /api/deposits` — Lister
- `POST /api/deposits` — Créer

### Retraits
- `GET /api/withdrawals` — Lister
- `POST /api/withdrawals` — Demander

### Admin
- `GET/POST /api/admin/users` — Utilisateurs
- `GET/PATCH/DELETE /api/admin/users/[id]` — Détail
- `GET/POST/PATCH /api/admin/signals` — Codes signal
- `GET/POST /api/admin/rewards` — Récompenses
- `GET/PATCH /api/admin/withdrawals` — Retraits
- `GET /api/admin/stats` — Statistiques

---

## Logique métier

### Codes Signal
- 1 signal = +0.56% du capital actuel
- 2 signaux = +1.12%
- 3 signaux = +1.68%
- 4 signaux = +2.24%

Un code ne peut être utilisé qu'une fois par utilisateur.

### Retraits anticipés
Si `capitalActuel < 2 × capitalInitial` :
- **25% de frais** appliqués automatiquement
- L'utilisateur doit confirmer explicitement

### Cycles d'investissement
- Durée : 40 jours
- Les gains de signaux s'appliquent au capital actuel du cycle actif
- Le système est conçu pour gérer plusieurs cycles dans le temps

---

## Intégration Telegram

Pour activer l'envoi automatique des codes signal sur Telegram :

1. Créer un bot via @BotFather
2. Obtenir le token et l'ID du groupe/canal
3. Renseigner dans `.env` :
   ```env
   TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
   TELEGRAM_CHAT_ID="-1001234567890"
   TELEGRAM_AUTO_SEND="true"
   ```
4. Lors de la création d'un signal dans le panel admin, cocher "Envoyer sur Telegram"

---

## Scripts disponibles

```bash
npm run dev          # Dev server
npm run build        # Build production
npm run start        # Start production
npm run db:generate  # Génère client Prisma
npm run db:push      # Push schema
npm run db:migrate   # Migrate
npm run db:seed      # Seed
npm run db:studio    # Prisma Studio UI
```

---

## Structure du projet

```
tradion/
├── prisma/
│   ├── schema.prisma        # Schéma base de données
│   └── seed.ts              # Données de test
├── src/
│   ├── app/
│   │   ├── (auth)/          # Pages login/register
│   │   ├── (user)/          # Pages espace utilisateur
│   │   ├── admin/           # Pages panel admin
│   │   └── api/             # Routes API
│   ├── components/
│   │   ├── ui/              # Composants UI réutilisables
│   │   └── layout/          # Layouts sidebar
│   ├── lib/
│   │   ├── auth.ts          # JWT, cookies
│   │   ├── prisma.ts        # Client Prisma
│   │   └── utils.ts         # Utilitaires
│   └── services/
│       ├── user.service.ts
│       ├── signal.service.ts
│       ├── reward.service.ts
│       ├── withdrawal.service.ts
│       └── telegram.service.ts
└── README.md
```

---

## Production

Pour la mise en production :
1. Utiliser une vraie DB PostgreSQL hébergée (PlanetScale, Neon, Supabase...)
2. Changer `JWT_SECRET` pour une chaîne longue et aléatoire
3. Configurer `NEXT_PUBLIC_APP_URL` avec votre domaine
4. Utiliser `npm run build && npm run start` ou déployer sur Vercel/Railway

---

*TRADION v1.0 — Généré avec Next.js 14, Prisma, TypeScript, Tailwind CSS*
