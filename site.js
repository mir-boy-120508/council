(function(){
 const toggle=document.querySelector('.nav-toggle');
 if(toggle){toggle.addEventListener('click',()=>{const open=document.body.classList.toggle('menu-open');toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'×':'☰';});}
 const here=(location.pathname.split('/').pop()||'index.html');
 document.querySelectorAll('.nav-links a,.mobile-menu a').forEach(a=>{if(a.getAttribute('href')===here)a.setAttribute('aria-current','page');});
})();
