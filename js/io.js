SQL.IO = function(owner) {
	this.owner = owner;
	this._name = ""; /* last used name with server load/save */
	this.lastUsedName = ""; /* last used name with local storage or dropbox load/save */
	this.dom = {
		container:OZ.$("io")
	};

	var ids = ["saveload","clientlocalsave", "clientsave", "clientlocalload", "clientlocallist","clientload", "clientsql", 
				"dropboxsave", "dropboxload", "dropboxlist",
				"quicksave", "serversave", "serverload",
				"serverlist", "serverimport"];
	for (var i=0;i<ids.length;i++) {
		var id = ids[i];
		var elm = OZ.$(id);
		this.dom[id] = elm;
		elm.value = _(id);
	}
	
	this.dom.quicksave.value += " (F2)";

	var ids = ["client","server","output","backendlabel"];
	for (var i=0;i<ids.length;i++) {
		var id = ids[i];
		var elm = OZ.$(id);
		elm.innerHTML = _(id);
	}
	
	this.dom.ta = OZ.$("textarea");
	this.dom.backend = OZ.$("backend");

	/* init dropbox before hiding the container so it can adjust its buttons */	
	this.dropBoxInit();

	this.dom.container.parentNode.removeChild(this.dom.container);
	this.dom.container.style.visibility = "";
	
	this.saveresponse = this.saveresponse.bind(this);
	this.loadresponse = this.loadresponse.bind(this);
	this.listresponse = this.listresponse.bind(this);
	this.importresponse = this.importresponse.bind(this);
	
	OZ.Event.add(this.dom.saveload, "click", this.click.bind(this));
	OZ.Event.add(this.dom.clientlocalsave, "click", this.clientlocalsave.bind(this));
	OZ.Event.add(this.dom.clientsave, "click", this.clientsave.bind(this));
	OZ.Event.add(this.dom.clientlocalload, "click", this.clientlocalload.bind(this));
	OZ.Event.add(this.dom.clientlocallist, "click", this.clientlocallist.bind(this));
	OZ.Event.add(this.dom.clientload, "click", this.clientload.bind(this));
	OZ.Event.add(this.dom.dropboxload, "click", this.dropboxload.bind(this));
	OZ.Event.add(this.dom.dropboxsave, "click", this.dropboxsave.bind(this));
	OZ.Event.add(this.dom.dropboxlist, "click", this.dropboxlist.bind(this));
	OZ.Event.add(this.dom.clientsql, "click", this.clientsql.bind(this));
	OZ.Event.add(this.dom.quicksave, "click", this.quicksave.bind(this));
	OZ.Event.add(this.dom.serversave, "click", this.serversave.bind(this));
	OZ.Event.add(this.dom.serverload, "click", this.serverload.bind(this));
	OZ.Event.add(this.dom.serverlist, "click", this.serverlist.bind(this));
	OZ.Event.add(this.dom.serverimport, "click", this.serverimport.bind(this));
	OZ.Event.add(document, "keydown", this.press.bind(this));
	this.build();
}

SQL.IO.prototype.build = function() {
	OZ.DOM.clear(this.dom.backend);

	var bs = CONFIG.AVAILABLE_BACKENDS;
	var be = CONFIG.DEFAULT_BACKEND;
	var r = window.location.search.substring(1).match(/backend=([^&]*)/);
	if (r) {
		req = r[1];
		if (bs.indexOf(req) != -1) {
		  be = req;
		}
	}
	for (var i=0;i<bs.length;i++) {
		var o = OZ.DOM.elm("option");
		o.value = bs[i];
		o.innerHTML = bs[i];
		this.dom.backend.appendChild(o);
		if (bs[i] == be) { this.dom.backend.selectedIndex = i; }
	}
}

SQL.IO.prototype.click = function() { /* open io dialog */
	this.build();
	this.dom.ta.value = "";
	this.dom.clientsql.value = _("clientsql") + " (" + window.DATATYPES.getAttribute("db") + ")";
	this.owner.window.open(_("saveload"),this.dom.container);
}

SQL.IO.prototype.fromXMLText = function(xml) {
	try {
		if (window.DOMParser) {
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(xml, "text/xml");
		} else if (window.ActiveXObject || "ActiveXObject" in window) {
			var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.loadXML(xml);
		} else {
			throw new Error("No XML parser available.");
		}
	} catch(e) { 
		alert(_("xmlerror")+': '+e.message);
		return;
	}
	this.fromXML(xmlDoc);
}

SQL.IO.prototype.fromXML = function(xmlDoc) {
	if (!xmlDoc || !xmlDoc.documentElement) {
		alert(_("xmlerror")+': Null document');
		return false; 
	}
	this.owner.fromXML(xmlDoc.documentElement);
	this.owner.window.close();
	return true;
}

SQL.IO.prototype.clientsave = function() {
	var xml = this.owner.toXML();
	this.dom.ta.value = xml;
}

SQL.IO.prototype.clientload = function() {
	var xml = this.dom.ta.value;
	if (!xml) {
		alert(_("empty"));
		return;
	}

	this.fromXMLText(xml);
}

