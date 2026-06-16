import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { collection, getDocs, query, where } from "firebase/firestore";
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

    // --- LOCAL: ambil transaksi via client SDK, kirim ke Express server ---
    const initLocal = async () => {

        try {
            const token = await user.getIdToken();

            const expenseQ = query(collection(db, "expense"), where("uid", "==", user.uid));
            const incomeQ = query(collection(db, "income"), where("uid", "==", user.uid));

            const [expenseSnap, incomeSnap] = await Promise.all([
                getDocs(expenseQ), getDocs(incomeQ)
            ]);

            const transactions = [
                ...expenseSnap.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        title: data.title,
                        category: data.category,
                        amount: data.amount,
                        date: data.Date?.toDate().toLocaleDateString("en-US") || "-",
                        type: "expense",
                    };
                }),
                ...incomeSnap.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        title: data.title,
                        amount: data.amount,
                        date: data.Date?.toDate().toLocaleDateString("en-US") || "-",
                        type: "income",
                    };
                }),
            ];

            await fetch(API_URL + "/init-ai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ transactions }),
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
            const expenseQ = query(collection(db, "expense"), where("uid", "==", user.uid));
            const incomeQ = query(collection(db, "income"), where("uid", "==", user.uid));

            const [expenseSnap, incomeSnap] = await Promise.all([
                getDocs(expenseQ), getDocs(incomeQ)
            ]);

            const transactions = [
                ...expenseSnap.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        title: data.title,
                        category: data.category,
                        amount: data.amount,
                        date: data.Date?.toDate().toLocaleDateString("en-US") || "-",
                        type: "expense",
                    };
                }),
                ...incomeSnap.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        title: data.title,
                        amount: data.amount,
                        date: data.Date?.toDate().toLocaleDateString("en-US") || "-",
                        type: "income",
                    };
                }),
            ];

            const formatted = transactions
                .map((t) => {
                    let line = `- ${t.title} (${t.type})`;
                    if (t.category) line += `\n  category: ${t.category}`;
                    line += `\n  amount: Rp${t.amount}\n  date: ${t.date}`;
                    return line;
                })
                .join("\n\n");

            systemPromptRef.current =
                "You are an AI financial analyst.\n\n" +
                "Here is the user's transaction data:\n\n" +
                formatted + "\n\n" +
                "Use this data to answer all user questions.\n\n" +
                "Answer concisely, clearly, and professionally.";

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

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || `HTTP ${res.status}`);
                }

                const data = await res.json();
                answer = data.answer;
            }

            if (!answer) throw new Error("Empty answer");

            setMessages((prev) => [...prev, { role: "assistant", content: answer }]);

        } catch (err) {
            console.log(err);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, an error occurred: " + err.message },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <style>{`
            :root { --md-code-bg: #f1f5f9; --md-pre-bg: #1e293b; --md-pre-text: #e2e8f0; --md-table-border: #cbd5e1; --md-th-bg: #f8fafc; --md-blockquote-border: #cbd5e1; --md-blockquote-text: #64748b; --md-link: #4f46e5; --md-hr: #e2e8f0; }
            @media (prefers-color-scheme: dark) { :root { --md-code-bg: #334155; --md-pre-bg: #0f172a; --md-pre-text: #e2e8f0; --md-table-border: #475569; --md-th-bg: #1e293b; --md-blockquote-border: #475569; --md-blockquote-text: #94a3b8; --md-link: #818cf8; --md-hr: #475569; } }
            .markdown h1, .markdown h2, .markdown h3 { font-weight: 600; margin-top: 0.5em; margin-bottom: 0.25em; }
            .markdown h1 { font-size: 1.25rem; }
            .markdown h2 { font-size: 1.1rem; }
            .markdown h3 { font-size: 1rem; }
            .markdown p { margin-bottom: 0.5em; }
            .markdown p:last-child { margin-bottom: 0; }
            .markdown ul, .markdown ol { padding-left: 1.25em; margin-bottom: 0.5em; }
            .markdown li { margin-bottom: 0.25em; }
            .markdown code { background: var(--md-code-bg); padding: 0.125em 0.375em; border-radius: 4px; font-size: 0.875em; }
            .markdown pre { background: var(--md-pre-bg); color: var(--md-pre-text); padding: 0.75em; border-radius: 8px; overflow-x: auto; margin-bottom: 0.5em; }
            .markdown pre code { background: none; padding: 0; color: inherit; }
            .markdown table { border-collapse: collapse; margin-bottom: 0.5em; width: 100%; }
            .markdown th, .markdown td { border: 1px solid var(--md-table-border); padding: 0.375em 0.5em; text-align: left; font-size: 0.875em; }
            .markdown th { background: var(--md-th-bg); font-weight: 600; }
            .markdown blockquote { border-left: 3px solid var(--md-blockquote-border); padding-left: 0.75em; color: var(--md-blockquote-text); margin-bottom: 0.5em; }
            .markdown a { color: var(--md-link); text-decoration: underline; }
            .markdown hr { margin: 0.75em 0; border-color: var(--md-hr); }
            .markdown strong { font-weight: 600; }
        `}</style>

        <div className="mx-auto flex h-full max-w-4xl flex-col p-6">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    AI Financial Assistant
                </h1>

                {isLocal && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 dark:text-slate-400">AI:</span>
                        <button
                            onClick={() => switchProvider(provider === "ollama" ? "openrouter" : "ollama")}
                            disabled={providerLoading}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                                provider === "ollama"
                                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                                    : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                            } disabled:opacity-50`}
                        >
                            {providerLoading ? "..." : provider === "ollama" ? "Ollama" : "Open Router"}
                        </button>
                    </div>
                )}

                {!isLocal && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 dark:text-slate-400">AI:</span>
                        <span className="rounded-lg bg-purple-100 dark:bg-purple-900/30 px-3 py-1.5 text-sm font-medium text-purple-700 dark:text-purple-300">
                            Open Router
                        </span>
                    </div>
                )}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
                {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-center text-slate-400 dark:text-slate-500">
                            Ask something about your finances
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
                                        : "border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
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
                        <div className="max-w-[80%] rounded-2xl border dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3">
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
                    placeholder="Ask about your finances..."
                    className="flex-1 rounded-xl border dark:border-slate-600 p-4 outline-none transition focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-200"
                    disabled={loading || (!isLocal && !memoryReady)}
                />

                <button
                    onClick={askAI}
                    disabled={loading || !question.trim() || (!isLocal && !memoryReady)}
                    className="rounded-xl bg-indigo-600 px-6 py-4 text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                    Send
                </button>
            </div>
        </div>
        </>
    );
}
