SQL.Designer = function() {
	SQL.Designer = this;
	
	this.tables = [];
	this.relations = [];
	this.title = document.title;
	
	SQL.Visual.apply(this);
	new SQL.Toggle(OZ.$("toggle"));
	
	this.dom.container = OZ.$("area");
	this.minSize = [
		this.dom.container.offsetWidth,
		this.dom.container.offsetHeight
	];
	this.width = this.minSize[0];
	this.height = this.minSize[1];
	
	this.typeIndex = false;
	this.fkTypeFor = false;

	this.vector = this.getOption("vector") && document.createElementNS;
	if (this.vector) {
		this.svgNS = "http://www.w3.org/2000/svg";
		this.dom.svg = document.createElementNS(this.svgNS, "svg");
		this.dom.container.appendChild(this.dom.svg);
	}

	this.flag = 2;
	this.requestLanguage();
	this.requestDB();
	this.applyStyle();
}
SQL.Designer.prototype = Object.create(SQL.Visual.prototype);

/* update area size */
SQL.Designer.prototype.sync = function() {
	var w = this.minSize[0];
	var h = this.minSize[0];
	for (var i=0;i<this.tables.length;i++) {
		var t = this.tables[i];
		w = Math.max(w, t.x + t.width);
		h = Math.max(h, t.y + t.height);
	}
	
	this.width = w;
	this.height = h;
	this.map.sync();

	if (this.vector) {	
		this.dom.svg.setAttribute("width", this.width);
		this.dom.svg.setAttribute("height", this.height);
	}
}

SQL.Designer.prototype.requestLanguage = function() { /* get locale file */
	var lang = this.getOption("locale")
	var bp = this.getOption("staticpath");
	var url = bp + "locale/"+lang+".xml";
	OZ.Request(url, this.languageResponse.bind(this), {method:"get", xml:true});
}

SQL.Designer.prototype.languageResponse = function(xmlDoc) {
	if (xmlDoc) {
		var strings = xmlDoc.getElementsByTagName("string");
		for (var i=0;i<strings.length;i++) {
			var n = strings[i].getAttribute("name");
			var v = strings[i].firstChild.nodeValue;
			window.LOCALE[n] = v;
		}
	}
	this.flag--;
	if (!this.flag) { this.init2(); }
}

SQL.Designer.prototype.requestDB = function() { /* get datatypes file */
	var db = this.getOption("db");
	var bp = this.getOption("staticpath");
	var url = bp + "db/"+db+"/datatypes.xml";
	OZ.Request(url, this.dbResponse.bind(this), {method:"get", xml:true});
}

SQL.Designer.prototype.dbResponse = function(xmlDoc) {
	if (xmlDoc) {
		window.DATATYPES = xmlDoc.documentElement;
	}
	this.flag--;
	if (!this.flag) { this.init2(); }
}

SQL.Designer.prototype.applyStyle = function() { /* apply style */
	var style = this.getOption("style");
	var i, link_elms = document.querySelectorAll("link");
	for (i=0; i<link_elms.length; i++) {
		if (link_elms[i].getAttribute("rel").indexOf("style") != -1 && link_elms[i].getAttribute("title")) {
			link_elms[i].disabled = true;
			if (link_elms[i].getAttribute("title") == style) link_elms[i].disabled = false;
		}
	}
}

SQL.Designer.prototype.init2 = function() { /* secondary init, after locale & datatypes were retrieved */
	this.map = new SQL.Map(this);
	this.rubberband = new SQL.Rubberband(this);
	this.tableManager = new SQL.TableManager(this);
	this.rowManager = new SQL.RowManager(this);
	this.keyManager = new SQL.KeyManager(this);
	this.io = new SQL.IO(this);
	this.options = new SQL.Options(this);
	this.window = new SQL.Window(this);

	this.sync();
	
	OZ.$("docs").value = _("docs");

	var url = window.location.href;
	var r = url.match(/keyword=([^&]+)/);
	if (r) {
		var keyword = r[1];
		this.io.serverload(false, keyword);
	}
	document.body.style.visibility = "visible";
}

