const ak = '253hee991ed415gi809d9978e3885h7h';
let temp = 0;
let cityList = [];
let ky = '';
let address = '';
let timezoneOffset;
const winterTime = 3600;
const summerTime = 7200;
let iconVal;
let iconValRaw;
let isCurrentLocation = false;
let open_current_Location_requested = false;
let uvIndexisCritical = false;
let uvIndexIsCriticalUntil = '';
let weatherType = 'opt_weather';
let mainData = [];
let meineKarte = L.map('karte').setView([51.162290, 6.462739], 2);
let airQualityInfoboxIsVisible = false;
let alertInfoboxIsVisible = false;
let showAlert = 0;
let settingsAreVisible = false;
let windDeg = 0;
let sunrise;
let next_sunrise;
let sunset;
let sunEvent = '';
let sunriseRaw;
let sunsetRaw;


let weatherSettings = {
    appeareanceMode: ''
}

class Address {
    constructor(name, display_name, lon, lat) {
        this.name = name;
        this.display_name = display_name;
        this.lon = lon;
        this.lat = lat;
    }
}

//?####################################################################################################
// Button etc.
const currentLocationButton = document.getElementById('btnCurrLoc');
const weatherContainer = document.getElementById('weatherCard');
const cityContainer = document.getElementById('cityContainer');
const searchButton = document.getElementById('searchButton');
const searchField = document.getElementById('inpCityname');
const toasts = document.getElementById('toasts');
const progressValue_Temp = document.getElementById("progress_Temp");
const ortLabel = document.getElementById("outpOrt");
const typeSelect = document.getElementById("weatherForecastType");
const tempLabel = document.getElementById("outpTemp");
const outSun = document.getElementById("outSun");
const infoBtn = document.getElementById("infoBtn");
const detailContainer = document.getElementById("detailContainer");
const outpSmallCurrentTemp = document.getElementById("outpSmallTemp");
const alertContainer = document.getElementById("alertContainer");
const alertDetailContainer = document.getElementById("alertDetailContainer");
const btnAlert = document.getElementById("btnAlert")
const btnShowMoreAlerts = document.getElementById("btnShowMoreAlerts");
const outpAlertHeadline = document.getElementById("outpAlertHeadline");
const btnSettings = document.getElementById("btnSettings");
const settingWindow = document.getElementById("settingWindow");
const theBody = document.getElementById("theBody");
const settingsAppearance = document.getElementById("settingsAppearance");
const btnSaveSettings = document.getElementById("btnSaveSettings");
const btn_scroll_up = document.getElementById("btn_scroll_up");
const sun_event = document.getElementById('sun_event');
const btn_show_cityModal = document.getElementById('btn_show_cityModal');
const outputUVMaxIndex = document.getElementById('outputUVMaxIndex');
const outputDewPoint = document.getElementById('outputDewPoint');
const todaySummaryContainer = document.getElementById('outp_summary');
const opt_dewPoint = document.getElementById('opt_dewPoint');

//?####################################################################################################
// Load
window.onload = loadData();

//?####################################################################################################
// Eingegebene Stadt suchen
function showWeather() {
    
    if (searchField.value.length > 1) {
        
        address = searchField.value;
        getAddressCoordinates(address);
        if (address.slice(-1) === ' ') {
            address = address.trimEnd();
        }
        searchField.value = '';
    }
}

//?####################################################################################################
// Wenn mit Enter gesucht wird
window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        showWeather();
    }
});

//* Func to decode address in lat and lon -- call load map and requestWeatherForecast
//TODO - Suchvorschläge bei Suche anzeigen
//TODO - Allgemein soll es zukünfrig ein Objekt geben, welches aus Name, Lat, Lon besteht

async function getAddressCoordinates(address) {
    remove_all_forecast_details()
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();
        if (data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            const display_name = data[0].display_name;
            console.log(data);
            address = data[0].name;
            ortLabel.innerHTML = address;

            const new_address = new Address(address, display_name, lon, lat);
            console.log(new_address);

            loadMap(lat, lon);
            requestWeatherForecast(lat, lon);

            // setTimeout(() => {
            //     getAirPollutionInfo(lat, lon);
            // }, 1500);

        } else {
            weatherContainer.style.display = 'none';
            createNotification(
                'Der Ort konnte nicht gefunden werden :(',
                'alert',
                2000
            );
            deleteSpinner();
            address = '';
            let index;
            for (let i = 0; i <= 7; i++) {
                index = `forecastBlock${i}`;
                document.getElementById(index).hidden = true;
            }
            for (let i = 0; i <= 24; i++) {
                index = `hourForecastBlock${i}`;
                document.getElementById(index).hidden = true;
            }
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Daten:', error);
    }
}



function set_wind_definition(windspeed) {

    if (windspeed <= 5) {
        document.getElementById('wind_title').innerHTML = '1 - leichter Luftzug';
    }

    if (windspeed >= 6 && windspeed <= 11) {
        document.getElementById('wind_title').innerHTML = '2 - leichte Brise';
    }

    if (windspeed >= 12 && windspeed <= 19) {
        document.getElementById('wind_title').innerHTML = '3 - schwacher Wind';
    }

    if (windspeed >= 20 && windspeed <= 28) {
        document.getElementById('wind_title').innerHTML = '4 - mäßiger Wind';
    }

    if (windspeed >= 29 && windspeed <= 38) {
        document.getElementById('wind_title').innerHTML = '5 - frischer Wind';
    }

    if (windspeed >= 39 && windspeed <= 49) {
        document.getElementById('wind_title').innerHTML = '6 - starker Wind';
    }

    if (windspeed >= 50 && windspeed <= 61) {
        document.getElementById('wind_title').innerHTML = '7 - steifer Wind';
    }

    if (windspeed >= 62 && windspeed <= 74) {
        document.getElementById('wind_title').innerHTML = '8 - stürmischer Wind';
        document.getElementById('wind_container').style.background = 'linear-gradient(to bottom, transparent,yellow)'
    }

    if (windspeed >= 75 && windspeed <= 88) {
        document.getElementById('wind_title').innerHTML = '9 - Sturm';
        document.getElementById('wind_container').style.background = 'linear-gradient(to top, transparent,orange)'
    }

    if (windspeed >= 89 && windspeed <= 102) {
        document.getElementById('wind_title').innerHTML = '10 - schwerer Sturm';
        document.getElementById('wind_container').style.background = 'linear-gradient(to top, transparent,orange)'
    }

    if (windspeed >= 103 && windspeed <= 117) {
        document.getElementById('wind_title').innerHTML = '11 - orkanartiger Sturm';
        document.getElementById('wind_container').style.background = 'linear-gradient(to top, transparent,red)'
    }

    if (windspeed >= 118) {
        document.getElementById('wind_title').innerHTML = '12 - Orkan';
        document.getElementById('wind_container').style.background = 'linear-gradient(to top, transparent,red)'
    }

}


//?####################################################################################################
// Open Streetmap

function loadMap(lat, lon) {

    // Initialisierung der Karte
    let mapPlace = {
        "type": "Point",
        "coordinates": []
    };

    let mapOverViewCoord = [];
    mapPlace.coordinates.push(lon);
    mapPlace.coordinates.push(lat);
    mapOverViewCoord.push(lat);
    mapOverViewCoord.push(lon);

    meineKarte.remove();  // Bestehende Karte entfernen
    meineKarte = L.map('karte').setView(mapOverViewCoord, 3);  // Neue Karte erstellen

    // Hinzufügen der Kartenebenen
    L.tileLayer('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {
        maxZoom: 900,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(meineKarte);

    // Marker hinzufügen und Popup binden
    const city = document.getElementById('outpOrt').innerHTML;
    L.geoJSON(mapPlace).addTo(meineKarte).bindPopup(`${city}`);

}


function dcrK(val, offs) {
    let dcrStrng = "";
    for (const char of val) {
        if (char.match(/[a-zA-Z]/)) {
            const shiftedChar = String.fromCharCode(((char.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0) - offs + 26) % 26) + 'a'.charCodeAt(0));
            if (char === char.toUpperCase()) {
                dcrStrng += shiftedChar.toUpperCase();
            } else {
                dcrStrng += shiftedChar;
            }
        } else {
            dcrStrng += char;
        }
    }
    return dcrStrng;
}

