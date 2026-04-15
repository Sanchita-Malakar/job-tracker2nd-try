// app/api/analytics/resume-score/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const { jobDescription, resumeText } = body;

  if (!jobDescription?.trim()) return NextResponse.json({ error: "jobDescription required" }, { status: 400 });
  if (!resumeText?.trim())     return NextResponse.json({ error: "resumeText required" },    { status: 400 });

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json", // forces pure JSON output — no markdown fences
    },
  });

  const prompt = `You are a precise resume compatibility analyser.

Job Description:
${jobDescription.slice(0, 4000)}

Resume / Notes:
${resumeText.slice(0, 4000)}

Respond with ONLY this JSON structure:
{
  "score": <integer 0-100>,
  "matched_keywords": [<skills/tools present in both — max 12>],
  "missing_critical": [<important required skills absent from resume — max 6>],
  "missing_nice": [<preferred skills absent — max 4>],
  "summary": "<2 actionable sentences: what is strong and what to add>"
}`;

  const result = await model.generateContent(prompt);
  const raw    = result.response.text().trim();

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.score !== "number") throw new Error("invalid");

    return NextResponse.json({
      score:            Math.min(100, Math.max(0, Math.round(parsed.score))),
      matched_keywords: Array.isArray(parsed.matched_keywords) ? parsed.matched_keywords.slice(0, 12) : [],
      missing_critical: Array.isArray(parsed.missing_critical) ? parsed.missing_critical.slice(0, 6)  : [],
      missing_nice:     Array.isArray(parsed.missing_nice)     ? parsed.missing_nice.slice(0, 4)      : [],
      summary:          typeof parsed.summary === "string"     ? parsed.summary                       : "",
    });
  } catch {
    console.error("[resume-score] Parse error:", raw);
    return NextResponse.json({ error: "Failed to parse response. Try again." }, { status: 500 });
  }
}