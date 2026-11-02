import {courses as old} from './content/legacy.mjs?v=3.4.0';
import {englishContent} from './content/en.mjs?v=3.4.0';
export const phases=['课前准备','故事学习','互动探索','课后应用','学习报告'];
export const schoolStages=['启蒙阶段','小学阶段','初中阶段','高中阶段','大学阶段','专业阶段'];
export const subjectCatalog={zh:'语文',en:'英语',math:'数学',physics:'物理',chemistry:'化学',geography:'地理',biology:'生物',history:'历史'};
export const subjects={en:{name:'英语',eyebrow:'ENGLISH PLAYTIME',headline:'每一次开口，\n都是新的发现。',description:'在故事和生活情境中，练习听懂、开口与交流。',color:'blue'},zh:{name:'语文',eyebrow:'CHINESE STORY ISLAND',headline:'读懂一个故事，\n说出自己的世界。',description:'从听故事、读画面开始，逐步练习理解、讲述与表达。',color:'purple'}};
export const skills={'en.position':{name:'位置理解',subject:'en'},'en.instructions':{name:'听懂指令',subject:'en'},'en.food':{name:'物品与词汇',subject:'en'},'en.expression':{name:'情境表达',subject:'en'},'zh.sequence':{name:'事件先后',subject:'zh'},'zh.evidence':{name:'线索理解',subject:'zh'},'zh.expression':{name:'故事讲述',subject:'zh'}};
export const units=[{id:'en.foundation.l1.u1',subject:'en',title:'Toy Detectives',subtitle:'玩具小侦探',level:'L1',order:1},{id:'en.foundation.l1.u2',subject:'en',title:'Picnic Pals',subtitle:'野餐小伙伴',level:'L1',order:2},{id:'zh.story.l1.u1',subject:'zh',title:'故事里的发现',subtitle:'听读与讲述',level:'L1',order:1}];
const legacyLesson=(subject)=>{const d=old[subject],id=subject==='en'?'en.foundation.l1.u1.l01':'zh.story.l1.u1.l01';return {id,subject,unitId:units.find(u=>u.subject===subject).id,level:'L1',courseId:subject==='en'?'en.foundation':'zh.story',version:1,order:1,title:d.title,zhTitle:subject==='en'?'小兔的玩具车':'小兔的玩具车，去哪儿了？',summary:d.description,focus:subject==='en'?'in · on · under':'先后顺序 · 故事线索',minutes:12,goals:d.goals,terms:subject==='en'?['under the table','in the box','on the table']:[],stories:d.stories.map((s,i)=>({...s,scene:{image:s.image},caption:s.label})),questions:d.questions.map((q,i)=>({...q,id:id+'.q'+(i+1),legacyId:q.id,prompt:q.title,skill:subject==='en'?'en.position':i?'zh.evidence':'zh.sequence',scene:{image:q.image},type:q.type||'choice'})),transfer:{...d.practice,id:id+'.transfer',legacyId:'transfer',prompt:d.practice.title,skill:subject==='en'?'en.position':'zh.sequence',scene:{image:d.practice.image},transfer:true},homework:[],talk:d.talk,demo:d.demo,observations:d.observations};};
const baseEn=legacyLesson('en'),baseZh=legacyLesson('zh');
const enrich=(l,raw)=>{const q=(v,id,transfer=false)=>({...v,id,transfer,type:'choice',scene:{image:raw.slug+'-board.png',frame:v.frame??2}});return {...l,id:`en.foundation.l1.u${raw.unit}.l0${raw.order}`,unitId:`en.foundation.l1.u${raw.unit}`,version:1,...raw,subject:'en',courseId:'en.foundation',level:'L1',minutes:12,stories:raw.stories.map((text,i)=>({text,caption:raw.captions[i],scene:{image:raw.slug+'-board.png',frame:i}})),questions:raw.questions.map((v,i)=>q(v,`en.foundation.l1.u${raw.unit}.l0${raw.order}.q${i+1}`)),transfer:q(raw.transfer,`en.foundation.l1.u${raw.unit}.l0${raw.order}.transfer`,true),homework:raw.homework.map((v,i)=>q(v,`en.foundation.l1.u${raw.unit}.l0${raw.order}.hw${i+1}`,true))};};
export const lessons=[baseEn,...englishContent.map(raw=>enrich({},raw)),baseZh];
const extra=[['Where is the car?',['Under the table.','In the box.','On the table.'],0,'found.png'],['Where is the ball?',['On the table.','In the box.','Under the table.'],1,'transfer.png'],['Where is the car now?',['Under the table.','In the box.','On the table.'],2,'transfer.png']];
baseEn.homework=extra.map(([prompt,options,key,image],i)=>({id:baseEn.id+'.hw'+(i+1),prompt,options,key,skill:'en.position',scene:{image},type:'choice',transfer:true,hint:'看看当前画面，再回想 in、on 和 under。'}));
baseZh.homework=[{prompt:'故事最后发生了什么？',options:['小兔找到了车','小兔开始玩车','小兔打开窗户'],key:0,skill:'zh.sequence',scene:{image:'found.png'}},{prompt:'小兔找到车的线索是什么？',options:['红色车轮','收纳箱颜色','窗外蓝天'],key:0,skill:'zh.evidence',scene:{image:'found.png'}},{prompt:'讲述寻找经历时，可以怎样开始？',options:['我先去了……','故事结束了','我什么也不说'],key:0,skill:'zh.expression',scene:{image:'play.png'}}].map((q,i)=>({...q,id:baseZh.id+'.hw'+(i+1),type:'choice',transfer:true,hint:'回想故事，再说说自己的依据。'}));
for(const l of lessons)l.stage='启蒙阶段';
for(const u of units)u.stage='启蒙阶段';
export const getLesson=id=>lessons.find(l=>l.id===id);
export const allQuestions=l=>[...l.questions,l.transfer,...l.homework];
export const required=l=>['prep',...l.stories.map((_,i)=>'story-'+i),...l.questions.map(q=>'answer-'+q.id),'answer-'+l.transfer.id,'oral'];
export const scopedLessons=(subject='all',unit='all',lesson='all',stage='all')=>lessons.filter(l=>(subject==='all'||l.subject===subject)&&(unit==='all'||l.unitId===unit)&&(lesson==='all'||l.id===lesson)&&(stage==='all'||l.stage===stage));

export const unitLabel=u=>`U${u.order}-${u.subtitle}`;
export const lessonLabel=(l,language='zh')=>`${String(l.order).padStart(2,'0')}.${language==='en'?l.title:l.zhTitle}`;
export const lessonPath=l=>`${subjectCatalog[l.subject]}-${l.stage}-${unitLabel(units.find(u=>u.id===l.unitId))}-${lessonLabel(l)}`;
export const termPictures={
 'under the table':{frame:0,label:'小汽车在桌子下面'},
 'in the box':{frame:1,label:'球在箱子里面'},
 'on the table':{frame:2,label:'小汽车在桌子上面'},
 'behind the sofa':{frame:3,label:'小熊在沙发后面'},
 'next to the chair':{frame:4,label:'小熊在椅子旁边'},
 'Put the ball in the box.':{frame:1,label:'把球放在箱子里面'},
 'Put the car on the table.':{frame:2,label:'把小汽车放在桌子上面'},
 'an apple':{frame:5,label:'苹果'},'a banana':{frame:6,label:'香蕉'},'some bread':{frame:7,label:'面包'},
 'The basket is on the table.':{frame:8,label:'篮子在桌子上面'},'I have some bread.':{frame:7,label:'bread · 面包'}
};
