function _(str) { /* getText */
	if (!(str in window.LOCALE)) { return str; }
	return window.LOCALE[str];
}

var DATATYPES = false;
var LOCALE = {};
var SQL = {};

/* -------------------- base visual element -------------------- */

SQL.Visual = OZ.Class(); /* abstract parent */
SQL.Visual.prototype.init = function() {
	this._init();
	this._build();
}

SQL.Visual.prototype._init = function() {
	this.dom = {
		container: null,
		title: null
	};
	this.data = {
		title:""
	}
}

SQL.Visual.prototype._build = function() {}

SQL.Visual.prototype.toXML = function() {}

SQL.Visual.prototype.fromXML = function(node) {}

SQL.Visual.prototype.destroy = function() { /* "destructor" */
	var p = this.dom.container.parentNode;
	if (p && p.nodeType == 1) {
		p.removeChild(this.dom.container);
	}
}

SQL.Visual.prototype.setTitle = function(text) {
	if (!text) { return; }
	this.data.title = text;
	this.dom.title.innerHTML = text;
}

SQL.Visual.prototype.getTitle = function() {
	return this.data.title;
}

SQL.Visual.prototype.redraw = function() {}

/* --------------------- table row ( = db column) ------------ */

SQL.Row = OZ.Class().extend(SQL.Visual);

SQL.Row.prototype.init = function(owner, title, data) {
	this.owner = owner;
	this.relations = [];
	this.keys = [];
	this.selected = false;
	this.expanded = false;
	
	SQL.Visual.prototype.init.apply(this);
	
	this.data.type = 0;
	this.data.size = "";
	this.data.def = null;
	this.data.nll = true;
	this.data.ai = false;
	this.data.comment = "";
	
	if (data) { this.update(data); }
	this.setTitle(title);
}

SQL.Row.prototype._build = function() {
	this.dom.container = OZ.DOM.elm("tbody");
	
	this.dom.content = OZ.DOM.elm("tr");
	this.dom.selected = OZ.DOM.elm("div", {className:"selected",innerHTML:"&raquo;&nbsp;"});
	this.dom.title = OZ.DOM.elm("div", {className:"title"});
	var td1 = OZ.DOM.elm("td");
	var td2 = OZ.DOM.elm("td", {className:"typehint"});
	this.dom.typehint = td2;

	OZ.DOM.append(
		[this.dom.container, this.dom.content],
		[this.dom.content, td1, td2],
		[td1, this.dom.selected, this.dom.title]
	);
	
	this.enter = this.bind(this.enter);
	this.changeComment = this.bind(this.changeComment);

	OZ.Event.add(this.dom.container, "click",this.bind(this.click));
	OZ.Event.add(this.dom.container, "dblclick",this.bind(this.dblclick));
}

SQL.Row.prototype.select = function() {
	if (this.selected) { return; }
	this.selected = true;
	this.redraw();
}

SQL.Row.prototype.deselect = function() {
	if (!this.selected) { return; }
	this.selected = false;
	this.redraw();
	this.collapse();
}

SQL.Row.prototype.setTitle = function(t) {
	var old = this.getTitle();
	for (var i=0;i<this.relations.length;i++) {
		var r = this.relations[i];
		if (r.row1 != this) { continue; }
		var tt = r.row2.getTitle().replace(new RegExp(old,"g"),t);
		if (tt != r.row2.getTitle()) { r.row2.setTitle(tt); }
	}
	
	SQL.Visual.prototype.setTitle.apply(this, [t]);
}

SQL.Row.prototype.click = function(e) { /* clicked on row */
	this.dispatch("rowclick", this);
	this.owner.owner.rowManager.select(this);
}

SQL.Row.prototype.dblclick = function(e) { /* dblclicked on row */
	OZ.Event.prevent(e);
	OZ.Event.stop(e);
	this.expand();
}

SQL.Row.prototype.update = function(data) { /* update subset of row data */
	var des = SQL.Designer;
	if (data.nll && data.def && data.def.match(/^null$/i)) { data.def = null; }
	
	for (var p in data) { this.data[p] = data[p]; }
	if (!this.data.nll && this.data.def === null) { this.data.def = ""; }

	var elm = this.getDataType();
	for (var i=0;i<this.relations.length;i++) {
		var r = this.relations[i];
		if (r.row1 == this) { r.row2.update({type:des.getFKTypeFor(this.data.type),size:this.data.size}); }
	}
	this.redraw();
}

SQL.Row.prototype.up = function() { /* shift up */
	var r = this.owner.rows;
	var idx = r.indexOf(this);
	if (!idx) { return; }
	r[idx-1].dom.container.parentNode.insertBefore(this.dom.container,r[idx-1].dom.container);
	r.splice(idx,1);
	r.splice(idx-1,0,this);
	this.redraw();
}

SQL.Row.prototype.down = function() { /* shift down */
	var r = this.owner.rows;
	var idx = r.indexOf(this);
	if (idx+1 == this.owner.rows.length) { return; }
	r[idx].dom.container.parentNode.insertBefore(this.dom.container,r[idx+1].dom.container.nextSibling);
	r.splice(idx,1);
	r.splice(idx+1,0,this);
	this.redraw();
}

SQL.Row.prototype.buildEdit = function() {
	OZ.DOM.clear(this.dom.container);
	
	var elms = [];
	this.dom.name = OZ.DOM.elm("input");
	this.dom.name.type = "text";
	elms.push(["name",this.dom.name]);
	OZ.Event.add(this.dom.name, "keypress", this.enter);

	this.dom.type = this.buildTypeSelect(this.data.type);
	elms.push(["type",this.dom.type]);

	this.dom.size = OZ.DOM.elm("input");
	this.dom.size.type = "text";
	elms.push(["size",this.dom.size]);

	this.dom.def = OZ.DOM.elm("input");
	this.dom.def.type = "text";
	elms.push(["def",this.dom.def]);

	this.dom.ai = OZ.DOM.elm("input");
	this.dom.ai.type = "checkbox";
	elms.push(["ai",this.dom.ai]);

	this.dom.nll = OZ.DOM.elm("input");
	this.dom.nll.type = "checkbox";
	elms.push(["null",this.dom.nll]);
	
	this.dom.comment = OZ.DOM.elm("span",{className:"comment"});
	this.dom.comment.innerHTML = this.data.comment;

	this.dom.commentbtn = OZ.DOM.elm("input");
	this.dom.commentbtn.type = "button";
	this.dom.commentbtn.value = _("comment");
	
	OZ.Event.add(this.dom.commentbtn, "click", this.changeComment);

	for (var i=0;i<elms.length;i++) {
		var row = elms[i];
		var tr = OZ.DOM.elm("tr");
		var td1 = OZ.DOM.elm("td");
		var td2 = OZ.DOM.elm("td");
		var l = OZ.DOM.text(_(row[0])+": ");
		OZ.DOM.append(
			[tr, td1, td2],
			[td1, l],
			[td2, row[1]]
		);
		this.dom.container.appendChild(tr);
	}
	
	var tr = OZ.DOM.elm("tr");
	var td1 = OZ.DOM.elm("td");
	var td2 = OZ.DOM.elm("td");
	OZ.DOM.append(
		[tr, td1, td2],
		[td1, this.dom.comment],
		[td2, this.dom.commentbtn]
	);
	this.dom.container.appendChild(tr);
}

