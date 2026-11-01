import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCSV,csvCells,factsFor,defaultClaims,validateClaims} from '../src/analytics.mjs';
const header='campaign,spend,clicks,conversions\n';
test('aggregates duplicate campaigns and rounds spend',()=>{
 const rows=parseCSV(header+'A,10.10,20,2\nA,0.20,10,1\nB,20,100,9');
 assert.deepEqual(rows[0],{campaign:'A',spend:10.3,clicks:30,conversions:3});
 assert.equal(factsFor(rows).totals.clicks,130);
});
test('reads quoted campaign names, BOM, CRLF, and escaped quotes',()=>{
 assert.equal(parseCSV('\uFEFF'+header+'"Brand, ""West""",1,4,2\r\n')[0].campaign,'Brand, "West"');
 assert.deepEqual(csvCells('a,b\n"line\nbreak",2'),[['a','b'],['line\nbreak','2']]);
});
test('rejects invalid CSV and impossible counts',()=>{
 for(const text of ['',header,header+'A,-1,1,0',header+'A,1,1,2',header+'A,1,2.5,0',header+'A,NaN,2,0',header+'A,,2,0',header+'A,1,2',header+'"A,1,2,0','campaign,campaign,spend,clicks,conversions\nA,B,1,2,0'])assert.throws(()=>parseCSV(text));
});
test('limits size and campaign count',()=>{
 assert.throws(()=>parseCSV('x'.repeat(2_000_001)));
 assert.throws(()=>parseCSV(header+Array.from({length:51},(_,i)=>`C${i},1,2,0`).join('\n')));
});
test('handles zero clicks and ties',()=>{
 const rows=parseCSV(header+'A,0,0,0\nB,0,0,0');assert.equal(factsFor(rows).conversionRate,0);
 assert.equal(validateClaims([{metric:'clicks',scope:'leader',campaign:'B',value:0}],rows).valid,true);
});
test('accepts truthful summaries and rejects hallucinated values',()=>{
 const rows=parseCSV(header+'A,12,20,3\nB,15,40,2');
 assert.equal(validateClaims(defaultClaims(rows),rows).valid,true);
 assert.equal(validateClaims([{metric:'clicks',scope:'total',value:61}],rows).valid,false);
 assert.equal(validateClaims([{metric:'spend',scope:'leader',campaign:'A',value:15}],rows).valid,false);
 assert.equal(validateClaims([{metric:'revenue',scope:'total',value:1}],rows).valid,false);
 assert.equal(validateClaims([],rows).valid,false);
});
test('100 generated datasets: accepts 600 true claims; rejects 100 mutated totals',()=>{
 for(let i=1;i<=100;i++){
  const rows=parseCSV(header+`A,${i}.25,${i*10},${i}\nB,${i*3},${i*20},${i*2}`);
  assert.equal(validateClaims(defaultClaims(rows),rows).valid,true);
  assert.equal(validateClaims([{metric:'conversions',scope:'total',value:i*3+1}],rows).valid,false);
 }
});
