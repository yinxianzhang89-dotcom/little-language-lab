let dbPromise;
export function openStore(namespace='main'){return dbPromise??=new Promise((resolve,reject)=>{const req=indexedDB.open('language-island-v3-'+namespace,2);req.onupgradeneeded=()=>{for(const name of ['profiles','recordings','materials','courses'])if(!req.result.objectStoreNames.contains(name))req.result.createObjectStore(name,name==='profiles'?undefined:{keyPath:'id'});};req.onblocked=()=>reject(Error('请关闭其他旧版学习页面后刷新，以完成本机资料库升级。'));req.onsuccess=()=>{req.result.onversionchange=()=>req.result.close();resolve(req.result);};req.onerror=()=>reject(req.error);});}
async function operation(store,mode,fn){const db=await dbPromise;if(!db)throw Error('本机存储尚未就绪');return new Promise((resolve,reject)=>{const tx=db.transaction(store,mode),req=fn(tx.objectStore(store));let value;req.onsuccess=()=>value=req.result;tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
export const loadLearner=()=>operation('profiles','readonly',s=>s.get('current'));
export const saveLearner=s=>operation('profiles','readwrite',o=>o.put(structuredClone(s),'current'));
export const saveRecording=r=>operation('recordings','readwrite',s=>s.put(r));
export const recordingsFor=async key=>(await operation('recordings','readonly',s=>s.getAll())).filter(r=>r.key===key).sort((a,b)=>(b.at||'').localeCompare(a.at||''));
export const removeRecording=id=>operation('recordings','readwrite',s=>s.delete(id));
export const loadMaterials=()=>operation('materials','readonly',s=>s.getAll());
export const putMaterials=async rows=>{const db=await dbPromise;return new Promise((resolve,reject)=>{const tx=db.transaction('materials','readwrite');for(const row of rows)tx.objectStore('materials').put(row);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});};
export const loadCourses=()=>operation('courses','readonly',s=>s.getAll());
export const putCourse=course=>operation('courses','readwrite',s=>s.put(course));
export const clearLocal=async()=>{await operation('profiles','readwrite',s=>s.clear());await operation('recordings','readwrite',s=>s.clear());};
