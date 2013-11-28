//(C) Tom Hands, University of Leicester, tom.hands@leicester.ac.uk
/* PLEASE NOTE
I am fully aware that this script infers semi-major axes from periods incorrectly. There is a corrected 
version at www.tomhands.com/exovis-beta that does not do this, and also does a better job of
animating orbits. Once the competition is over I will update the main exovis website with these fixes :-) */
var dir = "open_exoplanet_catalogue/systems/";
var G = 4 * 3.142 * 3.142;
var defaultGrey = 50;
var r = 0, g = 179, b = 231;
highlight = {};
highlight.sys = false;
highlight.plan = false;
highlight.dontcancel = false;

function sanitize(flt)
{
	return Math.round(flt * 10000)/10000;
}

//Holds details of systems pulled from server so that
function SystemList()
{
	this.files = new Array();
	this.friendlyNames = new Array();
	this.sizes = new Array();
	this.noPlans= new Array();
	this.basicSet = new Array();
	this.systems;
	this.populated = false;
	this.populate = function(data){
		var lines = data.split("\n");
		for(var i = 0; i < lines.length - 1; i++)
		{
			var data = lines[i].split("\t");
			this.files.push(data[0]);
			this.friendlyNames.push(data[1]);
			this.sizes.push(parseFloat(data[2]));
			this.noPlans.push(parseFloat(data[3]));
		}
		this.systems = new Array(this.sizes.length); //We will use this to hold our systems
		for(var i = 0; i < this.systems.length; i++){this.systems[i] = false; this.basicSet.push(i);} //Fill array with falses to signify this system is not yet loaded
		this.populated = true;
	};
	
	//Take a system from the caller and put it with its name and size
	this.takeSystem = function(i, system)
	{
		this.systems[i] = system;
	 if(myGame.subset[myGame.whichSystem] == i)
	     myGame.updateInfo();
	};
	
	this.getSystem = function(i) //Safe way to access a system - check for true/false on return
	{
		if(this.systems[i] === false)
		{
			//Load it up
			loadSystem(i); //If the system we are meant to display isn't loaded, load it
			this.systems[i] = true; //True for we are getting it
			return true; //System is being loaded, wait!
		}
		else
			return this.systems[i];
	};
}

var systemList = new SystemList();

function Planet(names, axis, temp, ecc, mass, year, radius, meth, desc, period, img, imgDesc)
{
	this.names = names;
	this.axis = axis;
	this.temp = temp;
	this.size = size;
	this.eccentricity = ecc;
	this.mass = mass;
	this.year = year;
	this.radius = radius;
	this.meth = meth;
	this.desc = desc;
	this.period = period;
	this.img = img;
	this.imgDesc = imgDesc;
	this.theta = Math.random() * 2.0 * 3.142;
	this.semiMinor = 0.0;
	//Calculate semi minor axis
	if(this.eccentricity > 0.0)
		this.semiMinor = this.axis * Math.sqrt(1 - this.eccentricity*this.eccentricity);
	else
		this.semiMinor = this.axis;
	this.displayR = false;
}

function Star(names, planets, mass, size)
{
	this.names    = names;
	this.planets  = planets;
	this.mass = mass;
	this.size = size;
}

function System(names, stars, distance)
{
	this.names    = names;
	this.stars   = stars;
	this.distance = distance;
}


function getList()
{
	$.get("list.dat",function(data,status){
		//Do something with list data
		systemList.populate(data);
	});
}

