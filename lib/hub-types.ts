export type HubTeam={id:string;name:string;game:string;captain_id:string};
export type HubTournament={id:string;title:string;game:string;organizer_id:string;starts_at:string;rules:string;rules_version:string;roster_size:number;status:string};
export type HubEntry={id:string;team_id:string;tournament_id:string;status:string};
export type HubMatch={id:string;tournament_id:string;entry_a:string;entry_b:string;starts_at:string;score_a:number|null;score_b:number|null;status:string};
export type HubData={userId:string;teams:HubTeam[];members:{team_id:string;user_id:string;nickname:string}[];tournaments:HubTournament[];entries:HubEntry[];matches:HubMatch[];invites:{team_id:string;code:string}[];ownEntryIds:string[];organizer:boolean;steamId:string|null;stats:{matches:number;wins:number}};
