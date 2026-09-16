# Little World v0.2

A mobile-first MVP that creates a fresh, personalized child-friendly news episode and narrates it.

## What works

1. Parent enters child's name, age, city/country, and interests.
2. `/api/episode` uses the OpenAI Responses API with web search to find fresh real news and write a 3-story child-friendly episode.
3. `/api/speech` uses OpenAI text-to-speech to create an MP3.
4. The browser plays the generated audio and shows the three stories, Question of the Day, and parent-facing source links.

## Deploy to Vercel

1. Replace the old project files with this folder's contents.
2. In Vercel, keep **Root Directory** set to `little-world` if your GitHub repository still has the app inside that subfolder.
3. Framework Preset: **Next.js**
4. Output Directory: **Default / blank** (do NOT set it to `public`)
5. Add an environment variable in **Vercel → Project → Settings → Environment Variables**:
   - Name: `OPENAI_API_KEY`
   - Value: your OpenAI API key
6. Redeploy.

Do NOT put the API key in source code or commit `.env.local` to GitHub.

## Run locally

```bash
npm install
cp .env.example .env.local
# Put your key in .env.local
npm run dev
```

Then open http://localhost:3000.

## Current MVP limitations

- Episodes are generated on demand and are not saved.
- No login/database yet.
- No 8 AM server-side generation yet.
- No smart-speaker integration yet.
- Source URLs are generated as structured fields by the research model; parent review is still recommended during MVP testing.
- API usage has a cost.

## Suggested v0.3

Persist child profiles and episodes in Supabase, cache one episode per child/day, add scheduled generation, and improve source validation.
