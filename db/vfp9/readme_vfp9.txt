02.12.2009
	vfp9 add-on for WwwSQLDesigner
	by zvolsky@seznam.cz


Installation:
-------------
Download and install WwwSQLDesigner from http://code.google.com/p/wwwsqldesigner/
If there is no db\vfp9 folder, then continue:

Unzip files into db\vfp9 folder of the WwwSQLDesigner.
If you don't see vfp9 in database type selection, copy db\vfp9\readme_vfp9\config.js into js\config.js location.
After changing js\config.js you must restart.
Changes in db\vfp9\output.xsl take effect immediately.
To re-read db\vfp9\datatypes.xml you must make some (dummy) change in js\config.js and restart.


WwwSQLDesigner basics:
----------------------
To start click Index.html.
Never use Page Refresh (F5) - data will be lost!
Use Save button to generate FoxPro script with CREATE TABLEs.
Use Save/Read and Save XML buttons to generate XML and copy-paste it into text file to save your work.
Use Save/Read and Read XML buttons to continue work.


Use of VFP9 add-on:
-------------------
Textbox "Default" in Field adding has different meaning. Here you can enter all foxpro keywords, which follow field definition.
No word "DEFAULT" is added. To use some DEFAULT, write "DEFAULT value". If you let just "NULL" in Textbox "Default",
you will receive FoxPro error. Write "DEFAULT .NULL." if you want a default null value.

Data type "Integer (not key)" differents just in its color (but generates standard Integer)

Data types Binary aren't in list. They are supported through "Default" textbox. Write "NOCPTRANS" there.


There is (at this time - 02.12.2009) no support for .dbc (primary/foreign keys,..).
Plain CREATE TABLE commands are generated.


You can call VFP script with parameters. See generated script for details.
teLongName gives a possibility to genarate FREE or NAME keywords.
tcCommand can fire immediately after CREATE TABLE.
-------------------------------------------------------------------------------------------------------------------------