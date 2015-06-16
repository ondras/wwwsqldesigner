var CONFIG = {
	AVAILABLE_DBS: ["mysql", "sqlite", "web2py", "mssql", "postgresql", "oracle", "sqlalchemy", "vfp9", "cubrid"],
	DEFAULT_DB: "mysql",

	AVAILABLE_LOCALES: ["ar", "cs", "de", "el", "en", "eo", "es", "fr", "hu", "it", "ja", "nl", "pl", "pt_BR", "ro", "ru", "sv", "zh"],
	DEFAULT_LOCALE: "en",
	
	AVAILABLE_BACKENDS: ["php-mysql", "php-blank", "php-file", "php-sqlite", "php-mysql+file", "php-postgresql", "php-pdo", "perl-file", "php-cubrid", "asp-file"],
	DEFAULT_BACKEND: ["php-mysql"],

	RELATION_THICKNESS: 2,
	RELATION_SPACING: 15,
	RELATION_COLORS: ["#000", "#800", "#080", "#008", "#088", "#808", "#088"],
	
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
	DROPBOX_KEY: null // such as: "d6stdscwewhl6sa"

}
