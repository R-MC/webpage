// Show data from the TVmaze API: https://www.tvmaze.com/api
'use strict';

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'webtech-watchlist-v1';
const MAX_SAVED = 200;
const TIMEOUT_MS = 15000;

let matches = [];
let saved = [];
let detailController;

// load watchlist from last visit
try {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (Array.isArray(stored)) {
    saved = stored
      .filter((item) => Number.isInteger(item.id) && typeof item.name === 'string')
      .slice(0, MAX_SAVED);
  }
} catch {
  $('storage-status').textContent = 'Saved items could not be read. You can still use a temporary watchlist.';
}

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function button(label, className, ariaLabel, onClick) {
  const btn = el('button', label, className);
  btn.type = 'button';
  if (ariaLabel) btn.setAttribute('aria-label', ariaLabel);
  btn.addEventListener('click', onClick);
  return btn;
}

// summaries come back as html, we just want the text
function stripHtml(html) {
  return new DOMParser().parseFromString(html || '', 'text/html').body.textContent.trim();
}

async function getJSON(path, signal = AbortSignal.timeout(TIMEOUT_MS)) {
  const res = await fetch('https://api.tvmaze.com' + path, { signal });

  if (!res.ok) {
    if (res.status === 429) throw new Error('Too many requests. Wait a moment and try again.');
    throw new Error('The show service is unavailable. Please try again.');
  }
  return res.json();
}

/* ---------- watchlist ---------- */

function isSaved(id) {
  return saved.some((item) => item.id === id);
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    $('storage-status').textContent = 'Watchlist saved on this browser.';
  } catch {
    $('storage-status').textContent = 'Browser storage is unavailable. Your list will last only until this page closes.';
  }
}

function toggleSaved(show) {
  if (isSaved(show.id)) {
    saved = saved.filter((item) => item.id !== show.id);
  } else {
    saved.push({ id: show.id, name: show.name });
  }
  persist();
  renderSaved();
  updateSaveButtons();
}

function updateSaveButtons() {
  document.querySelectorAll('[data-save-id]').forEach((btn) => {
    const on = isSaved(Number(btn.dataset.saveId));
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? 'Saved ✓' : 'Save';
  });
}

function renderSaved() {
  const list = $('saved-list');
  $('saved-count').textContent = saved.length;
  list.replaceChildren();

  if (!saved.length) {
    list.append(el('li', 'Your list is empty. Save a show from the search results.'));
    return;
  }

  for (const show of saved) {
    const li = el('li');
    li.append(el('strong', show.name, 'saved-name'));

    const details = button('Details', 'secondary', 'Details for ' + show.name, () => showDetails(show.id));
    const remove = button('Remove', 'secondary', 'Remove ' + show.name + ' from watchlist', () => {
      toggleSaved(show);
      // the button we clicked is gone now, so move focus somewhere sensible
      $('watch-title').setAttribute('tabindex', '-1');
      $('watch-title').focus();
    });

    li.append(details, remove);
    list.append(li);
  }
}

/* ---------- search results ---------- */

function filteredShows() {
  const genre = $('genre').value;
  const minRating = Number($('rating').value);
  const runningOnly = $('running').checked;

  const shows = matches.filter((show) => {
    const rating = show.rating?.average;
    if (genre && !show.genres.includes(genre)) return false;
    if (minRating && (rating == null || rating < minRating)) return false;
    if (runningOnly && show.status !== 'Running') return false;
    return true;
  });

  const sort = $('sort').value;
  if (sort === 'rating') {
    shows.sort((a, b) => (b.rating?.average ?? -1) - (a.rating?.average ?? -1));
  } else if (sort === 'name') {
    shows.sort((a, b) => a.name.localeCompare(b.name));
  }
  return shows;
}

function posterFor(show) {
  const poster = el('div', undefined, 'poster');
  const src = show.image?.medium;

  if (!src?.startsWith('https://')) {
    poster.append(el('span', 'No poster available'));
    return poster;
  }

  const img = document.createElement('img');
  img.src = src;
  img.alt = '';
  img.loading = 'lazy';
  img.width = 210;
  img.height = 295;
  img.addEventListener('error', () => {
    poster.replaceChildren(el('span', 'No poster available'));
  }, { once: true });

  poster.append(img);
  return poster;
}

