const fs = require('fs');

let content = fs.readFileSync('src/app/screens/Onboarding.tsx', 'utf8');

const target = `                </div>
                {totalDebt && debtCurrency !== "INR" && (
                  <p
                    className="text-center text-xs md:text-sm slashed-zero"
                    style={{ color: "var(--secondary)" }}
                  >
                    ≈ ₹{convertToINR(totalDebt, debtCurrency)} INR
                  </p>
                )}

                {showDebtBreakdown && (`;

const replacement = `                </div>
                {totalDebt && debtCurrency !== "INR" && (
                  <p
                    className="text-center text-xs md:text-sm slashed-zero"
                    style={{ color: "var(--secondary)" }}
                  >
                    ≈ ₹{convertToINR(totalDebt, debtCurrency)} INR
                  </p>
                )}

                {/* Outstanding Principal Input */}
                <div className="mt-4 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <label
                    className="text-[10px] md:text-xs font-medium block mb-1.5 md:mb-2"
                    style={{
                      color: "var(--secondary)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    Total Outstanding Principal (Lump sum debt amount)
                  </label>
                  <div
                    className="flex gap-2 items-center px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl transition-all"
                    style={{
                      background: "var(--surface-tint)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <input
                      type="text"
                      value={totalDebtPrincipal}
                      onChange={(e) =>
                        setTotalDebtPrincipal(e.target.value.replace(/[^0-9]/g, ""))
                      }
                      placeholder="e.g. 20000 (Optional)"
                      className="flex-1 w-full bg-transparent text-sm md:text-base font-bold outline-none slashed-zero text-[var(--card-foreground)]"
                      style={{ fontFamily: "var(--font-display)" }}
                    />
                  </div>
                </div>

                {showDebtBreakdown && (`;

content = content.replace(target, replacement);

fs.writeFileSync('src/app/screens/Onboarding.tsx', content);
console.log('Patched Onboarding.tsx');
