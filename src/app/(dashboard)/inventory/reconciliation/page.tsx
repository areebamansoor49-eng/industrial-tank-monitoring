"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Reading = {
  value: number;
  unit: string | null;
  quality: string;
  recordedAt: string;
  metadata?: Record<string, unknown>;
};

type Tank = {
  id: string;
  name: string;
  tank_code: string;
  site_id: string | null;
  site_name: string;
  product: string | null;
  capacity: number | null;
  capacity_unit: string | null;
  status: string;
  telemetry: Record<string, Reading>;
};

type ApiResponse = {
  tanks?: Tank[];
  error?: string;
  generated_at?: string;
};

function formatDate(value?: string) {
  if (!value) return "No reading available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid timestamp";
  return date.toLocaleString();
}

function formatNumber(value?: number) {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

function isSimulated(readings: Record<string, Reading>) {
  const values = Object.values(readings);
  return values.length > 0 && values.every(
    (reading) => reading.quality?.toLowerCase() === "simulated",
  );
}

export default function Page() {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/inventory/reconciliation", {
        cache: "no-store",
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok) throw new Error(result.error || "Unable to load reconciliation data.");

      const records = result.tanks ?? [];
      setTanks(records);
      setSelectedId((current) =>
        records.some((tank) => tank.id === current)
          ? current
          : records[0]?.id ?? "",
      );
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selected = tanks.find((tank) => tank.id === selectedId);

  const counts = useMemo(() => ({
    total: tanks.length,
    withReadings: tanks.filter((tank) => Object.keys(tank.telemetry).length > 0).length,
    simulated: tanks.filter((tank) => isSimulated(tank.telemetry)).length,
    unavailable: tanks.filter((tank) => Object.keys(tank.telemetry).length === 0).length,
  }), [tanks]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return tanks.filter((tank) => {
      const matchesSearch = !term || [
        tank.name,
        tank.tank_code,
        tank.product ?? "",
        tank.site_name,
      ].some((value) => value.toLowerCase().includes(term));

      const hasReading = Object.keys(tank.telemetry).length > 0;
      const simulated = isSimulated(tank.telemetry);

      const matchesFilter =
        filter === "all" ||
        (filter === "available" && hasReading) ||
        (filter === "missing" && !hasReading) ||
        (filter === "simulated" && simulated);

      return matchesSearch && matchesFilter;
    });
  }, [tanks, search, filter]);

  const level = selected?.telemetry.level;
  const volume = selected?.telemetry.totalized_volume;
  const temperature = selected?.telemetry.temperature;
  const flow = selected?.telemetry.flow_rate;

  const latestTimestamp = selected
    ? Object.values(selected.telemetry)
        .map((reading) => reading.recordedAt)
        .filter(Boolean)
        .sort()
        .at(-1)
    : undefined;

  return (
    <main className="min-h-screen space-y-6 p-4 sm:p-6 lg:p-8"
      style={{ background: "var(--background)", color: "var(--foreground)" }}>

      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600">
            Inventory / Operations
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Inventory Reconciliation
          </h1>
          <p className="mt-2 max-w-2xl text-sm opacity-70">
            Review registered tank inventory against the latest available telemetry readings.
          </p>
        </div>

        <button onClick={() => void loadData()} disabled={loading}
          className="rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          {loading ? "Refreshing..." : "↻ Refresh data"}
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Registered tanks", counts.total, "Database inventory"],
          ["With telemetry", counts.withReadings, "Latest readings found"],
          ["Simulated", counts.simulated, "Simulator-origin readings"],
          ["No readings", counts.unavailable, "Telemetry unavailable"],
        ].map(([label, value, note]) => (
          <div key={String(label)} className="rounded-2xl border p-4 sm:p-5"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <p className="text-xs opacity-65">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
            <p className="mt-1 text-xs opacity-55">{note}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border p-4 sm:p-5"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Tank telemetry register</h2>
            <p className="mt-1 text-xs opacity-60">
              {tanks.length} database record(s) · Last refreshed: {lastRefresh || "—"}
            </p>
          </div>
          <input value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tank, code, product or site..."
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none sm:max-w-xs"
            style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ["all", "All tanks"],
            ["available", "With readings"],
            ["simulated", "Simulated"],
            ["missing", "No readings"],
          ].map(([value, label]) => (
            <button key={value} onClick={() => setFilter(value)}
              className="rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={{
                borderColor: filter === value ? "var(--primary, #0891b2)" : "var(--border)",
                background: filter === value ? "var(--primary, #0891b2)" : "transparent",
                color: filter === value ? "#fff" : "var(--foreground)",
              }}>
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b text-xs opacity-60" style={{ borderColor: "var(--border)" }}>
                <th className="px-3 py-3">Tank</th>
                <th className="px-3 py-3">Product / Site</th>
                <th className="px-3 py-3">Measured level</th>
                <th className="px-3 py-3">Measured volume</th>
                <th className="px-3 py-3">Data source</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && tanks.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center opacity-60">Loading database records...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center opacity-60">No matching tank records found.</td></tr>
              ) : filtered.map((tank) => {
                const hasReading = Object.keys(tank.telemetry).length > 0;
                const simulated = isSimulated(tank.telemetry);

                return (
                  <tr key={tank.id} className="border-b"
                    style={{ borderColor: "var(--border)", background: selectedId === tank.id ? "var(--muted, rgba(127,127,127,.08))" : "transparent" }}>
                    <td className="px-3 py-4">
                      <p className="font-semibold">{tank.name}</p>
                      <p className="mt-1 text-xs opacity-55">{tank.tank_code}</p>
                    </td>
                    <td className="px-3 py-4">
                      <p>{tank.product || "Not specified"}</p>
                      <p className="mt-1 text-xs opacity-55">{tank.site_name}</p>
                    </td>
                    <td className="px-3 py-4 tabular-nums">
                      {tank.telemetry.level
                        ? `${formatNumber(tank.telemetry.level.value)} ${tank.telemetry.level.unit ?? "%"}`
                        : "Unavailable"}
                    </td>
                    <td className="px-3 py-4 tabular-nums">
                      {tank.telemetry.totalized_volume
                        ? `${formatNumber(tank.telemetry.totalized_volume.value)} ${tank.telemetry.totalized_volume.unit ?? ""}`
                        : "Unavailable"}
                    </td>
                    <td className="px-3 py-4">
                      <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{
                          background: !hasReading ? "rgba(148,163,184,.15)" : simulated ? "rgba(217,119,6,.14)" : "rgba(16,185,129,.14)",
                          color: !hasReading ? "var(--foreground)" : simulated ? "#d97706" : "#059669",
                        }}>
                        {!hasReading ? "No reading" : simulated ? "SIMULATED" : "Telemetry"}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <button onClick={() => setSelectedId(tank.id)}
                        className="rounded-lg border px-3 py-2 text-xs font-semibold"
                        style={{ borderColor: "var(--border)" }}>
                        View details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <section className="rounded-2xl border p-4 sm:p-6"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600">Selected tank record</p>
              <h2 className="mt-1 text-xl font-bold">{selected.name}</h2>
              <p className="mt-1 text-sm opacity-60">{selected.tank_code} · {selected.site_name}</p>
            </div>
            <span className="w-fit rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{
                background: Object.keys(selected.telemetry).length === 0 ? "rgba(148,163,184,.15)" : isSimulated(selected.telemetry) ? "rgba(217,119,6,.14)" : "rgba(16,185,129,.14)",
                color: Object.keys(selected.telemetry).length === 0 ? "var(--foreground)" : isSimulated(selected.telemetry) ? "#d97706" : "#059669",
              }}>
              {Object.keys(selected.telemetry).length === 0 ? "TELEMETRY UNAVAILABLE" : isSimulated(selected.telemetry) ? "SIMULATION DATA" : "TELEMETRY DATA"}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Measured level", level ? `${formatNumber(level.value)} ${level.unit ?? "%"}` : "Unavailable"],
              ["Measured volume", volume ? `${formatNumber(volume.value)} ${volume.unit ?? ""}` : "Unavailable"],
              ["Temperature", temperature ? `${formatNumber(temperature.value)} ${temperature.unit ?? ""}` : "Unavailable"],
              ["Flow rate", flow ? `${formatNumber(flow.value)} ${flow.unit ?? ""}` : "Unavailable"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border p-4"
                style={{ borderColor: "var(--border)" }}>
                <p className="text-xs opacity-60">{label}</p>
                <p className="mt-2 text-lg font-bold tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="opacity-55">Configured tank capacity</p>
              <p className="mt-1 font-semibold">
                {selected.capacity != null
                  ? `${formatNumber(selected.capacity)} ${selected.capacity_unit ?? ""}`
                  : "Not configured"}
              </p>
            </div>
            <div>
              <p className="opacity-55">Product</p>
              <p className="mt-1 font-semibold">{selected.product || "Not specified"}</p>
            </div>
            <div>
              <p className="opacity-55">Latest reading timestamp</p>
              <p className="mt-1 font-semibold">{formatDate(latestTimestamp)}</p>
            </div>
            <div>
              <p className="opacity-55">Reading quality</p>
              <p className="mt-1 font-semibold">
                {Object.keys(selected.telemetry).length === 0
                  ? "No telemetry received"
                  : [...new Set(Object.values(selected.telemetry).map((reading) => reading.quality))].join(", ")}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border p-4 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--background)" }}>
            <p className="font-semibold">Reconciliation status</p>
            <p className="mt-1 opacity-70">
              {Object.keys(selected.telemetry).length === 0
                ? "No measured telemetry is available for this tank. Inventory variance cannot be calculated."
                : "Measured telemetry is available for review. A recorded stock or delivery baseline is not yet configured, so inventory variance cannot be calculated."}
            </p>
          </div>
        </section>
      )}

      <footer className="flex flex-wrap gap-3 text-sm">
        <a href="/inventory" className="font-semibold text-cyan-600">← Tank Inventory</a>
        <a href="/operations/live-monitoring" className="font-semibold text-cyan-600">Live Monitoring →</a>
        <a href="/reports" className="font-semibold text-cyan-600">Reports →</a>
      </footer>
    </main>
  );
}
