type Entry={count:number;reset:number};
const entries=new Map<string,Entry>();
const requests=new Map<string,{expires:number;status:number;body:unknown}>();
export function checkRateLimit(key:string,limit=3,windowMs=60_000){const now=Date.now();const old=entries.get(key);if(!old||old.reset<=now){entries.set(key,{count:1,reset:now+windowMs});return {ok:true,retryAfter:0};}if(old.count>=limit)return {ok:false,retryAfter:Math.ceil((old.reset-now)/1000)};old.count++;return {ok:true,retryAfter:0};}
export function getIdempotent(key:string){const item=requests.get(key);if(!item||item.expires<=Date.now()){requests.delete(key);return null;}return item;}
export function setIdempotent(key:string,status:number,body:unknown){requests.set(key,{expires:Date.now()+10*60_000,status,body});}
