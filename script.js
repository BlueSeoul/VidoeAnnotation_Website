let player;
let form = document.getElementById('form');
let videoID;
const myCanvas = document.getElementById('annotation-canvas');
const myCTX = myCanvas.getContext("2d");
let click1 = true;
let pos1;
let pos2;
var w = window.innerWidth;
let antUpload = document.getElementById('upload');	
let outputBx = document.getElementById('testbox');
let prevtime;
let selected = false;
var newAnts = 0;
let submitButten = document.getElementById("SubmitAnnotation");
var titleBox = document.getElementById("Title");
var contentBox = document.getElementById("Content");
var decColinArray = [];
var currentStime;
var currentEtime;
let editAnnotation = false;
var selection = { start:0, end:0 };
var clickDebug;
var noAnnotation;
let firstcliked;
var titleArray = [];
var submitListener;
var editListener;
var cancelListener;
var closeListener;
var canvasListener;
var submitPasses;
let cancelButton = document.getElementById("cancel_Annoation");
//const vidSegment = {startPos: 0, endPos: selection.end, title: "", content: ""};
let segments = [];
let startup = false;
let showAnnotaion = false;
let stopRefresh = false;
let isRefreshed = false;
let currentVidSeg;
let runs;
let cancelruns;
var hideTimeline = false;
var increaseStartTimeButton = document.getElementById("start_add");
var decreaseStartTimeButton = document.getElementById("start_subtract");
var incraseEndTimeButton = document.getElementById("end_add");
var decreaseEndTimeButton = document.getElementById("end_subtract");
var startTimeTextarea = document.getElementById("Stime");
var endTimeTextarea = document.getElementById("Etime");
var sliderRange = document.getElementById("Youtube-player-progress");
var timeLineElements = [];
var labeStart = document.getElementById("sText");
var labelEnd = document.getElementById("eText");
let startupVid;
var phonesize;

//Click handers for the button inputs
const subHandler = function() { 
	submit_annotation();
};

const edtHandler = function() {
	edit_annotation();
};

const cancelHandler = function()  {
	cancel_Annoation();
};

//A function that draws a single line, used exclusivly in the DrawSegments function
function drawLine(context, length, start) {
	context.beginPath();
	context.lineWidth = 20;
	context.strokeStyle = "red";
	context.moveTo(start, 10);
	context.lineTo(length, 10);
	context.stroke();
	
  }

function drawSelectLine(context, length, start) {
	context.beginPath();
	context.lineWidth = 20;
	context.strokeStyle = "green";
	context.moveTo(start, 10);
	context.lineTo(length, 10);
	context.stroke();
	
  }

//Reads input form the blue timeline, this is where the user selects the portion of the video they want to annoatate.
myCanvas.addEventListener('click',(event) => {
	const rect = myCanvas.getBoundingClientRect();
	const x = event.clientX - rect.left;
	clickDebug = 0;
	let highlightX = Math.round((100/rect.width)*x)
	
	//checks if the selected area already has an annotation.
	if (segments.length >= 1)
	{
		for(let i = 0; i < segments.length; i = i + 1)
		{

			if(highlightX > segments[i].startPos && highlightX < segments[i].endPos)
			{
				editAnnotation = true;
				noAnnotation = false;
				selection = { start: segments[i].startPos, end: segments[i].endPos};
				editSegment(segments[i]);
				createEdtListeners();
				break;
			}
			else {
				
				console.log("Clicked outside of the editor, click close to select another annotation.");
			}

		}
	}
	//When this is a place that has no annotaions it creates a new one.
	if(selected == false && editAnnotation == false)
	{
		noAnnotation = true;
		//The first click is visible for the user to select another area.
		if (click1) {
			pos1 = highlightX
			drawLine(myCTX, pos1 + 1, pos1);
			selection = { start: pos1, end: (pos1 + 1)};
			click1 = false;
		
		}
		//the second click selects the portion of the video to be annotated.
		else {
			
			drawLine(myCTX, highlightX, pos1);
			click1 = true;
			var Stime;
			var Etime;
			if (pos1 > highlightX) {
				document.getElementById('Youtube-player-progress').value = highlightX
				Stime = highlightX
				Etime = pos1
				youTubePlayerCurrentTimeChange((highlightX/100) * player.getDuration()); //sets the video pllayer to start at the current section.
				
			
			}
			else {
				document.getElementById('Youtube-player-progress').value = pos1
				Stime = pos1
				Etime = highlightX
				youTubePlayerCurrentTimeChange((pos1/100) * player.getDuration());
			}
			selection = { start: Stime, end: Etime};
			makeVidSegment(Stime, Etime); // elimated event listeners after use, I have noticed some duplicates appear when in "edit" mode but they dissapear when cancel is clicked

			currentStime = Math.round(timeConvert((Stime/100) * player.getDuration(), "Stime"));//creates the displayed times when the user edits the annotation.
			currentEtime = Math.round(timeConvert((Etime/100) * player.getDuration(), "Etime"));
			selected = true;
			myCanvas.removeEventListener('click',(this));
			canvasListener = false;
			
		}
	}

	
})
//Uploads a file.
antUpload.addEventListener('change',()=>{
	
	startup = false;
	let fr = new FileReader();
	fr.readAsArrayBuffer(antUpload.files[0]);
	console.log(antUpload.files[0]);
	fr.onload = function(){
		console.log(antUpload.files[0].name.lastIndexOf("."));
		if(antUpload.files[0].name.substr(antUpload.files[0].name.lastIndexOf("."), antUpload.files[0].name.length) == ".xlsb")
		{
			var wb = XLSX.read(fr.result, { type: 'array' });
			var ws = wb.Sheets[wb.SheetNames[0]];
            var data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            console.log(data);
			parseJsonIntoSegments(data);
			drawSegments(false);
			startup = true;
		}
		if(antUpload.files[0].name.substr(antUpload.files[0].name.lastIndexOf("."), antUpload.files[0].name.length) == ".csv")
		{
			var wb = XLSX.read(fr.result, { type: 'array', raw:true });
			var ws = wb.Sheets[wb.SheetNames[0]];
            var data = XLSX.utils.sheet_to_json(ws, { header: 1});
            console.log(data);
			parseJsonIntoSegments(data);
			drawSegments(false);
			startup = true;
		}
		else if(antUpload.files[0].name.substr(antUpload.files[0].name.lastIndexOf("."), antUpload.files[0].name.length) == ".txt")
		{
			var wb = XLSX.read(fr.result, { type: 'array', raw:true });
			var ws = wb.Sheets[wb.SheetNames[0]];
            var data = XLSX.utils.sheet_to_json(ws, { header: 1, cellText: false });
            console.log(data);
			parseJsonIntoSegments(data);
			drawSegments(false);
			startup = true;
		}
		else{
			alert("Unknown file format, try another one.");
		}
	}
	
})



