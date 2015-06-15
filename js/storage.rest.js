SQL.Storage.REST = function(owner) {
	SQL.Storage.call(this, owner);
	this._dom.option.innerHTML = _("storage.rest");

	this._dom.label = document.createElement("label");
	this._dom.label.innerHTML = _("backendlabel");

	this._dom.backend = document.createElement("select");
	this._dom.label.appendChild(this._dom.backend);
	this._buildButton("serversave", "_clickSave");
	this._buildButton("serverload", "_clickLoad");
	this._buildButton("serverlist", "_clickList");
	this._buildButton("serverimport", "_clickImport");

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
		var o = document.createElement("option");
		o.value = bs[i];
		o.innerHTML = bs[i];
		this._dom.backend.appendChild(o);
		if (bs[i] == be) { this._dom.backend.selectedIndex = i; }
	}

	var url = window.location.href;
	var r = url.match(/keyword=([^&]+)/);
	if (r) { this._load(r[1]); }
}
SQL.Storage.REST.prototype = Object.create(SQL.Storage.prototype);

SQL.Storage.REST.prototype.activate = function(parent) {
	parent.appendChild(this._dom.label);
	SQL.Storage.prototype.activate.call(this, parent);
}

SQL.Storage.REST.prototype._save = function(keyword) {
	var xml = this.owner.owner.toXML();
	var bp = this.owner.owner.getOption("xhrpath");
	var url = bp + "backend/"+this._dom.backend.value+"/?action=save&keyword="+encodeURIComponent(keyword);
	var h = {"Content-type":"application/xml"};
	this.owner.owner.window.showThrobber();
	this.owner.owner.setTitle(keyword);
	this._keyword = keyword;
	OZ.Request(url, this._responseSave.bind(this), {xml:true, method:"post", data:xml, headers:h});
}

SQL.Storage.REST.prototype._load = function(keyword) {
	var bp = this.owner.owner.getOption("xhrpath");
	var url = bp + "backend/"+this._dom.backend.value+"/?action=load&keyword="+encodeURIComponent(keyword);
	this.owner.owner.window.showThrobber();
	this._keyword = keyword;
	OZ.Request(url, this._responseLoad.bind(this), {xml:true});
}

SQL.Storage.REST.prototype._clickSave = function(e) {
	var keyword = prompt(_("serversaveprompt"), this._keyword);
	if (!keyword) { return; }
	this._save(keyword);
}

SQL.Storage.REST.prototype._clickLoad = function(e) {
	var keyword = prompt(_("serverloadprompt"), this._keyword);
	if (!keyword) { return; }
	this._load(keyword);
}

SQL.Storage.REST.prototype._clickList = function(e) {
	var bp = this.owner.owner.getOption("xhrpath");
	var url = bp + "backend/"+this._dom.backend.value+"/?action=list";
	this.owner.owner.window.showThrobber();
	OZ.Request(url, this._responseList.bind(this));
}

SQL.Storage.REST.prototype._clickImport = function(e) {
	var name = prompt(_("serverimportprompt"), "");
	if (!name) { return; }
	var bp = this.owner.owner.getOption("xhrpath");
	var url = bp + "backend/"+this._dom.backend.value+"/?action=import&database="+name;
	this.owner.owner.window.showThrobber();
	OZ.Request(url, this._responseImport.bind(this), {xml:true});
}

SQL.Storage.REST.prototype._check = function(code) {
	switch (code) {
		case 201:
		case 404:
		case 500:
		case 501:
		case 503:
			var lang = "http"+code;
			this.owner.getArea().value = _("httpresponse")+": "+_(lang);
			return false;
		break;
		default: return true;
	}
}

SQL.Storage.REST.prototype._responseSave = function(data, code) {
	this.owner.owner.window.hideThrobber();
	this._check(code);
}

SQL.Storage.REST.prototype._responseLoad = function(data, code) {
	this.owner.owner.window.hideThrobber();
	if (!this._check(code)) { return; }
	this.owner.fromXML(data);
	this.owner.owner.setTitle(this._keyword);
}

SQL.Storage.REST.prototype._responseList = function(data, code) {
	this.owner.owner.window.hideThrobber();
	if (!this._check(code)) { return; }
	this.owner.getArea().value = data;
}

SQL.Storage.REST.prototype._responseImport = function(data, code) {
	this.owner.owner.window.hideThrobber();
	if (!this._check(code)) { return; }
	if (this.owner.fromXML(data)) {
		this.owner.owner.alignTables();
	}
}
