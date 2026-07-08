# Database Schema
# AI Social Media Story Studio

**Version:** 1.0.0
**Last Updated:** 2026-07-01
**Database:** PostgreSQL 15+ via Neon

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CORE ENTITIES                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│     User     │──────▶│ Organization │◀──────│   Member     │
│              │  1:N  │              │  N:1  │              │
└──────────────┘       └──────────────┘       └──────────────┘
       │                      │                      │
       │                      │                      │
       ▼                      ▼                      │
┌──────────────┐       ┌──────────────┐              │
│   Account    │       │   Project    │◀─────────────┘
│   (OAuth)    │       │              │
└──────────────┘       └──────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │    Image     │   │    Story     │   │  Generation  │
    │              │   │              │   │              │
    └──────────────┘   └──────────────┘   └──────────────┘
                                                │
                              ┌─────────────────┼─────────────────┐
                              │                 │                 │
                              ▼                 ▼                 ▼
                       ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                       │GeneratedPost │  │ PostScore    │  │ PostVariant  │
                       │              │  │              │  │              │
                       └──────────────┘  └──────────────┘  └──────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPPORTING ENTITIES                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   BrandKit   │       │   Template   │       │ Subscription │
│              │       │              │       │              │
└──────────────┘       └──────────────┘       └──────────────┘
       │                                             │
       │                                             │
       ▼                                             ▼
┌──────────────┐                             ┌──────────────┐
│ BrandAsset   │                             │    Usage     │
│              │                             │              │
└──────────────┘                             └──────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   AuditLog   │       │   ApiUsage   │       │   Settings   │
│              │       │              │       │              │
└──────────────┘       └──────────────┘       └──────────────┘
```

---

## Table Definitions

### Users & Authentication

#### `users`
Core user entity linked to OAuth accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email |
| email_verified | TIMESTAMP | | When email was verified |
| name | VARCHAR(255) | | Display name |
| image | TEXT | | Profile image URL |
| role | ENUM | DEFAULT 'user' | System role (user, admin) |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| deleted_at | TIMESTAMP | | Soft delete timestamp |

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified TIMESTAMP WITH TIME ZONE,
  name VARCHAR(255),
  image TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

---

#### `accounts`
OAuth provider accounts linked to users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | Associated user |
| type | VARCHAR(50) | NOT NULL | Account type (oauth) |
| provider | VARCHAR(50) | NOT NULL | OAuth provider |
| provider_account_id | VARCHAR(255) | NOT NULL | Provider's user ID |
| refresh_token | TEXT | | OAuth refresh token |
| access_token | TEXT | | OAuth access token |
| expires_at | INTEGER | | Token expiration |
| token_type | VARCHAR(50) | | Token type |
| scope | TEXT | | OAuth scopes |
| id_token | TEXT | | OIDC ID token |
| session_state | TEXT | | Session state |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(50),
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
```

---

#### `sessions`
Active user sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| session_token | VARCHAR(255) | UNIQUE, NOT NULL | Session token |
| user_id | UUID | FK → users.id, NOT NULL | Associated user |
| expires | TIMESTAMP | NOT NULL | Session expiration |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(session_token);
```

---

### Organizations & Teams

#### `organizations`
Organizations/teams that users belong to.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Organization name |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly identifier |
| logo | TEXT | | Logo URL |
| plan | ENUM | DEFAULT 'free' | Subscription plan |
| stripe_customer_id | VARCHAR(255) | UNIQUE | Stripe customer ID |
| stripe_subscription_id | VARCHAR(255) | UNIQUE | Stripe subscription ID |
| credits_balance | INTEGER | DEFAULT 0 | Current credits |
| credits_monthly | INTEGER | DEFAULT 5 | Monthly credit allocation |
| billing_email | VARCHAR(255) | | Billing contact email |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo TEXT,
  plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'agency', 'enterprise')),
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  credits_balance INTEGER DEFAULT 0,
  credits_monthly INTEGER DEFAULT 5,
  billing_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_stripe_customer ON organizations(stripe_customer_id);
```

---

