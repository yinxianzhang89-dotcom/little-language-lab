import {validateExercise,validateEnglishExercise} from './exercises.mjs?v=3.8.4';
import {schoolStages} from './curriculum.mjs?v=3.4.0';

export const subjectThemes={
 en:{name:'英语',color:'#2674d7',soft:'#e9f2ff',symbol:'Aa'},
 math:{name:'数学',color:'#138170',soft:'#e5f6ef',symbol:'π'},
 zh:{name:'语文',color:'#8250be',soft:'#f1e9fc',symbol:'文'},
 physics:{name:'物理',color:'#3e65ad',soft:'#eaf0fa',symbol:'⚛'},
 chemistry:{name:'化学',color:'#bb597c',soft:'#fdebf2',symbol:'H₂'},
 biology:{name:'生物',color:'#528329',soft:'#eef6e4',symbol:'叶'},
 history:{name:'历史',color:'#ac6830',soft:'#fff1e2',symbol:'史'},
 geography:{name:'地理',color:'#208193',soft:'#e5f5f8',symbol:'地'}
};
export const resourcePhases=['课前预习','课中学习','课后巩固'];
const formats={image:['png','jpg','jpeg','webp','gif','avif','bmp'],pdf:['pdf'],text:['txt','md'],audio:['mp3','wav','m4a','ogg','aac','flac'],video:['mp4','webm','mov','m4v','mkv'],slides:['ppt','pptx'],document:['doc','docx'],book:['epub','mobi']};
export const fileAccept=Object.values(formats).flat().map(x=>'.'+x).join(',');
export const fileKind=name=>Object.entries(formats).find(([,extensions])=>extensions.includes(String(name).split('.').pop().toLowerCase()))?.[0];
export function validateFile(file){const kind=fileKind(file.name);if(!kind)throw Error('暂不支持此文件格式，请选择图片、PDF、PPT、文档、电子书或音视频。');if(!file.size)throw Error('不能保存空文件。');const max=({image:100,audio:500,video:2048})[kind]||200;if(file.size>max*1024**2)throw Error(`该类文件最大${max}MB。`);return {kind,max};}
export function materialBlob(file){const ext=file.name.split('.').pop().toLowerCase(),mime={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',avif:'image/avif',bmp:'image/bmp',pdf:'application/pdf',txt:'text/plain',md:'text/plain',mp4:'video/mp4',webm:'video/webm',mov:'video/quicktime',m4v:'video/mp4',mkv:'video/x-matroska',mp3:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',ogg:'audio/ogg',aac:'audio/aac',flac:'audio/flac'};return new Blob([file],{type:mime[ext]||'application/octet-stream'});}
export function validateCourse(d,materials){
 if(!subjectThemes[d.subject]||!schoolStages.includes(d.stage))throw Error('请选择有效的学科和学习阶段。');
 if(![d.order,d.unitOrder].every(n=>Number.isInteger(+n)&&+n>=1&&+n<=99))throw Error('单元与课节序号应为1—99的整数。');
 if(!d.title?.trim()||!d.unitTitle?.trim()||!d.goal?.trim())throw Error('请填写单元名称、课节名称和学习目标。');
 if(!Array.isArray(d.sections)||d.sections.length!==3)throw Error('请配置课前、课中、课后三个环节。');
 if(d.subject==='en'&&/[\u3400-\u9fff]/u.test(d.title+d.goal))throw Error('英语课节名称和学习目标请使用英文，单元名称可保留中文供后台分类。');
 const seen=new Set();
 for(const [i,s]of d.sections.entries()){
  if(d.subject==='en'&&/[\u3400-\u9fff]/u.test(s.text||'')){const e=Error(`${resourcePhases[i]}：英语环节说明请填写英文。`);e.phase=i;throw e;}
  if(!s.text?.trim()&&!s.materialIds?.length&&!s.points?.some(p=>p.text?.trim()||p.words?.trim()||p.question?.trim()||p.image||p.audio||p.video))throw Error(`请为${resourcePhases[i]}添加文案或材料。`);
  for(const [j,point] of (s.points||[]).entries())try{validateExercise(point,materials,seen);if(d.subject==='en')validateEnglishExercise(point);}catch(error){const e=Error(`${resourcePhases[i]} · 知识点 ${j+1}：${error.message}`);e.phase=i;e.pointId=point.id;throw e;}
  for(const id of s.materialIds||[])if(!materials.some(m=>m.id===id&&!m.trashedAt))throw Error('有关联材料不可用，请先恢复或替换材料。');
 }
 return d;
}
export const resourcePath=d=>`${subjectThemes[d.subject]?.name||''}-${d.stage}-U${d.unitOrder}-${d.unitTitle}-${String(d.order).padStart(2,'0')}.${d.title}`;
export function publishCourse(course,materials,at=new Date().toISOString()){validateCourse(course.draft,materials);return {...course,published:structuredClone(course.draft),contentVersion:crypto.randomUUID(),publishedAt:at,updatedAt:at};}
