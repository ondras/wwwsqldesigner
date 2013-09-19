<?php
	$pdo = null;

	function setup_saveloadlist() {
		define( "FILE" , "wwwsqldesigner.sqlite" );
		define( "TABLE" , "wwwsqldesigner" );
	}
	function setup_import() {
		header( 'HTTP/1.0 501 Not Implemented' );
        die;
	}
	function connect() {
		global $pdo;
		$initReq = false;
        if( !file_exists( FILE ) ) $initReq = true;
        $pdo = new PDO("sqlite:" . FILE);
		if( !$pdo ) return false;
        if( $initReq ) {
            $initSQL = "CREATE TABLE wwwsqldesigner (
                          keyword varchar(30) NOT NULL default '',
                          data TEXT ,
                          dt DATETIME DEFAULT CURRENT_TIMESTAMP ,
                          PRIMARY KEY ( keyword )
                        );";
            $res = $pdo->exec( $initSQL );
            return ($res !== false);
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
			$result = $pdo->query( "SELECT keyword FROM ".TABLE);
			$data = $result->fetchAll();
			if( count($data) > 0 ) {
				foreach ($data as $row) {
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
			$data = file_get_contents( "php://input" );
			if( get_magic_quotes_gpc()
                || get_magic_quotes_runtime() ) {
			   $data = stripslashes( $data );
			}

			$statement = $pdo->prepare("SELECT COUNT(*) AS c FROM ".TABLE." WHERE keyword = ?");
			$statement->execute(array($keyword));
			$result = $statement->fetchAll();
			if ($result[0]["c"] > 0) {
				$result = $pdo->prepare( "UPDATE ".TABLE." SET data = ? WHERE keyword = ?")->execute(array($data, $keyword));
			} else {
				$result = $pdo->prepare( "INSERT INTO ".TABLE." (keyword, data) VALUES (?, ?)")->execute(array($keyword, $data));
			}

			if( !$result ) {
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

			$statement = $pdo->prepare( "SELECT data FROM ".TABLE." WHERE keyword = ?");
			$statement->execute(array($keyword));
			$data = $statement->fetchAll();

			if( !count($data) ) {
				header( 'HTTP/1.0 404 Not Found' );
			} else {
				header( 'Content-type: text/xml' );
				echo $data[0]['data'];
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
