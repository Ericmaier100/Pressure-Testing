// This file runs privately on Vercel's servers — it never runs in the visitor's browser.
// Your Anthropic API key stays here, never exposed to the public website.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic, examples, feedback } = req.body || {};
  if (!topic) {
    return res.status(400).json({ error: "Missing topic" });
  }

  const system =
    "You are an expert item-writer for the NCEES PE Civil: Structural exam. Generate original multiple-choice practice questions that test understanding of civil/structural engineering concepts at PE Civil: Structural exam style and difficulty. Write strictly from general engineering knowledge — do not reference, quote, closely paraphrase, or reconstruct content from any specific textbook, commercial test-prep product, or code document (e.g. ACI, ASCE, NCEES materials). Vary the numeric values, units, and scenario framing meaningfully across questions so each generation is distinct from prior ones. Respond ONLY with valid minified JSON and nothing else — no markdown fences, no commentary. Schema: {\"questions\":[{\"question\":string,\"options\":[string,string,string,string],\"correctIndex\":number,\"explanation\":string}]}. Keep each explanation under 35 words.";

  let user = `Generate 4 original practice questions for the topic "${topic}" at PE Civil: Structural exam difficulty.`;

  // If we have examples of this product's OWN already-approved questions on this
  // topic, include them as grounding — new questions should match their accuracy,
  // rigor, and style, without copying them. This is our own reviewed content, not
  // an external copyrighted source, so referencing it directly is safe.
  if (Array.isArray(examples) && examples.length > 0) {
    const exampleText = examples
      .map((ex, i) => `Example ${i + 1}:\nQ: ${ex.question}\nOptions: ${ex.options.join(" | ")}\nCorrect: ${ex.options[ex.correctIndex]}\nExplanation: ${ex.explanation}`)
      .join("\n\n");
    user += `\n\nHere are ${examples.length} examples of questions on this topic that have already been reviewed and approved by a licensed engineer for accuracy and style. Use them ONLY as a reference for the expected level of rigor, tone, and question structure — do not copy their content, numbers, or scenarios. Write genuinely new questions inspired by the same standard of quality:\n\n${exampleText}`;
  }

  // Recent admin rejection reasons for this topic — short plain-text notes only,
  // never the rejected question text itself, to keep this addition cheap in tokens.
  if (Array.isArray(feedback) && feedback.length > 0) {
    const feedbackText = feedback.map((f, i) => `${i + 1}. ${f}`).join("\n");
    user += `\n\nAn admin previously rejected generated questions on this topic for these reasons — avoid repeating these issues:\n${feedbackText}`;
  }

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
        max_tokens: 1200,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      // Forward Anthropic's real status and message instead of always saying 200 —
      // otherwise a bad/missing API key, no credits, or a rate limit all look
      // identical to the frontend as "no content came back."
      console.error("Anthropic API error:", response.status, data);
      return res.status(response.status).json({ error: data.error?.message || `Anthropic API error (status ${response.status})` });
    }
    res.status(200).json(data);
  } catch (e) {
    console.error("generate-questions handler failed:", e);
    res.status(500).json({ error: "Generation failed — server couldn't reach Anthropic." });
  }
}
