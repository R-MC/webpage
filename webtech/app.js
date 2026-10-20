// Implementation assisted by OpenAI Codex, 20 October 2026.
// API endpoints, response structures and attribution: https://www.tvmaze.com/api
// Browser API references: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
// https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
'use strict';
const $ = (id) => document.getElementById(id);
const storageKey = 'webtech-watchlist-v1';
let matches = [];
let saved = [];
let detailController;
try {
  const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(stored)) saved = stored.filter(item => Number.isInteger(item.id) && typeof item.name === 'string').slice(0, 200);
} catch { $('storage-status').textContent = 'Saved items could not be read. You can still use a temporary watchlist.'; }

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function plainText(html) {
  return new DOMParser().parseFromString(html || '', 'text/html').body.textContent.trim();
}
async function getJSON(path, signal = AbortSignal.timeout(15000)) {
  const response = await fetch('https://api.tvmaze.com' + path, { signal });
  if (!response.ok) throw new Error(response.status === 429 ? 'Too many requests. Wait a moment and try again.' : 'The show service is unavailable. Please try again.');
  return response.json();
}
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(saved)); $('storage-status').textContent = 'Watchlist saved on this browser.'; }
  catch { $('storage-status').textContent = 'Browser storage is unavailable. Your list will last only until this page closes.'; }
}
function toggleSaved(show) {
  if (saved.some(item => item.id === show.id)) saved = saved.filter(item => item.id !== show.id);
  else saved.push({id: show.id, name: show.name});
  persist(); renderSaved(); updateSaveButtons();
}
function updateSaveButtons() {
  document.querySelectorAll('[data-save-id]').forEach(button => {
    const isSaved = saved.some(show => show.id === Number(button.dataset.saveId));
    button.setAttribute('aria-pressed', String(isSaved));
    button.textContent = isSaved ? 'Saved ✓' : 'Save';
  });
}
function renderSaved() {
  $('saved-count').textContent = saved.length;
  $('saved-list').replaceChildren();
  if (!saved.length) { $('saved-list').append(element('li', 'Your list is empty. Save a show from the search results.')); return; }
  saved.forEach(show => {
    const item = element('li');
    item.append(element('strong', show.name, 'saved-name'));
    const detail = element('button', 'Details', 'secondary');
    detail.type = 'button'; detail.setAttribute('aria-label', 'Details for ' + show.name);
    detail.addEventListener('click', () => showDetails(show.id));
    const remove = element('button', 'Remove', 'secondary');
    remove.type = 'button'; remove.setAttribute('aria-label', 'Remove ' + show.name + ' from watchlist');
    remove.addEventListener('click', () => { toggleSaved(show); $('watch-title').setAttribute('tabindex', '-1'); $('watch-title').focus(); });
    item.append(detail, remove); $('saved-list').append(item);
  });
}
function renderResults() {
  const minRating = Number($('rating').value);
  let shows = matches.filter(show => (!$('genre').value || show.genres.includes($('genre').value)) &&
    (!minRating || (show.rating?.average != null && show.rating.average >= minRating)) &&
    (!$('running').checked || show.status === 'Running'));
  if ($('sort').value === 'rating') shows.sort((a,b) => (b.rating?.average ?? -1) - (a.rating?.average ?? -1));
  if ($('sort').value === 'name') shows.sort((a,b) => a.name.localeCompare(b.name));
  $('results').replaceChildren();
  $('search-status').textContent = shows.length ? shows.length + ' shows found. Select Details to explore a show.' : 'No matching shows. Try another title or relax your filters.';
  shows.forEach(show => {
    const card = element('article', undefined, 'show-card');
    const poster = element('div', undefined, 'poster');
    if (show.image?.medium?.startsWith('https://')) {
      const img = document.createElement('img'); img.src = show.image.medium; img.alt = ''; img.loading = 'lazy'; img.width = 210; img.height = 295;
      img.addEventListener('error', () => poster.replaceChildren(element('span', 'No poster available')), {once:true});
      poster.append(img);
    } else poster.append(element('span', 'No poster available'));
    const body = element('div', undefined, 'card-body');
    body.append(element('h3', show.name), element('p', [show.premiered?.slice(0,4) || 'Year unknown', show.language || 'Language unknown'].join(' · '), 'meta'), element('p', show.genres.join(' / ') || 'Genre unavailable', 'meta'), element('p', 'Rating: ' + (show.rating?.average ?? 'Not rated') + (show.rating?.average != null ? ' / 10' : ''), 'meta'));
    const actions = element('div', undefined, 'card-actions');
    const detail = element('button', 'Details'); detail.type='button'; detail.setAttribute('aria-label','Details for ' + show.name); detail.addEventListener('click',()=>showDetails(show.id));
    const save = element('button', 'Save', 'secondary'); save.type='button'; save.dataset.saveId=show.id; save.setAttribute('aria-label','Save ' + show.name + ' to watchlist'); save.addEventListener('click',()=>toggleSaved(show));
    actions.append(detail,save); body.append(actions); card.append(poster,body); $('results').append(card);
  });
  updateSaveButtons();
}
$('search-form').addEventListener('submit', async event => {
  event.preventDefault();
  const query = $('query').value.trim();
  $('query').setCustomValidity(query.length < 2 ? 'Enter at least two non-space characters.' : '');
  if (!$('search-form').reportValidity()) return;
  $('search-button').disabled=true; $('results').setAttribute('aria-busy','true'); $('search-status').textContent='Searching TVmaze…'; $('results').replaceChildren();
  try {
    const data=await getJSON('/search/shows?q=' + encodeURIComponent(query));
    if (!Array.isArray(data)) throw new Error('Unexpected search response. Please try again.');
    matches=data.map(item=>item.show).filter(show=>show && Number.isInteger(show.id) && typeof show.name==='string' && Array.isArray(show.genres));
    const oldGenre=$('genre').value;
    $('genre').replaceChildren(new Option('All genres',''));
    [...new Set(matches.flatMap(show=>show.genres))].sort().forEach(genre=>$('genre').append(new Option(genre,genre)));
    if ([...$('genre').options].some(option=>option.value===oldGenre)) $('genre').value=oldGenre;
    renderResults();
  } catch(error) { matches=[]; $('search-status').textContent=error.name==='TimeoutError' ? 'Search timed out. Please try again.' : error.message; }
  finally { $('search-button').disabled=false; $('results').setAttribute('aria-busy','false'); }
});
$('query').addEventListener('input',()=>$('query').setCustomValidity(''));
['genre','rating','sort','running'].forEach(id=>$(id).addEventListener('change',()=>{ if (matches.length && $('rating').checkValidity()) renderResults(); }));

