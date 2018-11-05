<?php
	$access_key = $_ENV['AWS_S3_ID'];
	$secret_key = $_ENV['AWS_S3_KEY'];
	$bucket = $_ENV['BUCKET_NAME'];
	$region = $_ENV['AWS_REGION'];
	$path = 'schemas';
	if (!$access_key || !$secret_key || !$bucket) {
		header("HTTP/1.0 501 Credentials not provided!");
		return;
	}
	
	include('amazon-s3-php/src/S3.php');
	$client = new S3($access_key, $secret_key, 's3-'.$region.'.amazonaws.com');
	
	$a = (isset($_GET["action"]) ? $_GET["action"] : false);
	switch ($a) {
		case "list":
			$response = $client->getBucket($bucket);
			foreach ($response->body->Contents as $content) {
				$key = $content->Key;
				if (0 === strpos($key, $path.'/') && $key != $path.'/')
					echo substr($key, strlen($path)+1)."\n";
			}
		break;
		case "save":
			$keyword = (isset($_GET["keyword"]) ? $_GET["keyword"] : "");
			$data = file_get_contents("php://input");
			$client->putObject($bucket, $path.'/'.$keyword, $data, array('Content-Type' => 'text/xml'));
			header("HTTP/1.0 201 Created");
		break;
		case "load":
			$keyword = (isset($_GET["keyword"]) ? $_GET["keyword"] : "");
			$file = $client->getObject($bucket, $path.'/'.$keyword);
			if ($file->body) {
				header("Content-type: text/xml");
				echo $file->body;
			} else {
				header("HTTP/1.0 404 Not Found");
			}
		break;
		default: header("HTTP/1.0 501 Not Implemented");
	}
?>