//Sets up the annotation window to create a new annotation.
function makeVidSegment(start, endP) {
	
	displayAnnotationEditingControls();
	submitButten.innerHTML = "Make Annotation";
	cancelButton.innerHTML = "Cancel";
	titleBox.value = "";
	contentBox.value = "";

	createVideoListeners();

	}

function createVideoListeners()
{
	submitButten.addEventListener('click', subHandler);
	cancelButton.addEventListener('click', cancelHandler);
}

function createEdtListeners()
{
	submitButten.addEventListener('click', edtHandler);
	cancelButton.addEventListener('click', cancelHandler);
}

function removeVideoListeners()
{

	submitButten.removeEventListener('click', subHandler);
	cancelButton.removeEventListener('click', cancelHandler);
	submitButten.removeEventListener('click', edtHandler);
}

function parseJsonIntoSegments(data)
{
	console.log("Parsing data: " + data);
	//checks if the file matches the formate to read annotations
/*	if (parseInt(data[1][3].split(":")[1]).isNaN)
	{
		alert("check to see if there is a time value on columns D and E starting from the second row.");
		return;
	}*/
	//clears current segment array just in case there are mic values.
	segments = [];
	
	let count = 0;
	let passTop = false;
	//loops through the data and adds data to the segment array
	for (let x of data)
	{
		console.log("X:" + x);
		console.log("Index pos: " + x[0]);
		console.log("Title: " + x[1]);
		console.log("Content: " + x[2]);
		console.log("Start pos: " + x[3]);
		console.log("End pos: " + x[4]);
		if (x == "")
		{
			console.log("empty line, end of input.");
			break;
		}
		//Skips the top row of the spreadsheet file.
		if (passTop)
		{
			//skips the video link at the bottom of the file.
			if(x[0] == "Video ID")
			{
				changeVideo(YouTubeGetID(x[1]));
				return;
			}
			
			let sPos;
			let ePos;
			let timeUnits = [];
			timeUnits = x[3].split(":"); //splits the mintues, seconds or even hours into an array that will be converted into a percentage. 
			if (timeUnits.length > 2) // enters the hours, minutes, and seconds values.
			{
				sPos = convertTimeToPercentage(parseInt(timeUnits[0]), parseInt(timeUnits[1]), parseInt(timeUnits[2]));
				//stops program if the value is bigger than 100%
				if (sPos> 100) {
					alert("invalid start time value for this video.");
					return;
				}
			}
			else {
				sPos = convertTimeToPercentage(0, parseInt(timeUnits[0]), parseInt(timeUnits[1]));
				if (sPos> 100) {
					alert("invalid start time value for this video.");
					return;
				}
			}
			timeUnits = x[4].split(":");
			if (timeUnits.length > 2) // enters the hours, minutes, and seconds values.
			{
				ePos = convertTimeToPercentage(parseInt(timeUnits[0]), parseInt(timeUnits[1]), parseInt(timeUnits[2]));
				if (ePos > 100) {
					alert("invalid start time value for this video.");
					return;
				}
			}
			else {
				ePos = convertTimeToPercentage(0, parseInt(timeUnits[0]), parseInt(timeUnits[1]));
				if (ePos > 100) {
					alert("invalid start time value for this video.");
					return;
				}
			}
			const vidSegment = {
				startPos: sPos,
				endPos: ePos,
				title: x[1],
				content:  x[2]
			}
			segments.push(vidSegment);
			count += 1;
		}
		else{
			passTop = true;
			continue;
		}
	}
}
//Converts percentages back into time objects.
function intoTime(timeval)
{
	console.log("percetnage: " + timeval);
	const totalSec = player.getDuration();
	timeval = (timeval/100) * totalSec;
	var minutes = Math.floor(timeval / 60);
	var seconds = timeval % 60;
	var hours = 0;
	
	if (timeval >= 3600)
	{
		hours = Math.floor(timeval / 3600);
	}

	console.log("converted: " + timeval + " into: " + hours + ":" + minutes + ":" + seconds);
	if (String(seconds.toFixed()).length > 1) {
		seconds = Math.round(seconds);
		}
	else{
		seconds = "0" + Math.round(seconds);
	}
	
	if (String(minutes.toFixed()).length > 1) {
		minutes = Math.round(minutes);
		}
	else{
		minutes = "0" + Math.round(minutes);
	}
	
	if (String(hours.toFixed()).length > 1) {
		hours = Math.round(hours);
		}
	else{
		hours = "0" + Math.round(hours);
	}
	//checking to see if the hour value is worth enough to return.
	if(hours > 0)
	{
		return hours + ":" + minutes + ":" + seconds;
	}
	else
	{
		return minutes + ":" + seconds;
	}
}
//Sets up the annotation window to edit.
function editSegment(videoSegment)
{
	//createEdtListeners();

	selected = true;
	cancelButton.innerHTML = "Close";
	submitButten.innerHTML = "Edit Annotation"
	currentStime = timeConvert((videoSegment.startPos/100) * player.getDuration(), "Stime");
	currentEtime = timeConvert((videoSegment.endPos/100) * player.getDuration(), "Etime");
	selection.start = videoSegment.startPos;
	selection.end = videoSegment.endPos;
	titleBox.value = videoSegment.title;
	contentBox.value = videoSegment.content;
	drawSelectLine(myCTX,videoSegment.endPos, videoSegment.startPos);
	displayAnnotationEditingControls();

	currentVidSeg = videoSegment;




}
//Both cancels and closes annotations. 
function cancel_Annoation()
{
	cancelListener = true;
	selected = false;
	if(showAnnotaion == false)
	{
		removeCreatedAnnoation();
	}
	else
	{
		displayCreatedAnnotation(currentVidSeg.title, currentVidSeg.content);
	}
	if(editAnnotation)
	{
		editAnnotation = false;
		console.log("ATTN ed");
	}
	removeAnnotationEditingControls();

	drawSegments(noAnnotation);
	removeVideoListeners();
}

