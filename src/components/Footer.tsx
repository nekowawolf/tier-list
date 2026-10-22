export default async function Footer() {
  "use cache";

  return (
    <footer className="mt-14 border-t border-line/70">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-4 py-7 text-xs text-muted sm:px-6 lg:flex-row lg:px-8">
        <p className="text-center lg:text-left"><span className="mr-3 text-base font-extrabold tracking-tight text-foreground">Tier List</span> Custom rankings with images and tiers.</p>
        <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
          <span>&copy; {new Date().getFullYear()} Tier List</span>
          <span>·</span>
          <span>Powered by</span>
          <a href="https://www.nekowawolf.xyz/ecosystem" target="_blank" rel="noopener noreferrer" className="group relative font-medium text-blue-500 transition-colors hover:text-blue-400">
            Nww Ecosystem
            <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-blue-500 transition-[width] duration-300 group-hover:w-full" />
          </a>
        </div>
      </div>
    </footer>
  );
}