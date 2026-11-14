"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Resource = "logistics" | "alerts" | "incidents" | "reports";
type RecordItem = Record<string, any>;

const configs = {
  logistics: {
    title: "Logistics & Deliveries",
    description: "Schedule deliveries and track operational movement records.",
    endpoint: "deliveries",
  },
  alerts: {
    title: "Alerts & Events",
    description: "Review, acknowledge and resolve operational alerts.",
    endpoint: "alerts",
  },
  incidents: {
    title: "Incident Management",
    description: "Record incidents and track their resolution lifecycle.",
    endpoint: "incidents",
  },
  reports: {
    title: "Reports & Analytics",
    description: "Review operational activity using records stored in your organization.",
    endpoint: "reports",
  },
};

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white";

const buttonClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800";

function dateLabel(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function statusClass(status: string) {
  if (["completed", "resolved", "closed"].includes(status))
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300";
  if (["critical", "open", "in_transit"].includes(status))
    return "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300";
  if (["warning", "acknowledged", "investigating", "scheduled"].includes(status))
    return "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300";
  return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
}

function Status({ value }: { value?: string | null }) {
  const text = value || "Unknown";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(text)}`}>
      {text.replaceAll("_", " ")}
    </span>
  );
}

function Metric({ label, value, detail }: { label: string; value: number | string; detail?: string }) {
  return (
    <div className="glass-panel rounded-xl p-5">
      <p className="theme-muted text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-3 text-3xl font-bold tabular-nums">{value}</p>
      {detail && <p className="theme-muted mt-1 text-xs">{detail}</p>}
    </div>
  );
}

export default function OperationalWorkspace({ resource }: { resource: Resource }) {
  const config = configs[resource];
  const isReports = resource === "reports";

  const [records, setRecords] = useState<RecordItem[]>([]);
  const [sites, setSites] = useState<RecordItem[]>([]);
  const [tanks, setTanks] = useState<RecordItem[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedTankId, setSelectedTankId] = useState("");
  const [report, setReport] = useState<RecordItem | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<RecordItem | null>(null);
  const [actionTarget, setActionTarget] = useState<RecordItem | null>(null);
  const [actionStatus, setActionStatus] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (resource === "reports") {
        const params = new URLSearchParams({ start: startDate, end: endDate });
        const response = await fetch(`/api/operations/reports?${params}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load reports.");
        setReport(data);
      } else {
        const response = await fetch(`/api/operations/${config.endpoint}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load records.");
        setRecords(data.records ?? []);
        setCanManage(Boolean(data.canManage));
      }

      if (resource === "logistics" || resource === "incidents" || resource === "alerts") {
        const response = await fetch("/api/assets/tanks", { cache: "no-store" });
        const data = await response.json();
        if (response.ok) {
          setSites(data.sites ?? []);
          setTanks(data.tanks ?? []);
          if (resource === "incidents") setCanManage((current) => current || Boolean(data.canManage));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [resource, config.endpoint, startDate, endDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSearch = !query || [
        record.reference_number,
        record.supplier,
        record.product,
        record.title,
        record.message,
        record.description,
        record.severity,
        record.status,
        record.tanks?.name,
        record.sites?.name,
      ].some((value) => String(value ?? "").toLowerCase().includes(query));

      const matchesFilter =
        filter === "all" ||
        record.status === filter ||
        record.severity === filter;

      return matchesSearch && matchesFilter;
    });
  }, [records, search, filter]);

  const metrics = useMemo(() => {
    if (resource === "logistics") {
      return [
        ["Total Deliveries", records.length],
        ["Scheduled", records.filter((r) => r.status === "scheduled").length],
        ["In Transit", records.filter((r) => r.status === "in_transit").length],
        ["Completed", records.filter((r) => r.status === "completed").length],
      ];
    }
    if (resource === "alerts") {
      return [
        ["Total Alerts", records.length],
        ["Open", records.filter((r) => r.status === "open").length],
        ["Critical", records.filter((r) => r.severity === "critical").length],
        ["Acknowledged", records.filter((r) => r.status === "acknowledged").length],
      ];
    }
    return [
      ["Total Incidents", records.length],
      ["Open", records.filter((r) => r.status === "open").length],
      ["Investigating", records.filter((r) => r.status === "investigating").length],
      ["Resolved", records.filter((r) => ["resolved", "closed"].includes(r.status)).length],
    ];
  }, [records, resource]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());

    try {
      const response = await fetch(`/api/operations/${config.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save record.");

      setShowForm(false);
      setNotice(
        resource === "logistics"
          ? "Delivery scheduled successfully."
          : resource === "alerts"
            ? "Alert created successfully."
            : "Incident created successfully."
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save record.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!actionTarget || !actionStatus) return;

    setSaving(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = { status: actionStatus };

    if (resource === "logistics" && actionStatus === "completed") {
      body.delivered_volume = Number(form.get("delivered_volume"));
    }

    try {
      const response = await fetch(`/api/operations/${config.endpoint}/${actionTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update record.");

      setActionTarget(null);
      setActionStatus("");
      setNotice("Record updated successfully.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update record.");
    } finally {
      setSaving(false);
    }
  }

  function exportCSV() {
    if (!report) return;

    const sections = [
      ["Report Period", report.period?.start ?? "", report.period?.end ?? ""],
      [],
      ["Deliveries"],
      ["ID", "Status", "Planned Volume", "Delivered Volume", "Unit", "Scheduled"],
      ...(report.deliveries ?? []).map((r: RecordItem) => [
        r.id, r.status, r.planned_volume, r.delivered_volume, r.volume_unit, r.scheduled_at,
      ]),
      [],
      ["Alerts"],
      ["ID", "Severity", "Status", "Triggered At"],
      ...(report.alerts ?? []).map((r: RecordItem) => [r.id, r.severity, r.status, r.triggered_at]),
      [],
      ["Incidents"],
      ["ID", "Status", "Opened At", "Resolved At"],
      ...(report.incidents ?? []).map((r: RecordItem) => [r.id, r.status, r.opened_at, r.resolved_at]),
      [],
      ["Telemetry"],
      ["ID", "Tank ID", "Metric", "Value", "Unit", "Quality", "Recorded At"],
      ...(report.telemetry ?? []).map((r: RecordItem) => [
        r.id, r.tank_id, r.metric, r.value, r.unit, r.quality, r.recorded_at,
      ]),
    ];

    const csv = sections.map((row) =>
      row.map((cell: unknown) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")
    ).join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `operational-report-${startDate}-to-${endDate}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const reportDeliveries = report?.deliveries ?? [];
  const reportAlerts = report?.alerts ?? [];
  const reportIncidents = report?.incidents ?? [];
  const reportTelemetry = report?.telemetry ?? [];

  const volumeByUnit = reportDeliveries.reduce((acc: Record<string, number>, item: RecordItem) => {
    const unit = item.volume_unit || "Unknown";
    acc[unit] = (acc[unit] || 0) + Number(item.delivered_volume || 0);
    return acc;
  }, {});

  const availableFilters =
    resource === "logistics"
      ? ["all", "scheduled", "in_transit", "completed", "cancelled"]
      : resource === "alerts"
        ? ["all", "open", "acknowledged", "resolved", "critical", "warning", "info"]
        : ["all", "open", "investigating", "resolved", "closed"];

  return (
    <main className="min-h-full px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="theme-muted text-xs font-semibold uppercase tracking-[0.18em]">Operations Workspace</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{config.title}</h1>
            <p className="theme-muted mt-2 max-w-2xl text-sm">{config.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void load()} className={buttonClass} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            {(resource === "logistics" || resource === "incidents" || resource === "alerts") && canManage && (
              <button
                onClick={() => {
                  setError("");
                  setSelectedSiteId("");
                  setSelectedTankId("");
                  setShowForm(true);
                }}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                {resource === "logistics"
                  ? "+ Schedule Delivery"
                  : resource === "alerts"
                    ? "+ Create Alert"
                    : "+ Create Incident"}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        )}
        {notice && (
          <div className="mt-5 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            {notice}
            <button onClick={() => setNotice("")} className="ml-3 font-bold">×</button>
          </div>
        )}

        {isReports ? (
          <>
            <section className="glass-panel mt-7 flex flex-col gap-4 rounded-xl p-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  Start date
                  <input type="date" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
                </label>
                <label className="text-sm font-semibold">
                  End date
                  <input type="date" value={endDate} min={startDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
                </label>
              </div>
              <button onClick={exportCSV} disabled={loading || !report} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                Export CSV
              </button>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Registered Sites" value={report?.sites?.length ?? "—"} />
              <Metric label="Registered Tanks" value={report?.tanks?.length ?? "—"} />
              <Metric label="Deliveries in Period" value={report?.deliveries?.length ?? "—"} />
              <Metric label="Telemetry Readings" value={report?.telemetry?.length ?? "—"} />
              <Metric label="Alerts in Period" value={report?.alerts?.length ?? "—"} />
              <Metric label="Incidents in Period" value={report?.incidents?.length ?? "—"} />
            </section>

            <section className="mt-7 grid gap-5 lg:grid-cols-2">
              <div className="glass-panel rounded-xl p-5">
                <h2 className="font-bold">Delivery Volume by Unit</h2>
                <p className="theme-muted mt-1 text-xs">Delivered quantities are kept separate by unit.</p>
                {Object.keys(volumeByUnit).length ? (
                  <div className="mt-5 space-y-4">
                    {Object.entries(volumeByUnit).map(([unit, volume]) => (
                      <div key={unit}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-medium">{unit}</span>
                          <strong>{Number(volume).toLocaleString()}</strong>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(2, Number(volume) / Math.max(...(Object.values(volumeByUnit) as number[]), 1) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="theme-muted mt-5 text-sm">No delivery volume recorded for this period.</p>}
              </div>

              <div className="glass-panel rounded-xl p-5">
                <h2 className="font-bold">Telemetry Data Quality</h2>
                <p className="theme-muted mt-1 text-xs">Based on the quality values stored with telemetry records.</p>
                {reportTelemetry.length ? (
                  <div className="mt-5 space-y-3">
                    {Object.entries(reportTelemetry.reduce((acc: Record<string, number>, item: RecordItem) => {
                      const quality = item.quality || "unspecified";
                      acc[quality] = (acc[quality] || 0) + 1;
                      return acc;
                    }, {})).map(([quality, count]) => (
                      <div key={quality} className="flex items-center justify-between border-b border-slate-200 pb-2 text-sm dark:border-slate-700">
                        <span className="capitalize">{quality}</span>
                        <strong>{Number(count)}</strong>
                      </div>
                    ))}
                  </div>
                ) : <p className="theme-muted mt-5 text-sm">No telemetry readings in the selected period.</p>}
              </div>
            </section>

            <section className="glass-panel mt-6 overflow-hidden rounded-xl">
              <div className="border-b border-slate-200 p-5 dark:border-slate-700">
                <h2 className="font-bold">Recent Telemetry Records</h2>
                <p className="theme-muted mt-1 text-xs">Maximum 2,000 records returned by the report API.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="theme-muted text-xs uppercase">
                    <tr>
                      <th className="px-5 py-3">Metric</th>
                      <th className="px-5 py-3">Value</th>
                      <th className="px-5 py-3">Unit</th>
                      <th className="px-5 py-3">Quality</th>
                      <th className="px-5 py-3">Recorded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportTelemetry.slice(-30).reverse().map((item: RecordItem) => (
                      <tr key={item.id} className="border-t border-slate-200 dark:border-slate-700">
                        <td className="px-5 py-3 font-medium">{item.metric}</td>
                        <td className="px-5 py-3 tabular-nums">{item.value}</td>
                        <td className="px-5 py-3">{item.unit || "—"}</td>
                        <td className="px-5 py-3"><Status value={item.quality} /></td>
                        <td className="px-5 py-3 whitespace-nowrap">{dateLabel(item.recorded_at)}</td>
                      </tr>
                    ))}
                    {!loading && !reportTelemetry.length && (
                      <tr><td colSpan={5} className="theme-muted px-5 py-10 text-center">No telemetry records for this period.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map(([label, value]) => (
                <Metric key={label} label={String(label)} value={loading ? "—" : Number(value)} />
              ))}
            </section>

            <section className="glass-panel mt-7 rounded-xl p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search records..."
                  className={`${inputClass} mt-0 flex-1`}
                />
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`${inputClass} mt-0 sm:w-56`}>
                  {availableFilters.map((value) => (
                    <option key={value} value={value}>{value === "all" ? "All records" : value.replaceAll("_", " ")}</option>
                  ))}
                </select>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="theme-muted text-xs uppercase">
                    {resource === "logistics" ? (
                      <tr>
                        <th className="px-3 py-3">Reference</th><th className="px-3 py-3">Supplier / Product</th>
                        <th className="px-3 py-3">Site / Tank</th><th className="px-3 py-3">Planned</th>
                        <th className="px-3 py-3">Scheduled</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Action</th>
                      </tr>
                    ) : resource === "alerts" ? (
                      <tr>
                        <th className="px-3 py-3">Alert</th><th className="px-3 py-3">Severity</th>
                        <th className="px-3 py-3">Site / Tank</th><th className="px-3 py-3">Triggered</th>
                        <th className="px-3 py-3">Status</th><th className="px-3 py-3">Action</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="px-3 py-3">Incident</th><th className="px-3 py-3">Site / Tank</th>
                        <th className="px-3 py-3">Opened</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Action</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {filtered.map((record) => (
                      <tr key={record.id} className="border-t border-slate-200 align-top dark:border-slate-700">
                        {resource === "logistics" ? (
                          <>
                            <td className="px-3 py-4 font-semibold">{record.reference_number}</td>
                            <td className="px-3 py-4">{record.supplier || "—"}<p className="theme-muted mt-1 text-xs">{record.product || "—"}</p></td>
                            <td className="px-3 py-4">{record.sites?.name || "—"}<p className="theme-muted mt-1 text-xs">{record.tanks?.name || "—"}</p></td>
                            <td className="px-3 py-4 tabular-nums">{record.planned_volume ?? "—"} {record.volume_unit}</td>
                            <td className="px-3 py-4 whitespace-nowrap">{dateLabel(record.scheduled_at)}</td>
                            <td className="px-3 py-4"><Status value={record.status} /></td>
                          </>
                        ) : resource === "alerts" ? (
                          <>
                            <td className="px-3 py-4 font-semibold">{record.title || record.message || "Alert"}<p className="theme-muted mt-1 max-w-xs text-xs">{record.message}</p></td>
                            <td className="px-3 py-4"><Status value={record.severity} /></td>
                            <td className="px-3 py-4">{record.sites?.name || "—"}<p className="theme-muted mt-1 text-xs">{record.tanks?.name || "—"}</p></td>
                            <td className="px-3 py-4 whitespace-nowrap">{dateLabel(record.triggered_at)}</td>
                            <td className="px-3 py-4"><Status value={record.status} /></td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-4 font-semibold">{record.title}<p className="theme-muted mt-1 max-w-xs text-xs">{record.description}</p></td>
                            <td className="px-3 py-4">{record.sites?.name || "—"}<p className="theme-muted mt-1 text-xs">{record.tanks?.name || "—"}</p></td>
                            <td className="px-3 py-4 whitespace-nowrap">{dateLabel(record.opened_at)}</td>
                            <td className="px-3 py-4"><Status value={record.status} /></td>
                          </>
                        )}
                        <td className="px-3 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button className={buttonClass} onClick={() => setSelected(record)}>View</button>
                            {canManage && resource === "logistics" && record.status === "scheduled" && (
                              <button className={buttonClass} onClick={() => { setActionTarget(record); setActionStatus("in_transit"); }}>Dispatch</button>
                            )}
                            {canManage && resource === "logistics" && record.status === "in_transit" && (
                              <button className={buttonClass} onClick={() => { setActionTarget(record); setActionStatus("completed"); }}>Complete</button>
                            )}
                            {canManage && resource === "alerts" && record.status === "open" && (
                              <button className={buttonClass} onClick={() => { setActionTarget(record); setActionStatus("acknowledged"); }}>Acknowledge</button>
                            )}
                            {canManage && resource === "alerts" && record.status !== "resolved" && (
                              <button className={buttonClass} onClick={() => { setActionTarget(record); setActionStatus("resolved"); }}>Resolve</button>
                            )}
                            {canManage && resource === "incidents" && !["resolved", "closed"].includes(record.status) && (
                              <button className={buttonClass} onClick={() => { setActionTarget(record); setActionStatus(record.status === "open" ? "investigating" : "resolved"); }}>
                                {record.status === "open" ? "Investigate" : "Resolve"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!loading && filtered.length === 0 && (
                      <tr><td colSpan={7} className="theme-muted px-5 py-12 text-center">
                        {records.length ? "No records match your search or filter." : "No records found. Records will appear here when they are created or received."}
                      </td></tr>
                    )}
                    {loading && (
                      <tr><td colSpan={7} className="theme-muted px-5 py-12 text-center">Loading organization records...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="theme-muted mt-4 text-xs">{filtered.length} of {records.length} records</p>
            </section>
          </>
        )}

        {showForm && canManage && (resource === "logistics" || resource === "incidents" || resource === "alerts") && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-sm">
            <section role="dialog" aria-modal="true" className="my-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">
                    {resource === "logistics"
                      ? "Schedule Delivery"
                      : resource === "alerts"
                        ? "Create Alert"
                        : "Create Incident"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">This record will be saved to your organization.</p>
                </div>
                <button onClick={() => setShowForm(false)} className="text-2xl leading-none text-slate-500" aria-label="Close">×</button>
              </div>

              <form onSubmit={handleCreate} className="mt-6 space-y-4">
                {resource === "logistics" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold">Reference number *
                      <input name="reference_number" required maxLength={80} className={inputClass} />
                    </label>
                    <label className="text-sm font-semibold">Supplier *
                      <input name="supplier" required maxLength={120} className={inputClass} />
                    </label>
                    <label className="text-sm font-semibold">Product *
                      <input name="product" required maxLength={120} className={inputClass} />
                    </label>
                    <label className="text-sm font-semibold">Scheduled date & time *
                      <input name="scheduled_at" type="datetime-local" required className={inputClass} />
                    </label>
                    <label className="text-sm font-semibold">Site *
                      <select name="site_id" required defaultValue="" className={inputClass}>
                        <option value="" disabled>Select site</option>
                        {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                      </select>
                    </label>
                    <label className="text-sm font-semibold">Tank *
                      <select name="tank_id" required defaultValue="" className={inputClass}>
                        <option value="" disabled>Select tank</option>
                        {tanks.map((tank) => <option key={tank.id} value={tank.id}>{tank.name} ({tank.tank_code})</option>)}
                      </select>
                    </label>
                    <label className="text-sm font-semibold">Planned volume *
                      <input name="planned_volume" type="number" min="0.01" step="any" required className={inputClass} />
                    </label>
                    <label className="text-sm font-semibold">Volume unit
                      <select name="volume_unit" defaultValue="L" className={inputClass}>
                        {["L", "KL", "M3", "GAL"].map((unit) => <option key={unit}>{unit}</option>)}
                      </select>
                    </label>
                  </div>
                ) : resource === "alerts" ? (
                  <>
                    <label className="block text-sm font-semibold">Alert title *
                      <input name="title" required maxLength={200} className={inputClass} />
                    </label>

                    <label className="block text-sm font-semibold">Alert message *
                      <textarea name="message" required rows={4} maxLength={5000} className={inputClass} />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-semibold">Severity *
                        <select name="severity" required defaultValue="warning" className={inputClass}>
                          <option value="info">Info</option>
                          <option value="warning">Warning</option>
                          <option value="critical">Critical</option>
                        </select>
                      </label>

                      <label className="text-sm font-semibold">Site
                        <select
                          name="site_id"
                          value={selectedSiteId}
                          onChange={(e) => {
                            setSelectedSiteId(e.target.value);
                            setSelectedTankId("");
                          }}
                          className={inputClass}
                        >
                          <option value="">Unassigned</option>
                          {sites.map((site) => (
                            <option key={site.id} value={site.id}>{site.name}</option>
                          ))}
                        </select>
                      </label>

                      <label className="text-sm font-semibold">Tank
                        <select
                          name="tank_id"
                          value={selectedTankId}
                          onChange={(e) => setSelectedTankId(e.target.value)}
                          disabled={!selectedSiteId}
                          className={inputClass}
                        >
                          <option value="">
                            {selectedSiteId ? "Unassigned" : "Select a site first"}
                          </option>
                          {tanks
                            .filter((tank) => tank.site_id === selectedSiteId)
                            .map((tank) => (
                              <option key={tank.id} value={tank.id}>
                                {tank.name} ({tank.tank_code})
                              </option>
                            ))}
                        </select>
                      </label>

                      <label className="text-sm font-semibold">Triggered value
                        <input name="triggered_value" type="number" step="any" className={inputClass} />
                      </label>

                      <label className="text-sm font-semibold">Threshold value
                        <input name="threshold_value" type="number" step="any" className={inputClass} />
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-semibold">Incident title *
                      <input name="title" required maxLength={200} className={inputClass} />
                    </label>
                    <label className="block text-sm font-semibold">Description
                      <textarea name="description" rows={4} maxLength={5000} className={inputClass} />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-semibold">Site
                        <select
                          name="site_id"
                          value={selectedSiteId}
                          onChange={(e) => {
                            setSelectedSiteId(e.target.value);
                            setSelectedTankId("");
                          }}
                          className={inputClass}
                        >
                          <option value="">Unassigned</option>
                          {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                        </select>
                      </label>
                      <label className="text-sm font-semibold">Tank
                        <select
                          name="tank_id"
                          value={selectedTankId}
                          onChange={(e) => setSelectedTankId(e.target.value)}
                          disabled={!selectedSiteId}
                          className={inputClass}
                        >
                          <option value="">
                            {selectedSiteId ? "Unassigned" : "Select a site first"}
                          </option>
                          {tanks
                            .filter((tank) => tank.site_id === selectedSiteId)
                            .map((tank) => (
                              <option key={tank.id} value={tank.id}>
                                {tank.name} ({tank.tank_code})
                              </option>
                            ))}
                        </select>
                      </label>
                    </div>
                  </>
                )}
                {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
                <div className="flex flex-col-reverse justify-end gap-3 pt-3 sm:flex-row">
                  <button type="button" onClick={() => setShowForm(false)} className={buttonClass}>Cancel</button>
                  <button disabled={saving} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                    {saving
                      ? "Saving..."
                      : resource === "logistics"
                        ? "Schedule Delivery"
                        : resource === "alerts"
                          ? "Create Alert"
                          : "Create Incident"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {actionTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
            <section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-white">
              <h2 className="text-xl font-bold">Confirm status update</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Update <strong>{actionTarget.reference_number || actionTarget.title || actionTarget.message}</strong> to <strong>{actionStatus.replaceAll("_", " ")}</strong>?
              </p>
              <form onSubmit={handleStatus} className="mt-5 space-y-4">
                {resource === "logistics" && actionStatus === "completed" && (
                  <label className="block text-sm font-semibold">Delivered volume ({actionTarget.volume_unit}) *
                    <input name="delivered_volume" type="number" min="0" step="any" required defaultValue={actionTarget.planned_volume ?? ""} className={inputClass} />
                  </label>
                )}
                <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                  <button type="button" onClick={() => setActionTarget(null)} className={buttonClass}>Cancel</button>
                  <button disabled={saving} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                    {saving ? "Updating..." : "Confirm"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-sm">
            <section role="dialog" aria-modal="true" className="my-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-white">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-bold">Record Details</h2>
                <button onClick={() => setSelected(null)} className="text-2xl leading-none text-slate-500" aria-label="Close">×</button>
              </div>
              <div className="mt-5 space-y-3">
                {Object.entries(selected).filter(([key, value]) =>
                  !["metadata", "sites", "tanks"].includes(key) && value !== null && typeof value !== "object"
                ).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[minmax(110px,0.8fr)_2fr] gap-3 border-b border-slate-200 pb-3 text-sm dark:border-slate-700">
                    <span className="theme-muted capitalize">{key.replaceAll("_", " ")}</span>
                    <span className="break-words font-medium">{key.endsWith("_at") ? dateLabel(String(value)) : String(value)}</span>
                  </div>
                ))}
                {selected.sites?.name && <p className="text-sm">Site: <strong>{selected.sites.name}</strong></p>}
                {selected.tanks?.name && <p className="text-sm">Tank: <strong>{selected.tanks.name}</strong></p>}
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setSelected(null)} className={buttonClass}>Close</button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
