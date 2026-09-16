import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });
    }
    const { text } = await req.json();
    if (!text || typeof text !== "string") return NextResponse.json({ error: "Missing script." }, { status: 400 });
    if (text.length > 4096) return NextResponse.json({ error: "Script is too long for narration." }, { status: 400 });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const audio = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "marin",
      input: text,
      instructions: "Warm, bright children's radio host. Speak clearly and naturally for a four-year-old. Gentle enthusiasm, not overexcited. Add small expressive pauses between stories.",
      response_format: "mp3"
    });

    const buffer = Buffer.from(await audio.arrayBuffer());
    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "Content-Length": String(buffer.length)
      }
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Audio generation failed: ${message}` }, { status: 500 });
  }
}
