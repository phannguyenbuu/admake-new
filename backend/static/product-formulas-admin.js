/* Inventory-backed recipe editor. Formula evaluation runs only on the server. */
(() => {
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = v => new Intl.NumberFormat('vi-VN').format(v) + ' ₫';
  const formatPrice = value => String(value).replace(/\s/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  function formatPriceInput(el) {
    const digitsBefore = el.value.slice(0, el.selectionStart).replace(/[^0-9]/g, '').length;
    el.value = formatPrice(el.value.replace(/[^0-9]/g, ''));
    let pos = 0, count = 0;
    while (pos < el.value.length && count < digitsBefore) { if (/\d/.test(el.value[pos])) count++; pos++; }
    el.setSelectionRange(pos, pos);
  }
  const kinds = {material:'Vật tư',labor:'Nhân công',transport:'Vận chuyển',extra:'Phát sinh'};
  const api = '/api/product-bom';
  let canManage = false;
  let products = [], catalog = [], current = null, dirty = false, busy = false, lastPreview = null;
  const defaultConstraints = () => ({dimensions:{L:{min:1},H:{min:1},W:{min:.01}},minimum_unit_price:50000,minimum_order_price:0});
  const emptyDefinition = () => ({defaults:{L:60,H:80,W:6,F:1,count:1},constraints:defaultConstraints(),parameters:[],lines:[]});
  async function call(path, options={}) {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('access_token') || localStorage.getItem('user_token') || '';
    const headers = {...(options.body instanceof FormData ? {} : {'Content-Type':'application/json'}),...(token ? {Authorization:`Bearer ${token}`} : {})};
    const response = await fetch(api+path,{...options,headers});
    const data = await response.json();
    if (response.status === 401) throw new Error('Phiên đăng nhập chưa có hoặc đã hết hạn. Vui lòng đăng nhập tài khoản admin thư viện.');
    if (response.status === 403) throw new Error('Tài khoản không có quyền quản lý thư viện sản phẩm.');
    if (!response.ok) throw new Error(data.error || data.description || data.message || `HTTP ${response.status}`);
    return data;
  }
  function status(text, error=false) { $('status').textContent=text; $('status').className='status '+(text ? error?'error':'ok' : ''); }
  function changed() {dirty=true;lastPreview=null;const p=$('previewResult');if(p)p.innerHTML='';const b=$('publishBtn');if(b)b.disabled=true;const s=$('dirtyLabel');if(s)s.textContent='Chưa lưu';}
  function confirm(title,text) {return new Promise(resolve=>{const d=$('confirmDialog');$('confirmTitle').textContent=title;$('confirmText').textContent=text;d.showModal();$('confirmOk').onclick=()=>{d.close();resolve(true)};$('confirmCancel').onclick=()=>{d.close();resolve(false)};d.oncancel=e=>{e.preventDefault();d.close();resolve(false)};});}
  async function load() {
    try {
      let p = await call('/library'), c = [];
      const token = ['accessToken','token','access_token','user_token'].some(key => localStorage.getItem(key));
      if (token) {
        try {
          const managed = await call('/products');
          if (managed.can_manage) { c = await call('/catalog'); p = {...managed, products: managed.products.map(item => ({...item, ...Object.fromEntries(['images','image_assets','gallery_ids','gallery_images'].map(key => [key,p.products.find(x => x.id === item.id)?.[key]])), properties: p.products.find(x => x.id === item.id)?.properties}))}; }
        } catch (_) { /* The library remains available without an active admin session. */ }
      }
      canManage = !!p.can_manage;
      $('newBtn').hidden = !canManage;
      $('batchBtn').hidden = !canManage;
      products=p.products;catalog=c;$('access').style.display='none';$('layout').style.display='grid';renderList();status('');
      if (products.length && !current) await select(products[0]);
    } catch(e){status(e.message,true);$('access').style.display='block';$('layout').style.display='none';}
  }
  const searchText = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
  const reviewed = p => (p.properties?.reviewed ?? p.definition?.reviewed) === true;
  function renderList(){
    const q=searchText($('search').value).trim().split(/\s+/).filter(Boolean);
    const category=$('categoryFilter').value, review=$('reviewFilter').value, photos=$('photoFilter').value;
    const categories=[...new Set(products.map(p=>p.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
    $('categoryFilter').innerHTML='<option value="">Tất cả nhóm</option>'+categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
    $('categoryFilter').value=category;
    const filtered=products.filter(p=>{
      const haystack=searchText(`${p.name} ${p.id ?? ''} ${p.category}`);
      return q.every(word=>haystack.includes(word)) && (!category||p.category===category)
        && (!review||reviewed(p)===(review==='checked'))
        && (!photos||(p.gallery_ids?.length>0)===(photos==='yes'));
    });
    $('resultCount').textContent=`${filtered.length}/${products.length} sản phẩm · ${products.filter(reviewed).length} đã kiểm tra`;
    $('products').innerHTML=filtered.map(p=>`<div class="product-row"><button class="product ${current?.id===p.id?'active':''}" data-product="${esc(p.id)}"><img loading="lazy" src="${esc(p.image_url)}" alt=""><span>${esc(p.name)}<br><small>${p.is_published?'Đã duyệt':'Nháp'} · ${esc(p.category)}</small><small class="product-id">ID: ${esc(p.id ?? 'Chưa lưu')}</small></span></button><label class="review-check"><input type="checkbox" data-review="${esc(p.id)}" ${reviewed(p)?'checked':''} > Đã kiểm tra</label></div>`).join('') || '<div class="empty">Không có sản phẩm phù hợp.</div>';
  }
  $('categoryFilter').onchange=renderList;
  $('reviewFilter').onchange=renderList;
  $('photoFilter').onchange=renderList;
  $('clearFilters').onclick=()=>{for(const id of ['search','categoryFilter','reviewFilter','photoFilter'])$(id).value='';renderList();$('search').focus();};
  $('products').addEventListener('change',e=>{
    const el=e.target;if(!el.dataset.review)return;
    if(busy){renderList();return;}
    const product=products.find(p=>p.id===el.dataset.review), value=el.checked;
    void run(async()=>{
      try {
        const result=await call('/library/'+encodeURIComponent(product.id)+'/review',{method:'PUT',body:JSON.stringify({version:product.version,reviewed:value})});
        product.version=result.version;
        if(product.properties)product.properties.reviewed=value;
        if(product.definition)product.definition.reviewed=value;
        if(current?.id===product.id){
          current.version=result.version;
          if(current.properties)current.properties.reviewed=value;
          if(current.definition)current.definition.reviewed=value;
        }
        status(value?'Đã đánh dấu kiểm tra.':'Đã bỏ dấu kiểm tra.');
      } finally {renderList();}
    });
  });
  async function select(product){if(busy)return;if(dirty&&!await confirm('Bỏ thay đổi chưa lưu?',current?.name||''))return;current=structuredClone(product);dirty=false;lastPreview=null;renderList();renderEditor();}
  function renderEditor(){
    if(!current)return;

    renderGallery();

    if (current.properties) {
      const props = current.properties, dims = props.defaults || {}, policy = props.constraints || {};
      const row = (label, html) => `<tr><th>${esc(label)}</th><td>${html}</td></tr>`;
      const input = (path,v,min=0,step='any') => path.startsWith('constraints.minimum_') ? `<input data-property="${path}" data-money="true" type="text" inputmode="numeric" pattern="[0-9 ]+" value="${esc(formatPrice(v ?? 0))}" required>` : `<input data-property="${path}" type="number" min="${min}" step="${step}" value="${esc(v ?? '')}" required>`;
      const group = (label, body) => `<details class="property-group" open><summary>${esc(label)}</summary><table class="property-table"><tbody>${body}</tbody></table></details>`;
      const materials = props.materials_text ?? (props.materials || []).map(m=>[m.name,m.code?'['+m.code+']':'',m.unit?'('+m.unit+')':'',m.note].filter(Boolean).join(' ')).join('\n');
      $('editor').innerHTML = `<form id="propertyForm"><div class="inspector-title">Thuộc tính <small id="dirtyLabel">Đã lưu</small><button type="submit" id="saveProperties" class="primary">Lưu</button></div>
        ${group('Thông tin sản phẩm',row('ID',esc(current.id ?? 'Chưa lưu'))+row('Tên',esc(current.name))+row('Nhóm',esc(current.category)))}
        ${group('Kích thước mặc định', [['L','Ngang'],['H','Cao'],['W','Rộng / sâu']].map(([key,label])=>row(label+' (cm)',input('defaults.'+key,dims[key],.0001))).join('')+row('Số mặt',input('defaults.F',dims.F,1,1))+row('Số sản phẩm',input('defaults.count',dims.count,1,1)))}
        ${group('Kích thước tối thiểu', [['L','Ngang'],['H','Cao'],['W','Rộng / sâu']].map(([key,label])=>row(label+' (cm)',input('constraints.dimensions.'+key+'.min',policy.dimensions?.[key]?.min ?? (key==='W'?.01:1),.0001))).join(''))}
        ${group('Giá tối thiểu',row('Mỗi sản phẩm (₫)',input('constraints.minimum_unit_price',policy.minimum_unit_price ?? 0))+row('Mỗi đơn hàng (₫)',input('constraints.minimum_order_price',policy.minimum_order_price ?? 0)))}
        <details class="property-group" open><summary>Vật liệu</summary><div class="property-text"><textarea data-property="materials_text" rows="7" maxlength="20000" placeholder="Nhập vật liệu, độ dày, màu sắc, quy cách…">${esc(materials)}</textarea><button type="button" id="normalizeMaterials">Chuẩn hóa</button><small style="display:block;margin-top:6px">Kiểm tra kết quả rồi bấm Lưu.</small></div></details>
        <details class="property-group" open><summary>Ghi chú</summary><div class="property-text"><textarea data-property="note" rows="3" maxlength="20000">${esc(props.note || '')}</textarea></div></details>
        <div class="property-hint">Kích thước: cm · Giá chưa VAT, chưa vận chuyển.</div></form>`;
      $('propertyForm').oninput = e => { if (e.target.dataset.property) { e.stopPropagation(); if(e.target.dataset.money) formatPriceInput(e.target); changed(); } };
      $('normalizeMaterials').onclick = () => void run(normalizeMaterials);
      $('propertyForm').onsubmit = e => { e.preventDefault(); void run(saveProperties); };
      return;
    }
    const d=current.definition;
    d.constraints ||= defaultConstraints();
    $('editor').innerHTML=`<div class="row tools"><span class="pill ${current.is_published?'published':''}">${current.is_published?'Đã duyệt':'Bản nháp'}</span><div class="row"><small id="dirtyLabel">${dirty?'Chưa lưu':''}</small><button id="copyBtn">Sao chép</button><button id="saveBtn">Lưu nháp</button><button id="publishBtn" class="primary" disabled>Xác nhận áp dụng</button></div></div>
      <div class="hero"><img src="${esc(current.image_url)}" alt="Ảnh sản phẩm"><div class="fields"><label>Tên sản phẩm<input id="name" value="${esc(current.name)}"></label><label>Nhóm<input id="category" list="categories" value="${esc(current.category)}"><datalist id="categories">${[...new Set(products.map(p=>p.category))].map(c=>`<option value="${esc(c)}">`).join('')}</datalist></label><label>Ảnh<input id="image" type="file" accept="image/*"></label></div></div>
      <div class="row">${[['L','Ngang'],['H','Cao'],['W','Rộng / sâu'],['F','Số mặt'],['count','Số SP']].map(([key,label])=>`<label>${label}${['L','H','W'].includes(key)?' (cm)':''} <input type="number" min="${key==='F'||key==='count'?1:.01}" step="any" data-dim="${key}" value="${d.defaults[key]}"></label>`).join('')}</div>
      <div class="row tools"><strong>Giới hạn kích thước & giá tối thiểu</strong></div>
      <div class="scroll"><table><thead><tr><th>Kích thước (cm)</th><th>Tối thiểu</th></tr></thead><tbody>${[['L','Ngang'],['H','Cao'],['W','Rộng / sâu']].map(([axis,label])=>`<tr><td>${label}</td>${['min'].map(side=>`<td><input type="number" min="0.0001" step="any" data-limit-axis="${axis}" data-limit-side="${side}" value="${d.constraints.dimensions[axis][side]}"></td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <div class="row tools"><label>Giá tối thiểu / sản phẩm (VND) <input type="number" min="0" step="1000" data-price-floor="minimum_unit_price" value="${d.constraints.minimum_unit_price}"></label><label>Tối thiểu mỗi đơn (VND) <input type="number" min="0" step="1000" data-price-floor="minimum_order_price" value="${d.constraints.minimum_order_price}"></label></div><small>Giá bán tối thiểu chưa VAT, chưa vận chuyển; mức mỗi đơn dành cho chi phí khởi tạo / đơn nhỏ. Giá BOM cao hơn vẫn giữ nguyên.</small>
      <div class="row tools"><strong>Tham số</strong><button id="paramAdd">+ Tham số</button></div><div class="scroll"><table><thead><tr><th>Biến</th><th>Tên</th><th>Mặc định</th><th>Đơn vị</th><th>Tối thiểu</th><th></th></tr></thead><tbody id="params"></tbody></table></div>
      <div class="row tools"><strong>BOM</strong><div class="row"><button id="lineAdd">+ Từ thư viện</button><button id="manualAdd">+ Nhập tay</button></div></div><div class="formula-help">L: dài · W: rộng/sâu · H: cao (m) · A=L×H · P=2×(L+H) · V=L×W×H · F: số mặt. Công thức cho 1 sản phẩm. Hàm: ceil, floor, min, max, round, sqrt.</div><input id="itemFilter" class="search" placeholder="Lọc mã / tên vật tư"><div class="scroll"><table><thead><tr><th>Chọn</th><th>Vật tư</th><th>Nhóm</th><th>Công thức khối lượng</th><th>Đơn giá</th><th>Ghi chú quy cách</th><th></th></tr></thead><tbody id="lines"></tbody></table></div>
      <div class="row tools"><strong>Kiểm tra tại kích thước mặc định</strong><button class="primary" id="previewBtn">Tính thử BOM</button></div><div id="previewResult"></div>`;
    renderParams();renderLines();
  }


  async function normalizeMaterials() {
    const field = document.querySelector('[data-property="materials_text"]');
    const original = field.value, productId = current.id;
    if (!original.trim()) throw new Error('Nhập nội dung vật liệu trước khi chuẩn hóa.');
    const button = $('normalizeMaterials');
    button.disabled = true; button.textContent = 'Đang chuẩn hóa…';
    try {
      const result = await call('/library/normalize-materials', {method:'POST',body:JSON.stringify({text:original})});
      if (current.id !== productId || !field.isConnected || field.value !== original) {
        throw new Error('Nội dung đã thay đổi trong lúc chuẩn hóa. Bấm Chuẩn hóa để thử lại.');
      }
      field.value = result.text; changed(); status('Đã chuẩn hóa vật liệu. Kiểm tra rồi bấm Lưu.');
    } finally { button.disabled = false; button.textContent = 'Chuẩn hóa'; }
  }
  async function saveProperties() {
    const props = current.properties;
    const payload = {version:current.version,defaults:{...props.defaults},constraints:structuredClone(props.constraints || {}),materials_text:'',note:''};
    $('propertyForm').querySelectorAll('[data-property]').forEach(el=>{
      const keys=el.dataset.property.split('.');
      let target=payload;
      keys.slice(0,-1).forEach(key=>{ target[key] ||= {}; target=target[key]; });
      target[keys.at(-1)]=el.dataset.money?Number(el.value.replace(/\s/g,'')):el.type==='number'?Number(el.value):el.value;
    });
    $('saveProperties').disabled=true;
    try {
      const saved=await call('/library/'+encodeURIComponent(current.id)+'/properties',{method:'PUT',body:JSON.stringify(payload)});
      current.version=saved.version;
      current.is_published=false;
      current.properties={...props,...payload};
      products=products.map(p=>p.id===current.id?structuredClone(current):p);
      dirty=false;renderList();renderEditor();status('Đã lưu thuộc tính sản phẩm.');
    } finally { if($('saveProperties')) $('saveProperties').disabled=false; }
  }
  function renderGallery() {
    const assets = current.image_assets || [];
    const selected = current.gallery_ids || [];
    const card = photo => `<figure class="image-card"><figcaption>${esc(photo.name)}</figcaption><a href="${esc(photo.url)}" target="_blank" rel="noopener"><img src="${esc(photo.url)}" alt="${esc(current.name)}"></a></figure>`;
    $('gallery').innerHTML = `<div class="gallery-heading"><h2>${esc(current.name)}</h2><small>${esc(current.category)}</small></div>
      <div class="generated-images">${selected.map(id=>assets.find(a=>a.id===id)).filter(Boolean).map(card).join('') || '<div class="image-missing">Chọn ảnh bên dưới để hiển thị trong gallery.</div>'}</div>
      <details class="photo-manager" open><summary>Ảnh sản phẩm (${assets.length})</summary><p class="muted">Chọn tối đa 2 ảnh hiển thị trong gallery. Thay đổi ảnh được lưu ngay.</p>
      <label class="photo-upload">Thêm ảnh<input id="photoAdd" type="file" accept="image/png,image/jpeg,image/webp"></label>
      <div class="photo-assets">${assets.map(a=>`<div class="photo-asset"><img src="${esc(a.url)}" alt="${esc(a.name)}"><div><label><input type="checkbox" data-gallery-photo="${esc(a.id)}" ${selected.includes(a.id)?'checked':''} ${selected.length>=2&&!selected.includes(a.id)?'disabled':''}> Hiển thị trong gallery</label><div class="row"><label class="photo-upload">Thay thế<input type="file" data-replace-photo="${esc(a.id)}" accept="image/png,image/jpeg,image/webp"></label><button type="button" data-delete-photo="${esc(a.id)}">Xóa</button></div></div></div>`).join('')}</div></details>`;
  }
  async function updatePhotos(method, data) {
    const result = await call('/library/'+encodeURIComponent(current.id)+'/photos', {method, body:data instanceof FormData?data:JSON.stringify({...data,version:current.version})});
    Object.assign(current, {version:result.version,image_url:result.image_url,image_assets:result.image_assets,gallery_ids:result.gallery_ids,gallery_images:result.gallery_images});
    const stored = products.find(p=>p.id===current.id);
    if (stored) Object.assign(stored, {version:result.version,image_url:result.image_url,image_assets:result.image_assets,gallery_ids:result.gallery_ids,gallery_images:result.gallery_images});
    renderGallery(); renderList(); status('Đã lưu ảnh sản phẩm.');
  }
  $('gallery').addEventListener('change', e => {
    const el=e.target;
    if(busy){renderGallery();return;}
    if(el.dataset.galleryPhoto) {
      const ids=Array.from($('gallery').querySelectorAll('[data-gallery-photo]:checked'), n=>n.dataset.galleryPhoto);
      void run(async()=>{try{await updatePhotos('PUT',{gallery_ids:ids});}catch(error){renderGallery();throw error;}});
    } else if(el.id==='photoAdd'||el.dataset.replacePhoto) {
      const file=el.files[0]; if(!file)return;
      void run(async()=>{
        if(file.size>10*1024*1024)throw new Error('Ảnh tối đa 10 MB.');
        const body=new FormData();body.append('file',file);body.append('version',current.version);
        if(el.dataset.replacePhoto)body.append('asset_id',el.dataset.replacePhoto);
        await updatePhotos('POST',body);
      });
    }
  });
  $('gallery').addEventListener('click',e=>{
    const button=e.target.closest('[data-delete-photo]');if(!button||busy)return;
    void run(async()=>{if(await confirm('Xóa ảnh khỏi sản phẩm?','Ảnh sẽ được gỡ khỏi thư viện và gallery của sản phẩm này.'))await updatePhotos('DELETE',{asset_id:button.dataset.deletePhoto});});
  });

  function renderParams(){ $('params').innerHTML=current.definition.parameters.map((p,i)=>`<tr data-param="${i}">${['key','label','default','unit','min','max'].map(k=>`<td><input data-param-field="${k}" type="${['default','min','max'].includes(k)?'number':'text'}" step="any" value="${esc(p[k]??(k==='max'?100000:0))}"></td>`).join('')}<td><button data-remove-param="${i}">×</button></td></tr>`).join('');}
  function renderLines(){
    const q=($('itemFilter')?.value||'').toLocaleLowerCase('vi');const filtered=catalog.filter(i=>`${i.code} ${i.name}`.toLocaleLowerCase('vi').includes(q));
    $('lines').innerHTML=current.definition.lines.map((r,i)=>{
      const item=catalog.find(c=>c.code===r.code);const choices=filtered.some(c=>c.code===r.code)||!item?filtered:[item,...filtered];
      return `<tr data-line="${i}"><td><input type="checkbox" data-field="selected" ${r.selected?'checked':''}></td><td>${r.code?`<select class="item" data-field="code">${!item?`<option value="${esc(r.code)}">${esc(r.code)} · Chưa có mã</option>`:''}${choices.map(c=>`<option value="${esc(c.code)}" ${r.code===c.code?'selected':''}>${esc(c.code)} · ${esc(c.name)} / ${esc(c.unit)}</option>`).join('')}</select>`:`<input class="manual-name" data-field="name" placeholder="Tên thành phần" value="${esc(r.name)}"><input data-field="unit" placeholder="ĐVT" value="${esc(r.unit)}">`}</td><td><select data-field="kind">${Object.entries(kinds).map(([k,label])=>`<option value="${k}" ${r.kind===k?'selected':''}>${label}</option>`).join('')}</select></td><td><input class="formula" data-field="formula" value="${esc(r.formula)}"></td><td class="price">${item?money(item.price):`<input type="number" min="0" data-field="unit_price" value="${r.unit_price||0}">`}</td><td><input data-field="note" value="${esc(r.note||'')}"></td><td><button data-remove-line="${i}">×</button></td></tr>`;
    }).join('');
  }
  async function upload(file){const f=new FormData();f.append('file',file);return (await call('/admin/image',{method:'POST',body:f})).url;}
  async function preview(){
    lastPreview=null;$('publishBtn').disabled=true;
    const result=await call('/admin/preview',{method:'POST',body:JSON.stringify({definition:current.definition})});
    lastPreview=result;
    $('previewResult').innerHTML=`<div class="preview">${result.issues.length?`<p class="danger">${result.issues.map(esc).join('<br>')}</p>`:''}<table><thead><tr><th>Mã / tên</th><th>ĐVT</th><th>SL</th><th>Thành tiền</th></tr></thead><tbody>${result.rows.filter(r=>r.selected).map(r=>`<tr><td>${esc(r.code||r.name)}</td><td>${esc(r.unit)}</td><td>${Number(r.quantity.toFixed(4))}</td><td>${money(r.total)}</td></tr>`).join('')}</tbody></table><p style="text-align:right"><strong>Giá vốn: ${money(result.cost)}</strong></p></div>`;
    $('publishBtn').disabled=!!result.issues.length||!result.rows.length;
  }
  async function save(publish){
    if(publish&&(!lastPreview||lastPreview.issues.length))throw new Error('Tính thử BOM trước khi áp dụng.');
    if(!await confirm(publish?'Xác nhận áp dụng công thức?':'Xác nhận lưu nháp?',`${current.name} · ${current.definition.lines.length} dòng BOM${publish?' · Giá vốn mẫu '+money(lastPreview.cost):''}`))return;
    const payload={...current,is_published:publish,confirmed:publish};
    const saved=await call('/admin/products'+(current.id?'/'+encodeURIComponent(current.id):''),{method:current.id?'PUT':'POST',body:JSON.stringify(payload)});
    products=[saved,...products.filter(p=>p.id!==saved.id)];current=saved;dirty=false;lastPreview=null;renderList();renderEditor();status(publish?'Đã áp dụng công thức.':'Đã lưu nháp.');
  }
  async function run(action){if(busy)return;busy=true;try{status('');await action();}catch(e){status(e.message,true);}finally{busy=false;}}
  $('search').oninput=renderList;
  $('retry').onclick=load;
  $('products').onclick=e=>{const b=e.target.closest('[data-product]');if(b)void select(products.find(p=>p.id===b.dataset.product));};
  $('newBtn').onclick=()=>select({name:'Sản phẩm mới',category:'Khác',image_url:'',definition:emptyDefinition(),is_published:false});
  $('editor').addEventListener('input',e=>{
    const el=e.target;if(!current)return;
    if(el.id==='name')current.name=el.value;
    else if(el.id==='category')current.category=el.value;
    else if(el.dataset.dim)current.definition.defaults[el.dataset.dim]=Number(el.value);
    else if(el.dataset.limitAxis)current.definition.constraints.dimensions[el.dataset.limitAxis][el.dataset.limitSide]=Number(el.value);
    else if(el.dataset.priceFloor)current.definition.constraints[el.dataset.priceFloor]=Number(el.value);
    else if(el.dataset.paramField){const p=current.definition.parameters[Number(el.closest('[data-param]').dataset.param)];p[el.dataset.paramField]=el.type==='number'?Number(el.value):el.value;}
    else if(el.dataset.field){const r=current.definition.lines[Number(el.closest('[data-line]').dataset.line)];r[el.dataset.field]=el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value;}
    else if(el.id==='itemFilter'){renderLines();return;}
    else return;
    changed();
  });
  $('editor').addEventListener('change',e=>{const el=e.target;if(el.id==='image'&&el.files[0])void run(async()=>{current.image_url=await upload(el.files[0]);changed();renderEditor();});if(el.dataset.field==='code'){changed();renderLines();}});
  $('editor').addEventListener('click',e=>{if(e.target.closest('#propertyForm'))return;const b=e.target.closest('button');if(!b||busy)return;void run(async()=>{
    if(b.id==='copyBtn'){if(!await confirm('Sao chép sản phẩm?',current.name))return;current={...structuredClone(current),id:undefined,version:undefined,name:current.name+' (bản sao)',is_published:false};changed();renderList();renderEditor();}
    else if(b.id==='saveBtn')await save(false);
    else if(b.id==='publishBtn')await save(true);
    else if(b.id==='previewBtn')await preview();
    else if(b.id==='paramAdd'){current.definition.parameters.push({key:'p'+(current.definition.parameters.length+1),label:'Tham số',default:1,unit:'',min:0,max:100000});changed();renderParams();}
    else if(b.dataset.removeParam!==undefined){current.definition.parameters.splice(Number(b.dataset.removeParam),1);changed();renderParams();}
    else if(b.dataset.removeLine!==undefined){current.definition.lines.splice(Number(b.dataset.removeLine),1);changed();renderLines();}
    else if(b.id==='lineAdd'||b.id==='manualAdd'){
      const item=catalog.filter(i=>`${i.code} ${i.name}`.toLocaleLowerCase('vi').includes(($('itemFilter').value||'').toLocaleLowerCase('vi')))[0];
      const manual=b.id==='manualAdd';if(!manual&&!item)throw new Error('Không có vật tư phù hợp.');
      current.definition.lines.push({id:crypto.randomUUID(),code:manual?'':item.code,name:manual?'Thành phần mới':'',unit:manual?'bộ':item.unit,formula:'1',kind:'material',selected:true,unit_price:0,note:''});changed();renderLines();
    }
  });});
  $('batchBtn').onclick=()=>$('batch').click();
  $('batch').onchange=()=>run(async()=>{
    const files=[...$('batch').files];if(!files.length)return;
    if(!await confirm(`Thêm ${files.length} sản phẩm nháp?`,'Dùng công thức của sản phẩm đang chọn; nếu chưa chọn sẽ tạo BOM trống.'))return;
    const template=current?structuredClone(current):{category:'Khác',definition:emptyDefinition()};let count=0;
    for(const file of files){
      const image_url=await upload(file);
      const definition=structuredClone(template.definition);
      const dims=file.name.match(/(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×]\s*(\d+(?:[.,]\d+)?))?/i);
      if(dims){const values=dims.slice(1).filter(Boolean).map(x=>Number(x.replace(',','.')));definition.defaults.L=values[0];definition.defaults.H=values[1];if(values.length===3){definition.defaults.W=values[1];definition.defaults.H=values[2];}}
      const saved=await call('/admin/products',{method:'POST',body:JSON.stringify({name:file.name.replace(/\.[^.]+$/,''),category:template.category,definition,image_url,is_published:false})});
      products.unshift(saved);count++;renderList();status(`Đã thêm ${count}/${files.length} sản phẩm nháp.`);
    }
    $('batch').value='';
  });
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
  window.addEventListener('storage', e => {
    if (['accessToken','token','access_token','user_token'].includes(e.key) && !dirty) void load();
  });
  void load();
})();
