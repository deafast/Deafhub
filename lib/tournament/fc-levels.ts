export const fcLevels=['strong','intermediate','amateur'] as const;
export type FcLevel=typeof fcLevels[number];
export function fcLevelLabel(value:string|null|undefined,ru:boolean){
 const labels:Record<FcLevel,[string,string]>={strong:['Сильный','Advanced'],intermediate:['Средний','Intermediate'],amateur:['Любитель','Amateur']};
 return value&&Object.hasOwn(labels,value)?labels[value as FcLevel][ru?0:1]:(ru?'Уровень не указан':'Level not specified');
}
