/* ------------------ minimize/restore bar ----------- */
/* global SQL, OZ, CONFIG */

SQL.Tooltip = function (owner, elm) {
    this._state = null;
    this.owner = owner;
    this.elm = elm;
    OZ.Event.add(this.owner, "mouseenter", this._enter.bind(this));
    OZ.Event.add(this.owner, "mouseleave", this._leave.bind(this));
    OZ.Event.add(this.owner, "click", this._click.bind(this));
    this._update();
};

SQL.Tooltip.prototype._click = function (e) {
    OZ.DOM.removeClass(this.elm, 'is-active');
};

SQL.Tooltip.prototype._enter = function (e) {
    this._update();
    OZ.DOM.addClass(this.elm, 'is-active');
};

SQL.Tooltip.prototype._leave = function (e) {
    OZ.DOM.removeClass(this.elm, 'is-active');
};

SQL.Tooltip.prototype._update = function () {
    var shortcut = CONFIG.SHORTCUTS[this.owner.id];
    this.elm.innerHTML = _(this.owner.id) + (shortcut && shortcut.code ? ' [' + shortcut.key + ']' : '');
    this.x = (this.owner.offsetLeft + (this.owner.offsetWidth / 2)) - (this.elm.offsetWidth / 2);

    if (this.owner.className.indexOf('small') !== -1)
        this.y = this.owner.offsetTop - (this.owner.offsetHeight * 2);
    else
        this.y = this.owner.offsetTop - (this.owner.offsetHeight);

    this.elm.style.top = this.y + 'px';
    this.elm.style.left = this.x + 'px';
};