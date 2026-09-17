document.addEventListener('DOMContentLoaded', function () {
  function closeSitemap() {
    document.querySelectorAll('.site-map-layer.is-open').forEach(function(layer){
      layer.classList.remove('is-open');
      layer.setAttribute('aria-hidden', 'true');
    });
    document.querySelectorAll('.all-menu-open[aria-expanded="true"]').forEach(function(btn){
      btn.setAttribute('aria-expanded', 'false');
    });
    document.documentElement.classList.remove('menu-open');
  }

  document.querySelectorAll('.all-menu-open').forEach(function(btn){
    btn.addEventListener('click', function(){
      var header = btn.closest('.site-header');
      var layer = header ? header.nextElementSibling : null;
      while(layer && !layer.classList.contains('site-map-layer')){
        layer = layer.nextElementSibling;
      }
      if(!layer) return;
      var open = !layer.classList.contains('is-open');
      closeSitemap();
      if(open){
        layer.classList.add('is-open');
        layer.setAttribute('aria-hidden','false');
        btn.setAttribute('aria-expanded','true');
        document.documentElement.classList.add('menu-open');
      }
    });
  });

  document.querySelectorAll('[data-sitemap-close]').forEach(function(el){
    el.addEventListener('click', closeSitemap);
  });

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeSitemap();
  });
});