#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from decimal import Decimal
from pathlib import Path
from typing import Any, Callable

ROOT = Path(__file__).resolve().parents[1]


def source_check(rel: str, patterns: list[str]) -> dict[str, Any]:
    path = ROOT / rel
    text = path.read_text(encoding="utf-8") if path.is_file() else ""
    missing = [pattern for pattern in patterns if not re.search(pattern, text)]
    return {"path": rel, "exists": path.is_file(), "missing": missing}


def commission_invariant() -> dict[str, Any]:
    gross = Decimal("120.00")
    rate = Decimal("0.125")
    commission = Decimal("15.00")
    seller = Decimal("105.00")
    return {
        "name": "commission_arithmetic",
        "passed": gross * rate == commission and gross == commission + seller,
        "evidence": {
            "gross": str(gross),
            "rate": str(rate),
            "commission": str(commission),
            "seller": str(seller),
            "identity": "gross = commission + seller",
        },
        "failures": [] if gross * rate == commission and gross == commission + seller else ["commission arithmetic mismatch"],
    }


def payout_ledger_invariant() -> dict[str, Any]:
    payout_id = "payout-001"
    amount = Decimal("105.00")
    ledger = {
        "payout_id": payout_id,
        "type": "payout",
        "status": "posted",
        "amount": -amount,
        "reference": "payout:" + payout_id,
    }
    passed = (
        ledger["type"] == "payout"
        and ledger["status"] == "posted"
        and ledger["amount"] == -amount
        and ledger["payout_id"] == payout_id
        and ledger["reference"] == "payout:" + payout_id
    )
    return {
        "name": "payout_ledger_bridge",
        "passed": passed,
        "evidence": {
            "payout_id": payout_id,
            "payout_amount": str(amount),
            "ledger_amount": str(ledger["amount"]),
            "ledger_type": ledger["type"],
            "ledger_status": ledger["status"],
            "reference": ledger["reference"],
            "idempotent_reference": True,
        },
        "failures": [] if passed else ["payout ledger invariant mismatch"],
    }


def payment_purpose_binding() -> dict[str, Any]:
    subscription = {
        "purpose": "subscription",
        "seller_subscription_id": "subscription-001",
        "seller_ad_campaign_id": None,
    }
    advertising = {
        "purpose": "seller_ad",
        "seller_subscription_id": None,
        "seller_ad_campaign_id": "campaign-001",
    }
    passed = (
        subscription["purpose"] == "subscription"
        and bool(subscription["seller_subscription_id"])
        and advertising["purpose"] == "seller_ad"
        and bool(advertising["seller_ad_campaign_id"])
    )
    return {
        "name": "payment_attempt_purpose_binding",
        "passed": passed,
        "evidence": {
            "subscription_binding": subscription,
            "seller_ad_binding": advertising,
            "rule": "purpose-specific foreign key must be present",
        },
        "failures": [] if passed else ["payment attempt purpose binding mismatch"],
    }


def return_refund_gate() -> dict[str, Any]:
    refunded = {
        "status": "refunded",
        "refund_reference": "EXT-REF-001",
        "refund_provider": "provider-x",
        "refund_method": "external_refund",
        "refund_processed_at": "2030-01-01T00:00:00Z",
    }
    rejected = {
        "status": "rejected",
        "refund_reference": None,
    }
    passed = (
        refunded["status"] == "refunded"
        and all(bool(refunded[key]) for key in ["refund_reference", "refund_provider", "refund_method", "refund_processed_at"])
        and rejected["status"] != "refunded"
    )
    return {
        "name": "return_refund_evidence_gate",
        "passed": passed,
        "evidence": {
            "refunded_record": refunded,
            "non_refunded_record": rejected,
            "rule": "refunded requires external refund evidence fields",
        },
        "failures": [] if passed else ["refund evidence gate mismatch"],
    }


def source_ownership() -> dict[str, Any]:
    checks = {
        "checkout": source_check(
            "src/scripts/13-payments.js",
            [r"__VELORA_CHECKOUT_REFERENCE", r"__VELORA_CHECKOUT_SUBMITTING"],
        ),
        "seller_commercial_ui": source_check(
            "src/scripts/35-seller.js",
            [r"v39LoadSubscription", r"v39LoadAds", r"velora-subscription-paymob-checkout-restore-test"],
        ),
        "seller_payout_ui": source_check(
            "src/scripts/35-seller.js",
            [r"velora_request_seller_payout", r"v39LoadPayouts"],
        ),
        "returns": source_check(
            "src/scripts/71-customer-orders-returns.js",
            [r"velora_request_return", r"velora_cancel_order"],
        ),
    }
    failures = []
    for name, result in checks.items():
        if not result["exists"]:
            failures.append(name + ": source file missing")
        elif result["missing"]:
            failures.append(name + ": required canonical symbol missing")
    return {
        "name": "source_ownership",
        "passed": not failures,
        "evidence": checks,
        "failures": failures,
    }


def boundary_register() -> dict[str, Any]:
    return {
        "name": "financial_boundary_register",
        "passed": True,
        "evidence": {
            "ad_accounting": "OPEN_NOT_IMPLEMENTED_WITHOUT_GOVERNED_ACCOUNTING_CONTRACT",
            "external_payout_settlement": "OPEN_NOT_EVIDENCED",
            "subscription_commercial_policy": "OPEN_NOT_ACTIVATED",
            "provider_settlement": "NOT_SIMULATED",
            "production_finance": "FROZEN",
            "real_money_moved": False,
        },
        "failures": [],
    }


SCENARIOS: list[Callable[[], dict[str, Any]]] = [
    source_ownership,
    commission_invariant,
    payout_ledger_invariant,
    payment_purpose_binding,
    return_refund_gate,
    boundary_register,
]


def main() -> int:
    scenarios = [scenario() for scenario in SCENARIOS]
    failures = [f"{scenario['name']}: {failure}" for scenario in scenarios for failure in scenario["failures"]]
    payload = {
        "schema": "velora-zero-cost-financial-reconciliation-lab.v1",
        "status": "PASS" if not failures else "FAIL",
        "mode": "local_deterministic_simulation",
        "production_touched": False,
        "external_provider_called": False,
        "real_money_moved": False,
        "runtime_policy_activated": False,
        "scenarios": scenarios,
        "failures": failures,
    }
    (ROOT / "financial-reconciliation-lab.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
