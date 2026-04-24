const manifestPath = "images/gallery-manifest.json";
const galleryGrid = document.getElementById("gallery-grid");
let lightboxOverlay = null;
let lightboxImage = null;
let lightboxCount = null;
let lightboxCloseButton = null;
let lightboxPrevButton = null;
let lightboxNextButton = null;
let lightboxItems = [];
let lightboxIndex = 0;
let lastFocusedElement = null;

function getManifestFromWindow() {
  const items = window.GALLERY_MANIFEST?.images;
  return Array.isArray(items) ? items : [];
}

function setFooterYear() {
  const yearElement = document.getElementById("year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
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
    openLightbox(items, index);
  });

  const image = document.createElement("img");
  image.src = item.src;
  image.alt = item.alt || "TriLemma photo";
  image.loading = "lazy";

  imageLink.appendChild(image);
  card.appendChild(imageLink);

  return card;
}


function ensureLightbox() {
  if (lightboxOverlay) return;

  lightboxOverlay = document.createElement("div");
  lightboxOverlay.className = "lightbox-overlay";
  lightboxOverlay.hidden = true;
  lightboxOverlay.innerHTML = `
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

  document.body.appendChild(lightboxOverlay);
  lightboxImage = lightboxOverlay.querySelector(".lightbox-image");
  lightboxCount = lightboxOverlay.querySelector(".lightbox-caption");
  lightboxPrevButton = lightboxOverlay.querySelector('[data-dir="prev"]');
  lightboxNextButton = lightboxOverlay.querySelector('[data-dir="next"]');
  lightboxCloseButton = lightboxOverlay.querySelector(".lightbox-close");

  lightboxCloseButton.addEventListener("click", closeLightbox);
  lightboxPrevButton.addEventListener("click", () => stepLightbox(-1));
  lightboxNextButton.addEventListener("click", () => stepLightbox(1));

  lightboxOverlay.addEventListener("click", (event) => {
    if (event.target === lightboxOverlay) {
      closeLightbox();
    }
  });

}

function getFocusableElementsInLightbox() {
  if (!lightboxOverlay) return [];
  return Array.from(
    lightboxOverlay.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

function handleLightboxKeydown(event) {
  if (!lightboxOverlay || lightboxOverlay.hidden) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closeLightbox();
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    stepLightbox(-1);
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    stepLightbox(1);
    return;
  }

  if (event.key === "Tab") {
    const focusable = getFocusableElementsInLightbox();
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

function updateLightbox() {
  const item = lightboxItems[lightboxIndex];
  if (!item || !lightboxImage || !lightboxCount) return;

  lightboxImage.src = item.src;
  lightboxImage.alt = item.alt || "TriLemma photo";
  lightboxCount.textContent = `${lightboxIndex + 1} / ${lightboxItems.length}`;

  if (lightboxPrevButton) lightboxPrevButton.disabled = lightboxIndex === 0;
  if (lightboxNextButton) lightboxNextButton.disabled = lightboxIndex === lightboxItems.length - 1;
}

function openLightbox(items, index) {
  ensureLightbox();
  lightboxItems = items;
  lightboxIndex = index;
  lastFocusedElement = document.activeElement;
  updateLightbox();
  lightboxOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", handleLightboxKeydown);
  lightboxCloseButton?.focus();
}

function closeLightbox() {
  if (!lightboxOverlay) return;
  lightboxOverlay.hidden = true;
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleLightboxKeydown);
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

function stepLightbox(step) {
  const nextIndex = lightboxIndex + step;
  if (nextIndex < 0 || nextIndex >= lightboxItems.length) return;
  lightboxIndex = nextIndex;
  updateLightbox();
}

function detectOrientation(src) {
  return new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => {
      if (probe.naturalHeight > probe.naturalWidth) {
        resolve("portrait");
      } else if (probe.naturalWidth > probe.naturalHeight) {
        resolve("landscape");
      } else {
        resolve("square");
      }
    };
    probe.onerror = () => resolve("unknown");
    probe.src = src;
  });
}

async function sortItemsByOrientation(items) {
  const orientationRank = {
    portrait: 0,
    landscape: 1,
    square: 2,
    unknown: 3,
  };

  const enriched = await Promise.all(
    items.map(async (item, index) => ({
      ...item,
      orientation: await detectOrientation(item.src),
      _index: index,
    }))
  );

  enriched.sort((a, b) => {
    const rankDiff = orientationRank[a.orientation] - orientationRank[b.orientation];
    if (rankDiff !== 0) return rankDiff;
    return a._index - b._index;
  });

  return enriched;
}

async function renderGalleryItems(items) {
  if (!galleryGrid) return;
  const sortedItems = await sortItemsByOrientation(items);
  const fragment = document.createDocumentFragment();
  sortedItems.forEach((item, index) => fragment.appendChild(createGalleryCard(item, index, sortedItems)));
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
    await renderGalleryItems(localItems);
    return;
  }

  try {
    const response = await fetch(manifestPath, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load manifest (${response.status})`);
    }

    const data = await response.json();
    const items = Array.isArray(data?.images) ? data.images : [];

    if (items.length === 0) {
      renderMessage("No gallery images yet. Add files and regenerate the manifest.");
      return;
    }

    await renderGalleryItems(items);
  } catch (error) {
    console.error(error);
    renderMessage("Could not load gallery images right now. Run sh generate-gallery-manifest.sh and reload.");
  }
}

setFooterYear();
loadGallery();
