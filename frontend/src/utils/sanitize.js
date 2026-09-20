import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "a", "ul", "ol", "li",
  "strong", "b", "em", "i", "u", "s", "strike", "del", "mark", "sub", "sup",
  "blockquote", "pre", "code", "hr", "br", "span",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  "img", "figure", "figcaption",
];

const ALLOWED_ATTR = [
  "href", "target", "rel", "title", "alt", "src", "class", "align",
  "colspan", "rowspan", "width", "height", "start",
];

const config = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  FORBID_ATTR: ["style", "onclick", "onerror", "onload", "onmouseover"],
  ADD_ATTR: ["target", "rel"],
  RETURN_TRUSTED_TYPE: true,
};

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
  if (node.tagName === "IMG") {
    node.setAttribute("loading", "lazy");
  }
});

export function sanitizeHtml(dirty) {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, config).toString();
}

export function stripHtmlToText(html) {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
}