function loadSystem(i) //Retrieve a system from the server, parse it into objects, add it to the list of systems
{
	var file = systemList.files[i];
	//alert("retrieving system " + i + " " + file);
	var newSystem;
	$.get(dir+file, function(data,status){
		if(status !== "success")
			alert(status);
		var xml = $("system", data); //No need to parse: jquery detects the type and parses it itself.
		
		//Temp arrays for storing properties of this system
		var sysNames = new Array();
		var stars    = new Array();
		//Parse all names of the system
		xml.children("name").each(function()
		{
			sysNames.push($(this).text());
		});
		var distance;
		if(xml.children("distance").length)
			distance = parseFloat(xml.children("distance").text());
		else
			distance = "Unknown";
		//For each star in a system...
		xml.children("star").each(function()
		{
			//the names for this star
			var starNames = new Array();
			//the planets for this star
			var planets   = new Array();
			$(this).children("name").each(function()
			{
				starNames.push($(this).text());
			});	
			var starMass = "Unknown";
			if($(this).children("mass").text())
				starMass = parseFloat($(this).children("mass").text());
			var starSize = parseFloat($(this).children("radius").text());

			$(this).children("planet").each(function()
			{
				var planetNames = new Array();
				$(this).children("name").each(function()
				{
					planetNames.push($(this).text());
				});	
				var planAxis = 0.0;
				if($(this).children("semimajoraxis").length)
					planAxis = $(this).children("semimajoraxis").text();
				else if($(this).children("period").length && starMass)
					planAxis = Math.pow(parseFloat($(this).children("period").text())/(365 * 2 * 3.142) * G * starMass, 1.0/3.0);
				var planEcc  = 0.0;
				if($(this).children("eccentricity").length)
					planEcc = $(this).children("eccentricity").text();
				var planSize = 0.0;
				if($(this).children("radius").length)
					planSize = $(this).children("radius").text();
				var period = 0.0;
				if($(this).children("period").length)
					period = $(this).children("period").text();
				var planTemp = $(this).children("temperature").text();
				var planMass = $(this).children("mass").text();
				var planYear = $(this).children("discoveryyear").text();
				var planMeth = $(this).children("discoverymethod").text();
				var planDesc = $(this).children("description").text();
				var planImg  = $(this).children("image").text();
				var planImgDesc  = $(this).children("imagedescription").text();
				planets.push(new Planet(planetNames, parseFloat(planAxis), parseFloat(planTemp), parseFloat(planEcc), parseFloat(planMass), parseFloat(planYear), parseFloat(planSize), planMeth, planDesc, parseFloat(period), planImg, planImgDesc));
			});
			stars.push(new Star(starNames, planets, starMass, starSize));
		});
		//Add a new system containing all the parsed data
		systemList.takeSystem(i, new System(sysNames, stars, distance));
	});
	//Can't do anything here to our new system since our AJAX request is not guaranteed to be finished yet - the callback fnc only runs once the request has finished
}

//BEGIN GAME CLASS
function Game(c, ctx, sys)
{
	this.c = c;
	this.ctx = ctx;
	this.intervalID;
	this.whichSystem = sys;
	this.nextSystem = this.whichSystem;
	this.viewDepth = 4;
	this.transitionFrames = 24;
	this.transitionStage  = this.transitionFrames ;	
	this.transitionSpeed = 1;
	this.subset = systemList.basicSet;
	this.oldSubset = false;
}

function generateHighlighter(no, i)
{
	return function() {highlight.sys = no; highlight.plan = i;}
}

function generatePlanetInfo(no, i)
{
	return function() {myGame.updatePlanetInfo(i);}
}

//Update planetary information
Game.prototype.updatePlanetInfo = function(i)
{
	var no = this.subset[this.whichSystem];
	var system = systemList.getSystem(no);
	

	$("#planname").text(system.stars[0].planets[i].names[0]);
	if(system.stars[0].planets[i].meth)
		$("#method").text(system.stars[0].planets[i].meth);
	else
		$("#method").text("Unknown");
	if(!isNaN(system.stars[0].planets[i].year))
		$("#year").text(system.stars[0].planets[i].year);
	else
		$("#year").text("Unknown");
	if(system.stars[0].planets[i].eccentricity)	
		$("#ecc").text(sanitize(system.stars[0].planets[i].eccentricity));
	else
		$("#ecc").text("Unknown");
		
	if(system.stars[0].planets[i].axis)	
		$("#axis").text(sanitize(system.stars[0].planets[i].axis));
	else
		$("#axis").text("Unknown");
		
	if(system.stars[0].planets[i].radius)	
		$("#planrad").text(sanitize(system.stars[0].planets[i].radius));
	else
		$("#planrad").text("Unknown");
	
	if(system.stars[0].planets[i].mass)	
		$("#planmass").text(sanitize(system.stars[0].planets[i].mass));
	else
		$("#planmass").text("Unknown");
		
	if(system.stars[0].planets[i].desc)	
		$("#desc").text(system.stars[0].planets[i].desc);
	else
		$("#desc").text("");
	
	if(system.stars[0].planets[i].period)	
		$("#planperiod").text(sanitize(system.stars[0].planets[i].period));
	else
		$("#planperiod").text("Unknown");
	
	if(system.stars[0].planets[i].img)
	{
		$("#desc").append("<br>");
		$("<img>", { src: "images/" + system.stars[0].planets[i].img  + ".jpg", width:240, title: system.stars[0].planets[i].imgDesc}).appendTo("#desc");
	}

	
	$("#starinfo").toggleClass("nodisplay");
	$("#planinfo").toggleClass("nodisplay");
	highlight.sys = no; highlight.plan = i;
	highlight.dontcancel = true;
};

