import { Loader2, FileText } from "lucide-react";
import { CURRENCIES } from "./useOnboardingForm";
import type { ExpenseBreakdown, DebtBreakdown } from "./useOnboardingForm";

// ── Types ────────────────────────────────────────────────
interface OnboardingStepExpensesDebtProps {
  // Expenses
  expensesCurrency: string;
  onChangeExpensesCurrency: (currency: string) => void;
  totalExpenses: string;
  onChangeManualTotalExpenses: (value: string) => void;
  showExpenseBreakdown: boolean;
  onToggleExpenseBreakdown: () => void;
  expenseBreakdown: ExpenseBreakdown;
  onChangeExpenseBreakdown: (breakdown: ExpenseBreakdown) => void;
  onClearManualExpenses: () => void;
  // Debt
  debtCurrency: string;
  onChangeDebtCurrency: (currency: string) => void;
  totalDebt: string;
  onChangeManualTotalDebt: (value: string) => void;
  showDebtBreakdown: boolean;
  onToggleDebtBreakdown: () => void;
  debtBreakdown: DebtBreakdown;
  onChangeDebtBreakdown: (breakdown: DebtBreakdown) => void;
  onClearManualDebt: () => void;
  // Currency
  convertToINR: (amount: string, currency: string) => string;
  // File upload
  isExtracting: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// ── Field definitions ────────────────────────────────────
const EXPENSE_FIELDS: { key: keyof ExpenseBreakdown; label: string; placeholder: string }[] = [
  { key: "rent", label: "Rent", placeholder: "Monthly rent" },
  { key: "food", label: "Food & Groceries", placeholder: "Food expenses" },
  { key: "transport", label: "Transport", placeholder: "Commute, fuel" },
  { key: "utilities", label: "Utilities", placeholder: "Bills, internet" },
  { key: "entertainment", label: "Entertainment", placeholder: "Movies, hobbies" },
  { key: "other", label: "Other", placeholder: "Miscellaneous" },
];

const DEBT_FIELDS: { key: keyof DebtBreakdown; label: string; placeholder: string }[] = [
  { key: "homeLoan", label: "Home Loan EMI", placeholder: "Monthly EMI" },
  { key: "carLoan", label: "Car Loan EMI", placeholder: "Monthly EMI" },
  { key: "personalLoan", label: "Personal Loan", placeholder: "Monthly EMI" },
  { key: "creditCard", label: "Credit Card", placeholder: "Monthly payment" },
  { key: "educationLoan", label: "Education Loan", placeholder: "Monthly EMI" },
  { key: "otherEMI", label: "Other EMIs", placeholder: "Other debts" },
];

// ── Currency selector ────────────────────────────────────
function CurrencySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="pill-button px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold outline-none cursor-pointer"
      aria-label="Currency"
    >
      {CURRENCIES.map((curr) => (
        <option key={curr} value={curr}>
          {curr}
        </option>
      ))}
    </select>
  );
}

// ── Total input row ──────────────────────────────────────
function TotalInputRow({
  value,
  onChange,
  breakdownVisible,
  onToggleBreakdown,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  breakdownVisible: boolean;
  onToggleBreakdown: () => void;
  ariaLabel: string;
}) {
  return (
    <div
      className="flex gap-2 md:gap-3 items-center px-4 py-4 md:px-6 md:py-6 rounded-2xl md:rounded-3xl cursor-pointer transition-all hover:shadow-lg"
      onClick={onToggleBreakdown}
      style={{
        background: "var(--surface-tint)",
        border: "1px solid var(--border)",
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        onClick={(e) => e.stopPropagation()}
        placeholder="0"
        className="flex-1 w-full bg-transparent text-2xl md:text-4xl font-bold text-center outline-none slashed-zero text-[var(--card-foreground)]"
        style={{ fontFamily: "var(--font-display)" }}
        inputMode="numeric"
        aria-label={ariaLabel}
      />
      <button
        type="button"
        className="pill-button text-[10px] md:text-xs font-medium"
        style={{ color: "var(--accent-text)" }}
      >
        {breakdownVisible ? "Hide" : "Breakdown"}
      </button>
    </div>
  );
}

// ── Breakdown field ──────────────────────────────────────
function BreakdownField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] md:text-xs font-medium" style={{ color: "var(--secondary)" }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        className="w-full px-3 py-2 md:px-4 md:py-3 text-base md:text-lg font-bold rounded-lg md:rounded-xl outline-none slashed-zero"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--card-foreground)",
          background: "var(--card)",
          border: "1px solid var(--border)",
        }}
        placeholder={placeholder}
        inputMode="numeric"
        aria-label={label}
      />
    </div>
  );
}

