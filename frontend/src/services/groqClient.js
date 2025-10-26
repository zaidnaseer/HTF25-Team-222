// backend/lib/groqClient.js
// Minimal GroqCloud client helper.
// Requires environment variables:
// - GROQ_API_KEY : your GroqCloud API key (server-side token)
// - GROQ_API_URL : the POST endpoint URL from console.groq.com (e.g. https://api.groq.com/v1/... or the provider URL)
//
// This helper sends a prompt and returns the generated text (string).
// If your provider returns a different JSON shape, adjust extraction accordingly.

export async function callGroqGenerate(prompt, options = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  const url = process.env.GROQ_API_URL;
  if (!apiKey || !url) {
    throw new Error('Missing Groq config. Set GROQ_API_KEY and GROQ_API_URL in your environment (.env).');
  }

  // Construct request body - many Groq endpoints accept { prompt, max_tokens, temperature }.
  // If your Groq provider expects a different body, change this to match their docs.
  const body = {
    prompt: prompt,
    max_tokens: options.max_tokens ?? options.maxTokens ?? 800,
    temperature: options.temperature ?? 0.6,
    // add other fields if your provider supports them (top_p, stop, etc.)
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  // Try to parse JSON if provider returns JSON
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = null;
  }

  if (!res.ok) {
    const message = json?.error?.message || json?.error || text || res.statusText;
    const err = new Error(`Groq API error: ${message}`);
    err.status = res.status;
    err.details = json || text;
    throw err;
  }

  // Extract candidate text from common shapes. Adapt as needed for the provider's response.
  if (json) {
    if (typeof json.output === 'string') return json.output;
    if (json?.choices?.[0]?.text) return json.choices[0].text;
    if (json?.candidates?.[0]?.output) return json.candidates[0].output;
    if (json?.data?.[0]?.generated_text) return json.data[0].generated_text;
    if (json?.result?.text) return json.result.text;
    // If the provider returns structured object with the text field elsewhere, inspect json and update extraction logic.
  }

  // Fallback: return raw text
  return text;
}