SQL.IO.prototype.promptName = function(title, suffix) {
	var lastUsedName = this.owner.getOption("lastUsedName") || this.lastUsedName;
	var name = prompt(_(title), lastUsedName);
	if (!name) { return null; }
	if (suffix && name.endsWith(suffix)) {
		// remove suffix from name
		name = name.substr(0, name.length-4);
	}
	this.owner.setOption("lastUsedName", name);
	this.lastUsedName = name;	// save this also in variable in case cookies are disabled
	return name;
}

SQL.IO.prototype.clientlocalsave = function() {
	if (!window.localStorage) { 
		alert("Sorry, your browser does not seem to support localStorage.");
		return;
	}
	
	var xml = this.owner.toXML();
	if (xml.length >= (5*1024*1024)/2) { /* this is a very big db structure... */
		alert("Warning: your database structure is above 5 megabytes in size, this is above the localStorage single key limit allowed by some browsers, example Mozilla Firefox 10");
		return;
	}

	var key = this.promptName("serversaveprompt");
	if (!key) { return; }

	key = "wwwsqldesigner_databases_" + (key || "default");
	
	try {
		localStorage.setItem(key, xml);
		if (localStorage.getItem(key) != xml) { throw new Error("Content verification failed"); }
	} catch (e) {
		alert("Error saving database structure to localStorage! ("+e.message+")");
	}
}

SQL.IO.prototype.clientlocalload = function() {
	if (!window.localStorage) { 
		alert("Sorry, your browser does not seem to support localStorage.");
		return;
	}
	
	var key = this.promptName("serverloadprompt");
	if (!key) { return; }

	key = "wwwsqldesigner_databases_" + (key || "default");
	
	try {
		var xml = localStorage.getItem(key);
		if (!xml) { throw new Error("No data available"); }
	} catch (e) {
		alert("Error loading database structure from localStorage! ("+e.message+")");
		return;
	}
	
	this.fromXMLText(xml);
}

SQL.IO.prototype.clientlocallist = function() {
	if (!window.localStorage) { 
		alert("Sorry, your browser does not seem to support localStorage.");
		return;
	}
	
	/* --- Define some useful vars --- */
	var baseKeysName = "wwwsqldesigner_databases_";
	var localLen = localStorage.length;
	var data = "";
	var schemasFound = false;
	var code = 200;
	
	/* --- work --- */
	try {
		for (var i = 0; i< localLen; ++i) {
			var key = localStorage.key(i);
			if((new RegExp(baseKeysName)).test(key)) {
				var result = key.substring(baseKeysName.length);
				schemasFound = true;
				data += result + "\n";
			}
		}
		if (!schemasFound) {
			throw new Error("No data available");
		}
	}  catch (e) {
		alert("Error loading database names from localStorage! ("+e.message+")");
		return;
	}
	this.listresponse(data, code);
}

/* ------------------------- Dropbox start ------------------------ */

/**
 * The following code uses this lib: https://github.com/dropbox/dropbox-js
 */
SQL.IO.prototype.dropBoxInit = function() {
	if (CONFIG.DROPBOX_KEY) {
		this.dropboxClient = new Dropbox.Client({ key: CONFIG.DROPBOX_KEY });
	} else {
		this.dropboxClient = null;
		// Hide the Dropbox buttons
		var elems = document.querySelectorAll("[id^=dropbox]");	// gets all tags whose id start with "dropbox"
		[].slice.call(elems).forEach(
			function(elem) { elem.style.display = "none"; }
		);
	}
}

