import { Loader2, FileText } from "lucide-react";
import { CURRENCIES } from "./useOnboardingForm";

interface OnboardingStepIncomeProps {
  // Hero (total)
  totalIncome: string;
  onChangeManualTotalIncome: (value: string) => void;
  incomeCurrency: string;
  onChangeIncomeCurrency: (currency: string) => void;
  // Breakdown toggle
  showIncomeBreakdown: boolean;
  onToggleIncomeBreakdown: () => void;
  onClearManualIncome: () => void;
  // Breakdown fields
  primaryIncome: string;
  onChangePrimaryIncome: (value: string) => void;
  secondaryIncome: string;
  onChangeSecondaryIncome: (value: string) => void;
  passiveIncome: string;
  onChangePassiveIncome: (value: string) => void;
  variablePercent: string;
  onChangeVariablePercent: (value: string) => void;
  calcPassiveVar: number;
  // Increments
  primaryIncrement: string;
  onChangePrimaryIncrement: (value: string) => void;
  secondaryIncrement: string;
  onChangeSecondaryIncrement: (value: string) => void;
  passiveIncrement: string;
  onChangePassiveIncrement: (value: string) => void;
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
      className="text-[10px] md:text-xs font-semibold outline-none cursor-pointer rounded-lg px-2 py-1 currency-select"
      aria-label="Currency"
    >
      {CURRENCIES.map((curr) => (
        <option key={curr} value={curr}>{curr}</option>
      ))}
    </select>
  );
}