//?####################################################################################################
// Forecast
//?####################################################################################################
function requestWeatherForecast(lat, lon) {
    loadSpinner();
    const apiLink = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${ky}&lang=de&units=metric`;

    //* init
    todaySummaryContainer.style.opacity = '0'

    fetch(apiLink)
        .then((response) => response.json())
        .then((data) => {
            console.log('ForecastData', data);
            let tempMin;
            let tempMax;
            let weatherIcon;
            let index;
            let hour;
            let weekDay;
            timezoneOffset = data.timezone_offset;
            const windgesch = data.current.wind_speed * 3.6;
            let imgSrc = `https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/widgets/${data.current.weather[0].icon}.png`;

            // * Stuff from weather request func
            deleteSpinner();
            temp = parseInt(data.current.temp);
            const currTEMP = parseInt(data.current.temp)
            initUpcountingTemp(temp);
            weatherContainer.style.display = 'flex';
            document.getElementById('errorLeiste').hidden = true;
            document.getElementById('btnAddCity').hidden = false;


            document.getElementById('outpTemp').innerHTML = `🌡`;

            iconValRaw = data.current.weather[0].icon;
            iconVal = iconValRaw.slice(-1);

            document.getElementById('weatherimg').src = imgSrc;
            document.getElementById('outpWeather').innerHTML =
                data.current.weather[0].description;
            document.getElementById('outpWind').innerHTML = `${windgesch.toFixed(0)} Km/h`;
            set_wind_definition(windgesch.toFixed(0));

            //document.getElementById("outpAirQuali").innerHTML = 'Lade Werte ...';
            ausw(currTEMP);
            /////////////////////////////////////////
            //* Normal Stuff
            try {
                mainData = JSON.stringify(data);
            } catch (error) {
                console.log(error);
            }




            //?####################################################################################################
            //* Wetteralarm
            if (data.alerts) {
                showAlert = 0;
                let alertBody = data.alerts[showAlert].description;
                let alertEvent = data.alerts[showAlert].event;
                let alertStart = intTimeConvert(data.alerts[showAlert].start);
                let alertEnd = intTimeConvert(data.alerts[showAlert].end);
                let alertSender = data.alerts[showAlert].sender_name;

                const alertAmount = data.alerts.length;
                if (alertAmount > 1) {
                    btnShowMoreAlerts.classList.add("active");
                    outpAlertHeadline.innerHTML = "Wetteralarm " + "1/" + alertAmount;
                } else {
                    btnShowMoreAlerts.classList.remove("active");
                    outpAlertHeadline.innerHTML = "Wetteralarm " + "1/" + alertAmount;
                }

                //* Weiter Button
                btnShowMoreAlerts.addEventListener("click", () => {
                    if (showAlert < alertAmount - 1) {
                        showAlert++;
                    } else {
                        showAlert = 0;
                    }
                    alertBody = data.alerts[showAlert].description;
                    alertEvent = data.alerts[showAlert].event;
                    alertStart = intTimeConvert(data.alerts[showAlert].start);
                    alertEnd = intTimeConvert(data.alerts[showAlert].end);
                    alertSender = data.alerts[showAlert].sender_name;

                    outpAlertHeadline.innerHTML = "Wetteralarm " + (showAlert + 1) + "/" + alertAmount;
                    document.getElementById("outpAlertTitle").innerHTML = alertEvent;
                    document.getElementById("outpAlertMessage").innerHTML = alertBody;
                    document.getElementById("outpAlertStart").innerHTML = 'Start: ' + alertStart;
                    document.getElementById("outpAlertEnd").innerHTML = 'Ende: ' + alertEnd;
                    document.getElementById("outpAlertSource").innerHTML = 'Quelle: ' + alertSender;
                })



                alertContainer.classList.add("active");
                alertDetailContainer.classList.remove("active");
                alertInfoboxIsVisible = false;


                document.getElementById("outpAlertTitle").innerHTML = alertEvent
                document.getElementById("outpAlertMessage").innerHTML = alertBody;
                document.getElementById("outpAlertStart").innerHTML = 'Start: ' + alertStart;
                document.getElementById("outpAlertEnd").innerHTML = 'Ende: ' + alertEnd;
                document.getElementById("outpAlertSource").innerHTML = 'Quelle: ' + alertSender;
            } else {
                alertContainer.classList.remove("active");
            }

            //?####################################################################################################
            // UV Index
            let uvIndex = data.current.uvi;
            let nextUVIndex = 0;
            let maxUvIndex = data.daily[0].uvi;

            //?####################################################################################################
            // Windgeschwidigkeit und Richtung
            windDeg = data.current.wind_deg;
            document.getElementById("windDirect").style.transform = `rotate(${windDeg}deg)`

            //?####################################################################################################
            // Taupunkt und Feuchtigkeit
            const dewPoint = data.current.dew_point;
            const humidity = data.current.humidity;
            let sultry = '';

            if (temp > 20 && dewPoint > 16) {
                sultry = 'Feuchtwarme Luft'
            } else {
                sultry = ''
            }

            document.getElementById("outpHumidity").innerHTML = `${humidity}% <br/><br/> <hr> <span class="mini-headline">Taupunkt</span> <br/> <br/>${dewPoint}°C<br/><span class="sultry">${sultry}</span>`


            //?####################################################################################################
            // Sonnen auf - untergang

            if (splitVal(intTimeConvert(data.current.sunrise) + '', " ", 5) === 'GMT+0200') {
                timeSubstract = summerTime;
            } else {
                timeSubstract = winterTime;
            }

            //* Sonnenaufgang roh für Sonnenstand
            sunriseRaw = intTimeConvert(data.current.sunrise + timezoneOffset - timeSubstract);
            next_sunrise = intTimeConvert(data.daily[1].sunrise + timezoneOffset - timeSubstract);
            sunsetRaw = intTimeConvert(data.current.sunset + timezoneOffset - timeSubstract);
            // Für Anzeige Auf-Untergang
            sunrise = rawDatetime_in_Time(data.current.sunrise);
            sunset = rawDatetime_in_Time(data.current.sunset);
            outSun.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="yellow" class="bi bi-sunrise-fill" viewBox="0 0 16 16">
            <path d="M7.646 1.146a.5.5 0 0 1 .708 0l1.5 1.5a.5.5 0 0 1-.708.708L8.5 2.707V4.5a.5.5 0 0 1-1 0V2.707l-.646.647a.5.5 0 1 1-.708-.708zM2.343 4.343a.5.5 0 0 1 .707 0l1.414 1.414a.5.5 0 0 1-.707.707L2.343 5.05a.5.5 0 0 1 0-.707m11.314 0a.5.5 0 0 1 0 .707l-1.414 1.414a.5.5 0 1 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0M11.709 11.5a4 4 0 1 0-7.418 0H.5a.5.5 0 0 0 0 1h15a.5.5 0 0 0 0-1h-3.79zM0 10a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2A.5.5 0 0 1 0 10m13 0a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5"/>
          </svg>` + sunrise + ` | <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="orange" class="bi bi-sunset-fill" viewBox="0 0 16 16">
          <path d="M7.646 4.854a.5.5 0 0 0 .708 0l1.5-1.5a.5.5 0 0 0-.708-.708l-.646.647V1.5a.5.5 0 0 0-1 0v1.793l-.646-.647a.5.5 0 1 0-.708.708zm-5.303-.51a.5.5 0 0 1 .707 0l1.414 1.413a.5.5 0 0 1-.707.707L2.343 5.05a.5.5 0 0 1 0-.707zm11.314 0a.5.5 0 0 1 0 .706l-1.414 1.414a.5.5 0 1 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zM11.709 11.5a4 4 0 1 0-7.418 0H.5a.5.5 0 0 0 0 1h15a.5.5 0 0 0 0-1h-3.79zM0 10a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2A.5.5 0 0 1 0 10m13 0a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5"/>
        </svg> ` + sunset;


            // Akt. Ortsdatum & Zeit
            const dateTimeNowRaw = intTimeConvert(data.current.dt + timezoneOffset - timeSubstract);
            const dateTimeNow_Day = splitVal(dateTimeNowRaw + '', " ", 2);
            const dateTimeNow_Month = splitVal(dateTimeNowRaw + '', " ", 1);
            const dateTimeNow_TIME = splitVal(dateTimeNowRaw + '', " ", 4);
            const dateTimeNow_Hour = splitVal(dateTimeNow_TIME + '', ":", 0)
            const dateTimeNow_Minute = splitVal(dateTimeNow_TIME + '', ":", 1)
            document.getElementById("outCurrDatetime").innerHTML = `${dateTimeNow_Day}.${dateTimeNow_Month} | ${dateTimeNow_Hour}:${dateTimeNow_Minute}`;


            //?####################################################################################################
            // Sonnenstand ermitteln
            let isAfterSunset = false;
            let isAfterSunrise = false;
            let isBeforeSunrise = false;
            let isBeforeSunset = false; // Wird noch nicht benutzt. Mal gucken...


            if (dateTimeNowRaw > sunsetRaw) {
                isAfterSunset = true;
            }
            if (dateTimeNowRaw > sunriseRaw) {
                isAfterSunrise = true;
            }
            if (dateTimeNowRaw < sunriseRaw) {
                isBeforeSunrise = true;
            }
            if (dateTimeNowRaw < sunsetRaw) {
                isBeforeSunset = true;
            }
            if (isAfterSunrise === true && isAfterSunset === true && isBeforeSunrise == false) {
                // ? Abends vor Mitternacht
                sunEvent = 'evening'; //* For func calc_time_to_next_sunevent
                const styleElem = document.head.appendChild(document.createElement("style"));
                styleElem.innerHTML = "#sunstand:after {left: 95px; top: 0px; background-Color: transparent;}";

            } else if (isAfterSunrise === false && isAfterSunset === false && isBeforeSunrise == true) {
                // ? Nachts nach Mitternacht
                sunEvent = 'night'; //* For func calc_time_to_next_sunevent
                const styleElem = document.head.appendChild(document.createElement("style"));
                styleElem.innerHTML = "#sunstand:after {left: -15px; top: -3px; background-Color: transparent;}";
            } else {
                // ? Tagsüber
                sunEvent = 'day'; //* For func calc_time_to_next_sunevent
                const todayTimeDiff = sunsetRaw - sunriseRaw;
                const currentTimeDiff = sunsetRaw - dateTimeNowRaw;
                const currentTimeProzentDiff = (currentTimeDiff * 100) / todayTimeDiff;
                const currentTimeProzent = parseInt(100 - currentTimeProzentDiff);
                const styleElem = document.head.appendChild(document.createElement("style"));
                styleElem.innerHTML = `#sunstand:after {left: ${currentTimeProzent - 5}px; top: -8px; background-Color: yellow;}`;
            }


            get_MoonData(data);

            get_RainData(data);

            //?####################################################################################################
            // Von heute Min und Max Temp eintragen

            tempMin = parseInt(data.daily[0].temp.min);
            tempMax = parseInt(data.daily[0].temp.max);
            progressValue_Temp.max = 100;

            const todayTempDiff = parseInt(tempMax - tempMin);
            const currentTemp = parseInt(data.current.temp);
            const currentDiff = tempMax - currentTemp;
            let currentTempProzentdiff = (currentDiff * 100) / todayTempDiff;
            const currentTempProcent = 100 - currentTempProzentdiff;


            try {
                progressValue_Temp.value = currentTempProcent;
            } catch (error) {
                console.log(error);
            }
            let tempFeelsLike = parseInt(data.current.feels_like);
            document.getElementById("outp_MinTemp").innerHTML = `Min: ${tempMin}°C`;
            document.getElementById("outp_MaxTemp").innerHTML = `Max: ${tempMax}°C`;
            document.getElementById("outp_feltTemp").innerHTML = `Gefühlt: ${tempFeelsLike}°C`;
            outpSmallCurrentTemp.innerHTML = `${currentTemp}°C`;

            //?####################################################################################################
            // Current UV Index
            document.getElementById("outUvIndx").innerHTML = `${uvIndex} - ${inerpreteUvIndex(uvIndex)}`;
            document.getElementById("outpMaxUvIndex").innerHTML = `Heute Max: ${maxUvIndex}`;

            timeMinusSummertime = 0;
            //?####################################################################################################
            // Forecast Stunden Felder einblenden
            for (let i = 0; i <= 24; i++) {
                index = `hourForecastBlock${i}`;
                document.getElementById(index).hidden = false;

                temp = parseInt(data.hourly[i].temp);
                weatherIcon = data.hourly[i].weather[0].icon;
                // ? Sommerzeit wird rausgerechnet
                const gmt = splitVal(intTimeConvert(data.hourly[i].dt) + '', ' ', 5);

                if (gmt === 'GMT+0200') {
                    timeMinusSummertime = timeSubstract;
                } else {
                    timeMinusSummertime = 0;
                }
                hour = splitVal(
                    intTimeConvert(data.hourly[i].dt + timezoneOffset - timeMinusSummertime) + '',
                    ' ',
                    4,
                );
                hour = splitVal(hour, ':', 0);

                nextUVIndex = data.hourly[i].uvi;

                if (uvIndexisCritical === true && nextUVIndex < 3) {
                    uvIndexisCritical = false;
                    uvIndexIsCriticalUntil = `${hour} Uhr`;
                    document.getElementById("outUvIndx").innerHTML = document.getElementById("outUvIndx").innerHTML + ` bis ${uvIndexIsCriticalUntil}`;
                }

                index = `hourOutp${i}`;
                document.getElementById(index).innerHTML = `${hour} Uhr`;
                index = `hourOutpPlus${i}`;
                document.getElementById(index).innerHTML = `${temp}°C`;
                document.getElementById(index).style.color = 'white';
                imgSrc = `https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/widgets/${weatherIcon}.png`;
                index = `hourForecastImg${i}`;
                document.getElementById(index).src = imgSrc;
            }

            //?####################################################################################################
            // Vorausgestellte For Schleife um die absolute tiefst und höchst temp der kommenden 5 Tage zu ermitteln
            let deepestTemp = 100;
            let highestTemp = -50;
            for (let i = 0; i <= 6; i++) {
                const compareDeepestTemp = parseInt(data.daily[i + 1].temp.min);
                const compareHighestTemp = parseInt(data.daily[i + 1].temp.max);
                if (compareDeepestTemp < deepestTemp) {
                    deepestTemp = compareDeepestTemp;
                }
                if (compareHighestTemp > highestTemp) {
                    highestTemp = compareHighestTemp;
                }
            }

            //?####################################################################################################
            // Forecast Tage Felder mit Inhalt befüllen
            for (let i = 0; i <= 6; i++) {
                index = `forecastBlock${i}`;
                // Checkt, ob es morgen wärmer oder kühler wird
                if (i === 0) {
                    const tempDiffToday_Tomorrow = (data.daily[i + 1].temp.max - data.daily[i].temp.max).toFixed(1);
                    const lblTempDiff = document.getElementById("outpTempDiff");
                    const maxTomorrow = data.daily[i + 1].temp.max;
                    //const tomorrowWeatherTrend = data.daily[i + 1].weather[0].description;
                    const tomorrowWeatherTrendRaw = data.daily[i + 1].summary;
                    let tomorrowWeatherTrend = '';
                    if (tempDiffToday_Tomorrow >= 1) {
                        lblTempDiff.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-thermometer-half" viewBox="0 0 16 16">
  <path d="M9.5 12.5a1.5 1.5 0 1 1-2-1.415V6.5a.5.5 0 0 1 1 0v4.585a1.5 1.5 0 0 1 1 1.415"/>
  <path d="M5.5 2.5a2.5 2.5 0 0 1 5 0v7.55a3.5 3.5 0 1 1-5 0zM8 1a1.5 1.5 0 0 0-1.5 1.5v7.987l-.167.15a2.5 2.5 0 1 0 3.333 0l-.166-.15V2.5A1.5 1.5 0 0 0 8 1"/>
</svg> Morgen wird es ca. ${parseInt(tempDiffToday_Tomorrow)}°C wärmer, mit einer maximalen Temperatur von ${parseInt(maxTomorrow)}°C`;
                    } else if (tempDiffToday_Tomorrow <= -1) {
                        lblTempDiff.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-thermometer-half" viewBox="0 0 16 16">
  <path d="M9.5 12.5a1.5 1.5 0 1 1-2-1.415V6.5a.5.5 0 0 1 1 0v4.585a1.5 1.5 0 0 1 1 1.415"/>
  <path d="M5.5 2.5a2.5 2.5 0 0 1 5 0v7.55a3.5 3.5 0 1 1-5 0zM8 1a1.5 1.5 0 0 0-1.5 1.5v7.987l-.167.15a2.5 2.5 0 1 0 3.333 0l-.166-.15V2.5A1.5 1.5 0 0 0 8 1"/>
</svg> Morgen kühlt es um ${parseInt(tempDiffToday_Tomorrow)}°C, auf eine maximale Temperatur von ${parseInt(maxTomorrow)}°C ab.`;
                    } else {
                        lblTempDiff.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-thermometer-half" viewBox="0 0 16 16">
  <path d="M9.5 12.5a1.5 1.5 0 1 1-2-1.415V6.5a.5.5 0 0 1 1 0v4.585a1.5 1.5 0 0 1 1 1.415"/>
  <path d="M5.5 2.5a2.5 2.5 0 0 1 5 0v7.55a3.5 3.5 0 1 1-5 0zM8 1a1.5 1.5 0 0 0-1.5 1.5v7.987l-.167.15a2.5 2.5 0 1 0 3.333 0l-.166-.15V2.5A1.5 1.5 0 0 0 8 1"/>
</svg> Die Temperatur bleibt morgen stabil. Die maximale Temperatur wird in etwa ${parseInt(maxTomorrow)}°C betragen.`;
                    }
                    fetchTranslation('en', 'de', tomorrowWeatherTrendRaw)
                        .then(translation => {
                            tomorrowWeatherTrend = translation[0][0][0];
                            document.getElementById("outputWeatherTrend").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-sun" viewBox="0 0 16 16">
                        <path d="M7 8a3.5 3.5 0 0 1 3.5 3.555.5.5 0 0 0 .624.492A1.503 1.503 0 0 1 13 13.5a1.5 1.5 0 0 1-1.5 1.5H3a2 2 0 1 1 .1-3.998.5.5 0 0 0 .51-.375A3.5 3.5 0 0 1 7 8m4.473 3a4.5 4.5 0 0 0-8.72-.99A3 3 0 0 0 3 16h8.5a2.5 2.5 0 0 0 0-5z"/>
                        <path d="M10.5 1.5a.5.5 0 0 0-1 0v1a.5.5 0 0 0 1 0zm3.743 1.964a.5.5 0 1 0-.707-.707l-.708.707a.5.5 0 0 0 .708.708zm-7.779-.707a.5.5 0 0 0-.707.707l.707.708a.5.5 0 1 0 .708-.708zm1.734 3.374a2 2 0 1 1 3.296 2.198q.3.423.516.898a3 3 0 1 0-4.84-3.225q.529.017 1.028.129m4.484 4.074c.6.215 1.125.59 1.522 1.072a.5.5 0 0 0 .039-.742l-.707-.707a.5.5 0 0 0-.854.377M14.5 6.5a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1z"/>
                      </svg> Das Wetter morgen: ${tomorrowWeatherTrend}.`;
                        })
                        .catch(error => {
                            console.error("Translation error:", error);
                        });


                }

                document.getElementById(index).hidden = false;

                tempMin = parseInt(data.daily[i + 1].temp.min);
                tempMax = parseInt(data.daily[i + 1].temp.max);

                const margin_Bottom = deepestTemp + tempMin;
                const margin_Top = highestTemp - tempMax;


                //?####################################################################################################
                // erzeugt Balken für Temperatur
                const balken = document.getElementById(`tempDay${i}`);
                balken.style.height = `${tempMax + 20}px`;
                balken.style.marginBottom = `${margin_Bottom}px`;
                balken.style.marginTop = `${margin_Top}px`;



                weatherIcon = data.daily[i + 1].weather[0].icon;
                weekDay = splitVal(
                    intTimeConvert(data.daily[i + 1].dt) + '',
                    ' ',
                    0,
                );

                const date_day = splitVal(
                    intTimeConvert(data.daily[i + 1].dt) + '',
                    ' ',
                    2,
                );

                index = `outDayDate${i}`;
                document.getElementById(index).innerHTML = `${date_day}.`;
                weekDay = getDate(weekDay);
                index = `outpDay${i}`;
                document.getElementById(index).innerHTML = weekDay;
                index = `outpDayPlus${i}`;
                const viewport_width = window.innerWidth;
                if (viewport_width > 600) {
                    document.getElementById(index).innerHTML = `${tempMin}°C / ${tempMax}°C`;
                } else {
                    document.getElementById(index).innerHTML = `${tempMin}°C-${tempMax}°C`;
                }
                imgSrc = `https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/widgets/${weatherIcon}.png`;
                index = `foreCastImg${i}`;
                document.getElementById(index).src = imgSrc;

            }



            //?####################################################################################################
            //* Bei Geolocation
            //* Um mehrfachen Request zu vermeiden setTimeout
            if (isCurrentLocation === true) {
                isCurrentLocation = false;
                setTimeout(() => {
                    open_current_Location_requested = false;
                }, 5000);
            }

            setTimeout(() => {
                loadMap(lat, lon)
            }, 2000);

            setTimeout(() => {
                show_today_summary(data);
            }, 2000);

        })
        .catch((error) => {
            console.log(`Forecast Err: ${error}`);
        });

}

