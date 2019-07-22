
var hasSlides = true;
var poem_mode = true;
var nextSlide_interval = null;
var slideIdx = null;
var slides = [];
var movies = [];
var pastEvents = [];

var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function setupSlides() {
    if ($("#slide").length === 0) {
        return;
    }
    function fetchSlides() {
        slides = [];
        $.getJSON('data/publicity.json', function(data) {
            var now = new Date();
            var midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            data.forEach(function(row) {
                var endDate = new Date(row['Event_End']);
                var filename = row['SPTV_Filename'];
                var approved = (row['SPTV_Completed'] === 1);
                var requested = (row['SPTV_Completed'] === 1 || row['SPTV_Completed'] === 0);
                var time_sensitive = (row['Time_Insensitive'] !== 1);
                if (new Date(+endDate + 5*60*60*1000) > now && requested) {
                    //find the duration of an event in hours
                    var startDate = new Date(row['Event_Start']);
                    var duration = (endDate - startDate) / (1000*60*60);
                    var differenceDays = (startDate - midnight) / (1000*60*60*24);
                    var text = '';
                    if (time_sensitive) {
                        var nDays = Math.ceil(differenceDays);
                        if (startDate.getDate() === now.getDate()) {
                            text = "TODAY!";
                        } else if (nDays === 1) {
                            text = "Tomorrow";
                        } else if (nDays < 0) {
                            text = "Now!";
                        } else {
                            text = "In " + nDays + " days";
                        }
                    }
                    startTime = new Date(row['Event_Start']);
                    loc = row['Event_Location'];
                    event_title = row['Event_Title'];
                    slides.push([filename, text, startTime, loc, event_title, approved]);
                }
            }); //data.forEach
            slideIdx = 0;
        });
    }
    fetchSlides();
}

function nextSlide(poem_mode, slides) {
    if (!hasSlides || poem_mode) {
        return;
    }
    if (slides.length === 0) {
        hasSlides = false;
        switchToMode(2);
        $("#slide-when").hide();
    } else {
        slideIdx = (slideIdx + 1) % slides.length;
        filename = slides[slideIdx][0];
        when_text = slides[slideIdx][1];
        startTime = slides[slideIdx][2];
        loc = slides[slideIdx][3];
        event_title = slides[slideIdx][4];
        approved = slides[slideIdx][5];
        if (filename !== null) {
            if (approved) {
                // real slide
                $("#slide-img").attr("src", "http://s-p.mit.edu/publicity/sptv/" + filename);
                switchToMode(1);
                if (when_text !== '') {
                    $("#slide-when").show();
                    $("#slide-when").html(slides[slideIdx][1]);
                } else {
                    $("#slide-when").hide();
                }
            }
        } else {
            // text slide
            switchToMode(3);
            document.getElementById("L1").innerHTML = event_title;

            time_loc = days[startTime.getDay()];
            time_loc = time_loc + ", " + months[startTime.getMonth()] + " " + startTime.getDate();
            time_loc = time_loc + ", " + startTime.getFullYear();
            time_loc = time_loc + "<br>" + addZero(startTime.getHours());
            time_loc = time_loc + ":" + addZero(startTime.getMinutes());
            time_loc = time_loc + " @" + loc;
            document.getElementById("L2").innerHTML = time_loc;
            if (when_text !== '') {
                $("#slide-when").show();
                $("#slide-when").html(slides[slideIdx][1]);
            } else {
                $("#slide-when").hide();
            }
        }
    }
}

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

function refreshIFrames() {
    $('iframe').each(function(key, value) {
        $(value).attr('src', function ( i, val ) { return val; });
    });
}

function fetchMovies() {
    $.getJSON('data/movie.json', function(data) {
        data.forEach(function(row) {
            movies.push(row);
        });
    });
}

function fetchPastEventPhotos() {
    $.getJSON('data/photo.json', function(data) {
        data.forEach(function(row) {
            pastEvents.push(row);
        });
    });
}

