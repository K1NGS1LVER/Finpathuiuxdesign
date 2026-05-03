const fs = require('fs');

let content = fs.readFileSync('src/app/screens/Onboarding.tsx', 'utf8');

// Add expectedAnnualIncrement and stepUpEnabled states
const stateTarget = `  const [incomeCurrency, setIncomeCurrency] = useState("INR");
  const [expensesCurrency, setExpensesCurrency] = useState("INR");`;
const stateReplacement = `  const [incomeCurrency, setIncomeCurrency] = useState("INR");
  const [expensesCurrency, setExpensesCurrency] = useState("INR");
  const [expectedAnnualIncrement, setExpectedAnnualIncrement] = useState("");
  const [stepUpEnabled, setStepUpEnabled] = useState(false);`;
content = content.replace(stateTarget, stateReplacement);

// Pass expectedAnnualIncrement and stepUpEnabled to completeOnboarding
const submitTarget = `        debts: debtINR,
        totalDebtPrincipal: parseFloat(convertToINR(totalDebtPrincipal, debtCurrency) || totalDebtPrincipal) || 0,
        goals: formattedGoals,
        expenseBreakdown: expBreakdown,
        debtBreakdown: dbtBreakdown,
        strategy: selectedStrategy,
        surplus: parseFloat(surplusAmount) || 0,`;
const submitReplacement = `        debts: debtINR,
        totalDebtPrincipal: parseFloat(convertToINR(totalDebtPrincipal, debtCurrency) || totalDebtPrincipal) || 0,
        goals: formattedGoals,
        expenseBreakdown: expBreakdown,
        debtBreakdown: dbtBreakdown,
        strategy: selectedStrategy,
        surplus: parseFloat(surplusAmount) || 0,
        expectedAnnualIncrement: parseFloat(expectedAnnualIncrement) || 0,
        stepUpEnabled: stepUpEnabled,`;
content = content.replace(submitTarget, submitReplacement);

// Add expectedAnnualIncrement UI to income section
const incomeUiTarget = `              {income && incomeCurrency !== "INR" && (
                <p
                  className="text-center text-sm slashed-zero"
                  style={{ color: "var(--secondary)" }}
                >
                  ≈ ₹{convertToINR(income, incomeCurrency)} INR
                </p>
              )}`;
const incomeUiReplacement = `              {income && incomeCurrency !== "INR" && (
                <p
                  className="text-center text-sm slashed-zero"
                  style={{ color: "var(--secondary)" }}
                >
                  ≈ ₹{convertToINR(income, incomeCurrency)} INR
                </p>
              )}
              <div className="mt-6 pt-4 border-t border-[var(--border)]">
                <label
                  className="text-xs md:text-sm font-medium mb-2 block"
                  style={{
                    color: "var(--secondary)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Expected Annual Salary Increment (%)
                </label>
                <div
                  className="flex gap-2 items-center px-4 py-3 rounded-2xl transition-all"
                  style={{
                    background: "var(--surface-tint)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <input
                    type="text"
                    value={expectedAnnualIncrement}
                    onChange={(e) =>
                      setExpectedAnnualIncrement(e.target.value.replace(/[^0-9.]/g, ""))
                    }
                    placeholder="e.g. 5 for 5%"
                    className="flex-1 w-full bg-transparent text-lg md:text-xl font-bold outline-none slashed-zero text-[var(--card-foreground)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  />
                  <span className="font-bold text-lg md:text-xl text-[var(--secondary)]">%</span>
                </div>
              </div>`;
content = content.replace(incomeUiTarget, incomeUiReplacement);

// Add stepUpEnabled UI to strategy section
const strategyUiTarget = `              <div
                className="p-3 rounded-xl md:rounded-2xl text-xs md:text-sm"
                style={{
                  background: "var(--surface-tint)",
                  border: "1px solid var(--border)",
                  color: "var(--secondary)",
                }}
              >
                You can switch strategy later from Month and Scenarios pages.
              </div>`;
const strategyUiReplacement = `              <div
                className="p-3 rounded-xl md:rounded-2xl text-xs md:text-sm"
                style={{
                  background: "var(--surface-tint)",
                  border: "1px solid var(--border)",
                  color: "var(--secondary)",
                }}
              >
                You can switch strategy later from Month and Scenarios pages.
              </div>
              
              <div className="mt-4 p-4 rounded-xl md:rounded-2xl border flex items-center justify-between cursor-pointer"
                onClick={() => setStepUpEnabled(!stepUpEnabled)}
                style={{
                  background: stepUpEnabled ? "var(--accent-glow)" : "var(--surface-tint)",
                  borderColor: stepUpEnabled ? "var(--accent)" : "var(--border)",
                }}
              >
                <div>
                  <h4 className="font-bold text-sm md:text-base text-[var(--card-foreground)]">Step-Up Plan (Recommended)</h4>
                  <p className="text-xs md:text-sm text-[var(--secondary)] mt-1">Increment monthly goal payments as your salary grows</p>
                </div>
                <div className={\`w-10 h-6 rounded-full transition-colors relative flex items-center \${stepUpEnabled ? "bg-[var(--accent)]" : "bg-[var(--surface-hover)]"}\`}>
                  <div className={\`w-4 h-4 rounded-full bg-white absolute transition-transform \${stepUpEnabled ? "translate-x-5" : "translate-x-1"}\`} />
                </div>
              </div>`;
content = content.replace(strategyUiTarget, strategyUiReplacement);

fs.writeFileSync('src/app/screens/Onboarding.tsx', content);
console.log('Patched Onboarding.tsx');
