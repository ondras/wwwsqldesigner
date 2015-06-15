/* ------------------ minimize/restore bar ----------- */

SQL.Toggle = function(elm) {
	this._state = null;
	this._elm = elm;
	OZ.Event.add(elm, "click", this._click.bind(this));
	
	var defaultState = true;
	if (document.location.href.match(/toolbar=hidden/)) { defaultState = false; }
	this._switch(defaultState);
}

SQL.Toggle.prototype._click = function(e) {
	this._switch(!this._state);
}

SQL.Toggle.prototype._switch = function(state) {
	this._state = state;
	if (this._state) {
		OZ.$("bar").style.height = "";
	} else {
		OZ.$("bar").style.overflow = "hidden";
		OZ.$("bar").style.height = this._elm.offsetHeight + "px";
	}
	this._elm.className = (this._state ? "on" : "off");
}
