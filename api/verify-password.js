module.exports = async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
        const { password } = body;

        const requiredPass = process.env.DEEPSEEK_PASSWORD;
        if (!requiredPass) {
            return res.json({ valid: true });
        }

        if (password === requiredPass) {
            return res.json({ valid: true });
        }

        return res.status(403).json({ valid: false, error: "Invalid password" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
