import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { supabase } from '../../lib/supabase'

/**
 * WeeklySummary — affiche une phrase resumee de la semaine en cours
 * (lundi -> dimanche). Lit metrics_daily + automation_events.
 */
export const WeeklySummary = ({ clientId, setActiveTab }) => {
  // Calcule bornes lundi -> dimanche
  const { startISO, endISO } = useMemo(() => {
    const now = new Date()
    const day = now.getDay() // 0=dim, 1=lun...
    const diffToMonday = day === 0 ? -6 : 1 - day
    const monday = new Date(now)
    monday.setDate(now.getDate() + diffToMonday)
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    return { startISO: monday.toISOString(), endISO: sunday.toISOString() }
  }, [])

  const startDate = startISO.split('T')[0]
  const endDate = endISO.split('T')[0]

  const { data: dailyRows = [] } = useQuery({
    queryKey: ['weekly-summary-metrics', clientId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metrics_daily')
        .select('tasks_executed, time_saved_minutes, estimated_roi, tickets_total, tickets_auto, tickets_escalated')
        .eq('client_id', clientId)
        .gte('date', startDate)
        .lte('date', endDate)
      if (error) return []
      return data || []
    },
    enabled: !!clientId,
  })

  const { data: escalationPending = 0 } = useQuery({
    queryKey: ['weekly-summary-escalations', clientId],
    queryFn: async () => {
      const { count } = await supabase
        .from('ai_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('status', 'escalated')
        .is('human_response', null)
      return count || 0
    },
    enabled: !!clientId,
  })

  const { data: weekEvents = [] } = useQuery({
    queryKey: ['weekly-summary-events', clientId, startISO, endISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_events')
        .select('event_category, time_saved_seconds, revenue_amount')
        .eq('client_id', clientId)
        .gte('created_at', startISO)
        .lte('created_at', endISO)
      if (error) return []
      return data || []
    },
    enabled: !!clientId,
  })

  const stats = useMemo(() => {
    const sumMinutes = dailyRows.reduce((s, d) => s + (Number(d.time_saved_minutes) || 0), 0)
    const sumRoi = dailyRows.reduce((s, d) => s + (Number(d.estimated_roi) || 0), 0)
    const sumTicketsAuto = dailyRows.reduce((s, d) => s + (Number(d.tickets_auto) || 0), 0)

    // Fallback via automation_events si metrics_daily vide
    const fallbackResolved = weekEvents.filter(e => e.event_category === 'ticket_resolved').length
    const fallbackSeconds = weekEvents.reduce((s, e) => s + (Number(e.time_saved_seconds) || 0), 0)
    const fallbackRoi = weekEvents.reduce((s, e) => s + (Number(e.revenue_amount) || 0), 0)

    const ticketsResolved = sumTicketsAuto || fallbackResolved
    const totalMinutes = sumMinutes || fallbackSeconds / 60
    const roi = sumRoi || fallbackRoi

    return {
      ticketsResolved,
      hoursSaved: Math.round((totalMinutes / 60) * 10) / 10,
      roi: Math.round(roi),
      pending: escalationPending,
      hasActivity: ticketsResolved > 0 || totalMinutes > 0 || roi > 0 || escalationPending > 0 || weekEvents.length > 0,
    }
  }, [dailyRows, weekEvents, escalationPending])

  // Formatte les heures : 2h ou 2h30
  const formatHours = (h) => {
    if (!h) return '0h'
    const whole = Math.floor(h)
    const min = Math.round((h - whole) * 60)
    if (min === 0) return `${whole}h`
    return `${whole}h${String(min).padStart(2, '0')}`
  }

  return (
    <div
      className="rounded-2xl border border-[#0F5F35]/15 p-4 md:p-5 mb-6 flex items-start gap-3"
      style={{
        background: 'linear-gradient(135deg, rgba(15,95,53,0.05) 0%, rgba(15,95,53,0.02) 100%)',
      }}
    >
      <div className="w-9 h-9 rounded-xl bg-[#0F5F35]/10 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-[18px] h-[18px] text-[#0F5F35]" strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0 pt-1">
        {!stats.hasActivity ? (
          <p className="text-[14px] text-[#1a1a1a] leading-relaxed">
            Votre agent est pret — aucun message recu cette semaine.
          </p>
        ) : (
          <p className="text-[14px] text-[#1a1a1a] leading-relaxed">
            Cette semaine, votre agent a resolu{' '}
            <span className="font-bold text-[#0F5F35]">{stats.ticketsResolved} ticket{stats.ticketsResolved > 1 ? 's' : ''}</span>
            , economise{' '}
            <span className="font-bold text-[#0F5F35]">
              {formatHours(stats.hoursSaved)} dont {stats.roi.toLocaleString('fr-FR')}€
            </span>
            {stats.pending > 0 ? (
              <>
                , et{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab && setActiveTab('escalations')}
                  className="font-bold text-[#c2410c] hover:underline cursor-pointer"
                >
                  {stats.pending} cas
                </button>{' '}
                vous attendent dans 'A traiter'.
              </>
            ) : (
              <>.</>
            )}
          </p>
        )}
      </div>
    </div>
  )
}

export default WeeklySummary
