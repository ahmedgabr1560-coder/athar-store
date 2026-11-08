(function() {
  var ADMIN_PASS = 'athar2026';
  var API = '/api/update-data';
  var adminPassword = '', products = [], coupons = [], orders = [], settings = {};
  var shipping = { freeShippingMin: 800, governorates: {} };
  var visits = { total: 0, today: 0, history: [] };
  var currentTab = 'products';

  function showToast(msg, isError) {
    var t = document.getElementById('toast');
    if (!t) { alert(msg); return; }
    t.textContent = msg;
    t.className = 'toast show' + (isError ? ' error' : '');
    setTimeout(function() { t.classList.remove('show'); }, 3500);
  }

  function login() {
    var pass = (document.getElementById('adminPassword').value || '').trim();
    if (pass === ADMIN_PASS) {
      adminPassword = pass;
      sessionStorage.setItem('athar_admin', '1');
      sessionStorage.setItem('athar_admin_pass', pass);
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('dashboard').classList.add('active');
      loadAll();
    } else showToast('كلمة المرور غير صحيحة', true);
  }

  function logout() {
    sessionStorage.removeItem('athar_admin');
    sessionStorage.removeItem('athar_admin_pass');
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('loginScreen').style.display = 'flex';
  }

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(function(b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });
    document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
    var el = document.getElementById('tab-' + tab);
    if (el) el.classList.add('active');
    if (tab === 'orders') renderOrders();
    if (tab === 'coupons') renderCoupons();
    if (tab === 'shipping') renderShipping();
    if (tab === 'products') renderProducts();
    if (tab === 'settings') renderSettings();
    if (tab === 'visitors') renderVisitors();
  }

  async function fetchJSON(url) {
    try {
      var paths = url.indexOf('http') === 0 ? [url] : [url, 'https://raw.githubusercontent.com/ahmedgabr1560-coder/athar-store/main/' + url];
      for (var i = 0; i < paths.length; i++) {
        try {
          var r = await fetch(paths[i] + (paths[i].indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now());
          if (r.ok) return await r.json();
        } catch (e) {}
      }
      return null;
    } catch (e) { return null; }
  }

  async function loadAll() {
    var p = await fetchJSON('data/products.json'); if (Array.isArray(p)) products = p;
    var c = await fetchJSON('data/coupons.json'); if (Array.isArray(c)) coupons = c;
    var s = await fetchJSON('data/shipping.json'); if (s && s.governorates) shipping = s;
    var o = await fetchJSON('data/orders.json'); if (Array.isArray(o)) orders = o;
    var st = await fetchJSON('data/settings.json'); if (st && typeof st === 'object') settings = st;
    var v = await fetchJSON('data/visits.json'); if (v && typeof v === 'object') visits = v;
    try {
      var local = JSON.parse(localStorage.getItem('athar_orders') || '[]');
      if (local.length) {
        var ids = orders.map(function(x){ return x.id; });
        local.forEach(function(lo) { if (ids.indexOf(lo.id) === -1) orders.push(lo); });
      }
    } catch(e) {}
    renderProducts(); renderOrders(); renderCoupons(); renderShipping(); renderSettings(); renderVisitors();
  }

  async function publish(file, data) {
    var btn = document.getElementById('publishBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'جاري النشر...'; }
    try {
      var res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword || sessionStorage.getItem('athar_admin_pass') || ADMIN_PASS, file: file, data: data })
      });
      var d = await res.json().catch(function(){ return {}; });
      if (!res.ok) showToast(d.error || 'فشل النشر', true);
      else showToast(d.message || 'تم النشر');
    } catch (e) { showToast('تعذر الاتصال — تأكد من GITHUB_TOKEN', true); }
    if (btn) { btn.disabled = false; btn.textContent = 'نشر على GitHub'; }
  }

  function publishCurrent() {
    if (currentTab === 'products') publish('products', products);
    else if (currentTab === 'coupons') publish('coupons', coupons);
    else if (currentTab === 'shipping') { collectShippingFromUI(); publish('shipping', shipping); }
    else if (currentTab === 'orders') publish('orders', orders);
    else if (currentTab === 'settings') { collectSettingsFromUI(); publish('settings', settings); }
  }

  function renderProducts() {
    var el1 = document.getElementById('statProducts'), el2 = document.getElementById('statProdDisc');
    if (el1) el1.textContent = products.length;
    if (el2) el2.textContent = products.filter(function(p){ return p.discount; }).length;
    var tbody = document.getElementById('productsBody'), empty = document.getElementById('emptyProducts');
    if (!tbody) return;
    if (!products.length) { tbody.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    tbody.innerHTML = products.map(function(p, i) {
      return '<tr><td><img class="product-thumb" src="'+(p.image||'')+'"/></td><td style="font-weight:600">'+p.name+'</td><td>'+p.price+' ج.م</td><td>'+(p.discount?'<span class="badge badge-gold">'+p.discount+'%</span>':'—')+'</td><td><div class="actions-cell"><button type="button" class="btn btn-outline btn-sm" data-pe="'+i+'">تعديل</button><button type="button" class="btn btn-danger btn-sm" data-pd="'+i+'">حذف</button></div></td></tr>';
    }).join('');
    tbody.querySelectorAll('[data-pe]').forEach(function(b){ b.onclick=function(){ openProductForm(products[+b.getAttribute('data-pe')]); }; });
    tbody.querySelectorAll('[data-pd]').forEach(function(b){ b.onclick=function(){ if(!confirm('حذف؟'))return; products.splice(+b.getAttribute('data-pd'),1); renderProducts(); showToast('تم — انشر'); }; });
  }

  function openProductForm(p) {
    document.getElementById('productForm').classList.add('open');
    document.getElementById('formTitle').textContent = p ? 'تعديل منتج' : 'إضافة منتج';
    document.getElementById('editId').value = p ? p.id : '';
    document.getElementById('pName').value = p ? p.name : '';
    document.getElementById('pPrice').value = p ? p.price : '';
    document.getElementById('pOldPrice').value = p && p.oldPrice ? p.oldPrice : '';
    document.getElementById('pDiscount').value = p && p.discount ? p.discount : '';
    document.getElementById('pImage').value = p ? p.image : '';
  }

  function saveProduct() {
    var name = document.getElementById('pName').value.trim();
    var price = parseInt(document.getElementById('pPrice').value, 10);
    var oldPrice = parseInt(document.getElementById('pOldPrice').value, 10) || null;
    var discount = parseInt(document.getElementById('pDiscount').value, 10) || null;
    var image = document.getElementById('pImage').value.trim();
    var editId = document.getElementById('editId').value;
    if (!name || !price || !image) { showToast('املأ الحقول', true); return; }
    if (editId) {
      for (var i = 0; i < products.length; i++) if (products[i].id === editId) {
        products[i].name=name; products[i].price=price; products[i].oldPrice=oldPrice; products[i].discount=discount; products[i].image=image; break;
      }
    } else {
      products.push({ id: name.replace(/\s+/g,'-')+'-'+price, name:name, price:price, oldPrice:oldPrice, discount:discount, image:image, images:[image], description:'منتج رجالي فاخر من ATHAR.', sizes:['S','M','L','XL'], colors:[{name:'أسود',hex:'#1a1a1a'},{name:'أبيض',hex:'#f5f5f5'}], materials:['قطن'] });
    }
    document.getElementById('productForm').classList.remove('open');
    renderProducts();
    showToast('تم — انشر');
  }

  var STATUS_LABELS = { pending:'قيد المراجعة', confirmed:'تم التأكيد', shipping:'جاري الشحن', delivered:'تم التسليم', cancelled:'ملغي' };
  var STATUS_BADGE = { pending:'badge-pending', confirmed:'badge-confirmed', shipping:'badge-shipping', delivered:'badge-delivered', cancelled:'badge-cancelled' };

  function renderOrders() {
    document.getElementById('statOrders').textContent = orders.length;
    document.getElementById('statPending').textContent = orders.filter(function(o){return o.status==='pending';}).length;
    document.getElementById('statShipping').textContent = orders.filter(function(o){return o.status==='shipping';}).length;
    document.getElementById('statDelivered').textContent = orders.filter(function(o){return o.status==='delivered';}).length;
    var tbody = document.getElementById('ordersBody'), empty = document.getElementById('emptyOrders');
    if (!orders.length) { tbody.innerHTML=''; empty.style.display='block'; return; }
    empty.style.display='none';
    tbody.innerHTML = orders.map(function(o,i){
      var cust=o.customer||{}, items=(o.items||[]).map(function(it){return it.name+'×'+(it.qty||1);}).join('، ');
      return '<tr><td style="font-weight:700;font-size:11px">'+o.id+'<br><span style="font-weight:400;color:var(--muted)">'+(o.date||'')+'</span></td><td><div class="order-detail"><strong style="color:var(--text)">'+(cust.name||'—')+'</strong><br>'+(cust.phone||'')+'<br>'+(cust.governorate||'')+' - '+(cust.center||'')+'<br>'+(cust.address||'')+'</div></td><td><div class="order-detail">'+items+'</div></td><td style="font-weight:600">'+o.total+' ج.م</td><td><span class="badge '+(STATUS_BADGE[o.status]||'badge-pending')+'">'+(STATUS_LABELS[o.status]||o.status)+'</span></td><td><select class="status-select" data-oi="'+i+'">'+['pending','confirmed','shipping','delivered','cancelled'].map(function(s){return '<option value="'+s+'"'+(o.status===s?' selected':'')+'>'+STATUS_LABELS[s]+'</option>';}).join('')+'</select></td></tr>';
    }).join('');
    tbody.querySelectorAll('.status-select').forEach(function(sel){
      sel.onchange=function(){ orders[+sel.getAttribute('data-oi')].status=sel.value; renderOrders(); showToast('تم — انشر'); };
    });
  }

  function renderCoupons() {
    document.getElementById('statCoupons').textContent = coupons.length;
    document.getElementById('statCouponsActive').textContent = coupons.filter(function(c){return c.active!==false;}).length;
    var tbody = document.getElementById('couponsBody'), empty = document.getElementById('emptyCoupons');
    if (!coupons.length) { tbody.innerHTML=''; empty.style.display='block'; return; }
    empty.style.display='none';
    var typeLabel={percent:'نسبة %',fixed:'مبلغ',shipping:'شحن مجاني'};
    tbody.innerHTML = coupons.map(function(c,i){
      return '<tr><td style="font-weight:700">'+c.code+'</td><td>'+(typeLabel[c.type]||c.type)+'</td><td>'+(c.type==='shipping'?'—':c.value)+'</td><td>'+(c.label||'')+'</td><td><span class="badge '+(c.active!==false?'badge-on':'badge-off')+'">'+(c.active!==false?'مفعّل':'معطّل')+'</span></td><td><div class="actions-cell"><button type="button" class="btn btn-outline btn-sm" data-ce="'+i+'">تعديل</button><button type="button" class="btn btn-outline btn-sm" data-ct="'+i+'">'+(c.active!==false?'تعطيل':'تفعيل')+'</button><button type="button" class="btn btn-danger btn-sm" data-cd="'+i+'">حذف</button></div></td></tr>';
    }).join('');
    tbody.querySelectorAll('[data-ce]').forEach(function(b){
      b.onclick=function(){ var c=coupons[+b.getAttribute('data-ce')]; document.getElementById('couponForm').classList.add('open'); document.getElementById('couponEditIdx').value=b.getAttribute('data-ce'); document.getElementById('cCode').value=c.code; document.getElementById('cType').value=c.type; document.getElementById('cValue').value=c.value; document.getElementById('cLabel').value=c.label||''; };
    });
    tbody.querySelectorAll('[data-ct]').forEach(function(b){ b.onclick=function(){ var i=+b.getAttribute('data-ct'); coupons[i].active=coupons[i].active===false; renderCoupons(); showToast('تم — انشر'); }; });
    tbody.querySelectorAll('[data-cd]').forEach(function(b){ b.onclick=function(){ if(!confirm('حذف؟'))return; coupons.splice(+b.getAttribute('data-cd'),1); renderCoupons(); showToast('تم — انشر'); }; });
  }

  function saveCoupon() {
    var code=document.getElementById('cCode').value.trim().toUpperCase();
    var type=document.getElementById('cType').value;
    var value=parseInt(document.getElementById('cValue').value,10)||0;
    var label=document.getElementById('cLabel').value.trim()||code;
    var idx=parseInt(document.getElementById('couponEditIdx').value,10);
    if(!code){ showToast('أدخل الكود',true); return; }
    if(idx>=0) coupons[idx]={code:code,type:type,value:value,label:label,active:coupons[idx].active!==false};
    else { if(coupons.some(function(c){return c.code===code;})){ showToast('الكود موجود',true); return; } coupons.push({code:code,type:type,value:value,label:label,active:true}); }
    document.getElementById('couponForm').classList.remove('open');
    renderCoupons(); showToast('تم — انشر');
  }

  function renderShipping() {
    document.getElementById('freeShipMin').value = shipping.freeShippingMin || 800;
    var list = document.getElementById('shippingList'), govs = shipping.governorates || {}, html = '';
    Object.keys(govs).forEach(function(gov){
      var g=govs[gov];
      html += '<div class="ship-gov-card"><h4>'+gov+' <small style="color:var(--muted);font-weight:400">(أساسي: </small><input type="number" class="gov-base" data-gov="'+gov+'" value="'+g.base+'" style="width:70px;display:inline-block;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:6px;padding:4px 8px;color:var(--text);font-size:12px"/> ج.م)</h4><div class="ship-centers">';
      Object.keys(g.centers||{}).forEach(function(center){ html += '<div class="ship-center-row"><label>'+center+'</label><input type="number" data-gov="'+gov+'" data-center="'+center+'" value="'+g.centers[center]+'"/></div>'; });
      html += '</div></div>';
    });
    list.innerHTML = html || '<p class="empty-state">لا توجد بيانات شحن</p>';
  }

  function collectShippingFromUI() {
    var min=parseInt(document.getElementById('freeShipMin').value,10);
    if(!isNaN(min)) shipping.freeShippingMin=min;
    document.querySelectorAll('.gov-base').forEach(function(inp){ var gov=inp.getAttribute('data-gov'); if(shipping.governorates[gov]) shipping.governorates[gov].base=parseInt(inp.value,10)||0; });
    document.querySelectorAll('.ship-center-row input[data-center]').forEach(function(inp){ var gov=inp.getAttribute('data-gov'), center=inp.getAttribute('data-center'); if(shipping.governorates[gov]&&shipping.governorates[gov].centers) shipping.governorates[gov].centers[center]=parseInt(inp.value,10)||0; });
  }

  function renderSettings() {
    if(!settings) settings={};
    var map={sStoreName:'storeName',sStoreNameAr:'storeNameAr',sTagline:'tagline',sHeroBadge:'heroBadge',sHeroTitle:'heroTitle',sHeroTitleGold:'heroTitleGold',sHeroDesc:'heroDesc',sHeroImage:'heroImage',sHeroButton:'heroButton',sProductsTitle:'productsTitle',sAboutTitle:'aboutTitle',sAboutText:'aboutText',sPhone:'contactPhone',sWhatsapp:'contactWhatsapp',sEmail:'contactEmail',sAddress:'contactAddress',sFacebook:'facebook',sInstagram:'instagram',sFooter:'footerText'};
    Object.keys(map).forEach(function(id){ var el=document.getElementById(id); if(el) el.value=settings[map[id]]||''; });
  }

  function collectSettingsFromUI() {
    var map={sStoreName:'storeName',sStoreNameAr:'storeNameAr',sTagline:'tagline',sHeroBadge:'heroBadge',sHeroTitle:'heroTitle',sHeroTitleGold:'heroTitleGold',sHeroDesc:'heroDesc',sHeroImage:'heroImage',sHeroButton:'heroButton',sProductsTitle:'productsTitle',sAboutTitle:'aboutTitle',sAboutText:'aboutText',sPhone:'contactPhone',sWhatsapp:'contactWhatsapp',sEmail:'contactEmail',sAddress:'contactAddress',sFacebook:'facebook',sInstagram:'instagram',sFooter:'footerText'};
    Object.keys(map).forEach(function(id){ var el=document.getElementById(id); if(el) settings[map[id]]=el.value.trim(); });
  }

  function renderVisitors() {
    var t=document.getElementById('statVisitsTotal'), d=document.getElementById('statVisitsToday'), hist=document.getElementById('visitsHistory');
    if(t) t.textContent=(visits&&visits.total)||0;
    if(d) d.textContent=(visits&&visits.today)||0;
    if(hist){
      var h=(visits&&visits.history)||[];
      hist.innerHTML=h.length?'<div class="table-wrap"><table><thead><tr><th>التاريخ</th><th>الزيارات</th></tr></thead><tbody>'+h.map(function(x){return '<tr><td>'+x.date+'</td><td style="font-weight:700;color:var(--gold)">'+x.count+'</td></tr>';}).join('')+'</tbody></table></div>':'<p class="empty-state">لا يوجد سجل بعد</p>';
    }
  }

  function bindUI() {
    window.__adminLogin = login;
    var loginBtn=document.getElementById('loginBtn'); if(loginBtn) loginBtn.onclick=login;
    var passInput=document.getElementById('adminPassword'); if(passInput) passInput.onkeydown=function(e){ if(e.key==='Enter') login(); };
    var logoutBtn=document.getElementById('logoutBtn'); if(logoutBtn) logoutBtn.onclick=logout;
    var publishBtn=document.getElementById('publishBtn'); if(publishBtn) publishBtn.onclick=publishCurrent;
    document.querySelectorAll('.tab-btn').forEach(function(b){ b.onclick=function(){ switchTab(b.getAttribute('data-tab')); }; });
    var addP=document.getElementById('addProductBtn'); if(addP) addP.onclick=function(){ openProductForm(null); };
    var saveP=document.getElementById('saveProductBtn'); if(saveP) saveP.onclick=saveProduct;
    var cancelP=document.getElementById('cancelProductBtn'); if(cancelP) cancelP.onclick=function(){ document.getElementById('productForm').classList.remove('open'); };
    var addC=document.getElementById('addCouponBtn'); if(addC) addC.onclick=function(){
      document.getElementById('couponForm').classList.add('open');
      document.getElementById('couponEditIdx').value='-1';
      document.getElementById('cCode').value=''; document.getElementById('cType').value='percent';
      document.getElementById('cValue').value=''; document.getElementById('cLabel').value='';
    };
    var saveC=document.getElementById('saveCouponBtn'); if(saveC) saveC.onclick=saveCoupon;
    var cancelC=document.getElementById('cancelCouponBtn'); if(cancelC) cancelC.onclick=function(){ document.getElementById('couponForm').classList.remove('open'); };
    var refreshO=document.getElementById('refreshOrdersBtn'); if(refreshO) refreshO.onclick=function(){ loadAll().then(function(){ showToast('تم التحديث'); }); };
    var refreshV=document.getElementById('refreshVisitsBtn'); if(refreshV) refreshV.onclick=function(){ loadAll().then(function(){ showToast('تم تحديث الزوار'); renderVisitors(); }); };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindUI);
  else bindUI();

  if (sessionStorage.getItem('athar_admin') === '1') {
    adminPassword = sessionStorage.getItem('athar_admin_pass') || ADMIN_PASS;
    var loginEl = document.getElementById('loginScreen');
    if (loginEl) loginEl.style.display = 'none';
    var dash = document.getElementById('dashboard');
    if (dash) dash.classList.add('active');
    loadAll();
  }
})();
