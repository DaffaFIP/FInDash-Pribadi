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

// AI Provider: "ollama" atau "openrouter"
let aiProvider = process.env.AI_PROVIDER || "ollama";


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


        const formattedTransactions = transactions
            .map(t => {
                let line = `\n        - ${t.title} (${t.type || "expense"})`;
                if (t.category) line += `\n        category: ${t.category}`;
                line += `\n        amount: Rp${t.amount}\n        date: ${t.date}`;
                return line;
            })
            .join("\n");

        console.log(
            "Transactions loaded for",
            uid + ":",
            transactions.length
        );

        // SYSTEM PROMPT per-user
        userMemories.set(uid, [
            {
                role: "system",
                content: `
        You are an AI financial analyst.

        Here is the user's transaction data:

        ${formattedTransactions}

        Use this data to answer all user questions.

        Answer concisely, clearly, and professionally.
`
            }
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


// ASK AI — streaming

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

        let fullContent = "";
        let fullReasoning = "";
        let streamEnded = false;

        const sendEvent = (data) => {
            if (streamEnded) return;
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        const finishStream = () => {
            if (streamEnded) return;
            streamEnded = true;
            sendEvent({ type: "done", content: fullContent, reasoning: fullReasoning || null });
            res.end();

            // save to memory (tanpa reasoning)
            memory.push({ role: "assistant", content: fullContent });
            while (memory.length > MAX_CONVERSATIONS * 2 + 1) {
                memory.splice(1, 2);
            }
        };

        if (aiProvider === "openrouter") {
            const apiKey = process.env.OPENROUTER_API_KEY;
            if (!apiKey || apiKey === "sk-or-v1-your-key-here") {
                sendEvent({ type: "done", content: "OPENROUTER_API_KEY not set in server/.env", reasoning: null });
                return res.end();
            }

            const openrouterRes = await axios({
                method: "post",
                url: "https://openrouter.ai/api/v1/chat/completions",
                data: {
                    model: process.env.OPENROUTER_MODEL || "google/gemma-3-27b-it:free",
                    messages: memory,
                    stream: true,
                },
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                responseType: "stream",
                timeout: 300000,
            });

            let buffer = "";

            openrouterRes.data.on("data", (chunk) => {
                buffer += chunk.toString();
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
                    } catch {
                        // skip malformed lines
                    }
                }
            });

            openrouterRes.data.on("end", () => {
                if (fullContent || fullReasoning) finishStream();
                else {
                    sendEvent({ type: "done", content: "Sorry, no answer available.", reasoning: null });
                    res.end();
                }
            });

            openrouterRes.data.on("error", (err) => {
                console.log(err);
                sendEvent({ type: "done", content: "AI stream error", reasoning: null });
                res.end();
            });

        } else {
            // default: ollama
            const ollamaRes = await axios({
                method: "post",
                url: "http://localhost:11434/api/chat",
                data: {
                    model: process.env.OLLAMA_MODEL || "gemma4:e2b",
                    messages: memory,
                    stream: true,
                },
                responseType: "stream",
                timeout: 600000,
            });

            let buffer = "";

            ollamaRes.data.on("data", (chunk) => {
                buffer += chunk.toString();
                const lines = buffer.split("\n");
                buffer = lines.pop();

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;
                    try {
                        const parsed = JSON.parse(trimmed);
                        const msg = parsed.message || {};
                        if (msg.reasoning_content) {
                            fullReasoning += msg.reasoning_content;
                            sendEvent({ type: "reasoning", text: msg.reasoning_content });
                        }
                        if (msg.content) {
                            fullContent += msg.content;
                            sendEvent({ type: "content", text: msg.content });
                        }
                        if (parsed.done) {
                            finishStream();
                            return;
                        }
                    } catch {
                        // skip
                    }
                }
            });

            ollamaRes.data.on("end", () => {
                if (fullContent || fullReasoning) finishStream();
                else {
                    sendEvent({ type: "done", content: "Sorry, no answer available.", reasoning: null });
                    res.end();
                }
            });

            ollamaRes.data.on("error", (err) => {
                console.log(err);
                sendEvent({ type: "done", content: "AI stream error", reasoning: null });
                res.end();
            });
        }

    } catch (err) {

        console.log(err);
        try {
            res.write(`data: ${JSON.stringify({ type: "done", content: "AI Error", reasoning: null })}\n\n`);
            res.end();
        } catch { /* ignore */ }

    }

});


// GET PROVIDER
app.get("/provider", (req, res) => {
    res.json({ provider: aiProvider });
});

// SET PROVIDER
app.post("/provider", (req, res) => {
    const { provider } = req.body;
    if (provider !== "ollama" && provider !== "openrouter") {
        return res.status(400).json({ error: "Provider must be 'ollama' or 'openrouter'" });
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
