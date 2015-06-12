/* --------------------- row manager ------------ */
SQL.RowManager = function(owner) {
	this.owner = owner;
	this.dom = {};
	this.selected = null;
	this.creating = false;
	this.connecting = false;
	
	var ids = ["editrow","removerow","uprow","downrow","foreigncreate","foreignconnect","foreigndisconnect"];
	for (var i=0;i<ids.length;i++) {
		var id = ids[i];
		var elm = OZ.$(id);
		this.dom[id] = elm;
		elm.value = _(id);
	}

	this.select(false);
	
	OZ.Event.add(this.dom.editrow, "click", this.edit.bind(this));
	OZ.Event.add(this.dom.uprow, "click", this.up.bind(this));
	OZ.Event.add(this.dom.downrow, "click", this.down.bind(this));
	OZ.Event.add(this.dom.removerow, "click", this.remove.bind(this));
	OZ.Event.add(this.dom.foreigncreate, "click", this.foreigncreate.bind(this));
	OZ.Event.add(this.dom.foreignconnect, "click", this.foreignconnect.bind(this));
	OZ.Event.add(this.dom.foreigndisconnect, "click", this.foreigndisconnect.bind(this));
	OZ.Event.add(document, "keydown", this.press.bind(this));

	SQL.subscribe("tableclick", this.tableClick.bind(this));
	SQL.subscribe("rowclick", this.rowClick.bind(this));
}

SQL.RowManager.prototype.select = function(row) { /* activate a row */
	if (this.selected === row) { return; }
	if (this.selected) { this.selected.deselect(); }

	this.selected = row;
	if (this.selected) { this.selected.select(); }
	this.redraw();
}

SQL.RowManager.prototype.tableClick = function(e) { /* create relation after clicking target table */
	if (!this.creating) { return; }
	
	var r1 = this.selected;
	var t2 = e.target;
	
	var p = this.owner.getOption("pattern");
	p = p.replace(/%T/g,r1.owner.getTitle());
	p = p.replace(/%t/g,t2.getTitle());
	p = p.replace(/%R/g,r1.getTitle());
	
	var r2 = t2.addRow(p, r1.data);
	r2.update({"type":SQL.Designer.getFKTypeFor(r1.data.type)});
	r2.update({"ai":false});
	this.owner.addRelation(r1, r2);
}

SQL.RowManager.prototype.rowClick = function(e) { /* draw relation after clicking target row */
	if (!this.connecting) { return; }
	
	var r1 = this.selected;
	var r2 = e.target;
	
	if (r1 == r2) { return; }
	
	this.owner.addRelation(r1, r2);
}

SQL.RowManager.prototype.foreigncreate = function(e) { /* start creating fk */
	this.endConnect();
	if (this.creating) {
		this.endCreate();
	} else {
		this.creating = true;
		this.dom.foreigncreate.value = "["+_("foreignpending")+"]";
	}
}

SQL.RowManager.prototype.foreignconnect = function(e) { /* start drawing fk */
	this.endCreate();
	if (this.connecting) {
		this.endConnect();
	} else {
		this.connecting = true;
		this.dom.foreignconnect.value = "["+_("foreignconnectpending")+"]";
	}
}

SQL.RowManager.prototype.foreigndisconnect = function(e) { /* remove connector */
	var rels = this.selected.relations;
	for (var i=rels.length-1;i>=0;i--) {
		var r = rels[i];
		if (r.row2 == this.selected) { this.owner.removeRelation(r); }
	}
	this.redraw();
}

SQL.RowManager.prototype.endCreate = function() {
	this.creating = false;
	this.dom.foreigncreate.value = _("foreigncreate");
}

SQL.RowManager.prototype.endConnect = function() {
	this.connecting = false;
	this.dom.foreignconnect.value = _("foreignconnect");
}

SQL.RowManager.prototype.up = function(e) {
	this.selected.up();
	this.redraw();
}

SQL.RowManager.prototype.down = function(e) {
	this.selected.down();
	this.redraw();
}

SQL.RowManager.prototype.remove = function(e) {
	var result = confirm(_("confirmrow")+" '"+this.selected.getTitle()+"' ?");
	if (!result) { return; }
	var t = this.selected.owner;
	this.selected.owner.removeRow(this.selected);
	
	var next = false;
	if (t.rows) { next = t.rows[t.rows.length-1]; }
	this.select(next);
}

SQL.RowManager.prototype.redraw = function() {
	this.endCreate();
	this.endConnect();
	if (this.selected) {
		var table = this.selected.owner;
		var rows = table.rows;
		this.dom.uprow.disabled = (rows[0] == this.selected);
		this.dom.downrow.disabled = (rows[rows.length-1] == this.selected);
		this.dom.removerow.disabled = false;
		this.dom.editrow.disabled = false;
		this.dom.foreigncreate.disabled = !(this.selected.isUnique());
		this.dom.foreignconnect.disabled = !(this.selected.isUnique());
		
		this.dom.foreigndisconnect.disabled = true;
		var rels = this.selected.relations;
		for (var i=0;i<rels.length;i++) {
			var r = rels[i];
			if (r.row2 == this.selected) { this.dom.foreigndisconnect.disabled = false; }
		}
		
	} else {
		this.dom.uprow.disabled = true;
		this.dom.downrow.disabled = true;
		this.dom.removerow.disabled = true;
		this.dom.editrow.disabled = true;
		this.dom.foreigncreate.disabled = true;
		this.dom.foreignconnect.disabled = true;
		this.dom.foreigndisconnect.disabled = true;
	}
}

SQL.RowManager.prototype.press = function(e) {
	if (!this.selected) { return; }
	
	var target = OZ.Event.target(e).nodeName.toLowerCase();
	if (target == "textarea" || target == "input") { return; } /* not when in form field */
	
	switch (e.keyCode) {
		case 38:
			this.up();
			OZ.Event.prevent(e);
		break;
		case 40:
			this.down();
			OZ.Event.prevent(e);
		break;
		case 46:
			this.remove();
			OZ.Event.prevent(e);
		break;
		case 13:
		case 27:
			this.selected.collapse();
		break;
	}
}

SQL.RowManager.prototype.edit = function(e) {
	this.selected.expand();
}
