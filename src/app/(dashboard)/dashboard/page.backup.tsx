"use client";

import Link from "next/link";
import { useState } from "react";

const tanks = [
  {
    id: "TANK-001",
    name: "Diesel Tank 01",
    site: "Main Storage Facility",
    level: 78,
    volume: "39,000 L",
    capacity: "50,000 L",
    temperature: "31.4°C",
    status: "Normal",
  },
  {
    id: "TANK-002",
    name: "Diesel Tank 02",
    site: "Main Storage Facility",
    level: 54,
    volume: "27,000 L",
    capacity: "50,000 L",
    temperature: "30.8°C",
    status: "Normal",
  },
  {
    id: "TANK-003",
    name: "Fuel Tank 03",
    site: "Secondary Facility",
    level: 23,
    volume: "11,500 L",
    capacity: "50,000 L",
    temperature: "32.1°C",
    status: "Low Stock",
  },
];

type IconName =
  | "dashboard"
  | "activity"
  | "tank"
  | "site"
  | "devices"
  | "sensor"
  | "gateway"
  | "inventory"
  | "consumption"
  | "receipt"
  | "transfer"
  | "reconcile"
  | "alert"
  | "incident"
  | "report"
  | "audit";

function NavIcon({ name }: { name: IconName }) {
  const common =
    "h-[18px] w-[18px] shrink-0 stroke-current transition-colors";

  const paths: Record<IconName, React.ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    activity: (
      <polyline points="3 12 7 12 10 5 14 19 17 12 21 12" />
    ),
    tank: (
      <>
        <path d="M6 4h12" />
        <path d="M7 4v16" />
        <path d="M17 4v16" />
        <path d="M7 20h10" />
        <path d="M9 9h6" />
        <path d="M9 13h6" />
      </>
    ),
    site: (
      <>
        <path d="M4 21V9l8-5 8 5v12" />
        <path d="M8 21v-5h8v5" />
        <path d="M9 10h6" />
        <path d="M12 10v3" />
      </>
    ),
    devices: (
      <>
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h3" />
      </>
    ),
    sensor: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M5.6 5.6a9 9 0 0 0 0 12.8" />
        <path d="M18.4 5.6a9 9 0 0 1 0 12.8" />
      </>
    ),
    gateway: (
      <>
        <rect x="5" y="7" width="14" height="10" rx="2" />
        <path d="M8 11h.01" />
        <path d="M12 11h.01" />
        <path d="M16 11h.01" />
        <path d="M12 17v3" />
        <path d="M9 20h6" />
      </>
    ),
    inventory: (
      <>
        <path d="M4 7h16v14H4z" />
        <path d="M8 7V4h8v3" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </>
    ),
    consumption: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M7 16l4-5 3 2 5-7" />
      </>
    ),
    receipt: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </>
    ),
    transfer: (
      <>
        <path d="M4 8h13" />
        <path d="M14 5l3 3-3 3" />
        <path d="M20 16H7" />
        <path d="M10 13l-3 3 3 3" />
      </>
    ),
    reconcile: (
      <>
        <path d="M5 12a7 7 0 0 1 12-4" />
        <path d="M19 12a7 7 0 0 1-12 4" />
        <path d="M17 5v4h-4" />
        <path d="M7 19v-4h4" />
      </>
    ),
    alert: (
      <>
        <path d="M12 4 3.5 19h17z" />
        <path d="M12 9v4" />
        <path d="M12 16h.01" />
      </>
    ),
    incident: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </>
    ),
    report: (
      <>
        <path d="M5 20V10" />
        <path d="M12 20V4" />
        <path d="M19 20v-7" />
      </>
    ),
    audit: (
      <>
        <path d="M5 4h14v16H5z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={common}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

const navGroups = [
  {
    title: "Operations",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "dashboard" as IconName },
      {
        label: "Live Monitoring",
        href: "/operations/live-monitoring",
        icon: "activity" as IconName,
      },
      {
        label: "Tank Overview",
        href: "/operations/tanks",
        icon: "tank" as IconName,
      },
      {
        label: "Site Overview",
        href: "/operations/sites",
        icon: "site" as IconName,
      },
    ],
  },
  {
    title: "Assets",
    items: [
      { label: "Sites", href: "/assets/sites", icon: "site" as IconName },
      { label: "Tanks", href: "/assets/tanks", icon: "tank" as IconName },
      {
        label: "Devices",
        href: "/assets/devices",
        icon: "devices" as IconName,
      },
      {
        label: "Sensors",
        href: "/assets/sensors",
        icon: "sensor" as IconName,
      },
      {
        label: "Gateways",
        href: "/assets/gateways",
        icon: "gateway" as IconName,
      },
    ],
  },
  {
    title: "Inventory",
    items: [
      {
        label: "Current Stock",
        href: "/inventory",
        icon: "inventory" as IconName,
      },
      {
        label: "Consumption",
        href: "/inventory/consumption",
        icon: "consumption" as IconName,
      },
      {
        label: "Receipts",
        href: "/inventory/receipts",
        icon: "receipt" as IconName,
      },
      {
        label: "Transfers",
        href: "/inventory/transfers",
        icon: "transfer" as IconName,
      },
      {
        label: "Reconciliation",
        href: "/inventory/reconciliation",
        icon: "reconcile" as IconName,
      },
    ],
  },
  {
    title: "Control",
    items: [
      {
        label: "Alerts",
        href: "/alerts",
        icon: "alert" as IconName,
        badge: "01",
      },
      {
        label: "Incidents",
        href: "/incidents",
        icon: "incident" as IconName,
      },
      {
        label: "Reports",
        href: "/reports",
        icon: "report" as IconName,
      },
      {
        label: "Audit Logs",
        href: "/audit-logs",
        icon: "audit" as IconName,
      },
    ],
  },
];