Game.prototype.updateInfo = function(){
	if(systemList.populated)
	{
	    if($("#starinfo").hasClass("nodisplay"))
		{
			$("#starinfo").toggleClass("nodisplay");
		}
		if(!$("#planinfo").hasClass("nodisplay"))
			$("#planinfo").toggleClass("nodisplay");	
		var no = this.subset[this.whichSystem];
	
		$("#sysname").text(systemList.friendlyNames[no]);
		$("#size").text(sanitize(systemList.sizes[no]));
		var system = systemList.getSystem(no);
		if(system !== true)
		{
			if(systemList.friendlyNames[no] !== "Sun" && !isNaN(system.distance))
				$("#sysdist").text(sanitize(system.distance));
			else if(systemList.friendlyNames[no] == "Sun")
				$("#sysdist").text("0");
			else
				$("#sysdist").text("unknown");

			$("#noplanets").text(system.stars[0].planets.length);
		    if(!isNaN(system.stars[0].mass))
			$("#mstar").text(sanitize(system.stars[0].mass));
		    else
			$("#mstar").text("Unknown");
			$("#planets").text("");
			
			for(var i = 0; i < system.stars[0].planets.length; i++)
			{
				var planetElement = $("<li title=\"Click to view more information about this planet.\"><a>" + system.stars[0].planets[i].names[0] +"</li></a>");
				planetElement.mouseenter(generateHighlighter(no, i));
				planetElement.mouseleave(function(){if(!highlight.dontcancel) highlight.sys = highlight.plan = false;});
				planetElement.click(generatePlanetInfo(no, i));
				$("#planets").append(planetElement);
			}
		}
		//From here: http://stackoverflow.com/questions/9215806/how-to-update-the-twitter-share-button-url-with-dynamic-content
		/*var newTweet = $(".twitter-share-button-fake").clone();
		newTweet.removeAttr("style");
		newTweet.attr("data-url", "www.tomhands.com/exovis?system=");
		newTweet.attr("class", "twitter-share-button");
		$("#tweetdiv").append(newTweet);
		$.getScript("http://platform.twitter.com/widgets.js");*/
		$("#tweetdiv").text("");
		$("#tweetdiv").append("<a href=\"https://twitter.com/share\" class=\"twitter-share-button\" data-url=\"http://tomhands.com/exovis?system="+no+"\" data-text=\"I'm looking at the planetary system '"+systemList.friendlyNames[no]+"' on ExoVis!\" data-size=\"large\">Tweet</a>");
		twttr.widgets.load();
	}
};

Game.prototype.next = function(){
	if(this.nextSystem != this.subset.length - 1)
	{
		if(this.nextSystem < this.whichSystem) this.nextSystem = this.whichSystem - 1;
		else this.nextSystem += 1;
		if(this.transitionStage == this.transitionFrames)this.transitionStage = 0;
	}
};	

	
Game.prototype.prev = function(){
	if(this.nextSystem != 0)
	{
		if(this.nextSystem > this.whichSystem) this.nextSystem = this.whichSystem + 1;
		else this.nextSystem -= 1;
		if(this.transitionStage == this.transitionFrames)this.transitionStage = 0;
	}
};


