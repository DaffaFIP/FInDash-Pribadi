module.exports = async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const provider = process.env.AI_PROVIDER || "openrouter";
    const openrouterModel = process.env.OPENROUTER_MODEL || "google/gemma-3-27b-it:free";
    const deepseekModel = process.env.DEEPSEEK_MODEL || "deepseek-chat";

    res.json({ provider, openrouterModel, deepseekModel });
};
