import { Plus, X, Loader2, FileText } from "lucide-react";
import type { IncomeItem, IncomeType } from "./useOnboardingForm";
import { CURRENCIES } from "./useOnboardingForm";

const INCOME_TYPES: { value: IncomeType; label: string }[] = [
  { value: "salary",   label: "Salary" },
  { value: "freelance",label: "Freelance" },
  { value: "passive",  label: "Passive" },
  { value: "rental",   label: "Rental" },
  { value: "dividend", label: "Dividend" },
  { value: "other",    label: "Other" },
];

const PASSIVE_TYPES: IncomeType[] = ["passive", "rental", "dividend"];

interface OnboardingStepIncomeProps {
  incomeItems: IncomeItem[];
  onChangeIncomeItems: (items: IncomeItem[]) => void;
  incomeCurrency: string;
  onChangeIncomeCurrency: (currency: string) => void;
  totalIncomeINR: number;
  isExtracting: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function CurrencySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="outline-none cursor-pointer rounded-lg px-2 py-1 currency-select font-semibold"
      style={{ fontSize: "var(--text-xs)" }}
      aria-label="Currency"
    >
      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

export default function OnboardingStepIncome({
  incomeItems,
  onChangeIncomeItems,
  incomeCurrency,
  onChangeIncomeCurrency,
  totalIncomeINR,
  isExtracting,
  onFileUpload,
}: OnboardingStepIncomeProps) {
  const addItem = () => {
    if (incomeItems.length >= 8) return;
    onChangeIncomeItems([
      ...incomeItems,
      {
        id: crypto.randomUUID(),
        name: "",
        type: "salary",
        amount: "",
        growthRate: "",
        variabilityPercent: "",
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (incomeItems.length <= 1) return;
    onChangeIncomeItems(incomeItems.filter((i) => i.id !== id));
  };

  const update = (id: string, patch: Partial<IncomeItem>) => {
    onChangeIncomeItems(incomeItems.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const showINRHint = incomeCurrency !== "INR" && totalIncomeINR > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="font-semibold" style={{ fontSize: "var(--text-base)", color: "var(--card-foreground)" }}>
          Income sources
        </span>
        <CurrencySelect value={incomeCurrency} onChange={onChangeIncomeCurrency} />
      </div>

      {/* Income item cards */}
      <div className="flex flex-col gap-3">
        {incomeItems.map((item) => {
          const isPassive = PASSIVE_TYPES.includes(item.type);
          return (
            <div
              key={item.id}
              className="rounded-xl flex flex-col gap-3 p-4"
              style={{ background: "var(--surface-tint)", border: "1px solid var(--border)" }}
            >
              {/* Name + type + remove */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => update(item.id, { name: e.target.value })}
                  placeholder="Source name"
                  className="flex-1 bg-transparent outline-none font-semibold"
                  style={{ fontSize: "var(--text-base)", color: "var(--card-foreground)" }}
                />
                <select
                  value={item.type}
                  onChange={(e) => update(item.id, { type: e.target.value as IncomeType })}
                  className="outline-none cursor-pointer rounded-lg px-2 py-1 font-medium"
                  style={{
                    fontSize: "var(--text-xs)",
                    background: "var(--card)",
                    color: "var(--card-foreground)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {INCOME_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {incomeItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-card"
                    style={{ color: "var(--secondary)" }}
                    aria-label="Remove income source"
                  >
                    <X size={14} className="icon-wireframe" />
                  </button>
                )}
              </div>

              {/* 3-field sub-grid */}
              <div className="grid grid-cols-3 gap-2">
                {/* Amount */}
                <div className="flex flex-col gap-1">
                  <label
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--secondary)",
                      fontWeight: "var(--font-weight-medium)",
                    }}
                  >
                    Amount/mo
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={item.amount}
                    onChange={(e) => update(item.id, { amount: e.target.value.replace(/[^0-9.]/g, "") })}
                    placeholder="0"
                    className="w-full rounded-lg px-3 py-2 outline-none"
                    style={{
                      fontSize: "var(--text-base)",
                      background: "var(--card)",
                      color: "var(--card-foreground)",
                      border: "1px solid var(--border)",
                    }}
                  />
                </div>
                {/* Growth */}
                <div className="flex flex-col gap-1">
                  <label
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--secondary)",
                      fontWeight: "var(--font-weight-medium)",
                    }}
                  >
                    Growth %/yr
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={item.growthRate}
                    onChange={(e) => update(item.id, { growthRate: e.target.value.replace(/[^0-9.]/g, "") })}
                    placeholder="0"
                    className="w-full rounded-lg px-3 py-2 outline-none"
                    style={{
                      fontSize: "var(--text-base)",
                      background: "var(--card)",
                      color: "var(--card-foreground)",
                      border: "1px solid var(--border)",
                    }}
                  />
                </div>
                {/* Variability — highlighted for passive/rental/dividend */}
                <div className="flex flex-col gap-1">
                  <label
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--secondary)",
                      fontWeight: "var(--font-weight-medium)",
                    }}
                  >
                    Variability %
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={item.variabilityPercent}
                    onChange={(e) =>
                      update(item.id, { variabilityPercent: e.target.value.replace(/[^0-9.]/g, "") })
                    }
                    placeholder="0"
                    className="w-full rounded-lg px-3 py-2 outline-none transition-all"
                    style={{
                      fontSize: "var(--text-base)",
                      background: isPassive ? "var(--accent-subtle)" : "var(--card)",
                      color: "var(--card-foreground)",
                      border: isPassive
                        ? "1px solid var(--secondary-accent)"
                        : "1px solid var(--border)",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add source button */}
      <button
        type="button"
        onClick={addItem}
        disabled={incomeItems.length >= 8}
        className="w-full rounded-xl py-3 flex items-center justify-center gap-2 transition-all duration-200 border-dashed border-2 hover:opacity-80 disabled:opacity-40"
        style={{
          borderColor: "var(--border)",
          color: "var(--secondary)",
          fontSize: "var(--text-base)",
        }}
      >
        <Plus size={16} className="icon-wireframe" />
        Add income source
      </button>

      {/* Upload salary slip */}
      <label
        className="pill-button flex items-center gap-2 cursor-pointer w-fit"
        style={{ fontSize: "var(--text-xs)" }}
      >
        {isExtracting
          ? <Loader2 size={14} className="icon-wireframe animate-spin" />
          : <FileText size={14} className="icon-wireframe" />}
        {isExtracting ? "Scanning salary slip…" : "Upload salary slip"}
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={onFileUpload}
          disabled={isExtracting}
        />
      </label>

      {/* INR conversion hint */}
      {showINRHint && (
        <p className="text-center" style={{ fontSize: "var(--text-xs)", color: "var(--secondary)" }}>
          ≈ ₹{Math.round(totalIncomeINR).toLocaleString("en-IN")} / mo in INR
        </p>
      )}

      {/* Total row */}
      {totalIncomeINR > 0 && (
        <div
          className="flex justify-between items-center pt-3 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="font-semibold" style={{ fontSize: "var(--text-base)", color: "var(--secondary)" }}>
            Total income
          </span>
          <span className="font-bold" style={{ fontSize: "var(--text-base)", color: "var(--card-foreground)" }}>
            ₹{Math.round(totalIncomeINR).toLocaleString("en-IN")}
          </span>
        </div>
      )}
    </div>
  );
}
