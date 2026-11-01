/** Single source for the current three games, original art and captions. */
export const originalGames=[
 {id:'dota2',name:'Dota 2',logo:'/branding/game-logos/dota2.png',width:386,height:76,ru:['Стратегия','Командная игра','Большие возможности'],en:['Strategy','Team play','More opportunities'],art:{file:'dota2-sf.png',outline:'M861 202L1068 195L985 648L767 619Z',rim:'M1009 197L1058 195Q1068 195 1066 205L987 638Q985 648 975 647L777 620Q767 619 769 609L781 554',x:693,y:153,width:402,height:519,copyX:797,copyY:552}},
 {id:'cs2',name:'CS2',logo:'/branding/game-logos/cs2.svg',width:801,height:165,ru:['Тактика','Реакция','Командный дух'],en:['Tactics','Reaction','Team spirit'],art:{file:'cs2.png',outline:'M1094 169L1351 146Q1361 145 1359 155L1286 666Q1284 676 1274 675L1014 653Q1004 652 1006 642L1082 180Q1084 170 1094 169Z',rim:'',x:981,y:121,width:404,height:579,copyX:1038,copyY:552}},
 {id:'fc',name:'EA Sports FC',logo:'/branding/game-logos/ea-sports-fc.svg',width:512,height:254,ru:['Футбол','Сообщество','Игра для каждого'],en:['Football','Community','A game for everyone'],art:{file:'ea-sports-fc.png',outline:'M1392 193L1617 232Q1627 234 1625 244L1564 656Q1562 666 1552 665L1320 641Q1310 640 1312 630L1380 201Q1382 191 1392 193Z',rim:'',x:1286,y:167,width:365,height:523,copyX:1341,copyY:552}},
];
export type OriginalGame=(typeof originalGames)[number];