//?####################################################################################################
// Weather Data functions
//?####################################################################################################
// Mondphase
function get_MoonData(data) {
    const moonphaseToday = data.daily[0].moon_phase;
    const moonphaseTomorrow = data.daily[1].moon_phase;
    let moonPhaseTrend = '';
    if (moonphaseToday < moonphaseTomorrow) {
        moonPhaseTrend = 'zunehmend';
    } else {
        moonPhaseTrend = 'abnehmend';
    }

    // document.getElementById("outpMoonPhase").innerHTML = `${moonPhaseTrend}`
    document.getElementById("outpMoonRise").innerHTML = `${rawDatetime_in_Time(data.daily[0].moonrise)}`;
    document.getElementById("outpMoonSet").innerHTML = `${rawDatetime_in_Time(data.daily[0].moonset)}`;
}

//?####################################################################################################
// Rain
function get_RainData(data) {
    //###################################
    // Regen
    let rain = 0;
    let snow = 0;
    let tomorrowRain = 0;
    let tomorrowSnow = 0;
    let today_uv_index = 0.0;
    let tomorrow_uv_index = 0.0;
    let tomorrow_dewPoint = 0;
    let tomorrow_temp = 0;

    try {
        today_uv_index = data.daily[0].uvi;
        tomorrow_uv_index = data.daily[1].uvi;

        if (today_uv_index < tomorrow_uv_index) {
            outputUVMaxIndex.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-brightness-high-fill" viewBox="0 0 16 16">
            <path d="M12 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/>
          </svg> Der UV Index wird morgen stärker sein als heute. Maximalwert: ${tomorrow_uv_index}.`;
        } else {
            outputUVMaxIndex.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-brightness-high-fill" viewBox="0 0 16 16">
            <path d="M12 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/>
          </svg> Morgen wird der UV Wert schwächer. Maximal: ${tomorrow_uv_index}.`;
        }
    } catch (error) {
        console.log(error);
    }
    try {
        tomorrow_dewPoint = data.daily[1].dew_point.toFixed(0);
        tomorrow_temp = data.daily[1].temp.eve.toFixed(0);
        if (tomorrow_dewPoint > 16 && tomorrow_temp > 20) {
            outputDewPoint.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-moisture" viewBox="0 0 16 16">
                    <path d="M13.5 0a.5.5 0 0 0 0 1H15v2.75h-.5a.5.5 0 0 0 0 1h.5V7.5h-1.5a.5.5 0 0 0 0 1H15v2.75h-.5a.5.5 0 0 0 0 1h.5V15h-1.5a.5.5 0 0 0 0 1h2a.5.5 0 0 0 .5-.5V.5a.5.5 0 0 0-.5-.5zM7 1.5l.364-.343a.5.5 0 0 0-.728 0l-.002.002-.006.007-.022.023-.08.088a29 29 0 0 0-1.274 1.517c-.769.983-1.714 2.325-2.385 3.727C2.368 7.564 2 8.682 2 9.733 2 12.614 4.212 15 7 15s5-2.386 5-5.267c0-1.05-.368-2.169-.867-3.212-.671-1.402-1.616-2.744-2.385-3.727a29 29 0 0 0-1.354-1.605l-.022-.023-.006-.007-.002-.001zm0 0-.364-.343zm-.016.766L7 2.247l.016.019c.24.274.572.667.944 1.144.611.781 1.32 1.776 1.901 2.827H4.14c.58-1.051 1.29-2.046 1.9-2.827.373-.477.706-.87.945-1.144zM3 9.733c0-.755.244-1.612.638-2.496h6.724c.395.884.638 1.741.638 2.496C11 12.117 9.182 14 7 14s-4-1.883-4-4.267"/>
                  </svg>  Morgen liegt der Taupunkt bei ${tomorrow_dewPoint}°C. </br> Die Luft wird morgen feucht warm sein (Drückend).`
        } else {
            outputDewPoint.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-moisture" viewBox="0 0 16 16">
                    <path d="M13.5 0a.5.5 0 0 0 0 1H15v2.75h-.5a.5.5 0 0 0 0 1h.5V7.5h-1.5a.5.5 0 0 0 0 1H15v2.75h-.5a.5.5 0 0 0 0 1h.5V15h-1.5a.5.5 0 0 0 0 1h2a.5.5 0 0 0 .5-.5V.5a.5.5 0 0 0-.5-.5zM7 1.5l.364-.343a.5.5 0 0 0-.728 0l-.002.002-.006.007-.022.023-.08.088a29 29 0 0 0-1.274 1.517c-.769.983-1.714 2.325-2.385 3.727C2.368 7.564 2 8.682 2 9.733 2 12.614 4.212 15 7 15s5-2.386 5-5.267c0-1.05-.368-2.169-.867-3.212-.671-1.402-1.616-2.744-2.385-3.727a29 29 0 0 0-1.354-1.605l-.022-.023-.006-.007-.002-.001zm0 0-.364-.343zm-.016.766L7 2.247l.016.019c.24.274.572.667.944 1.144.611.781 1.32 1.776 1.901 2.827H4.14c.58-1.051 1.29-2.046 1.9-2.827.373-.477.706-.87.945-1.144zM3 9.733c0-.755.244-1.612.638-2.496h6.724c.395.884.638 1.741.638 2.496C11 12.117 9.182 14 7 14s-4-1.883-4-4.267"/>
                  </svg>  Morgen liegt der Taupunkt bei ${tomorrow_dewPoint}°C.`
        }
    } catch (error) {

    }
    try {
        rain = data.daily[0].rain;
        tomorrowRain = data.daily[1].rain;
        if (rain === undefined) {
            rain = 0;
        }
        if (tomorrowRain === undefined) {
            tomorrowRain = 0;
        }
    } catch (error) {
        console.log('RainError', error);
    }
    try {
        snow = data.daily[0].snow;
        tomorrowSnow = data.daily[1].snow;
        if (snow === undefined) {
            snow = 0;
        }
        if (tomorrowSnow === undefined) {
            tomorrowSnow = 0;
        }
    } catch (error) {
        console.log('SnowError', error);
    }
    document.getElementById("outpRain").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-umbrella" viewBox="0 0 16 16">
    <path d="M8 0a.5.5 0 0 1 .5.5v.514C12.625 1.238 16 4.22 16 8c0 0 0 .5-.5.5-.149 0-.352-.145-.352-.145l-.004-.004-.025-.023a3.5 3.5 0 0 0-.555-.394A3.17 3.17 0 0 0 13 7.5c-.638 0-1.178.213-1.564.434a3.5 3.5 0 0 0-.555.394l-.025.023-.003.003s-.204.146-.353.146-.352-.145-.352-.145l-.004-.004-.025-.023a3.5 3.5 0 0 0-.555-.394 3.3 3.3 0 0 0-1.064-.39V13.5H8h.5v.039l-.005.083a3 3 0 0 1-.298 1.102 2.26 2.26 0 0 1-.763.88C7.06 15.851 6.587 16 6 16s-1.061-.148-1.434-.396a2.26 2.26 0 0 1-.763-.88 3 3 0 0 1-.302-1.185v-.025l-.001-.009v-.003s0-.002.5-.002h-.5V13a.5.5 0 0 1 1 0v.506l.003.044a2 2 0 0 0 .195.726c.095.191.23.367.423.495.19.127.466.229.879.229s.689-.102.879-.229c.193-.128.328-.304.424-.495a2 2 0 0 0 .197-.77V7.544a3.3 3.3 0 0 0-1.064.39 3.5 3.5 0 0 0-.58.417l-.004.004S5.65 8.5 5.5 8.5s-.352-.145-.352-.145l-.004-.004a3.5 3.5 0 0 0-.58-.417A3.17 3.17 0 0 0 3 7.5c-.638 0-1.177.213-1.564.434a3.5 3.5 0 0 0-.58.417l-.004.004S.65 8.5.5 8.5C0 8.5 0 8 0 8c0-3.78 3.375-6.762 7.5-6.986V.5A.5.5 0 0 1 8 0M6.577 2.123c-2.833.5-4.99 2.458-5.474 4.854A4.1 4.1 0 0 1 3 6.5c.806 0 1.48.25 1.962.511a9.7 9.7 0 0 1 .344-2.358c.242-.868.64-1.765 1.271-2.53m-.615 4.93A4.16 4.16 0 0 1 8 6.5a4.16 4.16 0 0 1 2.038.553 8.7 8.7 0 0 0-.307-2.13C9.434 3.858 8.898 2.83 8 2.117c-.898.712-1.434 1.74-1.731 2.804a8.7 8.7 0 0 0-.307 2.131zm3.46-4.93c.631.765 1.03 1.662 1.272 2.53.233.833.328 1.66.344 2.358A4.14 4.14 0 0 1 13 6.5c.77 0 1.42.23 1.897.477-.484-2.396-2.641-4.355-5.474-4.854z"/>
  </svg> ${rain} mm`;
    document.getElementById('niedrschl').innerHTML = '<strong>Regen</strong>';
    if (snow > 0) {
        document.getElementById('niedrschl').innerHTML = '<strong>Schnee</strong>';
        document.getElementById("outpRain").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-snow" viewBox="0 0 16 16">
        <path d="M8 16a.5.5 0 0 1-.5-.5v-1.293l-.646.647a.5.5 0 0 1-.707-.708L7.5 12.793V8.866l-3.4 1.963-.496 1.85a.5.5 0 1 1-.966-.26l.237-.882-1.12.646a.5.5 0 0 1-.5-.866l1.12-.646-.884-.237a.5.5 0 1 1 .26-.966l1.848.495L7 8 3.6 6.037l-1.85.495a.5.5 0 0 1-.258-.966l.883-.237-1.12-.646a.5.5 0 1 1 .5-.866l1.12.646-.237-.883a.5.5 0 1 1 .966-.258l.495 1.849L7.5 7.134V3.207L6.147 1.854a.5.5 0 1 1 .707-.708l.646.647V.5a.5.5 0 1 1 1 0v1.293l.647-.647a.5.5 0 1 1 .707.708L8.5 3.207v3.927l3.4-1.963.496-1.85a.5.5 0 1 1 .966.26l-.236.882 1.12-.646a.5.5 0 0 1 .5.866l-1.12.646.883.237a.5.5 0 1 1-.26.966l-1.848-.495L9 8l3.4 1.963 1.849-.495a.5.5 0 0 1 .259.966l-.883.237 1.12.646a.5.5 0 0 1-.5.866l-1.12-.646.236.883a.5.5 0 1 1-.966.258l-.495-1.849-3.4-1.963v3.927l1.353 1.353a.5.5 0 0 1-.707.708l-.647-.647V15.5a.5.5 0 0 1-.5.5z"/>
      </svg> ${snow} mm`;
    }

    if (tomorrowRain === 0 && tomorrowSnow === 0) {
        document.getElementById("outputRainTomorrow").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-brightness-high-fill" viewBox="0 0 16 16">
        <path d="M12 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/>
      </svg> Es bleibt morgen trocken.`;
    } else if (tomorrowRain > 0) {
        document.getElementById("outputRainTomorrow").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-umbrella" viewBox="0 0 16 16">
        <path d="M8 0a.5.5 0 0 1 .5.5v.514C12.625 1.238 16 4.22 16 8c0 0 0 .5-.5.5-.149 0-.352-.145-.352-.145l-.004-.004-.025-.023a3.5 3.5 0 0 0-.555-.394A3.17 3.17 0 0 0 13 7.5c-.638 0-1.178.213-1.564.434a3.5 3.5 0 0 0-.555.394l-.025.023-.003.003s-.204.146-.353.146-.352-.145-.352-.145l-.004-.004-.025-.023a3.5 3.5 0 0 0-.555-.394 3.3 3.3 0 0 0-1.064-.39V13.5H8h.5v.039l-.005.083a3 3 0 0 1-.298 1.102 2.26 2.26 0 0 1-.763.88C7.06 15.851 6.587 16 6 16s-1.061-.148-1.434-.396a2.26 2.26 0 0 1-.763-.88 3 3 0 0 1-.302-1.185v-.025l-.001-.009v-.003s0-.002.5-.002h-.5V13a.5.5 0 0 1 1 0v.506l.003.044a2 2 0 0 0 .195.726c.095.191.23.367.423.495.19.127.466.229.879.229s.689-.102.879-.229c.193-.128.328-.304.424-.495a2 2 0 0 0 .197-.77V7.544a3.3 3.3 0 0 0-1.064.39 3.5 3.5 0 0 0-.58.417l-.004.004S5.65 8.5 5.5 8.5s-.352-.145-.352-.145l-.004-.004a3.5 3.5 0 0 0-.58-.417A3.17 3.17 0 0 0 3 7.5c-.638 0-1.177.213-1.564.434a3.5 3.5 0 0 0-.58.417l-.004.004S.65 8.5.5 8.5C0 8.5 0 8 0 8c0-3.78 3.375-6.762 7.5-6.986V.5A.5.5 0 0 1 8 0M6.577 2.123c-2.833.5-4.99 2.458-5.474 4.854A4.1 4.1 0 0 1 3 6.5c.806 0 1.48.25 1.962.511a9.7 9.7 0 0 1 .344-2.358c.242-.868.64-1.765 1.271-2.53m-.615 4.93A4.16 4.16 0 0 1 8 6.5a4.16 4.16 0 0 1 2.038.553 8.7 8.7 0 0 0-.307-2.13C9.434 3.858 8.898 2.83 8 2.117c-.898.712-1.434 1.74-1.731 2.804a8.7 8.7 0 0 0-.307 2.131zm3.46-4.93c.631.765 1.03 1.662 1.272 2.53.233.833.328 1.66.344 2.358A4.14 4.14 0 0 1 13 6.5c.77 0 1.42.23 1.897.477-.484-2.396-2.641-4.355-5.474-4.854z"/>
      </svg> Im laufe des Tages werden ${tomorrowRain} mm Regen erwartet.`;
    } else if (tomorrowSnow > 0) {
        document.getElementById("outputRainTomorrow").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-snow" viewBox="0 0 16 16">
        <path d="M8 16a.5.5 0 0 1-.5-.5v-1.293l-.646.647a.5.5 0 0 1-.707-.708L7.5 12.793V8.866l-3.4 1.963-.496 1.85a.5.5 0 1 1-.966-.26l.237-.882-1.12.646a.5.5 0 0 1-.5-.866l1.12-.646-.884-.237a.5.5 0 1 1 .26-.966l1.848.495L7 8 3.6 6.037l-1.85.495a.5.5 0 0 1-.258-.966l.883-.237-1.12-.646a.5.5 0 1 1 .5-.866l1.12.646-.237-.883a.5.5 0 1 1 .966-.258l.495 1.849L7.5 7.134V3.207L6.147 1.854a.5.5 0 1 1 .707-.708l.646.647V.5a.5.5 0 1 1 1 0v1.293l.647-.647a.5.5 0 1 1 .707.708L8.5 3.207v3.927l3.4-1.963.496-1.85a.5.5 0 1 1 .966.26l-.236.882 1.12-.646a.5.5 0 0 1 .5.866l-1.12.646.883.237a.5.5 0 1 1-.26.966l-1.848-.495L9 8l3.4 1.963 1.849-.495a.5.5 0 0 1 .259.966l-.883.237 1.12.646a.5.5 0 0 1-.5.866l-1.12-.646.236.883a.5.5 0 1 1-.966.258l-.495-1.849-3.4-1.963v3.927l1.353 1.353a.5.5 0 0 1-.707.708l-.647-.647V15.5a.5.5 0 0 1-.5.5z"/>
      </svg> Im laufe des Tages werden ${tomorrowSnow} mm Schnee erwartet.`;
    }

}

//?####################################################################################################
// UV Index Interpretation
function inerpreteUvIndex(uvindex) {
    let instruction = '';
    const lbl_UvIndex = document.getElementById("outUvIndx");
    const max_UV = 12;
    const uv_in_percent = uvindex * 100 / max_UV;
    const progressValue_UV = document.getElementById("progress_UV");

    //progressValue_UV.value = uvindex;
    progressValue_UV.value = uv_in_percent;

    if (uvindex > 11) {
        instruction = 'EXTREM - Sonne meiden';
        uvIndexisCritical = true;
        lbl_UvIndex.style.color = 'red';
    } else if (uvindex >= 8 && uvindex < 11) {
        instruction = 'SEHR HOCH - Schutz absolut notwendig';
        uvIndexisCritical = true;
        lbl_UvIndex.style.color = 'red';
    } else if (uvindex >= 6 && uvindex < 8) {
        instruction = 'HOCH - Schutz erforderlich';
        uvIndexisCritical = true;
        lbl_UvIndex.style.color = 'orange';
    } else if (uvindex >= 3 && uvindex < 6) {
        instruction = 'MITTEL - Schutz erforderlich';
        uvIndexisCritical = true;
        lbl_UvIndex.style.color = 'yellow';
    } else if (uvindex >= 0 && uvindex < 3) {
        instruction = 'NIEDRIG - Kein Schutz erforderlich';
        lbl_UvIndex.style.color = 'white';
    }
    return instruction;
}

//?####################################################################################################

// Wandelt die Zeit um
function intTimeConvert(num) {
    let dte = new Date(num * 1000);
    return dte;
}

//?####################################################################################################
// Auswertung z.B farbliche Änderung bei Temperaturen und Tag / Nacht anzeige
function ausw(param_current_Temp) {
    //?####################################################################################################
    // Temperatur
    if (param_current_Temp >= 32) {
        document.getElementById('outpTemp').style.textShadow = '0px 0px 15px red';
    } else if (param_current_Temp >= 30) {
        document.getElementById('outpTemp').style.textShadow = '0px 0px 15px orange';
    } else if (param_current_Temp >= 25) {
        document.getElementById('outpTemp').style.textShadow = '0px 0px 15px yellow';
    } else if (param_current_Temp > 10) {
        document.getElementById('outpTemp').style.textShadow = '0px 0px 4px white';
    } else {
        document.getElementById('outpTemp').style.textShadow = '0px 0px 15px aqua';
    }
    //?####################################################################################################
    // Tag / Nacht
    if (iconVal === 'n') {
        document.getElementById('weatherCard').style.backgroundColor = 'rgba(0,0,100,0.600';
        // document.getElementById("weatherimg").style.boxShadow = '0px 0px 10px rgba(255,255,255,0.4)';
        // weatherContainer.style.backgroundImage = "url('img/night.jpeg')";
    } else {
        document.getElementById('weatherCard').style.backgroundColor = 'rgba(29, 28, 28, 0.247)';
        // document.getElementById("weatherimg").style.boxShadow = '0px 0px 20px rgba(255,255,255,1), inset 0 0 15px white';
        // weatherContainer.style.backgroundImage = "url('img/Sun.jpg')";
    }

    //?####################################################################################################
    //? Wetter Hintergrundbild
    //? Klarer Himmel
    if (iconValRaw === '01d' || iconValRaw === '01n') {
        // weatherContainer.style.backgroundImage = "url('img/Sun.jpg')";
        document.getElementById("weatherimg").style.width = '270px';
        document.getElementById("weatherimg").style.top = '-25px';
    }
    // if (iconValRaw === '01n') {
    //     // weatherContainer.style.backgroundImage = "url('img/night.jpeg')";
    // }

    // //? Regen
    // if (iconValRaw === '10d' || iconValRaw === '09d') {
    //     weatherContainer.style.backgroundImage = "url('img/Rain.jpeg')";
    // }
    // if (iconValRaw === '10n' || iconValRaw === '09n') {
    //     weatherContainer.style.backgroundImage = "url('img/Rain.jpeg')";
    // }

    // //? Schnee
    // if (iconValRaw === '13d') {
    //     weatherContainer.style.backgroundImage = "url('img/Snow.jpeg')";
    // }
    // if (iconValRaw === '13n') {
    //     weatherContainer.style.backgroundImage = "url('img/Snow.jpeg')";
    // }

    //     //? Gewitter
    // if (iconValRaw === '11d') {
    //     weatherContainer.style.backgroundImage = "url('img/Lightning.jpeg')";
    // }
    // if (iconValRaw === '11n') {
    //     weatherContainer.style.backgroundImage = "url('img/Lightning.jpeg')";
    // }

    // //? Bewölkt
    // if (iconValRaw === '04d' || iconValRaw === '03d') {
    //     weatherContainer.style.backgroundImage = "url('img/Clouds.jpeg')";
    // }
    // if (iconValRaw === '04n' || iconValRaw === '03n') {
    //     weatherContainer.style.backgroundImage = "url('img/Clouds.jpeg')";
    // }

}

//?####################################################################################################
// Lädt die zuerst abgespeicherte Stadt
function loadData() {
    ky = dcrK(ak, 3);
    setAppearance('opt_normalmode');
    reset_Col();
    loadSpinner()
    setTimeout(() => {
        if (localStorage.getItem('stored_CityList') != null) {
            cityList = JSON.parse(localStorage.getItem('stored_CityList'));
            address = cityList[0];
            getAddressCoordinates(address);
            showSavedCitys();
            currentLocationButton.hidden = false;
        } else {
            // Keine Einträge vorhanden
            weatherContainer.style.display = 'none';
            cityContainer.style.display = 'none';
            loadMap(51.162290, 6.462739);
        }
    }, 1500);


    if (localStorage.getItem('stored_WeatherSettings') != null) {
        weatherSettings = JSON.parse(localStorage.getItem('stored_WeatherSettings'));
        try {
            setAppearance(`${weatherSettings.appeareanceMode}`);
            document.getElementById('settingsAppearance').value = weatherSettings.appeareanceMode;
        } catch (error) {
            setAppearance('opt_normalmode');
        }
    } else {
        setAppearance('opt_normalmode');
    }
}

//?####################################################################################################
// Zeigt abgespeicherte Städte an
function showSavedCitys() {
    document.getElementById('outCitys').innerHTML = '';
    for (let i = 0; i < cityList.length; i++) {
        const cty = cityList[i];
        const btn = document.createElement('button');
        btn.appendChild(document.createTextNode(cty));
        btn.onclick = getCity;

        let ul = document.getElementById('outCitys');
        ul.appendChild(btn);
        cityContainer.classList.remove('acitve');
    }
}

//?####################################################################################################
//* Speichert eine Stadt in den localStorage
function saveCity() {
    localStorage.setItem('stored_CityList', JSON.stringify(cityList));
}

function saveSettings() {
    localStorage.setItem('stored_WeatherSettings', JSON.stringify(weatherSettings));
}

//?####################################################################################################
// Fügt die Stadt in die Liste der Städte hinzu, nach Überprüfung, ob diese bereits vorhanden ist
function addCity() {
    if (address != '') {
        if (cityList.includes(address)) {
            createNotification(
                `"${address}" hast du bereits abgespeichert!`,
                'warning',
                3000
            );
        } else {
            if (address != '') {
                cityList.push(address);
                saveCity();
                createNotification(`${address} wurde gespeichert`, 'success', 3000);
                showSavedCitys();
            }
        }
    }
}

//?####################################################################################################
// Ausgewählte Stadt anzeigen
function getCity() {
    weatherContainer.style.display = 'flex';
    typeSelect.value = 'opt_temp';
    window.scrollTo(0, 0);
    address = this.innerText;
    getAddressCoordinates(address);
    cityContainer.classList.remove('active');
}

//?####################################################################################################
// Lösche die Stadt, falls in der Liste vorhanden
function delCity() {
    if (address != '') {
        if (cityList.includes(address)) {
            const confirm = window.confirm(
                `Möchtest du die Stadt "${address}" wirklich aus Deiner Liste entfernen?`,
            );
            if (confirm) {
                for (let i = 0; i < cityList.length; i++) {
                    if (address === cityList[i]) {
                        cityList.splice(i, 1);
                        saveCity();
                        location.reload();
                    }
                }
            }
        }
    }
}

function getDate(weekDay) {
    let day = '';
    switch (weekDay) {
        case 'Sun':
            day = 'So';
            break;
        case 'Mon':
            day = 'Mo';
            break;
        case 'Tue':
            day = 'Di';
            break;
        case 'Wed':
            day = 'Mi';
            break;
        case 'Thu':
            day = 'Do';
            break;
        case 'Fri':
            day = 'Fr';
            break;
        case 'Sat':
            day = 'Sa';
            break;
        default:
            day = '-';
            break;
    }
    return day;
}

//?####################################################################################################
// Funktion, welche ein Uhrzeit extrahiert. In Berücksichtigung der Zeitzohne
function rawDatetime_in_Time(rawDatetime) {
    const raw = intTimeConvert(rawDatetime + timezoneOffset - timeSubstract);
    const time = splitVal(raw + '', " ", 4);
    const pureTime = `${splitVal(time + '', ":", 0)}:${splitVal(time + '', ":", 1)}`;
    return pureTime;
}

function splitVal(val, marker, pos) {
    const elem = val.split(marker);
    const retVal = elem[pos];
    return retVal;
}

//?####################################################################################################
//* Geolocation
function getCurrentLocation() {
    if (open_current_Location_requested === false) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
            open_current_Location_requested = true;
            createNotification(`Mein Standort wird geladen`, 'info', 3000);
        } else {
            createNotification('Geolocation ist nicht verfügbar', 'alert', 3000);
            isCurrentLocation = false;
            open_current_Location_requested = false;
        }
    } else {
        createNotification('Lokales Wetter wird bereits angefragt', 'alert', 5000);
    }
}

function showPosition(position) {
    const lat = position.coords.latitude.toFixed(1);
    const lon = position.coords.longitude.toFixed(1);
    isCurrentLocation = true;
    ortLabel.innerHTML = 'Mein Standort';
    requestWeatherForecast(lat, lon);
}

//?####################################################################################################
// Toast Notification
function createNotification(message, messageType, showTime) {
    // Erstelle Div
    const notifi = document.createElement('div');
    // Füge Klasse hinzu
    notifi.classList.add('toast'); // Messagebox
    notifi.classList.add(messageType); // Messagetypes: alert, info, modal, warning, success
    // Textmessage hinzufügen
    notifi.innerText = message;
    // Dem Toastcontainer das erstelle Toast hinzufügen
    toasts.appendChild(notifi);

    // Nachricht nach festgelegter Zeit wieder entfernen
    setTimeout(() => {
        notifi.remove();
    }, showTime);
}

//?####################################################################################################
// Stadt markieren, diese wird bei Neustart zuerst geladen
function startCity() {
    const cityName = address;
    const arrIndex = cityList.indexOf(address);
    if (arrIndex === -1) {
        cityList.splice(0, 0, cityName);
    } else {
        cityList.splice(arrIndex, 1);
        cityList.splice(0, 0, cityName);
    }
    createNotification(`"${cityName}" wird nun immer beim Start angezeigt`, 'success', 2000);
    saveCity();
    showSavedCitys();
}

//?####################################################################################################
// sticky-top
window.addEventListener("scroll", () => {
    let scrollHeigth = Math.floor(window.pageYOffset)
    if (scrollHeigth > 100) {
        ortLabel.classList.add("sticky-top");
    } else {
        ortLabel.classList.remove("sticky-top");
    }
})

//?####################################################################################################
// Bei 24 Stunden Anzeige die Werte auf UV, Wind, Wetter etc ändern
function getWeathertype(selectObject) {
    const value = selectObject.value;
    changeWeatherType(value)
}


function changeWeatherType(type) {

    const savedData = JSON.parse(mainData)
    let timeMinusSummertime = 0;
    for (let i = 0; i <= 24; i++) {
        index = `hourForecastBlock${i}`;
        document.getElementById(index).hidden = false;
        document.getElementById(index).style.color = 'white';
        temp = parseInt(savedData.hourly[i].temp);
        weatherIcon = savedData.hourly[i].weather[0].icon;
        nextUVIndex = savedData.hourly[i].uvi;
        const nextHumidity = savedData.hourly[i].humidity;
        const nextDewPoint = savedData.hourly[i].dew_point.toFixed(0);
        const nextWind = savedData.hourly[i].wind_speed;
        const nextClouds = savedData.hourly[i].clouds;
        let nextRain = 0;
        if (savedData.hourly[i].rain) {
            nextRain = savedData.hourly[i].rain;
            nextRain = JSON.stringify(nextRain);
            nextRain = splitVal(nextRain + ' ', ':', 1)
            nextRain = splitVal(nextRain + ' ', '}', 0)

        }

        const windgesch = nextWind * 3.6;

        // ? Sommerzeit wird rausgerechnet
        const gmt = splitVal(intTimeConvert(savedData.hourly[i].dt) + '', ' ', 5);
        if (gmt === 'GMT+0200') {
            timeMinusSummertime = timeSubstract;
        } else {
            timeMinusSummertime = 0;
        }
        hour = splitVal(
            intTimeConvert(savedData.hourly[i].dt + timezoneOffset - timeMinusSummertime) + '',
            ' ',
            4,
        );
        hour = splitVal(hour, ':', 0);

        index = `hourOutp${i}`;
        document.getElementById(index).innerHTML = `${hour} Uhr`;
        index = `hourOutpPlus${i}`;
        document.getElementById(index).style.color = 'white';

        if (type === 'opt_uvindex') {
            document.getElementById(index).innerHTML = `${nextUVIndex}`;
            document.getElementById(index).classList.remove("active");
        }
        if (type === 'opt_temp') {
            document.getElementById(index).innerHTML = `${temp}°C`;
            document.getElementById(index).classList.remove("active");
        }
        if (type === 'opt_humidity') {
            document.getElementById(index).innerHTML = `${nextHumidity} %`;
            document.getElementById(index).classList.remove("active");
        }
        if (type === 'opt_dewPoint') {
            document.getElementById(index).innerHTML = `${nextDewPoint}°C`;
            if (nextDewPoint > 16 && temp > 20) {
                document.getElementById(index).style.color = 'orange'
            } else {
                document.getElementById(index).style.color = 'white';
            }
            document.getElementById(index).classList.remove("active");
        }

        if (type === 'opt_wind') {
            document.getElementById(index).innerHTML = `${windgesch.toFixed(0)} Km/h`;
            document.getElementById(index).classList.add("active");
        }
        if (type === 'opt_rain') {
            document.getElementById(index).innerHTML = `${nextRain}`;
            document.getElementById(index).classList.add("active");
        }
        if (type === 'opt_clouds') {
            document.getElementById(index).innerHTML = `${nextClouds}%`;
            document.getElementById(index).classList.add("active");
        }
        imgSrc = `https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/widgets/${weatherIcon}.png`;
        document.getElementById(index).src = imgSrc;
        index = `hourForecastImg${i}`;

    }
}

//?####################################################################################################
//?   Animation von Temp
let load = -50;
let intv = undefined;

function initUpcountingTemp(temperature) {
    load = -50;
    intv = setInterval(function () { countingUp(temperature); }, 17);
}

function countingUp(temperature) {
    load++;
    if (load === temperature) {
        clearInterval(intv);
        load = temperature;
    }
    tempLabel.innerText = `${load}°C`;
}


//?####################################################################################################
// Air Pollution
function getAirPollutionInfo(latitude, longitude) {
    const pollutionLink = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${ky}`;
    fetch(pollutionLink)
        .then((response) => response.json())
        .then((data) => {
            const airQualiBox = document.getElementById("airQualiBox");
            const airQualityList = ['/', 'SEHR GUT', 'GUT', 'MODERAT', 'SCHLECHT', 'SEHR SCHLECHT']
            const airQualityColor = ['transparent', 'green', 'rgba(144, 238, 144, 0.678)', 'rgba(255, 196, 0, 0.669)', 'rgba(180, 89, 9, 0.938)', 'red']
            const airQuality = data.list[0].main.aqi;
            document.getElementById("outpAirQuali").innerHTML = `${airQuality} - ${airQualityList[airQuality]}`;
            airQualiBox.style.backgroundColor = `${airQualityColor[airQuality]}`;

            infoBtn.classList.remove("active");
            airQualityInfoboxIsVisible = false;
            detailContainer.classList.remove("active");
            const no2 = data.list[0].components.no2;
            const o3 = data.list[0].components.o3;
            const pm2_5 = data.list[0].components.pm2_5;
            const pm10 = data.list[0].components.pm10;



            if (airQuality >= 3) {

                let pollutionArray = [];
                let infostring = '';

                if (no2 >= 100) {
                    pollutionArray.push(`Stickstoffdioxid: ${no2} (moderat ab 100) <br>`);
                }
                if (o3 >= 120) {
                    pollutionArray.push(`Ozon: ${o3} (moderat ab 120) <br>`);
                }
                if (pm2_5 >= 30) {
                    pollutionArray.push(`Feinstaub(pm2_5): ${pm2_5} (moderat ab 30) <br>`);
                }
                if (pm10 >= 50) {
                    pollutionArray.push(`Feinstaub(pm10): ${pm10} (moderat ab 50) <br>`);
                }

                for (let i = 0; i < pollutionArray.length; i++) {
                    infostring = infostring + pollutionArray[i];
                }


                infoBtn.classList.add("active");
                document.getElementById("detainTextAirQuality").innerHTML = infostring;
            }
        }).catch((error) => {
            //document.getElementById("errorlog").innerHTML = error + " | " + error.message;
        });
}

