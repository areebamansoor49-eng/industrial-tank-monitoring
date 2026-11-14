"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function createSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 63);
}

const fieldClass = "theme-field mt-2 h-[49px] w-full px-4 text-base outline-none disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "theme-label block text-[13px] font-semibold";

export default function OrganizationSetupForm() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [timezone, setTimezone] = useState("Asia/Karachi");
  const [country, setCountry] = useState("Pakistan");
  const [industry, setIndustry] = useState("Industrial Operations");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManuallyEdited) setSlug(createSlug(value));
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    setSlug(createSlug(value));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    const trimmedName = name.trim();
    const trimmedSlug = createSlug(slug);

    if (trimmedName.length < 2) {
      setErrorMessage("Organization name must contain at least 2 characters.");
      return;
    }
    if (!trimmedSlug) {
      setErrorMessage("Please enter a valid organization slug.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.rpc("create_organization_for_current_user", {
      organization_name: trimmedName,
      organization_slug: trimmedSlug,
      organization_timezone: timezone,
      organization_country: country.trim() || undefined,
      organization_industry: industry.trim() || undefined,
    });

    if (error) {
      setSubmitting(false);
      if (error.message.toLowerCase().includes("organization slug already exists")) {
        setErrorMessage("That organization slug is already in use. Please choose another.");
        return;
      }
      setErrorMessage(error.message || "Unable to create the organization. Please try again.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="organization-name" className={labelClass}>Organization name <span className="theme-required">*</span></label>
        <input id="organization-name" name="organization-name" type="text" value={name} onChange={(event) => handleNameChange(event.target.value)} placeholder="e.g. Acme Industrial Solutions" autoComplete="organization" maxLength={120} disabled={submitting} required minLength={2} className={fieldClass}/>
        <p className="theme-muted mt-1.5 text-[11px]">Use your registered company or facility name.</p>
      </div>

      <div>
        <label htmlFor="organization-slug" className={labelClass}>Workspace URL identifier <span className="theme-required">*</span></label>
        <div className="theme-field mt-2 flex h-[49px] items-center overflow-hidden">
          <span className="theme-muted border-r px-3 text-base">/</span>
          <input id="organization-slug" name="organization-slug" type="text" value={slug} onChange={(event) => handleSlugChange(event.target.value)} placeholder="acme-industrial" autoComplete="off" maxLength={63} disabled={submitting} required className="h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none"/>
          <span className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand)_18%,transparent)] text-[var(--brand)]"><svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 10 4 4 8-8"/></svg></span>
        </div>
        <p className="theme-muted mt-1.5 text-[11px]">Lowercase letters, numbers and hyphens. Generated automatically from the name.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="organization-timezone" className={labelClass}>Timezone <span className="theme-required">*</span></label>
          <select id="organization-timezone" name="organization-timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} disabled={submitting} className={fieldClass}>
            <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
            <option value="UTC">UTC</option>
            <option value="Asia/Dubai">Asia/Dubai</option>
            <option value="Asia/Riyadh">Asia/Riyadh</option>
            <option value="Europe/London">Europe/London</option>
            <option value="America/New_York">America/New_York</option>
            <option value="America/Chicago">America/Chicago</option>
            <option value="America/Los_Angeles">America/Los_Angeles</option>
          </select>
        </div>
        <div>
          <label htmlFor="organization-country" className={labelClass}>Country</label>
          <input id="organization-country" name="organization-country" type="text" value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Pakistan" autoComplete="country-name" maxLength={100} disabled={submitting} className={fieldClass}/>
        </div>
      </div>

      <div>
        <label htmlFor="organization-industry" className={labelClass}>Industry</label>
        <input id="organization-industry" name="organization-industry" type="text" value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder="e.g. Oil & Gas, Manufacturing" maxLength={120} disabled={submitting} className={fieldClass}/>
      </div>

      {errorMessage ? <div role="alert" className="auth-alert auth-alert-error flex gap-2.5 px-4 py-3 text-base leading-6"><svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10" cy="10" r="7.5"/><path d="M10 6v4m0 3h.01"/></svg><span>{errorMessage}</span></div> : null}

      <button type="submit" disabled={submitting} className="theme-primary-button group flex h-[51px] w-full items-center justify-center gap-2.5 px-5 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="3"/><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>Creating workspace...</> : <>Create organization <svg viewBox="0 0 20 20" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 10h12m-5-5 5 5-5 5"/></svg></>}
      </button>
      <p className="theme-muted text-center text-[11px] leading-5">You can configure your sites, tanks and devices after setup.</p>
    </form>
  );
}
