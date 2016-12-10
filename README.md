SQL Designer allows users to create database designs, which can be saved/loaded and exported to SQL scripts. Various databases and languages are supported. Ability to import existing database design.
This is a fork of WWW SQL Designer by Ondrej Zara [Link](https://github.com/ondras/wwwsqldesigner)

# About

Hi and welcome to WWW SQL Designer! This tool allows you to draw and create database schemas (E-R diagrams) directly in browser.

Many database features are supported, such as keys, foreign key constraints, comments and indexes. You can either save your design (for further loading & modifications), print it or export as SQL script. It is possible to retrieve (import) schema from existing database.

WWW SQL Designer was created by [Ondrej Zara](http://ondras.zarovi.cz/) and is built atop the [oz.js](http://code.google.com/p/oz-js/) JavaScript module. It is distributed under New BSD license.

# Why the fork

1. Because it's fun

2. After using ondras's designer for a while i felt it needed a bit of love :$ so i added **a new design** and shortcuts!

# Shortcuts

- **F2** = save local
- **F4** = load local

- **a** = New table
- **e** = Edit table | Edit row
- **f** = add field
- **x** = create foreign key
- **c** = connect foreign key
- **+** / **-** = zoom in or out