//?####################################################################################################
// Toggle Infobox & Alert
function toggleInfoBox() {

    if (airQualityInfoboxIsVisible === false) {
        detailContainer.classList.add("active");
        airQualityInfoboxIsVisible = true;
        infoBtn.innerHTML = 'Infos ausblenden';
    } else {
        detailContainer.classList.remove("active");
        airQualityInfoboxIsVisible = false;
        infoBtn.innerHTML = 'Mehr Infos';
    }
}


function toggleAlertBox() {

    if (alertInfoboxIsVisible === false) {
        alertDetailContainer.classList.add("active");
        alertInfoboxIsVisible = true;
        btnAlert.innerHTML = 'Infos ausblenden';
    } else {
        alertDetailContainer.classList.remove("active");
        alertInfoboxIsVisible = false;
        btnAlert.innerHTML = 'Mehr Infos';
    }
}

//?####################################################################################################
// Settings

btnSettings.addEventListener("click", () => {
    if (settingsAreVisible === false) {
        settingsAreVisible = true;
        settingWindow.classList.add("active");
    } else {
        settingsAreVisible = false;
        settingWindow.classList.remove("active");
    }
})


btnSaveSettings.addEventListener("click", () => {
    weatherSettings.appeareanceMode = settingsAppearance.value;
    saveSettings();
    settingsAreVisible = false;
    settingWindow.classList.remove("active");
    createNotification("Einstellungen wurden gespeichert", "success", 3000)
})

