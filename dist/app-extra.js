const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const copyStatus = $('#copy-status');
const footerCredit = $('#footer-credit');
const privacyLink = $('#privacy-link');
const privacyCopy = $('#privacy-copy');
const saveImageBtn = $('#save-image');
const savePdfBtn = $('#save-pdf');
const shareWaBtn = $('#share-wa');

const labels = {
  en: {
    saveImage: 'Save as image',
    saveImageIOS: 'Save to Photos',
    savePdf: 'Save as PDF',
    shareWa: 'Share to WhatsApp',
    footerCredit: 'Created with care by',
    learnMore: 'Learn more',
    privacy: "Patungan doesn't save your receipt. The image is sent to Google Gemini only to read the bill. Google processes it under the Gemini API terms.",
    imageSaved: 'Image downloaded. Ready to share.',
    saveToPhotos: 'Choose “Save Image” in the iPhone share sheet to add it to Photos.',
    pdfSaved: 'PDF downloaded.',
    shared: 'Share sheet opened.',
    shareFallback: 'WhatsApp Web opened with the text. The image has been downloaded for you to attach.',
    shareNotSupported: 'Sharing is not available in this browser yet.',
    exportFailed: 'Could not create the export. Please try again.',
    summaryTitle: 'Split bill summary',
    itemWord: n => `${n} item${n===1?'':'s'}`,
    total: 'Total bill',
    subtotal: 'Items subtotal',
    extras: 'Tax + service',
    discount: 'Discount'
  },
  id: {
    saveImage: 'Simpan sebagai gambar',
    saveImageIOS: 'Simpan ke Photos',
    savePdf: 'Simpan sebagai PDF',
    shareWa: 'Bagikan ke WhatsApp',
    footerCredit: 'Dibuat sambil makan dubai chewy cookie oleh',
    learnMore: 'Pelajari selengkapnya',
    privacy: 'Patungan tidak menyimpan foto strukmu. Gambar dikirim ke Google Gemini hanya untuk membaca tagihan. Pemrosesan oleh Google mengikuti ketentuan Gemini API.',
    imageSaved: 'Gambar berhasil diunduh. Tinggal dibagikan.',
    saveToPhotos: 'Pilih “Save Image” di share sheet iPhone supaya hasilnya masuk ke Photos.',
    pdfSaved: 'PDF berhasil diunduh.',
    shared: 'Lembar berbagi sudah dibuka.',
    shareFallback: 'WhatsApp Web dibuka dengan teks ringkasannya. Gambar juga sudah diunduh untuk kamu lampirkan.',
    shareNotSupported: 'Fitur berbagi belum tersedia di browser ini.',
    exportFailed: 'Belum bisa membuat hasil ekspor. Coba lagi ya.',
    summaryTitle: 'Ringkasan split bill',
    itemWord: n => `${n} item`,
    total: 'Total tagihan',
    subtotal: 'Subtotal item',
    extras: 'Pajak + service',
    discount: 'Diskon'
  }
};

function lang(){ return document.documentElement.lang === 'id' ? 'id' : 'en'; }
function t(key, ...args){ const value = labels[lang()][key]; return typeof value === 'function' ? value(...args) : value; }
function setStatus(key){ if(copyStatus) copyStatus.textContent = key ? t(key) : ''; }
function isIOS(){ return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }

function personNameFromResult(el){
  const name = el.querySelector('.result-name');
  if(!name) return '';
  const clone = name.cloneNode(true);
  clone.querySelectorAll('small').forEach(n=>n.remove());
  return clone.textContent.trim();
}

function qsaWithin(root, selector){ return root ? [...root.querySelectorAll(selector)] : []; }

