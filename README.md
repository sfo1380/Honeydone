# Honeydone

A shared household app for couples: chores, shopping, kids' activities and budget. A household is always exactly two partners.

Web app first (Next.js 16 + Postgres, hosted on Render); a mobile app comes later and will reuse the same server.

## Status

| Area | Status |
| --- | --- |
| Accounts, two-partner household, invite link, settings | Done |
| Chores | Done |
| Reward tracker | Next |
| Shopping | Done |
| Kids' activities | Done |
| Budget | Planned |

## Run it locally

You need Node 22 and a Postgres database.

```bash
cp .env.example .env          # point DATABASE_URL at your Postgres
npm install
npx prisma migrate dev        # create the tables
npm run dev                   # http://localhost:3000
```

## Checks

```bash
npm run lint
npm run typecheck
npm test                      # unit tests
TEST_DATABASE_URL=postgresql://postgres@localhost:5432/honeydone_test npm test   # + database tests
```

CI runs all of these, plus a production build, on every pull request.

## Deploy on Render

`render.yaml` is a Render Blueprint that creates the web service and a Postgres database on the free plans.

1. In Render, choose **New → Blueprint** and pick this repository.
2. Render reads `render.yaml`, creates `honeydone` and `honeydone-db`, and deploys `main`.
3. Every merge to `main` redeploys. Database migrations run on start.

Free plan limits: the web service sleeps after about 15 minutes idle (the next visit takes up to a minute), and the free database expires after 30 days. Move both to a paid plan before real use.

## Code map

- `prisma/schema.prisma`: data model (Household, User, Session, Kid, Chore, ChoreTask)
- `src/lib/repeat.ts`, `src/lib/dates.ts`: repeat rules and calendar-date helpers (pure, unit tested)
- `src/lib/chores.ts`: creating, completing, undoing and projecting chores
- `src/lib/shopping.ts`, `src/lib/shopping-catalog.ts`: shopping lists, aisle guessing and frequent items
- `src/lib/activities.ts`, `src/lib/season.ts`: kids' activities, weekly schedules laid over the season, drivers
- `src/lib/`: database client, sessions, household rules, validation
- `src/app/actions/`: server actions for sign-in and household changes
- `src/app/(auth)`, `src/app/(app)`: signed-out and signed-in pages
- `src/proxy.ts`: sends signed-out visitors to sign in
