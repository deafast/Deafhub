const {readFileSync}=require('node:fs');const {resolve}=require('node:path');const vm=require('node:vm');const ts=require('typescript');const test=require('node:test');const assert=require('node:assert/strict');
const root=resolve(__dirname,'../..');const scope={exports:{}};
vm.runInNewContext(ts.transpileModule(readFileSync(resolve(root,'app/manifest.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,scope);
const manifest=scope.exports.default();
test('installation manifest uses existing square branded PNG 192 and 512 with exact dimensions',()=>{
 assert.equal(manifest.icons.length,2);
 for(const icon of manifest.icons){assert.match(icon.src,/^\/branding\//);assert.equal(icon.type,'image/png');assert.ok(!icon.purpose||icon.purpose==='any');const data=readFileSync(resolve(root,'public'+icon.src));assert.equal(data.subarray(1,4).toString(),'PNG');const width=data.readUInt32BE(16),height=data.readUInt32BE(20);assert.equal(width,height);assert.equal(icon.sizes,`${width}x${height}`);}
 assert.equal(manifest.icons.map(i=>i.sizes).join(','),'192x192,512x512');assert.equal(manifest.start_url,'/');assert.equal(manifest.display,'standalone');
});
test('browser PNG and ICO dimensions remain valid without replacing brand assets',()=>{
 for(const size of [16,32,48,180]){const data=readFileSync(resolve(root,`public/branding/deafhub-browser-${size}.png`));assert.equal(data.readUInt32BE(16),size);assert.equal(data.readUInt32BE(20),size);}
 const ico=readFileSync(resolve(root,'public/branding/deafhub-browser.ico'));assert.equal(ico.readUInt16LE(2),1);const sizes=Array.from({length:ico.readUInt16LE(4)},(_,i)=>ico[6+i*16]||256).sort((a,b)=>a-b);assert.equal(sizes.join(','),'16,32,48');
});

test('social metadata points to an existing square 512px brand image',()=>{
 const source=readFileSync(resolve(root,'app/layout.tsx'),'utf8');
 const metadataScope={exports:{},URL,process:{env:{}},require:name=>name==='next/font/google'?{Geist:()=>({}),Geist_Mono:()=>({})}: {}};
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,metadataScope);
 const {openGraph,twitter}=metadataScope.exports.metadata;
 for(const src of [openGraph.images[0].url,twitter.images[0]]){
  const data=readFileSync(resolve(root,'public'+src));
  assert.equal(data.subarray(1,4).toString(),'PNG');
  assert.equal(data.readUInt32BE(16),512);assert.equal(data.readUInt32BE(20),512);
 }
 assert.equal(openGraph.images[0].width,512);assert.equal(openGraph.images[0].height,512);
});

test('Preview social images use the current deployment without changing production metadata base',()=>{
 const source=readFileSync(resolve(root,'app/layout.tsx'),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 for(const environment of ['preview','production']){
  const scope={exports:{},URL,process:{env:{VERCEL_ENV:environment,VERCEL_URL:'qa-deafhub.vercel.app'}},require:name=>name==='next/font/google'?{Geist:()=>({}),Geist_Mono:()=>({})}:{}};
  vm.runInNewContext(code,scope);
  const metadata=scope.exports.metadata;
  const image=new URL(metadata.openGraph.images[0].url,metadata.metadataBase);
  assert.equal(image.host,environment==='preview'?'qa-deafhub.vercel.app':'www.deafhub.cc');
  assert.equal(metadata.twitter.images[0],metadata.openGraph.images[0].url);
  assert.equal(metadata.metadataBase.host,'www.deafhub.cc');
 }
});
