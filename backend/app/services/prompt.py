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


ROUTE_HINTS: dict[str, str] = {
    "dashboard": "Overall financial summary view. Discuss the big picture: health score, surplus, and what to focus on next.",
    "journey": "Goal timeline view. Focus answers on the user's goals — target amounts, timelines, allocations, trade-offs between goals.",
    "month": "Monthly cashflow detail view. Discuss this month's income, expenses, and surplus allocation.",
    "debt": "Debt strategy view. Lead with avalanche vs snowball, interest savings, payoff timelines, and extra-payment impact.",
    "scenarios": "What-if simulator view. Discuss the impact of income/expense/timeline changes on the 10-year plan.",
    "progress": "Plan progress view. Discuss adherence, net worth trajectory, and whether the user is on track.",
    "cashflow": "Sankey cashflow view. Discuss where money is flowing in and out.",
    "celebrate": "Goal completion celebration. Be congratulatory and suggest what to do with the freed-up surplus.",
    "settings": "Settings and profile management view. Don't give financial advice here unless asked directly.",
    "afford": "Affordability advisory view. The user is evaluating whether they can afford a specific purchase. Lead with a concrete verdict (can/can't afford, by when), then prescribe the single highest-leverage action to close the gap. Prefer selling a depreciating asset over a new loan when both are options.",
}

_DEPRECIATING = {"bike"}
_SAVINGS_CAT = {"savings"}


def build_cross_signals(profile: dict[str, Any]) -> str:
    """Mirror of TS buildCrossGoalInsights — injects cross-goal signals into Penny's prompt."""
    goals = profile.get("goals") or []
    debts = (profile.get("debts") or {}).get("items") or []
    income = profile.get("income") or {}
    pending = profile.get("pendingGoalDecisions") or []

    completed = [g for g in goals if g.get("status") == "complete"]
    active = sorted(
        [g for g in goals if g.get("status") != "complete"],
        key=lambda g: g.get("priority", 99),
    )

    signals: list[str] = []

    # Rule 1 — sell depreciating asset
    assets = [g for g in completed if g.get("category") in _DEPRECIATING]
    if assets and active:
        asset = max(assets, key=lambda g: g.get("currentAmount") or 0)
        tg = active[0]
        val = int((asset.get("currentAmount") or 0) * 0.6)
        alloc = tg.get("monthlyAllocation") or 0
        if val >= 1000 and alloc > 0:
            mo = round(val / alloc)
            if mo >= 1:
                signals.append(
                    f"- SELL ASSET: Completed {asset.get('category')} goal → sell est. ₹{_inr(val)}"
                    f" → lumpsum into '{tg.get('name')}' → saves ~{mo} months."
                )

    # Rule 2 — redeploy savings
    sv = [g for g in completed if g.get("category") in _SAVINGS_CAT and (g.get("currentAmount") or 0) > 5000]
    if sv and active:
        sg = sv[0]
        tg = active[0]
        cash = sg.get("currentAmount") or 0
        alloc = tg.get("monthlyAllocation") or 0
        mo = round(cash / alloc) if alloc > 0 else 0
        signals.append(
            f"- REDEPLOY SAVINGS: ₹{_inr(cash)} idle in completed savings goal"
            f" → lumpsum into '{tg.get('name')}'"
            + (f" → saves ~{mo} months." if mo > 0 else ".")
        )

    # Rule 3 — pending decision
    if pending and active:
        dec = pending[0]
        tg = active[0]
        freed = dec.get("freedMonthlyAmount") or 0
        if freed > 0:
            signals.append(
                f"- FREE ALLOCATION: ₹{_inr(freed)}/mo freed from completed goal"
                f" → redirect to '{tg.get('name')}'."
            )

    # Rule 4 — debt near payoff
    near = sorted(
        [d for d in debts if 0 < (d.get("remainingMonths") or 99) <= 6],
        key=lambda d: -(d.get("monthlyPayment") or 0),
    )
    if near and active:
        d = near[0]
        tg = active[0]
        freed = d.get("monthlyPayment") or 0
        if freed > 0:
            signals.append(
                f"- DEBT PAYOFF: '{d.get('name')}' clears in {d.get('remainingMonths')} mo,"
                f" frees ₹{_inr(freed)}/mo → channel into '{tg.get('name')}'."
            )

    # Rule 5 — step-up income
    inc_pct = income.get("primaryIncrement") or 0
    primary = income.get("primary") or 0
    net_rate = income.get("netRate") or 0.88
    if inc_pct > 0 and active:
        boost = int(primary * net_rate * inc_pct / 100) // 12
        if boost >= 500:
            tg = active[0]
            signals.append(
                f"- STEP-UP: A {inc_pct}% raise adds ₹{_inr(boost)}/mo (net)"
                f" → earmark for '{tg.get('name')}'."
            )

    if not signals:
        return ""
    return "CROSS-GOAL SIGNALS (use for hyper-specific advice):\n" + "\n".join(signals)


