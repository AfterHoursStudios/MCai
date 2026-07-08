# Folder Structure
# AI Social Media Story Studio

**Version:** 1.0.0
**Last Updated:** 2026-07-01

---

## Complete Project Structure

```
story-studio/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # CI pipeline
│   │   ├── deploy-staging.yml        # Staging deployment
│   │   └── deploy-production.yml     # Production deployment
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml
│
├── .husky/
│   ├── pre-commit                    # Lint staged files
│   └── commit-msg                    # Commit message validation
│
├── prisma/
│   ├── migrations/                   # Database migrations
│   │   └── 20260701000000_init/
│   │       └── migration.sql
│   ├── schema.prisma                 # Database schema
│   └── seed.ts                       # Database seeding
│
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── logo-dark.svg
│   │   └── og-image.png
│   ├── fonts/
│   │   └── inter/
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   └── robots.txt
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Authentication routes
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── verify/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/              # Dashboard routes (protected)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx          # Projects list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Create project
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Project detail
│   │   │   │       ├── edit/
│   │   │   │       │   └── page.tsx  # Edit project
│   │   │   │       ├── generate/
│   │   │   │       │   └── page.tsx  # Generation view
│   │   │   │       └── results/
│   │   │   │           └── page.tsx  # Results view
│   │   │   ├── brand-kit/
│   │   │   │   ├── page.tsx          # Brand kits list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Edit brand kit
│   │   │   ├── templates/
│   │   │   │   └── page.tsx          # Templates browser
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx          # General settings
│   │   │   │   ├── profile/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── organization/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── team/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── billing/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (marketing)/              # Marketing routes (public)
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── pricing/
│   │   │   │   └── page.tsx
│   │   │   ├── features/
│   │   │   │   └── page.tsx
│   │   │   ├── about/
│   │   │   │   └── page.tsx
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   │   ├── help/
│   │   │   │   └── page.tsx
│   │   │   ├── privacy/
│   │   │   │   └── page.tsx
│   │   │   ├── terms/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (admin)/                  # Admin routes (protected)
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx          # Admin dashboard
│   │   │   │   ├── users/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── organizations/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── templates/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── analytics/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts      # NextAuth handler
│   │   │   ├── trpc/
│   │   │   │   └── [trpc]/
│   │   │   │       └── route.ts      # tRPC handler
│   │   │   ├── webhooks/
│   │   │   │   ├── stripe/
│   │   │   │   │   └── route.ts      # Stripe webhooks
│   │   │   │   └── resend/
│   │   │   │       └── route.ts      # Email webhooks
│   │   │   ├── upload/
│   │   │   │   ├── presign/
│   │   │   │   │   └── route.ts      # Presigned URLs
│   │   │   │   └── complete/
│   │   │   │       └── route.ts      # Upload completion
│   │   │   └── health/
│   │   │       └── route.ts          # Health check
│   │   │
│   │   ├── error.tsx                 # Error boundary
│   │   ├── not-found.tsx             # 404 page
│   │   ├── loading.tsx               # Loading state
│   │   ├── layout.tsx                # Root layout
│   │   ├── providers.tsx             # Client providers
│   │   └── globals.css               # Global styles
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── command.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── form.tsx
│   │   │   ├── label.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── aspect-ratio.tsx
│   │   │   └── index.ts              # Barrel export
│   │   │
│   │   ├── layouts/
│   │   │   ├── marketing-header.tsx
│   │   │   ├── marketing-footer.tsx
│   │   │   ├── dashboard-header.tsx
│   │   │   ├── dashboard-sidebar.tsx
│   │   │   ├── dashboard-nav.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── page-header.tsx
│   │   │
│   │   ├── forms/
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   ├── project-form.tsx
│   │   │   ├── story-form.tsx
│   │   │   ├── brand-kit-form.tsx
│   │   │   ├── profile-form.tsx
│   │   │   ├── organization-form.tsx
│   │   │   └── invite-form.tsx
│   │   │
│   │   ├── features/
│   │   │   ├── upload/
│   │   │   │   ├── dropzone.tsx
│   │   │   │   ├── image-preview.tsx
│   │   │   │   ├── image-grid.tsx
│   │   │   │   ├── upload-progress.tsx
│   │   │   │   └── image-sorter.tsx
│   │   │   │
│   │   │   ├── editor/
│   │   │   │   ├── story-editor.tsx
│   │   │   │   ├── rich-text-editor.tsx
│   │   │   │   ├── voice-input.tsx
│   │   │   │   └── character-count.tsx
│   │   │   │
│   │   │   ├── generation/
│   │   │   │   ├── generation-wizard.tsx
│   │   │   │   ├── platform-selector.tsx
│   │   │   │   ├── content-type-selector.tsx
│   │   │   │   ├── generation-progress.tsx
│   │   │   │   ├── generation-status.tsx
│   │   │   │   └── generation-options.tsx
│   │   │   │
│   │   │   ├── results/
│   │   │   │   ├── results-view.tsx
│   │   │   │   ├── platform-tabs.tsx
│   │   │   │   ├── post-card.tsx
│   │   │   │   ├── post-preview.tsx
│   │   │   │   ├── score-card.tsx
│   │   │   │   ├── score-breakdown.tsx
│   │   │   │   ├── suggestions-list.tsx
│   │   │   │   ├── copy-button.tsx
│   │   │   │   └── export-button.tsx
│   │   │   │
│   │   │   ├── brand-kit/
│   │   │   │   ├── brand-kit-card.tsx
│   │   │   │   ├── color-picker.tsx
│   │   │   │   ├── font-selector.tsx
│   │   │   │   ├── logo-uploader.tsx
│   │   │   │   └── social-handles.tsx
│   │   │   │
│   │   │   ├── templates/
│   │   │   │   ├── template-grid.tsx
│   │   │   │   ├── template-card.tsx
│   │   │   │   └── template-preview.tsx
│   │   │   │
│   │   │   ├── billing/
│   │   │   │   ├── pricing-card.tsx
│   │   │   │   ├── pricing-table.tsx
│   │   │   │   ├── usage-chart.tsx
│   │   │   │   ├── credits-badge.tsx
│   │   │   │   └── plan-badge.tsx
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── stats-cards.tsx
│   │   │   │   ├── recent-projects.tsx
│   │   │   │   ├── quick-actions.tsx
│   │   │   │   └── activity-feed.tsx
│   │   │   │
│   │   │   └── analysis/
│   │   │       ├── image-analysis.tsx
│   │   │       ├── story-analysis.tsx
│   │   │       ├── consistency-check.tsx
│   │   │       └── analysis-card.tsx
│   │   │
│   │   └── shared/
│   │       ├── logo.tsx
│   │       ├── theme-toggle.tsx
│   │       ├── user-menu.tsx
│   │       ├── org-switcher.tsx
│   │       ├── empty-state.tsx
│   │       ├── loading-spinner.tsx
│   │       ├── error-boundary.tsx
│   │       ├── confirm-dialog.tsx
│   │       ├── data-table.tsx
│   │       ├── pagination.tsx
│   │       ├── search-input.tsx
│   │       ├── sort-button.tsx
│   │       ├── filter-button.tsx
│   │       └── date-picker.tsx
│   │
│   ├── hooks/
│   │   ├── use-debounce.ts
│   │   ├── use-local-storage.ts
│   │   ├── use-media-query.ts
│   │   ├── use-mounted.ts
│   │   ├── use-copy-to-clipboard.ts
│   │   ├── use-upload.ts
│   │   ├── use-generation-status.ts
│   │   ├── use-credits.ts
│   │   └── index.ts
│   │
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── config.ts             # NextAuth config
│   │   │   ├── providers.ts          # OAuth providers
│   │   │   └── callbacks.ts          # Auth callbacks
│   │   │
│   │   ├── db/
│   │   │   ├── index.ts              # Prisma client
│   │   │   └── queries/              # Reusable queries
│   │   │       ├── user.ts
│   │   │       ├── project.ts
│   │   │       └── organization.ts
│   │   │
│   │   ├── storage/
│   │   │   ├── client.ts             # R2/S3 client
│   │   │   ├── upload.ts             # Upload helpers
│   │   │   └── utils.ts              # Storage utilities
│   │   │
│   │   ├── email/
│   │   │   ├── client.ts             # Resend client
│   │   │   ├── templates/
│   │   │   │   ├── welcome.tsx
│   │   │   │   ├── invite.tsx
│   │   │   │   ├── generation-complete.tsx
│   │   │   │   └── subscription-update.tsx
│   │   │   └── send.ts               # Send functions
│   │   │
│   │   ├── stripe/
│   │   │   ├── client.ts             # Stripe client
│   │   │   ├── plans.ts              # Plan definitions
│   │   │   └── webhooks.ts           # Webhook handlers
│   │   │
│   │   ├── ai/
│   │   │   ├── client.ts             # OpenAI client
│   │   │   ├── prompts/
│   │   │   │   ├── image-analysis.ts
│   │   │   │   ├── story-analysis.ts
│   │   │   │   ├── content-generation.ts
│   │   │   │   ├── scoring.ts
│   │   │   │   └── enhancement.ts
│   │   │   ├── pipelines/
│   │   │   │   ├── generation.ts     # Main generation pipeline
│   │   │   │   ├── analysis.ts       # Analysis pipeline
│   │   │   │   └── enhancement.ts    # Enhancement pipeline
│   │   │   └── utils.ts              # AI utilities
│   │   │
│   │   ├── image/
│   │   │   ├── sharp.ts              # Sharp processing
│   │   │   ├── enhance.ts            # Enhancement logic
│   │   │   ├── resize.ts             # Resizing logic
│   │   │   └── utils.ts              # Image utilities
│   │   │
│   │   ├── queue/
│   │   │   ├── client.ts             # BullMQ client
│   │   │   ├── workers/
│   │   │   │   ├── generation.ts
│   │   │   │   ├── image-process.ts
│   │   │   │   └── email.ts
│   │   │   └── jobs.ts               # Job definitions
│   │   │
│   │   ├── utils/
│   │   │   ├── cn.ts                 # Classname utility
│   │   │   ├── format.ts             # Formatting helpers
│   │   │   ├── validation.ts         # Common validations
│   │   │   └── constants.ts          # App constants
│   │   │
│   │   ├── rate-limit.ts             # Rate limiting
│   │   ├── logger.ts                 # Logging utility
│   │   └── env.ts                    # Environment validation
│   │
│   ├── server/
│   │   ├── trpc/
│   │   │   ├── index.ts              # tRPC initialization
│   │   │   ├── context.ts            # Request context
│   │   │   ├── middleware.ts         # tRPC middleware
│   │   │   └── routers/
│   │   │       ├── _app.ts           # Root router
│   │   │       ├── auth.ts
│   │   │       ├── user.ts
│   │   │       ├── organization.ts
│   │   │       ├── project.ts
│   │   │       ├── image.ts
│   │   │       ├── story.ts
│   │   │       ├── generation.ts
│   │   │       ├── brand-kit.ts
│   │   │       ├── template.ts
│   │   │       ├── billing.ts
│   │   │       ├── settings.ts
│   │   │       └── admin.ts
│   │   │
│   │   ├── actions/                  # Server Actions
│   │   │   ├── auth.ts
│   │   │   ├── project.ts
│   │   │   └── generation.ts
│   │   │
│   │   └── middleware/
│   │       ├── auth.ts               # Auth middleware
│   │       ├── rate-limit.ts         # Rate limit middleware
│   │       └── audit.ts              # Audit logging
│   │
│   ├── stores/
│   │   ├── project-store.ts          # Project state
│   │   ├── upload-store.ts           # Upload state
│   │   ├── generation-store.ts       # Generation state
│   │   └── ui-store.ts               # UI state
│   │
│   ├── types/
│   │   ├── database.ts               # Prisma types
│   │   ├── api.ts                    # API types
│   │   ├── auth.ts                   # Auth types
│   │   ├── generation.ts             # Generation types
│   │   └── index.ts                  # Type exports
│   │
│   └── styles/
│       └── globals.css               # Global styles + Tailwind
│
├── tests/
│   ├── e2e/                          # Playwright tests
│   │   ├── auth.spec.ts
│   │   ├── project.spec.ts
│   │   ├── generation.spec.ts
│   │   └── fixtures/
│   │       └── test-user.ts
│   │
│   ├── integration/                  # Integration tests
│   │   ├── api/
│   │   │   ├── project.test.ts
│   │   │   └── generation.test.ts
│   │   └── setup.ts
│   │
│   └── unit/                         # Unit tests
│       ├── lib/
│       │   ├── ai.test.ts
│       │   └── image.test.ts
│       └── components/
│           └── upload.test.tsx
│
├── scripts/
│   ├── seed.ts                       # Database seeding
│   ├── migrate.ts                    # Migration helper
│   └── generate-types.ts             # Type generation
│
├── docker/
│   ├── Dockerfile                    # Production Dockerfile
│   ├── Dockerfile.dev                # Development Dockerfile
│   └── docker-compose.yml            # Local development
│
├── .env.example                      # Environment template
├── .env.local                        # Local environment (gitignored)
├── .eslintrc.js                      # ESLint config
├── .prettierrc                       # Prettier config
├── .gitignore                        # Git ignore
├── components.json                   # shadcn/ui config
├── next.config.js                    # Next.js config
├── tailwind.config.ts                # Tailwind config
├── tsconfig.json                     # TypeScript config
├── postcss.config.js                 # PostCSS config
├── playwright.config.ts              # Playwright config
├── jest.config.js                    # Jest config
├── package.json                      # Dependencies
└── README.md                         # Documentation
```

