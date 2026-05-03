import { Loader2, FileText } from "lucide-react";
import { CURRENCIES } from "./useOnboardingForm";

// ── Types ────────────────────────────────────────────────
interface OnboardingStepIncomeProps {
  income: string;
  onChangeIncome: (value: string) => void;
  incomeCurrency: string;
  onChangeIncomeCurrency: (currency: string) => void;
  expectedAnnualIncrement: string;
  onChangeExpectedAnnualIncrement: (value: string) => void;
  convertToINR: (amount: string, currency: string) => string;
  isExtracting: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// ── Component ────────────────────────────────────────────
export default function OnboardingStepIncome({
  income,
  onChangeIncome,
  incomeCurrency,
  onChangeIncomeCurrency,
  expectedAnnualIncrement,
  onChangeExpectedAnnualIncrement,
  convertToINR,
  isExtracting,
  onFileUpload,
}: OnboardingStepIncomeProps) {
  return (
    <div className="space-y-3 md:space-y-4">
      {/* Income input with currency selector */}
      <div className="flex gap-2 md:gap-3">
        <input
          type="text"
          value={income}
          onChange={(e) => onChangeIncome(e.target.value.replace(/[^0-9]/g, ""))}
          className="flex-1 px-4 py-4 md:px-6 md:py-6 text-3xl md:text-5xl font-bold text-center rounded-2xl md:rounded-3xl outline-none slashed-zero text-[var(--card-foreground)]"
          style={{
            fontFamily: "var(--font-display)",
            background: "var(--surface-tint)",
            border: "1px solid var(--border)",
          }}
          placeholder="0"
          inputMode="numeric"
          aria-label="Monthly income"
        />
        <select
          value={incomeCurrency}
          onChange={(e) => onChangeIncomeCurrency(e.target.value)}
          className="pill-button px-3 md:px-5 py-3 md:py-4 text-xs md:text-sm font-bold outline-none cursor-pointer rounded-2xl md:rounded-3xl"
          style={{
            fontFamily: "var(--font-body)",
            color: "var(--card-foreground)",
            background: "var(--surface-hover)",
          }}
          aria-label="Income currency"
        >
          {CURRENCIES.map((curr) => (
            <option key={curr} value={curr}>
              {curr}
            </option>
          ))}
        </select>
      </div>

      {/* INR conversion display */}
      {income && incomeCurrency !== "INR" && (() => {
        const inrVal = convertToINR(income, incomeCurrency);
        return inrVal ? (
          <p className="text-center text-sm slashed-zero" style={{ color: "var(--secondary)" }}>
            ≈ ₹{parseFloat(inrVal).toLocaleString("en-IN")} INR
          </p>
        ) : null;
      })()}

      {/* Annual increment */}
      <div className="mt-6 pt-4 border-t border-[var(--border)]">
        <label
          className="text-xs md:text-sm font-medium mb-2 block"
          style={{ color: "var(--secondary)", fontFamily: "var(--font-body)" }}
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
              onChangeExpectedAnnualIncrement(e.target.value.replace(/[^0-9.]/g, ""))
            }
            placeholder="e.g. 5 for 5%"
            className="flex-1 w-full bg-transparent text-lg md:text-xl font-bold outline-none slashed-zero text-[var(--card-foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
            inputMode="decimal"
            aria-label="Annual salary increment percentage"
          />
          <span className="font-bold text-lg md:text-xl text-[var(--secondary)]">%</span>
        </div>
      </div>

      {/* Document upload */}
      <div className="pt-4 flex justify-center">
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
          {isExtracting
            ? "Penny is reading your document..."
            : "Upload Salary Slip (PDF/Image)"}
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