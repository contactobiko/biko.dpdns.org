---
title: Hello, this is biko
date: 2026-06-25
excerpt: How this site works, in plain terms — drop a file in a folder, push, and it shows up here.
tags: [meta, howto]
---

This is the first post on **biko**. It's also the instructions, so read it before you delete it.

## How it works

There's no database and no admin panel. The whole site is:

1. A `posts/` folder in this repository, containing markdown files.
2. A small script that builds `posts/index.json` whenever you push a new post.
3. A homepage and a post page that read that index and the markdown files directly.

To publish something new, add a file like `posts/my-new-post.md` with front matter at the top:

```markdown
---
title: My new post
date: 2026-07-01
excerpt: One sentence describing the post.
tags: [life, code]
---

Your content starts here, in normal markdown.
```

Push it to `main`, and a GitHub Action regenerates the index automatically. No build step, no Jekyll, no server.

## What you can use

Headings, **bold**, *italics*, [links](https://example.com), lists, code blocks, blockquotes, tables, and images all render — this editor is just [marked.js](https://marked.js.org/) under the hood.

> A blog should be as easy to write as the file you already know how to save.

That's it. Delete this post whenever you're ready to publish your own.
