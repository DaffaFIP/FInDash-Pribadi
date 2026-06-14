import { readFileSync } from "fs";

const envRaw = readFileSync(".env", "utf-8");
const env = {};
for (const line of envRaw.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
}

const projectId = env.VITE_FIREBASE_PROJECT_ID;
const apiKey = env.VITE_FIREBASE_API_KEY;
const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

const UID = "p8wZmDjDJeUHFp9SDKjnALLUNMH2";

const categories = [
  { name: "Pangan", color: "#4F46E5" },
  { name: "Transport", color: "#EC4899" },
  { name: "Internet", color: "#10B981" },
  { name: "Gadget", color: "#06B6D4" },
  { name: "Buku", color: "#F59E0B" },
  { name: "Olahraga", color: "#F97316" },
  { name: "Hiburan", color: "#8B5CF6" },
  { name: "Lainnya", color: "#64748B" },
];

async function run() {
  let created = 0;
  let skipped = 0;

  for (const cat of categories) {
    const res = await fetch(
      `${baseUrl}/mastercategory?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            name: { stringValue: cat.name },
            color: { stringValue: cat.color },
            uid: { stringValue: UID },
          },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      console.log(`Created: ${cat.name} (${cat.color}) — ${data.name}`);
      created++;
    } else if (res.status === 409) {
      console.log(`Skipped (exists): ${cat.name}`);
      skipped++;
    } else {
      const err = await res.text();
      console.error(`Failed to create ${cat.name}:`, res.status, err);
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}/${categories.length}`);
}

run().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
