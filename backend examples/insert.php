<?php
	// This file should be saved on your server
	$servername = '127.0.0.1';
	$username = 'myUserName';
	$password = 'myPassword';
	$dbname = 'myDatabase';

	try {
	    $conn = new PDO('mysql:host='.$servername.';dbname='.$dbname.'', $username, $password);
	    // set the PDO error mode to exception
	    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	} catch(PDOException $e) {
		echo 'Connection to database failed: ' . $e->getMessage();
	}

	try {
		$sql = "INSERT INTO tasks (description, pid, tid, trello_card_id) VALUES ('{$_POST['description']}', '{$_POST['pid']}', '{$_POST['tid']}', '{$_POST['trello_card_id']}')";
		// use exec() because no results are returned
		$conn->exec($sql);
		} catch(PDOException $e) {
			echo $sql . '<br>' . $e->getMessage();
	}
	$conn = null;
