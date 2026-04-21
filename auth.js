const AUTH_CONFIG_COLLECTION = "config";
const AUTH_HASHES_DOC = "auth";
const AUTH_SALTS_DOC = "salts";
const SESSIONS_COLLECTION = "sessions";
const PBKDF2_ITERATIONS = 210000;
const PBKDF2_HASH_ALGO = "SHA-256";
const PBKDF2_HASH_BITS = 256;
const SALT_BYTES = 16;

let authSaltsCache = null;

function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

function bytesToHex(bytes) {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

// eslint-disable-next-line no-unused-vars
function generateSalt() {
    const arr = new Uint8Array(SALT_BYTES);
    crypto.getRandomValues(arr);
    return bytesToHex(arr);
}

// eslint-disable-next-line no-unused-vars
async function derivePasswordHash(password, saltHex) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: hexToBytes(saltHex),
            iterations: PBKDF2_ITERATIONS,
            hash: PBKDF2_HASH_ALGO,
        },
        keyMaterial,
        PBKDF2_HASH_BITS
    );
    return bytesToHex(new Uint8Array(bits));
}

// eslint-disable-next-line no-unused-vars
async function loadAuthSalts() {
    if (authSaltsCache) return authSaltsCache;
    const doc = await db.collection(AUTH_CONFIG_COLLECTION).doc(AUTH_SALTS_DOC).get();
    if (!doc.exists) return null;
    authSaltsCache = doc.data();
    return authSaltsCache;
}

function waitForAuthInit() {
    return new Promise((resolve) => {
        const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

async function ensureAnonymousAuth() {
    const existing = await waitForAuthInit();
    if (existing) return existing;
    const result = await firebase.auth().signInAnonymously();
    return result.user;
}

async function fetchSession() {
    const user = firebase.auth().currentUser;
    if (!user) return null;
    const doc = await db.collection(SESSIONS_COLLECTION).doc(user.uid).get();
    if (!doc.exists) return null;
    return doc.data();
}

async function clearLocalSession() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    try {
        await db.collection(SESSIONS_COLLECTION).doc(user.uid).delete();
    } catch (_ignored) {
        // no-op: either no session exists, or rules blocked delete (shouldn't happen for own uid)
    }
}

async function attemptLogin(password) {
    await ensureAnonymousAuth();
    await clearLocalSession();

    const salts = await loadAuthSalts();
    if (!salts) return { error: "missing-config" };

    const user = firebase.auth().currentUser;
    const attempts = [
        { role: "admin", saltKey: "adminSalt" },
        { role: "friends", saltKey: "friendsSalt" },
        { role: "family", saltKey: "viewerSalt" },
    ];

    for (const { role, saltKey } of attempts) {
        const salt = salts[saltKey];
        if (!salt) continue;
        const hash = await derivePasswordHash(password, salt);
        try {
            await db.collection(SESSIONS_COLLECTION).doc(user.uid).set({
                role: role,
                hash: hash,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
            return { role: role };
        } catch (error) {
            if (error.code !== "permission-denied") {
                return { error: error.message || String(error) };
            }
        }
    }
    return { error: "invalid-password" };
}

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
}

function getCookie(name) {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

// Cookies are UX hints only. Real authorization comes from the Firestore session
// document, which rules check server-side. Forging these cookies does not grant
// any data access.
function isAuthenticated() {
    return getCookie("authenticated") === "true";
}

function setAuthenticated(value) {
    if (value) {
        setCookie("authenticated", "true", 30);
    } else {
        deleteCookie("authenticated");
    }
}

function isAdmin() {
    return getCookie("isAdmin") === "true";
}

function setAdmin(value) {
    if (value) {
        setCookie("isAdmin", "true", 30);
    } else {
        deleteCookie("isAdmin");
    }
}

function getUserType() {
    return getCookie("userType") || "family";
}

function setUserType(type) {
    setCookie("userType", type, 30);
}

// eslint-disable-next-line no-unused-vars
function isFamily() {
    return getUserType() === "family";
}

// eslint-disable-next-line no-unused-vars
function isFriends() {
    return getUserType() === "friends";
}

function applyRoleToUi(role) {
    setAuthenticated(true);
    setAdmin(role === "admin");
    setUserType(role);
}

function clearRoleFromUi() {
    setAuthenticated(false);
    setAdmin(false);
    deleteCookie("userType");
}

// eslint-disable-next-line no-unused-vars
async function checkPassword() {
    const input = document.getElementById("password-input");
    const errorMsg = document.getElementById("login-error");
    const password = input.value.trim();

    errorMsg.textContent = "Wird überprüft...";

    const result = await attemptLogin(password);
    if (result.error) {
        errorMsg.textContent =
            result.error === "missing-config"
                ? "Auth-Konfiguration fehlt. Bitte zuerst setup.html aufrufen."
                : result.error === "invalid-password"
                  ? "Falsches Passwort. Bitte erneut versuchen."
                  : `Fehler: ${result.error}`;
        input.value = "";
        input.focus();
        return;
    }

    applyRoleToUi(result.role);
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("main-content").classList.remove("hidden");
    errorMsg.textContent = "";

    if (typeof loadPhotobooks === "function") loadPhotobooks();
    if (typeof loadPhotobookViewer === "function") loadPhotobookViewer();
    if (typeof updateAdminLinkVisibility === "function") updateAdminLinkVisibility();
}

// eslint-disable-next-line no-unused-vars
async function checkAdminPassword() {
    const input = document.getElementById("password-input");
    const errorMsg = document.getElementById("login-error");
    const password = input.value.trim();

    errorMsg.textContent = "Wird überprüft...";

    const result = await attemptLogin(password);
    if (result.role !== "admin") {
        await clearLocalSession();
        errorMsg.textContent =
            result.error === "missing-config"
                ? "Auth-Konfiguration fehlt. Bitte zuerst setup.html aufrufen."
                : "Falsches Hauptpasswort. Bitte erneut versuchen.";
        input.value = "";
        input.focus();
        return;
    }

    applyRoleToUi("admin");
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("main-content").classList.remove("hidden");
    errorMsg.textContent = "";

    if (typeof loadAdminPage === "function") loadAdminPage();
}

document.addEventListener("DOMContentLoaded", function () {
    const passwordInput = document.getElementById("password-input");
    if (passwordInput) {
        passwordInput.addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                if (window.location.pathname.includes("admin.html")) {
                    checkAdminPassword();
                } else {
                    checkPassword();
                }
            }
        });
    }

    ensureAnonymousAuth()
        .then(async () => {
            const session = await fetchSession();
            const loginScreen = document.getElementById("login-screen");
            const mainContent = document.getElementById("main-content");
            const isAdminPage = window.location.pathname.includes("admin.html");

            if (!session) {
                clearRoleFromUi();
                return;
            }

            applyRoleToUi(session.role);

            if (isAdminPage && session.role !== "admin") {
                window.location.href = "index.html";
                return;
            }

            if (!loginScreen || !mainContent) return;
            loginScreen.classList.add("hidden");
            mainContent.classList.remove("hidden");

            if (typeof loadPhotobooks === "function") loadPhotobooks();
            if (typeof loadPhotobookViewer === "function") loadPhotobookViewer();
            if (typeof loadAdminPage === "function" && isAdminPage) loadAdminPage();
            if (typeof updateAdminLinkVisibility === "function") updateAdminLinkVisibility();
        })
        .catch((error) => {
            console.error("Auth init failed:", error);
        });
});
