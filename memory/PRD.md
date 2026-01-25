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

### Known Issues
1. **P1 - Data inconsistency in Admin "Edit Client" modal**: Legacy vs. new client data formats cause display issues. Needs a normalization utility.
2. **P2 - Stripe Billing Portal**: Requires real API keys to function (placeholder keys in use)

## Key Files Reference
- `/app/frontend/src/pages/PurchaseFlow.jsx` - Multi-step purchase UI
- `/app/frontend/src/components/ClientOnboarding.jsx` - Admin-sent link onboarding form
- `/app/backend/controllers/PublicController.js` - Self-service purchase backend
- `/app/backend/controllers/ClientController.js` - Client authentication & onboarding
- `/app/frontend/src/components/admin/ClientManagement.jsx` - Admin client management
- `/app/frontend/src/components/admin/ContentManagement.jsx` - Admin content CRUD
- `/app/backend/controllers/PackageController.js` - Question query logic
- `/app/backend/config/database.js` - Auto-migration logic

## Key Database Schema
- **`clients`**: Two formats exist - nested `address: { line1, ... }` and legacy flat fields. Now includes `first_name`, `last_name`.
- **`parq_questions`**: `{ ..., applicable_packages: [String] }`
- **`health_questions`**: `{ ..., applicable_packages: [String] }`

## API Endpoints
- `POST /api/purchase` - Create new client and subscription (self-service)
- `GET /api/client/profile` - Client fetches own profile
- `GET /api/public/parq-questions?packageId=<id>` - Get PARQ questions for package
- `GET /api/public/health-questions?packageId=<id>` - Get Health questions for package
- `POST /api/admin/create-portal-session` - Admin Stripe portal session
- CRUD endpoints: `/api/admin/packages`, `/api/admin/parq-questions`, `/api/admin/health-questions`

## Backlog (Prioritized)

### P1 - High Priority
- [ ] Create client data normalization utility for ClientManagement.jsx
- [ ] Final end-to-end testing of Join Now purchase flow

### P2 - Medium Priority
- [ ] Add cancellation policy/terms display before subscription cancellation
- [ ] Stripe Billing Portal (blocked on real API keys)

### P3 - Future Enhancements
- [ ] Refactor client data schema to use consistent format
- [ ] Add client profile edit capability in portal

## Third-Party Integrations
- **Stripe (Payments)** — requires User API Key (currently placeholder)
- **Microsoft Graph (Email)** — requires User API Key
- **Calendly (Scheduling)** — uses public URL

## Test Credentials
- **Client Login**: `simon.price.33@hotmail.com` / `NewTest123!`
