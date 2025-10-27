// backend/lib/groqClient.js
// Groq API client helper for generating AI content
export async function callGroqGenerate(prompt, options = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  const url = process.env.GROQ_API_URL;

  if (!apiKey || !url) {
    throw new Error('Missing Groq config. Set GROQ_API_KEY and GROQ_API_URL in your environment (.env).');
  }

  // Use chat completions format (OpenAI-compatible)
  const body = {
    // Fast & efficient model for roadmap generation
    model: options.model || "llama-3.1-8b-instant",
    
    messages: [
      { 
        role: "system", 
        content: "You are a helpful assistant that generates structured learning roadmaps in JSON format. Always respond with valid JSON only, without any markdown formatting or explanations." 
      },
      { role: "user", content: prompt }
    ],
    
    // Optimized settings for roadmap generation
    max_tokens: options.max_tokens ?? options.maxTokens ?? 1800,
    temperature: options.temperature ?? 0.5,
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

  // Extract message content from chat completion response
  if (json?.choices?.[0]?.message?.content) {
    return json.choices[0].message.content;
  }

  // Fallback patterns for different response formats
  if (json?.choices?.[0]?.text) return json.choices[0].text;
  if (typeof json?.output === 'string') return json.output;
  if (json?.candidates?.[0]?.output) return json.candidates[0].output;
  if (json?.data?.[0]?.generated_text) return json.data[0].generated_text;
  if (json?.result?.text) return json.result.text;

  // Last resort: return raw text
  return text;
}