function BreakdownPanel({
  fields,
  values,
  onChange,
}: {
  fields: { key: string; label: string; placeholder: string }[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div
      className="space-y-2 p-3 md:p-4 rounded-xl md:rounded-2xl"
      style={{
        background: "var(--surface-tint)",
        border: "1px solid var(--border)",
      }}
    >
      {fields.map(({ key, label, placeholder }) => (
        <BreakdownField
          key={key}
          label={label}
          value={values[key] || ""}
          onChange={(v) => onChange(key, v)}
          placeholder={placeholder}
        />
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────
export default function OnboardingStepExpensesDebt({
  expensesCurrency,
  onChangeExpensesCurrency,
  totalExpenses,
  onChangeManualTotalExpenses,
  showExpenseBreakdown,
  onToggleExpenseBreakdown,
  expenseBreakdown,
  onChangeExpenseBreakdown,
  onClearManualExpenses,
  debtCurrency,
  onChangeDebtCurrency,
  totalDebt,
  onChangeManualTotalDebt,
  showDebtBreakdown,
  onToggleDebtBreakdown,
  debtBreakdown,
  onChangeDebtBreakdown,
  onClearManualDebt,
  convertToINR,
  isExtracting,
  onFileUpload,
}: OnboardingStepExpensesDebtProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* ── Expenses Section ── */}
      <div className="space-y-2 md:space-y-3">
        <div className="flex items-center justify-between mb-1 md:mb-2">
          <label
            className="text-xs md:text-sm font-medium"
            style={{ color: "var(--secondary)", fontFamily: "var(--font-body)" }}
          >
            Monthly Expenses
          </label>
          <CurrencySelect value={expensesCurrency} onChange={onChangeExpensesCurrency} />
        </div>

        <TotalInputRow
          value={totalExpenses}
          onChange={onChangeManualTotalExpenses}
          breakdownVisible={showExpenseBreakdown}
          onToggleBreakdown={onToggleExpenseBreakdown}
          ariaLabel="Total monthly expenses"
        />

        {totalExpenses && expensesCurrency !== "INR" && (() => {
          const inrVal = convertToINR(totalExpenses, expensesCurrency);
          return inrVal ? (
            <p className="text-center text-xs md:text-sm slashed-zero" style={{ color: "var(--secondary)" }}>
              ≈ ₹{parseFloat(inrVal).toLocaleString("en-IN")} INR
            </p>
          ) : null;
        })()}

        {showExpenseBreakdown && (
          <BreakdownPanel
            fields={EXPENSE_FIELDS}
            values={expenseBreakdown}
            onChange={(key, value) => {
              onChangeExpenseBreakdown({ ...expenseBreakdown, [key]: value });
              onClearManualExpenses();
            }}
          />
        )}
      </div>

      {/* ── Debt Section ── */}
      <div className="space-y-2 md:space-y-3">
        <div className="flex items-center justify-between mb-1 md:mb-2">
          <label
            className="text-xs md:text-sm font-medium"
            style={{ color: "var(--secondary)", fontFamily: "var(--font-body)" }}
          >
            Total Debt/EMIs
          </label>
          <CurrencySelect value={debtCurrency} onChange={onChangeDebtCurrency} />
        </div>

        <TotalInputRow
          value={totalDebt}
          onChange={onChangeManualTotalDebt}
          breakdownVisible={showDebtBreakdown}
          onToggleBreakdown={onToggleDebtBreakdown}
          ariaLabel="Total monthly debt payments"
        />

        {totalDebt && debtCurrency !== "INR" && (() => {
          const inrVal = convertToINR(totalDebt, debtCurrency);
          return inrVal ? (
            <p className="text-center text-xs md:text-sm slashed-zero" style={{ color: "var(--secondary)" }}>
              ≈ ₹{parseFloat(inrVal).toLocaleString("en-IN")} INR
            </p>
          ) : null;
        })()}

        {showDebtBreakdown && (
          <BreakdownPanel
            fields={DEBT_FIELDS}
            values={debtBreakdown}
            onChange={(key, value) => {
              onChangeDebtBreakdown({ ...debtBreakdown, [key]: value });
              onClearManualDebt();
            }}
          />
        )}
      </div>

      {/* Document upload */}
      <div className="pt-2 flex justify-center">
        <label
          htmlFor="document-upload-debt"
          className={`pill-button px-6 py-3 text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all ${isExtracting ? "opacity-70 pointer-events-none" : "hover:scale-105"}`}
          aria-label="Upload loan document for auto-extraction"
        >
          {isExtracting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <FileText size={16} />
          )}
          {isExtracting
            ? "Penny is reading your document..."
            : "Upload Loan/Debt PDF (PDF/Image)"}
        </label>
        <input
          type="file"
          id="document-upload-debt"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={onFileUpload}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}