SQL.Designer.prototype.getMaxZ = function() { /* find max zIndex */
	var max = 0;
	for (var i=0;i<this.tables.length;i++) {
		var z = this.tables[i].getZ();
		if (z > max) { max = z; }
	}
	
	OZ.$("controls").style.zIndex = max+5;
	return max;
}

SQL.Designer.prototype.addTable = function(name, x, y) {
	var max = this.getMaxZ();
	var t = new SQL.Table(this, name, x, y, max+1);
	this.tables.push(t);
	this.dom.container.appendChild(t.dom.container);
	return t;
}

SQL.Designer.prototype.removeTable = function(t) {
	this.tableManager.select(false);
	this.rowManager.select(false);
	var idx = this.tables.indexOf(t);
	if (idx == -1) { return; }
	t.destroy();
	this.tables.splice(idx,1);
}

SQL.Designer.prototype.addRelation = function(row1, row2) {
	var r = new SQL.Relation(this, row1, row2);
	this.relations.push(r);
	return r;
}

SQL.Designer.prototype.removeRelation = function(r) {
	var idx = this.relations.indexOf(r);
	if (idx == -1) { return; }
	r.destroy();
	this.relations.splice(idx,1);
}

SQL.Designer.prototype.getCookie = function() {
	var c = document.cookie;
	var obj = {};
	var parts = c.split(";");
	for (var i=0;i<parts.length;i++) {
		var part = parts[i];
		var r = part.match(/wwwsqldesigner=({.*?})/);
		if (r) { obj = eval("("+r[1]+")"); }
	}
	return obj;
}

SQL.Designer.prototype.setCookie = function(obj) {
	var arr = [];
	for (var p in obj) {
		arr.push(p+":'"+obj[p]+"'");
	}
	var str = "{"+arr.join(",")+"}";
	document.cookie = "wwwsqldesigner="+str+"; path=/";
}

SQL.Designer.prototype.getOption = function(name) {
	var c = this.getCookie();
	if (name in c) { return c[name]; }
	/* defaults */
	switch (name) {
		case "locale": return CONFIG.DEFAULT_LOCALE;
		case "db": return CONFIG.DEFAULT_DB;
		case "staticpath": return CONFIG.STATIC_PATH || "";
		case "xhrpath": return CONFIG.XHR_PATH || "";
		case "snap": return 0;
		case "showsize": return 0;
		case "showtype": return 0;
		case "pattern": return "%R_%T";
		case "hide": return false;
		case "vector": return true;
		case "style": return "material-inspired";
		default: return null;
	}
}

SQL.Designer.prototype.setOption = function(name, value) {
	var obj = this.getCookie();
	obj[name] = value;
	this.setCookie(obj);
}

SQL.Designer.prototype.raise = function(table) { /* raise a table */
	var old = table.getZ();
	var max = this.getMaxZ();
	table.setZ(max);
	for (var i=0;i<this.tables.length;i++) {
		var t = this.tables[i];
		if (t == table) { continue; }
		if (t.getZ() > old) { t.setZ(t.getZ()-1); }
	}
	var m = table.dom.mini;
	m.parentNode.appendChild(m);
}

SQL.Designer.prototype.clearTables = function() {
	while (this.tables.length) { this.removeTable(this.tables[0]); }
	this.setTitle(false);
}

SQL.Designer.prototype.alignTables = function() {
	var win = OZ.DOM.win();
	var avail = win[0] - OZ.$("bar").offsetWidth;
	var x = 10;
	var y = 10;
	var max = 0;
	
	this.tables.sort(function(a,b){
		return b.getRelations().length - a.getRelations().length;
	});

	for (var i=0;i<this.tables.length;i++) {
		var t = this.tables[i];
		var w = t.dom.container.offsetWidth;
		var h = t.dom.container.offsetHeight;
		if (x + w > avail) {
			x = 10;
			y += 10 + max;
			max = 0;
		}
		t.moveTo(x,y);
		x += 10 + w;
		if (h > max) { max = h; }
	}

	this.sync();
}

