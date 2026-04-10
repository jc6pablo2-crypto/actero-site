/**
 * Actero Engine — Business Rule Engine
 * Evaluates client-defined "if X then Y" rules against an event context.
 *
 * Rule format:
 * {
 *   conditions: [{ field, operator, value }],
 *   actions:    [{ type, ...params }]
 * }
 *
 * Supported operators:
 *   == != > < >= <= contains starts_with ends_with in not_in
 */

export function evaluateRules(rules, context) {
  if (!Array.isArray(rules) || rules.length === 0) return []

  const sorted = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0))
  const matchedActions = []
  const matchedRules = []

  for (const rule of sorted) {
    if (!rule || rule.is_active === false) continue
    const conditions = Array.isArray(rule.conditions) ? rule.conditions : []
    if (conditions.length === 0) continue

    const allMatch = conditions.every(cond => evaluateCondition(cond, context))
    if (allMatch) {
      matchedRules.push({ id: rule.id, name: rule.name })
      const ruleActions = Array.isArray(rule.actions) ? rule.actions : []
      for (const action of ruleActions) {
        matchedActions.push({ ...action, _rule_id: rule.id, _rule_name: rule.name })
      }
    }
  }

  return { actions: matchedActions, rules: matchedRules }
}

export function evaluateCondition({ field, operator, value }, context) {
  if (!field || !operator) return false
  const fieldValue = context?.[field]

  switch (operator) {
    case '==':
    case 'eq':
      // eslint-disable-next-line eqeqeq
      return fieldValue == value
    case '!=':
    case 'neq':
      // eslint-disable-next-line eqeqeq
      return fieldValue != value
    case '>':
    case 'gt':
      return Number(fieldValue) > Number(value)
    case '<':
    case 'lt':
      return Number(fieldValue) < Number(value)
    case '>=':
    case 'gte':
      return Number(fieldValue) >= Number(value)
    case '<=':
    case 'lte':
      return Number(fieldValue) <= Number(value)
    case 'contains':
      return String(fieldValue ?? '').toLowerCase().includes(String(value ?? '').toLowerCase())
    case 'starts_with':
      return String(fieldValue ?? '').toLowerCase().startsWith(String(value ?? '').toLowerCase())
    case 'ends_with':
      return String(fieldValue ?? '').toLowerCase().endsWith(String(value ?? '').toLowerCase())
    case 'in':
      if (Array.isArray(value)) return value.includes(fieldValue)
      return String(value ?? '').split(',').map(s => s.trim()).includes(String(fieldValue ?? ''))
    case 'not_in':
      if (Array.isArray(value)) return !value.includes(fieldValue)
      return !String(value ?? '').split(',').map(s => s.trim()).includes(String(fieldValue ?? ''))
    case 'is_empty':
      return fieldValue === null || fieldValue === undefined || String(fieldValue).trim() === ''
    case 'is_not_empty':
      return fieldValue !== null && fieldValue !== undefined && String(fieldValue).trim() !== ''
    default:
      return false
  }
}

/**
 * Build the evaluation context from normalized event + brain output.
 */
export function buildRuleContext({ normalized, classification, confidence, sentimentScore, amount }) {
  return {
    classification,
    confidence,
    sentiment_score: sentimentScore,
    customer_email: normalized?.customer_email || '',
    subject: normalized?.subject || '',
    message: normalized?.message || '',
    message_length: (normalized?.message || '').length,
    source: normalized?.source || '',
    amount: amount ?? normalized?.amount ?? null,
  }
}
