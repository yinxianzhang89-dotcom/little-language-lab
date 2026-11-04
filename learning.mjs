import {lessonPath,lessonLabel,lessons,units,getLesson,allQuestions,required,schoolStages} from './curriculum.mjs?v=3.4.0';
const uid=()=>crypto.randomUUID();
export const localDate=(at=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
export function createLearner(){return {schemaVersion:3,id:uid(),createdAt:new Date().toISOString(),profile:{name:'小小探索家',age:null,stage:'',avatar:''},subject:'en',lastLesson:lessons[0].id,lessons:{},attempts:[],plans:[],notes:[],awards:{},legacy:{en:[],zh:[]},migration:null};}
export function lessonState(s,id){if(!getLesson(id))throw Error('课程不存在');return s.lessons[id]??={activities:{},phase:0,page:0,question:0,note:'',observations:[false,false],startedAt:null,completedAt:null};}
export function progress(s,id){const l=getLesson(id),c=s.lessons[id],keys=required(l),done=keys.filter(k=>c?.activities[k]).length;return {done,total:keys.length,percent:Math.round(done/keys.length*100)};}
export function completeActivity(s,id,key,source='confirmed',at=new Date().toISOString()){
 const c=lessonState(s,id);if(!required(getLesson(id)).includes(key))throw Error('未知学习活动');
 if(!c.activities[key]){c.activities[key]={source,at};if(!c.startedAt)c.startedAt=at;if(progress(s,id).percent===100&&!c.completedAt){c.completedAt=at;c.legacyCompleted=false;}}
 return c.activities[key];
}
export function exposeHint(s,id,qid,at=new Date().toISOString()){if(!allQuestions(getLesson(id)).some(q=>q.id===qid))throw Error('题目不属于本课');const c=lessonState(s,id);c.hintExposure??={};c.hintExposure[qid]??={at};}
export function submitAnswer(s,id,qid,value,{at=new Date().toISOString(),hint=false}={}){
 hint=hint||!!lessonState(s,id).hintExposure?.[qid];
 const l=getLesson(id),q=allQuestions(l).find(q=>q.id===qid);if(!q)throw Error('题目不属于本课');
 const previous=s.attempts.filter(a=>a.lessonId===id&&a.questionId===qid&&a.contentVersion===l.version),correct=JSON.stringify(value)===JSON.stringify(q.key);
 const a={id:uid(),learnerId:s.id,lessonId:id,questionId:qid,skill:q.skill,contentVersion:l.version,at,value,correct,hint,first:!previous.length,transfer:!!q.transfer,eligible:true};s.attempts.push(a);
 if(l.questions.includes(q)||q===l.transfer)completeActivity(s,id,'answer-'+qid,'submitted',at);
 const c=lessonState(s,id);c.startedAt??=at;return a;
}
export const attemptsFor=(s,id,qid)=>s.attempts.filter(a=>a.lessonId===id&&(!qid||a.questionId===qid)&&a.contentVersion===getLesson(id).version);
export function metrics(s,scope=lessons,range='all',now=new Date()){
 const ids=new Set(scope.map(l=>l.id)),today=localDate(now),cut=range==='week'?new Date(new Date(now).getTime()-6*864e5):range==='month'?new Date(new Date(now).getTime()-29*864e5):null;
 const a=s.attempts.filter(a=>ids.has(a.lessonId)&&a.eligible&&a.contentVersion===getLesson(a.lessonId).version&&(!cut||(localDate(a.at)>=localDate(cut)&&localDate(a.at)<=today))),first=a.filter(a=>a.first),latest=new Map();a.forEach(x=>latest.set(x.questionId,x));const ps=scope.map(l=>progress(s,l.id));
 return {total:scope.reduce((n,l)=>n+allQuestions(l).length,0),answered:latest.size,firstCount:first.length,firstCorrect:first.filter(a=>a.correct&&!a.hint).length,latestCorrect:[...latest.values()].filter(a=>a.correct).length,hints:a.filter(a=>a.hint).length,tries:a.length,completed:ps.filter(p=>p.percent===100).length,activities:ps.reduce((n,p)=>n+p.done,0),required:ps.reduce((n,p)=>n+p.total,0),days:new Set(a.map(a=>localDate(a.at))).size};
}
export function evidence(s,skill,scope=lessons,range='all',now=new Date()){
 const ids=new Set(scope.map(l=>l.id)),cut=range==='week'?new Date(new Date(now).getTime()-6*864e5):range==='month'?new Date(new Date(now).getTime()-29*864e5):null;
 const a=s.attempts.filter(a=>ids.has(a.lessonId)&&a.eligible&&a.skill===skill&&a.contentVersion===getLesson(a.lessonId)?.version&&(!cut||(localDate(a.at)>=localDate(cut)&&localDate(a.at)<=localDate(now)))),first=a.filter(a=>a.first),dates=new Set(a.map(x=>localDate(x.at))),samples=first.length,success=first.filter(x=>x.correct&&!x.hint).length;
 const transfer=a.some(x=>x.transfer&&x.correct&&!x.hint),delayed=a.some(x=>!x.first&&a.some(y=>y.questionId===x.questionId&&new Date(x.at)-new Date(y.at)>=864e5));const enough=samples>=5&&dates.size>=2&&(transfer||delayed),percent=samples?Math.round(success/samples*100):null;
 return {skill,samples,dates:dates.size,success,percent,transfer,delayed,enough,status:enough?(percent>=80&&transfer?'较稳定':'继续练习'):'证据积累中'};
}
export function saveProfile(s,draft){const name=draft.name.trim(),age=draft.age===''||draft.age==null?null:Number(draft.age);if(!name||name.length>20)throw Error('昵称请填写1—20个字');if(age!==null&&(!Number.isInteger(age)||age<1||age>120))throw Error('年龄请填写1—120之间的整数，或留空');if(draft.stage&&!schoolStages.includes(draft.stage))throw Error('请选择有效学龄阶段');s.profile={...s.profile,...draft,name,age};}
export function createPlan(s,task,at=new Date().toISOString()){
 if(!getLesson(task.lessonId)||!/^\d{4}-\d{2}-\d{2}$/.test(task.date)||Number.isNaN(Date.parse(task.date+'T12:00:00+08:00'))||localDate(task.date+'T12:00:00+08:00')!==task.date)throw Error('请选课程和有效日期');
 const minutes=task.minutes==null?12:Number(task.minutes),startTime=task.startTime||'';
 if(!Number.isInteger(minutes)||minutes<3||minutes>90)throw Error('预计用时应为3—90分钟');
 if(startTime&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime))throw Error('请选择有效开始时间');
 const start=startTime?timeMinutes(startTime):null;if(start!==null&&start+minutes>1440)throw Error('任务不能跨过当天24点，请调整时间');
 const conflict=start===null?null:s.plans.find(p=>!p.cancelledAt&&p.date===task.date&&p.startTime&&start<timeMinutes(p.startTime)+p.minutes&&start+minutes>timeMinutes(p.startTime));
 if(conflict)throw Error('时间冲突：'+lessonPath(getLesson(conflict.lessonId))+' '+conflict.startTime+'，请更换时段');
 const p={id:uid(),lessonId:task.lessonId,kind:task.kind||'core',date:task.date,startTime,minutes,target:1,createdAt:at};
 if(!['core','homework','review'].includes(p.kind))throw Error('计划类型不正确');s.plans.push(p);return p;
}
export const timeMinutes=value=>{const [h,m]=value.split(':').map(Number);return h*60+m;};
export const timeLabel=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
export function planProgress(s,p){if(p.kind==='core')return progress(s,p.lessonId).percent;if(p.kind==='review')return attemptsFor(s,p.lessonId).some(a=>a.at>=p.createdAt)?100:0;const l=getLesson(p.lessonId),qs=[l.transfer,...l.homework];return Math.round(qs.filter(q=>attemptsFor(s,l.id,q.id).length).length/qs.length*100);}
export function planState(s,p,today=localDate()){const n=planProgress(s,p);return n===100?{id:'done',name:'已完成'}:p.date<today?{id:'overdue',name:'逾期待完成'}:n>0?{id:'active',name:'进行中'}:{id:'pending',name:'待开始'};}
export function cancelPlan(s,id,at=new Date().toISOString()){const p=s.plans.find(p=>p.id===id);if(!p)throw Error('任务不存在');p.cancelledAt=at;}
export function planStatus(s,p){if(p.cancelledAt)return '已取消';if(p.kind==='core')return progress(s,p.lessonId).percent===100?'已完成':'待完成';if(p.kind==='homework'){const l=getLesson(p.lessonId),ids=[l.transfer,...l.homework].map(q=>q.id);return ids.every(id=>attemptsFor(s,l.id,id).length)?'已完成':'待完成';}return attemptsFor(s,p.lessonId).filter(a=>a.at>=p.createdAt).length>=(p.target||1)?'已完成':'待完成';}
export function suggestions(s,subject='en',today=localDate()){
 const scope=lessons.filter(l=>l.subject===subject),out=[],latest=new Map();s.attempts.filter(a=>a.eligible&&getLesson(a.lessonId)?.subject===subject).forEach(a=>latest.set(a.questionId,a));const wrong=[...latest.values()].filter(a=>!a.correct).at(-1);
 if(wrong)out.push({lessonId:wrong.lessonId,kind:'review',minutes:5,title:'回到需要帮助的知识点',reason:'这节课最近出现未答对的任务。换道同知识点的题再试试。'});
 const learned=scope.find(l=>progress(s,l.id).done>0&&attemptsFor(s,l.id).some(a=>localDate(a.at)<today));if(learned)out.push({lessonId:learned.id,kind:'review',minutes:5,title:'隔一段时间，再试一次',reason:'这节课有此前的学习记录，可以检查今天还能否独立完成。'});
 const next=scope.find(l=>progress(s,l.id).percent<100);if(next)out.push({lessonId:next.id,kind:'core',minutes:12,title:'接着学习下一步',reason:progress(s,next.id).done?'接着已保存的断点继续。':'从这节课的目标和故事开始。'});
 const overdue=s.plans.filter(p=>!p.cancelledAt&&p.date<today&&planStatus(s,p)!=='已完成').length;if(overdue)out.push({kind:'reschedule',title:'先调整积压任务',reason:`有${overdue}项计划待完成。可以改期，不必一天补完。`});return out;
}
const historicalAchievementDefinitions=[{id:'first-lesson',name:'第一步探索家',type:'medal',description:'完成一课的核心学习活动',target:1,count:s=>lessons.filter(l=>s.lessons[l.id]?.completedAt&&!s.lessons[l.id].legacyCompleted).length},{id:'brave-speaker',name:'勇敢表达家',type:'medal',description:'在3个不同课节完成表达实践',target:3,count:s=>lessons.filter(l=>s.lessons[l.id]?.activities.oral&&s.lessons[l.id].activities.oral.source!=='legacy').length},{id:'unit-one',name:'玩具侦探奖杯',type:'trophy',description:'完成玩具小侦探单元3课',target:3,count:s=>lessons.filter(l=>l.unitId===units[0].id&&progress(s,l.id).percent===100).length},{id:'unit-two',name:'野餐伙伴奖杯',type:'trophy',description:'完成野餐小伙伴单元3课',target:3,count:s=>lessons.filter(l=>l.unitId===units[1].id&&progress(s,l.id).percent===100).length},{id:'l1-certificate',name:'L1探索纪念证书',type:'certificate',description:'完成英语L1体验范围6课；为学习纪念，非学历证明',target:6,count:s=>lessons.filter(l=>l.subject==='en'&&progress(s,l.id).percent===100).length},{id:'planned-days',name:'自己的学习节奏',type:'medal',description:'在3个不同计划日完成真实学习目标',target:3,count:s=>new Set(s.plans.filter(p=>!p.cancelledAt&&planStatus(s,p)==='已完成'&&(s.lessons[p.lessonId]?.completedAt&&localDate(s.lessons[p.lessonId].completedAt)===p.date||attemptsFor(s,p.lessonId).some(a=>localDate(a.at)===p.date&&a.at>=p.createdAt))).map(p=>p.date)).size}];
const milestoneGroups=[
 {id:'newcomer',name:'学习新人',targets:[1,8,24],unit:'项真实学习活动',count:s=>Object.values(s.lessons).reduce((n,c)=>n+Object.values(c.activities).filter(a=>a.source!=='legacy').length,0)},
 {id:'preparation',name:'预习之星',targets:[1,3,6],unit:'课课前准备',count:s=>lessons.filter(l=>s.lessons[l.id]?.activities.prep&&s.lessons[l.id].activities.prep.source!=='legacy').length},
 {id:'exploration',name:'课堂探索',targets:[1,3,6],unit:'课完整故事学习',count:s=>lessons.filter(l=>l.stories.every((_,i)=>{const a=s.lessons[l.id]?.activities['story-'+i];return a&&a.source!=='legacy';})).length},
 {id:'practice',name:'练习达人',targets:[3,10,20],unit:'道不同题目作答（不代表正确率）',count:s=>new Set(s.attempts.filter(a=>a.eligible&&getLesson(a.lessonId)?.version===a.contentVersion).map(a=>a.lessonId+':'+a.questionId)).size},
 {id:'progress',name:'步步高升',targets:[1,3,6],unit:'课核心学习',count:s=>lessons.filter(l=>progress(s,l.id).percent===100&&!s.lessons[l.id]?.legacyCompleted).length},
 {id:'attendance',name:'学习全勤王',targets:[3,7,21],unit:'个实际学习日（累计，不要求连续）',count:s=>new Set([...Object.values(s.lessons).flatMap(c=>Object.values(c.activities).filter(a=>a.source!=='legacy'&&a.at).map(a=>localDate(a.at))),...s.attempts.filter(a=>a.eligible&&a.at).map(a=>localDate(a.at))]).size}
];
const achievementDefinitions=milestoneGroups.flatMap(g=>g.targets.map((target,i)=>({id:g.id+'-lv'+(i+1),name:g.name+' LV'+(i+1),type:'medal',description:'累计完成'+target+g.unit,target,count:g.count})));
export function achievements(s){return achievementDefinitions.map(d=>{const done=Math.min(d.target,d.count(s));let at=s.awards[d.id]?.at;const earned=!!s.awards[d.id]||done>=d.target;return {id:d.id,name:d.name,type:d.type,description:d.description,target:d.target,done,earned,at};});}
export function settleAwards(s,at=new Date().toISOString()){for(const a of achievements(s))if(a.earned&&!s.awards[a.id])s.awards[a.id]={at:a.at||at};}
export function timeline(s){const out=[];for(const l of lessons){const c=s.lessons[l.id];if(!c)continue;if(c.startedAt)out.push({id:l.id+'.start',at:c.startedAt,title:'开始探索 · '+lessonLabel(l),lessonId:l.id,type:'start'});if(c.completedAt)out.push({id:l.id+'.done',at:c.completedAt,title:'完成核心学习 · '+lessonLabel(l),lessonId:l.id,type:'complete'});}for(const [id,x]of Object.entries(s.awards)){const a=[...achievementDefinitions,...historicalAchievementDefinitions].find(a=>a.id===id);out.push({id,at:x.at,title:'获得成就 · '+(a?.name||x.name||'历史成就'),type:'award'});}for(const n of s.notes)out.push({...n,type:'note'});for(const a of s.attempts.filter(a=>a.correct&&!a.hint&&a.first)){const before=s.attempts.find(b=>b.skill===a.skill&&b.questionId!==a.questionId&&!b.correct&&b.at<a.at);if(before&&!out.some(e=>e.id===a.skill+'.improved'))out.push({id:a.skill+'.improved',at:a.at,title:'新题独立完成 · '+lessonLabel(getLesson(a.lessonId)),lessonId:a.lessonId,type:'improved',evidenceIds:[before.id,a.id]});}return out.sort((a,b)=>(b.at||'').localeCompare(a.at||''));}
export function migrateV2(s,raw){
 if(s.migration)return false;if(!raw?.courses?.en&&!raw?.courses?.zh)throw Error('没有可迁移的v2学习记录');s.v2Backup=structuredClone(raw);s.migration={at:new Date().toISOString(),source:'language-island-v2'};
 s.profile={...s.profile,name:s.profile.name==='小小探索家'?(raw.profile?.name||s.profile.name):s.profile.name,legacyAgeLabel:raw.profile?.age||'',avatar:s.profile.avatar||raw.profile?.avatarData||''};
 for(const subject of ['en','zh']){const l=lessons.find(l=>l.subject===subject),old=raw.courses[subject];if(!old)continue;const existed=!!s.lessons[l.id],c=lessonState(s,l.id);s.legacy[subject]=structuredClone([...(raw.history?.[subject]||[]),old]);c.note=c.note||old.note||'';if(!c.observations.some(Boolean))c.observations=old.obs||[false,false];if(!existed){c.page=Math.min(2,old.page||0);c.phase=Math.min(4,old.step||0);}const map={prep:'prep',talk:'oral',...Object.fromEntries(l.stories.map((_,i)=>['story-'+i,'story-'+i])),...Object.fromEntries([...l.questions,l.transfer].map(q=>['question-'+q.legacyId,'answer-'+q.id]))};for(const [id,r]of Object.entries(old.activities||{}))if(map[id])c.activities[map[id]]??={at:r.at||null,source:'legacy'};
 for(const q of [...l.questions,l.transfer])if(old.items?.[q.legacyId]?.tries>0)c.activities['answer-'+q.id]??={at:null,source:'legacy'};
 c.legacySummary=structuredClone(old.items||{});if(progress(s,l.id).percent===100&&!c.completedAt){c.legacyCompleted=true;const dates=Object.values(c.activities).map(a=>a.at);c.completedAt=dates.every(Boolean)?dates.sort().at(-1):null;}
 for(const [roundIndex,round]of s.legacy[subject].entries()){const groups=[['reader',['story-0','story-1','story-2'],'听读探索家'],['try',[...l.questions,l.transfer].map(q=>'question-'+q.legacyId),'认真尝试奖'],['speaker',['talk'],'勇敢表达奖']];for(const [id,keys,name]of groups){if(keys.every(k=>round.activities?.[k])){const key='legacy-'+subject+'-'+id;if(!s.awards[key]){const dates=keys.map(k=>round.activities[k].at);s.awards[key]={name,at:dates.every(Boolean)?dates.sort().at(-1):null,legacy:true,round:roundIndex};}}}}
 }return true;
}
