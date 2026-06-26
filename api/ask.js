function streamResponse(reader, decoder, sendEvent) {
    return new Promise((resolve, reject) => {
        let buffer = "";
        let fullContent = "";
        let fullReasoning = "";

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
                            resolve({ content: fullContent, reasoning: fullReasoning });
                            return;
                        }
                        try {
                            const parsed = JSON.parse(payload);
                            const delta = parsed.choices?.[0]?.delta || {};
                            if (delta.reasoning || delta.reasoning_content) {
                                const t = delta.reasoning || delta.reasoning_content;
                                fullReasoning += t;
                                sendEvent({ type: "reasoning", text: t });
                            }
                            if (delta.content) {
                                fullContent += delta.content;
                                sendEvent({ type: "content", text: delta.content });
                            }
                        } catch { /* skip */ }
                    }
                }

                if (fullContent || fullReasoning) resolve({ content: fullContent, reasoning: fullReasoning });
                else reject(new Error("No content received"));
            } catch (err) {
                reject(err);
            }
        };

        pump();
    });
}

module.exports = async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
        const { messages, provider } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: "Messages required" });
        }

        // SSE headers — set early, before provider attempts
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");

        let streamEnded = false;

        const sendEvent = (data) => {
            if (!streamEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        const finishStream = (content, reasoning, provider, model, fallbackError) => {
            if (streamEnded) return;
            streamEnded = true;
            sendEvent({
                type: "done",
                content: content || reasoning || "Sorry, no answer available.",
                reasoning: reasoning || null,
                provider: provider || null,
                model: model || null,
                fallbackError: fallbackError || null,
            });
            res.end();
        };

        const providerConfigs = [
            {
                name: "openrouter",
                apiUrl: "https://openrouter.ai/api/v1/chat/completions",
                apiKey: process.env.OPENROUTER_API_KEY,
                model: process.env.OPENROUTER_MODEL || "google/gemma-3-27b-it:free",
                keyLabel: "OPENROUTER_API_KEY",
            },
            {
                name: "deepseek",
                apiUrl: "https://api.deepseek.com/v1/chat/completions",
                apiKey: process.env.DEEPSEEK_API_KEY,
                model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
                keyLabel: "DEEPSEEK_API_KEY",
            },
        ];

        // respect client's provider preference (if provided)
        const preferred = provider === "deepseek" ? "deepseek" : "openrouter";
        const orderedConfigs = [...providerConfigs].sort((a, b) =>
            a.name === preferred ? -1 : b.name === preferred ? 1 : 0
        );

        let fallbackError = null;

        for (const cfg of orderedConfigs) {
            try {
                if (!cfg.apiKey) throw new Error(`${cfg.keyLabel} not configured`);

                const response = await fetch(cfg.apiUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${cfg.apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ model: cfg.model, messages, stream: true }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`${cfg.name} API error (${response.status}): ${errorText.slice(0, 200)}`);
                }

                sendEvent({ type: "provider", name: cfg.name, model: cfg.model });

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                const result = await streamResponse(reader, decoder, sendEvent);

                finishStream(result.content, result.reasoning, cfg.name, cfg.model, fallbackError);
                return;

            } catch (err) {
                console.error(`${cfg.name} failed:`, err.message);
                if (cfg.name === orderedConfigs[0].name) {
                    fallbackError = err.message;
                    sendEvent({ type: "provider-fallback", from: cfg.name, error: err.message });
                }
            }
        }

        // All providers failed
        finishStream(null, null, null, null, `All providers failed. Last error: ${fallbackError}`);

    } catch (err) {
        console.error("ask-ai error:", err.message, err.stack);
        try {
            res.write(`data: ${JSON.stringify({ type: "done", content: err.message || "AI Error", reasoning: null, provider: null, model: null, fallbackError: null })}\n\n`);
            res.end();
        } catch { /* ignore */ }
    }
};
