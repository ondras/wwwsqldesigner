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
				"serverlist", "serverimport", "exportsvg"];
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
	OZ.Event.add(this.dom.exportsvg, "click", this.exportsvg.bind(this));
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
	var h = this.owner.getXhrHeaders();
	this.owner.window.showThrobber();
	OZ.Request(path, this.finish.bind(this), {xml:true, headers:h});
}

SQL.IO.prototype.getBoundingClientRect_relative_to_root = function(dom_elem) {
	// This does not work properly when zooming or pinch-zooming.
	// And, well, neither does the SQL.Relation.
	// More testing is needed.
	var box = dom_elem.getBoundingClientRect();
	var ret = {
		"left"  : box.x              + window.scrollX,
		"right" : box.x + box.width  + window.scrollX,
		"top"   : box.y              + window.scrollY,
		"bottom": box.y + box.height + window.scrollY,
		"width" : box.width,
		"height": box.height,
	};
	return ret;
}
SQL.IO.prototype.createSVGRectFromDOMElement = function(dom_elem, opts) {
	opts = opts || {};

	var box = this.getBoundingClientRect_relative_to_root(dom_elem);
	var rect = document.createElementNS(this.owner.svgNS, "rect");
	rect.setAttribute("x", box.left);
	rect.setAttribute("y", box.top);
	rect.setAttribute("width", box.width);
	rect.setAttribute("height", box.height);
	rect.setAttribute("fill", opts["fill"] || window.getComputedStyle(dom_elem)["background-color"] || "none");
	rect.setAttribute("stroke", opts["stroke"] || window.getComputedStyle(dom_elem)["border-top-color"] || "none");
	rect.setAttribute("stroke-width", opts["stroke-width"] || "0");
	return rect;
}
SQL.IO.prototype.createSVGTextFromDOMElement = function(dom_elem, opts) {
	opts = opts || {};

	var box = this.getBoundingClientRect_relative_to_root(dom_elem);
	var text = document.createElementNS(this.owner.svgNS, "text");
	text.textContent = dom_elem.textContent;
	text.setAttribute("y", box.top + box.height / 2);
	text.setAttribute("dominant-baseline", "central");
	switch (opts["text-align"] || window.getComputedStyle(dom_elem)["text-align"] || "left") {
		case "right":
		case "end":
			text.setAttribute("x", box.right);
			text.setAttribute("text-anchor", "end");
			break;
		case "center":
			text.setAttribute("x", box.left + (box.width / 2));
			text.setAttribute("text-anchor", "middle");
			break;
		case "left":
		case "justify":
		case "start":
		default:
			text.setAttribute("x", box.left);
			text.setAttribute("text-anchor", "start");
			break;
	}
	text.setAttribute("font-family", opts["font-family"] || window.getComputedStyle(dom_elem)["font-family"] || "sans-serif");
	text.setAttribute("font-size", opts["font-size"] || window.getComputedStyle(dom_elem)["font-size"] || "13");
	text.setAttribute("font-weight", opts["font-weight"] || window.getComputedStyle(dom_elem)["font-weight"] || "normal");
	text.setAttribute("font-style", opts["font-style"] || window.getComputedStyle(dom_elem)["font-style"] || "normal");
	text.setAttribute("fill", opts["fill"] || window.getComputedStyle(dom_elem)["color"] || "#000");

	return text;
}
SQL.IO.prototype.exportsvg = function() {
	if (!this.owner.vector || !this.owner.dom.svg) {
		alert("You have to enable 'Draw smooth connectors' and use a browser capable of SVG in order to export as SVG.");
		return;
	}

	// Deselecting everything.
	for (var i=0;i<this.owner.tables.length;i++) {
		this.owner.tables[i].deselect(); 
		for (var j=0;j<this.owner.tables[i].rows.length;j++) {
			this.owner.tables[i].rows[j].deselect(); 
		}
	}

	// Deep clone of document's SVG.
	var svg = this.owner.dom.svg.cloneNode(true);
	svg.setAttribute("xmlns", this.owner.svgNS);
	svg.setAttribute("xmlns:svg", this.owner.svgNS);

	var min_x = null;
	var min_y = null;
	var max_x = null;
	var max_y = null;

	for (var i=0;i<this.owner.tables.length;i++) {
		var t = this.owner.tables[i];

		var table_box = this.getBoundingClientRect_relative_to_root(t.dom.container);
		if (min_x === null || table_box.left   < min_x) min_x = table_box.left;
		if (min_y === null || table_box.top    < min_y) min_y = table_box.top;
		if (max_x === null || table_box.right  > max_x) max_x = table_box.right;
		if (max_y === null || table_box.bottom > max_y) max_y = table_box.bottom;

		var gt = document.createElementNS(this.owner.svgNS, "g");
		gt.classList.add("table");
		gt.dataset.title = t.getTitle();
		svg.appendChild(gt);

		var border = this.createSVGRectFromDOMElement(t.dom.container, { "stroke-width": 2 });
		gt.appendChild(border);

		var title = this.createSVGTextFromDOMElement(t.dom.title);
		gt.appendChild(title);

		for (var j=0;j<t.rows.length;j++) {
			var row = t.rows[j];

			var gr = document.createElementNS(this.owner.svgNS, "g");
			gr.classList.add("row");
			gr.dataset.title = row.getTitle();
			gr.dataset.typehint = row.getDataType().getAttribute("sql");
			gr.dataset.typesize = row.data.size;
			gr.dataset.null = (row.data.nll ? "1" : "0");
			gr.dataset.autoincrement = (row.data.ai ? "1" : "0");
			gt.appendChild(gr);

			var rect = this.createSVGRectFromDOMElement(row.dom.container);
			gr.appendChild(rect);
			var title = this.createSVGTextFromDOMElement(row.dom.title);
			title.classList.add("rowtitle");
			gr.appendChild(title);
			var typehint = this.createSVGTextFromDOMElement(row.dom.typehint);
			title.classList.add("rowtypehint");
			gr.appendChild(typehint);
		}
	}

	// Overall SVG dimensions (fit to content).
	if (min_x === null || min_y === null || max_x === null || max_y === null) {
		min_x = 0;
		min_y = 0;
		max_x = 3000;
		max_y = 3000;
	} else {
		min_x -= CONFIG.RELATION_SPACING;
		min_y -= CONFIG.RELATION_SPACING;
		max_x += CONFIG.RELATION_SPACING;
		max_y += CONFIG.RELATION_SPACING;
	}
	var width = max_x - min_x;
	var height = max_y - min_y;
	svg.setAttribute("width", width);
	svg.setAttribute("height", height);
	svg.setAttribute("viewBox", min_x + " " + min_y + " " + width + " " + height);

	var blob = new Blob([svg.outerHTML], {"type": "image/svg+xml"});

	// Trick to cause a file download:
	// https://stackoverflow.com/q/19327749
	var a = document.createElement("a");
	a.style.display = "none";
	a.href = window.URL.createObjectURL(blob);
	a.download = "wwwsqldesigner.svg";
	document.body.appendChild(a);
	a.click();
	setTimeout(function() {
		window.URL.revokeObjectURL(a.href);
		document.body.removeChild(a);
	}, 100);

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
	var h = this.owner.getXhrHeaders();
	h["Content-type"] = "application/xml";
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
	var h = this.owner.getXhrHeaders();
	this.owner.window.showThrobber();
	this.name = name;
	OZ.Request(url, this.loadresponse, {xml:true, headers:h});
}

SQL.IO.prototype.serverlist = function(e) {
	var bp = this.owner.getOption("xhrpath");
	var url = bp + "backend/"+this.dom.backend.value+"/?action=list";
	var h = this.owner.getXhrHeaders();
	this.owner.window.showThrobber();
	OZ.Request(url, this.listresponse, {headers:h});
}

SQL.IO.prototype.serverimport = function(e) {
	var name = prompt(_("serverimportprompt"), "");
	if (!name) { return; }
	var bp = this.owner.getOption("xhrpath");
	var url = bp + "backend/"+this.dom.backend.value+"/?action=import&database="+name;
	var h = this.owner.getXhrHeaders();
	this.owner.window.showThrobber();
	OZ.Request(url, this.importresponse, {xml:true, headers:h});
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
