"use client";

import { create } from "zustand";
import type { Goal } from "@/lib/types";

interface GoalState {
  goals: Goal[];
  totalWeightage: number;
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  removeGoal: (id: string) => void;
  calculateTotal: () => number;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  totalWeightage: 0,
  setGoals: (goals) => set({ goals, totalWeightage: goals.reduce((sum, goal) => sum + goal.weightage, 0) }),
  addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal], totalWeightage: state.totalWeightage + goal.weightage })),
  removeGoal: (id) => set((state) => {
    const goals = state.goals.filter((goal) => goal.id !== id);
    return { goals, totalWeightage: goals.reduce((sum, goal) => sum + goal.weightage, 0) };
  }),
  calculateTotal: () => get().goals.reduce((sum, goal) => sum + goal.weightage, 0)
}));
