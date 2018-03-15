<?php
file_get_contents('https://'.$_SERVER['SERVER_NAME'].':3337/?secret='.$_GET['secret'].'&message='.base64_encode (file_get_contents("php://input")));
