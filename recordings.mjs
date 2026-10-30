// Local-only recordings. Nothing in this module sends audio over the network.
function open(){return new Promise((resolve,reject)=>{const r=indexedDB.open('language-island-recordings'+(new URLSearchParams(location.search).get('qa')?'-qa-'+(new URLSearchParams(location.search).get('qa')||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,24):''),1);r.onupgradeneeded=()=>r.result.createObjectStore('clips');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function transact(mode,operation){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('clips',mode),request=operation(tx.objectStore('clips'));let result;request.onsuccess=()=>result=request.result;tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=()=>{db.close();reject(tx.error);};});}
export const getRecording=key=>transact('readonly',s=>s.get(key));
export const putRecording=(key,value)=>transact('readwrite',s=>s.put(value,key));
export const deleteRecording=key=>transact('readwrite',s=>s.delete(key));
export const clearRecordings=()=>transact('readwrite',s=>s.clear());
