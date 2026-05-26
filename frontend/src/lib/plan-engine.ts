// ============================================================
// FinPath — Month-by-Month Plan Generation Engine
// THE CENTREPIECE: Everything depends on this.
// ============================================================

import type { FinancialPlan } from "./types";
import { generatePlan, type PlanInput } from "@/domain/planEngine/generatePlan";

export { generatePlan };
export type { PlanInput };

/**
 * Re-run plan with modified inputs (for scenario analysis)
 */
export function generateScenarioPlan(
  baseInput: PlanInput,
  modifications: {
    incomeChange?: number; // Percentage
    expenseChange?: number; // Percentage
    timelineChange?: number; // Months to add/subtract
  },
): FinancialPlan {
  const modifiedInput = { ...baseInput };

  if (modifications.incomeChange !== undefined) {
    const factor = 1 + modifications.incomeChange / 100;
    const newPassive = Math.round(baseInput.income.passive * factor);
    const newVariable = Math.round(newPassive * baseInput.income.variablePercent / 100);
    modifiedInput.income = {
      ...baseInput.income,
      primary: Math.round(baseInput.income.primary * factor),
      secondary: Math.round(baseInput.income.secondary * factor),
      passive: newPassive,
      variable: newVariable,
      total: Math.round(baseInput.income.total * factor),
    };
  }

  if (modifications.expenseChange !== undefined) {
    const factor = 1 + modifications.expenseChange / 100;
    modifiedInput.expenses = {
      ...baseInput.expenses,
      rent: Math.round(baseInput.expenses.rent * factor),
      food: Math.round(baseInput.expenses.food * factor),
      transport: Math.round(baseInput.expenses.transport * factor),
      utilities: Math.round(baseInput.expenses.utilities * factor),
      entertainment: Math.round(baseInput.expenses.entertainment * factor),
      other: Math.round(baseInput.expenses.other * factor),
      total: Math.round(baseInput.expenses.total * factor),
    };
  }

  if (modifications.timelineChange !== undefined) {
    modifiedInput.goals = baseInput.goals.map((g) => ({
      ...g,
      timelineMonths: Math.max(
        1,
        g.timelineMonths + modifications.timelineChange!,
      ),
    }));
  }

  return generatePlan(modifiedInput);
}
