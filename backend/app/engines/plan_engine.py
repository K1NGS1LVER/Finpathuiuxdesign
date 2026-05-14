"""Month-by-month financial plan generator — port of src/lib/plan-engine.ts.

The centrepiece: drives the 120-month simulation, weighted goal allocation
(priority + urgency + strategy modifier), per-stream annual income
increments, and step-up vs no-step-up modes.

`monthToDateStr()` is presentational and depends on runtime now(); parity
tests strip `date` keys and `goalCompletionDates` values before comparing.
"""
from __future__ import annotations

import math
from datetime import datetime
from typing import Any

from app.engines._helpers import js_round

_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
_MAX_MONTHS = 120


def _month_to_date_str(offset: int) -> str:
    now = datetime.now()
    month_index = now.month - 1 + offset
    year = now.year + month_index // 12
    month_index = month_index % 12
    return f"{_MONTHS_SHORT[month_index]} {year}"


def _allocate_surplus(
    surplus: float,
    goals: list[dict[str, Any]],
    strategy: str = "avalanche",
) -> dict[str, int]:
    allocations: dict[str, int] = {}
    active = [g for g in goals if g.get("status") != "complete" and g.get("category") != "debt"]
    if not active or surplus <= 0:
        return allocations

    weights: dict[str, float] = {}
    total_weight = 0.0

    for goal in active:
        remaining = max(0, (goal.get("targetAmount") or 0) - (goal.get("currentAmount") or 0))
        if remaining <= 0:
            continue

        priority_weight = 1 / (goal.get("priority") or 1)

        timeline = goal.get("timelineMonths") or 0
        urgency_weight = 1 / math.sqrt(timeline) if timeline > 0 else 0.5

        if strategy == "snowball":
            strategy_modifier = 100000 / (remaining + 1000)
        elif strategy == "avalanche":
            strategy_modifier = 2 if priority_weight > 0.5 else 1
        else:
            strategy_modifier = 1

        weight = priority_weight * urgency_weight * strategy_modifier
        weights[goal["id"]] = weight
        total_weight += weight

    if total_weight > 0:
        for goal in active:
            remaining = max(0, (goal.get("targetAmount") or 0) - (goal.get("currentAmount") or 0))
            if remaining <= 0:
                continue
            share = (weights[goal["id"]] / total_weight) * surplus
            allocations[goal["id"]] = min(js_round(share), remaining)

    return allocations


def generate_plan(input_: dict[str, Any]) -> dict[str, Any]:
    income = input_.get("income") or {}
    expenses = input_.get("expenses") or {}
    debts = input_.get("debts") or {}
    goals = list(input_.get("goals") or [])
    savings = input_.get("savings", 0)
    investments = input_.get("investments", 0)
    strategy = input_.get("strategy", "avalanche")
    monthly_surplus_reserve = input_.get("monthlySurplusReserve", 0)
    pending_reallocation_reserve = input_.get("pendingReallocationReserve", 0)
    step_up_enabled = input_.get("stepUpEnabled", False)

    expenses_total = expenses.get("total") or 0
    debts_total_monthly = debts.get("totalMonthly") or 0
    income_total = income.get("total") or 0

    monthly_expenses_dedup = max(0, expenses_total - debts_total_monthly)
    monthly_surplus = income_total - monthly_expenses_dedup - debts_total_monthly
    reserved_surplus = max(0, monthly_surplus_reserve)
    pending_surplus = max(0, pending_reallocation_reserve)
    available_for_goals = max(0, monthly_surplus - reserved_surplus - pending_surplus)

    months: list[dict[str, Any]] = []
    goal_completion_dates: dict[str, str] = {}

    cumulative_savings = float(savings)
    cumulative_investments = float(investments)
    current_income_total = float(income_total)
    cur_primary = float(income.get("primary") or 0)
    cur_secondary = float(income.get("secondary") or 0)
    cur_passive = float(income.get("passive") or 0)
    variable_percent = income.get("variablePercent") or 0
    base_allocatable_surplus = available_for_goals

    goal_progress: dict[str, float] = {g["id"]: g.get("currentAmount") or 0 for g in goals}

    recommended_allocations = _allocate_surplus(available_for_goals, goals, strategy)

    def all_goals_complete() -> bool:
        return all(
            goal_progress[g["id"]] >= (g.get("targetAmount") or 0) or g.get("status") == "complete"
            for g in goals
        )

    is_debt_over_income = debts_total_monthly > income_total - expenses_total

    for m in range(_MAX_MONTHS):
        milestones: list[str] = []
        if m == 0 and is_debt_over_income:
            # Match TS: number formatted with en-IN locale digit grouping
            formatted = f"{debts_total_monthly:,}".replace(",", ",")
            # JS toLocaleString('en-IN') uses Indian grouping (lakh/crore style).
            # Reproduce: format with Indian grouping.
            formatted = _format_indian(debts_total_monthly)
            milestones.append(
                f"Warning: Your debt payments (₹{formatted}/mo) exceed your available income. Consider restructuring."
            )

        # Apply per-stream annual increments every 12 months
        if m > 0 and m % 12 == 0:
            p_inc = income.get("primaryIncrement") or income.get("expectedAnnualIncrement") or 0
            s_inc = income.get("secondaryIncrement") or 0
            pa_inc = income.get("passiveIncrement") or 0
            if p_inc > 0:
                cur_primary *= 1 + p_inc / 100
            if s_inc > 0:
                cur_secondary *= 1 + s_inc / 100
            if pa_inc > 0:
                cur_passive *= 1 + pa_inc / 100
            cur_variable = js_round(cur_passive * variable_percent / 100)
            current_income_total = cur_primary + cur_secondary + cur_passive + cur_variable
            if p_inc > 0 or s_inc > 0 or pa_inc > 0:
                milestones.append("Annual income increment applied")

        current_monthly_surplus = current_income_total - monthly_expenses_dedup - debts_total_monthly
        surplus = max(0, current_monthly_surplus)
        monthly_reserved_surplus = min(surplus, reserved_surplus)
        after_reserved = max(0, surplus - monthly_reserved_surplus)
        monthly_pending_surplus = min(after_reserved, pending_surplus)
        allocatable_surplus = max(0, after_reserved - monthly_pending_surplus)

        if not step_up_enabled:
            allocatable_surplus = min(allocatable_surplus, base_allocatable_surplus)

        # Build goals snapshot for this month
        goals_snapshot = [
            {**g, "currentAmount": goal_progress[g["id"]]} for g in goals
        ]
        allocations = _allocate_surplus(allocatable_surplus, goals_snapshot, strategy)

        total_allocated = 0
        for goal in goals:
            allocation = allocations.get(goal["id"], 0)
            if goal.get("category") == "debt":
                allocation += goal.get("monthlyAllocation") or 0
            goal_progress[goal["id"]] += allocation
            if goal.get("category") != "debt":
                total_allocated += allocation

            target = goal.get("targetAmount") or 0
            if goal_progress[goal["id"]] >= target and goal["id"] not in goal_completion_dates:
                goal_progress[goal["id"]] = target
                goal_completion_dates[goal["id"]] = _month_to_date_str(m + 1)
                milestones.append(f"{goal.get('name')} completed!")

        unallocated_surplus = allocatable_surplus - total_allocated
        cumulative_savings += max(0, unallocated_surplus)
        cumulative_savings += monthly_reserved_surplus

        total_goal_progress = sum(goal_progress.values())
        net_worth = cumulative_savings + cumulative_investments + total_goal_progress

        cumulative_investments *= 1.01

        months.append({
            "month": m,
            "date": _month_to_date_str(m + 1),
            "income": current_income_total,
            "expenses": expenses_total,
            "debtPayments": debts_total_monthly,
            "surplus": surplus,
            "reservedSurplus": monthly_reserved_surplus,
            "pendingSurplus": monthly_pending_surplus,
            "goalAllocations": dict(allocations),
            "milestones": milestones,
            "cumulativeSavings": js_round(cumulative_savings),
            "netWorth": js_round(net_worth),
        })

        if all_goals_complete():
            if len(months) > len(goal_completion_dates) + 3:
                break

    return {
        "months": months,
        "totalMonths": len(months),
        "goalCompletionDates": goal_completion_dates,
        "recommendedAllocations": recommended_allocations,
    }


