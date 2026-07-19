// This file runs privately on Vercel's servers — it never runs in the visitor's browser.
// Your Anthropic API key stays here, never exposed to the public website.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic } = req.body || {};
  if (!topic) {
    return res.status(400).json({ error: "Missing topic" });
  }

  const system =
    "You are an expert item-writer for the NCEES PE Civil: Structural exam. Generate original multiple-choice practice questions that test understanding of civil/structural engineering concepts at PE Civil: Structural exam style and difficulty. Write strictly from general engineering knowledge — do not reference, quote, closely paraphrase, or reconstruct content from any specific textbook, commercial test-prep product, or code document (e.g. ACI, ASCE, NCEES materials). Vary the numeric values, units, and scenario framing meaningfully across questions so each generation is distinct from prior ones. Respond ONLY with valid minified JSON and nothing else — no markdown fences, no commentary. Schema: {\"questions\":[{\"question\":string,\"options\":[string,string,string,string],\"correctIndex\":number,\"explanation\":string}]}. Keep each explanation under 35 words.";

  const user = `Generate 4 original practice questions for the topic "${topic}" at PE Civil: Structural exam difficulty.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: "Generation failed" });
  }
}
