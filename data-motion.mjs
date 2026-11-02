// Presentation only: no learning records are read or written here.
const values=new Map();let previousKey='',epoch=0;
const ease=t=>1-Math.pow(1-t,3);
export function wakeData(root,key){
 const ticket=++epoch,entered=key!==previousKey;previousKey=key;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden)return;
 const counters=[...root.querySelectorAll('.ring strong,.stat-card strong,.comparison strong,.study-numbers strong,.mini-stats strong,.achievement-card>strong')];
 counters.forEach((el,index)=>{
  const final=el.textContent,match=final.match(/^(\d+)(%|\/\d+)?$/);if(!match)return;
  const target=Number(match[1]),suffix=match[2]||'',id=key+':counter:'+index,from=entered?0:values.get(id)??0;values.set(id,target);
  el.setAttribute('aria-label',final);if(from===target)return;const start=performance.now();
  function tick(t){if(ticket!==epoch||!el.isConnected)return;const f=Math.min(1,(t-start)/650);el.textContent=Math.round(from+(target-from)*ease(f))+suffix;if(f<1)requestAnimationFrame(tick);else el.textContent=final;}
  requestAnimationFrame(tick);
 });
 root.querySelectorAll('.ring').forEach((el,index)=>{
  const target=parseFloat(el.style.getPropertyValue('--pct'))||0,id=key+':ring:'+index,from=entered?0:values.get(id)??0;values.set(id,target);if(from===target)return;
  const start=performance.now();function tick(t){if(ticket!==epoch||!el.isConnected)return;const f=Math.min(1,(t-start)/800);el.style.setProperty('--pct',(from+(target-from)*ease(f))+'%');if(f<1)requestAnimationFrame(tick);}requestAnimationFrame(tick);
 });
 root.querySelectorAll('.progress-bar i,.gantt-task i').forEach((el,index)=>{const target=parseFloat(el.style.width)||0,id=key+':bar:'+index,from=entered?0:values.get(id)??0;values.set(id,target);if(from!==target)el.animate([{width:from+'%'},{width:target+'%'}],{duration:750,easing:'cubic-bezier(.2,.7,.2,1)'});});
 if(entered)root.querySelectorAll('.stat-card,.evidence-card,.achievement-card,.ring').forEach((el,index)=>el.animate([{opacity:.65,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:360,delay:Math.min(index*35,140),easing:'ease-out'}));
}
