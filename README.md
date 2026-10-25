# 🥑 Caloria

**Caloria** is a gamified nutrition and virtual pet companion web application built with **Next.js 16**, **TypeScript**, **Tailwind CSS v4**, **Drizzle ORM**, and **Supabase (PostgreSQL)**.

Track meals, achieve macro targets, level up and evolve your virtual pet, customize cosmetics in the Plaza wardrobe, and maintain streaks with friends through social co-op groups!

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Styling**: Tailwind CSS v4, Lucide Icons, Framer Motion
- **Database & ORM**: PostgreSQL via Supabase, Drizzle ORM (`drizzle-orm/pg-core`)
- **State Management**: Zustand (with local persistence)
- **Authentication**: Supabase Auth (`@supabase/ssr`)
- **Type Checking**: TypeScript 5 (Strict Mode)

---

## 🚀 Getting Started for Developers

Follow these steps to set up the project locally.

### 1. Prerequisites

Make sure you have installed:
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `npm` (or `pnpm` / `bun`)
- A **Supabase** account/project (or local PostgreSQL instance)

---

### 2. Clone the Repository

```bash
git clone https://github.com/radishguyy/Caloria.git
cd Caloria
```

---

### 3. Install Dependencies

```bash
npm install
```

---

### 4. Configure Environment Variables

Create a `.env.local` file by copying the sample template:

```bash
cp .env.example .env.local
```

Fill in your configuration in `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database Connection (Supabase Transaction Pooler URL or Direct PostgreSQL)
# Recommended for Supabase pooler (Port 6543):
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require

# App URL & Cron Secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=caloria_cron_secret_key_change_in_production
```

---

### 5. Database Setup (Drizzle ORM + Supabase)

Caloria defines 16 modular schema tables under `src/db/schema/` (User Profiles, Virtual Pets & Plaza, Foods & Diary, Social Co-op, Gamification & Badges).

Generate migration files:
```bash
npm run db:generate
```

Push schema updates directly to your database:
```bash
npm run db:push
```

Or apply generated migrations:
```bash
npm run db:migrate
```

To inspect and manage database tables via Drizzle Studio GUI:
```bash
npm run db:studio
```

---

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Architecture

```
caloria/
├── drizzle/                 # Generated SQL migrations
├── public/                  # Static assets & custom typography (Secuela font)
├── src/
│   ├── app/                 # Next.js App Router (pages & layouts)
│   │   ├── (auth)/          # Authentication routes (login, register)
│   │   ├── diary/           # Food diary & meal log workflows
│   │   ├── onboarding/      # Goal, TDEE, and user onboarding steps
│   │   ├── pet/             # Virtual pet hub, stats, and evolution
│   │   ├── plaza/           # Wardrobe & cosmetic store
│   │   ├── social/          # Social hub, Co-op streak parties, and friends
│   │   ├── globals.css      # Design tokens, themes, and CSS variables
│   │   └── layout.tsx       # Root layout with navbar & bottom navigation
│   ├── components/          # Reusable UI components & feature widgets
│   ├── db/
│   │   ├── index.ts         # Drizzle connection & client pooling
│   │   └── schema/          # Modular Drizzle PostgreSQL schema definitions
│   │       ├── enums.ts     # PostgreSQL enums + auth.users linkage
│   │       ├── profiles.ts  # User profile & weight logs
│   │       ├── pets-plaza.ts# Pet avatar & Plaza wardrobe items
│   │       ├── nutrition.ts # Foods, food diary logs & daily summaries
│   │       ├── social.ts    # Friendships, co-op parties, and pokes
│   │       ├── gamification.ts # Badges, web push, and notifications
│   │       ├── relations.ts # Table relations definitions
│   │       └── index.ts     # Schema barrel export & inferred types
│   ├── lib/                 # Pure utilities, calculations, and Supabase client
│   ├── store/               # Zustand stores (diary, pet, weight, social, plaza)
│   └── types/               # TypeScript interfaces and inferred database types
└── drizzle.config.ts        # Drizzle Kit configuration
```

---

## 📜 Available Scripts

| Script | Command | Description |
|---|---|---|
| **dev** | `npm run dev` | Runs the Next.js development server with Turbopack |
| **build** | `npm run build` | Builds the app for production |
| **start** | `npm run start` | Starts the production server |
| **lint** | `npm run lint` | Runs Next.js ESLint checks |
| **db:generate** | `npm run db:generate` | Generates SQL migration files from Drizzle schema |
| **db:push** | `npm run db:push` | Pushes the schema directly to your PostgreSQL database |
| **db:migrate** | `npm run db:migrate` | Runs pending database migrations |
| **db:studio** | `npm run db:studio` | Opens local Drizzle Studio database browser |

---

## 🌿 Git Branch Workflow

1. Always branch off `dev` for feature work (`git checkout -b feature/your-feature dev`).
2. Test builds & types before committing (`npx tsc --noEmit && npm run build`).
3. Merge back into `dev` after review.

---

## 🎨 Design System

Design references live alongside the app:

- `Grand Design - Caloria (Gamified Nutrition & Virtual Pet Web App).md` — main design document.
- `caloria-design-system-agent-files/` — design tokens (`design-tokens.css`, `design-tokens.json`) and implementation rules for agents (`AGENTS.md`).
- `public/wireframes/` — HTML wireframes for per-page layout reference.

Caloria tokens are already wired into `src/app/globals.css` (colors, typography, spacing, radius, shadows) and mapped to shadcn semantic variables.

## 🔤 Fonts

Both brand fonts are self-hosted in `public/fonts/` and loaded with `@font-face` in `src/app/globals.css`:

| Font | Role | Files |
|---|---|---|
| Open Runde | Body, UI, caption | `public/fonts/openrunde/` |
| Secuela | Headings (H1/H2) | `public/fonts/secuela/` |

Use the existing CSS variables `--font-body` (Open Runde) and `--font-heading` (Secuela). No external font requests are required.

Secuela is licensed under the SIL Open Font License 1.1; see `public/fonts/secuela/FONTLOG.txt`.
