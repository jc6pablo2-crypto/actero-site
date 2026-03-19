-- Add client_type to funnel_clients and clients tables
-- Supports: 'ecommerce' (default) and 'immobilier'

-- 1. Add client_type to funnel_clients
ALTER TABLE public.funnel_clients
  ADD COLUMN IF NOT EXISTS client_type text NOT NULL DEFAULT 'ecommerce'
  CHECK (client_type IN ('ecommerce', 'immobilier'));

-- 2. Add client_type to clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS client_type text NOT NULL DEFAULT 'ecommerce'
  CHECK (client_type IN ('ecommerce', 'immobilier'));

-- 3. Index for fast filtering by type
CREATE INDEX IF NOT EXISTS idx_funnel_clients_type ON public.funnel_clients (client_type);
CREATE INDEX IF NOT EXISTS idx_clients_type ON public.clients (client_type);
