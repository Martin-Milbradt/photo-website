// eslint-disable-next-line no-unused-vars
let unsubscribeAdminPhotobooks = null;
let renderPhotobooksListFn = null;
let editingPhotobookId = null;

function renderPhotobooksList(photobooks) {
    const container = document.getElementById("photobooks-list");

    if (photobooks.length === 0) {
        container.innerHTML =
            '<div class="text-center py-12"><svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg><p class="text-gray-500">Noch keine Fotobücher hinzugefügt.</p></div>';
        return;
    }

    container.innerHTML = photobooks
        .map(
            (photobook) => `
        <div class="flex items-center justify-between p-4 bg-gradient-to-r from-white to-travel-sand rounded-xl border-2 border-gray-100 hover:border-travel-teal transition-all">
            <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-800 mb-1">${escapeHtml(photobook.title)}</h3>
                ${photobook.date ? `<p class="text-sm text-gray-500 mb-2">${escapeHtml(photobook.date)}</p>` : ""}
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox"
                            ${photobook.availableToFriends ? "checked" : ""}
                            onchange="toggleFriendsVisibility('${photobook.id}', this.checked)"
                            class="w-5 h-5 text-travel-teal border-gray-300 rounded focus:ring-travel-teal">
                    <span class="text-sm text-gray-600">Für Freunde verfügbar</span>
                </label>
            </div>
            <div class="flex gap-2 ml-4">
                <button data-edit-id="${photobook.id}"
                    class="edit-photobook-btn px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 font-semibold transition-colors border-2 border-blue-400 hover:border-blue-500 shadow-sm">
                    Bearbeiten
                </button>
                <button onclick="deletePhotobookById('${photobook.id}')"
                    class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition-colors border-2 border-red-500 hover:border-red-600 shadow-sm">
                    Löschen
                </button>
            </div>
        </div>
    `
        )
        .join("");

    container.querySelectorAll(".edit-photobook-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const id = this.getAttribute("data-edit-id");
            editPhotobook(id);
        });
    });
}

// eslint-disable-next-line no-unused-vars
async function loadAdminPage() {
    const form = document.getElementById("add-photobook-form");
    const submitBtn = form.querySelector("button[type='submit']");

    renderPhotobooksListFn = renderPhotobooksList;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const title = document.getElementById("photobook-title").value.trim();
        const date = document.getElementById("photobook-date").value.trim();
        const url = document.getElementById("photobook-url").value.trim();
        const imageUrl = document.getElementById("photobook-image-url").value.trim();
        const ort = document.getElementById("photobook-ort").value.trim();
        const availableToFriends = document.getElementById("available-to-friends").checked;

        if (!title || !date || !url) {
            alert("Bitte alle Felder ausfüllen");
            return;
        }

        const extractedUrl = extractUrlFromInput(url);
        if (!extractedUrl) {
            alert("Bitte eine gültige Fotobuch URL oder iframe einfügen");
            return;
        }

        if (!isValidPhotobookUrl(extractedUrl)) {
            alert("Bitte eine gültige PosterXXL oder PhotoConnector Fotobuch URL eingeben");
            return;
        }

        const widgetviewerUrl = convertToWidgetviewerUrl(extractedUrl);
        if (!widgetviewerUrl) {
            alert("Fehler beim Konvertieren der URL. Bitte erneut versuchen.");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Wird hinzugefügt...";

        try {
            await addPhotobook(title, widgetviewerUrl, date, availableToFriends, imageUrl || null, ort || null);
            document.getElementById("photobook-title").value = "";
            document.getElementById("photobook-date").value = "";
            document.getElementById("photobook-url").value = "";
            document.getElementById("photobook-image-url").value = "";
            document.getElementById("photobook-ort").value = "";
            document.getElementById("available-to-friends").checked = false;
            alert("Fotobuch erfolgreich hinzugefügt!");
        } catch (error) {
            alert("Fehler beim Hinzufügen des Fotobuchs. Bitte erneut versuchen.");
            console.error(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Fotobuch hinzufügen";
        }
    });

    try {
        const photobooks = await getPhotobooks();
        renderPhotobooksList(photobooks);

        if (typeof subscribeToPhotobooks === "function") {
            unsubscribeAdminPhotobooks = subscribeToPhotobooks(renderPhotobooksList);
        }
    } catch (error) {
        console.error("Error loading photobooks:", error);
        document.getElementById("photobooks-list").innerHTML =
            '<div class="text-center py-12"><div class="inline-flex items-center gap-2 text-red-500"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>Fehler beim Laden der Fotobücher. Bitte Seite aktualisieren.</span></div></div>';
    }
}

// eslint-disable-next-line no-unused-vars
async function deletePhotobookById(id) {
    if (confirm("Möchten Sie dieses Fotobuch wirklich löschen?")) {
        try {
            await deletePhotobook(id);
        } catch (error) {
            alert("Fehler beim Löschen des Fotobuchs. Bitte erneut versuchen.");
            console.error(error);
        }
    }
}

