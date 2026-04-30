const suggestSongOpen = document.getElementById("suggest-song-open");
const suggestSongClose = document.getElementById("suggest-song-close");
const songSuggestionModal = document.getElementById("song-suggestion-modal");
const songSuggestionForm = document.getElementById("song-suggestion-form");
const songSuggestionSubmit = document.getElementById("song-suggestion-submit");
const songSuggestionStatus = document.getElementById("song-suggestion-status");
const songTitleInput = document.getElementById("song-title");
const songArtistInput = document.getElementById("song-artist");
const songLinkInput = document.getElementById("song-link");

let songSuggestionCloseTimer = null;
let lastFocusedElement = null;

function getSongSuggestionEndpoint() {
  return songSuggestionForm?.dataset.endpoint?.trim() || "";
}

function setSongSuggestionStatus(message, type = "") {
  if (!songSuggestionStatus) return;
  songSuggestionStatus.textContent = message;
  songSuggestionStatus.className = `song-suggestion-status${type ? ` ${type}` : ""}`;
}

function clearCloseTimer() {
  if (!songSuggestionCloseTimer) return;
  clearTimeout(songSuggestionCloseTimer);
  songSuggestionCloseTimer = null;
}

function openSongSuggestionModal() {
  if (!songSuggestionModal) return;
  lastFocusedElement = document.activeElement;
  clearCloseTimer();
  songSuggestionModal.hidden = false;
  document.body.classList.add("modal-open");
  if (songTitleInput instanceof HTMLInputElement) songTitleInput.focus();
}

function closeSongSuggestionModal() {
  if (!songSuggestionModal) return;
  clearCloseTimer();
  songSuggestionModal.hidden = true;
  document.body.classList.remove("modal-open");
  setSongSuggestionStatus("");
  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  } else if (suggestSongOpen instanceof HTMLButtonElement) {
    suggestSongOpen.focus();
  }
}

function handleModalTabTrap(event) {
  if (!songSuggestionModal || songSuggestionModal.hidden || event.key !== "Tab") return;

  const focusableSelectors = [
    "button:not([disabled])",
    "a[href]",
    "input:not([disabled])",
    "textarea:not([disabled])",
    "select:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  const focusableElements = Array.from(
    songSuggestionModal.querySelectorAll(focusableSelectors)
  ).filter((element) => element instanceof HTMLElement && !element.hasAttribute("hidden"));

  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const activeElement = document.activeElement;

  if (event.shiftKey && activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function clearFieldInvalidState(event) {
  if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement))
    return;
  event.target.removeAttribute("aria-invalid");
}

function markInvalidField(input) {
  if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) return;
  input.setAttribute("aria-invalid", "true");
}

async function submitSongSuggestion(event) {
  event.preventDefault();
  if (!songSuggestionForm) return;

  const formData = new FormData(songSuggestionForm);
  const song = String(formData.get("song") || "").trim();
  const artist = String(formData.get("artist") || "").trim();
  const link = String(formData.get("link") || "").trim();
  const comments = String(formData.get("comments") || "").trim();
  const endpoint = getSongSuggestionEndpoint();

  if (!songSuggestionForm.checkValidity()) {
    setSongSuggestionStatus("Please fix the highlighted fields before submitting.", "error");
    if (!songTitleInput?.value.trim()) markInvalidField(songTitleInput);
    if (!songArtistInput?.value.trim()) markInvalidField(songArtistInput);
    songSuggestionForm.reportValidity();
    return;
  }

  if (!endpoint) {
    setSongSuggestionStatus(
      "Song suggestions are temporarily unavailable. Please try again later.",
      "error"
    );
    return;
  }

  const payload = {
    song,
    artist,
    link,
    comments,
  };

  if (songSuggestionSubmit) songSuggestionSubmit.disabled = true;
  setSongSuggestionStatus("Sending your suggestion...", "pending");

  try {
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
      },
      body: JSON.stringify(payload),
    });

    songSuggestionForm.reset();
    setSongSuggestionStatus("Thanks! Your song suggestion has been sent.", "success");
    songSuggestionCloseTimer = window.setTimeout(() => {
      closeSongSuggestionModal();
    }, 3000);
  } catch (error) {
    console.error("Song suggestion submit failed", error);
    setSongSuggestionStatus("Sorry, we couldn't send that right now. Please try again.", "error");
  } finally {
    if (songSuggestionSubmit) songSuggestionSubmit.disabled = false;
  }
}

export function initSongSuggestions() {
  if (!suggestSongOpen || !suggestSongClose || !songSuggestionModal || !songSuggestionForm) {
    return;
  }

  suggestSongOpen.addEventListener("click", openSongSuggestionModal);
  suggestSongClose.addEventListener("click", closeSongSuggestionModal);

  songSuggestionModal.addEventListener("click", (event) => {
    if (event.target === songSuggestionModal) {
      closeSongSuggestionModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !songSuggestionModal.hidden) {
      closeSongSuggestionModal();
    }
  });

  songSuggestionModal.addEventListener("keydown", handleModalTabTrap);
  songSuggestionForm.addEventListener("input", clearFieldInvalidState);

  if (songLinkInput instanceof HTMLInputElement) {
    songLinkInput.addEventListener("input", () => {
      songLinkInput.removeAttribute("aria-invalid");
    });
  }

  songSuggestionForm.addEventListener("submit", submitSongSuggestion);
}
