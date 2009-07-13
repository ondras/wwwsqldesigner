<?php 
	function import() {
		$db = (isset($_GET["database"]) ? $_GET["database"] : "information_schema");
		$db = mysql_real_escape_string($db);
		$xml = "";

		$arr = array();
		@ $datatypes = file("../../db/mysql/datatypes.xml");
		$arr[] = $datatypes[0];
		$arr[] = '<sql db="mysql">';
		for ($i=1;$i<count($datatypes);$i++) {
			$arr[] = $datatypes[$i];
		}

		$result = mysql_query("SELECT * FROM TABLES WHERE TABLE_SCHEMA = '".$db."'");
		while ($row = mysql_fetch_array($result)) {
			$table = $row["TABLE_NAME"];
			$xml .= '<table name="'.$table.'">';
			$comment = (isset($row["TABLE_COMMENT"]) ? $row["TABLE_COMMENT"] : "");
			if ($comment) { $xml .= '<comment>'.$comment.'</comment>'; }

			$q = "SELECT * FROM COLUMNS WHERE TABLE_NAME = '".$table."' AND TABLE_SCHEMA = '".$db."'";
			$result2 = mysql_query($q);
			while ($row = mysql_fetch_array($result2)) {
				$name  = $row["COLUMN_NAME"];
				$type  = $row["COLUMN_TYPE"];
				$comment = (isset($row["COLUMN_COMMENT"]) ? $row["COLUMN_COMMENT"] : "");
				$null = ($row["IS_NULLABLE"] == "YES" ? "0" : "1");
				$def = $row["COLUMN_DEFAULT"];
				$ai = (preg_match("/auto_increment/i",$row["EXTRA"]) ? "1" : "0");
				if ($def == "NULL") { $def = ""; }
				$xml .= '<row name="'.$name.'" null="'.$null.'" autoincrement="'.$ai.'">';
				$xml .= '<datatype>'.strtoupper($type).'</datatype>';
				$xml .= '<default>'.$def.'</default>';
				if ($comment) { $xml .= '<comment>'.$comment.'</comment>'; }

				/* fk constraints */
				$q = "SELECT
					REFERENCED_TABLE_NAME AS 'table', REFERENCED_COLUMN_NAME AS 'column'
					FROM KEY_COLUMN_USAGE k
					LEFT JOIN TABLE_CONSTRAINTS c
					ON k.CONSTRAINT_NAME = c.CONSTRAINT_NAME
					WHERE CONSTRAINT_TYPE = 'FOREIGN KEY'
					AND c.TABLE_SCHEMA = '".$db."' AND c.TABLE_NAME = '".$table."'
					AND k.COLUMN_NAME = '".$name."'";
				$result3 = mysql_query($q);

				while ($row = mysql_fetch_array($result3)) {
					$xml .= '<relation table="'.$row["table"].'" row="'.$row["column"].'" />';
				}

				$xml .= '</row>';
			}

			/* keys */
			$q = "SELECT * FROM STATISTICS WHERE TABLE_NAME = '".$table."' AND TABLE_SCHEMA = '".$db."' ORDER BY SEQ_IN_INDEX ASC";
			$result2 = mysql_query($q);
			$idx = array();

			while ($row = mysql_fetch_array($result2)) {
				$name = $row["INDEX_NAME"];
				if (array_key_exists($name, $idx)) {
					$obj = $idx[$name];
				} else {
					$type = $row["INDEX_TYPE"];
					$t = "INDEX";
					if ($type == "FULLTEXT") { $t = $type; }
					if ($row["NON_UNIQUE"] == "0") { $t = "UNIQUE"; }
					if ($name == "PRIMARY") { $t = "PRIMARY"; }

					$obj = array(
						"columns" => array(),
						"type" => $t
					);
				}

				$obj["columns"][] = $row["COLUMN_NAME"];
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
		$arr[] = $xml;
		$arr[] = '</sql>';
		return implode("\n",$arr);
	}
?>