function submit_annotation()
{
	submitListener = true;
	clickDebug = clickDebug + 1;

	firstcliked = noAnnotation;
	if(firstcliked)
	{
	//creates the viSegment object which will be stored in the segments array.
	const vidSegment = {
		startPos: selection.start,
		endPos: selection.end,
		title: titleBox.value,
		content: contentBox.value

	};
	segments.push(vidSegment);
	noAnnotation = false;
	submitButten.innerHTML = "Edit Annotation";
}
	else{
		
		segments[segments.length - 1].title = titleBox.value;
		segments[segments.length - 1].content = contentBox.value;
		return;
	}


}

function edit_annotation()
{
	editListener = true;
	currentVidSeg.title = titleBox.value,
	currentVidSeg.content = contentBox.value
	currentVidSeg.startPos = selection.start;
	currentVidSeg.endPos = selection.end;
	console.log("Annotaiton edit button was selected");
	drawSelectLine(myCTX,currentVidSeg.endPos, currentVidSeg.startPos);
	youTubePlayerCurrentTimeChange((currentVidSeg.startPos/100) * player.getDuration());
	selected = false;
}
//Allows the user to save thier annotation into a local file in Excel, CSV, or a raw text file..

function testFunction(text)
{
	console.log("This is a function with the value: " + text + " passed through!");
	runs = false;
	if(segments.length < 1)
	{
		alert("No annoations to save!");
		return;
	}
	
	console.log("new Output: " + segments[0].content);
	console.log("player.Videoid: " + startupVid + " VideoID: " + videoID);
	let keyList = iteratedArray(segments);
	if(videoID == undefined)
	{
		videoID = startupVid;
	}
	
	let data_String = JSON.stringify(keyList);
	var wb = XLSX.utils.book_new();
	var ws = XLSX.utils.aoa_to_sheet([["Key","Title","Content","Start time", "End time"],[keyList[0][0],keyList[0][1].title ,keyList[0][1].content,intoTime(keyList[0][1].startPos), intoTime(keyList[0][1].endPos)]]);
	XLSX.utils.book_append_sheet(wb, ws, "SheetJS");
	/* add rows from the array with the add function. */
	for (let x of keyList)
	{
		console.log("Current index: " + x[0]);
		if (x[0] > 0)
		{
			console.log("Adding to worksheet: " + x[1].title);
			XLSX.utils.sheet_add_aoa(ws, [[x[0],x[1].title ,x[1].content,intoTime(x[1].startPos), intoTime(x[1].endPos)]], {origin: -1});
		}
	}
	// Add video URL to the bottom of the sheet/data
	let fullURL = ("Video ID, https://www.youtube.com/watch?v=" + videoID);
	data_String.concat(fullURL);
	XLSX.utils.sheet_add_aoa(ws, [fullURL.split(",")], {origin: -1});
	/* Trigger Download with `writeFile` */
	if(text == "xlsx"){
		XLSX.writeFile(wb, segments[0].title +".xlsb", {compression:true});
		runs = true;
	}
	if(text == "csv"){
		XLSX.writeFile(wb, segments[0].title +".csv", {bookType:"csv", FS:","});
		runs = true;
	}
		
	if(text == "server")
	{
		alert("Not available yet; coming soon");
	}

	else if (runs == false)
	{
		console.log("What happened here?");
	}
}

function removeEventListenerFromButton() {
		const button = document.getElementById('yourButtonId');
		button.removeEventListener('click', yourFunction);
  }

function displayCreatedAnnotation(title, content)
{
	titleBox.style.visibility = "visible";
	contentBox.style.visibility = "visible";
	titleBox.style.border = "5px solid #000000";
	titleBox.style.backgroundColor = "#E0FFFF";
	titleBox.style.borderRadius = "5px";
	contentBox.style.border = "5px solid #000000";
	contentBox.style.backgroundColor = "#E0FFFF";
	contentBox.style.borderRadius = "5px";
	contentBox.style.resize = "none";
	$('contentBox').autoResize();
	titleBox.readOnly = true;
	contentBox.readOnly = true;

	titleBox.value = title;
	contentBox.value = content;
}

function displayAnnotationEditingControls()
{
	titleBox.readOnly = false;
	contentBox.readOnly = false;
	titleBox.style.visibility = "visible";
	contentBox.style.visibility = "visible";
	submitButten.style.visibility = "visible";
	titleBox.style.border = "2px #D3D3D3";
	titleBox.style.backgroundColor = "#DCDCDC";
	contentBox.style.border = "2px #D3D3D3";
	contentBox.style.backgroundColor = "#DCDCDC";
	contentBox.style.resize = "vertical";
	document.getElementById("cancel_Annoation").style.visibility = "visible";
	document.getElementById("annotation_time_marks").style.visibility = "visible";
	document.getElementById("upload").style.visibility = "hidden";
	document.getElementById("uploadcover").style.visibility = 'hidden';
}

function removeAnnotationEditingControls()
{
	submitButten.style.visibility = "hidden";
	document.getElementById("cancel_Annoation").style.visibility = "hidden";
	document.getElementById("annotation_time_marks").style.visibility = "hidden";
	document.getElementById("upload").style.visibility = "visible";
	document.getElementById("uploadcover").style.visibility = 'visible';
}
function removeCreatedAnnoation()
{
	titleBox.style.visibility = "hidden";
	contentBox.style.visibility = "hidden";
	titleBox.value = "";
	contentBox.value = "";
	contentBox.style.resize = "none";
}
	