function IncomeField({
  label,
  value,
  onChange,
  placeholder,
  inputMode = "numeric",
  suffix,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  inputMode?: "numeric" | "decimal";
  suffix?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] md:text-xs font-semibold text-secondary-color block">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          className="w-full px-4 py-2.5 md:px-4 md:py-3 text-sm md:text-base font-bold rounded-lg md:rounded-xl outline-none slashed-zero breakdown-input"
          placeholder={placeholder}
          inputMode={inputMode}
          aria-label={label}
        />
        {suffix && (
          <span
            className="absolute right-3 text-sm font-bold pointer-events-none"
            style={{ color: "var(--secondary)" }}
          >
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <p className="text-[10px] slashed-zero" style={{ color: "var(--secondary)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function IncrementField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] md:text-xs font-semibold text-secondary-color block">
        Annual Growth
      </label>
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          className="w-full px-4 py-2.5 md:px-4 md:py-3 text-sm md:text-base font-bold rounded-lg md:rounded-xl outline-none slashed-zero breakdown-input"
          placeholder="0"
          inputMode="decimal"
          aria-label="Annual growth percentage"
        />
        <span
          className="absolute right-3 text-sm font-bold pointer-events-none"
          style={{ color: "var(--secondary)" }}
        >
          %
        </span>
      </div>
    </div>
  );
}

export default function OnboardingStepIncome({
  totalIncome,
  onChangeManualTotalIncome,
  incomeCurrency,
  onChangeIncomeCurrency,
  showIncomeBreakdown,
  onToggleIncomeBreakdown,
  onClearManualIncome,
  primaryIncome,
  onChangePrimaryIncome,
  secondaryIncome,
  onChangeSecondaryIncome,
  passiveIncome,
  onChangePassiveIncome,
  variablePercent,
  onChangeVariablePercent,
  calcPassiveVar,
  primaryIncrement,
  onChangePrimaryIncrement,
  secondaryIncrement,
  onChangeSecondaryIncrement,
  passiveIncrement,
  onChangePassiveIncrement,
  convertToINR,
  isExtracting,
  onFileUpload,
}: OnboardingStepIncomeProps) {
  const showConversion = totalIncome && incomeCurrency !== "INR";
  const inrVal = showConversion ? convertToINR(totalIncome, incomeCurrency) : null;

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Section label + currency */}
      <div className="flex items-center justify-between">
        <label className="text-xs md:text-sm font-semibold label-secondary">
          Monthly Income
        </label>
        <CurrencySelect value={incomeCurrency} onChange={onChangeIncomeCurrency} />
      </div>

      {/* Hero total input — click field to type, click button to toggle breakdown */}
      <div
        className="flex gap-2 md:gap-3 items-center px-5 py-5 md:px-7 md:py-6 rounded-2xl md:rounded-3xl transition-all hover:shadow-lg input-surface-2"
        style={{ cursor: "text" }}
      >
        <input
          type="text"
          value={totalIncome}
          onChange={(e) => {
            onChangeManualTotalIncome(e.target.value.replace(/[^0-9]/g, ""));
          }}
          onBlur={() => {
            // If field loses focus and no value, toggle breakdown to show options
            if (!totalIncome) {
              onToggleIncomeBreakdown();
            }
          }}
          placeholder="0"
          className="flex-1 w-full bg-transparent text-2xl md:text-3xl font-bold text-center outline-none slashed-zero text-[var(--card-foreground)] font-display-family"
          inputMode="numeric"
          aria-label="Total monthly income"
        />
        <button
          type="button"
          onClick={onToggleIncomeBreakdown}
          className="text-[10px] md:text-xs font-semibold px-3 py-1.5 rounded-full transition-colors btn-breakdown-toggle flex-shrink-0"
        >
          {showIncomeBreakdown ? "Hide" : "Breakdown"}
        </button>
      </div>

      {/* INR conversion */}
      {inrVal && (
        <p className="text-center text-xs md:text-sm slashed-zero text-secondary-color">
          ≈ ₹{parseFloat(inrVal).toLocaleString("en-IN")} INR
        </p>
      )}

      {/* Breakdown panel — 2-column grid matching expenses pattern */}
      {showIncomeBreakdown && (
        <div className="space-y-2.5 p-4 md:p-5 rounded-xl md:rounded-2xl breakdown-panel">
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {/* Primary */}
            <IncomeField
              label="Primary Income"
              value={primaryIncome}
              onChange={(v) => { onChangePrimaryIncome(v); onClearManualIncome(); }}
              placeholder="Main job"
            />
            <IncrementField value={primaryIncrement} onChange={onChangePrimaryIncrement} />

            {/* Secondary */}
            <IncomeField
              label="Secondary Income"
              value={secondaryIncome}
              onChange={(v) => { onChangeSecondaryIncome(v); onClearManualIncome(); }}
              placeholder="Side job"
            />
            <IncrementField value={secondaryIncrement} onChange={onChangeSecondaryIncrement} />

            {/* Passive Fixed */}
            <IncomeField
              label="Passive Income"
              value={passiveIncome}
              onChange={(v) => { onChangePassiveIncome(v); onClearManualIncome(); }}
              placeholder="Rental/dividends"
            />
            <IncrementField value={passiveIncrement} onChange={onChangePassiveIncrement} />

            {/* Variable Yield */}
            <IncomeField
              label="Variable Yield"
              value={variablePercent}
              onChange={(v) => { onChangeVariablePercent(v); onClearManualIncome(); }}
              placeholder="% of passive"
              inputMode="decimal"
              suffix="%"
              hint={
                calcPassiveVar > 0
                  ? `≈ ₹${calcPassiveVar.toLocaleString("en-IN")}/mo`
                  : undefined
              }
            />
          </div>
        </div>
      )}

      {/* File Upload — tertiary weight */}
      <div className="pt-1 flex justify-center">
        <label
          htmlFor="document-upload-income"
          className={`pill-button px-6 py-3 text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all ${isExtracting ? "opacity-70 pointer-events-none" : "hover:scale-105"}`}
          aria-label="Upload salary slip for auto-extraction"
        >
          {isExtracting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <FileText size={16} />
          )}
          {isExtracting ? "Penny is reading your document..." : "Upload Salary Slip (PDF/Image)"}
        </label>
        <input
          type="file"
          id="document-upload-income"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={onFileUpload}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
