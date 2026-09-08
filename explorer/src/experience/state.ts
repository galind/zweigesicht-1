export type Treatment='finish'|'function';
export type Phase='loading'|'whole'|'revealing'|'mechanism'|'part'|'recovering';
export interface ExperienceState {
 phase:Phase; group:string|null; part:string|null; side:'back'|'front'; treatment:Treatment;
 separation:number; partSpread:number; reveal:number; study:boolean; playing:boolean;
 speed:number; time:number; isolated:boolean; quality:'auto'|'high'|'low';
}
export const initialState:ExperienceState={phase:'loading',group:null,part:null,side:'back',treatment:'finish',separation:0,partSpread:0,reveal:0,study:false,playing:false,speed:.1,time:0,isolated:false,quality:'auto'};
const clamp=(x:number)=>Number.isFinite(x)?Math.max(0,Math.min(1,x)):0;
export function resolveState(previous:ExperienceState,patch:Partial<ExperienceState>):ExperienceState {
 const next={...previous,...patch};
 next.separation=clamp(next.separation);next.partSpread=clamp(next.partSpread);next.reveal=clamp(next.reveal);
 if(next.separation>0||next.partSpread>0||!next.study)next.playing=false;
 if(!next.part)next.isolated=false;
 if(![.05,.1,.25,1].includes(next.speed))next.speed=.1;
 if(!Number.isFinite(next.time)||next.time<0)next.time=0;
 return next;
}
/** Stable presentation offsets are evaluated in source world millimetres. */
export function layerOffset(z:number,progress:number):number {return (z+2.8)*clamp(progress)*4}
export function damp(current:number,target:number,seconds:number,reduced=false){return reduced?target:current+(target-current)*(1-Math.exp(-Math.max(0,seconds)*7))}
