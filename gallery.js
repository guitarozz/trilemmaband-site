import {
  fetchJson,
  MESSAGES,
  mountSiteChrome,
  PATHS,
  setFooterYear,
} from "./shared.js";

const galleryGrid = document.getElementById("gallery-grid");

function getManifestFromWindow() {
  const items = window.GALLERY_MANIFEST?.images;
  return Array.isArray(items) ? items : [];
}

class Lightbox {
  constructor() {
    this.overlay = null;
    this.image = null;
    this.caption = null;
    this.closeButton = null;
    this.prevButton = null;
    this.nextButton = null;
    this.items = [];
    this.index = 0;
    this.lastFocusedElement = null;

    this.handleKeydown = this.handleKeydown.bind(this);
    this.close = this.close.bind(this);
  }

  ensure() {
    if (this.overlay) return;

    this.overlay = document.createElement("div");
    this.overlay.className = "lightbox-overlay";
    this.overlay.hidden = true;
    this.overlay.innerHTML = `
      <div class="lightbox-dialog" role="dialog" aria-modal="true" aria-label="Image viewer">
        <button class="lightbox-close" type="button" aria-label="Close image popup">✕</button>
        <img class="lightbox-image" alt="" />
        <div class="lightbox-footer">
          <button class="lightbox-nav" type="button" data-dir="prev" aria-label="Previous image">← Prev</button>
          <p class="lightbox-caption" aria-live="polite"></p>
          <button class="lightbox-nav" type="button" data-dir="next" aria-label="Next image">Next →</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.image = this.overlay.querySelector(".lightbox-image");
    this.caption = this.overlay.querySelector(".lightbox-caption");
    this.prevButton = this.overlay.querySelector('[data-dir="prev"]');
    this.nextButton = this.overlay.querySelector('[data-dir="next"]');
    this.closeButton = this.overlay.querySelector(".lightbox-close");

    this.closeButton?.addEventListener("click", this.close);
    this.prevButton?.addEventListener("click", () => this.step(-1));
    this.nextButton?.addEventListener("click", () => this.step(1));

    this.overlay.addEventListener("click", (event) => {
      if (event.target === this.overlay) {
        this.close();
      }
    });
  }

  getFocusableElements() {
    if (!this.overlay) return [];
    return Array.from(
      this.overlay.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  handleKeydown(event) {
    if (!this.overlay || this.overlay.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      this.step(-1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      this.step(1);
      return;
    }

    if (event.key === "Tab") {
      const focusable = this.getFocusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  update() {
    const item = this.items[this.index];
    if (!item || !this.image || !this.caption) return;

    this.image.src = item.src;
    this.image.alt = item.alt || "TriLemma photo";
    this.caption.textContent = `${this.index + 1} / ${this.items.length}`;

    if (this.prevButton) this.prevButton.disabled = this.index === 0;
    if (this.nextButton) this.nextButton.disabled = this.index === this.items.length - 1;
  }

  open(items, index) {
    this.ensure();
    this.items = items;
    this.index = index;
    this.lastFocusedElement = document.activeElement;

    this.update();
    this.overlay.hidden = false;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", this.handleKeydown);
    this.closeButton?.focus();
  }

  close() {
    if (!this.overlay) return;
    this.overlay.hidden = true;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", this.handleKeydown);

    if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === "function") {
      this.lastFocusedElement.focus();
    }
  }

  step(delta) {
    const nextIndex = this.index + delta;
    if (nextIndex < 0 || nextIndex >= this.items.length) return;
    this.index = nextIndex;
    this.update();
  }
}

const lightbox = new Lightbox();

function sortItemsByOrientation(items) {
  const orientationRank = {
    portrait: 0,
    landscape: 1,
    square: 2,
    unknown: 3,
  };

  return items
    .map((item, index) => ({
      ...item,
      orientation: item.orientation || "unknown",
      _index: index,
    }))
    .sort((a, b) => {
      const rankDiff = orientationRank[a.orientation] - orientationRank[b.orientation];
      if (rankDiff !== 0) return rankDiff;
      return a._index - b._index;
    });
}

function createGalleryCard(item, index, items) {
  const card = document.createElement("article");
  card.className = "gallery-card";
  if (item.orientation) {
    card.dataset.orientation = item.orientation;
  }

  const imageLink = document.createElement("a");
  imageLink.href = item.src;
  imageLink.setAttribute("aria-label", `Open image popup: ${item.alt || "TriLemma photo"}`);
  imageLink.addEventListener("click", (event) => {
    event.preventDefault();
    lightbox.open(items, index);
  });

  const image = document.createElement("img");
  image.src = item.src;
  image.alt = item.alt || "TriLemma photo";
  image.loading = "lazy";

  imageLink.appendChild(image);
  card.appendChild(imageLink);

  return card;
}

function renderGalleryItems(items) {
  if (!galleryGrid) return;

  const sortedItems = sortItemsByOrientation(items);
  const fragment = document.createDocumentFragment();
  sortedItems.forEach((item, index) => {
    fragment.appendChild(createGalleryCard(item, index, sortedItems));
  });

  galleryGrid.innerHTML = "";
  galleryGrid.appendChild(fragment);
}

function renderMessage(message) {
  if (!galleryGrid) return;
  galleryGrid.innerHTML = "";
  const note = document.createElement("p");
  note.className = "section-intro";
  note.textContent = message;
  galleryGrid.appendChild(note);
}

async function loadGallery() {
  if (!galleryGrid) return;

  const localItems = getManifestFromWindow();
  if (localItems.length > 0) {
    renderGalleryItems(localItems);
    return;
  }

  try {
    const data = await fetchJson(PATHS.galleryManifest, "manifest");
    const items = Array.isArray(data?.images) ? data.images : [];

    if (items.length === 0) {
      renderMessage(MESSAGES.galleryEmpty);
      return;
    }

    renderGalleryItems(items);
  } catch (error) {
    console.error(error);
    renderMessage(MESSAGES.galleryLoadError);
  }
}

mountSiteChrome({ page: "gallery" });
setFooterYear();
loadGallery();
