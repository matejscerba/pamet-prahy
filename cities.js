const cityInfo = document.querySelector('.city-info');
let cityInfoTrigger;

let missionReturnHash = '';
function setMissionReading(active) {
  document.body.classList.toggle('mission-reading',active);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',active?'#080a09':'#ffffff');
  document.querySelector('.directory-identity').inert = active;
  document.querySelector('main').inert = active;
  if (active) {
    missionReturnHash = location.hash === '#mission' ? '' : location.hash;
    history.replaceState(null,'',location.pathname+location.search+'#mission');
    updateMissionFrame();
  } else if (location.hash === '#mission') {
    history.replaceState(null,'',location.pathname+location.search+missionReturnHash);
  }
}
function updateMissionFrame() {
  cityInfo.style.setProperty('--mission-footer-height',`${document.querySelector('.city-nav').getBoundingClientRect().height}px`);
}
function renderMission(body) {
  const page=document.createElement('article'); page.className='mission-page';
  const figure=document.createElement('figure');figure.className='mission-vision';
  const photo=document.createElement('img');photo.className='mission-photo';photo.src='./public/images/mission/mission-2100-abstract.png';
  photo.alt='An abstract oil-style painting with shadow-like human forms and suggestions of immersive headsets.';photo.width=1672;photo.height=941;
  figure.append(photo);
  const copy=document.createElement('div');copy.className='mission-copy';
  const heading=document.createElement('h1');heading.textContent='Memorandum for 2100';copy.append(heading);
for(const text of [
  'In 2100, we may share the same street and live in entirely different worlds. Through smart glasses, immersive headsets and personalised realities, each of us may see a different version of the same place. What one person experiences as real may never have existed for another.',
  'Beneath these layers, there is still a physical world. Buildings stand and disappear. Streets change. Light falls on places that will never look exactly the same again. We must record that world while it is here, before its memory becomes indistinguishable from the worlds we invent.',
  'World Analog Archive exists to preserve this shared reality on analog media. A photograph made on film leaves a physical original: light from a real place recorded on material we can keep. Together with its date, location and provenance, that original gives future generations a record they can return to and examine.',
  'Our commitment is to create these records now and preserve them for 2100 and beyond. When every person can inhabit a different world, the real one must still have a memory. A shared reference, held in physical originals, so that what was there does not have to be a matter of belief.'
  ]) { const paragraph=document.createElement('p');paragraph.textContent=text;copy.append(paragraph); }
  page.append(figure,copy);body.append(page);
  photo.decode().catch(()=>{}).then(()=>{if(photo.isConnected)photo.classList.add('is-ready');});
}

function renderImagePolicy(body) {
  const introduction = document.createElement('p');
  introduction.textContent = 'Photographs retain their original capture dates. Display treatment: square crops, film-style colour toning and a subtle grain overlay. The original files are unmodified. Future entries are planned documentation.';
  body.append(introduction);
  for (const photo of window.archivePhotoCredits || []) {
    const section = document.createElement('section');
    const heading = document.createElement('h3');
    heading.textContent = photo.building;
    const details = document.createElement('p');
    details.textContent = `${photo.author} · ${photo.date} · `;
    for (const [label, url] of [['Source', photo.source], [photo.license, photo.licenseUrl]]) {
      const link = document.createElement('a');
      link.textContent = label;
      link.href = url;
      link.target = '_blank';
      link.rel = 'noreferrer';
      details.append(link, ' ');
    }
    section.append(heading, details);
    body.append(section);
  }
}

document.querySelectorAll('[data-info]').forEach(button => {
  button.addEventListener('click', () => {
    setMissionReading(false);
    if (cityInfo.open) cityInfo.close();
    cityInfoTrigger = button;
    cityInfo.dataset.section = button.dataset.info;
    document.querySelector('#city-info-title').textContent = button.dataset.info === 'Mission' ? 'WORLD ANALOG ARCHIVE / MEMORANDUM' : button.dataset.info;
    const body = document.querySelector('.city-info-body');
    body.replaceChildren();
    if (button.dataset.info === 'Mission') renderMission(body);
    else if (button.dataset.info === 'Image policy') renderImagePolicy(body);
    else {
      const paragraph = document.createElement('p');
      paragraph.textContent = 'Informace připravujeme.';
      body.append(paragraph);
    }
    if (button.dataset.info === 'Mission') { cityInfo.show(); setMissionReading(true); }
    else cityInfo.showModal();
    cityInfo.scrollTop = 0;
  });
});
document.querySelector('.city-info-close').addEventListener('click', () => cityInfo.close());
cityInfo.addEventListener('close', () => { if (cityInfo.open) return; setMissionReading(false); cityInfoTrigger?.focus(); });
cityInfo.addEventListener('click', event => {
  if (event.target !== cityInfo) return;
  const bounds = cityInfo.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) cityInfo.close();
});

