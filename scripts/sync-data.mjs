import { mkdir, writeFile } from "node:fs/promises";

const SHEET_ID = "1m61NI25P2ONRRb-cDJ1XxS2ZWG2nJqbYUVJQEJDoYSo";
const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
const response = await fetch(url);

if (!response.ok) throw new Error(`Sheet download failed: ${response.status}`);

await mkdir("public/data", { recursive: true });
await writeFile("public/data/startups.csv", Buffer.from(await response.arrayBuffer()));
console.log("Startup data synced to public/data/startups.csv");
