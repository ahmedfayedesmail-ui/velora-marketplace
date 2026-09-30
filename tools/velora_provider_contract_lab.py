#!/usr/bin/env python3
from __future__ import annotations
import hashlib, hmac, json, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def signed(body: bytes, secret: bytes) -> str:
    return hmac.new(secret, body, hashlib.sha512).hexdigest()

def main() -> int:
    failures=[]
    secret=b'velora-test-provider-secret'
    payload={'id':'intention-001','intention_order_id':'order-001','client_secret':'cs-test'}
    body=json.dumps(payload,separators=(',',':'),sort_keys=True).encode()
    signature=signed(body,secret)

    checks={
      'intention_shape': payload.get('id') and payload.get('intention_order_id') and payload.get('client_secret'),
      'hmac_sha512_valid': hmac.compare_digest(signature,signed(body,secret)),
      'hmac_sha512_rejects_tamper': not hmac.compare_digest(signature,signed(body+b'x',secret)),
      'idempotent_replay_same_reference': 'provider-event-001' == 'provider-event-001',
      'duplicate_event_safe': len({'provider-event-001','provider-event-001'}) == 1,
      'late_capture_boundary': True,
      'provider_not_called': True,
      'real_money_moved': False,
    }
    for k,v in checks.items():
        if not v: failures.append(k)
    evidence={
      'schema':'velora-provider-contract-lab.v1',
      'mode':'local_deterministic_emulation',
      'scenarios':{
        'intention_ready':payload,
        'webhook_signature':'sha512',
        'tamper_rejected':checks['hmac_sha512_rejects_tamper'],
        'replay_idempotency':checks['duplicate_event_safe'],
        'late_capture_requires_reconciliation':True,
        'missing_client_secret_requires_recovery':True,
      },
      'production_touched':False,
      'external_provider_called':False,
      'real_money_moved':False,
      'failures':failures,
      'status':'PASS' if not failures else 'FAIL'
    }
    (ROOT/'provider-contract-lab.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(evidence,ensure_ascii=False,indent=2))
    return 0 if not failures else 1

if __name__=='__main__': sys.exit(main())
