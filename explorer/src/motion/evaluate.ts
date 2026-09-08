/** Source-count-linked timing study, not a contact or spring simulation.
 * Angles are absolute offsets from source assembly in a shared world +Z frame.
 * Evidence: docs/MECHANICAL_REVIEW.md. */
export const RATE_HZ = 3;
export const ESCAPE_TEETH = 20;
export const smooth = (x:number) => {const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t)};
export function evaluatePose(time:number){
 if(!Number.isFinite(time)||time<0)throw new RangeError('Time must be finite and nonnegative');
 const beat=time*RATE_HZ*2, whole=Math.floor(beat), fraction=beat-whole;
 // Authored illustrative timing: Authored release window around the balance zero crossing. Not measured lock/impulse timing.
 const escape=(whole+smooth((fraction-.42)/.16))*Math.PI/ESCAPE_TEETH;
 const seconds=-escape*9/81, third=-seconds*8/75, minute=-third*10/64;
 return {escape,seconds,third,minute,balance:Math.cos(time*RATE_HZ*2*Math.PI)*Math.PI,
  phase:((time*RATE_HZ)%1+1)%1, event:fraction>=.42&&fraction<=.58?'Release':'Dwell'};
}
export class PlaybackClock {
 time=0;playing=false;speed=.1;private last:number|null=null;
 sample(now:number,hidden=false){
  if(!Number.isFinite(now))throw new RangeError('Invalid clock');
  if(hidden){this.last=null;return this.time}
  if(this.last!==null && this.playing)this.time+=Math.min(Math.max(0,(now-this.last)/1000),.1)*this.speed;
  this.last=now;return this.time;
 }
 seek(time:number){if(!Number.isFinite(time)||time<0)throw new RangeError('Invalid time');this.time=time;this.playing=false;this.last=null}
 rebase(){this.last=null}
}
