SQL.Storage.Browser = function(owner) {
	SQL.Storage.call(this, owner);
	this._dom.option.innerHTML = _("storage.browser");
	this._prefix = "wwwsqldesigner_databases_";

	this._buildButton("clientlocalsave", "_clickSave");
	this._buildButton("clientlocalload", "_clickLoad");
	this._dom.list = document.createElement("select");
}
SQL.Storage.Browser.prototype = Object.create(SQL.Storage.prototype);

SQL.Storage.Browser.prototype.activate = function(parent) {
	parent.appendChild(this._dom.list);

	SQL.Storage.prototype.activate.call(this, parent);

	this._list();
}

SQL.Storage.Browser.prototype._save = function(keyword) {
	var xml = this.owner.owner.toXML();
	if (xml.length >= (5*1024*1024)/2) { /* this is a very big db structure... */
		alert("Warning: your database structure is above 5 megabytes in size, this is above the localStorage single key limit allowed by some browsers, example Mozilla Firefox 10");
		return;
	}

	var key = this._prefix + keyword;

	try {
		localStorage.setItem(key, xml);
		if (localStorage.getItem(key) != xml) { throw new Error("Content verification failed"); }
		this._keyword = keyword;
		this._list();
	} catch (e) {
		alert("Error saving database structure to localStorage! ("+e.message+")");
	}
}

SQL.Storage.Browser.prototype._load = function(keyword) {
	try {
		var xml = localStorage.getItem(this._prefix + keyword);
		if (!xml) { throw new Error("No data available"); }
	} catch (e) {
		alert("Error loading database structure from localStorage! ("+e.message+")");
		return;
	}
	
	this.owner.fromXMLText(xml);
	this._keyword = keyword;
}

SQL.Storage.Browser.prototype._clickSave = function(e) {
	var keyword = this._dom.list.value;
	if (!keyword) {
		keyword = prompt(_("serversaveprompt"));
		if (!keyword) { return; }
	}

	this._save(keyword);
}

SQL.Storage.Browser.prototype._clickLoad = function(e) {
	var keyword = this._dom.list.value;
	if (!keyword) {
		alert("Error loading saved data");
		return;
	}

	this._load(keyword);
}

SQL.Storage.Browser.prototype._list = function() {
	var re = new RegExp("^" + this._prefix);
	var localLen = localStorage.length;
	var results = [];

	for (var i = 0; i<localStorage.length; i++) {
		var key = localStorage.key(i);
		if (!key.match(re)) { continue; }
		results.push(key.substring(this._prefix.length));
	}

	this._dom.list.innerHTML = "";

	var empty = document.createElement("option");
	empty.innerHTML = "[create a new design]";
	empty.value = "";
	this._dom.list.appendChild(empty);

	results.forEach(function(result) {
		var option = document.createElement("option");
		option.innerHTML = result;
		this._dom.list.appendChild(option);
	}.bind(this));

	this._dom.list.value = this._keyword;
}