Game.prototype.jumpTo = function(c){
	//Find i in current subset
	var it = 0;
	while(myGame.subset[it] != c)
		it++;
	var i = it;
	this.nextSystem = i;
	//console.log("jumpto called");
	var insertSystems = 8;
	if(Math.abs(this.whichSystem - this.nextSystem) > 2 * this.viewDepth)
	{
		this.oldSubset = this.subset; //Save subset for later
		this.subset = new Array();
		var extraFrames = Math.floor(Math.abs(this.whichSystem - this.nextSystem)/insertSystems);
		if(this.whichSystem - this.nextSystem > 0) //Zooming in
		{
			for(var n = this.viewDepth - 1; n >= 0; n--)
			{
				this.subset.push(this.oldSubset[i - n])
				//console.log(i - n + " " + this.oldSubset[i - n]);
			}
			for(var n = 1; n < insertSystems - 1; n++)
			{
				this.subset.push(this.oldSubset[i + n * extraFrames]);
			}
			for(var n = this.viewDepth- 1; n >= 0; n--)
			{
				this.subset.push(this.oldSubset[this.whichSystem - n])
				//console.log(this.whichSystem - n);
			}		
			this.nextSystem = this.viewDepth - 1;
			this.whichSystem = this.subset.length - 1;
			//console.log(this.subset[this.nextSystem] + " " + i);
		}
		else //Zooming out
		{
			for(var n = this.viewDepth- 1; n >= 0; n--)
			{
				this.subset.push(this.oldSubset[this.whichSystem - n])
			}				
			for(var n = 1; n < insertSystems - 1; n++)
			{
				this.subset.push(this.oldSubset[this.whichSystem  + n * extraFrames]);
			}	
			for(var n = this.viewDepth- 1; n >= 0; n--)
			{
				this.subset.push(this.oldSubset[i - n])
			}	
			this.whichSystem = this.viewDepth - 1;
			this.nextSystem = this.subset.length - 1;			
		}
	}
    this.transitionStage = 0;
};

Game.prototype.drawSystem = function(system, color, viewPortHeight, checkPlanet)
{
	var areaPerFrame = 300;
	//console.log("Drawing system " + this.whichSystem);
	for(var i = 0; i < system.stars[0].planets.length; i++)
	{
		this.ctx.fillStyle = color;
		this.ctx.strokeStyle = color;
		var planet = system.stars[0].planets[i];
		if(checkPlanet && (i === highlight.plan))
		{
			//console.log(highlight.plan);
			this.ctx.fillStyle = this.ctx.strokeStyle  = "rgba(230,50,50,1)";
		}
		var radius;
		//if(this.c.height < this.c.width)
		radius = planet.semiMinor/viewPortHeight * 0.9 * this.c.height/2;
		//else
			//radius = planet.axis/viewPortHeight * 0.9 * this.c.width/2;
		//Draw orbit of each planet
		this.ctx.save(); //Save canvas state before we transform it
		this.ctx.scale(planet.axis/planet.semiMinor, 1); //Scale canvas so we get an ellipse with it's semi major axis alinged on the browsers x axis
		this.ctx.beginPath();
		//var focusTransform = (1 + planet.eccentricity)/(1 - planet.eccentricity);
		//focusTransform = radius - 2 * radius *  1/(1 + focusTransform);
		var focusTransform = radius * planet.eccentricity;
		this.ctx.arc((this.c.width/2 )* planet.semiMinor/planet.axis + focusTransform, this.c.height/2, radius, 0, Math.PI*2, false); 
		//console.log(focusTransform+ " " + planet.eccentricity * planet.axis /viewPortHeight * 0.9 * this.c.height/2);
		this.ctx.closePath();
		this.ctx.restore();
		this.ctx.stroke();
		//Evolve the phase of the planet
		//Get current r
		var r1 = radius * planet.axis/planet.semiMinor * ( 1 - planet.eccentricity*planet.eccentricity )/(1 + planet.eccentricity*Math.cos(planet.theta));
		var thetaDot = areaPerFrame/(r1*r1);
		planet.theta += thetaDot;
		//Calculate X and Y coodrinates from theta
		var cosTheta = Math.cos(planet.theta);
		planet.displayR = radius * planet.axis/planet.semiMinor * ( 1 - planet.eccentricity*planet.eccentricity )/(1 + planet.eccentricity*cosTheta);
		var x = -planet.displayR  * cosTheta;
		var y = planet.displayR * Math.sin(planet.theta);
		//Draw the planet
		this.ctx.beginPath();
		var planRad = 20;
		if(planet.radius)
			planRad = planet.radius;
		else if(planet.mass)
			planRad = Math.pow(planet.mass, 1.0/2.06);
		this.ctx.arc(this.c.width/2 + x, this.c.height/2 + y, Math.ceil(planRad * 12), 0, Math.PI*2, false);
		this.ctx.closePath();
		this.ctx.fill();
	}
};

