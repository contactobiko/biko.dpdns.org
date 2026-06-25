// ==========================================================================
// biko — shared app logic
// ==========================================================================

const CONFIG = {
  siteTitle: "biko",
  tagline: "notes, half-finished thoughts, and things worth keeping.",
  postsDir: "posts",
  indexFile: "posts/index.json",
  githubRepo: "", // optional: "username/repo" — shown in footer if set
};

/**
 * Parse a very small subset of YAML front matter:
 *   ---
 *   title: Hello world
 *   date: 2026-06-25
 *   excerpt: A short summary.
 *   tags: [one, two]
 *   ---
 *   body content...
 * Returns { data, content }.
 */
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

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function readingTime(text) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// --------------------------------------------------------------------------
// theme
// --------------------------------------------------------------------------

function initTheme() {
  const stored = localStorage.getItem("biko-theme");
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = stored || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
}

function bindThemeToggle(button) {
  if (!button) return;
  button.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("biko-theme", next);
  });
}

initTheme();
