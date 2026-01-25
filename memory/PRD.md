# Simon Price PT - Personal Trainer Management System

## Original Problem Statement
Build a "Join Now" landing page that allows new clients to purchase a subscription directly without needing an admin-sent payment link. This involves creating a multi-step purchase flow with dynamic questions, payment integration, and subsequent account creation. Additionally, an admin area is required to manage the content (packages, questions) for this new flow.

## Core Requirements

### 1. Landing Page (`/join-now`)
- Display subscription packages from database
- Provide options to "Buy Now" or "Book a Call" (via Calendly)

### 2. Dynamic Purchase Flow
The order and content of the steps in the purchase flow must adapt based on the selected package:
- **Nutrition Only Flow**: Client Info → Health Questions → Payment → Success
- **PT with Nutrition Flow**: Client Info → PARQ → Health Questions → Payment → Success
- Progress indicator dynamically updates to show correct steps for current flow

### 3. Client Information Storage
- Collect and store client details including answers to PARQ and Health Questions
- Support first/last name fields with ability to update client record

### 4. Payment
- Use Stripe for pro-rated subscription payments
- Billing on the 1st of each month

### 5. Admin Management
- Full CRUD interface for Packages, PARQ questions, and Health Questions
- Ability to specify which packages a question applies to

## User Personas
1. **Admin (Simon Price)**: Manages clients, packages, questions, and billing
2. **Prospective Client**: Uses Join Now flow to self-register
3. **Existing Client**: Uses portal to view their plan and manage subscription

## Tech Stack
- **Frontend**: React, React Router, Axios, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (with on-startup data migration)
- **Authentication**: JWT (Access + Refresh tokens)
- **Payments**: Stripe SDK

## What's Implemented

### Completed (Jan 2025)
- [x] Dynamic "Join Now" purchase flow with package-specific steps
- [x] PARQ skipping for Nutrition Only packages
- [x] Admin Content Management page (`/admin/content`) for Packages, PARQ & Health Questions
- [x] Database auto-migration for question compatibility
- [x] Client Portal with profile endpoint
- [x] Password Reset flow
- [x] Admin Billing Portal endpoint fixed
- [x] Removed "Simon Price PT" text from purchase flow header
- [x] Admin "Create Payment Link" form now has First Name & Last Name fields
- [x] Backend stores first_name/last_name and sends full name to Stripe
- [x] Client Onboarding form shows editable First/Last Name (pre-populated from admin entry)
- [x] **Full Blog System with:**
  - Public blog listing (`/blog`) with pagination (12 posts per page)
  - Single blog post view (`/blog/:slug`) with hero header image
  - Category sidebar (desktop) / dropdown (mobile)
  - Tag-based filtering
  - Title search (partial match)
  - Admin blog management (`/admin/blog`)
  - Blog editor with markdown support and live preview
  - Drag & drop image upload with positioning (left, right, square, full)
  - Category & tag management (`/admin/blog/categories`)
  - SEO fields (title, description)
  - Draft/Published/Scheduled/Hidden status
  - Scheduled publishing (show from date/time)
- [x] **"Join Now" Page Enhancements:**
  - 3-column layout for packages
  - Admin-selectable "Most Popular" package with banner
- [x] **Client Data Normalization:**
  - Backend script (`/api/admin/normalize-data`) to migrate inconsistent client data
  - Admin button to trigger normalization
  - Frontend utility (`/app/frontend/src/utils/clientUtils.js`) for consistent client data handling
- [x] **Cancellation Policy System:**
  - Public page (`/cancellation-policy`) displaying policy content
  - Footer link to cancellation policy
  - Admin CRUD for policy sections and items in Content Management
  - Re-ordering capabilities for sections and items
  - Client portal shows policy modal before cancellation confirmation with acknowledgment checkbox
