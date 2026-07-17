# Frame by DB

Premium photography and cinematography platform built for Director of Photography **Dasari Bharadwaj** (Hyderabad, India). Built to deliver a high-end luxury, modern agency aesthetic with rich kinetic transitions, custom galleries, live pricing tools, client space, and a fully functional CMS.

---

## Tech Stack
- **Framework**: Next.js 16 (App Router / Turbopack optimized)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion & GSAP
- **Forms & Validation**: Zod
- **Smooth Scroll**: Lenis
- **Database**: Local JSON File Database (`database/db.json`) (with out-of-the-box CMS editing)
- **Deployment & Production Path**: Prisma Schema pre-configured for Supabase Integration.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

### 3. Build & Optimize
```bash
npm run build
```

---

## Features Showcase

### 1. Dynamic CMS Admin Panel
- **Access URL**: `/admin`
- **Default Credentials**:
  - **Username**: `admin`
  - **Password**: `password123`
- **Operations**: Manage leads (approve/reject/delete bookings), write new blog articles, add gallery photos or drone media, post new portfolio projects, and update global branding numbers/stats in real-time.

### 2. Client Portal
- **Access URL**: `/client-portal`
- **Demo Access Key**: `ANANYA-2026`
- **Features**: Private proof galleries, high-resolution downloads, post-production timeline pipeline tracking, and paid invoices summary.

### 3. Dynamic Pricing Calculator
- Accessible on `/pricing`. Adjust event duration, crew strength, and add-on services (such as 4K streaming or handcrafted layflat albums) to receive instant custom estimates and plan recommendations.

---

## Database Handoff (Supabase & Prisma)

We have pre-configured the database schema in [schema.prisma](file:///c:/Users/ADMIN/OneDrive/goal/Desktop/frame-by-db/prisma/schema.prisma). To transition from the local JSON database to a PostgreSQL/Supabase production environment:

1. Setup your PostgreSQL URL in your environment variables:
   ```env
   DATABASE_URL="postgresql://postgres:[password]@db.[id].supabase.co:5432/postgres"
   ```
2. Initialize Prisma:
   ```bash
   npx prisma db push
   ```
3. Update [lib/db.ts](file:///c:/Users/ADMIN/OneDrive/goal/Desktop/frame-by-db/lib/db.ts) to utilize `@prisma/client` instead of local file operations.
