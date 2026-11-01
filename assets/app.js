'use strict';
(() => {
 const catalog=window.KBT_CATALOG;
 const $=id=>document.getElementById(id);
 if(!catalog?.products?.length){$('results').textContent='상품 정보를 불러오지 못했습니다. 상단 스마트스토어에서 확인해 주세요.';return;}
 const products=catalog.products;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const won=v=>Number(v).toLocaleString('ko-KR');
 const params=new URLSearchParams(location.search);
 const normal=v=>String(v).toLowerCase().replace(/쏘나타/g,'소나타').replace(/산타페/g,'싼타페').replace(/펠리세이드/g,'팰리세이드').replace(/로켓트|로켓/g,'로케트').replace(/디젤/g,'경유').replace(/가솔린/g,'휘발유').replace(/쌍용/g,'kgm').replace(/[^a-z0-9가-힣]/g,'');
 const makers=['전체','현대','기아','르노','쉐보레','KGM','제네시스'];
 const kinds=['전체','AGM','일반','DIN'];
 let maker=makers.includes(params.get('maker'))?params.get('maker'):'전체';
 let kind=kinds.includes(params.get('type'))?params.get('type'):'전체';
 let query=(params.get('q')||'').slice(0,100),limit=8,shown=[],timer;
 const productFocus=products.find(p=>p.id===params.get('product'));
 if(productFocus){query=productFocus.car;maker='전체';kind='전체';}
 $('search').value=query;
 const updated=new Date(catalog.updatedAt);
 // Stale snapshots never continue advertising old exact prices indefinitely.
 const stale=!Number.isFinite(updated.getTime())||Date.now()-updated.getTime()>48*60*60*1000;
 $('freshness').textContent=stale?'가격 확인 후 시간이 경과했습니다. 최신 가격은 스마트스토어에서 확인해 주세요.':`${updated.toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})} 확인 · 반납 기준 / 배송비 별도 · 최종 가격은 스토어 기준`;
 $('freshness').classList.toggle('stale',stale);
 function filterButtons(id,values,current){$(id).innerHTML=values.map(v=>`<button type="button" data-value="${v}" aria-pressed="${v===current}">${v}</button>`).join('');}
 function updateURL(){const u=new URL(location.href);for(const key of ['q','maker','type','product'])u.searchParams.delete(key);if(query)u.searchParams.set('q',query);if(maker!=='전체')u.searchParams.set('maker',maker);if(kind!=='전체')u.searchParams.set('type',kind);history.replaceState(null,'',u);}
 function matches(p){const terms=query.trim().split(/\s+/).map(normal).filter(Boolean);const hay=normal(`${p.title} ${p.car} ${p.maker} ${p.label} ${p.spec}`);return (maker==='전체'||p.maker===maker)&&(kind==='전체'||p.kind===kind)&&terms.every(t=>hay.includes(t));}
 function card(items){
  // Retain every product link but collapse identical named configurations visually.
  items.sort((a,b)=>Number(a.title.startsWith('델코 '))-Number(b.title.startsWith('델코 '))||a.id.localeCompare(b.id));
  const p=items[0],duplicates=items.slice(1);
  const money=stale?'<p class="price link-price">스토어에서 가격 확인</p>':p.available?`<p class="price-condition">폐배터리 반납 기준</p><p class="price">${won(p.price)}<small>원</small></p><p class="shipping">배송비 ${won(p.shipping)}원 · 합계 ${won(p.price+p.shipping)}원</p>`:'<p class="price link-price">기본 규격 구매 불가</p>';
  return `<article class="product-card" data-product="${p.id}" data-ids="${items.map(x=>x.id).join(',')}"><div class="product-main"><img class="product-photo" src="${esc(p.image)}" alt="${esc(p.car+' '+p.label+' 스토어 대표 이미지')}" loading="lazy" decoding="async" width="110" height="110"><div class="product-info"><div class="product-tags"><span>${esc(p.kind==='일반'?'일반 배터리':p.kind+' 배터리')}</span><span>·</span><span>${esc(p.spec)}</span></div><h4>${esc(p.label)}</h4>${money}</div></div><details class="product-extra"><summary>구매 조건${duplicates.length?' · 다른 상품 링크':''}</summary><p>기본 규격 ${esc(p.spec)} 기준. 다른 규격 선택 시 금액이 달라집니다.</p>${!stale&&p.noReturnPrice!=null?`<p>폐배터리 미반납 ${won(p.noReturnPrice)}원 + 배송비 ${won(p.shipping)}원</p>`:''}<p>쿠폰·개인별 혜택은 결제 화면에서 확인해 주세요.</p><a href="${esc(p.url)}" target="_blank" rel="noopener">상품 상세 보기 ↗</a>${duplicates.length?`<div class="duplicate-links">${duplicates.map((x,i)=>`<a href="${esc(x.url)}" target="_blank" rel="noopener" data-id="${x.id}">같은 차종·제품의 다른 등록 상품 ${i+1} ↗</a>`).join('')}</div>`:''}</details><div class="card-bottom"><span>${p.toolRental?'반납 선택 시 공구 대여 가능':'구매 옵션은 스토어에서 확인'}</span>${p.available?`<a class="buy" href="${esc(p.url)}" data-id="${p.id}" target="_blank" rel="noopener"><span class="n" aria-hidden="true">N</span> 스마트스토어 구매 <span aria-hidden="true">↗</span></a>`:`<span class="disabled-buy">스토어에서 상태 확인</span>`}</div></article>`;
 }
 function render(){
  filterButtons('makers',makers,maker);filterButtons('types',kinds,kind);
  const filtered=products.filter(matches);const groups=new Map();
  for(const p of filtered){const key=p.maker+'|'+p.car;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
  const all=[...groups.entries()].sort((a,b)=>a[1][0].car.localeCompare(b[1][0].car,'ko'));shown=all.slice(0,limit);
  $('result-count').textContent=`${groups.size.toLocaleString('ko-KR')}개 차종·조건 / ${filtered.length.toLocaleString('ko-KR')}개 등록 상품`;
  $('results-title').textContent=query?`‘${query}’ 검색 결과`:'차종별 구매 안내';
  $('results').innerHTML=shown.map(([,ps])=>{const cards=new Map();for(const p of ps){const key=JSON.stringify([p.line,p.price,p.noReturnPrice,p.shipping,p.available,p.toolRental]);if(!cards.has(key))cards.set(key,[]);cards.get(key).push(p);}return `<section class="vehicle"><div class="vehicle-heading"><span class="maker-badge">${esc(ps[0].maker)}</span><h3>${esc(ps[0].car)}</h3></div><div class="product-grid">${[...cards.values()].sort((a,b)=>(a[0].price??Infinity)-(b[0].price??Infinity)).map(card).join('')}</div></section>`;}).join('');
  $('empty').hidden=!!filtered.length;$('more').hidden=all.length<=limit;
  if(!$('more').hidden)$('more').innerHTML=`차종 더 보기 (${shown.length} / ${all.length}) <span aria-hidden="true">↓</span>`;
 }
 function changed(){limit=8;updateURL();render();}
 function reset(){query='';maker='전체';kind='전체';$('search').value='';changed();}
 $('search').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{query=$('search').value.trim().slice(0,100);changed();},150);});
 $('search-form').addEventListener('submit',e=>{e.preventDefault();clearTimeout(timer);query=$('search').value.trim().slice(0,100);changed();$('results-title').scrollIntoView({behavior:'smooth',block:'start'});});
 document.querySelectorAll('[data-query]').forEach(b=>b.addEventListener('click',()=>{query=b.dataset.query;maker='전체';kind='전체';$('search').value=query;changed();}));
 $('makers').addEventListener('click',e=>{const b=e.target.closest('button[data-value]');if(b){maker=b.dataset.value;changed();}});
 $('types').addEventListener('click',e=>{const b=e.target.closest('button[data-value]');if(b){kind=b.dataset.value;changed();}});
 $('reset').addEventListener('click',reset);$('empty-reset').addEventListener('click',reset);
 $('more').addEventListener('click',()=>{limit+=8;render();});
 $('share').addEventListener('click',async()=>{query=$('search').value.trim().slice(0,100);changed();try{await navigator.clipboard.writeText(location.href);$('toast').textContent='현재 검색 결과 링크를 복사했습니다.';}catch{$('toast').textContent='주소창의 링크를 복사해 주세요.';}$('toast').hidden=false;setTimeout(()=>$('toast').hidden=true,2800);});
 window.addEventListener('pageshow',()=>{if(!stale&&Date.now()-updated.getTime()>48*60*60*1000)location.reload();});
 render();
})();