function collectState(){
  const itemMap = new Map();
  const itemRows = $$('#items .item');
  itemRows.forEach(card => {
    const name = card.querySelector('input[data-field="name"]')?.value.trim();
    if(!name) return;
    const owners = qsaWithin(card, '.assignments button[aria-pressed="true"]').map(btn => btn.textContent.trim()).filter(Boolean).filter(v => !/^everyone$/i.test(v) && !/^semua$/i.test(v));
    owners.forEach(owner => {
      const list = itemMap.get(owner) || [];
      list.push(name);
      itemMap.set(owner, list);
    });
  });

  const shares = $$('#results .result').map(result => {
    const name = personNameFromResult(result);
    const amount = result.querySelector('strong')?.textContent.trim() || '—';
    const items = itemMap.get(name) || [];
    return { name, amount, items };
  }).filter(row => row.name);

  return {
    total: $('#grand-total')?.textContent.trim() || '—',
    subtotal: $('#subtotal')?.textContent.trim() || '—',
    extras: $('#extras')?.textContent.trim() || '—',
    discount: $('#discount-total')?.textContent.trim() || '—',
    shares,
    itemRows: itemRows.map(card => ({
      name: card.querySelector('input[data-field="name"]')?.value.trim() || '',
      owners: qsaWithin(card, '.assignments button[aria-pressed="true"]').map(btn => btn.textContent.trim()).filter(Boolean).filter(v => !/^everyone$/i.test(v) && !/^semua$/i.test(v))
    })).filter(row => row.name)
  };
}

function detailText(items){
  const count = items.length;
  const label = t('itemWord', count);
  return count ? `${label} (${items.join(', ')})` : label;
}

function refreshDetails(){
  const state = collectState();
  $$('#results .result').forEach(result => {
    const name = personNameFromResult(result);
    const row = state.shares.find(entry => entry.name === name);
    const small = result.querySelector('small');
    if(small){const next=detailText(row?.items || []);if(small.textContent!==next)small.textContent=next;}
  });
  const active = !!$('#copy') && !$('#copy').disabled;
  [saveImageBtn, savePdfBtn, shareWaBtn].forEach(btn => { if(btn) btn.disabled = !active; });
  return state;
}

function applyLabels(){
  if(saveImageBtn) saveImageBtn.textContent = t(isIOS() ? 'saveImageIOS' : 'saveImage');
  if(savePdfBtn) savePdfBtn.textContent = t('savePdf');
  if(shareWaBtn) shareWaBtn.textContent = t('shareWa');
  if(footerCredit) footerCredit.textContent = t('footerCredit');
  if(privacyLink) privacyLink.textContent = t('learnMore');
  if(privacyCopy) privacyCopy.textContent = t('privacy');
  refreshDetails();
}

function wrapText(ctx, text, maxWidth){
  const words = String(text).split(/\s+/).filter(Boolean);
  if(!words.length) return [''];
  const lines = [];
  let line = words[0];
  for(let i=1;i<words.length;i++){
    const test = `${line} ${words[i]}`;
    if(ctx.measureText(test).width <= maxWidth) line = test;
    else { lines.push(line); line = words[i]; }
  }
  lines.push(line);
  return lines;
}

function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}
function canvasToBlob(canvas){ return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('export')), 'image/png')); }
function blobToDataUrl(blob){ return new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=()=>reject(Error('export')); reader.readAsDataURL(blob); }); }
function downloadBlob(blob, name){ const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1200); }
function dataUrlToFile(dataUrl, name){ const [meta,data]=dataUrl.split(','); const mime=meta.match(/data:([^;]+)/)?.[1] || 'image/png'; const bytes=atob(data); const buffer=new Uint8Array(bytes.length); for(let i=0;i<bytes.length;i++)buffer[i]=bytes.charCodeAt(i); return new File([buffer],name,{type:mime}); }

function buildCanvas(){
  const state = refreshDetails();
  if(!state.shares.length) throw Error('export');
  const width=1200, outerPad=40, cardPad=68, cardWidth=width-outerPad*2, contentWidth=cardWidth-cardPad*2;
  const temp=document.createElement('canvas');
  const ctx=temp.getContext('2d');
  const paragraphs=[];
  const add=(text,font,lineHeight,color,gap)=>paragraphs.push({text,font,lineHeight,color,gap});
  add('patungan.','800 44px system-ui, sans-serif',56,'#513a2a',6);
  add(t('summaryTitle'),'700 24px system-ui, sans-serif',34,'#34271e',18);
  add(`${t('total')}: ${state.total}`,'800 54px system-ui, sans-serif',68,'#34271e',18);
  add(`${t('subtotal')}: ${state.subtotal} · ${t('extras')}: ${state.extras} · ${t('discount')}: ${state.discount}`,'500 21px system-ui, sans-serif',32,'#695440',24);
  state.shares.forEach(row=>{ add(`${row.name} — ${row.amount}`,'700 28px system-ui, sans-serif',38,'#34271e',4); add(detailText(row.items),'500 20px system-ui, sans-serif',30,'#695440',16); });
  add(`${t('footerCredit')} @letmimibe`,'500 18px system-ui, sans-serif',28,'#695440',0);
  const measured=paragraphs.map(p=>{ctx.font=p.font;return {...p,lines:wrapText(ctx,p.text,contentWidth)}});
  const height=Math.max(960, Math.ceil(measured.reduce((sum,p)=>sum+p.lines.length*p.lineHeight+p.gap,0)+cardPad*2+outerPad*2));
  const canvas=document.createElement('canvas');
  canvas.width=width; canvas.height=height;
  const draw=canvas.getContext('2d');
  draw.fillStyle='#f3ede3'; draw.fillRect(0,0,width,height);
  roundRect(draw,outerPad,outerPad,cardWidth,height-outerPad*2,28); draw.fillStyle='#fffcf7'; draw.fill(); draw.strokeStyle='#d9cbb7'; draw.lineWidth=2; draw.stroke();
  let y=outerPad+cardPad;
  for(const p of measured){ draw.font=p.font; draw.fillStyle=p.color; for(const line of p.lines){ draw.fillText(line,outerPad+cardPad,y); y+=p.lineHeight; } y+=p.gap; }
  return {canvas,state};
}