increaseStartTimeButton.addEventListener('click',(event) => {
	var initial_value = document.getElementById("Stime").value;
	var hours = 0;
	var seconds = 0;
	var mintues = 0;
	var timeText = initial_value.split(":");
	//let currentSegment = null;
	if (timeText.length > 2)
	{
		hours = parseFloat(timeText[0]);
		mintues = parseFloat(timeText[1]);
		seconds = parseFloat(timeText[2]);
	}
	else {
		mintues = parseFloat(timeText[0]);
		seconds = parseFloat(timeText[1]);
	}



	
	if(mintues >= 59 && seconds >= 59)
	{
		seconds = 0;
		mintues = 0;
		hours = hours + 1;
	}

	if (seconds >= 59)
	{
		seconds = 0;
		mintues = mintues + 1;
	}
	else
	{
		seconds = seconds + 1;
	}
	
	if(seconds < 10)
	{
		document.getElementById("Stime").value = mintues + ":0" + seconds;
	}
	else
	{
		document.getElementById("Stime").value = mintues + ":" + seconds;
	}
	let newPos = convertTimeToPercentage(hours, mintues, seconds);
	let endTime = currentStime.split(":");
	if (endTime.length > 2)
	{
		hours = parseFloat(endTime[0]);
		mintues = parseFloat(endTime[1]);
		seconds = parseFloat(endTime[2]);
	}
	else {
		mintues = parseFloat(endTime[0]);
		seconds = parseFloat(endTime[1]);
	}
	/*currentSegment = findSegement(selection.start, false);

	if(currentSegment != null)
	{
		currentSegment.startPos = newPos;
	}

	*/
    selection.start = newPos;
	console.log("Start point: " + selection.start);
	drawSegments(false);
	currentStime = hours + ":" + mintues + ":" + seconds;
	})
	
function iteratedArray(inputArray)
{
	let outputArray = [];
	let key = inputArray.entries();
	for (let x of key)
	{
		outputArray.push(x);
	}
	return outputArray;
}
//the function that draws all the users annotations on the timeline.
function drawSegments(isCancel)
{
	myCTX.clearRect(0, 0, myCanvas.width, myCanvas.height);
	if (segments.length < 1 && isCancel == false)
    {
		(myCTX, selection.end , selection.start);
    }
    else {
		if(isCancel == false)
		{
			drawLine(myCTX, selection.end , selection.start);
		}
		//to make the lines fit over the range counter better.
		let borderSum = 0.5;
		
		for(let i =0; i < segments.length; i = i + 1)
        {
			if(segments[i].endPos > 98 || segments[i].startPos < 2)
			{
				borderSum = 0;
			}

            drawLine(myCTX, segments[i].endPos + borderSum, segments[i].startPos + borderSum);
        }
    }



}
// used to find the current segment data in the array.
function findSegement(location, isEnd)
{
	for(let i =0; i < segments.length; i = i +1)
	{
		if(isEnd)
		{
			if(Math.abs(segments[i].endPos - location) < 1)
			{
				return segments[i];
			}
			else
			{
				return null;
			}
		}
		else
		{
			if(Math.abs(segments[i].startPos - location) < 1)
			{
				return segments[i];
			}
			else
			{
				return null;
			}
		}

	}
}

//calls from the arrow buttons under the video.
function seekSegment(isForward)
{
	drawSegments(false);
	//if there is a video selected and it's not new.
	if(selected && noAnnotation == false)
	{
		let newIndex = segments.indexOf(currentVidSeg);
		if(isForward)
		{
			if(segments.length == (newIndex + 1))
			{
				console.log("No more annotations.");
				return;
			}
			else
			{
				//the event listeners should be all set if it's already been selected.
				editSegment(segments[newIndex + 1]);
				youTubePlayerCurrentTimeChange((segments[newIndex + 1].startPos/100) * player.getDuration());
			}
		}
		else
		{
			if(0 == (newIndex - 1))
			{
				console.log("No more annotations.");
				return;
			}
			else
			{
				//the event listeners should be all set if it's already been selected.
				editSegment(segments[newIndex - 1]);
				youTubePlayerCurrentTimeChange((segments[newIndex - 1].startPos/100) * player.getDuration());
			}
		}
	}
	// if there is no video selected, thus no event listeners set up.
	else
	{
		let currentVal = convertTimeToPercentage(0,0,player.getCurrentTime());
		let closeestSegs = nearestSegments(currentVal);
		if(isForward)
		{
			if(closeestSegs[0] != null)
			{
				editSegment(segments[closeestSegs[0]]);
				createEdtListeners();
				youTubePlayerCurrentTimeChange((segments[closeestSegs[0]].startPos/100) * player.getDuration());
			}
			else{
				alert("No segments to select.");
			}
		
		}
		else
		{
			if(closeestSegs[1] != null)
			{
				editSegment(segments[closeestSegs[1]]);
				createEdtListeners();
				youTubePlayerCurrentTimeChange((segments[closeestSegs[1]].startPos/100) * player.getDuration());
			}
			else{
				alert("No segments to select.");
			}
		}
	}
}
//Allows the user to make the timline div lower so they can see more of the screen TODO: if the page loads at a certain screen size it should be on by default.
function hideTimelineElements()
{
	if(hideTimeline)
	{
		const list = document.getElementById("annotation_time_marks").children[0];
		document.getElementById("hideTimeline").style.backgroundColor = "DodgerBlue";
		document.getElementById("hideTimeline").innerHTML = "Shorten Timeline";
		console.log("global variable: " + increaseStartTimeButton + " vs. array variable: " + timeLineElements[1]);
		list.appendChild(document.createElement("BUTTON").appendChild(increaseStartTimeButton));
		list.appendChild(document.createElement("TEXTAREA").appendChild(startTimeTextarea));
		list.appendChild(document.createElement("BUTTON").appendChild(decreaseStartTimeButton));
		list.appendChild(document.createElement("BUTTON").appendChild(incraseEndTimeButton));
		list.appendChild(document.createElement("TEXTAREA").appendChild(endTimeTextarea));
		list.appendChild(document.createElement("BUTTON").appendChild(decreaseEndTimeButton));
		
		document.getElementById("anno").style.height = "70vh";
		
		sliderRange.style.visibility = "visible";
		document.getElementsByClassName("timeline")[0].style.height = "10vmax";
		timeLineElements = [];
		hideTimeline = false;
	}
	else{
		document.getElementById("hideTimeline").style.backgroundColor = "#FE0303";
		document.getElementById("hideTimeline").innerHTML = "Display Timeline";
		timeLineElements = [increaseStartTimeButton, startTimeTextarea, decreaseStartTimeButton, incraseEndTimeButton, endTimeTextarea, decreaseEndTimeButton];
		increaseStartTimeButton.remove();
		decreaseStartTimeButton.remove();
 		incraseEndTimeButton.remove();
 		decreaseEndTimeButton.remove();
 		startTimeTextarea.remove();
		endTimeTextarea.remove();
		console.log(document.getElementsByClassName("timeline"));
		document.getElementsByClassName("timeline")[0].style.height = "5vmax"
		document.getElementById("anno").style.height = "75vh";
		sliderRange.style.visibility = "hidden";


		hideTimeline = true;
	}
}


