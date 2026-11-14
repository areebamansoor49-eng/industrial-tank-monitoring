"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

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
};

type InventoryResponse = {
  tanks?: Tank[];
  sites?: Site[];
  error?: string;
};

type TankForm = {
  name: string;
  tank_code: string;
  site_id: string;
  product: string;
  capacity: string;
  capacity_unit: string;
  status: string;
  description: string;
};

const emptyForm: TankForm = {
  name: "",
  tank_code: "",
  site_id: "",
  product: "",
  capacity: "",
  capacity_unit: "L",
  status: "normal",
  description: "",
};

function capacity(tank: Tank) {
  if (tank.capacity == null) return "Not configured";
  return `${Number(tank.capacity).toLocaleString()} ${tank.capacity_unit || "L"}`;
}

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case "normal":
      return "bg-emerald-500/10 text-emerald-600";
    case "warning":
      return "bg-amber-500/10 text-amber-600";
    case "critical":
      return "bg-red-500/10 text-red-600";
    case "offline":
      return "bg-slate-500/10 text-slate-500";
    case "maintenance":
      return "bg-violet-500/10 text-violet-600";
    default:
      return "bg-blue-500/10 text-blue-600";
  }
}

export default function InventoryControlPage() {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<Tank | null>(null);
  const [form, setForm] = useState<TankForm>(emptyForm);
  const [formError, setFormError] = useState("");

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/assets/tanks", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      const result: InventoryResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load inventory.");
      }

      const records = result.tanks || [];
      setTanks(records);
      setSites(result.sites || []);
      setSelectedId((current) =>
        records.some((tank) => tank.id === current)
          ? current
          : ""
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const filteredTanks = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return tanks;

    return tanks.filter((tank) =>
      [
        tank.name,
        tank.tank_code,
        tank.product || "",
        tank.status,
        sites.find((site) => site.id === tank.site_id)?.name || "",
      ].join(" ").toLowerCase().includes(term)
    );
  }, [tanks, sites, query]);

  const selectedTank = tanks.find((tank) => tank.id === selectedId);

  const configuredCount = tanks.filter(
    (tank) => tank.capacity != null && Number(tank.capacity) > 0
  ).length;

  const totalCapacity = tanks.reduce(
    (total, tank) => total + (Number(tank.capacity) || 0),
    0
  );

  const siteName = (siteId: string) =>
    sites.find((site) => site.id === siteId)?.name || "Site unavailable";

  function openEditor(tank: Tank) {
    setEditing(tank);
    setForm({
      name: tank.name,
      tank_code: tank.tank_code,
      site_id: tank.site_id,
      product: tank.product || "",
      capacity: tank.capacity == null ? "" : String(tank.capacity),
      capacity_unit: tank.capacity_unit || "L",
      status: tank.status,
      description: tank.description || "",
    });
    setFormError("");
    setSuccess("");
  }

  function closeEditor() {
    if (saving) return;
    setEditing(null);
    setFormError("");
  }

  async function saveTank(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;

    setSaving(true);
    setFormError("");
    setSuccess("");

    const payload = {
      name: form.name.trim(),
      tank_code: form.tank_code.trim(),
      site_id: form.site_id,
      product: form.product.trim() || null,
      capacity: form.capacity === "" ? null : Number(form.capacity),
      capacity_unit: form.capacity_unit,
      status: form.status,
      description: form.description.trim() || null,
    };

    try {
      const response = await fetch(
        `/api/assets/tanks/${encodeURIComponent(editing.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update tank.");
      }

      setTanks((current) =>
        current.map((tank) =>
          tank.id === editing.id ? { ...tank, ...payload } : tank
        )
      );

      setEditing(null);
      setSuccess("Tank inventory record updated successfully.");

      // Reload the saved record from the database.
      await loadInventory();
      setSuccess("Tank inventory record updated successfully.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to update tank.");
    } finally {
      setSaving(false);
    }
  }

  const fieldClass =
    "mt-1.5 w-full rounded-xl border px-3.5 py-3 text-sm outline-none focus:border-cyan-500";
  const fieldStyle = {
    borderColor: "var(--border)",
    background: "var(--background)",
    color: "var(--foreground)",
  };

  return (
    <main className="min-h-full space-y-7 p-5 sm:p-8"
      style={{ color: "var(--foreground)" }}>

      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold tracking-[.18em] text-cyan-600">
            STOCK & CAPACITY
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Inventory Control
          </h1>
          <p className="mt-2 max-w-2xl text-sm opacity-70">
            Manage registered tank inventory records, configuration and capacity.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void loadInventory()}
            disabled={loading}
            className="rounded-xl border px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
          <Link
            href="/assets/tanks"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            style={{ background: "var(--primary, #0891b2)" }}
          >
            Manage tanks →
          </Link>
        </div>
      </header>

      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-600">
          {success}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Registered tanks", value: tanks.length, note: "Database records" },
          { label: "Configured tanks", value: configuredCount, note: "Capacity configured" },
          { label: "Registered sites", value: sites.length, note: "Organization facilities" },
          {
            label: "Combined capacity",
            value: `${totalCapacity.toLocaleString()}`,
            note: "Configured numeric capacity; see units per tank",
          },
        ].map((metric) => (
          <article key={metric.label}
            className="rounded-2xl border p-5"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <p className="text-sm opacity-65">{metric.label}</p>
            <p className="mt-3 text-2xl font-semibold tabular-nums">
              {metric.value}
            </p>
            <p className="mt-2 text-xs opacity-55">{metric.note}</p>
          </article>
        ))}
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600">
          {error}
          <button onClick={() => void loadInventory()} className="ml-3 font-semibold underline">
            Try again
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="flex flex-col justify-between gap-3 border-b p-5 sm:flex-row sm:items-center"
          style={{ borderColor: "var(--border)" }}>
          <div>
            <h2 className="font-semibold">Tank stock register</h2>
            <p className="mt-1 text-xs opacity-60">
              Organization database records · Select a tank to inspect or update
            </p>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tanks, products or sites..."
            aria-label="Search inventory"
            className="w-full rounded-xl border px-4 py-2.5 text-sm sm:max-w-xs"
            style={fieldStyle}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide opacity-60"
              style={{ background: "var(--background)" }}>
              <tr>
                <th className="px-5 py-4">Tank</th>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Site</th>
                <th className="px-5 py-4">Capacity</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTanks.map((tank) => (
                <tr key={tank.id} className="border-t"
                  style={{
                    borderColor: "var(--border)",
                    background: selectedId === tank.id ? "var(--background)" : "transparent",
                  }}>
                  <td className="px-5 py-4">
                    <p className="font-semibold">{tank.name}</p>
                    <p className="mt-1 text-xs opacity-55">{tank.tank_code}</p>
                  </td>
                  <td className="px-5 py-4">{tank.product || "Not specified"}</td>
                  <td className="px-5 py-4">{siteName(tank.site_id)}</td>
                  <td className="px-5 py-4 tabular-nums">{capacity(tank)}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(tank.status)}`}>
                      {tank.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => {
                        setSelectedId(tank.id);
                        setSuccess("");
                      }}
                      className="rounded-lg border px-3 py-2 text-xs font-semibold"
                      style={{
                        borderColor: selectedId === tank.id ? "var(--primary, #0891b2)" : "var(--border)",
                        color: "var(--primary, #0891b2)",
                      }}
                    >
                      {selectedId === tank.id ? "Viewing ✓" : "View details →"}
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && filteredTanks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center opacity-60">
                    {tanks.length === 0
                      ? "No registered tanks yet. Add a tank from Tank Inventory."
                      : "No tanks match your search."}
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center opacity-60">
                    Loading inventory records...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedTank && (
        <section className="scroll-mt-6 rounded-2xl border p-5 sm:p-7"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[.16em] text-cyan-600">
                INVENTORY RECORD DETAILS
              </p>
              <h2 className="mt-2 text-xl font-semibold">{selectedTank.name}</h2>
              <p className="mt-1 text-sm opacity-60">{selectedTank.tank_code}</p>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${statusClass(selectedTank.status)}`}>
              {selectedTank.status}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Product", selectedTank.product || "Not specified"],
              ["Registered site", siteName(selectedTank.site_id)],
              ["Maximum capacity", capacity(selectedTank)],
              ["Asset status", selectedTank.status],
              ["Stock level", "No verified reading"],
              ["Last measurement", "No telemetry received"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border p-4"
                style={{ borderColor: "var(--border)", background: "var(--background)" }}>
                <p className="text-xs opacity-60">{label}</p>
                <p className="mt-2 text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm">
            <p className="font-semibold text-amber-600">Measurement status</p>
            <p className="mt-1 opacity-75">
              Current stock cannot be verified because no measurement is available.
              Configured tank capacity is not the same as current stock.
            </p>
          </div>

          {selectedTank.description && (
            <div className="mt-4">
              <p className="text-xs opacity-60">Description</p>
              <p className="mt-1 text-sm">{selectedTank.description}</p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => openEditor(selectedTank)}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: "var(--primary, #0891b2)" }}
            >
              Edit inventory record
            </button>
            <Link href="/operations/live-monitoring"
              className="rounded-xl border px-4 py-2.5 text-sm font-semibold"
              style={{ borderColor: "var(--border)" }}>
              Live monitoring →
            </Link>
            <Link href="/inventory/reconciliation"
              className="rounded-xl border px-4 py-2.5 text-sm font-semibold"
              style={{ borderColor: "var(--border)" }}>
              Reconciliation →
            </Link>
          </div>
        </section>
      )}

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div>
          <h2 className="font-semibold">Inventory reconciliation</h2>
          <p className="mt-1 text-sm opacity-60">
            Review recorded inventory and reconciliation workflow.
          </p>
        </div>
        <Link href="/inventory/reconciliation"
          className="rounded-xl border px-4 py-2.5 text-sm font-semibold"
          style={{ borderColor: "var(--border)" }}>
          Open reconciliation →
        </Link>
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventory-edit-title"
            className="my-auto w-full max-w-2xl rounded-2xl border p-5 shadow-2xl sm:p-7"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface)",
              color: "var(--foreground)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[.16em] text-cyan-600">
                  INVENTORY MANAGEMENT
                </p>
                <h2 id="inventory-edit-title" className="mt-2 text-xl font-semibold">
                  Update tank record
                </h2>
                <p className="mt-1 text-sm opacity-60">
                  Changes will be saved to your organization database.
                </p>
              </div>
              <button type="button" onClick={closeEditor} disabled={saving}
                aria-label="Close editor"
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)" }}>
                ✕
              </button>
            </div>

            <form onSubmit={saveTank} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Tank name *
                  <input required maxLength={120} value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={fieldClass} style={fieldStyle} />
                </label>

                <label className="text-sm font-medium">
                  Tank code *
                  <input required maxLength={40} value={form.tank_code}
                    onChange={(e) => setForm({ ...form, tank_code: e.target.value })}
                    className={fieldClass} style={fieldStyle} />
                </label>

                <label className="text-sm font-medium">
                  Product
                  <input value={form.product}
                    onChange={(e) => setForm({ ...form, product: e.target.value })}
                    placeholder="e.g. Diesel"
                    className={fieldClass} style={fieldStyle} />
                </label>

                <label className="text-sm font-medium">
                  Registered site *
                  <select required value={form.site_id}
                    onChange={(e) => setForm({ ...form, site_id: e.target.value })}
                    className={fieldClass} style={fieldStyle}>
                    <option value="">Select site</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-medium">
                  Maximum capacity
                  <input type="number" min="0.001" step="any"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    placeholder="Enter capacity"
                    className={fieldClass} style={fieldStyle} />
                </label>

                <label className="text-sm font-medium">
                  Capacity unit
                  <select value={form.capacity_unit}
                    onChange={(e) => setForm({ ...form, capacity_unit: e.target.value })}
                    className={fieldClass} style={fieldStyle}>
                    <option value="L">Litres (L)</option>
                    <option value="KL">Kilolitres (KL)</option>
                    <option value="M3">Cubic metres (M3)</option>
                    <option value="GAL">Gallons (GAL)</option>
                  </select>
                </label>

                <label className="text-sm font-medium sm:col-span-2">
                  Asset status
                  <select value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className={fieldClass} style={fieldStyle}>
                    {["normal", "warning", "critical", "offline", "maintenance"].map((status) => (
                      <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-medium sm:col-span-2">
                  Description
                  <textarea rows={3} value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={fieldClass} style={fieldStyle} />
                </label>
              </div>

              {formError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3 border-t pt-5"
                style={{ borderColor: "var(--border)" }}>
                <button type="button" onClick={closeEditor} disabled={saving}
                  className="rounded-xl border px-5 py-2.5 text-sm font-semibold"
                  style={{ borderColor: "var(--border)" }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving || sites.length === 0}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "var(--primary, #0891b2)" }}>
                  {saving ? "Saving changes..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
