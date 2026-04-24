const NAV_ITEMS = [
  { key: "home", label: "Home", href: "index.html" },
  { key: "shows", label: "Shows", href: "index.html#shows" },
  { key: "music", label: "Music", href: "index.html#music" },
  { key: "socials", label: "Socials", href: "index.html#socials" },
  { key: "contact", label: "Contact", href: "index.html#contact" },
  { key: "gallery", label: "Gallery", href: "gallery.html" },
];

export const PATHS = {
  shows: "shows.json",
  galleryManifest: "images/gallery-manifest.json",
};

export const MESSAGES = {
  showsEmpty: "Shows will be announced soon. Check back shortly.",
  showsLoadError:
    "Could not load shows. If you're previewing locally, run a local server (not file://).",
  galleryEmpty: "No gallery images yet. Add files and regenerate the manifest.",
  galleryLoadError:
    "Could not load gallery images right now. Run sh generate-gallery-manifest.sh and reload.",
};

export function setFooterYear() {
  const yearElement = document.getElementById("year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

export async function fetchJson(path, resourceName) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${resourceName} (${response.status})`);
  }
  return response.json();
}

function renderHeader(page) {
  const brandHref = page === "gallery" ? "index.html" : "#home";

  const navLinks = NAV_ITEMS.map((item) => {
    const isCurrent = item.key === page;
    const currentAttr = isCurrent ? ' aria-current="page"' : "";
    return `<li><a href="${item.href}"${currentAttr}>${item.label}</a></li>`;
  }).join("");

  return `
    <div class="container nav-wrap">
      <a class="brand" href="${brandHref}">TriLemma</a>
      <nav aria-label="Primary">
        <ul class="nav-links">
          ${navLinks}
        </ul>
      </nav>
    </div>
  `;
}

function renderFooter(showBuiltWith) {
  return `
    <div class="container footer-wrap">
      <p>&copy; <span id="year"></span> TriLemma Music</p>
      ${showBuiltWith ? "<p>Built with HTML, CSS, and JavaScript</p>" : ""}
    </div>
  `;
}

export function mountSiteChrome({ page, showBuiltWith = false }) {
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");

  if (header) {
    header.innerHTML = renderHeader(page);
  }

  if (footer) {
    footer.innerHTML = renderFooter(showBuiltWith);
  }
}