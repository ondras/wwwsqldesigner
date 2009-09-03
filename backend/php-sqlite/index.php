<?php
	function setup_saveloadlist() {
		define( "FILE" , "wwwsqldesigner.sqlite" );
		define( "TABLE" , "wwwsqldesigner" );
	}
	function setup_import() {
		header( 'HTTP/1.0 501 Not Implemented' );
        die;
	}
	function connect() {
        if( !file_exists( FILE ) ) $initReq = true;
		$GLOBALS['sqlConnect'] = sqlite_open(  FILE , 0666 );
		if( !$GLOBALS['sqlConnect'] ) return false;
        if( $initReq ) {
            $initSQL = "CREATE TABLE wwwsqldesigner (
                          keyword varchar(30) NOT NULL default '',
                          data TEXT ,
                          dt DATETIME DEFAULT CURRENT_TIMESTAMP ,
                          PRIMARY KEY ( keyword )
                        );";
            $res = sqlite_exec( $initSQL , $GLOBALS['sqlConnect'] );
            return $res;
        }
		return true;
	}
    function import() {
        header( 'HTTP/1.0 501 Not Implemented' );
    }

	$a = (isset($_GET["action"]) ? $_GET["action"] : false);
	switch( $a ) {
		case 'list' :
			setup_saveloadlist();
			if( !connect() ) {
				header( 'HTTP/1.0 503 Service Unavailable' );
				break;
			}
			$result = sqlite_query( "SELECT keyword FROM ".TABLE." ORDER BY dt DESC" , $GLOBALS['sqlConnect'] );
			if( sqlite_num_rows( $result )>0 ) {
                while( $row = sqlite_fetch_array( $result ) ) {
                    echo $row['keyword']."\n";
                }
            } else {
                echo "--No Designs Saved";
            }
            break;
		case 'save' :
			setup_saveloadlist();
			if( !connect() ) {
				header( 'HTTP/1.0 503 Service Unavailable' );
				break;
			}
			$keyword = ( isset( $_GET['keyword'] ) ? $_GET['keyword'] : '' );
			$keyword = sqlite_escape_string( $keyword );
			$data = file_get_contents( "php://input" );
			if( get_magic_quotes_gpc()
                || get_magic_quotes_runtime() ) {
			   $data = stripslashes( $data );
			}
			$data = sqlite_escape_string( $data );
			$r = sqlite_query( "SELECT * FROM ".TABLE." WHERE keyword = '$keyword'" , $GLOBALS['sqlConnect'] );
			if( sqlite_num_rows($r)>0 ) {
				$res = sqlite_query( "UPDATE ".TABLE." SET data = '$data' WHERE keyword = '$keyword'" , $GLOBALS['sqlConnect'] );
			} else {
				$res = sqlite_query( "INSERT INTO ".TABLE." (keyword, data) VALUES ('$keyword', '$data')" , $GLOBALS['sqlConnect'] );
			}
			if( !$res ) {
				header( 'HTTP/1.0 500 Internal Server Error' );
			} else {
				header( 'HTTP/1.0 201 Created' );
			}
            break;
		case 'load' :
			setup_saveloadlist();
			if ( !connect() ) {
				header( 'HTTP/1.0 503 Service Unavailable' );
				break;
			}
			$keyword = ( isset( $_GET['keyword'] ) ? $_GET['keyword'] : '' );
			$keyword = sqlite_escape_string( $keyword );
			$result = sqlite_query( "SELECT data FROM ".TABLE." WHERE keyword = '$keyword'" , $GLOBALS['sqlConnect'] );
			$row = sqlite_fetch_array( $result );
			if( !$row ) {
				header( 'HTTP/1.0 404 Not Found' );
			} else {
				header( 'Content-type: text/xml' );
				echo $row['data'];
			}
            break;
		case 'import' :
			setup_import();
		default:
            header( 'HTTP/1.0 501 Not Implemented' );
	}


	/*
		list: 501/200
		load: 501/200/404
		save: 501/201
		import: 501/200
	*/
?>
