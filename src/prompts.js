export function formatTransaction(t) {
    let line = `- ${t.title} (${t.type || "expense"})`;
    if (t.category) line += `\n  category: ${t.category}`;
    line += `\n  amount: Rp${t.amount}\n  date: ${t.date}`;
    return line;
}

export function buildSystemPrompt(transactions) {
    const formatted = transactions.map(formatTransaction).join("\n\n");
    return `You are an AI financial analyst.

Here is the user's transaction data:

${formatted}

Use this data to answer all user questions.

Answer concisely, clearly, and professionally.`;
}