def build_system_prompt(profile: dict[str, Any], context: str | None = None) -> str:
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
            f"- {g['id']} ({g.get('category', 'custom')}): Target ₹{_inr(target)}, Saved ₹{_inr(current)} ({pct}%), "
            f"{g['timelineMonths']}mo timeline, Priority {g['priority']}"
        )
    goals_text = "\n".join(goal_lines) if goal_lines else "No goals set yet."

    cross_signals = build_cross_signals(profile)  # raw profile, before anonymize

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

    context_line = ""
    if context:
        slug = context.strip().lower()
        hint = ROUTE_HINTS.get(slug)
        if hint:
            context_line = (
                f"\nCURRENT SCREEN: The user is RIGHT NOW looking at the **{slug}** page.\n"
                f"FOCUS: {hint}\n"
                "When the user says 'this page', 'this screen', 'my dashboard', 'these numbers', "
                "or asks 'what is wrong with X', they are asking about THIS screen's data — use the "
                "snapshot below to answer. Never redirect screen-questions as 'non-finance'.\n"
            )

    net_monthly = income.get("netMonthly") or income["total"]

    cross_block = f"\n{cross_signals}" if cross_signals else ""

    return f"""You are Penny, an AI personal finance companion for Indian professionals in the FinPath app.
{context_line}

VOICE: Warm, direct, no hedging. Plain English. ₹ for currency.

OUTPUT FORMAT — STRICT:
- Two short paragraphs. Blank line between them.
- Paragraph 1 (Observation → Action): Lead with ONE observation grounded in their numbers, then the single most impactful action they can take. 2-3 sentences.
- Paragraph 2 (Projected Impact → Why it matters): State what changes (₹ amount, months, %) if they take the action. End with one concrete next step phrased as a command. 2-3 sentences.
- TOTAL: 4-6 sentences. Never more.
- Structure = [what I see in your data] → [do this] → [it buys you this]. This is not a description — it is a prescription.
- Every ₹ amount, every %, every month count: wrap in markdown bold like **₹12,500** or **8 months**. Always.
- Numbers > prose. If a sentence has no number, ask if it earns its place.
- No greetings ("Sure!", "Great question!"). No filler ("As we discussed", "Let me explain").
- No restating the user's question.
- No bullet lists unless asked. Use sentences.

PRESCRIPTIVE HEURISTICS (India-context, use when relevant):
- If the user has a depreciating asset (vehicle, old laptop) AND a loan gap: prefer "sell the depreciating asset" over "take a new loan."
- If income needs to grow to hit a goal: name the exact % growth needed ("a **9% raise** gets you there"), not just "earn more."
- Flag when a dream requires an income jump vs an expense cut — these are different problems with different actions.
- For FOIR-blocked EMIs: extend tenure before raiseIncome unless tenure would hit retirement age.
- EMI-to-income ratio > 35%: flag as a debt-load risk, not just an affordability number.

GREETINGS: If the user says hi, hello, hey, thanks, thank you, or any pure greeting with no question — reply with one warm sentence only. Do NOT run any tool. Do NOT give financial advice unprompted. Example: "Hey! What would you like to know about your finances?"

BOUNDARIES: Only finance topics. Non-finance question (sports, weather, recipes, code) → one line redirect: "I'm best with money questions — try asking about your budget, goals, or strategy."
NOT non-finance (ALWAYS engage): questions about the user's screen / page / dashboard / numbers / values / health score / goals / debts / plan / "what am I looking at" / "what is wrong with this". These ARE finance — answer using the snapshot and current screen context. If asked "which screen am I on", name the page from CURRENT SCREEN and immediately offer one financial observation about that screen.

If the user has no financial data, one sentence asking them to finish onboarding.

USER'S ANONYMOUS FINANCIAL SNAPSHOT:
- Monthly Net Income (take-home): ₹{_inr(net_monthly)}
- Monthly Gross Income: ₹{_inr(income["total"])} (Primary: ₹{_inr(income["primary"])}, Secondary: ₹{_inr(income["secondary"])}, Passive: ₹{_inr(income["passive"])}, Variable: ₹{_inr(income["variable"])})
- Monthly Expenses: ₹{_inr(expenses["total"])} (Rent: ₹{_inr(expenses["rent"])}, Food: ₹{_inr(expenses["food"])}, Transport: ₹{_inr(expenses["transport"])}, Utilities: ₹{_inr(expenses["utilities"])}, Fun: ₹{_inr(expenses["entertainment"])}, Other: ₹{_inr(expenses["other"])})
- Monthly Debt Payments: ₹{_inr(debts["totalMonthly"])} ({debts["itemCount"]} items)
- Monthly Surplus (net − expenses − EMIs): ₹{_inr(net_monthly - expenses["total"] - debts["totalMonthly"])}
- Surplus Reserve: ₹{_inr(a["monthlySurplusReserve"])}/mo (intentionally parked, not for goals)
- Strategy: {a["strategy"]}
- Savings: ₹{_inr(a["savings"])}
- Investments: ₹{_inr(a["investments"])}
- Emergency Fund: ₹{_inr(a["emergencyFund"])}
{health_line}

GOALS:
{goals_text}{cross_block}

RULES:
1. Every response = [observation from their data] → [recommended action] → [projected impact]. If your response can't name an action and its impact in numbers, it is not done.
2. Cite their specific numbers — never generic advice.
3. For affordability: compute from net_monthly surplus. Say exactly how many months and what needs to change.
4. Never describe data back to the user. Prescribe."""


