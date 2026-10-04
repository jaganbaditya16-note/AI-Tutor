import OpenAI from "openai";

export function openRouterClient(title: string) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("AI service is not configured. Add OPENROUTER_API_KEY to the environment.");
  }

  return new OpenAI({
    apiKey: key,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: { "X-Title": title },
  });
}

function parse(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    // Some providers add a short explanation around otherwise valid JSON.
  }

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1));
  }

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
  let last: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt = attempt
      ? `${system}\nRetry compactly: output complete JSON only, with short strings and no markdown.`
      : system;

    try {
      let out;
      try {
        out = await client.chat.completions.create({
          model,
          max_tokens: maxTokens,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: user },
          ],
        });
      } catch (providerError) {
        // OpenRouter can route to models/providers that reject response_format.
        // Retry the same request without that optional constraint before using
        // the normal JSON parser/retry path.
        last = providerError;
        out = await client.chat.completions.create({
          model,
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: user },
          ],
        });
      }

      const raw = out.choices[0]?.message?.content;
      if (!raw) throw new Error("AI returned no content.");
      try {
        return parse(raw);
      } catch (parseError) {
        last = parseError;
      }
    } catch (error) {
      last = error;
    }
  }

  throw last instanceof Error ? last : new Error("AI generation failed.");
}

export function aiModel() {
  return process.env.OPENROUTER_MODEL || "openai/gpt-5-mini";
}
