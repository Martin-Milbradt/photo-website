const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                ...globals.browser,
                // Firebase globals
                firebase: "readonly",
                db: "readonly",
                // Leaflet globals
                L: "readonly",
                // Functions from auth.js (loaded via script tags)
                getUserType: "readonly",
                isAdmin: "readonly",
                isAuthenticated: "readonly",
                setAuthenticated: "readonly",
                setAdmin: "readonly",
                setUserType: "readonly",
                checkPassword: "readonly",
                checkAdminPassword: "readonly",
                derivePasswordHash: "readonly",
                generateSalt: "readonly",
                loadAuthSalts: "readonly",
                // Functions from photobooks.js (loaded via script tags)
                getPhotobooks: "readonly",
                subscribeToPhotobooks: "readonly",
                addPhotobook: "readonly",
                updatePhotobook: "readonly",
                deletePhotobook: "readonly",
                getPhotobookById: "readonly",
                parseDateForSorting: "readonly",
                convertToWidgetviewerUrl: "readonly",
                extractUrlFromInput: "readonly",
                isValidPhotobookUrl: "readonly",
                geocodeLocation: "readonly",
                // Functions from main.js (loaded via script tags)
                loadPhotobooks: "readonly",
                prerenderPhotobooksFromCache: "readonly",
                renderPhotobooks: "readonly",
                unsubscribePhotobooks: "writable",
                // Functions from photobook-viewer.js (loaded via script tags)
                loadPhotobookViewer: "readonly",
                // Functions from admin.js (loaded via script tags)
                updateAdminLinkVisibility: "readonly",
                loadAdminPage: "readonly",
                unsubscribeAdminPhotobooks: "writable",
                deletePhotobookById: "readonly",
                toggleFriendsVisibility: "readonly",
                closeEditModal: "readonly",
                savePhotobookEdit: "readonly",
                editPhotobook: "readonly",
            },
        },
        rules: {
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "no-undef": "error",
            "no-redeclare": "off",
        },
    },
    {
        files: ["*.config.js", "eslint.config.js"],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
];
