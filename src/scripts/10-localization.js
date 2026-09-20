(function(){
  'use strict';

  const LANGUAGE_META = {
    en:{label:'English', native:'English', code:'EN'},
    es:{label:'Español', native:'Español', code:'ES'},
    ar:{label:'العربية', native:'العربية', code:'AR'},
    fr:{label:'Français', native:'Français', code:'FR'},
    de:{label:'Deutsch', native:'Deutsch', code:'DE'},
    it:{label:'Italiano', native:'Italiano', code:'IT'},
    pt:{label:'Português', native:'Português', code:'PT'},
    tr:{label:'Türkçe', native:'Türkçe', code:'TR'},
    zh:{label:'中文', native:'中文', code:'ZH'},
    ja:{label:'日本語', native:'日本語', code:'JA'},
    ko:{label:'한국어', native:'한국어', code:'KO'},
    hi:{label:'हिन्दी', native:'हिन्दी', code:'HI'}
  };

  const CURRENCY_META = {
    USD:'US Dollar', EUR:'Euro', GBP:'British Pound', EGP:'Egyptian Pound',
    AED:'UAE Dirham', SAR:'Saudi Riyal', JPY:'Japanese Yen', CAD:'Canadian Dollar',
    AUD:'Australian Dollar', INR:'Indian Rupee', CNY:'Chinese Yuan', TRY:'Turkish Lira',
    BRL:'Brazilian Real', MXN:'Mexican Peso', MYR:'Malaysian Ringgit', PHP:'Philippine Peso',
    PKR:'Pakistani Rupee', PLN:'Polish Zloty', SEK:'Swedish Krona', NOK:'Norwegian Krone',
    DKK:'Danish Krone', ILS:'Israeli Shekel'
  };

  function byId(id){ return document.getElementById(id); }

  function makePicker(select, type){
    if(!select || select.dataset.veloraCustomPicker === '1') return;
    select.dataset.veloraCustomPicker = '1';

    const wrap=document.createElement('div');
    wrap.className='velora-picker';
    wrap.dataset.pickerType=type;

    const btn=document.createElement('button');
    btn.type='button';
    btn.className='velora-picker-btn';
    btn.setAttribute('aria-haspopup','listbox');
    btn.setAttribute('aria-expanded','false');

    const menu=document.createElement('div');
    menu.className='velora-picker-menu';
    menu.setAttribute('role','listbox');

    const render=()=>{
      const value=select.value;
      let label=value, sub='';
      if(type==='language'){
        const meta=LANGUAGE_META[value] || {label:value,native:value,code:value.toUpperCase()};
        label=meta.code; sub=meta.native;
      } else {
        label=value; sub=CURRENCY_META[value] || 'Currency';
      }
      btn.innerHTML='<span>'+label+'</span><span aria-hidden="true">▾</span>';
      menu.querySelectorAll('.velora-picker-option').forEach(o=>{
        o.classList.toggle('active', o.dataset.value===value);
        o.setAttribute('aria-selected', o.dataset.value===value ? 'true':'false');
      });
    };

    Array.from(select.options).forEach(opt=>{
      const option=document.createElement('button');
      option.type='button';
      option.className='velora-picker-option';
      option.dataset.value=opt.value;
      option.setAttribute('role','option');
      const main=document.createElement('span');
      const small=document.createElement('small');
      if(type==='language'){
        const meta=LANGUAGE_META[opt.value] || {label:opt.textContent.trim(),native:opt.textContent.trim(),code:opt.value.toUpperCase()};
        main.textContent=meta.native+' ('+meta.code+')';
        small.textContent=meta.label===meta.native?'':meta.label;
      } else {
        main.textContent=opt.value;
        small.textContent=CURRENCY_META[opt.value] || '';
      }
      option.append(main, small);
      option.addEventListener('click',()=>{
        select.value=opt.value;
        select.dispatchEvent(new Event('change',{bubbles:true}));
        render();
        wrap.classList.remove('open');
        btn.setAttribute('aria-expanded','false');
      });
      menu.appendChild(option);
    });

    select.style.display='none';
    select.insertAdjacentElement('afterend',wrap);
    wrap.append(btn,menu);

    btn.addEventListener('click',(ev)=>{
      ev.stopPropagation();
      document.querySelectorAll('.velora-picker.open').forEach(x=>{ if(x!==wrap)x.classList.remove('open'); });
      const open=!wrap.classList.contains('open');
      wrap.classList.toggle('open',open);
      btn.setAttribute('aria-expanded',String(open));
      render();
    });

    document.addEventListener('click',(ev)=>{
      if(!wrap.contains(ev.target)){
        wrap.classList.remove('open');
        btn.setAttribute('aria-expanded','false');
      }
    });

    select.addEventListener('change',render);
    render();
  }

  function addCoreTranslations(){
    /* Supplement the existing bridge with common labels that appear across the app. */
    const extra = {
      en:{'Discover More.':'Discover More.','Shop Better.':'Shop Better.','Everything you need, from stores you can trust.':'Everything you need, from stores you can trust.','Track your orders':'Track your orders'},
      es:{'Discover More.':'Descubre más.','Shop Better.':'Compra mejor.','Everything you need, from stores you can trust.':'Todo lo que necesitas, de tiendas en las que puedes confiar.','Track your orders':'Sigue tus pedidos'},
      ar:{'Discover More.':'اكتشف المزيد.','Shop Better.':'تسوّق بشكل أفضل.','Everything you need, from stores you can trust.':'كل ما تحتاجه من متاجر يمكنك الوثوق بها.','Track your orders':'تتبّع طلباتك'},
      fr:{'Discover More.':'Découvrez plus.','Shop Better.':'Achetez mieux.','Everything you need, from stores you can trust.':'Tout ce dont vous avez besoin, auprès de boutiques de confiance.','Track your orders':'Suivez vos commandes'},
      de:{'Discover More.':'Mehr entdecken.','Shop Better.':'Besser einkaufen.','Everything you need, from stores you can trust.':'Alles, was Sie brauchen, von vertrauenswürdigen Shops.','Track your orders':'Bestellungen verfolgen'},
      it:{'Discover More.':'Scopri di più.','Shop Better.':'Acquista meglio.','Everything you need, from stores you can trust.':'Tutto ciò di cui hai bisogno, da negozi di fiducia.','Track your orders':'Segui i tuoi ordini'},
      pt:{'Discover More.':'Descubra mais.','Shop Better.':'Compre melhor.','Everything you need, from stores you can trust.':'Tudo o que precisa, de lojas em que pode confiar.','Track your orders':'Acompanhar pedidos'},
      tr:{'Discover More.':'Daha fazlasını keşfet.','Shop Better.':'Daha iyi alışveriş yap.','Everything you need, from stores you can trust.':'Güvendiğiniz mağazalardan ihtiyacınız olan her şey.','Track your orders':'Siparişlerini takip et'},
      zh:{'Discover More.':'发现更多。','Shop Better.':'更好地购物。','Everything you need, from stores you can trust.':'从可信赖的商店获得你所需的一切。','Track your orders':'跟踪订单'},
      ja:{'Discover More.':'もっと見つけよう。','Shop Better.':'もっと上手に買い物。','Everything you need, from stores you can trust.':'信頼できるショップから必要なものをすべて。','Track your orders':'注文を追跡'},
      ko:{'Discover More.':'더 발견하세요.','Shop Better.':'더 스마트하게 쇼핑하세요.','Everything you need, from stores you can trust.':'신뢰할 수 있는 스토어에서 필요한 모든 것을 만나보세요.','Track your orders':'주문 추적'},
      hi:{'Discover More.':'और खोजें।','Shop Better.':'बेहतर खरीदारी करें।','Everything you need, from stores you can trust.':'भरोसेमंद स्टोर्स से आपकी ज़रूरत की हर चीज़।','Track your orders':'अपने ऑर्डर ट्रैक करें'}
    };
    window.VELORA_EXTRA_I18N = extra;

    /* Registration only: V4/V5 own all DOM rendering and provenance. */
    const packs = window.__VELORA_PACK || {};
    Object.keys(extra).forEach(locale => {
      const pack = packs[locale] || (packs[locale] = {});
      Object.assign(pack, extra[locale]);
      try {
        window.VELORA_I18N_PROVENANCE?.registerCatalog(locale, extra[locale] || {});
      } catch (_) {}
    });
    window.__VELORA_PACK = packs;

    /* Compatibility API only; no independent renderer, observer, listener, or timer. */
    window.VELORA_APPLY_EXTRA_I18N = function () {
      if (typeof window.VELORA_TRANSLATE_ALL === 'function') {
        return window.VELORA_TRANSLATE_ALL();
      }
      return false;
    };
  }

  function boot(){
    makePicker(byId('languageSelect'),'language');
    makePicker(byId('currencySelect'),'currency');
    addCoreTranslations();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