#### `members`
Organization membership with roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| organization_id | UUID | FK → organizations.id | Organization |
| user_id | UUID | FK → users.id | User |
| role | ENUM | DEFAULT 'editor' | Member role |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_members_org_id ON members(organization_id);
CREATE INDEX idx_members_user_id ON members(user_id);
```

---

### Projects & Content

#### `projects`
Main container for user content generation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| organization_id | UUID | FK → organizations.id | Owning organization |
| user_id | UUID | FK → users.id | Creating user |
| brand_kit_id | UUID | FK → brand_kits.id | Applied brand kit |
| template_id | UUID | FK → templates.id | Applied template |
| title | VARCHAR(255) | NOT NULL | Project title |
| description | TEXT | | Project description |
| status | ENUM | DEFAULT 'draft' | Project status |
| credits_used | INTEGER | DEFAULT 0 | Credits consumed |
| metadata | JSONB | | Additional metadata |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |
| archived_at | TIMESTAMP | | Archive timestamp |

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  brand_kit_id UUID REFERENCES brand_kits(id) ON DELETE SET NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  credits_used INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_projects_org_id ON projects(organization_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created ON projects(created_at DESC);
```

---

#### `images`
Uploaded images associated with projects.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| project_id | UUID | FK → projects.id | Parent project |
| original_url | TEXT | NOT NULL | Original image URL |
| enhanced_url | TEXT | | Enhanced image URL |
| thumbnail_url | TEXT | | Thumbnail URL |
| filename | VARCHAR(255) | NOT NULL | Original filename |
| mime_type | VARCHAR(100) | NOT NULL | MIME type |
| size_bytes | INTEGER | NOT NULL | File size in bytes |
| width | INTEGER | | Image width |
| height | INTEGER | | Image height |
| order_index | INTEGER | DEFAULT 0 | Display order |
| analysis | JSONB | | AI analysis results |
| enhancements | JSONB | | Enhancement settings |
| is_primary | BOOLEAN | DEFAULT false | Primary image flag |
| quality_score | DECIMAL(3,2) | | Quality rating 0-1 |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  enhanced_url TEXT,
  thumbnail_url TEXT,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  order_index INTEGER DEFAULT 0,
  analysis JSONB DEFAULT '{}',
  enhancements JSONB DEFAULT '{}',
  is_primary BOOLEAN DEFAULT false,
  quality_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_images_project_id ON images(project_id);
CREATE INDEX idx_images_order ON images(project_id, order_index);
```

---

#### `stories`
User-written stories for projects.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| project_id | UUID | FK → projects.id, UNIQUE | Parent project |
| original_content | TEXT | NOT NULL | Original user story |
| enhanced_content | TEXT | | AI-enhanced story |
| analysis | JSONB | | Story analysis results |
| word_count | INTEGER | | Word count |
| reading_time_seconds | INTEGER | | Estimated read time |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  original_content TEXT NOT NULL,
  enhanced_content TEXT,
  analysis JSONB DEFAULT '{}',
  word_count INTEGER,
  reading_time_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stories_project_id ON stories(project_id);
```

---

#### `generations`
AI generation runs for a project.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| project_id | UUID | FK → projects.id | Parent project |
| user_id | UUID | FK → users.id | Initiating user |
| status | ENUM | DEFAULT 'pending' | Generation status |
| step | VARCHAR(50) | | Current processing step |
| progress | INTEGER | DEFAULT 0 | Progress percentage |
| error_message | TEXT | | Error details if failed |
| started_at | TIMESTAMP | | Processing start time |
| completed_at | TIMESTAMP | | Processing completion |
| tokens_used | INTEGER | DEFAULT 0 | Total tokens consumed |
| cost_cents | INTEGER | DEFAULT 0 | Estimated cost |
| metadata | JSONB | | Generation metadata |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

```sql
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  step VARCHAR(50),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  tokens_used INTEGER DEFAULT 0,
  cost_cents INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_generations_project_id ON generations(project_id);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_generations_created ON generations(created_at DESC);
```

---

