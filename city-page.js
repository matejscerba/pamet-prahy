const cityId = new URLSearchParams(location.search).get('city');
const selectedCityId = window.cityArchives[cityId] ? cityId : "london";
window.archiveCity = { ...window.cityArchives[selectedCityId], places: window.cityBuildings[selectedCityId] || [] };
document.documentElement.classList.toggle('empty-city', !window.archiveCity.places.length);
document.documentElement.lang = window.archiveCity.lang;
document.addEventListener('DOMContentLoaded', () => {
  const city = window.archiveCity;
  document.title = city.title;
  document.querySelector('.brand-name').textContent = city.title;
  document.querySelector('.topbar-brand').setAttribute('aria-label', city.title);
  document.querySelector('.city-loading > span').textContent = city.title;
  document.querySelector('.city-loading > span').lang = city.lang;
  document.querySelector('.city-loading').setAttribute('aria-label', city.title);
  document.querySelector('#map').setAttribute('aria-label', city.title);
});