function changeAppearance(selectObject) {
    const value = selectObject.value;
    setAppearance(value);
}


function setAppearance(value) {
    if (value === 'opt_darkmode') {
        theBody.classList.remove("lightMode");
        theBody.classList.remove("normalMode");
        theBody.classList.remove("darkBlue");
        theBody.classList.remove("darkBlue2");
        theBody.classList.add("darkMode");
    }

    if (value === 'opt_normal') {
        theBody.classList.remove("darkMode");
        theBody.classList.remove("lightMode");
        theBody.classList.remove("darkBlue");
        theBody.classList.remove("darkBlue2");
        theBody.classList.add("normalMode");
    }

    if (value === 'opt_lightmode') {
        theBody.classList.remove("darkMode");
        theBody.classList.remove("normalMode");
        theBody.classList.remove("darkBlue");
        theBody.classList.remove("darkBlue2");
        theBody.classList.add("lightMode");

    }

    if (value === 'opt_darkBlue') {
        theBody.classList.remove("darkMode");
        theBody.classList.remove("normalMode");
        theBody.classList.remove("lightMode");
        theBody.classList.remove("darkBlue2");
        theBody.classList.add("darkBlue");
    }

    if (value === 'opt_darkBlue2') {
        theBody.classList.remove("darkMode");
        theBody.classList.remove("normalMode");
        theBody.classList.remove("lightMode");
        theBody.classList.remove("darkBlue");
        theBody.classList.add("darkBlue2");
    }

}


