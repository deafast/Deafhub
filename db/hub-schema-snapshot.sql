-- Read-only structural comparison; never reads player rows or auth data.
with snapshot as (
 select 'table' kind,c.relname name,jsonb_build_object('rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,'anon_read',has_table_privilege('anon',c.oid,'select'),'authenticated_read',has_table_privilege('authenticated',c.oid,'select'),'authenticated_insert',has_table_privilege('authenticated',c.oid,'insert'),'authenticated_update',has_table_privilege('authenticated',c.oid,'update'),'authenticated_delete',has_table_privilege('authenticated',c.oid,'delete')) value
 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and left(c.relname,4)='hub_'
 union all
 select 'column',table_name||'.'||column_name,jsonb_build_object('type',udt_name,'nullable',is_nullable,'default',column_default) from information_schema.columns where table_schema='public' and left(table_name,4)='hub_'
 union all
 select 'constraint',c.relname||'.'||p.conname,to_jsonb(pg_get_constraintdef(p.oid)) from pg_constraint p join pg_class c on c.oid=p.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and left(c.relname,4)='hub_' and p.contype<>'n'
 union all
 select 'policy',tablename||'.'||policyname,jsonb_build_object('roles',roles,'command',cmd,'using',qual,'check',with_check) from pg_policies where schemaname='public' and left(tablename,4)='hub_'
 union all
 select 'function',p.proname||'('||pg_get_function_identity_arguments(p.oid)||')',jsonb_build_object('body',md5(regexp_replace(p.prosrc,'\s+','','g')),'definer',p.prosecdef,'config',p.proconfig,'anon_execute',has_function_privilege('anon',p.oid,'execute'),'authenticated_execute',has_function_privilege('authenticated',p.oid,'execute'),'service_execute',has_function_privilege('service_role',p.oid,'execute')) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and left(p.proname,4)='hub_'
 union all
 select 'trigger',c.relname||'.'||t.tgname,to_jsonb(pg_get_triggerdef(t.oid)) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and left(c.relname,4)='hub_' and not t.tgisinternal
) select kind,name,value from snapshot order by kind,name;
