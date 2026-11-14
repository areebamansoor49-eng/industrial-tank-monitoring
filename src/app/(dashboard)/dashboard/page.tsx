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

export default function DashboardPage() {
  const [selectedTank, setSelectedTank] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <main className="min-h-full">
      <div className="flex min-h-screen">
        {/* MAIN CONTENT */}
        <section className="min-w-0 flex-1">
          <header className="glass-panel relative mb-5 flex min-h-[82px] items-center justify-between px-5 sm:px-8">
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
                  {[
                    { time: "00:00", receipts: 420, transfers: 180, consumption: 260 },
                    { time: "02:00", receipts: 510, transfers: 240, consumption: 310 },
                    { time: "04:00", receipts: 460, transfers: 210, consumption: 290 },
                    { time: "06:00", receipts: 680, transfers: 320, consumption: 410 },
                    { time: "08:00", receipts: 590, transfers: 380, consumption: 470 },
                    { time: "10:00", receipts: 760, transfers: 450, consumption: 520 },
                    { time: "12:00", receipts: 640, transfers: 410, consumption: 580 },
                    { time: "14:00", receipts: 860, transfers: 520, consumption: 610 },
                    { time: "16:00", receipts: 720, transfers: 470, consumption: 560 },
                    { time: "18:00", receipts: 610, transfers: 390, consumption: 490 },
                    { time: "20:00", receipts: 790, transfers: 440, consumption: 530 },
                    { time: "22:00", receipts: 670, transfers: 360, consumption: 450 },
                  ].map((item) => {
                    const max = 860;
                    return (
                      <div key={item.time} className="group relative flex h-full flex-1 items-end justify-center gap-[2px]">
                        <div className="relative w-[30%] rounded-t-sm bg-[#3f8f6b] transition-all duration-200 hover:-translate-y-1 hover:brightness-110" style={{ height: `${(item.receipts / max) * 100}%` }}>
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#172923] px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-lg group-hover:block">
                            Receipts: {item.receipts.toLocaleString()} L
                          </div>
                        </div>

                        <div className="relative w-[30%] rounded-t-sm bg-[#4b78b8] transition-all duration-200 hover:-translate-y-1 hover:brightness-110" style={{ height: `${(item.transfers / max) * 100}%` }}>
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#172033] px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-lg group-hover:block">
                            Transfers: {item.transfers.toLocaleString()} L
                          </div>
                        </div>

                        <div className="relative w-[30%] rounded-t-sm bg-[#d08a3c] transition-all duration-200 hover:-translate-y-1 hover:brightness-110" style={{ height: `${(item.consumption / max) * 100}%` }}>
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#172033] px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-lg group-hover:block">
                            Consumption: {item.consumption.toLocaleString()} L
                          </div>
                        </div>
                      </div>
                    );
                  })}
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