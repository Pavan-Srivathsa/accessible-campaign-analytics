export const METRICS = ['spend', 'clicks', 'conversions'];
const LIMIT = 10000;
/** RFC-style CSV fields with quoted commas/newlines and escaped quotes. */
export function csvCells(text) {
  const rows = []; let row = [], cell = '', quoted = false, closed = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i+1] === '"') { cell += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else cell += c;
    } else if (c === ',' || c === '\n' || c === '\r') {
      row.push(cell); cell = ''; closed = false;
      if (c !== ',') { if (row.some(v => v.trim())) rows.push(row); row = []; if(c === '\r' && text[i+1] === '\n') i++; }
    } else if (c === '"') {
      if(cell || closed) throw Error('Malformed CSV quotation.'); quoted = true;
    } else { if(closed) throw Error('Unexpected text after closing quote.'); cell += c; }
    if(rows.length > LIMIT+1) throw Error('CSV exceeds 10,000 data rows.');
  }
  if (quoted) throw Error('Unclosed quoted CSV field.');
  row.push(cell); if(row.some(v => v.trim())) rows.push(row);
  return rows;
}
export function parseCSV(text) {
  if(new TextEncoder().encode(text).length > 2_000_000) throw Error('CSV must be smaller than 2 MB.');
  const [header, ...rows] = csvCells(text);
  if(rows.length > LIMIT) throw Error('CSV exceeds 10,000 data rows.');
  if(!header || !rows.length) throw Error('CSV needs a header and at least one data row.');
  const required = ['campaign', ...METRICS];
  const names = header.map(h => h.trim().toLowerCase());
  if(new Set(names).size !== names.length) throw Error('Duplicate CSV column names.');
  if(required.some(h => !names.includes(h))) throw Error('Required columns: campaign, spend, clicks, conversions.');
  const data = rows.map((row, i) => {
    if(row.length !== header.length) throw Error(`Row ${i+2}: incorrect number of columns.`);
    const record = Object.fromEntries(names.map((h,j) => [h, row[j].trim()]));
    const item = {campaign:record.campaign};
    for(const key of METRICS) {
      if(!record[key] || !/^\d+(\.\d+)?$/.test(record[key])) throw Error(`Row ${i+2}: ${key} must be a nonnegative number.`);
      item[key] = Number(record[key]);
      if(!Number.isFinite(item[key]) || item[key] > 1e12 || (key !== 'spend' && !Number.isSafeInteger(item[key]))) throw Error(`Row ${i+2}: invalid ${key}.`);
    }
    if(!item.campaign || item.campaign.length > 100) throw Error(`Row ${i+2}: campaign needs 1–100 characters.`);
    if(item.conversions > item.clicks) throw Error(`Row ${i+2}: conversions cannot exceed clicks in this dataset.`);
    return item;
  });
  const aggregated = new Map();
  for (const item of data) {
    const prior = aggregated.get(item.campaign) || {campaign:item.campaign,spend:0,clicks:0,conversions:0};
    for(const key of METRICS) prior[key] += item[key];
    aggregated.set(item.campaign, prior);
  }
  if(aggregated.size > 50) throw Error('Use at most 50 distinct campaigns for chart readability.');
  return [...aggregated.values()].map(r=>({...r,spend:Math.round(r.spend*100)/100}));
}
export function factsFor(rows) {
  const totals = Object.fromEntries(METRICS.map(k=>[k, Math.round(rows.reduce((s,r)=>s+r[k],0)*100)/100]));
  const leaders = Object.fromEntries(METRICS.map(k=>[k, rows.reduce((a,b)=>b[k]>a[k]?b:a)]));
  return {totals,leaders,campaigns:rows.length,conversionRate:totals.clicks?100*totals.conversions/totals.clicks:0};
}
export function defaultClaims(rows) {
  const f=factsFor(rows);
  return METRICS.flatMap(metric=>[
    {metric,scope:'total',value:f.totals[metric]},
    {metric,scope:'leader',campaign:f.leaders[metric].campaign,value:f.leaders[metric][metric]}
  ]);
}
/** Only supported, factual structured claims are displayed. No free-form model prose. */
export function validateClaims(claims, rows) {
  if(!Array.isArray(claims) || !claims.length || claims.length>12) return {valid:false,errors:['Expected 1–12 claims.']};
  const f=factsFor(rows); const errors=[];
  claims.forEach((c,i)=>{
    if(!c || !METRICS.includes(c.metric) || !['total','leader'].includes(c.scope) || typeof c.value !== 'number' || !Number.isFinite(c.value)) {errors.push(`Claim ${i+1}: invalid schema.`);return;}
    const expected=c.scope==='total'?f.totals[c.metric]:f.leaders[c.metric][c.metric];
    if(Math.abs(c.value-expected)>0.005) errors.push(`Claim ${i+1}: incorrect numeric value.`);
    if(c.scope==='leader' && !rows.some(r=>r.campaign===c.campaign && r[c.metric]===expected)) errors.push(`Claim ${i+1}: incorrect leading campaign.`);
  });
  return {valid:errors.length===0,errors};
}
export function describeClaim(c) {
  const value=new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(c.value);
  return c.scope==='total'?`Total ${c.metric}: ${value}${c.metric==='spend'?' USD':''}.`:`${c.campaign} has the highest ${c.metric}: ${value}${c.metric==='spend'?' USD':''}.`;
}
