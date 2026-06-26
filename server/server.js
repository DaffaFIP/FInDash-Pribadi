const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const rateLimit = require("express-rate-limit");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();


// local user — skip verify token untuk development
app.use((req, res, next) => {
    req.user = { uid: "local-user" };
    next();
});


// AI MEMORY per-user (Map<uid, array>)
// maksimal 20 percakapan per user untuk membatasi memori
const MAX_CONVERSATIONS = 20;
const userMemories = new Map();

// AI Provider: "openrouter" atau "deepseek"
let aiProvider = process.env.AI_PROVIDER || "openrouter";


// Middleware

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
}));

app.use(express.json({ limit: "1mb" }));

// Rate limiting: maks 30 request per menit per IP
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: "Too many requests, please try again later" },
});
app.use(limiter);


// ROOT

app.get("/", (req, res) => {

    res.json({
        message: "AI Server Running"
    });

});


// INIT AI
// called ONCE when the AI page is opened

app.post("/init-ai", async (req, res) => {

    const uid = req.user.uid;

    if (userMemories.has(uid)) {

        return res.json({
            success: true,
            message: "Already initialized"
        });

    }

    try {

        console.log("Initializing AI for user:", uid);

        const { transactions } = req.body;
        if (!transactions || !Array.isArray(transactions)) {
            return res.status(400).json({ error: "Transaction data required" });
        }


        console.log(
            "Transactions loaded for",
            uid + ":",
            transactions.length
        );

        const { buildSystemPrompt } = await import('../src/prompts.js');

        userMemories.set(uid, [
            { role: "system", content: buildSystemPrompt(transactions) }
        ]);

        res.json({
            success: true,
            message: "AI initialized"
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: "Init AI failed"
        });

    }

});


// ASK AI — streaming with auto-fallback

function streamResponse(aiRes, sendEvent) {
    return new Promise((resolve, reject) => {
        let buffer = "";
        let fullContent = "";
        let fullReasoning = "";

        aiRes.data.on("data", (chunk) => {
            buffer += chunk.toString();
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
                } catch { /* skip malformed */ }
            }
        });

        aiRes.data.on("end", () => {
            if (fullContent || fullReasoning) resolve({ content: fullContent, reasoning: fullReasoning });
            else reject(new Error("No content received"));
        });

        aiRes.data.on("error", (err) => reject(err));
    });
}

app.post("/ask-ai", async (req, res) => {

    try {

        const { question } = req.body;

        if (!question || typeof question !== "string" || !question.trim()) {
            return res.status(400).json({ error: "Question is required" });
        }

        const uid = req.user.uid;
        if (!userMemories.has(uid)) {
            return res.status(400).json({ error: "AI not initialized" });
        }

        const memory = userMemories.get(uid);
        console.log("Question from", uid + ":", question);
        memory.push({ role: "user", content: question });

        // SSE headers
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

            if (content) memory.push({ role: "assistant", content });
            while (memory.length > MAX_CONVERSATIONS * 2 + 1) {
                memory.splice(1, 2);
            }
        };

        const providerConfigs = [
            {
                name: "openrouter",
                apiUrl: "https://openrouter.ai/api/v1/chat/completions",
                apiKey: process.env.OPENROUTER_API_KEY,
                model: process.env.OPENROUTER_MODEL || "google/gemma-3-27b-it:free",
                keyLabel: "OPENROUTER_API_KEY",
                badKeys: ["sk-or-v1-your-key-here"],
            },
            {
                name: "deepseek",
                apiUrl: "https://api.deepseek.com/v1/chat/completions",
                apiKey: process.env.DEEPSEEK_API_KEY,
                model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
                keyLabel: "DEEPSEEK_API_KEY",
                badKeys: ["your-deepseek-api-key-here"],
            },
        ];

        // respect manual toggle: if user picked deepseek via /provider, try it first
        const preferred = aiProvider === "deepseek" ? "deepseek" : "openrouter";
        const orderedConfigs = [...providerConfigs].sort((a, b) =>
            a.name === preferred ? -1 : b.name === preferred ? 1 : 0
        );

        let fallbackError = null;

        for (const cfg of orderedConfigs) {
            try {
                if (!cfg.apiKey || cfg.badKeys.includes(cfg.apiKey)) {
                    throw new Error(`${cfg.keyLabel} not set in server/.env`);
                }

                const aiRes = await axios({
                    method: "post",
                    url: cfg.apiUrl,
                    data: { model: cfg.model, messages: memory, stream: true },
                    headers: {
                        "Authorization": `Bearer ${cfg.apiKey}`,
                        "Content-Type": "application/json",
                    },
                    responseType: "stream",
                    timeout: 300000,
                });

                sendEvent({ type: "provider", name: cfg.name, model: cfg.model });

                const result = await streamResponse(aiRes, sendEvent);

                finishStream(result.content, result.reasoning, cfg.name, cfg.model, fallbackError);
                return;

            } catch (err) {
                console.log(`${cfg.name} failed:`, err.message);
                if (cfg.name === orderedConfigs[0].name) {
                    fallbackError = err.message;
                    sendEvent({ type: "provider-fallback", from: cfg.name, error: err.message });
                }
            }
        }

        // All providers failed
        finishStream(null, null, null, null, `All providers failed. Last error: ${fallbackError}`);

    } catch (err) {

        console.log(err);
        try {
            res.write(`data: ${JSON.stringify({ type: "done", content: "AI Error: " + err.message, reasoning: null, provider: null, model: null, fallbackError: null })}\n\n`);
            res.end();
        } catch { /* ignore */ }

    }

});


// GET PROVIDER
app.get("/provider", (req, res) => {
    res.json({
        provider: aiProvider,
        openrouterModel: process.env.OPENROUTER_MODEL || "google/gemma-3-27b-it:free",
        deepseekModel: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    });
});

// SET PROVIDER
app.post("/provider", (req, res) => {
    const { provider, password } = req.body;
    if (provider !== "openrouter" && provider !== "deepseek") {
        return res.status(400).json({ error: "Provider must be 'openrouter' or 'deepseek'" });
    }

    if (provider === "deepseek") {
        const requiredPass = process.env.DEEPSEEK_PASSWORD;
        if (requiredPass && requiredPass !== password) {
            return res.status(403).json({ error: "Invalid password" });
        }
    }

    aiProvider = provider;
    console.log("AI Provider changed to:", provider);
    res.json({ success: true, provider: aiProvider });
});


// START SERVER

app.listen(3001, () => {

    console.log(
        "Server running on http://localhost:3001"
    );

});
