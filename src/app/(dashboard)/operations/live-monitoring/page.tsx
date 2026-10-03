"use client";

import { useEffect, useMemo, useState } from "react";

type TankStatus = "Normal" | "Warning" | "Critical";

type Sensor = {
  id: string;
  type: string;
  unit: string;
};

type Tank = {
  id: string;
  name: string;
  siteId: string;
  product: string;
  capacity: number;
  level: number;
  temperature: number;
  pressure: number;
  flow: number;
  status: TankStatus;
  gateway: string;
  sensors: Sensor[];
};

type Site = {
  id: string;
  name: string;
  location: string;
  status: "Operational" | "Maintenance";
  tankIds: string[];
};

const sites: Site[] = [
  {
    id: "SITE-NP",
    name: "North Processing Site",
    location: "Primary Processing Facility",
    status: "Operational",
    tankIds: ["T-101", "T-102"],
  },
  {
    id: "SITE-SD",
    name: "South Distribution Site",
    location: "Distribution Facility",
    status: "Operational",
    tankIds: ["T-201"],
  },
];

const initialTanks: Tank[] = [
  {
    id: "T-101",
    name: "Storage Tank 101",
    siteId: "SITE-NP",
    product: "Diesel",
    capacity: 50000,
    level: 72.4,
    temperature: 28.6,
    pressure: 1.42,
    flow: 184,
    status: "Normal",
    gateway: "GW-NP-001",
    sensors: [
      { id: "LT-101", type: "Level Sensor", unit: "%" },
      { id: "TT-101", type: "Temperature Sensor", unit: "°C" },
      { id: "PT-101", type: "Pressure Sensor", unit: "bar" },
      { id: "FT-101", type: "Flow Sensor", unit: "L/min" },
    ],
  },
  {
    id: "T-102",
    name: "Storage Tank 102",
    siteId: "SITE-NP",
    product: "Petrol",
    capacity: 40000,
    level: 58.8,
    temperature: 29.1,
    pressure: 1.36,
    flow: 142,
    status: "Normal",
    gateway: "GW-NP-001",
    sensors: [
      { id: "LT-102", type: "Level Sensor", unit: "%" },
      { id: "TT-102", type: "Temperature Sensor", unit: "°C" },
      { id: "PT-102", type: "Pressure Sensor", unit: "bar" },
      { id: "FT-102", type: "Flow Sensor", unit: "L/min" },
    ],
  },
  {
    id: "T-201",
    name: "Storage Tank 201",
    siteId: "SITE-SD",
    product: "Diesel",
    capacity: 60000,
    level: 81.2,
    temperature: 27.9,
    pressure: 1.51,
    flow: 226,
    status: "Warning",
    gateway: "GW-SD-001",
    sensors: [
      { id: "LT-201", type: "Level Sensor", unit: "%" },
      { id: "TT-201", type: "Temperature Sensor", unit: "°C" },
      { id: "PT-201", type: "Pressure Sensor", unit: "bar" },
      { id: "FT-201", type: "Flow Sensor", unit: "L/min" },
    ],
  },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDecimal(value: number, digits = 1) {
  return value.toFixed(digits);
}

function statusClasses(status: TankStatus) {
  if (status === "Critical") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (status === "Warning") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function sensorValue(
  sensorType: string,
  tank: Tank,
) {
  if (sensorType === "Level Sensor") {
    return `${formatDecimal(tank.level)}%`;
  }

  if (sensorType === "Temperature Sensor") {
    return `${formatDecimal(tank.temperature)} °C`;
  }

  if (sensorType === "Pressure Sensor") {
    return `${formatDecimal(tank.pressure, 2)} bar`;
  }

  return `${formatNumber(tank.flow)} L/min`;
}

export default function LiveMonitoringPage() {
  const [tanks, setTanks] = useState(initialTanks);
  const [selectedSiteId, setSelectedSiteId] = useState("SITE-NP");
  const [selectedTankId, setSelectedTankId] = useState("T-101");
  const [isLive, setIsLive] = useState(true);

  const selectedSite = useMemo(
    () => sites.find((site) => site.id === selectedSiteId) ?? sites[0],
    [selectedSiteId],
  );

  const siteTanks = useMemo(
    () => tanks.filter((tank) => tank.siteId === selectedSiteId),
    [tanks, selectedSiteId],
  );

  const selectedTank = useMemo(
    () =>
      siteTanks.find((tank) => tank.id === selectedTankId) ??
      siteTanks[0] ??
      tanks[0],
    [selectedTankId, siteTanks, tanks],
  );

  useEffect(() => {
    if (!isLive) return;

    const interval = window.setInterval(() => {
      setTanks((current) =>
        current.map((tank) => {
          const levelChange = (Math.random() - 0.5) * 0.16;
          const temperatureChange = (Math.random() - 0.5) * 0.08;
          const pressureChange = (Math.random() - 0.5) * 0.02;
          const flowChange = (Math.random() - 0.5) * 8;

          const level = Math.min(
            98,
            Math.max(5, tank.level + levelChange),
          );

          const temperature = Math.max(
            18,
            tank.temperature + temperatureChange,
          );

          const pressure = Math.max(
            0.5,
            tank.pressure + pressureChange,
          );

          const flow = Math.max(
            0,
            tank.flow + flowChange,
          );

          let status: TankStatus = "Normal";

          if (level >= 90 || level <= 10) {
            status = "Critical";
          } else if (level >= 82 || level <= 18) {
            status = "Warning";
          }

          return {
            ...tank,
            level,
            temperature,
            pressure,
            flow,
            status,
          };
        }),
      );
    }, 3000);

    return () => window.clearInterval(interval);
  }, [isLive]);

  const currentVolume =
    (selectedTank.capacity * selectedTank.level) / 100;

  const handleSiteChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextSiteId = event.target.value;
    const nextSite = sites.find((site) => site.id === nextSiteId);

    setSelectedSiteId(nextSiteId);

    if (nextSite?.tankIds[0]) {
      setSelectedTankId(nextSite.tankIds[0]);
    }
  };

  return (
    <main className="min-h-screen bg-[#edf4f0] px-4 py-5 text-[#172033] sm:px-5 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">

        {/* HEADER */}
        <div className="flex flex-col gap-5 border-b border-[#cbd8d2] pb-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#172923] text-white shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path d="M12 3v18" />
                  <path d="M7 6h10" />
                  <path d="M6 10h12" />
                  <path d="M7 14h10" />
                  <path d="M8 18h8" />
                </svg>
              </div>

              <div>
                <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#53675f]">
                  Operations
                </p>

                <h1 className="mt-0.5 text-[27px] font-bold tracking-[-0.02em] text-[#172033] sm:text-[29px]">
                  Live Monitoring
                </h1>
              </div>
            </div>

            <p className="mt-3 max-w-3xl text-[14px] font-medium leading-6 text-[#4e5d69] sm:text-[15px]">
              Real-time tank telemetry, sensor health, gateway connectivity,
              and operational status for the selected site.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-[#cbd8d2] bg-white px-4 py-2.5 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                {isLive && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                )}

                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    isLive ? "bg-emerald-600" : "bg-slate-500"
                  }`}
                />
              </span>

              <span className="text-[13px] font-bold text-[#263542]">
                {isLive ? "Simulation Live" : "Monitoring Paused"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsLive((value) => !value)}
              className="rounded-lg border border-[#bfcac5] bg-white px-4 py-2.5 text-[13px] font-bold text-[#263542] shadow-sm transition hover:border-[#81948b] hover:bg-[#f7faf8]"
            >
              {isLive ? "Pause Stream" : "Resume Stream"}
            </button>
          </div>
        </div>

        {/* SITE / TANK CONTEXT */}
        <section className="mt-6 rounded-xl border border-[#cbd8d2] bg-white p-5 shadow-[0_2px_8px_rgba(25,50,40,0.05)]">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr_auto] lg:items-end">

            <label className="block">
              <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.1em] text-[#43574f]">
                Monitoring Site
              </span>

              <select
                value={selectedSiteId}
                onChange={handleSiteChange}
                className="w-full rounded-lg border border-[#bfcac5] bg-white px-3.5 py-3 text-[14px] font-semibold text-[#24313d] outline-none focus:border-[#3f8f6b] focus:ring-2 focus:ring-[#3f8f6b]/15"
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-[12px] font-medium text-[#586a63]">
                {selectedSite.location}
              </p>
            </label>

            <label className="block">
              <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.1em] text-[#43574f]">
                Monitored Tank
              </span>

              <select
                value={selectedTank.id}
                onChange={(event) =>
                  setSelectedTankId(event.target.value)
                }
                className="w-full rounded-lg border border-[#bfcac5] bg-white px-3.5 py-3 text-[14px] font-semibold text-[#24313d] outline-none focus:border-[#3f8f6b] focus:ring-2 focus:ring-[#3f8f6b]/15"
              >
                {siteTanks.map((tank) => (
                  <option key={tank.id} value={tank.id}>
                    {tank.id} — {tank.name}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-[12px] font-medium text-[#586a63]">
                {siteTanks.length} tank
                {siteTanks.length === 1 ? "" : "s"} configured for this site
              </p>
            </label>

            <div className="rounded-lg border border-[#cbd8d2] bg-[#edf5f1] px-5 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#486259]">
                Telemetry State
              </p>

              <div className="mt-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <p className="text-[14px] font-bold text-[#29453a]">
                  {isLive ? "Receiving Data" : "Stream Paused"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SITE CONTEXT */}
        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[#cbd8d2] bg-white p-5 shadow-[0_2px_8px_rgba(25,50,40,0.04)]">
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#50645b]">
              Active Site
            </p>
            <p className="mt-2 text-[18px] font-bold text-[#172033]">
              {selectedSite.name}
            </p>
            <p className="mt-1 text-[13px] font-medium text-[#586771]">
              {selectedSite.status}
            </p>
          </div>

          <div className="rounded-xl border border-[#cbd8d2] bg-white p-5 shadow-[0_2px_8px_rgba(25,50,40,0.04)]">
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#50645b]">
              Site Tanks
            </p>
            <p className="mt-2 text-[27px] font-bold text-[#172033]">
              {siteTanks.length}
            </p>
            <p className="mt-1 text-[13px] font-medium text-[#586771]">
              Available for monitoring
            </p>
          </div>

          <div className="rounded-xl border border-[#cbd8d2] bg-white p-5 shadow-[0_2px_8px_rgba(25,50,40,0.04)]">
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#50645b]">
              Current Gateway
            </p>
            <p className="mt-2 font-mono text-[18px] font-bold text-[#172033]">
              {selectedTank.gateway}
            </p>
            <p className="mt-1 text-[13px] font-medium text-emerald-700">
              Connected
            </p>
          </div>

          <div className="rounded-xl border border-[#cbd8d2] bg-white p-5 shadow-[0_2px_8px_rgba(25,50,40,0.04)]">
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#50645b]">
              Selected Tank
            </p>
            <p className="mt-2 text-[18px] font-bold text-[#172033]">
              {selectedTank.id}
            </p>
            <p className="mt-1 text-[13px] font-medium text-[#586771]">
              {selectedTank.product}
            </p>
          </div>
        </section>

        {/* KPI CARDS */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            {
              label: "Tank Level",
              value: `${formatDecimal(selectedTank.level)}%`,
              detail: "Current fill level",
            },
            {
              label: "Volume",
              value: `${formatNumber(currentVolume)} L`,
              detail: `of ${formatNumber(selectedTank.capacity)} L`,
            },
            {
              label: "Temperature",
              value: `${formatDecimal(selectedTank.temperature)} °C`,
              detail: "Product temperature",
            },
            {
              label: "Pressure",
              value: `${formatDecimal(selectedTank.pressure, 2)} bar`,
              detail: "Tank pressure",
            },
            {
              label: "Flow Rate",
              value: `${formatNumber(selectedTank.flow)} L/min`,
              detail: "Current flow",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-[#cbd8d2] bg-white p-5 shadow-[0_2px_8px_rgba(25,50,40,0.04)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold uppercase tracking-[0.09em] text-[#43574f]">
                  {item.label}
                </p>

                <div className="h-2.5 w-2.5 rounded-full bg-[#3f8f6b]" />
              </div>

              <p className="mt-4 text-[27px] font-bold tracking-[-0.02em] text-[#172033]">
                {item.value}
              </p>

              <p className="mt-1 text-[13px] font-medium text-[#586771]">
                {item.detail}
              </p>
            </div>
          ))}
        </section>

        {/* MAIN MONITORING */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">

          {/* TANK */}
          <section className="rounded-xl border border-[#cbd8d2] bg-white p-6 shadow-[0_2px_8px_rgba(25,50,40,0.05)]">
            <div className="flex flex-col gap-4 border-b border-[#dfe8e3] pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[19px] font-bold text-[#172033]">
                    {selectedTank.name}
                  </h2>

                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-bold ${statusClasses(
                      selectedTank.status,
                    )}`}
                  >
                    {selectedTank.status}
                  </span>
                </div>

                <p className="mt-2 text-[13px] font-medium text-[#53636e]">
                  {selectedTank.id} · {selectedSite.name} ·{" "}
                  {selectedTank.product}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#52665d]">
                  Last Telemetry
                </p>

                <p className="mt-1 text-[13px] font-bold text-[#263542]">
                  Just now
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center">
              <div className="relative h-[310px] w-[210px]">
                <div className="absolute inset-0 rounded-[48%] border-[10px] border-[#b9c7c1] bg-[#f4f8f6] shadow-inner" />

                <div
                  className="absolute bottom-[10px] left-[10px] right-[10px] overflow-hidden rounded-b-[42%] bg-[#3f8f6b] transition-all duration-700"
                  style={{
                    height: `calc(${Math.min(
                      100,
                      Math.max(0, selectedTank.level),
                    )}% - 10px)`,
                  }}
                >
                  <div className="absolute inset-x-0 top-0 h-5 bg-[#62ae88] opacity-80" />
                  <div className="absolute inset-x-0 top-4 h-px bg-white/30" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-xl border border-white/70 bg-[#172923]/95 px-6 py-5 text-center text-white shadow-lg">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/80">
                      Fill Level
                    </p>

                    <p className="mt-1 text-[34px] font-bold">
                      {formatDecimal(selectedTank.level)}%
                    </p>
                  </div>
                </div>

                <div className="absolute -right-16 top-4 text-[12px] font-bold text-[#52636d]">
                  100%
                </div>

                <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#52636d]">
                  50%
                </div>

                <div className="absolute -right-12 bottom-4 text-[12px] font-bold text-[#52636d]">
                  0%
                </div>
              </div>

              <div className="mt-7 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-[#edf4f0] p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#50645b]">
                    Capacity
                  </p>

                  <p className="mt-1 text-[15px] font-bold text-[#172033]">
                    {formatNumber(selectedTank.capacity)} L
                  </p>
                </div>

                <div className="rounded-lg bg-[#edf4f0] p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#50645b]">
                    Available
                  </p>

                  <p className="mt-1 text-[15px] font-bold text-[#172033]">
                    {formatNumber(
                      selectedTank.capacity - currentVolume,
                    )}{" "}
                    L
                  </p>
                </div>

                <div className="rounded-lg bg-[#edf4f0] p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#50645b]">
                    Product
                  </p>

                  <p className="mt-1 text-[15px] font-bold text-[#172033]">
                    {selectedTank.product}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SENSOR TELEMETRY */}
          <section className="rounded-xl border border-[#cbd8d2] bg-white p-6 shadow-[0_2px_8px_rgba(25,50,40,0.05)]">
            <div className="border-b border-[#dfe8e3] pb-5">
              <h2 className="text-[19px] font-bold text-[#172033]">
                Sensor Telemetry
              </h2>

              <p className="mt-2 text-[13px] font-medium text-[#53636e]">
                Measurement points assigned to {selectedTank.id}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {selectedTank.sensors.map((sensor) => (
                <div
                  key={sensor.id}
                  className="rounded-lg border border-[#dce5e0] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-bold text-[#2d3b47]">
                        {sensor.type}
                      </p>

                      <p className="mt-1 font-mono text-[11px] font-semibold text-[#5b6b75]">
                        {sensor.id}
                      </p>
                    </div>

                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      Healthy
                    </span>
                  </div>

                  <p className="mt-3 text-[20px] font-bold text-[#172033]">
                    {sensorValue(sensor.type, selectedTank)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* CONNECTIVITY + EVENTS */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          <section className="rounded-xl border border-[#cbd8d2] bg-white p-6 shadow-[0_2px_8px_rgba(25,50,40,0.05)]">
            <div className="flex items-center justify-between border-b border-[#dfe8e3] pb-5">
              <div>
                <h2 className="text-[19px] font-bold text-[#172033]">
                  Gateway Connectivity
                </h2>

                <p className="mt-2 text-[13px] font-medium text-[#53636e]">
                  Communication path for field telemetry
                </p>
              </div>

              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800">
                ONLINE
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-[#edf4f0] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#50645b]">
                  Gateway
                </p>

                <p className="mt-2 font-mono text-[13px] font-bold text-[#172033]">
                  {selectedTank.gateway}
                </p>
              </div>

              <div className="rounded-lg bg-[#edf4f0] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#50645b]">
                  Signal
                </p>

                <p className="mt-2 text-[14px] font-bold text-[#172033]">
                  -61 dBm
                </p>
              </div>

              <div className="rounded-lg bg-[#edf4f0] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#50645b]">
                  Interface
                </p>

                <p className="mt-2 text-[14px] font-bold text-[#172033]">
                  MQTT Ready
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#cbd8d2] bg-white p-6 shadow-[0_2px_8px_rgba(25,50,40,0.05)]">
            <div className="border-b border-[#dfe8e3] pb-5">
              <h2 className="text-[19px] font-bold text-[#172033]">
                Recent Events
              </h2>

              <p className="mt-2 text-[13px] font-medium text-[#53636e]">
                Latest platform and telemetry activity
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {[
                {
                  time: "Just now",
                  text: `${selectedTank.id} telemetry received`,
                  type: "Telemetry",
                },
                {
                  time: "2 min ago",
                  text: `${selectedTank.gateway} heartbeat received`,
                  type: "Gateway",
                },
                {
                  time: "8 min ago",
                  text: "Sensor health check completed",
                  type: "System",
                },
              ].map((event) => (
                <div
                  key={`${event.time}-${event.text}`}
                  className="flex items-start gap-3"
                >
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#3f8f6b]" />

                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#35434e]">
                      {event.text}
                    </p>

                    <p className="mt-1 text-[11px] font-medium text-[#5b6b75]">
                      {event.type} · {event.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ARCHITECTURE */}
        <section className="mt-6 rounded-xl border border-[#bfd3c9] bg-[#e4f0eb] p-5 shadow-[0_2px_8px_rgba(25,50,40,0.03)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#315f4b]">
                Hardware-Ready Monitoring Layer
              </p>

              <p className="mt-2 max-w-4xl text-[13px] font-medium leading-6 text-[#40584e]">
                The monitoring interface is organized around Site → Tank →
                Sensor → Gateway → Telemetry. The current stream is simulated
                so the platform can be developed and tested before physical
                equipment is connected. Future integration adapters will feed
                the same telemetry model from supported industrial interfaces.
              </p>
            </div>

            <div className="shrink-0 rounded-lg border border-[#b8cec3] bg-white px-5 py-3 font-mono text-[11px] font-bold text-[#315f4b]">
              SENSOR → GATEWAY → TELEMETRY
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
