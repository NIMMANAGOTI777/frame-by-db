-- Supabase PostgreSQL Production Migration Schema
-- Target: Supabase / PostgreSQL 15+

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CLEAN UP PREVIOUS SCHEMA RUNS
DROP TABLE IF EXISTS "FAQ" CASCADE;
DROP TABLE IF EXISTS "Setting" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "Employee" CASCADE;
DROP TABLE IF EXISTS "Testimonial" CASCADE;
DROP TABLE IF EXISTS "Package" CASCADE;
DROP TABLE IF EXISTS "Service" CASCADE;
DROP TABLE IF EXISTS "Portfolio" CASCADE;
DROP TABLE IF EXISTS "Blog" CASCADE;
DROP TABLE IF EXISTS "Video" CASCADE;
DROP TABLE IF EXISTS "Photo" CASCADE;
DROP TABLE IF EXISTS "Album" CASCADE;
DROP TABLE IF EXISTS "Gallery" CASCADE;
DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "InvoiceItem" CASCADE;
DROP TABLE IF EXISTS "Invoice" CASCADE;
DROP TABLE IF EXISTS "Quotation" CASCADE;
DROP TABLE IF EXISTS "Booking" CASCADE;
DROP TABLE IF EXISTS "Client" CASCADE;
DROP TABLE IF EXISTS "Admin" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- 2. CREATE TABLES WITH UUID PRIMARY KEYS AND NUMERIC TYPES

CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "username" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL, -- Stored as bcrypt hash
    "role" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "authUserId" UUID UNIQUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_authUserId_fkey" FOREIGN KEY ("authUserId") REFERENCES auth.users ("id") ON DELETE SET NULL
);

CREATE TABLE "Admin" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "username" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL, -- Stored as bcrypt hash
    "email" VARCHAR(255),
    "authUserId" UUID UNIQUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Admin_authUserId_fkey" FOREIGN KEY ("authUserId") REFERENCES auth.users ("id") ON DELETE SET NULL
);

CREATE TABLE "Client" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "companyName" VARCHAR(255),
    "billingAddress" TEXT,
    "accessKey" VARCHAR(255) UNIQUE NOT NULL,
    "authUserId" UUID UNIQUE,
    "downloads" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "albumPhotos" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Client_authUserId_fkey" FOREIGN KEY ("authUserId") REFERENCES auth.users ("id") ON DELETE SET NULL
);

CREATE TABLE "Booking" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "date" DATE NOT NULL,
    "eventType" VARCHAR(255) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "budget" NUMERIC(12,2),
    "message" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'New',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Quotation" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "quoteNumber" VARCHAR(255) UNIQUE NOT NULL,
    "bookingId" UUID,
    "clientId" UUID NOT NULL,
    "issueDate" DATE NOT NULL,
    "validUntil" DATE NOT NULL,
    "subtotal" NUMERIC(12,2) NOT NULL,
    "tax" NUMERIC(12,2) NOT NULL,
    "discount" NUMERIC(12,2) NOT NULL,
    "total" NUMERIC(12,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Draft',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Quotation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE SET NULL,
    CONSTRAINT "Quotation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE
);

CREATE TABLE "Invoice" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "invoiceNumber" VARCHAR(255) UNIQUE NOT NULL,
    "bookingId" UUID,
    "clientId" UUID NOT NULL,
    "issueDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "subtotal" NUMERIC(12,2) NOT NULL,
    "tax" NUMERIC(12,2) NOT NULL,
    "discount" NUMERIC(12,2) NOT NULL,
    "total" NUMERIC(12,2) NOT NULL,
    "paidAmount" NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    "balanceAmount" NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Draft',
    "notes" TEXT,
    "history" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE,
    CONSTRAINT "Invoice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE SET NULL
);

CREATE TABLE "InvoiceItem" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "invoiceId" UUID NOT NULL,
    "serviceName" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" NUMERIC(12,2) NOT NULL,
    "tax" NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    "total" NUMERIC(12,2) NOT NULL,
    CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE
);

CREATE TABLE "Payment" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "invoiceId" UUID NOT NULL,
    "amount" NUMERIC(12,2) NOT NULL,
    "paymentMethod" VARCHAR(100) NOT NULL,
    "transactionId" VARCHAR(255),
    "paymentDate" DATE NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE
);

CREATE TABLE "Gallery" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "image" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'image',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Album" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "clientId" UUID NOT NULL,
    "description" TEXT,
    "coverImage" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Album_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE
);

CREATE TABLE "Photo" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "albumId" UUID NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Photo_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE CASCADE
);

