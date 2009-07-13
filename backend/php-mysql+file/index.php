<?php
	/**
	 * This file contains the plugin to allow importing from a MySQL database
	 * but instead of saving data to that database it will write it instead to
	 * a static XML file.  The load function will echo out the contents of the
	 * file.
	 * 
	 * When saving/loading the script will only accept alphanumeric w/ underscore
	 * filenames between 1 and 100 characters (yes, its arbitrary, change it if
	 * you don't like it :p).
	 * 
	 * No validation is performed on the XML data saved to file.  A malicious user
	 * could potentially upload a HUGE file so be aware of this when you configure
	 * your server.  No user authentication is included.
	 * 
	 * Please note that this is not all my work.  Large portions of it have been
	 * copied from the php-mysql and php-file plugins.
	 * 
	 * @author 'Kabal458'	<Kabal458@gmail.com>
	 * @since  10-July-2009
	 */

	// Define these constants for importing from your MySQL database. MySQL 
	// usually stores your metadata inside the `information_schema` database
	// on the `TABLES` table
	define('HOST',	'localhost');
	define('USER',	'root');
	define('PASS',	'password');
	define('DB',	'information_schema');
	
	// This constant is the regular expression used to validate the filename
	define('FILENAME_REGEX',   '^[A-Za-z0-9_]{1,100}$');
	
	// Pull the action variable from the GET and validate it
	$action = isset($_GET['action']) ? $_GET['action'] : '';
	
	if(!in_array($action, array('list','save','load','import'))) {
		header('HTTP/1.0 501 Not Implemented');
		exit;
	}
	
	// Save and Load actions must have the 'keyword' GET variable to work,  
	// I've used a regular expression to keep filenames simple and valid 
	// so that they don't do anything unintended.
	if($action == 'save' || $action == 'load') {
		if(!isset($_GET['keyword']) || !ereg(FILENAME_REGEX, $_GET['keyword'])) {
			header('HTTP/1.0 400 Bad Request');
			exit;
		}
	}
	
	// The import action requires the database variable to be set
	if($action == 'import' && !isset($_GET['database'])) {
		header('HTTP/1.0 400 Bad Request');
		exit;	
	}
	
	// Based on the action variable return appropriate data
	switch($action) {
		case 'list':
			// List all files in the data directory
			foreach (glob('data/*') as $file)
				echo basename($file)."\n";
			break;
			
		case 'save':
			// Open the file for writing
			$f = fopen('data/'.$_GET['keyword'], 'w');
			
			// Read in the contents of the XML file from input
			$data = file_get_contents('php://input');
			if (get_magic_quotes_gpc() || get_magic_quotes_runtime()) {
			   $data = stripslashes($data);
			}
			
			// Write the data to the file and close the file
			fwrite($f, $data);
			fclose($f);
			
			// Write the response HTTP code
			header('HTTP/1.0 201 Created');
			break;
			
		case 'load':
			$keyword = 'data/' . $_GET['keyword'];
			if (!file_exists($keyword)) {
				header('HTTP/1.0 404 Not Found');
			} else {
				header('Content-type: text/xml');
				echo file_get_contents($keyword);
			}
			break;
			
		case 'import':
			// The import command may take some time, so make sure that PHP won't timeout
			set_time_limit(0);
			
			// I've included the mysql_import function from the php_mysql plugin as its
			// own file for future compatibility and to take so much code out of this one
			// file.
			require_once 'mysql_import.php';
			
			// Connect to the MySQL Database, short circuiting ensures that this code will 
			// execute without error
			if (!mysql_connect(HOST,USER,PASS) || !mysql_select_db(DB)) {
				header("HTTP/1.0 503 Service Unavailable");
				exit;
			}
			
			header("Content-type: text/xml");
			echo import();
			
			break;
	}	
?>
