/** Coordinates in the owner's exact 1586×992 approved image. No generated replacement artwork. */
export const approvedScene = {
 src: '/branding/home-five-games/approved-base.webp',
 width: 1586,
 height: 992,
 top: 55,
 bottom: 922,
 // Boundaries sampled from the approved source, extended as straight lines.
 boundaries: [[447.2,146.8],[749.1,455],[1050.1,766.1],[1371.1,1076.9]],
} as const;

export const homeGames = [
 {id:'lol',name:'League of Legends',logo:'league-of-legends.svg',width:736,height:287,x:'4.8%',active:false},
 {id:'valorant',name:'Valorant',logo:'valorant.webp',width:736,height:138,x:'23%',active:false},
 {id:'dota2',name:'Dota 2',logo:'dota2.png',width:386,height:76,x:'43%',active:true},
 {id:'fc',name:'EA Sports FC 27',logo:null,width:180,height:54,x:'63%',active:true},
 {id:'cs2',name:'Counter-Strike 2',logo:'cs2.svg',width:801,height:165,x:'86%',active:true},
] as const;
