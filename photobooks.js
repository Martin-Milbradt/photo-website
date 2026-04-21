const PHOTOBOOKS_COLLECTION = "photobooks";

function parseDateForSorting(dateString) {
    const [month, year] = dateString.split(".");
    return parseInt(year) * 100 + parseInt(month);
}

function convertToWidgetviewerUrl(url) {
    if (!url) return null;

    if (url.includes("widgetviewer.photoconnector.net")) {
        return url;
    }

    if (url.includes("posterxxl.de/onlinefotobuch-ansehen")) {
        try {
            const urlObj = new URL(url);
            const widgetId = urlObj.searchParams.get("widgetId");
            const securityId = urlObj.searchParams.get("securityId") || "undefined";
            const locale = urlObj.searchParams.get("locale") || "de-AT";

            if (!widgetId) {
                return null;
            }

            return `https://widgetviewer.photoconnector.net?widgetId=${encodeURIComponent(widgetId)}&securityId=${encodeURIComponent(securityId)}&locale=${encodeURIComponent(locale)}`;
        } catch (error) {
            console.error("Error parsing PosterXXL URL:", error);
            return null;
        }
    }

    return url;
}

function convertPhotobookUrl(photobook) {
    if (photobook.url && photobook.url.includes("posterxxl.de/onlinefotobuch-ansehen")) {
        const convertedUrl = convertToWidgetviewerUrl(photobook.url);
        if (convertedUrl && convertedUrl !== photobook.url) {
            photobook.url = convertedUrl;
            updatePhotobook(photobook.id, { url: convertedUrl }).catch((error) => {
                console.error("Error updating photobook URL:", error);
            });
        }
    }
    return photobook;
}

// eslint-disable-next-line no-unused-vars
async function getPhotobooks() {
    try {
        const snapshot = await db.collection(PHOTOBOOKS_COLLECTION).get();
        let photobooks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        photobooks = photobooks.map((photobook) => convertPhotobookUrl(photobook));

        photobooks.sort((a, b) => {
            const sortDateA = a.sortDate || (a.date ? parseDateForSorting(a.date) : 0);
            const sortDateB = b.sortDate || (b.date ? parseDateForSorting(b.date) : 0);
            return sortDateB - sortDateA;
        });

        return photobooks;
    } catch (error) {
        console.error("Error loading photobooks:", error);
        return [];
    }
}

// eslint-disable-next-line no-unused-vars
async function addPhotobook(title, url, date, availableToFriends = false, imageUrl = null, ort = null) {
    try {
        const sortDate = parseDateForSorting(date);
        const data = {
            title: title,
            url: url,
            date: date,
            sortDate: sortDate,
            availableToFriends: availableToFriends,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };
        if (imageUrl && imageUrl.trim()) {
            data.imageUrl = imageUrl.trim();
        }
        if (ort && ort.trim()) {
            data.ort = ort.trim();
        }
        const docRef = await db.collection(PHOTOBOOKS_COLLECTION).add(data);
        return docRef.id;
    } catch (error) {
        console.error("Error adding photobook:", error);
        throw error;
    }
}

async function updatePhotobook(id, updates) {
    try {
        await db.collection(PHOTOBOOKS_COLLECTION).doc(id).update(updates);
    } catch (error) {
        console.error("Error updating photobook:", error);
        throw error;
    }
}

// eslint-disable-next-line no-unused-vars
async function deletePhotobook(id) {
    try {
        await db.collection(PHOTOBOOKS_COLLECTION).doc(id).delete();
    } catch (error) {
        console.error("Error deleting photobook:", error);
        throw error;
    }
}

// eslint-disable-next-line no-unused-vars
async function getPhotobookById(id) {
    try {
        const doc = await db.collection(PHOTOBOOKS_COLLECTION).doc(id).get();
        if (doc.exists) {
            const photobook = { id: doc.id, ...doc.data() };
            return convertPhotobookUrl(photobook);
        }
        return null;
    } catch (error) {
        console.error("Error getting photobook:", error);
        return null;
    }
}

// eslint-disable-next-line no-unused-vars
function subscribeToPhotobooks(callback) {
    return db.collection(PHOTOBOOKS_COLLECTION).onSnapshot(
        (snapshot) => {
            let photobooks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            photobooks = photobooks.map((photobook) => convertPhotobookUrl(photobook));

            photobooks.sort((a, b) => {
                const sortDateA = a.sortDate || (a.date ? parseDateForSorting(a.date) : 0);
                const sortDateB = b.sortDate || (b.date ? parseDateForSorting(b.date) : 0);
                return sortDateB - sortDateA;
            });

            callback(photobooks);
        },
        (error) => {
            console.error("Error subscribing to photobooks:", error);
            callback([]);
        }
    );
}
