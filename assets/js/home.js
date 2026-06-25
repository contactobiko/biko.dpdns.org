// ==========================================================================
// biko — home page
// ==========================================================================

(async function () {
  const grid = document.getElementById("post-grid");
  const searchInput = document.getElementById("search-input");
  const tagFiltersEl = document.getElementById("tag-filters");

  let posts = [];
  let activeTag = null;

  renderSkeleton();

  try {
    const res = await fetch(CONFIG.indexFile, { cache: "no-store" });
    if (!res.ok) throw new Error(`index fetch failed: ${res.status}`);
    posts = await res.json();
  } catch (err) {
    console.error(err);
    renderError();
    return;
  }

  if (!Array.isArray(posts) || posts.length === 0) {
    renderEmpty();
    return;
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  renderTagFilters(posts);
  renderGrid(posts);

  searchInput.addEventListener("input", () => render());
  searchInput.disabled = false;
  searchInput.placeholder = "Search posts…";

  function render() {
    const query = searchInput.value.trim().toLowerCase();
    let filtered = posts;

    if (activeTag) {
      filtered = filtered.filter((p) =>
        (p.tags || []).map((t) => t.toLowerCase()).includes(activeTag)
      );
    }
    if (query) {
      filtered = filtered.filter((p) => {
        const haystack = `${p.title} ${(p.tags || []).join(" ")} ${
          p.excerpt || ""
        }`.toLowerCase();
        return haystack.includes(query);
      });
    }
    renderGrid(filtered);
  }

  function renderTagFilters(list) {
    const allTags = new Set();
    list.forEach((p) => (p.tags || []).forEach((t) => allTags.add(t)));
    if (allTags.size === 0) {
      tagFiltersEl.style.display = "none";
      return;
    }

    const chips = [`<button class="tag-chip active" data-tag="">all</button>`];
    [...allTags].sort().forEach((tag) => {
      chips.push(
        `<button class="tag-chip" data-tag="${escapeHtml(
          tag
        )}">${escapeHtml(tag)}</button>`
      );
    });
    tagFiltersEl.innerHTML = chips.join("");

    tagFiltersEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".tag-chip");
      if (!btn) return;
      tagFiltersEl
        .querySelectorAll(".tag-chip")
        .forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      activeTag = btn.dataset.tag ? btn.dataset.tag.toLowerCase() : null;
      render();
    });
  }

  function renderGrid(list) {
    if (list.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h2>No matches</h2>
          <p>Try a different search term or tag.</p>
        </div>`;
      return;
    }

    grid.innerHTML = list
      .map((post) => {
        const tags = (post.tags || [])
          .map((t) => `<span>${escapeHtml(t)}</span>`)
          .join("");
        return `
        <a class="post-card" href="post.html?slug=${encodeURIComponent(
          post.slug
        )}">
          <div class="card-stamp">
            <span>${escapeHtml(formatDate(post.date))}</span>
            <span aria-hidden="true">·</span>
            <span>${escapeHtml(post.readingTime || "")}</span>
          </div>
          <h2 class="card-title">${escapeHtml(post.title)}</h2>
          <p class="card-excerpt">${escapeHtml(post.excerpt || "")}</p>
          ${tags ? `<div class="card-tags">${tags}</div>` : ""}
        </a>`;
      })
      .join("");
  }

  function renderSkeleton() {
    grid.innerHTML = Array.from({ length: 4 })
      .map(
        () => `
        <div class="post-card skeleton">
          <div class="sk-line w40"></div>
          <div class="sk-line w90" style="height:1.1rem;margin-top:0.4rem;"></div>
          <div class="sk-line w60"></div>
        </div>`
      )
      .join("");
  }

  function renderEmpty() {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h2>Nothing posted yet</h2>
        <p>Drop a markdown file into <code>posts/</code> and push — it'll show up here.</p>
      </div>`;
    if (tagFiltersEl) tagFiltersEl.style.display = "none";
  }

  function renderError() {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h2>Couldn't load posts</h2>
        <p>Check that <code>posts/index.json</code> exists and is valid JSON.</p>
      </div>`;
    if (tagFiltersEl) tagFiltersEl.style.display = "none";
  }
})();
