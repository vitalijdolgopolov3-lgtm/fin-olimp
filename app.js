(() => {
'use strict';
const $=id=>document.getElementById(id);
const year=$('year');if(year)year.textContent=new Date().getFullYear();
const modal=$('modal-bg');let password='';let items=[];
const showMsg=(m,err=false)=>{let e=$('feedback');if(e){e.textContent=m;e.style.color=err?'#c34253':'#2854a5';}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validLink=s=>{try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:'#'}catch{return '#'}};
const auth=()=> 'Basic '+btoa(unescape(encodeURIComponent('admin:'+password)));
const render=()=>{
 let q=($('search')?.value||'').toLowerCase().trim(),cat=$('category')?.value||'';
 let filtered=items.filter(v=>(!cat||v.category===cat)&&(!q||(v.title+' '+v.description+' '+v.category).toLowerCase().includes(q)));
 if($('videos-grid'))$('videos-grid').innerHTML=filtered.length?filtered.map(v=>`<article class="card video"><div class="thumb">▶</div><div class="body"><span class="tag">${esc(v.category)}</span><h3>${esc(v.title)}</h3><p>${esc(v.description)}</p><a class="card-link" target="_blank" rel="noopener noreferrer" href="${esc(validLink(v.url))}">Смотреть видео ↗</a></div></article>`).join(''):'<div class="card">Видео по выбранным условиям пока нет.</div>';
 if($('admin-list'))$('admin-list').innerHTML=items.map(v=>`<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;padding:9px 0;border-bottom:1px solid #ddd"><span>${esc(v.title)}</span><button class="btn secondary" type="button" data-remove="${esc(v.id)}">Удалить</button></div>`).join('');
};
async function refresh(){try{let r=await fetch('/api/videos',{cache:'no-store'});if(!r.ok)throw Error('Ошибка загрузки');items=await r.json();render()}catch{showMsg('Не удалось загрузить видео',true)}}
$('search')?.addEventListener('input',render);$('category')?.addEventListener('change',render);
$('admin-open')?.addEventListener('click',()=>{modal?.classList.add('open');showMsg('');});
$('close')?.addEventListener('click',()=>modal?.classList.remove('open'));
modal?.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open')});
document.addEventListener('keydown',e=>{if(e.key==='Escape')modal?.classList.remove('open')});
$('login')?.addEventListener('click',async()=>{password=$('password')?.value||'';if(!password)return showMsg('Введите пароль',true);try{let r=await fetch('/api/admin/check',{headers:{Authorization:auth()}});if(!r.ok)throw Error('Неверный пароль');$('login-area').classList.add('hide');$('admin-area').classList.remove('hide');showMsg('Вы вошли');refresh()}catch{password='';showMsg('Неверный пароль администратора',true)}});
$('logout')?.addEventListener('click',()=>{password='';$('login-area').classList.remove('hide');$('admin-area').classList.add('hide');if($('password'))$('password').value='';showMsg('Вы вышли')});
$('video-form')?.addEventListener('submit',async e=>{e.preventDefault();const data={title:$('title').value,url:$('url').value,category:$('video-category').value,description:$('description').value};try{let r=await fetch('/api/videos',{method:'POST',headers:{Authorization:auth(),'Content-Type':'application/json'},body:JSON.stringify(data)});let body=await r.json();if(!r.ok)throw Error(body.error||'Ошибка');$('video-form').reset();showMsg('Видео добавлено');await refresh()}catch(err){showMsg(err.message,true)}});
$('admin-list')?.addEventListener('click',async e=>{let b=e.target.closest('[data-remove]');if(!b)return;if(!confirm('Удалить видео из каталога?'))return;try{let r=await fetch('/api/videos/'+encodeURIComponent(b.dataset.remove),{method:'DELETE',headers:{Authorization:auth()}});if(!r.ok)throw Error('Ошибка удаления');await refresh();showMsg('Видео удалено')}catch(err){showMsg(err.message,true)}});
refresh();
})();