import { Router } from "express";

const router = Router();

router.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body as { messages: Array<{ role: string; content: string }> };
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages array is required" });
      return;
    }

    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      res.status(200).json({
        engine: "local",
        reply:
          "The AI service is not configured (GROQ_API_KEY missing). Configure GROQ_API_KEY in your environment to enable AI chat.",
      });
      return;
    }

    const systemPrompt = `You are ASTRA — a brilliant, warm, and highly knowledgeable AI science tutor and assistant for Axyomis-X. 

RULES:
1. Answer EVERY question clearly and helpfully — greetings, casual chat, science, math, history, anything.
2. For casual greetings ("hi", "hello", "how are you") — reply naturally and warmly, keep it short.
3. For science/educational topics — give detailed, structured answers using markdown: headers, bullet points, bold text.
4. For math — use clear notation and step-by-step working.
5. You can describe diagrams using ASCII art or structured text.
6. If asked who you are — say you are ASTRA, the AI inside Axyomis-X, created to help students learn.
7. ALWAYS respond in the same language the user writes in.
8. Keep voice-friendly responses concise (under 200 words when voice is on).
9. NEVER say you cannot answer — always try your best.`;

    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
    ];

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        max_tokens: 2048,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      res.status(groqRes.status).json({ error: errBody });
      return;
    }

    const data = await groqRes.json() as any;
    const reply = data.choices?.[0]?.message?.content ?? "";
    res.json({ engine: "groq", reply });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
});

export default router;
