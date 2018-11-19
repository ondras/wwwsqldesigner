/* --------------------- options ------------ */

SQL.Options = function (owner) {
    this.owner = owner;
    this.dom = {
        container: OZ.$("opts"),
        btn: OZ.$("options")
    };
    this.dom.btn.innerHTML = _("options");
    this.save = this.save.bind(this);
    this.build();
}

SQL.Options.prototype.build = function () {
    this.dom.optionlocale = OZ.$("optionlocale");
    this.dom.optiondb = OZ.$("optiondb");
    this.dom.optionpattern = OZ.$("optionpattern");
    this.dom.optionsnap = OZ.$("optionsnap");
    this.dom.optionselectstrategy = OZ.$("optionselectstrategy");
    this.dom.optionhide = OZ.$("optionhide");
    this.dom.optionvector = OZ.$("optionvector");
    this.dom.optionshowsize = OZ.$("optionshowsize");
    this.dom.optionshowtype = OZ.$("optionshowtype");
    this.dom.optionusematerialcolors = OZ.$("optionusematerialcolors");

    var ids = ["language", "db", "snap", "pattern", "hide", "vector", "showsize", "showtype", "optionsnapnotice", "selectstrategy", "optionprecise", "optionlazy", "optionpatternnotice", "optionsnotice", "materialcolors"];
    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        var elm = OZ.$(id);
        elm.innerHTML = _(id);
    }

    var ls = CONFIG.AVAILABLE_LOCALES;
    OZ.DOM.clear(this.dom.optionlocale);
    for (var i = 0; i < ls.length; i++) {
        var o = OZ.DOM.elm("option");
        o.value = ls[i];
        o.innerHTML = ls[i];
        this.dom.optionlocale.appendChild(o);
        if (this.owner.getOption("locale") == ls[i]) {
            this.dom.optionlocale.selectedIndex = i;
        }
    }

    var dbs = CONFIG.AVAILABLE_DBS;
    OZ.DOM.clear(this.dom.optiondb);
    for (var i = 0; i < dbs.length; i++) {
        var o = OZ.DOM.elm("option");
        o.value = dbs[i];
        o.innerHTML = dbs[i];
        this.dom.optiondb.appendChild(o);
        if (this.owner.getOption("db") == dbs[i]) {
            this.dom.optiondb.selectedIndex = i;
        }
    }


    OZ.Event.add(this.dom.btn, "click", this.click.bind(this));

    this.dom.container.parentNode.removeChild(this.dom.container);
};

SQL.Options.prototype.save = function () {
    this.owner.setOption("locale", this.dom.optionlocale.value);
    this.owner.setOption("db", this.dom.optiondb.value);
    this.owner.setOption("pattern", this.dom.optionpattern.value);
    this.owner.setOption("snap", this.dom.optionsnap.value);
    this.owner.setOption("selectstrategy", this.dom.optionselectstrategy.value);
    this.owner.setOption("hide", this.dom.optionhide.checked ? "1" : "");
    this.owner.setOption("vector", this.dom.optionvector.checked ? "1" : "");
    this.owner.setOption("showsize", this.dom.optionshowsize.checked ? "1" : "");
    this.owner.setOption("showtype", this.dom.optionshowtype.checked ? "1" : "");
    this.owner.setOption("materialcolors", this.dom.optionusematerialcolors.checked ? "1" : "");
}

SQL.Options.prototype.click = function () {
    this.owner.window.open(_("options"), this.dom.container, this.save);
    this.dom.optionpattern.value = this.owner.getOption("pattern");
    this.dom.optionsnap.value = this.owner.getOption("snap");
    this.dom.optionselectstrategy.value = this.owner.getOption("selectstrategy") || "lazy";
    this.dom.optionhide.checked = this.owner.getOption("hide");
    this.dom.optionvector.checked = this.owner.getOption("vector");
    this.dom.optionshowsize.checked = this.owner.getOption("showsize");
    this.dom.optionshowtype.checked = this.owner.getOption("showtype");
    this.dom.optionusematerialcolors.checked = this.owner.getOption("materialcolors");
}
