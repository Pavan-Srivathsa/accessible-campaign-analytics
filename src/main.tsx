import React,{useState,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {AutoVizuA11y} from '@feedzai/autovizua11y';
import {parseCSV,factsFor,defaultClaims,describeClaim} from './analytics.mjs';
import sample from './sample.csv?raw';
import './style.css';
type Row={campaign:string;spend:number;clicks:number;conversions:number};
type Claim={metric:string;scope:string;value:number;campaign?:string};
const metrics=['spend','clicks','conversions'] as const;
const fmt=(v:number)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(v);
const Chart=React.memo(function Chart({rows,metric}:{rows:Row[];metric:typeof metrics[number]}){
 const title=metric[0].toUpperCase()+metric.slice(1)+' by campaign';
 const points=rows.map(r=>({campaign:r.campaign,value:r[metric]}));
 const max=Math.max(1,...points.map(p=>p.value));
 const desc=describeClaim(defaultClaims(rows).find(c=>c.metric===metric&&c.scope==='leader'));
 return <section className="chart-card" aria-labelledby={metric+'-heading'}>
  <div className="card-heading"><h2 id={metric+'-heading'}>{title}</h2><span className="tag">{metric==='spend'?'USD':'Count'}</span></div>
  <p className="chart-description">{desc}</p>
  <AutoVizuA11y data={points} selectorType={{element:'rect'}} type="horizontal bar chart" title={title} insights="value" descriptor={metric==='spend'?'USD':metric} manualDescriptions={{shorter:desc,longer:`${title}. ${points.map(p=>`${p.campaign}: ${fmt(p.value)}`).join('. ')}. Use down arrow to enter the chart and left or right arrows to explore values.`}}>
   <svg viewBox={`0 0 580 ${rows.length*43+12}`} role="img" aria-label={title}>
    {points.map((p,i)=><g key={p.campaign}><text x="0" y={i*43+19} className="chart-label">{p.campaign.length>21?p.campaign.slice(0,20)+'…':p.campaign}</text><rect x="170" y={i*43+3} width={Math.max(2,p.value/max*300)} height="25" rx="4" fill={metric==='spend'?'#176456':metric==='clicks'?'#315991':'#774686'}/><text x={180+p.value/max*300} y={i*43+20} className="chart-value">{fmt(p.value)}</text></g>)}
   </svg>
  </AutoVizuA11y>
  <details><summary>View {metric} data table</summary><div className="table-wrap"><table><caption>{title}{metric==='spend'?' (USD)':''}</caption><thead><tr><th scope="col">Campaign</th><th scope="col">{metric}</th></tr></thead><tbody>{rows.map(r=><tr key={r.campaign}><th scope="row">{r.campaign}</th><td>{fmt(r[metric])}</td></tr>)}</tbody></table></div></details>
 </section>;
});
function App(){
 const [csv,setCsv]=useState(sample); const [rows,setRows]=useState<Row[]>(()=>parseCSV(sample));
 const [filter,setFilter]=useState('all');const [error,setError]=useState('');const [notice,setNotice]=useState('Synthetic demo data loaded.');
 const [claims,setClaims]=useState<Claim[]>(()=>defaultClaims(parseCSV(sample))); const [busy,setBusy]=useState(false);const [source,setSource]=useState('Verified calculations');
 const input=useRef<HTMLInputElement>(null);
 const shown=filter==='all'?rows:rows.filter(r=>r.campaign===filter);const facts=factsFor(shown);
 function load(text:string,name:string){try{const data=parseCSV(text) as Row[];setRows(data);setCsv(text);setFilter('all');setClaims(defaultClaims(data));setSource('Verified calculations');setError('');setNotice(`Loaded ${data.length} campaigns from ${name}.`);}catch(e){setError((e as Error).message);}}
 async function upload(e:React.ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];if(!file)return;if(file.size>2_000_000){setError('CSV must be smaller than 2 MB.');return;}try{load(await file.text(),file.name);}catch{setError('Could not read the selected file.');}e.target.value='';}
 async function summarize(ai:boolean){setBusy(true);setError('');try{const response=await fetch('/api/summary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({csv,mode:ai?'ai':'deterministic'})});const result=await response.json();if(!response.ok)throw Error(result.error);setClaims(result.claims);setSource(ai?'AI claims · numerically validated':'Verified calculations');setNotice('Summary updated. All displayed claims passed numeric validation.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <><a className="skip" href="#main">Skip to dashboard</a><header><div className="brand"><span className="brand-icon" aria-hidden="true">◒</span> Campaign Lens <span className="brand-sub">Accessible analytics</span></div><a href="https://github.com/feedzai/AutoVizuA11y">Built with AutoVizuA11y ↗</a></header>
 <main id="main" tabIndex={-1}><div className="hero"><div><p className="eyebrow">PERFORMANCE, WITH PERSPECTIVE</p><h1>A clearer view of every campaign.</h1><p>Explore your data visually, by keyboard, or with a screen reader.</p></div><div className="demo-badge">SYNTHETIC DEMO DATA · USD</div></div>
 <section className="toolbar" aria-label="Dataset controls"><div><label htmlFor="csv">Upload campaign CSV</label><input id="csv" ref={input} type="file" accept=".csv,text/csv" onChange={upload} aria-describedby="csv-help"/><p id="csv-help">Up to 2 MB. Columns: campaign, spend, clicks, conversions. Duplicate campaigns are combined.</p></div><div className="toolbar-actions"><button onClick={()=>load(sample,'synthetic demo')}>Reset demo</button><a download="sample-campaigns.csv" href={'data:text/csv;charset=utf-8,'+encodeURIComponent(sample)}>Download sample CSV</a></div></section>
 <div role="status" aria-live="polite" className="status">{notice}</div>{error&&<div role="alert" className="error">{error}</div>}
 <div className="section-heading"><h2>Campaign overview</h2><div><label htmlFor="filter">Campaign </label><select id="filter" value={filter} onChange={e=>{setFilter(e.target.value);setNotice('Chart and overview filter updated. Summaries cover the full dataset.');}}><option value="all">All campaigns</option>{rows.map(r=><option key={r.campaign}>{r.campaign}</option>)}</select></div></div>
 <section className="kpis" aria-label="Performance totals"><article><h3>Total spend</h3><p>${fmt(facts.totals.spend)}</p><span>USD invested</span></article><article><h3>Clicks</h3><p>{fmt(facts.totals.clicks)}</p><span>Recorded interactions</span></article><article><h3>Conversions</h3><p>{fmt(facts.totals.conversions)}</p><span>{facts.conversionRate.toFixed(2)}% of clicks</span></article></section>
 <aside className="keyboard"><strong>Explore without a mouse.</strong> Tab to a chart, press ↓ to enter, then ← / → to move between values. Press ? for chart shortcuts. Data tables are available below every chart.</aside>
 <div className="charts" key={filter+csv}>{metrics.map(metric=><Chart key={metric} metric={metric} rows={shown}/>)}</div>
 <section className="insights" aria-labelledby="insights-title"><div className="card-heading"><div><p className="eyebrow">GROUNDED IN YOUR DATA</p><h2 id="insights-title">Campaign briefing</h2></div><span className="tag">{source}</span></div><p>Summaries always cover all uploaded campaigns. Verified summaries use exact calculations. AI mode sends campaign names and metrics to the configured provider only when requested.</p><ul>{claims.map((c,i)=><li key={i}>{describeClaim(c)}</li>)}</ul><div className="button-row"><button disabled={busy} onClick={()=>summarize(false)}>{busy?'Working…':'Refresh verified summary'}</button><button className="primary" disabled={busy} onClick={()=>summarize(true)}>Generate validated AI summary</button></div><p className="small">AI is optional. Unsupported numbers and claims are rejected before display.</p></section>
 <footer>Campaign Lens · Independent application using Feedzai’s AutoVizuA11y library.<br/>Accessibility checks help find issues; full screen-reader compatibility requires manual testing.</footer></main></>;
}
createRoot(document.getElementById('root')!).render(<App/>);
