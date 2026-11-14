"use client";

import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const primaryNavigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "▦" },
  { label: "Live Monitoring", href: "/operations/live-monitoring", icon: "◉" },
];

const managementNavigation: NavItem[] = [
  { label: "Assets", href: "/assets", icon: "□" },
  { label: "Inventory", href: "/inventory", icon: "▤" },
  { label: "Logistics", href: "/logistics", icon: "⇄" },
  { label: "Alerts", href: "/alerts", icon: "!" },
  { label: "Incidents", href: "/incidents", icon: "△" },
  { label: "Reports", href: "/reports", icon: "▥" },
];

function getInitials(name: string | null, email: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "User";

  const words = source
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function NavigationItem({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      className={`nav-item ${active ? "nav-item-active" : ""}`}
      onClick={onNavigate}
    >
      <span className="nav-icon" aria-hidden="true">
        {item.icon}
      </span>

      <span className="nav-label">{item.label}</span>
    </Link>
  );
}

function NavigationGroups({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }

    return pathname.startsWith(href);
  };

  return (
    <>
      <div className="sidebar-section">
        <div className="sidebar-section-label">Operations</div>

        <nav
          className="sidebar-nav"
          aria-label="Operations navigation"
        >
          {primaryNavigation.map((item) => (
            <NavigationItem
              key={item.href}
              item={item}
              active={isActive(item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Management</div>

        <nav
          className="sidebar-nav"
          aria-label="Management navigation"
        >
          {managementNavigation.map((item) => (
            <NavigationItem
              key={item.href}
              item={item}
              active={isActive(item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </div>
    </>
  );
}

function SidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="sidebar-brand">
        <div className="brand-mark">IT</div>

        <div className="brand-copy">
          <div className="brand-title">
            Industrial Monitor
          </div>

          <div className="brand-subtitle">
            Operations Platform
          </div>
        </div>

        {onNavigate && (
          <button
            type="button"
            className="mobile-sidebar-close"
            onClick={onNavigate}
            aria-label="Close navigation"
          >
            ×
          </button>
        )}
      </div>

      <div className="sidebar-scroll">
        <NavigationGroups onNavigate={onNavigate} />
      </div>

      <div className="sidebar-footer">
        <div className="environment-card">
          <div className="environment-row">
            <div>
              <div className="environment-label">
                Environment
              </div>

              <div className="environment-value">
                Development
              </div>
            </div>

            <span
              className="status-dot"
              aria-label="System online"
            />
          </div>
        </div>
      </div>
    </>
  );
}

function AccountMenu({
  userName,
  userEmail,
  initials,
  onSignOut,
}: {
  userName: string | null;
  userEmail: string | null;
  initials: string;
  onSignOut: () => void;
}) {
  return (
    <div
      className="account-menu"
      role="menu"
    >
      <div className="account-menu-header">
        <div
          className="account-menu-avatar"
          aria-hidden="true"
        >
          {initials}
        </div>

        <div className="account-menu-user">
          <div className="account-menu-name">
            {userName || "Authenticated user"}
          </div>

          <div className="account-menu-label">
            Signed in account
          </div>

          <div className="account-menu-email">
            {userEmail || "No email available"}
          </div>
        </div>
      </div>

      <div className="account-menu-divider" />

      <Link
        href="/account"
        className="account-menu-item"
        role="menuitem"
      >
        <span aria-hidden="true">◎</span>
        <span>Account</span>
      </Link>

      <Link
        href="/settings"
        className="account-menu-item"
        role="menuitem"
      >
        <span aria-hidden="true">⚙</span>
        <span>Settings</span>
      </Link>

      <div className="account-menu-divider" />

      <button
        type="button"
        className="account-menu-item account-menu-signout"
        role="menuitem"
        onClick={onSignOut}
      >
        <span aria-hidden="true">↪</span>

        <span>Sign out</span>
      </button>
    </div>
  );
}

export default function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [accountMenuOpen, setAccountMenuOpen] =
    useState(false);

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(
      "industrial-monitor-theme",
    );
    setDarkMode(savedTheme === "dark");
  }, []);

  const [userName, setUserName] =
    useState<string | null>(null);

  const [userEmail, setUserEmail] =
    useState<string | null>(null);

  const [signingOut, setSigningOut] =
    useState(false);

  const userInitials = getInitials(
    userName,
    userEmail,
  );

  useEffect(() => {
    document.documentElement.classList.toggle(
      "theme-dark",
      darkMode,
    );

    window.localStorage.setItem(
      "industrial-monitor-theme",
      darkMode ? "dark" : "light",
    );
  }, [darkMode]);

  useEffect(() => {
    document.body.classList.toggle(
      "mobile-menu-open",
      mobileMenuOpen,
    );

    return () => {
      document.body.classList.remove(
        "mobile-menu-open",
      );
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserName(
        user?.user_metadata?.full_name ?? null,
      );

      setUserEmail(user?.email ?? null);
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user;

        setUserName(
          user?.user_metadata?.full_name ?? null,
        );

        setUserEmail(user?.email ?? null);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setAccountMenuOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(
          event.target as Node,
        )
      ) {
        setAccountMenuOpen(false);
      }
    };

    if (accountMenuOpen) {
      document.addEventListener(
        "mousedown",
        handleOutsideClick,
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, [accountMenuOpen]);

  const toggleTheme = () => {
    setDarkMode((current) => !current);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const openMobileMenu = () => {
    setAccountMenuOpen(false);
    setMobileMenuOpen(true);
  };

  const handleSignOut = async () => {
    if (signingOut) {
      return;
    }

    setSigningOut(true);

    const supabase = createClient();

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "Sign out failed:",
        error,
      );

      setSigningOut(false);
      return;
    }

    setAccountMenuOpen(false);
    setMobileMenuOpen(false);

    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="app-shell">
      <aside className="sidebar desktop-sidebar">
        <SidebarContent />
      </aside>

      <div
        className={`mobile-sidebar-backdrop ${
          mobileMenuOpen
            ? "mobile-sidebar-backdrop-visible"
            : ""
        }`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      <aside
        className={`sidebar mobile-sidebar ${
          mobileMenuOpen
            ? "mobile-sidebar-open"
            : ""
        }`}
        aria-label="Mobile navigation"
        aria-hidden={!mobileMenuOpen}
      >
        <SidebarContent
          onNavigate={closeMobileMenu}
        />
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-button"
              onClick={openMobileMenu}
              aria-label="Open navigation"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              <span />
              <span />
              <span />
            </button>

            <div
              className="mobile-brand-mark"
              aria-hidden="true"
            >
              IT
            </div>

            <div className="page-context">
              <div className="page-context-label">
                Organization
              </div>

              <div className="page-context-title">
                Demo Operations
              </div>
            </div>

            <div className="site-selector">
              <div className="site-selector-label">
                Active site
              </div>

              <div className="site-selector-value">
                Main Storage Facility
              </div>
            </div>
          </div>

          <div className="topbar-right">
            <div className="system-state">
              <span className="status-dot" />

              <span className="system-state-text">
                All systems operational
              </span>
            </div>

            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={
                darkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              title={
                darkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              <span
                className="theme-toggle-icon"
                aria-hidden="true"
              >
                {darkMode ? "☀" : "☾"}
              </span>

              <span className="theme-toggle-label">
                {darkMode ? "Light" : "Dark"}
              </span>
            </button>

            <div
              className="account-menu-wrapper"
              ref={accountMenuRef}
            >
              <button
                type="button"
                className={`account-button ${
                  accountMenuOpen
                    ? "account-button-active"
                    : ""
                }`}
                onClick={() =>
                  setAccountMenuOpen(
                    (current) => !current,
                  )
                }
                aria-label="Open account menu"
                aria-expanded={accountMenuOpen}
                title="Account menu"
              >
                <span
                  className="account-button-avatar"
                  aria-hidden="true"
                >
                  {userInitials}
                </span>

                <span className="account-button-text">
                  {userName || "Account"}
                </span>

                <span
                  className={`account-button-chevron ${
                    accountMenuOpen
                      ? "account-button-chevron-open"
                      : ""
                  }`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>

              {accountMenuOpen && (
                <AccountMenu
                  userName={userName}
                  userEmail={userEmail}
                  initials={userInitials}
                  onSignOut={handleSignOut}
                />
              )}
            </div>
          </div>
        </header>

        <main className="content content-glass-pages">
          <div className="content-container">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
