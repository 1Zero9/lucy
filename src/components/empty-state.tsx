import type { ReactNode } from "react";

/**
 * Full-page/section empty state (docs/LUCY_STYLE_GUIDE.md §21): explain the
 * feature in one line and give one action. No illustration — an icon in a
 * quiet circle is enough; avoid dominating the screen.
 */
export function EmptyState({
  icon,
  title,
  body,
  action
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon ? <div className="empty-state-icon">{icon}</div> : null}
      <h3>{title}</h3>
      <p className="muted">{body}</p>
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
