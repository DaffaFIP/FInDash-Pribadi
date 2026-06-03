import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function AIChat({ user }) {

    const API_URL = import.meta.env.VITE_AI_API_URL || "http://localhost:3001";

    const isLocal = typeof window !== "undefined"
        && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);
    const [provider, setProvider] = useState(isLocal ? "ollama" : "openrouter");
    const [providerLoading, setProviderLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [memoryReady, setMemoryReady] = useState(false);
    const initialized = useRef(false);
    const chatEndRef = useRef(null);
    const systemPromptRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // --- LOCAL MODE: fetch & switch provider via Express server ---
    const fetchProvider = async () => {
        try {
            const token = await user.getIdToken();
            const res = await fetch(API_URL + "/provider", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setProvider(data.provider);
        } catch (err) {
            console.log(err);
        }
    };

    const switchProvider = async (newProvider) => {
        setProviderLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(API_URL + "/provider", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ provider: newProvider }),
            });
            const data = await res.json();
            if (data.success) setProvider(data.provider);
        } catch (err) {
            console.log(err);
        } finally {
            setProviderLoading(false);
        }
    };

    // --- LOCAL: init via Express server ---
    const initLocal = async () => {

        try {
            const token = await user.getIdToken();

            await fetch(API_URL + "/init-ai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("AI initialized (local)");
            fetchProvider();

        } catch (err) {
            console.log(err);
        }
    };

    // --- DEPLOYED: init via Firestore client SDK ---
    const initDeployed = async () => {

        try {
            const querySnapshot = await getDocs(collection(db, "transactions"));

            const transactions = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    title: data.title,
                    category: data.category,
                    amount: data.amount,
                    date: data.Date?.toDate().toLocaleDateString("id-ID") || "-",
                };
            });

            const formatted = transactions
                .map((t) =>
                    `- ${t.title}\nkategori: ${t.category}\njumlah: Rp${t.amount}\ntanggal: ${t.date}`
                )
                .join("\n");

            systemPromptRef.current =
                "Anda adalah AI financial analyst.\n\n" +
                "Berikut data transaksi user:\n\n" +
                formatted + "\n\n" +
                "Gunakan data ini untuk menjawab seluruh pertanyaan user.\n\n" +
                "Jawab singkat, jelas, dan profesional.";

            setMemoryReady(true);
            console.log("AI initialized (deployed)");

        } catch (err) {
            console.log(err);
        }
    };

    // --- INIT ---
    useEffect(() => {

        if (initialized.current) return;
        initialized.current = true;

        if (isLocal) {
            setTimeout(() => initLocal());
        } else {
            setTimeout(() => initDeployed());
        }

    }, []);

    // --- ASK AI ---
    const askAI = async () => {

        if (!question || loading) return;
        if (!isLocal && !memoryReady) return;

        const userQuestion = question;
        setQuestion("");

        setMessages((prev) => [...prev, { role: "user", content: userQuestion }]);
        setLoading(true);

        try {
            let answer;

            if (isLocal) {
                const token = await user.getIdToken();
                const res = await fetch(API_URL + "/ask-ai", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ question: userQuestion }),
                });
                const data = await res.json();
                answer = data.answer;
            } else {
                const res = await fetch("/api/ask", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: [
                            { role: "system", content: systemPromptRef.current },
                            ...messages,
                            { role: "user", content: userQuestion },
                        ],
                    }),
                });
                const data = await res.json();
                answer = data.answer;
            }

            setMessages((prev) => [...prev, { role: "assistant", content: answer }]);

        } catch (err) {
            console.log(err);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Maaf, terjadi kesalahan. Coba lagi nanti." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <style>{`
            .markdown h1, .markdown h2, .markdown h3 { font-weight: 600; margin-top: 0.5em; margin-bottom: 0.25em; }
            .markdown h1 { font-size: 1.25rem; }
            .markdown h2 { font-size: 1.1rem; }
            .markdown h3 { font-size: 1rem; }
            .markdown p { margin-bottom: 0.5em; }
            .markdown p:last-child { margin-bottom: 0; }
            .markdown ul, .markdown ol { padding-left: 1.25em; margin-bottom: 0.5em; }
            .markdown li { margin-bottom: 0.25em; }
            .markdown code { background: #f1f5f9; padding: 0.125em 0.375em; border-radius: 4px; font-size: 0.875em; }
            .markdown pre { background: #1e293b; color: #e2e8f0; padding: 0.75em; border-radius: 8px; overflow-x: auto; margin-bottom: 0.5em; }
            .markdown pre code { background: none; padding: 0; color: inherit; }
            .markdown table { border-collapse: collapse; margin-bottom: 0.5em; width: 100%; }
            .markdown th, .markdown td { border: 1px solid #cbd5e1; padding: 0.375em 0.5em; text-align: left; font-size: 0.875em; }
            .markdown th { background: #f8fafc; font-weight: 600; }
            .markdown blockquote { border-left: 3px solid #cbd5e1; padding-left: 0.75em; color: #64748b; margin-bottom: 0.5em; }
            .markdown a { color: #4f46e5; text-decoration: underline; }
            .markdown hr { margin: 0.75em 0; border-color: #e2e8f0; }
            .markdown strong { font-weight: 600; }
        `}</style>

        <div className="mx-auto flex h-full max-w-4xl flex-col p-6">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">
                    AI Financial Assistant
                </h1>

                {isLocal && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">AI:</span>
                        <button
                            onClick={() => switchProvider(provider === "ollama" ? "openrouter" : "ollama")}
                            disabled={providerLoading}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                                provider === "ollama"
                                    ? "bg-indigo-100 text-indigo-700"
                                    : "bg-purple-100 text-purple-700"
                            } disabled:opacity-50`}
                        >
                            {providerLoading ? "..." : provider === "ollama" ? "Ollama" : "Open Router"}
                        </button>
                    </div>
                )}

                {!isLocal && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">AI:</span>
                        <span className="rounded-lg bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-700">
                            Open Router
                        </span>
                    </div>
                )}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border bg-slate-50 p-4">
                {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-center text-slate-400">
                            Tanyakan sesuatu tentang keuangan Anda
                        </p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`markdown max-w-[80%] rounded-2xl px-4 py-3 ${
                                    msg.role === "user"
                                        ? "bg-indigo-600 text-white"
                                        : "border bg-white text-slate-700"
                                }`}
                            >
                                {msg.role === "user" ? (
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                ) : (
                                    <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {loading && (
                    <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-2xl border bg-white px-4 py-3">
                            <div className="flex items-center gap-1.5">
                                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }}></span>
                                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }}></span>
                                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }}></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            <div className="mt-4 flex items-center gap-3">
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && askAI()}
                    placeholder="Tanya tentang keuangan anda..."
                    className="flex-1 rounded-xl border p-4 outline-none transition focus:ring-2 focus:ring-indigo-500"
                    disabled={loading || (!isLocal && !memoryReady)}
                />

                <button
                    onClick={askAI}
                    disabled={loading || !question.trim() || (!isLocal && !memoryReady)}
                    className="rounded-xl bg-indigo-600 px-6 py-4 text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                    Kirim
                </button>
            </div>
        </div>
        </>
    );
}