async function buildImage(){ const {canvas,state}=buildCanvas(); return {blob:await canvasToBlob(canvas),state}; }

function buildText(state){
  return ['PATUNGAN','',`${t('total')}: ${state.total}`,`${t('subtotal')}: ${state.subtotal}`,`${t('extras')}: ${state.extras}`,`${t('discount')}: ${state.discount}`,'',...state.shares.map(row=>`${row.name}: ${row.amount} — ${detailText(row.items)}`)].join('\n');
}

let pdfLoader;
function loadJsPdf(){
  if(window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if(!pdfLoader) pdfLoader = new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
    script.async=true; script.crossOrigin='anonymous';
    script.onload=()=>window.jspdf?.jsPDF?resolve(window.jspdf.jsPDF):reject(Error('export'));
    script.onerror=()=>reject(Error('export'));
    document.head.append(script);
  });
  return pdfLoader;
}

function saveImage(){
  try{
    if(isIOS()){
      const {canvas}=buildCanvas();
      const file=dataUrlToFile(canvas.toDataURL('image/png'),`patungan-${Date.now()}.png`);
      if(navigator.share && navigator.canShare?.({files:[file]})){
        setStatus('saveToPhotos');
        navigator.share({files:[file],title:'Patungan'}).catch(e=>{if(e?.name!=='AbortError')setStatus('exportFailed');});
        return;
      }
    }
    buildImage().then(({blob})=>{downloadBlob(blob,`patungan-${Date.now()}.png`);setStatus('imageSaved');}).catch(()=>setStatus('exportFailed'));
  }catch{setStatus('exportFailed');}
}
async function savePdf(){ try{ const {blob}=await buildImage(); const jsPDF=await loadJsPdf(); const dataUrl=await blobToDataUrl(blob); const pdf=new jsPDF({orientation:'portrait',unit:'pt',format:'a4'}); const pageW=pdf.internal.pageSize.getWidth(), pageH=pdf.internal.pageSize.getHeight(), props=pdf.getImageProperties(dataUrl), ratio=Math.min((pageW-56)/props.width,(pageH-56)/props.height), drawW=props.width*ratio, drawH=props.height*ratio; pdf.addImage(dataUrl,'PNG',(pageW-drawW)/2,28,drawW,drawH); pdf.save(`patungan-${Date.now()}.pdf`); setStatus('pdfSaved'); } catch { setStatus('exportFailed'); } }
async function shareWhatsApp(){ try{ const {blob,state}=await buildImage(); const file=new File([blob],`patungan-${Date.now()}.png`,{type:'image/png'}); const text=buildText(state); if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({title:'Patungan', text, files:[file]}); setStatus('shared'); return; } downloadBlob(blob, `patungan-${Date.now()}.png`); window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank','noopener'); setStatus('shareFallback'); } catch(e){ if(e?.name==='AbortError') return; setStatus('shareNotSupported'); } }

saveImageBtn?.addEventListener('click', saveImage);
savePdfBtn?.addEventListener('click', savePdf);
shareWaBtn?.addEventListener('click', shareWhatsApp);

new MutationObserver(refreshDetails).observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['aria-pressed']});
document.querySelectorAll('[data-lang]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(applyLabels,0)));
applyLabels();
