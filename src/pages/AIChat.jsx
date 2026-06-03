import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function AIChat({ user }) {

    const API_URL = import.meta.env.VITE_AI_API_URL || "http://localhost:3001";

    const isLocal = typeof window !== "undefined"
        && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);
    const [provider, setProvider] = useState("ollama");
    const [providerLoading, setProviderLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const initialized = useRef(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

    useEffect(() => {

        if (!isLocal) return;

        const initAI = async () => {

            try {

                const token = await user.getIdToken();

                await fetch(
                    API_URL + "/init-ai",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                console.log("AI Initialized");

            } catch (err) {

                console.log(err);

            }

        };

        if (initialized.current) return;

        initialized.current = true;

        initAI();
        fetchProvider();

    }, []);

    const askAI = async () => {

        if (!isLocal || !question || loading) return;

        const userQuestion = question;
        setQuestion("");

        setMessages((prev) => [...prev, { role: "user", content: userQuestion }]);
        setLoading(true);

        try {

            const token = await user.getIdToken();

            const res = await fetch(
                API_URL + "/ask-ai",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        question: userQuestion
                    })
                }
            );


            const data = await res.json();
            setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
        } catch (err) {

            console.log(err);
            setMessages((prev) => [...prev, { role: "assistant", content: "Maaf, terjadi kesalahan. Coba lagi nanti." }]);

        } finally {
            setLoading(false);
        }
    };


    if (!isLocal) {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center p-6">
                <div className="rounded-2xl border bg-white p-8 text-center shadow">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                        <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-slate-800">
                        AI Assistant Tidak Tersedia
                    </h2>
                    <p className="mx-auto max-w-sm text-sm text-slate-500">
                        Fitur AI Assistant hanya dapat digunakan saat aplikasi dijalankan secara lokal dengan server AI yang berjalan.
                    </p>
                </div>
            </div>
        );
    }

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
                    disabled={loading}
                />

                <button
                    onClick={askAI}
                    disabled={loading || !question.trim()}
                    className="rounded-xl bg-indigo-600 px-6 py-4 text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                    Kirim
                </button>
            </div>
        </div>
        </>
    );
}
