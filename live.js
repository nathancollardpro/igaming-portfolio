/* Compteur en direct (vrai, pas simulé) : présence des visiteurs et parties jouées.
   Les éléments [data-live] restent masqués tant que le serveur n'a pas répondu. */
(function(){
  var API='/api/live',KEY='kc_vid',id;
  try{id=localStorage.getItem(KEY);if(!id){id=Math.random().toString(36).slice(2,12)+Date.now().toString(36);localStorage.setItem(KEY,id);}}
  catch(e){id=Math.random().toString(36).slice(2,12)+Date.now().toString(36);}
  var game=document.documentElement.getAttribute('data-game')||null,pending=0,last=null,subs=[];
  var nf=function(n){return Number(n||0).toLocaleString(window.KC?KC.loc():'fr-FR');};
  function render(d){last=d;
    document.querySelectorAll('[data-live]').forEach(function(el){
      var k=el.getAttribute('data-live'),v=null;
      if(k==='online')v=d.online;
      else if(k==='total')v=d.totals&&d.totals.all;
      else if(k.indexOf('total:')===0)v=d.totals&&d.totals[k.slice(6)];
      else if(k.indexOf('playing:')===0)v=d.playing&&d.playing[k.slice(8)];
      if(v==null)return;
      var t=el.querySelector('[data-n]')||el;t.textContent=nf(v);
      var one=el.querySelector('[data-pl]');if(one)one.textContent=v>1?one.getAttribute('data-pl'):one.getAttribute('data-sg');
      el.hidden=el.hasAttribute('data-hide-zero')&&!v?true:false;});
    subs.forEach(function(f){try{f(d);}catch(e){}});}
  function send(leave){var s=pending;pending=0;var body=JSON.stringify({id:id,game:game,spins:s,leave:!!leave});
    if(leave&&navigator.sendBeacon){navigator.sendBeacon(API,new Blob([body],{type:'text/plain'}));return;}
    fetch(API,{method:'POST',headers:{'content-type':'text/plain'},body:body,keepalive:true,cache:'no-store'})
      .then(function(r){if(!r.ok)throw 0;return r.json();}).then(render).catch(function(){pending+=s;});}
  window.KCLive={spin:function(n){pending+=(n||1);},on:function(f){subs.push(f);if(last)f(last);},refresh:function(){if(last)render(last);}};
  if(location.protocol==='file:'||/github\.io$/.test(location.hostname))return; // pas de serveur /api/live sur GitHub Pages
  send();setInterval(function(){if(!document.hidden)send();},25000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)send();});
  window.addEventListener('pagehide',function(){send(true);});
})();
