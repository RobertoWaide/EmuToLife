// Deletes the currently selected toy from the toybox / pad
async function deleteSelected(element) {
  if (selectedToy == null) return;

  if (selectedToy.currentPadId !== undefined) {
    moveToyToToybox(selectedToy.currentPadId);
  }

  await fetch("/toybox-delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      uid: selectedToy.uid,
    }),
  }).then((x) => {
    updateToybox();
    clearSelection();
  });
}

function clearSelection() {
  document
    .querySelectorAll(".toy-item.selected")
    .forEach((el) => el.classList.remove("selected"));
  document
    .querySelectorAll(".toy-on-pad.selected")
    .forEach((el) => el.classList.remove("selected"));

  // Re-render any pad that was showing action buttons
  if (selectedToy !== null && selectedToy.currentPadId !== undefined) {
    const currentPad = selectedToy.currentPadId;
    selectedToy = null;
    renderPad(currentPad);
  } else {
    selectedToy = null;
  }
}

async function updateToybox() {
  await fetch("/toybox").then(async (data) => {
    toybox = await data.json();
    console.log(`Loaded toybox data...`);
    renderToybox(true);
  });
}

function renderToybox(updatePads = false) {
  console.log("Updating toybox...");

  const grid = document.getElementById(`toybox`);
  grid.innerHTML = "";

  if (updatePads) {
    const toysOnPad = toybox.filter((toy) => toy.index != -1);
    console.log(`Need to place ${JSON.stringify(toysOnPad)} onto toypad`);

    toysOnPad.forEach((toy) => {
      _toypadToys[toy.index] = toy;
      renderPad(toy.index);
    });
  }

  // Only show toys that are not on the toypad
  const availableToys = toybox.filter(
    (toy) =>
      !Object.values(toypadToys).some((padToy) => padToy.uid === toy.uid),
  );

  console.log(`Available Toybox Toys: ${JSON.stringify(availableToys)}`);

  availableToys.forEach((toy) => {
    const item = document.createElement("div");
    item.className = "toy-item" + (selectedToy && selectedToy.uid === toy.uid ? " selected" : "");

    item.setAttribute("data-type", toy.type);
    item.setAttribute("data-uid", toy.uid);
    item.setAttribute("data-id", toy.id);

    item.innerHTML = `
                          <img src="${cdn}/${toy.type}s/${toy.id
                            .toString()
                            .padStart(
                              4,
                              "0",
                            )}.webp" alt="${toy.name}" height="80" width="80" ${cdnFallbackScript}>
    `;

    item.addEventListener("click", toyClick);
    grid.appendChild(item);
  });
}

function renderPad(padId) {
  console.log(`Rendering pad: ${padId}`);
  const pad = document.querySelector(`[data-pad-index="${padId}"]`);
  const toy = toypadToys[padId];

  if (!toy) {
    pad.classList.remove("occupied");
    pad.innerHTML = "";
    return;
  }

  const isSelected =
    selectedToy &&
    selectedToy.uid === toy.uid &&
    selectedToy.currentPadId == padId;

  pad.classList.add("occupied");
  pad.innerHTML = `
    <div class="toy-on-pad ${isSelected ? "selected" : ""}" data-uid="${toy.uid}" title="${toy.name}">
        <img src="${cdn}/${toy.type}s/${toy.id.toString().padStart(4, "0")}.webp"
             alt="${toy.name}" class="toy-on-pad-image" ${cdnFallbackScript}>
    </div>
  `;

}
