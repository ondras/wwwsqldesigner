/* --------------------- db table ------------ */
SQL.Table = function(owner, name, x, y, z) {
	this.owner = owner;
	this.rows = [];
	this.keys = [];
	this.zIndex = 0;
	this._ec = [];

	this.flag = false;
	this.selected = false;
	SQL.Visual.apply(this);
	this.data.comment = "";
	
	this.setTitle(name);
	this.x = x || 0;
	this.y = y || 0;
	this.setZ(z);
	this.snap();
}
SQL.Table.prototype = Object.create(SQL.Visual.prototype);

SQL.Table.prototype._build = function() {
	this.dom.container = OZ.DOM.elm("div", {className:"table"});
	this.dom.content = OZ.DOM.elm("table");
	var thead = OZ.DOM.elm("thead");
	var tr = OZ.DOM.elm("tr");
	this.dom.title = OZ.DOM.elm("td", {className:"title", colSpan:2});
	
	OZ.DOM.append(
		[this.dom.container, this.dom.content],
		[this.dom.content, thead],
		[thead, tr],
		[tr, this.dom.title]
	);
	
	this.dom.mini = OZ.DOM.elm("div", {className:"mini"});
	this.owner.map.dom.container.appendChild(this.dom.mini);

	this._ec.push(OZ.Event.add(this.dom.container, "click", this.click.bind(this)));
	this._ec.push(OZ.Event.add(this.dom.container, "dblclick", this.dblclick.bind(this)));
	this._ec.push(OZ.Event.add(this.dom.container, "mousedown", this.down.bind(this)));
	this._ec.push(OZ.Event.add(this.dom.container, "touchstart", this.down.bind(this)));
	this._ec.push(OZ.Event.add(this.dom.container, "touchmove", OZ.Event.prevent));
}

SQL.Table.prototype.setTitle = function(t) {
	var old = this.getTitle();
	for (var i=0;i<this.rows.length;i++) {
		var row = this.rows[i];
		for (var j=0;j<row.relations.length;j++) {
			var r = row.relations[j];
			if (r.row1 != row) { continue; }
			var tt = row.getTitle().replace(new RegExp(old,"g"),t);
			if (tt != row.getTitle()) { row.setTitle(tt); }
		}
	}
	SQL.Visual.prototype.setTitle.apply(this, [t]);
}

SQL.Table.prototype.getRelations = function() {
	var arr = [];
	for (var i=0;i<this.rows.length;i++) {
		var row = this.rows[i];
		for (var j=0;j<row.relations.length;j++) {
			var r = row.relations[j];
			if (arr.indexOf(r) == -1) { arr.push(r); }
		}
	}
	return arr;
}

SQL.Table.prototype.showRelations = function() {
	var rs = this.getRelations();
	for (var i=0;i<rs.length;i++) { rs[i].show(); }
}

SQL.Table.prototype.hideRelations = function() {
	var rs = this.getRelations();
	for (var i=0;i<rs.length;i++) { rs[i].hide(); }
}

SQL.Table.prototype.click = function(e) {
	OZ.Event.stop(e);
	var t = OZ.Event.target(e);
	this.owner.tableManager.select(this);
	
	if (t != this.dom.title) { return; } /* click on row */

	SQL.publish("tableclick", this);
	this.owner.rowManager.select(false);
}

SQL.Table.prototype.dblclick = function(e) {
	var t = OZ.Event.target(e);
	if (t == this.dom.title) { this.owner.tableManager.edit(); }
}

SQL.Table.prototype.select = function() { 
	if (this.selected) { return; }
	this.selected = true;
	OZ.DOM.addClass(this.dom.container, "selected");
	OZ.DOM.addClass(this.dom.mini, "mini_selected");
	this.redraw();
}

SQL.Table.prototype.deselect = function() { 
	if (!this.selected) { return; }
	this.selected = false;
	OZ.DOM.removeClass(this.dom.container, "selected");
	OZ.DOM.removeClass(this.dom.mini, "mini_selected");
	this.redraw();
}

SQL.Table.prototype.addRow = function(title, data) {
	var r = new SQL.Row(this, title, data);
	this.rows.push(r);
	this.dom.content.appendChild(r.dom.container);
	this.redraw();
	return r;
}

SQL.Table.prototype.removeRow = function(r) {
	var idx = this.rows.indexOf(r);
	if (idx == -1) { return; } 
	r.destroy();
	this.rows.splice(idx,1);
	this.redraw();
}

SQL.Table.prototype.addKey = function(name) {
	var k = new SQL.Key(this, name);
	this.keys.push(k);
	return k;
}

SQL.Table.prototype.removeKey = function(k) {
	var idx = this.keys.indexOf(k);
	if (idx == -1) { return; }
	k.destroy();
	this.keys.splice(idx,1);
}

SQL.Table.prototype.redraw = function() {
	var x = this.x;
	var y = this.y;
	if (this.selected) { x--; y--; }
	this.dom.container.style.left = x+"px";
	this.dom.container.style.top = y+"px";
	
	var ratioX = this.owner.map.width / this.owner.width;
	var ratioY = this.owner.map.height / this.owner.height;
	
	var w = this.dom.container.offsetWidth * ratioX;
	var h = this.dom.container.offsetHeight * ratioY;
	var x = this.x * ratioX;
	var y = this.y * ratioY;
	
	this.dom.mini.style.width = Math.round(w)+"px";
	this.dom.mini.style.height = Math.round(h)+"px";
	this.dom.mini.style.left = Math.round(x)+"px";
	this.dom.mini.style.top = Math.round(y)+"px";

	this.width = this.dom.container.offsetWidth;
	this.height = this.dom.container.offsetHeight;
	
	var rs = this.getRelations();
	for (var i=0;i<rs.length;i++) { rs[i].redraw(); }
}

