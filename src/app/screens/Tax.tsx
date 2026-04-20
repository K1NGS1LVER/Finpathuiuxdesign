import { useState } from 'react';
import { FileUp, Info } from 'lucide-react';

export default function Tax() {
  const [income, setIncome] = useState(850000);
  const [deductions, setDeductions] = useState(150000);

  const oldTax = Math.max(0, (income - deductions - 250000) * 0.05 + Math.max(0, (income - deductions - 500000) * 0.15));
  const newTax = Math.max(0, (income - 300000) * 0.05 + Math.max(0, (income - 600000) * 0.1));

  const slabs = [
    { range: '0 - 3L', old: 0, new: 0 },
    { range: '3L - 6L', old: 5, new: 5 },
    { range: '6L - 9L', old: 20, new: 10 },
    { range: '9L+', old: 30, new: 15 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 relative">
      <div className="absolute -top-20 right-0 w-72 h-72 rounded-full opacity-5 blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--blue)' }} />
      <div className="relative z-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Tax Calculator</h1>
        <p className="text-sm md:text-base" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>Compare Old vs New regime and optimize your savings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 relative z-10">
        <div className="p-6 rounded-2xl space-y-4 glass-card">
          <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>Your Income</h3>
          <div>
            <label className="text-sm mb-2 block" style={{ color: 'var(--secondary)' }}>Annual Income</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold" style={{ color: 'var(--secondary)' }}>₹</span>
              <input
                type="range"
                min="300000"
                max="2000000"
                step="50000"
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                className="hidden"
              />
              <input
                type="text"
                value={income.toLocaleString('en-IN')}
                readOnly
                className="w-full pl-8 pr-4 py-3 rounded-xl font-bold glass-card"
                style={{ fontFamily: 'var(--font-display)' }}
              />
            </div>
            <input
              type="range"
              min="300000"
              max="2000000"
              step="50000"
              value={income}
              onChange={(e) => setIncome(Number(e.target.value))}
              className="w-full mt-2"
            />
          </div>

          <div>
            <label className="text-sm mb-2 block" style={{ color: 'var(--secondary)' }}>Deductions (Old Regime)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold" style={{ color: 'var(--secondary)' }}>₹</span>
              <input
                type="text"
                value={deductions.toLocaleString('en-IN')}
                readOnly
                className="w-full pl-8 pr-4 py-3 rounded-xl font-bold glass-card"
                style={{ fontFamily: 'var(--font-display)' }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="250000"
              step="10000"
              value={deductions}
              onChange={(e) => setDeductions(Number(e.target.value))}
              className="w-full mt-2"
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-card">
          <h3 className="font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Comparison</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 md:p-4 rounded-xl glass">
              <div className="text-xs md:text-sm mb-1" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>Old Regime Tax</div>
              <div className="text-xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--red)' }}>
                ₹{oldTax.toFixed(0)}
              </div>
            </div>
            <div className="p-3 md:p-4 rounded-xl glass">
              <div className="text-xs md:text-sm mb-1" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>New Regime Tax</div>
              <div className="text-xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--blue)' }}>
                ₹{newTax.toFixed(0)}
              </div>
            </div>
            <div className="p-3 md:p-4 rounded-xl col-span-2" style={{ backgroundColor: newTax < oldTax ? 'var(--lime)' : 'var(--red)', color: newTax < oldTax ? '#050F1C' : '#fff' }}>
              <div className="text-xs md:text-sm mb-1 opacity-80">You Save</div>
              <div className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                ₹{Math.abs(oldTax - newTax).toFixed(0)}
              </div>
              <div className="text-xs md:text-sm opacity-80 mt-1">{newTax < oldTax ? 'Choose New Regime' : 'Choose Old Regime'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl glass-card">
        <h3 className="font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Tax Slabs</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left py-3 px-4">Income Range</th>
                <th className="text-right py-3 px-4">Old Regime</th>
                <th className="text-right py-3 px-4">New Regime</th>
              </tr>
            </thead>
            <tbody>
              {slabs.map((slab, i) => (
                <tr key={i} style={{ borderBottom: i < slabs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td className="py-3 px-4 font-medium">{slab.range}</td>
                  <td className="text-right py-3 px-4" style={{ color: 'var(--secondary)' }}>{slab.old}%</td>
                  <td className="text-right py-3 px-4" style={{ color: 'var(--secondary)' }}>{slab.new}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 md:p-6 rounded-2xl flex items-start gap-3 md:gap-4 relative z-10" style={{ backgroundColor: 'var(--blue)', color: '#fff' }}>
        <Info size={18} className="md:w-5 md:h-5 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-bold mb-1 text-sm md:text-base" style={{ fontFamily: 'var(--font-display)' }}>Upload Documents</div>
          <div className="text-xs md:text-sm opacity-90 mb-3" style={{ fontFamily: 'var(--font-body)' }}>Upload your Form 16 or salary slips for precise calculations</div>
          <button className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 bg-white/20 hover:bg-white/30" style={{ fontFamily: 'var(--font-body)' }}>
            <FileUp size={16} />
            Upload Files
          </button>
        </div>
      </div>
    </div>
  );
}