def _format_indian(n: int | float) -> str:
    """Indian digit grouping (lakh/crore style) to match JS toLocaleString('en-IN')."""
    try:
        x = int(round(float(n)))
    except (TypeError, ValueError):
        return "0"
    neg = x < 0
    s = str(abs(x))
    if len(s) <= 3:
        out = s
    else:
        head, tail = s[:-3], s[-3:]
        groups: list[str] = []
        while len(head) > 2:
            groups.insert(0, head[-2:])
            head = head[:-2]
        if head:
            groups.insert(0, head)
        out = ",".join(groups) + "," + tail
    return f"-{out}" if neg else out


def generate_scenario_plan(base_input: dict[str, Any], modifications: dict[str, Any]) -> dict[str, Any]:
    modified = dict(base_input)
    base_income = dict(base_input.get("income") or {})
    base_expenses = dict(base_input.get("expenses") or {})

    income_change = modifications.get("incomeChange")
    if income_change is not None:
        factor = 1 + income_change / 100
        new_passive = js_round((base_income.get("passive") or 0) * factor)
        variable_percent = base_income.get("variablePercent") or 0
        new_variable = js_round(new_passive * variable_percent / 100)
        modified["income"] = {
            **base_income,
            "primary": js_round((base_income.get("primary") or 0) * factor),
            "secondary": js_round((base_income.get("secondary") or 0) * factor),
            "passive": new_passive,
            "variable": new_variable,
            "total": js_round((base_income.get("total") or 0) * factor),
        }

    expense_change = modifications.get("expenseChange")
    if expense_change is not None:
        factor = 1 + expense_change / 100
        modified["expenses"] = {
            **base_expenses,
            "rent": js_round((base_expenses.get("rent") or 0) * factor),
            "food": js_round((base_expenses.get("food") or 0) * factor),
            "transport": js_round((base_expenses.get("transport") or 0) * factor),
            "utilities": js_round((base_expenses.get("utilities") or 0) * factor),
            "entertainment": js_round((base_expenses.get("entertainment") or 0) * factor),
            "other": js_round((base_expenses.get("other") or 0) * factor),
            "total": js_round((base_expenses.get("total") or 0) * factor),
        }

    timeline_change = modifications.get("timelineChange")
    if timeline_change is not None:
        modified["goals"] = [
            {**g, "timelineMonths": max(1, (g.get("timelineMonths") or 0) + timeline_change)}
            for g in (base_input.get("goals") or [])
        ]

    return generate_plan(modified)
