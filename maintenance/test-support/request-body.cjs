const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');

const code=ts.transpileModule(readFileSync(resolve(__dirname,'../../lib/request-body.ts'),'utf8'),{
 fileName:'request-body.ts',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText;
const scope={exports:{},TextDecoder};
vm.runInNewContext(code,scope);
module.exports=scope.exports;
