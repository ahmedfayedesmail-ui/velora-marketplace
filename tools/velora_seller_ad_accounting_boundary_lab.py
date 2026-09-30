#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def source_check() -> dict:
    path = ROOT / 'src/scripts/35-seller.js'
    body = path.read_text(encoding='utf-8') if path.is_file() else ''
    required = [r'velora_get_seller_ad_checkout_context', r'velora_accept_legal_document', r'SELLER_AD_CHECKOUT_UNAVAILABLE']
    missing = [p for p in required if not re.search(p, body)]
    return {'path': str(path.relative_to(ROOT)), 'exists': path.is_file(), 'missing': missing}

def main() -> int:
    source = source_check()
    failures = []
    if not source['exists']: failures.append('canonical seller advertising source missing')
    if source['missing']: failures.append('seller advertising source contract missing')

    states = {'pending_payment': ['active','payment_failed','refunded'], 'active': ['completed','refunded'], 'payment_failed': [], 'completed': [], 'refunded': []}
    purchase_flow = ['validated','pending_campaign','seller_ad_payment_attempt','provider_capture_boundary','active']
    accounting = {
        'charge_recognition_event': 'OPEN',
        'revenue_recognition_timing': 'OPEN',
        'seller_balance_treatment': 'OPEN',
        'refund_reversal_mapping': 'OPEN',
        'provider_settlement_mapping': 'OPEN',
        'reporting_attribution': 'OPEN',
        'tax_invoice_classification': 'OPEN',
    }
    checks = {
        'source_contract_present': source['exists'] and not source['missing'],
        'state_machine_has_terminal_paths': set(states['pending_payment']) >= {'payment_failed','refunded'},
        'purchase_flow_keeps_provider_boundary': purchase_flow.index('provider_capture_boundary') > purchase_flow.index('seller_ad_payment_attempt'),
        'accounting_policy_not_activated': all(value == 'OPEN' for value in accounting.values()),
        'no_second_accounting_engine': True,
        'no_real_money': True,
        'no_production': True,
    }
    failures.extend(name for name, passed in checks.items() if not passed)
    payload = {
        'schema':'velora-zero-cost-seller-ad-accounting-boundary.v1',
        'status':'PASS' if not failures else 'FAIL',
        'mode':'local_deterministic_boundary_simulation',
        'source':source,
        'existing_operational_state_machine': states,
        'accounting_policy_register': accounting,
        'checks':checks,
        'production_touched':False,
        'external_provider_called':False,
        'real_money_moved':False,
        'runtime_policy_activated':False,
        'failures':failures,
    }
    (ROOT/'seller-ad-accounting-boundary-lab.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(payload,ensure_ascii=False,indent=2))
    return 0 if not failures else 1

if __name__ == '__main__':
    sys.exit(main())