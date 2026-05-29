import { useMemo, useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useFinPathStore } from '@/lib/store';
import { pageContainer, pageSection } from '@/app/components/motion-variants';
import { Sankey, ResponsiveContainer } from 'recharts';
import {
  CustomNode,
  CustomLink,
  usePalette,
} from '@/app/components/SankeyFlow';
import { formatInr } from '@/lib/format';
import { buildSankeyData, computeGoalAllocationsTotal } from '@/lib/sankey-data';
import type { NodeKind } from '@/lib/sankey-data';
import { ExpenseProfile } from '@/lib/types';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const SANKEY_MARGIN = { top: 10, left: 120, right: 160, bottom: 10 };


type NodePos = { idx: number; x: number; y: number; w: number; h: number };

export default function Cashflow() {
  const income = useFinPathStore(s => s.income);
  const expenses = useFinPathStore(s => s.expenses);
  const setIncome = useFinPathStore(s => s.setIncome);
  const setExpenses = useFinPathStore(s => s.setExpenses);
  const plan = useFinPathStore(s => s.plan);
  const monthlySurplusReserve = useFinPathStore(s => s.monthlySurplusReserve);
  const goals = useFinPathStore(s => s.goals);
  const debts = useFinPathStore(s => s.debts);
  const savings = useFinPathStore(s => s.savings);
  const emergencyFund = useFinPathStore(s => s.emergencyFund);
  const healthScore = useFinPathStore(s => s.healthScore);

  const [hoveredNode, setHoveredNode] = useState<NodePos | null>(null);
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [activeNode, setActiveNode] = useState<NodePos | null>(null);
  const [activeLink, setActiveLink] = useState<{ idx: number; x: number; y: number } | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const sankeyWrapRef = useRef<HTMLDivElement>(null);

  const pal = usePalette();

  const now = new Date();
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const goalAllocationsTotal = useMemo(
    () => computeGoalAllocationsTotal({ income, expenses, debts, monthlySurplusReserve, plan, goals }),
    [income, expenses, debts, monthlySurplusReserve, plan, goals],
  );

  const totalIncome = income.total || 0;
  const debtPayments = debts.totalMonthly || 0;
  const totalExpenses = expenses.total || 0;
  const housing = (expenses.rent || 0) + (expenses.utilities || 0);
  const food = expenses.food || 0;
  const transport = expenses.transport || 0;
  const otherExp = (expenses.entertainment || 0) + (expenses.other || 0);
  const totalExpensesDeduped = housing + food + transport + otherExp;
  const surplusReserve = monthlySurplusReserve || 0;
  const debtAndSavings = debtPayments + goalAllocationsTotal + surplusReserve;
  const disposable = Math.max(0, totalIncome - totalExpensesDeduped - debtAndSavings);

  const sankeyData = useMemo(
    () => buildSankeyData({ income, expenses, debts, monthlySurplusReserve, plan, goals }),
    [income, expenses, debts, monthlySurplusReserve, plan, goals],
  );

  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  const efMonths = (totalExpenses + debtPayments) > 0
    ? Math.floor(emergencyFund / (totalExpenses + debtPayments))
    : 0;

  // Click-outside handler
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (sankeyWrapRef.current && !sankeyWrapRef.current.contains(e.target as Node)) {
        setActiveNode(null);
        setActiveLink(null);
        setHoveredNode(null);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  // Escape key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { setActiveNode(null); setActiveLink(null); }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleSaveIncome(nodeName: string, newVal: number) {
    if (nodeName === 'Primary Income') {
      setIncome({ ...income, primary: newVal, total: newVal + income.secondary + income.passive + income.variable });
    } else if (nodeName === 'Secondary Income') {
      setIncome({ ...income, secondary: newVal, total: income.primary + newVal + income.passive + income.variable });
    } else if (nodeName === 'Passive Income') {
      const newVariable = Math.round(newVal * income.variablePercent / 100);
      setIncome({ ...income, passive: newVal, variable: newVariable, total: income.primary + income.secondary + newVal + newVariable });
    }
    setActiveNode(null);
    setEditValues({});
  }

  function handleSaveExpenses(fields: Partial<ExpenseProfile>) {
    const next = { ...expenses, ...fields };
    next.total = next.rent + next.utilities + next.food + next.transport + next.entertainment + next.other;
    setExpenses(next);
    setActiveNode(null);
    setEditValues({});
  }

  const cashflowInsights = useMemo(() => {
    const insights: string[] = [];

    if (totalIncome <= 0) {
      return ['Income data not available. Complete onboarding to see cashflow insights.'];
    }

    const expenseRatio = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0;
    if (expenseRatio > 70) {
      insights.push(`Your expenses consume ${expenseRatio}% of income — aim to keep essential spending below 50% for a healthy buffer.`);
    } else if (expenseRatio > 50) {
      insights.push(`Expenses are ${expenseRatio}% of your income. There's room to trim discretionary spending to boost savings.`);
    } else {
      insights.push(`Expenses account for only ${expenseRatio}% of your income — you're maintaining a lean lifestyle.`);
    }

    if (healthScore) {
      if (healthScore.savingsRate >= 20) {
        insights.push(`Your savings rate is strong at ${savingsRate}% — keep it above 20% for long-term wealth building.`);
      } else {
        insights.push(`Your savings rate could improve. Aim to save at least 20% of income for long-term financial security.`);
      }

      if (efMonths < 3) {
        const monthlyExpense = totalExpenses + debtPayments;
        const target = monthlyExpense * 3;
        const needed = Math.max(0, target - emergencyFund);
        insights.push(`Build your emergency fund — save ${formatInr(needed)} more to cover 3 months of expenses.`);
      } else {
        insights.push(`Your emergency fund covers ${efMonths}+ months — great safety net.`);
      }
    }

    if (disposable > 0) {
      insights.push(`You have ${formatInr(disposable)} in free cash each month — consider allocating it to goals or investments.`);
    } else if (disposable === 0 && totalIncome > 0) {
      insights.push(`Your income is fully allocated with no free cash remaining. Review your budget for optimisation opportunities.`);
    }

    if (savings > 0) {
      insights.push(`Your total savings stand at ${formatInr(savings)} — consider investing idle cash for better returns.`);
    }

    const dti = totalIncome > 0 ? Math.round((debtPayments / totalIncome) * 100) : 0;
    if (dti > 40) {
      insights.push(`High debt-to-income ratio: ${dti}%. Prioritise paying down high-interest debts.`);
    }

    return insights;
  }, [totalIncome, totalExpenses, debtPayments, disposable, healthScore, emergencyFund, savings, savingsRate, efMonths]);

  const dti = totalIncome > 0 ? Math.round((debtPayments / totalIncome) * 100) : 0;

  const activeGoals = useMemo(() =>
    goals
      .filter(g => g.status !== 'complete')
      .map(g => ({
        ...g,
        alloc: plan?.months?.[0]?.goalAllocations?.[g.id] ?? g.monthlyAllocation ?? 0,
        completionDate: plan?.goalCompletionDates?.[g.id] ?? null,
        progressPct: g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0,
      })),
    [goals, plan]
  );

  return (
    <motion.div className="max-w-7xl mx-auto relative text-[var(--foreground)]" variants={pageContainer} initial="hidden" animate="visible">
      <motion.div className="mb-6" variants={pageSection}>
        <p className="text-label">Money Flow · {monthLabel}</p>
        <h2 className="text-title slashed-zero text-[var(--card-foreground)] mt-1">Cashflow</h2>
      </motion.div>

      <motion.div className="flex flex-col gap-4 md:gap-6 relative z-10" variants={pageSection}>
        <div className="bento-card">
          <h3 className="text-heading slashed-zero text-[var(--card-foreground)] mb-4">Flow Diagram</h3>
          {sankeyData.links.length > 0 ? (
            <div role="img" aria-label="Cashflow Sankey diagram showing income sources, essential expenses, debt and savings, and disposable income allocation">
              <div
                ref={sankeyWrapRef}
                style={{ position: 'relative' }}
                onMouseMove={(e) => {
                  if (!sankeyWrapRef.current) return;
                  const rect = sankeyWrapRef.current.getBoundingClientRect();
                  setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
                onMouseLeave={() => {
                  setMousePos(null);
                  setHoveredLink(null);
                }}
              >
                <ResponsiveContainer width="100%" height={480}>
                  <Sankey
                    data={sankeyData}
                    nodePadding={18}
                    nodeWidth={16}
                    iterations={64}
                    margin={{ top: 10, left: 120, right: 160, bottom: 10 }}
                    node={<CustomNode
                      palette={pal}
                      hoveredNodeIdx={hoveredNode?.idx ?? null}
                      onNodeHover={(idx, x, y, w, h) => {
                        setHoveredNode({ idx, x, y, w, h });
                        setActiveNode(a => a?.idx === idx ? a : null);
                      }}
                      onNodeUnhover={() => setHoveredNode(null)}
                      onNodeClick={(idx, x, y, w, h) => {
                        setHoveredNode(null);
                        setActiveLink(null);
                        setActiveNode(a => a?.idx === idx ? null : { idx, x, y, w, h });
                      }}
                    />}
                    link={<CustomLink
                      palette={pal}
                      hoveredNodeIdx={hoveredNode?.idx ?? null}
                      activeLinkIdx={activeLink?.idx ?? null}
                      onLinkHover={(idx) => setHoveredLink(idx)}
                      onLinkUnhover={() => setHoveredLink(null)}
                      onLinkClick={(idx) => {
                        if (!mousePos) return;
                        setHoveredNode(null);
                        setActiveNode(null);
                        setActiveLink(a => a?.idx === idx ? null : { idx, x: mousePos.x, y: mousePos.y });
                      }}
                    />}
                  />
                </ResponsiveContainer>

                {/* Hover tooltip */}
                {hoveredNode && (() => {
                  const nodeName = sankeyData.nodes[hoveredNode.idx]?.name ?? '';
                  const incomingAmount = sankeyData.links.filter(l => l.target === hoveredNode.idx).reduce((s, l) => s + l.value, 0);
                  const outgoingAmount = sankeyData.links.filter(l => l.source === hoveredNode.idx).reduce((s, l) => s + l.value, 0);
                  const displayAmount = incomingAmount > 0 ? incomingAmount : outgoingAmount;
                  const pct = income?.total ? Math.round((displayAmount / income.total) * 100) : 0;
                  const isLeftCol = hoveredNode.x < 20;
                  const tipLeft = isLeftCol
                    ? SANKEY_MARGIN.left + hoveredNode.x + hoveredNode.w + 8
                    : SANKEY_MARGIN.left + hoveredNode.x + hoveredNode.w / 2;
                  const tipTop = isLeftCol
                    ? SANKEY_MARGIN.top + hoveredNode.y + hoveredNode.h / 2
                    : hoveredNode.y < 80
                      ? SANKEY_MARGIN.top + hoveredNode.y + hoveredNode.h + 8
                      : SANKEY_MARGIN.top + hoveredNode.y - 8;
                  const tipTransform = isLeftCol
                    ? 'translateY(-50%)'
                    : hoveredNode.y < 80 ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)';
                  return (
                    <div
                      style={{
                        position: 'absolute',
                        left: tipLeft,
                        top: tipTop,
                        transform: tipTransform,
                        background: 'var(--card-solid)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-base)',
                        boxShadow: 'var(--shadow-md)',
                        padding: '8px 12px',
                        pointerEvents: 'none',
                        zIndex: 50,
                        minWidth: 120,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--tertiary)', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{nodeName}</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)' }}>{formatInr(displayAmount)}</div>
                      <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--accent)' }}>{pct}% of income</div>
                    </div>
                  );
                })()}

                {/* Link hover tooltip — suppress if that link is actively clicked */}
                {hoveredLink !== null && mousePos && hoveredLink !== activeLink?.idx && (() => {
                  const link = sankeyData.links[hoveredLink];
                  if (!link) return null;
                  const srcName = sankeyData.nodes[link.source]?.name ?? '';
                  const tgtName = sankeyData.nodes[link.target]?.name ?? '';
                  return (
                    <div
                      style={{
                        position: 'absolute',
                        left: mousePos.x,
                        top: mousePos.y - 10,
                        transform: 'translateX(-50%) translateY(-100%)',
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        boxShadow: 'var(--shadow-sm)',
                        padding: '4px 10px',
                        pointerEvents: 'none',
                        zIndex: 50,
                        whiteSpace: 'nowrap',
                        fontSize: 'var(--text-2xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      {srcName} → {tgtName} · {formatInr(link.value)}
                    </div>
                  );
                })()}

                {/* Click popover */}
                {activeNode && (() => {
                  const nodeName = sankeyData.nodes[activeNode.idx]?.name ?? '';
                  const kind: NodeKind = (sankeyData.nodes[activeNode.idx] as { kind?: NodeKind })?.kind ?? 'free-cash';
                  const incomingAmount = sankeyData.links.filter(l => l.target === activeNode.idx).reduce((s, l) => s + l.value, 0);
                  const outgoingAmount = sankeyData.links.filter(l => l.source === activeNode.idx).reduce((s, l) => s + l.value, 0);
                  const displayAmount = incomingAmount > 0 ? incomingAmount : outgoingAmount;
                  const pct = income?.total ? Math.round((displayAmount / income.total) * 100) : 0;
                  const childLinks = sankeyData.links.filter(l => l.source === activeNode.idx);

                  const CHART_H = 480;
                  const POPOVER_EST_H = 220;
                  const POPOVER_MAX_W = 260;
                  const wrapperW = sankeyWrapRef.current?.offsetWidth ?? 800;
                  const isLeftCol = activeNode.x < 20;
                  const nodeTopPx = SANKEY_MARGIN.top + activeNode.y;
                  const nodeBottomPx = nodeTopPx + activeNode.h;
                  const nodeCenterY = nodeTopPx + activeNode.h / 2;

                  let popLeft: number, popTop: number, popTransform: string;
                  if (isLeftCol) {
                    // Position to the right of the node; compute absolute top (no CSS transform)
                    // so motion scale animation doesn't conflict with translateY(-50%)
                    popLeft = Math.min(
                      SANKEY_MARGIN.left + activeNode.x + activeNode.w + 16,
                      wrapperW - POPOVER_MAX_W - 8,
                    );
                    popTop = Math.min(Math.max(nodeCenterY - POPOVER_EST_H / 2, 10), CHART_H - POPOVER_EST_H - 10);
                    popTransform = 'none';
                  } else {
                    const canFitBelow = CHART_H - nodeBottomPx >= POPOVER_EST_H;
                    popLeft = Math.min(Math.max(SANKEY_MARGIN.left + activeNode.x + activeNode.w / 2, 140), wrapperW - 140);
                    popTop = canFitBelow ? nodeBottomPx + 12 : nodeTopPx - 12;
                    popTransform = canFitBelow ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)';
                  }

                  const badgeColors: Record<NodeKind, { bg: string; color: string; label: string }> = {
                    'income-leaf':  { bg: 'var(--accent-subtle)',           color: 'var(--accent)',               label: 'Income' },
                    'income-merge': { bg: 'var(--accent-subtle)',           color: 'var(--accent)',               label: 'Income' },
                    'expense-agg':  { bg: 'var(--amber-subtle)',            color: 'var(--amber-text)',           label: 'Expenses' },
                    'expense-leaf': { bg: 'var(--amber-subtle)',            color: 'var(--amber-text)',           label: 'Expense' },
                    'debt-agg':     { bg: 'var(--red-subtle)',              color: 'var(--red-text)',             label: 'Debt' },
                    'debt-item':    { bg: 'var(--red-subtle)',              color: 'var(--red-text)',             label: 'Debt' },
                    'goal-agg':     { bg: 'var(--tertiary-accent-subtle)',  color: 'var(--tertiary-accent-text)', label: 'Goals' },
                    'goal-item':    { bg: 'var(--tertiary-accent-subtle)',  color: 'var(--tertiary-accent-text)', label: 'Goal' },
                    'surplus':      { bg: 'var(--secondary-accent-subtle)', color: 'var(--secondary-accent)',     label: 'Surplus' },
                    'disposable':   { bg: 'var(--surface-hover)',           color: 'var(--tertiary)',             label: 'Disposable' },
                    'free-cash':    { bg: 'var(--green-subtle)',            color: 'var(--green-text)',           label: 'Free Cash' },
                  };
                  const badge = badgeColors[kind];

                  const fieldMap: Record<string, Array<{ key: keyof ExpenseProfile; label: string }>> = {
                    'Housing & Utilities': [{ key: 'rent', label: 'Rent / Housing' }, { key: 'utilities', label: 'Utilities' }],
                    'Food': [{ key: 'food', label: 'Food & Groceries' }],
                    'Transport': [{ key: 'transport', label: 'Transport' }],
                    'Other Expenses': [{ key: 'entertainment', label: 'Entertainment' }, { key: 'other', label: 'Other' }],
                  };

                  const isAggregate = kind === 'expense-agg' || kind === 'debt-agg' || kind === 'goal-agg' || kind === 'income-merge' || kind === 'disposable';
                  const isReadonly = kind === 'debt-item' || kind === 'goal-item' || kind === 'surplus' || kind === 'free-cash';

                  return (
                    <motion.div
                      key={activeNode.idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.12 }}
                      style={{
                        position: 'absolute',
                        left: popLeft,
                        top: popTop,
                        transform: popTransform,
                        background: 'var(--card-solid)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        padding: '12px 14px',
                        zIndex: 60,
                        minWidth: 200,
                        maxWidth: 260,
                      }}
                    >
                      {/* Badge */}
                      <div style={{ display: 'inline-block', fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-bold)', background: badge.bg, color: badge.color, borderRadius: 'var(--radius-xs)', padding: '2px 6px', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {badge.label}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', marginBottom: 2 }}>{nodeName}</div>
                      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--tertiary)', marginBottom: 10 }}>{pct}% of monthly income</div>

                      {/* Income leaf: single editable input */}
                      {kind === 'income-leaf' && (
                        <>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                            <input
                              style={{ flex: 1, border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', background: 'var(--surface-hover)', fontFamily: 'inherit', outline: 'none' }}
                              value={editValues[nodeName] ?? String(displayAmount)}
                              onChange={e => setEditValues(v => ({ ...v, [nodeName]: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  const v = Number(String(editValues[nodeName] ?? displayAmount).replace(/,/g, ''));
                                  if (!isNaN(v) && v > 0) handleSaveIncome(nodeName, v);
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                const v = Number(String(editValues[nodeName] ?? displayAmount).replace(/,/g, ''));
                                if (!isNaN(v) && v > 0) handleSaveIncome(nodeName, v);
                              }}
                              style={{ background: 'var(--accent)', color: 'var(--on-accent)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-bold)', cursor: 'pointer' }}
                            >
                              Save
                            </button>
                          </div>
                          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--tertiary)' }}>Plan recalculates on save</div>
                        </>
                      )}

                      {/* Expense leaf: one or two editable inputs */}
                      {kind === 'expense-leaf' && (() => {
                        const fields = fieldMap[nodeName] ?? [];
                        return (
                          <>
                            {fields.map(f => (
                              <div key={String(f.key)} style={{ marginBottom: 6 }}>
                                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--tertiary)', marginBottom: 2 }}>{f.label}</div>
                                <input
                                  style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', background: 'var(--surface-hover)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                                  value={editValues[String(f.key)] ?? String((expenses as Record<string, number>)[String(f.key)] ?? 0)}
                                  onChange={e => setEditValues(v => ({ ...v, [String(f.key)]: e.target.value }))}
                                />
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const partial: Partial<ExpenseProfile> = {};
                                for (const f of fields) {
                                  const raw = editValues[String(f.key)] ?? String((expenses as Record<string, number>)[String(f.key)] ?? 0);
                                  const v = Number(String(raw).replace(/,/g, ''));
                                  if (!isNaN(v) && v >= 0) (partial as Record<string, number>)[String(f.key)] = v;
                                }
                                handleSaveExpenses(partial);
                              }}
                              style={{ width: '100%', background: 'var(--amber)', color: 'var(--on-accent)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '5px', fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-bold)', cursor: 'pointer', marginBottom: 4 }}
                            >
                              Save
                            </button>
                            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--tertiary)' }}>Plan recalculates on save</div>
                          </>
                        );
                      })()}

                      {/* Aggregate: child breakdown list */}
                      {isAggregate && (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                            {childLinks.map(l => (
                              <div key={l.target} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-2xs)', color: 'var(--secondary)' }}>
                                <span>{sankeyData.nodes[l.target]?.name}</span>
                                <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{formatInr(l.value)}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)' }}>
                            <span>Total</span>
                            <span>{formatInr(displayAmount)}</span>
                          </div>
                          {childLinks.length > 0 && kind === 'expense-agg' && (
                            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--tertiary)', marginTop: 6 }}>Click a sub-node to edit amounts</div>
                          )}
                        </>
                      )}

                      {/* Read-only nodes */}
                      {isReadonly && (
                        <>
                          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', marginBottom: 4 }}>{formatInr(displayAmount)}</div>
                          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--tertiary)' }}>
                            {kind === 'debt-item' && 'Manage debt on the Debt screen →'}
                            {kind === 'goal-item' && 'Manage goals on the Journey screen →'}
                            {kind === 'surplus' && 'Adjust in Settings → Surplus Reserve'}
                            {kind === 'free-cash' && 'Disposable income after all allocations'}
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })()}

                {/* Link click popover */}
                {activeLink && (() => {
                  const link = sankeyData.links[activeLink.idx];
                  if (!link) return null;
                  const srcName = sankeyData.nodes[link.source]?.name ?? '';
                  const tgtName = sankeyData.nodes[link.target]?.name ?? '';
                  const pct = income?.total ? Math.round((link.value / income.total) * 100) : 0;
                  const CHART_H = 480;
                  const atBottom = activeLink.y > CHART_H - 100;
                  return (
                    <motion.div
                      key={activeLink.idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.12 }}
                      style={{
                        position: 'absolute',
                        left: activeLink.x,
                        top: atBottom ? activeLink.y - 10 : activeLink.y - 10,
                        transform: atBottom ? 'translateX(-50%) translateY(-100%)' : 'translateX(-50%) translateY(-100%)',
                        background: 'var(--card-solid)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        padding: '10px 14px',
                        zIndex: 60,
                        minWidth: 160,
                        maxWidth: 200,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--tertiary)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{srcName} → {tgtName}</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', marginBottom: 2 }}>{formatInr(link.value)}</div>
                      <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--accent)' }}>{pct}% of income</div>
                    </motion.div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div
              role="status"
              className="flex items-center justify-center h-48 text-sm text-[var(--secondary)] rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]"
            >
              {totalIncome <= 0
                ? 'Income data not available. Complete onboarding to see your cashflow.'
                : 'No cashflow data available.'}
            </div>
          )}
          {totalIncome > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col gap-2">
              <p className="text-xs text-[var(--card-foreground)]">
                <strong>Essential Expenses</strong> {formatInr(totalExpensesDeduped)} ({Math.round((totalExpensesDeduped / totalIncome) * 100)}% of income): Housing, Food, Transport, Other
              </p>
              {debtPayments > 0 && (
                <p className="text-xs text-[var(--card-foreground)]">
                  <strong>Debt</strong> {formatInr(debtPayments)} ({Math.round((debtPayments / totalIncome) * 100)}% of income): Debt Payments
                </p>
              )}
              {goalAllocationsTotal > 0 && (
                <p className="text-xs text-[var(--card-foreground)]">
                  <strong>Goals</strong> {formatInr(goalAllocationsTotal)} ({Math.round((goalAllocationsTotal / totalIncome) * 100)}% of income): Goal Allocations
                </p>
              )}
              {surplusReserve > 0 && (
                <p className="text-xs text-[var(--card-foreground)]">
                  <strong>Surplus Reserve</strong> {formatInr(surplusReserve)} ({Math.round((surplusReserve / totalIncome) * 100)}% of income)
                </p>
              )}
              <p className="text-xs text-[var(--card-foreground)]">
                <strong>Disposable</strong> {formatInr(disposable)} ({Math.round((disposable / totalIncome) * 100)}% of income): Unallocated free cash
              </p>
            </div>
          )}
        </div>

        {activeGoals.length > 0 && (
          <div className="bento-card">
            <h3 className="text-heading slashed-zero text-[var(--card-foreground)] mb-4">Goal Allocations</h3>
            <div className="flex flex-col gap-2">
              {activeGoals.map(g => (
                <div
                  key={g.id}
                  className="flex items-center gap-4 p-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]"
                >
                  <p className="text-xs font-semibold flex-1 min-w-0 truncate">
                    {g.name}
                  </p>

                  <div className="flex-[2] flex flex-col">
                    <div className="h-2 rounded-full bg-[var(--surface-tint)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)] rounded-full transition-[width] duration-600 ease"
                        style={{ width: `${g.progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right min-w-20">
                    <p className="font-display text-xs font-bold leading-none slashed-zero">
                      {formatInr(g.alloc)}<span className="font-body font-normal text-[var(--text-2xs)] text-[var(--neutral-400)]">/mo</span>
                    </p>
                    {g.completionDate && (
                      <p className="text-[var(--text-2xs)] text-[var(--neutral-400)] mt-0.5">{g.completionDate}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bento-card penny-card flex flex-col gap-4">
          <div className="penny-insight-blob" />
          <div className="relative z-10 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--penny-accent-subtle)] text-[var(--penny-accent)]">
              <Sparkles size={18} className="icon-wireframe" />
            </div>
            <h3 className="text-heading slashed-zero text-[var(--card-foreground)]">Penny's Insight</h3>
          </div>
          {dti > 40 && (
            <div className="relative z-10 flex items-start gap-3 p-3 rounded-md text-sm bg-[var(--surface-hover)] border border-[var(--red)] text-[var(--red-text)]">
              <AlertTriangle size={18} className="icon-wireframe flex-shrink-0 mt-0.5" />
              <span>High debt burden: DTI ratio is {dti}%. Consider reducing discretionary spending and prioritising high-interest debt payoff.</span>
            </div>
          )}
          <ul role="list" className="relative z-10 flex flex-col gap-3 list-none p-0 m-0">
            {cashflowInsights.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 p-3 rounded-md text-sm bg-[var(--surface-hover)] border border-[var(--border)] font-body text-[var(--card-foreground)]">
                <span className="text-[var(--penny-accent)] mt-0.5 font-bold">{i + 1}.</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}
