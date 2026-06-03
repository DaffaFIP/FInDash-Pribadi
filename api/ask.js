export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages required" });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "OpenRouter API key not configured" });
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
                messages,
            }),
            signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenRouter error:", response.status, errorText);
            return res.status(502).json({ error: "OpenRouter API error" });
        }

        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content || "Maaf, tidak ada jawaban.";
        res.json({ answer });
    } catch (err) {
        console.error("ask-ai error:", err);
        res.status(500).json({ error: "AI Error" });
    }
}
