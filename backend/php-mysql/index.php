<?php
	set_time_limit(0);

	$mysqlconnection = false;
	$usemysqli = function_exists( 'mysqli_connect' );

	function setup_saveloadlist() {
		define("SERVER","localhost");
		define("USER","");
		define("PASSWORD","");
		define("DB","information_schema");
	}
	function setup_import() {
		define("SERVER","localhost");
		define("USER","");
		define("PASSWORD","");
		define("DB","information_schema");
	}
	function connect() {
		global $mysqlconnection, $usemysqli;
		if( function_exists( 'mysqli_connect' ) ){
			return ( $mysqlconnection = mysqli_connect( SERVER , USER , PASSWORD , DB ) );
		}else{
			return ( ( $mysqlconnection = mysql_connect( SERVER , USER , PASSWORD ) )
							 && ( $res = mysql_select_db( DB ) ) );
		}
	}

	function maybe_mysqli_real_escape_string( $string ){
		global $mysqlconnection, $usemysqli;
		return ( $usemysqli ? mysqli_real_escape_string( $mysqlconnection , $string ) : mysql_real_escape_string( $string ) );
	}
	function maybe_mysqli_query( $query ){
		global $mysqlconnection, $usemysqli;
		return ( $usemysqli ? mysqli_query( $mysqlconnection , $query ) : mysql_query( $query ) );
	}
	function maybe_mysqli_fetch_array( $result ){
		global $usemysqli;
		return ( $usemysqli ? mysqli_fetch_array( $result ) : mysql_fetch_array( $result ) );
	}
	function maybe_mysqli_fetch_assoc( $result ){
		global $usemysqli;
		return ( $usemysqli ? mysqli_fetch_assoc( $result ) : mysql_fetch_assoc( $result ) );
	}
	function maybe_mysqli_num_rows( $result ){
		global $usemysqli;
		return ( $usemysqli ? mysqli_num_rows( $result ) : mysql_num_rows( $result ) );
	}

	function import() {
		global $mysqlconnection, $usemysqli;
		$db = ( isset( $_GET['database'] ) ? $_GET['database'] : 'information_schema' );
		$db = maybe_mysqli_real_escape_string( $db );
		$xml = '';

		$arr = array();
		@ $datatypes = file( '../../db/mysql/datatypes.xml' );
		$arr[] = $datatypes[0];
		$arr[] = '<sql db="mysql">';
		foreach( $datatypes as $d )
			$arr[] = $d;

		$query	= 'SELECT * FROM TABLES WHERE TABLE_SCHEMA = `'.$db.'`';
		$result = maybe_mysqli_query( $query );

		while( $row = maybe_mysqli_fetch_array( $result ) ){
			$table = $row['TABLE_NAME'];
			$xml .= '<table name="'.$table.'">';
			$comment = ( isset( $row['TABLE_COMMENT'] ) ? $row['TABLE_COMMENT'] : '' );
			if( $comment )
				$xml .= '<comment>'.htmlspecialchars( $comment ).'</comment>';

			$query	 = 'SELECT * FROM COLUMNS WHERE TABLE_NAME = `'.$table.'` AND TABLE_SCHEMA = `'.$db.'`';
			$result2 = maybe_mysqli_query( $query );
			while( $row = maybe_mysqli_fetch_array( $result2 ) ){
				$name	= $row['COLUMN_NAME'];
				$type	= $row['COLUMN_TYPE'];
				$comment = ( isset( $row['COLUMN_COMMENT'] ) ? $row['COLUMN_COMMENT'] : '' );
				$null = ( $row['IS_NULLABLE']=='YES' ? '1' : '0' );

				$def = $row['COLUMN_DEFAULT'];
				if( preg_match( '/binary/i' , $row['COLUMN_TYPE'] ) )
					$def = bin2hex( $def );
				if( $def=='NULL' )
					$def = '';

				$ai = ( preg_match( '/auto_increment/i' , $row['EXTRA'] ) ? '1' : '0' );
				$xml .= '<row name="'.$name.'" null="'.$null.'" autoincrement="'.$ai.'">';
				$xml .= '<datatype>'.strtoupper( $type ).'</datatype>';
				$xml .= '<default>'.$def.'</default>';
				if( $comment )
					$xml .= '<comment>'.htmlspecialchars( $comment ).'</comment>';

				/* fk constraints */
				$query = 'SELECT
									REFERENCED_TABLE_NAME AS "table", REFERENCED_COLUMN_NAME AS "column"
									FROM KEY_COLUMN_USAGE k
									LEFT JOIN TABLE_CONSTRAINTS c
									ON k.CONSTRAINT_NAME = c.CONSTRAINT_NAME
									WHERE CONSTRAINT_TYPE = "FOREIGN KEY"
									AND c.TABLE_SCHEMA = "'.$db.'" AND c.TABLE_NAME = "'.$table.'"
									AND k.COLUMN_NAME = "'.$name.'"';
				$result3 = maybe_mysqli_query( $query );

				while( $row = maybe_mysqli_fetch_array( $result3 ) ){
					$xml .= '<relation table="'.$row['table'].'" row="'.$row['column'].'" />';
				}

				$xml .= '</row>';
			}

			/* keys */
			$query = 'SELECT * FROM STATISTICS WHERE TABLE_NAME = "'.$table.'" AND TABLE_SCHEMA = "'.$db.'" ORDER BY SEQ_IN_INDEX ASC';
			$result2 = maybe_mysqli_query( $query );
			$idx = array();

			while( $row = maybe_mysqli_fetch_array( $result2 ) ){
				$name = $row['INDEX_NAME'];
				if( array_key_exists( $name , $idx ) ){
					$obj = $idx[$name];
				}else{
					$type = $row['INDEX_TYPE'];
					$t = 'INDEX';
					if( $type=='FULLTEXT' )
						$t = $type;
					if( $row['NON_UNIQUE']=='0' )
						$t = 'UNIQUE';
					if( $name=='PRIMARY' )
						$t = 'PRIMARY';

					$obj = array(
						'columns' => array(),
						'type' => $t
					);
				}

				$obj['columns'][] = $row['COLUMN_NAME'];
				$idx[$name] = $obj;
			}

			foreach( $idx as $name => $obj ){
				$xml .= '<key name="'.$name.'" type="'.$obj['type'].'">';
				foreach( $obj['columns'] as $col ){
					$xml .= '<part>'.$v.'</part>';
				}
				$xml .= '</key>';
			}
			$xml .= '</table>';
		}
		$arr[] = $xml;
		$arr[] = '</sql>';
		return implode( "\n" , $arr );
	}

	$a = ( isset( $_GET['action'] ) ? $_GET['action'] : false );
	switch( $a ){

		case 'list' :
			setup_saveloadlist();
			if( !connect() ){
				header( 'HTTP/1.0 503 Service Unavailable' );
				break;
			}
			$result = maybe_mysqli_query( $query );
			while( $row = maybe_mysqli_fetch_array( $result ) ){
				echo $row['keyword']."\n";
			}
		break;

		case 'save' :
			setup_saveloadlist();
			if( !connect() ){
				header( 'HTTP/1.0 503 Service Unavailable' );
				break;
			}
			$keyword = ( isset( $_GET['keyword'] ) ? $_GET['keyword'] : '' );
			$keyword = maybe_mysqli_real_escape_string( $keyword );
			$data = file_get_contents( 'php://input' );
			if( get_magic_quotes_gpc() || get_magic_quotes_runtime() )
				 $data = stripslashes( $data );
			$data = maybe_mysqli_real_escape_string( $data );
			$query = 'SELECT * FROM '.TABLE.' WHERE keyword = "'.$keyword.'"';
			$r = maybe_mysqli_query( $query );
			if( maybe_mysqli_num_rows( $r ) ){
				$query = 'UPDATE '.TABLE.' SET data = "'.$data.'" WHERE keyword = "'.$keyword.'"';
			}else{
				$query = 'INSERT INTO '.TABLE.' (keyword, data) VALUES ("'.$keyword.'", "'.$data.'")';
			}
			$res = maybe_mysqli_query( $query );
			if( !$res ){
				header( 'HTTP/1.0 500 Internal Server Error' );
			} else {
				header( 'HTTP/1.0 201 Created' );
			}
		break;

		case 'load' :
			setup_saveloadlist();
			if( !connect() ){
				header( 'HTTP/1.0 503 Service Unavailable' );
				break;
			}
			$keyword = ( isset( $_GET['keyword'] ) ? $_GET['keyword'] : '' );
			$keyword = maybe_mysqli_real_escape_string( $keyword );
			$query = 'SELECT `data` FROM '.TABLE.' WHERE keyword = "'.$keyword.'"';
			$result = maybe_mysqli_query( $query );
			$row = maybe_mysqli_fetch_assoc($result);
			if( !$row ){
				header( 'HTTP/1.0 404 Not Found' );
			}else{
				header( 'Content-type: text/xml' );
				echo $row['data'];
			}
		break;

		case 'import' :
			setup_import();
			if( !connect() ){
				header( 'HTTP/1.0 503 Service Unavailable' );
				break;
			}
			header( 'Content-type: text/xml' );
			echo import();
		break;

		default :
			header( 'HTTP/1.0 501 Not Implemented' );

	}


	/*
		list: 501/200
		load: 501/200/404
		save: 501/201
		import: 501/200
	*/
?>