function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function inline(text) {
  let value = escapeHtml(text);
  value = value.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
  value = value.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  value = value.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  value = value.replace(/`([^`]+)`/g, '<code>$1</code>');
  return value;
}

export function renderMarkdownDocument(markdown, options = {}) {
  const title = options.title || 'Document';
  const lines = String(markdown).replaceAll('\r\n', '\n').split('\n');
  const body = [];
  let paragraph = [];
  let list = null;
  let code = null;
  const flushParagraph = () => {
    if (paragraph.length) body.push(`<p>${inline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list) body.push(`<${list.type}>${list.items.map((item) => `<li>${inline(item)}</li>`).join('')}</${list.type}>`);
    list = null;
  };

  for (const line of lines) {
    if (code) {
      if (line.startsWith('```')) {
        body.push(`<pre><code>${escapeHtml(code.lines.join('\n'))}</code></pre>`);
        code = null;
      } else code.lines.push(line);
      continue;
    }
    if (line.startsWith('```')) {
      flushParagraph();
      flushList();
      code = { lines: [] };
      continue;
    }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      body.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);
      continue;
    }
    const unordered = /^\s*[-*+]\s+(.+)$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.+)$/.exec(line);
    if (unordered || ordered) {
      flushParagraph();
      const type = ordered ? 'ol' : 'ul';
      if (list && list.type !== type) flushList();
      list ||= { type, items: [] };
      list.items.push((ordered || unordered)[1]);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();
  if (code) body.push(`<pre><code>${escapeHtml(code.lines.join('\n'))}</code></pre>`);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root{color-scheme:light dark;font-family:system-ui,sans-serif;line-height:1.55}
    body{max-width:76ch;margin:0 auto;padding:clamp(1rem,4vw,3rem)}
    pre{overflow:auto;padding:1rem;background:color-mix(in srgb,CanvasText 8%,Canvas);border-radius:.5rem}
    code{font-family:ui-monospace,monospace}a{color:LinkText}img{max-width:100%}
  </style>
</head>
<body><main>${body.join('\n')}</main></body>
</html>
`;
}