// eslint-disable-next-line no-unused-vars
async function toggleFriendsVisibility(id, availableToFriends) {
    try {
        await updatePhotobook(id, { availableToFriends: availableToFriends });
        const photobooks = await getPhotobooks();
        if (renderPhotobooksListFn) {
            renderPhotobooksListFn(photobooks);
        }
    } catch (error) {
        alert("Fehler beim Aktualisieren des Fotobuchs. Bitte erneut versuchen.");
        console.error(error);
        const photobooks = await getPhotobooks();
        if (renderPhotobooksListFn) {
            renderPhotobooksListFn(photobooks);
        }
    }
}

async function editPhotobook(id) {
    try {
        const photobook = await getPhotobookById(id);
        if (!photobook) {
            alert("Fotobuch nicht gefunden.");
            return;
        }

        editingPhotobookId = id;
        document.getElementById("edit-photobook-title").value = photobook.title || "";
        document.getElementById("edit-photobook-date").value = photobook.date || "";
        document.getElementById("edit-photobook-url").value = photobook.url || "";
        document.getElementById("edit-photobook-image-url").value = photobook.imageUrl || "";
        document.getElementById("edit-photobook-ort").value = photobook.ort || "";
        document.getElementById("edit-available-to-friends").checked = photobook.availableToFriends || false;

        document.getElementById("edit-modal").classList.remove("hidden");
    } catch (error) {
        alert("Fehler beim Laden des Fotobuchs. Bitte erneut versuchen.");
        console.error(error);
    }
}

function closeEditModal() {
    editingPhotobookId = null;
    const modal = document.getElementById("edit-modal");
    modal.classList.add("hidden");
    document.getElementById("edit-photobook-form").reset();
}

document.addEventListener("DOMContentLoaded", function () {
    const editModal = document.getElementById("edit-modal");
    if (editModal) {
        editModal.addEventListener("click", function (e) {
            if (e.target === editModal) {
                closeEditModal();
            }
        });
    }

    const editForm = document.getElementById("edit-photobook-form");
    if (editForm) {
        editForm.addEventListener("submit", function (e) {
            e.preventDefault();
            savePhotobookEdit();
        });
    }
});

async function savePhotobookEdit() {
    const title = document.getElementById("edit-photobook-title").value.trim();
    const date = document.getElementById("edit-photobook-date").value.trim();
    const url = document.getElementById("edit-photobook-url").value.trim();
    const imageUrl = document.getElementById("edit-photobook-image-url").value.trim();
    const ort = document.getElementById("edit-photobook-ort").value.trim();
    const availableToFriends = document.getElementById("edit-available-to-friends").checked;

    if (!title || !date || !url) {
        alert("Bitte alle Pflichtfelder ausfüllen");
        return;
    }

    const extractedUrl = extractUrlFromInput(url);
    if (!extractedUrl) {
        alert("Bitte eine gültige Fotobuch URL oder iframe einfügen");
        return;
    }

    if (!isValidPhotobookUrl(extractedUrl)) {
        alert("Bitte eine gültige PosterXXL oder PhotoConnector Fotobuch URL eingeben");
        return;
    }

    const widgetviewerUrl = convertToWidgetviewerUrl(extractedUrl);
    if (!widgetviewerUrl) {
        alert("Fehler beim Konvertieren der URL. Bitte erneut versuchen.");
        return;
    }

    const submitBtn = document.getElementById("edit-save-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Wird gespeichert...";

    try {
        const [month, year] = date.split(".");
        const sortDate = parseInt(year) * 100 + parseInt(month);
        const updates = {
            title: title,
            date: date,
            url: widgetviewerUrl,
            sortDate: sortDate,
            availableToFriends: availableToFriends,
        };

        if (imageUrl.trim()) {
            updates.imageUrl = imageUrl.trim();
        } else {
            updates.imageUrl = firebase.firestore.FieldValue.delete();
        }

        if (ort.trim()) {
            updates.ort = ort.trim();
        } else {
            updates.ort = firebase.firestore.FieldValue.delete();
        }

        await updatePhotobook(editingPhotobookId, updates);
        closeEditModal();

        const photobooks = await getPhotobooks();
        if (renderPhotobooksListFn) {
            renderPhotobooksListFn(photobooks);
        }

        alert("Fotobuch erfolgreich aktualisiert!");
    } catch (error) {
        alert("Fehler beim Aktualisieren des Fotobuchs. Bitte erneut versuchen.");
        console.error(error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Speichern";
    }
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function extractUrlFromInput(input) {
    const trimmed = input.trim();

    if (trimmed.toLowerCase().includes("<iframe")) {
        const srcMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
        if (srcMatch && srcMatch[1]) {
            return srcMatch[1].trim();
        }
        return null;
    }

    return trimmed;
}

function isValidPhotobookUrl(url) {
    if (!url) return false;

    return url.includes("posterxxl.de/onlinefotobuch-ansehen") || url.includes("widgetviewer.photoconnector.net");
}
