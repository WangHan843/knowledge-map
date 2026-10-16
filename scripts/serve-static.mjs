// Strict static server for local Pages checks: no API and no SPA fallback.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
export function serveStatic({port=4173,base='/knowledge-map/',host='127.0.0.1'}={}){
 const root=fileURLToPath(new URL('../frontend/dist/',import.meta.url));
 const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json'};
 const server=createServer(async(req,res)=>{
  try{
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(base!=='/'&&pathname===base.slice(0,-1)){res.writeHead(301,{Location:base});res.end();return;}
   if(!pathname.startsWith(base)){res.writeHead(404);res.end('Not found');return;}
   const relative=pathname.slice(base.length)||'index.html',file=resolve(root,relative);
   if(!file.startsWith(resolve(root)+sep)){res.writeHead(403);res.end();return;}
   const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
  }catch{res.writeHead(404);res.end('Not found');}
 });
 return new Promise(resolve=>server.listen(port,host,()=>resolve(server)));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const args=process.argv.slice(2),arg=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
 const port=Number(arg('--port','4173')),base=arg('--base','/knowledge-map/'),host=arg('--host','127.0.0.1');
 await serveStatic({port,base,host});console.log(`Static preview: http://localhost:${port}${base}`);
}