CREATE TABLE "Video" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100),
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Blog" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "readTime" VARCHAR(50) NOT NULL,
    "image" VARCHAR(255) NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Portfolio" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "client" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "date" DATE NOT NULL,
    "image" VARCHAR(255) NOT NULL,
    "videoUrl" VARCHAR(255),
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Service" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "basePrice" NUMERIC(12,2) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Package" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "price" VARCHAR(100) NOT NULL,
    "features" TEXT[] NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Testimonial" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "image" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Employee" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "status" VARCHAR(50) NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Notification" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Setting" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "businessName" VARCHAR(255) NOT NULL,
    "founderName" VARCHAR(255) NOT NULL,
    "founderImage" VARCHAR(255),
    "experienceYears" INTEGER NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "logoUrl" VARCHAR(255) NOT NULL,
    "stats" JSONB NOT NULL,
    "awards" JSONB NOT NULL,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "FAQ" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 3. CREATE INDEXES ON FOREIGN KEYS AND SEARCH FIELDS

CREATE INDEX "idx_booking_email" ON "Booking"("email");
CREATE INDEX "idx_booking_status" ON "Booking"("status");
CREATE INDEX "idx_client_email" ON "Client"("email");
CREATE INDEX "idx_client_accessKey" ON "Client"("accessKey");
CREATE INDEX "idx_client_authUserId" ON "Client"("authUserId");
CREATE INDEX "idx_admin_authUserId" ON "Admin"("authUserId");
CREATE INDEX "idx_user_authUserId" ON "User"("authUserId");
CREATE INDEX "idx_invoice_number" ON "Invoice"("invoiceNumber");
CREATE INDEX "idx_invoice_clientId" ON "Invoice"("clientId");
CREATE INDEX "idx_invoice_bookingId" ON "Invoice"("bookingId");
CREATE INDEX "idx_invoice_item_invoiceId" ON "InvoiceItem"("invoiceId");
CREATE INDEX "idx_payment_invoiceId" ON "Payment"("invoiceId");
CREATE INDEX "idx_album_clientId" ON "Album"("clientId");
CREATE INDEX "idx_photo_albumId" ON "Photo"("albumId");
CREATE INDEX "idx_blog_slug" ON "Blog"("slug");
CREATE INDEX "idx_quotation_bookingId" ON "Quotation"("bookingId");
CREATE INDEX "idx_quotation_clientId" ON "Quotation"("clientId");


-- 4. AUTOMATIC updated_at COLUMN TRIGGERS

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_admin_updated_at BEFORE UPDATE ON "Admin" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_client_updated_at BEFORE UPDATE ON "Client" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_booking_updated_at BEFORE UPDATE ON "Booking" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_quotation_updated_at BEFORE UPDATE ON "Quotation" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_invoice_updated_at BEFORE UPDATE ON "Invoice" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_album_updated_at BEFORE UPDATE ON "Album" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_blog_updated_at BEFORE UPDATE ON "Blog" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_setting_updated_at BEFORE UPDATE ON "Setting" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Admin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Quotation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InvoiceItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Gallery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Album" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Photo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Video" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Blog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Portfolio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Package" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Testimonial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Employee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Setting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FAQ" ENABLE ROW LEVEL SECURITY;