SQL.Row.prototype.changeComment = function(e) {
	var c = prompt(_("commenttext"),this.data.comment);
	if (c === null) { return; }
	this.data.comment = c;
	this.dom.comment.innerHTML = this.data.comment;
}

SQL.Row.prototype.expand = function() {
	if (this.expanded) { return; }
	this.expanded = true;
	this.buildEdit();
	this.load();
	this.redraw();
	this.dom.name.focus();
	this.dom.name.select();
}

SQL.Row.prototype.collapse = function() {
	if (!this.expanded) { return; }
	this.expanded = false;

	var data = {
		type: this.dom.type.selectedIndex,
		def: this.dom.def.value,
		size: this.dom.size.value,
		nll: this.dom.nll.checked,
		ai: this.dom.ai.checked
	}
	
	OZ.DOM.clear(this.dom.container);
	this.dom.container.appendChild(this.dom.content);

	this.update(data);
	this.setTitle(this.dom.name.value);
}

SQL.Row.prototype.load = function() { /* put data to expanded form */
	this.dom.name.value = this.getTitle();
	var def = this.data.def;
	if (def === null) { def = "NULL"; }
	
	this.dom.def.value = def;
	this.dom.size.value = this.data.size;
	this.dom.nll.checked = this.data.nll;
	this.dom.ai.checked = this.data.ai;
}

SQL.Row.prototype.redraw = function() {
	var color = this.getColor();
	this.dom.container.style.backgroundColor = color;
	OZ.DOM.removeClass(this.dom.title, "primary");
	OZ.DOM.removeClass(this.dom.title, "key");
	if (this.isPrimary()) { OZ.DOM.addClass(this.dom.title, "primary"); }
	if (this.isKey()) { OZ.DOM.addClass(this.dom.title, "key"); }
	this.dom.selected.style.display = (this.selected ? "" : "none");
	this.dom.container.title = this.data.comment;
	
	var typehint = [];
	if (this.owner.owner.getOption("showtype")) {
		var elm = this.getDataType();
		typehint.push(elm.getAttribute("sql"));
	}
	
	if (this.owner.owner.getOption("showsize") && this.data.size) {
		typehint.push("(" + this.data.size + ")");
	}
	
	this.dom.typehint.innerHTML = typehint.join(" ");
	this.owner.redraw();
	this.owner.owner.rowManager.redraw();
}

SQL.Row.prototype.addRelation = function(r) {
	this.relations.push(r);
}

SQL.Row.prototype.removeRelation = function(r) {
	var idx = this.relations.indexOf(r);
	if (idx == -1) { return; }
	this.relations.splice(idx,1);
}

SQL.Row.prototype.addKey = function(k) {
	this.keys.push(k);
	this.redraw();
}

SQL.Row.prototype.removeKey = function(k) {
	var idx = this.keys.indexOf(k);
	if (idx == -1) { return; }
	this.keys.splice(idx,1);
	this.redraw();
}

SQL.Row.prototype.getDataType = function() {
	var type = this.data.type;
	var elm = DATATYPES.getElementsByTagName("type")[type];
	return elm;
}

SQL.Row.prototype.getColor = function() {
	var elm = this.getDataType();
	var g = this.getDataType().parentNode;
	return elm.getAttribute("color") || g.getAttribute("color") || "#fff";
}

SQL.Row.prototype.buildTypeSelect = function(id) { /* build selectbox with avail datatypes */
	var s = OZ.DOM.elm("select");
	var gs = DATATYPES.getElementsByTagName("group");
	for (var i=0;i<gs.length;i++) {
		var g = gs[i];
		var og = OZ.DOM.elm("optgroup");
		og.style.backgroundColor = g.getAttribute("color") || "#fff";
		og.label = g.getAttribute("label");
		s.appendChild(og);
		var ts = g.getElementsByTagName("type");
		for (var j=0;j<ts.length;j++) {
			var t = ts[j];
			var o = OZ.DOM.elm("option");
			if (t.getAttribute("color")) { o.style.backgroundColor = t.getAttribute("color"); }
			if (t.getAttribute("note")) { o.title = t.getAttribute("note"); }
			o.innerHTML = t.getAttribute("label");
			og.appendChild(o);
		}
	}
	s.selectedIndex = id;
	return s;
}

SQL.Row.prototype.destroy = function() {
	SQL.Visual.prototype.destroy.apply(this);
	while (this.relations.length) {
		this.owner.owner.removeRelation(this.relations[0]);
	}
	for (var i=0;i<this.keys.length;i++){ 
		this.keys[i].removeRow(this);
	}
}

