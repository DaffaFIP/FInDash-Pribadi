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

async function run() {
  // 1. Cari dokumen expense dengan category == "Jajan"
  const queryRes = await fetch(
    `${baseUrl}:runQuery?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "expense" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "category" },
              op: "EQUAL",
              value: { stringValue: "Jajan" },
            },
          },
        },
      }),
    }
  );

  if (!queryRes.ok) {
    const err = await queryRes.text();
    console.error("Query failed:", queryRes.status, err);
    process.exit(1);
  }

  const queryData = await queryRes.json();
  const docs = queryData.filter((r) => r.document);

  if (docs.length === 0) {
    console.log("No documents found with category 'Jajan'");
    process.exit(0);
  }

  console.log(`Found ${docs.length} document(s) with category 'Jajan'. Updating...`);

  // 2. Update setiap dokumen
  let updated = 0;
  for (const { document: doc } of docs) {
    const name = doc.name;
    const res = await fetch(
      `https://firestore.googleapis.com/v1/${name}?key=${apiKey}&updateMask.fieldPaths=category`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            category: { stringValue: "Pangan" },
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error(`Failed to update ${name}:`, res.status, err);
    } else {
      updated++;
    }
  }

  console.log(`Successfully updated ${updated}/${docs.length} document(s) from 'Jajan' to 'Pangan'`);
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
