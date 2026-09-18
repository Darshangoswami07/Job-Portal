import { useMemo } from "react";
import { sanitizeHtml } from "@/utils/sanitize";
import { cn } from "@/lib/utils";

export default function RichText({
  html,
  className,
  prose = "prose prose-lg",
}) {
  const safeHtml = useMemo(() => sanitizeHtml(html), [html]);

  if (!safeHtml) return null;

  return (
    <div
      className={cn(
        prose,
        "prose-slate dark:prose-invert max-w-none",
        "[&_img]:rounded-xl [&_img]:shadow-md",
        "[&_a]:text-indigo-600 dark:[&_a]:text-indigo-400 [&_a]:underline-offset-2",
        "[&_blockquote]:border-l-4 [&_blockquote]:border-indigo-300 [&_blockquote]:bg-indigo-50/50 dark:[&_blockquote]:bg-indigo-500/5 [&_blockquote]:rounded-r-xl [&_blockquote]:px-4 [&_blockquote]:py-1",
        "[&_pre]:rounded-xl [&_pre]:bg-slate-900 dark:[&_pre]:bg-slate-800 [&_pre]:text-slate-100",
        "[&_code]:rounded-md [&_code]:bg-slate-100 dark:[&_code]:bg-slate-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_code]:font-semibold",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-700 [&_th]:bg-slate-50 dark:[&_th]:bg-slate-800 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left",
        "[&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-700 [&_td]:px-3 [&_td]:py-2",
        "[&_hr]:border-slate-200 dark:[&_hr]:border-slate-700",
        className
      )}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
