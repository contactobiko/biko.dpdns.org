// ==========================================================================
// biko — post page
// ==========================================================================

(async function () {
  const titleEl = document.getElementById("article-title");
  const metaEl = document.getElementById("article-meta");
  const bodyEl = document.getElementById("article-body");
  const headEl = document.getElementById("article-head");

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    renderNotFound();
    return;
  }

  try {
    const res = await fetch(`${CONFIG.postsDir}/${slug}.md`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`post fetch failed: ${res.status}`);
    const raw = await res.text();
    const { data, content } = parseFrontMatter(raw);
    renderPost(data, content);
  } catch (err) {
    console.error(err);
    renderNotFound();
  }

  function renderPost(data, content) {
    const title = data.title || slug;
    document.title = `${title} — ${CONFIG.siteTitle}`;

    titleEl.textContent = title;

    const tags = Array.isArray(data.tags) ? data.tags : [];
    metaEl.innerHTML = `
      <span>${escapeHtml(formatDate(data.date))}</span>
      <span class="dot" aria-hidden="true">·</span>
      <span>${escapeHtml(readingTime(content))}</span>
      ${
        tags.length
          ? `<span class="dot" aria-hidden="true">·</span><span class="tags">${tags
              .map((t) => `<span>${escapeHtml(t)}</span>`)
              .join("")}</span>`
          : ""
      }
    `;

    const html =
      window.DOMPurify && window.marked
        ? DOMPurify.sanitize(marked.parse(content))
        : escapeHtml(content);

    bodyEl.innerHTML = html;
  }

  function renderNotFound() {
    headEl.innerHTML = "";
    bodyEl.innerHTML = `
      <div class="empty-state">
        <h2>Post not found</h2>
        <p>This file doesn't exist, or hasn't been published yet.</p>
        <p><a href="index.html">← back to all posts</a></p>
      </div>`;
    document.title = `Not found — ${CONFIG.siteTitle}`;
  }
})();
