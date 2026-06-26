import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, MessageSquare } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { buildSystemPrompt } from "../prompts";
import { db } from "../firebase";

export default function AIChat({ user }) {

    const API_URL = import.meta.env.VITE_AI_API_URL || "http://localhost:3001";

    const isLocal = typeof window !== "undefined"
        && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [memoryReady, setMemoryReady] = useState(false);
    const [streamMode, setStreamMode] = useState(null); // null | "thinking" | "dots"
    const [liveReasoning, setLiveReasoning] = useState("");
    const [liveContent, setLiveContent] = useState("");
    const [streamProvider, setStreamProvider] = useState(null);

    const initialized = useRef(false);
    const chatEndRef = useRef(null);
    const systemPromptRef = useRef(null);
    const chatContainerRef = useRef(null);
    const shouldAutoScroll = useRef(true);
    const streamProviderRef = useRef(null);
    const streamModelRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleScroll = () => {
        const el = chatContainerRef.current;
        if (!el) return;
        const threshold = 100;
        shouldAutoScroll.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    };

    useEffect(() => {
        const el = chatContainerRef.current;
        if (!el) return;
        el.addEventListener("scroll", handleScroll, { passive: true });
        return () => el.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (shouldAutoScroll.current) scrollToBottom();
    }, [messages, liveReasoning, liveContent]);





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

            systemPromptRef.current = buildSystemPrompt(transactions);

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- ASK AI (streaming) ---
    const askAI = async () => {

        if (!question || loading) return;
        if (!isLocal && !memoryReady) return;

        const userQuestion = question;
        setQuestion("");
        setStreamMode(null);
        setLiveReasoning("");
        setLiveContent("");
        setStreamProvider(null);

        setMessages((prev) => [...prev, { role: "user", content: userQuestion }]);
        setLoading(true);
        streamProviderRef.current = null;
        streamModelRef.current = null;

        let finalAnswer = "";
        let localReasoning = "";
        let mode = null; // null | "thinking" | "dots"

        const streamUrl = isLocal ? API_URL + "/ask-ai" : "/api/ask";

        const buildBody = () => {
            if (isLocal) {
                return { question: userQuestion };
            }
            return {
                messages: [
                    { role: "system", content: systemPromptRef.current },
                    ...messages,
                    { role: "user", content: userQuestion },
                ],
            };
        };

        const buildHeaders = async () => {
            const headers = { "Content-Type": "application/json" };
            if (isLocal) {
                const token = await user.getIdToken();
                headers["Authorization"] = `Bearer ${token}`;
            }
            return headers;
        };

        try {
            const res = await fetch(streamUrl, {
                method: "POST",
                headers: await buildHeaders(),
                body: JSON.stringify(buildBody()),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${res.status}`);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            const processLine = (line) => {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith("data: ")) return;
                const payload = trimmed.slice(6);
                try {
                    const data = JSON.parse(payload);

                    if (data.type === "provider") {
                        streamProviderRef.current = data.name;
                        streamModelRef.current = data.model;
                        setStreamProvider(data.name);
                    } else if (data.type === "provider-fallback") {
                        setMessages((prev) => [...prev, { role: "system", content: `${data.error} - switch to fallback mode` }]);
                    } else if (data.type === "reasoning") {
                        if (!mode) {
                            mode = "thinking";
                            setStreamMode("thinking");
                        }
                        localReasoning += data.text;
                        setLiveReasoning((prev) => prev + data.text);
                    } else if (data.type === "content") {
                        if (!mode) {
                            mode = "dots";
                            setStreamMode("dots");
                        }
                        if (mode === "thinking") {
                            setLiveContent((prev) => prev + data.text);
                        }
                        finalAnswer += data.text;
                    } else if (data.type === "done") {
                        finalAnswer = data.content || data.reasoning || localReasoning || finalAnswer;
                    }
                } catch { /* skip malformed JSON */ }
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop();

                for (const line of lines) {
                    processLine(line);
                }
            }

            // process remaining buffer
            if (buffer.trim()) processLine(buffer);

            if (!finalAnswer) finalAnswer = "";

            const isReasoningOnly = !!(localReasoning && finalAnswer && localReasoning === finalAnswer);

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: isReasoningOnly ? "" : finalAnswer,
                    reasoning: localReasoning || null,
                    provider: streamProviderRef.current,
                    model: streamModelRef.current,
                },
            ]);

        } catch (err) {
            console.log(err);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, an error occurred: " + err.message },
            ]);
        } finally {
            setLoading(false);
            setStreamMode(null);
            setLiveReasoning("");
            setLiveContent("");
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
            .markdown table { display: block; width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border-collapse: collapse; margin-bottom: 0.5em; }
            .markdown thead, .markdown tbody { white-space: nowrap; }
            .markdown th, .markdown td { border: 1px solid var(--md-table-border); padding: 0.375em 0.5em; text-align: left; font-size: 0.875em; }
            .markdown th { background: var(--md-th-bg); font-weight: 600; }
            .markdown blockquote { border-left: 3px solid var(--md-blockquote-border); padding-left: 0.75em; color: var(--md-blockquote-text); margin-bottom: 0.5em; }
            .markdown a { color: var(--md-link); text-decoration: underline; }
            .markdown hr { margin: 0.75em 0; border-color: var(--md-hr); }
            .markdown strong { font-weight: 600; }
        `}</style>

        <div className="mx-auto flex h-full max-w-4xl flex-col p-3 pb-[max(12px,env(safe-area-inset-bottom))] md:p-6">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 md:text-2xl">
                    AI Financial Assistant
                </h1>
            </div>

            <div ref={chatContainerRef} className="flex-1 space-y-4 overflow-y-auto rounded-2xl border dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4">
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4 px-2">
                        <MessageSquare className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                        <p className="text-center text-sm text-slate-400 dark:text-slate-500">
                            Ask something about your finances
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {[
                                "Total pengeluaranku bulan ini?",
                                "Berapa rata-rata pemasukan per bulan?",
                                "Kategori pengeluaran terbesarku?",
                            ].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setQuestion(s)}
                                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-indigo-400 dark:hover:text-indigo-300"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        msg.role === "system" ? (
                            <div key={index} className="flex justify-start">
                                <div className="max-w-[90%] rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 md:max-w-[80%]">
                                    {msg.content}
                                </div>
                            </div>
                        ) : (
                        <div
                            key={index}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`markdown rounded-2xl px-4 py-3 ${
                                    msg.role === "user"
                                        ? "max-w-[80%] bg-indigo-600 text-white md:max-w-[70%]"
                                        : "max-w-[90%] border dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 md:max-w-[80%]"
                                }`}
                            >
            {msg.role === "user" ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
            ) : (
                <>
                    {msg.reasoning && (
                        <details className="mb-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 p-2">
                            <summary className="cursor-pointer text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
                                Thinking Process
                            </summary>
                            <div className="mt-2 text-sm italic text-slate-600 dark:text-slate-400">
                                <Markdown remarkPlugins={[remarkGfm]}>{msg.reasoning}</Markdown>
                            </div>
                        </details>
                    )}
                    <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                    {msg.provider && (
                        <div className="mt-1.5 text-right text-[10px] text-slate-400 dark:text-slate-500">
                            answered by {msg.model || msg.provider}
                        </div>
                    )}
                </>
            )}
                            </div>
                        </div>
                        )
                    ))
                )}

                {loading && streamMode !== "thinking" && (
                    <div className="flex justify-start">
                        <div className="max-w-[90%] rounded-2xl border dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 md:max-w-[80%]">
                            <div className="flex items-center gap-1.5">
                                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }}></span>
                                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }}></span>
                                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }}></span>
                                {streamProvider && (
                                    <span className="ml-1 text-xs text-slate-400">{streamProvider}</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {loading && streamMode === "thinking" && (
                    <div className="flex justify-start">
                        <div className="max-w-[90%] rounded-2xl border dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 md:max-w-[80%]">
                            {liveReasoning && (
                                <details open className="mb-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 p-2">
                                    <summary className="cursor-pointer text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
                                        Thinking Process
                                    </summary>
                                    <div className="mt-2 text-sm italic text-slate-600 dark:text-slate-400">
                                        <Markdown remarkPlugins={[remarkGfm]}>{liveReasoning}</Markdown>
                                    </div>
                                </details>
                            )}
                            {liveContent && (
                                <div className="markdown">
                                    <Markdown remarkPlugins={[remarkGfm]}>{liveContent}</Markdown>
                                </div>
                            )}
                            {!liveReasoning && !liveContent && (
                                <span className="text-sm text-slate-400">Thinking...</span>
                            )}
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            <div className="mt-4 flex items-center gap-2 md:gap-3">
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && askAI()}
                    placeholder="Ask about your finances..."
                    className="flex-1 rounded-xl border dark:border-slate-600 p-3 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-200 md:p-4 md:text-base"
                    disabled={loading || (!isLocal && !memoryReady)}
                />

                <button
                    onClick={askAI}
                    disabled={loading || !question.trim() || (!isLocal && !memoryReady)}
                    className="rounded-xl bg-indigo-600 p-3 text-white transition hover:bg-indigo-700 disabled:opacity-50 md:p-4"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>

        </>
    );
}
