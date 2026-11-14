
"use client";

import { useId } from "react";

export type VisualizationTank = {
  id: string;
  tankCode: string;
  name: string;
  product: string;
  capacity: number;
  capacityUnit: string;
  level: number;
  temperature: number;
  pressure: number | null;
  flow: number;
  flowUnit: string;
  status: "Normal" | "Warning" | "Critical";
  gateway: string;
};

type Props = {
  tanks: VisualizationTank[];
  selectedTankId: string;
  onSelect: (id: string) => void;
};

const statusStyles = {
  Normal:
    "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900",
  Warning:
    "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900",
  Critical:
    "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900",
};

function TankGraphic({
  tank,
  large = false,
}: {
  tank: VisualizationTank;
  large?: boolean;
}) {
  const rawId = useId().replace(/:/g, "");
  const clipId = `tank-clip-${rawId}`;
  const fill = Math.max(0, Math.min(100, tank.level));
  const liquidY = 174 - fill * 1.42;

  const liquidColor =
    tank.status === "Critical"
      ? "#ef4444"
      : tank.status === "Warning"
        ? "#e9a23b"
        : "#22a68a";

  return (
    <svg
      viewBox="0 0 180 205"
      role="img"
      aria-label={`${tank.name}: ${fill.toFixed(1)} percent full`}
      className={large ? "w-full max-w-[250px]" : "w-full max-w-[155px]"}
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M39 49 Q39 35 90 35 Q141 35 141 49 L141 158 Q141 176 90 176 Q39 176 39 158 Z" />
        </clipPath>
        <linearGradient id={`${clipId}-metal`} x1="0" x2="1">
          <stop offset="0%" stopColor="#aabbb7" />
          <stop offset="18%" stopColor="#f6faf8" />
          <stop offset="55%" stopColor="#cbd9d5" />
          <stop offset="83%" stopColor="#f7faf9" />
          <stop offset="100%" stopColor="#92a7a1" />
        </linearGradient>
        <linearGradient id={`${clipId}-liquid`} x1="0" x2="1">
          <stop offset="0%" stopColor={liquidColor} stopOpacity=".76" />
          <stop offset="52%" stopColor={liquidColor} />
          <stop offset="100%" stopColor={liquidColor} stopOpacity=".72" />
        </linearGradient>
      </defs>

      <ellipse cx="90" cy="188" rx="58" ry="8" fill="#163c32" opacity=".10" />

      <g clipPath={`url(#${clipId})`}>
        <rect
          x="35"
          y={liquidY}
          width="110"
          height={180 - liquidY}
          fill={`url(#${clipId}-liquid)`}
        />
        <path
          d={`M35 ${liquidY} Q55 ${liquidY - 5} 75 ${liquidY} T115 ${liquidY} T145 ${liquidY}`}
          fill="none"
          stroke="#ffffff"
          strokeOpacity=".8"
          strokeWidth="2.5"
        >
          <animate
            attributeName="d"
            dur="4s"
            repeatCount="indefinite"
            values={`M35 ${liquidY} Q55 ${liquidY - 5} 75 ${liquidY} T115 ${liquidY} T145 ${liquidY};M35 ${liquidY} Q55 ${liquidY + 4} 75 ${liquidY} T115 ${liquidY + 4} T145 ${liquidY};M35 ${liquidY} Q55 ${liquidY - 5} 75 ${liquidY} T115 ${liquidY} T145 ${liquidY}`}
          />
        </path>
      </g>

      <path
        d="M39 49 Q39 35 90 35 Q141 35 141 49 L141 158 Q141 176 90 176 Q39 176 39 158 Z"
        fill={`url(#${clipId}-metal)`}
        fillOpacity=".35"
        stroke="#718b83"
        strokeWidth="2"
      />
      <ellipse cx="90" cy="49" rx="51" ry="14" fill="#eaf1ee" stroke="#819a92" strokeWidth="2" />
      <ellipse cx="90" cy="49" rx="43" ry="9" fill="#d5e1dc" stroke="#a4b8b0" />
      <path d="M48 68 V151 M132 68 V151" stroke="#ffffff" strokeOpacity=".65" strokeWidth="3" />
      <path d="M34 83 H27 V103 H34 M146 83 H153 V103 H146" fill="none" stroke="#718b83" strokeWidth="2" />
      <path d="M65 176 V185 M115 176 V185 M53 186 H127" stroke="#718b83" strokeWidth="3" strokeLinecap="round" />

      <rect x="146" y="65" width="8" height="96" rx="4" fill="#dce6e1" stroke="#8da49b" />
      <rect
        x="148"
        y={65 + (1 - fill / 100) * 90}
        width="4"
        height={Math.max(3, fill * 0.9)}
        rx="2"
        fill={liquidColor}
      />

      <text x="90" y="112" textAnchor="middle" fill="#000000" fontSize="20" fontWeight="900">
        {fill.toFixed(1)}%
      </text>
      <text x="90" y="126" textAnchor="middle" fill="#000000" fontSize="8" fontWeight="800" letterSpacing="1.4">
        FILL LEVEL
      </text>
    </svg>
  );
}

