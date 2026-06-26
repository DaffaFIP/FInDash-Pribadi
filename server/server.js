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
            sendEvent({
                type: "done",
                content: fullContent || fullReasoning || "Sorry, no answer available.",
                reasoning: fullReasoning || null,
            });
            res.end();

            // save to memory (tanpa reasoning)
            if (fullContent) memory.push({ role: "assistant", content: fullContent });
            while (memory.length > MAX_CONVERSATIONS * 2 + 1) {
                memory.splice(1, 2);
            }
        };

        const apiUrl = aiProvider === "deepseek"
            ? "https://api.deepseek.com/v1/chat/completions"
            : "https://openrouter.ai/api/v1/chat/completions";

        const apiKey = aiProvider === "deepseek"
            ? process.env.DEEPSEEK_API_KEY
            : process.env.OPENROUTER_API_KEY;

        const model = aiProvider === "deepseek"
            ? (process.env.DEEPSEEK_MODEL || "deepseek-chat")
            : (process.env.OPENROUTER_MODEL || "google/gemma-3-27b-it:free");

        const keyLabel = aiProvider === "deepseek" ? "DEEPSEEK_API_KEY" : "OPENROUTER_API_KEY";

        if (!apiKey || apiKey === "your-deepseek-api-key-here" || apiKey === "sk-or-v1-your-key-here") {
            sendEvent({ type: "done", content: `${keyLabel} not set in server/.env`, reasoning: null });
            return res.end();
        }

        const aiRes = await axios({
            method: "post",
            url: apiUrl,
            data: {
                model,
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

        aiRes.data.on("data", (chunk) => {
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
                    if (delta.reasoning || delta.reasoning_content) {
                        const reasoningText = delta.reasoning || delta.reasoning_content;
                        fullReasoning += reasoningText;
                        sendEvent({ type: "reasoning", text: reasoningText });
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

        aiRes.data.on("end", () => {
            if (fullContent || fullReasoning) finishStream();
            else {
                sendEvent({ type: "done", content: "Sorry, no answer available.", reasoning: null });
                res.end();
            }
        });

        aiRes.data.on("error", (err) => {
            console.log(err);
            sendEvent({ type: "done", content: "AI stream error", reasoning: null });
            res.end();
        });

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
