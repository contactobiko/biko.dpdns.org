#!/usr/bin/env node
// ==========================================================================
// biko — Notion sync
// Lee páginas con Status = "Published" de una base de datos de Notion,
// las convierte a Markdown con front matter, y las escribe en posts/.
// Pensado para correr periódicamente vía GitHub Actions.
//
// Variables de entorno requeridas:
//   NOTION_TOKEN        — token de la integración interna de Notion
//   NOTION_DATABASE_ID  — id de la base de datos de posts
// ==========================================================================

import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "posts");

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
  console.error("Faltan NOTION_TOKEN o NOTION_DATABASE_ID en el entorno.");
  process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

function slugify(text) {
  return text
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getPlainText(richTextArray) {
  if (!Array.isArray(richTextArray)) return "";
  return richTextArray.map((t) => t.plain_text).join("");
}

function getProp(page, name) {
  return page.properties?.[name];
}

function yamlListLiteral(arr) {
  return `[${arr.map((v) => `"${String(v).replace(/"/g, '\\"')}"`).join(", ")}]`;
}

function yamlScalar(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

async function fetchPublishedPages() {
  const pages = [];
  let cursor = undefined;

  do {
    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      start_cursor: cursor,
      filter: {
        property: "Status",
        select: { equals: "Published" },
      },
    });
    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return pages;
}

async function pageToMarkdown(page) {
  const titleProp = getProp(page, "Title");
  const title = getPlainText(titleProp?.title) || "Untitled";

  const slugProp = getProp(page, "Slug");
  const slugRaw = getPlainText(slugProp?.rich_text);
  const slug = slugRaw ? slugify(slugRaw) : slugify(title);

  const dateProp = getProp(page, "Date");
  const date = dateProp?.date?.start || new Date().toISOString().slice(0, 10);

  const excerptProp = getProp(page, "Excerpt");
  const excerpt = getPlainText(excerptProp?.rich_text);

  const tagsProp = getProp(page, "Tags");
  const tags = (tagsProp?.multi_select || []).map((t) => t.name);

  const mdBlocks = await n2m.pageToMarkdown(page.id);
  const { parent: bodyMarkdown } = n2m.toMarkdownString(mdBlocks);

  const fmLines = [
    "---",
    `title: ${yamlScalar(title)}`,
    `date: ${date}`,
  ];
  if (excerpt) fmLines.push(`excerpt: ${yamlScalar(excerpt)}`);
  if (tags.length) fmLines.push(`tags: ${yamlListLiteral(tags)}`);
  fmLines.push("---", "");

  const content = fmLines.join("\n") + (bodyMarkdown || "").trim() + "\n";

  return { slug, content };
}

async function main() {
  await mkdir(POSTS_DIR, { recursive: true });

  const pages = await fetchPublishedPages();
  console.log(`Encontradas ${pages.length} página(s) publicadas en Notion.`);

  let written = 0;
  let unchanged = 0;

  for (const page of pages) {
    const { slug, content } = await pageToMarkdown(page);
    if (!slug) continue;

    const filePath = path.join(POSTS_DIR, `${slug}.md`);

    let existing = null;
    try {
      existing = await readFile(filePath, "utf-8");
    } catch {
      existing = null;
    }

    if (existing === content) {
      unchanged++;
      continue;
    }

    await writeFile(filePath, content, "utf-8");
    written++;
    console.log(`Escrito: posts/${slug}.md`);
  }

  console.log(`Listo. ${written} archivo(s) actualizados, ${unchanged} sin cambios.`);
}

main().catch((err) => {
  console.error("Error sincronizando con Notion:", err);
  process.exit(1);
});