//returns a small array that returns the indexs of the segments in front of or behind the current time, array element is null if there is no segment.
function nearestSegments(value)
{
	let differences = [0,0];
	let searchNearestSPT = true;
	let searchNearestEPT = true;

	for (let x = 0; x < segments.length; x++)
	{
		console.log("current pos: " + x + "formula result: " + (segments[x].startPos - value));
		if ((segments[x].startPos - value) > 0 && searchNearestSPT)
		{
			differences[0] = x;
			searchNearestSPT = false;
		}
		console.log("current pos: " + x + "formula result: " + (value - segments[(segments.length - 1) - x].endPos));
		if((value - segments[(segments.length - 1) - x].endPos) > 0 && searchNearestEPT)
		{
			console.log("endPos value: "+ segments[(segments.length - 1) - x].endPos);

			console.log("array pos: "+ parseInt((segments.length - 1) - x));
			if(((segments.length - 1) - x) >= 0)
			{
				differences[1] = parseInt((segments.length - 1) - x);
				searchNearestEPT = false;
			}
		}
	}
	if(searchNearestSPT)
	{
		differences[0] =  null;
	}
	
	if(searchNearestEPT)
	{
		differences[1] = null;
	}
	return differences;
}

decreaseStartTimeButton.addEventListener('click',(event) => {
	var initial_value = document.getElementById("Stime").value;
	var hours = 0;
	var seconds = 0;
	var mintues = 0;
	var timeText = initial_value.split(":");
	if (timeText.length > 2)
	{
		hours = parseFloat(timeText[0]);
		mintues = parseFloat(timeText[1]);
		seconds = parseFloat(timeText[2]);
	}
	else {
		mintues = parseFloat(timeText[0]);
		seconds = parseFloat(timeText[1]);
	}
	if (seconds <= 0) {
		seconds = 59;
		mintues = mintues - 1;
	} else {
		seconds = seconds - 1;
	}

	if (seconds < 10) {
		document.getElementById("Stime").value = mintues + ":0" + seconds;
	} else {
		document.getElementById("Stime").value = mintues + ":" + seconds;
	}
	let newPos = convertTimeToPercentage(hours, mintues, seconds);
	let endTime = currentStime.split(":");
	if (endTime.length > 2)
	{
		hours = parseFloat(endTime[0]);
		mintues = parseFloat(endTime[1]);
		seconds = parseFloat(endTime[2]);
	}
	else {
		mintues = parseFloat(endTime[0]);
		seconds = parseFloat(endTime[1]);
	}
/*	let ePos = convertTimeToPercentage(hours, mintues, seconds);
	
	currentSegment = findSegement(selection.start, false);
	if(currentSegment != null)
	{
		currentSegment.startPos = newPos;
	}*/
	selection.start = newPos;
    drawSegments(false);
    currentStime = hours + ":" + mintues + ":" + seconds;
	})

incraseEndTimeButton.addEventListener('click',(event) => {
	var initial_value = document.getElementById("Etime").value;
	var hours = 0;
	var seconds = 0;
	var mintues = 0;
	var timeText = initial_value.split(":");
	if (timeText.length > 2)
	{
		hours = parseFloat(timeText[0]);
		mintues = parseFloat(timeText[1]);
		seconds = parseFloat(timeText[2]);
	}
	else {
		mintues = parseFloat(timeText[0]);
		seconds = parseFloat(timeText[1]);
	}

	if (seconds >= 59) {
		seconds = 0;
		mintues = mintues + 1;
	} else {
		seconds = seconds + 1;
	}

	if (seconds < 10) {
		document.getElementById("Etime").value = mintues + ":0" + seconds;
	} else {
		document.getElementById("Etime").value = mintues + ":" + seconds;
	}
	let newPos = convertTimeToPercentage(hours, mintues, seconds);
/*	currentSegment = findSegement(selection.end, true);
	console.log("End from this: " + currentSegment.endPos);
	if(currentSegment != null)
	{
		currentSegment.endPos = newPos;
	}
*/
    selection.end = newPos;
    drawSegments(false);
	currentEtime = hours + ":" + mintues + ":" + seconds;


	})
	
decreaseEndTimeButton.addEventListener('click',(event) => {
	var initial_value = document.getElementById("Etime").value;
	var hours = 0;
	var seconds = 0;
	var mintues = 0;
	var timeText = initial_value.split(":");
	if (timeText.length > 2)
	{
		hours = parseFloat(timeText[0]);
		mintues = parseFloat(timeText[1]);
		seconds = parseFloat(timeText[2]);
	}
	else {
		mintues = parseFloat(timeText[0]);
		seconds = parseFloat(timeText[1]);
	}
	if (seconds <= 0) {
		seconds = 59;
		mintues = mintues - 1;
	} else {
		seconds = seconds - 1;
	}

	if (seconds < 10) {
		document.getElementById("Etime").value = mintues + ":0" + seconds;
		
	} else {
		document.getElementById("Etime").value = mintues + ":" + seconds;
	}
	let newPos = convertTimeToPercentage(hours, mintues, seconds);
/*	currentSegment = findSegement(selection.end, true);
	if(currentSegment != null)
	{
		currentSegment.endPos = newPos;
	}*/
	selection.end = newPos;
	
	drawSegments(false);
	currentEtime = hours + ":" + mintues + ":" + seconds;
	})



