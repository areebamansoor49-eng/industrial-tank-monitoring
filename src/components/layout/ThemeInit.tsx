export default function ThemeInit() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(()=>{try{const t=localStorage.getItem("industrial-monitor-theme");document.documentElement.classList.toggle("theme-dark",t==="dark");}catch(e){}})();`,
      }}
    />
  );
}
