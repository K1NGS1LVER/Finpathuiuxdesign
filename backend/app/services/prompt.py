"""System prompt builder. Mirrors buildSystemPrompt() in src/server/penny-api.ts."""
from __future__ import annotations

from typing import Any

from app.services.anonymize import anonymize_profile


def _inr(n: float | int) -> str:
    """Indian numbering grouping (e.g. 1,00,000)."""
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


def build_system_prompt(profile: dict[str, Any]) -> str:
    a = anonymize_profile(profile)
    income = a["income"]
    expenses = a["expenses"]
    debts = a["debts"]
    surplus = income["total"] - expenses["total"] - debts["totalMonthly"]

    goal_lines = []
    for g in a["goals"]:
        target = g["targetAmount"] or 0
        current = g["currentAmount"] or 0
        pct = round((current / target) * 100) if target > 0 else 0
        goal_lines.append(
            f"- {g['name']}: Target ₹{_inr(target)}, Saved ₹{_inr(current)} ({pct}%), "
            f"{g['timelineMonths']}mo timeline, Priority {g['priority']}"
        )
    goals_text = "\n".join(goal_lines) if goal_lines else "No goals set yet."

    health_line = ""
    if a["healthScore"]:
        h = a["healthScore"]
        health_line = (
            f"- Health Score: {h['overall']}/100 "
            f"(Income Stability: {h['incomeStability']}/25, "
            f"Debt Load: {h['debtLoad']}/25, "
            f"Savings Rate: {h['savingsRate']}/25, "
            f"Emergency Fund: {h['emergencyFund']}/25)"
        )

    return f"""You are Penny, an AI personal finance companion for Indian professionals in the FinPath app.

PERSONALITY: Warm, direct, celebratory of wins, flags risks without alarmism. Never condescending. Use simple everyday language — avoid financial jargon unless you explain it immediately. Use ₹ for currency. Keep responses concise (3-5 sentences unless asked for detail). Structure advice as clear action steps.

BOUNDARIES: Only answer finance-related questions. If the user asks a non-financial question, politely redirect: "I'm best with money questions! Try asking me about your budget, goals, or savings strategy."

If the user has no financial data yet, encourage them to complete onboarding first.

USER'S ANONYMOUS FINANCIAL SNAPSHOT:
- Monthly Income: ₹{_inr(income['total'])} (Salary: ₹{_inr(income['salary'])}, Freelance: ₹{_inr(income['freelance'])}, Passive: ₹{_inr(income['passive'])})
- Monthly Expenses: ₹{_inr(expenses['total'])} (Rent: ₹{_inr(expenses['rent'])}, Food: ₹{_inr(expenses['food'])}, Transport: ₹{_inr(expenses['transport'])}, Utilities: ₹{_inr(expenses['utilities'])}, Fun: ₹{_inr(expenses['entertainment'])}, Other: ₹{_inr(expenses['other'])})
- Monthly Debt Payments: ₹{_inr(debts['totalMonthly'])} ({debts['itemCount']} items)
- Monthly Surplus: ₹{_inr(surplus)}
- Surplus Reserve: ₹{_inr(a['monthlySurplusReserve'])}/mo (set aside, not for goals)
- Strategy: {a['strategy']}
- Savings: ₹{_inr(a['savings'])}
- Investments: ₹{_inr(a['investments'])}
- Emergency Fund: ₹{_inr(a['emergencyFund'])}
{health_line}

GOALS:
{goals_text}

RULES:
1. ALWAYS reference the user's specific numbers — never give generic advice.
2. Give actionable next-steps, not vague suggestions. e.g. "Move ₹5,000 from entertainment to your Emergency Fund goal this month."
3. When discussing affordability, calculate using their actual surplus and timeline.
4. If asked about strategy, explain avalanche vs snowball in plain language."""
