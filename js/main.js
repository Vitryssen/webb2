// Denna fil innehåller lösningen till er uppgift.
var channels = []; //Array för information för alla kanaler
var audioPlayer = new Audio(); //Audio objekt for playing the sounds from given urls
window.onload = function () {
	getChannelData();
	var getScheduleElement = document.getElementById("searchbutton")
	if (getScheduleElement) {
		getScheduleElement.addEventListener("click", getChannelSchedule);
		//Add event listener for clicking on the "Visa programtablå" button
	}
	function getChannelData() {
		var x = new XMLHttpRequest();
		x.onreadystatechange = function () {
			if (x.readyState == 4 && x.status == 200)
			{
				var doc = x.responseXML;
				var numberOfPages = doc.getElementsByTagName("totalpages")[0].innerHTML;
				var numberOfChannels = doc.getElementsByTagName("totalhits")[0].innerHTML;
				//Retrive the needed values
				channels = [];
				for(var i = 1; i <= numberOfPages; i++){
					var url = "https://api.sr.se/v2/channels/?page=" + i;
					//Loop through all channels on all pages
					let request = new XMLHttpRequest();
					request.onreadystatechange = function() {
						if (request.readyState == 4 && request.status == 200){
							var test = request.responseXML;
							var channelsOnPage = test.getElementsByTagName("size")[0].innerHTML;
							getChannelInfo(test, channelsOnPage);
							//When the information is ready add the info and add it to the channels array
						}
						if(channels.length == numberOfChannels){
							loadSearchProgram();
							loadChannelList();
							//When all channels have been added to the main array run the function
							//to output the information to the page
						}
					}
					request.open("GET", url);
					request.send();
				}
			}
		};
		x.open("GET", "https://api.sr.se/api/v2/channels/", true);
		x.send();
	}
	
};
function getChannelSongs(channelId, index, callback) {
	var x = new XMLHttpRequest();
	x.onreadystatechange = function () {
		if (x.readyState == 4 && x.status == 200)
		{
			var doc = x.responseXML;  //case 1: prev, current, next case 2: prev, current case 3: prev case 4: inga
			var count = doc.getElementsByTagName("title").length;
			//Default to setting all the values to none
			channels[index].prev = {
				song: "None",
				artist: "None"
			}
			channels[index].next = {
				song: "None",
				artist: "None"
			}
			//If there are more than 1 titles the first one is for the next song
			if(count >= 1){
				channels[index].next = {
					song: doc.getElementsByTagName("title")[count-1].innerHTML,
					artist: doc.getElementsByTagName("artist")[count-1].innerHTML
				}
			}
			//If there are more than 2 titles the first one is for the previous song
			if(count >= 2){
				channels[index].prev = {
					song: doc.getElementsByTagName("title")[0].innerHTML,
					artist: doc.getElementsByTagName("artist")[0].innerHTML
				}
			}
			//When everything is done callback to loadChannelSongs to
			//output all song info to the page
			callback(index);
		}
	};
	x.open("GET", "https://api.sr.se/api/v2/playlists/rightnow?channelid="+channelId, true);
	x.send();
};
function getChannelSchedule() {
	var givenId = document.getElementById("searchProgram").value
	var episodes = [];
	var x = new XMLHttpRequest();
	x.onreadystatechange = function () {
		if (x.readyState == 4 && x.status == 200)
		{
			var doc = x.responseXML;
			//Get the required values from the base page given by the api
			var numberOfPages = doc.getElementsByTagName("totalpages")[0].innerHTML;
			var totalEpisodes = doc.getElementsByTagName("totalhits")[0].innerHTML;
			var indexOfChannel = channels.findIndex(({ id }) => id === givenId);
			//Find the index for channels by searching for the passed id
			for(var i = 0; i <= numberOfPages; i++){
				var url = "http://api.sr.se/v2/scheduledepisodes?channelid="+givenId+"&page=" + (i+1);
				//Loops through all the pages the channel with the given id has
				let request = new XMLHttpRequest();
				request.onreadystatechange = function() {
					if (request.readyState == 4 && request.status == 200){
						var test = request.responseXML;
						var episodesOnPage = test.getElementsByTagName("size")[0].innerHTML;
						episodes = getScheduleInfo(test, episodesOnPage, episodes);
						//When the information is ready add the episodes to the main episode array
						//to be pushed to main channel array later
						if(episodes.length == totalEpisodes || totalEpisodes == 0){
							channels[indexOfChannel].allEpisodes = episodes;
							loadChannelEpisodes(indexOfChannel);
						}
						//If its the last episode set the episode attribute in channels to the given episodes
						//and output the episodes to the page
					}
				}
				request.open("GET", url);
				request.send();
			}
		}
	};
	x.open("GET", "http://api.sr.se/v2/scheduledepisodes?channelid="+givenId, true);
	x.send();
}
function getScheduleInfo(item, episodesOnPage, arrayForEpisodes){
	//If there are no episodes for the given channel default values are set
	if(episodesOnPage == 0){
		var scheduledEpisode = {
			title: "No titel",
			description: "No description",
			time: "No time"
		}
		arrayForEpisodes.push(scheduledEpisode);
		return arrayForEpisodes;
	}
	//Loop through all the episodes and push them to the array
	for(var i = 0; i < episodesOnPage; i++){
		var scheduledEpisode = {
			title: (item.getElementsByTagName("title")[i]) ? (item.getElementsByTagName("title")[i].innerHTML) : ("None"),
			description: (item.getElementsByTagName("description")[i]) ? (item.getElementsByTagName("description")[i].innerHTML) : ("None"),
			time: (item.getElementsByTagName("starttimeutc")[i]) ? (item.getElementsByTagName("starttimeutc")[i].innerHTML) : ("None"),
			//Ändra tidformatering till "Sun Jan 17 2021 06:00:00 GMT+0100 (centraleuropeisk normaltid)"
		}
		arrayForEpisodes.push(scheduledEpisode);
	}
	//Return the array, this allows the array to append all the schedules episodes
	//even on other pages of the API
	return arrayForEpisodes;
}
function getChannelInfo(item, channelsOnPage){
	for(var i = 0; i < channelsOnPage; i++){
		var channel = {
			id: (item.getElementsByTagName("channel")[i]) ? (item.getElementsByTagName("channel")[i].getAttribute("id")) : ("None"),
			name: (item.getElementsByTagName("channel")[i]) ? (item.getElementsByTagName("channel")[i].getAttribute("name")) : ("None"),
			imageUrl: (item.getElementsByTagName("image")[i]) ? (item.getElementsByTagName("image")[i].innerHTML) : ("https://image.makewebeasy.net/mwetemplate/0/template0117/DefaultData/t116_line.png"),
			description: (item.getElementsByTagName("tagline")[i]) ? (item.getElementsByTagName("tagline")[i].innerHTML) : ("None"),
			scheduleUrl: (item.getElementsByTagName("scheduleurl")[i]) ? (item.getElementsByTagName("scheduleurl")[i].innerHTML) : ("None"),
			soundUrl: (item.getElementsByTagName("url")[i]) ? (item.getElementsByTagName("url")[i].innerHTML) : ("None"),
			allEpisodes: []
		}
		//Set the attributes if the value exists or a default one if its missing.
		channels.push(channel);
		//Push the newly created channel to the global array
	}
};
function loadChannelEpisodes(index){
	var parentElement = document.getElementById("info");
	parentElement.innerHTML = "";
	//Clear the parent element before appending new content
	for(var i = 0; i < channels[index].allEpisodes.length; i++){
		var channelName = document.createElement("h1");
		channelName.innerHTML = channels[index].allEpisodes[i].title;
		//Create h1 element for the title of the episode. If not given "No titel" is written
		var channelDescription = document.createElement("h3");
		channelDescription.innerHTML = channels[index].allEpisodes[i].description;
		//Create h3 element for the description of the episodes. If not given "No description" is written
		var songs = document.createElement("p");
		songs.setAttribute("id","beskrivning");
		songs.innerHTML = channels[index].allEpisodes[i].time;
		//Create p elemtent for the time the episode is live. If not given "No time" is written
		parentElement.appendChild(channelName);
		parentElement.appendChild(channelDescription);
		parentElement.appendChild(songs);
		//Append all child elements to the parent
	}
}
function loadSearchProgram(){
	var parentElement = document.getElementById("searchProgram");
	parentElement.innerHTML = "";
	//Clear the parent element before appending new content
	for(var i = 0; i < channels.length; i++){
		var opt = document.createElement("option");
		opt.value = channels[i].id;
		opt.innerHTML = channels[i].name;
		parentElement.appendChild(opt);
	}
	//Add all the channel names with their ids as value to the dropdown menu
};
function loadChannelList(){
	var parentElement = document.getElementById("mainnavlist");
	parentElement.innerHTML = "";
	//Clear the parent element before appending new content
	for(var i = 0; i < channels.length; i++){
		var opt = document.createElement("li");
		opt.setAttribute("onclick", "getChannelSongs("+channels[i].id+","+i+",loadChannelSong)");
		opt.setAttribute("id", channels[i].id);
		//Create li element for the channel and set an onclick event that handles playing of the audio
		var channelImage = document.createElement("img");
		channelImage.setAttribute("src", channels[i].imageUrl);
		//Create img tag with the given image url or a standard one if not given by the API
		opt.appendChild(channelImage);
		opt.innerHTML += channels[i].name;
		//Append the image before adding the channel name to the tag
		parentElement.appendChild(opt);
		//Append the hole li element to the parent ul element
	}
};
function loadChannelSong (index){
	var parentElement = document.getElementById("info");
	parentElement.innerHTML = "";
	//Clear info before appending new
	var channelName = document.createElement("h1");
	channelName.innerHTML = channels[index].name;
	//Make the titel of the channel a h1 tag
	var channelDescription = document.createElement("h3");
	channelDescription.setAttribute("id","beskrivning");
	channelDescription.innerHTML = channels[index].description;
	//Create a h3 tag for the description and set id for css styling
	var songs = document.createElement("p");
	songs.setAttribute("id","song");
	songs.innerHTML = "Previous song: "+channels[index].prev.artist + " - "+channels[index].prev.song + "<br>Next song: " + channels[index].next.artist + " - " + channels[index].next.song
	//Create a p tag for information about the songs and add id for css styling
	parentElement.appendChild(channelName);
	parentElement.appendChild(channelDescription);
	parentElement.appendChild(songs);
	//Append all the created elements to the parent element
	window.scroll({
		top: 0, 
		left: 0, 
		behavior: 'smooth'
	});
	//Set window scroll on click if needed as you might need
	//to scroll to reach channels
	playSound(index);
}
function playSound(index){
	audioPlayer.setAttribute("src",channels[index].soundUrl); //Sett source to audio url, load it and then play it when ready
	audioPlayer.load();
    audioPlayer.play();
}