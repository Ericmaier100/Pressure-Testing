// This file runs privately on Vercel's servers — it never runs in the visitor's browser.
// Your Anthropic API key stays here, never exposed to the public website.
//
// Generates an ORIGINAL SVG diagram (beam, frame, free-body diagram, chart, etc.)
// for a specific question. SVG is code — vector line-art drawn by instruction —
// not a photo, so there's nothing here that could be a copyrighted image. The
// admin still reviews the result before it's attached to a question, same as
// every other piece of AI-generated content in this app.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic, questionText, samples } = req.body || {};
  if (!questionText) {
    return res.status(400).json({ error: "Missing questionText" });
  }

  const system =
    "You are an expert technical illustrator for PE Civil: Structural exam prep. Given a question, draw an original, accurate SVG diagram that visually supports it — a beam diagram, free-body diagram, frame, load diagram, or simple chart, whichever fits. Use simple line-art: a stroke-based beam/member line, standard support symbols (pin = triangle with hatching, roller = circle under a line, fixed = hatched wall), arrows for loads, and dimension lines with labels. Use a white or transparent background, black or dark-gray strokes (#3A4750), and readable text labels (font-size 14-16px). Keep the composition simple and exam-appropriate — do not add decorative flourishes. The diagram must be an entirely original composition; do not reference, copy, or closely reconstruct any specific textbook, code document, or commercial test-prep figure. Respond ONLY with raw SVG markup starting with <svg and ending with </svg> — no markdown fences, no commentary, no XML declaration. Use a viewBox attribute (e.g. viewBox=\"0 0 500 320\") and no fixed width/height so it scales cleanly.";

  const contentBlocks = [];
  let userText = `Question this diagram is for:\n"${questionText}"${topic ? `\nTopic: ${topic}` : ""}\n\nDraw the SVG diagram now.`;

  // Sample diagrams the product owner has provided, used ONLY as style/format
  // references (line style, label conventions, symbol conventions) — never as
  // content to copy. SVG samples are included as literal markup (Claude reads
  // vector source directly, which is far more reliable than image guessing).
  // Raster samples (PNG/JPG) are included as images purely for visual style cues.
  if (Array.isArray(samples) && samples.length > 0) {
    const svgSamples = samples.filter((s) => s.svgText);
    const imageSamples = samples.filter((s) => !s.svgText && s.base64 && s.mediaType);

    if (svgSamples.length > 0) {
      const svgText = svgSamples
        .slice(0, 3)
        .map((s, i) => `Sample ${i + 1} (${s.label || "reference"}):\n${s.svgText.slice(0, 4000)}`)
        .join("\n\n");
      userText += `\n\nHere is the SVG source of ${svgSamples.length} previously-approved sample diagram(s), for style and convention reference only (line weight, label format, symbol style) — do not copy their specific geometry or content, draw something new for this question:\n\n${svgText}`;
    }

    imageSamples.slice(0, 2).forEach((s) => {
      contentBlocks.push({ type: "image", source: { type: "base64", media_type: s.mediaType, data: s.base64 } });
    });
    if (imageSamples.length > 0) {
      userText += `\n\nThe attached image(s) are additional style references (line style and layout conventions only) — draw an original diagram for this specific question, not a copy of the reference images.`;
    }
  }

  contentBlocks.push({ type: "text", text: userText });

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
        max_tokens: 3000,
        system,
        messages: [{ role: "user", content: contentBlocks }],
      }),
    });

    const data = await response.json();
    const text = (data.content || []).map((b) => b.text || "").join("");
    const start = text.indexOf("<svg");
    const end = text.lastIndexOf("</svg>");
    if (start === -1 || end === -1) {
      return res.status(502).json({ error: "The AI didn't return a usable diagram. Try again." });
    }
    const svg = text.slice(start, end + "</svg>".length);
    res.status(200).json({ svg });
  } catch (e) {
    res.status(500).json({ error: "Diagram generation failed." });
  }
}