export default function IndustrialTankVisualization({
  tanks,
  selectedTankId,
  onSelect,
}: Props) {
  const selected =
    tanks.find((tank) => tank.id === selectedTankId) ?? tanks[0] ?? null;

  if (!selected) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-950">
        <p className="font-bold text-slate-900 dark:text-slate-100">
          Tank visualization
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Register a tank to begin monitoring its digital twin.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700 dark:text-emerald-300">
            Industrial digital twin
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
            Tank visualization
          </h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Simulation view
        </span>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_.9fr]">
        <div className="relative flex min-h-[340px] flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,#f0f8f3_0%,#e8f2ec_48%,#f8fbf9_100%)] px-5 py-7 dark:bg-[radial-gradient(ellipse_at_center,#203c32_0%,#142a23_48%,#0f1d19_100%)]">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(#c6d9cf_1px,transparent_1px),linear-gradient(90deg,#c6d9cf_1px,transparent_1px)] [background-size:28px_28px]" />

          <div className="absolute left-5 top-5 rounded-lg border border-white/60 bg-white/80 px-3 py-2 backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Selected asset
            </p>
            <p className="mt-1 text-xs font-bold text-slate-900 dark:text-slate-100">
              {selected.tankCode}
            </p>
          </div>

          <div className="absolute right-5 top-5 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Capacity
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
              {new Intl.NumberFormat("en-US").format(selected.capacity)} {selected.capacityUnit}
            </p>
          </div>

          <div className="relative mt-5">
            <div className="absolute inset-x-5 bottom-3 h-7 rounded-full bg-emerald-900/10 blur-xl" />
            <TankGraphic tank={selected} large />
          </div>

          <p className="relative mt-1 text-center text-base font-bold text-slate-900 dark:text-slate-100">
            {selected.name}
          </p>
          <p className="relative mt-1 text-xs text-slate-600 dark:text-slate-300">
            {selected.product} · {selected.level.toFixed(1)}% filled
          </p>
        </div>

        <div className="flex flex-col p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Asset fleet
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {tanks.length} configured
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {tanks.map((tank) => {
              const active = tank.id === selected.id;

              return (
                <button
                  key={tank.id}
                  type="button"
                  onClick={() => onSelect(tank.id)}
                  aria-pressed={active}
                  className={`group rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    active
                      ? "border-emerald-600 bg-emerald-50 shadow-sm ring-1 ring-emerald-600/20 dark:border-emerald-500 dark:bg-emerald-950/40"
                      : "border-slate-200 bg-white hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {tank.tankCode}
                    </span>
                    <span className={`rounded-full px-1.5 py-1 text-[9px] font-bold ring-1 ${statusStyles[tank.status]}`}>
                      {tank.status}
                    </span>
                  </div>

                  <div className="mx-auto mt-1 flex justify-center">
                    <TankGraphic tank={tank} />
                  </div>

                  <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {tank.name}
                  </p>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${Math.max(0, Math.min(100, tank.level))}%`,
                        backgroundColor:
                          tank.status === "Critical"
                            ? "#ef4444"
                            : tank.status === "Warning"
                              ? "#e9a23b"
                              : "#22a68a",
                      }}
                    />
                  </div>

                  <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                    Level{" "}
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {tank.level.toFixed(1)}%
                    </span>
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Temperature
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                {selected.temperature.toFixed(1)}°C
              </p>
            </div>

            <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Flow rate
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                {selected.flow.toFixed(1)}{" "}
                <span className="text-xs font-medium">{selected.flowUnit}</span>
              </p>
            </div>

            <div className="col-span-2 flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Gateway
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {selected.gateway}
                </p>
              </div>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                Unverified
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 text-[10px] text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:px-7">
        <span>Visualization reflects application-supplied telemetry.</span>
        <span className="font-semibold tracking-wide text-emerald-700 dark:text-emerald-300">
          SIMULATED TELEMETRY · NOT PHYSICAL SENSOR DATA
        </span>
      </div>
    </section>
  );
}