function convertTimeToPercentage(hours, minutes, seconds) {
    // Calculate the total duration in seconds
    const totalSeconds = player.getDuration();

    // Assuming the video duration is 100%,
    // calculate the percentage completion based on the current time
    const currentTimeInSeconds = hours * 3600 + minutes * 60 + seconds;/* Get the current time of the video in seconds */;

    const percentage = (currentTimeInSeconds / totalSeconds) * 100;

    // Ensure the percentage is within the valid range [0, 100]
    const clampedPercentage = Math.min(100, Math.max(0, percentage));

    return clampedPercentage;
}

//converts getduration() into hours, minutes, and seconds.
function timeConvert(timeval, Ename)
{
	var minutes = Math.floor(timeval / 60);
	var seconds = timeval % 60;
	var hours = 0;
	if (timeval >= 3600)
	{
		hours = Math.floor(timeval / 3600);
	}
	console.log("converted: " + timeval + " into: " + hours + ":" + minutes + ":" + seconds);
	if (String(seconds.toFixed()).length > 1) {
		seconds = Math.round(seconds);
		}
	else{
		seconds = "0" + Math.round(seconds);
	}
	
	if (String(minutes.toFixed()).length > 1) {
		minutes = Math.round(minutes);
		}
	else{
		minutes = "0" + Math.round(minutes);
	}
	
	if (String(hours.toFixed()).length > 1) {
		hours = Math.round(hours);
		}
	else{
		hours = "0" + Math.round(hours);
	}
	console.log("Time converted:" + hours + ":" + minutes + ":" + seconds);
	if(hours > 0)
	{
		if(hideTimeline == false)
		{
			document.getElementById(Ename).innerHTML = hours + ":" + minutes + ":" + seconds;
		}
		return hours + ":" + minutes + ":" + seconds;
		
	}
	else
	{
		if(hideTimeline == false)
		{
			document.getElementById(Ename).innerHTML = minutes + ":" + seconds;
		}
		return minutes + ":" + seconds;
		
	}

	
}




//Allows the users to type input for both the begining and end of the annotation segment.

function setByType(newTime, isEnd) {
	var maxMinutes = Math.floor(player.getDuration()/60);
	var maxSec = Math.floor(player.getDuration() % 60);
	var maxHour = Math.floor(player.getDuration()/3600);
	var newTimeMin;
	var newTimeSec;
	var newTimeHour;
	let isHour = false;
	let isMin = true;
	let searched = false;
	//search for letters, symbols and other non numerial characters, remove thems, exceptions: colons: ":" and decimals: "."
	oldTime = newTime;
	newTime = removeNonNumber(newTime.slice(0,12));
	
	if (maxSec <= 0) {
		console.log("time is too short");//Todo, create Alert boxes instead and reset
		return;
	}
	
	if (maxHour >= 1) {
		console.log("video is at least an hour long");
		isHour = true;
	}
	
	if (maxMinutes < 1) {
		console.log("the video is less than a minute");
		isMin = false;
	}
	//checks how many colons or decimals are in the user's input if there are too many. Determines appropreate time value from that input.
	if (decColinArray.length > 2 && searched == false)
	{
		//check spaces between numbers, see if you can catch and remove superfolus characters.
		let removeArray = [];
		let colonCount = 0;
		let decimalCount = 0;
		for (let i = 0; i < decColinArray.length; i = i + 1) {
			let commIndex = decColinArray[i].indexOf(",");
			let characterPlace = decColinArray[i].slice(commIndex + 1,decColinArray[i].length);
			let character = decColinArray[i].slice(0,commIndex);
			

			if (character == ":")
			{
				colonCount = colonCount + 1;
				if (colonCount > 2 && isHour || colonCount > 1 && isHour == false)
				{
					removeArray[colonCount - 1] = parseInt(characterPlace);
					newTime = newTime.slice(0, parseInt(characterPlace)).concat(newTime.slice(parseInt(characterPlace)+1,newTime.length));
					newTimeSec = newTime.slice(newTime.lastIndexOf(":") + 1, newTime.length);
					
					
				}
				else
				{
					newTimeMin = newTime.slice(0, parseInt(characterPlace));
					newTimeSec = newTime.slice(parseInt(characterPlace) + 1, newTime.length);
				}
			}
		
			if (character == ".")
			{
				decimalCount = decimalCount + 1;
				if (decimalCount > 1)
				{
					removeArray[decimalCount - 1] = parseInt(characterPlace);
					newTime = newTime.slice(0, parseInt(characterPlace)).concat(newTime.slice(parseInt(characterPlace)+1,newTime.length));
					newTimeSec = Math.round(parseFloat(newTimeSec) + colonSpot);
					
					
				}
				else
				{
					colonSpot = parseFloat(newTime.slice(characterPlace, newTime.length));
					newTimeSec = Math.round(parseFloat(newTimeSec));
					
					if (newTimeSec < 1)
					{
						newTimeSec = newTimeSec + 1;
					}
					foundfirstDecimal = true;
				}
			}
			if (colonCount > 5 || decimalCount > 5)
			{
				//TODO make an erroro message when input is absurdly hard to read
				console.log("too many decimals or colons!");
			}
		}
		
//Checks the current time
		console.log("time is now: " + newTime);
		searched = true;

	}
	//if the was no colons or decimals in the user's input, this assigns values in h:mm:ss as most videos are not more than 10 hours long.
	if(decColinArray.length == 0 && searched == false)
	{
		newTimeSec = newTime.substr(-2);
		newTime = newTime.concat(":",newTimeSec);
		newTimeMin = newTime.slice(0, newTime.lastIndexOf(":"));
		if (newTimeMin.length > 3 && isHour)
		{
			newTimeHour = newTime.slice(0,2);
		} 
		else if(newTimeMin.length > 2)
		{
			newTimeHour = newTime.slice(0,1);
		}
		else
		{
			newTimeHour = 0;
		}
		searched = true;

	}
	//If the user's input conatined 2 or less colons or decimals but more than 1, this section checks if they decimals or colons and which numbers are minutes, seconds, or hours.
	else if (searched == false)
	{
		let colonSpot;
		let commIndex;
		let characterPlace;
		let character;
		let foundfirstColin = false; //the first colon is
		let foundfirstDecimal = false;
		for (let i = 0; i < (decColinArray.length); i = i + 1) {

			commIndex = decColinArray[i].indexOf(",");
			characterPlace = decColinArray[i].slice(commIndex + 1,decColinArray[i].length);
			character = decColinArray[i].slice(0,commIndex);
			if (character == ":")
			{
				if (isHour) // boolean gets the hour value TODO, check the user's hour value. 
				{
					newTimeHour = newTime.slice(0,characterPlace);
					isHour = false;
				}
				if(foundfirstColin)
				{
	
					newTime = newTime.slice(0, parseInt(characterPlace)).concat(newTime.slice(parseInt(characterPlace)+1,newTime.length));
					newTimeSec = newTime.slice(newTime.lastIndexOf(":") + 1, newTime.length);

				}
				else
				{
				newTimeMin = newTime.slice(0, parseInt(characterPlace));
				newTimeSec = newTime.slice(parseInt(characterPlace) + 1, newTime.length);
				foundfirstColin = true;

				} 
			}
			if (character == ".")
			{
				if(foundfirstDecimal)
				{
					newTime = newTime.slice(0, parseInt(characterPlace)).concat(newTime.slice(parseInt(characterPlace)+1,newTime.length));

				}
				else{
					colonSpot = parseFloat(newTime.slice(characterPlace, newTime.length));
					newTimeSec = Math.round(parseFloat(newTimeSec) + colonSpot);
					if (newTimeSec < 1)
					{
						newTimeSec = newTimeSec + 1;
					}
					foundfirstDecimal = true;
			}
				}
				
				

		}
		searched = true;
		
	}
	


	if (newTimeMin > maxMinutes)
	{
		console.log("massive Number: " + newTimeMin);
		console.log("please retype");
		setByType(newTime, isEnd);
		return;

	}
			
		
	else {
		newTimeHour = newTime.substr(0, searchString(newTime.slice(0,2), ":")[0]);
	}
	if (newTimeSec.length > 2)
	{
		newTimeSec = newTimeSec.slice(0,2);
	}
	if (newTimeMin.length > 2)
	{
		newTimeMin = newTimeMin.slice(0,2);
	}
	if(newTimeMin.length < 2)
	{
		newTimeMin = "0" + newTimeMin;
	}
	if(newTimeSec.length < 2)
	{
		newTimeSec = "0" + newTimeSec;
	}
	if(newTimeHour.length < 2)
	{
		newTimeHour = "0" + newTimeHour;
	}
	if (isHour == false)
	{
		newTimeHour = "00";
	}
	let test = newTimeHour + ":" + newTimeMin + ":" + newTimeSec;

	if (isValidTime(test)) {
	  console.log("Valid time: " + test);
	} else {
	  console.log("Invalid time: " + test);
	}
	
	
	
	let newPos = convertTimeToPercentage(parseInt(newTimeHour),parseInt(newTimeMin),parseInt(newTimeSec));

	if (isEnd)
	{
		selection.end = newPos;
		if(isHour) 
		{
			document.getElementById("Etime").value = newTimeHour + ":" +newTimeMin + ":" + newTimeSec;
		}
		else {
			document.getElementById("Etime").value = newTimeMin + ":" + newTimeSec;
		}
	}
	else{
		selection.start = newPos;
		if(isHour) 
		{
			document.getElementById("Stime").value = newTimeHour + ":" +newTimeMin + ":" + newTimeSec;
			youTubePlayerCurrentTimeChange((convertTimeToPercentage(ParseInt(newTimeHour),ParseInt(newTimeMin),ParseInt(newTimeSec))/100) * player.getDuration());
		}
		else {
			document.getElementById("Stime").value = newTimeMin + ":" + newTimeSec;
			youTubePlayerCurrentTimeChange((convertTimeToPercentage(0,ParseInt(newTimeMin),ParseInt(newTimeSec))/100) * player.getDuration());
		}
	}
	drawSegments(false);
	decColinArray = [];//clears the array to allow a new user input
				
		
}

