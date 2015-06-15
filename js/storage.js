SQL.Storage = function(owner) {
	this.owner = owner;
	this._keyword = "";
	this._dom = {
		option: document.createElement("option"),
		buttons: {}
	}
}

SQL.Storage.prototype.getOption = function() {
	return this._dom.option;
}

SQL.Storage.prototype.isSupported = function() {
	return true;
}

SQL.Storage.prototype.activate = function(parent) {
	for (var p in this._dom.buttons) {
		parent.appendChild(this._dom.buttons[p]);
	}
}

SQL.Storage.prototype.deactivate = function() {
}

SQL.Storage.prototype.quicksave = function() {
	if (!this._keyword) { return; }
	this._save(this._keyword);
}

SQL.Storage.prototype._save = function(keyword) {
	this._keyword = keyword;
}

SQL.Storage.prototype._load = function(keyword) {
	this._keyword = keyword;
}

SQL.Storage.prototype._buildButton = function(labelKey, method) {
	var button = document.createElement("button");
	button.innerHTML = _(labelKey);
	this._dom.buttons[labelKey] = button;
	OZ.Event.add(button, "click", this[method].bind(this));
}