window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  document.documentElement.classList.remove('cities-returning');
  void document.documentElement.offsetWidth;
  document.documentElement.classList.add('cities-returning');
});

// The directory collects the same article records used by each city journal.
const directoryJournalEntries = [];
for (const [cityId, city] of Object.entries(window.cityArchives)) {
  const language = city.lang === 'ca' ? 'es' : city.lang;
  const articles = window.journalArticles.filter(article => cityId === 'prague' ? !article.otherCitiesOnly : !article.pragueOnly);
  const recordImages = (window.cityBuildings[cityId] || []).flatMap(place => place.history.filter(event => event.kind !== 'planned').flatMap(event => event.photos || []));
  articles.forEach((article,index) => {
    const copy = window.articleLocalization[language]?.articles[article.key];
    const base = cityId === 'prague' ? './praha.html' : `./city.html?city=${encodeURIComponent(cityId)}`;
    directoryJournalEntries.push({
      cityId, cityTitle:city.title, language,
      title:copy?.[1] || article.title,
      summary:copy?.[2] || article.summary,
      category:copy?.[0] || article.category,
      image:article.image || recordImages[0]?.src || './public/images/mission/analog-archive.png',
      alt:article.alt || city.title,
      url:`${base}${base.includes('?') ? '&' : '?'}article=${encodeURIComponent(article.key)}&from=directory#journal`,
      rank:article.example === false ? -2 + index : index,
    });
  });
}
directoryJournalEntries.sort((a,b)=>a.rank-b.rank);
const collectionFilter = document.querySelector('#journal-collection-filter');
for (const [id,city] of Object.entries(window.cityArchives)) {
  const option=document.createElement('option'); option.value=id; option.textContent=city.title; collectionFilter.append(option);
}
let journalVisibleCount = 9;
function renderDirectoryJournal() {
  const entries=directoryJournalEntries.filter(entry=>collectionFilter.value==='all'||entry.cityId===collectionFilter.value);
  const root=document.querySelector('#collections-journal-grid');
  root.replaceChildren();
  for (const entry of entries.slice(0,journalVisibleCount)) {
    const article=document.createElement('article');
    const link=document.createElement('a'); link.className='collection-story'; link.href=entry.url;
    const image=document.createElement('img'); image.src=entry.image; image.alt=entry.alt; image.loading='lazy'; image.decoding='async'; image.width=600; image.height=600;
    const collection=document.createElement('p'); collection.className='collection-story-city'; collection.textContent=entry.cityTitle;
    const title=document.createElement('h3'); title.textContent=entry.title; title.lang=entry.language;
    const summary=document.createElement('p'); summary.className='collection-story-summary'; summary.textContent=entry.summary; summary.lang=entry.language;
    const more=document.createElement('span'); more.className='collection-story-read'; more.textContent='Read article →';
    link.append(image,collection,title,summary,more); article.append(link); root.append(article);
  }
  document.querySelector('#journal-load-more').hidden = journalVisibleCount>=entries.length;
  document.querySelector('#journal-entry-count').textContent=`${Math.min(journalVisibleCount,entries.length)} / ${entries.length}`;
}
collectionFilter.addEventListener('change',()=>{journalVisibleCount=9;renderDirectoryJournal();});
document.querySelector('#journal-load-more').addEventListener('click',()=>{journalVisibleCount+=9;renderDirectoryJournal();});
renderDirectoryJournal();