//checks if the input is a valid time.
function isValidTime(inputTime) {
  // Regular expression to match the format HH:mm
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

  // Check if the input matches the regular expression
  return timeRegex.test(inputTime);
}


//I know, there is already a built in function. This is something I learned after I made this function.
function searchString(string, character) {
	var charArray = [];
	let charCount = 0;
	for (let i = 0; i < string.length; i += 1) {
		if (string.charAt(i) == character) {
			charArray[charCount] = i;
			charCount += 1;
		}
	}
	return charArray;
	
}
//removes the user's input string in SetByType
function removeNonNumber(string) {
	var count = 0
	for (let i = 0; i < string.length; i += 1) {
		if (isNaN(string.charAt(i)) == true) {
			if (string.charAt(i) == "." ||string.charAt(i) == ":") {
				decColinArray.push(string.charAt(i) + "," + i);
				count += 1;
			}
			else
			{
				let backString = string.substr(i + 1, string.length);
				let frontString = string.substr(0, i);
				if (backString.length < 2){
					string = frontString.concat("0", backString);
				}
				else {
				string = frontString.concat(backString);
				}

			}
		}
		
	}
	
	return string;
}

function findClosestStar(array)
{
	let currentVal = convertTimeToPercentage(0,0,player.getCurrentTime());
	for(let x of array)
	{

		if (currentVal > x.startPos && currentVal < x.endPos)
		{
			if(showAnnotaion == false)
			{
				stopRefresh = true;
				isRefreshed = false;
			}
			return x;
			
		}


	}
	if(showAnnotaion)
	{
		isRefreshed = false;
		stopRefresh = true;
	}
	return null;
}

//Testing event listners..maybe the cavas could turn into a selection color.
myCanvas.addEventListener('mouseover',(cOver) => {
	console.log("over canvas");
	
})


form.addEventListener('submit',(e) => {
	e.preventDefault()

	let url = document.getElementById('url').value
	
	videoID = YouTubeGetID(url)
	
	changeVideo(videoID)
	})

function YouTubeGetID(url){
	var ID = "";
	url = url
	 .replace(/(>|<)/gi, "")
	 .split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/)
	 if (url[2] !== undefined) {
		 ID = url[2].split(/[^0-9a-z_\-]/i);
		 ID = ID[0];
	}
	 else {
		 ID =url;
	 }
	 return ID;
}

