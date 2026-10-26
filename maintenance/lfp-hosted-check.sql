-- Preview-only integration check. All synthetic users, profiles and teams roll back.
begin;
create temporary table lfp_test_ids(captain uuid,player uuid,other_user uuid);
insert into lfp_test_ids values(gen_random_uuid(),gen_random_uuid(),gen_random_uuid());
insert into auth.users(id,email,aud,role)
 select id,id::text||'@deafhub-test.invalid','authenticated','authenticated'
 from (select captain id from lfp_test_ids union all select player from lfp_test_ids union all select other_user from lfp_test_ids) users;
insert into public.profiles(id,nickname,region,telegram)
 select id,'QA Player','europe','PRIVATE_QA_CONTACT'
 from (select captain id from lfp_test_ids union all select player from lfp_test_ids union all select other_user from lfp_test_ids) users;
grant select on lfp_test_ids to authenticated;
set local role authenticated;
do $$
declare captain uuid;player uuid;other_user uuid;qa_team_id uuid;listing_id uuid;invitation_id uuid;data jsonb;blocked boolean;
begin
 select f.captain,f.player,f.other_user into captain,player,other_user from lfp_test_ids f;
 perform set_config('request.jwt.claim.sub',captain::text,true);
 qa_team_id:=(public.hub_action('create_team',jsonb_build_object('name','QA LFP '||left(captain::text,8),'game','cs2'))->>'id')::uuid;
 perform set_config('request.jwt.claim.sub',player::text,true);
 perform public.hub_lfp_action('publish',jsonb_build_object('game','cs2','position','Support','note','QA only','nickname','FORGED'));
 data:=public.hub_lfp_board('cs2',null,null);
 select (x->>'id')::uuid into listing_id from jsonb_array_elements(data->'mine') x where x->>'game'='cs2';
 if listing_id is null or data::text like '%PRIVATE_QA_CONTACT%' or data::text like '%FORGED%' then raise exception 'FAIL listing privacy';end if;
 perform set_config('request.jwt.claim.sub',other_user::text,true);
 blocked:=false;begin perform public.hub_lfp_action('invite',jsonb_build_object('team_id',qa_team_id,'listing_id',listing_id));exception when others then if SQLERRM='Captain and matching game required' then blocked:=true;else raise;end if;end;
 if not blocked then raise exception 'FAIL non-captain invitation';end if;
 perform set_config('request.jwt.claim.sub',captain::text,true);
 perform public.hub_lfp_action('invite',jsonb_build_object('team_id',qa_team_id,'listing_id',listing_id));
 data:=public.hub_lfp_board('cs2',null,null);invitation_id:=(data->'outgoing'->0->>'id')::uuid;
 if invitation_id is null then raise exception 'FAIL missing outgoing invitation';end if;
 blocked:=false;begin perform public.hub_lfp_action('invite',jsonb_build_object('team_id',qa_team_id,'listing_id',listing_id));exception when others then if SQLERRM='Invitation already pending' then blocked:=true;else raise;end if;end;
 if not blocked then raise exception 'FAIL duplicate invitation';end if;
 perform set_config('request.jwt.claim.sub',other_user::text,true);
 data:=public.hub_lfp_board(null,null,null);if jsonb_array_length(data->'incoming')<>0 then raise exception 'FAIL invitation privacy';end if;
 blocked:=false;begin perform public.hub_lfp_action('accept',jsonb_build_object('invitation_id',invitation_id));exception when others then if SQLERRM='Invitation unavailable' then blocked:=true;else raise;end if;end;
 if not blocked then raise exception 'FAIL unrelated acceptance';end if;
 perform set_config('request.jwt.claim.sub',player::text,true);
 perform public.hub_lfp_action('accept',jsonb_build_object('invitation_id',invitation_id));
 if not exists(select 1 from public.hub_members m where m.team_id=qa_team_id and m.user_id=player) then raise exception 'FAIL missing membership';end if;
 data:=public.hub_lfp_board('cs2',null,null);if jsonb_array_length(data->'mine')<>0 then raise exception 'FAIL listing still active';end if;
 blocked:=false;begin perform public.hub_lfp_action('accept',jsonb_build_object('invitation_id',invitation_id));exception when others then if SQLERRM='Invitation unavailable' then blocked:=true;else raise;end if;end;
 if not blocked then raise exception 'FAIL duplicate acceptance';end if;
end $$;
reset role;
do $$begin
 if has_table_privilege('authenticated','public.hub_lfp_invitations','select') or has_table_privilege('authenticated','public.hub_lfp_listings','select') then raise exception 'FAIL direct table access';end if;
 if has_function_privilege('anon','public.hub_lfp_action(text,jsonb)','execute') or has_function_privilege('anon','public.hub_lfp_board(text,timestamptz,uuid)','execute') then raise exception 'FAIL anonymous function access';end if;
end $$;
rollback;
