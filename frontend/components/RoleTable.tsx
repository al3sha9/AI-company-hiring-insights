"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  IconAwardOutline18,
  IconCalendarDaysOutline18,
  IconChevronDownOutline18,
  IconChevronExpandYOutline18,
  IconChevronUpOutline18,
  IconLocation2Outline18,
  IconSuitcase3Outline18,
  IconTagsOutline18,
  IconToggle3Outline18,
  IconUsersOutline18,
} from "nucleo-ui-essential-outline-18";
import { getRoleHref } from "@/lib/data";

type RoleTableProps = {
  roles: Role[];
  showCompany?: boolean;
  showWorkMode?: boolean;
};

export type Role = {
  id?: string;
  title: string;
  company: string;
  companySlug: string;
  category: string;
  location: string;
  country: string;
  seniority: string;
  workMode: string;
  sourceUrl: string;
  lastSeenAt: string;
};

type SortKey = "title" | "company" | "category" | "location" | "seniority" | "workMode" | "lastSeenAt";
type SortDirection = "asc" | "desc";

export function RoleTable({
  roles,
  showCompany = true,
  showWorkMode = false,
}: RoleTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("lastSeenAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const sortedRoles = useMemo(() => {
    return [...roles].sort((a, b) => {
      const aValue = getSortValue(a, sortKey);
      const bValue = getSortValue(b, sortKey);
      const direction = sortDirection === "asc" ? 1 : -1;
      return aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: "base" }) * direction;
    });
  }, [roles, sortDirection, sortKey]);

  function setSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "lastSeenAt" ? "desc" : "asc");
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-muted">
            <SortableHeader
              active={sortKey === "title"}
              direction={sortDirection}
              icon={<IconSuitcase3Outline18 size={14} />}
              label="Role"
              onClick={() => setSort("title")}
            />
            {showCompany && (
              <SortableHeader
                active={sortKey === "company"}
                direction={sortDirection}
                icon={<IconUsersOutline18 size={14} />}
                label="Company"
                onClick={() => setSort("company")}
              />
            )}
            <SortableHeader
              active={sortKey === "category"}
              direction={sortDirection}
              icon={<IconTagsOutline18 size={14} />}
              label="Category"
              onClick={() => setSort("category")}
            />
            <SortableHeader
              active={sortKey === "location"}
              direction={sortDirection}
              icon={<IconLocation2Outline18 size={14} />}
              label="Location"
              onClick={() => setSort("location")}
            />
            <SortableHeader
              active={sortKey === "seniority"}
              direction={sortDirection}
              icon={<IconAwardOutline18 size={14} />}
              label="Seniority"
              onClick={() => setSort("seniority")}
            />
            {showWorkMode && (
              <SortableHeader
                active={sortKey === "workMode"}
                direction={sortDirection}
                icon={<IconToggle3Outline18 size={14} />}
                label="Work mode"
                onClick={() => setSort("workMode")}
              />
            )}
            <SortableHeader
              active={sortKey === "lastSeenAt"}
              direction={sortDirection}
              icon={<IconCalendarDaysOutline18 size={14} />}
              label="Posted"
              onClick={() => setSort("lastSeenAt")}
            />
          </tr>
        </thead>
        <tbody>
          {sortedRoles.map((role) => (
            <tr
              className="border-b border-line last:border-0 hover:bg-stone-50/70"
              key={role.id ?? `${role.company}-${role.title}-${role.location}`}
            >
              <td className="px-4 py-3">
                {role.sourceUrl ? (
                  <a
                    className="font-medium text-ink underline-offset-4 hover:underline"
                    href={role.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {role.title}
                  </a>
                ) : (
                  <span className="font-medium text-ink">{role.title}</span>
                )}
              </td>
              {showCompany && (
                <td className="px-4 py-3">
                  <Link
                    className="text-muted underline-offset-4 hover:text-ink hover:underline"
                    href={`/company/${role.companySlug}`}
                  >
                    {role.company}
                  </Link>
                </td>
              )}
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
              {showWorkMode && <td className="px-4 py-3 text-muted">{role.workMode}</td>}
              <td className="px-4 py-3 tabular-nums text-muted">
                {role.lastSeenAt ? role.lastSeenAt.slice(0, 10) : "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortableHeader({
  active,
  direction,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  direction: SortDirection;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3 font-medium" aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}>
      <button
        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium uppercase tracking-[0.08em] transition ${
          active
            ? "border-accent/30 bg-teal-50 text-teal-900"
            : "border-line bg-paper text-muted hover:border-accent/30 hover:bg-selected hover:text-ink"
        }`}
        onClick={onClick}
        type="button"
      >
        <span className="shrink-0">{icon}</span>
        <span>{label}</span>
        <span className="shrink-0 text-ink">
          {active ? (
            direction === "asc" ? (
              <IconChevronUpOutline18 size={13} />
            ) : (
              <IconChevronDownOutline18 size={13} />
            )
          ) : (
            <IconChevronExpandYOutline18 size={13} />
          )}
        </span>
      </button>
    </th>
  );
}

function getSortValue(role: Role, sortKey: SortKey) {
  if (sortKey === "location") return `${role.country || ""} ${role.location || ""}`;
  return String(role[sortKey] || "");
}
