# SalonQ - วิเคราะห์โปรเจกต์แบบละเอียด

> เอกสารนี้อธิบายระบบจองคิวร้านทำผม (SalonQ) ทั้งหมด ตั้งแต่ภาพรวม โครงสร้าง ไปจนถึงรายละเอียดของทุกไฟล์

---

## สารบัญ

1. [ภาพรวมของระบบ (System Overview)](#1-ภาพรวมของระบบ-system-overview)
2. [วิเคราะห์โครงสร้างโฟลเดอร์](#2-วิเคราะห์โครงสร้างโฟลเดอร์)
3. [อธิบายทีละไฟล์](#3-อธิบายทีละไฟล์)
   - [3.1 ไฟล์ Config (Root)](#31-ไฟล์-config-root)
   - [3.2 Database Layer](#32-database-layer-prisma)
   - [3.3 Library / Utilities](#33-library--utilities-srclib)
   - [3.4 tRPC Server (Backend API)](#34-trpc-server-backend-api)
   - [3.5 Shared Components](#35-shared-components)
   - [3.6 Frontend Pages](#36-frontend-pages)
   - [3.7 Admin Pages](#37-admin-pages)
   - [3.8 API Routes](#38-api-routes)
4. [Flow การทำงานทั้งระบบ](#4-flow-การทำงานทั้งระบบ)
5. [จุดสำคัญ](#5-จุดสำคัญ)
6. [อธิบายแบบมือใหม่](#6-อธิบายแบบมือใหม่)

---

## 1. ภาพรวมของระบบ (System Overview)

### ระบบนี้ทำอะไร?

**SalonQ** เป็นระบบจองคิวร้านทำผมออนไลน์ ที่ช่วยให้:
- **ลูกค้า (User)** สามารถ สมัครสมาชิก → เลือกวัน → เลือกเวลา → จองคิว → ยกเลิก/เลื่อนนัด
- **ลูกค้าที่ไม่สมัครสมาชิก (Guest)** สามารถจองคิวได้โดยกรอกข้อมูลส่วนตัว และยกเลิกผ่านลิงก์ในอีเมล
- **แอดมิน (Admin)** จัดการทุกอย่าง: ดู Dashboard, จัดการ Booking, จัดการ Slot, จัดการ User, ดู Analytics, ตั้งวันหยุด

### เทคโนโลยีที่ใช้

| เทคโนโลยี | เวอร์ชัน | หน้าที่ |
|---|---|---|
| **Next.js** | 16.2.2 | Full-stack framework (frontend + API) |
| **React** | 19.2.4 | UI Library |
| **tRPC** | v11 | Type-safe API layer (แทน REST/GraphQL) |
| **Prisma** | 7 | ORM สำหรับจัดการ Database |
| **PostgreSQL** | 17 | ฐานข้อมูลหลัก |
| **Tailwind CSS** | v4 | CSS Framework |
| **Zod** | v4 | Validation schema |
| **jose** | v6 | JWT authentication |
| **bcryptjs** | v3 | Hash password |
| **nodemailer** | v8 | ส่งอีเมล |
| **Recharts** | v3 | กราฟ/Charts ในหน้า Analytics |
| **superjson** | v2 | Serialize Date, BigInt ฯลฯ ผ่าน JSON |
| **Bun** | - | JavaScript runtime + package manager |
| **Docker** | - | Containerization |

### โครงสร้างเป็นแบบไหน?

**Fullstack Monolith** โดยใช้ Next.js App Router:
- **Frontend**: React Components (Client Components) ทำงานบน browser
- **Backend API**: tRPC routers ทำงานบน server ผ่าน endpoint `/api/trpc`
- **Database**: Prisma ORM เชื่อมกับ PostgreSQL

```
ไม่ใช่ MVC แบบดั้งเดิม แต่เป็น:
- Frontend (React Pages + Components)
- API Layer (tRPC Routers)
- Data Layer (Prisma + PostgreSQL)
```

---

## 2. วิเคราะห์โครงสร้างโฟลเดอร์

```
next-app/
├── prisma/                     # Database schema
│   └── schema.prisma           # นิยามตาราง, enum, relation
│
├── src/
│   ├── app/                    # Next.js App Router (หน้าเว็บทั้งหมด)
│   │   ├── layout.tsx          # Layout หลัก (ครอบทุกหน้า)
│   │   ├── page.tsx            # หน้าแรก (Landing Page)
│   │   ├── globals.css         # CSS ทั้งระบบ (สี, animation, theme)
│   │   │
│   │   ├── login/page.tsx      # หน้า Login
│   │   ├── register/page.tsx   # หน้า Register
│   │   ├── book/page.tsx       # หน้าจอง (เลือกวัน/เวลา/ยืนยัน)
│   │   ├── my-bookings/page.tsx# หน้าดูการจองของตัวเอง
│   │   ├── cancel/page.tsx     # หน้ายกเลิก (สำหรับ Guest ผ่าน token)
│   │   │
│   │   ├── admin/              # หน้า Admin ทั้งหมด
│   │   │   ├── layout.tsx      # Layout admin (sidebar + content)
│   │   │   ├── page.tsx        # Dashboard
│   │   │   ├── bookings/       # จัดการ booking
│   │   │   ├── slots/          # จัดการ time slot
│   │   │   ├── users/          # จัดการผู้ใช้
│   │   │   ├── analytics/      # กราฟวิเคราะห์
│   │   │   └── settings/       # ตั้งวันหยุด
│   │   │
│   │   ├── components/         # Shared React Components
│   │   │   ├── Navbar.tsx      # แถบเมนูบนสุด
│   │   │   ├── Toast.tsx       # ระบบแจ้งเตือน
│   │   │   ├── DatePicker.tsx  # ตัวเลือกวันที่
│   │   │   ├── SlotGrid.tsx    # ตารางเลือกเวลา
│   │   │   ├── BookingCard.tsx # การ์ดแสดง booking
│   │   │   ├── BookingTable.tsx# ตาราง booking (admin)
│   │   │   ├── StatsCard.tsx   # การ์ดสถิติ
│   │   │   ├── RescheduleModal.tsx   # Modal เลื่อนนัด
│   │   │   └── ManualBookingModal.tsx # Modal จอง manual (admin)
│   │   │
│   │   └── api/                # API Routes
│   │       ├── trpc/[trpc]/route.ts  # tRPC HTTP handler
│   │       └── cron/reminders/route.ts # Cron ส่ง reminder
│   │
│   ├── server/                 # Backend logic (tRPC)
│   │   ├── trpc.ts             # ตั้งค่า tRPC (context, middleware)
│   │   └── routers/            # API endpoints แยกตามหมวด
│   │       ├── app.ts          # รวม router ทั้งหมด
│   │       ├── auth.ts         # login, register, logout, me
│   │       ├── booking.ts      # CRUD booking + reschedule
│   │       ├── slot.ts         # CRUD slot + block/unblock
│   │       ├── admin.ts        # admin functions (users, holidays, analytics)
│   │       ├── waitlist.ts     # ระบบรอคิว
│   │       └── guest.ts        # จอง/ยกเลิกแบบ guest
│   │
│   ├── lib/                    # Shared utilities
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── jwt.ts              # JWT sign/verify/cookie
│   │   ├── trpc.ts             # tRPC React client hook
│   │   ├── trpc-provider.tsx   # tRPC + React Query provider
│   │   ├── validators.ts       # Zod schemas ทั้งหมด
│   │   ├── email.ts            # ส่งอีเมลผ่าน nodemailer
│   │   ├── email-templates.ts  # Template อีเมล (HTML)
│   │   └── waitlist-notify.ts  # แจ้ง waitlist เมื่อมีคิวว่าง
│   │
│   ├── proxy.ts                # Middleware ป้องกัน route
│   │
│   └── generated/prisma/       # Prisma generated code (auto-gen)
│
├── Dockerfile                  # Multi-stage Docker build
├── docker-compose.yml          # Docker compose (app + postgres)
├── package.json                # Dependencies
├── next.config.ts              # Next.js config
├── tsconfig.json               # TypeScript config
└── eslint.config.mjs           # ESLint config
```

### สรุปหน้าที่แต่ละโฟลเดอร์

| โฟลเดอร์ | หน้าที่ |
|---|---|
| `prisma/` | นิยามโครงสร้าง database (ตาราง, relation, enum) |
| `src/app/` | ทุกหน้าเว็บ (Next.js App Router) — แต่ละ folder = 1 route |
| `src/app/components/` | UI components ที่ใช้ร่วมกันหลายหน้า |
| `src/app/api/` | HTTP API endpoints (tRPC handler + cron job) |
| `src/app/admin/` | หน้า admin panel ทั้งหมด |
| `src/server/` | Backend business logic (tRPC routers + middleware) |
| `src/lib/` | Utility functions ที่ใช้ร่วมกัน (DB, JWT, email, validation) |
| `src/generated/` | Code ที่ Prisma generate ให้อัตโนมัติ (ห้ามแก้ไขเอง) |

---

## 3. อธิบายทีละไฟล์

### 3.1 ไฟล์ Config (Root)

#### `package.json`
- **หน้าที่**: กำหนด dependencies ทั้งหมด และ scripts สำหรับรัน
- **Scripts สำคัญ**: `dev` (dev server), `build` (build production), `lint` (ตรวจโค้ด)
- **Dependencies หลัก**: Next.js, tRPC, Prisma, React, Tailwind, Zod, jose, nodemailer

#### `next.config.ts`
- **หน้าที่**: ตั้งค่า Next.js
- **สิ่งที่ทำ**: ตั้ง `output: "standalone"` เพื่อให้ build เป็น standalone server สำหรับ Docker

#### `Dockerfile`
- **หน้าที่**: Multi-stage Docker build สำหรับ production
- **4 stages**:
  1. `base` — ใช้ Bun Alpine image
  2. `deps` — ติดตั้ง dependencies
  3. `build` — Generate Prisma + Build Next.js
  4. `runner` — Production image (เล็ก, ปลอดภัย) — รัน migrate แล้วค่อย start server
- **จุดสำคัญ**: สร้าง user `nextjs` (non-root) เพื่อความปลอดภัย

#### `docker-compose.yml`
- **หน้าที่**: orchestrate 2 services:
  - `db` — PostgreSQL 17 Alpine + healthcheck
  - `app` — Next.js app ที่ build จาก Dockerfile
- **ทำงานร่วมกับ**: `Dockerfile`, `.env` variables
- **Environment variables**: DATABASE_URL, JWT_SECRET, EMAIL configs, CRON_SECRET

#### `globals.css`
- **หน้าที่**: CSS ทั้งระบบ
- **สิ่งที่ทำ**:
  - กำหนด **Design tokens** (ตัวแปรสี) ทั้ง Light mode + Dark mode
  - `@theme inline` — ลงทะเบียนสีกับ Tailwind v4
  - **Animations**: `fade-in`, `slide-up`, `shimmer`, `pulse-soft` + stagger classes
  - **Gradients**: `.gradient-primary`, `.gradient-hero`, `.gradient-accent`
  - **Glass effect**: `.glass` (backdrop-filter: blur)
  - **Custom scrollbar**: เปลี่ยนสี scrollbar ให้สวยขึ้น
- **จุดที่ดี**: รองรับ dark mode อัตโนมัติผ่าน `prefers-color-scheme`

---

### 3.2 Database Layer (Prisma)

#### `prisma/schema.prisma`
- **หน้าที่**: นิยามโครงสร้าง database ทั้งหมด (เปรียบเหมือนพิมพ์เขียวของ DB)
- **ทำงานร่วมกับ**: `src/lib/prisma.ts` (ใช้ client), ทุก router ใน `src/server/routers/`

**Enums (ค่าที่กำหนดตายตัว)**:
- `Role`: `USER` | `ADMIN` — กำหนดบทบาทของผู้ใช้
- `BookingStatus`: `PENDING` → `CONFIRMED` → `IN_PROGRESS` → `COMPLETED` | `CANCELLED`

**Models (ตาราง)**:

| Model | หน้าที่ | Fields สำคัญ |
|---|---|---|
| `User` | ข้อมูลผู้ใช้ | email (unique), password (hashed), role, deletedAt (soft delete) |
| `TimeSlot` | ช่วงเวลาที่จองได้ | date, startTime, endTime, isBlocked |
| `Booking` | การจองของสมาชิก | userId → User, slotId → TimeSlot, status, rescheduledAt |
| `Waitlist` | คิวรอ (เมื่อ slot เต็ม) | userId → User, slotId → TimeSlot, position, notified |
| `GuestBooking` | การจองของ guest | ข้อมูลส่วนตัว + cancelToken (unique, สำหรับยกเลิกผ่านลิงก์) |
| `ShopHoliday` | วันหยุดร้าน | date (unique), reason |

**Relations สำคัญ**:
```
User ──1:N──> Booking ──N:1──> TimeSlot
User ──1:N──> Waitlist ──N:1──> TimeSlot
TimeSlot ──1:N──> GuestBooking
Booking ──N:1──> TimeSlot (originalSlot — slot เดิมก่อนเลื่อนนัด)
```

**Unique Constraints**:
- `TimeSlot`: `@@unique([date, startTime])` — วันเดียวกัน เวลาซ้ำไม่ได้
- `Waitlist`: `@@unique([userId, slotId])` — user เดียวกัน รอ slot เดียวกันไม่ได้
- `GuestBooking.cancelToken`: unique

---

### 3.3 Library / Utilities (`src/lib/`)

#### `prisma.ts`
- **หน้าที่**: สร้าง Prisma Client แบบ Singleton
- **ทำงานร่วมกับ**: ทุก router ใน server, cron job
- **Flow**: สร้าง PrismaClient ด้วย `PrismaPg` adapter → เก็บใน `globalThis` เพื่อไม่ให้สร้างซ้ำตอน dev (Hot Reload)
- **ทำไมต้อง Singleton?**: ถ้าสร้าง client ใหม่ทุกครั้ง จะเปิด connection pool ซ้ำจนเต็ม

#### `jwt.ts`
- **หน้าที่**: จัดการ JWT (JSON Web Token) ทั้งระบบ — เป็น "กุญแจ" ของระบบ auth
- **ทำงานร่วมกับ**: `src/server/trpc.ts` (อ่าน token), `src/server/routers/auth.ts` (สร้าง/ลบ token), `src/proxy.ts` (ตรวจ token)

**Functions**:

| Function | หน้าที่ |
|---|---|
| `signToken(payload)` | สร้าง JWT จาก userId + email + role (หมดอายุ 7 วัน, HS256) |
| `verifyToken(token)` | ตรวจสอบ JWT ว่าถูกต้อง/หมดอายุไหม → return payload หรือ null |
| `setAuthCookie(token)` | เซ็ต cookie ชื่อ `auth-token` (httpOnly, secure ใน production, 7 วัน) |
| `removeAuthCookie()` | ลบ cookie `auth-token` |
| `getTokenFromCookieHeader(headers)` | ดึง token จาก raw Cookie header (ใช้ regex parse) |

**จุดสำคัญ**:
- `httpOnly: true` — JavaScript ใน browser อ่าน cookie ไม่ได้ → ป้องกัน XSS
- `sameSite: "lax"` — ป้องกัน CSRF พื้นฐาน
- `JWT_SECRET` มาจาก env → **ห้ามหลุด**

#### `trpc.ts`
- **หน้าที่**: สร้าง tRPC React client hook
- **ทำงานร่วมกับ**: `src/lib/trpc-provider.tsx`, ทุก frontend page ที่เรียก API
- **มีแค่บรรทัดเดียว**: `createTRPCReact<AppRouter>()` — สร้าง typed hook ที่รู้จักทุก API endpoint
- **ทำไมต้องแยกไฟล์?**: เพราะหลายไฟล์ import ไปใช้

#### `trpc-provider.tsx`
- **หน้าที่**: ตั้งค่า tRPC + React Query Provider (ครอบทั้ง app)
- **ทำงานร่วมกับ**: `src/app/layout.tsx` (ถูก import ไปใช้), `src/lib/trpc.ts`
- **สิ่งที่ทำ**:
  1. สร้าง `QueryClient` — ตั้ง `staleTime: 30s` (cache 30 วินาที), รองรับ dehydration
  2. สร้าง `trpcClient` — ใช้ `httpBatchLink` ส่ง request ไปที่ `/api/trpc` + ใช้ `superjson` แปลง data
- **จุดที่ดี**: ใช้ `useState` สร้าง client เพื่อไม่ให้ re-create ทุก render

#### `validators.ts`
- **หน้าที่**: รวม Zod schemas ทั้งหมดสำหรับ validate input (ใช้ทั้ง frontend + backend)
- **ทำงานร่วมกับ**: ทุก router ใน `src/server/routers/` (ใช้เป็น `.input()`)

**Schemas ทั้งหมด**:

| Schema | ใช้ที่ | Validate อะไร |
|---|---|---|
| `registerSchema` | auth.register, admin.createUser | email, password (min 8), firstName, lastName, phone (Thai format 0XXXXXXXXX) |
| `loginSchema` | auth.login | email, password |
| `createBookingSchema` | booking.create | slotId (int), note (max 500, optional) |
| `cancelBookingSchema` | booking.cancel | bookingId |
| `updateBookingStatusSchema` | booking.updateStatus | bookingId, status (enum 5 ค่า) |
| `rescheduleBookingSchema` | booking.reschedule | bookingId, newSlotId |
| `getAvailableSlotsSchema` | slot.getAvailable | date (YYYY-MM-DD) |
| `blockSlotSchema` | slot.blockSlot | slotId, reason (optional) |
| `createSlotSchema` | slot.create | date, startTime (HH:MM), endTime (HH:MM) |
| `updateSlotSchema` | slot.update | slotId, startTime/endTime/isBlocked/blockedReason (optional) |
| `deleteSlotSchema` | slot.delete | slotId |
| `joinWaitlistSchema` | waitlist.join, waitlist.getMyPosition | slotId |
| `leaveWaitlistSchema` | waitlist.leave | slotId |
| `getWaitlistBySlotSchema` | waitlist.getBySlot | slotId |
| `createGuestBookingSchema` | guest.create | firstName, lastName, email, phone, slotId, note |
| `cancelGuestBookingSchema` | guest.cancelByToken | cancelToken |
| `createManualBookingSchema` | admin.createManualBooking | userId/guestInfo, slotId, note |
| `getAllUsersSchema` | admin.getUsers | search, role, page, limit |
| `updateUserSchema` | admin.updateUser | userId, fields (optional) |
| `deleteUserSchema` | admin.deleteUser | userId |
| `addHolidaySchema` | admin.addHoliday | date, reason (optional) |
| `removeHolidaySchema` | admin.removeHoliday | date |
| `getHolidaysSchema` | admin.getHolidays | year (2024-2030) |
| `getAnalyticsSchema` | admin.getAnalytics | startDate, endDate |
| `getAllBookingsSchema` | booking.getAll | status, date, page, limit |

**จุดที่ดี**: Phone validation ใช้ regex สำหรับเบอร์ไทย `/^0\d{9}$/`

#### `email.ts`
- **หน้าที่**: ส่งอีเมลผ่าน Nodemailer
- **ทำงานร่วมกับ**: `email-templates.ts` (template), ทุก router ที่มี sendEmail
- **Logic**:
  1. ตรวจว่ามี `EMAIL_HOST` + `EMAIL_USER` หรือไม่ → ถ้าไม่มี ก็แค่ log แล้ว skip
  2. สร้าง transporter จาก env (host, port, user, pass)
  3. ส่งอีเมลจาก `"SalonQ" <email>` → catch error แล้ว log (ไม่ throw เพราะเป็น fire-and-forget)
- **จุดที่ดี**: Graceful degradation — ถ้าไม่ตั้ง email config ระบบยังทำงานได้ แค่ไม่ส่งเมล

#### `email-templates.ts`
- **หน้าที่**: สร้าง HTML email templates (ภาษาไทย)
- **ทำงานร่วมกับ**: `email.ts` (sendEmail), routers ต่างๆ

**Templates ทั้งหมด**:

| Function | ใช้เมื่อ | เนื้อหา |
|---|---|---|
| `bookingConfirmation()` | จองสำเร็จ (member) | "การจองของคุณได้รับแล้ว" + รายละเอียดวัน/เวลา |
| `bookingStatusChanged()` | สถานะเปลี่ยน | "สถานะเปลี่ยนเป็น: ..." + ปุ่มจองใหม่ถ้าถูกยกเลิก |
| `bookingReminder()` | Cron reminder | "เตือนว่าคุณมีนัดพรุ่งนี้" |
| `guestBookingConfirmation()` | จองสำเร็จ (guest) | เหมือน member + ปุ่มยกเลิก + ลิงก์สมัครสมาชิก |
| `waitlistNotification()` | slot ว่างแล้ว | "คิวที่คุณรอมีว่างแล้ว! รีบจองก่อนหมด" |
| `rescheduleConfirmation()` | เลื่อนนัดสำเร็จ | แสดงเวลาเดิม (ขีดทับ) + เวลาใหม่ |

**โครงสร้าง template**:
- `layout()` — wrapper HTML (header สีม่วง + footer)
- `detailsBlock()` — กล่องแสดงวันที่ + เวลา
- ทุก template return `{ subject, html }`

#### `waitlist-notify.ts`
- **หน้าที่**: แจ้งคนถัดไปใน waitlist เมื่อ slot ว่าง
- **ทำงานร่วมกับ**: `booking.ts` (เมื่อยกเลิก/เลื่อนนัด), `guest.ts` (เมื่อ guest ยกเลิก)
- **Flow**:
  1. หา waitlist entry แรกที่ `notified: false` (เรียงตาม position)
  2. อัพเดท `notified: true`
  3. ส่งอีเมลแจ้ง
- **จุดสำคัญ**: แจ้งทีละคน (คนที่ position ต่ำสุดก่อน) — ไม่แจ้งทุกคนพร้อมกัน

---

### 3.4 tRPC Server (Backend API)

#### `src/server/trpc.ts` — ตั้งค่า tRPC Core
- **หน้าที่**: กำหนด context, middleware, procedure types
- **ทำงานร่วมกับ**: ทุก router, `src/lib/jwt.ts`, `src/lib/prisma.ts`

**สิ่งที่ทำ**:

1. **`createTRPCContext()`** — สร้าง context ที่ทุก procedure ใช้ร่วมกัน:
   - อ่าน token จาก cookie header
   - verify token → ได้ user payload (หรือ null)
   - return `{ prisma, user, headers }`

2. **`initTRPC`** — ตั้งค่า tRPC:
   - ใช้ `superjson` transformer (รองรับ Date objects)
   - Custom error formatter: ถ้า error เป็น ZodError → ส่ง `zodError` field กลับไปด้วย

3. **Procedure Types** (3 ระดับ):
   - `publicProcedure` — ใครก็เรียกได้ (ไม่ต้อง login)
   - `protectedProcedure` — ต้อง login (ตรวจ `ctx.user` ≠ null)
   - `adminProcedure` — ต้องเป็น admin (ตรวจ `ctx.user.role === "ADMIN"`)

#### `src/server/routers/app.ts` — รวม Router
- **หน้าที่**: merge ทุก sub-router เข้าด้วยกัน + export `AppRouter` type
- **ทำงานร่วมกับ**: `src/app/api/trpc/[trpc]/route.ts` (ใช้ appRouter), `src/lib/trpc.ts` (ใช้ AppRouter type)

```
appRouter = {
  auth:     authRouter,      // login, register, logout, me
  booking:  bookingRouter,   // CRUD booking + reschedule
  slot:     slotRouter,      // CRUD slot + block
  admin:    adminRouter,     // dashboard, users, holidays, analytics
  waitlist: waitlistRouter,  // join/leave/position
  guest:    guestRouter,     // guest booking + cancel
}
```

#### `src/server/routers/auth.ts` — Authentication Router
- **หน้าที่**: จัดการ register, login, logout, ดูข้อมูลตัวเอง
- **ทำงานร่วมกับ**: `jwt.ts`, `validators.ts`, `prisma`

**Endpoints**:

| Endpoint | Type | Protection | สิ่งที่ทำ |
|---|---|---|---|
| `auth.register` | mutation | public | สร้าง user ใหม่ → hash password → สร้าง JWT → set cookie |
| `auth.login` | mutation | public | ตรวจ email + password → สร้าง JWT → set cookie |
| `auth.logout` | mutation | public | ลบ cookie |
| `auth.me` | query | protected | ดึงข้อมูล user ปัจจุบันจาก DB (จาก userId ใน token) |

**Logic สำคัญ**:
- **Register**: ตรวจ email ซ้ำ (แต่ถ้า user ถูก soft delete แล้ว ยอมให้สร้างใหม่ได้... **ข้อผิดพลาด**: ไม่ได้จัดการ case reactivate)
- **Login**: ใช้ `bcrypt.compare()` เทียบ password — ไม่บอกว่า email ไม่มีหรือ password ผิด (ป้องกัน user enumeration)
- **Password hash**: bcrypt salt rounds = 12 (ค่อนข้างแข็งแรง)

#### `src/server/routers/booking.ts` — Booking Router
- **หน้าที่**: จัดการการจองทั้งหมด (สร้าง, ยกเลิก, อัพเดท, เลื่อนนัด, ดูรายการ)
- **ทำงานร่วมกับ**: `validators.ts`, `email.ts`, `email-templates.ts`, `waitlist-notify.ts`

**Endpoints**:

| Endpoint | Type | Protection | สิ่งที่ทำ |
|---|---|---|---|
| `booking.create` | mutation | protected | สร้าง booking ใหม่ (มี 6 validation ก่อนจอง) |
| `booking.cancel` | mutation | protected | ยกเลิก booking ของตัวเอง + แจ้ง waitlist |
| `booking.getMyBookings` | query | protected | ดู booking ทั้งหมดของตัวเอง (sort ตามวัน/เวลา) |
| `booking.getAll` | query | admin | ดู booking ทั้งหมด (filter status/date + pagination) |
| `booking.update` | mutation | admin | แก้ไข booking (เปลี่ยน slot, note) |
| `booking.delete` | mutation | admin | ลบ booking |
| `booking.updateStatus` | mutation | admin | เปลี่ยนสถานะ (มี transition rules) + ส่ง email + แจ้ง waitlist |
| `booking.reschedule` | mutation | protected | เลื่อนนัดได้ 1 ครั้ง → เปลี่ยน slot + บันทึก originalSlotId |

**Create Booking Flow (6 ขั้นตอน validation)**:
```
1. ตรวจ slot มีอยู่จริง + ไม่ blocked
2. ตรวจ slot ไม่ใช่อดีต (เทียบวัน + เวลา)
3. ตรวจไม่มีใครจองแล้ว (ทั้ง Booking + GuestBooking)
4. ตรวจ user ไม่มี active booking อยู่แล้ว (1 คน จองได้ 1 รอบ)
5. ตรวจจำนวนจองต่อวันไม่เกิน 20 (ทั้ง Booking + GuestBooking)
6. สร้าง booking → ส่ง email ยืนยัน
```

**Status Transition Rules** (ป้องกันเปลี่ยนสถานะมั่ว):
```
PENDING    → CONFIRMED, CANCELLED
CONFIRMED  → IN_PROGRESS, CANCELLED
IN_PROGRESS → COMPLETED, CANCELLED
COMPLETED  → (ไม่ได้)
CANCELLED  → (ไม่ได้)
```

**Reschedule Logic**:
- เลื่อนได้ 1 ครั้ง (ตรวจ `rescheduledAt` ไม่ใช่ null → reject)
- เฉพาะ PENDING / CONFIRMED
- บันทึก slot เดิมใน `originalSlotId`
- แจ้ง waitlist ของ slot เดิม (เพราะว่างแล้ว)

#### `src/server/routers/slot.ts` — Slot Router
- **หน้าที่**: จัดการ time slots (ดู, สร้าง, แก้ไข, ลบ, block/unblock)
- **ทำงานร่วมกับ**: `validators.ts`, `prisma`

**Endpoints สำคัญ**:

| Endpoint | Type | Protection | สิ่งที่ทำ |
|---|---|---|---|
| `slot.getAvailable` | query | public | ดู slots ของวันที่กำหนด (lazy-generate ถ้ายังไม่มี) |
| `slot.blockSlot` | mutation | admin | block slot + ยกเลิก booking ที่จองอยู่อัตโนมัติ |
| `slot.unblockSlot` | mutation | admin | unblock slot |
| `slot.create` | mutation | admin | สร้าง slot custom |
| `slot.update` | mutation | admin | แก้ไข slot |
| `slot.delete` | mutation | admin | ลบ slot (ต้องไม่มี active booking) |
| `slot.getHolidayDates` | query | public | ดูวันหยุด 60 วันข้างหน้า |

**Lazy-Generate Slots**:
```
เมื่อ query วันที่หนึ่ง ถ้าไม่มี slot ในวันนั้นเลย:
→ auto-generate 22 slots (09:00-20:00, ทุก 30 นาที)
→ บันทึกลง DB
```

- ตรวจ `ShopHoliday` ก่อน → ถ้าเป็นวันหยุด return `[]`
- Return ข้อมูลเพิ่ม: `isBooked`, `isPast` (ใช้เทียบเวลาปัจจุบัน)

#### `src/server/routers/admin.ts` — Admin Router
- **หน้าที่**: ฟังก์ชัน admin ทั้งหมด (dashboard, users, holidays, analytics, manual booking)
- **ทำงานร่วมกับ**: `validators.ts`, `email.ts`, `email-templates.ts`
- **Protection**: ทุก endpoint ใช้ `adminProcedure`

**Endpoints**:

| Endpoint | สิ่งที่ทำ |
|---|---|
| `admin.getDashboardStats` | สถิติวันนี้ (total, pending, confirmed, inProgress, completed, cancelled) + totalCustomers + upcoming |
| `admin.getUsers` | ค้นหา users (search by name/email/phone, filter role, pagination) |
| `admin.getUser` | ดูรายละเอียด user + booking history |
| `admin.createUser` | สร้าง user ใหม่ (admin สร้างให้) |
| `admin.updateUser` | แก้ไขข้อมูล user (ตรวจ email ซ้ำ) |
| `admin.deleteUser` | Soft delete user (set `deletedAt`) |
| `admin.addHoliday` | เพิ่มวันหยุด + ยกเลิก booking ทั้งหมดในวันนั้น + ส่ง email แจ้ง |
| `admin.removeHoliday` | ลบวันหยุด |
| `admin.getHolidays` | ดูวันหยุดตามปี |
| `admin.createManualBooking` | จอง manual (เลือก existing user หรือสร้าง guest booking) |
| `admin.getAnalytics` | วิเคราะห์: total, completed, cancelled, no-show, new/returning customers, busiest day/time, bookings by day/status |

**Analytics Logic**:
- **No-show**: booking ที่ยังเป็น PENDING/CONFIRMED แต่วันผ่านไปแล้ว
- **New vs Returning**: ดูว่า userId มี booking ก่อน startDate หรือไม่
- **Busiest Day/Time**: นับจำนวน booking ต่อวัน/ต่อ startTime → หาค่า max

#### `src/server/routers/waitlist.ts` — Waitlist Router
- **หน้าที่**: ระบบรอคิว (เมื่อ slot เต็ม)
- **ทำงานร่วมกับ**: `validators.ts`

**Endpoints**:

| Endpoint | สิ่งที่ทำ |
|---|---|
| `waitlist.join` | เข้าคิวรอ slot (ตรวจว่า slot ต้องถูกจองแล้ว + ไม่ซ้ำ) |
| `waitlist.leave` | ออกจากคิว + reorder position ของคนที่เหลือ |
| `waitlist.getMyPosition` | ดูตำแหน่งของตัวเองในคิว + จำนวนคนรอทั้งหมด |
| `waitlist.getBySlot` | (admin) ดูรายชื่อคนรอในแต่ละ slot |

**Position Logic**:
- เข้าคิว: position = max position ปัจจุบัน + 1
- ออกจากคิว: ลดตำแหน่งคนที่อยู่หลัง (`position - 1`) เพื่อไม่ให้มีช่องว่าง

#### `src/server/routers/guest.ts` — Guest Router
- **หน้าที่**: จองและยกเลิกสำหรับผู้ที่ไม่สมัครสมาชิก
- **ทำงานร่วมกับ**: `validators.ts`, `email.ts`, `email-templates.ts`, `waitlist-notify.ts`

**Endpoints**:

| Endpoint | สิ่งที่ทำ |
|---|---|
| `guest.create` | สร้าง guest booking (validate คล้าย booking.create) → ส่ง email + cancel link |
| `guest.cancelByToken` | ยกเลิกด้วย cancelToken (จากลิงก์ในอีเมล) → แจ้ง waitlist |

**จุดสำคัญ**: Guest ไม่ต้อง login → ใช้ `publicProcedure` → ยกเลิกผ่าน unique `cancelToken` (cuid)

---

### 3.5 Shared Components

#### `Navbar.tsx`
- **หน้าที่**: แถบเมนูด้านบน (ติดอยู่บนสุดตลอด)
- **ทำงานร่วมกับ**: `layout.tsx`, `trpc`, `Toast`, React Router
- **Logic**:
  - เรียก `auth.me` เพื่อดูว่า login แล้วหรือยัง
  - **ถ้า loading**: แสดง skeleton (ป้องกัน layout shift)
  - **ถ้า login แล้ว**: แสดง Book, My Bookings, (Admin ถ้า role=ADMIN), ชื่อ, Logout
  - **ถ้ายังไม่ login**: แสดง Login, Register
  - รองรับ **mobile menu** (hamburger → แสดง/ซ่อนเมนู)

#### `Toast.tsx`
- **หน้าที่**: ระบบแจ้งเตือน (popup มุมขวาล่าง)
- **ทำงานร่วมกับ**: ทุกหน้าที่ใช้ `useToast()`
- **Pattern**: React Context + Provider
  - `ToastProvider` — ครอบใน layout, จัดการ state ของ toasts
  - `useToast()` — hook สำหรับเรียกใช้ `toast(message, type)`
  - หายเองหลัง 3.5 วินาที
  - 3 ประเภท: `success` (เขียว), `error` (แดง), `info` (ม่วง)

#### `DatePicker.tsx`
- **หน้าที่**: แถบเลือกวันที่ (แสดง 14 วันข้างหน้า)
- **ทำงานร่วมกับ**: `book/page.tsx`, `RescheduleModal`, admin pages
- **Logic**:
  - Generate 14 วัน จากวันนี้
  - วันหยุด: disabled + แสดง "Closed" สีแดง
  - วันที่เลือก: highlight สีม่วง
  - วันนี้: แสดง "Today"
  - Scroll แนวนอนได้ (overflow-x)

#### `SlotGrid.tsx`
- **หน้าที่**: ตารางเลือกเวลา (grid ของปุ่มเวลา)
- **ทำงานร่วมกับ**: `book/page.tsx`, `RescheduleModal`, `ManualBookingModal`
- **States ของ slot**:
  - ว่าง: พื้นขาว → คลิกได้
  - เลือกแล้ว: สีม่วง + scale up เล็กน้อย
  - จองแล้ว: สีเทา + disabled + แสดงลิงก์ "Waitlist" (ถ้า member)
  - Blocked: สีแดง + disabled
  - Loading: skeleton animation

#### `BookingCard.tsx`
- **หน้าที่**: การ์ดแสดง booking 1 รายการ (สำหรับ user)
- **ทำงานร่วมกับ**: `my-bookings/page.tsx`
- **แสดง**: เวลา, วันที่, สถานะ (มี icon + สี), note
- **Actions**: ปุ่ม Reschedule (ถ้ายังไม่เคยเลื่อน), ปุ่ม Cancel (ถ้า PENDING/CONFIRMED)

#### `BookingTable.tsx`
- **หน้าที่**: ตาราง booking สำหรับ admin (responsive: table บน desktop, card บน mobile)
- **ทำงานร่วมกับ**: `admin/bookings/page.tsx`
- **แสดง**: ID, ชื่อลูกค้า, วัน/เวลา, สถานะ, ปุ่ม action
- **Status Actions** (กำหนดตาม `nextStatus` map):
  ```
  PENDING    → [Confirm, Cancel]
  CONFIRMED  → [Start, Cancel]
  IN_PROGRESS → [Complete, Cancel]
  COMPLETED  → (ไม่มี)
  CANCELLED  → (ไม่มี)
  ```

#### `StatsCard.tsx`
- **หน้าที่**: การ์ดแสดงสถิติตัวเลข (มี 7 สี)
- **ทำงานร่วมกับ**: `admin/page.tsx` (dashboard), `admin/analytics/page.tsx`
- **Props**: title, value (ตัวเลข), color, icon (SVG path)

#### `RescheduleModal.tsx`
- **หน้าที่**: Modal สำหรับเลื่อนนัด
- **ทำงานร่วมกับ**: `my-bookings/page.tsx`
- **Flow**:
  1. เลือกวันใหม่ (DatePicker)
  2. เลือกเวลาใหม่ (SlotGrid — filter ออก slot ปัจจุบัน)
  3. กดยืนยัน → เรียก `booking.reschedule`
  4. สำเร็จ → invalidate cache + ปิด modal

#### `ManualBookingModal.tsx`
- **หน้าที่**: Modal สำหรับ admin จอง manual
- **ทำงานร่วมกับ**: `admin/bookings/page.tsx`
- **2 tabs**:
  - **Existing User**: ค้นหา user → เลือก → เลือกวัน/เวลา → จอง
  - **Guest**: กรอกข้อมูล guest → เลือกวัน/เวลา → จอง
- **เรียก**: `admin.createManualBooking`

---

### 3.6 Frontend Pages

#### `src/app/layout.tsx` — Root Layout
- **หน้าที่**: Layout หลักที่ครอบทุกหน้า
- **สิ่งที่ทำ**:
  1. โหลดฟอนต์ Geist Sans + Geist Mono
  2. ตั้ง metadata (title, description)
  3. ครอบด้วย `TRPCProvider` → `ToastProvider` → `Navbar` → `main`
- **โครงสร้าง**: `<html>` → `<body>` → `TRPCProvider` → `ToastProvider` → `Navbar` + `<main>`

#### `src/app/page.tsx` — Landing Page (`/`)
- **หน้าที่**: หน้าแรก (marketing page)
- **3 sections**:
  1. **Hero**: gradient ม่วง + animation, ปุ่ม "Book Now" + "Create Account"
  2. **How it works**: 3 ขั้นตอน — Pick a date → Choose your slot → You're booked!
  3. **Info bar**: Opening hours (09:00-20:00), Duration (30 min), Max daily (20 slots)
- **ไม่ใช่ client component** — เป็น Server Component (render บน server → เร็ว)

#### `src/app/login/page.tsx` — Login Page (`/login`)
- **หน้าที่**: หน้า login
- **Flow**: กรอก email + password → เรียก `auth.login` → สำเร็จ → invalidate `auth.me` → redirect ไป `/book`
- **Error handling**: แสดง Zod validation errors หรือ server errors ผ่าน Toast

#### `src/app/register/page.tsx` — Register Page (`/register`)
- **หน้าที่**: หน้าสมัครสมาชิก
- **Fields**: firstName, lastName, email, phone, password
- **Flow**: กรอกข้อมูล → เรียก `auth.register` → สำเร็จ → redirect ไป `/book`
- **Pattern**: ใช้ `update()` helper function สร้าง onChange handler แบบ generic

#### `src/app/book/page.tsx` — Booking Page (`/book`)
- **หน้าที่**: หน้าจองคิว (หน้าหลักของระบบ)
- **2 Tabs**: Member Booking / Guest Booking
- **Flow 3 ขั้นตอน**:
  1. **Step 1**: เลือกวันที่ (DatePicker) — โหลด holidays เพื่อ disable วันหยุด
  2. **Step 2**: เลือกเวลา (SlotGrid) — query slots ตามวันที่เลือก
  3. **Step 3**: ยืนยัน — แสดงสรุปวัน/เวลา + ช่อง note → กดจอง
- **Member**: เรียก `booking.create` → redirect ไป `/my-bookings`
- **Guest**: เรียก `guest.create` → แสดงหน้า success + "Book Another" button
- **Waitlist**: ถ้า slot เต็ม → แสดงลิงก์ "Waitlist" (เฉพาะ member)

#### `src/app/my-bookings/page.tsx` — My Bookings Page (`/my-bookings`)
- **หน้าที่**: ดู/จัดการ booking ของตัวเอง
- **Query**: `booking.getMyBookings`
- **States**: Loading (skeleton) / Empty (ปุ่ม "Book Now") / List (BookingCards)
- **Actions**: Cancel → เรียก `booking.cancel` / Reschedule → เปิด `RescheduleModal`

#### `src/app/cancel/page.tsx` — Guest Cancel Page (`/cancel`)
- **หน้าที่**: หน้ายกเลิก booking สำหรับ Guest (เข้าผ่าน link ในอีเมล)
- **Flow**:
  1. อ่าน `?token=xxx` จาก URL
  2. ถ้าไม่มี token → แสดง "Invalid Link"
  3. แสดงหน้าถามยืนยัน → กด "Yes, Cancel Booking" → เรียก `guest.cancelByToken`
  4. สำเร็จ → แสดง "Booking Cancelled" + ปุ่ม "Book Again"
- **ใช้ Suspense**: เพราะ `useSearchParams()` ต้องอยู่ใน Suspense boundary

---

### 3.7 Admin Pages

#### `src/app/admin/layout.tsx` — Admin Layout
- **หน้าที่**: Layout สำหรับ admin panel (sidebar + content area)
- **Sidebar**: 6 items — Dashboard, Bookings, Slots, Users, Analytics, Settings
- **Active state**: ใช้ `pathname` เทียบ → แสดง gradient ม่วง
- **Responsive**: แนวนอน (scroll) บน mobile, แนวตั้งบน desktop

#### `src/app/admin/page.tsx` — Admin Dashboard (`/admin`)
- **หน้าที่**: ภาพรวมสถิติวันนี้
- **Query**: `admin.getDashboardStats`
- **แสดง**:
  - **Today**: Total, Pending, Confirmed, In Progress, Completed, Cancelled (6 cards)
  - **Overall**: Total Customers, Upcoming Bookings (2 cards)
- **Loading state**: skeleton cards

#### `src/app/admin/bookings/page.tsx` — Admin Bookings (`/admin/bookings`)
- **หน้าที่**: จัดการ booking ทั้งหมด
- **Features**:
  - Filter: เลือก status + เลือกวัน
  - ตาราง BookingTable (update status, delete)
  - Pagination (previous/next)
  - ปุ่ม "+ Manual Booking" → เปิด ManualBookingModal

#### `src/app/admin/slots/page.tsx` — Admin Slots (`/admin/slots`)
- **หน้าที่**: จัดการ time slots
- **Flow**: เลือกวัน (DatePicker) → แสดง slots → Block/Unblock
- **แสดงสี**: เขียว (ว่าง), เทา (จองแล้ว), แดง (blocked)
- **Block**: มีช่อง reason + ปุ่ม Block

#### `src/app/admin/users/page.tsx` — Admin Users (`/admin/users`)
- **หน้าที่**: CRUD ผู้ใช้
- **Features**:
  - ค้นหา (name, email, phone) + filter role
  - Inline edit (แก้ไขในตาราง)
  - Delete (soft delete)
  - Pagination
  - Responsive (table บน desktop, cards บน mobile)

#### `src/app/admin/analytics/page.tsx` — Admin Analytics (`/admin/analytics`)
- **หน้าที่**: กราฟและสถิติการจอง
- **Date Range**: This Week / This Month / Last Month / Custom
- **Charts** (ใช้ Recharts + dynamic import สำหรับ SSR safety):
  - Bar Chart: จำนวน booking ต่อวัน
  - Pie Chart: booking แยกตาม status
- **Stats Cards**: Total, Completed, Cancelled, No-show, New Customers, Returning
- **Info**: Busiest Day + Busiest Time Slot

#### `src/app/admin/settings/page.tsx` — Admin Settings (`/admin/settings`)
- **หน้าที่**: จัดการวันหยุดร้าน
- **Features**:
  - เพิ่มวันหยุด: เลือกวัน + reason → booking วันนั้นถูกยกเลิกอัตโนมัติ
  - ดูรายการวันหยุดตามปี (เลื่อนปีซ้าย/ขวา)
  - ลบวันหยุด

---

### 3.8 API Routes

#### `src/app/api/trpc/[trpc]/route.ts` — tRPC HTTP Handler
- **หน้าที่**: แปลง HTTP request → tRPC procedure call
- **ทำงานร่วมกับ**: `appRouter`, `createTRPCContext`
- **Endpoint**: `/api/trpc/*` — รองรับทั้ง GET (queries) + POST (mutations)
- **ใช้ `fetchRequestHandler`**: adapter สำหรับ Web Fetch API (standard ของ Next.js)

#### `src/app/api/cron/reminders/route.ts` — Cron Reminder
- **หน้าที่**: ส่ง email เตือนลูกค้าที่มีนัดพรุ่งนี้
- **เรียกยังไง**: HTTP GET + `Authorization: Bearer {CRON_SECRET}`
- **Flow**:
  1. ตรวจ auth header ตรงกับ `CRON_SECRET` หรือไม่
  2. หา booking ที่วันพรุ่งนี้ + status PENDING/CONFIRMED
  3. ส่ง email reminder ทีละคน
  4. return จำนวนที่ส่ง `{ sent: N }`
- **ตั้ง Cron ที่ไหน?**: ใช้ external cron service (เช่น cron-job.org, Vercel Cron) เรียก endpoint นี้ทุกวัน

#### `src/proxy.ts` — Middleware (Route Protection)
- **หน้าที่**: ป้องกัน route — redirect ถ้าไม่มีสิทธิ์
- **ทำงานร่วมกับ**: Next.js middleware system
- **Rules**:

| Route | Rule |
|---|---|
| `/`, `/login`, `/register`, `/cancel` | เข้าได้เลย (public) |
| `/login`, `/register` + มี valid token | Redirect ไป `/book` (ไม่ต้อง login ซ้ำ) |
| อื่นๆ + ไม่มี token | Redirect ไป `/login` |
| `/admin/*` + role ≠ ADMIN | Redirect ไป `/` |
| Invalid token | ลบ cookie + redirect ไป `/login` |

- **Matcher**: ทุก route ยกเว้น `api`, `_next/static`, `_next/image`, `favicon.ico`

---

## 4. Flow การทำงานทั้งระบบ

### 4.1 Flow สมัครสมาชิก + จองคิว

```
User เปิดเว็บ
  │
  ├─→ proxy.ts ตรวจ route
  │     └─ "/" เป็น public → ผ่าน
  │
  ├─→ page.tsx (Landing) แสดงหน้าแรก
  │
  ├─→ User กด "Create Account"
  │     └─→ register/page.tsx
  │           └─→ กรอกข้อมูล → submit
  │                 └─→ trpc.auth.register.useMutation()
  │                       └─→ ส่ง HTTP POST /api/trpc/auth.register
  │                             └─→ route.ts (fetchRequestHandler)
  │                                   └─→ createTRPCContext() สร้าง context
  │                                         └─→ authRouter.register
  │                                               ├─ validators.ts ตรวจ input (Zod)
  │                                               ├─ prisma.user.findUnique() ตรวจ email ซ้ำ
  │                                               ├─ bcrypt.hash() hash password
  │                                               ├─ prisma.user.create() บันทึก DB
  │                                               ├─ jwt.ts signToken() สร้าง JWT
  │                                               └─ jwt.ts setAuthCookie() set cookie
  │                                                     └─→ Response กลับ browser
  │                                                           └─→ redirect ไป /book
  │
  ├─→ User อยู่ที่ /book
  │     └─→ book/page.tsx
  │           ├─ trpc.slot.getHolidayDates → ดูวันหยุด
  │           ├─ User เลือกวัน → trpc.slot.getAvailable → ดู slots
  │           ├─ User เลือกเวลา → แสดง confirm panel
  │           └─ User กดจอง → trpc.booking.create
  │                 └─→ bookingRouter.create
  │                       ├─ Transaction:
  │                       │   ├─ ตรวจ slot, past, double-booking, active booking, daily limit
  │                       │   └─ prisma.booking.create()
  │                       ├─ email.ts + email-templates.ts → ส่ง email ยืนยัน
  │                       └─→ Response → redirect ไป /my-bookings
  │
  └─→ User ดู booking ที่ /my-bookings
        └─→ trpc.booking.getMyBookings → แสดง BookingCards
```

### 4.2 Flow Admin จัดการ

```
Admin login → proxy.ts ตรวจ role=ADMIN → เข้า /admin
  │
  ├─→ /admin → getDashboardStats → แสดง StatsCards
  │
  ├─→ /admin/bookings → getAll (filter, pagination)
  │     ├─ Confirm/Start/Complete → updateStatus → email + waitlist
  │     ├─ Cancel → updateStatus("CANCELLED") → email + waitlist
  │     ├─ Delete → delete booking
  │     └─ Manual Booking → createManualBooking → email
  │
  ├─→ /admin/slots → getAvailable → block/unblock
  │
  ├─→ /admin/users → getUsers → edit/delete
  │
  ├─→ /admin/analytics → getAnalytics → charts + stats
  │
  └─→ /admin/settings → getHolidays → add/remove holidays
```

### 4.3 Flow Guest Booking

```
Guest เข้า /book → เลือก tab "Guest Booking"
  │
  ├─→ กรอกข้อมูล (ชื่อ, email, phone)
  ├─→ เลือกวัน/เวลา
  ├─→ กดจอง → trpc.guest.create
  │     ├─ Validate (slot, past, double-booking, daily limit)
  │     ├─ prisma.guestBooking.create() → ได้ cancelToken (cuid)
  │     └─ sendEmail → guestBookingConfirmation (มี cancel link)
  │
  └─→ ยกเลิก: Guest เปิดลิงก์ในอีเมล → /cancel?token=xxx
        └─→ trpc.guest.cancelByToken
              ├─ ค้น guestBooking จาก cancelToken
              ├─ อัพเดท status = CANCELLED
              ├─ แจ้ง waitlist (notifyNextInWaitlist)
              └─ ส่ง email แจ้งยกเลิก
```

---

## 5. จุดสำคัญ

### จุดที่ควรระวัง

1. **Race Condition ใน Booking Create**: ใช้ `$transaction` ป้องกันได้ระดับหนึ่ง แต่ไม่ได้ใช้ pessimistic lock → อาจเกิดปัญหาในกรณี high concurrency
2. **Register + Soft Delete**: ถ้า email ถูก soft delete แล้วสมัครใหม่ → สร้าง user ใหม่ (ไม่ reactivate เดิม) → อาจมี 2 records ที่ email เดียวกัน (ขัดกับ `@unique`)
3. **Guest Booking ไม่ตรวจซ้ำ**: Guest คนเดียวกันจองหลาย slot ได้ (ไม่มี rate limiting)
4. **Cron Secret**: ใช้ `Bearer` header ตรวจสอบ → ถ้า secret หลุด ใครก็เรียกได้
5. **blockReason state**: ในหน้า admin slots ใช้ `blockReason` state ร่วมกันทุก slot → ถ้ากรอก reason แล้วกด block slot อื่น จะได้ reason ผิด
6. **ไม่มี Rate Limiting**: API ไม่มี rate limit → เสี่ยงถูก brute force login
7. **`sendEmail` เป็น fire-and-forget**: ถ้าส่งไม่ได้ ไม่มี retry mechanism
8. **Timezone**: ใช้ server time เทียบกับ slot date → ถ้า server กับ user อยู่คนละ timezone อาจมีปัญหา

### จุดที่เขียนดี

1. **Type-safe จากต้นจนจบ**: tRPC + Zod + Prisma → Frontend เรียก API ได้แบบ type-safe (autocomplete, compile-time error)
2. **Validation ที่เดียว**: Zod schemas ใน `validators.ts` ใช้ร่วมกันทั้ง frontend + backend
3. **Status Transition Rules**: ป้องกันเปลี่ยนสถานะมั่ว (เช่น COMPLETED → PENDING ไม่ได้)
4. **Lazy Slot Generation**: ไม่ต้องสร้าง slot ล่วงหน้า → สร้างตอนที่มีคน query
5. **Soft Delete User**: ไม่ลบจริง → ยังเก็บ booking history ได้
6. **Email Graceful Degradation**: ถ้าไม่ตั้ง email config → ระบบยังทำงานได้
7. **Waitlist Auto-notify**: เมื่อ booking ถูกยกเลิก → แจ้งคนรอคิวอัตโนมัติ
8. **Holiday Auto-cancel**: เมื่อเพิ่มวันหยุด → booking วันนั้นถูกยกเลิก + ส่ง email แจ้ง
9. **Responsive Design**: ทุกหน้ารองรับ mobile (cards) + desktop (tables)
10. **Docker Multi-stage**: Image เล็ก, ปลอดภัย (non-root user)

### จุดที่ควร Refactor

1. **ซ้ำซ้อน: ตรวจ double-booking**: โค้ดตรวจ booking + guestBooking ซ้ำกันใน `booking.ts`, `guest.ts`, `admin.ts` → ควรแยกเป็น utility function
2. **ซ้ำซ้อน: ตรวจ past slot**: Logic เทียบวัน/เวลาซ้ำกันหลายที่ → ควรแยกเป็น helper
3. **ซ้ำซ้อน: MAX_BOOKINGS_PER_DAY**: ค่า 20 hardcode ใน 2 ไฟล์ → ควรเป็น config
4. **Admin router ใหญ่เกินไป**: รวม users + holidays + analytics + manual booking → ควรแยกเป็น sub-routers
5. **ไม่มี Test**: ไม่มี unit test / integration test เลย
6. **ไม่มี Logging ที่ดี**: ใช้ `console.log/error` → ควรใช้ structured logging
7. **ไม่มี API Documentation**: tRPC ไม่มี Swagger → ถ้ามี client อื่นจะยาก

---

## 6. อธิบายแบบมือใหม่

### ถ้าคิดเหมือนร้านตัดผมจริง:

```
SalonQ = ร้านตัดผมที่มีระบบจองออนไลน์

🏪 ร้าน (ระบบ)
├── 📋 สมุดจอง (Database - PostgreSQL)
│    ├── ข้อมูลลูกค้า (User)
│    ├── ตารางเวลาว่าง (TimeSlot)
│    ├── รายการจอง (Booking)
│    └── รายชื่อคนรอ (Waitlist)
│
├── 🖥️ หน้าร้าน (Frontend - React)
│    ├── ป้ายหน้าร้าน (Landing Page)
│    ├── จุดลงทะเบียน (Register/Login)
│    ├── กระดานเลือกเวลา (Book Page)
│    └── ใบนัด (My Bookings)
│
├── 👨‍💼 พนักงานต้อนรับ (Backend API - tRPC)
│    ├── รับจอง → ตรวจสอบ → บันทึกสมุด
│    ├── ยกเลิก → ลบจากสมุด → โทรแจ้งคนรอ
│    └── เลื่อนนัด → ย้ายจากช่องเดิม → ช่องใหม่
│
├── 📞 ระบบโทรแจ้ง (Email Service)
│    └── ส่ง email ยืนยัน / ยกเลิก / เตือน
│
└── 👔 ห้องเจ้าของ (Admin Panel)
     ├── Dashboard = กระดานสรุปงานวันนี้
     ├── Bookings = สมุดจองทั้งหมด
     ├── Slots = ตารางเวลา (block = ปิดช่อง)
     ├── Users = ทะเบียนลูกค้า
     ├── Analytics = กราฟสถิติ
     └── Settings = ตั้งวันหยุด
```

### คำศัพท์สำคัญ (อธิบายง่ายๆ):

| คำ | หมายถึง |
|---|---|
| **tRPC** | วิธีเรียก API ที่ frontend กับ backend "พูดภาษาเดียวกัน" (type-safe) |
| **Prisma** | ตัวกลางที่แปลง TypeScript → SQL ให้อัตโนมัติ |
| **JWT** | "บัตรผ่าน" ที่ระบบให้ตอน login → ต้องส่งกลับทุกครั้งเพื่อพิสูจน์ตัวตน |
| **Cookie** | กล่องเก็บ JWT ใน browser (httpOnly = JavaScript อ่านไม่ได้ ปลอดภัยกว่า) |
| **Middleware** | "รปภ." ที่ตรวจสอบก่อนให้เข้าหน้าต่างๆ |
| **Mutation** | action ที่ "เปลี่ยน" ข้อมูล (สร้าง, แก้, ลบ) |
| **Query** | action ที่ "อ่าน" ข้อมูล (ไม่เปลี่ยนอะไร) |
| **Zod** | ตัวตรวจสอบว่า data ที่ส่งมาถูก format ไหม |
| **React Query** | ตัวจัดการ cache ฝั่ง frontend (ไม่ต้อง fetch ซ้ำถ้า data ยังใหม่) |
| **Soft Delete** | "ลบ" โดยแค่ทำเครื่องหมายว่าลบแล้ว (ไม่ลบจริง → กู้คืนได้) |
| **Fire-and-forget** | ส่งไปแล้วไม่รอผล (ถ้าพังก็ช่างมัน — ใช้กับ email ที่ไม่ critical) |

### ภาพรวม flow สั้นที่สุด:

```
User กดจอง
  → Browser ส่ง HTTP request ไปที่ /api/trpc/booking.create
  → tRPC route handler รับ request
  → Middleware ตรวจ JWT ว่า login แล้ว
  → Zod ตรวจ input ว่าถูกต้อง
  → Business logic ตรวจ slot ว่าง, ไม่ซ้ำ, ไม่เกินลิมิต
  → Prisma สั่ง SQL INSERT ลง PostgreSQL
  → ส่ง email ยืนยัน
  → Response กลับ browser
  → React Query cache ข้อมูลใหม่
  → redirect ไปหน้า My Bookings
```

---

> เอกสารนี้สร้างจากการวิเคราะห์ source code ทุกไฟล์ของโปรเจกต์ SalonQ
