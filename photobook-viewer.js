// eslint-disable-next-line no-unused-vars
async function loadPhotobookViewer() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    const container = document.getElementById("photobook-container");

    if (!id) {
        container.innerHTML = '<div class="flex items-center justify-center py-20"><div class="text-center"><svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><p class="text-gray-500 text-lg">Kein Fotobuch ausgewählt.</p></div></div>';
        return;
    }

    container.innerHTML = '<div class="flex items-center justify-center py-20"><div class="text-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-travel-coral mx-auto mb-4"></div><p class="text-gray-500">Fotobuch wird geladen...</p></div></div>';

    try {
        const photobook = await getPhotobookById(id);

        if (!photobook) {
            container.innerHTML = '<div class="flex items-center justify-center py-20"><div class="text-center"><svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><p class="text-gray-500 text-lg">Fotobuch nicht gefunden.</p></div></div>';
            return;
        }

        const userType = getUserType();
        if (userType === "friends" && !photobook.availableToFriends) {
            container.innerHTML = '<div class="flex items-center justify-center py-20"><div class="text-center"><svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg><p class="text-gray-500 text-lg">Sie haben keine Berechtigung, dieses Fotobuch anzusehen.</p><a href="index.html" class="mt-4 inline-block text-travel-teal hover:text-travel-ocean font-semibold">Zurück zur Übersicht</a></div></div>';
            return;
        }

        document.getElementById("photobook-title").textContent = photobook.title;
        container.innerHTML = `<iframe src="${photobook.url}" allowfullscreen class="w-full h-screen min-h-[800px] border-0 rounded-xl"></iframe>`;
    } catch (error) {
        console.error("Error loading photobook:", error);
        container.innerHTML = '<div class="flex items-center justify-center py-20"><div class="text-center"><svg class="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><p class="text-red-500 text-lg">Fehler beim Laden des Fotobuchs. Bitte erneut versuchen.</p></div></div>';
    }
}

