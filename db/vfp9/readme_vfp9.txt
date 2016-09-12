07.12.2009
	vfp9 support for WwwSQLDesigner
	by zvolsky@seznam.cz


Installation:
-------------
vfp9 support is standard part of WwwSQLDesigner - simple choose database vfp9 in Settings.

You can change the generated script by patch/replace of db\vfp9\output.xsl.


WwwSQLDesigner basics:
----------------------
To start click Index.html.
Never use Page Refresh (F5) - data will be lost!
Use Save button to generate FoxPro script with CREATE TABLEs.
Use Save/Read and Save XML buttons to generate XML and copy-paste it into text file to save your work.
Use Save/Read and Read XML buttons to continue work.


Use of VFP9 support:
--------------------
Textbox "Default" in Field adding has different meaning. Here you can enter all foxpro keywords, which follow field definition.
No word "DEFAULT" is added. To use some DEFAULT, write "DEFAULT value". If you let just "NULL" in Textbox "Default",
you will receive FoxPro error. Write "DEFAULT .NULL." instead.

Data types Binary aren't in list. Use standard Varchar, Character, Memo instead and write "NOCPTRANS" into the "Default" textbox.

Data type "Integer (not key)" differents (from the primary/foreign key) just in its color (but generates standard Integer).



Generated VFP script contains (optional) parameters, which change behavior of CREATE TABLE commands:
teLongName gives a possibility to generate FREE or NAME keywords.
tcCommand can fire immediately after each CREATE TABLE (new table is selected).
	F.e. "= MyProc( ALIAS(), m.lcTableComment, @lacComments )" gives access to alias and all comments from model inside MyProc() procedure.
tcPath can control path, where tables will be created.

Comments aren't copied directly into target database.
Instead of this, they are prepared in lcTableComment variable (table comment) and in lacComments array (field comments) before &tcCommand call.
So you can work with comments in your user defined code as you want.
