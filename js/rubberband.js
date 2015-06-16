/* --------------------- rubberband -------------------- */

SQL.Rubberband = function(owner) {
	this.owner = owner;
	SQL.Visual.apply(this);
	this.dom.container = OZ.$("rubberband");
	OZ.Event.add("area", "mousedown", this.down.bind(this));
}
SQL.Rubberband.prototype = Object.create(SQL.Visual.prototype);

SQL.Rubberband.prototype.down = function(e) {
	OZ.Event.prevent(e);
	var scroll = OZ.DOM.scroll();
	this.x = this.x0 = e.clientX + scroll[0];
	this.y = this.y0 = e.clientY + scroll[1];
	this.width = 0;
	this.height = 0;
	this.redraw();
	this.documentMove = OZ.Event.add(document, "mousemove", this.move.bind(this));
	this.documentUp = OZ.Event.add(document, "mouseup", this.up.bind(this));
}

SQL.Rubberband.prototype.move = function(e) {
	var scroll = OZ.DOM.scroll();
	var x = e.clientX + scroll[0];
	var y = e.clientY + scroll[1];
	this.width = Math.abs(x-this.x0);
	this.height = Math.abs(y-this.y0);
	if (x<this.x0) { this.x = x; } else { this.x = this.x0; }
	if (y<this.y0) { this.y = y; } else { this.y = this.y0; }
	this.redraw();
	this.dom.container.style.visibility = "visible";	
}

SQL.Rubberband.prototype.up = function(e) {
	OZ.Event.prevent(e);
	this.dom.container.style.visibility = "hidden";
	OZ.Event.remove(this.documentMove);
	OZ.Event.remove(this.documentUp);
	this.owner.tableManager.selectRect(this.x, this.y, this.width, this.height);
}

SQL.Rubberband.prototype.redraw = function() {
	this.dom.container.style.left = this.x+"px";
	this.dom.container.style.top = this.y+"px";
	this.dom.container.style.width = this.width+"px";
	this.dom.container.style.height = this.height+"px";
}
