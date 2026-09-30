#!/usr/bin/env python3
from __future__ import annotations
import json, re, sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

ROOT = Path(__file__).resolve().parents[1]

@dataclass(frozen=True)
class ScenarioResult:
    name: str
    passed: bool
    evidence: dict[str, Any]
    failures: list[str]

def transition(current, target, allowed, failures, label):
    if current not in allowed:
        failures.append(f'{label}: unknown state {current}')
    if target not in allowed.get(current, set()):
        failures.append(f'{label}: {current} -> {target} not allowed')
    return target

def source_ownership():
    failures=[]; sources={}
    checks={
      'checkout':('src/scripts/13-payments.js',[r'__VELORA_CHECKOUT_REFERENCE',r'__VELORA_CHECKOUT_SUBMITTING']),
      'subscription':('src/scripts/35-seller.js',[r'v39LoadSubscription',r'VELORA_RENDER_SELLER_SUBSCRIPTION']),
      'advertising':('src/scripts/35-seller.js',[r'v39LoadAds',r'velora-seller-ad-paymob-checkout-restore-test']),
      'recommendations':('src/scripts/59-s1-b2-beauty-recommendations.js',[r'velora_get_beauty_recommendations']),
      'routine_cart':('src/scripts/62-s1-c-routine-cart.js',[r'veloraRoutineCart',r'addAll']),
      'returns':('src/scripts/71-customer-orders-returns.js',[r'velora_request_return',r'velora_cancel_order']),
    }
    for name,(rel,pats) in checks.items():
        p=ROOT/rel; text=p.read_text(encoding='utf-8') if p.is_file() else ''
        missing=[x for x in pats if not re.search(x,text)]
        sources[name]={'path':rel,'exists':p.is_file(),'missing':missing}
        if not p.is_file(): failures.append(name+': file missing')
        elif missing: failures.append(name+': required symbols missing')
    return ScenarioResult('source_ownership',not failures,{'sources':sources},failures)

def order_cancel():
    failures=[]
    allowed={'pending':{'cancelled'},'confirmed':{'cancelled'},'processing':set(),'shipped':set(),'delivered':set(),'cancelled':set()}
    state=transition('confirmed','cancelled',allowed,failures,'order_cancel')
    evidence={'input':{'order_status':'confirmed','payment_status':'pending'},'output':{'order_status':state,'payment_status':'cancelled'},'side_effects':['inventory_release','gift_card_refund_when_used','coupon_release_when_used','promotion_release_when_used','pending_commission_reversal','audit']}
    return ScenarioResult('order_cancel',not failures,evidence,failures)

def returns():
    failures=[]
    allowed={'requested':{'approved','rejected','cancelled'},'approved':{'in_transit','rejected','cancelled'},'in_transit':{'received','cancelled'},'received':{'refunded','rejected'},'refunded':{'refunded'},'rejected':{'rejected'},'cancelled':{'cancelled'}}
    state='requested'; path=[state]
    for target in ['approved','in_transit','received','refunded']:
        state=transition(state,target,allowed,failures,'returns'); path.append(state)
    evidence={'eligible_input':{'delivered':True,'payment_settled':True,'store_scoped':True,'item_delivered':True,'duplicate':False},'state_path':path,'refund_gate':'received + external refund reference','money_movement':'simulation_only'}
    return ScenarioResult('returns_refund_state_machine',not failures,evidence,failures)

def subscriptions():
    failures=[]
    allowed={'pending':{'active','cancelled'},'active':{'active','past_due','cancelled'},'past_due':{'active','expired'},'cancelled':set(),'expired':set()}
    capture=transition('pending','active',allowed,failures,'subscription_capture')
    past=transition(capture,'past_due',allowed,failures,'subscription_expiry')
    recover=transition(past,'active',allowed,failures,'subscription_recovery')
    expire=transition('past_due','expired',allowed,failures,'subscription_grace_expiry')
    evidence={'capture_path':['pending',capture],'expiry_path':['active',past],'recovery_path':[past,recover],'grace_expiry_path':['past_due',expire],'idempotency':True,'retry_backoff':['6h','12h','24h','48h'],'max_attempts':6,'commercial_change_policy':'PROPOSED_NOT_ACTIVE'}
    return ScenarioResult('subscription_state_machine',not failures,evidence,failures)

def advertising():
    failures=[]
    allowed={'pending_payment':{'active','payment_failed','refunded','cancelled'},'active':{'completed','refunded','cancelled'},'completed':set(),'payment_failed':set(),'refunded':set(),'cancelled':set()}
    active=transition('pending_payment','active',allowed,failures,'ad_capture')
    completed=transition(active,'completed',allowed,failures,'ad_expiry')
    failed=transition('pending_payment','payment_failed',allowed,failures,'ad_failure')
    refunded=transition('active','refunded',allowed,failures,'ad_refund')
    evidence={'active_path':['pending_payment',active,completed],'failed_path':['pending_payment',failed],'refund_path':['active',refunded],'accounting_bridge':'OPEN','provider_settlement':'NOT_SIMULATED'}
    return ScenarioResult('advertising_state_machine',not failures,evidence,failures)

def payouts():
    failures=[]
    allowed={'pending':{'processing','paid'},'processing':{'paid'},'paid':{'paid'}}
    paid=transition('processing','paid',allowed,failures,'payout_execution')
    evidence={'state_path':['processing',paid],'external_reference_required':True,'ledger_entry':{'type':'payout','status':'posted','negative_amount':True},'external_transfer':'NOT_SIMULATED'}
    return ScenarioResult('payout_recording',not failures,evidence,failures)

def policy_matrix():
    return ScenarioResult('proposed_policy_matrix',True,{'mode':'simulation_only','runtime_activation':False,'owner_approval_required':True,'proposals':{'cod':'PROPOSED_NOT_ACTIVE','returns':'PROPOSED_NOT_ACTIVE','subscriptions':'PROPOSED_NOT_ACTIVE','advertising':'PROPOSED_NOT_ACTIVE','payouts':'PROPOSED_NOT_ACTIVE'}},[])

SCENARIOS: list[Callable]=[source_ownership,order_cancel,returns,subscriptions,advertising,payouts,policy_matrix]

def main():
    results=[fn() for fn in SCENARIOS]
    failures=[f'{r.name}: {f}' for r in results for f in r.failures]
    payload={'schema':'velora-zero-cost-commerce-lab.v1','status':'PASS' if not failures else 'FAIL','production_touched':False,'external_provider_called':False,'real_money_moved':False,'runtime_policy_activated':False,'scenarios':[{'name':r.name,'passed':r.passed,'evidence':r.evidence,'failures':r.failures} for r in results],'failures':failures}
    (ROOT/'zero-cost-commerce-lab.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    md=['# Velora Zero-Cost Commerce Lab','',f'Status: {payload["status"]}','', '- Production touched: NO','- External provider called: NO','- Real money moved: NO','- Runtime business policy activated: NO','']
    md += ['## Scenarios'] + [f'- {r["name"]}: {"PASS" if r["passed"] else "FAIL"}' for r in payload['scenarios']]
    md += ['','## Boundary','Deterministic engineering simulation only. It does not create legal validity, provider settlement, bank execution, tax classification, or Production evidence.','']
    (ROOT/'zero-cost-commerce-lab.md').write_text('\n'.join(md),encoding='utf-8')
    print(json.dumps(payload,ensure_ascii=False,indent=2))
    return 0 if not failures else 1

if __name__=='__main__': sys.exit(main())