function changeVideo(videoID){
	
	player.cueVideoById({videoId:videoID})
	player.pauseVideo()
	
}

setInterval(followVideo, 1000);
//makes the slider follow the video.
function followVideo()
{	

	let containerClass = document.querySelector(".container");
	let dDownContainer = document.querySelector(".dropbtn");
	if (screen.width < 450)
	{
		console.log("Phone size: " + screen.width);
		phonesize = true;
		containerClass.style.gridTemplateColumns = "auto";
		/*containerClass.style.gridTemplateRows = "auto auto auto";*/
		containerClass.style.height = "5vh";
		document.getElementById("saveButton").style.visibility = "hidden";
		document.getElementById("upload").style.visibility = "hidden";
		document.getElementById("uploadcover").style.visibility = 'hidden';
		document.getElementById("hideTimeline").style.visibility = "hidden";
		if(hideTimeline == false && phonesize == true)
		{
			hideTimelineElements();
		}
		
		cancelButton.style.visibility = "hidden";
		document.getElementById("anno").style.maxWidth = "100vw"
		dDownContainer.style.padding = "6px 8px";
		containerClass.children[0].style.gridRow = "2";
		containerClass.children[0].style.gridColumn = "1";
		containerClass.children[0].style.height = "25vh";
		containerClass.children[1].style.gridRow = "1";
		containerClass.children[1].style.gridColumn = "1";
		containerClass.children[2].style.gridRow = "3";
		containerClass.children[2].style.gridColumn = "1";
		containerClass.children[3].style.gridRow = "4";
		containerClass.children[3].style.gridColumn = "1";
		containerClass.children[3].style.height = "25vh";
	/*	containerClass.children[0].style.height = "30vh";
		containerClass.children[1].style.height = "25vh";*/
	}
	if(screen.width > 450) {
		if(hideTimeline && phonesize == false)
		{
			hideTimelineElements();
		}
		console.log("Desktop size: " + screen.width);
		containerClass.style.gridTemplateColumns = "1fr 10fr";
		document.getElementById("upload").style.visibility = "visible";
		document.getElementById("saveButton").style.visibility = "visbile";
		document.getElementById("uploadcover").style.visibility = 'visible';
		document.getElementById("hideTimeline").style.visibility = "visible";
		cancelButton.style.visibility = "visible";
		/*containerClass.style.gridTemplateRows = "2fr 1fr";*/
		containerClass.style.height = "10vh";
		/*for(let i = 0; i < buttonContatier.length; i++)
		{
			buttonContatier[i].style.padding = "12px 16px";
			buttonContatier[i].style.fontSize = "16px"
		}*/
		document.getElementById("anno").style.maxWidth = "70vw"
		dDownContainer.style.padding = "12px 16px";
		document.getElementById("anno").style.gridRow = "1";
		document.getElementById("anno").style.gridColumn = "1";
		containerClass.children[1].style.gridRow = "1";
		containerClass.children[1].style.gridColumn = "2";
		containerClass.children[2].style.gridRow = "2";
		containerClass.children[2].style.gridColumn = "1 / span 2";
		containerClass.children[2].style.height = "10vmax";
		containerClass.children[3].style.gridRow = "3";
		containerClass.children[3].style.gridColumn = "1 / span 2";
	/*	containerClass.children[0].style.height = "70vh";
		containerClass.children[1].style.height = "65vh";
	*/}

	if(isRefreshed)
	{
		stopRefresh = false;
		isRefreshed = false;
	}

	if(startup)
	{	
		document.getElementById("Youtube-player-progress").max = player.getDuration();
		if(YT.PlayerState.PLAYING == 1)
		{
			//let newPos = ((player.getCurrentTime() / player.getDuration())*100);
			document.getElementById("Youtube-player-progress").value = player.getCurrentTime();
		}
		
		if(findClosestStar(segments) != null)
		{
			if(stopRefresh && isRefreshed == false)
			{
				showAnnotaion = true;
				let annoObject = findClosestStar(segments);
				displayCreatedAnnotation(annoObject.title, annoObject.content);
				isRefreshed = true;
			}
		}
		else {
			
			if(showAnnotaion == true && editAnnotation == false)
			{		
				if(stopRefresh && isRefreshed == false)
				{
					showAnnotaion = false;
					removeCreatedAnnoation();

					isRefreshed = true;
				}
			}
		}
	}
}

function startVideo() {
	player.playVideo()
}
		
function youTubePlayerCurrentTimeChange(currentTime){
	console.log("CurrentTime: " + currentTime);
	console.log("get current time function: " + player.getCurrentTime());
	player.currentTimeSliding = false;
	player.seekTo(currentTime, true);
}
	
function youTubePlayerCurrentTimeSlide() {
	console.log("CurrentTimeslide Function called");
	player.currentTimeSliding = true;

}

function pauseVideo() {
	player.pauseVideo()
}

function volumeChange(volume) {
	player.setVolume(volume)
}

//Completly random selection of default videos to load.
function getRandomVidId()
{
	let vidUrls = ["c65D6IdDFFc", "j14sp0lMIZ8","_X_b5Ph-h20","PdTS2AfS19g"];
	let selection = Math.floor(Math.random() * (vidUrls.length - 1));
	console.log(vidUrls[selection]);
	startupVid = vidUrls[selection];
	return vidUrls[selection];
}

//Prepares the  YouTube API
function onYouTubeIframeAPIReady(){
	console.log("api is loaded")
	
	player = new YT.Player("player",{
		height:500,
		width:900,
		videoId:getRandomVidId(),
		playerVars:{
			playersinline:1,
			autoplay:0,
			controls:1
		},
		events:{
			onReady:onPlayerReady,
			onStateChange:onPlayerStateChange
		}
	})
}

function onPlayerReady(){
	console.log("ready")
	startup = true;
}


function onPlayerStateChange(event){
	console.log("YT playerstate value is: " + YT.PlayerState.PLAYING);
	
	if(event.data == YT.PlayerState.PLAYING && !event.done){
		dine = true
	}
}