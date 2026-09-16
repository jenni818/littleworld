import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function cleanJson(text: string) {
  return text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });
    }
    const body = await req.json();
    const name = String(body.name || "Little Explorer").slice(0, 40);
    const age = Math.min(7, Math.max(3, Number(body.age) || 4));
    const city = String(body.city || "").slice(0, 80);
    const country = String(body.country || "").slice(0, 80);
    const interests = Array.isArray(body.interests) ? body.interests.slice(0, 8).join(", ") : "";

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `
Create today's "Little World" audio news episode for ${name}, age ${age}, who lives in ${city}, ${country}.
Interests: ${interests || "animals, science, nature and the world"}.

Use web search to find FRESH, REAL, verifiable stories from today or the last 48 hours whenever possible.
Select exactly 3:
1) one close-to-home story relevant to ${city || country} or ${country};
2) one wider-world story;
3) one science/nature/animal/space/discovery story.

Editorial rules:
- This is for a ${age}-year-old. Be warm, concrete, curious, and easy to understand.
- Avoid graphic violence, death details, crime, sexual content, disturbing medical details, frightening imagery, adult scandals, and partisan/political horse-race coverage.
- Do not simply simplify adult headlines: first decide whether the story belongs in a young child's world.
- Important events can be included only when genuinely useful and must be explained gently without frightening detail.
- Prefer primary sources and high-quality reporting. Each story MUST have one real source URL you actually used.
- Do not invent facts, URLs, quotes, dates, or source names.
- Make the spoken fullScript approximately 450–550 words and under 3900 characters so it can be narrated in one TTS request.
- Do not read URLs or source names aloud in fullScript.
- End with one imaginative, open-ended Question of the Day for discussion with a parent.
- Use ${name}'s name naturally, but not excessively.
- No markdown in any JSON field.

Return ONLY valid JSON with exactly this shape:
{
  "dateLabel": "Wednesday, September 16",
  "title": "${name}'s Little World",
  "route": "Singapore → Africa → Space",
  "stories": [
    {"type":"local","emoji":"🇸🇬","title":"short title","teaser":"one sentence","sourceName":"publisher","sourceUrl":"https://..."},
    {"type":"world","emoji":"🌏","title":"short title","teaser":"one sentence","sourceName":"publisher","sourceUrl":"https://..."},
    {"type":"discovery","emoji":"✨","title":"short title","teaser":"one sentence","sourceName":"publisher","sourceUrl":"https://..."}
  ],
  "question": "one question",
  "fullScript": "complete natural spoken episode including opening, transitions, three stories, question, and friendly sign-off"
}`;

    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      tools: [{ type: "web_search", search_context_size: "medium" }],
      input: prompt,
      store: false
    });

    const text = cleanJson(response.output_text || "");
    let data;
    try { data = JSON.parse(text); }
    catch { return NextResponse.json({ error: "The news was found, but the episode format was invalid. Please try again." }, { status: 502 }); }

    if (!Array.isArray(data.stories) || data.stories.length !== 3 || !data.fullScript) {
      return NextResponse.json({ error: "The generated episode was incomplete. Please try again." }, { status: 502 });
    }
    if (data.fullScript.length > 4096) data.fullScript = data.fullScript.slice(0, 4050) + " Bye-bye!";

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Episode generation failed: ${message}` }, { status: 500 });
  }
}