#### `generated_posts`
Platform-specific generated content.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| generation_id | UUID | FK → generations.id | Parent generation |
| platform | ENUM | NOT NULL | Target platform |
| content_type | ENUM | DEFAULT 'post' | Content type |
| hook | TEXT | | Attention-grabbing opener |
| caption | TEXT | NOT NULL | Main content |
| cta | TEXT | | Call to action |
| hashtags | TEXT[] | | Array of hashtags |
| has_emojis | BOOLEAN | DEFAULT true | Contains emojis |
| is_short_version | BOOLEAN | DEFAULT false | Short version flag |
| character_count | INTEGER | | Content length |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

```sql
CREATE TABLE generated_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id UUID NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  platform VARCHAR(30) NOT NULL CHECK (platform IN (
    'instagram', 'facebook', 'linkedin', 'tiktok', 'x',
    'threads', 'pinterest', 'google_business', 'youtube_community'
  )),
  content_type VARCHAR(30) DEFAULT 'post' CHECK (content_type IN (
    'post', 'story', 'carousel', 'reel', 'article', 'blog',
    'newsletter', 'press_release', 'email', 'podcast_notes',
    'video_script', 'voiceover'
  )),
  hook TEXT,
  caption TEXT NOT NULL,
  cta TEXT,
  hashtags TEXT[] DEFAULT '{}',
  has_emojis BOOLEAN DEFAULT true,
  is_short_version BOOLEAN DEFAULT false,
  character_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_generated_posts_generation ON generated_posts(generation_id);
CREATE INDEX idx_generated_posts_platform ON generated_posts(platform);
```

---

#### `post_scores`
Scoring metrics for generated posts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| post_id | UUID | FK → generated_posts.id, UNIQUE | Scored post |
| virality_score | INTEGER | | Virality prediction 0-100 |
| emotion_score | INTEGER | | Emotional impact 0-100 |
| engagement_score | INTEGER | | Engagement prediction 0-100 |
| readability_score | INTEGER | | Readability rating 0-100 |
| storytelling_score | INTEGER | | Narrative quality 0-100 |
| seo_score | INTEGER | | SEO optimization 0-100 |
| overall_score | INTEGER | | Weighted overall 0-100 |
| suggestions | JSONB | | Improvement suggestions |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

```sql
CREATE TABLE post_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID UNIQUE NOT NULL REFERENCES generated_posts(id) ON DELETE CASCADE,
  virality_score INTEGER CHECK (virality_score >= 0 AND virality_score <= 100),
  emotion_score INTEGER CHECK (emotion_score >= 0 AND emotion_score <= 100),
  engagement_score INTEGER CHECK (engagement_score >= 0 AND engagement_score <= 100),
  readability_score INTEGER CHECK (readability_score >= 0 AND readability_score <= 100),
  storytelling_score INTEGER CHECK (storytelling_score >= 0 AND storytelling_score <= 100),
  seo_score INTEGER CHECK (seo_score >= 0 AND seo_score <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  suggestions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_post_scores_post_id ON post_scores(post_id);
CREATE INDEX idx_post_scores_overall ON post_scores(overall_score DESC);
```

---

### Brand & Templates

#### `brand_kits`
Saved brand assets and guidelines.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| organization_id | UUID | FK → organizations.id | Owning organization |
| name | VARCHAR(255) | NOT NULL | Brand kit name |
| is_default | BOOLEAN | DEFAULT false | Default for org |
| business_name | VARCHAR(255) | | Business name |
| logo_url | TEXT | | Logo URL |
| primary_color | VARCHAR(7) | | Primary hex color |
| secondary_color | VARCHAR(7) | | Secondary hex color |
| accent_color | VARCHAR(7) | | Accent hex color |
| font_heading | VARCHAR(100) | | Heading font |
| font_body | VARCHAR(100) | | Body font |
| voice | TEXT | | Brand voice description |
| mission | TEXT | | Mission statement |
| target_audience | TEXT | | Target audience description |
| preferred_hashtags | TEXT[] | | Preferred hashtags |
| preferred_cta | TEXT | | Default CTA |
| website | VARCHAR(255) | | Website URL |
| social_handles | JSONB | | Social media handles |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

```sql
CREATE TABLE brand_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  business_name VARCHAR(255),
  logo_url TEXT,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  accent_color VARCHAR(7),
  font_heading VARCHAR(100),
  font_body VARCHAR(100),
  voice TEXT,
  mission TEXT,
  target_audience TEXT,
  preferred_hashtags TEXT[] DEFAULT '{}',
  preferred_cta TEXT,
  website VARCHAR(255),
  social_handles JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_brand_kits_org_id ON brand_kits(organization_id);
```

