 'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const PORT=Number(process.env.PORT||3000),PASSWORD=process.env.ADMIN_PASSWORD;
if(!PASSWORD||PASSWORD.length<12){console.error('Задайте ADMIN_PASSWORD (не менее 12 символов) в Railway Variables');process.exit(1)}
// Railway volume: mounted at /app/data. Never overwrite an existing videos.json
const DATA=path.join(__dirname,'data','videos.json'),ROOT=path.join(__dirname,'public');
fs.mkdirSync(path.dirname(DATA),{recursive:true});if(!fs.existsSync(DATA))fs.writeFileSync(DATA,'[]');
const send=(r,c,o)=>{r.writeHead(c,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});r.end(JSON.stringify(o))};
const list=()=>JSON.parse(fs.readFileSync(DATA,'utf8'));
function write(items){const tmp=DATA+'.tmp';fs.writeFileSync(tmp,JSON.stringify(items,null,2));fs.renameSync(tmp,DATA)}
function authed(req){const a=req.headers.authorization||'';if(!a.startsWith('Basic '))return false;let s='';try{s=Buffer.from(a.slice(6),'base64').toString('utf8')}catch{return false}const x=crypto.createHash('sha256').update(s).digest(),y=crypto.createHash('sha256').update('admin:'+PASSWORD).digest();return crypto.timingSafeEqual(x,y)}
const server=http.createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Content-Type-Options','nosniff');
if(req.method==='GET'&&url.pathname==='/sitemap.xml'){
 const hostname=(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim();const safe=/^[a-z0-9.-]+(?::[0-9]+)?$/i.test(hostname)?hostname:'localhost';const base='https://'+safe.replace(/:[0-9]+$/,'');const urls=['/','/otzyvy/','/materialy/','/materialy/115/','/materialy/122/','/materialy/121/','/materialy/103/'];res.writeHead(200,{'Content-Type':'application/xml; charset=utf-8'});return res.end('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(u=>'<url><loc>'+base+u+'</loc></url>').join('')+'</urlset>')}
if(req.method==='GET'&&!url.pathname.startsWith('/api/')){
 let p;try{p=decodeURIComponent(url.pathname)}catch{return send(res,400,{error:'Неверный путь'})}
 const target=path.resolve(ROOT,'.'+p,p.endsWith('/')?'index.html':'');if(!target.startsWith(ROOT+path.sep))return send(res,403,{error:'Доступ запрещён'});
 let st;try{st=fs.statSync(target)}catch{return send(res,404,{error:'Страница не найдена'})}if(!st.isFile())return send(res,404,{error:'Страница не найдена'});
 const ext=path.extname(target).toLowerCase(),mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.txt':'text/plain; charset=utf-8','.ico':'image/x-icon'};
 res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream','Cache-Control':ext==='.html'?'no-cache':'public,max-age=3600'});return fs.createReadStream(target).pipe(res)}
if(url.pathname==='/api/videos'&&req.method==='GET')return send(res,200,list());
if(url.pathname==='/api/admin/check'&&req.method==='GET')return send(res,authed(req)?200:401,{ok:authed(req)});
if(url.pathname.startsWith('/api/')&&!authed(req))return send(res,401,{error:'Неверный пароль'});
if(url.pathname==='/api/videos'&&req.method==='POST'){
 try{let body='';for await(const chunk of req){body+=chunk;if(body.length>12000)return send(res,413,{error:'Слишком большой запрос'})}const o=JSON.parse(body),u=new URL(o.url);if(!['http:','https:'].includes(u.protocol)||!o.title||typeof o.title!=='string'||o.title.length>120||typeof o.description!=='string'||o.description.length>360)return send(res,400,{error:'Проверьте название, ссылку и описание'});const categories=['Вклады','Кредиты','Налоги','Страхование','Финансовые рынки','Олимпиадные задачи','Другое'];if(!categories.includes(o.category))return send(res,400,{error:'Некорректная категория'});const item={id:crypto.randomUUID(),title:o.title.trim(),url:u.href,category:o.category,description:o.description.trim(),createdAt:new Date().toISOString()};const all=list();all.unshift(item);write(all);return send(res,201,item)}catch{return send(res,400,{error:'Некорректные данные'})}}
if(url.pathname.startsWith('/api/videos/')&&req.method==='DELETE'){const id=url.pathname.split('/')[3],all=list(),updated=all.filter(v=>v.id!==id);if(all.length===updated.length)return send(res,404,{error:'Видео не найдено'});write(updated);return send(res,200,{ok:true})}
return send(res,404,{error:'Не найдено'})
});server.listen(PORT,()=>console.log('Фин Олимп: http://localhost:'+PORT));
