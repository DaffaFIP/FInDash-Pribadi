import { useEffect, useRef, useState } from "react";

export default function AIChat({ user }) {

    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);
    const initialized = useRef(false);


    useEffect(() => {

        const initAI = async () => {

            try {

                const token = await user.getIdToken();

                await fetch(
                    "http://localhost:3001/init-ai",
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

    }, []);

    const askAI = async () => {

        if (!question) return;

        try {

            const token = await user.getIdToken();

            const res = await fetch(
                "http://localhost:3001/ask-ai",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        question
                    })
                }
            );


            const data = await res.json();
            setMessages((prevMessages) => [
                ...prevMessages,
                { question, answer: data.answer },
            ]);
            setQuestion("");
        } catch (err) {

            console.log(err);

        }
    };


    return (

        <div className="mx-auto max-w-4xl p-6">

            <h1 className="mb-6 text-3xl font-bold text-slate-800">
                AI Financial Assistant
            </h1>

            <div className="flex gap-3">

                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Tanya tentang keuangan anda..."
                    className="flex-1 rounded-xl border p-4"
                />

                <button
                    onClick={askAI}
                    className="rounded-xl bg-indigo-600 px-6 py-4 text-white"
                >
                    Tanya
                </button>

            </div>

            <div className="mt-6 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className="rounded-2xl border bg-white p-6 shadow">
                        <p className="font-semibold text-slate-800">Q: {msg.question}</p>
                        <p className="text-slate-700">A: {msg.answer}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
