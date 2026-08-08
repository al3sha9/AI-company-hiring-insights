"use client";

import { useState } from "react";
import type { DashboardFilters, RolesResponse } from "@/lib/api-types";
import { RoleTable, type Role } from "@/components/RoleTable";

type PaginatedRoleTableProps = {
  initialPage: RolesResponse;
  filters: DashboardFilters;
  showCompany?: boolean;
  showWorkMode?: boolean;
};

const PAGE_SIZE = 50;

export function PaginatedRoleTable({
  initialPage,
  filters,
  showCompany = true,
  showWorkMode = false,
}: PaginatedRoleTableProps) {
  const [roles, setRoles] = useState<Role[]>(initialPage.roles);
  const [offset, setOffset] = useState(initialPage.offset);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const totalPages = Math.max(Math.ceil(initialPage.total / PAGE_SIZE), 1);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const from = initialPage.total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + roles.length, initialPage.total);
  const canGoPrev = offset > 0 && !isLoading;
  const canGoNext = offset + PAGE_SIZE < initialPage.total && !isLoading;

  async function goToPage(nextOffset: number) {
    if (nextOffset < 0 || nextOffset >= initialPage.total || isLoading) return;
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.days) params.set("days", filters.days.toString());
      if (filters.companySlug) params.set("company_slug", filters.companySlug);
      if (filters.category) params.set("category", filters.category);
      if (filters.country) params.set("country", filters.country);
      params.set("limit", PAGE_SIZE.toString());
      params.set("offset", nextOffset.toString());

      const response = await fetch(`/api/roles?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Failed to load roles");
      }
      const page = (await response.json()) as RolesResponse;
      setRoles(page.roles);
      setOffset(page.offset);
    } catch {
      setError("Could not load roles. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <RoleTable roles={roles} showCompany={showCompany} showWorkMode={showWorkMode} />
      <div className="flex flex-col gap-3 border-t border-line px-4 py-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span>
            Showing {from.toLocaleString()}-{to.toLocaleString()} of{" "}
            {initialPage.total.toLocaleString()} roles
          </span>
          <span className="ml-2 text-subtle">
            Page {currentPage.toLocaleString()} of {totalPages.toLocaleString()}
          </span>
          {error && <div className="mt-1 text-red-700">{error}</div>}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border border-line bg-paper px-3 py-2 font-medium text-ink hover:bg-selected disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canGoPrev}
            onClick={() => goToPage(offset - PAGE_SIZE)}
            type="button"
          >
            Previous
          </button>
          <button
            className="rounded-lg border border-line bg-paper px-3 py-2 font-medium text-ink hover:bg-selected disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canGoNext}
            onClick={() => goToPage(offset + PAGE_SIZE)}
            type="button"
          >
            {isLoading ? "Loading..." : "Next 50"}
          </button>
        </div>
      </div>
    </div>
  );
}