SQL.IO.prototype.showDropboxError = function(error) {
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

SQL.IO.prototype.showDropboxAuthenticate = function(connectedCallBack) {
	if (!this.dropboxClient) return false;

	// We want to use a popup window for authentication as the default redirection won't work for us as it'll make us lose our schema data
	var href = window.location.href;
	var prefix = href.substring(0, href.lastIndexOf('/')) + "/";
	this.dropboxClient.authDriver(new Dropbox.AuthDriver.Popup({ receiverUrl: prefix+"dropbox-oauth-receiver.html" }));

	// Now let's authenticate us
	var sql_io = this;
	sql_io.dropboxClient.authenticate( function(error, client) {
		if (error) {
			sql_io.showDropboxError(error);
		} else {
			// We're authenticated
			connectedCallBack();
		}
		return;
	});

	return true;
}

SQL.IO.prototype.dropboxsave = function() {
	var sql_io = this;
	sql_io.showDropboxAuthenticate( function() {
		var key = sql_io.promptName("serversaveprompt", ".xml");
		if (!key) { return; }

		var filename = (key || "default") + ".xml";
	
		sql_io.listresponse("Saving...", 200);
		var xml = sql_io.owner.toXML();
		sql_io.dropboxClient.writeFile(filename, xml, function(error, stat) {
			if (error) {
				sql_io.listresponse("", 200);
				return sql_io.showDropboxError(error);
			}
			sql_io.listresponse(filename+" "+_("was saved to Dropbox"), 200);
		});
	});
}

SQL.IO.prototype.dropboxload = function() {
	var sql_io = this;
	sql_io.showDropboxAuthenticate( function() {
		var key = sql_io.promptName("serverloadprompt", ".xml");
		if (!key) { return; }

		var filename = (key || "default") + ".xml";
	
		sql_io.listresponse("Loading...", 200);
		sql_io.dropboxClient.readFile(filename, function(error, data) {
			sql_io.listresponse("", 200);
			if (error) {
				return sql_io.showDropboxError(error);
			}
			sql_io.fromXMLText(data);
		});
	});
}

SQL.IO.prototype.dropboxlist = function() {
	var sql_io = this;
	sql_io.showDropboxAuthenticate( function() {
		sql_io.listresponse("Loading...", 200);
		sql_io.dropboxClient.readdir("/", function(error, entries) {
			if (error) {
				sql_io.listresponse("", 200);
				return sql_io.showDropboxError(error);
			}
			var data = entries.join("\n")+"\n";
			sql_io.listresponse(data, 200);
		});
	});
}


/* ------------------------- Dropbox end ------------------------ */

SQL.IO.prototype.clientsql = function() {
	var bp = this.owner.getOption("staticpath");
	var path = bp + "db/"+window.DATATYPES.getAttribute("db")+"/output.xsl";
	this.owner.window.showThrobber();
	OZ.Request(path, this.finish.bind(this), {xml:true});
}

SQL.IO.prototype.finish = function(xslDoc) {
	this.owner.window.hideThrobber();
	var xml = this.owner.toXML();
	var sql = "";
	try {
		if (window.XSLTProcessor && window.DOMParser) {
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(xml, "text/xml");
			var xsl = new XSLTProcessor();
			xsl.importStylesheet(xslDoc);
			var result = xsl.transformToDocument(xmlDoc);
			sql = result.documentElement.textContent;
		} else if (window.ActiveXObject || "ActiveXObject" in window) {
			var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.loadXML(xml);
			sql = xmlDoc.transformNode(xslDoc);
		} else {
			throw new Error("No XSLT processor available");
		}
	} catch(e) {
		alert(_("xmlerror")+': '+e.message);
		return;
	}
	this.dom.ta.value = sql.trim();
}

SQL.IO.prototype.serversave = function(e, keyword) {
	var name = keyword || prompt(_("serversaveprompt"), this._name);
	if (!name) { return; }
	this._name = name;
	var xml = this.owner.toXML();
	var bp = this.owner.getOption("xhrpath");
	var url = bp + "backend/"+this.dom.backend.value+"/?action=save&keyword="+encodeURIComponent(name);
	var h = {"Content-type":"application/xml"};
	this.owner.window.showThrobber();
	this.owner.setTitle(name);
	OZ.Request(url, this.saveresponse, {xml:true, method:"post", data:xml, headers:h});
}

SQL.IO.prototype.quicksave = function(e) {
	this.serversave(e, this._name);
}

SQL.IO.prototype.serverload = function(e, keyword) {
	var name = keyword || prompt(_("serverloadprompt"), this._name);
	if (!name) { return; }
	this._name = name;
	var bp = this.owner.getOption("xhrpath");
	var url = bp + "backend/"+this.dom.backend.value+"/?action=load&keyword="+encodeURIComponent(name);
	this.owner.window.showThrobber();
	this.name = name;
	OZ.Request(url, this.loadresponse, {xml:true});
}

SQL.IO.prototype.serverlist = function(e) {
	var bp = this.owner.getOption("xhrpath");
	var url = bp + "backend/"+this.dom.backend.value+"/?action=list";
	this.owner.window.showThrobber();
	OZ.Request(url, this.listresponse);
}

SQL.IO.prototype.serverimport = function(e) {
	var name = prompt(_("serverimportprompt"), "");
	if (!name) { return; }
	var bp = this.owner.getOption("xhrpath");
	var url = bp + "backend/"+this.dom.backend.value+"/?action=import&database="+name;
	this.owner.window.showThrobber();
	OZ.Request(url, this.importresponse, {xml:true});
}

SQL.IO.prototype.check = function(code) {
	switch (code) {
		case 201:
		case 404:
		case 500:
		case 501:
		case 503:
			var lang = "http"+code;
			this.dom.ta.value = _("httpresponse")+": "+_(lang);
			return false;
		break;
		default: return true;
	}
}

SQL.IO.prototype.saveresponse = function(data, code) {
	this.owner.window.hideThrobber();
	this.check(code);
}

SQL.IO.prototype.loadresponse = function(data, code) {
	this.owner.window.hideThrobber();
	if (!this.check(code)) { return; }
	this.fromXML(data);
	this.owner.setTitle(this.name);
}

SQL.IO.prototype.listresponse = function(data, code) {
	this.owner.window.hideThrobber();
	if (!this.check(code)) { return; }
	this.dom.ta.value = data;
}

SQL.IO.prototype.importresponse = function(data, code) {
	this.owner.window.hideThrobber();
	if (!this.check(code)) { return; }
	if (this.fromXML(data)) {
		this.owner.alignTables();
	}
}

SQL.IO.prototype.press = function(e) {
	switch (e.keyCode) {
		case 113:
			if (OZ.opera) {
				e.preventDefault();
			}
			this.quicksave(e);
		break;
	}
}
