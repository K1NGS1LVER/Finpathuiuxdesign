import { useState } from 'react';
import { Calculator, TrendingDown, ArrowRight } from 'lucide-react';

export default function Tax() {
  const [income, setIncome] = useState('1200000');
  const [regime, setRegime] = useState<'old' | 'new'>('new');
  const [deductions, setDeductions] = useState('150000');

  const calculateTax = (inc: number, ded: number, reg: 'old' | 'new') => {
    const taxable = inc - (reg === 'old' ? ded : 0);
    let tax = 0;

    if (reg === 'new') {
      if (taxable <= 300000) tax = 0;
      else if (taxable <= 600000) tax = (taxable - 300000) * 0.05;
      else if (taxable <= 900000) tax = 15000 + (taxable - 600000) * 0.10;
      else if (taxable <= 1200000) tax = 45000 + (taxable - 900000) * 0.15;
      else if (taxable <= 1500000) tax = 90000 + (taxable - 1200000) * 0.20;
      else tax = 150000 + (taxable - 1500000) * 0.30;
    } else {
      if (taxable <= 250000) tax = 0;
      else if (taxable <= 500000) tax = (taxable - 250000) * 0.05;
      else if (taxable <= 1000000) tax = 12500 + (taxable - 500000) * 0.20;
      else tax = 112500 + (taxable - 1000000) * 0.30;
    }

    return Math.round(tax);
  };

  const incomeNum = parseInt(income) || 0;
  const deductionsNum = parseInt(deductions) || 0;
  const oldTax = calculateTax(incomeNum, deductionsNum, 'old');
  const newTax = calculateTax(incomeNum, deductionsNum, 'new');
  const savings = oldTax - newTax;
  const savingsPercentage = oldTax > 0 ? Math.round((savings / oldTax) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto relative">
      {/* Decorative Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="data-blob absolute -top-40 right-1/4 w-96 h-96 rounded-full" style={{ backgroundColor: 'var(--violet)' }} />
        <div className="data-blob absolute bottom-0 -left-40 w-80 h-80 rounded-full" style={{ backgroundColor: 'var(--blue)' }} />
      </div>

      {/* Header */}
      <div className="mb-6 md:mb-8 relative z-10">
        <h1 className="text-3xl md:text-5xl font-bold mb-2 slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
          Tax Calculator
        </h1>
        <p className="text-base md:text-lg" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
          Compare old vs new tax regime
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 relative z-10">
        {/* Input Card */}
        <div className="lg:col-span-1 bento-card p-6 md:p-8">
          <h3 className="text-xl font-bold mb-6 slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
            Your Details
          </h3>

          <div className="space-y-6">
            {/* Annual Income */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
                Annual Income
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--secondary)' }}>
                  ₹
                </span>
                <input
                  type="text"
                  value={income}
                  onChange={(e) => setIncome(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full pl-10 pr-4 py-4 text-2xl font-bold rounded-2xl outline-none slashed-zero"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--foreground)',
                    background: 'rgba(5, 15, 28, 0.02)',
                    border: '1px solid var(--border)',
                  }}
                  placeholder="1200000"
                />
              </div>
            </div>

            {/* Deductions */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
                Deductions (80C, 80D, etc.)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--secondary)' }}>
                  ₹
                </span>
                <input
                  type="text"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full pl-10 pr-4 py-4 text-2xl font-bold rounded-2xl outline-none slashed-zero"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--foreground)',
                    background: 'rgba(5, 15, 28, 0.02)',
                    border: '1px solid var(--border)',
                  }}
                  placeholder="150000"
                />
              </div>
            </div>

            {/* Regime Toggle */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
                Preferred Regime
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setRegime('new')}
                  className={`pill-button flex-1 py-3 ${regime === 'new' ? 'active' : ''}`}
                >
                  New
                </button>
                <button
                  onClick={() => setRegime('old')}
                  className={`pill-button flex-1 py-3 ${regime === 'old' ? 'active' : ''}`}
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
          <div className={`bento-card p-6 md:p-8 ${regime === 'old' ? 'ring-2 ring-lime' : ''}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                Old Regime
              </h3>
              {regime === 'old' && (
                <div className="pill-button text-xs" style={{ background: 'var(--lime)', color: '#050F1C' }}>
                  Selected
                </div>
              )}
            </div>

            {/* Tax Amount with Blob */}
            <div className="relative mb-8">
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full data-blob"
                style={{
                  backgroundColor: 'var(--red)',
                  animation: 'pulse-blob 3s ease-in-out infinite',
                }}
              />
              <div className="relative text-center py-8">
                <div className="text-5xl md:text-6xl font-bold mb-2 slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                  ₹{oldTax.toLocaleString('en-IN')}
                </div>
                <div className="text-sm" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
                  Tax Liability
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>Income</span>
                <span className="font-medium slashed-zero" style={{ fontFamily: 'var(--font-body)', color: 'var(--foreground)' }}>
                  ₹{incomeNum.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>Deductions</span>
                <span className="font-medium slashed-zero" style={{ fontFamily: 'var(--font-body)', color: 'var(--foreground)' }}>
                  -₹{deductionsNum.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="h-px" style={{ background: 'var(--border)' }} />
              <div className="flex justify-between text-sm font-bold">
                <span style={{ color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>Taxable Income</span>
                <span className="slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                  ₹{(incomeNum - deductionsNum).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* New Regime Card */}
          <div className={`bento-card p-6 md:p-8 ${regime === 'new' ? 'ring-2 ring-lime' : ''}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                New Regime
              </h3>
              {regime === 'new' && (
                <div className="pill-button text-xs" style={{ background: 'var(--lime)', color: '#050F1C' }}>
                  Selected
                </div>
              )}
            </div>

            {/* Tax Amount with Blob */}
            <div className="relative mb-8">
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full data-blob"
                style={{
                  backgroundColor: 'var(--lime)',
                  animation: 'pulse-blob 3s ease-in-out infinite 0.5s',
                }}
              />
              <div className="relative text-center py-8">
                <div className="text-5xl md:text-6xl font-bold mb-2 slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                  ₹{newTax.toLocaleString('en-IN')}
                </div>
                <div className="text-sm" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
                  Tax Liability
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>Income</span>
                <span className="font-medium slashed-zero" style={{ fontFamily: 'var(--font-body)', color: 'var(--foreground)' }}>
                  ₹{incomeNum.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>Deductions</span>
                <span className="font-medium slashed-zero" style={{ fontFamily: 'var(--font-body)', color: 'var(--foreground)' }}>
                  Not Allowed
                </span>
              </div>
              <div className="h-px" style={{ background: 'var(--border)' }} />
              <div className="flex justify-between text-sm font-bold">
                <span style={{ color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>Taxable Income</span>
                <span className="slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                  ₹{incomeNum.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Savings Card (Full Width) */}
        <div className="lg:col-span-3 bento-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold mb-2 slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                {savings > 0 ? 'You Save' : savings < 0 ? 'You Pay More' : 'No Difference'}
              </h3>
              <p className="text-sm md:text-base" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
                {savings > 0
                  ? `Choosing the new regime saves you ₹${Math.abs(savings).toLocaleString('en-IN')}`
                  : savings < 0
                  ? `Old regime is better by ₹${Math.abs(savings).toLocaleString('en-IN')}`
                  : 'Both regimes result in same tax'}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-1 slashed-zero" style={{ fontFamily: 'var(--font-display)', color: savings > 0 ? 'var(--lime)' : savings < 0 ? 'var(--red)' : 'var(--foreground)' }}>
                  ₹{Math.abs(savings).toLocaleString('en-IN')}
                </div>
                <div className="text-xs" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
                  {savingsPercentage}% {savings > 0 ? 'saved' : 'extra'}
                </div>
              </div>

              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: savings > 0 ? 'var(--lime)15' : 'var(--red)15',
                  color: savings > 0 ? 'var(--lime)' : 'var(--red)',
                }}
              >
                {savings > 0 ? (
                  <TrendingDown size={28} className="icon-wireframe" />
                ) : (
                  <Calculator size={28} className="icon-wireframe" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        {savings !== 0 && (
          <div className="lg:col-span-3 bento-card p-6 md:p-8" style={{ background: savings > 0 ? 'linear-gradient(135deg, var(--card) 0%, rgba(176, 255, 9, 0.05) 100%)' : 'linear-gradient(135deg, var(--card) 0%, rgba(239, 68, 68, 0.05) 100%)' }}>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: savings > 0 ? 'var(--lime)' : 'var(--red)',
                  color: '#050F1C',
                }}
              >
                <ArrowRight size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1 slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                  Recommendation
                </h3>
                <p className="text-sm" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
                  {savings > 0
                    ? `We recommend choosing the new tax regime to maximize your savings.`
                    : `Consider sticking with the old regime and maximizing your deductions.`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-blob {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
