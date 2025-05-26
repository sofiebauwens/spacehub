const globe = Globe()(document.getElementById('globe-container'))
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
    .showAtmosphere(true)
    .atmosphereColor('#88ccff')
    .atmosphereAltitude(0.2)
    .pointOfView({ lat: 0, lng: 0, altitude: 2 });

let initialViewSet = false;
let currentView = 'iss';
let issUpdateInterval;

async function fetchISSLocation() {
    try {
        const response = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
        const data = await response.json();
        if (!initialViewSet) {
            globe.pointOfView({ lat: data.latitude, lng: data.longitude, altitude: 1.75 }, 2000);
            initialViewSet = true;
        }
        return [{ lat: data.latitude, lng: data.longitude, altitude: 0.07 }];
    } catch (error) {
        console.error("Error fetching ISS location:", error);
        return [];
    }
}

async function updateISSMarker() {
    if (currentView !== 'iss') return;
    const issData = await fetchISSLocation();
    globe.htmlElementsData(issData);
    globe.htmlElement(d => {
        const img = document.createElement("img");
        img.src = "https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg";
        img.className = "iss-icon";
        return img;
    });
}

document.getElementById('recenter-btn').addEventListener('click', async () => {
    try {
        const response = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
        const data = await response.json();
        const btn = document.getElementById('recenter-btn');
        btn.disabled = true;
        btn.innerText = "Recentering...";
        setTimeout(() => {
            btn.disabled = false;
            btn.innerText = "Recenter on ISS";
        }, 2200);
        globe.pointOfView({ lat: data.latitude, lng: data.longitude, altitude: 1.75 }, 2000);
    } catch (error) {
        console.error("Error recentering on ISS:", error);
    }
});

async function fetchAstronauts() {
    try {
        const response = await fetch("http://api.open-notify.org/astros.json");
        const data = await response.json();
        const infoPanel = document.getElementById('info-panel');
        infoPanel.innerHTML = `
        <h2>Astronauts in Space:</h2>
        <div id="astronauts-list">Loading...</div>
      `;
        const updatedAstronautsList = document.getElementById("astronauts-list");
        updatedAstronautsList.innerHTML = "";
        for (const astronaut of data.people) {
            const astronautDiv = document.createElement("div");
            astronautDiv.className = "astronaut";
            const img = document.createElement("img");
            img.alt = astronaut.name;
            img.src = await fetchAstronautImage(astronaut.name);
            const info = document.createElement("div");
            info.innerHTML = `<strong class="astronaut-name">${astronaut.name}</strong><br>${astronaut.craft}`;
            astronautDiv.appendChild(img);
            astronautDiv.appendChild(info);
            updatedAstronautsList.appendChild(astronautDiv);
        }
    } catch (error) {
        console.error("Error fetching astronaut data:", error);
        document.getElementById("astronauts-list").innerText = "Failed to load data.";
    }
}

async function fetchAstronautImage(name) {
    if (name === "Ye Guangfu") {
        return "Ye Guangfu.jpg";
    }
    if (name === "Li Guangsu") {
        return "Li Guangsu.jpg";
    }
    if (name === "Li Cong") {
        return "Li Cong.jpg";
    }
    const query = encodeURIComponent(name);
    const url = `https://images-api.nasa.gov/search?q=${query}&media_type=image`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.collection && data.collection.items && data.collection.items.length > 0) {
            const imageUrl = data.collection.items[0].links[0].href;
            return imageUrl;
        }
        return "https://upload.wikimedia.org/wikipedia/commons/8/8c/No_image_available.svg";
    } catch (error) {
        console.error("Error fetching astronaut image:", error);
        return "https://upload.wikimedia.org/wikipedia/commons/8/8c/No_image_available.svg";
    }
}

