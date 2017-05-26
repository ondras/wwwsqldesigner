<?php
	$a = (isset($_GET["action"]) ? $_GET["action"] : false);
	switch ($a) {
		case "list":
			$files = glob("data/*");
			foreach ($files as $file) {
				$name = basename($file);
				echo $name."\n";
			}
		break;
		case "save":
			$keyword = (isset($_GET["keyword"]) ? $_GET["keyword"] : "");
			$keyword = "data/".basename($keyword);
			$f = fopen($keyword, "w");
			$data = file_get_contents("php://input");
			if (get_magic_quotes_gpc() || get_magic_quotes_runtime()) {
			   $data = stripslashes($data);
			}
			fwrite($f, $data);
			fclose($f);
			header("HTTP/1.0 201 Created");			
		break;
		case "load":
			$keyword = (isset($_GET["keyword"]) ? $_GET["keyword"] : "");
			$keyword = "data/".basename($keyword);
			if (!file_exists($keyword)) {
				header("HTTP/1.0 404 Not Found");
			} else {
				header("Content-type: text/xml");
				echo file_get_contents($keyword);
			}
		break;
		default: header("HTTP/1.0 501 Not Implemented");
	}
?>
