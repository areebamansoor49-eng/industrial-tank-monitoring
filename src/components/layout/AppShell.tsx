"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const primaryNavigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "▦" },
  { label: "Live Monitoring", href: "/operations", icon: "◉" },
];

const managementNavigation: NavItem[] = [
  { label: "Assets", href: "/assets", icon: "□" },
  { label: "Inventory", href: "/inventory", icon: "▤" },
  { label: "Logistics", href: "/logistics", icon: "⇄" },
  { label: "Alerts", href: "/alerts", icon: "!" },
  { label: "Incidents", href: "/incidents", icon: "△" },
  { label: "Reports", href: "/reports", icon: "▥" },
];

function NavigationItem({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`nav-item ${active ? "nav-item-active" : ""}`}
    >
      <span className="nav-icon" aria-hidden="true">
        {item.icon}
      </span>
      <span>{item.label}</span>
    </Link>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }

    return pathname.startsWith(href);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">IT</div>

          <div className="brand-copy">
            <div className="brand-title">Industrial Monitor</div>
            <div className="brand-subtitle">Operations Platform</div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Operations</div>

          <nav className="sidebar-nav" aria-label="Operations navigation">
            {primaryNavigation.map((item) => (
              <NavigationItem
                key={item.href}
                item={item}
                active={isActive(item.href)}
              />
            ))}
          </nav>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Management</div>

          <nav className="sidebar-nav" aria-label="Management navigation">
            {managementNavigation.map((item) => (
              <NavigationItem
                key={item.href}
                item={item}
                active={isActive(item.href)}
              />
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="environment-card">
            <div className="environment-row">
              <div>
                <div className="environment-label">Environment</div>
                <div className="environment-value">Development</div>
              </div>

              <span className="status-dot" aria-label="System online" />
            </div>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <div className="page-context">
              <div className="page-context-label">Organization</div>
              <div className="page-context-title">Demo Operations Group</div>
            </div>

            <div className="site-selector">
              <div className="site-selector-label">Active site</div>
              <div className="site-selector-value">Karachi Terminal — Main</div>
            </div>
          </div>

          <div className="topbar-right">
            <div className="system-state">
              <span className="status-dot" />
              All systems operational
            </div>

            <div className="avatar" aria-label="User profile">
              AM
            </div>
          </div>
        </header>

        <main className="content">
          <div className="content-container">{children}</div>
        </main>
      </div>
    </div>
  );
}