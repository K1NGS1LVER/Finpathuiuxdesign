const { generatePlan } = require('./src/lib/plan-engine.ts'); // wait, requires ts-node

// Let's just reproduce the allocateSurplus logic here in JS
function allocateSurplus(surplus, goals, strategy) {
  const allocations = {};
  const activeGoals = goals.filter(g => g.status !== "complete" && g.category !== "debt");
  if (activeGoals.length === 0 || surplus <= 0) return allocations;

  const weights = {};
  let totalWeight = 0;

  for (const goal of activeGoals) {
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    if (remaining <= 0) continue;

    const priorityWeight = 1 / (goal.priority || 1);
    const urgencyWeight = goal.timelineMonths > 0 ? 1 / Math.sqrt(goal.timelineMonths) : 0.5;

    let strategyModifier = 1;
    if (strategy === "snowball") {
      strategyModifier = 100000 / (remaining + 1000);
    } else if (strategy === "avalanche") {
      strategyModifier = priorityWeight > 0.5 ? 2 : 1;
    }

    const weight = priorityWeight * urgencyWeight * strategyModifier;
    weights[goal.id] = weight;
    totalWeight += weight;
  }

  if (totalWeight > 0) {
    for (const goal of activeGoals) {
      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
      if (remaining <= 0) continue;
      const share = (weights[goal.id] / totalWeight) * surplus;
      allocations[goal.id] = Math.min(Math.round(share), remaining);
    }
  }

  return allocations;
}

const goals = [
  { id: 'g1', name: 'Emergency', priority: 1, targetAmount: 300000, currentAmount: 0, timelineMonths: 24, status: 'not-started', category: 'savings' },
  { id: 'g2', name: 'Vacation', priority: 2, targetAmount: 50000, currentAmount: 0, timelineMonths: 6, status: 'not-started', category: 'travel' }
];

console.log("Surplus 50000:");
console.log("Avalanche:", allocateSurplus(50000, goals, "avalanche"));
console.log("Snowball:", allocateSurplus(50000, goals, "snowball"));

console.log("\nSurplus 0:");
console.log("Avalanche:", allocateSurplus(0, goals, "avalanche"));
console.log("Snowball:", allocateSurplus(0, goals, "snowball"));

console.log("\nSurplus 5000:");
console.log("Avalanche:", allocateSurplus(5000, goals, "avalanche"));
console.log("Snowball:", allocateSurplus(5000, goals, "snowball"));