function setupDateTime() {
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    if (minutes < 10) { minutes = "0" + minutes}
    var postfix = "AM";
    if (hours >= 12) { postfix = "PM"; hours = hours % 12; }
    if (hours === 0) { hours = 12; }
    $('#datetime .time').html("<strong>" + hours + ":" + minutes + postfix + "</strong>");
    $('#datetime .date').html("<strong>" + days[date.getDay()] + ", " + (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear() + "</strong>");
    setTimeout(setupDateTime, 1000); //refresh every second
}

function nextbus_html(times) {
    var html = "";
    times.forEach(function (d, i) {
        if (i === times.length - 1) {
            html += "<strong>" + d + " min" + "</strong>" ;
        } else {
            html += "<strong>" + d + " | " + "</strong>" ;
        }
    });
    if (html === "") { html = "<strong>" +'No prediction'+"</strong>" ; }
    return html;
}

function setupNextBus() {
    $.getJSON('data/nextbus.json', function(data) {
        setTimeout(setupNextBus, 5 * 1000); // refresh nextbus every 5 seconds
        var d = new Date();
        var n = d.getDay();
        // show Trader Joe's grocery shuttle on Sunday instead of EZRide
        if (n == 0) {
            $("#EZRide").hide();
            $("#EZRide_title").hide();
            $("#TraderJoes").show();
            $("#TraderJoes_title").show();
            $("#TraderJoes").html(nextbus_html(data['traderjwf']));
        } else {
            $("#TraderJoes").hide();
            $("#TraderJoes_title").hide();
            $("#EZRide").show();
            $("#EZRide_title").show();
            $("#EZRide").html(nextbus_html(data['ezride']));
        }

        $("#Saferide").html(nextbus_html(data['saferide']));
    });  
}

function setupHubway() {
    $.getJSON('data/hubway.json', function(data) {
        setTimeout(setupHubway, 5 * 1000); // refresh nextbus every 5 seconds
        $("#bike .title").html("<strong>BlueBikes@SP (updated at " +
                               data['time_updated'] + "</strong>");
        $("#bike .content").html("<strong>" + data['num_bikes_available'] + " Bikes | " +
                                 data['num_docks_available'] + " Docks</strong>");
    });  
}

function getCurrentWeather(){
    // Get news from New York Times API
    // API-ID: 01b4617d62a8f369750763f07840a44d:13:74637207

    $.ajax({
        type:"GET",
        dataType: 'json',
        url: 'data/weather.json',
        success: function(data) {
            var weather = data['weather'][0]['main'];
            var tempK = data['main']['temp'];
            var tempC = tempK - 273.15;
            var tempF = tempC * 1.8 + 32;
            $("#weather .content").html("<strong>" + weather + ", " +
                                         Math.round(tempC) + "C" + " | " +
                                         Math.round(tempF) + "F</strong>" );
        },
        error: function () {
            // Recurse the function to catch for error of too many requests
            setTimeout(function () {
                getCurrentWeather();
            }, 1000);
        }
    });
}

function getLaterWeather(){
    $.ajax({
        type:"GET",
        dataType: 'json',
        url: 'data/weatherLater.json',
        success: function(data) {
            var d = new Date();
            var currTime = d.getTime() / 1000; // convert to seconds from 1970/1/1
            var nextTime1 = data['list'][0]['dt'];
            var nextTime2 = data['list'][1]['dt'];
            var nextTime3hr = 0;
            var nextTime3hrIndex = -1;

            if (Math.abs(nextTime1 - currTime - 10800) < Math.abs(nextTime2 - currTime - 10800)) {
                nextTime3hrIndex = 0;
            } else {
                nextTime3hrIndex = 1;
            }

            var weather = data['list'][nextTime3hrIndex]['weather'][0]['main'];
            var tempK = data['list'][nextTime3hrIndex]['main']['temp'];
            var tempC = tempK-273.15;
            var tempF = tempC * 1.8 + 32;
            $("#weather2 .content").html("<strong>" + weather + ", " +
                                         Math.round(tempC) + "C" + " | " +
                                         Math.round(tempF) + "F</strong>" );

            // Logic for 6 hrs is simply to take the next data point from the 3hr point
            // Assumption: OpenWeatherMap data are always spaced 3hr apart (stated in their website)

            var nextTime6hrIndex = nextTime3hrIndex + 1;
            var weather = data['list'][nextTime6hrIndex]['weather'][0]['main'];
            var tempK = data['list'][nextTime6hrIndex]['main']['temp'];
            var tempC = tempK-273.15;
            var tempF = tempC * 1.8 + 32;
            $("#weather3 .content").html("<strong>" + weather + ", " +
                                         Math.round(tempC) + "C" + " | " +
                                         Math.round(tempF) + "F</strong>" );
        },
        error: function () {
            // Recurse the function to catch for error of too many requests
            setTimeout(function () {
                getLaterWeather();
            }, 1000);
        }
    });
}

function setupWeather() {
    //Client id: 129379525
    //Client secret: m291VmMk7mSaPDd3_OsSCY-ePnsJZK2TX33qlZ3D

    // The previous weather data comes from https://api.metwit.com/v2/weather/?location_lat=42.368691&location_lng=-71.093956
    // which has unpredictable updating time. (e.g. checking at 8pm shows data at 12am next day)
  
    // Get weather info from http://openweathermap.org/api
    // Cambridge ID: 4931972
    // now - http://api.openweathermap.org/data/2.5/weather?id=4931972
    // 5 day / 3 hr - http://api.openweathermap.org/data/2.5/forecast?id=4931972

    // NOW
    getCurrentWeather();
 
    // In 3/6 hours
    getLaterWeather();
}

function setupNews(){
    // Get news from New York Times API
    // API-ID: 01b4617d62a8f369750763f07840a44d:13:74637207

    $.ajax({
        type:"GET",
        dataType: 'json',
        url: 'data/news.json',
        success: function(data) {
            var num_news = data['results'].length;
            var news_index = Math.floor(num_news * Math.random());
            var news_title = data['results'][news_index]['title'];
            var news_section = data['results'][news_index]['section'];
            var news_abstract = data['results'][news_index]['abstract'];
            $("#newsline").html("<b>New York Times (" + news_section + " Section): " + news_title + '. </b>' + news_abstract);
        },
        error: function () {
            $("#newsline").html("Error in fetching news from news.json.");
        }
    });
    setTimeout(setupNews,10000);
}

function displayPoemsLineByLine() {

    $.getJSON('data/poems.json', function(data) {

        function clearImage() {
            poem_mode = true;
            document.getElementById("slide-img").style.visibility = "hidden";
            switchToMode(2);
            // clear image otherwise later from poem to
            // slides, you'll see a flash from the image
            // shown before poem mode triggered to the one
            // to show after poem mode is done
            $("#slide-img").attr("src", "");
            clearInterval(nextSlide_interval);

            d3.select("#L1")
                .style("font-family", "Impact, Charcoal, sans-serif")
                .style("top", "25%")
                .style("font-size", "100px")
                .style("font-weight", "normal");
        };

        function l1Animation(endOpacity) {
            if (endOpacity == null)
                endOpacity = 1;
            d3.select("#L1")
                .style("color", "#f3f3f3")
                .style("transform", "scale(1.4, 1.4)")
                .style("opacity", 1)
                .transition()
                .duration(100)
                .transition()
                .duration(100)
                .style("color", "rgb(255,216,0)")
                .style("transform", "scale(1.1, 1.1)")
                .transition()
                .duration(1500)
                .style("transform", "scale(0.85, 0.9)")
                .style("opacity", endOpacity);
        }

        function displayPoemFirstFourLines() {
            d3.select("#L1")
                .html(poems[poemIndex][poemLineId]);
            l1Animation();
            poemLineId ++;
        };

        function displaySpHelpers() {
            d3.select("#L1")
                .style("top", "8%")
                .style("font-size", "180px")
                .style("font-weight", "normal")
                .html("sp-helpers");
            l1Animation();
        };

        function displayPoemLineFive() {
            d3.select("#L1")
                .style("font-family", lineFiveFont)
                .style("top", "10%")
                .style("font-size", "60px")
                .style("font-weight", "bold")
                .style("transform", "")
                .style("color", lastPageColor)
                .style("opacity", 1)
                .html(poems[poemIndex][5]);
        }

        function displaySignupInfo() {
            // L2 html
            d3.select("#L2")
                .style("top", "15%")
                .style("color", lastPageColor)
                .style("font-family", "Palatino Linotype, Book Antiqua, Palatino, serif")
                .html(signUp);

            // L3 html
            d3.select("#L3")
                .style("top", "25%")
                .style("color", lastPageColor)
                .html(poemCredit);
        };

        function displayMovieTransition() {
            poem_mode = false;
            displayMovie();
        };

        var poems = [];
        poems[0] = data['poem0'];
        poems[1] = data['poem1'];
        poems[2] = data['poem2'];
        poems[3] = data['poem3'];
        poems[4] = data['poem4'];
        poems[5] = data['poem5'];
        poems[6] = data['poem6'];

        // transition-related stuff
        var numPoems = poems.length;
        var poemIndex = Math.floor(numPoems * Math.random());
        var poemDelay = 0;
        var lineDelay = 2000;
        var helperDelay = 2000;
        var movieDelay = 5000;
        var poemLineId = 0;
        var lastPageColor = "rgb(255,216,0)";
        var lineFiveFont = '"Palatino Linotype", "Book Antiqua", Palatino, serif';
        var signUp = "To sign up, go to:<br><i>"
            + "https://s-p.mit.edu/myacct/resident_edit_entry.php</i><br>and select"
            + "\"I would be willing to help out.\"";
        var poemCredit = "Poem credit: Nicholas Triantafillou, "
            + "2016-2017 SP President&nbsp;&nbsp;&nbsp;";

        // delays[i] -- time from the start of (i-1)-th event to the start of i-th event
        var delays = [poemDelay, lineDelay, lineDelay, lineDelay, lineDelay, lineDelay, helperDelay, lineDelay, movieDelay];

        // alterHTMLFuncs
        var alterHtmlFuncs = [];
        alterHtmlFuncs.push(clearImage);
        alterHtmlFuncs.push(displayPoemFirstFourLines);
        alterHtmlFuncs.push(displayPoemFirstFourLines);
        alterHtmlFuncs.push(displayPoemFirstFourLines);
        alterHtmlFuncs.push(displayPoemFirstFourLines);
        alterHtmlFuncs.push(displaySpHelpers);
        alterHtmlFuncs.push(displayPoemLineFive);
        alterHtmlFuncs.push(displaySignupInfo);
        alterHtmlFuncs.push(displayMovieTransition);

        // start transition
        var i = 0;
        d3.transition()
            .delay(delays[0])
            .on("start", function repeat() {
                alterHtmlFuncs[i]();
                if (i < delays.length - 1) {
                    i ++;
                    d3.transition()
                        .delay(delays[i])
                        .on("start", repeat);
                }
            });
    });
}

function displayLine(lineID,content,time){
    setTimeout(function(){
        document.getElementById(lineID).innerHTML = content;
    }, time);
}

function displayMovie() {
    var index = Math.floor(Math.random() * movies.length);
    var movie = movies[index];
    $("#movie-img").attr("src", movie['WebImage']);
    $("#movie-title").html(movie['MovieTitle']);
    $("#movie-category").html(movie['MovieCategory']);
    $("#imdb").html(movie['imdbRating']);
    $("#movie-format").html(movie['Format']);
    switchToMode(4);
    setTimeout(function(){
        nextSlide(poem_mode, slides);
        nextSlide_interval = setInterval(nextSlide, 15000, poem_mode, slides); //change slide every 15 sec
        displayPastEvent();
    }, 15000);
}

function displayPastEvent() {
    var delay = hasSlides ? 150000 : 0;
    var index = Math.floor(Math.random() * pastEvents.length);
    var event = pastEvents[index];
    // shuffle and get 5 photos
    var photos = event['photos'].sort(function() { return 0.5 - Math.random() });
    $("#photo1").attr("src", photos[0]);
    $("#photo2").attr("src", photos[1]);
    $("#photo3").attr("src", photos[2]);
    $("#photo4").attr("src", photos[3]);
    $("#photo5").attr("src", photos[4]);
    $("#slide-when-past").html("Past: " + event['title']);
    setTimeout(function(){
        switchToMode(5);
        setTimeout(function(){
            displayPoemsLineByLine(); // recurse into poem
        }, 15000);
    }, delay);
}

function switchToMode(modeNum){
    if (modeNum == 1){ // Standard Slides Mode
        document.getElementById("slide-img").style.visibility = "visible";
        document.getElementById("slide-when").style.visibility = "visible";
        document.getElementById("slide-when-past").style.visibility = "hidden";
        document.getElementById("slide2").style.visibility = "hidden";
        document.getElementById("text_react").style.visibility = "hidden";
        document.getElementById("paragraphs").style.visibility = "hidden";
        document.getElementById("movie").style.visibility = "hidden";
        document.getElementById("past-event").style.visibility = "hidden";
        $("#slide-background").hide();
    } else if (modeNum == 2){ // Poem Mode
        document.getElementById("L1").innerHTML = "";
        document.getElementById("L2").innerHTML = "";
        document.getElementById("L3").innerHTML = "";
        document.getElementById("L4").innerHTML = "";
        document.getElementById("L5").innerHTML = "";
        document.getElementById("L6").innerHTML = "";
        document.getElementById("L7").innerHTML = "";
        document.getElementById("L8").innerHTML = "";

        $("#slide-background").hide();
        document.getElementById("slide-img").style.visibility = "hidden";
        document.getElementById("slide-when").style.visibility = "hidden";
        document.getElementById("slide-when-past").style.visibility = "hidden";
        document.getElementById("slide2").style.visibility = "visible";
        document.getElementById("text_react").style.visibility = "visible";
        document.getElementById("text_react").style.fill = "rgb(22,23,167)";
        document.getElementById("paragraphs").style.color = "rgb(255,216,0)";
        document.getElementById("paragraphs").style.visibility = "visible";
        document.getElementById("movie").style.visibility = "hidden";
        document.getElementById("past-event").style.visibility = "hidden";
    } else if (modeNum == 3){ // text slide Mode
        document.getElementById("L1").innerHTML = "";
        document.getElementById("L2").innerHTML = "";
        document.getElementById("L3").innerHTML = "";
        document.getElementById("L4").innerHTML = "";
        document.getElementById("L5").innerHTML = "";
        document.getElementById("L6").innerHTML = "";
        document.getElementById("L7").innerHTML = "";
        document.getElementById("L8").innerHTML = "";
        d3.select("#L1")
            .style("font-family", "Caveat, cursive")
            .style("font-size", "70px")
            .style("font-weight", "bold");
        d3.select("#L2").style("font-family", "Caveat, cursive");
        document.getElementById("L1").style.color = "rgb(255,255,255)";
        document.getElementById("L2").style.color = "rgb(255,255,255)";
        document.getElementById("L3").style.color = "rgb(255,255,255)";
        document.getElementById("slide-img").style.visibility = "hidden";
        document.getElementById("slide-when").style.visibility = "visible";
        document.getElementById("slide-when-past").style.visibility = "hidden";
        document.getElementById("slide2").style.visibility = "visible";
        document.getElementById("text_react").style.visibility = "hidden";
        document.getElementById("paragraphs").style.color = "rgb(255,255,255)";
        document.getElementById("paragraphs").style.visibility = "visible";
        document.getElementById("movie").style.visibility = "hidden";
        document.getElementById("past-event").style.visibility = "hidden";
        $("#slide-background").show();
    } else if (modeNum == 4) { // Movie Mode
        document.getElementById("L1").innerHTML = "";
        document.getElementById("L2").innerHTML = "";
        document.getElementById("L3").innerHTML = "";
        document.getElementById("L4").innerHTML = "";
        document.getElementById("L5").innerHTML = "";
        document.getElementById("L6").innerHTML = "";
        document.getElementById("L7").innerHTML = "";
        document.getElementById("L8").innerHTML = "";

        document.getElementById("slide-img").style.visibility = "hidden";
        document.getElementById("slide-when").style.visibility = "hidden";
        document.getElementById("slide-when-past").style.visibility = "hidden";
        document.getElementById("slide2").style.visibility = "visible";
        document.getElementById("text_react").style.visibility = "visible";
        document.getElementById("text_react").style.fill = "black";
        document.getElementById("movie").style.visibility = "visible";
        document.getElementById("past-event").style.visibility = "hidden";
    } else if (modeNum == 5) { // Past event Mode
        document.getElementById("L1").innerHTML = "";
        document.getElementById("L2").innerHTML = "";
        document.getElementById("L3").innerHTML = "";
        document.getElementById("L4").innerHTML = "";
        document.getElementById("L5").innerHTML = "";
        document.getElementById("L6").innerHTML = "";
        document.getElementById("L7").innerHTML = "";
        document.getElementById("L8").innerHTML = "";

        document.getElementById("slide-img").style.visibility = "hidden";
        document.getElementById("slide-when").style.visibility = "hidden";
        document.getElementById("slide-when-past").style.visibility = "visible";
        document.getElementById("slide2").style.visibility = "visible";
        document.getElementById("text_react").style.visibility = "hidden";
        document.getElementById("movie").style.visibility = "hidden";
        document.getElementById("past-event").style.visibility = "visible";
    }
}

$(document).ready(function() {
    setTimeout('location.reload();', 10*60*60*1000);
    setupSlides();
    setupDateTime();
    setupNextBus();
    setupHubway();
    setupWeather();
    // setupNews();
    fetchMovies();
    fetchPastEventPhotos();
    displayPoemsLineByLine();
});