const satellitesByCountry = [
    { country: "UNITED STATES", count: 9266 },
    { country: "PEOPLE'S REPUBLIC OF CHINA", count: 885 },
    { country: "COMMONWEALTH OF INDEPENDENT STATES (FORMER USSR)", count: 1563 },
    { country: "UNITED KINGDOM", count: 660 },
    { country: "JAPAN", count: 201 },
    { country: "FRANCE", count: 124 },
    { country: "INDIA", count: 106 },
    { country: "EUROPEAN SPACE AGENCY", count: 97 },
    { country: "INTERNATIONAL TELECOMMUNICATIONS SATELLITE ORGANIZATION", count: 87 },
    { country: "GLOBALSTAR", count: 84 },
    { country: "GERMANY", count: 80 },
    { country: "SOCIETE EUROPEENNE DES SATELLITES", count: 71 },
    { country: "CANADA", count: 65 },
    { country: "ITALY", count: 61 },
    { country: "EUROPEAN TELECOMMUNICATIONS SATELLITE ORGANIZATION", count: 57 },
    { country: "SPAIN", count: 49 },
    { country: "SOUTH KOREA", count: 42 },
    { country: "ORBCOMM", count: 41 },
    { country: "ARGENTINA", count: 36 },
    { country: "AUSTRALIA", count: 31 }
];

function displaySatellitesByCountry() {
    const infoPanel = document.getElementById('info-panel');
    let content = `<h2>Satellites by Country</h2>`;
    const sortedData = [...satellitesByCountry].sort((a, b) => b.count - a.count);
    const totalSatellites = sortedData.reduce((sum, country) => sum + country.count, 0);
    sortedData.forEach(country => {
        const percentage = ((country.count / totalSatellites) * 100).toFixed(1);
        content += `
      <div style="margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-family: 'Roboto', sans-serif;">
          <span style="font-weight: bold; font-family: 'Roboto', sans-serif;">${country.country}</span>
          <span style="color: #3498db; font-weight: bold; font-family: 'Orbitron', sans-serif;">${country.count}</span>
        </div>
        <div style="background: rgba(255,255,255,0.1); height: 5px; width: 100%; border-radius: 2px;">
          <div style="background: #3498db; height: 100%; width: ${percentage}%; border-radius: 2px;"></div>
        </div>
      </div>`;
    });
    infoPanel.innerHTML = content;
}

