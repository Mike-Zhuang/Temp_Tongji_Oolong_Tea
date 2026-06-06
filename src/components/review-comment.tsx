import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { clampText, cn, looksLikeMarkdown } from "@/lib/utils";

interface ReviewCommentProps {
  comment: string;
  expanded: boolean;
  collapsedLength: number;
  className?: string;
}

export function ReviewComment({
  comment,
  expanded,
  collapsedLength,
  className,
}: ReviewCommentProps) {
  const isLong = comment.length > collapsedLength;
  const showCollapsed = isLong && !expanded;

  if (!looksLikeMarkdown(comment)) {
    const content =
      showCollapsed ? clampText(comment, collapsedLength) : comment;

    return (
      <div className={cn("text-pretty whitespace-pre-wrap", className)}>
        {content}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "review-markdown text-pretty",
        showCollapsed && "review-markdown-collapsed",
        className,
      )}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {comment}
      </Markdown>
    </div>
  );
}