---

#### `templates`
Industry-specific content templates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| organization_id | UUID | FK → organizations.id | Owner (null = system) |
| name | VARCHAR(255) | NOT NULL | Template name |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL identifier |
| description | TEXT | | Template description |
| industry | VARCHAR(50) | | Target industry |
| thumbnail_url | TEXT | | Preview image |
| tone | VARCHAR(50) | | Default tone |
| style | JSONB | | Style settings |
| prompts | JSONB | | AI prompt customizations |
| is_system | BOOLEAN | DEFAULT false | System template flag |
| is_published | BOOLEAN | DEFAULT true | Visibility flag |
| usage_count | INTEGER | DEFAULT 0 | Times used |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  industry VARCHAR(50),
  thumbnail_url TEXT,
  tone VARCHAR(50),
  style JSONB DEFAULT '{}',
  prompts JSONB DEFAULT '{}',
  is_system BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_templates_org_id ON templates(organization_id);
CREATE INDEX idx_templates_industry ON templates(industry);
CREATE INDEX idx_templates_slug ON templates(slug);
```

---

### Billing & Usage

#### `subscriptions`
Subscription records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| organization_id | UUID | FK → organizations.id | Subscribed org |
| stripe_subscription_id | VARCHAR(255) | UNIQUE | Stripe sub ID |
| stripe_price_id | VARCHAR(255) | | Stripe price ID |
| plan | ENUM | NOT NULL | Plan name |
| status | VARCHAR(30) | NOT NULL | Subscription status |
| current_period_start | TIMESTAMP | | Billing period start |
| current_period_end | TIMESTAMP | | Billing period end |
| cancel_at_period_end | BOOLEAN | DEFAULT false | Pending cancellation |
| canceled_at | TIMESTAMP | | Cancellation date |
| trial_start | TIMESTAMP | | Trial start date |
| trial_end | TIMESTAMP | | Trial end date |
| metadata | JSONB | | Additional metadata |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('free', 'starter', 'pro', 'agency', 'enterprise')),
  status VARCHAR(30) NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_org_id ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
```

---

#### `usage_records`
Credit usage tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| organization_id | UUID | FK → organizations.id | Organization |
| user_id | UUID | FK → users.id | Acting user |
| generation_id | UUID | FK → generations.id | Related generation |
| credits_used | INTEGER | NOT NULL | Credits consumed |
| action | VARCHAR(50) | NOT NULL | Usage action type |
| description | TEXT | | Usage description |
| metadata | JSONB | | Additional data |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

```sql
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  credits_used INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usage_org_id ON usage_records(organization_id);
CREATE INDEX idx_usage_created ON usage_records(created_at DESC);
CREATE INDEX idx_usage_action ON usage_records(action);
```

---

#### `api_usage`
External API call tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| organization_id | UUID | FK → organizations.id | Organization |
| generation_id | UUID | FK → generations.id | Related generation |
| service | VARCHAR(50) | NOT NULL | External service |
| endpoint | VARCHAR(255) | | API endpoint |
| tokens_input | INTEGER | DEFAULT 0 | Input tokens |
| tokens_output | INTEGER | DEFAULT 0 | Output tokens |
| cost_cents | INTEGER | DEFAULT 0 | Cost in cents |
| latency_ms | INTEGER | | Response time ms |
| status_code | INTEGER | | HTTP status |
| error | TEXT | | Error message |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

```sql
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  service VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255),
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  cost_cents INTEGER DEFAULT 0,
  latency_ms INTEGER,
  status_code INTEGER,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_usage_org_id ON api_usage(organization_id);
CREATE INDEX idx_api_usage_service ON api_usage(service);
CREATE INDEX idx_api_usage_created ON api_usage(created_at DESC);
```

---

### System & Audit

