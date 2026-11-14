"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type LinkItem = {
  label: string;
  href: string;
};

type Props = {
  title: string;
  description: string;
  metrics?: string[];
  links?: LinkItem[];
};

type RecordItem = {
  id: string;
  name: string;
  type: string;
  status: string;
  detail: string;
};

function getWorkspaceData(title: string): RecordItem[] {
  if (title.includes("Gateway")) {
    return [
      { id: "GW-001", name: "Main Facility Gateway", type: "Industrial Gateway", status: "Online", detail: "Last heartbeat: just now" },
      { id: "GW-002", name: "Secondary Facility Gateway", type: "Industrial Gateway", status: "Online", detail: "Last heartbeat: 2 min ago" },
      { id: "GW-003", name: "Backup Communications Gateway", type: "Industrial Gateway", status: "Warning", detail: "Signal strength requires review" },
    ];
  }

  if (title.includes("Device")) {
    return [
      { id: "LV-001", name: "Level Sensor — Tank 01", type: "Level Sensor", status: "Online", detail: "Assigned to TANK-001" },
      { id: "TMP-001", name: "Temperature Sensor — Tank 01", type: "Temperature Sensor", status: "Online", detail: "Assigned to TANK-001" },
      { id: "LV-003", name: "Level Sensor — Tank 03", type: "Level Sensor", status: "Warning", detail: "Low inventory threshold detected" },
      { id: "PRS-002", name: "Pressure Sensor — Tank 02", type: "Pressure Sensor", status: "Online", detail: "Assigned to TANK-002" },
    ];
  }

  if (title.includes("Alert")) {
    return [
      { id: "ALT-001", name: "Low Level Warning", type: "High Severity", status: "Open", detail: "TANK-003 is below the configured threshold" },
      { id: "ALT-002", name: "Gateway Signal Warning", type: "Medium Severity", status: "Open", detail: "GW-003 connectivity requires review" },
      { id: "ALT-003", name: "Telemetry Delay", type: "Low Severity", status: "Acknowledged", detail: "Telemetry stream recovered successfully" },
    ];
  }

  if (title.includes("Inventory")) {
    return [
      { id: "TANK-001", name: "Diesel Tank 01", type: "39,000 L", status: "Healthy", detail: "78% capacity" },
      { id: "TANK-002", name: "Diesel Tank 02", type: "27,000 L", status: "Healthy", detail: "54% capacity" },
      { id: "TANK-003", name: "Fuel Tank 03", type: "11,500 L", status: "Low Stock", detail: "23% capacity" },
    ];
  }

  if (title.includes("Report")) {
    return [
      { id: "RPT-001", name: "Inventory Summary", type: "Operational Report", status: "Ready", detail: "Current tank volumes and stock status" },
      { id: "RPT-002", name: "Asset Health Report", type: "Maintenance Report", status: "Ready", detail: "Gateway and device connectivity overview" },
      { id: "RPT-003", name: "Operational History", type: "Activity Report", status: "Ready", detail: "Recent alerts and operational events" },
    ];
  }

  if (title.includes("Logistics")) {
    return [
      { id: "DLV-001", name: "Diesel Delivery", type: "Scheduled", status: "Upcoming", detail: "Expected delivery: Tomorrow 09:00" },
      { id: "DLV-002", name: "Fuel Replenishment", type: "Transport", status: "In Transit", detail: "Destination: Main Storage Facility" },
      { id: "DLV-003", name: "Emergency Refill", type: "Priority Delivery", status: "Completed", detail: "Delivery completed successfully" },
    ];
  }

  if (title.includes("Incident")) {
    return [
      { id: "INC-001", name: "Low Stock Investigation", type: "Inventory Incident", status: "Open", detail: "TANK-003 requires operational review" },
      { id: "INC-002", name: "Connectivity Investigation", type: "Network Incident", status: "Investigating", detail: "GW-003 signal instability detected" },
      { id: "INC-003", name: "Telemetry Interruption", type: "System Incident", status: "Resolved", detail: "Service restored successfully" },
    ];
  }

  return [
    { id: "TANK-001", name: "Diesel Tank 01", type: "Tank Asset", status: "Online", detail: "78% capacity" },
    { id: "GW-001", name: "Main Facility Gateway", type: "Gateway", status: "Online", detail: "All communications operational" },
    { id: "LV-001", name: "Level Sensor — Tank 01", type: "Sensor", status: "Online", detail: "Telemetry active" },
  ];
}