// Find a collection by its city name, local spelling or collection title.
const directoryCityNames = {
  prague:{name:'Prague',aliases:['Praha','Prag','Praga','Czechia','Czech Republic']},
  berlin:{name:'Berlin',aliases:['Germany','Deutschland']},
  vienna:{name:'Vienna',aliases:['Wien','Vídeň','Austria','Österreich']},
  budapest:{name:'Budapest',aliases:['Budapešť','Hungary','Magyarország']},
  warsaw:{name:'Warsaw',aliases:['Warszawa','Varšava','Poland','Polska']},
  zurich:{name:'Zürich',aliases:['Zurich','Curych','Switzerland','Schweiz']},
  london:{name:'London',aliases:['Londýn','Londres','United Kingdom','England']},
  paris:{name:'Paris',aliases:['Paříž','Parijs','France']},
  amsterdam:{name:'Amsterdam',aliases:['Netherlands','Nederland']},
  brussels:{name:'Brussels',aliases:['Bruxelles','Brussel','Brusel','Belgium','Belgique','België']},
  dublin:{name:'Dublin',aliases:['Baile Átha Cliath','Ireland','Éire']},
  copenhagen:{name:'Copenhagen',aliases:['København','Kobenhavn','Kodaň','Denmark','Danmark']},
  stockholm:{name:'Stockholm',aliases:['Sweden','Sverige']},
  oslo:{name:'Oslo',aliases:['Norway','Norge']},
  helsinki:{name:'Helsinki',aliases:['Helsingfors','Helsinky','Finland','Suomi']},
  reykjavik:{name:'Reykjavík',aliases:['Reykjavik','Iceland','Ísland']},
  rome:{name:'Rome',aliases:['Roma','Řím','Italy','Italia']},
  milan:{name:'Milan',aliases:['Milano','Milán','Italy','Italia']},
  madrid:{name:'Madrid',aliases:['Spain','España']},
  barcelona:{name:'Barcelona',aliases:['Spain','España','Catalunya']},
  lisbon:{name:'Lisbon',aliases:['Lisboa','Lisabon','Portugal']},
  athens:{name:'Athens',aliases:['Αθήνα','Athina','Atény','Greece','Ελλάδα']},
};
const normalizeCitySearch = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/ø/g,'o').trim();
const citySearchForm = document.querySelector('#directory-city-search');
const citySearchInput = document.querySelector('#directory-city-input');
const citySearchResults = document.querySelector('#directory-city-results');
let currentCityMatches = [];
function renderCityMatches() {
  const query=normalizeCitySearch(citySearchInput.value);
  citySearchResults.replaceChildren();
  if (!query) {
    currentCityMatches=[]; citySearchResults.hidden=true;
    citySearchForm.querySelector('button[type="submit"]').disabled=true;
    document.querySelector('#directory-city-status').textContent='';
    return;
  }
  currentCityMatches = Object.entries(window.cityArchives).map(([id,city])=>{
    const names=directoryCityNames[id];
    const terms=[names.name,...names.aliases,city.title,id].map(normalizeCitySearch);
    const rank=terms.some(term=>term===query)?0:terms.some(term=>term.startsWith(query))?1:2;
    return {id,city,name:names.name,terms,rank};
  }).filter(entry=>entry.terms.some(term=>term.includes(query))).sort((a,b)=>a.rank-b.rank||a.name.localeCompare(b.name));
  for (const match of currentCityMatches) {
    const item=document.createElement('li');
    const link=document.createElement('a'); link.href=match.id==='prague'?'./praha.html?enter=1#archive':`./city.html?city=${encodeURIComponent(match.id)}&enter=1#archive`;
    const text=document.createElement('span'); text.className='directory-city-result-text';
    const name=document.createElement('span'); name.className='directory-city-result-name'; name.textContent=match.name;
    const collection=document.createElement('span'); collection.className='directory-city-result-collection'; collection.textContent=match.city.title;
    const arrow=document.createElement('span'); arrow.className='directory-city-result-arrow'; arrow.textContent='→'; arrow.setAttribute('aria-hidden','true');
    text.append(name,collection); link.append(text,arrow); item.append(link); citySearchResults.append(item);
  }
  if (!currentCityMatches.length) { const empty=document.createElement('li');empty.className='directory-city-no-match';empty.textContent='No cities found.';citySearchResults.append(empty); }
  citySearchResults.hidden=false;
  citySearchForm.querySelector('button[type="submit"]').disabled=!currentCityMatches.length;
  document.querySelector('#directory-city-status').textContent=currentCityMatches.length?`${currentCityMatches.length} matching ${currentCityMatches.length===1?'city':'cities'}.`:'No cities found.';
}
citySearchInput.addEventListener('input',renderCityMatches);
citySearchInput.addEventListener('focus',()=>{if(citySearchInput.value.trim())renderCityMatches();});
citySearchForm.addEventListener('submit',event=>{event.preventDefault();if(currentCityMatches.length)location.assign(citySearchResults.querySelector('a').href);});
citySearchInput.addEventListener('keydown',event=>{
  if (event.key==='ArrowDown'||event.key==='ArrowUp') {
    const links=[...citySearchResults.querySelectorAll('a')];
    if(links.length){event.preventDefault();citySearchResults.hidden=false;(event.key==='ArrowDown'?links[0]:links.at(-1)).focus();}
  } else if(event.key==='Escape') citySearchResults.hidden=true;
});
citySearchResults.addEventListener('keydown',event=>{
  const links=[...citySearchResults.querySelectorAll('a')],index=links.indexOf(document.activeElement);
  if(event.key==='ArrowDown'||event.key==='ArrowUp') {
    event.preventDefault();
    const next=index+(event.key==='ArrowDown'?1:-1);
    if(next<0)citySearchInput.focus();else links[next%links.length]?.focus();
  } else if(event.key==='Escape'){citySearchInput.focus();citySearchResults.hidden=true;}
});
document.addEventListener('click',event=>{if(!citySearchForm.contains(event.target))citySearchResults.hidden=true;});
window.addEventListener('resize',()=>{if(cityInfo.open&&cityInfo.dataset.section==='Mission')updateMissionFrame();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&cityInfo.open&&cityInfo.dataset.section==='Mission'){event.preventDefault();cityInfo.close();}});
if (location.hash === '#mission') document.querySelector('.directory-mission').click();
