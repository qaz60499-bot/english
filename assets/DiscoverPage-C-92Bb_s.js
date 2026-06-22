import{c as a,j as t,L as i}from"./index-DKi5BhN2.js";import{P as r}from"./PageHeader-Bd5sCaRO.js";import{c as e}from"./summaryIndex-BQl-1-9M.js";import{M as o}from"./mic-7JMWEgcy.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=a("BookOpen",[["path",{d:"M12 7v14",key:"1akyts"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",key:"ruj8y"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n=a("FileText",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=a("Library",[["path",{d:"m16 6 4 14",key:"ji33uf"}],["path",{d:"M12 6v14",key:"1n7gus"}],["path",{d:"M8 8v12",key:"1gg7y9"}],["path",{d:"M4 4v16",key:"6qkkli"}]]),p=[{to:"/library",title:"词汇与表达库",description:"高频词、理解词、核心句型、场景表达、发音和例句。",count:`${e.stats.activeVocabulary+e.stats.recognitionVocabulary} 词块`,icon:d},{to:"/grammar",title:"语法工作室",description:"从真实例句理解结构，再通过常错和微练习巩固。",count:`${e.stats.grammar} 专题`,icon:c},{to:"/stories",title:"文化故事馆",description:"双语微故事、地区提示、理解题和个人表达任务。",count:`${e.stats.cultureStories} 故事`,icon:n},{to:"/pronunciation",title:"发音实验室",description:"元音、辅音、重音、连读、节奏、语调与口音适应。",count:`${e.stats.pronunciation} 专题`,icon:o}];function x(){return t.jsxs("div",{className:"page",children:[t.jsx(r,{eyebrow:"发现",title:"不只跟课，也能按自己的问题探索。",description:"所有内容均可搜索或筛选，手机端两步内到达；课程、复习与资料库共用同一套知识内容。"}),t.jsx("div",{className:"grid two",children:p.map(s=>t.jsxs(i,{className:"item-card discover-card",to:s.to,children:[t.jsx(s.icon,{size:24,"aria-hidden":"true"}),t.jsx("span",{className:"badge",children:s.count}),t.jsx("h2",{children:s.title}),t.jsx("p",{children:s.description})]},s.title))}),t.jsxs("section",{className:"panel",style:{marginTop:"1rem"},children:[t.jsx("h2",{children:"完整学习内容"}),t.jsxs("p",{children:[e.stats.courses," 节场景课程、",e.stats.exercises," 道不重复练习、",e.stats.sentencePatterns," 个核心句型和 ",e.stats.sceneExpressions," 条场景表达。数量按真实去重结果统计，不使用编号或改标签凑量。"]})]})]})}export{x as DiscoverPage};
