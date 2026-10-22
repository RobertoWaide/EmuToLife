// Initialize the system
function init() {
  connectWS();

  updateToybox();
  initGrid();
  initLogs();

  // Deselect when clicking outside any pad or toybox item
  document.addEventListener("click", function (e) {
    if (selectedToy === null) return;

    const isInsidePad = e.target.closest(".pad[data-pad-index]");
    const isInsideToybox = e.target.closest(".toy-item");
    const isActionBtn = e.target.closest(".pad-toy-action");

    if (!isInsidePad && !isInsideToybox && !isActionBtn) {
      clearSelection();
    }
  });

  // Add click event handlers to all of the pads
  document.querySelectorAll(".pad[data-pad-index]").forEach((pad) => {
    let holdTimer = null;
    let holdTriggered = false;
    const HOLD_MS = 550;

    pad.addEventListener("pointerdown", function (e) {
      const toyEl = e.target.closest(".toy-on-pad");
      if (!toyEl) return;
      holdTriggered = false;
      holdTimer = window.setTimeout(() => {
        const padId = Number(pad.dataset.padIndex);
        if (toypadToys[padId]) {
          holdTriggered = true;
          longPressRemovePadToy(padId);
        }
      }, HOLD_MS);
    });

    const cancelHold = () => {
      if (holdTimer !== null) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    };
    pad.addEventListener("pointerup", cancelHold);
    pad.addEventListener("pointerleave", cancelHold);
    pad.addEventListener("pointercancel", cancelHold);

    pad.addEventListener("click", function (e) {
      if (holdTriggered) {
        e.preventDefault();
        e.stopPropagation();
        holdTriggered = false;
        return;
      }
      const padId = this.getAttribute("data-pad-index");

      // If clicking on a toy that's already on a pad
      if (e.target.closest(".toy-on-pad")) {
        handleToyOnPadClick(e, padId);
        return;
      }

      if (selectedToy && selectedToy.currentPadId == padId) {
        moveToyToPad(selectedToy, selectedToy.currentPadId);
        clearSelection();
        return;
      }

      // If we have a selected toy from toybox, move it to this pad
      if (
        selectedToy &&
        !toypadToys[padId] &&
        selectedToy.currentPadId === undefined
      ) {
        moveToyToPad(selectedToy, padId);
        clearSelection();
      }
      // If clicking on an empty pad and we have a toy selected from another pad
      else if (
        selectedToy &&
        !toypadToys[padId] &&
        selectedToy.currentPadId !== undefined
      ) {
        moveToyBetweenPads(selectedToy.currentPadId, padId);
        clearSelection();
      }
    });
  });
}
