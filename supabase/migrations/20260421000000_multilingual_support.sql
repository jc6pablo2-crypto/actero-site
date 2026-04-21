-- Feature : Multilingue auto-détecté
-- Ajoute une whitelist des langues que l'agent est autorisé à utiliser
-- quand brand_language = 'multi'. Si la langue détectée du client n'est
-- pas dans cette liste, l'agent répond en français et propose une
-- escalade humaine.
--
-- Par défaut : FR + EN (les deux langues les plus fréquentes chez un
-- e-commerçant Shopify français qui exporte).

ALTER TABLE client_prompt_settings
  ADD COLUMN IF NOT EXISTS supported_languages text[] DEFAULT ARRAY['fr', 'en']::text[];

COMMENT ON COLUMN client_prompt_settings.supported_languages IS
  'ISO 639-1 language codes the agent is allowed to respond in when brand_language = multi. Outside this whitelist, the agent falls back to French and offers human escalation.';
