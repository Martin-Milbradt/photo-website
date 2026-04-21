// eslint-disable-next-line no-unused-vars
let unsubscribePhotobooks = null;
let map = null;
let mapMarkers = [];
let currentPhotobooks = [];

function initTabs() {
    const chronologicalTab = document.getElementById("tab-chronological");
    const mapTab = document.getElementById("tab-map");
    const chronologicalContent = document.getElementById("tab-content-chronological");
    const mapContent = document.getElementById("tab-content-map");

    function switchTab(activeTab, activeContent) {
        chronologicalTab.classList.remove("border-travel-coral", "text-travel-coral");
        chronologicalTab.classList.add("border-transparent", "text-gray-600");
        mapTab.classList.remove("border-travel-coral", "text-travel-coral");
        mapTab.classList.add("border-transparent", "text-gray-600");

        activeTab.classList.remove("border-transparent", "text-gray-600");
        activeTab.classList.add("border-travel-coral", "text-travel-coral");

        chronologicalContent.classList.add("hidden");
        mapContent.classList.add("hidden");
        activeContent.classList.remove("hidden");
    }

    chronologicalTab.addEventListener("click", () => {
        switchTab(chronologicalTab, chronologicalContent);
    });

    mapTab.addEventListener("click", () => {
        switchTab(mapTab, mapContent);
        if (!map) {
            initMap();
        }
        if (currentPhotobooks.length > 0) {
            renderMap(currentPhotobooks);
        }
    });
}

function initMap() {
    const mapContainer = document.getElementById("map-container");
    if (!mapContainer || map) return;

    map = L.map("map-container").setView([51.505, 10.0], 2);

    L.tileLayer("https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
    }).addTo(map);
}

function addPhotobookMarker(photobook) {
    const marker = L.marker([photobook.lat, photobook.lon]).addTo(map);
    marker.bindPopup(`
        <div class="text-center">
            <h3 class="font-bold text-lg mb-1">${escapeHtml(photobook.title)}</h3>
            ${photobook.date ? `<p class="text-sm text-gray-600 mb-2">${escapeHtml(photobook.date)}</p>` : ""}
            <p class="text-sm text-gray-600 mb-2">${escapeHtml(photobook.ort)}</p>
            <a href="photobook.html?id=${photobook.id}" class="inline-block bg-travel-coral text-white px-4 py-2 rounded-lg hover:bg-travel-sunset transition-colors">
                Fotobuch ansehen
            </a>
        </div>
    `);
    return marker;
}

function renderMap(photobooks) {
    const mapContent = document.getElementById("tab-content-map");
    if (mapContent.classList.contains("hidden")) {
        return;
    }

    const userType = getUserType();
    let filteredPhotobooks = photobooks;

    if (userType === "friends") {
        filteredPhotobooks = photobooks.filter((p) => p.availableToFriends === true);
    }

    const photobooksWithCoords = filteredPhotobooks.filter(
        (p) => p.ort && p.ort.trim() && typeof p.lat === "number" && typeof p.lon === "number"
    );

    const mapEmptyState = document.getElementById("map-empty-state");
    const mapContainer = document.getElementById("map-container");

    if (photobooksWithCoords.length === 0) {
        if (map) {
            mapContainer.classList.add("hidden");
        }
        mapEmptyState.classList.remove("hidden");
        return;
    }

    mapEmptyState.classList.add("hidden");
    mapContainer.classList.remove("hidden");

    if (!map) {
        initMap();
    }

    if (!map) return;

    mapMarkers.forEach((marker) => map.removeLayer(marker));
    mapMarkers = [];

    const bounds = [];
    for (const photobook of photobooksWithCoords) {
        bounds.push([photobook.lat, photobook.lon]);
        mapMarkers.push(addPhotobookMarker(photobook));
    }

    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

// eslint-disable-next-line no-unused-vars
async function loadPhotobooks() {
    const container = document.getElementById("photobooks-list");
    const emptyState = document.getElementById("empty-state");

    updateAdminLinkVisibility();
    initTabs();

    function renderPhotobooks(photobooks) {
        currentPhotobooks = photobooks;
        const userType = getUserType();
        let filteredPhotobooks = photobooks;

        if (userType === "friends") {
            filteredPhotobooks = photobooks.filter((p) => p.availableToFriends === true);
        }

        if (filteredPhotobooks.length === 0) {
            container.classList.add("hidden");
            emptyState.classList.remove("hidden");
        } else {
            container.classList.remove("hidden");
            emptyState.classList.add("hidden");

            container.innerHTML = filteredPhotobooks
                .map(
                    (photobook) => `
                <a href="photobook.html?id=${photobook.id}"
                    class="group bg-gradient-to-br from-white to-travel-sand rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-travel-teal flex flex-col h-full">
                    <div class="mb-4 flex items-center justify-center flex-shrink-0 ${
                        photobook.imageUrl ? "h-48" : ""
                    }">
                        ${
                            photobook.imageUrl
                                ? `<img src="${escapeHtml(photobook.imageUrl)}" alt="${escapeHtml(
                                      photobook.title
                                  )}" class="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='block';">
                             <svg class="w-12 h-12 text-travel-coral group-hover:scale-110 transition-transform duration-300 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                             </svg>`
                                : `<svg class="w-12 h-12 text-travel-coral group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                             </svg>`
                        }
                    </div>
                    <div class="flex flex-col justify-end flex-grow">
                        <h2 class="text-xl font-bold text-gray-800 mb-1 group-hover:text-travel-coral transition-colors">${escapeHtml(
                            photobook.title
                        )}</h2>
                        ${
                            photobook.date
                                ? `<p class="text-sm text-gray-500 mb-2">${escapeHtml(photobook.date)}</p>`
                                : ""
                        }
                    </div>
                </a>
            `
                )
                .join("");
        }

        const mapContent = document.getElementById("tab-content-map");
        if (mapContent && !mapContent.classList.contains("hidden")) {
            renderMap(photobooks);
        }
    }

    unsubscribePhotobooks = subscribeToPhotobooks(renderPhotobooks, () => {
        container.innerHTML =
            '<div class="col-span-full text-center py-12"><div class="inline-flex items-center gap-2 text-red-500"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>Fehler beim Laden der Fotobücher. Bitte Seite aktualisieren.</span></div></div>';
    });
}

function updateAdminLinkVisibility() {
    const adminLink = document.getElementById("admin-link");
    if (adminLink) {
        if (isAdmin()) {
            adminLink.style.display = "";
        } else {
            adminLink.style.display = "none";
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
