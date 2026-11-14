"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type SiteStatus = "operational" | "maintenance" | "offline" | "archived";

type Site = {
  id: string;
  name: string;
  code: string;
  location: string | null;
  timezone: string | null;
  description: string | null;
  status: SiteStatus;
};

const emptyForm = {
  name: "",
  code: "",
  location: "",
  timezone: "Asia/Karachi",
  description: "",
  status: "operational" as SiteStatus,
};

const statuses: SiteStatus[] = [
  "operational",
  "maintenance",
  "offline",
  "archived",
];

export default function SiteManagementPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadSites() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/assets/sites", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load sites.");
      }

      setSites(result.sites ?? []);
      setCanManage(Boolean(result.canManage));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load sites.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSites();
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function startEdit(site: Site) {
    setEditingId(site.id);
    setForm({
      name: site.name,
      code: site.code,
      location: site.location ?? "",
      timezone: site.timezone ?? "",
      description: site.description ?? "",
      status: site.status,
    });
    setError("");
    setMessage("");
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        editingId ? `/api/assets/sites/${editingId}` : "/api/assets/sites",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to save site.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setMessage(editingId ? "Site updated successfully." : "Site created successfully.");
      await loadSites();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save site.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(site: Site) {
    if (!window.confirm(`Delete site "${site.name}"?`)) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/assets/sites/${site.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to delete site.");
      }

      setMessage("Site deleted successfully.");
      await loadSites();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete site.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">
              Asset Management / Infrastructure
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Site Management
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Manage locations for your tanks, gateways and connected devices.
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={startCreate}
              className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
            >
              + Register site
            </button>
          )}
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-xs font-bold uppercase text-slate-500">Total sites</p>
            <p className="mt-2 text-3xl font-black">{sites.length}</p>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-xs font-bold uppercase text-slate-500">Operational</p>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              {sites.filter((site) => site.status === "operational").length}
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-xs font-bold uppercase text-slate-500">Maintenance</p>
            <p className="mt-2 text-3xl font-black text-amber-600">
              {sites.filter((site) => site.status === "maintenance").length}
            </p>
          </div>
        </section>

        {message && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {message}
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}

        {showForm && canManage && (
          <section className="rounded-2xl border border-emerald-200 bg-white p-6">
            <h2 className="mb-5 text-xl font-extrabold">
              {editingId ? "Edit site" : "Register new site"}
            </h2>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold">
                Site name *
                <input
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Karachi Main Facility"
                  className="w-full rounded-xl border p-3 font-normal"
                />
              </label>

              <label className="space-y-2 text-sm font-semibold">
                Site code *
                <input
                  required
                  maxLength={40}
                  pattern="[A-Za-z0-9_-]+"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="KHI-PLANT-01"
                  className="w-full rounded-xl border p-3 font-normal uppercase"
                />
              </label>

              <label className="space-y-2 text-sm font-semibold">
                Location
                <input
                  maxLength={160}
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="City or industrial area"
                  className="w-full rounded-xl border p-3 font-normal"
                />
              </label>

              <label className="space-y-2 text-sm font-semibold">
                Timezone
                <input
                  maxLength={80}
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  placeholder="Asia/Karachi"
                  className="w-full rounded-xl border p-3 font-normal"
                />
              </label>

              <label className="space-y-2 text-sm font-semibold">
                Status
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as SiteStatus })
                  }
                  className="w-full rounded-xl border bg-white p-3 font-normal"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-semibold md:col-span-2">
                Description
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional site details"
                  className="w-full rounded-xl border p-3 font-normal"
                />
              </label>

              <div className="flex flex-wrap gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Save changes" : "Create site"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                  className="rounded-xl border px-5 py-3 text-sm font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Registered sites</h2>
            <button
              type="button"
              onClick={() => void loadSites()}
              className="text-sm font-semibold text-emerald-700"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">
              Loading sites...
            </div>
          ) : sites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-white p-12 text-center">
              <h3 className="text-lg font-extrabold">No sites registered yet</h3>
              <p className="mt-2 text-sm text-slate-500">
                Register a site to make it available for tank and gateway assignments.
              </p>
              {canManage && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="mt-5 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white"
                >
                  Register first site
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {sites.map((site) => (
                <article key={site.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold tracking-widest text-emerald-700">
                        {site.code}
                      </p>
                      <h3 className="mt-2 text-lg font-extrabold">{site.name}</h3>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                      {site.status}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
                    <p>
                      <span className="block text-xs font-bold uppercase text-slate-400">Location</span>
                      {site.location || "Not specified"}
                    </p>
                    <p>
                      <span className="block text-xs font-bold uppercase text-slate-400">Timezone</span>
                      {site.timezone || "Not specified"}
                    </p>
                  </div>

                  {site.description && (
                    <p className="mt-4 text-sm text-slate-600">{site.description}</p>
                  )}

                  {canManage && (
                    <div className="mt-5 flex gap-2 border-t pt-4">
                      <button
                        type="button"
                        onClick={() => startEdit(site)}
                        className="rounded-lg border px-4 py-2 text-sm font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(site)}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
