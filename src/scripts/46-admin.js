(()=>{
'use strict';
const S52={installed:false,renames:0,mutations:0,lastRun:null};
function scan(){
  const seen=new Map(), findings=[];
  document.querySelectorAll('[id]').forEach(el=>{
    const id=el.id; if(!id)return;
    const n=(seen.get(id)||0)+1; seen.set(id,n);
    if(n>1) findings.push({id,n,el});
  });
  const grouped={};
  findings.forEach(f=>(grouped[f.id]??=[]).push(f.el));
  return {duplicates:Object.entries(grouped),count:findings.length,unique:seen.size};
}
function safeRenameDuplicates(){
  const r=scan(); let changed=0;
  r.duplicates.forEach(([id,els])=>{
    els.forEach((el,i)=>{
      if(i===0)return;
      const next=`${id}__legacy${i}`;
      if(document.getElementById(next))return;
      el.setAttribute('data-velora-original-id',id); el.id=next; changed++;
    });
  });
  S52.renames+=changed; S52.lastRun=new Date().toISOString(); return {changed,after:scan()};
}
function startObserver(){
 if(S52.installed)return;
 const mo=new MutationObserver(muts=>{
   S52.mutations+=muts.length;
   let needs=false; muts.forEach(m=>m.addedNodes&&m.addedNodes.forEach(n=>{if(n.nodeType===1 && (n.id || n.querySelector?.('[id]'))) needs=true;}));
   if(needs) safeRenameDuplicates();
 });
 mo.observe(document.body,{subtree:true,childList:true});
 S52.installed=true;
}
async function render52(){
 const host=document.getElementById('veloraStage52'); if(!host)return;
 const r=scan();
 const status=r.count===0?'PASS':'WARN';
 host.innerHTML=`<div class="v52-wrap"><div class="v52-row"><div><strong>Stage 52 — DOM Integrity & Legacy Selector Hardening</strong><div class="v52-muted">Runtime protection for dynamically mounted legacy views. Duplicate IDs are detected and secondary dynamic instances receive a deterministic legacy suffix; original identity is preserved in data-velora-original-id.</div></div><button class="v52-btn primary" id="v52Run">Run cleanup</button></div><div class="v52-grid" style="margin-top:12px"><div class="v52-card"><div class="v52-muted">Current duplicates</div><div class="v52-big" id="v52Dup">${r.count}</div></div><div class="v52-card"><div class="v52-muted">Unique IDs</div><div class="v52-big">${r.unique}</div></div><div class="v52-card"><div class="v52-muted">Renamed this session</div><div class="v52-big" id="v52Ren">${S52.renames}</div></div><div class="v52-card"><div class="v52-muted">Posture</div><div style="margin-top:6px"><span class="v52-pill ${status==='PASS'?'v52-pass':'v52-warn'}" id="v52Status">${status}</span></div></div></div><div class="v52-card" style="margin-top:12px"><div class="v52-row"><strong>Legacy selector contract</strong><span class="v52-muted">Mutation-safe · deterministic IDs</span></div><div class="v52-muted" style="margin-top:7px">Cleanup is limited to secondary duplicate instances created at runtime. The first canonical instance keeps its original ID for compatibility.</div></div></div>`;
 document.getElementById('v52Run')?.addEventListener('click',()=>{const out=safeRenameDuplicates();render52();});
}
function install52(){
 if(document.getElementById('veloraStage52'))return;
 const c=document.getElementById('adminContent'); if(!c)return;
 const sec=document.createElement('div'); sec.id='veloraStage52'; c.appendChild(sec);
 startObserver(); safeRenameDuplicates(); render52();
}
function nav52(){
 const nav=document.querySelector('.admin-sidebar,.admin-nav,.admin-sidebar-nav'); if(!nav)return;
 if(nav.querySelector('[data-v52-nav]'))return;
 const sec=document.createElement('div'); sec.className='admin-nav-section'; sec.innerHTML='<div class="admin-nav-title">Quality</div><div class="admin-nav-item" data-v52-nav><span>🧹</span><span>DOM Integrity</span></div>';
 const item=sec.querySelector('[data-v52-nav]'); item.onclick=()=>{document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));item.classList.add('active');const t=document.getElementById('adminHeaderTitle');if(t)t.textContent='DOM Integrity & Legacy Selector Hardening';install52();}; nav.appendChild(sec);
}
const boot52=()=>{nav52(); if(document.getElementById('adminPlatform')?.classList.contains('active')) install52();};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot52);else boot52();
window.VELORA_STAGE52={scan52:scan,cleanup52:safeRenameDuplicates};
})();
