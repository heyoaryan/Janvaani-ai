import{c as a,r as h,j as e,A as p,m as u,X as g}from"./index-BJBt6Haz.js";import{X as f}from"./x-circle-aXotwPy6.js";import{C as y}from"./check-circle-DPd14Ffy.js";/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=a("AlertTriangle",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",key:"c3ski4"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=a("Info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]),C=({children:n,variant:t="info",title:c,dismissible:o=!1,onDismiss:s,className:i="",icon:l})=>{const[x,d]=h.useState(!0),r={info:{container:"bg-blue-50 border-blue-200",icon:"text-blue-600",title:"text-blue-800",text:"text-blue-700"},success:{container:"bg-green-50 border-green-200",icon:"text-green-600",title:"text-green-800",text:"text-green-700"},warning:{container:"bg-amber-50 border-amber-200",icon:"text-amber-600",title:"text-amber-800",text:"text-amber-700"},error:{container:"bg-red-50 border-red-200",icon:"text-red-600",title:"text-red-800",text:"text-red-700"}},m=l||{info:k,success:y,warning:j,error:f}[t],b=()=>{d(!1),setTimeout(()=>s==null?void 0:s(),200)};return e.jsx(p,{children:x&&e.jsx(u.div,{initial:{opacity:0,y:-10},animate:{opacity:1,y:0},exit:{opacity:0,y:-10},className:`rounded-xl border p-4 ${r[t].container} ${i}`,children:e.jsxs("div",{className:"flex gap-3",children:[e.jsx(m,{className:`w-5 h-5 flex-shrink-0 mt-0.5 ${r[t].icon}`}),e.jsxs("div",{className:"flex-1",children:[c&&e.jsx("h4",{className:`font-semibold mb-1 ${r[t].title}`,children:c}),e.jsx("div",{className:`text-sm ${r[t].text}`,children:n})]}),o&&e.jsx("button",{onClick:b,className:`p-1 rounded-lg hover:bg-black/5 transition-colors ${r[t].icon}`,children:e.jsx(g,{className:"w-4 h-4"})})]})})})};export{j as A,k as I,C as a};
