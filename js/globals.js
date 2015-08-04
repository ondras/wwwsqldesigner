function _(str) { /* getText */
	if (!(str in window.LOCALE)) { return str; }
	return window.LOCALE[str];
}

if (typeof String.prototype.endsWith !== 'function') {
	String.prototype.endsWith = function(suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
}

if (!String.prototype.trim) {
	String.prototype.trim = function() {
		return this.match(/^\s*([\s\S]*?)\s*$/)[1];
	}
}

if (!String.trim) {
	String.trim = function(obj) { return String.prototype.trim.call(obj);}
}

if (!Object.create) {
	Object.create = function (o) {
		if (arguments.length > 1) { throw new Error("Object.create polyfill only accepts the first parameter"); }
		var tmp = function() {};
		tmp.prototype = o;
		return new tmp();
	};
}

var DATATYPES = false;
var LOCALE = {};
var SQL = {
	_subscribers: {},
	
	publish: function(message, publisher, data) {
		var subscribers = this._subscribers[message] || [];
		var obj = {
			target: publisher,
			data: data
		}
		subscribers.forEach(function(subscriber) { subscriber(obj); });
	},
	
	subscribe: function(message, subscriber) {
		if (!(message in this._subscribers)) {
			this._subscribers[message] = [];
		}
		var index = this._subscribers[message].indexOf(subscriber);
		if (index == -1) { this._subscribers[message].push(subscriber); }
	},
	
	unsubscribe: function(message, subscriber) {
		var index = this._subscribers[message].indexOf(subscriber);
		if (index > -1) { this._subscribers[message].splice(index, 1); }
	},

	escape: function(str) {
		return str.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;");
	}
}

window.onbeforeunload = function(e) {
	return ""; /* some browsers will show this text, some won't. */
}
