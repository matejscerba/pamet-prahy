(() => {
  const root = document.documentElement;
  const intro = document.querySelector('#waa-intro');
  const symbol = intro.querySelector('.waa-intro-symbol');
  const earth = intro.querySelector('.waa-intro-earth');
  const mark = intro.querySelector('.waa-intro-mark');
  const caption = intro.querySelector('.waa-intro-caption');
  const veil = intro.querySelector('.waa-intro-veil');
  const skip = intro.querySelector('.waa-intro-skip');
  const home = document.querySelector('.wordmark');
  const pageParts = [document.querySelector('.city-header'), document.querySelector('main')];
  const animations = new Set();
  let playing = false;
  let previousFocus = null;
  let previousOverflow = '';
  const pause = milliseconds => new Promise(resolve => window.setTimeout(resolve,milliseconds));
  const animate = (element,frames,options) => {
    if (!element) return Promise.resolve();
    const animation = element.animate(frames,{fill:'forwards',...options});
    animations.add(animation);
    return animation.finished.catch(()=>{});
  };
  function finish() {
    if (!playing) return;
    playing = false;
    const focusWasInside = intro.contains(document.activeElement);
    for (const animation of animations) animation.cancel();
    animations.clear();
    intro.hidden = true;
    intro.dataset.phase = 'complete';
    root.classList.remove('waa-intro-pending','waa-intro-revealing');
    document.body.style.overflow = previousOverflow;
    pageParts.forEach(element=>{if(element)element.inert=false;});
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#ffffff');
    clearTimeout(window.waaIntroFailsafe);
    const url = new URL(location.href);
    if (url.searchParams.has('intro')) {
      url.searchParams.delete('intro');
      history.replaceState(null,'',url.pathname+url.search+url.hash);
    }
    if (focusWasInside) (previousFocus?.isConnected && previousFocus !== document.body ? previousFocus : home)?.focus({preventScroll:true});
  }
  async function playIntro() {
    if (playing) return;
    playing = true;
    previousFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.classList.remove('cities-returning');
    root.classList.add('waa-intro-pending');
    document.body.style.overflow = 'hidden';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#000000');
    window.scrollTo({top:0,left:0,behavior:'instant'});
    pageParts.forEach(element=>{if(element)element.inert=true;});
    intro.hidden = false;
    intro.dataset.phase = 'earth';
    clearTimeout(window.waaIntroFailsafe);
    window.waaIntroFailsafe = window.setTimeout(finish,8500);
    await Promise.race([earth.decode?.().catch(()=>{}),pause(1200)]);
    if (!playing) return;
    if (!earth.naturalWidth) {
      await Promise.all([
        animate(symbol,[{opacity:0},{opacity:1}],{duration:250}),
        animate(mark,[{opacity:0},{opacity:1}],{duration:250}),
        animate(caption,[{opacity:0},{opacity:1}],{duration:250}),
      ]);
      await pause(500);
      finish(); return;
    }
    animate(veil,[{opacity:1},{opacity:1}],{duration:1});
    animate(caption,[{opacity:0,transform:reducedMotion?'none':'translateY(8px)'},{opacity:1,transform:'none'}],{duration:reducedMotion?180:650,delay:160,easing:'ease-out'});
    animate(skip,[{opacity:0},{opacity:1}],{duration:500,delay:450});
    if (!reducedMotion) animate(earth,[{transform:'rotate(-9deg) scale(1.06)'},{transform:'rotate(0deg) scale(1.06)'}],{duration:2600,easing:'cubic-bezier(.16,1,.3,1)'});
    await animate(symbol,[{opacity:0,transform:reducedMotion?'translate(-50%,-50%)':'translate(-50%,-50%) scale(.9)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)'}],{duration:reducedMotion?180:650,easing:'cubic-bezier(.16,1,.3,1)'});
    await pause(reducedMotion?450:1050);
    if (!playing) return;
    intro.dataset.phase = 'morph';
    animate(caption,[{opacity:1},{opacity:0,transform:reducedMotion?'none':'translateY(-5px)'}],{duration:320,easing:'ease-in'});
    animate(skip,[{opacity:1},{opacity:0}],{duration:250});
    await Promise.all([
      animate(earth,[{opacity:1,filter:'blur(0px) saturate(1)'},{opacity:0,filter:reducedMotion?'none':'blur(7px) saturate(.25)'}],{duration:reducedMotion?200:780,easing:'ease-in-out'}),
      animate(mark,reducedMotion?[{opacity:0},{opacity:1}]:[{opacity:0,clipPath:'circle(0% at 50% 50%)',transform:'scale(.94)'},{opacity:1,clipPath:'circle(72% at 50% 50%)',transform:'scale(1)'}],{duration:reducedMotion?200:780,easing:'cubic-bezier(.4,0,.2,1)'}),
    ]);
    await pause(reducedMotion?0:160);
    if (!playing) return;
    intro.dataset.phase = 'reveal';
    root.classList.add('waa-intro-revealing');
    const destination = document.querySelector('.city-logo').getBoundingClientRect();
    const origin = symbol.getBoundingClientRect();
    const dx = destination.left+destination.width/2-origin.left-origin.width/2;
    const dy = destination.top+destination.height/2-origin.top-origin.height/2;
    const scale = destination.width/origin.width;
    if (!reducedMotion) animate(symbol,[{transform:'translate(-50%,-50%) scale(1)'},{transform:`translate(-50%,-50%) translate(${dx}px,${dy}px) scale(${scale})`}],{duration:1100,easing:'cubic-bezier(.76,0,.24,1)'});
    else animate(symbol,[{opacity:1},{opacity:0}],{duration:160});
    animate(veil,[{opacity:1},{opacity:0}],{duration:reducedMotion?200:1050,easing:'ease-in-out'});
    const reveal = (element,delay) => animate(element,[{opacity:0,transform:reducedMotion?'none':'translateY(10px)'},{opacity:1,transform:'none'}],{duration:reducedMotion?180:650,delay:reducedMotion?0:delay,easing:'cubic-bezier(.16,1,.3,1)'});
    const revealAnimations = [
      reveal(document.querySelector('.directory-year'),380),
      reveal(document.querySelector('.directory-mission'),480),
      reveal(document.querySelector('.city-nav'),650),
      reveal(document.querySelector('.collections-journal'),650),
      reveal(document.querySelector('.directory-city-search'),550),
    ];
    await Promise.all(revealAnimations);
    finish();
  }
  skip.addEventListener('click',finish);
  symbol.addEventListener('click',finish);
  document.addEventListener('keydown',event=>{
    if (playing && event.key==='Escape') { event.preventDefault(); finish(); }
  });
  home.addEventListener('click',event=>{
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const url = new URL(location.href); url.hash='';
    history.replaceState(null,'',url.pathname+url.search);
    playIntro();
  });
  if (window.waaShouldIntro) playIntro();
  else { intro.hidden=true; root.classList.remove('waa-intro-pending'); }
  window.addEventListener('pagehide',finish);
})();
