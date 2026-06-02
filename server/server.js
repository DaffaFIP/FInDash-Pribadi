const express = require("express");
const cors = require("cors");
const axios = require("axios");
const admin = require("firebase-admin");

const app = express();


// init Firebase Admin SDK

admin.initializeApp({
    credential: admin.credential.cert(
        require("./serviceAccountKey.json")
    )
});

const db = admin.firestore();


// GLOBAL AI MEMORY
// disimpan di RAM server
let initialized = false;
let chatMemory = [];


app.use(cors());
app.use(express.json());


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
    if (initialized) {

        return res.json({
            success: true,
            message: "Already initialized"
        });

    }

    try {

        console.log("Initializing AI...");

        // ambil transaksi dari firestore
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
            "Transactions loaded:",
            transactions.length
        );

        // SYSTEM PROMPT
        // transaksi dikirim SEKALI
        chatMemory = [
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
        ];

        initialized = true;


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

        // cek apakah AI sudah init
        if (!chatMemory.length) {

            return res.status(400).json({
                error: "AI belum diinit"
            });

        }

        console.log("Question:", question);

        // tambahkan pertanyaan user ke memory
        chatMemory.push({
            role: "user",
            content: question
        });

        // kirim ke ollama
        const response = await axios.post(
            "http://localhost:11434/api/chat",
            {
                model: "gemma4:26b",

                // seluruh memory conversation
                messages: chatMemory,

                stream: false
            }
        );

        // ambil jawaban AI
        const aiMessage =
            response.data.message.content;

        // simpan jawaban AI ke memory
        chatMemory.push({
            role: "assistant",
            content: aiMessage
        });

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


// START SERVER

app.listen(3001, () => {

    console.log(
        "Server berjalan di http://localhost:3001"
    );

});
