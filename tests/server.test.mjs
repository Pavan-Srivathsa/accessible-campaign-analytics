import test from 'node:test';import assert from 'node:assert/strict';
import {createServer} from '../server/index.mjs';
async function withServer(run){const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));try{await run('http://127.0.0.1:'+server.address().port);}finally{await new Promise(r=>server.close(r));}}
const csv='campaign,spend,clicks,conversions\nA,12,20,3';
test('health and deterministic summary API',()=>withServer(async base=>{
 assert.equal((await fetch(base+'/api/health')).status,200);
 const response=await fetch(base+'/api/summary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({csv})});
 const body=await response.json();assert.equal(response.status,200);assert.equal(body.validated,true);assert.equal(body.claims.length,6);
}));
test('rejects malformed requests and cross-origin requests',()=>withServer(async base=>{
 assert.equal((await fetch(base+'/api/summary',{method:'POST',body:'not json'})).status,400);
 assert.equal((await fetch(base+'/api/summary',{method:'POST',headers:{Origin:'https://evil.example'},body:JSON.stringify({csv})})).status,403);
 assert.equal((await fetch(base+'/api/nope')).status,404);
}));
test('AI endpoint validates provider output before returning claims',async()=>{
 const http=await import('node:http');let value=12;
 const provider=http.createServer(async(req,res)=>{for await(const chunk of req){}res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:JSON.stringify({claims:[{metric:'spend',scope:'total',value}]})}}]}));});
 await new Promise(r=>provider.listen(0,'127.0.0.1',r));
 const names=['OPENAI_API_KEY','OPENAI_MODEL','OPENAI_BASE_URL'];const old=Object.fromEntries(names.map(k=>[k,process.env[k]]));
 process.env.OPENAI_API_KEY='test-only-not-a-secret';process.env.OPENAI_MODEL='mock';process.env.OPENAI_BASE_URL='http://127.0.0.1:'+provider.address().port;
 try{await withServer(async base=>{
  const request=()=>fetch(base+'/api/summary',{method:'POST',body:JSON.stringify({csv,mode:'ai'})});
  let response=await request();assert.equal(response.status,200);assert.equal((await response.json()).validated,true);
  value=999;response=await request();assert.equal(response.status,422);
 });}finally{for(const k of names){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}await new Promise(r=>provider.close(r));}
});
