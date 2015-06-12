/* --------------------- db index ------------ */
SQL.Key = function(owner, type, name) {
	this.owner = owner;
	this.rows = [];
	this.type = type || "INDEX";
	this.name = name || "";
	SQL.Visual.apply(this);
}
SQL.Key.prototype = Object.create(SQL.Visual.prototype);

SQL.Key.prototype.setName = function(n) {
	this.name = n;
}

SQL.Key.prototype.getName = function() {
	return this.name;
}

SQL.Key.prototype.setType = function(t) {
	if (!t) { return; }
	this.type = t;
	for (var i=0;i<this.rows.length;i++) { this.rows[i].redraw(); }
}

SQL.Key.prototype.getType = function() {
	return this.type;
}

SQL.Key.prototype.addRow = function(r) {
	if (r.owner != this.owner) { return; }
	this.rows.push(r);
	r.addKey(this);
}

SQL.Key.prototype.removeRow = function(r) {
	var idx = this.rows.indexOf(r);
	if (idx == -1) { return; }
	r.removeKey(this);
	this.rows.splice(idx,1);
}

SQL.Key.prototype.destroy = function() {
	for (var i=0;i<this.rows.length;i++) {
		this.rows[i].removeKey(this);
	}
}

SQL.Key.prototype.getLabel = function() {
	return this.name || this.type;
}

SQL.Key.prototype.toXML = function() {
	var xml = "";
	xml += '<key type="'+this.getType()+'" name="'+this.getName()+'">\n';
	for (var i=0;i<this.rows.length;i++) {
		var r = this.rows[i];
		xml += '<part>'+r.getTitle()+'</part>\n';
	}
	xml += '</key>\n';
	return xml;
}

SQL.Key.prototype.fromXML = function(node) {
	this.setType(node.getAttribute("type"));
	this.setName(node.getAttribute("name"));
	var parts = node.getElementsByTagName("part");
	for (var i=0;i<parts.length;i++) {
		var name = parts[i].firstChild.nodeValue;
		var row = this.owner.findNamedRow(name);
		this.addRow(row);
	}
}
