module.exports = async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
        const { messages } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: "Messages required" });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "OpenRouter API key not configured" });
        }

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
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenRouter error:", response.status, errorText);
            return res.status(502).json({ error: `OpenRouter API error (${response.status})` });
        }

        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content || "Maaf, tidak ada jawaban.";
        return res.json({ answer });

    } catch (err) {
        console.error("ask-ai error:", err.message, err.stack);
        return res.status(500).json({ error: err.message || "AI Error" });
    }
};
