import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Tag,
  Loader2,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const StatusBadge = ({ status }) => {
  const isResolved = status === 'ticket_resolved';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
      isResolved
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    }`}>
      {isResolved ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      {isResolved ? 'Résolu' : 'Escaladé'}
    </span>
  );
};

const ConversationCard = ({ event }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = event.metadata || {};
  const customerMessage = meta.customer_message || null;
  const aiResponse = meta.ai_response || null;
  const ticketType = meta.ticket_type || event.event_type || null;
  const fallbackText = event.description || 'Aucun détail disponible';

  const displayMessage = customerMessage || fallbackText;
  const displayResponse = aiResponse || null;

  const ts = new Date(event.created_at);
  const formattedDate = ts.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedTime = ts.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      layout
      className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden hover:border-white/15 transition-colors"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 flex items-start gap-4"
      >
        <div className="mt-0.5">
          <MessageCircle className="w-5 h-5 text-zinc-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <StatusBadge status={event.event_category} />
            {ticketType && (
              <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                <Tag className="w-3 h-3" />
                {ticketType}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-zinc-600">
              <Clock className="w-3 h-3" />
              {formattedDate} {formattedTime}
            </span>
          </div>
          <p className="text-sm text-zinc-300 line-clamp-2">{displayMessage}</p>
        </div>
        <div className="mt-1 text-zinc-600">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
              <div>
                <p className="text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Message client</p>
                <p className="text-sm text-zinc-300 bg-white/5 rounded-xl px-4 py-3 whitespace-pre-wrap">
                  {customerMessage || fallbackText}
                </p>
              </div>
              {displayResponse && (
                <div>
                  <p className="text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Réponse IA</p>
                  <p className="text-sm text-zinc-300 bg-blue-500/5 border border-blue-500/10 rounded-xl px-4 py-3 whitespace-pre-wrap">
                    {displayResponse}
                  </p>
                </div>
              )}
              {meta && Object.keys(meta).length > 0 && (
                <div>
                  <p className="text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Détails</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(meta)
                      .filter(([k]) => !['customer_message', 'ai_response', 'ticket_type'].includes(k))
                      .map(([k, v]) => (
                        <div key={k} className="bg-white/5 rounded-lg px-3 py-2">
                          <p className="text-xs text-zinc-500">{k}</p>
                          <p className="text-xs text-zinc-300 truncate">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const ClientConversationsView = ({ clientId }) => {
  const { data: conversations = [], isLoading, error } = useQuery({
    queryKey: ['client-conversations', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_events')
        .select('id, event_category, event_type, description, metadata, created_at')
        .eq('client_id', clientId)
        .in('event_category', ['ticket_resolved', 'ticket_escalated'])
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const resolvedCount = conversations.filter(c => c.event_category === 'ticket_resolved').length;
  const escalatedCount = conversations.filter(c => c.event_category === 'ticket_escalated').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Conversations IA</h2>
        <p className="text-zinc-500 text-sm">Historique des échanges traités par l'intelligence artificielle.</p>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl px-5 py-3 flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-xs text-zinc-500">Résolus</p>
            <p className="text-lg font-bold text-white">{resolvedCount}</p>
          </div>
        </div>
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl px-5 py-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <div>
            <p className="text-xs text-zinc-500">Escaladés</p>
            <p className="text-lg font-bold text-white">{escalatedCount}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-400 text-sm">Erreur: {error.message}</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Aucune conversation IA pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((event) => (
            <ConversationCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};