---

## Directory Responsibilities

### `/src/app`
Next.js 14 App Router pages and layouts. Uses route groups for organization:
- `(auth)` - Authentication pages (login, register)
- `(dashboard)` - Protected dashboard pages
- `(marketing)` - Public marketing pages
- `(admin)` - Admin-only pages

### `/src/components`
React components organized by type:
- `ui/` - shadcn/ui primitives
- `layouts/` - Page layouts and navigation
- `forms/` - Form components with validation
- `features/` - Feature-specific components
- `shared/` - Shared utility components

### `/src/lib`
Shared libraries and utilities:
- `auth/` - Authentication configuration
- `db/` - Database client and queries
- `storage/` - File storage operations
- `email/` - Email sending
- `stripe/` - Payment processing
- `ai/` - AI/ML operations
- `image/` - Image processing
- `queue/` - Background job processing

### `/src/server`
Server-side code:
- `trpc/` - tRPC routers and middleware
- `actions/` - Server Actions
- `middleware/` - Custom middleware

### `/src/stores`
Zustand state stores for client-side state management.

### `/src/types`
TypeScript type definitions shared across the application.

### `/prisma`
Database schema and migrations.

### `/tests`
Test files organized by type:
- `e2e/` - End-to-end Playwright tests
- `integration/` - API integration tests
- `unit/` - Component and utility unit tests

---

## Import Aliases

Configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/server/*": ["./src/server/*"]
    }
  }
}
```

Example usage:
```typescript
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { useDebounce } from '@/hooks';
import type { Project } from '@/types';
```
