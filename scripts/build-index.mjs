#!/usr/bin/env node
// ==========================================================================
// biko — index builder
// Scans posts/*.md, reads front matter, and writes posts/index.json.
// Run by .github/workflows/build-index.yml on every push to posts/**.
// Can also be run locally: `node scripts/build-index.mjs`
// ==========================================================================

import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "posts");
const OUT_FILE = path.join(POSTS_DIR, "index.json");

function parseFrontMatter(raw) {
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!fmMatch) return { data: {}, content: raw };

  const data = {};
  const lines = fmMatch[1].split("\n");
  for (const line of lines) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let value = m[2].trim();

    if (/^\[.*\]$/.test(value)) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      value = value.replace(/^["']|["']$/g, "");
    }
    data[key] = value;
  }

  const content = raw.slice(fmMatch[0].length);
  return { data, content };
}

function readingTime(text) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function slugify(filename) {
  return filename.replace(/\.md$/i, "");
}

async function main() {
  let files = [];
  try {
    files = await readdir(POSTS_DIR);
  } catch {
    console.error(`No posts/ directory found at ${POSTS_DIR}`);
    process.exit(0);
  }

  const mdFiles = files.filter((f) => f.toLowerCase().endsWith(".md"));
  const posts = [];

  for (const file of mdFiles) {
    const filePath = path.join(POSTS_DIR, file);
    const raw = await readFile(filePath, "utf-8");
    const { data, content } = parseFrontMatter(raw);
    const slug = slugify(file);

    const title = data.title || slug.replace(/[-_]/g, " ");
    const date = data.date || "1970-01-01";
    const excerpt =
      data.excerpt ||
      content
        .replace(/[#*_`>\[\]]/g, "")
        .trim()
        .slice(0, 160)
        .trim() + "…";
    const tags = Array.isArray(data.tags) ? data.tags : [];

    posts.push({
      slug,
      title,
      date,
      excerpt,
      tags,
      readingTime: readingTime(content),
    });
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  await writeFile(OUT_FILE, JSON.stringify(posts, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${posts.length} post(s) to ${path.relative(ROOT, OUT_FILE)}`);
}

main();
