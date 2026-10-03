import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Crumb {
  label: string;
  /** Omitted for the current page. */
  href?: string;
}

/**
 * "Proposals / Client / Agreement" trail for admin sub-pages, so the dashboard
 * is one click away. Middle crumbs collapse on phones (the first and last stay).
 */
export function AdminBreadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-[var(--andromeda-text-secondary)]">
        {items.map((item, i) => {
          const middle = i > 0 && i < items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className={`items-center gap-1 min-w-0 ${middle ? "hidden sm:inline-flex" : "inline-flex"}`}>
              {i > 0 && <ChevronRight aria-hidden className="w-3.5 h-3.5 shrink-0 opacity-60" />}
              {item.href ? (
                <Link href={item.href} className="truncate max-w-[16rem] hover:text-[var(--andromeda-accent-beige)]">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="truncate max-w-[16rem] text-[var(--andromeda-text-primary)]">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