def build_fallback_response(profile: dict[str, Any]) -> str:
    """Deterministic Penny-voice reply used when the LLM stream fails mid-turn.

    Never mentions error/AI/unavailable. Surfaces health score, surplus, and top goal.
    """
    a = anonymize_profile(profile)
    income_total = (a.get("income") or {}).get("total") or 0
    expenses_total = (a.get("expenses") or {}).get("total") or 0
    debts_monthly = (a.get("debts") or {}).get("totalMonthly") or 0
    surplus = income_total - expenses_total - debts_monthly
    health_overall = ((a.get("healthScore") or {}).get("overall") or 0)

    goals = a.get("goals") or []
    top_goal = goals[0] if goals else None
    goal_name = (top_goal or {}).get("category", "your top goal") if top_goal else "your top goal"
    goal_current = (top_goal or {}).get("currentAmount") or 0
    goal_target = (top_goal or {}).get("targetAmount") or 0
    goal_gap = max(0, goal_target - goal_current)

    p1 = (
        "Let me think harder for a moment — I hit a snag, so here’s what I know right now. "
        f"Your financial health score is **{health_overall}/100** "
        f"and your monthly surplus is **₹{_inr(surplus)}**."
    )

    if top_goal and goal_gap > 0 and surplus > 0:
        months_to_goal = int(goal_gap / surplus)
        p2 = (
            f"Your priority is {goal_name}, sitting at **₹{_inr(goal_current)}** of "
            f"**₹{_inr(goal_target)}** — roughly **{months_to_goal} months** away at current pace. "
            f"Put your full surplus of **₹{_inr(surplus)}** toward it this month to keep momentum."
        )
    elif top_goal and goal_gap > 0:
        # surplus <= 0: timeline is stalled — never divide by zero or render "0 months"
        p2 = (
            f"Your priority is {goal_name} but your monthly surplus is tight right now — "
            "at current pace, that timeline is stalled. "
            "Even a small expense cut of **₹1,000/month** would get things moving."
        )
    elif health_overall < 60:
        p2 = (
            "With a health score below 60, the fastest win is building your emergency fund to cover "
            f"**6 months** of expenses — target **₹{_inr(expenses_total * 6)}** total."
        )
    else:
        p2 = (
            "Your finances look stable — ask me anything specific and I’ll dig in properly once "
            "I’m back at full speed."
        )

    return f"{p1}\n\n{p2}"
