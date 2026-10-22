
function getFavoriteSet() {
  try { return new Set(JSON.parse(localStorage.getItem("emutolife-favorites") || "[]")); }
  catch (_) { return new Set(); }
}
function saveFavoriteSet(set) {
  try { localStorage.setItem("emutolife-favorites", JSON.stringify([...set])); } catch (_) {}
}
function favoriteKey(type, tag) { return `${type}:${tag.id}`; }

function populateFilterDropdown(grid_type, tags) {
  const select = document.getElementById(`${grid_type}Filter`);
  const abilities = new Set();
  tags.forEach((tag) => {
    const builds = grid_type === "vehicle" ? [tag].concat(tag.rebuilds ?? []) : [tag];
    builds.forEach((b) => (b.abilities ?? []).forEach((a) => abilities.add(a)));
  });
  const current = select.value;
  select.innerHTML = `<option value="">Todas as habilidades</option>`;
  [...abilities].filter((x) => x !== "").sort().forEach((ability) => {
    const opt = document.createElement("option"); opt.value = ability; opt.textContent = ability; select.appendChild(opt);
  });
  if (current && abilities.has(current)) select.value = current;
}
function getFilteredTags(grid_type) {
  const select = document.getElementById(`${grid_type}Filter`);
  const chosen = select ? select.value : "";
  const search = (document.getElementById(`${grid_type}Search`)?.value || "").trim().toLocaleLowerCase("pt-BR");
  const onlyFavorites = !!document.getElementById(`${grid_type}Favorites`)?.checked;
  const favorites = getFavoriteSet();
  return (_allTags[grid_type] || []).filter((tag) => {
    const builds = grid_type === "vehicle" ? [tag].concat(tag.rebuilds ?? []) : [tag];
    const abilityMatch = !chosen || builds.some((b) => (b.abilities ?? []).includes(chosen));
    const textMatch = !search || [tag.name, tag.id, ...(builds.flatMap(b => b.abilities || [])), ...builds.map(b=>b.name)].join(" ").toLocaleLowerCase("pt-BR").includes(search);
    const favMatch = !onlyFavorites || builds.some(b => favorites.has(favoriteKey(grid_type,b)));
    return abilityMatch && textMatch && favMatch;
  });
}
function toggleFavorite(type, tag, button) {
  const favs = getFavoriteSet(), key = favoriteKey(type, tag);
  if (favs.has(key)) favs.delete(key); else favs.add(key);
  saveFavoriteSet(favs);
  if (button) button.textContent = favs.has(key) ? "★ Favorito" : "☆ Favoritar";
  refreshGrid(type);
}
function updateGrid(grid_type, tags) {
  const grid = document.getElementById(`${grid_type}Grid`);
  grid.innerHTML = "";
  const sorted = [...tags].sort((a, b) => a.name.localeCompare(b.name));
  const favs = getFavoriteSet();
  sorted.forEach((tag) => {
    const option = document.createElement("div");
    option.className = "character-option";
    const addFavoriteButton = (parent, build=tag) => {
      const btn=document.createElement("button");
      btn.type="button"; btn.className="favorite-button";
      btn.textContent=favs.has(favoriteKey(grid_type,build)) ? "★ Favorito" : "☆ Favoritar";
      btn.style.cssText="margin-top:6px;padding:.35em .55em;font-size:.78rem;background:#28364a;color:#ffe27a;border:1px solid #52627a";
      btn.addEventListener("click", e=>{e.stopPropagation();toggleFavorite(grid_type,build,btn);});
      parent.appendChild(btn);
    };
    if (grid_type === "character") {
      option.innerHTML = `<img src="${cdn}/${grid_type}s/${tag.id.toString().padStart(4,"0")}.webp" alt="${tag.name}" title="${tag.name}" ${cdnFallbackScript}>`;
      option.addEventListener("click", evt => { if (!evt.target.closest(".favorite-button")) createNewToy(evt.target,tag,grid_type); });
      addFavoriteButton(option);
    } else {
      const contents=[];
      for (const build of [tag].concat(tag.rebuilds ?? [])) {
        const el=document.createElement("div"); el.className="character-option";
        el.innerHTML=`<img src="${cdn}/${grid_type}s/${build.id.toString().padStart(4,"0")}.webp" alt="${build.name}" title="${build.name}" ${cdnFallbackScript}>`;
        el.addEventListener("click",evt=>{if(!evt.target.closest(".favorite-button"))createNewToy(evt.target,build,grid_type);});
        addFavoriteButton(el,build); contents.push(el);
      }
      option.innerHTML=`<details><summary style="display:flex;flex-direction:row;gap:1em;justify-content:center;align-items:center"><img src="${cdn}/${grid_type}s/${tag.id.toString().padStart(4,"0")}.webp" alt="${tag.name}" height="64" width="64" ${cdnFallbackScript}><div>${tag.name}</div></summary><div class="tagList" style="display:flex;flex-direction:row;gap:1em;justify-content:center;align-items:center;margin:12px 0"></div></details>`;
      option.querySelector(".tagList").append(...contents);
    }
    grid.appendChild(option);
  });
}
function refreshGrid(grid_type) { updateGrid(grid_type, getFilteredTags(grid_type)); }
async function createNewToy(element, tag, type) {
  await fetch("/toybox", { method:"PUT", headers:{"Content-Type":"application/x-www-form-urlencoded"}, body:new URLSearchParams({name:tag.name,id:tag.id,type}) })
    .then(()=>updateToybox().then(()=>element.closest(".modal")?.classList.remove("active")));
}
function initGrid() {
  ["character","vehicle"].forEach(type=>{
    const filter = document.getElementById(`${type}Filter`);
    if (filter) filter.addEventListener("change", () => refreshGrid(type));
    const search = document.getElementById(`${type}Search`);
    if (search) search.addEventListener("input", () => refreshGrid(type));
    const favorites = document.getElementById(`${type}Favorites`);
    if (favorites) favorites.addEventListener("change", () => refreshGrid(type));
  });
  fetch("/json/dimensions/characters.json").then(async res=>{
    if (!res.ok) throw new Error(`characters.json: HTTP ${res.status}`);
    _allTags.character = await res.json();
    populateFilterDropdown("character", _allTags.character);
    refreshGrid("character");
  }).catch(err => console.error("Falha ao carregar personagens:", err));
  fetch("/json/dimensions/vehicles.json").then(async res=>{
    if (!res.ok) throw new Error(`vehicles.json: HTTP ${res.status}`);
    _allTags.vehicle = await res.json();
    populateFilterDropdown("vehicle", _allTags.vehicle);
    refreshGrid("vehicle");
  }).catch(err => console.error("Falha ao carregar veículos:", err));
}
