import Image from "next/image";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import TierListEditor from "@/components/tier-list/TierListEditor";

export default function Home() {
  return (
    <>
      <a href="#tier-editor" className="sr-only z-50 rounded-lg bg-blue-600 p-3 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4">Skip to editor</a>
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 space-y-12 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <section aria-labelledby="intro-title" className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="relative size-10 shrink-0 sm:size-12">
              <Image src="/img/tier-list.png" alt="Tier List logo" fill sizes="(min-width: 640px) 48px, 40px" priority className="rounded-xl object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight sm:text-2xl">Tier List</span>
            <div className="ml-auto"><ThemeToggle /></div>
          </div>
          <div className="space-y-4">
            <h1 id="intro-title" className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">Everything has a tier.<br className="hidden sm:block" /> <span className="text-blue-600">Make it yours</span></h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">Import images, customize tier labels and colors, and arrange your rankings. Export your tier list as a PNG, with all editing handled in your browser.</p>
          </div>
        </section>
        <TierListEditor />
      </main>
      <Footer />
    </>
  );
}
