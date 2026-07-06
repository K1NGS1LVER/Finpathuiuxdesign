import { describe, it, expect, beforeEach } from 'vitest';
import { prepareApply, normalizeDebtCategory } from '../proposal-apply';
import { useFinPathStore } from '../store';
import type { Goal } from '../types';

function seedGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1700000000000-0',
    name: 'Emergency Fund',
    icon: 'Target',
    category: 'savings',
    targetAmount: 300_000,
    currentAmount: 100_000,
    timelineMonths: 24,
    priority: 1,
    status: 'in-progress',
    monthlyAllocation: 10_000,
    color: 'var(--accent)',
    ...overrides,
  };
}

beforeEach(() => {
  useFinPathStore.setState({ goals: [seedGoal()] });
});

describe('prepareApply — goal existence validation', () => {
  it('rejects updateGoal for an unknown goal id instead of fake-approving', () => {
    const result = prepareApply('updateGoal', {
      id: 'goal-1',
      updates: { targetAmount: 150_000 },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/not found/);
  });

  it('rejects removeGoal for an unknown goal id', () => {
    const result = prepareApply('removeGoal', { id: 'nope' });
    expect(result.ok).toBe(false);
  });

  it('rejects addLumpsum for an unknown goal id', () => {
    const result = prepareApply('addLumpsum', { goalId: 'nope', amount: 5000 });
    expect(result.ok).toBe(false);
  });

  it('applies updateGoal with a real id and mutates the store', () => {
    const result = prepareApply('updateGoal', {
      id: 'goal-1700000000000-0',
      updates: { targetAmount: 350_000 },
    });
    expect(result.ok).toBe(true);
    if (result.ok) result.apply();
    const goal = useFinPathStore.getState().goals[0];
    expect(goal.targetAmount).toBe(350_000);
  });

  it('applies addLumpsum with a real id', () => {
    const result = prepareApply('addLumpsum', {
      goalId: 'goal-1700000000000-0',
      amount: 25_000,
    });
    expect(result.ok).toBe(true);
    if (result.ok) result.apply();
    const goal = useFinPathStore.getState().goals[0];
    expect(goal.currentAmount).toBeGreaterThanOrEqual(125_000);
  });

  it('applies removeGoal with a real id', () => {
    const result = prepareApply('removeGoal', { id: 'goal-1700000000000-0' });
    expect(result.ok).toBe(true);
    if (result.ok) result.apply();
    expect(
      useFinPathStore.getState().goals.find((g) => g.id === 'goal-1700000000000-0'),
    ).toBeUndefined();
  });
});

describe('prepareApply — payload normalization', () => {
  it('coerces stringified numbers and alias field names in updateGoal', () => {
    const result = prepareApply('updateGoal', {
      id: 'goal-1700000000000-0',
      updates: { target: '450000' },
    });
    expect(result.ok).toBe(true);
    if (result.ok) result.apply();
    expect(useFinPathStore.getState().goals[0].targetAmount).toBe(450_000);
  });

  it('rejects updateGoal with no recognizable fields', () => {
    const result = prepareApply('updateGoal', {
      id: 'goal-1700000000000-0',
      updates: { bogus: 1 },
    });
    expect(result.ok).toBe(false);
  });

  it('rejects an invalid strategy', () => {
    expect(prepareApply('setStrategy', { strategy: 'yolo' }).ok).toBe(false);
  });

  it('accepts addDebt with negative amount by coercing to positive principal', () => {
    const result = prepareApply('addDebt', {
      debt: { name: 'Personal loan', amount: -10_000, category: 'personal' },
    });
    expect(result.ok).toBe(true);
  });

  it('rejects an unknown action', () => {
    expect(prepareApply('dropTables', {}).ok).toBe(false);
  });
});

describe('normalizeDebtCategory', () => {
  it('passes through canonical categories', () => {
    expect(normalizeDebtCategory('creditCard')).toBe('creditCard');
  });
  it('maps fuzzy names', () => {
    expect(normalizeDebtCategory('Credit card dues')).toBe('creditCard');
    expect(normalizeDebtCategory('student loan')).toBe('educationLoan');
    expect(normalizeDebtCategory('mystery')).toBe('other');
  });
});