function statusClass(status: string) {
  const value = status.toLowerCase();

  if (
    value.includes("online") ||
    value.includes("healthy") ||
    value.includes("ready") ||
    value.includes("completed") ||
    value.includes("resolved")
  ) {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (
    value.includes("warning") ||
    value.includes("low") ||
    value.includes("upcoming") ||
    value.includes("investigating")
  ) {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  if (value.includes("open") || value.includes("transit")) {
    return "bg-red-500/10 text-red-700 dark:text-red-300";
  }

  return "bg-slate-500/10 text-slate-700 dark:text-slate-300";
}

export default function WorkspacePage({
  title,
  description,
  metrics = ["Workspace ready", "Data integration pending", "Operational view"],
  links = [],
}: Props) {
  const initialRecords = useMemo(() => getWorkspaceData(title), [title]);

  const [records, setRecords] = useState(initialRecords);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);

  const statuses = ["All", ...Array.from(new Set(records.map((item) => item.status)))];

  const visibleRecords = records.filter((item) => {
    const matchesQuery =
      item.id.toLowerCase().includes(query.toLowerCase()) ||
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.type.toLowerCase().includes(query.toLowerCase());

    const matchesFilter = filter === "All" || item.status === filter;

    return matchesQuery && matchesFilter;
  });

  function refreshWorkspace() {
    setRecords([...records]);
    setMessage("Workspace refreshed successfully.");
    window.setTimeout(() => setMessage(""), 2500);
  }

  function handleAction(id: string) {
    if (title.includes("Alert")) {
      setRecords((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, status: "Acknowledged" }
            : item
        )
      );
      setMessage(`${id} acknowledged successfully.`);
    } else if (title.includes("Incident")) {
      setRecords((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, status: "Resolved" }
            : item
        )
      );
      setMessage(`${id} marked as resolved.`);
    } else if (title.includes("Report")) {
      setMessage(`${id} report generation started.`);
    } else {
      const record = records.find((item) => item.id === id);
      if (record) setSelectedRecord(record);
    }

    window.setTimeout(() => setMessage(""), 3000);
  }

  function actionLabel() {
    if (title.includes("Alert")) return "Acknowledge";
    if (title.includes("Incident")) return "Resolve";
    if (title.includes("Report")) return "Generate";
    return "View";
  }

  return (
    <main className="min-h-full p-5 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">Industrial Tank Monitoring</p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              {title}
            </h1>

            <p className="theme-muted mt-2 max-w-3xl text-sm leading-6">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={refreshWorkspace}
              className="glass-panel rounded-lg px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5"
            >
              ↻ Refresh
            </button>

            {title.includes("Inventory") && (
              <Link
                href="/inventory/reconciliation"
                className="theme-primary-button rounded-lg px-4 py-2.5 text-sm font-semibold"
              >
                Reconciliation
              </Link>
            )}

            {title.includes("Asset") && (
              <Link
                href="/assets/tanks"
                className="theme-primary-button rounded-lg px-4 py-2.5 text-sm font-semibold"
              >
                Manage Tanks
              </Link>
            )}
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            ✓ {message}
          </div>
        )}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric, index) => (
            <div key={metric} className="glass-panel rounded-xl p-5">
              <p className="theme-muted text-xs font-semibold uppercase tracking-wide">
                Operational metric
              </p>

              <p className="mt-3 text-lg font-bold">{metric}</p>

              <p className="theme-muted mt-2 text-sm">
                {records[index]?.detail || "Operational information available"}
              </p>
            </div>
          ))}
        </section>

        <section className="glass-panel mt-7 rounded-xl p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-bold">
                Operational Register
              </h2>

              <p className="theme-muted mt-1 text-sm">
                Search, filter and manage workspace records.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search records..."
                className="min-w-[220px] rounded-lg border border-black/10 bg-transparent px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10"
              />

              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilter("All");
                }}
                className="rounded-lg border border-black/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                type="button"
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  filter === status
                    ? "theme-primary-button"
                    : "border border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
            <div className="hidden grid-cols-[110px_1.5fr_1fr_auto_120px] gap-4 border-b border-black/10 px-5 py-3 text-xs font-bold uppercase tracking-wide opacity-60 md:grid dark:border-white/10">
              <span>ID</span>
              <span>Name</span>
              <span>Type / Detail</span>
              <span>Status</span>
              <span>Action</span>
            </div>

            {visibleRecords.length > 0 ? (
              visibleRecords.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 border-b border-black/10 px-5 py-4 last:border-b-0 md:grid-cols-[110px_1.5fr_1fr_auto_120px] md:items-center dark:border-white/10"
                >
                  <div className="text-sm font-bold">{item.id}</div>

                  <div>
                    <div className="text-sm font-semibold">{item.name}</div>
                    <div className="theme-muted mt-1 text-xs md:hidden">
                      {item.type}
                    </div>
                  </div>

                  <div className="theme-muted text-sm">
                    <div className="font-medium">{item.type}</div>
                    <div className="mt-1 text-xs">{item.detail}</div>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAction(item.id)}
                    className="theme-primary-button rounded-lg px-3 py-2 text-xs font-semibold transition hover:-translate-y-0.5"
                  >
                    {actionLabel()}
                  </button>
                </div>
              ))
            ) : (
              <div className="p-10 text-center">
                <p className="text-sm font-semibold">No matching records found</p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setFilter("All");
                  }}
                  className="theme-primary-button mt-4 rounded-lg px-4 py-2 text-sm font-semibold"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="glass-panel mt-7 rounded-xl p-5 sm:p-6">
          <h2 className="text-lg font-bold">Workspace Navigation</h2>

          <p className="theme-muted mt-2 text-sm leading-6">
            Move between operational workspaces and continue managing your
            industrial monitoring environment.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-black/10 px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                {link.label} →
              </Link>
            ))}

            <Link
              href="/dashboard"
              className="theme-primary-button rounded-lg px-4 py-2.5 text-sm font-semibold"
            >
              Back to Dashboard
            </Link>
          </div>
        </section>
      </div>

      {selectedRecord && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
          onClick={() => setSelectedRecord(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="asset-details-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xl rounded-2xl border border-black/10 bg-white p-6 text-slate-900 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-white sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                  Record details
                </p>
                <h2 id="asset-details-title" className="mt-2 text-2xl font-bold">
                  {selectedRecord.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {selectedRecord.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                aria-label="Close details"
                className="rounded-lg border border-slate-200 px-3 py-2 text-xl leading-none text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                ×
              </button>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Record ID</p>
                <p className="mt-2 break-all text-sm font-bold">{selectedRecord.id}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Type</p>
                <p className="mt-2 text-sm font-bold">{selectedRecord.type}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</p>
                <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusClass(selectedRecord.status)}`}>
                  {selectedRecord.status}
                </span>
              </div>
              <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Details</p>
                <p className="mt-2 text-sm font-medium">{selectedRecord.detail}</p>
              </div>
            </div>

            <p className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-800 dark:text-amber-200">
              Dashboard preview record. This entry is currently defined in the workspace UI and is not verified as a live database record.
            </p>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="theme-primary-button rounded-lg px-5 py-2.5 text-sm font-semibold"
              >
                Close Details
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
