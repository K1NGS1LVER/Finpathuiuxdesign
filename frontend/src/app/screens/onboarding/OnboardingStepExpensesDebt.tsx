import { Plus, X, Loader2, FileText } from "lucide-react";
import { CURRENCIES } from "./useOnboardingForm";
import type { ExpenseBreakdown, OnboardingDebtItem } from "./useOnboardingForm";

const EXPENSE_FIELDS: { key: keyof ExpenseBreakdown; label: string; placeholder: string }[] = [
  { key: "rent",          label: "Rent",            placeholder: "Monthly rent" },
  { key: "food",          label: "Food & Groceries", placeholder: "Food expenses" },
  { key: "transport",     label: "Transport",        placeholder: "Commute, fuel" },
  { key: "utilities",     label: "Utilities",        placeholder: "Bills, internet" },
  { key: "entertainment", label: "Entertainment",    placeholder: "Movies, hobbies" },
  { key: "other",         label: "Other",            placeholder: "Miscellaneous" },
];

const DEBT_CATEGORIES: { value: OnboardingDebtItem["category"]; label: string }[] = [
  { value: "homeLoan",      label: "Home Loan" },
  { value: "carLoan",       label: "Car Loan" },
  { value: "personalLoan",  label: "Personal Loan" },
  { value: "creditCard",    label: "Credit Card" },
  { value: "educationLoan", label: "Education Loan" },
  { value: "other",         label: "Other" },
];

