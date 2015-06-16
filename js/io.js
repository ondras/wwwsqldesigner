SQL.IO = function(owner) {
	this.owner = owner;
	this._storages = [];
	this._currentStorage = null;

	this.dom = {
		container: OZ.$("io"),
		content: OZ.$("io-content"),
		seelct: null
	};

	this.dom.select = this.dom.container.querySelector("select");
	this.dom.ta = OZ.$("textarea");

	var ids = ["saveload", "storage", "quicksave", "clientsql"];
	for (var i=0;i<ids.length;i++) {
		var id = ids[i];
		var elm = OZ.$(id);
		this.dom[id] = elm;
		elm.innerHTML = _(id);
	}
	this.dom.quicksave.innerHTML += " (F2)";
	
	this.dom.container.parentNode.removeChild(this.dom.container);

	OZ.Event.add(this.dom.saveload, "click", this.click.bind(this));
	OZ.Event.add(this.dom.clientsql, "click", this._clientsql.bind(this));
	OZ.Event.add(this.dom.quicksave, "click", this._quicksave.bind(this));
	OZ.Event.add(this.dom.select, "change", this._storageChange.bind(this));
	OZ.Event.add(window, "keydown", this._keydown.bind(this));
	this._build();
}

SQL.IO.prototype._build = function() {
	var local = document.createElement("optgroup");
	local.label = "Local";
	this.dom.select.appendChild(local);

	var remote = document.createElement("optgroup");
	remote.label = "Remote";
	this.dom.select.appendChild(remote);

	this._addStorage(SQL.Storage.Browser, local);
	this._addStorage(SQL.Storage.Clipboard, local);
	this._addStorage(SQL.Storage.REST, remote);
	this._addStorage(SQL.Storage.Dropbox, remote);

	this._setStorage(2);
}

SQL.IO.prototype.getArea = function() {
	return this.dom.ta;
}

SQL.IO.prototype.click = function() { /* open io dialog */
	this.dom.ta.value = "";
	this.dom.clientsql.value = _("clientsql") + " (" + window.DATATYPES.getAttribute("db") + ")";
	this.owner.window.open(_("saveload"), this.dom.container);

	var index = this._storages.indexOf(this._currentStorage);
	this._setStorage(index);
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

SQL.IO.prototype._clientsql = function() {
	var bp = this.owner.getOption("staticpath");
	var path = bp + "db/"+window.DATATYPES.getAttribute("db")+"/output.xsl";
	this.owner.window.showThrobber();
	OZ.Request(path, this._transform.bind(this), {xml:true});
}

SQL.IO.prototype._transform = function(xslDoc) {
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

SQL.IO.prototype._quicksave = function(e) {
	this._currentStorage.quicksave(e);
}

SQL.IO.prototype._keydown = function(e) {
	switch (e.keyCode) {
		case 113:
			if (OZ.opera) {
				e.preventDefault();
			}
			this._currentStorage.quicksave(e);
		break;
	}
}

SQL.IO.prototype._addStorage = function(ctor, parent) {
	var storage = new ctor(this);
	if (!storage.isSupported()) { return; }

	var option = storage.getOption();
	option.value = this._storages.length;
	parent.appendChild(option);
	this._storages.push(storage);
}

SQL.IO.prototype._storageChange = function(e) {
	var index = Number(e.target.selectedIndex);
	this._setStorage(index);
}

SQL.IO.prototype._setStorage = function(index) {
	this.dom.select.selectedIndex = index;
	this._currentStorage && this._currentStorage.deactivate();
	this.dom.content.innerHTML = "";

	this._currentStorage = this._storages[index];
	this._currentStorage.activate(this.dom.content);
}
