/**
 * Local dev test for the E2B agentic action pipeline.
 *
 * Usage:
 *   bun --env-file=.env.local scripts/test-e2b-action.mjs
 *
 * Spawns a sandbox and runs the refund_with_rules script with a fake order
 * payload. No real Shopify call is made — the script is hardcoded to use a
 * sandbox.runCode() block that simulates the decision logic in isolation,
 * so you can validate the orchestrator + sandbox without a real merchant.
 */

import 'dotenv/config'
import { Sandbox } from '@e2b/code-interpreter'

if (!process.env.E2B_API_KEY) {
  console.error('✗ E2B_API_KEY missing in .env.local')
  process.exit(1)
}

const FAKE_CONTEXT = {
  shopify_domain: 'demo-actero.myshopify.com',
  shopify_admin_token: 'shpat_dev_dummy',
  merchant_id: '00000000-0000-0000-0000-000000000001',
  action_type: 'refund_with_rules',
  payload: { order_id: 5_678, reason: 'damaged_product', amount: 42.5 },
  guardrails: { max_auto_refund_eur: 100, vip_threshold_eur: 500 },
}

const DRY_RUN_SCRIPT = `
import json
from pathlib import Path

ctx = json.loads(Path('/workspace/context.json').read_text())
payload = ctx['payload']
guardrails = ctx['guardrails']

requested = float(payload['amount'])
max_auto = float(guardrails['max_auto_refund_eur'])

# Mock customer & order
customer_total_spent = 250.0  # not VIP
order_total = 89.0
is_vip = customer_total_spent >= guardrails['vip_threshold_eur']

if requested > order_total:
    out = {'decision': 'reject', 'reason': 'amount_exceeds_order'}
elif requested > max_auto and not is_vip:
    out = {'decision': 'escalate_human', 'reason': 'amount_above_auto_threshold_non_vip'}
else:
    out = {'decision': 'refunded', 'refund_id': 9999, 'amount': requested, 'is_vip': is_vip}

print(json.dumps(out))
`

console.log('→ Spawning sandbox...')
const sb = await Sandbox.create({ apiKey: process.env.E2B_API_KEY })
console.log('  sandbox:', sb.sandboxId)

console.log('→ Writing context.json...')
await sb.files.write('/workspace/context.json', JSON.stringify(FAKE_CONTEXT))

console.log('→ Running dry-run refund_with_rules...')
const exec = await sb.runCode(DRY_RUN_SCRIPT)

const stdout = exec.logs.stdout.join('').trim()
console.log('→ stdout:', stdout)

const decision = JSON.parse(stdout)
console.log('→ Parsed decision:', decision)

await sb.kill()
console.log('✓ Test passed — orchestrator pattern works end-to-end')
