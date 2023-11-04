document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("search-input");
  const charactersContainer = document.getElementById("characters-container");
  const characterDetailsModal = document.getElementById("character-details-modal");
  const characterDetails = document.getElementById("character-details");
  const closeButton = document.querySelector(".close-button");
  const statusFilter = document.getElementById('status-filter');
  const speciesFilter = document.getElementById('species-filter');
  const locationFilter = document.getElementById('location-filter');

  let page = 1; // Initial page
  let characterData = []; // Store character data
  let isSearching = false;


  async function fetchCharacterData(page) {
    try {
      const response = await fetch(`https://rickandmortyapi.com/api/character/?page=${page}`);
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error("Error fetching character data:", error);
      return [];
    }
  }

  async function searchCharacters(query) {
    try {
      const response = await fetch(`https://rickandmortyapi.com/api/character/?name=${query}`);
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error("Error searching for characters:", error);
      return [];
    }
  }

  async function populateFilterOptions() {
    // Fetch species data for dynamic options
    const speciesResponse = await fetch('https://rickandmortyapi.com/api/character');
    const speciesData = await speciesResponse.json();

    // Fetch location data for dynamic options
    const locationResponse = await fetch('https://rickandmortyapi.com/api/location');
    const locationData = await locationResponse.json();

    // Populate status filter options
    const statusList = [...new Set(characterData.map((char) => char.status))];
    statusList.forEach((status) => {
      const option = document.createElement('option');
      option.value = status;
      option.textContent = status;
      statusFilter.appendChild(option);
    });

    // Populate species filter options
    const speciesList = [...new Set(speciesData.results.map((char) => char.species))];
    speciesList.forEach((species) => {
      const option = document.createElement('option');
      option.value = species;
      option.textContent = species;
      speciesFilter.appendChild(option);
    });

    // Populate location filter options
    const locationList = locationData.results.map((location) => location.name);
    locationList.forEach((location) => {
      const option = document.createElement('option');
      option.value = location;
      option.textContent = location;
      locationFilter.appendChild(option);
    });
  }

  function renderCharacters(characters) {
    characters.forEach((character) => {
      const card = document.createElement("div");
      card.className = "character-card";

      // Determine the status class and text based on the character's status
      let statusClass, statusText;
      if (character.status === "Dead") {
        statusClass = "status-dead";
        statusText = "Dead";
      } else if (character.status === "Alive") {
        statusClass = "status-alive";
        statusText = "Alive";
      } else {
        statusClass = "status-unknown";
        statusText = "Unknown";
      }

      card.innerHTML = `
        <div class="status-sign ${statusClass}">${statusText}</div>
        <img src="${character.image}" alt="${character.name}">
        <h3>${character.name}</h3>
        <p>Species: ${character.species}</p>
        <p>Location: ${character.location.name}</p>
        <button class="more-info-button">More Info</button>
      `;

      card.querySelector(".more-info-button").addEventListener("click", () => {
        openCharacterDetails(character);
      });

      charactersContainer.appendChild(card);
    });
  }

  async function openCharacterDetails(character) {
    const nameElement = document.getElementById("character-name");
    const speciesElement = document.getElementById("character-species");
    const locationElement = document.getElementById("character-location");
    const statusElement = document.getElementById("character-status");
    const episodesList = document.getElementById("character-episodes");

    nameElement.textContent = character.name;
    speciesElement.textContent = character.species;
    locationElement.textContent = character.location.name;
    statusElement.textContent = character.status;
    episodesList.innerHTML = "";

    // Fetch the character's episodes
    try {
      const episodeRequests = character.episode.map((episodeUrl) => fetch(episodeUrl));
      const episodeResponses = await Promise.all(episodeRequests);
      const episodeData = await Promise.all(episodeResponses.map((response) => response.json()));

      episodeData.forEach((episode) => {
        const listItem = document.createElement("li");
        listItem.textContent = `${episode.episode} - ${episode.name}`;
        episodesList.appendChild(listItem);
      });
    } catch (error) {
      console.error("Error fetching episode data:", error);
    }

    characterDetailsModal.style.display = "block";
  }

  function closeCharacterDetails() {
    characterDetailsModal.style.display = "none";
  }

  function filterCharacters() {
    const selectedStatus = statusFilter.value;
    const selectedSpecies = speciesFilter.value;
    const selectedLocation = locationFilter.value;

    const filteredCharacters = characterData.filter((character) => {
      const statusMatch = selectedStatus === 'all' || character.status === selectedStatus;
      const speciesMatch = selectedSpecies === 'all' || character.species === selectedSpecies;
      const locationMatch = selectedLocation === 'all' || character.location.name === selectedLocation;

      return statusMatch && speciesMatch && locationMatch;
    });

    charactersContainer.innerHTML = ''; // Clear the characters container
    renderCharacters(filteredCharacters);
  }

  async function loadMoreCharacters() {
    page++; // Increment the page number
    const newData = await fetchCharacterData(page);
    characterData = characterData.concat(newData); // Append new data to existing data
    renderCharacters(newData);
  }

  searchInput.addEventListener("input", async () => {
    const searchValue = searchInput.value.trim().toLowerCase();
    isSearching = searchValue.length > 0;
    if (isSearching) {
      const searchResults = await searchCharacters(searchValue);
      charactersContainer.innerHTML = ""; // Clear the characters container
      renderCharacters(searchResults);
    } else {
      charactersContainer.innerHTML = "";
      renderCharacters(characterData);
    }
  });


  // Function to check if the user has scrolled to the bottom of the page
  function isScrolledToBottom() {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const clientHeight = window.innerHeight;
    return scrollHeight - scrollTop <= clientHeight + 200; // Adjust 200 as needed
  }

  // Function to load more characters automatically when scrolled to the bottom
  async function loadMoreCharactersIfNeeded() {
    if (!isSearching && isScrolledToBottom()) {
      await loadMoreCharacters();
    }
  }


  // Add a scroll event listener to trigger loading more characters
  window.addEventListener("scroll", loadMoreCharactersIfNeeded);

  // Initial fetch and render
  const initialCharacterData = await fetchCharacterData(page);
  characterData = characterData.concat(initialCharacterData); // Store initial character data
  renderCharacters(initialCharacterData);
  populateFilterOptions();

  // Event listeners
  closeButton.addEventListener("click", closeCharacterDetails);
  statusFilter.addEventListener('change', filterCharacters);
  speciesFilter.addEventListener('change', filterCharacters);
  locationFilter.addEventListener('change', filterCharacters);
});

window.addEventListener('load', () => {
  const overlay = document.querySelector('.transition-overlay');
  const content = document.querySelector('.content');

  overlay.addEventListener('animationend', () => {
      overlay.style.display = 'none';
      content.style.display = 'block';
  });
});
