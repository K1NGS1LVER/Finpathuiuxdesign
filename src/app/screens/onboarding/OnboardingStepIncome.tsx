import { Loader2, FileText } from "lucide-react";
import { CURRENCIES } from "./useOnboardingForm";

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
    <div className="space-y-4 md:space-y-5">
      <div className="flex gap-2 md:gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={income}
            onChange={(e) => onChangeIncome(e.target.value.replace(/[^0-9]/g, ""))}
            className="w-full px-5 py-5 md:px-8 md:py-7 text-3xl md:text-5xl font-bold text-center rounded-2xl md:rounded-3xl slashed-zero text-[var(--card-foreground)] transition-shadow"
            style={{
              fontFamily: "var(--font-display)",
              background: "var(--surface-tint)",
              border: "2px solid var(--border)",
            }}
            placeholder="0"
            inputMode="numeric"
            aria-label="Monthly income"
          />
        </div>
        <select
          value={incomeCurrency}
          onChange={(e) => onChangeIncomeCurrency(e.target.value)}
          className="pill-button px-4 md:px-5 py-3 md:py-4 text-xs md:text-sm font-bold outline-none cursor-pointer rounded-2xl md:rounded-3xl self-stretch"
          style={{
            fontFamily: "var(--font-body)",
            color: "var(--card-foreground)",
            background: "var(--surface-tint)",
            border: "2px solid var(--border)",
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

      {income && incomeCurrency !== "INR" && (() => {
        const inrVal = convertToINR(income, incomeCurrency);
        return inrVal ? (
          <p className="text-center text-sm slashed-zero" style={{ color: "var(--secondary)" }}>
            ≈ ₹{parseFloat(inrVal).toLocaleString("en-IN")} INR
          </p>
        ) : null;
      })()}

      <div className="pt-4 border-t border-[var(--border)]">
        <label
          className="text-xs md:text-sm font-medium mb-2 block"
          style={{ color: "var(--secondary)", fontFamily: "var(--font-body)" }}
        >
          Expected Annual Salary Increment (%)
        </label>
        <div
          className="flex gap-2 items-center px-4 py-3 rounded-2xl transition-shadow"
          style={{
            background: "var(--surface-tint)",
            border: "2px solid var(--border)",
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

      <div className="pt-2 flex justify-center">
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