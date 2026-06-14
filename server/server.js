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


// ASK AI

app.post("/ask-ai", async (req, res) => {

    try {

        const { question } = req.body;

        if (!question || typeof question !== "string" || !question.trim()) {
            return res.status(400).json({ error: "Question is required" });
        }

        const uid = req.user.uid;

        // cek apakah AI sudah init
        if (!userMemories.has(uid)) {

            return res.status(400).json({
                error: "AI not initialized"
            });

        }

        const memory = userMemories.get(uid);

        console.log("Question from", uid + ":", question);

        // tambahkan pertanyaan user ke memory
        memory.push({
            role: "user",
            content: question
        });

        // kirim ke AI sesuai provider
        let aiMessage;

        if (aiProvider === "openrouter") {
            const apiKey = process.env.OPENROUTER_API_KEY;
            if (!apiKey || apiKey === "sk-or-v1-your-key-here") {
                return res.status(400).json({ error: "OPENROUTER_API_KEY not set in server/.env" });
            }

            const openrouterRes = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model: process.env.OPENROUTER_MODEL || "google/gemma-3-27b-it:free",
                    messages: memory,
                },
                {
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    timeout: 300000,
                }
            );

            aiMessage = openrouterRes.data.choices?.[0]?.message?.content || "Sorry, no answer available.";
        } else {
            // default: ollama
            const ollamaRes = await axios.post(
                "http://localhost:11434/api/chat",
                {
                    model: process.env.OLLAMA_MODEL || "gemma4:e2b",
                    messages: memory,
                    stream: false,
                },
                {
                    timeout: 600000,
                }
            );

            aiMessage = ollamaRes.data.message?.content || "Sorry, no answer available.";
        }

        // save AI answer to memory
        memory.push({
            role: "assistant",
            content: aiMessage
        });

        // batasi memory per user — hapus percakapan tertua jika melebihi batas
        // system prompt di index 0, percakapan dari index 1
        while (memory.length > MAX_CONVERSATIONS * 2 + 1) {
            // hapus 2 pesan tertua (user + assistant)
            memory.splice(1, 2);
        }

        // kirim ke frontend
        res.json({
            answer: aiMessage
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: "AI Error"
        });

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
