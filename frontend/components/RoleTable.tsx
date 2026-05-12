import Link from "next/link";
import type { Role } from "@/lib/data";
import { companies, getRoleHref } from "@/lib/data";

type RoleTableProps = {
  roles: Role[];
};

export function RoleTable({ roles }: RoleTableProps) {
  const companySlugs = new Map(
    companies.map((company) => [company.name, company.slug])
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-muted">
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Location</th>
            <th className="px-4 py-3 font-medium">Seniority</th>
            <th className="px-4 py-3 font-medium">Posted</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr
              className="border-b border-line last:border-0 hover:bg-stone-50/70"
              key={role.id ?? `${role.company}-${role.title}-${role.location}`}
            >
              <td className="px-4 py-3">
                <a
                  className="font-medium text-ink underline-offset-4 hover:underline"
                  href={role.sourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {role.title}
                </a>
              </td>
              <td className="px-4 py-3">
                <Link
                  className="text-muted underline-offset-4 hover:text-ink hover:underline"
                  href={`/company/${companySlugs.get(role.company)}`}
                >
                  {role.company}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Link
                  className="text-muted underline-offset-4 hover:text-ink hover:underline"
                  href={getRoleHref({ category: role.category })}
                >
                  {role.category}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Link
                  className="text-muted underline-offset-4 hover:text-ink hover:underline"
                  href={getRoleHref({ country: role.country })}
                >
                  {role.location}, {role.country}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted">{role.seniority}</td>
              <td className="px-4 py-3 tabular-nums text-muted">
                {role.datePosted}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