- [x] **Full Legal Policy Management System:**
  - Unified policy page component at `/policies/:policyType`
  - All 4 policy types: Cancellation Policy, Terms of Service, Privacy Policy, Cookie Policy
  - Improved dark-themed design matching the site aesthetic
  - Admin panel "Legal Policies" tab with policy type selector
  - Full CRUD for all policy types (sections, items, re-ordering)
  - Footer links to all 4 policy pages
  - "Content Coming Soon" placeholder for empty policies

### Known Issues
1. **P2 - Stripe Billing Portal**: Requires real API keys to function (user reports Stripe is working on their end)

## Key Files Reference
- `/app/frontend/src/pages/PurchaseFlow.jsx` - Multi-step purchase UI
- `/app/frontend/src/pages/PolicyPage.jsx` - Unified policy page component for all legal policies
- `/app/frontend/src/components/ClientOnboarding.jsx` - Admin-sent link onboarding form
- `/app/frontend/src/components/Footer.jsx` - Site footer with all 4 policy links
- `/app/frontend/src/components/client/ClientPortal.jsx` - Client portal with cancellation policy modal
- `/app/frontend/src/utils/clientUtils.js` - Client data normalization utility
- `/app/backend/controllers/PublicController.js` - Self-service purchase backend
- `/app/backend/controllers/ClientController.js` - Client authentication & onboarding
- `/app/frontend/src/components/admin/ClientManagement.jsx` - Admin client management
- `/app/frontend/src/components/admin/ContentManagement.jsx` - Admin content CRUD (packages, PARQ, health questions, all legal policies)
- `/app/backend/controllers/PackageController.js` - Question query logic
- `/app/backend/config/database.js` - Auto-migration logic

## Key Database Schema
- **`clients`**: Normalized to use `stripe_customer_id` and nested `address: { line1, line2, city, postcode, country }`. Legacy fields are migrated by backend normalization script.
- **`parq_questions`**: `{ ..., applicable_packages: [String] }`
- **`health_questions`**: `{ ..., applicable_packages: [String] }`
- **`packages`**: `{ ..., is_popular: Boolean }` for "Most Popular" badge
- **`cancellation_policy`**: `{ id, title, order, items: [{ id, text, order }] }`
- **`terms_of_service`**: Same structure as cancellation_policy
- **`privacy_policy`**: Same structure as cancellation_policy
- **`cookie_policy`**: Same structure as cancellation_policy

## API Endpoints
- `POST /api/purchase` - Create new client and subscription (self-service)
- `GET /api/client/profile` - Client fetches own profile
- `GET /api/public/parq-questions?packageId=<id>` - Get PARQ questions for package
- `GET /api/public/health-questions?packageId=<id>` - Get Health questions for package
- `POST /api/admin/create-portal-session` - Admin Stripe portal session
- `POST /api/admin/normalize-data` - Normalize client data formats
- Public Policy Endpoints: `GET /api/cancellation-policy`, `GET /api/terms-of-service`, `GET /api/privacy-policy`, `GET /api/cookie-policy`
- Admin Policy CRUD: `/api/admin/cancellation-policy/...` and `/api/admin/policies/:policyType/...`
- CRUD endpoints: `/api/admin/packages`, `/api/admin/parq-questions`, `/api/admin/health-questions`

## Backlog (Prioritized)

### P1 - High Priority
- [ ] Final end-to-end testing of Join Now purchase flow
- [ ] Verify Admin blog categories/tags management UI

### P2 - Medium Priority
- [ ] Refactor `ContentManagement.jsx` into smaller components (PackageManagement, ParqManagement, PolicyManagement)
- [ ] Add blog commenting system

### P3 - Future Enhancements
- [ ] Add client profile edit capability in portal

## Third-Party Integrations
- **Stripe (Payments)** — requires User API Key (currently placeholder)
- **Microsoft Graph (Email)** — requires User API Key
- **Calendly (Scheduling)** — uses public URL

## Test Credentials
- **Admin Login**: `simon.price@simonprice-pt.co.uk` / `NewTest123!`
- **Client Login**: `simon.price.33@hotmail.com` / `TestClient123!`
