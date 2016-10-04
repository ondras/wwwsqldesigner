/* global SQL, OZ */

SQL.Snackbar = function (owner, elm) {
    this.lifeSpan = 3000;
    this.life;
    this.owner = owner;
    this.elm = elm;
    this.p = OZ.DOM.elm('p');
    this.isShowing = false;

    OZ.DOM.append([this.elm, this.p]);
};
SQL.Snackbar.prototype.show = function (text, inmortal) {
    if (!text)
        return false;

    var self = this;
    this.p.innerHTML = text;
    this.elm.style.transform = "translate(0px, 0px)";
    this.isShowing = true;
    if (!inmortal) {
        this.life = setTimeout(function () {
            self.hide();
        }, this.lifeSpan);
    }
    return this.elm;
};
SQL.Snackbar.prototype.hide = function () {
    this.elm.style.transform = "translate(0px, -48px)";
    this.isShowing = false;
    return this.elm;

};
SQL.Snackbar.prototype.toggle = function (text, inmortal) {
    if (this.isShowing) {
        this.hide();
    } else {
        this.show(text);
    }
};