Game.prototype.render = function(){
	if(systemList.populated === true)
	{
		var transitioning = 0, iStart = 0, iStop = this.viewDepth;//Math.abs(this.whichSystem - this.nextSystem);
		if(this.whichSystem - this.nextSystem > 0) //Zooming in case
		{ transitioning = -1; iStop = this.viewDepth + 1;} //Have to draw system down from us
		else if(this.whichSystem - this.nextSystem < 0) //Zooming out case
		{ transitioning = +1; iStart = -1;} //Have to draw system one up from us
		//Draw a scale
		
		//Set viewport size based on where we are moving to
		var viewPortHeight = systemList.sizes[this.subset[this.whichSystem]];
		var progress = this.transitionStage/this.transitionFrames;
		viewPortHeight += (systemList.sizes[this.subset[this.whichSystem + transitioning]] - systemList.sizes[this.subset[this.whichSystem]]) * progress;
		
		//Draw the systems within our view depth
		for(var n = 0; n != iStop - iStart; n++)
		{
			i = iStop - n -1;
			if(this.subset[this.whichSystem - i] < 0 || this.whichSystem - i < 0 || this.subset[this.whichSystem - i] == undefined) continue;
			//console.log(this.subset[this.whichSystem - i]);
			var system = systemList.getSystem(this.subset[this.whichSystem - i]);
			if(system !== true) //Function will return true if system is loading - only draw loaded systems
			{
				var alph = 1 - i/this.viewDepth - 1/this.viewDepth * transitioning * progress; //Default alpha in static case
				var col  = defaultGrey +","+ defaultGrey +","+ defaultGrey; //Colour for all but current and next systems
				
				if(transitioning == -1) //If zooming in...
				{
					//Deal with special cases for this particular transition
					if(i == 0) //This is the system we are zooming past
					{
						alph = 1 - progress; //Fade out
						col  = r+","+g+","+b;
					}
					else if(i == 1) //This is the system we are zooming in on
					{
						var newGrey = Math.round(defaultGrey - defaultGrey * progress);
						col = Math.round((r - defaultGrey) * progress + defaultGrey) + "," + Math.round((g - defaultGrey) * progress + defaultGrey) +","+Math.round((b - defaultGrey) * progress + defaultGrey);
					}
				}
				else if(transitioning == +1) //Zooming out
				{
					//Deal with special cases for this particular transition
					if(i == 0) //This is the system we are zooming away from
					{
						//Fade out color
						var newGrey = Math.round(0 + defaultGrey * progress);
						col = Math.round(r + (defaultGrey - r) * progress) + "," + Math.round(g + (defaultGrey - g) * progress) +","+Math.round(b + (defaultGrey - b) * progress);
					}
					else if(i == -1)
					{
						alph = progress;
						col  = r+","+g+","+b;
					}
				}
				else if(i == 0)
					col  = r+","+g+","+b;
				var checkPlanet = (this.subset[this.whichSystem - i] === highlight.sys); //Check planet for highlighting
				this.drawSystem(system, "rgba("+col+","+alph+")", viewPortHeight, checkPlanet);
			}
		}
		
		if(transitioning)
		{
			this.transitionStage += this.transitionSpeed ; //Advance transition
			if(this.transitionStage == this.transitionFrames) //Have we come to the end of our transition?
			{
				highlight.sys = highlight.plan = false;
				this.whichSystem += transitioning;
				if(this.whichSystem != this.nextSystem)
				{
					this.transitionStage = 0;
					if(this.whichSystem + transitioning == this.nextSystem)
						this.transitionSpeed = 1;
					else
						this.transitionSpeed = this.transitionFrames/4; //Move faster if we have many to get through
				}
				else
				{
					this.transitionSpeed = 1;
					if(this.oldSubset !== false)
					{
						var it = 0;
						while(this.oldSubset[it] != this.subset[this.whichSystem]) //Find current system in old subset
							it++;
						//alert(this.oldSubset[it] + " " + this.subset[this.whichSystem]);
						this.subset = this.oldSubset; //Restore subset
						this.oldSubset = false;
						this.whichSystem = it;
						this.nextSystem  = it;
					}
				}
				this.updateInfo();
			}
		}
	}
};

