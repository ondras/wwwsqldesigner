WWW SQL Designer allows users to create database designs, which can be saved/loaded and exported to SQL scripts. Various databases and languages are supported. Ability to import existing database design.

[YouTube video](http://www.youtube.com/watch?v=hCQzJx9AKhU), [User manual](https://github.com/ondras/wwwsqldesigner/wiki/Manual)

# About

Hi and welcome to WWW SQL Designer! This tool allows you to draw and create database schemas (E-R diagrams) directly in browser, without the need for any external programs (flash). You only need JavaScript enabled.
The Designer works perfectly in Chrome, Mozilla (Firefox, Seamonkey), Internet Explorer, MS Edge, Safari and Opera.

Many database features are supported, such as keys, foreign key constraints, comments and indexes. You can either save your design (for further loading & modifications), print it or export as SQL script. It is possible to retrieve (import) schema from existing database.

WWW SQL Designer was created by [Ondrej Zara](http://ondras.zarovi.cz/) and is built atop the [oz.js](http://code.google.com/p/oz-js/) JavaScript module. It is distributed under New BSD license.

If you wish to support this project, <a href='https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=3340079'><img src='https://www.paypal.com/en_GB/i/btn/btn_donate_LG.gif' alt='Donate at PayPal' title='Donate at PayPal' /></a> at PayPal!

# Quick Start

## Local Installation:

1. `npm install http-server -g`
2. Run `http-server` in the root of this repo to start a simple http server
3. Visit http://127.0.0.1:8080

## Docker Installation:

1. Build `docker build -t wwwsqldesigner .`
2. Run   `docker run -d -p 8080:80 wwwsqldesigner`
3. Visit http://127.0.0.1:8080

# News

## Moved to GitHub

Google Code is closing down, we are now completely migrated to GitHub.

## Experimental real-time collaboration version

Thanks to Bharat Patil: http://bharat.whiteboard.jit.su/

## New release

Version 2.7 was released on 3.8.2012. This is mainly a bugfix release, although several new features (most notable localStorage support) are present.

## Release

Version 2.6 was released on 22.9.2011. Several new translations (pt\_BR, sv, ar) added; VML removed; new visualization options available (show length and datatype); new DBs and backends; support for touch devices...

## Experimental clone with deletion of saved designs

http://code.google.com/r/charlieyouakim-wwwsqldesigner-deleteadd/

## New optional patch

A new patch, which enable optional display of field details, was submitted by Wilson Oliveira. While this code is not ready yet to be commited into repository, everyone can download it from http://ondras.zarovi.cz/sql/wwwsqldesigner-inline_field_details_patch.zip.


## Support for CUBRID

WWW SQL Designer now supports the [CUBRID database](http://www.cubrid.org/): both as a backend (using PHP) as well as datatype definition set.


## Release

Version 2.5 was released on 18.6.2010. Many new features were added (hiding of sidebar, colored relation, multi-selection and multi-drag, ...), tons of bugs were fixed.

## Release

Version 2.4 was released on 5.11.2009. Several outstanding issues were fixed and new locales added.

## Release

Version 2.3.3 was released on 28.7.2009. This long-awaited release includes numerous fixes, compatibility improvements, new locales, backends and DB datatypes.

## Release

Version 2.3.2 was released on 8.1.2009. Apart from some traditional bugfixes and locales, a new functionality is introduced - the ability to mark foregin keys between existing table fields!

## Google Code

The project was recently moved to Google Code hosting, which (amongst many other things) introduces Subversion hosting. Enjoy! (The old website, http://ondras.zarovi.cz/sql/, will still exist for some time.)

## 2.0 is here

Good news: A new version of WWW SQL Designer, rewritten from scratch, is now available. It has many new features, including bezier connectors, support for various customizations, localization, options and more.

Bad news: This new version is not backwards compatible with 1.x, so all old localizations and XSLT templates won't work with 2.x. Sorry for inconvenience :/
