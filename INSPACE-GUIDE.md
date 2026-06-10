# Inspace — Self-Serve Interior Design Platform: Complete Architecture Guide

> **Scope**: End-to-end architectural blueprint for a three-sided marketplace platform that lets homeowners design and price rooms without a designer, generates qualified leads for furniture brands, provides a marketplace channel for local carpenters/vendors, and licenses as a white-label design-and-quote tool for builders and real-estate firms.

---

## Table of Contents

1. [What is Inspace?](#1-what-is-inspace)
2. [Business Model & Revenue Streams](#2-business-model--revenue-streams)
3. [Architecture Overview](#3-architecture-overview)
4. [Directory Structure](#4-directory-structure)
5. [Tech Stack](#5-tech-stack)
6. [User Roles & Permissions](#6-user-roles--permissions)
7. [Core Domain Models](#7-core-domain-models)
8. [Frontend Architecture](#8-frontend-architecture)
9. [The Design Engine](#9-the-design-engine)
10. [The Pricing Engine](#10-the-pricing-engine)
11. [Product Catalog & Lead Generation](#11-product-catalog--lead-generation)
12. [Vendor Marketplace](#12-vendor-marketplace)
13. [White-Label Licensing System](#13-white-label-licensing-system)
14. [API Surface](#14-api-surface)
15. [Key Architectural Decisions](#15-key-architectural-decisions)
16. [Known Gotchas & Risks](#16-known-gotchas--risks)
17. [Reference](#17-reference)

---

## 1. What is Inspace?

Inspace is a three-sided marketplace platform that reimagines interior design for the Indian home-buying market. It serves three distinct user groups with interconnected value:

| Side | User | Value Proposition |
|---|---|---|
| **B2C** | Homeowner | Design any room online — drag-and-drop layout, style selection, instant pricing. No designer needed. |
| **B2B** | Furniture brands / Local vendors | Qualified homeowner leads piped directly from design intent. Marketplace for carpenters, electricians, painters. |
| **B2B** | Builders & real-estate firms | White-label design-and-quote tool to offer home buyers as a value-add sales closer. |

The core insight: **design intent is the highest-intent lead signal in home improvement**. A homeowner who has laid out their room, picked finishes, and received a price quote is ready to buy — Inspace captures that intent at the source and routes it to the right suppliers.

---

## 2. Business Model & Revenue Streams

### Revenue Stream 1: B2C Design Tool

```
┌─────────────────────────────────────────────────────────────────┐
│  Homeowner Flow                                                 │
│                                                                 │
│  1. Select room type (living/bedroom/kitchen/bathroom)          │
│  2. Input dimensions or draw floor plan                          │
│  3. Choose style profile (modern, traditional, minimal, etc.)   │
│  4. System generates 2D layout + 3D preview                      │
│  5. Browse & select products (furniture, finishes, materials)   │
│  6. Auto-priced quote with itemized breakdown                    │
│  7. Export / share / save                                        │
└─────────────────────────────────────────────────────────────────┘
```

**Monetization models** (selectable at launch):
- **Freemium**: 1 free room design → ₹199/room or ₹999/month unlimited
- **Pay-per-quote**: Free design, ₹99 to unlock detailed quote with vendor pricing
- **Premium**: ₹499/room includes 3D walkthrough + materials list + vendor matching

### Revenue Stream 2: Lead Generation + Marketplace

```
Furniture brands:
  Pay-per-lead (₹50–500 depending on room value tier)
  Subscription tiers: Basic (50 leads/mo), Pro (200), Enterprise (unlimited)

Local vendors (carpenters, electricians, painters, plumbers):
  Commission: 5–10% per job booked through platform
  Verification fee: ₹999 one-time for badge + profile
  Featured listings: ₹499/month for top placement
```

**Lead qualification pipeline**:
```
Design created → Intent signals extracted → Score matched to brands/vendors
     ↓
Brand receives: room type, budget range, style preference, location PIN code
Vendor receives: job scope, estimated hours, location, timeline
     ↓
Brand pays per qualified lead → Vendor pays per completed job
```

### Revenue Stream 3: White-Label Licensing

```
Builder/Real-estate firm:
  Setup fee: ₹1,50,000 (branded platform, custom domain, onboarding)
  Monthly license: ₹25,000–₹75,000 (tiered by unit sales volume)
  Per-transaction: ₹0 (or reduced 2% if using Inspace marketplace)
  Premium: ₹1,50,000/month includes dedicated account manager + custom catalog
```

**White-label offering**:
- Custom subdomain / custom domain
- Builder's logo + brand colors
- Curated catalog of their preferred vendors
- Bulk pricing negotiated by builder
- Sales team dashboard: "See the homes your buyers design"
- Proposal export with builder letterhead

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER                                                               │
│                                                                             │
│  ┌─────────────────────────┐  ┌────────────────────────────────────────┐   │
│  │  Next.js App (SSR)      │  │  Mobile Web (PWA)                      │   │
│  │  - Public pages (SEO)   │  │  - Design viewer                       │   │
│  │  - Design studio (CSR)  │  │  - Quote access                        │   │
│  │  - Vendor dashboard     │  │  - Vendor job management               │   │
│  │  - Builder admin panel  │  └────────────────────────────────────────┘   │
│  │  - 3D viewer            │                                                │
│  └─────────────────────────┘                                                │
│              │                                          │                    │
│         ┌────┴────┐                              ┌─────┴─────┐             │
│         │  CDN    │                              │ WebSocket │             │
│         │(images, │                              │ (live 3D  │             │
│         │ fonts)  │                              │  collab)  │             │
│         └─────────┘                              └───────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
              │                                          │
              ▼                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  API GATEWAY (Cloudflare / AWS API Gateway)                                 │
│  - Rate limiting, auth, CORS, caching                                       │
│  - Route: /api/v1/* → backend                                                │
│  - Route: /ws/* → WebSocket handler                                          │
└─────────────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  BACKEND LAYER (Node.js / NestJS + Python FastAPI for engines)              │
│                                                                             │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐    │
│  │  Core API (NestJS) │  │  Design Engine     │  │  Pricing Engine    │    │
│  │  - Auth / Users    │  │  (Python FastAPI)  │  │  (Python FastAPI)  │    │
│  │  - Room CRUD       │  │  - Layout gen      │  │  - Cost calc       │    │
│  │  - Product catalog │  │  - Style matching   │  │  - Labor rates     │    │
│  │  - Orders          │  │  - Space planning   │  │  - Margin engine   │    │
│  │  - Marketplace     │  │  - 3D scene gen     │  │  - Discount rules  │    │
│  │  - License mgmt    │  └────────────────────┘  └────────────────────┘    │
│  │  - Lead pipeline   │                                                      │
│  └────────────────────┘                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  DATA LAYER                                                                 │
│                                                                             │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐    │
│  │  PostgreSQL         │  │  Redis             │  │  S3 / CloudFront   │    │
│  │  - Users + profiles │  │  - Session store   │  │  - Room renders    │    │
│  │  - Rooms + designs  │  │  - Job queue       │  │  - Product images  │    │
│  │  - Products catalog │  │  - Rate limiter    │  │  - User uploads    │    │
│  │  - Orders + quotes  │  │  - Real-time       │  │  - 3D model assets │    │
│  │  - Vendors + leads  │  │  - Pub/sub         │  └────────────────────┘    │
│  │  - Licenses + tiers │  └────────────────────┘                             │
│  └────────────────────┘                                                      │
│                                                                             │
│  ┌────────────────────┐  ┌────────────────────┐                             │
│  │  Elasticsearch     │  │  PostgreSQL (times- │                             │
│  │  - Product search  │  │  caledb for analytics│                            │
│  │  - Vendor search   │  │  - Lead metrics     │                             │
│  │  - Geo queries     │  │  - Revenue reports  │                             │
│  └────────────────────┘  │  - Platform health  │                             │
│                          └────────────────────┘                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Directory Structure

```
.
├── frontend/                         # Next.js 14 app
│   ├── app/
│   │   ├── (public)/                 # Public pages (SEO-optimized SSR)
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── pricing/
│   │   │   ├── for-brands/
│   │   │   ├── for-vendors/
│   │   │   └── for-builders/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── otp-verify/
│   │   ├── (app)/                    # Authenticated app shell
│   │   │   ├── dashboard/
│   │   │   ├── rooms/
│   │   │   │   ├── [roomId]/
│   │   │   │   │   ├── design/      # 2D floor-plan editor
│   │   │   │   │   ├── preview/     # 3D walkthrough
│   │   │   │   │   └── quote/       # Itemized pricing
│   │   │   ├── marketplace/
│   │   │   │   ├── products/
│   │   │   │   └── vendors/
│   │   │   └── orders/
│   │   ├── vendor/                   # Vendor dashboard
│   │   │   ├── profile/
│   │   │   ├── jobs/
│   │   │   └── earnings/
│   │   └── builder/                  # White-label admin
│   │       ├── settings/
│   │       ├── buyers/
│   │       ├── catalog/
│   │       └── reports/
│   ├── components/
│   │   ├── design-studio/           # Core design tool components
│   │   │   ├── FloorPlan.tsx         # 2D canvas (Fabric.js / custom SVG)
│   │   │   ├── RoomCanvas.tsx        # Three.js 3D viewer
│   │   │   ├── StyleSelector.tsx
│   │   │   ├── ProductPalette.tsx    # Drag products into room
│   │   │   ├── DimensionInput.tsx
│   │   │   └── QuoteBreakdown.tsx
│   │   ├── marketplace/
│   │   ├── vendor/
│   │   ├── builder/
│   │   └── ui/                       # Shared primitives (shadcn-style)
│   ├── lib/
│   │   ├── design-engine/            # Client-side design helpers
│   │   │   ├── layout-rules.ts       # Space planning constraints
│   │   │   ├── style-themes.ts       # Style definitions (colors, materials)
│   │   │   └── product-placer.ts     # Auto-placement suggestions
│   │   ├── pricing/                  # Client-side quote estimation
│   │   │   ├── cost-calculator.ts
│   │   │   └── labor-rates.ts
│   │   ├── api.ts                    # API client (fetch wrapper)
│   │   ├── types.ts                  # Domain types
│   │   └── utils/
│   └── styles/
├── backend/
│   ├── apps/
│   │   ├── core/                     # NestJS main app
│   │   │   ├── src/
│   │   │   │   ├── modules/
│   │   │   │   │   ├── auth/         # OTP, Google, phone auth
│   │   │   │   │   ├── users/
│   │   │   │   │   ├── rooms/
│   │   │   │   │   ├── designs/
│   │   │   │   │   ├── quotes/
│   │   │   │   │   ├── products/
│   │   │   │   │   ├── marketplace/
│   │   │   │   │   ├── orders/
│   │   │   │   │   ├── leads/
│   │   │   │   │   ├── vendors/
│   │   │   │   │   └── licensing/
│   │   │   │   ├── common/           # Guards, decorators, filters
│   │   │   │   └── main.ts
│   │   │   └── package.json
│   │   └── engines/                  # Python FastAPI microservices
│   │       ├── design-engine/
│   │       │   ├── main.py
│   │       │   ├── routers/
│   │       │   ├── services/
│   │       │   │   ├── layout_generator.py
│   │       │   │   ├── style_matcher.py
│   │       │   │   ├── space_planner.py
│   │       │   │   └── scene_builder.py
│   │       │   └── pyproject.toml
│   │       ├── pricing-engine/
│   │       │   ├── main.py
│   │       │   ├── routers/
│   │       │   ├── services/
│   │       │   │   ├── cost_calculator.py
│   │       │   │   ├── labor_rate_resolver.py
│   │       │   │   ├── margin_engine.py
│   │       │   │   └── discount_applier.py
│   │       │   └── pyproject.toml
│   │       └── lead-engine/
│   │           ├── main.py
│   │           ├── routers/
│   │           ├── services/
│   │           │   ├── lead_scorer.py
│   │           │   └── matcher.py
│   │           └── pyproject.toml
│   └── shared/
│       ├── proto/                    # gRPC / protobuf contracts
│       └── sdk/                      # Shared client libraries
├── infrastructure/
│   ├── terraform/
│   ├── kubernetes/
│   └── docker/
├── tests/                            # Integration + e2e tests
├── docs/
└── scripts/
```

---

## 5. Tech Stack

| Tier | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js 14 (React 18, TypeScript strict) | SSR for SEO on public pages, CSR for design studio |
| **3D Rendering** | Three.js + @react-three/fiber + drei | Browser-based 3D walkthroughs without plugins |
| **2D Canvas** | Fabric.js or custom SVG + d3 | Floor plan editor with snap-to-grid, resize, rotate |
| **Styling** | Tailwind CSS v4 + CSS Modules | Utility-first, consistent design system |
| **UI Primitives** | shadcn/ui (Radix) | Accessible, composable headless components |
| **State** | Zustand (design state) + React Query (server state) | Design state is local+ephemeral; server data is cached+synced |
| **Backend** | NestJS (Node.js) | Opinionated, modular, TypeScript-native. Great for CRUD-heavy apps with auth, roles, permissions. |
| **Engines** | Python FastAPI (separate microservices) | Design layout, pricing rules, lead scoring — CPU-bound or rules-heavy logic benefits from Python ecosystem |
| **Database** | PostgreSQL 16 | Relational integrity, JSONB for flexible product attributes, PostGIS for geo queries |
| **Search** | Elasticsearch / Meilisearch | Full-text product search, faceted filters, geo-location |
| **Cache** | Redis 7 | Session store, rate limiter, job queue (Bull), pub/sub for real-time |
| **File Storage** | S3-compatible (AWS / DigitalOcean Spaces) + CloudFront CDN | Room renders, product images, 3D model assets |
| **Auth** | Firebase Auth / Supabase Auth / Custom OTP | Phone OTP for Indian market (critical), Google OAuth secondary |
| **Payments** | Razorpay / Stripe | Indian payment gateway with EMI, UPI, net banking |
| **Maps** | Mapbox / Google Maps | Vendor location, service area polygons |
| **Queue** | Bull (Redis-backed) | Async jobs: 3D rendering, PDF quote generation, lead email |
| **Infra** | Docker + Kubernetes + Terraform | Scalable, reproducible deploys |
| **CI/CD** | GitHub Actions | Lint, test, build, deploy per branch |

---

## 6. User Roles & Permissions

### Role Hierarchy

```
                  ┌─────────────────┐
                  │  Super Admin    │  (platform owner)
                  │  (internal)     │
                  └────────┬────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
   ┌────────────┐  ┌────────────┐  ┌────────────┐
   │ Homeowner  │  │   Brand    │  │  Builder   │  (white-label tenant)
   │ (B2C)      │  │  (B2B)     │  │  Admin     │
   └────────────┘  └────────────┘  └───────┬────┘
                                           │
                                           ▼
                                  ┌────────────────┐
                                  │ Builder Buyer  │
                                  │ (same as       │
                                  │  homeowner but │
                                  │  under builder)│
                                  └────────────────┘
```

### Permissions Matrix

| Feature | Homeowner | Brand | Vendor | Builder Admin | Builder Buyer | Super Admin |
|---|---|---|---|---|---|---|
| Design room | ✓ | — | — | — | ✓ | ✓ |
| View catalog | ✓ | — | — | ✓ (curated) | ✓ (curated) | ✓ |
| Get quote | ✓ | — | — | — | ✓ | ✓ |
| Purchase products | ✓ | — | — | — | ✓ (via builder) | ✓ |
| List products | — | ✓ | — | ✓ (curated) | — | ✓ |
| Receive leads | — | ✓ | ✓ | — | — | ✓ |
| View vendor jobs | — | — | ✓ | — | — | ✓ |
| Bid on jobs | — | — | ✓ | — | — | ✓ |
| Manage license | — | — | — | ✓ | — | ✓ |
| Custom branding | — | — | — | ✓ | — | ✓ |
| View analytics | — | ✓ (own) | ✓ (own) | ✓ (portfolio) | — | ✓ (platform) |
| Manage catalog | — | ✓ (own) | — | ✓ (curated) | — | ✓ |

---

## 7. Core Domain Models

### Room

```typescript
interface Room {
  id: string;
  userId: string;
  builderId?: string;          // If created under white-label tenant

  // Dimensions
  type: RoomType;              // 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'dining' | 'homeOffice' | 'custom'
  shape: RoomShape;            // 'rectangle' | 'l-shaped' | 'custom'
  dimensions: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    walls: Wall[];             // For custom shapes — array of wall segments
  };

  // Design
  styleProfile: StyleProfile;  // { primary: Style, secondary?: Style }
  elements: RoomElement[];     // Flooring, wall finish, ceiling, lighting, furniture placements
  colorPalette: ColorScheme;

  // Pricing
  quote?: Quote;
  status: DesignStatus;        // 'draft' | 'designed' | 'quoted' | 'ordered' | 'completed'
  createdAt: Date;
  updatedAt: Date;
}
```

### Wall

```typescript
interface Wall {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  thicknessCm: number;
  openings: WallOpening[];     // Doors, windows
  finish: SurfaceFinish;       // Paint, wallpaper, tile, etc.
}
```

### RoomElement

```typescript
interface RoomElement {
  id: string;
  type: ElementType;           // 'flooring' | 'wallFinish' | 'ceiling' | 'lighting' | 'furniture' | 'decoration' | 'windowTreatment'
  category: string;            // e.g. 'vinylFlooring', 'paint', 'sofa'
  productId?: string;          // Linked catalog product (if selected from brand catalog)
  customSpec?: {               // Custom specification (if no catalog match)
    name: string;
    description: string;
    unit: string;
    quantity: number;
    estimatedUnitPrice: number;
  };
  placement: {
    position: { x: number; y: number; z?: number };
    rotation: number;
    scale: { x: number; y: number };
    wallIndex?: number;        // For wall-mounted elements
  };
  dimensions?: {               // Override for fitted elements
    widthCm: number;
    heightCm: number;
    depthCm?: number;
  };
  brandId?: string;            // Lead attribution
  price: number;               // Snapshot at time of selection
}
```

### Quote

```typescript
interface Quote {
  id: string;
  roomId: string;
  version: number;

  totals: {
    subtotal: number;          // All products + materials
    labor: number;             // Total estimated labor
    platformFee: number;       // Inspace commission
    builderMarkup?: number;    // If white-label
    tax: number;               // GST
    grandTotal: number;
  };

  lineItems: QuoteLineItem[];

  laborEstimate: {
    totalHours: number;
    trades: Array<{
      trade: string;           // 'carpenter' | 'electrician' | 'painter' | 'plumber' | 'general'
      hours: number;
      ratePerHour: number;
      subtotal: number;
    }>;
  };

  status: QuoteStatus;         // 'draft' | 'final' | 'accepted' | 'ordered'
  validUntil: Date;
}
```

### QuoteLineItem

```typescript
interface QuoteLineItem {
  id: string;
  elementId: string;
  type: 'product' | 'material' | 'labor' | 'custom';
  description: string;
  sku?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  supplierId?: string;         // Vendor fulfilling this line
  brandId?: string;            // Brand attribution
  marginType?: 'platform' | 'builder' | 'none';
}
```

### Product (Catalog)

```typescript
interface Product {
  id: string;
  brandId: string;
  name: string;
  description: string;
  category: string;            // Hierarchical: "furniture > sofa > 3-seater"
  tags: string[];
  styles: Style[];             // Which styles this product fits
  rooms: RoomType[];           // Compatible room types

  variants: ProductVariant[];  // Size, color, material combos
  basePrice: number;
  unit: string;                // 'piece' | 'sqft' | 'meter' | 'liter'

  media: {
    images: string[];
    model3d?: string;          // GLB/glTF URL
    swatchImage?: string;      // For materials
  };

  specifications: Record<string, string>;
  dimensions?: {               // Physical dimensions for space planning
    widthCm: number;
    heightCm: number;
    depthCm: number;
  };

  leadPrice: number;           // Amount brand pays per qualified lead on this product
  commissionPct: number;       // Platform commission on sale
  availability: ProductAvailability;

  metadata: {
    isActive: boolean;
    featured: boolean;
    leadOnly: boolean;         // True if this product generates leads but not direct purchase
  };
}
```

### Vendor

```typescript
interface Vendor {
  id: string;
  userId: string;

  // Profile
  businessName: string;
  trade: TradeType;            // 'carpenter' | 'electrician' | 'painter' | 'plumber' | 'contractor'
  experience: number;          // years
  description: string;
  portfolio: string[];         // Image URLs
  verified: boolean;
  rating: number;              // 1-5
  reviewCount: number;

  // Service area
  servicePinCodes: string[];
  serviceRadiusKm: number;
  baseLocation: GeoPoint;
  isRemote: boolean;           // Can work on remote designs (catalog-only vendors)

  // Pricing
  hourlyRate: number;
  minimumJobAmount: number;
  travelCharge: number;        // Per km beyond free range

  // Platform
  commissionPct: number;       // Per-job platform fee
  subscription: VendorPlan;    // 'free' | 'featured' | 'pro'
  isAvailable: boolean;
  maxConcurrentJobs: number;
}
```

### Lead

```typescript
interface Lead {
  id: string;
  roomId: string;
  userId: string;

  // Lead details
  roomType: RoomType;
  budgetRange: { min: number; max: number };
  styleProfile: StyleProfile;
  location: { pincode: string; city: string };
  timeline: 'immediate' | '1-3months' | '3-6months' | 'planning';

  // Selected products & brands
  selectedProducts: Array<{
    productId: string;
    brandId: string;
    quantity: number;
  }>;

  // Matching
  matchedBrands: LeadMatch[];
  matchedVendors: LeadMatch[];

  status: LeadStatus;          // 'fresh' | 'contacted' | 'qualified' | 'converted' | 'expired'
  score: number;               // Lead quality score (0-100)
  createdAt: Date;
}
```

### License (White-Label Tenant)

```typescript
interface License {
  id: string;
  builderId: string;
  plan: LicensePlan;           // 'basic' | 'pro' | 'enterprise'

  // Branding
  domain: string;              // Custom domain or subdomain
  brandName: string;
  logo: string;
  colors: { primary: string; secondary: string; accent: string };
  customFooter: string;

  // Features
  maxBuyers: number;           // Max registered buyers under this builder
  maxProjects: number;
  customCatalog: boolean;      // Can curate their own product catalog
  bulkPricing: boolean;
  analyticsAccess: boolean;
  apiAccess: boolean;

  // Pricing
  monthlyFee: number;
  setupFee: number;
  perTransactionFee: number;   // Override for marketplace fees

  status: 'active' | 'suspended' | 'cancelled';
  billingCycle: 'monthly' | 'quarterly' | 'annual';
}
```

---

## 8. Frontend Architecture

### Page Groups

#### Public Pages (SSR — SEO optimized)
- `/` — Landing with hero, feature showcase, pricing
- `/pricing` — Tiered pricing table
- `/for-brands` — Lead generation value prop
- `/for-vendors` — Marketplace signup
- `/for-builders` — White-label sales page
- `/examples` — Gallery of designed rooms
- `/blog/*` — Content marketing

#### Auth Pages (CSR)
- `/login` — Phone OTP or Google
- `/signup` — Role selection (homeowner/brand/vendor/builder)
- `/onboarding` — Multi-step profile setup

#### App Pages (Authenticated, CSR)
- `/dashboard` — My rooms, recent designs, saved quotes
- `/rooms/new` — Room creation wizard
- `/rooms/[roomId]/design` — 2D floor-plan editor (Fabric.js canvas)
- `/rooms/[roomId]/preview` — 3D walkthrough (Three.js)
- `/rooms/[roomId]/quote` — Itemized quote with edit actions
- `/marketplace/products` — Browse product catalog
- `/marketplace/vendors` — Browse local vendors
- `/orders` — My orders & status

#### Vendor Dashboard (CSR)
- `/vendor/profile` — Edit business profile, portfolio, service area
- `/vendor/jobs` — Available + active jobs, bid management
- `/vendor/earnings` — Payout history, commission summary

#### Builder Admin (CSR)
- `/builder/settings` — Branding, domain, plan management
- `/builder/buyers` — Registered buyers under this builder
- `/builder/catalog` — Curated product catalog management
- `/builder/reports` — Buyer activity, quote volume, conversions

### State Management Strategy

| State Type | Tool | Rationale |
|---|---|---|
| **Server state** (rooms, products, orders, leads) | React Query (TanStack Query) | Auto-caching, background refetch, optimistic updates, pagination |
| **Design state** (canvas, element positions, current selection) | Zustand | Ephemeral, local to design studio, undo/redo support |
| **Auth state** | React Context + cookies | SSR-safe, middleware-checkable |
| **UI state** (sidebar open, active tab, modals) | Zustand or local useState | Lightweight, no server sync needed |
| **Builder theme** | React Context | Injected from license config, applied as CSS variables |

### Design Studio Component Tree

```
DesignStudio (page: /rooms/[roomId]/design)
├── StudioLayout
│   ├── LeftPanel
│   │   ├── RoomTypeSelector
│   │   ├── DimensionInput             # Width × Length × Height
│   │   └── WallEditor                 # For custom shapes
│   ├── CenterCanvas
│   │   ├── FloorPlan                   # Fabric.js canvas (2D top-down)
│   │   │   ├── WallRenderer
│   │   │   ├── ElementRenderer        # Furniture, fixtures on floor plan
│   │   │   ├── DimensionOverlay       # Measurement annotations
│   │   │   └── SnapGrid
│   │   └── ViewToggle                 # 2D ↔ 3D toggle
│   ├── RightPanel
│   │   ├── StyleSelector              # Style profile picker
│   │   ├── ProductPalette             # Drag-and-drop product browser
│   │   │   ├── CategoryTabs
│   │   │   ├── SearchBar
│   │   │   ├── FilterChips
│   │   │   └── ProductCard[]          # Draggable
│   │   └── ElementPropertiesInspector # Selected element details
│   └── BottomBar
│       ├── UndoRedoControls
│       ├── ZoomControls
│       └── QuoteButton                # "Get Price Estimate"
└── QuoteDrawer                         # Slide-out quote panel
    ├── QuoteBreakdown
    │   ├── ProductLineItems
    │   ├── LaborEstimate
    │   ├── FeeBreakdown
    │   └── TotalSummary
    ├── Actions
    │   ├── SaveQuote
    │   ├── ShareQuote
    │   ├── OrderNow                   # Proceed to checkout
    │   └── ExportPDF
    └── LeadCapturePrompt               # "Interested? Share your contact"
```

### 3D Preview Architecture

```
Three.js Scene (RoomCanvas.tsx)
├── Scene
│   ├── Lighting
│   │   ├── AmbientLight
│   │   ├── DirectionalLight (simulated sun)
│   │   └── PointLights (fixtures from design)
│   ├── Room
│   │   ├── FloorMesh (material from flooring element)
│   │   ├── WallMeshes[] (with material from wall finish)
│   │   ├── CeilingMesh
│   │   └── Openings (doors, windows)
│   ├── Furniture[] (GLTF models from product catalog)
│   ├── Decorations[]
│   └── Camera
│       ├── OrbitControls
│       └── WalkthroughPath (optional guided tour)
├── PostProcessing
│   ├── AmbientOcclusion
│   └── ToneMapping
└── UI Overlay
    ├── ProductLabels (clickable)
    └── MeasurementToggles
```

---

## 9. The Design Engine

The design engine is the core intellectual property — it translates room dimensions + style preferences into a realistic, buildable interior design with product recommendations.

### Layout Generator Service

**Input**: Room dimensions, shape, style profile, budget range
**Output**: Arranged RoomElement[] with positions, sizes, and product suggestions

**Rules engine approach** (not AI — deterministic, explainable):

```
For each room type, define a zone system:

Example — Living Room (3 zones):
  Zone A: Seating area (center/focal)
  Zone B: Entertainment (wall-mounted)
  Zone C: Passage (clear, minimum 60cm)

For each zone:
  1. Determine from style profile what elements belong
  2. Calculate available wall/floor area (subtract openings)
  3. Match from catalog: filter by style, room type, budget
  4. Place using rule-based layout:
     - Standard sofa: centered on longest wall of Zone A
     - Coffee table: centered 40cm from sofa
     - TV unit: centered on opposite wall, eye-level height
     - Rug: under coffee table, 60cm beyond sofa edge
```

**Rule categories**:
- **Clearance rules**: Minimum 60cm walkways, 90cm for primary paths
- **Proportion rules**: Rug size = room width minus 90cm; dining table = room width minus 120cm
- **Style rules**: Modern → clean lines, minimal ornament, neutral + 1 accent; Traditional → ornate, rich wood, symmetry
- **Fitting rules**: Modular kitchen cabinets → full wall coverage with standard module widths (30/40/50/60/80cm)

### Style Matcher

```python
STYLE_PROFILES = {
    "modern": {
        "colors": ["neutral-white", "warm-grey", "charcoal", "accent-teal"],
        "materials": ["matte-laminate", "glass", "metal", "engineered-wood"],
        "furniture_shapes": ["geometric", "low-profile", "modular"],
        "lighting": ["recessed", "track", "linear-pendant"],
        "flooring": ["engineered-wood", "large-format-tiles", "polished-concrete"],
    },
    "traditional": {
        "colors": ["warm-beige", "rich-brown", "cream", "accent-burgundy"],
        "materials": ["solid-wood", "marble", "silk", "brass"],
        "furniture_shapes": ["curved", "ornate", "substantial"],
        "lighting": ["chandelier", "table-lamp", "wall-sconce"],
        "flooring": ["marble", "vitrified-tiles", "solid-wood-flooring"],
    },
    "minimalist": {
        "colors": ["pure-white", "light-grey", "black", "single-accent"],
        "materials": ["matte-finish", "concrete", "glass", "steel"],
        "furniture_shapes": ["linear", "floating", "hidden-storage"],
        "lighting": ["recessed", "linear", "indirect"],
        "flooring": ["continuous- flooring", "micro-cement", "large-porcelain"],
    },
    "scandinavian": {
        "colors": ["white", "light-wood", "pastel", "black-accents"],
        "materials": ["natural-wood", "wool", "linen", "ceramic"],
        "furniture_shapes": ["simple", "functional", "organic"],
        "lighting": ["warm-ambient", "floor-lamps", "paper-lanterns"],
        "flooring": ["light-wood-planks", "white-washed-wood"],
    },
    "industrial": {
        "colors": ["grey", "brick-red", "black", "raw-metal"],
        "materials": ["exposed-brick", "concrete", "reclaimed-wood", "steel"],
        "furniture_shapes": ["utility", "repurposed", "open-shelving"],
        "lighting": ["bare-bulb", "cage", "track"],
        "flooring": ["polished-concrete", "dark-wood", "large-format-tiles"],
    },
}
```

### Scene Builder (3D)

Takes the layout output and:
1. Generates a Three.js scene JSON
2. Loads GLTF models for each product (from catalog or generic placeholders)
3. Applies materials/textures from style profile
4. Positions everything according to layout coordinates
5. Sets up default camera angle (isometric by default)
6. Returns scene URL (pre-rendered thumbnail + interactive viewer)

---

## 10. The Pricing Engine

### Cost Calculation Pipeline

```
Input: Room + RoomElement[]
                │
                ▼
    1. Resolve product prices
       - If productId exists → catalog unit price × quantity
       - If customSpec → estimatedUnitPrice × quantity
       - If bulk pricing applicable → apply builder's negotiated rate
                │
                ▼
    2. Calculate material quantities
       - Flooring: room area × 1.1 (10% wastage)
       - Paint: wall area / coveragePerLiter × number of coats
       - Tiles: wall area / tileArea × 1.15 (15% wastage)
       - Baseboard: room perimeter × 1.05
                │
                ▼
    3. Estimate labor
       - By trade, by task, by region
       - Labor rate database: hourly rates per PIN code
       - Task time database: "install modular kitchen" = 40 hrs
       - Travel charge if vendor is remote
                │
                ▼
    4. Apply margins
       - Platform fee: configurable % (default 10%)
       - Builder markup: if white-label, builder's configured %
       - Brand commission: deducted from product cost
                │
                ▼
    5. Calculate tax
       - GST: 5% on products < ₹1000, 12% on ₹1000-5000, 18% above
       - Labor: 5% GST (India's composition scheme)
                │
                ▼
    Output: Quote with itemized line items
```

### Labor Rate Resolver

```python
# Pre-seeded table, updated quarterly
LABOR_RATES_BY_PINCODE = {
    "110001": {  # Central Delhi
        "carpenter": {"hourly": 450, "min_job": 3000},
        "electrician": {"hourly": 400, "min_job": 1500},
        "painter": {"hourly": 350, "min_job": 2000},
        "plumber": {"hourly": 400, "min_job": 1500},
        "general": {"hourly": 300, "min_job": 1000},
    },
    "400001": {  # South Mumbai
        "carpenter": {"hourly": 550, "min_job": 4000},
        ...
    },
}

TASK_TIME_ESTIMATES = {
    "modular_kitchen_installation": {
        "total_hours": 40,
        "trades": [{"trade": "carpenter", "hours": 30}, {"trade": "plumber", "hours": 5}, {"trade": "electrician", "hours": 5}],
    },
    "room_painting": {
        "total_hours": 16,
        "trades": [{"trade": "painter", "hours": 14}, {"trade": "general", "hours": 2}],
    },
    "flooring_installation_per_100sqft": {
        "total_hours": 6,
        "trades": [{"trade": "general", "hours": 6}],
    },
}
```

### Discount Rules Engine

```python
# Ordered by priority (first matching rule wins)
DISCOUNT_RULES = [
    {
        "name": "new_user_welcome",
        "condition": lambda quote, user: user.created_at > now() - timedelta(days=7),
        "discount": 0.10,  # 10%
    },
    {
        "name": "bulk_rooms",
        "condition": lambda quote, user: user.active_rooms_count >= 3,
        "discount": 0.15,
    },
    {
        "name": "builder_tier",
        "condition": lambda quote, user: user.license_plan == "enterprise",
        "discount": 0.20,  # Passed to buyer
    },
    {
        "name": "seasonal_promo",
        "condition": lambda quote, user: is_in_promo_period(),
        "discount": 0.05,
    },
]
```

---

## 11. Product Catalog & Lead Generation

### Brand Onboarding Flow

```
Brand signs up → Brand profile setup → Payment method → Upload catalog
     │                                                            │
     ▼                                                            ▼
Approval queue ← Super Admin reviews ← Auto-validation (format,
    │                                       image dimensions,
    ▼                                       pricing thresholds)
Brand activated → Products live in catalog → Lead generation begins
```

### Catalog Product Matching

When a homeowner designs a room and places elements, the system matches their selections to catalog products:

```python
def match_products(
    room_type: RoomType,
    element_type: ElementType,
    style: Style,
    budget_min: float,
    budget_max: float,
    constraints: dict,
) -> list[ScoredProduct]:
    """
    1. Filter: product.rooms includes room_type
    2. Filter: element_type matches product category
    3. Filter: product.styles includes any of [style, style.secondary]
    4. Filter: basePrice between budget_min and budget_max
    5. Rank by: style match score × price proximity × brand rating
    6. Return top 5 with score
    """
```

### Lead Scoring & Routing

```python
def score_lead(lead: Lead) -> LeadScored:
    score = 50  # Base

    # Recency
    if lead.created_at > now() - timedelta(hours=24):
        score += 20

    # Budget quality
    if lead.budget_range.max > 200000:
        score += 15
    elif lead.budget_range.max > 100000:
        score += 10

    # Specificity (selected specific products vs. generic)
    if len(lead.selected_products) > 0:
        score += 15 * min(1.0, len(lead.selected_products) / 5)

    # Timeline urgency
    urgency_map = {"immediate": 20, "1-3months": 10, "3-6months": 0, "planning": -10}
    score += urgency_map.get(lead.timeline, 0)

    # Location density (more vendors available → higher match confidence)
    vendor_count = count_vendors_in_pincode(lead.location.pincode)
    score += min(10, vendor_count * 2)

    return LeadScored(lead=lead, score=min(100, max(0, score)))
```

**Lead routing**:
- Score ≥ 80 → Instant push to brand + vendor (SMS + email + in-app)
- Score ≥ 50 → Daily digest to brand, instant to vendor
- Score < 50 → Weekly digest only

---

## 12. Vendor Marketplace

### Vendor Job Lifecycle

```
Homeowner accepts quote
    │
    ▼
System splits quote into trade-specific jobs
(e.g., carpentry work, painting, electrical)
    │
    ▼
Jobs published to matching vendors
    ├── Auto-match: top 3 vendors by location + trade + rating
    └── Open bidding: all eligible vendors see job
    │
    ▼
Vendors quote their price + availability
    │
    ▼
Homeowner selects vendor (or platform recommends best match)
    │
    ▼
Job confirmed → Milestone-based payments (via Razorpay)
    ├── 25% on start
    ├── 50% on 50% completion
    └── 25% on completion
    │
    ▼
Work completed → Review & rating
```

### Vendor Ranking Algorithm

```python
def rank_vendors(job: Job, vendors: list[Vendor]) -> list[ScoredVendor]:
    scored = []
    for v in vendors:
        score = 0

        # Proximity
        distance_km = geo_distance(job.location, v.base_location)
        if distance_km <= v.serviceRadiusKm:
            score += 30 * (1 - distance_km / v.serviceRadiusKm)

        # Rating
        score += 20 * (v.rating / 5.0)

        # Completion rate
        completion_rate = v.completed_jobs / max(1, v.total_jobs)
        score += 20 * completion_rate

        # Response time (hours)
        response_hours = v.avg_response_hours or 999
        score += 15 * max(0, 1 - response_hours / 24)

        # Portfolio match (has done similar jobs)
        if job.trade in v.completed_trades:
            score += 15

        # Subscription boost
        boost = {"free": 0, "featured": 10, "pro": 20}
        score += boost.get(v.subscription, 0)

        scored.append(ScoredVendor(vendor=v, score=score))

    return sorted(scored, key=lambda x: x.score, reverse=True)
```

---

## 13. White-Label Licensing System

### Tenant Isolation Model

```
┌─────────────────────────────────────────────────────────────┐
│  Shared Infrastructure                                       │
│  - PostgreSQL (row-level tenant isolation via builder_id)    │
│  - Redis (namespaced keys: builder:{id}:*)                   │
│  - S3 (prefix: builder/{id}/)                                │
│  - Elasticsearch (index per tenant or filter alias)          │
└─────────────────────────────────────────────────────────────┘
```

All queries filter by `builder_id`:

```prisma
model Room {
  id        String  @id @default(cuid())
  builderId String? // Null for direct Inspace users

  // Every query includes:
  // WHERE builderId = currentBuilderId OR builderId IS NULL
}
```

### Tenant Onboarding Flow

```
Builder signs up on /for-builders → Selects plan → Payment
    │
    ▼
License row created → Custom subdomain provisioned
    ├── DNS CNAME → inspace-builder.com
    ├── SSL cert (auto via Cloudflare)
    └── CDN origin path: /builder/{id}/*
    │
    ▼
Branding setup wizard
    ├── Upload logo
    ├── Set brand colors (→ CSS variables injected into layout)
    ├── Custom domain (optional: builder.com instead of builder.inspace.com)
    └── Curate initial product catalog
    │
    ▼
Launch
    ├── Builder sends branded link to buyers
    └── Buyer signs up under builder's tenant
```

### White-Label Feature Tiers

| Feature | Basic (₹25K/mo) | Pro (₹50K/mo) | Enterprise (₹1.5L/mo) |
|---|---|---|---|
| Max buyers | 50 | 200 | Unlimited |
| Custom domain | Subdomain only | Custom domain | Custom domain |
| Brand colors | ✓ | ✓ | ✓ |
| Product catalog | Full Inspace catalog | Curated catalog | Curated + custom pricing |
| Bulk pricing | — | Up to 10 products | Unlimited |
| Buyer analytics | Basic | Advanced | Advanced + export |
| API access | — | Read-only | Read-write |
| Priority support | Email | Email + phone | Dedicated manager |
| Marketplace fee | 10% | 7% | 2% |

---

## 14. API Surface

### Core API (NestJS)

#### Auth Module
```
POST   /api/v1/auth/otp/send          # Send OTP to phone
POST   /api/v1/auth/otp/verify        # Verify OTP + return tokens
POST   /api/v1/auth/google             # Google OAuth
POST   /api/v1/auth/refresh            # Refresh access token
POST   /api/v1/auth/logout
GET    /api/v1/auth/me                  # Current user profile
PATCH  /api/v1/auth/me                  # Update profile
```

#### Rooms Module
```
POST   /api/v1/rooms                   # Create room
GET    /api/v1/rooms                   # List my rooms (paginated)
GET    /api/v1/rooms/:id               # Get room with elements
PATCH  /api/v1/rooms/:id               # Update room info
DELETE /api/v1/rooms/:id               # Delete room
PATCH  /api/v1/rooms/:id/elements      # Batch update elements
POST   /api/v1/rooms/:id/duplicate     # Clone room design
```

#### Quotes Module
```
POST   /api/v1/quotes                  # Generate quote for a room
GET    /api/v1/quotes/:id              # Get quote with line items
PATCH  /api/v1/quotes/:id/accept       # Accept quote
PATCH  /api/v1/quotes/:id/decline      # Decline quote
GET    /api/v1/quotes/:id/pdf          # Download PDF quote
```

#### Products Module
```
GET    /api/v1/products                # List catalog (search, filter, paginate)
GET    /api/v1/products/:id            # Product detail with variants
POST   /api/v1/products                # Brand: add product
PATCH  /api/v1/products/:id            # Brand: update product
DELETE /api/v1/products/:id            # Brand: remove product
POST   /api/v1/products/bulk           # Brand: bulk upload (CSV/JSON)
```

#### Marketplace Module
```
GET    /api/v1/marketplace/vendors     # List vendors (search, filter by pincode/trade)
GET    /api/v1/marketplace/vendors/:id # Vendor profile
POST   /api/v1/marketplace/jobs        # Create job from quote line items
GET    /api/v1/marketplace/jobs        # List jobs (vendor: available bids, homeowner: my jobs)
POST   /api/v1/marketplace/jobs/:id/bid # Vendor: submit bid
PATCH  /api/v1/marketplace/jobs/:id/assign # Homeowner: select vendor
```

#### Leads Module
```
POST   /api/v1/leads                   # Create lead (triggered on quote interest)
GET    /api/v1/leads                   # Brand: list my leads
PATCH  /api/v1/leads/:id/status        # Brand: update lead status
GET    /api/v1/leads/stats             # Brand: lead conversion stats
```

#### Licensing Module
```
POST   /api/v1/builder/onboard         # Create new tenant
GET    /api/v1/builder/settings        # Get tenant config
PATCH  /api/v1/builder/settings        # Update branding/domain
GET    /api/v1/builder/buyers          # List registered buyers
GET    /api/v1/builder/reports         # Analytics dashboard data
PATCH  /api/v1/builder/plan            # Upgrade/downgrade plan
```

### Design Engine (Python FastAPI)

```
POST   /api/v1/engine/design/layout
  Input:  { room, style_profile, budget_range, constraints? }
  Output: { elements, layout, suggested_products }

POST   /api/v1/engine/design/autofill
  Input:  { room (partial) }
  Output: { room (complete with default dimensions), style_suggestions }

POST   /api/v1/engine/design/validate
  Input:  { room, elements }
  Output: { valid: bool, violations: string[] }
```

### Pricing Engine (Python FastAPI)

```
POST   /api/v1/engine/pricing/calculate
  Input:  { room, elements, pincode, builder_id?, discount_codes? }
  Output: { quote, line_items, labor_estimate }

POST   /api/v1/engine/pricing/labor-rates
  Input:  { pincode, trades[] }
  Output: { rates: { trade: { hourly, min_job } } }
```

### Lead Engine (Python FastAPI)

```
POST   /api/v1/engine/leads/score
  Input:  { lead }
  Output: { score, factors }

POST   /api/v1/engine/leads/match
  Input:  { lead }
  Output: { matched_brands: [], matched_vendors: [] }
```

---

## 15. Key Architectural Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | **Separate engines as microservices** (Python FastAPI) over monolith | Design, pricing, and lead scoring are CPU-intensive or rules-heavy. Python's ecosystem (shapely for geometry, sympy for constraints) is superior. Isolating them lets each scale independently (pricing called on every design change; design called once per layout). |
| 2 | **NestJS for core CRUD** over Python for everything | The core app is auth, users, rooms, orders, marketplace — standard CRUD with complex relational queries. NestJS's decorator-driven modules, Prisma ORM, and GraphQL support make this faster to build than Django REST or FastAPI alone for this volume of entity types. |
| 3 | **Rules-based design engine over AI/ML** | Homeowners need predictable, explainable room layouts. "Why is the sofa there?" should have a rule-based answer, not a model inference. AI is reserved for inspiration (style matching, product recommendations) but the core spatial layout is deterministic. |
| 4 | **Fabric.js (2D) + Three.js (3D) dual canvas** over pure 3D | 2D floor plan is faster to build, more intuitive for dimension input, and works on low-end devices. 3D is a preview layer, not the primary interaction mode. Decoupling them means the 2D editor works offline, and 3D rendering can be deferred to a worker or server. |
| 5 | **Phone OTP as primary auth** over email/password | Indian market reality: phone number is the universal identity. OTP via SMS or WhatsApp has >95% adoption. Email is secondary. |
| 6 | **Row-level tenant isolation (builder_id on every table)** over separate databases | White-label tenants share infrastructure but see only their data. RLS via `builder_id IS NULL OR builder_id = :current` is simpler than per-tenant DBs and keeps operational costs low. A tenant that outgrows this can be migrated to dedicated infra. |
| 7 | **Lead scoring before routing** over fire-and-forget | Brands pay per lead — sending unqualified leads destroys trust. The scoring pipeline (recency, budget, specificity, urgency, location density) ensures only high-intent leads reach brands, justifying the per-lead price. |
| 8 | **Milestone-based payments for vendor jobs** over fixed upfront | Protects both parties: homeowner doesn't pay full amount before work starts, vendor doesn't wait until completion. Razorpay's escrow-like payment links make this straightforward. |
| 9 | **React Query for server state + Zustand for design state** | Design state is local, ephemeral, and changes rapidly (drag, rotate, resize every frame). Zustand's synchronous API and subscribe/selector pattern beat React Query for this. Everything else (rooms list, products, orders) is server-owned — React Query handles caching, refetch, pagination. |
| 10 | **Quote PDF generation as async background job** (Bull + Puppeteer) | Quotes contain 3D render screenshots, itemized tables, and brand logos. Generating this synchronously would timeout on complex rooms. Queue it, notify user when ready. |

---

## 16. Known Gotchas & Risks

### 16.1 The "Blank Canvas" Problem

A homeowner with no design knowledge may struggle with a completely blank room. Mitigation: offer **templates** (pre-designed rooms by style + room type) and **autofill** (one-click "design for me" that uses the design engine rules to fill the room).

### 16.2 Fake Product Imagery

Brands may upload low-quality or misleading product images. Mitigation:
- Mandatory minimum resolution (1200×1200)
- Auto-watermark on lead-only products
- Manual approval queue for new brands (first 10 products reviewed)
- User-submitted photos in reviews (eventually replace brand imagery)

### 16.3 Vendor No-Show Risk

A vendor wins a bid and doesn't show up. Mitigation:
- Security deposit (₹2000, refunded after 3 successful jobs)
- Rating system (visible during vendor selection)
- Replacement guarantee: platform finds alternate vendor within 24h or refunds

### 16.4 Dimensional Mismatch

Homeowner inputs wrong dimensions → designs a room that doesn't fit their actual space. Mitigation:
- "Measure with phone" option: use camera + AR to estimate room dimensions (ARKit/ARCore)
- Verification step before quote finalization: "Confirm these dimensions match your room"
- Builder/architect verification for white-label buyers

### 16.5 Pricing Engine Drift

Labor rates or material costs change, making quotes inaccurate. Mitigation:
- Quarterly labor rate review (automated: compare to government minimum wage + inflation)
- Product price update webhook from brands (or auto-expire quotes > 30 days)
- "Price lock" option: homeowner pays 10% deposit to lock quote for 15 days

### 16.6 Lead Spam

Brands receiving low-quality leads devalues the product. Mitigation:
- Lead score threshold (below 30 = not sent)
- Brand can set minimum score filter
- Refund policy: if lead doesn't respond within 72h, brand doesn't pay
- Rate limiting on leads per room (1 lead per room per 7 days)

### 16.7 White-Label Tenant Churn

Builder signs up, uses for 2 months, churns — data orphaned. Mitigation:
- Export tool: full data dump on cancellation (rooms, quotes, buyer list)
- Grace period: 30 days after last payment before data archival
- Migration path: builder's buyers can convert to direct Inspace users

---

## 17. Reference

### File Paths (Conceptual)

| Path | Purpose |
|---|---|
| `frontend/app/(public)/page.tsx` | Landing page (SSR) |
| `frontend/app/(app)/rooms/[roomId]/design/page.tsx` | Design studio (Fabric.js 2D canvas) |
| `frontend/app/(app)/rooms/[roomId]/preview/page.tsx` | 3D walkthrough (Three.js) |
| `frontend/app/(app)/rooms/[roomId]/quote/page.tsx` | Itemized quote viewer |
| `frontend/components/design-studio/FloorPlan.tsx` | 2D canvas with drag-drop elements |
| `frontend/components/design-studio/RoomCanvas.tsx` | Three.js 3D scene renderer |
| `frontend/lib/design-engine/layout-rules.ts` | Client-side space planning constraints |
| `frontend/lib/design-engine/style-themes.ts` | Style definitions (colors, materials) |
| `backend/apps/core/src/modules/rooms/rooms.service.ts` | Room CRUD + design state management |
| `backend/apps/core/src/modules/quotes/quotes.service.ts` | Quote orchestration (calls pricing engine) |
| `backend/apps/core/src/modules/leads/leads.service.ts` | Lead creation, scoring, routing |
| `backend/apps/core/src/modules/licensing/licensing.service.ts` | White-label tenant management |
| `backend/apps/engines/design-engine/services/layout_generator.py` | Core layout rules engine |
| `backend/apps/engines/design-engine/services/style_matcher.py` | Style-to-product matching |
| `backend/apps/engines/design-engine/services/space_planner.py` | Dimension & clearance validation |
| `backend/apps/engines/design-engine/services/scene_builder.py` | Three.js scene JSON generation |
| `backend/apps/engines/pricing-engine/services/cost_calculator.py` | Product + material cost calculation |
| `backend/apps/engines/pricing-engine/services/labor_rate_resolver.py` | PIN-code-to-labor-rate lookup |
| `backend/apps/engines/pricing-engine/services/margin_engine.py` | Platform/builder margin application |
| `backend/apps/engines/pricing-engine/services/discount_applier.py` | Discount rules engine |
| `backend/apps/engines/lead-engine/services/lead_scorer.py` | Lead quality scoring |
| `backend/apps/engines/lead-engine/services/matcher.py` | Brand/vendor matching algorithm |

### Key Data Tables (PostgreSQL)

```sql
-- Core
users (id, role, phone, email, name, created_at)
profiles (user_id, preferences, address, pincode)
rooms (id, user_id, builder_id, type, shape, dimensions_json, style_profile, status, created_at)
room_elements (id, room_id, type, category, product_id, placement_json, price, brand_id)
quotes (id, room_id, version, totals_json, status, valid_until)
quote_line_items (id, quote_id, element_id, type, description, sku, quantity, unit, unit_price, total, supplier_id, brand_id)

-- Catalog + Marketplace
products (id, brand_id, name, description, category, tags, styles, rooms, base_price, unit, media_json, specifications_json, lead_price, commission_pct, is_active)
product_variants (id, product_id, sku, attributes_json, price_override, stock)
brands (id, user_id, company_name, gstin, commission_pct, is_approved)
vendors (id, user_id, business_name, trade, description, portfolio_json, verified, rating, service_area_json, hourly_rate, commission_pct, subscription, is_available)
vendor_reviews (id, vendor_id, user_id, rating, text, job_id)

-- Jobs + Orders
jobs (id, quote_id, vendor_id, trade, status, budget, bid_amount, scheduled_dates, milestone_json)
orders (id, user_id, quote_id, total, status, payment_intent_json, created_at)
order_items (id, order_id, product_id, quantity, unit_price, supplier_id)

-- Leads
leads (id, user_id, room_id, room_type, budget_range_json, location_json, timeline, selected_products_json, score, status)
lead_matches (id, lead_id, match_type, match_id, score, contacted_at, converted_at)

-- Licensing
licenses (id, builder_id, plan, domain, brand_name, brand_colors_json, max_buyers, features_json, monthly_fee, status, billing_cycle)
license_buyers (id, license_id, user_id, created_at)

-- Payments + Analytics
transactions (id, user_id, type, amount, gateway_ref, status, created_at)
analytics_events (id, user_id, event_type, properties_json, created_at) -- Amplitude/Mixpanel-style
```

### Core Engine Endpoints

```
POST /api/v1/engine/design/layout
POST /api/v1/engine/design/autofill
POST /api/v1/engine/design/validate
POST /api/v1/engine/pricing/calculate
POST /api/v1/engine/pricing/labor-rates
POST /api/v1/engine/leads/score
POST /api/v1/engine/leads/match
```

### Key Environment Variables

```env
# App
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
ENCRYPTION_KEY=...

# Auth
OTP_PROVIDER=sms/whatsapp
SMS_API_KEY=...
GOOGLE_CLIENT_ID=...

# Payments
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

# Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=inspace-assets
CDN_URL=https://assets.inspace.com

# Engines
DESIGN_ENGINE_URL=http://design-engine:8001
PRICING_ENGINE_URL=http://pricing-engine:8002
LEAD_ENGINE_URL=http://lead-engine:8003

# White-Label
DEFAULT_BUILDER_PLAN=basic
MAX_FREE_BUYERS=50
TRIAL_PERIOD_DAYS=14

# Platform
PLATFORM_COMMISSION_PCT=10
LEAD_MIN_SCORE=30
QUOTE_EXPIRY_DAYS=30
```

---

*This document is a greenfield architectural blueprint. All paths, schemas, and business rules are proposed and should be validated against real market data before implementation.*
