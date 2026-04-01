# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- **Dev server:** `bun dev`
- **Build:** `bun run build`
- **Lint:** `bun run lint`
- **Prisma generate:** `bunx prisma generate`
- **Prisma migrate:** `bunx prisma migrate dev`

No test framework is configured.

## Architecture

Hair salon queue/booking system built with Next.js 16, tRPC v11, Prisma 7 (PostgreSQL via `@prisma/adapter-pg`), and Tailwind CSS v4.

### API Layer (tRPC)

- **Server setup:** `src/server/trpc.ts` — defines context, `publicProcedure`, `protectedProcedure`, `adminProcedure` (role-gated middleware)
- **Router composition:** `src/server/routers/app.ts` — merges sub-routers: `auth`, `booking`, `slot`, `admin`, `waitlist`, `guest`
- **HTTP handler:** `src/app/api/trpc/[trpc]/route.ts` — fetch adapter, endpoint at `/api/trpc`
- **Client hook:** `src/lib/trpc.ts` — `createTRPCReact<AppRouter>()` with superjson transformer
- Validation uses Zod v4; shared validators in `src/lib/validators.ts`

### Auth

- JWT (HS256 via `jose`) stored in `auth-token` httpOnly cookie (`src/lib/jwt.ts`)
- Route protection via middleware in `src/proxy.ts` — public routes: `/`, `/login`, `/register`, `/cancel`; admin routes require `ADMIN` role
- tRPC-level auth via `protectedProcedure` / `adminProcedure`

### Database

- Prisma schema: `prisma/schema.prisma`
- Generated client output: `src/generated/prisma/`
- Singleton client: `src/lib/prisma.ts`
- Key models: `User`, `TimeSlot`, `Booking`, `Waitlist`, `GuestBooking`, `ShopHoliday`
- Enums: `Role` (USER/ADMIN), `BookingStatus` (PENDING/CONFIRMED/IN_PROGRESS/COMPLETED/CANCELLED)

### Frontend Pages

- Public: `/` (landing), `/login`, `/register`, `/cancel` (guest cancellation via token)
- Authenticated: `/book` (slot selection), `/my-bookings`
- Admin: `/admin` (dashboard), `/admin/bookings`, `/admin/slots`, `/admin/users`, `/admin/analytics`, `/admin/settings`
- Shared components in `src/app/components/`

### Supporting Services

- Email: `src/lib/email.ts` (nodemailer), templates in `src/lib/email-templates.ts`
- Waitlist notifications: `src/lib/waitlist-notify.ts`
- Cron endpoint: `src/app/api/cron/reminders/route.ts`

### Path Alias

`@/*` maps to `./src/*`