SQL.Row.prototype.toXML = function() {
	var xml = "";
	
	var t = this.getTitle().replace(/"/g,"&quot;");
	var nn = (this.data.nll ? "1" : "0");
	var ai = (this.data.ai ? "1" : "0");
	xml += '<row name="'+t+'" null="'+nn+'" autoincrement="'+ai+'">\n';

	var elm = this.getDataType();
	var t = elm.getAttribute("sql");
	if (this.data.size.length) { t += "("+this.data.size+")"; }
	xml += "<datatype>"+t+"</datatype>\n";
	
	if (this.data.def || this.data.def === null) {
		var q = elm.getAttribute("quote");
		var d = this.data.def;
		if (d === null) { 
			d = "NULL"; 
		} else if (d != "CURRENT_TIMESTAMP") { 
			d = q+d+q; 
		}
		xml += "<default>"+d+"</default>";
	}

	for (var i=0;i<this.relations.length;i++) {
		var r = this.relations[i];
		if (r.row2 != this) { continue; }
		xml += '<relation table="'+r.row1.owner.getTitle()+'" row="'+r.row1.getTitle()+'" />\n';
	}
	
	if (this.data.comment) { 
		var escaped = this.data.comment.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;");
		xml += "<comment>"+escaped+"</comment>\n"; 
	}
	
	xml += "</row>\n";
	return xml;
}

SQL.Row.prototype.fromXML = function(node) {
	var name = node.getAttribute("name");
	
	var obj = { type:0, size:"" };
	obj.nll = (node.getAttribute("null") == "1");
	obj.ai = (node.getAttribute("autoincrement") == "1");
	
	var cs = node.getElementsByTagName("comment");
	if (cs.length && cs[0].firstChild) { obj.comment = cs[0].firstChild.nodeValue; }
	
	var d = node.getElementsByTagName("datatype");
	if (d.length && d[0].firstChild) { 
		var s = d[0].firstChild.nodeValue;
		var r = s.match(/^([^\(]+)(\((.*)\))?.*$/);
		var type = r[1];
		if (r[3]) { obj.size = r[3]; }
		var types = window.DATATYPES.getElementsByTagName("type");
		for (var i=0;i<types.length;i++) {
			var sql = types[i].getAttribute("sql");
			var re = types[i].getAttribute("re");
			if (sql == type || (re && new RegExp(re).exec(type)) ) { obj.type = i; }
		}
	}
	
	var elm = DATATYPES.getElementsByTagName("type")[obj.type];
	var d = node.getElementsByTagName("default");
	if (d.length && d[0].firstChild) { 
		var def = d[0].firstChild.nodeValue;
		obj.def = def;
		var q = elm.getAttribute("quote");
		if (q) {
			var re = new RegExp("^"+q+"(.*)"+q+"$");
			var r = def.match(re);
			if (r) { obj.def = r[1]; }
		}
	}

	this.update(obj);
	this.setTitle(name);
}

SQL.Row.prototype.isPrimary = function() {
	for (var i=0;i<this.keys.length;i++) {
		var k = this.keys[i];
		if (k.getType() == "PRIMARY") { return true; }
	}
	return false;
}

SQL.Row.prototype.isUnique = function() {
	for (var i=0;i<this.keys.length;i++) {
		var k = this.keys[i];
		var t = k.getType();
		if (t == "PRIMARY" || t == "UNIQUE") { return true; }
	}
	return false;
}

SQL.Row.prototype.isKey = function() {
	return this.keys.length > 0;
}

SQL.Row.prototype.enter = function(e) {
	if (e.keyCode == 13) { 
		this.collapse();
	}
}

/* --------------------------- relation (connector) ----------- */

SQL.Relation = OZ.Class().extend(SQL.Visual);
SQL.Relation._counter = 0;
SQL.Relation.prototype.init = function(owner, row1, row2) {
	this.constructor._counter++;
	this.owner = owner;
	this.row1 = row1;
	this.row2 = row2;
	this.hidden = false;
	SQL.Visual.prototype.init.apply(this);
	
	this.row1.addRelation(this);
	this.row2.addRelation(this);
	
	this.dom = [];
	if (CONFIG.RELATION_COLORS) {
		var colorIndex = this.constructor._counter - 1;
		var color = CONFIG.RELATION_COLORS[colorIndex % CONFIG.RELATION_COLORS.length];
	} else {
		var color = "#000";
	}
	
	if (this.owner.vector) {
		var path = document.createElementNS(this.owner.svgNS, "path");
		path.setAttribute("stroke", color);
		path.setAttribute("stroke-width", CONFIG.RELATION_THICKNESS);
		path.setAttribute("fill", "none");
		this.owner.dom.svg.appendChild(path);
		this.dom.push(path);
	} else {
		for (var i=0;i<3;i++) {
			var div = OZ.DOM.elm("div",{position:"absolute",className:"relation",backgroundColor:color});
			this.dom.push(div);
			if (i & 1) { /* middle */
				OZ.Style.set(div,{width:CONFIG.RELATION_THICKNESS+"px"});
			} else { /* first & last */
				OZ.Style.set(div,{height:CONFIG.RELATION_THICKNESS+"px"});
			}
			this.owner.dom.container.appendChild(div);
		}
	}
	
	this.redraw();
}

SQL.Relation.prototype.show = function() {
	this.hidden = false;
	for (var i=0;i<this.dom.length;i++) {
		this.dom[i].style.visibility = "";
	}
}

SQL.Relation.prototype.hide = function() {
	this.hidden = true;
	for (var i=0;i<this.dom.length;i++) {
		this.dom[i].style.visibility = "hidden";
	}
}

SQL.Relation.prototype.redrawNormal = function(p1, p2, half) {
	if (this.owner.vector) {
		var str = "M "+p1[0]+" "+p1[1]+" C "+(p1[0] + half)+" "+p1[1]+" ";
		str += (p2[0]-half)+" "+p2[1]+" "+p2[0]+" "+p2[1];
		this.dom[0].setAttribute("d",str);
	} else {
		this.dom[0].style.left = p1[0]+"px";
		this.dom[0].style.top = p1[1]+"px";
		this.dom[0].style.width = half+"px";

		this.dom[1].style.left = (p1[0] + half) + "px";
		this.dom[1].style.top = Math.min(p1[1],p2[1]) + "px";
		this.dom[1].style.height = (Math.abs(p1[1] - p2[1])+CONFIG.RELATION_THICKNESS)+"px";

		this.dom[2].style.left = (p1[0]+half+1)+"px";
		this.dom[2].style.top = p2[1]+"px";
		this.dom[2].style.width = half+"px";
	}
}

SQL.Relation.prototype.redrawSide = function(p1, p2, x) {
	if (this.owner.vector) {
		var str = "M "+p1[0]+" "+p1[1]+" C "+x+" "+p1[1]+" ";
		str += x+" "+p2[1]+" "+p2[0]+" "+p2[1];
		this.dom[0].setAttribute("d",str);
	} else {
		this.dom[0].style.left = Math.min(x,p1[0])+"px";
		this.dom[0].style.top = p1[1]+"px";
		this.dom[0].style.width = Math.abs(p1[0]-x)+"px";
		
		this.dom[1].style.left = x+"px";
		this.dom[1].style.top = Math.min(p1[1],p2[1]) + "px";
		this.dom[1].style.height = (Math.abs(p1[1] - p2[1])+CONFIG.RELATION_THICKNESS)+"px";
		
		this.dom[2].style.left = Math.min(x,p2[0])+"px";
		this.dom[2].style.top = p2[1]+"px";
		this.dom[2].style.width = Math.abs(p2[0]-x)+"px";
	}
}

SQL.Relation.prototype.redraw = function() { /* draw connector */
	if (this.hidden) { return; }
	var t1 = this.row1.owner.dom.container;
	var t2 = this.row2.owner.dom.container;

	var l1 = t1.offsetLeft;
	var l2 = t2.offsetLeft;
	var r1 = l1 + t1.offsetWidth;
	var r2 = l2 + t2.offsetWidth;
	var t1 = t1.offsetTop + this.row1.dom.container.offsetTop + Math.round(this.row1.dom.container.offsetHeight/2);
	var t2 = t2.offsetTop + this.row2.dom.container.offsetTop + Math.round(this.row2.dom.container.offsetHeight/2);
	
	if (this.row1.owner.selected) { t1++; l1++; r1--; }
	if (this.row2.owner.selected) { t2++; l2++; r2--; }
	
	var p1 = [0,0];
	var p2 = [0,0];
	
	if (r1 < l2 || r2 < l1) { /* between tables */
		if (Math.abs(r1 - l2) < Math.abs(r2 - l1)) {
			p1 = [r1,t1];
			p2 = [l2,t2];
		} else {
			p1 = [r2,t2];
			p2 = [l1,t1];
		}
		var half = Math.floor((p2[0] - p1[0])/2);
		this.redrawNormal(p1, p2, half);
	} else { /* next to tables */
		var x = 0;
		var l = 0;
		if (Math.abs(l1 - l2) < Math.abs(r1 - r2)) { /* left of tables */
			p1 = [l1,t1];
			p2 = [l2,t2];
			x = Math.min(l1,l2) - CONFIG.RELATION_SPACING;
		} else { /* right of tables */
			p1 = [r1,t1];
			p2 = [r2,t2];
			x = Math.max(r1,r2) + CONFIG.RELATION_SPACING;
		}
		this.redrawSide(p1, p2, x);
	} /* line next to tables */
}

SQL.Relation.prototype.destroy = function() {
	this.row1.removeRelation(this);
	this.row2.removeRelation(this);
	for (var i=0;i<this.dom.length;i++) {
		this.dom[i].parentNode.removeChild(this.dom[i]);
	}
}

/* --------------------- db table ------------ */

SQL.Table = OZ.Class().extend(SQL.Visual);

SQL.Table.prototype.init = function(owner, name, x, y, z) {
	this.owner = owner;
	this.rows = [];
	this.keys = [];
	this.zIndex = 0;
	this._ec = [];

	this.flag = false;
	this.selected = false;
	SQL.Visual.prototype.init.apply(this);
	this.data.comment = "";
	
	this.setTitle(name);
	this.x = x || 0;
	this.y = y || 0;
	this.setZ(z);
	this.snap();
}

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

	this._ec.push(OZ.Event.add(this.dom.container, "click", this.bind(this.click)));
	this._ec.push(OZ.Event.add(this.dom.container, "dblclick", this.bind(this.dblclick)));
	this._ec.push(OZ.Event.add(this.dom.container, "mousedown", this.bind(this.down)));
	this._ec.push(OZ.Event.add(this.dom.container, "touchstart", this.bind(this.down)));
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

	this.dispatch("tableclick",this);
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

SQL.Table.prototype.removeKey = function(i) {
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
	
	this.documentMove = OZ.Event.add(document, moveEvent, this.bind(this.move));
	this.documentUp = OZ.Event.add(document, upEvent, this.bind(this.up));
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
		c = c.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;");
		xml += "<comment>"+c+"</comment>\n"; 
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

SQL.Table.prototype.addKey = function(type, name) {
	var i = new SQL.Key(this, type, name);
	this.keys.push(i);
	return i;
}

SQL.Table.prototype.removeKey = function(i) {
	var idx = this.keys.indexOf(i);
	if (idx == -1) { return; }
	i.destroy();
	this.keys.splice(idx,1);
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

/* --------------------- db index ------------ */

SQL.Key = OZ.Class().extend(SQL.Visual);

SQL.Key.prototype.init = function(owner, type, name) {
	this.owner = owner;
	this.rows = [];
	this.type = type || "INDEX";
	this.name = name || "";
	SQL.Visual.prototype.init.apply(this);
}

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

/* --------------------- rubberband -------------------- */

SQL.Rubberband = OZ.Class().extend(SQL.Visual);

SQL.Rubberband.prototype.init = function(owner) {
	this.owner = owner;
	SQL.Visual.prototype.init.apply(this);
	this.dom.container = OZ.$("rubberband");
	OZ.Event.add("area", "mousedown", this.bind(this.down));
}

SQL.Rubberband.prototype.down = function(e) {
	OZ.Event.prevent(e);
	var scroll = OZ.DOM.scroll();
	this.x = this.x0 = e.clientX + scroll[0];
	this.y = this.y0 = e.clientY + scroll[1];
	this.width = 0;
	this.height = 0;
	this.redraw();
	this.documentMove = OZ.Event.add(document, "mousemove", this.bind(this.move));
	this.documentUp = OZ.Event.add(document, "mouseup", this.bind(this.up));
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

/* --------------------- minimap ------------ */

SQL.Map = OZ.Class().extend(SQL.Visual);

SQL.Map.prototype.init = function(owner) {
	this.owner = owner;
	SQL.Visual.prototype.init.apply(this);
	this.dom.container = OZ.$("minimap");
	this.width = this.dom.container.offsetWidth - 2;
	this.height = this.dom.container.offsetHeight - 2;
	
	this.dom.port = OZ.DOM.elm("div",{className:"port", zIndex:1});
	this.dom.container.appendChild(this.dom.port);
	this.sync = this.bind(this.sync);
	
	this.flag = false;
	this.sync();
	
	OZ.Event.add(window, "resize", this.sync);
	OZ.Event.add(window, "scroll", this.sync);
	OZ.Event.add(this.dom.container, "mousedown", this.bind(this.down));
	OZ.Event.add(this.dom.container, "touchstart", this.bind(this.down));
	OZ.Event.add(this.dom.container, "touchmove", OZ.Event.prevent);
}

SQL.Map.prototype.down = function(e) { /* mousedown - move view and start drag */
	this.flag = true;
	this.dom.container.style.cursor = "move";
	var pos = OZ.DOM.pos(this.dom.container);

	this.x = Math.round(pos[0] + this.l + this.w/2);
	this.y = Math.round(pos[1] + this.t + this.h/2);
	this.move(e);
	
	if (e.type == "touchstart") {
		var eventMove = "touchmove";
		var eventUp = "touchend";
	} else {
		var eventMove = "mousemove";
		var eventUp = "mouseup";
	}

	this.documentMove = OZ.Event.add(document, eventMove, this.bind(this.move));
	this.documentUp = OZ.Event.add(document, eventUp, this.bind(this.up));
}

SQL.Map.prototype.move = function(e) { /* mousemove */
	if (!this.flag) { return; }
	OZ.Event.prevent(e);
	
	if (e.type.match(/touch/)) {
		if (e.touches.length > 1) { return; }
		var event = e.touches[0];
	} else {
		var event = e;
	}
	
	var dx = event.clientX - this.x;
	var dy = event.clientY - this.y;
	if (this.l + dx < 0) { dx = -this.l; }
	if (this.t + dy < 0) { dy = -this.t; }
	if (this.l + this.w + 4 + dx > this.width) { dx = this.width - 4 - this.l - this.w; }
	if (this.t + this.h + 4 + dy > this.height) { dy = this.height - 4 - this.t - this.h; }
	
	
	this.x += dx;
	this.y += dy;
	
	this.l += dx;
	this.t += dy;
	
	var coefX = this.width / this.owner.width;
	var coefY = this.height / this.owner.height;
	var left = this.l / coefX;
	var top = this.t / coefY;
	
	if (OZ.webkit) {
		document.body.scrollLeft = Math.round(left);
		document.body.scrollTop = Math.round(top);
	} else {
		document.documentElement.scrollLeft = Math.round(left);
		document.documentElement.scrollTop = Math.round(top);
	}
	
	this.redraw();
}

SQL.Map.prototype.up = function(e) { /* mouseup */
	this.flag = false;
	this.dom.container.style.cursor = "";
	OZ.Event.remove(this.documentMove);
	OZ.Event.remove(this.documentUp);
}

SQL.Map.prototype.sync = function() { /* when window changes, adjust map */
	var dims = OZ.DOM.win();
	var scroll = OZ.DOM.scroll();
	var scaleX = this.width / this.owner.width;
	var scaleY = this.height / this.owner.height;

	var w = dims[0] * scaleX - 4 - 0;
	var h = dims[1] * scaleY - 4 - 0;
	var x = scroll[0] * scaleX;
	var y = scroll[1] * scaleY;
	
	this.w = Math.round(w);
	this.h = Math.round(h);
	this.l = Math.round(x);
	this.t = Math.round(y);
	
	this.redraw();
}

SQL.Map.prototype.redraw = function() {
	this.dom.port.style.width = this.w+"px";
	this.dom.port.style.height = this.h+"px";
	this.dom.port.style.left = this.l+"px";
	this.dom.port.style.top = this.t+"px";
}

/* --------------------- io ------------ */

SQL.IO = OZ.Class();

SQL.IO.prototype.init = function(owner) {
	this.owner = owner;
	this._name = ""; /* last used keyword */
	this.dom = {
		container:OZ.$("io")
	};

	var ids = ["saveload","clientlocalsave", "clientsave", "clientlocalload","clientload", "clientsql", 
				"quicksave", "serversave", "serverload",
				"serverlist", "serverimport"];
	for (var i=0;i<ids.length;i++) {
		var id = ids[i];
		var elm = OZ.$(id);
		this.dom[id] = elm;
		elm.value = _(id);
	}
	
	this.dom.quicksave.value += " (F2)";

	var ids = ["client","server","output","backendlabel"];
	for (var i=0;i<ids.length;i++) {
		var id = ids[i];
		var elm = OZ.$(id);
		elm.innerHTML = _(id);
	}
	
	this.dom.ta = OZ.$("textarea");
	this.dom.backend = OZ.$("backend");
	
	this.dom.container.parentNode.removeChild(this.dom.container);
	this.dom.container.style.visibility = "";
	
	this.saveresponse = this.bind(this.saveresponse);
	this.loadresponse = this.bind(this.loadresponse);
	this.listresponse = this.bind(this.listresponse);
	this.importresponse = this.bind(this.importresponse);
	
	OZ.Event.add(this.dom.saveload, "click", this.bind(this.click));
	OZ.Event.add(this.dom.clientlocalsave, "click", this.bind(this.clientlocalsave));
	OZ.Event.add(this.dom.clientsave, "click", this.bind(this.clientsave));
	OZ.Event.add(this.dom.clientlocalload, "click", this.bind(this.clientlocalload));
	OZ.Event.add(this.dom.clientload, "click", this.bind(this.clientload));
	OZ.Event.add(this.dom.clientsql, "click", this.bind(this.clientsql));
	OZ.Event.add(this.dom.quicksave, "click", this.bind(this.quicksave));
	OZ.Event.add(this.dom.serversave, "click", this.bind(this.serversave));
	OZ.Event.add(this.dom.serverload, "click", this.bind(this.serverload));
	OZ.Event.add(this.dom.serverlist, "click", this.bind(this.serverlist));
	OZ.Event.add(this.dom.serverimport, "click", this.bind(this.serverimport));
	OZ.Event.add(document, "keydown", this.bind(this.press));
	this.build();
}

SQL.IO.prototype.build = function() {
	OZ.DOM.clear(this.dom.backend);

	var bs = CONFIG.AVAILABLE_BACKENDS;
	var be = CONFIG.DEFAULT_BACKEND;
	var r = window.location.search.substring(1).match(/backend=([^&]*)/);
	if (r) {
		req = r[1];
		if (bs.indexOf(req) != -1) {
		  be = req;
		}
	}
	for (var i=0;i<bs.length;i++) {
		var o = OZ.DOM.elm("option");
		o.value = bs[i];
		o.innerHTML = bs[i];
		this.dom.backend.appendChild(o);
		if (bs[i] == be) { this.dom.backend.selectedIndex = i; }
	}
}

SQL.IO.prototype.click = function() { /* open io dialog */
	this.build();
	this.dom.ta.value = "";
	this.dom.clientsql.value = _("clientsql") + " (" + window.DATATYPES.getAttribute("db") + ")";
	this.owner.window.open(_("saveload"),this.dom.container);
}

SQL.IO.prototype.fromXML = function(xmlDoc) {
	if (!xmlDoc || !xmlDoc.documentElement) {
		alert(_("xmlerror")+': Null document');
		return false; 
	}
	this.owner.fromXML(xmlDoc.documentElement);
	this.owner.window.close();
	return true;
}

SQL.IO.prototype.clientsave = function() {
	var xml = this.owner.toXML();
	this.dom.ta.value = xml;
}

SQL.IO.prototype.clientload = function() {
	var xml = this.dom.ta.value;
	if (!xml) {
		alert(_("empty"));
		return;
	}
	try {
		if (window.DOMParser) {
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(xml, "text/xml");
		} else if (window.ActiveXObject) {
			var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.loadXML(xml);
		} else {
			throw new Error("No XML parser available.");
		}
	} catch(e) { 
		alert(_("xmlerror")+': '+e.message);
		return;
	}
	this.fromXML(xmlDoc);
}

SQL.IO.prototype.clientlocalsave = function() {
	if (!window.localStorage) { 
		alert("Sorry, your browser does not seem to support localStorage.");
		return;
	}
	
	var xml = this.owner.toXML();
	if (xml.length >= (5*1024*1024)/2) { /* this is a very big db structure... */
		alert("Warning: your database structure is above 5 megabytes in size, this is above the localStorage single key limit allowed by some browsers, example Mozilla Firefox 10");
		return;
	}

	var key = prompt(_("serversaveprompt"), this._name) || "default";
	key = "wwwsqldesigner_databases_"+key;
	
	try {
		localStorage.setItem(key, xml);
		if (localStorage.getItem(key) != xml) { throw new Error("Content verification failed"); }
	} catch (e) {
		alert("Error saving database structure to localStorage! ("+e.message+")");
	}
}



SQL.IO.prototype.clientlocalload = function() {
	if (!window.localStorage) { 
		alert("Sorry, your browser does not seem to support localStorage.");
		return;
	}
	
	var key = prompt(_("serverloadprompt"), this._name) || "default";
	key = "wwwsqldesigner_databases_"+key;
	
	try {
		var xml = localStorage.getItem(key);
		if (!xml) { throw new Error("No data available"); }
	} catch (e) {
		alert("Error loading database structure from localStorage! ("+e.message+")");
		return;
	}
	
	try {
		if (window.DOMParser) {
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(xml, "text/xml");
		} else if (window.ActiveXObject) {
			var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.loadXML(xml);
		} else {
			throw new Error("No XML parser available.");
		}
	} catch(e) { 
		alert(_("xmlerror")+': '+e.message);
		return;
	}

	this.fromXML(xmlDoc);
}


SQL.IO.prototype.clientsql = function() {
	var bp = this.owner.getOption("staticpath");
	var path = bp + "db/"+window.DATATYPES.getAttribute("db")+"/output.xsl";
	this.owner.window.showThrobber();
	OZ.Request(path, this.bind(this.finish), {xml:true});
}

SQL.IO.prototype.finish = function(xslDoc) {
	this.owner.window.hideThrobber();
	var xml = this.owner.toXML();
	var sql = "";
	try {
		if (window.XSLTProcessor && window.DOMParser) {
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(xml, "text/xml");
			var xsl = new XSLTProcessor();
			xsl.importStylesheet(xslDoc);
			var result = xsl.transformToDocument(xmlDoc);
			sql = result.documentElement.textContent;
		} else if (window.ActiveXObject) {
			var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.loadXML(xml);
			sql = xmlDoc.transformNode(xslDoc);
		} else {
			throw new Error("No XSLT processor available");
		}
	} catch(e) {
		alert(_("xmlerror")+': '+e.message);
		return;
	}
	this.dom.ta.value = sql;
}

SQL.IO.prototype.serversave = function(e, keyword) {
	var name = keyword || prompt(_("serversaveprompt"), this._name);
	if (!name) { return; }
	this._name = name;
	var xml = this.owner.toXML();
	var bp = this.owner.getOption("xhrpath");
	var url = bp + "backend/"+this.dom.backend.value+"/?action=save&keyword="+encodeURIComponent(name);
	var h = {"Content-type":"application/xml"};
	this.owner.window.showThrobber();
	this.owner.setTitle(name);
	OZ.Request(url, this.saveresponse, {xml:true, method:"post", data:xml, headers:h});
}

SQL.IO.prototype.quicksave = function(e) {
	this.serversave(e, this._name);
}

SQL.IO.prototype.serverload = function(e, keyword) {
	var name = keyword || prompt(_("serverloadprompt"), this._name);
	if (!name) { return; }
	this._name = name;
	var bp = this.owner.getOption("xhrpath");
	var url = bp + "backend/"+this.dom.backend.value+"/?action=load&keyword="+encodeURIComponent(name);
	this.owner.window.showThrobber();
	this.name = name;
	OZ.Request(url, this.loadresponse, {xml:true});
}

SQL.IO.prototype.serverlist = function(e) {
	var bp = this.owner.getOption("xhrpath");
	var url = bp + "backend/"+this.dom.backend.value+"/?action=list";
	this.owner.window.showThrobber();
	OZ.Request(url, this.listresponse);
}

SQL.IO.prototype.serverimport = function(e) {
	var name = prompt(_("serverimportprompt"), "");
	if (!name) { return; }
	var bp = this.owner.getOption("xhrpath");
	var url = bp + "backend/"+this.dom.backend.value+"/?action=import&database="+name;
	this.owner.window.showThrobber();
	OZ.Request(url, this.importresponse, {xml:true});
}

SQL.IO.prototype.check = function(code) {
	switch (code) {
		case 201:
		case 404:
		case 500:
		case 501:
		case 503:
			var lang = "http"+code;
			this.dom.ta.value = _("httpresponse")+": "+_(lang);
			return false;
		break;
		default: return true;
	}
}

SQL.IO.prototype.saveresponse = function(data, code) {
	this.owner.window.hideThrobber();
	this.check(code);
}

SQL.IO.prototype.loadresponse = function(data, code) {
	this.owner.window.hideThrobber();
	if (!this.check(code)) { return; }
	this.fromXML(data);
	this.owner.setTitle(this.name);
}

SQL.IO.prototype.listresponse = function(data, code) {
	this.owner.window.hideThrobber();
	if (!this.check(code)) { return; }
	this.dom.ta.value = data;
}

SQL.IO.prototype.importresponse = function(data, code) {
	this.owner.window.hideThrobber();
	if (!this.check(code)) { return; }
	if (this.fromXML(data)) {
		this.owner.alignTables();
	}
}

SQL.IO.prototype.press = function(e) {
	switch (e.keyCode) {
		case 113:
			if (OZ.opera) {
				e.preventDefault();
			}
			this.quicksave(e);
		break;
	}
}

/* --------------------- table manager ------------ */

SQL.TableManager = OZ.Class();

SQL.TableManager.prototype.init = function(owner) {
	this.owner = owner;
	this.dom = {
		container:OZ.$("table"),
		name:OZ.$("tablename"),
		comment:OZ.$("tablecomment")
	};
	this.selection = [];
	this.adding = false;
	
	var ids = ["addtable","removetable","aligntables","cleartables","addrow","edittable","tablekeys"];
	for (var i=0;i<ids.length;i++) {
		var id = ids[i];
		var elm = OZ.$(id);
		this.dom[id] = elm;
		elm.value = _(id);
	}

	var ids = ["tablenamelabel","tablecommentlabel"];
	for (var i=0;i<ids.length;i++) {
		var id = ids[i];
		var elm = OZ.$(id);
		elm.innerHTML = _(id);
	}
	
	
	this.select(false);
	
	this.save = this.bind(this.save);
	
	OZ.Event.add("area", "click", this.bind(this.click));
	OZ.Event.add(this.dom.addtable, "click", this.bind(this.preAdd));
	OZ.Event.add(this.dom.removetable, "click", this.bind(this.remove));
	OZ.Event.add(this.dom.cleartables, "click", this.bind(this.clear));
	OZ.Event.add(this.dom.addrow, "click", this.bind(this.addRow));
	OZ.Event.add(this.dom.aligntables, "click", this.owner.bind(this.owner.alignTables));
	OZ.Event.add(this.dom.edittable, "click", this.bind(this.edit));
	OZ.Event.add(this.dom.tablekeys, "click", this.bind(this.keys));
	OZ.Event.add(document, "keydown", this.bind(this.press));

	this.dom.container.parentNode.removeChild(this.dom.container);
}

SQL.TableManager.prototype.addRow = function(e) {
	var newrow = this.selection[0].addRow(_("newrow"));
	this.owner.rowManager.select(newrow);
	newrow.expand();
}

SQL.TableManager.prototype.select = function(table, multi) { /* activate table */
	if (table) {
		if (multi) {
			var i = this.selection.indexOf(table);
			if (i < 0) {
				this.selection.push(table);
			} else {
				this.selection.splice(i, 1);
			}
		} else {
			if (this.selection[0] === table) { return; }
			this.selection = [table];
		}
	} else {
		this.selection = [];
	}
	this.processSelection();
}

SQL.TableManager.prototype.processSelection = function() {
	var tables = this.owner.tables;
	for (var i=0;i<tables.length;i++) {
		tables[i].deselect();
	}
	if (this.selection.length == 1) {
		this.dom.addrow.disabled = false;
		this.dom.edittable.disabled = false;
		this.dom.tablekeys.disabled = false;
		this.dom.removetable.value = _("removetable");
	} else {
		this.dom.addrow.disabled = true;
		this.dom.edittable.disabled = true;
		this.dom.tablekeys.disabled = true;
	}
	if (this.selection.length) {
		this.dom.removetable.disabled = false;
		if (this.selection.length > 1) { this.dom.removetable.value = _("removetables"); }
	} else {
		this.dom.removetable.disabled = true;
		this.dom.removetable.value = _("removetable");
	}
	for (var i=0;i<this.selection.length;i++) {
		var t = this.selection[i];
		t.owner.raise(t);
		t.select();
	}
}

SQL.TableManager.prototype.selectRect = function(x,y,width,height) { /* select all tables intersecting a rectangle */
	this.selection = [];
	var tables = this.owner.tables;
	var x1 = x+width;
	var y1 = y+height;
	for (var i=0;i<tables.length;i++) {
		var t = tables[i];
		var tx = t.x;
		var tx1 = t.x+t.width;
		var ty = t.y;
		var ty1 = t.y+t.height;
		if (((tx>=x && tx<x1) || (tx1>=x && tx1<x1) || (tx<x && tx1>x1)) &&
		    ((ty>=y && ty<y1) || (ty1>=y && ty1<y1) || (ty<y && ty1>y1)))
			{ this.selection.push(t); }
	}
	this.processSelection();
}

SQL.TableManager.prototype.click = function(e) { /* finish adding new table */
	var newtable = false;
	if (this.adding) {
		this.adding = false;
		OZ.DOM.removeClass("area","adding");
		this.dom.addtable.value = this.oldvalue;
		var scroll = OZ.DOM.scroll();
		var x = e.clientX + scroll[0];
		var y = e.clientY + scroll[1];
		newtable = this.owner.addTable(_("newtable"),x,y);
		var r = newtable.addRow("id",{ai:true});
		var k = newtable.addKey("PRIMARY","");
		k.addRow(r);
	}
	this.select(newtable);
	this.owner.rowManager.select(false);
	if (this.selection.length == 1) { this.edit(e); }
}

SQL.TableManager.prototype.preAdd = function(e) { /* click add new table */
	if (this.adding) {
		this.adding = false;
		OZ.DOM.removeClass("area","adding");
		this.dom.addtable.value = this.oldvalue;
	} else {
		this.adding = true;
		OZ.DOM.addClass("area","adding");
		this.oldvalue = this.dom.addtable.value;
		this.dom.addtable.value = "["+_("addpending")+"]";
	}
}

SQL.TableManager.prototype.clear = function(e) { /* remove all tables */
	if (!this.owner.tables.length) { return; }
	var result = confirm(_("confirmall")+" ?");
	if (!result) { return; }
	this.owner.clearTables();
}

SQL.TableManager.prototype.remove = function(e) {
	var titles = this.selection.slice(0);
	for (var i=0;i<titles.length;i++) { titles[i] = "'"+titles[i].getTitle()+"'"; }
	var result = confirm(_("confirmtable")+" "+titles.join(", ")+"?");
	if (!result) { return; }
	var sel = this.selection.slice(0);
	for (var i=0;i<sel.length;i++) { this.owner.removeTable(sel[i]); }
}

SQL.TableManager.prototype.edit = function(e) {
	this.owner.window.open(_("edittable"), this.dom.container, this.save);
	
	var title = this.selection[0].getTitle();
	this.dom.name.value = title;
	try { /* throws in ie6 */
		this.dom.comment.value = this.selection[0].getComment();
	} catch(e) {}

	/* pre-select table name */
	this.dom.name.focus();
	if (OZ.ie) {
		try { /* throws in ie6 */
			this.dom.name.select();
		} catch(e) {}
	} else {
		this.dom.name.setSelectionRange(0, title.length);
	} 
}

SQL.TableManager.prototype.keys = function(e) { /* open keys dialog */
	this.owner.keyManager.open(this.selection[0]);
}

SQL.TableManager.prototype.save = function() {
	this.selection[0].setTitle(this.dom.name.value);
	this.selection[0].setComment(this.dom.comment.value);
}

SQL.TableManager.prototype.press = function(e) {
	var target = OZ.Event.target(e).nodeName.toLowerCase();
	if (target == "textarea" || target == "input") { return; } /* not when in form field */
	
	if (this.owner.rowManager.selected) { return; } /* do not process keypresses if a row is selected */

	if (!this.selection.length) { return; } /* nothing if selection is active */

	switch (e.keyCode) {
		case 46:
			this.remove();
			OZ.Event.prevent(e);
		break;
	}
}

/* --------------------- row manager ------------ */

SQL.RowManager = OZ.Class();

SQL.RowManager.prototype.init = function(owner) {
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
	
	OZ.Event.add(this.dom.editrow, "click", this.bind(this.edit));
	OZ.Event.add(this.dom.uprow, "click", this.bind(this.up));
	OZ.Event.add(this.dom.downrow, "click", this.bind(this.down));
	OZ.Event.add(this.dom.removerow, "click", this.bind(this.remove));
	OZ.Event.add(this.dom.foreigncreate, "click", this.bind(this.foreigncreate));
	OZ.Event.add(this.dom.foreignconnect, "click", this.bind(this.foreignconnect));
	OZ.Event.add(this.dom.foreigndisconnect, "click", this.bind(this.foreigndisconnect));
	OZ.Event.add(false, "tableclick", this.bind(this.tableClick));
	OZ.Event.add(false, "rowclick", this.bind(this.rowClick));
	OZ.Event.add(document, "keydown", this.bind(this.press));
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

/* ----------------- key manager ---------- */

SQL.KeyManager = OZ.Class();

SQL.KeyManager.prototype.init = function(owner) {
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

	this.purge = this.bind(this.purge);

	OZ.Event.add(this.dom.list, "change", this.bind(this.listchange));
	OZ.Event.add(this.dom.type, "change", this.bind(this.typechange));
	OZ.Event.add(this.dom.name, "keyup", this.bind(this.namechange));
	OZ.Event.add(this.dom.keyadd, "click", this.bind(this.add));
	OZ.Event.add(this.dom.keyremove, "click", this.bind(this.remove));
	OZ.Event.add(this.dom.left, "click", this.bind(this.left));
	OZ.Event.add(this.dom.right, "click", this.bind(this.right));
	
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

/* --------------------- window ------------ */

SQL.Window = OZ.Class();

SQL.Window.prototype.init = function(owner) {
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
	OZ.Event.add(this.dom.ok, "click", this.bind(this.ok));
	OZ.Event.add(this.dom.cancel, "click", this.bind(this.close));
	OZ.Event.add(document, "keydown", this.bind(this.key));
	
	this.sync = this.bind(this.sync);
	
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

/* --------------------- options ------------ */

SQL.Options = OZ.Class();

SQL.Options.prototype.init = function(owner) {
	this.owner = owner;
	this.dom = {
		container:OZ.$("opts"),
		btn:OZ.$("options")
	}
	this.dom.btn.value = _("options");
	this.save = this.bind(this.save);
	this.build();
}

SQL.Options.prototype.build = function() {
	this.dom.optionlocale = OZ.$("optionlocale");
	this.dom.optiondb = OZ.$("optiondb");
	this.dom.optionsnap = OZ.$("optionsnap");
	this.dom.optionpattern = OZ.$("optionpattern");
	this.dom.optionhide = OZ.$("optionhide");
	this.dom.optionvector = OZ.$("optionvector");
	this.dom.optionshowsize = OZ.$("optionshowsize");
	this.dom.optionshowtype = OZ.$("optionshowtype");

	var ids = ["language","db","snap","pattern","hide","vector","showsize","showtype","optionsnapnotice","optionpatternnotice","optionsnotice"];
	for (var i=0;i<ids.length;i++) {
		var id = ids[i];
		var elm = OZ.$(id);
		elm.innerHTML = _(id);
	}
	
	var ls = CONFIG.AVAILABLE_LOCALES;
	OZ.DOM.clear(this.dom.optionlocale);
	for (var i=0;i<ls.length;i++) {
		var o = OZ.DOM.elm("option");
		o.value = ls[i];
		o.innerHTML = ls[i];
		this.dom.optionlocale.appendChild(o);
		if (this.owner.getOption("locale") == ls[i]) { this.dom.optionlocale.selectedIndex = i; }
	}

	var dbs = CONFIG.AVAILABLE_DBS;
	OZ.DOM.clear(this.dom.optiondb);
	for (var i=0;i<dbs.length;i++) {
		var o = OZ.DOM.elm("option");
		o.value = dbs[i];
		o.innerHTML = dbs[i];
		this.dom.optiondb.appendChild(o);
		if (this.owner.getOption("db") == dbs[i]) { this.dom.optiondb.selectedIndex = i; }
	}

	
	OZ.Event.add(this.dom.btn, "click", this.bind(this.click));
	
	this.dom.container.parentNode.removeChild(this.dom.container);
}

SQL.Options.prototype.save = function() {
	this.owner.setOption("locale",this.dom.optionlocale.value);
	this.owner.setOption("db",this.dom.optiondb.value);
	this.owner.setOption("snap",this.dom.optionsnap.value);
	this.owner.setOption("pattern",this.dom.optionpattern.value);
	this.owner.setOption("hide",this.dom.optionhide.checked ? "1" : "");
	this.owner.setOption("vector",this.dom.optionvector.checked ? "1" : "");
	this.owner.setOption("showsize",this.dom.optionshowsize.checked ? "1" : "");
	this.owner.setOption("showtype",this.dom.optionshowtype.checked ? "1" : "");
}

SQL.Options.prototype.click = function() {
	this.owner.window.open(_("options"),this.dom.container,this.save);
	this.dom.optionsnap.value = this.owner.getOption("snap");
	this.dom.optionpattern.value = this.owner.getOption("pattern");
	this.dom.optionhide.checked = this.owner.getOption("hide");
	this.dom.optionvector.checked = this.owner.getOption("vector");
	this.dom.optionshowsize.checked = this.owner.getOption("showsize");
	this.dom.optionshowtype.checked = this.owner.getOption("showtype");
}

/* ------------------ minimize/restore bar ----------- */

SQL.Toggle = OZ.Class();

SQL.Toggle.prototype.init = function(elm) {
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

/* --------------------- www sql designer ------------ */

SQL.Designer = OZ.Class().extend(SQL.Visual);

SQL.Designer.prototype.init = function() {
	SQL.Designer = this;
	
	this.tables = [];
	this.relations = [];
	this.title = document.title;
	
	SQL.Visual.prototype.init.apply(this);
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
}

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
	OZ.Request(url, this.bind(this.languageResponse), {method:"get", xml:true});
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
	OZ.Request(url, this.bind(this.dbResponse), {method:"get", xml:true});
}

SQL.Designer.prototype.dbResponse = function(xmlDoc) {
	if (xmlDoc) {
		window.DATATYPES = xmlDoc.documentElement;
	}
	this.flag--;
	if (!this.flag) { this.init2(); }
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
	xml += '<!-- SQL XML created by WWW SQL Designer, http://code.google.com/p/wwwsqldesigner/ -->\n';
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

OZ.Event.add(window, "beforeunload", function(e) { OZ.Event.prevent(e); return ""; });