const moonMissions = [
    {
        mission: "Apollo 11",
        country: "United States",
        date: "July 20, 1969",
        crew: "Neil Armstrong, Buzz Aldrin",
        location: "Sea of Tranquility",
        achievement: "First humans to walk on the Moon",
        details: "Neil Armstrong's historic first step on the lunar surface marked one of humanity's greatest achievements.",
        wikiLink: "https://en.wikipedia.org/wiki/Apollo_11",
        lat: 0.6737,
        lng: 23.47295
    },
    {
        mission: "Apollo 12",
        country: "United States",
        date: "November 19, 1969",
        crew: "Charles Conrad, Alan Bean",
        location: "Ocean of Storms",
        achievement: "Precision landing near Surveyor 3 probe",
        details: "The mission demonstrated precision landing capability by touching down near the Surveyor 3 probe.",
        wikiLink: "https://en.wikipedia.org/wiki/Apollo_12",
        lat: -3.01184,
        lng: -23.42156
    },
    {
        mission: "Apollo 14",
        country: "United States",
        date: "February 5, 1971",
        crew: "Alan Shepard, Edgar Mitchell",
        location: "Fra Mauro formation",
        achievement: "First lunar golf shot",
        details: "Alan Shepard famously hit golf balls on the lunar surface.",
        wikiLink: "https://en.wikipedia.org/wiki/Apollo_14",
        lat: -3.6445,
        lng: -17.47753
    },
    {
        mission: "Apollo 15",
        country: "United States",
        date: "July 30, 1971",
        crew: "David Scott, James Irwin",
        location: "Hadley–Apennine",
        achievement: "First use of lunar rover",
        details: "This mission featured the first lunar rover, allowing astronauts to explore much more territory.",
        wikiLink: "https://en.wikipedia.org/wiki/Apollo_15",
        lat: 26.13407,
        lng: 3.62981
    },
    {
        mission: "Apollo 16",
        country: "United States",
        date: "April 21, 1972",
        crew: "John Young, Charles Duke",
        location: "Descartes Highlands",
        achievement: "First exploration of lunar highlands",
        details: "Focused on studying the lunar highlands, a different type of terrain from previous missions.",
        wikiLink: "https://en.wikipedia.org/wiki/Apollo_16",
        lat: -8.97477,
        lng: 15.49749
    },
    {
        mission: "Apollo 17",
        country: "United States",
        date: "December 11, 1972",
        crew: "Eugene Cernan, Harrison Schmitt",
        location: "Taurus–Littrow valley",
        achievement: "Last humans on the Moon, longest lunar stay",
        details: "The final Apollo mission included the first scientist-astronaut (geologist Harrison Schmitt).",
        wikiLink: "https://en.wikipedia.org/wiki/Apollo_17",
        lat: 20.18935,
        lng: 30.76996
    },

    {
        mission: "Luna 9",
        country: "Soviet Union",
        date: "February 3, 1966",
        crew: "Unmanned",
        location: "Oceanus Procellarum",
        achievement: "First soft landing on the Moon",
        details: "The first spacecraft to achieve a soft landing on the Moon and transmit photographic data.",
        wikiLink: "https://en.wikipedia.org/wiki/Luna_9",
        lat: 7.08,
        lng: -64.37
    },
    {
        mission: "Luna 13",
        country: "Soviet Union",
        date: "December 24, 1966",
        crew: "Unmanned",
        location: "Oceanus Procellarum",
        achievement: "Soil mechanics experiments",
        details: "Conducted mechanical soil tests and took panoramic images of the lunar surface.",
        wikiLink: "https://en.wikipedia.org/wiki/Luna_13",
        lat: 18.87,
        lng: -62.05
    },
    {
        mission: "Luna 16",
        country: "Soviet Union",
        date: "September 20, 1970",
        crew: "Unmanned",
        location: "Mare Fecunditatis",
        achievement: "First robotic sample return",
        details: "The first robotic mission to land and return lunar soil samples to Earth.",
        wikiLink: "https://en.wikipedia.org/wiki/Luna_16",
        lat: -0.68,
        lng: 56.3
    },
    {
        mission: "Luna 17",
        country: "Soviet Union",
        date: "November 17, 1970",
        crew: "Unmanned",
        location: "Mare Imbrium",
        achievement: "Delivered Lunokhod 1 rover",
        details: "Delivered the first robotic rover to explore the lunar surface, which operated for 10 months.",
        wikiLink: "https://en.wikipedia.org/wiki/Luna_17",
        lat: 38.28,
        lng: -35
    },
    {
        mission: "Luna 20",
        country: "Soviet Union",
        date: "February 21, 1972",
        crew: "Unmanned",
        location: "Apollonius Highlands",
        achievement: "Sample return from highlands",
        details: "Collected and returned samples from the lunar highlands, a geologically different region.",
        wikiLink: "https://en.wikipedia.org/wiki/Luna_20",
        lat: 3.57,
        lng: 56.5
    },
    {
        mission: "Luna 21",
        country: "Soviet Union",
        date: "January 15, 1973",
        crew: "Unmanned",
        location: "Le Monnier crater",
        achievement: "Delivered Lunokhod 2 rover",
        details: "Deployed the Lunokhod 2 rover which traveled over 35 km, a record at the time.",
        wikiLink: "https://en.wikipedia.org/wiki/Luna_21",
        lat: 25.51,
        lng: 30.38
    },
    {
        mission: "Luna 24",
        country: "Soviet Union",
        date: "August 18, 1976",
        crew: "Unmanned",
        location: "Mare Crisium",
        achievement: "Last Soviet lunar mission",
        details: "The last Soviet lunar mission, which successfully returned samples from deeper below the surface.",
        wikiLink: "https://en.wikipedia.org/wiki/Luna_24",
        lat: 12.25,
        lng: 62.2
    },
    {
        mission: "Chang'e 3",
        country: "China",
        date: "December 14, 2013",
        crew: "Unmanned",
        location: "Mare Imbrium",
        achievement: "First Chinese lunar landing",
        details: "Included the Yutu rover, making China the third country to soft-land on the Moon.",
        wikiLink: "https://en.wikipedia.org/wiki/Chang%27e_3",
        lat: 44.12,
        lng: 19.51
    },
    {
        mission: "Chang'e 4",
        country: "China",
        date: "January 3, 2019",
        crew: "Unmanned",
        location: "South Pole-Aitken Basin (Far side)",
        achievement: "First landing on the far side of the Moon",
        details: "This historic mission was the first to land on the Moon's far side, requiring a relay satellite.",
        wikiLink: "https://en.wikipedia.org/wiki/Chang%27e_4",

        lat: -45.4446,
        lng: 177.5991
    },
    {
        mission: "LCROSS",
        country: "United States",
        date: "October 9, 2009",
        crew: "Unmanned",
        location: "Cabeus crater (South Pole)",
        achievement: "Confirmed water ice at lunar south pole",
        details: "Deliberately impacted the Moon to analyze the resulting plume, confirming the presence of water ice.",
        wikiLink: "https://en.wikipedia.org/wiki/LCROSS",
        lat: -84.72,
        lng: -49.62
    }
];

