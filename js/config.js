var CONFIG = {
    AVAILABLE_DBS: ["mysql", "sqlite", "web2py", "mssql", "postgresql", "oracle", "sqlalchemy", "vfp9", "cubrid"],
    DEFAULT_DB: "mysql",
    AVAILABLE_LOCALES: ["ar", "cs", "de", "el", "en", "eo", "es", "fr", "hu", "it", "ja", "nl", "pl", "pt_BR", "ro", "ru", "sv", "zh"],
    DEFAULT_LOCALE: "en",
    AVAILABLE_BACKENDS: ["php-mysql", "php-blank", "php-file", "php-sqlite", "php-mysql+file", "php-postgresql", "php-pdo", "perl-file", "php-cubrid", "asp-file"],
    DEFAULT_BACKEND: ["php-mysql"],
    RELATION_THICKNESS: 2,
    RELATION_SPACING: 15,
    RELATION_COLORS: ["#323232", "#F44336", "#E91E63", "#9C27B0", "#3F51B5", "#673AB7", "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50", "#8BC34A", "#CDDC39", "#FFC107", "#FF5722", "#795548", "#607D8B"],
    STATIC_PATH: "",
    XHR_PATH: "",
    /*
     * The key below needs to be set individually by you if you want to use the Dropbox load/save feature.
     * To do that, first sign up with Dropbox (may require a specific developer / SDK sign-up), go to
     * https://www.dropbox.com/developers/apps and use "Create app" to add a new "Dropbox API app".
     * Limit the app to its own folder. Call it, for instance, "wwwsqldesigner".
     * Under "OAuth 2", "Redirect URIs", add the URL to the "dropbox-oauth-receiver.html" file on your server.
     * E.g, if you install wwwsqldesigner on your local web server under "http://localhost/sqldesigner/", then add
     * http://localhost/sqldesigner/dropbox-oauth-receiver.html as a Redirection URI.
     * Copy the shown "App key" and paste it here below instead of the null value:
     */
    DROPBOX_KEY: null, // such as: "d6stdscwewhl6sa"

    CUSTOM_TYPE_COLORS: {
        'numeric': '#2196F3',
        'character': '#8BC34A',
        'date & time': '#FFC107',
        'miscellaneous': '#795548'
    },
    SHORTCUTS: {
        saveLocal: {
            key: 'F2',
            code: false
        },
        loadLocal: {
            key: 'F4',
            code: false
        },
        addtable: {key: 'a', code: 65},
        edittable: {key: 'e', code: 69},
        editrow: {key: 'e', code: 69},
        addrow: {key: 'f', code: 70},
        removetable: {key: 'DELETE', code: 46},
        removerow: {key: 'DELETE', code: 46},
        uprow: {key: 'UP', code: 38},
        downrow: {key: 'DOWN', code: 40},
        foreigncreate: {key: 'x', code: 88},
        foreignconnect: {key: 'c', code: 67},
        zoomin: {key: '+', code: false},
        zoomout: {key: '-', code: false}
    }
};