async function showDetails(id) {
  detailController?.abort(); detailController=new AbortController();
  const controller=detailController;
  const timeout=setTimeout(()=>controller.abort(),15000);
  $('detail-title').textContent='Show details'; $('detail-content').replaceChildren(); $('detail-status').textContent='Loading show and cast…';
  if (!$('show-dialog').open) $('show-dialog').showModal();
  try {
    const [show,castResult]=await Promise.all([getJSON('/shows/'+id,controller.signal), getJSON('/shows/'+id+'/cast',controller.signal).catch(()=>null)]);
    if (controller.signal.aborted) return;
    $('detail-title').textContent=show.name;
    const content=$('detail-content');
    content.append(element('p',plainText(show.summary)||'No synopsis is available.'),element('p',[show.status,show.language,show.averageRuntime ? show.averageRuntime+' minutes per episode' : ''].filter(Boolean).join(' · '),'meta'),element('h3','Main cast'));
    if (Array.isArray(castResult) && castResult.length) {
      const list=element('ul'); castResult.slice(0,8).forEach(member=>list.append(element('li',(member.person?.name||'Unknown actor')+' as '+(member.character?.name||'Unknown character')))); content.append(list);
    } else content.append(element('p',castResult===null?'Cast could not be loaded. Close and reopen details to retry.':'No cast information available.'));
    if (typeof show.url==='string' && show.url.startsWith('https://www.tvmaze.com/')) { const link=element('a','View this show on TVmaze'); link.href=show.url; content.append(link); }
    $('detail-status').textContent='Show details loaded.';
  } catch(error) { if ($('show-dialog').open && controller===detailController) $('detail-status').textContent=controller.signal.aborted?'Loading timed out. Close and try again.':error.message; }
  finally { clearTimeout(timeout); }
}
$('close-dialog').addEventListener('click',()=>$('show-dialog').close());
$('show-dialog').addEventListener('close',()=>detailController?.abort());
renderSaved();
