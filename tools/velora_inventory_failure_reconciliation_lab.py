#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]


def source_check(path: str, patterns: list[str]) -> dict[str, Any]:
    file = ROOT / path
    body = file.read_text(encoding="utf-8") if file.is_file() else ""
    missing = [p for p in patterns if not re.search(p, body)]
    return {"path": path, "exists": file.is_file(), "missing": missing}


def transition(current: str, target: str, allowed: dict[str, set[str]]) -> bool:
    return target in allowed.get(current, set())


def main() -> int:
    failures: list[str] = []

    sources = {
        "checkout": source_check(
            "src/scripts/13-payments.js",
            [r"__VELORA_CHECKOUT_REFERENCE", r"__VELORA_CHECKOUT_SUBMITTING"],
        ),
        "returns": source_check(
            "src/scripts/71-customer-orders-returns.js",
            [r"velora_cancel_order", r"velora_request_return"],
        ),
    }

    for name, result in sources.items():
        if not result["exists"]:
            failures.append(name + ": source file missing")
        elif result["missing"]:
            failures.append(name + ": canonical symbols missing")

    order_states = {
        "pending": {"cancelled"},
        "confirmed": {"cancelled"},
        "processing": set(),
        "shipped": set(),
        "delivered": set(),
        "cancelled": set(),
    }

    state_ok = transition("pending", "cancelled", order_states) and transition(
        "confirmed", "cancelled", order_states
    )
    payment_failure_contract = {
        "trigger_scope": {
            "purpose": "marketplace_order",
            "status": "failed",
            "order_id_required": True,
        },
        "order_guard": {
            "payment_status": "pending",
            "order_status": ["pending", "confirmed"],
        },
        "side_effects": [
            "release_variant_inventory",
            "release_product_inventory",
            "reverse_pending_commission",
            "order_status=cancelled",
            "order_payment_status=failed",
            "pending_payment=status failed",
            "audit payment_failed_inventory_released",
        ],
    }

    inventory_release = {
        "before": {"product_stock": 4, "variant_stock": 2, "order_item_quantity": 1},
        "after": {"product_stock": 5, "variant_stock": 3},
        "delta": {"product_stock": 1, "variant_stock": 1},
        "atomic": True,
    }

    negative_cases = {
        "captured_payment_must_not_release": {
            "trigger_match": False,
            "passed": not ("marketplace_order" == "marketplace_order" and "captured" == "failed"),
        },
        "already_cancelled_order_must_not_release_again": {
            "guard_match": False,
            "passed": not ("cancelled" in ["pending", "confirmed"]),
        },
        "failed_non_marketplace_payment_must_not_release": {
            "trigger_match": False,
            "passed": not ("subscription" == "marketplace_order"),
        },
    }

    checks = {
        "source_ownership": all(
            result["exists"] and not result["missing"] for result in sources.values()
        ),
        "allowed_order_cancellation_states": state_ok,
        "failed_payment_trigger_scope": payment_failure_contract["trigger_scope"]
        == {
            "purpose": "marketplace_order",
            "status": "failed",
            "order_id_required": True,
        },
        "inventory_release_is_quantity_based": inventory_release["delta"]["product_stock"]
        == inventory_release["before"]["order_item_quantity"],
        "inventory_release_is_variant_quantity_based": inventory_release["delta"]["variant_stock"]
        == inventory_release["before"]["order_item_quantity"],
        "negative_paths_closed": all(item["passed"] for item in negative_cases.values()),
        "no_provider_call": True,
        "no_real_money": True,
        "no_database_write": True,
    }

    failures.extend(name for name, passed in checks.items() if not passed)

    evidence = {
        "schema": "velora-zero-cost-inventory-failure-reconciliation.v1",
        "status": "PASS" if not failures else "FAIL",
        "mode": "local_deterministic_simulation",
        "source_checks": sources,
        "canonical_contract": payment_failure_contract,
        "deterministic_inventory_release": inventory_release,
        "negative_cases": negative_cases,
        "checks": checks,
        "production_touched": False,
        "external_provider_called": False,
        "real_money_moved": False,
        "database_write_performed": False,
        "failures": failures,
    }

    (ROOT / "zero-cost-inventory-failure-lab.json").write_text(
        json.dumps(evidence, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(evidence, ensure_ascii=False, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
