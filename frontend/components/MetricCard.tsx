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
  const isPositive = !change.startsWith("-");
  const content = (
    <>
      <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted">
        {label}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <div className="text-2xl font-semibold leading-none text-ink">{value}</div>
        <div
          className={
            isPositive
              ? "text-sm font-medium text-accent"
              : "text-sm font-medium text-stone-500"
          }
        >
          {change}
        </div>
      </div>
      <p className="mt-3 min-h-10 text-sm leading-5 text-muted">{detail}</p>
    </>
  );

  return href ? (
    <Link
      className="block rounded-lg border border-line bg-white p-4 shadow-hairline transition hover:border-stone-300 hover:bg-stone-50/50"
      href={href}
    >
      {content}
    </Link>
  ) : (
    <div className="rounded-lg border border-line bg-white p-4 shadow-hairline">
      {content}
    </div>
  );
}
