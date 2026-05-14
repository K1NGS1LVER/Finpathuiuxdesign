"""POST /api/simulate/* — thin HTTP wrappers around the Python engines.

Phase 2 endpoint surface used by the future LangGraph agent (Phase 3) as
tool implementations. All routes require auth via Supabase JWT
(or AUTH_MOCK during dev).
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.auth import CurrentUser, get_current_user
from app.engines.debt_strategies import avalanche, compare_strategies, snowball
from app.engines.health_score import calculate_health_score
from app.engines.plan_engine import generate_plan, generate_scenario_plan
from app.engines.tax_engine import (
    calculate_new_regime,
    calculate_old_regime,
    compare_tax_regimes,
)

router = APIRouter(prefix="/api/simulate", dependencies=[Depends(get_current_user)])


# ── plan engine ─────────────────────────────────────────────────
class PlanRequest(BaseModel):
    input: dict[str, Any] = Field(alias="input")

    model_config = {"populate_by_name": True}


class ScenarioPlanRequest(BaseModel):
    base: dict[str, Any]
    modifications: dict[str, Any] = Field(default_factory=dict)


@router.post("/plan")
async def simulate_plan(req: PlanRequest) -> dict[str, Any]:
    return generate_plan(req.input)


@router.post("/scenario")
async def simulate_scenario(req: ScenarioPlanRequest) -> dict[str, Any]:
    return generate_scenario_plan(req.base, req.modifications)


# ── debt strategies ─────────────────────────────────────────────
class DebtRequest(BaseModel):
    debts: list[dict[str, Any]] = Field(default_factory=list)
    extra: float = 0


@router.post("/debt/avalanche")
async def simulate_avalanche(req: DebtRequest) -> dict[str, Any]:
    return avalanche(req.debts, req.extra)


@router.post("/debt/snowball")
async def simulate_snowball(req: DebtRequest) -> dict[str, Any]:
    return snowball(req.debts, req.extra)


@router.post("/debt/compare")
async def simulate_debt_compare(req: DebtRequest) -> dict[str, Any]:
    return compare_strategies(req.debts, req.extra)


# ── tax engine ──────────────────────────────────────────────────
class TaxOldRequest(BaseModel):
    grossIncome: float
    deductions: float = 0


class TaxNewRequest(BaseModel):
    grossIncome: float


@router.post("/tax/old")
async def simulate_tax_old(req: TaxOldRequest) -> dict[str, Any]:
    return calculate_old_regime(req.grossIncome, req.deductions)


@router.post("/tax/new")
async def simulate_tax_new(req: TaxNewRequest) -> dict[str, Any]:
    return calculate_new_regime(req.grossIncome)


@router.post("/tax/compare")
async def simulate_tax_compare(req: TaxOldRequest) -> dict[str, Any]:
    return compare_tax_regimes(req.grossIncome, req.deductions)


# ── health score ────────────────────────────────────────────────
class HealthRequest(BaseModel):
    input: dict[str, Any] = Field(alias="input")

    model_config = {"populate_by_name": True}


@router.post("/health")
async def simulate_health(req: HealthRequest) -> dict[str, Any]:
    return calculate_health_score(req.input)
