# Changelog

  * **Version 2.5 (18.6.2010)**
    * hiding of sidebar
    * css shadows
    * styled keys
    * colored lines
    * new backends: php-pdo
    * new locales: italian, japanese, chinese
    * new db definitions: vfp9
    * multiselection
    * snapping
    * MANY bugfixes
  * **Version 2.4 (5.11.2009)**
    * greek and hungarian locales
    * removal of relation
    * keyword remembering
  * **Version 2.3.3 (28.7.2009)**
    * sqlalchemy db format
    * switched to BSD licence
    * php/mysql/file backend
    * php-postgresql backend
    * eo locale
    * many tiny fixes and improvements
  * **Version 2.3.2 (8.1.2009)**
    * ability to draw connectors without field creation
    * added Russian translation
    * perl-file backend
  * **Version 2.3.1 (29.11.2008)**
    * unix newlines
    * fixed FK button disabled state synchronization
    * fixed Spanish translation (Cristián Pérez)
  * **Version 2.3 (18.11.2008)**
    * small typo in sample php-file
    * comments escaping bugfix (Suzanne Dolberg)
    * better French translation (Olivier M)
    * PostgreSQL support (Michael Tesch)
    * bugfix in MSSQL datatypes
    * updated to oz.js 1.1
  * **Version 2.2 (25.9.2008)**
    * php-sqlite DB backend (Luke Stevenson)
    * web2py (Boris Manojlovic) and MSSQL (Sean) datatype definitions
    * Polish (Damian Jaroszewski), Spanish (Rubén Rodríguez Zepeda) and Brazilian (Paulo Marcelo) translation
    * updated to oz.js 1.04
  * **Version 2.1.1 (18.7.2008)**
    * space after DEFAULT statement in MySQL (Patrice Ferlet, Guillaume Paton)
    * escaping apostrophes in COMMENT statements in MySQL (Patrice Ferlet, Guillaume Paton)
    * better use of custom event
    * updated to oz.js 1.03
  * **Version 2.1 (28.6.2008)**
    * "note" attribute for datatypes (Sean)
    * French, German and Czech localization (DerHeiko, Laurent Goussard)
    * design name in document title (DerHeiko)
    * updated to oz.js 1.02
  * **Version 2.0.1 (1.4.2008)**
    * no AUTOINCREMENT for foreign keys
    * changed minimap color for selected table
    * correct layering of minimap tables
  * **Version 2.0 (28.3.2008)**
    * rewritten from scratch
    * smooth connectors
    * key management
    * custom locales, backends, dbs
    * cookies
    * much much more

**--- OBSOLETE BELOW ---**

  * **Version 1.4.1 (13.1.2008)**
    * languages: Italian, Dutch, Traditional Chinese (Marc, Tiberti Fabio, Finjon Kiang)
  * **Version 1.4 (25.11.2007)**
    * improvements from Travis Kroh: PDO-based io.php, SQLite, Symphony, XSLT for MySQL export, changed order of FK names
  * **Version 1.3.6 (28.10.2007)**
    * FK inherits more features from PK (thanks to Cyril Zekser)
    * Fix for import from MSSQL (thanks to Andrea)
  * **Version 1.3.5 (5.10.2007)**
    * FK FK inherits datatype from PK (thanks to Kevin T. Ryan)
  * **Version 1.3.4 (24.9.2007)**
    * two bugfixes for IE7
  * **Version 1.3.3 (27.7.2007)**
    * foreign Keys have editable names (revert to previous behavior)
  * **Version 1.3.2 (20.7.2007)**
    * patches from Tobias Stechbarth
    * MEDIUMTEXT used for data storage (thanks to Areski)
  * **Version 1.3.1 (30.5.2007)**
    * numerous new translations
  * **Version 1.3 (6.2.2007)**
    * browser crash fix (thanks to Hiroki Yoshioka)
    * importing existing DB schema (not in demo)
    * Brazilian Portugese (Fabio Gomes Ramos)
  * **Version 1.2.1 (31.1.2007)**
    * PROPEL xslt update (Dominic Pelletier)
    * Default language fix (Andrej Kvasnica)
  * **Version 1.2 (21.1.2007)**
    * XSLT template to PROPEL xml (Dominic Pelletier)
    * patched MSSQL template (Romain Fevre)
    * localisation (Romain Fevre)
    * Oracle support (Romain Fevre)
    * CHAR and DECIMAL support (Romain Fevre)
  * **Version 1.1.8 (27.11.2006)**
    * patches from Alex Petrescu
  * **Version 1.1.7 (26.10.2006)**
    * xml2postgresql template, thanks to Gérard
    * print view, thanks to Tor Edvardsson
    * Listing of keywords, thanks to Tor Edvardsson
    * xml2mssql template for creating Microsoft SQL scripts, thanks to Sean
    * direct loading of saved schema, see FAQ
    * php script resistant to magic\_quotes\_gpc
  * **Version 1.0 (3.10.2005)**
    * IE hack instead of an old & ugly solution, thanks to Drew Diller
    * mouse wheel scrolls minimap, thanks to Andreas Attemann
    * new Settings button, does nothing :)
    * more straightforward labels in i/o select
    * ajax based on xmlhttp, not `<script>`
    * bugfix - bad row order when exporting
    * bugfix - string lengths not exported
    * xslt tranformation now DIRECTLY IN BROWSER!
    * button 'clear tables'
    * optimized bar for lower resolutions
    * major webpage changes
    * all styling now in STYLES subdirectory
    * changed descriptive texts on bar into `<label>`s
    * fixed non-selectable user-added rows (thanks to Paul Thrasher)
    * added GNU GPL licence