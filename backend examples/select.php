<?php
	// This file should be saved on your server
	$servername = '127.0.0.1';
	$username = 'myUserName';
	$password = 'myPassword';
	$dbname = 'myDatabase';

	try {
	    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
	    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	    $stmt = $conn->prepare("SELECT tid FROM tasks WHERE trello_card_id = '{$_POST['trello_card_id']}' AND pid = '{$_POST['pid']}'"); 
	    $stmt->execute();

	    // set the resulting array to associative
	    $result = $stmt->setFetchMode(PDO::FETCH_ASSOC);

	    foreach ($stmt->fetchAll() as $value) {
	    	$tid = $value['tid'];
	    }
	    echo $tid;
	}
	catch(PDOException $e) {
	    echo "Error: " . $e->getMessage();
	}
	$conn = null;