if (btn_scroll_up) {
    btn_scroll_up.addEventListener("click", () => {
        window.scroll(0, 0);
    })
}

window.addEventListener("scroll", (e) => {
    if (window.pageYOffset > 400) {
        btn_scroll_up.classList.add("active");
    } else {
        btn_scroll_up.classList.remove("active");
    }
})

function reset_Col() {
    for (let i = 0; i < 7; i++) {
        const balken = document.getElementById(`tempDay${i}`);
        balken.style.height = `0px`;
        balken.style.marginBottom = `0px`;
        balken.style.marginTop = `0px`;
    }
}

function loadSpinner() {
    const loadingDivs = document.querySelectorAll('.loading')
    loadingDivs.forEach((loadingdiv) => {
        loadingdiv.classList.add("active");
        // loadingdiv.innerHTML = '<div class="spinner-loader"><i class="fa-solid fa-cloud"></i></div>'
    })
}

function deleteSpinner() {
    const loadingDivs = document.querySelectorAll('.loading')
    loadingDivs.forEach((loadingdiv) => {
        loadingdiv.classList.remove("active");
    })
}

setInterval(() => {
    const windDeg_minus_20 = windDeg - 20;
    const winDeg_plus_20 = windDeg + 20;
    const randomDirection = parseInt(Math.random() * 2 + 1);
    if (randomDirection === 1) {
        document.getElementById("windDirect").style.transform = `rotate(${windDeg_minus_20}deg)`
    } else {
        document.getElementById("windDirect").style.transform = `rotate(${winDeg_plus_20}deg)`
    }
    setTimeout(() => {
        document.getElementById("windDirect").style.transform = `rotate(${windDeg}deg)`
    }, 1300);
}, 10000);


