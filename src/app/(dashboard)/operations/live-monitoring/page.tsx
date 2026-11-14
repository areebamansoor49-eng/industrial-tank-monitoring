
"use client";

import { useEffect, useMemo, useState } from "react";
import IndustrialTankVisualization from "@/components/workspaces/IndustrialTankVisualization";

type TankStatus = "Normal" | "Warning" | "Critical";

type Sensor = {
  id: string;
  type: string;
  unit: string;
};

type Tank = {
  id: string;
  tankCode: string;
  name: string;
  siteId: string;
  siteName: string;
  product: string;
  capacity: number;
  capacityUnit: string;
  level: number;
  temperature: number;
  pressure: number | null;
  flow: number;
  flowUnit: string;
  status: TankStatus;
  gateway: string;
  gatewayConfigured: boolean;
  sensors: Sensor[];
  mode: "SIMULATED";
};

type Site = {
  id: string;
  name: string;
  location: string;
  status: "Operational" | "Maintenance";
  tankIds: string[];
};

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function statusClasses(status: TankStatus) {
  if (status === "Critical") {
    return "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300";
  }

  if (status === "Warning") {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300";
}

function sensorValue(sensor: Sensor, tank: Tank) {
  if (sensor.type === "Level Sensor") {
    return `${formatNumber(tank.level, 1)} ${sensor.unit}`;
  }

  if (sensor.type === "Temperature Sensor") {
    return `${formatNumber(tank.temperature, 1)} ${sensor.unit}`;
  }

  if (sensor.type === "Pressure Sensor") {
    return tank.pressure == null
      ? "Not configured"
      : `${formatNumber(tank.pressure, 2)} ${sensor.unit}`;
  }

  return `${formatNumber(tank.flow, 1)} ${tank.flowUnit}`;
}

function formatTimestamp(value: string | null) {
  if (!value) return "Waiting for telemetry";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Timestamp unavailable";

  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

export default function LiveMonitoringPage() {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedTankId, setSelectedTankId] = useState("");
  const [isLive, setIsLive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [simulationError, setSimulationError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const selectedSite = useMemo(
    () => sites.find((site) => site.id === selectedSiteId) ?? sites[0] ?? null,
    [sites, selectedSiteId],
  );

  const siteTanks = useMemo(
    () =>
      selectedSite
        ? tanks.filter((tank) => tank.siteId === selectedSite.id)
        : [],
    [tanks, selectedSite],
  );

  const selectedTank = useMemo(
    () =>
      siteTanks.find((tank) => tank.id === selectedTankId) ??
      siteTanks[0] ??
      null,
    [siteTanks, selectedTankId],
  );

  const currentVolume = selectedTank
    ? (selectedTank.capacity * selectedTank.level) / 100
    : 0;

  const availableVolume = selectedTank
    ? Math.max(0, selectedTank.capacity - currentVolume)
    : 0;

  useEffect(() => {
    if (!isLive) return;

    let cancelled = false;

    const refreshTelemetry = async () => {
      try {
        const response = await fetch("/api/telemetry/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        const responseText = await response.text();

        let payload: any = null;

        try {
          payload = responseText ? JSON.parse(responseText) : null;
        } catch {
          throw new Error(
            `Simulator returned an invalid response (${response.status}). ${
              responseText
                ? responseText.slice(0, 200)
                : "Response body was empty."
            }`,
          );
        }

        if (!response.ok) {
          throw new Error(
            typeof payload?.error === "string"
              ? payload.error
              : "Unable to retrieve telemetry.",
          );
        }

        if (
          cancelled ||
          payload.mode !== "SIMULATED" ||
          !Array.isArray(payload.tanks) ||
          !Array.isArray(payload.sites)
        ) {
          return;
        }

        const nextTanks = payload.tanks as Tank[];
        const nextSites = payload.sites as Site[];

        // An empty database inventory must clear all previous data.
        if (nextTanks.length === 0) {
          setTanks([]);
          setSites(nextSites);
          setSelectedTankId("");
          setSelectedSiteId(nextSites[0]?.id ?? "");
          setLastUpdated(payload.recorded_at ?? null);
          setSimulationError("");
          return;
        }

        setTanks(nextTanks);
        setSites(nextSites);
        setLastUpdated(payload.recorded_at ?? null);
        setSimulationError("");

        setSelectedSiteId((current) => {
          if (nextSites.some((site) => site.id === current)) {
            return current;
          }

          return nextSites[0]?.id ?? "";
        });

        setSelectedTankId((current) => {
          if (nextTanks.some((tank) => tank.id === current)) {
            return current;
          }

          return nextTanks[0]?.id ?? "";
        });
      } catch (error) {
        if (!cancelled) {
          setSimulationError(
            error instanceof Error
              ? error.message
              : "Unable to refresh simulated telemetry.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void refreshTelemetry();

    const interval = window.setInterval(() => {
      void refreshTelemetry();
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isLive]);

  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId);

    const firstTank = tanks.find((tank) => tank.siteId === siteId);

    setSelectedTankId(firstTank?.id ?? "");
  };

  const cardClass =
    "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";

  const mutedText = "text-slate-500 dark:text-slate-400";
  const headingText = "text-slate-900 dark:text-slate-100";

  return (
    <main className="min-h-full bg-slate-50 px-3 py-5 dark:bg-slate-950 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-[1800px]">

        {/* HEADER */}
        <header className="rounded-2xl border border-slate-800 bg-[#10251f] p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-6 w-6"
                  >
                    <path d="M12 3v18M7 6h10M6 10h12M7 14h10M8 18h8" />
                  </svg>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300/80">
                    Operations
                  </p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Live Monitoring
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                Monitor registered storage assets, simulated telemetry,
                measurement points and gateway configuration across your
                organization.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isLive ? "animate-pulse bg-emerald-400" : "bg-slate-500"
                  }`}
                />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {isLive ? "Simulation Active" : "Monitoring Paused"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsLive((value) => !value)}
                className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                {isLive ? "Pause Stream" : "Resume Stream"}
              </button>
            </div>
          </div>
        </header>

        {/* ERROR */}
        {simulationError && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
          >
            <div className="flex items-start gap-3">
              <span className="font-bold">Telemetry issue</span>
              <span>{simulationError}</span>
            </div>
          </div>
        )}

        {/* LOADING */}
        {isLoading && (
          <section className={`${cardClass} mt-6`}>
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
              <p className={`text-sm font-semibold ${headingText}`}>
                Loading registered assets and telemetry...
              </p>
            </div>
          </section>
        )}

        {/* EMPTY INVENTORY */}
        {!isLoading && tanks.length === 0 && (
          <section className={`${cardClass} mt-6 px-6 py-14 text-center`}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-8 w-8"
              >
                <path d="M4 20h16M6 20V8l6-4 6 4v12M9 11h6M9 15h6" />
              </svg>
            </div>

            <h2 className={`mt-5 text-xl font-bold ${headingText}`}>
              No registered tanks available
            </h2>

            <p className={`mx-auto mt-2 max-w-lg text-sm leading-6 ${mutedText}`}>
              Register a storage tank in Asset Management to start monitoring
              its simulated telemetry here. This workspace only displays
              assets registered in your organization.
            </p>

            <a
              href="/assets/tanks"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              Open Tank Inventory
            </a>
          </section>
        )}

        {/* MONITORING CONTENT */}
        {!isLoading && selectedTank && selectedSite && (
          <>
            {/* SITE / TANK CONTEXT */}
            <section className={`${cardClass} mt-6`}>
              <div className="grid gap-5 lg:grid-cols-3">
                <label className="block">
                  <span className={`mb-2 block text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                    Monitoring Site
                  </span>
                  <select
                    value={selectedSite.id}
                    onChange={(event) => handleSiteChange(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                  <p className={`mt-2 text-xs ${mutedText}`}>
                    {selectedSite.location}
                  </p>
                </label>

                <label className="block">
                  <span className={`mb-2 block text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                    Monitored Tank
                  </span>
                  <select
                    value={selectedTank.id}
                    onChange={(event) => setSelectedTankId(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    {siteTanks.map((tank) => (
                      <option key={tank.id} value={tank.id}>
                        {tank.tankCode} — {tank.name}
                      </option>
                    ))}
                  </select>
                  <p className={`mt-2 text-xs ${mutedText}`}>
                    {siteTanks.length} registered tank
                    {siteTanks.length === 1 ? "" : "s"} at this site
                  </p>
                </label>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Telemetry Mode
                  </p>
                  <p className="mt-2 text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    SIMULATED
                  </p>
                  <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-300/80">
                    {isLive ? "Automatic refresh every 10 seconds" : "Refresh paused"}
                  </p>
                </div>
              </div>
            </section>

            {/* SITE SUMMARY */}
            <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Active Site",
                  value: selectedSite.name,
                  detail: selectedSite.status,
                },
                {
                  label: "Site Tanks",
                  value: String(siteTanks.length),
                  detail: "Registered storage assets",
                },
                {
                  label: "Gateway Configuration",
                  value: selectedTank.gatewayConfigured ? "Assigned" : "Not configured",
                  detail: "Connectivity not verified",
                },
                {
                  label: "Selected Asset",
                  value: selectedTank.tankCode,
                  detail: selectedTank.product,
                },
              ].map((item) => (
                <div key={item.label} className={cardClass}>
                  <p className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                    {item.label}
                  </p>
                  <p className={`mt-3 break-words text-lg font-bold ${headingText}`}>
                    {item.value}
                  </p>
                  <p className={`mt-1 text-sm ${mutedText}`}>
                    {item.detail}
                  </p>
                </div>
              ))}
            </section>

            {/* KPI CARDS */}
            <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                {
                  label: "Tank Level",
                  value: `${formatNumber(selectedTank.level, 1)}%`,
                  detail: "Current fill level",
                },
                {
                  label: "Stored Volume",
                  value: `${formatNumber(currentVolume, 1)} ${selectedTank.capacityUnit}`,
                  detail: `Of ${formatNumber(selectedTank.capacity)} ${selectedTank.capacityUnit}`,
                },
                {
                  label: "Temperature",
                  value: `${formatNumber(selectedTank.temperature, 1)} °C`,
                  detail: "Simulated measurement",
                },
                {
                  label: "Pressure",
                  value: selectedTank.pressure == null
                    ? "Not configured"
                    : `${formatNumber(selectedTank.pressure, 2)} bar`,
                  detail: "Pressure measurement",
                },
                {
                  label: "Flow Rate",
                  value: `${formatNumber(selectedTank.flow, 1)} ${selectedTank.flowUnit}`,
                  detail: "Simulated measurement",
                },
              ].map((item) => (
                <div key={item.label} className={cardClass}>
                  <p className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                    {item.label}
                  </p>
                  <p className={`mt-4 break-words text-xl font-bold ${headingText}`}>
                    {item.value}
                  </p>
                  <p className={`mt-2 text-xs ${mutedText}`}>
                    {item.detail}
                  </p>
                </div>
              ))}
            </section>

            {/* MAIN MONITORING */}
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
              {/* TANK DETAILS */}
              <section className={cardClass}>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className={`text-lg font-bold ${headingText}`}>
                        {selectedTank.name}
                      </h2>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasses(selectedTank.status)}`}>
                        {selectedTank.status}
                      </span>
                    </div>
                    <p className={`mt-2 text-sm ${mutedText}`}>
                      {selectedTank.tankCode} · {selectedSite.name} · {selectedTank.product}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                      Last Telemetry
                    </p>
                    <p className={`mt-2 text-sm font-semibold ${headingText}`}>
                      {formatTimestamp(lastUpdated)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center py-8">
                  <div className="relative h-[310px] w-[210px] rounded-[48%] border-[10px] border-slate-300 bg-slate-100 shadow-inner dark:border-slate-600 dark:bg-slate-800">
                    <div
                      className={`absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-[42%] transition-all duration-700 ${
                        selectedTank.status === "Critical"
                          ? "bg-red-500"
                          : selectedTank.status === "Warning"
                            ? "bg-amber-500"
                            : "bg-emerald-600"
                      }`}
                      style={{
                        height: `${Math.max(0, Math.min(100, selectedTank.level))}%`,
                      }}
                    >
                      <div className="absolute inset-x-0 top-0 h-5 bg-white/20" />
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-xl border border-white/20 bg-slate-950/90 px-6 py-5 text-center text-white shadow-lg">
                        <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                          Fill Level
                        </p>
                        <p className="mt-1 text-4xl font-bold">
                          {formatNumber(selectedTank.level, 1)}%
                        </p>
                      </div>
                    </div>

                    <div className="absolute -right-14 top-2 text-xs font-bold text-slate-500 dark:text-slate-400">100%</div>
                    <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 dark:text-slate-400">50%</div>
                    <div className="absolute -right-10 bottom-2 text-xs font-bold text-slate-500 dark:text-slate-400">0%</div>
                  </div>

                  <div className="mt-8 grid w-full max-w-xl gap-3 sm:grid-cols-3">
                    {[
                      {
                        label: "Capacity",
                        value: `${formatNumber(selectedTank.capacity)} ${selectedTank.capacityUnit}`,
                      },
                      {
                        label: "Available",
                        value: `${formatNumber(availableVolume, 1)} ${selectedTank.capacityUnit}`,
                      },
                      {
                        label: "Product",
                        value: selectedTank.product,
                      },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-slate-100 p-4 text-center dark:bg-slate-800">
                        <p className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                          {item.label}
                        </p>
                        <p className={`mt-2 break-words text-sm font-bold ${headingText}`}>
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* SENSOR TELEMETRY */}
              <section className={cardClass}>
                <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
                  <h2 className={`text-lg font-bold ${headingText}`}>
                    Sensor Telemetry
                  </h2>
                  <p className={`mt-2 text-sm ${mutedText}`}>
                    Configured measurement points for {selectedTank.tankCode}
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  {selectedTank.sensors.map((sensor) => (
                    <div
                      key={sensor.id}
                      className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-sm font-bold ${headingText}`}>
                            {sensor.type}
                          </p>
                          <p className={`mt-1 font-mono text-xs ${mutedText}`}>
                            {sensor.id}
                          </p>
                        </div>
                        <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300">
                          Simulated
                        </span>
                      </div>
                      <p className={`mt-4 text-xl font-bold ${headingText}`}>
                        {sensorValue(sensor, selectedTank)}
                      </p>
                    </div>
                  ))}

                  {selectedTank.pressure == null && (
                    <div className="rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
                      <p className={`text-sm font-semibold ${headingText}`}>
                        Pressure sensor
                      </p>
                      <p className={`mt-1 text-xs ${mutedText}`}>
                        No pressure measurement is currently configured.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* CONNECTIVITY + EVENTS */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className={cardClass}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5 dark:border-slate-800">
                  <div>
                    <h2 className={`text-lg font-bold ${headingText}`}>
                      Gateway Connectivity
                    </h2>
                    <p className={`mt-2 text-sm ${mutedText}`}>
                      Gateway assignment and communication status
                    </p>
                  </div>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                    UNVERIFIED
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      label: "Gateway",
                      value: selectedTank.gateway,
                    },
                    {
                      label: "Signal",
                      value: "Not available",
                    },
                    {
                      label: "Interface",
                      value: "Not verified",
                    },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
                      <p className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                        {item.label}
                      </p>
                      <p className={`mt-3 break-words text-sm font-bold ${headingText}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
                <p className={`mt-4 text-xs leading-5 ${mutedText}`}>
                  A configured gateway does not confirm physical connectivity.
                  Live connection status will be shown after gateway heartbeat
                  integration is implemented.
                </p>
              </section>

              <section className={cardClass}>
                <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
                  <h2 className={`text-lg font-bold ${headingText}`}>
                    Recent Activity
                  </h2>
                  <p className={`mt-2 text-sm ${mutedText}`}>
                    Latest available simulator update
                  </p>
                </div>

                <div className="mt-5 flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-500" />
                  <div>
                    <p className={`text-sm font-semibold ${headingText}`}>
                      Simulated telemetry update recorded
                    </p>
                    <p className={`mt-2 text-xs ${mutedText}`}>
                      {selectedTank.tankCode} · {formatTimestamp(lastUpdated)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
                  <p className={`text-xs leading-5 ${mutedText}`}>
                    Gateway heartbeats, physical sensor health checks and
                    operational event history are not yet connected to this
                    workspace.
                  </p>
                </div>
              </section>
            </div>

            {/* ARCHITECTURE */}
            <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/25">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Hardware-Ready Monitoring Layer
              </p>
              <p className="mt-3 max-w-5xl text-sm leading-6 text-slate-700 dark:text-slate-300">
                The monitoring architecture follows Site → Tank → Sensor →
                Gateway → Telemetry. The current stream is simulated for
                software development and testing before physical equipment
                is connected. Future integration adapters can feed the same
                telemetry model from supported industrial interfaces.
              </p>
              <div className="mt-4 inline-flex rounded-lg border border-emerald-200 bg-white px-4 py-3 font-mono text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300">
                SENSOR → GATEWAY → TELEMETRY
              </div>
            </section>

            {/* DIGITAL TWIN */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
              <IndustrialTankVisualization
                tanks={siteTanks}
                selectedTankId={selectedTank.id}
                onSelect={setSelectedTankId}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}