interface OnboardingStepExpensesDebtProps {
  // Expenses (unchanged shape)
  expensesCurrency: string;
  onChangeExpensesCurrency: (currency: string) => void;
  totalExpenses: string;
  onChangeManualTotalExpenses: (value: string | null) => void;
  showExpenseBreakdown: boolean;
  onToggleExpenseBreakdown: () => void;
  expenseBreakdown: ExpenseBreakdown;
  onChangeExpenseBreakdown: (breakdown: ExpenseBreakdown) => void;
  onClearManualExpenses: () => void;
  // Debt (new dynamic list)
  debtCurrency: string;
  onChangeDebtCurrency: (currency: string) => void;
  debtItems: OnboardingDebtItem[];
  onChangeDebtItems: (items: OnboardingDebtItem[]) => void;
  totalDebtINR: number;
  totalExpensesINR: number;
  incomeINR: number;
  // Shared
  convertToINR: (amount: string, currency: string) => string;
  isExtracting: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function CurrencySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="outline-none cursor-pointer rounded-lg px-2 py-1 currency-select font-semibold"
      style={{ fontSize: "var(--text-2xs)" }}
      aria-label="Currency"
    >
      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

export default function OnboardingStepExpensesDebt({
  expensesCurrency, onChangeExpensesCurrency,
  totalExpenses, onChangeManualTotalExpenses,
  showExpenseBreakdown, onToggleExpenseBreakdown,
  expenseBreakdown, onChangeExpenseBreakdown,
  onClearManualExpenses,
  debtCurrency, onChangeDebtCurrency,
  debtItems, onChangeDebtItems,
  totalDebtINR, totalExpensesINR, incomeINR,
  convertToINR, isExtracting, onFileUpload,
}: OnboardingStepExpensesDebtProps) {

  // ── Expense derived ────────────────────────────────────
  const showExpINRHint = expensesCurrency !== "INR" && totalExpensesINR > 0;

  // ── Debt helpers ───────────────────────────────────────
  const addDebt = () => {
    onChangeDebtItems([
      ...debtItems,
      {
        id: crypto.randomUUID(),
        name: "",
        category: "personalLoan",
        monthlyPayment: "",
        principal: "",
        interestRate: "",
      },
    ]);
  };

  const removeDebt = (id: string) => {
    onChangeDebtItems(debtItems.filter((d) => d.id !== id));
  };

  const updateDebt = (id: string, patch: Partial<OnboardingDebtItem>) => {
    onChangeDebtItems(debtItems.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const showDebtINRHint = debtCurrency !== "INR" && totalDebtINR > 0;
  const anyDebtFilled = debtItems.some((d) => parseFloat(d.monthlyPayment) > 0);
  const showSurplusBanner = totalExpensesINR > 0 && anyDebtFilled;
  const totalCaptured = totalExpensesINR + totalDebtINR;
  const surplus = incomeINR - totalExpensesINR - totalDebtINR;
  const surplusPositive = surplus > 0;

  // convertToINR is kept in the interface for future use / consistency
  void convertToINR;

  return (
    <div className="flex flex-col gap-6">

      {/* ══ EXPENSES ══════════════════════════════════ */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold" style={{ fontSize: "var(--text-sm)", color: "var(--card-foreground)" }}>
            Monthly expenses
          </span>
          <CurrencySelect value={expensesCurrency} onChange={onChangeExpensesCurrency} />
        </div>

        {/* Hero total input */}
        <input
          type="text"
          inputMode="numeric"
          value={totalExpenses}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9.]/g, "");
            onChangeManualTotalExpenses(val || null);
          }}
          placeholder="Total monthly expenses"
          className="w-full rounded-xl px-4 py-3 outline-none font-semibold"
          style={{
            fontSize: "var(--text-lg)",
            background: "var(--surface-tint)",
            color: "var(--card-foreground)",
            border: "1px solid var(--border)",
          }}
        />

        {/* Breakdown toggle */}
        <button
          type="button"
          onClick={() => {
            if (showExpenseBreakdown) onClearManualExpenses();
            onToggleExpenseBreakdown();
          }}
          className="text-left font-semibold transition-colors hover:opacity-80"
          style={{ fontSize: "var(--text-xs)", color: "var(--accent)" }}
        >
          {showExpenseBreakdown ? "▲ Hide breakdown" : "▼ Breakdown by category"}
        </button>

        {showExpenseBreakdown && (
          <div className="grid grid-cols-2 gap-3">
            {EXPENSE_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} className="flex flex-col gap-1">
                <label
                  style={{
                    fontSize: "var(--text-2xs)",
                    color: "var(--secondary)",
                    fontWeight: "var(--font-weight-medium)",
                  }}
                >
                  {label}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={expenseBreakdown[key]}
                  onChange={(e) =>
                    onChangeExpenseBreakdown({
                      ...expenseBreakdown,
                      [key]: e.target.value.replace(/[^0-9.]/g, ""),
                    })
                  }
                  placeholder={placeholder}
                  className="w-full rounded-lg px-3 py-2 outline-none"
                  style={{
                    fontSize: "var(--text-sm)",
                    background: "var(--card)",
                    color: "var(--card-foreground)",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {showExpINRHint && (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--secondary)" }}>
            ≈ ₹{Math.round(totalExpensesINR).toLocaleString("en-IN")} / mo in INR
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="h-px" style={{ background: "var(--border)" }} />

      {/* ══ DEBT ══════════════════════════════════════ */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold" style={{ fontSize: "var(--text-sm)", color: "var(--card-foreground)" }}>
            Debts & EMIs
          </span>
          <CurrencySelect value={debtCurrency} onChange={onChangeDebtCurrency} />
        </div>

        {/* Debt item cards */}
        {debtItems.length > 0 && (
          <div className="flex flex-col gap-3">
            {debtItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl flex flex-col gap-3 p-4"
                style={{ background: "var(--surface-tint)", border: "1px solid var(--border)" }}
              >
                {/* Name + category + remove */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateDebt(item.id, { name: e.target.value })}
                    placeholder="Debt name"
                    className="flex-1 bg-transparent outline-none font-semibold"
                    style={{ fontSize: "var(--text-sm)", color: "var(--card-foreground)" }}
                  />
                  <select
                    value={item.category}
                    onChange={(e) =>
                      updateDebt(item.id, {
                        category: e.target.value as OnboardingDebtItem["category"],
                      })
                    }
                    className="outline-none cursor-pointer rounded-lg px-2 py-1 font-medium"
                    style={{
                      fontSize: "var(--text-xs)",
                      background: "var(--card)",
                      color: "var(--card-foreground)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {DEBT_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeDebt(item.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-card"
                    style={{ color: "var(--secondary)" }}
                    aria-label="Remove debt"
                  >
                    <X size={14} className="icon-wireframe" />
                  </button>
                </div>

                {/* 3-field sub-grid */}
                <div className="grid grid-cols-3 gap-2">
                  {/* EMI */}
                  <div className="flex flex-col gap-1">
                    <label
                      style={{
                        fontSize: "var(--text-2xs)",
                        color: "var(--secondary)",
                        fontWeight: "var(--font-weight-medium)",
                      }}
                    >
                      EMI/mo
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={item.monthlyPayment}
                      onChange={(e) =>
                        updateDebt(item.id, { monthlyPayment: e.target.value.replace(/[^0-9.]/g, "") })
                      }
                      placeholder="0"
                      className="w-full rounded-lg px-3 py-2 outline-none"
                      style={{
                        fontSize: "var(--text-sm)",
                        background: "var(--card)",
                        color: "var(--card-foreground)",
                        border: "1px solid var(--border)",
                      }}
                    />
                  </div>
                  {/* Principal */}
                  <div className="flex flex-col gap-1">
                    <label
                      style={{
                        fontSize: "var(--text-2xs)",
                        color: "var(--secondary)",
                        fontWeight: "var(--font-weight-medium)",
                      }}
                    >
                      Principal
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={item.principal}
                      onChange={(e) =>
                        updateDebt(item.id, { principal: e.target.value.replace(/[^0-9.]/g, "") })
                      }
                      placeholder="0"
                      className="w-full rounded-lg px-3 py-2 outline-none"
                      style={{
                        fontSize: "var(--text-sm)",
                        background: "var(--card)",
                        color: "var(--card-foreground)",
                        border: "1px solid var(--border)",
                      }}
                    />
                  </div>
                  {/* Rate % — always red highlighted */}
                  <div className="flex flex-col gap-1">
                    <label
                      style={{
                        fontSize: "var(--text-2xs)",
                        color: "var(--red)",
                        fontWeight: "var(--font-weight-medium)",
                      }}
                    >
                      Rate %
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={item.interestRate}
                      onChange={(e) =>
                        updateDebt(item.id, { interestRate: e.target.value.replace(/[^0-9.]/g, "") })
                      }
                      placeholder="0"
                      className="w-full rounded-lg px-3 py-2 outline-none"
                      style={{
                        fontSize: "var(--text-sm)",
                        background: "color-mix(in srgb, var(--red) 8%, var(--card))",
                        color: "var(--card-foreground)",
                        border: "1px solid var(--red)",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add debt button */}
        <button
          type="button"
          onClick={addDebt}
          className="w-full rounded-xl py-3 flex items-center justify-center gap-2 transition-all duration-200 border-dashed border-2 hover:opacity-80"
          style={{
            borderColor: "var(--border)",
            color: "var(--secondary)",
            fontSize: "var(--text-sm)",
          }}
        >
          <Plus size={16} className="icon-wireframe" />
          Add debt / EMI
        </button>

        {/* Upload loan doc */}
        <label
          className="pill-button flex items-center gap-2 cursor-pointer w-fit"
          style={{ fontSize: "var(--text-xs)" }}
        >
          {isExtracting
            ? <Loader2 size={14} className="icon-wireframe animate-spin" />
            : <FileText size={14} className="icon-wireframe" />}
          {isExtracting ? "Scanning document…" : "Upload loan doc"}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={onFileUpload}
            disabled={isExtracting}
          />
        </label>

        {showDebtINRHint && (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--secondary)" }}>
            ≈ ₹{Math.round(totalDebtINR).toLocaleString("en-IN")} / mo debt in INR
          </p>
        )}

        {/* Costs captured banner — shows once expenses + any debt filled */}
        {showSurplusBanner && (
          <div
            className="rounded-xl px-4 py-3 flex justify-between items-center"
            style={{
              background: surplusPositive
                ? 'color-mix(in srgb, var(--green) 12%, var(--card))'
                : 'color-mix(in srgb, var(--amber) 12%, var(--card))',
              border: `1px solid ${surplusPositive ? 'var(--green)' : 'var(--amber)'}`,
            }}
          >
            <span style={{ fontSize: "var(--text-xs)", color: "var(--secondary)" }}>
              Monthly costs captured · ₹{Math.round(totalCaptured).toLocaleString("en-IN")}
            </span>
            <span
              style={{
                fontSize: "var(--text-sm)",
                color: surplusPositive ? 'var(--green)' : 'var(--amber)',
                fontWeight: 'var(--font-weight-semibold)',
              }}
            >
              {surplusPositive ? 'Surplus' : 'Deficit'}: ₹{Math.abs(Math.round(surplus)).toLocaleString('en-IN')}/mo
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
