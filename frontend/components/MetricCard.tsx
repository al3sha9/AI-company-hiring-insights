import Link from "next/link";

type MetricCardProps = {
  label: string;
  value: string;
  change: string;
  detail?: string;
  href?: string;
};

export function MetricCard({ label, value, change, detail, href }: MetricCardProps) {
  const isPositive = !change.startsWith("-");
  const isNeutral =
    change.startsWith("Needs") ||
    change.startsWith("Refresh") ||
    change.startsWith("Monitoring") ||
    change === "N/A";

  const pillClass = isNeutral
    ? "bg-stone-100 text-muted"
    : isPositive
    ? "bg-teal-50 text-teal-700"
    : "bg-red-50 text-red-600";

  const content = (
    <div className="flex h-full flex-col gap-3">
      {/* Label */}
      <div className="text-xs font-medium uppercase tracking-[0.08em] text-subtle">
        {label}
      </div>

      {/* Value - hero number/text */}
      <div className="text-2xl font-semibold leading-none text-ink">{value}</div>

      {/* Change pill - own row, never competes with value */}
      <div>
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${pillClass}`}>
          {change}
        </span>
      </div>

      {detail && <p className="mt-auto text-xs leading-5 text-muted">{detail}</p>}
    </div>
  );

  const baseClass =
    "block rounded-lg border border-line bg-white p-4 shadow-hairline transition-colors";
  const hoverClass = href ? " hover:border-stone-300 hover:bg-selected/50 cursor-pointer" : "";

  return href ? (
    <Link className={baseClass + hoverClass} href={href}>
      {content}
    </Link>
  ) : (
    <div className={baseClass}>
      {content}
    </div>
  );
}
