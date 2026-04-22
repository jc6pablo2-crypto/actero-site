-- Public anon-INSERT lead forms: replace `with_check = true` with minimal
-- but real validation. Stops the linter warnings AND prevents obvious
-- garbage inserts (multi-MB blobs, missing email, etc.). The API routes
-- still validate richly — this is a defense-in-depth layer.

drop policy if exists "leads_insert_public" on public.leads;
create policy "leads_insert_public"
  on public.leads
  for insert
  to anon, authenticated
  with check (
    email is not null and length(email) between 5 and 254
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

drop policy if exists "ambassador_applications_insert_anon"
  on public.ambassador_applications;
create policy "ambassador_applications_insert_anon"
  on public.ambassador_applications
  for insert
  to anon, authenticated
  with check (
    email is not null and length(email) between 5 and 254
    and first_name is not null and length(first_name) between 1 and 100
    and last_name is not null and length(last_name) between 1 and 100
  );

drop policy if exists "applications_insert_public" on public.partner_applications;
create policy "applications_insert_public"
  on public.partner_applications
  for insert
  to anon, authenticated
  with check (
    email is not null and length(email) between 5 and 254
  );

drop policy if exists "referrals_insert" on public.referrals;
create policy "referrals_insert"
  on public.referrals
  for insert
  to anon, authenticated
  with check (
    referral_code is not null and length(referral_code) between 3 and 32
  );
