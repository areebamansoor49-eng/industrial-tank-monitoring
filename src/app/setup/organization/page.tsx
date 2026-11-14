import { redirect } from "next/navigation";
import { getCurrentOrganizationContext } from "@/lib/repositories/organization-context";
import ThemeToggle from "@/components/layout/ThemeToggle";
import OrganizationSetupForm from "./OrganizationSetupForm";

function TankIllustration() {
  return (
    <svg viewBox="0 0 440 310" fill="none" className="w-full max-w-[440px]" role="img" aria-label="Connected industrial storage tanks illustration">
      <defs>
        <linearGradient id="tankFill" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#D8F0DF" />
          <stop offset="1" stopColor="#A6D8B7" />
        </linearGradient>
      </defs>
      <circle cx="220" cy="150" r="122" fill="#DDF1E2" opacity=".65"/>
      <circle cx="220" cy="150" r="92" stroke="#B5D9BF" strokeDasharray="4 7"/>
      <path d="M44 255H396" stroke="#B7CFC0" strokeWidth="1.5"/>
      <path d="M75 255V148C75 137 94 128 118 128C142 128 161 137 161 148V255" fill="url(#tankFill)" stroke="#54896A" strokeWidth="1.8"/>
      <ellipse cx="118" cy="148" rx="43" ry="17" fill="#E9F7EC" stroke="#54896A" strokeWidth="1.8"/>
      <path d="M75 179C75 190 94 199 118 199C142 199 161 190 161 179M75 211C75 222 94 231 118 231C142 231 161 222 161 211" stroke="#79AD89" strokeWidth="1.5"/>
      <path d="M193 255V105C193 90 216 78 244 78C272 78 295 90 295 105V255" fill="url(#tankFill)" stroke="#477D5D" strokeWidth="2"/>
      <ellipse cx="244" cy="105" rx="51" ry="20" fill="#F1FAF2" stroke="#477D5D" strokeWidth="2"/>
      <path d="M193 146C193 157 216 169 244 169C272 169 295 157 295 146M193 190C193 201 216 213 244 213C272 213 295 201 295 190" stroke="#79AD89" strokeWidth="1.5"/>
      <path d="M228 78V54H260V78M239 54V42H249V54" stroke="#477D5D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M326 255V172C326 163 339 156 355 156C371 156 384 163 384 172V255" fill="#C8E8D0" stroke="#54896A" strokeWidth="1.8"/>
      <ellipse cx="355" cy="172" rx="29" ry="12" fill="#F1FAF2" stroke="#54896A" strokeWidth="1.8"/>
      <path d="M326 207C326 216 339 223 355 223C371 223 384 216 384 207" stroke="#79AD89" strokeWidth="1.5"/>
      <path d="M161 164H181V135H193M295 165H312V191H326" stroke="#477D5D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="181" cy="164" r="5" fill="#F5FBF6" stroke="#477D5D" strokeWidth="2"/>
      <circle cx="312" cy="165" r="5" fill="#F5FBF6" stroke="#477D5D" strokeWidth="2"/>
      <rect x="44" y="45" width="94" height="37" rx="9" fill="#FFFFFF" stroke="#D4E8D9"/>
      <circle cx="59" cy="63" r="4" fill="#3E9660"/>
      <path d="M70 59H126M70 67H110" stroke="#9ABAA3" strokeWidth="2" strokeLinecap="round"/>
      <rect x="302" y="48" width="91" height="37" rx="9" fill="#FFFFFF" stroke="#D4E8D9"/>
      <circle cx="317" cy="66" r="4" fill="#3E9660"/>
      <path d="M328 62H381M328 70H363" stroke="#9ABAA3" strokeWidth="2" strokeLinecap="round"/>
      <path d="M90 82V108M348 85V119" stroke="#83B894" strokeWidth="1.5" strokeDasharray="3 4"/>
      <circle cx="90" cy="112" r="4" fill="#4C9C68"/>
      <circle cx="348" cy="123" r="4" fill="#4C9C68"/>
      <rect x="168" y="267" width="153" height="29" rx="14.5" fill="#E0F1E4"/>
      <circle cx="185" cy="281.5" r="4" fill="#43885A"/>
      <text x="197" y="286" fontSize="10" fontWeight="600" fill="#376A49" letterSpacing=".5">CONNECTED OPERATIONS</text>
    </svg>
  );
}

