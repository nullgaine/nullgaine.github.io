import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(scriptDir, "..");
const root = path.resolve(process.argv[2] || defaultRoot);
const outputPath = path.resolve(process.argv[3] || path.join(root, "search-index.json"));

const excludedFiles = new Set([
  "404.html",
  "_main.html",
  "nothing.html",
  "search.html"
]);

const namedEntities = {
  amp: "&",
  apos: "'",
  copy: "©",
  gt: ">",
  hellip: "…",
  laquo: "«",
  ldquo: "“",
  lsquo: "‘",
  lt: "<",
  nbsp: " ",
  quot: '"',
  raquo: "»",
  rdquo: "”",
  rsquo: "’"
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value) {
  return String(value || "").replace(
    /&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi,
    (entity, key) => {
      if (key[0] === "#") {
        const isHex = key[1].toLowerCase() === "x";
        const number = Number.parseInt(key.slice(isHex ? 2 : 1), isHex ? 16 : 10);
        return Number.isFinite(number) ? String.fromCodePoint(number) : entity;
      }
      return namedEntities[key.toLowerCase()] ?? entity;
    }
  );
}

function stripTags(value) {
  return normalizeText(decodeEntities(String(value || "").replace(/<[^>]*>/g, " ")));
}

function getAttribute(tag, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i");
  return tag.match(pattern)?.[2] || "";
}

function extractMetaDescription(html) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const name = getAttribute(tag, "name").toLowerCase();
    if (name === "description") return stripTags(getAttribute(tag, "content"));
  }
  return "";
}

function extractVisibleText(html) {
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;
  const cleaned = body
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " ");

  const attributes = [];
  for (const tag of cleaned.match(/<[^>]+>/g) || []) {
    for (const name of ["alt", "aria-label", "title"]) {
      const value = getAttribute(tag, name);
      if (value) attributes.push(value);
    }
  }

  const text = cleaned
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|li|h[1-6]|tr|header|footer|main)>/gi, "\n")
    .replace(/<[^>]*>/g, " ");

  return normalizeText(decodeEntities(`${text} ${attributes.join(" ")}`));
}

function extractMarkedScriptText(html) {
  const values = [];
  const scriptPattern = /<script\b(?=[^>]*\bdata-search-content\b)[^>]*>([\s\S]*?)<\/script>/gi;
  const fieldPattern = /\b(?:name|hex|meta|pantone|memo|category)\s*:\s*"((?:\\.|[^"\\])*)"/g;

  for (const scriptMatch of html.matchAll(scriptPattern)) {
    const source = scriptMatch[1];
    for (const fieldMatch of source.matchAll(fieldPattern)) {
      try {
        values.push(JSON.parse(`"${fieldMatch[1]}"`));
      } catch {
        values.push(fieldMatch[1]);
      }
    }
  }

  return normalizeText(values.join(" "));
}

function shouldIndex(relativePath) {
  const normalized = relativePath.split(path.sep).join("/");
  const basename = path.posix.basename(normalized);

  if (!normalized.toLowerCase().endsWith(".html")) return false;
  if (normalized.startsWith("partials/")) return false;
  if (excludedFiles.has(normalized)) return false;
  if (/-preview\.html$/i.test(basename)) return false;
  if (/^t-[^/]+\.html$/i.test(basename)) return false;
  return true;
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }

  return files;
}

function pageFromHtml(html, relativePath) {
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = stripTags(titleMatch?.[1]) || path.basename(relativePath, ".html");
  const description = extractMetaDescription(html);
  const visibleText = extractVisibleText(html);
  const scriptedText = extractMarkedScriptText(html);
  const text = normalizeText([title, description, visibleText, scriptedText].filter(Boolean).join(" "));
  const excerptSource = description || visibleText;
  const excerpt = excerptSource.length > 180
    ? `${excerptSource.slice(0, 180).trim()}…`
    : excerptSource;

  const normalizedPath = relativePath.split(path.sep).join("/");
  const publicUrl = normalizedPath.includes("/") && normalizedPath.endsWith("/index.html")
    ? normalizedPath.slice(0, -"index.html".length)
    : normalizedPath.replace(/\.html$/i, "");

  return {
    title,
    url: publicUrl,
    excerpt,
    text
  };
}

const allFiles = await walk(root);
const htmlFiles = allFiles
  .map(absolute => ({
    absolute,
    relative: path.relative(root, absolute)
  }))
  .filter(file => shouldIndex(file.relative))
  .sort((a, b) => a.relative.localeCompare(b.relative, "ja"));

const pages = [];
for (const file of htmlFiles) {
  const html = await readFile(file.absolute, "utf8");
  pages.push(pageFromHtml(html, file.relative));
}

await writeFile(outputPath, `${JSON.stringify({ version: 2, pages }, null, 2)}\n`, "utf8");
console.log(`Indexed ${pages.length} HTML pages -> ${path.relative(root, outputPath)}`);
