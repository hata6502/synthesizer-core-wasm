if(!self.define){let e,i={};const r=(r,s)=>(r=new URL(r+".js",s).href,i[r]||new Promise((i=>{if("document"in self){const e=document.createElement("script");e.src=r,e.onload=i,document.head.appendChild(e)}else e=r,importScripts(r),i()})).then((()=>{let e=i[r];if(!e)throw new Error(`Module ${r} didn’t register its module`);return e})));self.define=(s,n)=>{const c=e||("document"in self?document.currentScript.src:"")||location.href;if(i[c])return;let o={};const t=e=>r(e,c),d={module:{uri:c},exports:o,require:t};i[c]=Promise.all(s.map((e=>d[e]||t(e)))).then((e=>(n(...e),o)))}}define(["./workbox-0c8657f6"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"CNAME",revision:"598b2cc709f84d7a2383014a33c00f61"},{url:"browserCheck.js",revision:"011c7b9b0e8cc0de06ca4b8c26888e3a"},{url:"d16de264e939976cb79a.wasm",revision:null},{url:"favicon.png",revision:"2350d190bbb1a0c64970cb95d0a5f1c4"},{url:"index.html",revision:"042096075e54b3fb9a15dd0247296b1f"},{url:"main.js",revision:"c149635a3040d936a84284491c02bcd0"},{url:"main.js.LICENSE.txt",revision:"767e0de1002f6a2c8c11206e9d3e9c9a"},{url:"manifest.json",revision:"741308a2e2777e12debde518b2be498a"}],{})}));
