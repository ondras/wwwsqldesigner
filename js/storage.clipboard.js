SQL.Storage.Clipboard = function(owner) {
	SQL.Storage.call(this, owner);
	this._dom.option.innerHTML = _("storage.clipboard");

	this._buildButton("clientsave", "_save");
	this._buildButton("clientload", "_load");
}
SQL.Storage.Clipboard.prototype = Object.create(SQL.Storage.prototype);

SQL.Storage.Clipboard.prototype._save = function() {
	this.owner.getArea().value = this.owner.owner.toXML();
}

SQL.Storage.Clipboard.prototype._load = function() {
	var xml = this.owner.getArea().value;
	if (!xml) {
		alert(_("empty"));
		return;
	}

	this.owner.fromXMLText(xml);
}
