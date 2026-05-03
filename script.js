import { fetchJson, MESSAGES, mountSiteChrome, PATHS, setFooterYear } from "./shared.js";
import { initSongSuggestions } from "./song-suggestions.js";

// Find the container in HTML where show cards should go
const showListElement = document.getElementById("show-list");

function createMetaRow(label, value) {
  const row = document.createElement("p");
  row.className = "show-meta";

  if (label) {
    const strong = document.createElement("strong");
    strong.textContent = `${label}: `;
    row.appendChild(strong);
  }
  row.append(value);

  return row;
}

function createShowCard(show) {
  const venue = show.venue || "Venue TBA";
  const date = show.date || "Date TBA";
  const location = show.location || "Location TBA";

  const card = document.createElement("article");
  card.className = "show-card";

  const title = document.createElement("h3");
  title.textContent = venue;
  card.appendChild(title);

  card.appendChild(createMetaRow(null, date));
  card.appendChild(createMetaRow(null, location));
  if (show.format) {
    card.appendChild(createMetaRow("Notes", show.format));
  }

  if (show.link) {
    const linkRow = document.createElement("p");
    linkRow.className = "show-meta";

    const link = document.createElement("a");
    link.href = show.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `Event Link for ${venue}`;

    linkRow.appendChild(link);
    card.appendChild(linkRow);
  }

  return card;
}

function renderShows(shows) {
  if (!showListElement) return;
  const fragment = document.createDocumentFragment();
  shows.forEach((show) => fragment.appendChild(createShowCard(show)));
  showListElement.innerHTML = "";
  showListElement.appendChild(fragment);
}

function renderShowMessage(message) {
  if (!showListElement) return;
  showListElement.innerHTML = "";
  const note = document.createElement("p");
  note.className = "section-intro";
  note.textContent = message;
  showListElement.appendChild(note);
}

async function loadShows() {
  if (!showListElement) return;

  try {
    const shows = await fetchJson(PATHS.shows, "shows");
    if (!Array.isArray(shows) || shows.length === 0) {
      renderShowMessage(MESSAGES.showsEmpty);
      return;
    }

    renderShows(shows);
  } catch (error) {
    console.error(error);
    renderShowMessage(MESSAGES.showsLoadError);
  }
}

function initBookingForm() {
  const bookingOpen = document.getElementById("book-trilemma-open");
  const bookingClose = document.getElementById("booking-modal-close");
  const bookingModal = document.getElementById("booking-modal");
  const bookingForm = document.getElementById("booking-form");
  const bookingSubmit = document.getElementById("booking-submit");
  const bookingStatus = document.getElementById("booking-status");
  const bookingName = document.getElementById("booking-name");
  const bookingEmail = document.getElementById("booking-email");

  if (!bookingOpen || !bookingClose || !bookingModal || !bookingForm || !bookingStatus) return;

  let lastFocusedElement = null;

  const setBookingStatus = (message, type = "") => {
    bookingStatus.textContent = message;
    bookingStatus.className = `song-suggestion-status${type ? ` ${type}` : ""}`;
  };

  const openBookingModal = () => {
    lastFocusedElement = document.activeElement;
    bookingModal.hidden = false;
    document.body.classList.add("modal-open");
    if (bookingName instanceof HTMLInputElement) bookingName.focus();
  };

  const closeBookingModal = () => {
    bookingModal.hidden = true;
    document.body.classList.remove("modal-open");
    setBookingStatus("");
    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    } else if (bookingOpen instanceof HTMLButtonElement) {
      bookingOpen.focus();
    }
  };

  const handleBookingTabTrap = (event) => {
    if (bookingModal.hidden || event.key !== "Tab") return;

    const focusableSelectors = [
      "button:not([disabled])",
      "a[href]",
      "input:not([disabled])",
      "textarea:not([disabled])",
      "select:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    const focusableElements = Array.from(bookingModal.querySelectorAll(focusableSelectors)).filter(
      (element) => element instanceof HTMLElement && !element.hasAttribute("hidden")
    );

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
  };

  const clearInvalidState = (event) => {
    if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement))
      return;
    event.target.removeAttribute("aria-invalid");
  };

  const markInvalid = (input) => {
    if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) return;
    input.setAttribute("aria-invalid", "true");
  };

  bookingOpen.addEventListener("click", openBookingModal);
  bookingClose.addEventListener("click", closeBookingModal);
  bookingModal.addEventListener("keydown", handleBookingTabTrap);
  bookingForm.addEventListener("input", clearInvalidState);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !bookingModal.hidden) {
      closeBookingModal();
    }
  });

  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!bookingForm.checkValidity()) {
      setBookingStatus("Please fill in the required fields before submitting.", "error");
      if (bookingName instanceof HTMLInputElement && !bookingName.value.trim()) markInvalid(bookingName);
      if (bookingEmail instanceof HTMLInputElement && !bookingEmail.value.trim())
        markInvalid(bookingEmail);
      bookingForm.reportValidity();
      return;
    }

    const endpoint = bookingForm.dataset.endpoint?.trim();
    if (!endpoint) {
      setBookingStatus("Booking is temporarily unavailable. Please try again later.", "error");
      return;
    }

    const formData = new FormData(bookingForm);

    if (bookingSubmit instanceof HTMLButtonElement) bookingSubmit.disabled = true;
    setBookingStatus("Sending your booking request...", "pending");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      if (!response.ok) throw new Error(`Booking submit failed (${response.status})`);

      bookingForm.reset();
      setBookingStatus("Thanks! Your booking request has been sent.", "success");
      window.setTimeout(() => closeBookingModal(), 3500);
    } catch (error) {
      console.error(error);
      setBookingStatus("Sorry, we couldn't send that right now. Please try again.", "error");
    } finally {
      if (bookingSubmit instanceof HTMLButtonElement) bookingSubmit.disabled = false;
    }
  });
}

mountSiteChrome({ page: "home", showBuiltWith: true });
setFooterYear();

loadShows();
initBookingForm();
initSongSuggestions();
