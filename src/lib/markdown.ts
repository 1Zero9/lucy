/**
 * Minimal, safe Markdown -> HTML renderer for LUCY notes.
 *
 * Deliberately dependency-free and allowlist-only: the input is HTML-escaped
 * first, then a small set of block/inline constructs is recognised and the
 * ONLY tags emitted are the ones produced here. Raw HTML in the source is
 * never passed through, so the result is safe to inject.
 *
 * Supported: headings (#..######), unordered / ordered / task lists,
 * blockquotes, fenced + indented-free code blocks (```), inline code,
 * bold (**), italic (* or _), strikethrough (~~), links [t](url) for
 * http/https/mailto only, horizontal rules (---), paragraphs.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(escaped: string): string {
  let out = escaped;
  // images: ![alt](url) — allow http(s) or same-origin paths only
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt: string, url: string) => {
    if (!(/^https?:/i.test(url) || url.startsWith("/"))) return m;
    return `<img src="${url}" alt="${alt}" loading="lazy" />`;
  });
  // links: [text](url) — url is already HTML-escaped; allow safe schemes only
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text: string, url: string) => {
    const safe = /^(https?:|mailto:)/i.test(url) || url.startsWith("/") || url.startsWith("#");
    if (!safe) return m;
    return `<a href="${url}" rel="noopener noreferrer nofollow" target="_blank">${text}</a>`;
  });
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,!?]|$)/g, "$1<em>$2</em>");
  out = out.replace(/(^|[\s(])_([^_\s][^_]*?)_(?=[\s).,!?]|$)/g, "$1<em>$2</em>");
  out = out.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  return out;
}

export function renderMarkdown(source: string): string {
  const lines = escapeHtml(source ?? "").replace(/\r\n?/g, "\n").split("\n");
  const html: string[] = [];

  let i = 0;
  let listType: "ul" | "ol" | null = null;
  let para: string[] = [];

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };
  const flushPara = () => {
    if (para.length) {
      html.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // fenced code block
    if (/^```/.test(line.trim())) {
      flushPara();
      closeList();
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        body.push(lines[i]);
        i++;
      }
      i++; // closing fence
      html.push(`<pre><code>${body.join("\n")}</code></pre>`);
      continue;
    }

    if (line.trim() === "") {
      flushPara();
      closeList();
      i++;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushPara();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      flushPara();
      closeList();
      html.push("<hr />");
      i++;
      continue;
    }

    // `>` has already been HTML-escaped to `&gt;` by this point.
    if (/^&gt;\s?/.test(line)) {
      flushPara();
      closeList();
      const buf: string[] = [];
      while (i < lines.length && /^&gt;\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^&gt;\s?/, ""));
        i++;
      }
      html.push(`<blockquote>${inline(buf.join(" "))}</blockquote>`);
      continue;
    }

    const task = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
    if (task) {
      flushPara();
      if (listType !== "ul") {
        closeList();
        html.push('<ul class="md-tasks">');
        listType = "ul";
      }
      const checked = task[1].toLowerCase() === "x";
      html.push(
        `<li><input type="checkbox" disabled${checked ? " checked" : ""} /> ${inline(task[2])}</li>`
      );
      i++;
      continue;
    }

    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if (ul) {
      flushPara();
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${inline(ul[1])}</li>`);
      i++;
      continue;
    }

    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ol) {
      flushPara();
      if (listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${inline(ol[1])}</li>`);
      i++;
      continue;
    }

    closeList();
    para.push(line.trim());
    i++;
  }

  flushPara();
  closeList();
  return html.join("\n");
}
