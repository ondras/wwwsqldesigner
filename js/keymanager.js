/* ----------------- key manager ---------- */

SQL.KeyManager = function(owner) {
	this.owner = owner;
	this.dom = {
		container:OZ.$("keys")
	}
	this.build();
}

SQL.KeyManager.prototype.build = function() {
	this.dom.list = OZ.$("keyslist");
	this.dom.type = OZ.$("keytype");
	this.dom.name = OZ.$("keyname");
	this.dom.left = OZ.$("keyleft");
	this.dom.right = OZ.$("keyright");
	this.dom.fields = OZ.$("keyfields");
	this.dom.avail = OZ.$("keyavail");
	this.dom.listlabel = OZ.$("keyslistlabel");

	var ids = ["keyadd","keyremove"];
	for (var i=0;i<ids.length;i++) {
		var id = ids[i];
		var elm = OZ.$(id);
		this.dom[id] = elm;
		elm.value = _(id);
	}

	var ids = ["keyedit","keytypelabel","keynamelabel","keyfieldslabel","keyavaillabel"];
	for (var i=0;i<ids.length;i++) {
		var id = ids[i];
		var elm = OZ.$(id);
		elm.innerHTML = _(id);
	}
	
	var types = ["PRIMARY","INDEX","UNIQUE","FULLTEXT"];
	OZ.DOM.clear(this.dom.type);
	for (var i=0;i<types.length;i++) {
		var o = OZ.DOM.elm("option");
		o.innerHTML = types[i];
		o.value = types[i];
		this.dom.type.appendChild(o);
	}

	this.purge = this.purge.bind(this);

	OZ.Event.add(this.dom.list, "change", this.listchange.bind(this));
	OZ.Event.add(this.dom.type, "change", this.typechange.bind(this));
	OZ.Event.add(this.dom.name, "keyup", this.namechange.bind(this));
	OZ.Event.add(this.dom.keyadd, "click", this.add.bind(this));
	OZ.Event.add(this.dom.keyremove, "click", this.remove.bind(this));
	OZ.Event.add(this.dom.left, "click", this.left.bind(this));
	OZ.Event.add(this.dom.right, "click", this.right.bind(this));
	
	this.dom.container.parentNode.removeChild(this.dom.container);
}

SQL.KeyManager.prototype.listchange = function(e) {
	this.switchTo(this.dom.list.selectedIndex);
}

SQL.KeyManager.prototype.typechange = function(e) {
	this.key.setType(this.dom.type.value);
	this.redrawListItem();
}

SQL.KeyManager.prototype.namechange = function(e) {
	this.key.setName(this.dom.name.value);
	this.redrawListItem();
}

SQL.KeyManager.prototype.add = function(e) {
	var type = (this.table.keys.length ? "INDEX" : "PRIMARY");
	this.table.addKey(type);
	this.sync(this.table);
	this.switchTo(this.table.keys.length-1);
}

SQL.KeyManager.prototype.remove = function(e) {
	var index = this.dom.list.selectedIndex;
	if (index == -1) { return; }
	var r = this.table.keys[index];
	this.table.removeKey(r);
	this.sync(this.table);
}

SQL.KeyManager.prototype.purge = function() { /* remove empty keys */
	for (var i=this.table.keys.length-1;i>=0;i--) {
		var k = this.table.keys[i];
		if (!k.rows.length) { this.table.removeKey(k); }
	}
}

SQL.KeyManager.prototype.sync = function(table) { /* sync content with given table */
	this.table = table;
	this.dom.listlabel.innerHTML = _("keyslistlabel").replace(/%s/,table.getTitle());
	
	OZ.DOM.clear(this.dom.list);
	for (var i=0;i<table.keys.length;i++) {
		var k = table.keys[i];
		var o = OZ.DOM.elm("option");
		this.dom.list.appendChild(o);
		var str = (i+1)+": "+k.getLabel();
		o.innerHTML = str;
	}
	if (table.keys.length) { 
		this.switchTo(0); 
	} else {
		this.disable();
	}
}

SQL.KeyManager.prototype.redrawListItem = function() {
	var index = this.table.keys.indexOf(this.key);
	this.option.innerHTML = (index+1)+": "+this.key.getLabel();
}

SQL.KeyManager.prototype.switchTo = function(index) { /* show Nth key */
	this.enable();
	var k = this.table.keys[index];
	this.key = k;
	this.option = this.dom.list.getElementsByTagName("option")[index];
	
	this.dom.list.selectedIndex = index;
	this.dom.name.value = k.getName();
	
	var opts = this.dom.type.getElementsByTagName("option");
	for (var i=0;i<opts.length;i++) {
		if (opts[i].value == k.getType()) { this.dom.type.selectedIndex = i; }
	}

	OZ.DOM.clear(this.dom.fields);
	for (var i=0;i<k.rows.length;i++) {
		var o = OZ.DOM.elm("option");
		o.innerHTML = k.rows[i].getTitle();
		o.value = o.innerHTML;
		this.dom.fields.appendChild(o);
	}
	
	OZ.DOM.clear(this.dom.avail);
	for (var i=0;i<this.table.rows.length;i++) {
		var r = this.table.rows[i];
		if (k.rows.indexOf(r) != -1) { continue; }
		var o = OZ.DOM.elm("option");
		o.innerHTML = r.getTitle();
		o.value = o.innerHTML;
		this.dom.avail.appendChild(o);
	}
}

SQL.KeyManager.prototype.disable = function() {
	OZ.DOM.clear(this.dom.fields);
	OZ.DOM.clear(this.dom.avail);
	this.dom.keyremove.disabled = true;
	this.dom.left.disabled = true;
	this.dom.right.disabled = true;
	this.dom.list.disabled = true;
	this.dom.name.disabled = true;
	this.dom.type.disabled = true;
	this.dom.fields.disabled = true;
	this.dom.avail.disabled = true;
}

SQL.KeyManager.prototype.enable = function() {
	this.dom.keyremove.disabled = false;
	this.dom.left.disabled = false;
	this.dom.right.disabled = false;
	this.dom.list.disabled = false;
	this.dom.name.disabled = false;
	this.dom.type.disabled = false;
	this.dom.fields.disabled = false;
	this.dom.avail.disabled = false;
}

SQL.KeyManager.prototype.left = function(e) { /* add field to index */
	var opts = this.dom.avail.getElementsByTagName("option");
	for (var i=0;i<opts.length;i++) {
		var o = opts[i];
		if (o.selected) {
			var row = this.table.findNamedRow(o.value);
			this.key.addRow(row);
		}
	}
	this.switchTo(this.dom.list.selectedIndex);
}

SQL.KeyManager.prototype.right = function(e) { /* remove field from index */
	var opts = this.dom.fields.getElementsByTagName("option");
	for (var i=0;i<opts.length;i++) {
		var o = opts[i];
		if (o.selected) {
			var row = this.table.findNamedRow(o.value);
			this.key.removeRow(row);
		}
	}
	this.switchTo(this.dom.list.selectedIndex);
}

SQL.KeyManager.prototype.open = function(table) {
	this.sync(table);
	this.owner.window.open(_("tablekeys"),this.dom.container,this.purge);
}
