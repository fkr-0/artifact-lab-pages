import type { TextItem } from "@/types";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderInlineMarkdown(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
    );
}

export function renderMarkdownToHtml(source: string): string {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inCode = false;
  let inList = false;
  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        out.push("</code></pre>");
        inCode = false;
      } else {
        closeList();
        out.push("<pre><code>");
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      out.push(`${escapeHtml(line)}\n`);
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      closeList();
      const level = heading[1].length;
      out.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    if (bullet) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${renderInlineMarkdown(bullet[1])}</li>`);
      continue;
    }

    if (line.trim() === "") {
      closeList();
      out.push("<br />");
      continue;
    }

    closeList();
    out.push(`<p>${renderInlineMarkdown(line)}</p>`);
  }
  closeList();
  if (inCode) out.push("</code></pre>");
  return out.join("\n");
}

export function renderPlainTextRoleToHtml(text: string, role = "paragraph"): string {
  const escaped = escapeHtml(text);
  switch (role) {
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return `<${role}>${escaped}</${role}>`;
    case "li":
      return `<li>${escaped}</li>`;
    case "ul":
      return `<ul>${text
        .split("\n")
        .filter(Boolean)
        .map((line) => `<li>${escapeHtml(line.replace(/^[-*+]\s+/, ""))}</li>`)
        .join("")}</ul>`;
    case "pre":
      return `<pre>${escaped}</pre>`;
    case "code":
      return `<pre><code>${escaped}</code></pre>`;
    default:
      return `<p>${escaped.replace(/\n/g, "<br />")}</p>`;
  }
}

export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeRichTextHtml(html: string): string {
  const template = document.createElement("template");
  template.innerHTML = html;
  for (const node of [
    ...template.content.querySelectorAll("script, style, iframe, object, embed"),
  ]) {
    node.remove();
  }
  for (const element of [...template.content.querySelectorAll("*")]) {
    for (const attr of [...element.attributes]) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith("on") || value.startsWith("javascript:")) {
        element.removeAttribute(attr.name);
      }
    }
  }
  return template.innerHTML;
}

export function textItemToHtml(item: TextItem): string {
  if (item.textKind === "richtext") return sanitizeRichTextHtml(item.richTextHtml ?? item.text);
  if (item.textKind === "markdown") return renderMarkdownToHtml(item.text);
  if (item.textKind === "log") {
    return (item.logEntries ?? [])
      .map(
        (entry) =>
          `<section><h4>${escapeHtml(entry.author ?? entry.ts)}</h4><pre>${escapeHtml(entry.text)}</pre></section>`,
      )
      .join("\n");
  }
  return renderPlainTextRoleToHtml(item.text, item.textRole ?? "paragraph");
}
