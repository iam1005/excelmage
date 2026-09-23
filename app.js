'use strict';
const categories = {
  '날짜/시간 함수': 'DATE HOUR MONTH TODAY WEEKDAY YEAR DAY MINUTE NOW SECOND TIME',
  '수학/삼각 함수': 'INT MOD PRODUCT ROUND ROUNDDOWN ROUNDUP SUM SUMPRODUCT SUMIF TRUNC ABS CEILING.MATH ODD PI POWER SUBTOTAL TRIMMEAN',
  '통계 함수': 'AVERAGE AVERAGEIF COUNT COUNTA COUNTIF LARGE MAX MEDIAN MIN RANK.EQ COUNTBLANK MODE.SNGL MODE.MULT SMALL',
  '찾기/참조 함수': 'CHOOSE HLOOKUP VLOOKUP INDEX MATCH ADDRESS OFFSET TRANSPOSE',
  '데이터베이스 함수': 'DAVERAGE DCOUNT DGET DMAX DMIN DSUM DCOUNTA DVAR DPRODUCT DSTDEV',
  '텍스트 함수': 'CONCAT LEFT MID REPLACE RIGHT LEN LOWER PROPER VALUE WON REPT',
  '정보 함수': 'ISERROR',
  '논리값 함수': 'AND IF OR NOT TRUE FALSE'
};
const allFunctions = Object.entries(categories).flatMap(([category, names]) => names.split(' ').map(name => ({category, name})));
const $ = id => document.getElementById(id);
const state = {active:false, queue:[], index:0, started:null, ended:null, completedChars:0, attempts:0, correctAttempts:0, previous:'', timer:null};
function pool() {return allFunctions.filter(item => !$('category').value || item.category === $('category').value);}
function elapsed() {return state.started === null ? 0 : ((state.ended ?? performance.now()) - state.started) / 1000;}
function matchingCount(value, target) {return [...value].reduce((n, ch, i) => n + (ch.toUpperCase() === target[i] ? 1 : 0), 0);}
function metrics() {
  const seconds = elapsed();
  const current = state.queue[state.index]?.name ?? '';
  const chars = state.completedChars + matchingCount($('typing').value, current);
  return {seconds, speed: seconds > 0 ? Math.round(chars * 60 / seconds) : 0, accuracy:state.attempts ? Math.round(state.correctAttempts / state.attempts * 100) : null};
}
function timeLabel(seconds) {return `${Math.floor(seconds / 60).toString().padStart(2,'0')}:${Math.floor(seconds % 60).toString().padStart(2,'0')}`;}
function updateStats() {const m=metrics(); $('speed').textContent=m.speed; $('accuracy').textContent=m.accuracy ?? '—'; $('elapsed').textContent=timeLabel(m.seconds);}
function drawTarget() {
  const item=state.queue[state.index];
  $('target-category').textContent=item.category;
  $('function-description').textContent=functionInfo[item.name][0];
  $('function-example').textContent=functionInfo[item.name][1];
  $('target').replaceChildren(...[...item.name].map((ch,i) => {const span=document.createElement('span'); span.textContent=ch; if(i<$('typing').value.length) span.className=$('typing').value[i].toUpperCase()===ch?'correct':'wrong'; return span;}));
  $('position').textContent=`${state.index+1} / ${state.queue.length}`;
  $('progress-fill').style.width=`${state.index/state.queue.length*100}%`;
}
function start() {
  clearInterval(state.timer);
  Object.assign(state,{active:true,queue:[...pool()],index:0,started:null,ended:null,completedChars:0,attempts:0,correctAttempts:0,previous:''});
  if($('shuffle').checked) for(let i=state.queue.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [state.queue[i],state.queue[j]]=[state.queue[j],state.queue[i]];}
  $('category').disabled=$('shuffle').disabled=$('start').disabled=true;
  $('typing').disabled=false; $('typing').value=''; $('stop').disabled=false;
  $('status').textContent='● 연습 중'; $('target-help').textContent='함수 이름을 입력한 뒤 Enter를 누르세요.';
  $('feedback').textContent='첫 입력부터 시간이 측정됩니다.'; $('feedback').classList.remove('error');
  drawTarget();updateStats();$('typing').focus();state.timer=setInterval(updateStats,150);
}
function finish(completed) {
  if(!state.active)return;
  state.ended=performance.now();state.active=false;clearInterval(state.timer);updateStats();
  const m=metrics(); $('typing').disabled=true;$('stop').disabled=true;
  $('category').disabled=$('shuffle').disabled=$('start').disabled=false;
  $('status').textContent=completed?'● 연습 완료':'● 연습 종료';
  $('result-title').textContent=completed?'끝까지 해냈어요!':'오늘도 한 걸음 앞으로.';
  $('result-description').textContent=completed?'선택한 모든 함수의 연습을 마쳤습니다.':'여기까지의 연습 기록을 확인하세요.';
  $('result-speed').textContent=m.speed; $('result-accuracy').textContent=m.accuracy===null?'—':`${m.accuracy}%`;
  $('result-progress').textContent=`${state.index} / ${state.queue.length}`;$('result-time').textContent=timeLabel(m.seconds);
  $('progress-fill').style.width=`${state.index/state.queue.length*100}%`;
  if(completed){$('position').textContent=`${state.index} / ${state.queue.length}`;$('target').textContent='WELL DONE!';$('target-help').textContent='모든 함수를 연습했습니다.';$('function-description').textContent='모든 함수의 의미와 사용 예를 살펴봤어요.';$('function-example').textContent='다시 연습해보세요!';}
  $('results').showModal();
}
$('category').append(new Option('전체 함수', ''),...Object.keys(categories).map(name=>new Option(name,name)));
function updateScope() {$('scope-count').textContent=pool().length;}
$('category').addEventListener('change',updateScope);updateScope();
$('start').addEventListener('click',start);$('stop').addEventListener('click',()=>finish(false));
$('typing').addEventListener('paste',event=>event.preventDefault());
$('typing').addEventListener('drop',event=>event.preventDefault());
$('typing').addEventListener('input',()=>{
  if(!state.active)return;
  const value=$('typing').value;const old=state.previous;
  let prefix=0;while(prefix<old.length && prefix<value.length && old[prefix]===value[prefix])prefix++;
  let suffix=0;while(suffix<old.length-prefix && suffix<value.length-prefix && old[old.length-1-suffix]===value[value.length-1-suffix])suffix++;
  const added=value.slice(prefix,value.length-suffix);
  if(added.length && state.started===null)state.started=performance.now();
  const target=state.queue[state.index].name;
  [...added].forEach((ch,i)=>{state.attempts++;if(ch.toUpperCase()===target[prefix+i])state.correctAttempts++;});
  state.previous=value;drawTarget();updateStats();$('feedback').classList.remove('error');
  $('feedback').textContent=value.toUpperCase()===target?'정확해요! Enter를 눌러 다음으로 이동하세요.':'대소문자는 구분하지 않습니다.';
});
$('typing').addEventListener('keydown',event=>{
  if(event.key!=='Enter'||event.isComposing||!state.active)return;
  event.preventDefault();const target=state.queue[state.index].name;
  if($('typing').value.toUpperCase()!==target){$('feedback').textContent='함수 이름을 확인해주세요. 틀린 부분을 수정할 수 있어요.';$('feedback').classList.add('error');return;}
  state.completedChars+=target.length;state.index++;$('typing').value='';state.previous='';
  if(state.index===state.queue.length){finish(true);return;}
  drawTarget();updateStats();$('feedback').textContent='좋아요! 다음 함수도 이어서 입력해보세요.';
});
$('again').addEventListener('click',()=>{$('results').close();start();});
$('close').addEventListener('click',()=>{$('results').close();$('start').focus();});