SQL.Table.prototype.moveBy = function(dx, dy) {
	this.x += dx;
	this.y += dy;
	
	this.snap();
	this.redraw();
}

SQL.Table.prototype.moveTo = function(x, y) {
	this.x = x;
	this.y = y;

	this.snap();
	this.redraw();
}

SQL.Table.prototype.snap = function() {
	var snap = parseInt(SQL.Designer.getOption("snap"));
	if (snap) {
		this.x = Math.round(this.x / snap) * snap;
		this.y = Math.round(this.y / snap) * snap;
	}
}

SQL.Table.prototype.down = function(e) { /* mousedown - start drag */
	OZ.Event.stop(e);
	var t = OZ.Event.target(e);
	if (t != this.dom.title) { return; } /* on a row */
	
	/* touch? */
	if (e.type == "touchstart") {
		var event = e.touches[0];
		var moveEvent = "touchmove";
		var upEvent = "touchend";
	} else {
		var event = e;
		var moveEvent = "mousemove";
		var upEvent = "mouseup";
	}
	
	/* a non-shift click within a selection preserves the selection */
	if (e.shiftKey || ! this.selected) {
		this.owner.tableManager.select(this, e.shiftKey);
	}

	var t = SQL.Table;
	t.active = this.owner.tableManager.selection;
	var n = t.active.length;
	t.x = new Array(n);
	t.y = new Array(n);
	for (var i=0;i<n;i++) {
		/* position relative to mouse cursor */ 
		t.x[i] = t.active[i].x - event.clientX;
		t.y[i] = t.active[i].y - event.clientY;
	}
	
	if (this.owner.getOption("hide")) { 
		for (var i=0;i<n;i++) {
			t.active[i].hideRelations();
		}
	}
	
	this.documentMove = OZ.Event.add(document, moveEvent, this.move.bind(this));
	this.documentUp = OZ.Event.add(document, upEvent, this.up.bind(this));
}

SQL.Table.prototype.toXML = function() {
	var t = this.getTitle().replace(/"/g,"&quot;");
	var xml = "";
	xml += '<table x="'+this.x+'" y="'+this.y+'" name="'+t+'">\n';
	for (var i=0;i<this.rows.length;i++) {
		xml += this.rows[i].toXML();
	}
	for (var i=0;i<this.keys.length;i++) {
		xml += this.keys[i].toXML();
	}
	var c = this.getComment();
	if (c) { 
		xml += "<comment>"+SQL.escape(c)+"</comment>\n"; 
	}
	xml += "</table>\n";
	return xml;
}

SQL.Table.prototype.fromXML = function(node) {
	var name = node.getAttribute("name");
	this.setTitle(name);
	var x = parseInt(node.getAttribute("x")) || 0;
	var y = parseInt(node.getAttribute("y")) || 0;
	this.moveTo(x, y);
	var rows = node.getElementsByTagName("row");
	for (var i=0;i<rows.length;i++) {
		var row = rows[i];
		var r = this.addRow("");
		r.fromXML(row);
	}
	var keys = node.getElementsByTagName("key");
	for (var i=0;i<keys.length;i++) {
		var key = keys[i];
		var k = this.addKey();
		k.fromXML(key);
	}
	for (var i=0;i<node.childNodes.length;i++) {
		var ch = node.childNodes[i];
		if (ch.tagName && ch.tagName.toLowerCase() == "comment" && ch.firstChild) {
			this.setComment(ch.firstChild.nodeValue);
		}
	}
}

SQL.Table.prototype.getZ = function() {
	return this.zIndex;
}

SQL.Table.prototype.setZ = function(z) {
	this.zIndex = z;
	this.dom.container.style.zIndex = z;
}

SQL.Table.prototype.findNamedRow = function(n) { /* return row with a given name */
	for (var i=0;i<this.rows.length;i++) {
		if (this.rows[i].getTitle() == n) { return this.rows[i]; }
	}
	return false;
}

SQL.Table.prototype.setComment = function(c) {
	this.data.comment = c;
	this.dom.title.title = this.data.comment;
}

SQL.Table.prototype.getComment = function() {
	return this.data.comment;
}

SQL.Table.prototype.move = function(e) { /* mousemove */
	var t = SQL.Table;
	SQL.Designer.removeSelection();
	if (e.type == "touchmove") {
		if (e.touches.length > 1) { return; }
		var event = e.touches[0];
	} else {
		var event = e;
	}

	for (var i=0;i<t.active.length;i++) {
		var x = t.x[i] + event.clientX;
		var y = t.y[i] + event.clientY;
		x = Math.max(x, 0);
		y = Math.max(y, 0);
		t.active[i].moveTo(x,y);
	}
}

SQL.Table.prototype.up = function(e) {
	var t = SQL.Table;
	var d = SQL.Designer;
	if (d.getOption("hide")) { 
		for (var i=0;i<t.active.length;i++) {
			t.active[i].showRelations(); 
			t.active[i].redraw();
		}
	}
	t.active = false;
	OZ.Event.remove(this.documentMove);
	OZ.Event.remove(this.documentUp);
	this.owner.sync();
}

SQL.Table.prototype.destroy = function() {
	SQL.Visual.prototype.destroy.apply(this);
	this.dom.mini.parentNode.removeChild(this.dom.mini);
	while (this.rows.length) {
		this.removeRow(this.rows[0]);
	}
	this._ec.forEach(OZ.Event.remove, OZ.Event);
}
