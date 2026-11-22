const cityInfo = document.querySelector('.city-info');
let cityInfoTrigger;

function renderMission(body) {
  const layout = document.createElement('div');
  layout.className = 'mission-layout';
  const photo = document.createElement('img');
  photo.className = 'mission-photo';
  photo.src = './public/images/mission/analog-archive.png';
  photo.alt = 'Gloved hands carefully handling photographic records in an archive drawer.';
  photo.width = 2008;
  photo.height = 1506;
  const text = document.createElement('div');
  text.className = 'mission-text';
  const paragraphs = [
    'The world changes every day. Buildings disappear, neighbourhoods take new shapes, and ordinary scenes become history. Our mission is to create new analog records of the world while these places and moments are still here.',
    'A photograph made on film leaves a physical original: a negative that can be held, studied and returned to. Preserving it alongside its date, location and the story of its making gives future generations a material connection to the world we inhabit today.',
    'Making the photograph is only the beginning. The work continues through careful storage, clear cataloguing and accessible digital copies. By returning to the same places over time and caring for each original, we can build an archive that grows with the world and remains available long after us.'
  ];
  for (const paragraph of paragraphs) {
    const element = document.createElement('p');
    element.textContent = paragraph;
    text.append(element);
  }
  layout.append(photo, text);
body.append(layout);
photo.decode().catch(() => {}).then(() => {
  if (photo.isConnected) photo.classList.add('is-ready');
});
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
    cityInfoTrigger = button;
    cityInfo.dataset.section = button.dataset.info;
    document.querySelector('#city-info-title').textContent = button.dataset.info;
    const body = document.querySelector('.city-info-body');
    body.replaceChildren();
    if (button.dataset.info === 'Mission') renderMission(body);
    else if (button.dataset.info === 'Image policy') renderImagePolicy(body);
    else {
      const paragraph = document.createElement('p');
      paragraph.textContent = 'Informace připravujeme.';
      body.append(paragraph);
    }
    cityInfo.showModal();
    cityInfo.scrollTop = 0;
  });
});
document.querySelector('.city-info-close').addEventListener('click', () => cityInfo.close());
cityInfo.addEventListener('close', () => cityInfoTrigger?.focus());
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
      url:`${base}${base.includes('?') ? '&' : '?'}article=${encodeURIComponent(article.key)}#journal`,
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
