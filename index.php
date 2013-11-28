<!DOCTYPE html>
<!-- (C) Tom Hands 2013. Most of this stuff was hacked together and is poor coding practice. You have been warned! tom.hands@leicester.ac.uk -->
<html>
<head>
<meta name="keywords" content="astrophysics, astronomy, planets, migration, physics, exoplanets, visualization">
<meta name="author" content="Tom Hands">
<link href="css/vader/jquery-ui-1.10.2.custom.css" rel="stylesheet">
<link href='http://fonts.googleapis.com/css?family=Donegal+One|Quattrocento' rel='stylesheet' type='text/css'>
<link href="style.css" rel="stylesheet" type="text/css">

<script src="js/jquery-1.9.1.js"></script>
<script src="js/jquery-ui-1.10.2.custom.js"></script>
<script src="mousewheel.js"></script>
<script src="http://platform.twitter.com/widgets.js"></script>

<script type="text/javascript">

  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-40064240-2']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();

</script>
<script src="script.js"></script>
<title>exovis - Exoplanet catalogue visualiser</title>
</head>
<?php
   //Get a system number from a provided name
   $sysnum;
   if(isset($_GET['sysname']))
   {
   $list = file_get_contents("list.dat");
   $split = explode("\n", $list);
   $i = 0;
   foreach($split as $entry)
   {
   $values = explode("\t", $entry);
   if(strcasecmp($values[1],$_GET['sysname']) ==0)
   {
   $sysnum = $i; break;
   }
   $i++;
   }
   }

   
?>
<body onload="getList(); createGame(<?php if(isset($_GET['system'])) print($_GET['system']); else if(isset($sysnum)) print($sysnum); else print("608"); ?>); <?php if(!isset($_GET['nowelcome'])) print('dia.open();');?> myGame.setRunning(); myGame.updateInfo();">
<div class="all">
<div class="toy"><canvas id="canv"></canvas></div>
<div class="all">
<div class="menu">
<div class="logocontainer" id="logo">exo<span class="blue">vis</span></div>
<div id="searchcont" class="searchcontainer" >
<div class="searchboxcontainer">
<input id="searcher" type="text" value="Search here for a system." onkeyup="populateResults()" onfocus="searchFocus()" onblur="searchBoxUnFocus()" class="searchbox">
</div>
</div>
<a href="http://www.openexoplanetcatalogue.com/" title="Open Exoplanet Catalogue - The source of all the exoplanet data you see here.">o.e.c</a><a href="http://tomhands.com" title="About the author of this website...">tom hands</a>
<!--<a href="">about</a>-->
</div><!--menu-->
<div class="information" id="info">
<h1>system name</h1>
<h2 id="sysname">Loading...</h2>
<div id="starinfo">
<h1>distance</h1>
<p><span id="sysdist" title="The distance from our solar system to this system, in parsecs"></span><span title="1 parsec is equivalent to roughly to 30.9 trillion kilometers"> parsec</span></p>
<h1>number of planets</h1>
<p id="noplanets"></p>
<h1>stellar mass</h1>
<p><span id="mstar" title="The mass of this system's host star relative to the mass of our sun"></span><span title="The mass of the sun"> Msun</span></p>
<h1>size</h1>
<p><span id="size" title="The semi-major axis of the largest orbit in this system, measured in AU"></span><span title="1 AU (astronomical unit) is approximately equal to the distance between the Earth and the Sun"> AU</span></p>
<h1>orbiting planets</h1>
<ul id = "planets"></ul>
</div>
<div id="planinfo" class = "nodisplay">
<p><span class="back"><a id="backtosys">&lt; click here to return to system overview &lt;</a></span><p>
<h1>planet name</h1>
<h2 id="planname">Loading...</h2>
<p id="desc">Loading...</p>
<h1>discovery method</h1>
<p id="method" title="The method by which this planet was discovered">Loading...</p>
<h1>discovery year</h1>
<p id="year" title="In which year was this planet discovered?">Loading...</p>
<h1>semi-major axis</h1>
<p><span id="axis">Loading...</span><span title="1 AU (astronomical unit) is approximately equal to the distance between the Earth and the Sun"> AU</span></p>
<h1>eccentricity</h1>
<p id="ecc" title="Eccentricity is a measure of how far a planet's orbit deviates from being a perfect circle">Loading...</p>
<h1>mass of planet</h1>
<p><span id="planmass">Loading...</span><span title="The mass of Jupiter."> MJup</span></p>
<h1>radius of planet</h1>
<p><span id="planrad">Loading...</span><span title="The radius of Jupiter."> RJup</span></p>
<h1>orbital period of planet</h1>
<p><span id="planperiod" title="The amount of time required for this planet to complete 1 orbit of its host star.">Loading...</span><span title="1 Earth day."> Days</span></p>
<p id = "aux"></p>
</div>
</div>
<div class="controlholder">
<div class = "tweet" id = "tweetdiv">
<a href="https://twitter.com/share" class="twitter-share-button" id="tweetme" data-url="http://tomhands.com/exovis" data-text="I like a system on ExoVis!" data-size="large">Tweet</a>
</div>
<div class="downsys" title="Move down to a smaller system (down arrow on keyboard)"></div><div class="upsys" title="Move up to a larger system (up arrow on keyboard)"></div></div>
<div class="holder">
<div id="thedialog" class="empty"></div>
</div> <!--holder-->
<div id="searchresults" class="empty">
<div id="searchopts">
Filter by number of planets in system: <span id="lowlimit">0</span> - <span id="highlimit">10</span>
<div id="slider"></div>
<input type="checkbox" name="filter" onclick="filterToggle()" title="If you select this option then the visualiser will only display results from your search query. For instance, if you search for 'kepler', the visualiser will only show Kepler planets."> Filter visible systems with search results?</div>
<div id="searchresultslist">
</div>
</div>
</div> <!--all-->
</div> <!--all-->
<?php if(!isset($_GET['nowelcome'])) print('
<script type="text/javascript">
var dia = new displayDialog(document.getElementById("thedialog"), 550, "welcome",
"As you may well be aware, ExoVis won the <a href=\"http://www.openexoplanetcatalogue.com/contest/\">Open Exoplanet Catalogue 2013 visualisation contest!</a> ExoVis is a visualisation tool for exoplanet archival data, which is taken from the <a href=\"http://www.openexoplanetcatalogue.com/\">Open Exoplanet Catalogue</a>. It was built by Tom Hands (<a href=\"https://twitter.com/TomHandsPhysics\">twitter</a>/<a href=\"mailto:tom.hands@le.ac.uk\">email</a>) and is designed to be as user friendly and insightful as possible. It uses a combination of HTML5, Javascript (and jQuery with <a href=\"http://brandonaaron.net/code/mousewheel/docs\">this plug-in</a>!) and PHP.<br><br>Use the up and down arrow keys on your keyboard to navigate through known exoplanet systems (or your scrollwheel if you prefer), which are arranged in order of the largest semi-major axis of any planet in the system. Alternatively, use the search box and drop-down menu above to skip right to your favourite! Hovering your mouse over the search box will show a list of all systems. From there you can search for those of interest. When you view a system you can see other systems of similar - albeit smaller - size underneath, so you can compare them. You can also use the search feature to only view systems with a certain quantity of planets.<br><br> I would like to thank Alex Dunhill, Richard Alexander, Emily Armstrong and David Marshall for their valued input during the development of ExoVis.");
</script>'); ?>
</body>
</html>
