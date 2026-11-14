const fs=require('fs'),vm=require('vm'),assert=require('assert');
const dir=process.argv[2]||__dirname;
const data=fs.readFileSync(dir+'/atlas-data.js','utf8');
assert(!/typescript|sourceFilePages|sourceId|verificationMethod|library_file_id|supplied digital|file p\./i.test(data),'private metadata in public data');
const scripts=fs.readFileSync(dir+'/atlas.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const context={document:{createElement:()=>({setAttribute(){}})},console};vm.createContext(context);
vm.runInContext(data+'\n'+scripts.slice(0,scripts.indexOf("document.addEventListener('DOMContentLoaded'")),context);
console.log(vm.runInContext(`(()=>{
 const assert=(c,m)=>{if(!c)throw Error(m)};const errors=[];
 assert(locations.length===161,'count');assert(new Set(locations.map(x=>x.id)).size===161,'id uniqueness');
 for(const e of register.entities){assert(e.citations.length>0,e.id+' lacks evidence');assert(byId.has(e.catalogueTarget||e.id),e.id+' no destination');}
 for(const e of locations){assert(systems[e.system],e.id+' invalid system');if(e.subsystem)assert(systems[e.system].subsystems[e.subsystem],e.id+' invalid subsystem');for(const id of e.related||[])assert(byId.has(id),e.id+' bad related '+id);}
 for(const id of ['cercyon-belt','clashing-rocks'])assert(matches(byId.get(id),{type:'asteroid',work:'all',system:'all',search:''}),id+' filter');
 assert(!byId.get('woomago').altName,'Woomago false alias');
 for(const id of ['salamanca','phantasmopolis','sun-proxima','selkirk-yellow-dog']){assert(byId.has(id),id+' missing');assert(card(byId.get(id)).innerHTML,id+' cannot render');}
 assert(card(byId.get('selkirk-planets')).innerHTML.includes('<details class="related">'),'large related list not collapsed');
 for(const x of locations)for(const c of x.citations)assert(!/file p|supplied|Dark Shine Edit/i.test(sourceDetails(c)),'private locator');
 return {entities:register.entities.length,entries:locations.length,citations:locations.reduce((a,e)=>a+e.citations.length,0)};
})()`,context));

const index=fs.readFileSync(dir+'/index.html','utf8');
const atlas=fs.readFileSync(dir+'/atlas.html','utf8');
for(const [name,html] of [['index',index],['atlas',atlas]]){
 assert(html.indexOf('<script src="atlas-data.js?v=20261114"></script>')<html.indexOf('<script>'), name+' data must load before code');
 new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
}
assert(!scripts.includes("querySelector('details')"),'generic details lookup conflicts with related places');
assert(index.includes('href="atlas.html#${encodeURIComponent(x.catalogueTarget||id)}"'),'map lacks correct catalogue link');
console.log('Both scripts parse, shared data loads first, cross-view links valid.');
