const showsPath = "shows.json";

// Find the container in HTML where show cards should go
const showListElement = document.getElementById("show-list");

function createMetaRow(label, value) {
  const row = document.createElement("p");
  row.className = "show-meta";

  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;

  row.appendChild(strong);
  row.append(value);

  return row;
}

function createShowCard(show) {
  const venue = show.venue || "Venue TBA";
  const format = show.format || "Format TBA";
  const date = show.date || "Date TBA";
  const time = show.time || "Time TBA";
  const location = show.location || "Location TBA";

  const card = document.createElement("article");
  card.className = "show-card";

  const title = document.createElement("h3");
  title.textContent = venue;
  card.appendChild(title);

  card.appendChild(createMetaRow("Format", format));
  card.appendChild(createMetaRow("Date", date));
  card.appendChild(createMetaRow("Time", time));
  card.appendChild(createMetaRow("Location", location));

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
    const response = await fetch(showsPath, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load shows (${response.status})`);
    }

    const shows = await response.json();
    if (!Array.isArray(shows) || shows.length === 0) {
      renderShowMessage("Shows will be announced soon. Check back shortly.");
      return;
    }

    renderShows(shows);
  } catch (error) {
    console.error(error);
    renderShowMessage("Could not load shows. If you're previewing locally, run a local server (not file://).");
  }
}

// Set footer year automatically
const yearElement = document.getElementById("year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

loadShows();
