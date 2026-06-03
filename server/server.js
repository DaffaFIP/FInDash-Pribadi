const express = require("express");
const cors = require("cors");
const axios = require("axios");
const admin = require("firebase-admin");
const path = require("path");
const rateLimit = require("express-rate-limit");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();


// init Firebase Admin SDK — pakai env var jika ada, fallback ke file

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
    serviceAccount = require("./serviceAccountKey.json");
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


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
    message: { error: "Terlalu banyak request, coba lagi nanti" },
});
app.use(limiter);


// VERIFY FIREBASE TOKEN

async function verifyToken(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {

        return res.status(401).json({
            error: "No token"
        });

    }

    try {

        const token = authHeader.split("Bearer ")[1];

        const decoded =
            await admin.auth().verifyIdToken(token);

        req.user = decoded;

        next();

    } catch (err) {

        console.log(err);

        return res.status(401).json({
            error: "Invalid token"
        });

    }

}


// ROOT

app.get("/", (req, res) => {

    res.json({
        message: "AI Server Running"
    });

});


// INIT AI
// dipanggil SEKALI saat halaman AI dibuka

app.post("/init-ai", verifyToken, async (req, res) => {

    const uid = req.user.uid;

    if (userMemories.has(uid)) {

        return res.json({
            success: true,
            message: "Already initialized"
        });

    }

    try {

        console.log("Initializing AI for user:", uid);

        // ambil transaksi
        const snapshot = await db
            .collection("transactions")
            .limit(50)
            .get();

        const transactions = snapshot.docs.map(doc => {

            const data = doc.data();

            return {
                title: data.title,
                category: data.category,
                amount: data.amount,
                date: data.Date
                    ? data.Date.toDate().toLocaleDateString("id-ID")
                    : "-"
            };

        });


        const formattedTransactions = transactions
            .map(t => `
        - ${t.title}
        kategori: ${t.category}
        jumlah: Rp${t.amount}
        tanggal: ${t.date}
        `)
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
        Anda adalah AI financial analyst.

        Berikut data transaksi user:

        ${formattedTransactions}

        Gunakan data ini untuk menjawab seluruh pertanyaan user.

        Jawab singkat, jelas, dan profesional.
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

app.post("/ask-ai", verifyToken, async (req, res) => {

    try {

        const { question } = req.body;

        if (!question || typeof question !== "string" || !question.trim()) {
            return res.status(400).json({ error: "Question harus diisi" });
        }

        const uid = req.user.uid;

        // cek apakah AI sudah init
        if (!userMemories.has(uid)) {

            return res.status(400).json({
                error: "AI belum diinit"
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
                return res.status(400).json({ error: "OPENROUTER_API_KEY belum diatur di server/.env" });
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
                    timeout: 30000,
                }
            );

            aiMessage = openrouterRes.data.choices?.[0]?.message?.content || "Maaf, tidak ada jawaban.";
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
                    timeout: 60000,
                }
            );

            aiMessage = ollamaRes.data.message?.content || "Maaf, tidak ada jawaban.";
        }

        // simpan jawaban AI ke memory
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
app.get("/provider", verifyToken, (req, res) => {
    res.json({ provider: aiProvider });
});

// SET PROVIDER
app.post("/provider", verifyToken, (req, res) => {
    const { provider } = req.body;
    if (provider !== "ollama" && provider !== "openrouter") {
        return res.status(400).json({ error: "Provider harus 'ollama' atau 'openrouter'" });
    }
    aiProvider = provider;
    console.log("AI Provider changed to:", provider);
    res.json({ success: true, provider: aiProvider });
});


// START SERVER

app.listen(3001, () => {

    console.log(
        "Server berjalan di http://localhost:3001"
    );

});