function showCard(show) {
  const card = el('article', undefined, 'show-card');
  const body = el('div', undefined, 'card-body');

  const year = show.premiered?.slice(0, 4) || 'Year unknown';
  const lang = show.language || 'Language unknown';
  const rating = show.rating?.average;
  const ratingText = rating != null ? rating + ' / 10' : 'Not rated';

  body.append(
    el('h3', show.name),
    el('p', year + ' · ' + lang, 'meta'),
    el('p', show.genres.join(' / ') || 'Genre unavailable', 'meta'),
    el('p', 'Rating: ' + ratingText, 'meta'),
  );

  const save = button('Save', 'secondary', 'Save ' + show.name + ' to watchlist', () => toggleSaved(show));
  save.dataset.saveId = show.id;

  const actions = el('div', undefined, 'card-actions');
  actions.append(
    button('Details', undefined, 'Details for ' + show.name, () => showDetails(show.id)),
    save,
  );
  body.append(actions);

  card.append(posterFor(show), body);
  return card;
}

function renderResults() {
  const shows = filteredShows();

  $('results').replaceChildren(...shows.map(showCard));
  $('search-status').textContent = shows.length
    ? shows.length + ' shows found. Select Details to explore a show.'
    : 'No matching shows. Try another title or relax your filters.';

  updateSaveButtons();
}

function fillGenreOptions() {
  const select = $('genre');
  const previous = select.value;
  const genres = [...new Set(matches.flatMap((show) => show.genres))].sort();

  select.replaceChildren(new Option('All genres', ''));
  genres.forEach((g) => select.append(new Option(g, g)));

  // keep the old selection if it still exists
  if (genres.includes(previous)) select.value = previous;
}

$('search-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const input = $('query');
  const query = input.value.trim();
  input.setCustomValidity(query.length < 2 ? 'Enter at least two non-space characters.' : '');
  if (!$('search-form').reportValidity()) return;

  $('search-button').disabled = true;
  $('results').setAttribute('aria-busy', 'true');
  $('results').replaceChildren();
  $('search-status').textContent = 'Searching TVmaze…';

  try {
    const data = await getJSON('/search/shows?q=' + encodeURIComponent(query));
    if (!Array.isArray(data)) throw new Error('Unexpected search response. Please try again.');

    matches = data
      .map((item) => item.show)
      .filter((show) => show && Number.isInteger(show.id) && typeof show.name === 'string' && Array.isArray(show.genres));

    fillGenreOptions();
    renderResults();
  } catch (err) {
    matches = [];
    $('search-status').textContent = err.name === 'TimeoutError'
      ? 'Search timed out. Please try again.'
      : err.message;
  } finally {
    $('search-button').disabled = false;
    $('results').setAttribute('aria-busy', 'false');
  }
});

$('query').addEventListener('input', () => $('query').setCustomValidity(''));

for (const id of ['genre', 'rating', 'sort', 'running']) {
  $(id).addEventListener('change', () => {
    if (matches.length && $('rating').checkValidity()) renderResults();
  });
}

/* ---------- details dialog ---------- */

function castList(cast) {
  if (cast === null) return el('p', 'Cast could not be loaded. Close and reopen details to retry.');
  if (!Array.isArray(cast) || !cast.length) return el('p', 'No cast information available.');

  const ul = el('ul');
  for (const member of cast.slice(0, 8)) {
    const actor = member.person?.name || 'Unknown actor';
    const character = member.character?.name || 'Unknown character';
    ul.append(el('li', actor + ' as ' + character));
  }
  return ul;
}

async function showDetails(id) {
  // cancel whatever was loading before
  detailController?.abort();
  const controller = new AbortController();
  detailController = controller;
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const dialog = $('show-dialog');
  const content = $('detail-content');
  $('detail-title').textContent = 'Show details';
  $('detail-status').textContent = 'Loading show and cast…';
  content.replaceChildren();
  if (!dialog.open) dialog.showModal();

  try {
    const [show, cast] = await Promise.all([
      getJSON('/shows/' + id, controller.signal),
      getJSON('/shows/' + id + '/cast', controller.signal).catch(() => null),
    ]);
    if (controller.signal.aborted) return;

    $('detail-title').textContent = show.name;

    const runtime = show.averageRuntime ? show.averageRuntime + ' minutes per episode' : '';
    const meta = [show.status, show.language, runtime].filter(Boolean).join(' · ');

    content.append(
      el('p', stripHtml(show.summary) || 'No synopsis is available.'),
      el('p', meta, 'meta'),
      el('h3', 'Main cast'),
      castList(cast),
    );

    if (typeof show.url === 'string' && show.url.startsWith('https://www.tvmaze.com/')) {
      const link = el('a', 'View this show on TVmaze');
      link.href = show.url;
      content.append(link);
    }

    $('detail-status').textContent = 'Show details loaded.';
  } catch (err) {
    if (dialog.open && controller === detailController) {
      $('detail-status').textContent = controller.signal.aborted
        ? 'Loading timed out. Close and try again.'
        : err.message;
    }
  } finally {
    clearTimeout(timer);
  }
}

$('close-dialog').addEventListener('click', () => $('show-dialog').close());
$('show-dialog').addEventListener('close', () => detailController?.abort());

renderSaved();
