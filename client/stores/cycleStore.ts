"use client";

import { create } from "zustand";
import type { Cycle, Quarter } from "@/lib/types";

interface CycleState {
  activeCycle: Cycle | null;
  currentQuarter: Quarter;
  setActiveCycle: (cycle: Cycle) => void;
}

export const useCycleStore = create<CycleState>((set) => ({
  activeCycle: null,
  currentQuarter: "Q1",
  setActiveCycle: (cycle) => set({ activeCycle: cycle })
}));
