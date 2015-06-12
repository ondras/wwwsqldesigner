function _(str) { /* getText */
	if (!(str in window.LOCALE)) { return str; }
	return window.LOCALE[str];
}

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

var DATATYPES = false;
var LOCALE = {};
var SQL = {};
