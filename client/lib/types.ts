export type Role = "EMPLOYEE" | "MANAGER" | "ADMIN";
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
export type GoalStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "LOCKED";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  managerId?: string;
}

export interface Cycle {
  id: string;
  name: string;
  year: number;
  active: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  thrustArea: string;
  uom: string;
  target: number;
  weightage: number;
  status: GoalStatus;
  isShared: boolean;
  rejectionComment?: string | null;
  primaryOwnerId?: string;
  sharedWith?: string[];
  checkIns?: CheckIn[];
}

export interface CheckIn {
  id: string;
  goalId: string;
  quarter: Quarter;
  plannedTarget: number;
  actualAchievement?: number;
  progressStatus: "NOT_STARTED" | "ON_TRACK" | "COMPLETED";
  managerComment?: string;
}
