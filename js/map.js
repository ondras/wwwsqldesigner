/* --------------------- minimap ------------ */

SQL.Map = function(owner) {
	this.owner = owner;
	SQL.Visual.apply(this);
        this.dom.container = OZ.$("minimapcontainer");
	this.dom.minimap = OZ.$("minimap");
        this.dom.zoomlevel = OZ.$("zoomlevel");
        this.dom.buttons = OZ.$('minimapbuttons');
        this.dom.zoomin = OZ.$("zoomin");
        this.dom.zoomout = OZ.$("zoomout");
        
	this.width = this.dom.minimap.offsetWidth - 2;
	this.height = this.dom.minimap.offsetHeight - 2;

	this.dom.port = OZ.DOM.elm("div",{className:"port", zIndex:1});
	this.dom.minimap.appendChild(this.dom.port);
	this.sync = this.sync.bind(this);
        this.zScale = 1;
        
	this.flag = false;
	this.sync();

	OZ.Event.add(window, "resize", this.sync);
	OZ.Event.add(window, "scroll", this.sync);
        OZ.Event.add(this.dom.container, "mouseenter", this.onEnter.bind(this));
        OZ.Event.add(this.dom.container, "mouseleave", this.onLeave.bind(this));
	OZ.Event.add(this.dom.minimap, "mousedown", this.down.bind(this));
	OZ.Event.add(this.dom.minimap, "touchstart", this.down.bind(this));
	OZ.Event.add(this.dom.minimap, "touchmove", OZ.Event.prevent);
        OZ.Event.add(this.dom.zoomin, "click", this.zoom.bind(this, .05));
        OZ.Event.add(this.dom.zoomout, "click", this.zoom.bind(this, -.05));
        OZ.Event.add(document, "keydown", this.press.bind(this));

}
SQL.Map.prototype = Object.create(SQL.Visual.prototype);

SQL.Map.prototype.appendChild = function (elm) {
        if (elm instanceof Element)
            this.dom.minimap.appendChild(elm);
};

SQL.Map.prototype.down = function(e) { /* mousedown - move view and start drag */
	this.flag = true;
	this.dom.minimap.style.cursor = "move";
	var pos = OZ.DOM.pos(this.dom.minimap);

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

	this.documentMove = OZ.Event.add(document, eventMove, this.move.bind(this));
	this.documentUp = OZ.Event.add(document, eventUp, this.up.bind(this));
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
	this.dom.minimap.style.cursor = "";
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

SQL.Map.prototype.zoom = function (level) {
        this.zScale += level;
        this.dom.zoomlevel.innerHTML = this.zScale === 1 ? '' : this.zScale.toFixed(2);
        OZ.$('area').style.transform = "scale(" + this.zScale + "," + this.zScale +")";
};

SQL.Map.prototype.press = function (e) {
        var target = OZ.Event.target(e).nodeName.toLowerCase();

        if (target === "textarea" || target === "input") {
            return;
        } /* not when in form field */

        if (this.owner.rowManager.selected) {
            return;
        } /* do not process keypresses if a row is selected */

        switch (e.keyCode) {
            case 107:
                //num plus
                this.zoom(0.05);
                break;
            case 109:
                //num minus
                this.zoom(-0.05);
                break;
        }
};

SQL.Map.prototype.onEnter = function (e) {
        this.dom.port.style.borderColor = "rgba(0,0,0,0.8)";
        this.dom.buttons.style.transform = "translateY(0)";
        this.dom.buttons.style.opacity = "1";
};

SQL.Map.prototype.onLeave = function (e) {
        this.dom.port.style.borderColor = "rgba(0,0,0,0.3)";
        this.dom.buttons.style.transform = "translateY(-40px)";
        this.dom.buttons.style.opacity = "0";
};