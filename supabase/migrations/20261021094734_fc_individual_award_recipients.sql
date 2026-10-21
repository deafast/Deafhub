-- Preserve award authorization/audit; allow genuine individual entries without a team.
do $migration$
declare definition text;old_join text:='join public.hub_teams team on team.id=e.team_id join auth.users';old_name text:='nickname,team.name,u.raw_user_meta_data';
begin
 definition:=pg_get_functiondef('public.hub_ops_action(text,jsonb)'::regprocedure);
 if position('left join public.hub_teams team' in definition)>0 and position('coalesce(team.name,' in definition)>0 then return;end if;
 if (length(definition)-length(replace(definition,old_join,'')))/length(old_join)<>1 or position(old_name in definition)=0 then raise exception 'Unexpected award recipient query; review migration';end if;
 definition:=replace(definition,old_join,'left join public.hub_teams team on team.id=e.team_id join auth.users');
 definition:=replace(definition,old_name,'nickname,coalesce(team.name,'''') as name,u.raw_user_meta_data');
 execute definition;
end $migration$;
notify pgrst,'reload schema';
