/* --------------------- window ------------ */

SQL.Window = function(owner) {
	this.owner = owner;
	this.dom = {
		container:OZ.$("window"),
		background:OZ.$("background"),
		ok:OZ.$("windowok"),
		cancel:OZ.$("windowcancel"),
		title:OZ.$("windowtitle"),
		content:OZ.$("windowcontent"),
		throbber:OZ.$("throbber")
	}
	this.dom.ok.value = _("windowok");
	this.dom.cancel.value = _("windowcancel");
	this.dom.throbber.alt = this.dom.throbber.title = _("throbber");
	OZ.Event.add(this.dom.ok, "click", this.ok.bind(this));
	OZ.Event.add(this.dom.cancel, "click", this.close.bind(this));
	OZ.Event.add(document, "keydown", this.key.bind(this));
	
	this.sync = this.sync.bind(this);
	
	OZ.Event.add(window, "scroll", this.sync);
	OZ.Event.add(window, "resize", this.sync);
	this.state = 0;
	this.hideThrobber();
	
	this.sync();
}

SQL.Window.prototype.showThrobber = function() {
	this.dom.throbber.style.visibility = "";
}

SQL.Window.prototype.hideThrobber = function() {
	this.dom.throbber.style.visibility = "hidden";
}

SQL.Window.prototype.open = function(title, content, callback) {
	this.state = 1;
	this.callback = callback;
	while (this.dom.title.childNodes.length > 1) { this.dom.title.removeChild(this.dom.title.childNodes[1]); }

	var txt = OZ.DOM.text(title);
	this.dom.title.appendChild(txt);
	this.dom.background.style.visibility = "visible";
	OZ.DOM.clear(this.dom.content);
	this.dom.content.appendChild(content);
	
	var win = OZ.DOM.win();
	var scroll = OZ.DOM.scroll();
	this.dom.container.style.left = Math.round(scroll[0] + (win[0] - this.dom.container.offsetWidth)/2)+"px";
	this.dom.container.style.top = Math.round(scroll[1] + (win[1] - this.dom.container.offsetHeight)/2)+"px";
	
	this.dom.cancel.style.visibility = (this.callback ? "" : "hidden");
	this.dom.container.style.visibility = "visible";

	var formElements = ["input","select","textarea"];
	var all = this.dom.container.getElementsByTagName("*");
	for (var i=0;i<all.length;i++) {
		if (formElements.indexOf(all[i].tagName.toLowerCase()) != -1) {
			all[i].focus();
			break;
		}
	}
}

SQL.Window.prototype.key = function(e) {
	if (!this.state) { return; }
	if (e.keyCode == 13) { this.ok(e); }
	if (e.keyCode == 27) { this.close(); }
}

SQL.Window.prototype.ok = function(e) {
	if (this.callback) { this.callback(); }
	this.close();
}

SQL.Window.prototype.close = function() {
	if (!this.state) { return; }
	this.state = 0;
	this.dom.background.style.visibility = "hidden";
	this.dom.container.style.visibility = "hidden";
}

SQL.Window.prototype.sync = function() { /* adjust background position */
	var dims = OZ.DOM.win();
	var scroll = OZ.DOM.scroll();
	this.dom.background.style.width = dims[0]+"px";
	this.dom.background.style.height = dims[1]+"px";
	this.dom.background.style.left = scroll[0]+"px";
	this.dom.background.style.top = scroll[1]+"px";
}
