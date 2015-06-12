/* -------------------- configuration -------------------- */

/*
 * The key below needs to be set individually by you if you want to use the Dropbox load/save feature.
 * To do that, first sign up with Dropbox (may require a specific developer / SDK sign-up), go to
 * https://www.dropbox.com/developers/apps and use "Create app" to add a new app. Call it, for instance,
 * "wwwsqldesigner", and give it the "App Folder" permission. Unter "OAuth 2", "Redirect URIs", add
 * the URL to the "dropbox-oauth-receiver.html" file on your server. E.g, if you install wwwsqldesigner
 * on your local web server under "http://localhost/sqldesigner/", then add
 * http://localhost/sqldesigner/dropbox-oauth-receiver.html as a Redirection URI.
 * Copy the shown "App key" and paste it here below:
 */
var dropboxAppKey = null; // "your app key";


/* -------------------- globals -------------------- */

function _(str) { /* getText */
	if (!(str in window.LOCALE)) { return str; }
	return window.LOCALE[str];
}

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

var DATATYPES = false;
var LOCALE = {};
var SQL = {};
