/**
 * Python script — runs inside an E2B sandbox.
 *
 * Reads /workspace/context.json (injected by execute-agent-action.js) and
 * decides whether to:
 *   1. issue a Shopify refund, OR
 *   2. escalate to a human, OR
 *   3. reject the request.
 *
 * Output: a single JSON line on stdout, e.g.
 *   {"decision":"refunded","refund_id":12345,"amount":42.50,"is_vip":true}
 *
 * Guardrails (read from context.guardrails):
 *   - max_auto_refund_eur (default 100) — auto cap for non-VIP
 *   - vip_threshold_eur (default 500)   — total_spent threshold for VIP
 *   - allowed_reasons (default [])      — if non-empty, reason must match
 */

export const REFUND_WITH_RULES_SCRIPT = `
import json
import sys
from pathlib import Path

import requests

ctx = json.loads(Path('/workspace/context.json').read_text())
shopify_domain = ctx['shopify_domain']
admin_token = ctx['shopify_admin_token']
payload = ctx['payload']
guardrails = ctx.get('guardrails') or {}

order_id = payload['order_id']
reason = payload.get('reason', 'customer_request')
requested_amount = float(payload['amount'])

max_auto = float(guardrails.get('max_auto_refund_eur', 100))
vip_threshold = float(guardrails.get('vip_threshold_eur', 500))
allowed_reasons = guardrails.get('allowed_reasons') or []

if allowed_reasons and reason not in allowed_reasons:
    print(json.dumps({
        'decision': 'reject',
        'reason': 'reason_not_allowed',
        'received': reason,
        'allowed': allowed_reasons,
    }))
    sys.exit(0)

headers = {
    'X-Shopify-Access-Token': admin_token,
    'Content-Type': 'application/json',
}

order_resp = requests.get(
    f'https://{shopify_domain}/admin/api/2024-10/orders/{order_id}.json',
    headers=headers,
    timeout=10,
)
order_resp.raise_for_status()
order = order_resp.json()['order']

customer = order.get('customer') or {}
customer_total_spent = float(customer.get('total_spent', 0) or 0)
order_total = float(order.get('current_total_price', 0) or 0)
is_vip = customer_total_spent >= vip_threshold

if requested_amount > order_total:
    print(json.dumps({
        'decision': 'reject',
        'reason': 'amount_exceeds_order',
        'requested': requested_amount,
        'order_total': order_total,
    }))
    sys.exit(0)

if requested_amount > max_auto and not is_vip:
    print(json.dumps({
        'decision': 'escalate_human',
        'reason': 'amount_above_auto_threshold_non_vip',
        'amount': requested_amount,
        'threshold': max_auto,
        'is_vip': is_vip,
    }))
    sys.exit(0)

# Build refund payload — Shopify requires either transactions or
# specific line items. We keep it minimal: refund the requested amount
# against the parent transaction.
transactions = order.get('transactions') or []
parent_tx = transactions[0] if transactions else None

refund_body = {
    'refund': {
        'note': f'[Actero auto] {reason}',
        'notify': True,
    }
}

if parent_tx:
    refund_body['refund']['transactions'] = [{
        'parent_id': parent_tx['id'],
        'amount': str(requested_amount),
        'kind': 'refund',
        'gateway': order.get('gateway', 'manual'),
    }]

refund_resp = requests.post(
    f'https://{shopify_domain}/admin/api/2024-10/orders/{order_id}/refunds.json',
    headers=headers,
    json=refund_body,
    timeout=15,
)

if refund_resp.status_code >= 400:
    print(json.dumps({
        'decision': 'reject',
        'reason': 'shopify_refund_failed',
        'status': refund_resp.status_code,
        'body': refund_resp.text[:500],
    }))
    sys.exit(0)

refund = refund_resp.json()['refund']
print(json.dumps({
    'decision': 'refunded',
    'refund_id': refund['id'],
    'amount': requested_amount,
    'is_vip': is_vip,
    'order_id': order_id,
}))
`
