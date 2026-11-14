"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { FormEvent } from "react";

type Tank = {
  id: string;
  name: string;
  tank_code: string;
  site_id: string;
  product: string | null;
  capacity: number | null;
  capacity_unit: string | null;
  status: string;
  description?: string | null;
};

type Site = {
  id: string;
  name: string;
  code?: string | null;
  location?: string | null;
  status?: string | null;
};

type InventoryResponse = {
  tanks: Tank[];
  sites: Site[];
  canManage: boolean;
  error?: string;
};

const filters = ["All", "Normal", "Warning", "Critical", "Offline", "Maintenance"];

function formatCapacity(value: number | null, unit: string | null) {
  if (value == null || !Number.isFinite(Number(value))) return "Not configured";
  return `${Number(value).toLocaleString()} ${unit || "L"}`;
}

function statusStyle(status: string) {
  switch (status.toLowerCase()) {
    case "normal":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "warning":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "critical":
      return "bg-red-50 text-red-700 ring-red-200";
    case "maintenance":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "offline":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

export default function TankInventoryPage() {
  const [data, setData] = useState<InventoryResponse>({
    tanks: [],
    sites: [],
    canManage: false,
  });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Tank | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [form, setForm] = useState({
    name: "",
    tank_code: "",
    site_id: "",
    product: "",
    capacity: "",
    capacity_unit: "L",
    status: "normal",
    description: "",
  });

  async function handleCreateTank(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const siteId = form.site_id || data.sites[0]?.id || "";
    if (!siteId) {
      setFormError("Register a site before creating a tank.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/assets/tanks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...form,
          site_id: siteId,
          capacity: form.capacity === "" ? null : Number(form.capacity),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to create tank.");
      }

      setForm({
        name: "",
        tank_code: "",
        site_id: "",
        product: "",
        capacity: "",
        capacity_unit: "L",
        status: "normal",
        description: "",
      });
      setShowCreateForm(false);
      await loadInventory(true);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to create tank.",
      );
    } finally {
      setSaving(false);
    }
  }

  const loadInventory = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await fetch("/api/assets/tanks", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      const result = (await response.json()) as InventoryResponse;

      if (!response.ok) {
        throw new Error(
          result.error ||
            (response.status === 401
              ? "Please sign in to access your tank inventory."
              : "Unable to load tank inventory."),
        );
      }

      setData({
        tanks: Array.isArray(result.tanks) ? result.tanks : [],
        sites: Array.isArray(result.sites) ? result.sites : [],
        canManage: Boolean(result.canManage),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "A network error prevented inventory from loading.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  async function handleDeleteTank() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(
        `/api/assets/tanks/${encodeURIComponent(deleteTarget.id)}`,
        { method: "DELETE", headers: { Accept: "application/json" } }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to delete tank.");
      setDeleteTarget(null);
      await loadInventory(true);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Unable to delete tank.");
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const siteNames = useMemo(
    () => new Map(data.sites.map((site) => [site.id, site.name])),
    [data.sites],
  );

  const visibleTanks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return data.tanks.filter((tank) => {
      const matchesStatus =
        filter === "All" ||
        tank.status?.toLowerCase() === filter.toLowerCase();

      const siteName = siteNames.get(tank.site_id) || "";

      const searchable = [
        tank.name,
        tank.tank_code,
        tank.product || "",
        siteName,
        tank.status,
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && searchable.includes(normalizedQuery);
    });
  }, [data.tanks, filter, query, siteNames]);

  const totalCapacity = data.tanks.reduce(
    (sum, tank) => sum + Math.max(0, Number(tank.capacity) || 0),
    0,
  );

  const capacityUnits = new Set(
    data.tanks.map((tank) => (tank.capacity_unit || "L").toUpperCase()),
  );

  const mixedUnits = capacityUnits.size > 1;

  const normalCount = data.tanks.filter(
    (tank) => tank.status?.toLowerCase() === "normal",
  ).length;

  const attentionCount = data.tanks.filter((tank) =>
    ["warning", "critical", "offline", "maintenance"].includes(
      tank.status?.toLowerCase(),
    ),
  ).length;

  return (
    <main className="min-h-screen bg-[#f3f8f5] p-4 text-[#18352b] sm:p-7">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#103e32] via-[#17664d] to-[#20a779] p-6 text-white shadow-xl sm:p-9">
          <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border-[35px] border-white/10" />

          <div className="relative flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.24em] text-emerald-200">
                Asset Intelligence / Storage
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Tank Inventory
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/80">
                Manage registered storage assets, review configuration and
                access the monitoring workspace.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-50">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Database-backed inventory
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {data.canManage && (
                <button
                  type="button"
                  onClick={() => {
                    setFormError("");
                    setShowCreateForm((current) => !current);
                  }}
                  className="rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-emerald-900 transition hover:shadow-lg"
                >
                  {showCreateForm ? "Close form" : "+ Register Tank"}
                </button>
              )}
              <button
                type="button"
                onClick={() => void loadInventory(true)}
                disabled={loading || refreshing}
                className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-bold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? "Refreshing..." : "↻ Refresh inventory"}
              </button>
              <Link
                href="/operations/live-monitoring"
                className="rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-emerald-900 transition hover:shadow-lg"
              >
                Live Monitoring →
              </Link>
            </div>
          </div>

          <div className="relative mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              {
                label: "REGISTERED TANKS",
                value: String(data.tanks.length),
                note: "Saved tank records",
              },
              {
                label: "REGISTERED SITES",
                value: String(data.sites.length),
                note: "Organization facilities",
              },
              {
                label: "NORMAL STATUS",
                value: String(normalCount),
                note: "Configured inventory status",
              },
              {
                label: "NEEDS ATTENTION",
                value: String(attentionCount),
                note: "Warning, critical, offline or maintenance",
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-white/15 bg-white/[.09] p-4 backdrop-blur-sm"
              >
                <p className="text-[10px] font-bold tracking-[.15em] text-emerald-100">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-black sm:text-3xl">
                  {loading ? "—" : metric.value}
                </p>
                <p className="mt-1 text-xs text-white/70">{metric.note}</p>
              </div>
            ))}
          </div>
        </header>

        {showCreateForm && data.canManage && (
          <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-2 text-xl font-extrabold">Register New Tank</h2>
            <p className="mb-5 text-sm text-slate-500">
              Register a storage tank and assign it to an organization site.
            </p>

            {formError && (
              <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </p>
            )}

            {data.sites.length === 0 ? (
              <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                No sites registered. Create a site before registering a tank.
              </p>
            ) : (
              <form onSubmit={handleCreateTank} className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-semibold">
                  Tank Name *
                  <input required maxLength={120} value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Diesel Storage Tank 01"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" />
                </label>

                <label className="space-y-1 text-sm font-semibold">
                  Tank Code *
                  <input required maxLength={40} pattern="[A-Za-z0-9_-]+"
                    value={form.tank_code}
                    onChange={(e) => setForm({ ...form, tank_code: e.target.value })}
                    placeholder="e.g. TNK-001"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" />
                </label>

                <label className="space-y-1 text-sm font-semibold">
                  Site *
                  <select required
                    value={form.site_id || data.sites[0]?.id || ""}
                    onChange={(e) => setForm({ ...form, site_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal">
                    {data.sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}{site.code ? ` (${site.code})` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm font-semibold">
                  Product
                  <input value={form.product}
                    onChange={(e) => setForm({ ...form, product: e.target.value })}
                    placeholder="e.g. Diesel, Water, Petrol"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" />
                </label>

                <label className="space-y-1 text-sm font-semibold">
                  Capacity
                  <input type="number" min="0.01" step="any"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    placeholder="e.g. 50000"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" />
                </label>

                <label className="space-y-1 text-sm font-semibold">
                  Capacity Unit
                  <select value={form.capacity_unit}
                    onChange={(e) => setForm({ ...form, capacity_unit: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal">
                    <option value="L">Litres (L)</option>
                    <option value="KL">Kilolitres (KL)</option>
                    <option value="M3">Cubic metres (M3)</option>
                    <option value="GAL">Gallons (GAL)</option>
                  </select>
                </label>

                <label className="space-y-1 text-sm font-semibold">
                  Status
                  <select value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal">
                    <option value="normal">Normal</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                    <option value="offline">Offline</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </label>

                <label className="space-y-1 text-sm font-semibold sm:col-span-2">
                  Description
                  <textarea rows={3} value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional tank details"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" />
                </label>

                <div className="flex flex-wrap gap-3 sm:col-span-2">
                  <button type="submit" disabled={saving}
                    className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
                    {saving ? "Saving Tank..." : "Save Tank"}
                  </button>
                  <button type="button" disabled={saving}
                    onClick={() => setShowCreateForm(false)}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        <section className="rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold">Storage assets</h2>
              <p className="mt-1 text-sm text-slate-500">
                Search registered tanks and inspect their configuration.
              </p>
            </div>

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tanks, sites, products..."
              aria-label="Search tanks"
              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:max-w-sm"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  filter === item
                    ? "bg-[#17664d] text-white"
                    : "border border-emerald-100 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-800"
                }`}
              >
                {item}
              </button>
            ))}
            <span className="self-center text-xs text-slate-400">
              {loading ? "Loading assets..." : `${visibleTanks.length} assets shown`}
            </span>
          </div>
        </section>

        {error && (
          <section
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
          >
            <p className="font-bold">Inventory could not be loaded</p>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={() => void loadInventory(true)}
              className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-2 font-bold hover:bg-red-100"
            >
              Try again
            </button>
          </section>
        )}

        {loading && !error && (
          <section
            aria-live="polite"
            className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3"
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-[24px] border border-emerald-100 bg-white"
              />
            ))}
          </section>
        )}

        {!loading && !error && visibleTanks.length > 0 && (
          <section className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
            {visibleTanks.map((tank) => {
              const status = tank.status || "Unspecified";
              const siteName =
                siteNames.get(tank.site_id) || "Site not configured";

              return (
                <article
                  key={tank.id}
                  className="group overflow-hidden rounded-[24px] border border-emerald-100 bg-white shadow-[0_8px_30px_rgba(20,83,55,.06)] transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_18px_45px_rgba(20,83,55,.13)]"
                >
                  <div className="border-b border-slate-100 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold tracking-widest text-emerald-700">
                          {tank.tank_code || "UNASSIGNED CODE"}
                        </p>
                        <h3 className="mt-2 break-words text-lg font-extrabold">
                          {tank.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {siteName}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${statusStyle(status)}`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="rounded-2xl bg-[#f3f8f5] p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Registered capacity
                      </p>
                      <p className="mt-2 break-words text-2xl font-black text-[#17664d]">
                        {formatCapacity(tank.capacity, tank.capacity_unit)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Configuration value; not a measured liquid volume.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-100 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Product
                        </p>
                        <p className="mt-1 break-words font-bold text-slate-800">
                          {tank.product || "Not specified"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-100 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Site
                        </p>
                        <p className="mt-1 break-words font-bold text-slate-800">
                          {siteName}
                        </p>
                      </div>
                    </div>

                    {tank.description && (
                      <p className="text-sm leading-6 text-slate-600">
                        {tank.description}
                      </p>
                    )}

                    <Link
                      href="/operations/live-monitoring"
                      className="block rounded-xl bg-[#17664d] px-4 py-3 text-center text-sm font-extrabold text-white transition hover:bg-[#124f3c]"
                    >
                      Open monitoring workspace ↗
                    </Link>
                    {data.canManage && (
                      <button type="button" onClick={() => { setDeleteError(""); setDeleteTarget(tank); }} className="mt-3 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-300">
                        Delete tank
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs font-semibold text-slate-600">
                    <span>Tank ID: {tank.tank_code}</span>
                    <span>{tank.capacity_unit || "L"} capacity unit</span>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {!loading && !error && visibleTanks.length === 0 && (
          <section className="rounded-2xl border border-dashed border-emerald-200 bg-white p-10 text-center sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-700">
              {data.tanks.length === 0 ? "▤" : "⌕"}
            </div>
            <h3 className="mt-4 text-lg font-extrabold">
              {data.tanks.length === 0
                ? "No tanks registered yet"
                : "No matching tanks"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {data.tanks.length === 0
                ? "Your organization has no tank records yet. Add a tank through your authorized asset-management workflow."
                : "Try another search term or clear the selected status filter."}
            </p>
            {data.tanks.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilter("All");
                }}
                className="mt-4 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"
              >
                Clear filters
              </button>
            )}
            {data.canManage && data.tanks.length === 0 && (
              <Link
                href="/assets/tanks"
                className="mt-4 inline-block rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"
              >
                Open tank management
              </Link>
            )}
          </section>
        )}

        <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-900">
          <strong>Telemetry integrity:</strong> This page displays saved tank
          configuration only. It does not invent fill levels, temperatures,
          pressures, or live sensor readings. Simulation and physical-device
          telemetry must be identified separately in Live Monitoring.
        </p>

        {!mixedUnits && data.tanks.length > 0 && (
          <p className="text-right text-xs text-slate-400">
            Combined registered capacity:{" "}
            {totalCapacity.toLocaleString()} {Array.from(capacityUnits)[0]}
          </p>
        )}
      </div>
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="delete-tank-title" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <h2 id="delete-tank-title" className="text-lg font-extrabold text-slate-900 dark:text-white">Confirm tank deletion</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Delete <strong>{deleteTarget.name}</strong> ({deleteTarget.tank_code})? This action cannot be undone.
            </p>
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Tanks with linked devices or sensors cannot be deleted. Historical telemetry and alerts are retained, but their tank reference may become unassigned.
            </p>
            {deleteError && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{deleteError}</p>}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" disabled={deleting} onClick={() => { setDeleteTarget(null); setDeleteError(""); }} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200">Cancel</button>
              <button type="button" disabled={deleting} onClick={handleDeleteTank} className="rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50">{deleting ? "Deleting..." : "Confirm deletion"}</button>
            </div>
          </section>
        </div>
      )}

    </main>
  );
}
