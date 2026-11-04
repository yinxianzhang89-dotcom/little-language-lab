export function cropGeometry(width,height,zoom=1,x=0,y=0,size=320){
 const scale=Math.max(size/width,size/height)*Math.max(1,Math.min(3,zoom)),w=width*scale,h=height*scale;
 x=Math.max(-(w-size)/2,Math.min((w-size)/2,x));y=Math.max(-(h-size)/2,Math.min((h-size)/2,y));
 return {x,y,left:(size-w)/2+x,top:(size-h)/2+y,width:w,height:h};
}
export async function openAvatarCrop(file,onApply){
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20*1024*1024)throw Error('请选择20MB以内的PNG、JPG或WebP图片。');
 const url=URL.createObjectURL(file),image=new Image();image.src=url;
 try{await image.decode();}catch{URL.revokeObjectURL(url);throw Error('这张图片无法读取，请换一张。');}
 const dialog=document.createElement('dialog');dialog.className='avatar-crop-dialog';dialog.setAttribute('aria-label','调整头像');
 dialog.innerHTML='<h2>调整头像</h2><p>拖动图片调整位置，缩放至合适大小。</p><div class="avatar-crop-frame"><canvas width="320" height="320" tabindex="0" role="img" aria-label="头像裁剪预览，可拖动或用方向键移动图片"></canvas><div class="avatar-crop-mask"></div></div><label>图片大小<input type="range" min="1" max="3" step="0.01" value="1" aria-label="头像缩放"></label><small>也可以用方向键微调图片位置。</small><div class="actions"><button type="button" class="text-button" data-crop="reset">居中</button><button type="button" class="outline" data-crop="cancel">取消</button><button type="button" class="primary" data-crop="apply">使用头像</button></div>';
 const canvas=dialog.querySelector('canvas'),slider=dialog.querySelector('input'),ctx=canvas.getContext('2d');let x=0,y=0,zoom=1,drag=null;
 const draw=()=>{const g=cropGeometry(image.naturalWidth,image.naturalHeight,zoom,x,y);x=g.x;y=g.y;ctx.clearRect(0,0,320,320);ctx.drawImage(image,g.left,g.top,g.width,g.height);};
 const close=()=>{dialog.close();dialog.remove();URL.revokeObjectURL(url);};
 slider.oninput=()=>{zoom=+slider.value;draw();};
 canvas.onpointerdown=e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:x,startY:y};canvas.setPointerCapture(e.pointerId);};
 canvas.onpointermove=e=>{if(!drag||e.pointerId!==drag.id)return;const ratio=320/canvas.getBoundingClientRect().width;x=drag.startX+(e.clientX-drag.x)*ratio;y=drag.startY+(e.clientY-drag.y)*ratio;draw();};
 canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;};
 canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();x+=e.key==='ArrowLeft'?-5:e.key==='ArrowRight'?5:0;y+=e.key==='ArrowUp'?-5:e.key==='ArrowDown'?5:0;draw();};
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.addEventListener('click',e=>{const action=e.target.closest('[data-crop]')?.dataset.crop;if(action==='cancel')close();if(action==='reset'){x=y=0;zoom=1;slider.value='1';draw();}if(action==='apply'){const result=document.createElement('canvas');result.width=result.height=512;const g=cropGeometry(image.naturalWidth,image.naturalHeight,zoom,x,y),ratio=512/320;result.getContext('2d').drawImage(image,g.left*ratio,g.top*ratio,g.width*ratio,g.height*ratio);onApply(result.toDataURL('image/png'));close();}});
 document.body.append(dialog);draw();dialog.showModal();canvas.focus();
}
