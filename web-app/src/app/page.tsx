"use client";

import { AppProvider, useApp } from "@/lib/app-state";
import { Header } from "@/components/layout/Header";
import { ConceptBanner, Footer } from "@/components/layout/Notice";
import { Overview } from "@/components/views/Overview";
import { Movement } from "@/components/views/Movement";
import { Goals } from "@/components/views/Goals";
import { ActivityLog } from "@/components/views/ActivityLog";
import { Wearable } from "@/components/views/Wearable";
import { Physio } from "@/components/views/Physio";
import { PrintReport } from "@/components/views/PrintReport";

function Current() {
  const { state } = useApp();
  switch (state.view) {
    case "movement":
      return <Movement />;
    case "goals":
      return <Goals />;
    case "log":
      return <ActivityLog />;
    case "wearable":
      return <Wearable />;
    case "physio":
      return <Physio />;
    default:
      return <Overview />;
  }
}

export default function Home() {
  return (
    <AppProvider>
      <a href="#main" className="no-print sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
        Skip to content
      </a>
      <ConceptBanner />
      <Header />
      <main id="main" className="no-print mx-auto max-w-[1280px] px-4 pb-8 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <ViewFrame />
      </main>
      <Footer />
      <PrintReport />
    </AppProvider>
  );
}

function ViewFrame() {
  const { state } = useApp();
  return (
    <div key={state.view} className="re-fade">
      <Current />
    </div>
  );
}
