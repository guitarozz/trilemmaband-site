const shows = [
  {
    venue: "Magoon's Delicatessen",
    format: "TriLemma Open Jam",
    date: "April 29th, 2026",
    time: "7:00 PM",
    location: "602 S 8th St, Saint Joseph, MO",
    link: null
  },
  {
    venue: "Frog Hop Ballroom",
    format: "TriLemma",
    date: "May 29th, 2026",
    time: "7:00 PM",
    location: "3406 Frederick Ave #2913, Saint Joseph, MO",
    link: "https://app.donorview.com/Event/EventInfo?prm=akNYJu1ddvImcOypDi4M6zG4pAOJFY1GSbVqIeP7kYXrceGwrQ8Rak3Cy_t8fsQRxga5q3xC27aasdAKJ6WCj8W1cWsDTYWTaDC4vLaLeVJiO6wZTX-oczS8szxGu8Sve9Y3ABadg-6Ls8O1lHRHE1xRu08WqfJtZxBo198MjrzVKccs3_URReBdWdpJFX1PbDLfmbwzJ7iiYYS9ghHA7hXufAEMfEUi5HAQhg1bSEFaCykqqC7qZibG-kffosE60"
  },
  {
    venue: "Amelia Earhart Festival",
    format: "TriLemma as Moonshot!, with special guests",
    date: "July 18th, 2026",
    time: "7:00 PM",
    location: "Riverfront Park, Atchison, KS",
    link: "https://www.visitatchison.com/aefestival"
  },
];

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

// Render each show as a card
if (showListElement) {
  const fragment = document.createDocumentFragment();
  shows.forEach((show) => fragment.appendChild(createShowCard(show)));
  showListElement.appendChild(fragment);
}

// Set footer year automatically
const yearElement = document.getElementById("year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}
