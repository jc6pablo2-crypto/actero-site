// ─── Ambassador Status Labels & Colors ───

export const LEAD_STATUS_MAP = {
  submitted: { label: 'Soumis', color: 'bg-gray-500/20 text-gray-400', border: 'border-gray-500/20', dot: 'bg-gray-400', step: 1 },
  audit_booked: { label: 'A réservé un audit', color: 'bg-blue-500/20 text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-400', step: 2 },
  second_call: { label: 'A réservé un 2e appel', color: 'bg-purple-500/20 text-purple-400', border: 'border-purple-500/20', dot: 'bg-purple-400', step: 3 },
  client_paid: { label: 'Client a payé', color: 'bg-emerald-500/20 text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400', step: 4 },
  won: { label: 'Commission versée', color: 'bg-green-500/20 text-green-400', border: 'border-green-500/20', dot: 'bg-green-400', step: 5 },
  lost: { label: 'Perdu', color: 'bg-red-500/20 text-red-400', border: 'border-red-500/20', dot: 'bg-red-400', step: 0 },
}

export const COMMISSION_STATUS_MAP = {
  pending: { label: 'En attente', color: 'bg-gray-500/20 text-gray-400', border: 'border-gray-500/20', dot: 'bg-gray-400' },
  waiting_30_days: { label: 'Délai J+30', color: 'bg-amber-500/20 text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-400' },
  eligible: { label: 'Éligible', color: 'bg-blue-500/20 text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-400' },
  approved: { label: 'Validée', color: 'bg-green-500/20 text-green-400', border: 'border-green-500/20', dot: 'bg-green-400' },
  paid: { label: 'Payée', color: 'bg-emerald-500/20 text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  cancelled: { label: 'Annulée', color: 'bg-red-500/20 text-red-400', border: 'border-red-500/20', dot: 'bg-red-400' },
}

export const AMBASSADOR_STATUS_MAP = {
  pending: { label: 'En attente', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  active: { label: 'Actif', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  suspended: { label: 'Suspendu', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  inactive: { label: 'Inactif', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
}

export const APPLICATION_STATUS_MAP = {
  new: { label: 'Nouveau', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  reviewed: { label: 'Examiné', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  approved: { label: 'Approuvé', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  rejected: { label: 'Rejeté', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
}

// Lead event type labels for timeline
export const LEAD_EVENT_LABELS = {
  submitted: 'Lead soumis',
  audit_booked: 'Audit réservé',
  second_call: '2e appel réservé',
  client_paid: 'Client a payé — J+30 démarre',
  won: 'Commission versée',
  lost: 'Lead perdu',
  note_added: 'Note ajoutée',
}

export const COMMISSION_EVENT_LABELS = {
  created: 'Commission créée',
  client_paid: 'Client a payé',
  j30_started: 'Délai J+30 démarré',
  eligible: 'Commission éligible',
  approved: 'Commission approuvée',
  paid: 'Commission payée',
  cancelled: 'Commission annulée',
  note_added: 'Note ajoutée',
}

// Lead status pipeline order for progress display
export const LEAD_PIPELINE = [
  'submitted', 'audit_booked', 'second_call', 'client_paid', 'won',
]

/**
 * Calculate J+30 countdown info from client_paid_at date
 */
export function getJ30Countdown(clientPaidAt) {
  if (!clientPaidAt) return { daysLeft: null, isEligible: false, label: 'En attente de paiement' }
  const now = new Date()
  const paidDate = new Date(clientPaidAt)
  const target = new Date(paidDate.getTime() + 30 * 24 * 60 * 60 * 1000)
  const diff = target - now
  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (daysLeft <= 0) return { daysLeft: 0, isEligible: true, label: 'Éligible au paiement' }
  return { daysLeft, isEligible: false, label: `J+30 : ${daysLeft}j restants` }
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPhone(phone) {
  if (!phone) return true
  return /^[+\d\s()-]{6,20}$/.test(phone)
}
