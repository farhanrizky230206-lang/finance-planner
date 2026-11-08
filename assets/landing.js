(()=>{
  const button=document.querySelector('[data-menu-toggle]');
  const nav=document.querySelector('[data-nav-links]');
  if(!button||!nav)return;
  const close=()=>{nav.classList.remove('open');button.setAttribute('aria-expanded','false');};
  button.addEventListener('click',()=>{const active=nav.classList.toggle('open');button.setAttribute('aria-expanded',String(active));});
  nav.addEventListener('click',e=>{if(e.target.closest('a'))close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  document.addEventListener('click',e=>{if(!nav.contains(e.target)&&!button.contains(e.target))close();});
})();
