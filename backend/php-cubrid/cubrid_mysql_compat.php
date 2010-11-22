<?php
/*
* Description: A Cubrid implementation of the equivalent MySQL PHP API functions.
*
* Copyright (c) 2010 Cubrid.
* www.cubrid.org
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
*
* Ver 1.2.1
* Last update: November 2010
* 
*/

// Global variables
$calculate_insert_id;   // flag to indicate if calculate the last_insert_id

$cubrid_last_insert_id; // keeps the last_insert_id value
$cubrid_default_port;   // default port used to coonect to Cubrid, if not explicitely secified
$cubrid_database;       // keeps the current database name

// MySQL syntax:
// resource mysql_connect ( [string server [, string username [, string password [, bool new_link [, int client_flags]]]]] )  
function cubrid_mysql_connect($server, $username, $password, $database) {
  // Note: In Cubrid, the database name is mandatory
  // initialize globals
  $GLOBALS['calculate_last_insert_id'] = true;
  $GLOBALS['cubrid_last_insert_id']    = 0;
  $GLOBALS['cubrid_default_port']      = 30000; // or use 33000
  $GLOBALS['cubrid_database']          = "";

  if (strpos($server, ":") > 0) {
    list($host, $port)=explode(":", $server, 2);
  } else {
    $host=$server;
    $port=$GLOBALS['cubrid_default_port']; // default port
  }

  // save database name
  $GLOBALS['cubrid_database']=$database;

  return cubrid_connect($host, $port, $database, $username, $password);
}

// MySQL syntax:
// bool mysql_close ( [resource link_identifier] )
function cubrid_mysql_close($link_identifier) {
  return cubrid_disconnect($link_identifier);
}

// MySQL syntax:
function cubrid_mysql_errno($link_identifier = '') {
  // int mysql_errno ( [resource link_identifier] )
  return cubrid_error_code();
}

// MySQL syntax:
function cubrid_mysql_error($link_identifier = '') {
  // string mysql_error ( [resource link_identifier] )
  return cubrid_error_msg();
}

// MySQL syntax:
// resource mysql_query ( string query [, resource link_identifier] )
function cubrid_mysql_query_native($query, $link_identifier) {
  $result=cubrid_execute($link_identifier, $query);
  // Cubrid does not do commit automatically by default (auto-commit is off by default)
  cubrid_commit ($link_identifier);
  return $result;
}

// MySQL syntax:
// resource mysql_query ( string query [, resource link_identifier] )
function cubrid_mysql_query($query, $link_identifier, $last_insert_id_column = '') {
  $cubrid_query=trim($query); // need to trim to make sure we are handling properly the ";" terminator

  if ($GLOBALS['calculate_last_insert_id']) {
    // HACK - Cubrid does not support yet INSERT_ID()
    // We need to alter the INSERT query to be able to get last_insert_id
    if (startsWith($cubrid_query, "insert", false)) {
      if ($cubrid_query[strlen($cubrid_query) - 1] == ";") { // remove the ";" last char
        $cubrid_query=substr($cubrid_query, 0, strlen($cubrid_query) - 1) . " INTO :xyz;";
      } else {
        $cubrid_query=$cubrid_query . " INTO :xyz;";
      }
    }
  }

  $result=cubrid_execute($link_identifier, $cubrid_query);

  if (!$result) {
    return false;
  }

  if ($GLOBALS['calculate_last_insert_id']) {
    if (startsWith($cubrid_query, "insert", false)) {
      // get the last_insert_id for the specified column (In Cubrid can be multiple auto_increment columns)
      if (strlen($last_insert_id_column) > 0) {
        $GLOBALS['cubrid_last_insert_id']=cubrid_get_value(cubrid_last_insert_id_query($last_insert_id_column),
                                                           $link_identifier);
      }
    } else {
      $GLOBALS['cubrid_last_insert_id']=0; // (re)set to 0
    }
  }
  cubrid_commit ($link_identifier);
  return $result;
}

// MySQL syntax:
// array mysql_free_result ( resource $link_identifier )
function cubrid_mysql_free_result($link_identifier) {
  return cubrid_free_result($link_identifier);
}

// MySQL syntax:
// array mysql_fetch_row ( resource result )
function cubrid_mysql_fetch_row($result) {
  return cubrid_fetch_row($result);
}

// MySQL syntax:
// array mysql_fetch_array ( resource result [, int result_type] )
function cubrid_mysql_fetch_array($result, $result_type = 0) {
  return cubrid_fetch($result, $result_type);
}

// MySQL syntax:
// object mysql_fetch_object ( resource result )
function cubrid_mysql_fetch_object($result) {
  return cubrid_fetch_object($result);
}

// MySQL syntax:
// bool mysql_data_seek ( resource result, int row_number )
function cubrid_mysql_move_cursor($result, $offset) {
  return cubrid_move_cursor($result, $offset);
}

// MySQL syntax:
// object mysql_fetch_field ( resource result [, int field_offset] )
function cubrid_mysql_fetch_field($result) {
  return cubrid_fetch_field($result);
}