Game.prototype.loop = function(){
	this.c.setAttribute('width', window.innerWidth * 0.99 + "px");
	this.c.setAttribute('height', window.innerHeight * 0.99+ "px");
	$("#info").height((window.innerHeight - $("#info").position().top) * 0.9);
	this.render();
};

Game.prototype.setRunning = function(){
	var me = this;
	this.intervalID = setInterval(function(){me.loop();}, 1000/30); //Closure keeps the me variable alive so it can still be used to call loop on this game object
};
//END GAME CLASS

//BEGIN DIALOG CLASS - div is a div in which to put the dialog
function displayDialog(div, height, header, content){
	this.div = div;
	this.height = height;
	this.header = header;
	this.content = content;
	this.currHeight = 0;
	this.timer = 0;
	var me = this;
	
	this.close = function(){
		if(me.currHeight == 0)
		{
			me.div.className = "empty";
			me.div.innerHTML="";
		}
		if(me.currHeight > 0)
		{
			me.div.style.height = (me.currHeight - 1) + "px" 
			me.currHeight -= 10;
			window.setTimeout(me.close, 1);
		}
	};

	this.open = function(){
		if(me.currHeight == 0)
		{
			me.div.innerHTML="<h1>" + me.header + "</h1><p>" + me.content + "</p><button id=\"diaclosebutton\">close me</button>";
			document.getElementById("diaclosebutton").onclick = me.close;
			//document.getElementById("diaclosebutton").onclick = $(div).hide;
			me.div.className = "dialog"; 
		}
		if(me.currHeight < me.height)
		{
			me.div.style.height = (me.currHeight + 1) + "px" ;
			me.currHeight += 10;
			me.timer = window.setTimeout(me.open, 1);
		}
	};
}


//END DIALOG CLASS

//Searching functions

function createJumpListener(i)
{
	return function(){myGame.jumpTo(i); dontunfocus = false; searchUnFocus();};
}

function appendResult(i)
{
	$("#searchresultslist").append($("<a>"+ systemList.friendlyNames[i] + " | " + sanitize(systemList.sizes[i]) + " AU | " + systemList.noPlans[i] + " planet/s </a>").click(createJumpListener(i)));
}

var filter = false;
function filterToggle()
{
	//console.log("filter toggle");
	filter = !filter;
	if(filter == false) 
	{	
		myGame.whichSystem = myGame.subset[myGame.whichSystem];
		myGame.nextSystem =  myGame.whichSystem;
		myGame.subset = systemList.basicSet;
	}
	if(displayingBox)
		populateResults();
}

/*function populateAll()
{
	$("#searchresultslist").text("");
	for(var i = 0; i < systemList.friendlyNames.length; i++)
	{
		$("#searchresultslist").append($("<a>"+ systemList.friendlyNames[i] + " | " + systemList.sizes[i] + " AU | " + systemList.noPlans[i] + " planets </a>").click(createJumpListener(i)));
	}
}*/
function populateResults()
{
	//console.log("populating results list...");
    if(systemList.populated)
	{
		$("#searchresultslist").text("");
		//TODO: Replace with regexp
		var testString = $("#searcher").val().toLowerCase().replace("-", "").replace("_", "").replace(" ", "");
		var results = new Array();
		var sliderVals = $( "#slider" ).slider( "option", "values" );
		//Check each system for a match
		var containsCurr = false;
		var dontTestString = (testString === "")
		lastSearch = $("#searcher").val();
		//Populate system list
		for(var i = 0; i < systemList.friendlyNames.length; i++)
		{	
			var stringOK = false;
			if(!dontTestString)
			{
				var testString2 = systemList.friendlyNames[i].toLowerCase();
				testString2 = testString2.replace("-", "").replace("_", "").replace(" ", "");
				stringOK = testString2.match(new RegExp(testString))
			}
			else
				stringOK = true;
			if(stringOK && systemList.noPlans[i] >= sliderVals[0] && systemList.noPlans[i] <= sliderVals[1])
			{
				results.push(i);
				appendResult(i);
				if(i == myGame.subset[myGame.whichSystem]) containsCurr = results.length - 1;
			}
		}

		if(filter && results.length)
		{
			myGame.subset = results;
			if(containsCurr === false)
				{
					myGame.whichSystem = results.length - 1;
					myGame.nextSystem = myGame.whichSystem;
					myGame.updateInfo();
				}
			else
				myGame.whichSystem = myGame.nextSystem = containsCurr;
		}
		//Sort results
    }
}

