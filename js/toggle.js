/* ------------------ minimize/restore bar ----------- */
/* global SQL, OZ */

SQL.Toggle = function (elm, min) {
    this._state = null;
    this.elm = elm;
    this.elmMin = min;
    this.bar = OZ.$("bar");

    var win = OZ.DOM.win();
    this.bar.style.left = Math.round((win[0] - this.bar.offsetWidth) / 2) + "px";

    var defaultState = true;
    if (document.location.href.match(/toolbar=hidden/)) {
        defaultState = false;
    }
    OZ.Event.add(this.elm, "click", this._click.bind(this));
    OZ.Event.add(this.elmMin, "click", this._click.bind(this));
    OZ.Event.add(window, "resize", this.sync.bind(this));
    this._switch(defaultState);
};

SQL.Toggle.prototype._click = function (e) {
    this._switch(!this._state);
};

SQL.Toggle.prototype._switch = function (state) {
    this._state = state;
    var win = OZ.DOM.win();
    if (this._state) {
        // show full bar
        this.bar.style.left = Math.round((win[0] - this.bar.offsetWidth) / 2) + "px";
        this.bar.style.transform = "translate(0px, 0px)";
        this.elmMin.style.transitionDelay = "0s";
        this.elmMin.style.transform = "translate(0px, 100px)";
    } else {
        // hide bar
        this.bar.style.transform = "translate(0px, 160px)";
        this.elmMin.style.left = Math.round((win[0] - this.elmMin.offsetWidth) / 2) + "px";
        this.elmMin.style.transitionDelay = "350ms";
        this.elmMin.style.transform = "translate(0px, 0px)";
    }
};

SQL.Toggle.prototype.sync = function () {
    var win = OZ.DOM.win();
    if (this._state)
        this.bar.style.left = Math.round((win[0] - this.bar.offsetWidth) / 2) + "px";
    else
        this.elmMin.style.left = Math.round((win[0] - this.elmMin.offsetWidth) / 2) + "px";
};