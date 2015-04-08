# WWW SQL Designer

Hello and welcome to WWW SQL Designer documentation. This page will hopefully help you with understanding how WWW SQL Desginer works and how can it be tailored to suit your needs.

## Browsers

WWW SQL Designer was tested in the following browsers:
  * Firefox 2.x
  * Firefox 3.x
  * Internet Explorer 6
  * Internet Explorer 7
  * Internet Explorer 8
  * Safari 3, 4
  * Opera 9.x
  * Konqueror 3.5.x
  * Chrome 3, 4, 5

Konqueror is the only browser (from this list) which lacks support for Smooth connectors and XSLT transformations (generation of SQL scripts).

## Basics
The application allows you to:
  1. Draw E-R designs
  1. Edit tables and rows
  1. Manage keys
  1. Create relations (FK constraints)
  1. Save & Load designs
  1. Import DB schemas

Most commands are intuitively available from the right sidebar. Some additional tasks are described below:

  * To **drag a table**, press mouse button while pointing at table header. You can then move the table around the canvas.

  * To **edit table properties**, either double-click its heading, or select it and then press 'Edit table' button in sidebar.

  * To **edit field properties**, either double-click it, or select it and then press 'Edit field' button in sidebar.

  * To **manage keys for a table**, select a table and press 'Edit keys' button in sidebar.

  * To **draw a connector (relation)**, first select a field which forms a Primary Key. You then have two options:
    1. Either click 'Create foreign key' button in sidebar and click target table's heading. New field and relation will be created;
    1. or click 'Connect foreign key' button in sidebar and click target table's field. New relation will be created.

  * To **perform any kind of save/load/export/import task**, press the 'Save/Load' button in sidebar. A dialog window will appear, allowing you to perform clientside or serverside tasks. If you wish to use a server-side backend (for instance, to save your design into a database table), make sure the backend is properly configured.
    * **Example:** The php-mysql backend stores designs in MySQL table. First, it is necessary to prepare the storage table (its definition is available in `backend/php-mysql/database.sql`); second, connection credentials must be entered into `backend/php-mysql/index.php`.

  * To **automatically load a saved schema** (using default database backend), append "keyword=xyz" to URL, substituting "xyz" with the name of your saved schema.

  * To **start with toolbar minimized (hidden)**, append "toolbar=hidden" to the querystring.