(function(){
  async function rpc(name,args){
    const sb=window.supabaseClient||window.supabase||null;
    if(!sb||typeof sb.rpc!=='function') throw new Error('Supabase client not available');
    return sb.rpc(name,args||{});
  }
  window.veloraStage35TestConsent=async function(){
    const el=document.getElementById('v35Status');
    try{const r=await rpc('velora_get_personalization_state'); if(r.error) throw r.error; const d=r.data||{};
      document.getElementById('v35Consent').textContent=d.consent_granted?'GRANTED':'NOT GRANTED';
      document.getElementById('v35Mode').textContent=d.effective_mode||'contextual';
      el.textContent='Personalization state refreshed securely.';
    }catch(e){el.textContent='State check requires an authenticated session.';}
  };
  window.veloraStage35Refresh=async function(){
    const el=document.getElementById('v35Status');
    try{const r=await rpc('velora_get_recommendation_quality'); if(r.error) throw r.error; const d=r.data||{};
      document.getElementById('v35Events').textContent=d.total_events??0;
      document.getElementById('v35Ctr').textContent=((d.ctr??0))+'%';
      el.textContent='Recommendation quality refreshed.';
    }catch(e){el.textContent='Quality metrics are staff-only and require the correct role.';}
  };
})();
