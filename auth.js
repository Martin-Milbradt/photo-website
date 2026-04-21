const AUTH_CONFIG_COLLECTION = "config";
const AUTH_CONFIG_DOC = "auth";
// Pepper mixed into the hash before storage. Not a secret (anyone can read this
// file), but prevents trivial rainbow-table lookups against dumped Firestore data.
const PASSWORD_PEPPER = "photobook-auth-v1";

let authConfigCache = null;

// eslint-disable-next-line no-unused-vars
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${PASSWORD_PEPPER}:${password}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// eslint-disable-next-line no-unused-vars
async function loadAuthConfig() {
    if (authConfigCache) return authConfigCache;
    const doc = await db.collection(AUTH_CONFIG_COLLECTION).doc(AUTH_CONFIG_DOC).get();
    if (!doc.exists) {
        return null;
    }
    authConfigCache = doc.data();
    return authConfigCache;
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

async function verifyPassword(password) {
    const config = await loadAuthConfig();
    if (!config) return null;

    const hash = await hashPassword(password);
    if (hash === config.adminHash) return "admin";
    if (hash === config.friendsHash) return "friends";
    if (hash === config.viewerHash) return "family";
    return null;
}

// eslint-disable-next-line no-unused-vars
async function checkPassword() {
    const input = document.getElementById("password-input");
    const errorMsg = document.getElementById("login-error");
    const password = input.value.trim();

    const role = await verifyPassword(password);

    if (role === null) {
        const config = await loadAuthConfig();
        if (!config) {
            errorMsg.textContent = "Auth-Konfiguration fehlt. Bitte zuerst setup.html aufrufen.";
        } else {
            errorMsg.textContent = "Falsches Passwort. Bitte erneut versuchen.";
        }
        input.value = "";
        input.focus();
        return;
    }

    setAuthenticated(true);
    setAdmin(role === "admin");
    setUserType(role);
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("main-content").classList.remove("hidden");
    errorMsg.textContent = "";

    if (typeof loadPhotobooks === "function") {
        loadPhotobooks();
    }
    if (typeof loadPhotobookViewer === "function") {
        loadPhotobookViewer();
    }
    if (typeof updateAdminLinkVisibility === "function") {
        updateAdminLinkVisibility();
    }
}

// eslint-disable-next-line no-unused-vars
async function checkAdminPassword() {
    const input = document.getElementById("password-input");
    const errorMsg = document.getElementById("login-error");
    const password = input.value.trim();

    const role = await verifyPassword(password);

    if (role !== "admin") {
        const config = await loadAuthConfig();
        if (!config) {
            errorMsg.textContent = "Auth-Konfiguration fehlt. Bitte zuerst setup.html aufrufen.";
        } else {
            errorMsg.textContent = "Falsches Hauptpasswort. Bitte erneut versuchen.";
        }
        input.value = "";
        input.focus();
        return;
    }

    setAuthenticated(true);
    setAdmin(true);
    setUserType("admin");
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("main-content").classList.remove("hidden");
    errorMsg.textContent = "";

    if (typeof loadAdminPage === "function") {
        loadAdminPage();
    }
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

    if (window.location.pathname.includes("admin.html")) {
        if (!isAuthenticated() || !isAdmin()) {
            setAuthenticated(false);
            setAdmin(false);
            if (document.getElementById("login-screen")) {
                document.getElementById("login-screen").classList.remove("hidden");
            }
            if (document.getElementById("main-content")) {
                document.getElementById("main-content").classList.add("hidden");
            }
            if (isAuthenticated() && !isAdmin()) {
                window.location.href = "index.html";
            }
            return;
        }
    }

    if (isAuthenticated()) {
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("main-content").classList.remove("hidden");

        if (typeof loadPhotobooks === "function") {
            loadPhotobooks();
        }
        if (typeof loadPhotobookViewer === "function") {
            loadPhotobookViewer();
        }
        if (typeof loadAdminPage === "function" && window.location.pathname.includes("admin.html")) {
            loadAdminPage();
        }
        if (typeof updateAdminLinkVisibility === "function") {
            updateAdminLinkVisibility();
        }
    }
});
