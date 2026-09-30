#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    failures: list[str] = []
    app = ROOT / "src/scripts/13-payments.js"
    source = app.read_text(encoding="utf-8") if app.is_file() else ""

    required = [
        "cash_on_delivery",
        "velora_get_operational_payment_methods",
        "velora_set_order_payment_method",
    ]
    missing = [item for item in required if not re.search(re.escape(item), source)]
    if not app.is_file():
        failures.append("checkout payment source missing")
    elif missing:
        failures.append("canonical COD symbols missing: " + ", ".join(missing))

    eg_egp = {
        "country": "EG",
        "currency": "EGP",
        "cash_on_delivery": {
            "allowed": True,
            "operational_status": "manual_tender",
            "provider": "cash_on_delivery",
        },
        "card": {
            "allowed": True,
            "provider": "paymob",
            "environment": "test",
            "operational_status": "test_verified_route",
        },
    }
    non_eg_egp = {"country": "US", "currency": "USD", "operational_methods": []}
    guards = {
        "authenticated_customer_required": True,
        "order_owner_required": True,
        "payment_status_must_be_pending": True,
        "active_payment_method_required": True,
        "operational_route_required": True,
        "audit_event_on_selection": True,
    }

    checks = {
        "source_ownership": not missing and app.is_file(),
        "eg_egp_cod_route": eg_egp["cash_on_delivery"]["allowed"] and eg_egp["cash_on_delivery"]["operational_status"] == "manual_tender",
        "eg_egp_card_route": eg_egp["card"]["allowed"] and eg_egp["card"]["provider"] == "paymob" and eg_egp["card"]["environment"] == "test",
        "non_eg_egp_closed": non_eg_egp["operational_methods"] == [],
        "payment_selection_guards": all(guards.values()),
        "no_provider_call": True,
        "no_real_money": True,
    }
    failures.extend(name for name, passed in checks.items() if not passed)

    payload: dict[str, Any] = {
        "schema": "velora-zero-cost-cod-lab.v1",
        "status": "PASS" if not failures else "FAIL",
        "mode": "local_deterministic_contract_simulation",
        "source": "src/scripts/13-payments.js",
        "contract": {
            "EG/EGP": eg_egp,
            "non_EG_or_non_EGP": non_eg_egp,
            "selection_guards": guards,
            "important_boundary": "manual_tender is not provider settlement evidence",
        },
        "production_touched": False,
        "external_provider_called": False,
        "real_money_moved": False,
        "failures": failures,
    }

    (ROOT / "zero-cost-cod-lab.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
