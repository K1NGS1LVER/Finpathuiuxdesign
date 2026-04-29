import { useState, useEffect } from 'react';
import { Calculator, TrendingDown, ArrowRight } from 'lucide-react';
import { compareTaxRegimes } from '../../lib/tax-engine';
import { useFinPathStore } from '../../lib/store';

export default function Tax() {
  const storeIncome = useFinPathStore(s => s.income);
  const annualIncome = storeIncome.total * 12;

  const [income, setIncome] = useState(annualIncome > 0 ? String(annualIncome) : '1200000');
  const [regime, setRegime] = useState<'old' | 'new'>('new');
  const [deductions, setDeductions] = useState('150000');

  // Sync income from store if it changes and we haven't touched it much
  useEffect(() => {
    if (annualIncome > 0 && income === '1200000') {
      setIncome(String(annualIncome));
    }
  }, [annualIncome]);

  const incomeNum = parseInt(income) || 0;
  const deductionsNum = parseInt(deductions) || 0;

  // Use the real tax engine
  const taxComparison = compareTaxRegimes(incomeNum, deductionsNum);
  const oldTax = taxComparison.old.totalTax;
  const newTax = taxComparison.new.totalTax;
  const savings = Math.abs(oldTax - newTax);
  const savingsPercentage = Math.max(oldTax, newTax) > 0 ? Math.round((savings / Math.max(oldTax, newTax)) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto relative text-[var(--foreground)]">
      {/* Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="data-blob w-[400px] h-[400px] -top-40 right-1/4 rounded-full bg-[var(--accent)] opacity-10" />
        <div className="data-blob w-[300px] h-[300px] bottom-0 -left-40 rounded-full bg-[var(--tertiary-accent)] opacity-10" />
      </div>

      {/* Header */}
      <div className="mb-6 md:mb-8 relative z-10">
        <h1 className="text-display mb-2 slashed-zero">Tax Calculator</h1>
        <p className="text-lg text-[var(--secondary)]">Compare FY 2024-25 Old vs New tax regimes</p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 relative z-10">
        {/* Input Card */}
        <div className="lg:col-span-1 bento-card flex flex-col gap-6">
          <h3 className="text-title slashed-zero text-[var(--card-foreground)]">Your Details</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3 text-[var(--secondary)]">Annual Income</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold slashed-zero text-[var(--secondary)]">₹</span>
                <input
                  type="text"
                  value={income}
                  onChange={(e) => setIncome(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full pl-10 pr-4 py-3 md:py-4 text-xl md:text-2xl font-bold rounded-2xl outline-none slashed-zero border border-[var(--border)] focus:border-[var(--accent)] text-[var(--card-foreground)]"
                  style={{ background: 'var(--surface-tint)' }}
                  placeholder="1200000"
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-[var(--secondary)]">Deductions (80C, etc.)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold slashed-zero text-[var(--secondary)]">₹</span>
                <input
                  type="text"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full pl-10 pr-4 py-3 md:py-4 text-xl md:text-2xl font-bold rounded-2xl outline-none slashed-zero border border-[var(--border)] focus:border-[var(--accent)] text-[var(--card-foreground)]"
                  style={{ background: 'var(--surface-tint)' }}
                  placeholder="150000"
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-[var(--secondary)]">Preferred Regime</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setRegime('new')}
                  className={`pill-button flex-1 py-3 text-base ${regime === 'new' ? 'active' : ''}`}
                >
                  New
                </button>
                <button
                  onClick={() => setRegime('old')}
                  className={`pill-button flex-1 py-3 text-base ${regime === 'old' ? 'active' : ''}`}
                >
                  Old
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Old Regime Card */}
          <div className={`bento-card flex flex-col ${regime === 'old' ? 'border-[var(--accent)] border-2 shadow-[0_0_24px_var(--accent-glow)]' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-title slashed-zero text-[var(--card-foreground)]">Old Regime</h3>
                <p className="text-[10px] text-[var(--secondary)] mt-1 max-w-[200px]">Allows deductions (80C, 80D, HRA). Best if you have high investments.</p>
              </div>
              {regime === 'old' && (
                <div className="pill-button text-xs bg-[var(--accent)] text-[var(--on-accent)] font-semibold">Selected</div>
              )}
            </div>

            <div className="relative mb-8 flex-1 flex flex-col justify-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-[var(--red)] opacity-30 blur-2xl pointer-events-none mix-blend-screen" />
              <div className="relative text-center py-6">
                <div className="text-2xl md:text-3xl font-bold mb-2 slashed-zero text-[var(--card-foreground)] truncate px-2" style={{ fontFamily: 'var(--font-display)' }}>
                  ₹{oldTax.toLocaleString('en-IN')}
                </div>
                <div className="text-sm font-medium text-[var(--secondary)]">Tax Liability</div>
              </div>
            </div>

            <div className="space-y-3 mt-auto p-4 rounded-xl" style={{ background: 'var(--surface-tint)' }}>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--secondary)]">Income</span>
                <span className="font-semibold slashed-zero text-[var(--card-foreground)]">₹{incomeNum.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--secondary)]">Deductions</span>
                <span className="font-semibold slashed-zero text-[var(--card-foreground)]">-₹{deductionsNum.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-px bg-[var(--border)] my-2" />
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-[var(--card-foreground)]">Taxable Income</span>
                <span className="font-bold slashed-zero text-[var(--card-foreground)]">₹{(incomeNum - deductionsNum).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* New Regime Card */}
          <div className={`bento-card flex flex-col ${regime === 'new' ? 'border-[var(--accent)] border-2 shadow-[0_0_24px_var(--accent-glow)]' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-title slashed-zero text-[var(--card-foreground)]">New Regime</h3>
                <p className="text-[10px] text-[var(--secondary)] mt-1 max-w-[200px]">Default for FY 24-25. Lower tax slabs, but no investment deductions allowed.</p>
              </div>
              {regime === 'new' && (
                <div className="pill-button text-xs bg-[var(--accent)] text-[var(--on-accent)] font-semibold">Selected</div>
              )}
            </div>

            <div className="relative mb-8 flex-1 flex flex-col justify-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-[var(--accent)] opacity-30 blur-2xl pointer-events-none mix-blend-screen" />
              <div className="relative text-center py-6">
                <div className="text-2xl md:text-3xl font-bold mb-2 slashed-zero text-[var(--card-foreground)] truncate px-2" style={{ fontFamily: 'var(--font-display)' }}>
                  ₹{newTax.toLocaleString('en-IN')}
                </div>
                <div className="text-sm font-medium text-[var(--secondary)]">Tax Liability</div>
              </div>
            </div>

            <div className="space-y-3 mt-auto p-4 rounded-xl" style={{ background: 'var(--surface-tint)' }}>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--secondary)]">Income</span>
                <span className="font-semibold slashed-zero text-[var(--card-foreground)]">₹{incomeNum.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--secondary)]">Deductions</span>
                <span className="font-semibold slashed-zero text-[var(--card-foreground)]">Not Allowed</span>
              </div>
              <div className="h-px bg-[var(--border)] my-2" />
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-[var(--card-foreground)]">Taxable Income</span>
                <span className="font-bold slashed-zero text-[var(--card-foreground)]">₹{incomeNum.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Savings Card */}
        <div className="lg:col-span-3 bento-card p-4 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-bold mb-2 slashed-zero text-[var(--card-foreground)]">
              {savings > 0 ? 'You Save' : savings < 0 ? 'You Pay More' : 'No Difference'}
            </h3>
            <p className="text-sm md:text-base text-[var(--secondary)]">
              {savings > 0
                ? `Choosing the new regime saves you ₹${Math.abs(savings).toLocaleString('en-IN')}`
                : savings < 0
                ? `Old regime is better by ₹${Math.abs(savings).toLocaleString('en-IN')}`
                : 'Both regimes result in same tax'}
            </p>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="text-center">
              <div className={`text-3xl md:text-5xl font-bold mb-1 slashed-zero ${savings > 0 ? 'text-[var(--accent-text)]' : savings < 0 ? 'text-[var(--red-text)]' : 'text-[var(--card-foreground)]'}`}>
                ₹{Math.abs(savings).toLocaleString('en-IN')}
              </div>
              <div className="text-xs md:text-sm font-medium text-[var(--secondary)]">
                {savingsPercentage}% {savings > 0 ? 'saved' : 'extra'}
              </div>
            </div>
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center ${savings > 0 ? 'text-[var(--accent-text)]' : 'text-[var(--red-text)]'}`} style={{ background: 'var(--surface-hover)' }}>
              {savings > 0 ? <TrendingDown size={24} className="md:w-7 md:h-7" /> : <Calculator size={24} className="md:w-7 md:h-7" />}
            </div>
          </div>
        </div>

        {/* Recommendation */}
        {savings !== 0 && (
          <div className={`lg:col-span-3 bento-card flex items-center gap-4 border-l-4 ${savings > 0 ? 'border-l-[var(--accent)]' : 'border-l-[var(--red)]'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${savings > 0 ? 'bg-[var(--accent)] text-[var(--on-accent)]' : 'bg-[var(--red)] text-white'}`}>
              <ArrowRight size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1 slashed-zero text-[var(--card-foreground)]">Recommendation</h3>
              <p className="text-sm text-[var(--secondary)]">
                {savings > 0
                  ? `We recommend choosing the New Regime. The lower tax slabs save you more money than your current deductions would in the Old Regime.`
                  : `Consider sticking with the Old Regime. Your deductions (₹${deductionsNum.toLocaleString('en-IN')}) reduce your taxable income enough to beat the New Regime's lower rates.`}
              </p>
            </div>
          </div>
        )}

        {/* Deductions Insights */}
        <div className="lg:col-span-3 bento-card p-6 md:p-8 mt-2">
          <h3 className="text-xl font-bold mb-4 text-[var(--card-foreground)] flex items-center gap-2">
            <span className="text-xl">💡</span> Penny's Deduction Guide
          </h3>
          <p className="text-sm text-[var(--secondary)] mb-6">
            If you opt for the <strong>Old Regime</strong>, here are the top deductions you should claim to lower your tax burden:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { code: 'Section 80C', max: '₹1.5 Lakh', desc: 'ELSS Mutual Funds, PPF, EPF, Life Insurance premiums, and Home Loan Principal.' },
              { code: 'Section 80D', max: '₹25,000+', desc: 'Health Insurance premiums for yourself and parents.' },
              { code: 'Section 24(b)', max: '₹2 Lakh', desc: 'Interest paid on your Home Loan.' },
              { code: 'HRA', max: 'Varies', desc: 'House Rent Allowance if you live in a rented house and receive HRA.' }
            ].map(deduction => (
              <div key={deduction.code} className="p-4 rounded-xl" style={{ background: 'var(--surface-hover)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[var(--accent-text)] text-sm">{deduction.code}</span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-md" style={{ background: 'var(--surface-tint)', border: '1px solid var(--border)' }}>Max {deduction.max}</span>
                </div>
                <p className="text-xs text-[var(--secondary)]">{deduction.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}