// MySQL syntax:
// int mysql_insert_id ( [resource link_identifier] )
function cubrid_mysql_insert_id($link_identifier = -1) {
  return $GLOBALS['cubrid_last_insert_id'];
}

// MySQL syntax:
// int mysql_num_rows ( resource result )
function cubrid_mysql_num_rows($resultSet) {
  return cubrid_num_rows($resultSet);
}

// MySQL syntax:
// int mysql_num_fields ( resource result )
function cubrid_mysql_num_fields($resultSet) {
  return cubrid_num_cols($resultSet);
}

// MySQL syntax:
// bool mysql_data_seek ( resource result, int row_number )
function cubrid_mysql_data_seek($result, $row_number) {
  return cubrid_data_seek($result, $row_number);
}

// MySQL syntax:
// Zero if successful. Non-zero if an error occurred. 
function cubrid_mysql_commit($link_identifier) {
  return cubrid_commit($link_identifier);
}

// MySQL syntax:
// Zero if successful. Non-zero if an error occurred. 
function cubrid_mysql_rollback($link_identifier) {
  return cubrid_rollback($link_identifier);
}

// MySQL syntax:
// string mysql_real_escape_string ( string unescaped_string [, resource link_identifier] )
function cubrid_mysql_real_escape_string($unescaped_string, $link_identifier = '') {
  return str_replace("'", "''", $unescaped_string);
}

// MySQL syntax:
// string mysql_result  (  resource $result  ,  int $row  [,  mixed $field = 0  ] )
function cubrid_mysql_result($result, $row, $field = 0) {
  return cubrid_result($result, $row, $field);
}

// MySQL syntax:
// array mysql_fetch_assoc  (  resource $result  )
function cubrid_mysql_fetch_assoc($result) {
  return cubrid_fetch_assoc($result);
}

// implements SHOW TABLES
function cubrid_SHOW_TABLES($link_identifier) {
  return cubrid_mysql_query_native(get_SQL_SHOW_TABLES(), $link_identifier);
}

// implements DESCRIBE
function cubrid_DESCRIBE($table, $link_identifier) {
  return cubrid_mysql_query_native(get_SQL_describeTableSQL($table), $link_identifier);
}

// implements SHOW INDEX
function cubrid_SHOW_INDEX_FROM($table, $link_identifier) {
  return cubrid_mysql_query_native(get_SQL_SHOW_INDEX_FROM($table), $link_identifier);
}

// gets data type for a table
function cubrid_ColumnDataType($identifier, $table, $column) {
  $id_result       =cubrid_mysql_query_native(get_SQL_ColumnDataType($table, $column), $identifier);
  $id_row          =cubrid_fetch_row($id_result);
  cubrid_free_result ($id_result);
  $calculated_value=$id_row[0];
  return $calculated_value;
}

// gets a single value as a query result
function cubrid_get_value($query, $link_identifier) {
  $result=cubrid_execute($link_identifier, $query);

  if ($result) {
    $row  =cubrid_fetch_row($result);
    $value=$row[0];
  } else {
    return -1;
  }

  return $value;
}

// returns the last_insert_id value
function cubrid_last_insert_id_query($last_insert_id_column, $cubrid_var = "xyz") {
  return "SELECT :" . $cubrid_var . "." . $last_insert_id_column . " FROM db_root";
}

// returns the last_insert_id value
function cubrid_last_insert_id($last_insert_id_column, $link_identifier, $cubrid_var = "xyz") {
  return cubrid_get_value(cubrid_last_insert_id_query($last_insert_id_column), $link_identifier);
}

// return the current Cubrid database name
function cubrid_current_database() {
  return $GLOBALS['cubrid_database'];
}

// The following columns are returned:
// Field,  Type,  Null (YES,NO),  Key (PRI,MUL),  Default,  Extra
function get_SQL_describeTableSQL($table) {
  $sql="";
  $sql=$sql . "SELECT a.attr_name as \"Field\"," . " ";
  $sql=$sql . "a.data_type || '(' || a.prec || ',' || a.scale || ')' as \"Type\"," . " ";
  $sql=$sql . "a.prec || ',' || a.scale as \"Size\"," . " ";
  $sql=$sql . "a.is_nullable as \"Null\"," . " ";
  $sql=$sql . "'*' as \"Key\"," . " ";
  $sql=$sql . "a.default_value  as \"Default\"," . " ";
  $sql=$sql . "'' as \"Extra\"" . " ";
  $sql=$sql . "FROM db_attribute a" . " ";
  $sql=$sql . "WHERE a.class_name='" . $table . "'" . " ";
  $sql=$sql . "order by a.def_order ASC";

  return $sql;
}

