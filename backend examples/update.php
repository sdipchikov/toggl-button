<?php
	// This file should be saved on your server
	include 'config.php';

	try {
	    $conn = new PDO('mysql:host='.$servername.';dbname='.$dbname.'', $username, $password);
	    // set the PDO error mode to exception
	    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	} catch(PDOException $e) {
		echo 'Connection to database failed: ' . $e->getMessage();
	}

	try {
		$sql = "UPDATE tasks SET description = '{$_POST['description']}' WHERE tid = '{$_POST['tid']}'";
		// use exec() because no results are returned
		$conn->exec($sql);
		} catch(PDOException $e) {
			echo $sql . '<br>' . $e->getMessage();
	}
	$conn = null;