function displayMoonMissions() {
    const infoPanel = document.getElementById('info-panel');
    let content = `
      <h2>Historic Moon Landings</h2>
      <p style="color: #bbb; margin-bottom: 10px; font-family: 'Roboto', sans-serif;">
        Explore key missions that have touched the lunar surface.
      </p>
      <div style="margin-bottom: 20px;">
        <input type="text" id="mission-search" placeholder="Search missions..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #3498db; background: rgba(52, 152, 219, 0.1); color: white; box-sizing: border-box; font-family: 'Roboto', sans-serif;">
      </div>
    `;
    const countryCounts = {};
    moonMissions.forEach(mission => {
        if (!countryCounts[mission.country]) {
            countryCounts[mission.country] = 1;
        } else {
            countryCounts[mission.country]++;
        }
    });
    content += `<div style="background: rgba(52, 152, 219, 0.1); border-radius: 5px; padding: 10px; margin-bottom: 20px;">
      <h3 style="margin-top: 0; color: #3498db; font-family: 'Orbitron', sans-serif;">Mission Statistics</h3>
      <ul style="list-style-type: none; padding-left: 0; font-family: 'Roboto', sans-serif;">`;
    for (const country in countryCounts) {
        content += `<li style="font-family: 'Roboto', sans-serif;">${country}: ${countryCounts[country]} missions</li>`;
    }
    content += `
      <li style="margin-top: 10px; font-family: 'Roboto', sans-serif;">Human missions: 6</li>
      <li style="font-family: 'Roboto', sans-serif;">Robotic missions: ${moonMissions.length - 6}</li>
      </ul>
    </div>`;

    moonMissions.forEach(mission => {
        content += `
      <div class="mission-item" style="margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; cursor: pointer;"
           data-mission="${mission.mission.toLowerCase()}"
           data-lat="${mission.lat}"
           data-lng="${mission.lng}"
           data-country="${mission.country.toLowerCase()}"
           data-date="${mission.date.toLowerCase()}"
           data-location="${mission.location.toLowerCase()}"
           data-achievement="${mission.achievement.toLowerCase()}">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="mission-title">${mission.mission}</span>
          <span style="font-family: 'Roboto', sans-serif;">${mission.country}</span>
        </div>
        <div style="margin-top: 5px; color: #bbb; font-family: 'Roboto', sans-serif;">${mission.date}</div>
        <div style="margin-top: 8px; font-family: 'Roboto', sans-serif;">${mission.location}</div>
        <div style="margin-top: 5px; font-style: italic; font-family: 'Roboto', sans-serif;">${mission.achievement}</div>
        <div style="margin-top: 8px; font-size: 14px; color: #ddd; font-family: 'Roboto', sans-serif;">${mission.details}</div>
<a href="${mission.wikiLink}" target="_blank" class="wiki-button">Learn More</a>
      </div>`;
    });

    infoPanel.innerHTML = content;

    const searchInput = document.getElementById('mission-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterMoonMissions(this.value.toLowerCase());
        });
    }

    const missionItems = document.querySelectorAll('.mission-item');
    missionItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (e.target.classList.contains('wiki-button')) return;

            const lat = parseFloat(this.dataset.lat);
            const lng = parseFloat(this.dataset.lng);

            if (!isNaN(lat) && !isNaN(lng)) {
                const iframe = document.getElementById("external-frame");
                iframe.contentWindow.postMessage({
                    type: 'centerMission',
                    mission: this.dataset.mission,
                    coordinates: { lat, lng }
                }, '*');
            }
        });
    });
}


