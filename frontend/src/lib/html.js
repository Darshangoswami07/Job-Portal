export function htmlToText(html = "") {
  if (!html) return "";
  if (!html.includes("<")) return html;
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isRichHtml(value = "") {
  return /<(p|ul|ol|li|h[1-6]|strong|em|blockquote|code)[\s>]/i.test(value);
}