setInterval(() => {
    calc_time_to_next_sunevent();
}, 1000);

//* LINK - calc_time_to_next_sunevent wird sekündlich aufgerufen
function calc_time_to_next_sunevent() {
    if (sunEvent === 'night') {
        const current_timestamp = new Date();
        let current_unix_timestamp = parseInt((new Date(current_timestamp).getTime() / 1000).toFixed(0));
        current_unix_timestamp = current_unix_timestamp + timezoneOffset - timeSubstract;
        const correct_timestamp = intTimeConvert(current_unix_timestamp);
        const duration = minutesDiff(correct_timestamp, sunriseRaw);
        sun_event.innerHTML = `Sonne geht in ${duration} auf`;
        sun_event.classList.add('next-morning');
        sun_event.classList.remove('next-night');
    }

    if (sunEvent === 'evening') {
        const current_timestamp = new Date();
        let current_unix_timestamp = parseInt((new Date(current_timestamp).getTime() / 1000).toFixed(0));
        current_unix_timestamp = current_unix_timestamp + timezoneOffset - timeSubstract;
        const correct_timestamp = intTimeConvert(current_unix_timestamp);
        const duration = minutesDiff(correct_timestamp, next_sunrise);
        sun_event.innerHTML = `Sonne geht in ${duration} auf`;
        sun_event.classList.add('next-morning');
        sun_event.classList.remove('next-night');
    }

    if (sunEvent === 'day') {
        const current_timestamp = new Date();
        const duration = minutesDiff(current_timestamp, sunsetRaw);
        sun_event.innerHTML = `Sonne geht in ${duration} unter`;
        sun_event.classList.remove('next-morning');
        sun_event.classList.add('next-night');

    }
}

