/**
 * The following code uses this lib: https://github.com/dropbox/dropbox-js
 */
SQL.Storage.Dropbox = function(owner) {
	SQL.Storage.call(this, owner);
	this._dom.option.innerHTML = _("storage.dropbox");

	if (CONFIG.DROPBOX_KEY) { this.dropboxClient = new Dropbox.Client({ key: CONFIG.DROPBOX_KEY }); }

	this._buildButton("dropboxsave", "_clickSave");
	this._buildButton("dropboxload", "_clickLoad");
	this._buildButton("dropboxlist", "_clickList");

}
SQL.Storage.Dropbox.prototype = Object.create(SQL.Storage.prototype);

SQL.Storage.Dropbox.prototype.isSupported = function() {
	return !!CONFIG.DROPBOX_KEY;
}

SQL.Storage.Dropbox.prototype.showDropboxError = function(error) {
	var prefix = _("Dropbox error")+": ";
	var msg = error.status;

	switch (error.status) {
	  case Dropbox.ApiError.INVALID_TOKEN:
		// If you're using dropbox.js, the only cause behind this error is that
		// the user token expired.
		// Get the user through the authentication flow again.
		msg = _("Token expired - retry the operation, authenticating again with Dropbox");
		this.dropboxClient.reset();
		break;

	  case Dropbox.ApiError.NOT_FOUND:
		// The file or folder you tried to access is not in the user's Dropbox.
		// Handling this error is specific to your application.
		msg = _("File not found");
		break;

	  case Dropbox.ApiError.OVER_QUOTA:
		// The user is over their Dropbox quota.
		// Tell them their Dropbox is full. Refreshing the page won't help.
		msg = _("Dropbox is full");
		break;

	  case Dropbox.ApiError.RATE_LIMITED:
		// Too many API requests. Tell the user to try again later.
		// Long-term, optimize your code to use fewer API calls.
		break;

	  case Dropbox.ApiError.NETWORK_ERROR:
		// An error occurred at the XMLHttpRequest layer.
		// Most likely, the user's network connection is down.
		// API calls will not succeed until the user gets back online.
		msg = _("Network error");
		break;

	  case Dropbox.ApiError.INVALID_PARAM:
	  case Dropbox.ApiError.OAUTH_ERROR:
	  case Dropbox.ApiError.INVALID_METHOD:
	  default:
		// Caused by a bug in dropbox.js, in your application, or in Dropbox.
		// Tell the user an error occurred, ask them to refresh the page.
	}

	alert (prefix+msg);
};

SQL.Storage.Dropbox.prototype.authenticate = function(connectedCallBack) {
	if (!this.dropboxClient) return false;

	// We want to use a popup window for authentication as the default redirection
	//  won't work for us as it'll make us lose our schema data
	var href = window.location.href;
	var prefix = href.substring(0, href.lastIndexOf("/")) + "/";
	this.dropboxClient.authDriver(new Dropbox.AuthDriver.Popup({ receiverUrl: prefix+"dropbox-oauth-receiver.html" }));

	// Now let's authenticate us
	this.dropboxClient.authenticate( function(error, client) {
		if (error) {
			this.showDropboxError(error);
		} else {
			// We're authenticated
			connectedCallBack();
		}
	}.bind(this));

	return true;
}

SQL.Storage.Dropbox.prototype._save = function(keyword) {
	this.authenticate( function() {
		var xml = this.owner.owner.toXML();
		var filename = keyword + ".xml";
		this.owner.owner.window.showThrobber();

		this.dropboxClient.writeFile(filename, xml, function(error, stat) {
			this.owner.owner.window.hideThrobber();
			if (error) {
				this.showDropboxError(error);
			} else {
				this._keyword = keyword;
				this.owner.getArea().value = filename+" "+_("was saved to Dropbox");
			}
		}.bind(this));
	}.bind(this));
}

SQL.Storage.Dropbox.prototype._load = function(keyword) {
	this.authenticate( function() {
		var filename = keyword + ".xml";
		this.owner.owner.window.showThrobber();

		this.dropboxClient.readFile(filename, function(error, data) {
			this.owner.owner.window.hideThrobber();
			if (error) {
				this.showDropboxError(error);
			} else {
				this.owner.fromXMLText(data);
				this._keyword = keyword;
			}
		}.bind(this));
	}.bind(this));
}

SQL.Storage.Dropbox.prototype._clickSave = function(e) {
	var keyword = prompt(_("serversaveprompt"), this._keyword);
	if (!keyword) { return; }
	this._save(keyword);
}

SQL.Storage.Dropbox.prototype._clickLoad = function(e) {
	var keyword = prompt(_("serverloadprompt"), this._keyword);
	if (!keyword) { return; }
	this._load(keyword);
}

SQL.Storage.Dropbox.prototype._clickList = function(e) {
	this.authenticate( function() {
		this.owner.owner.window.showThrobber();
		this.dropboxClient.readdir("/", function(error, entries) {
			this.owner.owner.window.hideThrobber();
			if (error) {
				this.showDropboxError(error);
			} else {
				this.owner.getArea().value = entries.join("\n")+"\n";
			}
		}.bind(this));
	}.bind(this));
}
