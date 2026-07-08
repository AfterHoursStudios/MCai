# AI Social Media Story Studio
## Mission Connect Edition

Transforms health mission stories and photos into viral social media content.

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your credentials

npx prisma generate
npx prisma db push
npm run dev
```

## How It Works

1. **Connects to Mission Connect** → Fetches worker groups and stories
2. **User selects content** → Browse stories with photos
3. **AI generates posts** → Creates platform-optimized content
4. **Post to social media** → Share to Facebook, Instagram, etc.

## API Usage

```bash
# Get available worker groups
GET /api/generate

# Generate content from a story
POST /api/generate
{
  "groupId": "13",
  "platforms": ["instagram", "facebook", "linkedin"]
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API key |
| `MC_CLIENT_KEY` | Mission Connect client key |

## Project Structure

```
src/
├── app/api/generate/     # Generation API
├── lib/
│   ├── mission-connect/  # MC integration
│   ├── ai/               # OpenAI generation
│   └── db/               # Database
└── components/           # UI components
```

## Tech Stack

- Next.js 14 + TypeScript
- PostgreSQL + Prisma
- OpenAI GPT-4
- Tailwind CSS
