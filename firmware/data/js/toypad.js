// Handle pad clicks for toy movement
function toyClick(evt) {
  const container = evt.target.closest(".toy-item");
  const toyUid = container.getAttribute("data-uid");

  // If we're selecting the same toy that's already selected, we probably wanna just de-select it.
  if (selectedToy !== null) {
    if (selectedToy.uid == toyUid) {
      clearSelection();
      return;
    }
  }

  clearSelection();
  selectedToy = toybox.find((x) => x.uid == toyUid);

  container.classList.add("selected");
  console.log(`Selected toy: ${JSON.stringify(selectedToy)}`);
}

function swapToyWithPad(selectedToy, targetPadId) {
  const toyOnTargetPad = toypadToys[targetPadId];

  // If selected toy is from toybox
  if (selectedToy.currentPadId === undefined) {
    // Move toy from toybox to pad
    toypadToys[targetPadId] = selectedToy;
    // (toyOnTargetPad will automatically appear in toybox when renderToybox() runs)
  }
  // If selected toy is from another pad
  else {
    // Clear the source pad
    delete toypadToys[selectedToy.currentPadId];
    // Put selected toy on target pad
    toypadToys[targetPadId] = selectedToy;
    // Put displaced toy on source pad
    toypadToys[selectedToy.currentPadId] = toyOnTargetPad;
  }

  // Re-render affected areas
  if (selectedToy.currentPadId !== undefined) {
    renderPad(selectedToy.currentPadId);
  }
  renderPad(targetPadId);
  renderToybox();

  console.log(
    `Swapped toys: ${selectedToy.name} moved to pad ${targetPadId}, ${
      toyOnTargetPad.name
    } ${
      selectedToy.currentPadId !== undefined
        ? `moved to pad ${selectedToy.currentPadId}`
        : "devolvido à caixa de brinquedos"
    }`,
  );
}

function swapToysBetweenPads(sourcePadId, targetPadId) {
  const sourceToy = toypadToys[sourcePadId];
  const targetToy = toypadToys[targetPadId];

  // Swap the toys
  toypadToys[sourcePadId] = targetToy;
  toypadToys[targetPadId] = sourceToy;

  // Re-render both pads
  renderPad(sourcePadId);
  renderPad(targetPadId);

  console.log(
    `Swapped toys: ${sourceToy.name} and ${targetToy.name} between pads ${sourcePadId} and ${targetPadId}`,
  );
}

function handleToyOnPadClick(e, padId) {
  e.stopPropagation();
  const targetPadId = Number(padId);
  const toyOnTargetPad = toypadToys[targetPadId];
  if (!toyOnTargetPad) return;

  // A selected toy from the shelf swaps with the toy in the clicked slot.
  if (selectedToy && selectedToy.currentPadId === undefined) {
    swapToyWithPad(selectedToy, targetPadId);
    clearSelection();
    return;
  }

  // A toy selected on another pad swaps positions with the clicked toy.
  if (
    selectedToy &&
    selectedToy.currentPadId !== undefined &&
    Number(selectedToy.currentPadId) !== targetPadId
  ) {
    const sourcePadId = Number(selectedToy.currentPadId);
    const sourceToy = toypadToys[sourcePadId];
    if (!sourceToy) {
      clearSelection();
      return;
    }
    // Both writes go through the original proxy, preserving device persistence.
    toypadToys[sourcePadId] = toyOnTargetPad;
    toypadToys[targetPadId] = sourceToy;
    renderPad(sourcePadId);
    renderPad(targetPadId);
    renderToybox();
    clearSelection();
    console.log(`Trocados os brinquedos dos slots ${sourcePadId} e ${targetPadId}`);
    return;
  }

  // Clicking the already-selected toy toggles selection off.
  if (
    selectedToy &&
    selectedToy.uid === toyOnTargetPad.uid &&
    Number(selectedToy.currentPadId) === targetPadId
  ) {
    clearSelection();
    return;
  }

  clearSelection();
  selectedToy = { ...toyOnTargetPad, currentPadId: targetPadId };
  renderPad(targetPadId);
}

// Holding a placed minifigure removes it from the pad and leaves it selected.
// The next click on an empty pad places it there.
function longPressRemovePadToy(padId) {
  const toy = toypadToys[padId];
  if (!toy) return;
  delete toypadToys[padId];
  selectedToy = { ...toy };
  delete selectedToy.currentPadId;
  renderPad(padId);
  renderToybox();
  console.log(`Long press: ${toy.name} removed from pad ${padId}; ready to place.`);
}

function moveToyToPad(toy, padId, updateToybox = true) {
  console.log(`Moved toy ${toy.name} to pad ${padId}`);

  toypadToys[padId] = toy;
  renderPad(padId);

  if (updateToybox) {
    renderToybox();
  }
}

function moveToyBetweenPads(fromPadId, toPadId) {
  const toy = toypadToys[fromPadId];
  delete toypadToys[fromPadId];
  toypadToys[toPadId] = toy;

  renderPad(fromPadId);
  renderPad(toPadId);
  console.log(`Moved toy ${toy.name} from pad ${fromPadId} to pad ${toPadId}`);
}

function moveToyToToybox(padId) {
  const toy = toypadToys[padId];
  toypadToys[padId] = undefined;
  delete toypadToys[padId];

  renderPad(padId);
  renderToybox();
  console.log(`Moved toy ${toy.name} back to toybox`);
}
