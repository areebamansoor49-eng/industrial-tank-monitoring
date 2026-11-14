
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

type Site = {
  id: string;
  name: string;
  code: string;
};

type Gateway = {
  id: string;
  name: string;
  gateway_code: string;
  site_id: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  firmware_version: string | null;
  status: string;
  last_seen_at: string | null;
  created_at: string;
};

type Device = {
  id: string;
  name: string;
  device_code: string;
  device_type: string;
  site_id: string | null;
  gateway_id: string | null;
  tank_id: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  firmware_version: string | null;
  status: string;
  last_seen_at: string | null;
  created_at: string;
};

type Props = {
  resource: "gateways" | "devices";
};

const statusStyles: Record<string, string> = {
  online: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  offline: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  maintenance: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
};

export default function AssetRegistryPage({ resource }: Props) {
  const isGateway = resource === "gateways";
  const title = isGateway ? "Gateway Management" : "Device Management";
  const description = isGateway
    ? "Manage industrial gateways and review their registered connectivity details."
    : "Manage field devices, sensors and their gateway and tank assignments.";

  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [availableGateways, setAvailableGateways] = useState<
    { id: string; name: string; gateway_code: string }[]
  >([]);
  const [tanks, setTanks] = useState<
    { id: string; name: string; tank_code: string }[]
  >([]);

  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Gateway | Device | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Gateway | Device | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/assets/${resource}`, {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load records.");
      }

      setSites(result.sites ?? []);
      setCanManage(Boolean(result.canManage));

      if (resource === "gateways") {
        setGateways(result.gateways ?? []);
      } else {
        setDevices(result.devices ?? []);
        setAvailableGateways(result.gateways ?? []);
        setTanks(result.tanks ?? []);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load records.",
      );
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const records = isGateway ? gateways : devices;

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const item = record as Gateway & Device;

      const searchable = [
        item.name,
        isGateway ? item.gateway_code : item.device_code,
        isGateway ? item.manufacturer : item.device_type,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        searchable.includes(query.toLowerCase()) &&
        (filter === "all" || item.status === filter)
      );
    });
  }, [records, query, filter, isGateway]);

  const counts = {
    total: records.length,
    online: records.filter((item) => item.status === "online").length,
    offline: records.filter((item) => item.status === "offline").length,
    attention: records.filter(
      (item) => item.status === "warning" || item.status === "maintenance",
    ).length,
  };

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const editing = Boolean(editingRecord);
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const body: Record<string, FormDataEntryValue | string> =
        Object.fromEntries(new FormData(form).entries());

      if (editingRecord) body.id = editingRecord.id;

      const response = await fetch(`/api/assets/${resource}`, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Unable to save record.");

      setShowForm(false);
      setEditingRecord(null);
      setMessage(`${isGateway ? "Gateway" : "Device"} ${editing ? "updated" : "registered"} successfully.`);
      form.reset();
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save record.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(record: Gateway | Device) {
    setError("");
    setMessage("");
    setDeleteTarget(record);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    const record = deleteTarget;
    setDeletingId(record.id);
    setError("");

    try {
      const response = await fetch(
        `/api/assets/${resource}?id=${encodeURIComponent(record.id)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to delete record.");
      }

      setDeleteTarget(null);
      setMessage(`${isGateway ? "Gateway" : "Device"} deleted successfully.`);
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete record.");
    } finally {
      setDeletingId(null);
    }
  }

  function siteName(siteId: string | null) {
    return sites.find((site) => site.id === siteId)?.name ?? "Unassigned";
  }

  function recordDetails(record: Gateway | Device) {
    if (isGateway) {
      const gateway = record as Gateway;
      return [
        siteName(gateway.site_id),
        gateway.manufacturer,
        gateway.model,
      ].filter(Boolean).join(" · ");
    }

    const device = record as Device;
    const gateway = availableGateways.find(
      (item) => item.id === device.gateway_id,
    );
    const tank = tanks.find((item) => item.id === device.tank_id);

    return [
      device.device_type,
      siteName(device.site_id),
      gateway ? `Gateway: ${gateway.gateway_code}` : null,
      tank ? `Tank: ${tank.tank_code}` : null,
    ].filter(Boolean).join(" · ");
  }

  return (
    <main className="min-h-full p-5 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">Industrial Tank Monitoring / Assets</p>
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
              onClick={() => void loadRecords()}
              disabled={loading}
              className="glass-panel rounded-lg px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>

            {canManage && (
              <button
                type="button"
                onClick={() => { setEditingRecord(null); setShowForm((current) => !current); }}
                className="theme-primary-button rounded-lg px-4 py-2.5 text-sm font-semibold"
              >
                {showForm ? "Close Form" : `+ Register ${isGateway ? "Gateway" : "Device"}`}
              </button>
            )}
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Registered", value: counts.total },
            { label: "Online", value: counts.online },
            { label: "Offline", value: counts.offline },
            { label: "Needs Attention", value: counts.attention },
          ].map((metric) => (
            <div key={metric.label} className="glass-panel rounded-xl p-5">
              <p className="theme-muted text-xs font-semibold uppercase tracking-wide">
                {metric.label}
              </p>
              <p className="mt-3 text-3xl font-bold tabular-nums">
                {loading ? "—" : metric.value}
              </p>
            </div>
          ))}
        </section>

        {showForm && canManage && (
          <section className="glass-panel mt-7 rounded-xl p-5 sm:p-6">
            <h2 className="text-lg font-bold">
              {editingRecord ? "Edit" : "Register New"} {isGateway ? "Gateway" : "Device"}
            </h2>
            <p className="theme-muted mt-1 text-sm">
              New records are saved to your organization's database.
            </p>

            <form key={editingRecord?.id ?? "new"} onSubmit={handleSave} className="mt-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-sm font-medium">
                  Name *
                  <input
                    name="name"
                    required
                    maxLength={120}
                    defaultValue={editingRecord?.name ?? ""}
                    placeholder={isGateway ? "Main Facility Gateway" : "Tank Level Sensor"}
                    className="mt-2 w-full rounded-lg border border-black/10 bg-transparent px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10"
                  />
                </label>

                <label className="text-sm font-medium">
                  {isGateway ? "Gateway Code *" : "Device Code *"}
                  <input
                    name={isGateway ? "gateway_code" : "device_code"}
                    required
                    maxLength={40}
                    pattern="[A-Za-z0-9_-]+"
                    defaultValue={editingRecord ? ("gateway_code" in editingRecord ? editingRecord.gateway_code : editingRecord.device_code) : ""}
                    placeholder={isGateway ? "GW-001" : "DEV-001"}
                    className="mt-2 w-full rounded-lg border border-black/10 bg-transparent px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10"
                  />
                </label>

                {!isGateway && (
                  <label className="text-sm font-medium">
                    Device Type *
                    <input
                      name="device_type"
                      required
                      maxLength={120}
                      defaultValue={editingRecord && "device_type" in editingRecord ? editingRecord.device_type : ""}
                      placeholder="Level Sensor"
                      className="mt-2 w-full rounded-lg border border-black/10 bg-transparent px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10"
                    />
                  </label>
                )}

                <label className="text-sm font-medium">
                  Site
                  <select
                    name="site_id"
                    defaultValue={editingRecord?.site_id ?? ""}
                    className="mt-2 w-full rounded-lg border border-black/10 bg-transparent px-3 py-2.5 dark:border-white/10"
                  >
                    <option value="">Unassigned</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name} ({site.code})
                      </option>
                    ))}
                  </select>
                </label>

                {!isGateway && (
                  <>
                    <label className="text-sm font-medium">
                      Gateway
                      <select
                        name="gateway_id"
                        defaultValue={editingRecord && "gateway_id" in editingRecord ? editingRecord.gateway_id ?? "" : ""}
                        className="mt-2 w-full rounded-lg border border-black/10 bg-transparent px-3 py-2.5 dark:border-white/10"
                      >
                        <option value="">Unassigned</option>
                        {availableGateways.map((gateway) => (
                          <option key={gateway.id} value={gateway.id}>
                            {gateway.name} ({gateway.gateway_code})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-sm font-medium">
                      Tank
                      <select
                        name="tank_id"
                        defaultValue={editingRecord && "tank_id" in editingRecord ? editingRecord.tank_id ?? "" : ""}
                        className="mt-2 w-full rounded-lg border border-black/10 bg-transparent px-3 py-2.5 dark:border-white/10"
                      >
                        <option value="">Unassigned</option>
                        {tanks.map((tank) => (
                          <option key={tank.id} value={tank.id}>
                            {tank.name} ({tank.tank_code})
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}

                <label className="text-sm font-medium">
                  Manufacturer
                  <input
                    name="manufacturer"
                    defaultValue={editingRecord?.manufacturer ?? ""}
                    maxLength={120}
                    placeholder="Manufacturer"
                    className="mt-2 w-full rounded-lg border border-black/10 bg-transparent px-3 py-2.5 dark:border-white/10"
                  />
                </label>

                <label className="text-sm font-medium">
                  Model
                  <input
                    name="model"
                    defaultValue={editingRecord?.model ?? ""}
                    maxLength={120}
                    placeholder="Model number"
                    className="mt-2 w-full rounded-lg border border-black/10 bg-transparent px-3 py-2.5 dark:border-white/10"
                  />
                </label>

                <label className="text-sm font-medium">
                  Serial Number
                  <input
                    name="serial_number"
                    defaultValue={editingRecord?.serial_number ?? ""}
                    maxLength={120}
                    placeholder="Serial number"
                    className="mt-2 w-full rounded-lg border border-black/10 bg-transparent px-3 py-2.5 dark:border-white/10"
                  />
                </label>

                <label className="text-sm font-medium">
                  Status
                  <select
                    name="status"
                    defaultValue={editingRecord?.status ?? "offline"}
                    className="mt-2 w-full rounded-lg border border-black/10 bg-transparent px-3 py-2.5 dark:border-white/10"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="warning">Warning</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </label>

                <label className="text-sm font-medium">
                  Firmware Version
                  <input
                    name="firmware_version"
                    defaultValue={editingRecord?.firmware_version ?? ""}
                    maxLength={120}
                    placeholder="e.g. 1.0.0"
                    className="mt-2 w-full rounded-lg border border-black/10 bg-transparent px-3 py-2.5 dark:border-white/10"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="theme-primary-button rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? "Saving..." : `${editingRecord ? "Update" : "Save"} ${isGateway ? "Gateway" : "Device"}`}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingRecord(null); }}
                  className="rounded-lg border border-black/10 px-5 py-2.5 text-sm font-semibold dark:border-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="glass-panel mt-7 rounded-xl p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-bold">
                {isGateway ? "Gateway Register" : "Device Register"}
              </h2>
              <p className="theme-muted mt-1 text-sm">
                Live records retrieved from your organization database.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${isGateway ? "gateways" : "devices"}...`}
                className="min-w-[220px] rounded-lg border border-black/10 bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10"
              />

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-lg border border-black/10 bg-transparent px-3 py-2.5 text-sm dark:border-white/10"
              >
                <option value="all">All statuses</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="warning">Warning</option>
                <option value="maintenance">Maintenance</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
                className="rounded-lg border border-black/10 px-4 py-2.5 text-sm font-semibold dark:border-white/10"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-black/[0.03] text-xs uppercase tracking-wide dark:bg-white/[0.04]">
                <tr>
                  <th className="px-5 py-4">Name / Code</th>
                  <th className="px-5 py-4">Details</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Last Seen</th>
                  <th className="px-5 py-4">Registered</th>
                  {canManage && <th className="px-5 py-4">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="px-5 py-12 text-center theme-muted">
                      Loading organization records...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="px-5 py-12 text-center">
                      <p className="font-semibold">No matching records</p>
                      <p className="theme-muted mt-1 text-xs">
                        {records.length === 0
                          ? "No records have been registered yet."
                          : "Try changing your search or status filter."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="border-t border-black/10 dark:border-white/10"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold">{record.name}</p>
                        <p className="theme-muted mt-1 text-xs">
                          {isGateway
                            ? (record as Gateway).gateway_code
                            : (record as Device).device_code}
                        </p>
                      </td>
                      <td className="theme-muted px-5 py-4 text-xs">
                        {recordDetails(record)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyles[record.status] ?? statusStyles.offline
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="theme-muted px-5 py-4 text-xs">
                        {record.last_seen_at
                          ? new Date(record.last_seen_at).toLocaleString()
                          : "Never"}
                      </td>
                      <td className="theme-muted px-5 py-4 text-xs">
                        {new Date(record.created_at).toLocaleDateString()}
                      </td>
                      {canManage && (
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRecord(record);
                                setShowForm(true);
                                setError("");
                                setMessage("");
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold dark:border-white/10"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === record.id}
                              onClick={() => void handleDelete(record)}
                              className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50 dark:text-red-400"
                            >
                              {deletingId === record.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="theme-muted mt-3 text-xs">
            Showing {filteredRecords.length} of {records.length} registered records.
          </p>
        </section>

        <section className="glass-panel mt-7 rounded-xl p-5 sm:p-6">
          <h2 className="text-lg font-bold">Workspace Navigation</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/assets" className="rounded-lg border border-black/10 px-4 py-2.5 text-sm font-semibold dark:border-white/10">
              Assets
            </Link>
            <Link href="/assets/tanks" className="rounded-lg border border-black/10 px-4 py-2.5 text-sm font-semibold dark:border-white/10">
              Tank Inventory
            </Link>
            <Link href="/assets/gateways" className="rounded-lg border border-black/10 px-4 py-2.5 text-sm font-semibold dark:border-white/10">
              Gateways
            </Link>
            <Link href="/assets/devices" className="rounded-lg border border-black/10 px-4 py-2.5 text-sm font-semibold dark:border-white/10">
              Devices
            </Link>
            <Link href="/dashboard" className="theme-primary-button rounded-lg px-4 py-2.5 text-sm font-semibold">
              Back to Dashboard
            </Link>
          </div>
        </section>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
          role="presentation"
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:p-7"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-xl text-red-700 dark:bg-red-500/15 dark:text-red-400">
              !
            </div>

            <h2 id="delete-dialog-title" className="mt-5 text-xl font-bold">
              Delete {isGateway ? "Gateway" : "Device"}?
            </h2>

            <p id="delete-dialog-description" className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              You are about to delete <strong className="text-slate-900 dark:text-white">{deleteTarget.name}</strong>.
              This action cannot be undone. Linked records may prevent deletion.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={() => void confirmDelete()}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId !== null ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </section>
        </div>
      )}

      </div>
    </main>
  );
}