//Search parameters
var dontunfocus = false; //Stops search box hiding before an onclick has been registered
var mouseOffCloses = true;
var displayingBox = false;
var textSearching = false;
var lastSearch = "";

function displayList()
{
	displayingBox = true;
	//console.log("displaying list");
	var dropPos = $("#searcher").position();
    var res = $("#searchresults");
	res.height(window.innerHeight - $("#searcher").outerHeight() - dropPos.top - 20);
    if(res.hasClass("empty"))
    {
		res.toggleClass("empty");
		res.toggleClass("searchresultsclass");
    }
	res.offset({top : dropPos.top + $("#searcher").outerHeight(), left : dropPos.left});
	$("#searchresultslist").outerHeight(res.height() - $("#searchopts").outerHeight());
	populateResults()
}

function listHover()
{
	//console.log("Hovering...");
	if(!displayingBox)
	{
		$("#searcher").val(lastSearch);
		displayList();
	}
	if(!textSearching)
		mouseOffCloses = true;
	displayingBox = true;
}


function searchFocus()
{
	//console.log("focus");
	hovering = false;
	textSearching = true;
	if(!displayingBox)
	{
		$("#searcher").val(lastSearch);
		displayList();
	}
}

function searchUnFocus()
{
	//console.log("unfocus");
    if(dontunfocus) return;
	$("#searcher").val("Search here for a system.");
	$("#searchresultslist").text("");
	$("#searchresults").height(0);
    if(!$("#searchresults").hasClass("empty"))
    {
		$("#searchresults").toggleClass("empty");
		$("#searchresults").toggleClass("searchresultsclass");
    }
	mouseOffCloses = false;
	displayingBox = false;
	textSearching = false;
}

function searchBoxUnFocus()
{	
	textSearching = false;
	mouseOffCloses = true;
	searchUnFocus();
}

var myGame;
function createGame(sys){
	myGame = new Game(document.getElementById("canv"), document.getElementById("canv").getContext("2d"), sys);
	$(document).tooltip({track : true});
	$(document).keydown(function(event)
	{
		//alert(event.which);
		if(event.which == 38) //Up
		{
			myGame.next();
			event.preventDefault();
		}
		else if(event.which == 40) //Down
		{
			myGame.prev();
			event.preventDefault();
		}
	}
	);
	$("div.upsys").click(function(){myGame.next()});
	$("div.downsys").click(function(){myGame.prev()});
	$("#backtosys").click(function(){ $("#starinfo").toggleClass("nodisplay"); $("#planinfo").toggleClass("nodisplay");	highlight.dontcancel = highlight.plan = highlight.sys = false;});
	$("#slider").slider({
			range: true,
			min:0,
			max:10,
			step:1,
			values: [ 0, 10]
		});
	$("#slider").slider({change:
		function(event, ui)
		{
			var sliderVals = $( "#slider" ).slider( "option", "values" );
			$("#lowlimit").text(sliderVals[0]);
			$("#highlimit").text(sliderVals[1]);
			if(displayingBox) populateResults(true);	
		}}
	);
	$("#searchcont").mouseenter(function(){listHover();});
	var res = $("#searchresults");
    res.mouseenter(function(){dontunfocus = true;});
    res.mouseleave(function(){dontunfocus = false; if(mouseOffCloses){ searchUnFocus(); displayingList = false;}});
	$("#canv").bind('mousewheel', function(event, delta){
		if(delta > 0) myGame.prev(); else myGame.next();
		return false; //Stop browser interpreting this as scrolling.
	});
	}