-- Helper Admin Verification Function (Checks if the request jwt matches an Admin user profile)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    -- Service role bypasses naturally, but POSTGREST can be validated via roles
    current_setting('role', true) = 'service_role'
    OR EXISTS (
      SELECT 1 FROM "Admin" WHERE "authUserId" = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "User" WHERE "authUserId" = auth.uid() AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies on application tables to make it idempotent
DROP POLICY IF EXISTS "Admins full access on User" ON "User";
DROP POLICY IF EXISTS "Admins full access on Admin" ON "Admin";
DROP POLICY IF EXISTS "Admins full access on Client" ON "Client";
DROP POLICY IF EXISTS "Admins full access on Booking" ON "Booking";
DROP POLICY IF EXISTS "Admins full access on Quotation" ON "Quotation";
DROP POLICY IF EXISTS "Admins full access on Invoice" ON "Invoice";
DROP POLICY IF EXISTS "Admins full access on InvoiceItem" ON "InvoiceItem";
DROP POLICY IF EXISTS "Admins full access on Payment" ON "Payment";
DROP POLICY IF EXISTS "Admins full access on Gallery" ON "Gallery";
DROP POLICY IF EXISTS "Admins full access on Album" ON "Album";
DROP POLICY IF EXISTS "Admins full access on Photo" ON "Photo";
DROP POLICY IF EXISTS "Admins full access on Video" ON "Video";
DROP POLICY IF EXISTS "Admins full access on Blog" ON "Blog";
DROP POLICY IF EXISTS "Admins full access on Portfolio" ON "Portfolio";
DROP POLICY IF EXISTS "Admins full access on Service" ON "Service";
DROP POLICY IF EXISTS "Admins full access on Package" ON "Package";
DROP POLICY IF EXISTS "Admins full access on Testimonial" ON "Testimonial";
DROP POLICY IF EXISTS "Admins full access on Employee" ON "Employee";
DROP POLICY IF EXISTS "Admins full access on Notification" ON "Notification";
DROP POLICY IF EXISTS "Admins full access on Setting" ON "Setting";
DROP POLICY IF EXISTS "Admins full access on FAQ" ON "FAQ";

DROP POLICY IF EXISTS "Public select FAQ" ON "FAQ";
DROP POLICY IF EXISTS "Public select Testimonial" ON "Testimonial";
DROP POLICY IF EXISTS "Public select Blog" ON "Blog";
DROP POLICY IF EXISTS "Public select Gallery" ON "Gallery";
DROP POLICY IF EXISTS "Public select Portfolio" ON "Portfolio";
DROP POLICY IF EXISTS "Public select Package" ON "Package";
DROP POLICY IF EXISTS "Public select Service" ON "Service";
DROP POLICY IF EXISTS "Public select Setting" ON "Setting";

DROP POLICY IF EXISTS "Allow guest booking submissions" ON "Booking";
DROP POLICY IF EXISTS "Allow guest contact notifications" ON "Notification";

DROP POLICY IF EXISTS "Client read own profile" ON "Client";
DROP POLICY IF EXISTS "Client read own bookings" ON "Booking";
DROP POLICY IF EXISTS "Client read own quotations" ON "Quotation";
DROP POLICY IF EXISTS "Client read own invoices" ON "Invoice";
DROP POLICY IF EXISTS "Client read own items" ON "InvoiceItem";
DROP POLICY IF EXISTS "Client read own payments" ON "Payment";
DROP POLICY IF EXISTS "Client read own albums" ON "Album";
DROP POLICY IF EXISTS "Client read own photos" ON "Photo";

-- Admin-only Write Policies (Restricts write access to authenticated admins)
CREATE POLICY "Admins full access on User" ON "User" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on Admin" ON "Admin" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on Client" ON "Client" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on Booking" ON "Booking" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on Quotation" ON "Quotation" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on Invoice" ON "Invoice" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on InvoiceItem" ON "InvoiceItem" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on Payment" ON "Payment" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on Gallery" ON "Gallery" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on Album" ON "Album" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on Photo" ON "Photo" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on Video" ON "Video" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on Blog" ON "Blog" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on Portfolio" ON "Portfolio" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on Service" ON "Service" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on Package" ON "Package" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on Testimonial" ON "Testimonial" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on Employee" ON "Employee" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on Notification" ON "Notification" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on Setting" ON "Setting" FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admins full access on FAQ" ON "FAQ" FOR ALL TO authenticated USING (is_admin());

-- Public Selective Selector Policies (FAQ, Settings, Blogs etc. readable by anyone)
CREATE POLICY "Public select FAQ" ON "FAQ" FOR SELECT TO anon, public USING (true);
CREATE POLICY "Public select Testimonial" ON "Testimonial" FOR SELECT TO anon, public USING (true);
CREATE POLICY "Public select Blog" ON "Blog" FOR SELECT TO anon, public USING (true);
CREATE POLICY "Public select Gallery" ON "Gallery" FOR SELECT TO anon, public USING (true);
CREATE POLICY "Public select Portfolio" ON "Portfolio" FOR SELECT TO anon, public USING (true);
CREATE POLICY "Public select Package" ON "Package" FOR SELECT TO anon, public USING (true);
CREATE POLICY "Public select Service" ON "Service" FOR SELECT TO anon, public USING (true);
CREATE POLICY "Public select Setting" ON "Setting" FOR SELECT TO anon, public USING (true);

-- Booking and Contact Submissions (Allows guests to submit records)
CREATE POLICY "Allow guest booking submissions" ON "Booking" FOR INSERT TO anon, public WITH CHECK (true);
CREATE POLICY "Allow guest contact notifications" ON "Notification" FOR INSERT TO anon, public WITH CHECK (true);

-- Client Portal Security Policies (Secures client profiles, invoices, payments, and albums)
CREATE POLICY "Client read own profile" ON "Client" FOR SELECT TO authenticated 
USING (auth.uid() = "authUserId" OR is_admin());

CREATE POLICY "Client read own bookings" ON "Booking" FOR SELECT TO authenticated 
USING (
    LOWER("email") IN (SELECT LOWER("email") FROM "Client" WHERE "authUserId" = auth.uid())
    OR is_admin()
);

CREATE POLICY "Client read own quotations" ON "Quotation" FOR SELECT TO authenticated 
USING (
    "clientId" IN (SELECT id FROM "Client" WHERE "authUserId" = auth.uid())
    OR is_admin()
);

CREATE POLICY "Client read own invoices" ON "Invoice" FOR SELECT TO authenticated 
USING (
    EXISTS (SELECT 1 FROM "Client" WHERE id = "clientId" AND "authUserId" = auth.uid()) 
    OR is_admin()
);

CREATE POLICY "Client read own items" ON "InvoiceItem" FOR SELECT TO authenticated 
USING (
    EXISTS (SELECT 1 FROM "Invoice" WHERE id = "invoiceId" AND "clientId" IN (SELECT id FROM "Client" WHERE "authUserId" = auth.uid()))
    OR is_admin()
);

CREATE POLICY "Client read own payments" ON "Payment" FOR SELECT TO authenticated 
USING (
    EXISTS (SELECT 1 FROM "Invoice" WHERE id = "invoiceId" AND "clientId" IN (SELECT id FROM "Client" WHERE "authUserId" = auth.uid()))
    OR is_admin()
);

CREATE POLICY "Client read own albums" ON "Album" FOR SELECT TO authenticated 
USING (
    "clientId" IN (SELECT id FROM "Client" WHERE "authUserId" = auth.uid())
    OR is_admin()
);

CREATE POLICY "Client read own photos" ON "Photo" FOR SELECT TO authenticated 
USING (
    "albumId" IN (SELECT id FROM "Album" WHERE "clientId" IN (SELECT id FROM "Client" WHERE "authUserId" = auth.uid()))
    OR is_admin()
);


-- 7. SQL SEED DATA (With proper conflict targets)

-- Insert Setting
INSERT INTO "Setting" ("id", "businessName", "founderName", "founderImage", "experienceYears", "location", "phone", "email", "logoUrl", "stats", "awards")
VALUES (
    'e6d2bc17-8e6f-44e2-a059-e93cf80e4180',
    'Frame by DB',
    'Dasari Bharadwaj',
    'https://res.cloudinary.com/do4nuj2kh/image/upload/v1784308365/WhatsApp_Image_2026-07-16_at_1.45.28_PM_wbh4ve.jpg',
    16,
    'Hyderabad, India',
    '+91 88850 60808',
    'dopdasari@gmail.com',
    'https://res.cloudinary.com/do4nuj2kh/image/upload/v1784222954/56fb26d7-1364-4020-ad1d-2cd65e216fe4_dxzyee.png',
    '[
      {"label": "Years Experience", "value": "16+"},
      {"label": "Projects Completed", "value": "1200+"},
      {"label": "Happy Clients", "value": "950+"},
      {"label": "Cinematic Films", "value": "300+"}
    ]'::jsonb,
    '[
      {"title": "Best Cinematic Wedding Film", "issuer": "Indian Wedding Awards", "year": "2023"},
      {"title": "Top Commercial Director of Photography", "issuer": "South India Creative Expo", "year": "2024"},
      {"title": "Outstanding Drone Cinematography", "issuer": "Hyderabad Film Festival", "year": "2022"},
      {"title": "Excellence in Corporate Storytelling", "issuer": "National Business Media", "year": "2025"}
    ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  "businessName" = EXCLUDED."businessName",
  "founderName" = EXCLUDED."founderName",
  "experienceYears" = EXCLUDED."experienceYears",
  "location" = EXCLUDED."location",
  "phone" = EXCLUDED."phone",
  "email" = EXCLUDED."email";

-- Insert Default Services
INSERT INTO "Service" ("id", "name", "description", "basePrice")
VALUES
    ('4b9a304e-251f-48d6-976e-df8dbff8f391', 'Wedding Photography & Films', 'Complete cinematic wedding capture and traditional coverage', 150000.00),
    ('c4bb6321-df1e-450f-90db-3129487c6792', 'Commercial Advertisement', 'Commercial video advertisement campaigns for brands', 200000.00),
    ('d98ca6bf-f91b-4171-8bc6-91ba3817fdf8', 'Corporate Event / Headshots', 'Corporate group coverage, event timelines, and clean executive portraits', 75000.00),
    ('f91a03ef-c3a5-48b6-b51f-d748fbb23f81', 'Pre Wedding / Couples Session', 'Cinematic outdoor pre-wedding or engagement couples production', 60000.00),
    ('041fe093-b6af-42d8-bf8f-8d9abdfc3f0a', 'Drone Cinematography / Mapping', 'Specialized 4K aerial photography and videography surveys', 50000.00),
    ('aa94b3c7-cf1e-4db9-8b9a-cbdfbfcfbcf3', 'Maternity & Newborn Shoot', 'Fine art maternity session and newborn photography details', 45000.00)
ON CONFLICT (id) DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "basePrice" = EXCLUDED."basePrice";

-- Insert Default FAQs
INSERT INTO "FAQ" ("id", "question", "answer", "category")
VALUES
    ('a9bf8c7d-c3f2-4bd5-94df-6ba8a9cf291a', 'What is the turnaround time for photos and films?', 'We deliver a teaser within 7-10 days of the event. The complete set of high-resolution edited images and the final cinematic wedding film are delivered in 6 to 8 weeks, depending on the scope of post-production.', 'Deliverables'),
    ('b9d8bfcf-cbf9-4501-8b9f-cd0d9bf8cbfd', 'Do you travel outstation or internationally for shoots?', 'Yes, we travel globally. While we are based in Hyderabad, we have shot projects across India, South East Asia, and the Middle East. Travel and accommodation fees are billed additionally.', 'General'),
    ('cf7e8b9a-41f2-49df-8bfa-df8a9bfcfbfa', 'Can we customize the pricing packages?', 'Absolutely. Every event has unique requirements. We offer three pre-designed packages, but we frequently customize them to include specific deliverables like live-streaming, additional shooting days, or designer albums.', 'Pricing'),
    ('da9f8bcf-c4f2-49df-9bfa-dfcbfa9bfcfd', 'How do we lock our event date?', 'A 50% advance deposit is required to confirm your booking and secure the date. The remaining balance is payable on or before the event date.', 'Bookings')
ON CONFLICT (id) DO UPDATE SET
  "question" = EXCLUDED."question",
  "answer" = EXCLUDED."answer",
  "category" = EXCLUDED."category";

-- Insert Packages
INSERT INTO "Package" ("id", "name", "price", "description", "features")
VALUES
    (
        'e8f7a6b9-c4f2-49bf-8bda-cbdfcfba9001',
        'Silver Cinematic',
        '1,50,000',
        'Perfect for intimate gatherings, engagements, or pre-wedding shoots.',
        ARRAY[
            '1 Senior Photographer & 1 Cinematographer',
            'Up to 6 Hours of Coverage',
            '150+ Hires Edited Photos',
            '2-3 Minute Highlight Film',
            'Online Gallery Delivery (3 months validity)'
        ]
    ),
    (
        'f9a8b7cf-451e-49bf-8bda-cbdfbcfb9002',
        'Gold Luxury',
        '3,50,000',
        'Our most popular comprehensive wedding and premium event production package.',
        ARRAY[
            '2 Senior Photographers & 2 Cinematographers',
            'Drone/Aerial Coverage (Permitted zones)',
            'Full Day Coverage (Up to 12 Hours)',
            '300+ Hires Edited Photos + All Raw Files',
            '5-7 Minute Cinematic Story Film',
            '1 Premium Designer Coffee Table Album',
            'Online Gallery (1 year validity)'
        ]
    ),
    (
        'a9f8b7cf-c4f2-49bf-8bda-cbdfcfba9003',
        'Platinum Royal',
        '6,00,000',
        'The ultimate luxury production with multi-day coverage, live streams, and high-end albums.',
        ARRAY[
            'Directorship of Dasari Bharadwaj',
            '3 Photographers & 3 Cinematographers',
            '4K Drone & Jimmy Jib Support',
            'Multi-day Event Coverage (Up to 3 Days)',
            '500+ Hires Custom Edited Photos',
            '15-20 Minute Premium Film + 3 min Teaser',
            '2 Premium Leather Albums',
            'Ultra-low Latency Live Streaming (Up to 4K)',
            'Lifetime Cloud Storage Access'
        ]
    )
ON CONFLICT (id) DO UPDATE SET
  "name" = EXCLUDED."name",
  "price" = EXCLUDED."price",
  "description" = EXCLUDED."description",
  "features" = EXCLUDED."features";

-- Insert default Admin
INSERT INTO "Admin" ("id", "username", "password", "email")
VALUES (
  'a6d2bc17-8e6f-44e2-a059-e93cf80e4180',
  'admin',
  '$2b$10$BezuVVRdCpiPwSgRHFTT1uDDqszaETzOoHdekWtUPOkNgVPX.2Mu2',
  'admin@framebydb.com'
)
ON CONFLICT (username) DO NOTHING;