// The column data type is returned
function get_SQL_ColumnDataType($table, $column) {
  $sql="";
  $sql=$sql . "SELECT a.data_type" . " ";
  $sql=$sql . "FROM db_attribute a" . " ";
  $sql=$sql . "WHERE a.class_name='" . $table . "'" . " ";
  $sql=$sql . "AND a.attr_name='" . $column . "'" . " ";
  $sql=$sql . "order by a.def_order ASC";

  return $sql;
}

// The following columns are returned:
// Table,Non_unique,Key_name,Seq_in_index,Column_name,Collation,Cardinality,Sub_part,Packed,Index_type,Comment
function get_SQL_SHOW_INDEX_FROM($table) {
  $query="";
  $query=$query . "select distinct a.class_name as \"Table\"," . " ";
  $query=$query . "DECODE(a.is_unique, 'YES', 'True') as \"Non_unique\"," . " ";
  $query=$query . "a.index_name as \"Key_name\"," . " ";
  $query=$query . "b.key_order as \"Seq_in_index\"," . " ";
  $query=$query . "b.key_attr_name as \"Column_name\"," . " ";
  $query=$query . "'' as \"Collation\"," . " ";
  $query=$query . "'' as \"Cardinality\"," . " ";
  $query=$query . "'' as \"Sub_part\"," . " ";
  $query=$query . "'' as \"Packed\"," . " ";
  $query=$query . "'' as \"Index_type\"," . " ";
  $query=$query . "'' as \"Comment\"" . " ";
  $query=$query . "from \"db_index\" a, \"db_index_key\" b" . " ";
  $query=$query . "where a.index_name = b.index_name" . " ";
  $query=$query . "and b.key_attr_name in (select attr_name from db_attribute where class_name = '" . $table . "')" . " ";
  $query=$query . "and a.is_foreign_key = 'NO'" . " ";
  $query=$query . "and a.class_name = '" . $table . "'" . " ";
  $query=$query . "order by a.index_name, b.key_order,b.key_attr_name";

  return $query;
}

// returns the list of non-system tables
function get_SQL_SHOW_TABLES($pattern = '') {
  if (strlen($pattern) > 0) {
    return "select class_name from db_class where class_type='CLASS' and is_system_class='NO' WHERE class_name LIKE '"
      . $pattern . "' order by class_name ASC";
  } else {
    return "select class_name from db_class where class_type='CLASS' and is_system_class='NO' order by class_name ASC";
  }
}

// gets Primary Keys information
function columnIsPK($dbl, $table, $column) {
  $ret     = false;

  $sql     = "";
  $sql     = $sql . "select db_index_key.key_attr_name" . " ";
  $sql     = $sql . "from db_index, db_index_key" . " ";
  $sql     = $sql . "where db_index.index_name = db_index_key.index_name" . " ";
  $sql     = $sql . "and db_index.class_name='" . $table . "'" . " ";
  $sql     = $sql . "and db_index_key.key_attr_name='" . $column . "'" . " ";
  $sql     = $sql . "and db_index.is_primary_key='YES'";

  $tableSql = cubrid_execute($dbl, $sql);

  if (@cubrid_num_rows($tableSql) > 0) {
    $ret=true;
  }

  return $ret;
}

// emulates DROP TABLE IF EXISTS
function DROP_TABLE_IF_EXISTS($tablename, $link_identifier) {
  $id_result
       =cubrid_mysql_query_native("SELECT class_name FROM db_class WHERE class_name='" . $tablename . "'",
                                  $link_identifier);
  $rows=cubrid_num_rows($id_result);

  if ($rows > 0) {
    cubrid_execute($link_identifier, "DROP TABLE " . $tablename);
  }
}

// The following columns are returned:
// Field,  Type,  Null (YES,NO),  Key (PRI,MUL),  Default,  Extra
function get_SQL_SHOW_COLUMNS($table) {
  $sql="";
  $sql=$sql . "SELECT a.attr_name as \"Field\"," . " ";
  $sql=$sql . "a.data_type || '(' || a.prec || ',' || a.scale || ')' as \"Type\"," . " ";
  $sql=$sql . "a.prec || ',' || a.scale as \"Size\"," . " ";
  $sql=$sql . "a.is_nullable as \"Null\"," . " ";
  $sql=$sql . "'*' as \"Key\"," . " ";
  $sql=$sql . "a.default_value  as \"Default\"," . " ";
  $sql=$sql . "'' as \"Extra\"" . " ";
  $sql=$sql . "FROM db_attribute a" . " ";
  $sql=$sql . "WHERE a.class_name='" . $table . "'" . " ";
  $sql=$sql . "order by a.def_order ASC";

  return $sql;
}

function startsWith($haystack, $needle, $case = true) {
  if ($case) {
    return strpos($haystack, $needle, 0) == 0;
  } else {
    return stripos($haystack, $needle, 0) == 0;
  }
}

function endsWith($haystack, $needle, $case = true) {
  $expectedPosition=strlen($haystack) - strlen($needle);

  if ($case) {
    return strrpos($haystack, $needle, 0) == $expectedPosition;
  } else {
    return strripos($haystack, $needle, 0) == $expectedPosition;
  }
}

?>