#### `audit_logs`
Security and activity audit trail.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id | Acting user |
| organization_id | UUID | FK → organizations.id | Context org |
| action | VARCHAR(100) | NOT NULL | Action performed |
| entity_type | VARCHAR(50) | | Affected entity type |
| entity_id | UUID | | Affected entity ID |
| changes | JSONB | | Change details |
| ip_address | INET | | Client IP |
| user_agent | TEXT | | Client user agent |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_org_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
```

---

#### `settings`
User and organization settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id | User settings |
| organization_id | UUID | FK → organizations.id | Org settings |
| key | VARCHAR(100) | NOT NULL | Setting key |
| value | JSONB | NOT NULL | Setting value |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT settings_scope CHECK (
    (user_id IS NOT NULL AND organization_id IS NULL) OR
    (user_id IS NULL AND organization_id IS NOT NULL)
  ),
  UNIQUE(user_id, key),
  UNIQUE(organization_id, key)
);

CREATE INDEX idx_settings_user_id ON settings(user_id);
CREATE INDEX idx_settings_org_id ON settings(organization_id);
```

---

## JSONB Schemas

### Image Analysis Schema

```json
{
  "subjects": ["person", "building"],
  "people_count": 2,
  "animals": [],
  "objects": ["table", "chair"],
  "setting": "indoor",
  "location_type": "office",
  "mood": "professional",
  "emotions": ["confident", "happy"],
  "colors": {
    "dominant": "#2C3E50",
    "palette": ["#2C3E50", "#ECF0F1", "#E74C3C"]
  },
  "lighting": "natural",
  "time_of_day": "afternoon",
  "weather": null,
  "text_detected": ["Company Logo"],
  "logos": ["Brand X"],
  "landmarks": [],
  "quality": {
    "overall": 0.85,
    "sharpness": 0.9,
    "exposure": 0.8,
    "noise": 0.1,
    "composition": 0.85
  },
  "issues": ["slight underexposure"],
  "brand_elements": {
    "colors_match": true,
    "logo_visible": true
  },
  "recommended_crops": {
    "instagram_square": { "x": 0, "y": 50, "width": 1000, "height": 1000 },
    "instagram_portrait": { "x": 0, "y": 0, "width": 800, "height": 1000 }
  }
}
```

### Story Analysis Schema

```json
{
  "main_message": "Company celebrates 10 year anniversary",
  "emotional_tone": "celebratory",
  "sentiment": 0.8,
  "audience": "business professionals",
  "key_events": ["anniversary celebration", "team gathering"],
  "key_themes": ["milestone", "growth", "teamwork"],
  "entities": {
    "people": ["John Smith", "Jane Doe"],
    "organizations": ["Company X"],
    "locations": ["New York"],
    "dates": ["2026-01-15"]
  },
  "missing_details": ["specific achievements", "future plans"],
  "engagement_opportunities": [
    "Add specific growth numbers",
    "Include customer testimonials"
  ],
  "word_count": 150,
  "reading_level": "8th grade",
  "consistency_with_images": true,
  "consistency_issues": []
}
```

### Post Suggestions Schema

```json
[
  {
    "type": "hook",
    "current_score": 65,
    "suggestion": "Start with a surprising statistic",
    "example": "After 10 years, we've served over 100,000 customers...",
    "potential_improvement": 15
  },
  {
    "type": "cta",
    "current_score": 70,
    "suggestion": "Add urgency to the call to action",
    "example": "Join us this week as we celebrate!",
    "potential_improvement": 10
  }
]
```

---

## Migrations Strategy

### Initial Migration Order

1. Enable UUID extension
2. Create enum types
3. Create users table
4. Create accounts table
5. Create sessions table
6. Create organizations table
7. Create members table
8. Create brand_kits table
9. Create templates table
10. Create projects table
11. Create images table
12. Create stories table
13. Create generations table
14. Create generated_posts table
15. Create post_scores table
16. Create subscriptions table
17. Create usage_records table
18. Create api_usage table
19. Create audit_logs table
20. Create settings table
21. Seed system templates

### Rollback Strategy

Each migration includes a corresponding down migration. In case of issues:

1. Identify failed migration
2. Run rollback to previous state
3. Fix migration script
4. Re-run migration

### Zero-Downtime Migrations

For production deployments:

1. Add new columns as nullable
2. Deploy code that writes to both old and new columns
3. Backfill data
4. Deploy code that only uses new columns
5. Drop old columns in subsequent migration
