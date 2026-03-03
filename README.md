# CrewOS — Painting Crew Management

A focused MVP web app for owner-operators of residential painting companies. Manage employees and jobs, generate intelligent weekly schedules with explainable rationale, log job outcomes, and watch the system learn your crew's strengths over time.

---

## Features

- **Dashboard** — Weekly KPIs, upcoming jobs, team synergy summary, one-click plan generation
- **Schedule** — Week grid view with job cards, crew assignments, and "Why this plan?" explainer panels
- **Jobs** — Full job list, add job form, job detail with outcome history and status progression
- **Employees** — Employee cards with skill bars, detailed profiles with pair synergy charts, AI-like narrative summaries
- **Outcomes** — Log actual hours per employee, issues, and notes; triggers the learning loop automatically
- **Insights** — Top performers ranking, best crew pairs, overrun risk watch list, per-job-type breakdown

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | SQLite via Prisma ORM |
| Styling | Tailwind CSS |
| Runtime | Node.js 18+ |

---

## Getting Started

### 1. Install dependencies

```bash
cd CrewOS
npm install
```

### 2. Initialize and seed the database

```bash
npm run setup
```

This runs `prisma db push` (creates `prisma/dev.db`) and seeds it with:
- **8 employees** with realistic skill profiles and availability
- **10 jobs** across all job types (interior, exterior, cabinet, trim, full house)
- **6 past job outcomes** with actual hours logged
- **10 pair synergy records** seeded from past work history
- **1 sample plan** for the current week

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will land on the Dashboard.

---

## Folder Structure

```
CrewOS/
├── prisma/
│   ├── schema.prisma          # Data models
│   └── seed.ts                # Demo data seed script
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout + Nav
│   │   ├── globals.css        # Tailwind base + component classes
│   │   ├── dashboard/         # /dashboard — KPIs + generate plan
│   │   ├── schedule/          # /schedule — week view + rationale
│   │   ├── jobs/              # /jobs, /jobs/new, /jobs/[id]
│   │   ├── employees/         # /employees, /employees/new, /employees/[id]
│   │   ├── outcomes/          # /outcomes — log form + recent list
│   │   └── insights/          # /insights — analytics
│   ├── components/
│   │   ├── Nav.tsx            # Sticky top navigation
│   │   ├── KPICard.tsx        # Dashboard metric cards
│   │   ├── SkillBar.tsx       # Horizontal skill progress bar
│   │   ├── JobTypeBadge.tsx   # Color-coded job type pill
│   │   └── StatusBadge.tsx    # Job status pill
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── planEngine.ts      # Deterministic crew assignment heuristic
│   │   └── learningEngine.ts  # Post-outcome learning + summaries
│   └── types/
│       └── index.ts           # Shared TypeScript types
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## Plan Generation (Heuristic Engine)

The engine in `src/lib/planEngine.ts` runs entirely locally — no LLM or external API.

**Scoring factors per employee-job pair:**
1. **Skill match** — `skillsJson[jobType]` (0–1)
2. **Speed factor** — `skillsJson.speedFactor` multiplier (updated by learning)
3. **ZIP distance penalty** — numeric difference of ZIP codes, capped at 0.15
4. **Load penalty** — employees already near 40h this week get -0.2
5. **Synergy bonus** — each existing PairSynergy record contributes +0.1 per 100% synergy

**Crew sizing:** S=2, M=3, L=4

**Hour estimates:** base (S=16, M=40, L=80) x job-type multiplier (exterior=1.2, fullHouse=1.3, cabinet=0.8, trim=0.75)

Each plan item includes a plain-English **rationale string** explaining the top-scoring factors.

---

## Learning Loop

When an outcome is submitted (`src/lib/learningEngine.ts`):

1. **PairSynergy update** — For every pair on the job:
   - If crew finished 10%+ ahead: +0.05 synergy
   - If crew overran 20%+: -0.03 synergy
   - Otherwise: +0.01

2. **Speed factor nudge** — For each employee:
   - New speed = `old * 0.95 + personalEfficiency * 0.05` (exponential moving average)

3. **Profile summary** — Generates a narrative string like:
   > "Marcus Webb excels at interior work (90% skill). Weaker on cabinet (60%). Overall pace: fast (speed factor 1.05x). Certified crew lead. Licensed painter."

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server on :3000 |
| `npm run build` | Production build |
| `npm run setup` | Push schema + seed demo data |
| `npm run db:push` | Apply schema changes to SQLite |
| `npm run db:seed` | Re-run the seed script |
| `npm run db:studio` | Open Prisma Studio GUI |
