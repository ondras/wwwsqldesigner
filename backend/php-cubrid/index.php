<?php
  require_once('cubrid_mysql_compat.php');

  if (!function_exists('cubrid_connect') || !function_exists('cubrid_mysql_connect')) {
    echo "Either Cubrid or the Cubrid MySQL compatibility library is not detected." . "<br />";
    echo "Please check your instalation." . "<br />";
    die;
  }

	set_time_limit(0);
  
	function setup_saveloadlist() {
		define("SERVER", "localhost:30000");
		define("USER", "dba");
		define("PASSWORD", "");
		define("DB", "demodb");
		define("TABLE", "wwwsqldesigner");
	}
	function setup_import() {
		define("SERVER", "localhost:30000");
		define("USER", "dba");
		define("PASSWORD", "");
		define("DB", "demodb");
	}
	function connect() {
		$conn = cubrid_mysql_connect(SERVER, USER, PASSWORD, DB);
		if (!$conn) { 
      return false;
    }
		return $conn;
	}

	function import($conn) {
		$xml = "";

		$arr = array();
		@ $datatypes = file("../../db/cubrid/datatypes.xml");
		$arr[] = $datatypes[0];
		$arr[] = '<sql db="cubrid">';
		for ($i=1;$i<count($datatypes);$i++) {
			$arr[] = $datatypes[$i];
		}

		$result = cubrid_mysql_query_native("select class_name from db_class WHERE class_type='CLASS' and is_system_class = 'NO' order by class_name", $conn);
    if (cubrid_mysql_num_rows($result) > 0) {
		  while ($row = cubrid_mysql_fetch_assoc($result)) {
			  $table = $row["class_name"];
			  $xml .= '<table name="'.$table.'">';

			  $q = get_SQL_describeTableSQL($table);
			  $result2 = cubrid_mysql_query_native($q, $conn);
			  while ($row = cubrid_mysql_fetch_assoc($result2)) {
				  $name  = $row["Field"];
				  $type  = str_replace(",0)", ")", $row["Type"]);
				  $null = ($row["Null"] == "YES" ? "1" : "0");
				  $def = $row["Default"];
				  $ai = (preg_match("/auto_increment/i",$row["Extra"]) ? "1" : "0");
				  if ($def == "NULL") { 
            $def = ""; 
          }
				  $xml .= '<row name="'.$name.'" null="'.$null.'" autoincrement="'.$ai.'">';
				  $xml .= '<datatype>'.strtoupper($type).'</datatype>';
				  $xml .= '<default>'.$def.'</default>';

				  /* fk constraints */
				  /*
          $q = "SELECT
					  REFERENCED_TABLE_NAME AS 'table', REFERENCED_COLUMN_NAME AS 'column'
					  FROM KEY_COLUMN_USAGE k
					  LEFT JOIN TABLE_CONSTRAINTS c
					  ON k.CONSTRAINT_NAME = c.CONSTRAINT_NAME
					  WHERE CONSTRAINT_TYPE = 'FOREIGN KEY'
					  AND c.TABLE_SCHEMA = '".$db."' AND c.TABLE_NAME = '".$table."'
					  AND k.COLUMN_NAME = '".$name."'";
          */
          $q = "SELECT NULL AS `table`, NULL AS `column` FROM db_root"; //no PHP support in CUBRID for FK
				  $result3 = cubrid_mysql_query_native($q, $conn);

				  while ($row = cubrid_mysql_fetch_assoc($result3)) {
					  $xml .= '<relation table="'.$row["table"].'" row="'.$row["column"].'" />';
				  }

				  $xml .= '</row>';
			  }

			  /* keys */
        $q = get_SQL_SHOW_INDEX_FROM($table);
	  		$result2 = cubrid_mysql_query_native($q, $conn);
			  $idx = array();

			  while ($row = cubrid_mysql_fetch_assoc($result2)) {                                                       
				  $name = $row["Key_name"];
				  if (array_key_exists($name, $idx)) {
					  $obj = $idx[$name];
				  } else {
					  $t = "INDEX";

					  if ($row["Non_unique"] == "0") { 
              $t = "UNIQUE"; 
            }

            if(columnIsPK($conn, $table, $row["Column_name"])) {
              $t = "PRIMARY"; 
            }

					  $obj = array(
						  "columns" => array(),
						  "type" => $t
					  );
				  }

				  $obj["columns"][] = $row["Column_name"];
				  $idx[$name] = $obj;
			  }

			  foreach ($idx as $name=>$obj) {
				  $xml .= '<key name="'.$name.'" type="'.$obj["type"].'">';
				  for ($i=0;$i<count($obj["columns"]);$i++) {
					  $col = $obj["columns"][$i];
					  $xml .= '<part>'.$col.'</part>';
				  }
				  $xml .= '</key>';
			  }
			  $xml .= "</table>";
      }
    } else {
      $xml = "<No tables found/>";
    }
		$arr[] = $xml;
		$arr[] = '</sql>';
		return implode("\n",$arr);
	}

  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  
	$a = (isset($_GET["action"]) ? $_GET["action"] : false);
	switch ($a) {
		case "list":
			setup_saveloadlist();
      $conn = connect();
      $sql = "SELECT `keyword`, DATE_FORMAT(`dt`, '%d-%M-%Y %H:%i') AS dt FROM ".TABLE." ORDER BY dt DESC";
			$result = cubrid_mysql_query_native($sql, $conn);
      if(cubrid_mysql_num_rows($result) > 0) {
        while ($row = cubrid_mysql_fetch_assoc($result)) {
          echo $row["keyword"]." [".$row["dt"]."]\n";
        }
      }
		break;
		case "save":
			setup_saveloadlist();
      $conn = connect();
			$keyword = (isset($_GET["keyword"]) ? $_GET["keyword"] : "");
			$keyword = cubrid_mysql_real_escape_string($keyword);
			$data = file_get_contents("php://input");
			if (get_magic_quotes_gpc() || get_magic_quotes_runtime()) {
			   $data = stripslashes($data);
			}
			$data = cubrid_mysql_real_escape_string($data);
			$r = cubrid_mysql_query_native("SELECT * FROM ".TABLE." WHERE `keyword` = '".$keyword."'", $conn);
			if (cubrid_mysql_num_rows($r) > 0) {
				$res = cubrid_mysql_query_native("UPDATE ".TABLE." SET `data` = '".$data."', `dt`=SYS_TIMESTAMP WHERE `keyword` = '".$keyword."'", $conn);
			} else {
				$res = cubrid_mysql_query_native("INSERT INTO ".TABLE." (`keyword`, `data`, `dt`) VALUES ('".$keyword."', '".$data."', SYS_TIMESTAMP)", $conn);
			}
			if (!$res) {
				header("HTTP/1.0 500 Internal Server Error");
			} else {
				header("HTTP/1.0 201 Created");
			}
		break;
		case "load":
			setup_saveloadlist();
      $conn = connect();
			$keyword = (isset($_GET["keyword"]) ? $_GET["keyword"] : "");
			$keyword = cubrid_mysql_real_escape_string($keyword);
			$result = cubrid_mysql_query_native("SELECT `data` FROM ".TABLE." WHERE `keyword` = '".$keyword."'", $conn);
			$row = cubrid_mysql_fetch_assoc($result);
			if (!$row) {
				header("HTTP/1.0 404 Not Found");
			} else {
				header("Content-type: text/xml");
				echo $row["data"];
			}
		break;
		case "import":
			setup_import();
      $conn = connect();
			header("Content-type: text/xml");
      $txt = import($conn);
			echo $txt;
		break;
		default: header("HTTP/1.0 501 Not Implemented");
	}

?>