/* ============================================================
   VELORA SPRINT 2 — S2-C REVIEWS + RATINGS
   DB-authoritative reviews; legacy localStorage review paths are
   not used for persistence. Restore-Test first, production frozen.
   ============================================================ */
(function(){
'use strict';
const db=window.mahaSupabase||window.supabaseClient||window.sb;
if(!db?.rpc)return;
const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const getDb=()=>window.mahaSupabase||window.supabaseClient||window.sb;
const rpc=async(name,args={})=>{const r=await getDb().rpc(name,args);if(r.error)throw r.error;return r.data};
const currentUser=async()=>{const r=await getDb().auth.getUser();if(r.error)throw r.error;return r.data?.user||null};
function stars(rating){const n=Math.max(0,Math.min(5,Number(rating)||0));return '★★★★★'.split('').map((_,i)=>i<n?'★':'☆').join('')}
function reviewCard(r){
 const date=r.created_at?new Date(r.created_at).toLocaleDateString():'';
 return '<article class="velora-s2c-review"><div class="velora-s2c-review-top"><div><strong>'+esc(r.reviewer_name||'Customer')+'</strong><div class="velora-s2c-stars" aria-label="'+esc(r.rating)+' out of 5">'+stars(r.rating)+'</div></div>'+(r.is_verified_purchase?'<span class="velora-s2c-verified">✓ Verified purchase</span>':'')+'</div>'+(r.product_name?'<div class="velora-s2c-muted">'+esc(r.product_name)+'</div>':'')+(r.title?'<h4>'+esc(r.title)+'</h4>':'')+(r.content?'<p>'+esc(r.content)+'</p>':'')+'<div class="velora-s2c-review-date">'+esc(date)+'</div></article>';
}
async function loadSummary(productId){return await rpc('velora_get_product_review_summary',{p_product_id:productId})||{average_rating:0,review_count:0,distribution:{'1':0,'2':0,'3':0,'4':0,'5':0}}}
async function loadProductReviews(productId,limit=20){return await rpc('velora_get_product_reviews',{p_product_id:productId,p_limit:limit,p_offset:0})||[]}
async function renderProductReviews(productId){
 const content=document.getElementById('productModalContent');if(!content)return;
 let host=document.getElementById('veloraS2CProductReviews');if(!host){host=document.createElement('div');host.id='veloraS2CProductReviews';content.appendChild(host)}
 host.innerHTML='<div class="velora-s2c-loading">Loading reviews…</div>';
 try{
  const [summary,reviews,user]=await Promise.all([loadSummary(productId),loadProductReviews(productId),currentUser().catch(()=>null)]);
  const p=(window.MAHA_DATA?.PRODUCTS||[]).find(x=>x.id===productId);
  if(p){p.rating=Number(summary.average_rating||0);p.reviewsCount=Number(summary.review_count||0);p.reviewCount=Number(summary.review_count||0)}
  let eligible=false;
  if(user){try{const e=await rpc('velora_get_review_eligibility',{p_product_id:productId});eligible=!!e?.eligible}catch(_){}}
  const dist=summary.distribution||{},total=Math.max(1,Number(summary.review_count||0));
  host.innerHTML='<div class="velora-s2c-card"><div class="velora-s2c-card-head"><div><h3>⭐ Customer Reviews</h3><div class="velora-s2c-muted">Published reviews are stored and moderated in Supabase.</div></div><button class="btn btn-primary" onclick="window.VELORA_OPEN_REVIEW(\''+esc(productId)+'\')">'+(user?'✍️ Write a Review':'🔐 Sign in to Review')+'</button></div><div class="velora-s2c-summary"><div class="velora-s2c-score"><div class="velora-s2c-score-num">'+Number(summary.average_rating||0).toFixed(1)+'</div><div class="velora-s2c-stars">'+stars(summary.average_rating)+'</div><div class="velora-s2c-muted">'+Number(summary.review_count||0)+' published reviews</div></div><div class="velora-s2c-distribution">'+[5,4,3,2,1].map(n=>{const count=Number(dist[String(n)]||0),pct=Math.round(count/total*100);return '<div class="velora-s2c-dist"><span>'+n+'★</span><div class="velora-s2c-bar"><i style="width:'+pct+'%"></i></div><span>'+count+'</span></div>'}).join('')+'</div></div><div class="velora-s2c-list">'+(reviews.length?reviews.map(reviewCard).join(''):'<div class="velora-s2c-empty">No published reviews yet.</div>')+'</div>'+(user&&!eligible?'<div class="velora-s2c-note">Reviewing is available after a delivered purchase of this product. The server decides eligibility.</div>':'')+'</div>';
 }catch(e){host.innerHTML='<div class="velora-s2c-error">Unable to load reviews: '+esc(e.message||e)+'</div>'}
}
async function openReview(productId){
 const user=await currentUser().catch(()=>null);
 if(!user){if(typeof showToast==='function')showToast('⚠️ Please login first','warning');if(typeof openAuthModal==='function')openAuthModal('login');return}
 let eligibility;try{eligibility=await rpc('velora_get_review_eligibility',{p_product_id:productId})}catch(e){if(typeof showToast==='function')showToast('❌ Could not verify review eligibility','error');return}
 if(!eligibility?.eligible){if(typeof showToast==='function')showToast('ℹ️ Reviews are available after delivery of your purchase.','info');return}
 const modal=document.getElementById('writeReviewModal')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'writeReviewModal',className:'modal'}));
 const p=(window.MAHA_DATA?.PRODUCTS||[]).find(x=>x.id===productId);
 modal.innerHTML='<div class="modal-content velora-s2c-review-modal"><div class="modal-header"><h2>✍️ Write a Review</h2><button class="modal-close" onclick="closeModal(\'writeReviewModal\')">✕</button></div>'+(p?'<div class="velora-s2c-product-ref"><span>'+esc(p.emoji||'📦')+'</span><div><strong>'+esc(p.name)+'</strong><div class="velora-s2c-muted">'+esc(p.brand||'')+'</div></div></div>':'')+'<form id="veloraS2CReviewForm"><div class="form-group"><label>Rating *</label><div id="veloraS2CStars" class="velora-s2c-input-stars">'+[1,2,3,4,5].map(n=>'<button type="button" data-rating="'+n+'" aria-label="'+n+' stars">★</button>').join('')+'</div></div><div class="form-group"><label>Title</label><input id="veloraS2CTitle" class="form-input" maxlength="150"></div><div class="form-group"><label>Your review *</label><textarea id="veloraS2CContent" class="form-textarea" minlength="10" maxlength="2000" rows="6" required></textarea></div><button class="btn btn-primary btn-block btn-lg" type="submit">Submit for Review</button></form></div>';
 modal.classList.add('active');document.body.style.overflow='hidden';
 let chosen=5;const paint=()=>modal.querySelectorAll('#veloraS2CStars button').forEach(b=>b.classList.toggle('active',Number(b.dataset.rating)<=chosen));
 modal.querySelectorAll('#veloraS2CStars button').forEach(b=>b.onclick=()=>{chosen=Number(b.dataset.rating);paint()});paint();
 modal.querySelector('#veloraS2CReviewForm').onsubmit=async ev=>{ev.preventDefault();const submit=ev.submitter;if(submit)submit.disabled=true;try{const content=modal.querySelector('#veloraS2CContent').value.trim();if(content.length<10)throw new Error('Review must contain at least 10 characters.');await rpc('velora_submit_review',{p_product_id:productId,p_order_item_id:eligibility.order_item_id,p_rating:chosen,p_title:modal.querySelector('#veloraS2CTitle').value.trim()||null,p_content:content});closeModal('writeReviewModal');if(typeof showToast==='function')showToast('✅ Review submitted for moderation','success');await renderProductReviews(productId);if(window.STATE?.currentPage==='reviews')renderDbReviewsPage()}catch(e){if(typeof showToast==='function')showToast('❌ '+(e.message||e),'error');if(submit)submit.disabled=false}};
}
async function renderDbReviewsPage(){
 const c=document.getElementById('reviewsContent');if(!c)return;c.innerHTML='<div class="velora-s2c-loading">Loading published reviews…</div>';
 try{const rows=await rpc('velora_get_published_reviews_feed',{p_limit:100,p_offset:0});const data=Array.isArray(rows)?rows:[];const total=data.length,avg=total?data.reduce((s,r)=>s+Number(r.rating||0),0)/total:0,five=data.filter(r=>Number(r.rating)===5).length;c.innerHTML='<div class="velora-s2c-page"><div class="velora-s2c-page-head"><div><h2>Reviews & Ratings</h2><p class="velora-s2c-muted">Published customer reviews from the authoritative database.</p></div></div><div class="velora-s2c-kpis"><div><b>'+total+'</b><span>Published reviews loaded</span></div><div><b>'+avg.toFixed(1)+'</b><span>Average rating</span></div><div><b>'+five+'</b><span>5-star reviews</span></div></div><div class="velora-s2c-list">'+(data.length?data.map(reviewCard).join(''):'<div class="velora-s2c-empty">No published reviews yet.</div>')+'</div></div>'}catch(e){c.innerHTML='<div class="velora-s2c-error">Unable to load reviews: '+esc(e.message||e)+'</div>'}
}
async function renderSellerReviews(){
 const c=document.getElementById('sellerContent');if(!c)return;let panel=document.getElementById('veloraS2CSellerReviews');if(panel)panel.remove();panel=document.createElement('section');panel.id='veloraS2CSellerReviews';panel.className='velora-s2c-card';c.appendChild(panel);panel.innerHTML='<div class="velora-s2c-loading">Loading seller reviews…</div>';
 try{const rows=await rpc('velora_get_seller_reviews',{p_limit:50,p_offset:0,p_status:null});panel.innerHTML='<div class="velora-s2c-card-head"><div><h3>⭐ Reviews for Your Store</h3><div class="velora-s2c-muted">Read-only seller view. Moderation remains a staff control.</div></div></div><div class="velora-s2c-list">'+(rows?.length?rows.map(r=>'<article class="velora-s2c-review"><div class="velora-s2c-review-top"><div><strong>'+esc(r.product_name||'Product')+'</strong><div class="velora-s2c-stars">'+stars(r.rating)+'</div></div><span class="velora-s2c-status">'+esc(r.status)+'</span></div>'+(r.title?'<h4>'+esc(r.title)+'</h4>':'')+(r.content?'<p>'+esc(r.content)+'</p>':'')+'<div class="velora-s2c-review-date">'+esc(r.reviewer_name||'Customer')+' · '+esc(new Date(r.created_at).toLocaleDateString())+'</div></article>').join(''):'<div class="velora-s2c-empty">No reviews for your store yet.</div>')+'</div>'}catch(e){panel.innerHTML='<div class="velora-s2c-error">Unable to load seller reviews: '+esc(e.message||e)+'</div>'}
}
async function renderAdminReviewQueue(status='pending'){
 const c=document.getElementById('adminContent');if(!c)return;c.innerHTML='<div class="velora-s2c-loading">Loading review moderation queue…</div>';
 try{const rows=await rpc('velora_get_review_moderation_queue',{p_status:status,p_limit:100,p_offset:0});c.innerHTML='<div class="velora-s2c-page"><div class="velora-s2c-page-head"><div><h2>Review Moderation</h2><p class="velora-s2c-muted">Staff-only moderation. Public exposure is limited to published reviews.</p></div><select id="veloraS2CModStatus" class="form-input" style="max-width:180px"><option value="pending">Pending</option><option value="published">Published</option><option value="hidden">Hidden</option><option value="rejected">Rejected</option></select></div><div class="velora-s2c-admin-list">'+(rows?.length?rows.map(r=>'<article class="velora-s2c-admin-review" data-review-id="'+esc(r.id)+'"><div class="velora-s2c-review-top"><div><strong>'+esc(r.product_name||'Product')+'</strong><div class="velora-s2c-stars">'+stars(r.rating)+'</div></div><span class="velora-s2c-status">'+esc(r.status)+'</span></div><div class="velora-s2c-muted">'+esc(r.seller_name||'Seller')+' · '+esc(r.reviewer_name||'Customer')+' · '+esc(new Date(r.created_at).toLocaleString())+'</div>'+(r.title?'<h4>'+esc(r.title)+'</h4>':'')+(r.content?'<p>'+esc(r.content)+'</p>':'')+'<div class="velora-s2c-actions">'+['published','hidden','rejected'].map(s=>'<button class="btn '+(s==='published'?'btn-primary':'btn-outline')+' velora-s2c-mod-btn" data-status="'+s+'">'+s+'</button>').join('')+'</div></article>').join(''):'<div class="velora-s2c-empty">No reviews in this queue.</div>')+'</div></div>';
  const sel=document.getElementById('veloraS2CModStatus');if(sel){sel.value=status;sel.onchange=()=>renderAdminReviewQueue(sel.value)}
  c.querySelectorAll('.velora-s2c-mod-btn').forEach(btn=>btn.onclick=async()=>{const card=btn.closest('[data-review-id]');btn.disabled=true;try{await rpc('velora_moderate_review',{p_review_id:card.dataset.reviewId,p_status:btn.dataset.status});if(typeof showToast==='function')showToast('✅ Review status updated','success');await renderAdminReviewQueue(status)}catch(e){if(typeof showToast==='function')showToast('❌ '+(e.message||e),'error');btn.disabled=false}});
 }catch(e){c.innerHTML='<div class="velora-s2c-error">Review moderation is unavailable: '+esc(e.message||e)+'</div>'}
}
window.VELORA_OPEN_REVIEW=openReview;window.VELORA_REFRESH_S2C_PRODUCT_REVIEWS=renderProductReviews;
const legacyRenderReviewsPage=window.renderReviewsPage;window.renderReviewsPage=renderDbReviewsPage;
const legacyOpenProduct=window.openProductDetail;window.openProductDetail=async function(productId){const r=legacyOpenProduct?await legacyOpenProduct.apply(this,arguments):undefined;const pId=String(productId||'');if(document.getElementById('productModalContent')&&pId){document.querySelectorAll('#productModalContent .review-action-btn').forEach(x=>x.remove());await renderProductReviews(pId)}return r};
const legacyOpenSeller=window.VELORA_OPEN_SELLER;window.VELORA_OPEN_SELLER=async function(){const r=legacyOpenSeller?await legacyOpenSeller.apply(this,arguments):undefined;setTimeout(renderSellerReviews,180);return r};
function addSellerNav(){const nav=document.querySelector('#sellerPlatform .seller-nav');if(!nav||nav.querySelector('[data-s2c-reviews]'))return;const item=document.createElement('div');item.className='seller-nav-item';item.dataset.s2cReviews='1';item.innerHTML='<span>⭐</span><span>Reviews</span>';item.onclick=renderSellerReviews;nav.appendChild(item)}
function addAdminNav(){const nav=document.querySelector('#adminPlatform .admin-nav');if(!nav||nav.querySelector('[data-s2c-review-nav]'))return;const sec=document.createElement('div');sec.className='admin-nav-section';sec.innerHTML='<div class="admin-nav-title">Catalog Trust</div><div class="admin-nav-item" data-s2c-review-nav><span>⭐</span><span>Reviews</span></div>';const item=sec.querySelector('[data-s2c-review-nav]');item.onclick=()=>{document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));item.classList.add('active');const h=document.getElementById('adminHeaderTitle');if(h)h.textContent='Review Moderation';renderAdminReviewQueue('pending')};nav.appendChild(sec)}
const legacyOpenAdmin=window.openAdminPlatform;window.openAdminPlatform=async function(){const r=legacyOpenAdmin?await legacyOpenAdmin.apply(this,arguments):undefined;setTimeout(addAdminNav,350);setTimeout(addSellerNav,350);return r};window.VELORA_OPEN_ADMIN=window.openAdminPlatform;
setTimeout(()=>{addAdminNav();addSellerNav()},1200);
/* Defense-in-depth: neutralize legacy localStorage review writers.
   All current review entry points route through the DB-authoritative S2-C flow. */
window.openWriteReviewModal=window.VELORA_OPEN_REVIEW;
window.openWriteReview=window.VELORA_OPEN_REVIEW;
window.submitReviewV2=function(event,productId){if(event?.preventDefault)event.preventDefault();return window.VELORA_OPEN_REVIEW(productId)};
window.submitReview=function(event,productId){if(event?.preventDefault)event.preventDefault();return window.VELORA_OPEN_REVIEW(productId)};
console.log('✅ Velora S2-C Reviews + Ratings loaded');
})();