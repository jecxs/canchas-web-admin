create function public.billing_acceso_propio_vigente()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select public.billing_entitlement_vigente((select auth.uid()))), false);
$$;

revoke all on function public.billing_acceso_propio_vigente() from public, anon;
grant execute on function public.billing_acceso_propio_vigente() to authenticated;
