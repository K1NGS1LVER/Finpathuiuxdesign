// ============================================================
// FinPath — Zustand Store (persisted to localStorage)
// Single source of truth for the entire app, composed from
// slices: profile / goals / plan / meta.
//
// Persistence contract: name `finpath-store`, version 9, same
// partialize + migrate as before the slice split — persisted
// user data is untouched by the refactor.
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FinancialProfile } from '../types';
import { defaultProfile, safeStorage } from './defaults';
import { createProfileSlice, type ProfileSlice } from './profile-slice';
import { createGoalsSlice, type GoalsSlice } from './goals-slice';
import { createPlanSlice, type PlanSlice } from './plan-slice';
import { createMetaSlice, type MetaSlice } from './meta-slice';

export type FinPathStore = FinancialProfile & ProfileSlice & GoalsSlice & PlanSlice & MetaSlice;

export const useFinPathStore = create<FinPathStore>()(
  persist(
    (...args) => ({
      ...defaultProfile,
      ...createProfileSlice(...args),
      ...createGoalsSlice(...args),
      ...createPlanSlice(...args),
      ...createMetaSlice(...args),
    }),
    {
      name: 'finpath-store',
      version: 9,
      storage: safeStorage,
      partialize: (state) => {
        const { pdfExporting: _exporting, ...rest } = state;
        return rest;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: (persistedState: any, version: number) => {
        if (version < 2 && persistedState?.income) {
          const inc = persistedState.income;
          inc.primary = inc.salary ?? 0;
          inc.secondary = inc.freelance ?? 0;
          inc.variablePercent = 0;
          inc.variable = 0;
          delete inc.salary;
          delete inc.freelance;
        }
        if (version < 3 && persistedState?.income) {
          const inc = persistedState.income;
          inc.primaryIncrement = inc.primaryIncrement ?? inc.expectedAnnualIncrement ?? 0;
          inc.secondaryIncrement = inc.secondaryIncrement ?? 0;
          inc.passiveIncrement = inc.passiveIncrement ?? 0;
          // Fix variable base: recompute from passive
          inc.variable = Math.round(((inc.passive || 0) * (inc.variablePercent || 0)) / 100);
          inc.total = (inc.primary || 0) + (inc.secondary || 0) + (inc.passive || 0) + inc.variable;
        }
        if (version < 4 && persistedState) {
          // Seed default 12% to preserve pre-existing plan output for
          // already-onboarded users who never saw the Scenarios picker.
          persistedState.investmentReturnRate = persistedState.investmentReturnRate ?? 12;
        }
        if (version < 5 && persistedState) {
          // Existing users default to 'local' — cloud sync is opt-in.
          persistedState.storageMode = persistedState.storageMode ?? 'local';
        }
        if (version < 6 && persistedState) {
          persistedState.milestones = persistedState.milestones ?? [];
        }
        if (version < 7 && persistedState?.income) {
          const inc = persistedState.income;
          inc.netRate = inc.netRate ?? 1.0;
          inc.netMonthly =
            inc.netMonthly ??
            Math.round(
              (inc.primary || 0) * inc.netRate +
                (inc.secondary || 0) +
                (inc.passive || 0) +
                (inc.variable || 0),
            );
        }
        if (version < 8 && persistedState) {
          persistedState.dreams = persistedState.dreams ?? [];
        }
        if (version < 9 && persistedState) {
          persistedState.ageYears = persistedState.ageYears ?? undefined;
        }
        return persistedState;
      },
    },
  ),
);
