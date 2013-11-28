<?php
/*Open Exoplanet DB XML file reading, (C) Tom Hands 2013 - toh1@le.ac.uk*/
$mode = $_GET["mode"];
//Directory of files
$dir = "open_exoplanet_catalogue/systems/";
$G = 4 * 3.142 * 3.142;
$exodir = opendir($dir);
if(!$exodir)
	exit;
$N = 0;
$sizes = array();
$niceNames = array();
$planets = array();

function getSize($planet, $system)
{
	global $G;
	if(property_exists($planet, "semimajoraxis"))
	{
		return (float)$planet->semimajoraxis;
	}
	else if(property_exists($planet, "period") && property_exists($system->star, "mass"))
	{
		$psize = pow((double)$planet->period/(365.0 * 2.0 * 3.142) * sqrt($G * (double)$system->star->mass), 2.0/3.0);
		print_r("No axis but we have a period ".$planet->name." ".$system->star->mass." ".$planet->period." Inferred size is ".$psize."<br>");
		return $psize;		
	}
	else
	{
		print_r("Planet does not have enough data to infer orbital size! ".$planet->name."<br>");
		return 0.0;
	}	
}

while(false !== ($entry = readdir($exodir)))
{
	//Read in files one at a time and parse them as planets
	if($entry != "." && $entry != "..")
	{
		$system = simplexml_load_file($dir.$entry);
		$mysize = (float)0.0;
		//loop over planets, find larget semi major
		//print "<pre>";
		//print_r($system->star->planet);
		//print "</pre>";
		print_r("System: ".$system->name."<br>");
		$planetz = 0;
		if(count($system->star->planet) > 1) //Multiple planet case
		{
			foreach($system->star->planet as $planet)
			{
				$psize = getSize($planet, $system);
				if($psize > $mysize)
					$mysize = ($psize);
				$planetz++;
			}
		}
		else if(property_exists($system, "star"))//One planet case
		{
			$planet = $system->star->planet;
			$mysize = getSize($planet, $system);
			$planetz = 1;
		}
		
		$binary = false;
		foreach($system->binary as $binary)
		{
			print_r("Binary detected! ".$system->name."<br>");
			$binary = true;
		}

		if(!$binary && $mysize > 0.0)
		{
			$sizes[(string)$entry] = $mysize;
			$niceNames[(string)$entry] = (string)(count($system->name) > 1 ? $system->name[0] : $system->name);
			$planets[(string)$entry] = $planetz;
			$N++; //Count how many systems we have indexed
		}
	}
}
closedir($exodir);
print "<pre>";
print_r($niceNames);
print "</pre>";
//Get a list of all systems, dump to a file in size (AU) order 
asort($sizes);
$out = fopen("list.dat", "w");
if(!$out)
{
	print "File error.";
	exit;
}
foreach($sizes as $f => $s)
{
	fwrite($out, $f."\t".$niceNames[$f]."\t".$s."\t".((string)($planets[$f]))."\n");
}
fclose($out);

?>