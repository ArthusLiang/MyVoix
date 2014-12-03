<!DOCTYPE HTML>
<html>
	<head>
		<title></title>
		<meta http-equiv="Content-type" content="text/html; charset=utf-8">
		<script type="text/javascript" src="myvoix2.0.js" ></script>
		<script type="text/javascript">
			window.onload=function(){
				var _myVoix = new MyVoix();
				_myVoix.createSoundWave({
					canvas:document.getElementById('myCanvas'),
					height:600,
					width:800,
					noise:0.01,
					F:2
				});
			}
		</script>
	</head>
	<body style=" background:black;">	
		<canvas id='myCanvas' style='width:800px; height:600px;'></canvas>
	</body>
</html>

