// 沿用 V2：复用同一个标准 Audio 播放器，不经过 Web Audio。
const audioPlayer=typeof Audio==='undefined'?null:new Audio();
let active;
export function stopNarration(){active?.pause();}
if(typeof document!=='undefined')document.addEventListener('play',stopNarration,true);
export function createNarration(url,{mediaFactory=()=>audioPlayer}={}){
 const media=mediaFactory();let offset=0,token=0;
 const player={onended:null,onerror:null,get paused(){return active!==player||media.paused;},get currentTime(){return active===player?media.currentTime:offset;},get duration(){return active===player&&Number.isFinite(media.duration)?media.duration:0;},
 async play(){if(!media)throw Error('此浏览器不支持音频播放。');const run=++token;if(active!==player){active?.pause();active=player;media.src=url;media.currentTime=offset;}media.muted=false;media.volume=1;
  media.onended=()=>{if(active!==player)return;offset=media.currentTime;player.onended?.();};
  media.onerror=()=>{if(active!==player)return;player.onerror?.(Error('音频未能播放，请重试或检查文件格式。'));};
  try{await media.play();if(run!==token&&active===player)media.pause();}catch(error){if(run!==token)return;throw Error(error.name==='NotAllowedError'?'请再次点击播放，允许浏览器输出声音。':'音频未能播放，请重试。');}},
 pause(){++token;if(active===player){media.pause();offset=media.currentTime;}},
 stop(){player.pause();offset=0;if(active===player)media.currentTime=0;}};
 return player;
}
