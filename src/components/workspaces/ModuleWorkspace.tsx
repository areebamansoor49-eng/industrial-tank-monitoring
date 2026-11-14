"use client";

import { useMemo, useState } from "react";

type ModuleKey = "assets" | "inventory" | "logistics" | "alerts" | "incidents" | "reports";

const modules: Record<ModuleKey, {
  title: string; eyebrow: string; description: string;
  metrics: [string, string, string][];
  columns: string[]; rows: string[][];
}> = {
  assets: {
    title: "Asset Registry", eyebrow: "INFRASTRUCTURE",
    description: "Manage monitored tanks, sensors and gateway equipment.",
    metrics: [["Registered tanks", "03", "Sample workspace"], ["Gateways", "01", "Demo configuration"], ["Device health", "Monitor", "Connect real hardware later"]],
    columns: ["Asset", "Type", "Location", "Status"],
    rows: [["TNK-001 · Fuel Tank 01", "Storage tank", "Main site", "Online"], ["TNK-002 · Fuel Tank 02", "Storage tank", "Main site", "Online"], ["GW-001 · Site Gateway", "Gateway", "Control room", "Online"]]
  },
  inventory: {
    title: "Inventory Control", eyebrow: "STOCK & CAPACITY",
    description: "Review tank stock levels, available capacity and reconciliation workflow.",
    metrics: [["Tracked volume", "77,500 L", "Demo data"], ["Monitored tanks", "03", "Sample workspace"], ["Reconciliation", "Review", "Verify deliveries"]],
    columns: ["Tank", "Product", "Volume", "Action"],
    rows: [["TNK-001", "Diesel", "32,500 L", "Review level"], ["TNK-002", "Petrol", "25,000 L", "Review level"], ["TNK-003", "Diesel", "20,000 L", "Review level"]]
  },
  logistics: {
    title: "Logistics & Deliveries", eyebrow: "MOVEMENT CONTROL",
    description: "Track inbound deliveries and review their reconciliation status.",
    metrics: [["Active deliveries", "02", "Demo data"], ["Awaiting review", "01", "Sample workflow"], ["Completed today", "01", "Demo record"]],
    columns: ["Reference", "Destination", "Product", "Status"],
    rows: [["DL-2026-104", "Main site", "Diesel", "Awaiting review"], ["DL-2026-103", "Main site", "Petrol", "In transit"], ["DL-2026-102", "Main site", "Diesel", "Completed"]]
  },
  alerts: {
    title: "Alert Centre", eyebrow: "OPERATIONAL EXCEPTIONS",
    description: "Review threshold warnings and equipment events. Sample alerts are not live incidents.",
    metrics: [["Open alerts", "02", "Demo data"], ["Critical", "00", "Sample workspace"], ["Acknowledged", "01", "Demo record"]],
    columns: ["Alert", "Asset", "Severity", "State"],
    rows: [["Low inventory threshold", "TNK-003", "Warning", "Open"], ["Delivery reconciliation pending", "DL-2026-104", "Notice", "Open"], ["Gateway heartbeat restored", "GW-001", "Info", "Acknowledged"]]
  },
  incidents: {
    title: "Incident Management", eyebrow: "RESPONSE & FOLLOW-UP",
    description: "Maintain an operational record of incidents, ownership and resolution.",
    metrics: [["Open incidents", "01", "Demo data"], ["Under review", "01", "Sample workflow"], ["Resolved", "02", "Demo records"]],
    columns: ["Incident", "Asset", "Priority", "State"],
    rows: [["INC-001 · Inventory variance", "TNK-003", "Medium", "Under review"], ["INC-002 · Sensor signal loss", "SEN-004", "Low", "Resolved"]]
  },
  reports: {
    title: "Reports & Analytics", eyebrow: "OPERATIONAL INTELLIGENCE",
    description: "Review sample summaries before connecting production reporting data.",
    metrics: [["Inventory summary", "Available", "Sample report"], ["Device health", "Available", "Sample report"], ["Delivery audit", "Available", "Sample report"]],
    columns: ["Report", "Coverage", "Data mode", "Availability"],
    rows: [["Tank inventory summary", "All demo tanks", "Simulated", "Preview"], ["Device health overview", "Demo gateway", "Simulated", "Preview"], ["Delivery reconciliation", "Sample deliveries", "Simulated", "Preview"]]
  }
};

export default function ModuleWorkspace({ moduleKey }: { moduleKey: ModuleKey }) {
  const data = modules[moduleKey];
  const [query, setQuery] = useState("");
  const rows = useMemo(() => data.rows.filter(row =>
    row.join(" ").toLowerCase().includes(query.toLowerCase())
  ), [data, query]);

  return <main className="min-h-full p-5 sm:p-8" style={{color:"var(--foreground)"}}>
    <div className="mb-7">
      <p className="text-xs font-bold tracking-[.18em] text-cyan-600">{data.eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{data.title}</h1>
      <p className="mt-2 max-w-2xl text-sm opacity-70">{data.description}</p>
    </div>
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {data.metrics.map(([label,value,note]) => <section key={label}
        className="rounded-2xl border p-5 shadow-sm backdrop-blur-xl"
        style={{borderColor:"var(--border)",background:"color-mix(in srgb, var(--surface) 78%, transparent)"}}>
        <p className="text-sm opacity-70">{label}</p>
        <p className="mt-3 text-2xl font-semibold">{value}</p>
        <p className="mt-2 text-xs opacity-60">{note}</p>
      </section>)}
    </div>
    <section className="overflow-hidden rounded-2xl border backdrop-blur-xl"
      style={{borderColor:"var(--border)",background:"color-mix(in srgb, var(--surface) 82%, transparent)"}}>
      <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between"
        style={{borderColor:"var(--border)"}}>
        <div><h2 className="font-semibold">Workspace records</h2>
          <p className="mt-1 text-xs opacity-60">Illustrative records · not connected to production data</p></div>
        <input aria-label="Search records" value={query} onChange={e=>setQuery(e.target.value)}
          placeholder="Search records..." className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none sm:w-64"
          style={{borderColor:"var(--border)",background:"var(--background)",color:"var(--foreground)"}}/>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm">
        <thead><tr style={{background:"color-mix(in srgb, var(--background) 70%, transparent)"}}>
          {data.columns.map(c=><th key={c} className="px-5 py-4 text-xs font-semibold uppercase tracking-wider opacity-60">{c}</th>)}
        </tr></thead>
        <tbody>{rows.map((row,i)=><tr key={row[0]} className="border-t" style={{borderColor:"var(--border)"}}>
          {row.map((cell,j)=><td key={j} className={"px-5 py-4 "+(j===0?"font-medium":"opacity-75")}>{cell}</td>)}
        </tr>)}
        {rows.length===0 && <tr><td colSpan={data.columns.length} className="px-5 py-10 text-center opacity-60">No matching records.</td></tr>}
        </tbody></table></div>
    </section>
  </main>;
}
