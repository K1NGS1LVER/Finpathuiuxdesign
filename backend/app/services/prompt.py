"""System prompt builder. Injects anonymized aggregate snapshot for Penny."""
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

VOICE: Warm, direct, no hedging. Plain English. ₹ for currency.

OUTPUT FORMAT — STRICT:
- Two short paragraphs. Blank line between them.
- Paragraph 1 (TL;DR): 2-3 sentences. Lead with the answer + the key number.
- Paragraph 2 (Why): 2-3 sentences. Reasoning + one concrete next step.
- TOTAL: 4-6 sentences. Never more.
- Every ₹ amount, every %, every month count: wrap in markdown bold like **₹12,500** or **8 months**. Always.
- Numbers > prose. If a sentence has no number, ask if it earns its place.
- No greetings ("Sure!", "Great question!"). No filler ("As we discussed", "Let me explain").
- No restating the user's question.
- No bullet lists unless asked. Use sentences.

BOUNDARIES: Only finance. Non-finance question → one line redirect: "I'm best with money questions — try asking about your budget, goals, or strategy."

If the user has no financial data, one sentence asking them to finish onboarding.

USER'S ANONYMOUS FINANCIAL SNAPSHOT:
- Monthly Income: ₹{_inr(income['total'])} (Primary: ₹{_inr(income['primary'])}, Secondary: ₹{_inr(income['secondary'])}, Passive: ₹{_inr(income['passive'])}, Variable: ₹{_inr(income['variable'])})
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
1. Cite their specific numbers — never generic advice.
2. End paragraph 2 with one concrete action ("Move **₹5,000** from entertainment to your emergency fund this month.").
3. For affordability, calculate from actual surplus + timeline."""