SQL.Designer.prototype.findNamedTable = function(name) { /* find row specified as table(row) */
	for (var i=0;i<this.tables.length;i++) {
		if (this.tables[i].getTitle() == name) { return this.tables[i]; }
	}
}

SQL.Designer.prototype.toXML = function() {
	var xml = '<?xml version="1.0" encoding="utf-8" ?>\n';
	xml += '<!-- SQL XML created by WWW SQL Designer, https://github.com/ondras/wwwsqldesigner/ -->\n';
	xml += '<!-- Active URL: ' + location.href + ' -->\n';
	xml += '<sql>\n';
	
	/* serialize datatypes */
	if (window.XMLSerializer) {
		var s = new XMLSerializer();
		xml += s.serializeToString(window.DATATYPES);
	} else if (window.DATATYPES.xml) {
		xml += window.DATATYPES.xml;
	} else {
		alert(_("errorxml")+': '+e.message);
	}
	
	for (var i=0;i<this.tables.length;i++) {
		xml += this.tables[i].toXML();
	}
	xml += "</sql>\n";
	return xml;
}

SQL.Designer.prototype.fromXML = function(node) {
	this.clearTables();
	var types = node.getElementsByTagName("datatypes");
	if (types.length) { window.DATATYPES = types[0]; }
	var tables = node.getElementsByTagName("table");
	for (var i=0;i<tables.length;i++) {
		var t = this.addTable("", 0, 0);
		t.fromXML(tables[i]);
	}

	for (var i=0;i<this.tables.length;i++) { /* ff one-pixel shift hack */
		this.tables[i].select(); 
		this.tables[i].deselect(); 
	}

	/* relations */
	var rs = node.getElementsByTagName("relation");
	for (var i=0;i<rs.length;i++) {
		var rel = rs[i];
		var tname = rel.getAttribute("table");
		var rname = rel.getAttribute("row");
		
		var t1 = this.findNamedTable(tname);
		if (!t1) { continue; }
		var r1 = t1.findNamedRow(rname);
		if (!r1) { continue; }

		tname = rel.parentNode.parentNode.getAttribute("name");
		rname = rel.parentNode.getAttribute("name");
		var t2 = this.findNamedTable(tname);
		if (!t2) { continue; }
		var r2 = t2.findNamedRow(rname);
		if (!r2) { continue; }

		this.addRelation(r1, r2);
	}
	
	this.sync();
}

SQL.Designer.prototype.setTitle = function(t) {
	document.title = this.title + (t ? " - "+t : "");
}

SQL.Designer.prototype.removeSelection = function() {
	var sel = (window.getSelection ? window.getSelection() : document.selection);
	if (!sel) { return; }
	if (sel.empty) { sel.empty(); }
	if (sel.removeAllRanges) { sel.removeAllRanges(); }
}

SQL.Designer.prototype.getTypeIndex = function(label) {
	if (!this.typeIndex) {
		this.typeIndex = {};
		var types = window.DATATYPES.getElementsByTagName("type");
		for (var i=0;i<types.length;i++) {
			var l = types[i].getAttribute("label");
			if (l) { this.typeIndex[l] = i; }
		}
	}
	return this.typeIndex[label];
}

SQL.Designer.prototype.getFKTypeFor = function(typeIndex) {
	if (!this.fkTypeFor) {
		this.fkTypeFor = {};
		var types = window.DATATYPES.getElementsByTagName("type");
		for (var i=0;i<types.length;i++) {
			this.fkTypeFor[i] = i;
			var fk = types[i].getAttribute("fk");
			if (fk) { this.fkTypeFor[i] = this.getTypeIndex(fk); }
		}
	}
	return this.fkTypeFor[typeIndex];
}
