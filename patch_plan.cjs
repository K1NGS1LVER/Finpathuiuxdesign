const fs = require('fs');

let content = fs.readFileSync('src/lib/plan-engine.ts', 'utf8');

// 1. Add stepUpEnabled to PlanInput
const inputTarget = `  strategy?: InvestmentStrategy;
  monthlySurplusReserve?: number;
  pendingReallocationReserve?: number;
}`;
const inputReplacement = `  strategy?: InvestmentStrategy;
  monthlySurplusReserve?: number;
  pendingReallocationReserve?: number;
  stepUpEnabled?: boolean;
}`;
content = content.replace(inputTarget, inputReplacement);

// 2. Add stepUpEnabled to destructured input
const destructureTarget = `    strategy = "avalanche",
    monthlySurplusReserve = 0,
    pendingReallocationReserve = 0,
  } = input;`;
const destructureReplacement = `    strategy = "avalanche",
    monthlySurplusReserve = 0,
    pendingReallocationReserve = 0,
    stepUpEnabled = false,
  } = input;`;
content = content.replace(destructureTarget, destructureReplacement);

// 3. Add base income and base allocatable surplus
const trackingTarget = `  // Track running state
  let cumulativeSavings = savings;
  let cumulativeInvestments = investments;`;
const trackingReplacement = `  // Track running state
  let cumulativeSavings = savings;
  let cumulativeInvestments = investments;
  let currentIncomeTotal = income.total;
  const baseAllocatableSurplus = availableForGoals;`;
content = content.replace(trackingTarget, trackingReplacement);

// 4. Implement dynamic income and step up logic inside the loop
const loopTarget = `  for (let m = 0; m < maxMonths; m++) {
    const milestones: string[] = [];
    if (m === 0 && isDebtOverIncome) {
      milestones.push(\`Warning: Your debt payments (₹\${debts.totalMonthly.toLocaleString("en-IN")}/mo) exceed your available income. Consider restructuring.\`);
    }

    // Available surplus this month
    const surplus = Math.max(0, monthlySurplus);
    const monthlyReservedSurplus = Math.min(surplus, reservedSurplus);
    const afterReserved = Math.max(0, surplus - monthlyReservedSurplus);
    const monthlyPendingSurplus = Math.min(afterReserved, pendingSurplus);
    const allocatableSurplus = Math.max(
      0,
      afterReserved - monthlyPendingSurplus,
    );`;

const loopReplacement = `  for (let m = 0; m < maxMonths; m++) {
    const milestones: string[] = [];
    if (m === 0 && isDebtOverIncome) {
      milestones.push(\`Warning: Your debt payments (₹\${debts.totalMonthly.toLocaleString("en-IN")}/mo) exceed your available income. Consider restructuring.\`);
    }

    // Apply annual salary increment every 12 months
    if (m > 0 && m % 12 === 0 && income.expectedAnnualIncrement) {
      currentIncomeTotal *= (1 + income.expectedAnnualIncrement / 100);
      milestones.push(\`Annual salary increment applied (\${income.expectedAnnualIncrement}%)\`);
    }

    // Available surplus this month
    const currentMonthlySurplus = currentIncomeTotal - expenses.total - debts.totalMonthly;
    const surplus = Math.max(0, currentMonthlySurplus);
    const monthlyReservedSurplus = Math.min(surplus, reservedSurplus);
    const afterReserved = Math.max(0, surplus - monthlyReservedSurplus);
    const monthlyPendingSurplus = Math.min(afterReserved, pendingSurplus);
    
    let allocatableSurplus = Math.max(
      0,
      afterReserved - monthlyPendingSurplus,
    );

    // If step-up plan is not enabled, cap the allocatable surplus to the original base amount.
    // The extra income from salary growth will flow directly into general savings.
    if (!stepUpEnabled) {
      allocatableSurplus = Math.min(allocatableSurplus, baseAllocatableSurplus);
    }`;

content = content.replace(loopTarget, loopReplacement);

// 5. Update pushed months to use currentIncomeTotal
const pushTarget = `    months.push({
      month: m,
      date: monthToDateStr(m + 1),
      income: income.total,
      expenses: expenses.total,
      debtPayments: debts.totalMonthly,
      surplus,`;

const pushReplacement = `    months.push({
      month: m,
      date: monthToDateStr(m + 1),
      income: currentIncomeTotal,
      expenses: expenses.total,
      debtPayments: debts.totalMonthly,
      surplus,`;

content = content.replace(pushTarget, pushReplacement);

fs.writeFileSync('src/lib/plan-engine.ts', content);
console.log('Patched plan-engine.ts');
