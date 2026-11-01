/** Single source for the current three games, original art and captions. */
export const originalGames=[
 {id:'dota2',name:'Dota 2',logo:'/branding/game-logos/dota2.png',width:386,height:76,ru:['Стратегия','Командная игра','Большие возможности'],en:['Strategy','Team play','More opportunities'],art:{file:'dota2-sf.png',x:693,y:153,width:402,height:519,copyX:797,copyY:552}},
 {id:'cs2',name:'CS2',logo:'/branding/game-logos/cs2.svg',width:801,height:165,ru:['Тактика','Реакция','Командный дух'],en:['Tactics','Reaction','Team spirit'],art:{file:'cs2.png',x:981,y:121,width:404,height:579,copyX:1038,copyY:552}},
 {id:'fc',name:'EA Sports FC',logo:'/branding/game-logos/ea-sports-fc.svg',width:512,height:254,ru:['Футбол','Сообщество','Игра для каждого'],en:['Football','Community','A game for everyone'],art:{file:'ea-sports-fc.png',x:1286,y:167,width:365,height:523,copyX:1341,copyY:552}},
];
export type OriginalGame=(typeof originalGames)[number];