export default async function OrganizationSetupPage() {
  const { organization } = await getCurrentOrganizationContext();
  if (organization) redirect("/dashboard");

  return (
    <main className="setup-page min-h-screen overflow-hidden">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 sm:px-8 lg:px-14">
        <header className="flex h-[82px] shrink-0 items-center justify-between border-b">
          <a href="/setup/organization" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#244E36] text-[#D8F0DF]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 20V8l8-4 8 4v12M8 20v-6h8v6M8 10h8M12 10v3"/></svg>
            </span>
            <span><span className="block text-base font-bold tracking-[.12em]">INDUSTRIAL</span><span className="block text-[10px] font-medium tracking-[.22em] text-[#64816D]">OPERATIONS PLATFORM</span></span>
          </a>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-sm font-medium sm:flex">
              <span className="status-dot" />
              Secure workspace setup
            </div>
            <ThemeToggle compact />
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[.92fr_1.08fr] lg:gap-16 lg:py-14">
          <section className="mx-auto w-full max-w-xl lg:mx-0">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D4E7D8] bg-white/80 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[.15em] text-[#477756]"><span className="h-1.5 w-1.5 rounded-full bg-[#5AA873]"/> Workspace onboarding <span className="text-[#9CB8A3]">/</span> 01</div>
            <h1 className="max-w-lg text-5xl font-semibold leading-[1.13] tracking-[-.045em] text-[#20392A] sm:text-5xl xl:text-[56px]">Your operations.<br/><span className="text-[#5B936B]">One connected</span><br/>workspace.</h1>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-[#687C6D]">Create your organization to establish a secure home for your sites, storage tanks, gateways, sensors and inventory operations.</p>
            <div className="my-7 max-w-[430px]"><TankIllustration/></div>
            <div className="grid max-w-md grid-cols-3 gap-3 border-t border-[#DCE8DE] pt-5">
              <div><div className="mb-1 flex items-center gap-1.5 text-[#477756]"><span className="text-base">01</span><span className="h-px flex-1 bg-[#C8DECD]"/></div><p className="text-base font-semibold text-[#354D3C]">Organization</p><p className="mt-1 text-[11px] text-[#829387]">Set up workspace</p></div>
              <div><div className="mb-1 flex items-center gap-1.5 text-[#8BA593]"><span className="text-base">02</span><span className="h-px flex-1 bg-[#D8E6DA]"/></div><p className="text-base font-semibold text-[#64786A]">Infrastructure</p><p className="mt-1 text-[11px] text-[#829387]">Add sites and tanks</p></div>
              <div><div className="mb-1 flex items-center gap-1.5 text-[#8BA593]"><span className="text-base">03</span></div><p className="text-base font-semibold text-[#64786A]">Monitoring</p><p className="mt-1 text-[11px] text-[#829387]">Connect devices</p></div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[560px] lg:ml-auto">
            <div className="glass-panel rounded-[24px] p-6 sm:p-9 lg:p-10">
              <div className="mb-7">
                <div className="mb-3 flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-[.17em] text-[#64836D]">Get started</span><span className="rounded-full bg-[#EEF7EF] px-3 py-1.5 text-[11px] font-semibold text-[#477756]">Step 1 of 1</span></div>
                <h2 className="text-5xl font-semibold tracking-[-.03em] text-[#20392A] sm:text-[29px]">Set up your organization</h2>
                <p className="mt-2 text-base leading-6 text-[#78877B]">Tell us a little about your operations to create your workspace.</p>
              </div>
              <OrganizationSetupForm/>
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#E3EEE5] bg-[#F5FAF5] p-4">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-[#538362]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3 5 6v5c0 4.6 2.9 7.8 7 10 4.1-2.2 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>
                <div><p className="text-base font-semibold text-[#3C6247]">Your data, your organization</p><p className="mt-1 text-base leading-5 text-[#718576]">Your workspace establishes the tenant boundary for your operational data and team access.</p></div>
              </div>
            </div>
            <p className="mt-5 text-center text-[11px] tracking-wide text-[#91A094]">INDUSTRIAL OPERATIONS PLATFORM <span className="mx-1.5">·</span> BUILT FOR RELIABLE OPERATIONS</p>
          </section>
        </div>
      </div>
    </main>
  );
}