function minutesDiff(dateTimeValue2, dateTimeValue1) {
    var differenceValue = (dateTimeValue2.getTime() - dateTimeValue1.getTime()) / 1000;
    differenceValue /= 60;
    const rawMinuteTime = Math.abs(Math.round(differenceValue))
    const hour = Math.floor(rawMinuteTime / 60);
    const minutes = Math.floor(rawMinuteTime % 60);
    const time = `${add_zero(hour)}:${add_zero(minutes)}`;
    return time;
}

function add_zero(val) {
    if (val < 10) {
        val = `0${val}`;
    }
    return val;
}


btn_show_cityModal.addEventListener('click', () => {
    cityContainer.classList.add('active');
})

document.getElementById('btn_close_cityModal').addEventListener('click', () => {
    cityContainer.classList.remove('active');
})


//* ANCHOR Fetch request to translate text
//////////////////////////////
/**
 * 
 * @param { string } sourceLang - en
 * @param { string } targetLang - de
 * @param { string } sourceText - text
 * @returns string
 */
async function fetchTranslation(sourceLang, targetLang, sourceText) {
    const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" +
        sourceLang + "&tl=" + targetLang + "&dt=t&q=" + encodeURI(sourceText);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching translation:', error);
        return null;
    }
}




/////////////////////////////////////

const days = document.querySelectorAll('.day');
const active_forecast = document.getElementById('active_forecast');

days.forEach((day, index) => {
    day.addEventListener('click', () => {
        const savedData = JSON.parse(mainData);
        remove_all_forecast_details();
        const id = day.id;
        document.getElementById(id).style.background = '#0094ff'
        //* Show container and add content
        active_forecast.classList.add('active');
        // active_forecast.style.left = `${target_Pos}px`;
        const forc_desc = savedData.daily[index + 1].weather[0].description;
        let forc_rain = savedData.daily[index + 1].rain;
        if (forc_rain === undefined) {
            forc_rain = 0;
        }
        const forc_Uv = savedData.daily[index + 1].uvi;
        const forc_dewPointVal = savedData.daily[index + 1].dew_point.toFixed(0);
        let forc_dewPoint = '';
        console.log('forc_dewPoint', forc_dewPoint);
        if (forc_dewPointVal > 17) {
            forc_dewPoint = `Taupunkt: ${forc_dewPointVal}°C (feuchtwarme Luft)`
        } else {
            forc_dewPoint = `Taupunkt: ${forc_dewPointVal}°C`
        }

        let content = `
            <p>${forc_desc}</p>
            <p>Regen: ${forc_rain} mm</p>
            <p>UV: ${forc_Uv}</p>
            <p>${forc_dewPoint}</p>
            `
        active_forecast.innerHTML = content;
    })
})

function remove_all_forecast_details() {
    active_forecast.innerHTML = '';
    active_forecast.classList.remove('active');
    days.forEach((day) => {
        day.style.background = 'rgba(39, 42, 52, 0.637)'
    })
}

active_forecast.addEventListener('click', () => {
    remove_all_forecast_details();
})


function show_today_summary(data) {
    let summary_text = data.daily[0].summary
    fetchTranslation('en', 'de', summary_text)
        .then(translation => {
            summary_text = translation[0][0][0];
            todaySummaryContainer.style.opacity = '1'
            todaySummaryContainer.innerHTML = summary_text;
        })
        .catch(error => {
            console.error("Translation error:", error);
        });
}