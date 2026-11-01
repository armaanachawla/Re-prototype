"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { SAMPLE_DATASET } from "@/data/sample-patient";
import type { ExerciseId, RangeKey, RecoveryDataset, SessionStatus } from "./types";

export type ViewKey = "overview" | "movement" | "goals" | "log" | "wearable" | "physio";
export const VIEWS: { key: ViewKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "movement", label: "Movement" },
  { key: "goals", label: "My Recovery Goals" },
  { key: "log", label: "Activity Log" },
  { key: "wearable", label: "My Wearable" },
  { key: "physio", label: "Physiotherapist View" },
];

export type ColourKey = "sand" | "medium-brown" | "deep-brown" | "charcoal" | "taupe" | "sage";
export type StyleKey = "everyday" | "active" | "comfort";

export interface LogFilters {
  from: string;
  to: string;
  exercise: ExerciseId | "all";
  status: SessionStatus | "all";
}

export interface AppState {
  view: ViewKey;
  range: RangeKey;
  colour: ColourKey;
  style: StyleKey;
  physioDetail: "friendly" | "technical";
  logFilters: LogFilters;
  selectedLogKey: string | null;
}

const DATA: RecoveryDataset = SAMPLE_DATASET;

export const DEFAULT_LOG_FILTERS: LogFilters = { from: DATA.patient.programmeStart, to: DATA.dataEnd, exercise: "all", status: "all" };

const INITIAL: AppState = {
  view: "overview",
  range: "month",
  colour: "medium-brown",
  style: "everyday",
  physioDetail: "friendly",
  logFilters: DEFAULT_LOG_FILTERS,
  selectedLogKey: null,
};

type Action =
  | { type: "view"; view: ViewKey }
  | { type: "range"; range: RangeKey }
  | { type: "colour"; colour: ColourKey }
  | { type: "style"; style: StyleKey }
  | { type: "physioDetail"; value: AppState["physioDetail"] }
  | { type: "logFilters"; filters: Partial<LogFilters> }
  | { type: "resetLogFilters" }
  | { type: "selectLog"; key: string | null }
  | { type: "reset" };

function reducer(state: AppState, a: Action): AppState {
  switch (a.type) {
    case "view":
      return { ...state, view: a.view };
    case "range":
      return { ...state, range: a.range };
    case "colour":
      return { ...state, colour: a.colour };
    case "style":
      return { ...state, style: a.style };
    case "physioDetail":
      return { ...state, physioDetail: a.value };
    case "logFilters":
      return { ...state, logFilters: { ...state.logFilters, ...a.filters }, selectedLogKey: null };
    case "resetLogFilters":
      return { ...state, logFilters: DEFAULT_LOG_FILTERS, selectedLogKey: null };
    case "selectLog":
      return { ...state, selectedLogKey: a.key };
    case "reset":
      return { ...INITIAL, view: state.view };
  }
}

interface Ctx {
  data: RecoveryDataset;
  state: AppState;
  dispatch: React.Dispatch<Action>;
  go: (view: ViewKey, anchor?: string) => void;
}

const AppContext = createContext<Ctx | null>(null);
const isView = (v: string): v is ViewKey => VIEWS.some((x) => x.key === v);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  // Keep the current view in the URL hash so links and the back button work.
  useEffect(() => {
    const sync = () => {
      const v = window.location.hash.replace("#", "").split("/")[0];
      if (isView(v)) dispatch({ type: "view", view: v });
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const go = useCallback((view: ViewKey, anchor?: string) => {
    dispatch({ type: "view", view });
    if (window.location.hash !== `#${view}`) window.location.hash = view;
    requestAnimationFrame(() => {
      const el = anchor ? document.getElementById(anchor) : null;
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, []);

  const value = useMemo(() => ({ data: DATA, state, dispatch, go }), [state, go]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