export default function DashboardPage() {
  const [selectedTank, setSelectedTank] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <main className="min-h-screen bg-[#f2f7f4] text-[#172033]">
      <div className="flex min-h-screen">
        {/* ENTERPRISE SIDEBAR */}
        <aside className="hidden w-[282px] shrink-0 border-r border-[#263a35] bg-[#172923] text-white lg:flex lg:flex-col">
          {/* Brand */}
          <div className="relative border-b border-[#2b403a] px-6 py-6">
            <div className="absolute left-0 top-0 h-full w-[3px] bg-[#6fa58a]" />

            <Link href="/dashboard" className="block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#49665b] bg-[#203830]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-5 w-5 text-[#9fc5b2]"
                  >
                    <path
                      d="M6 4h12M7 4v16M17 4v16M7 20h10"
                      strokeLinecap="round"
                    />
                    <path
                      d="M9 9h6M9 13h6"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div>
                  <div className="text-[15px] font-bold tracking-[0.08em] text-white">
                    INDUSTRIAL
                  </div>
                  <div className="mt-0.5 text-[10px] font-semibold tracking-[0.2em] text-[#91a69e]">
                    TANK MONITORING
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[#789289]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6fa58a]" />
                Operations Platform
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-5">
            {navGroups.map((group) => (
              <div key={group.title} className="mb-6">
                <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#71867e]">
                  {group.title}
                </div>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = item.href === "/dashboard";

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group relative flex min-h-[43px] items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-all ${
                          active
                            ? "bg-[#29433a] text-white shadow-sm"
                            : "text-[#a9b8b2] hover:bg-[#203830] hover:text-white"
                        }`}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#8ebba4]" />
                        )}

                        <NavIcon name={item.icon} />

                        <span className="flex-1">{item.label}</span>

                        {item.badge && (
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                              active
                                ? "bg-[#476b5c] text-[#dcebe4]"
                                : "bg-[#332f28] text-[#d5ae72]"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* System status */}
          <div className="border-t border-[#2b403a] px-4 py-4">
            <div className="rounded-xl border border-[#30473f] bg-[#1d332c] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#71867e]">
                  System Status
                </span>

                <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#82b39a]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#72aa8c]" />
                  Online
                </span>
              </div>

              <div className="mt-3 text-[12px] font-semibold text-[#e2ebe7]">
                All systems operational
              </div>

              <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#294139]">
                <div className="h-full w-[99.8%] rounded-full bg-[#6c9e86]" />
              </div>

              <div className="mt-2 text-[9px] text-[#71867e]">
                Platform health 99.8%
              </div>
            </div>
          </div>

          {/* Organization / User */}
          <div className="border-t border-[#2b403a] p-4">
            <div className="flex items-center gap-3 rounded-xl px-2 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#365449] text-[11px] font-bold text-[#d7e6df]">
                AO
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-semibold text-[#e2ebe7]">
                  Demo Operations
                </div>
                <div className="mt-0.5 text-[9px] text-[#71867e]">
                  Organization workspace
                </div>
              </div>

              <span className="text-[#6e837b]">•••</span>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="min-w-0 flex-1">
          <header className="relative flex min-h-[82px] items-center justify-between border-b border-[#dfe3e8] bg-white px-5 sm:px-8">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#7d8796]">
                Main Storage Facility
              </div>

              <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-[#172033]">
                Operations Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-[#dfe3e8] px-4 py-2 sm:flex">
                <span className="h-2.5 w-2.5 rounded-full bg-[#3f8f6b]" />

                <span className="text-[12px] font-semibold text-[#526071]">
                  All systems operational
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[#dfe3e8] bg-white text-[#526071] transition hover:bg-[#f5f7f8]"
                aria-label="Open notifications"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-[18px] w-[18px]"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10 21h4" />
                </svg>

                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#b9822b]" />
              </button>

              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#172033] text-[12px] font-bold text-white"
                aria-label="User profile"
              >
                AO
              </button>
            </div>

            {showNotifications && (
              <div className="absolute right-5 top-[74px] z-30 w-[320px] rounded-xl border border-[#dfe3e8] bg-white p-4 shadow-xl">
                <div className="text-[14px] font-semibold text-[#172033]">
                  Notifications
                </div>

                <p className="mt-2 text-[12px] leading-5 text-[#697586]">
                  Fuel Tank 03 is below the configured inventory threshold.
                </p>

                <Link
                  href="/alerts"
                  className="mt-3 inline-block text-[12px] font-semibold text-[#526d80] hover:underline"
                >
                  View all alerts →
                </Link>
              </div>
            )}
          </header>

          <div className="p-5 sm:p-8">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-[13px] font-medium text-[#7d8796]">
                  Saturday, 03 October 2026
                </p>

                <h2 className="mt-1.5 text-[28px] font-semibold tracking-tight text-[#172033]">
                  Operational Overview
                </h2>
              </div>

              <div className="rounded-lg border border-[#dfe3e8] bg-white px-4 py-2.5 text-[12px] font-medium text-[#697586]">
                Last updated: just now
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Total Inventory", "77,500 L", "Across 3 monitored tanks"],
                ["Consumption Today", "8,420 L", "12.1% lower than yesterday"],
                ["Active Deliveries", "02", "1 delivery awaiting reconciliation"],
                ["System Status", "99.8%", "All critical systems operational"],
              ].map(([label, value, detail]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#dfe3e8] bg-white p-5"
                >
                  <div className="text-[13px] font-medium text-[#697586]">
                    {label}
                  </div>

                  <div className="mt-2 text-[28px] font-semibold tracking-tight text-[#172033]">
                    {value}
                  </div>

                  <div className="mt-2 text-[12px] leading-5 text-[#7d8796]">
                    {detail}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_370px]">
              <section className="overflow-hidden rounded-xl border border-[#dfe3e8] bg-white">
                <div className="flex items-center justify-between border-b border-[#e7eaed] px-6 py-5">
                  <div>
                    <h3 className="text-[16px] font-semibold text-[#172033]">
                      Tank Inventory
                    </h3>

                    <p className="mt-1 text-[12px] text-[#697586]">
                      Current inventory position across monitored assets
                    </p>
                  </div>

                  <Link
                    href="/assets/tanks"
                    className="text-[12px] font-semibold text-[#526d80] hover:underline"
                  >
                    View all tanks →
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className="border-b border-[#e7eaed] bg-[#fafbfc] text-[11px] uppercase tracking-[0.08em] text-[#7d8796]">
                        <th className="px-6 py-4 font-bold">Tank</th>
                        <th className="px-4 py-4 font-bold">Level</th>
                        <th className="px-4 py-4 font-bold">Volume</th>
                        <th className="px-4 py-4 font-bold">Temperature</th>
                        <th className="px-4 py-4 font-bold">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {tanks.map((tank) => (
                        <tr
                          key={tank.id}
                          onClick={() => setSelectedTank(tank.id)}
                          className={`cursor-pointer border-b border-[#edf0f2] transition last:border-0 hover:bg-[#f8fafb] ${
                            selectedTank === tank.id ? "bg-[#f4f7f8]" : ""
                          }`}
                        >
                          <td className="px-6 py-5">
                            <div className="text-[14px] font-semibold text-[#303a49]">
                              {tank.name}
                            </div>

                            <div className="mt-1 text-[12px] text-[#7d8796]">
                              {tank.site}
                            </div>
                          </td>

                          <td className="px-4 py-5">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-[95px] overflow-hidden rounded-full bg-[#e7ebee]">
                                <div
                                  className="h-full rounded-full bg-[#526d80]"
                                  style={{ width: `${tank.level}%` }}
                                />
                              </div>

                              <span className="text-[13px] font-semibold">
                                {tank.level}%
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-5 text-[13px] font-semibold text-[#4e5868]">
                            {tank.volume}

                            <div className="mt-1 text-[11px] font-normal text-[#8b95a5]">
                              of {tank.capacity}
                            </div>
                          </td>

                          <td className="px-4 py-5 text-[13px] font-medium text-[#4e5868]">
                            {tank.temperature}
                          </td>

                          <td className="px-4 py-5">
                            <span
                              className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-bold ${
                                tank.status === "Normal"
                                  ? "bg-[#edf6f1] text-[#39785b]"
                                  : "bg-[#fff5e6] text-[#9a6a21]"
                              }`}
                            >
                              {tank.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedTank && (
                  <div className="border-t border-[#e7eaed] bg-[#fafbfc] px-6 py-4">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <div className="text-[12px] font-semibold text-[#303a49]">
                          {selectedTank} selected
                        </div>

                        <div className="mt-1 text-[11px] text-[#7d8796]">
                          Open the tank workspace for detailed telemetry,
                          history and device health.
                        </div>
                      </div>

                      <Link
                        href={`/assets/tanks/${selectedTank}`}
                        className="rounded-lg bg-[#172033] px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-[#28344a]"
                      >
                        Open Tank
                      </Link>
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-[#dfe3e8] bg-white">
                <div className="border-b border-[#e7eaed] px-6 py-5">
                  <h3 className="text-[16px] font-semibold text-[#172033]">
                    Operational Alerts
                  </h3>

                  <p className="mt-1 text-[12px] text-[#697586]">
                    Items requiring operational attention
                  </p>
                </div>

                <div className="divide-y divide-[#edf0f2]">
                  <Link
                    href="/alerts"
                    className="block p-6 transition hover:bg-[#fafbfc]"
                  >
                    <div className="flex gap-3">
                      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#b9822b]" />

                      <div>
                        <div className="text-[13px] font-semibold text-[#394252]">
                          Low inventory threshold
                        </div>

                        <p className="mt-1.5 text-[12px] leading-5 text-[#697586]">
                          Fuel Tank 03 is below the configured inventory
                          threshold.
                        </p>

                        <span className="mt-2 block text-[11px] text-[#929aa8]">
                          12 minutes ago
                        </span>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/inventory/reconciliation"
                    className="block p-6 transition hover:bg-[#fafbfc]"
                  >
                    <div className="flex gap-3">
                      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#687d91]" />

                      <div>
                        <div className="text-[13px] font-semibold text-[#394252]">
                          Delivery reconciliation pending
                        </div>

                        <p className="mt-1.5 text-[12px] leading-5 text-[#697586]">
                          Delivery DL-2026-104 is awaiting inventory
                          reconciliation.
                        </p>

                        <span className="mt-2 block text-[11px] text-[#929aa8]">
                          34 minutes ago
                        </span>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/assets/gateways"
                    className="block p-6 transition hover:bg-[#fafbfc]"
                  >
                    <div className="flex gap-3">
                      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#3f8f6b]" />

                      <div>
                        <div className="text-[13px] font-semibold text-[#394252]">
                          Gateway heartbeat restored
                        </div>

                        <p className="mt-1.5 text-[12px] leading-5 text-[#697586]">
                          Gateway GW-001 is reporting normally.
                        </p>

                        <span className="mt-2 block text-[11px] text-[#929aa8]">
                          1 hour ago
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              </section>
            </div>

            <div className="mt-7 grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-[#dfe3e8] bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[16px] font-semibold text-[#172033]">
                      Inventory Movement
                    </h3>

                    <p className="mt-1 text-[12px] text-[#697586]">
                      Last 24 hours
                    </p>
                  </div>

                  <span className="text-[12px] font-medium text-[#7d8796]">
                    Liters
                  </span>
                </div>

                <div className="mt-7 flex h-[190px] items-end gap-2 border-b border-l border-[#e5e8eb] px-4">
                  {[35, 48, 42, 65, 52, 72, 61, 82, 68, 55, 76, 64].map(
                    (height, index) => (
                      <div
                        key={index}
                        className="group relative flex h-full flex-1 items-end"
                      >
                        <div
                          className="w-full rounded-t-sm bg-[#b8c3cc] transition group-hover:bg-[#7c8f9d]"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                    ),
                  )}
                </div>

                <div className="mt-3 flex justify-between text-[11px] text-[#8b95a5]">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>Now</span>
                </div>
              </section>

              <section className="rounded-xl border border-[#dfe3e8] bg-white p-6">
                <div>
                  <h3 className="text-[16px] font-semibold text-[#172033]">
                    Connected Equipment
                  </h3>

                  <p className="mt-1 text-[12px] text-[#697586]">
                    Device and gateway health
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    ["GW-001", "Industrial Gateway"],
                    ["LV-001", "Level Sensor — Tank 01"],
                    ["TMP-001", "Temperature Sensor — Tank 01"],
                    ["LV-003", "Level Sensor — Tank 03"],
                  ].map(([id, type]) => (
                    <Link
                      href="/assets/devices"
                      key={id}
                      className="flex items-center justify-between rounded-lg border border-[#e7eaed] px-4 py-4 transition hover:bg-[#f8fafb]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#3f8f6b]" />

                        <div>
                          <div className="text-[13px] font-semibold text-[#3d4654]">
                            {id}
                          </div>

                          <div className="mt-1 text-[11px] text-[#7d8796]">
                            {type}
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold text-[#4a8066]">
                        Online
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}