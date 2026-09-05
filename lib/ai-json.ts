import OpenAI from "openai";

export function openRouterClient(title: string) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("AI service is not configured. Add OPENROUTER_API_KEY to the environment.");
  return new OpenAI({
    apiKey: key,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: { "X-Title": title },
  });
}

function extractJson(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
  throw new Error("AI returned invalid JSON.");
}

export async function generateJson({
  client,
  model,
  system,
  user,
  maxTokens,
}: {
  client: OpenAI;
  model: string;
  system: string;
  user: string;
  maxTokens: number;
}) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const out = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      const raw = out.choices[0]?.message?.content;
      if (!raw) throw new Error("AI returned no content.");
      try {
        return extractJson(raw);
      } catch (error) {
        lastError = error;
        if (attempt === 0) continue;
      }
    } catch (error) {
      lastError = error;
      break;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("AI generation failed.");
}

export function aiModel() {
  return process.env.OPENROUTER_MODEL || "openai/gpt-5-mini";
}