window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "missionClicked" && event.data.mission) {
        const missionName = event.data.mission.toLowerCase();
        const missionElement = document.querySelector(`.mission-item[data-mission="${missionName}"]`);
        if (missionElement) {
            missionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            missionElement.classList.add('highlight');
            setTimeout(() => missionElement.classList.remove('highlight'), 2000);
        }
    }
});

function filterMoonMissions(searchTerm) {
    const missionElements = document.querySelectorAll('#info-panel .mission-item');
    let resultsFound = false;
    missionElements.forEach(missionElement => {
        const missionText = missionElement.textContent.toLowerCase();
        if (missionText.includes(searchTerm)) {
            missionElement.style.display = 'block';
            resultsFound = true;
        } else {
            missionElement.style.display = 'none';
        }
    });
    let noResultsElement = document.getElementById('no-search-results');
    if (!resultsFound) {
        if (!noResultsElement) {
            noResultsElement = document.createElement('div');
            noResultsElement.id = 'no-search-results';
            noResultsElement.style.textAlign = 'center';
            noResultsElement.style.padding = '20px';
            noResultsElement.style.color = '#bbb';
            noResultsElement.style.fontFamily = "'Roboto', sans-serif";
            document.getElementById('info-panel').appendChild(noResultsElement);
        }
        noResultsElement.textContent = `No missions found matching "${searchTerm}"`;
        noResultsElement.style.display = 'block';
    } else if (noResultsElement) {
        noResultsElement.style.display = 'none';
    }
}

function loadISSView() {
    currentView = 'iss';
    document.getElementById("external-view").style.display = "none";
    document.getElementById("globe-container").style.display = "block";
    document.getElementById("button-container").style.display ="block";
    document.getElementById("info-panel").innerHTML = `
      <h2>Astronauts in Space:</h2>
      <div id="astronauts-list">Loading...</div>
    `;
    fetchAstronauts();
    if (issUpdateInterval) {
        clearInterval(issUpdateInterval);
    }
    issUpdateInterval = setInterval(updateISSMarker, 5000);
    updateISSMarker();
}

fetchAstronauts();
issUpdateInterval = setInterval(updateISSMarker, 5000);

document.getElementById('iss-view-link').addEventListener('click', function(event) {
    event.preventDefault();
    loadISSView();
});

document.getElementById('satellite-view-link').addEventListener('click', function(event) {
    event.preventDefault();
    currentView = 'satellites';
    if (issUpdateInterval) {
        clearInterval(issUpdateInterval);
        issUpdateInterval = null;
    }
    const iframe = document.getElementById("external-frame");
    iframe.src = "satellite.html";
    document.getElementById("external-view").style.display = "block";
    document.getElementById("globe-container").style.display = "none";
    document.getElementById("button-container").style.display ="none";
    displaySatellitesByCountry();
});

document.getElementById('moon-landing-link').addEventListener('click', function(event) {
    event.preventDefault();
    currentView = 'moon';
    if (issUpdateInterval) {
        clearInterval(issUpdateInterval);
        issUpdateInterval = null;
    }
    const iframe = document.getElementById("external-frame");
    iframe.src = "moon.html";
    document.getElementById("external-view").style.display = "block";
    document.getElementById("globe-container").style.display = "none";
    document.getElementById("button-container").style.display ="none";
    displayMoonMissions();
});

setTimeout(() => {
    const canvas = document.querySelector('#globe-container canvas');
    if (canvas) {
        canvas.style.cursor = 'grab';
        canvas.addEventListener('mousedown', () => {
            canvas.style.cursor = 'grabbing';
        });
        canvas.addEventListener('mouseup', () => {
            canvas.style.cursor = 'grab';
        });
        canvas.addEventListener('mouseleave', () => {
            canvas.style.cursor = 'grab';
        });
    }
}, 1000);

window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "missionClicked" && event.data.mission) {
        const missionName = event.data.mission.toLowerCase();
        const missionElement = document.querySelector(`.mission-item[data-mission="${missionName}"]`);
        if (missionElement) {
            missionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            missionElement.classList.add('highlight');
            setTimeout(() => missionElement.classList.remove('highlight'), 2000);
        }
    }
});