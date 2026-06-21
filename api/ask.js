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
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenRouter error:", response.status, errorText);
            return res.status(502).json({ error: `OpenRouter API error (${response.status})` });
        }

        // SSE headers
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");

        let fullContent = "";
        let fullReasoning = "";
        let buffer = "";
        let streamEnded = false;

        const sendEvent = (data) => {
            if (!streamEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        const finishStream = () => {
            if (streamEnded) return;
            streamEnded = true;
            sendEvent({ type: "done", content: fullContent, reasoning: fullReasoning || null });
            res.end();
        };

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        const pump = async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop();

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith("data: ")) continue;
                        const payload = trimmed.slice(6);
                        if (payload === "[DONE]") {
                            finishStream();
                            return;
                        }
                        try {
                            const parsed = JSON.parse(payload);
                            const delta = parsed.choices?.[0]?.delta || {};
                            if (delta.reasoning) {
                                fullReasoning += delta.reasoning;
                                sendEvent({ type: "reasoning", text: delta.reasoning });
                            }
                            if (delta.content) {
                                fullContent += delta.content;
                                sendEvent({ type: "content", text: delta.content });
                            }
                        } catch { /* skip */ }
                    }
                }

                if (fullContent || fullReasoning) finishStream();
                else {
                    sendEvent({ type: "done", content: "Sorry, no answer available.", reasoning: null });
                    res.end();
                }
            } catch (err) {
                console.error("Stream error:", err.message);
                sendEvent({ type: "done", content: "AI stream error", reasoning: null });
                res.end();
            }
        };

        pump();

    } catch (err) {
        console.error("ask-ai error:", err.message, err.stack);
        try {
            res.write(`data: ${JSON.stringify({ type: "done", content: err.message || "AI Error", reasoning: null })}\n\n`);
            res.end();
        } catch { /* ignore */ }
    }
};
