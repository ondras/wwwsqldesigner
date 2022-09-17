/* ------------------ minimize/restore bar ----------- */

SQL.Toggle = function (elm) {
    this._state = null;
    this._elm = elm;
    OZ.Event.add(elm, "click", this._click.bind(this));
    OZ.Event.add(document, "keydown", this.press.bind(this));

    var defaultState = true;
    if (document.location.href.match(/toolbar=hidden/)) {
        defaultState = false;
    }
    this._switch(defaultState);
};

SQL.Toggle.prototype._click = function (e) {
    this._switch(!this._state);
};

SQL.Toggle.prototype._switch = function (state) {
    this._state = state;
    if (this._state) {
        OZ.$("bar").style.maxHeight = "";
    } else {
        OZ.$("bar").style.overflow = "hidden";
        OZ.$("bar").style.maxHeight = this._elm.offsetHeight + "px";
    }
    this._elm.className = this._state ? "on" : "off";
};

SQL.Toggle.prototype.press = function (e) {
    var target = OZ.Event.target(e).nodeName.toLowerCase();

    if (target === "textarea" || target === "input") {
        return;
    } /* not when in form field */

    switch (e.keyCode) {
        case CONFIG.SHORTCUTS.TOGGLE.CODE:
            if (e.ctrlKey) return;
            this._switch(!this._state);
            OZ.Event.prevent(e);
            break;
    }
};
