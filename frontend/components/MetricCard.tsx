import Link from "next/link";

type MetricCardProps = {
  label: string;
  value: string;
  change: string;
  detail: string;
  href?: string;
};

export function MetricCard({
  label,
  value,
  change,
  detail,
  href
}: MetricCardProps) {
  const isPositive = !change.startsWith("-") && change !== "Available after second scrape run" && change !== "Pending";

  const content = (
    <div className="flex h-full flex-col justify-between py-3">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
          {label}
        </div>
        <div className="mt-2 text-3xl font-light tracking-tight text-ink">
          {value}
        </div>
      </div>
      <div className="mt-6">
        <div
          className={
            isPositive
              ? "text-xs font-bold uppercase tracking-widest text-accent"
              : "text-xs font-bold uppercase tracking-widest text-muted"
          }
        >
          {change}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {detail}
        </p>
      </div>
    </div>
  );

  return href ? (
    <Link
      className="group block h-full border-t border-line transition-colors hover:border-ink"
      href={href}
    >
      {content}
    </Link>
  ) : (
    <div className="h-full border-t border-line">
      {content}
    </div>
  );
}
