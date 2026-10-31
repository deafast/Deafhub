const test=require('node:test'),assert=require('node:assert/strict');
const {matrixFor,shapes}=require('../../public/branding/layered-cards-trial/card-geometry.js');
test('all frame corners match the approved original quads at desktop and smaller widths',()=>{for(const width of [885,626,1100])for(const quad of Object.values(shapes)){const target=quad.map(([x,y])=>[x*width/885,y*width/885]),m=matrixFor(target),corners=[[0,0],[360,0],[360,580],[0,580]];corners.forEach(([x,y],i)=>{const divisor=m[3]*x+m[7]*y+m[15],u=(m[0]*x+m[4]*y+m[12])/divisor,v=(m[1]*x+m[5]*y+m[13])/divisor;assert.ok(Math.abs(u-target[i][0])<1e-7);assert.ok(Math.abs(v-target[i][1])<1e-7);});}});
test('degenerate card shape is rejected',()=>assert.throws(()=>matrixFor([[0,0],[0,0],[0,0],[0,0]]),/Degenerate/));
