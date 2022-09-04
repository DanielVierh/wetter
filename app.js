const ak = '142ebb880ba304df7*8a8867b2774e6e'
let temp = 0;
let cityCode = '';
let apiLink = '';
let cityList = [];
let ky = '';
let adress = '';
let timezone;
let iconVal;
let isCurrentLocation = false;
let uvIndexisCritical = false;
let uvIndexIsCriticalUntil= '';
let weatherType = 'opt_weather';
let mainData = [];
let meineKarte = L.map('karte').setView([51.162290, 6.462739], 2);

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
// Load
ky = dcrK(ak);
window.onload = loadData();

// Eingegebene Stadt suchen
function showWeather() {
    adress = searchField.value;
    if (adress.slice(-1) === ' ') {
        adress = adress.trimEnd();
    }
    weatherRequest();
    searchField.value = '';
}

// Wenn mit Enter gesucht wird
window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        showWeather();
    }
});

// Wetter Request
function weatherRequest() {
    if (adress != '') {
        if (isNaN(adress)) {
            apiLink = `https://api.openweathermap.org/data/2.5/weather?q=${adress}&appid=${ky}&lang=de&units=metric`;
        } else {
            apiLink = `https://api.openweathermap.org/data/2.5/weather?zip=${adress},de&APPID=${ky}&lang=de&units=metric`;
        }
        
        fetch(apiLink)
            .then((response) => response.json())
            .then((data) => {
                console.log(data);

                weatherContainer.style.display = 'flex';
                cityContainer.style.display = 'flex';
                isCurrentLocation = false;
                document.getElementById('errorLeiste').hidden = true;
                document.getElementById('btnAddCity').hidden = false;
                adress = data.name;
                ortLabel.innerHTML = adress;
                temp = parseInt(data.main.temp);
                //document.getElementById('outpTemp').innerHTML = `${temp}°C`;
                document.getElementById('outpTemp').innerHTML = `🌡`;
                setTimeout(() => {
                    initUpcountingTemp(temp);
                }, 1000);
                iconVal = data.weather[0].icon;
                iconVal = iconVal.slice(-1);
                const imgSrc = `https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/widgets/${data.weather[0].icon}.png`;
                document.getElementById('weatherimg').src = imgSrc;
                document.getElementById('outpWeather').innerHTML =
                data.weather[0].description;
                const windgesch = data.wind.speed * 3.6;
                document.getElementById('outpWind').innerHTML = `${windgesch.toFixed(0)} Km/h`;
                const lat = data.coord.lat;
                const lon = data.coord.lon;
                timezone = data.timezone;
                requestWeatherForecast(lat, lon);
                setTimeout(() => {
                    getAirPollutionInfo(lat, lon);
                }, 1500);
            })
            .catch((error) => {
                weatherContainer.style.display = 'none';
                if (localStorage.getItem('stored_CityList') === null) {
                    cityContainer.style.display = 'none';
                }
                createNotification(
                    'Der Ort konnte nicht gefunden werden :(',
                    'alert',
                );
                adress = '';
                let index;
                for (let i = 0; i <= 5; i++) {
                    index = `forecastBlock${i}`;
                    document.getElementById(index).hidden = true;
                }
                for (let i = 0; i <= 23; i++) {
                    index = `hourForecastBlock${i}`;
                    document.getElementById(index).hidden = true;
                }
            });
    }
}







function loadMap(lat, lon) {

    let mapPlace = {
        "type": "Point",
        "coordinates": []
    }
    let mapOverViewCoord = []
    mapPlace.coordinates.push(lon)
    mapPlace.coordinates.push(lat)
    mapOverViewCoord.push(lat)
    mapOverViewCoord.push(lon)

    meineKarte.remove();
    meineKarte = L.map('karte').setView(mapOverViewCoord, 3);

    L.tileLayer('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {
    maxZoom: 900, attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(meineKarte);

    L.geoJSON(mapPlace).addTo(meineKarte);
}



function dcrK(val) {
    let newVal = '';
    for (let i = 0; i < val.length; i++) {
        if (parseInt(val.charAt(i)) !== undefined && val.charAt(i) <= 9) {
            let newValEl = parseInt(val.charAt(i)) + 1;
            newVal += newValEl;
        } else {
            let strVal = '';
            if (val.charAt(i) === '*') {
                strVal = 0;
            } else {
                strVal = val.charAt(i);
            }
            newVal += strVal;
        }
    }
    return newVal
}

// Forecast
function requestWeatherForecast(lat, lon) {
    apiLink = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely&appid=${ky}&lang=de&units=metric`;
    fetch(apiLink)
        .then((response) => response.json())
        .then((data) => {

            try {
                mainData = JSON.stringify(data);
            } catch (error) {
                console.log(error);
            }

            // console.log(data);
            let tempMin;
            let tempMax;
            let temp;
            let weatherIcon;
            let imgSrc;
            let index;
            let hour;
            let weekDay;
            const timezoneOffset = data.timezone_offset;


            let uvIndex = data.current.uvi;
            let nextUVIndex = 0;

            // Windgeschwidigkeit und Richtung
            let windDeg = data.current.wind_deg;
            document.getElementById("windDirect").style.transform = `rotate(${windDeg}deg)`

            // Taupunkt und Feuchtigkeit
            const dewPoint = data.current.dew_point;
            const humidity = data.current.humidity;
            document.getElementById("outpHumidity").innerHTML = `${humidity}% <br/><br/> <hr> <strong>Taupunkt</strong> <br/> <br/>${dewPoint}°C`


            // Sonnen auf - untergang
            // let timeMinusSummertime = 0;

            // if(splitVal(intTimeConvert(data.current.sunrise) + '', " ", 5) === 'GMT+0200') {
            //     timeMinusSummertime = 3600;
            // }else {
            //     timeMinusSummertime = 0;
            // }
            // Sonnenaufgang roh für Sonnenstand
            const sunriseRaw = intTimeConvert(data.current.sunrise + timezone - 7200);
            const sunsetRaw = intTimeConvert(data.current.sunset + timezone - 7200);
            // Für Anzeige Auf-Untergang
            const sunrise = rawDatetime_in_Time(data.current.sunrise);
            const sunset = rawDatetime_in_Time(data.current.sunset);
            outSun.innerHTML = "⬆️ " + sunrise + " |  ⬇️ " + sunset;
            

            // Akt. Ortsdatum & Zeit
            const dateTimeNowRaw = intTimeConvert(data.current.dt + timezone - 7200);
            const dateTimeNow_Day = splitVal(dateTimeNowRaw  + '', " ", 2);
            const dateTimeNow_Month = splitVal(dateTimeNowRaw  + '', " ", 1);
            const dateTimeNow_TIME = splitVal(dateTimeNowRaw  + '', " ", 4);
            const dateTimeNow_Hour = splitVal(dateTimeNow_TIME  + '', ":", 0)
            const dateTimeNow_Minute = splitVal(dateTimeNow_TIME  + '', ":", 1)
            document.getElementById("outCurrDatetime").innerHTML = `${dateTimeNow_Day}.${dateTimeNow_Month} | ${dateTimeNow_Hour}:${dateTimeNow_Minute}`;

            // Sonnenstand ermitteln
            let isAfterSunset = false;
            let isAfterSunrise = false;
            let isBeforeSunrise = false;
            let isBeforeSunset = false; // Wird noch nicht benutzt. Mal gucken...

            if(dateTimeNowRaw > sunsetRaw ) {
                isAfterSunset = true;
            }
            if(dateTimeNowRaw > sunriseRaw) {
                isAfterSunrise = true;
            }
            if(dateTimeNowRaw < sunriseRaw) {
                isBeforeSunrise = true;
            }
            if(dateTimeNowRaw < sunsetRaw) {
                isBeforeSunset = true;
            }
            
            if(isAfterSunrise === true && isAfterSunset === true && isBeforeSunrise == false ) {
                // ? Abends vor Mitternacht
                var styleElem = document.head.appendChild(document.createElement("style"));
                styleElem.innerHTML = "#sunstand:after {left: 95px; top: 0px; background-Color: transparent;}";
                
            }else if(isAfterSunrise === false && isAfterSunset === false && isBeforeSunrise == true) {
                // ? Nachts nach Mitternacht
                var styleElem = document.head.appendChild(document.createElement("style"));
                styleElem.innerHTML = "#sunstand:after {left: -15px; top: -3px; background-Color: transparent;}";
            }else {
                // ? Tagsüber
                const todayTimeDiff = sunsetRaw - sunriseRaw;
                const currentTimeDiff = sunsetRaw - dateTimeNowRaw;
                const currentTimeProzentDiff = (currentTimeDiff * 100) / todayTimeDiff;
                const currentTimeProzent = parseInt(100 - currentTimeProzentDiff);               
                var styleElem = document.head.appendChild(document.createElement("style"));
                styleElem.innerHTML = `#sunstand:after {left: ${currentTimeProzent - 5}px; top: -8px; background-Color: yellow;}`;
            }



            // Mondphase
            const moonphaseToday = data.daily[0].moon_phase;
            const moonphaseTomorrow = data.daily[1].moon_phase;
            let moonPhaseTrend = '';
            if(moonphaseToday < moonphaseTomorrow) {
                moonPhaseTrend = 'zunehmend';
            }else {
                moonPhaseTrend = 'abnehmend';
            }
 
            //document.getElementById("outpMoonPhase").innerHTML = `${moonphaseToday}% ${moonPhaseTrend}. Morgen ${moonphaseTomorrow}%`
            document.getElementById("outpMoonRise").innerHTML = `${rawDatetime_in_Time(data.daily[0].moonrise)}`;
            document.getElementById("outpMoonSet").innerHTML = `${rawDatetime_in_Time(data.daily[0].moonset)}`;

            //###################################
            // Regen
            let rain = 0;
            let tomorrowRain = 0;
            try {
                rain = data.daily[0].rain;
                tomorrowRain = data.daily[1].rain;
                if(rain === undefined) {
                    rain = 0;
                }
                if(tomorrowRain === undefined) {
                    tomorrowRain = 0;
                }
            } catch (error) {
                console.log(error);
            }
            document.getElementById("outpRain").innerHTML = `${rain} mm erwartet`;
            document.getElementById("outputRainTomorrow").innerHTML = `Es werden ${tomorrowRain} mm Regen erwartet`;
            // Von heute Min und Max Temp eintragen

            tempMin = parseInt(data.daily[0].temp.min);
            tempMax = parseInt(data.daily[0].temp.max);
            progressValue_Temp.max = 100;

            const todayTempDiff = parseInt(tempMax - tempMin);
            const currentTemp = parseInt(data.current.temp);
            const currentDiff = tempMax - currentTemp;
            const currentTempProzentdiff = (currentDiff * 100) / todayTempDiff;
            const currentTempProcent = 100 - currentTempProzentdiff;



            progressValue_Temp.value = currentTempProcent;
            let tempFeelsLike = parseInt(data.current.feels_like);
            document.getElementById("outp_MinTemp").innerHTML = `Min: ${tempMin}°C`;
            document.getElementById("outp_MaxTemp").innerHTML = `Max: ${tempMax}°C`;
            document.getElementById("outp_feltTemp").innerHTML = `Gefühlt: ${tempFeelsLike}°C`;

            // Current UV Index
            document.getElementById("outUvIndx").innerHTML = `${uvIndex} - ${inerpreteUvIndex(uvIndex)}`;
            console.log(data);

            timeMinusSummertime = 0;
            // Forecast Stunden Felder einblenden
            for (let i = 0; i <= 23; i++) {
                index = `hourForecastBlock${i}`;
                document.getElementById(index).hidden = false;
                temp = parseInt(data.hourly[i].temp);
                weatherIcon = data.hourly[i].weather[0].icon;
                // ? Sommerzeit wird rausgerechnet
                const gmt = splitVal(intTimeConvert(data.hourly[i].dt) + '',' ', 5);

                if(gmt === 'GMT+0200') {
                    timeMinusSummertime = 3600;
                }else {
                    timeMinusSummertime = 0;
                }
                hour = splitVal(
                    intTimeConvert(data.hourly[i].dt + timezone - timeMinusSummertime) + '',
                    ' ',
                    4,
                );
                hour = splitVal(hour, ':', 0);

                nextUVIndex =data.hourly[i].uvi;
                if(uvIndexisCritical === true && nextUVIndex < 3) {
                    uvIndexisCritical = false;
                    uvIndexIsCriticalUntil = `${hour} Uhr`;
                    document.getElementById("outUvIndx").innerHTML = document.getElementById("outUvIndx").innerHTML + ` bis ${uvIndexIsCriticalUntil}`;
                }

                index = `hourOutp${i}`;
                document.getElementById(index).innerHTML = `${hour} Uhr`;
                index = `hourOutpPlus${i}`;
                document.getElementById(index).innerHTML = `${temp}°C`;
                imgSrc = `https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/widgets/${weatherIcon}.png`;
                index = `hourForecastImg${i}`;
                document.getElementById(index).src = imgSrc;
            }

            // Vorausgestellte For Schleife um die absolute tiefst und höchst temp der kommenden 5 Tage zu ermitteln
            let deepestTemp = 100;
            let highestTemp = -50;
            for(let i = 0; i <=4; i++) {
                const compareDeepestTemp = parseInt(data.daily[i + 1].temp.min);
                const compareHighestTemp = parseInt(data.daily[i + 1].temp.max);
                if(compareDeepestTemp < deepestTemp) {
                    deepestTemp = compareDeepestTemp;
                }
                if(compareHighestTemp > highestTemp) {
                    highestTemp = compareHighestTemp;
                }
            }

            // Forecast Tage Felder mit Inhalt befüllen
            for (let i = 0; i <= 4; i++) {
                index = `forecastBlock${i}`;
                // Checkt, ob es morgen wärmer oder kühler wird
                if(i === 0) {
                    const tempDiffToday_Tomorrow = (data.daily[i + 1].temp.max - data.daily[i].temp.max).toFixed(1);
                    const lblTempDiff = document.getElementById("outpTempDiff");
                    if (tempDiffToday_Tomorrow >= 1) {
                        lblTempDiff.innerHTML = `Morgen wird es ${tempDiffToday_Tomorrow}°C wärmer`;
                    }else if(tempDiffToday_Tomorrow <= -1){
                        lblTempDiff.innerHTML = `Morgen kühlt es um ${tempDiffToday_Tomorrow}°C ab`;
                    }else {
                        lblTempDiff.innerHTML = 'Die Temperatur bleibt morgen stabil';
                    }
                }

                document.getElementById(index).hidden = false;

                tempMin = parseInt(data.daily[i + 1].temp.min);
                tempMax = parseInt(data.daily[i + 1].temp.max);

                 const margin_Bottom = deepestTemp + tempMin;
                 const margin_Top = highestTemp - tempMax;


                // erzeugt Balken für Temperatur
                const balken = document.getElementById(`tempDay${i}`);
                balken.style.height = `${tempMax + 20}px`;
                balken.style.marginBottom = `${margin_Bottom}px` ;
                balken.style.marginTop = `${margin_Top}px`;



                weatherIcon = data.daily[i + 1].weather[0].icon;
                weekDay = splitVal(
                    intTimeConvert(data.daily[i + 1].dt) + '',
                    ' ',
                    0,
                );

                weekDay = getDate(weekDay);
                index = `outpDay${i}`;
                document.getElementById(index).innerHTML = weekDay;
                index = `outpDayPlus${i}`;
                document.getElementById(index).innerHTML = `${tempMin}°C / ${tempMax}°C`;
                imgSrc = `https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/widgets/${weatherIcon}.png`;
                index = `foreCastImg${i}`;
                document.getElementById(index).src = imgSrc;
            }
            index = `forecastBlock${5}`;
            document.getElementById(index).hidden = false;

            // Bei Geolocation
            if (isCurrentLocation === true) {
                temp = parseInt(data.current.temp);
                document.getElementById('outpTemp').innerHTML = `${temp}°C`;
                iconVal = data.current.weather[0].icon;
                iconVal = iconVal.slice(-1);
                // console.log(`Datum:${intTimeConvert(data.daily[0].dt)}`);
                const imgSrc = `https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/widgets/${data.current.weather[0].icon}.png`;
                document.getElementById('weatherimg').src = imgSrc;
                document.getElementById('outpWeather').innerHTML =
                    data.current.weather[0].description;
                document.getElementById(
                    'outMinMax',
                ).innerHTML = `Min: ${parseInt(
                    data.daily[0].temp.min,
                )}°C | Max: ${parseInt(
                    data.daily[0].temp.max,
                )}°C | Gefühlt: ${parseInt(data.current.feels_like)}°C`;
                const pressure = data.current.pressure;
                const windgesch = data.current.wind_speed * 3.6;
                document.getElementById(
                    'outpWind',
                ).innerHTML = `Wind: ${windgesch.toFixed(
                    0,
                )} Km/h | Luftdruck: ${pressure} hPa`;
            }

            setTimeout(() => {
                loadMap(lat, lon)
            }, 2000);

            ausw();
        })
        .catch((error) => {
            // console.log(`Forecast Err: ${error}`);
        });
}


// UV Index Interpretation
function inerpreteUvIndex(uvindex) {
    let instruction = '';
    const lbl_UvIndex = document.getElementById("outUvIndx");
    const progressValue_UV = document.getElementById("progress_UV");
    progressValue_UV.value = uvindex;

    if(uvindex > 11) {
        instruction = 'EXTREM - Sonne meiden';
        uvIndexisCritical = true;
        lbl_UvIndex.style.color = 'red';
    }else if(uvindex >= 8 && uvindex < 11) {
        instruction = 'SEHR HOCH - Schutz absolut notwendig';
        uvIndexisCritical = true;
        lbl_UvIndex.style.color = 'red';
    }else if(uvindex >= 6 && uvindex < 8) {
        instruction = 'HOCH - Schutz erforderlich';
        uvIndexisCritical = true;
        lbl_UvIndex.style.color = 'orange';
    }else if(uvindex >= 3 && uvindex < 6) {
        instruction = 'MITTEL - Schutz erforderlich';
        uvIndexisCritical = true;
        lbl_UvIndex.style.color = 'yellow';
    }else if(uvindex >= 0 && uvindex < 3) {
        instruction = 'NIEDRIG - Kein Schutz erforderlich';
        lbl_UvIndex.style.color = 'white';
    }
    return instruction;
}

// Wandelt die Zeit um
function intTimeConvert(num) {
    let dte = new Date(num * 1000);
    return dte;
}

// Auswertung z.B farbliche Änderung bei Temperaturen und Tag / Nacht anzeige
function ausw() {

    // Temperatur
    if (temp >= 32) {
        document.getElementById('outpTemp').style.textShadow = '0px 0px 15px red';
    }else if (temp >= 30) {
        document.getElementById('outpTemp').style.textShadow = '0px 0px 15px orange';
    }else if (temp >= 25) {
        document.getElementById('outpTemp').style.textShadow = '0px 0px 15px yellow';
    } else if (temp > 10) {
        document.getElementById('outpTemp').style.textShadow = '0px 0px 4px white';
    } else {
        document.getElementById('outpTemp').style.textShadow = '0px 0px 15px aqua';
    }
    // Tag / Nacht
    if (iconVal === 'n') {
        document.getElementById('weatherCard').style.backgroundColor = 'rgba(0,0,100,0.600';
        document.getElementById("weatherimg").style.boxShadow = '0px 0px 10px rgba(255,255,255,0.4)';
    } else {
        document.getElementById('weatherCard').style.backgroundColor = 'rgba(29, 28, 28, 0.247)';
        document.getElementById("weatherimg").style.boxShadow = '0px 0px 20px rgba(255,255,255,1), inset 0 0 15px white';
    }
}

// Lädt die zuerst abgespeicherte Stadt
function loadData() {
    if (localStorage.getItem('stored_CityList') != null) {
        cityList = JSON.parse(localStorage.getItem('stored_CityList'));
        adress = cityList[0];
        weatherRequest();
        showSavedCitys();
        currentLocationButton.hidden = false;
    } else {
        // Keine Einträge vorhanden
        weatherContainer.style.display = 'none';
        cityContainer.style.display = 'none';
        loadMap(51.162290, 6.462739);
    }
}

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
    }
}

// Speichert eine Stadt in den localStorage
function saveCity() {
    localStorage.setItem('stored_CityList', JSON.stringify(cityList));
}

// Fügt die Stadt in die Liste der Städte hinzu, nach Überprüfung, ob diese bereits vorhanden ist
function addCity() {
    if (adress != '') {
        if (cityList.includes(adress)) {
            createNotification(
                `"${adress}" hast du bereits abgespeichert!`,
                'warning',
            );
        } else {
            if (adress != '') {
                cityList.push(adress);
                saveCity();
                createNotification(`${adress} wurde gespeichert`, 'success');
                showSavedCitys();
            }
        }
    }
}

// Ausgewählte Stadt anzeigen
function getCity() {
    weatherContainer.style.display = 'flex';
    typeSelect.value = 'opt_temp';
    window.scrollTo(0, 0);
    adress = this.innerText;
    weatherRequest();
}

// Lösche die Stadt, falls in der Liste vorhanden
function delCity() {
    if (adress != '') {
        if (cityList.includes(adress)) {
            const confirm = window.confirm(
                `Möchtest du die Stadt "${adress}" wirklich aus Deiner Liste entfernen?`,
            );
            if (confirm) {
                for (let i = 0; i < cityList.length; i++) {
                    if (adress === cityList[i]) {
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

// Funktion, welche ein Uhrzeit extrahiert. In Berücksichtigung der Zeitzohne
function rawDatetime_in_Time(rawDatetime) {
    const raw = intTimeConvert(rawDatetime + timezone - 7200);
    const time = splitVal(raw  + '', " ", 4);
    const pureTime = `${splitVal(time + '' , ":", 0)}:${splitVal(time + '' , ":", 1)}`;
    return pureTime;
}

function splitVal(val, marker, pos) {
    const elem = val.split(marker);
    const retVal = elem[pos];
    return retVal;
}

// Geolocation
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        createNotification('Geolocation ist nicht verfügbar', 'alert');
        isCurrentLocation = false;
    }
}

function showPosition(position) {
    const lat = position.coords.latitude.toFixed(1);
    const lon = position.coords.longitude.toFixed(1);
    isCurrentLocation = true;
    ortLabel.innerHTML = 'Mein Standort';
    requestWeatherForecast(lat, lon);
}

// Toast Notification
function createNotification(message, messageType) {
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
    }, 2000);
}

// Stadt markieren, diese wird bei Neustart zuerst geladen
function startCity() {
    const cityName = adress;
    const arrIndex = cityList.indexOf(adress);
    if(arrIndex === -1) {
        cityList.splice(0, 0, cityName);
    }else{
        cityList.splice(arrIndex, 1);
        cityList.splice(0, 0, cityName);
    }
    createNotification(`"${cityName}" wird nun immer beim Start angezeigt`, 'success');
    saveCity();
    showSavedCitys();
}


// sticky-top
window.addEventListener("scroll", ()=>{
    let scrollHeigth = Math.floor(window.pageYOffset)
    if(scrollHeigth > 100) {
        ortLabel.classList.add("sticky-top");
    }else{
        ortLabel.classList.remove("sticky-top");
    }
})

// Bei 24 Stunden Anzeige die Werte auf UV, Wind, Wetter etc ändern
function getWeathertype(selectObject) {
    const value = selectObject.value;
    changeWeatherType(value)
  }


  function changeWeatherType(type) {

    const savedData = JSON.parse(mainData)
    let timeMinusSummertime = 0;
    for (let i = 0; i <= 23; i++) {
        index = `hourForecastBlock${i}`;
        document.getElementById(index).hidden = false;
        temp = parseInt(savedData.hourly[i].temp);
        weatherIcon = savedData.hourly[i].weather[0].icon;
        nextUVIndex =savedData.hourly[i].uvi;
        const nextHumidity = savedData.hourly[i].humidity;
        const nextWind = savedData.hourly[i].wind_speed;
        const windgesch = nextWind * 3.6;

                // ? Sommerzeit wird rausgerechnet
                const gmt = splitVal(intTimeConvert(savedData.hourly[i].dt) + '',' ', 5);
                if(gmt === 'GMT+0200') {
                    timeMinusSummertime = 3600;
                }else {
                    timeMinusSummertime = 0;
                }
        hour = splitVal(
            intTimeConvert(savedData.hourly[i].dt + timezone - timeMinusSummertime) + '',
            ' ',
            4,
        );
        hour = splitVal(hour, ':', 0);

        index = `hourOutp${i}`;
        document.getElementById(index).innerHTML = `${hour} Uhr`;
        index = `hourOutpPlus${i}`;
        if(type === 'opt_uvindex') {
            document.getElementById(index).innerHTML = `${nextUVIndex}`;
            document.getElementById(index).classList.remove("active");
        }
        if(type === 'opt_temp') {
            document.getElementById(index).innerHTML = `${temp}°C`;
            document.getElementById(index).classList.remove("active");
        }
        if(type === 'opt_humidity') {
            document.getElementById(index).innerHTML = `${nextHumidity} %`;
            document.getElementById(index).classList.remove("active");
        }
        if(type === 'opt_wind') {
            document.getElementById(index).innerHTML = `${windgesch.toFixed(0)} Km/h`;
            document.getElementById(index).classList.add("active");
        }
        imgSrc = `https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/widgets/${weatherIcon}.png`;
        document.getElementById(index).src = imgSrc;
        index = `hourForecastImg${i}`;

    }
  }

//?   Animation von Temp
let load = -50;
let intv =  undefined;

function initUpcountingTemp(temperature) {
    load = -50;
    intv =  setInterval( function() { countingUp(temperature); }, 17 );
}

function countingUp(temperature) {
    load++;
    if (load === temperature) {
        clearInterval(intv);
        load = temperature;
    }
    tempLabel.innerText = `${load}°C`;
}



function getAirPollutionInfo(latitude, longitude) {
    const pollutionLink = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${ky}`;
    fetch(pollutionLink)
        .then((response)=> response.json())
        .then((data) => {
           // console.log(data);
            
            const airQualityList = ['/', 'SEHR GUT', 'GUT', 'MODERAT', 'SCHLECHT', 'SEHR SCHLECHT']
            const airQualityColor = ['transparent', 'green', 'rgba(144, 238, 144, 0.678)', 'yellow', 'orange', 'red']
            const airQuality = data.list[0].main.aqi;
            document.getElementById("outpAirQuali").innerHTML = `Luftqualität: ${airQuality} - ${airQualityList[airQuality]}`;
            document.getElementById("airQualiBox").style.backgroundColor = `${airQualityColor[airQuality]}`
            document.getElementById("errorlog").innerHTML = 'getAirPollutionInfo = ok';
        }).catch((error) => {
            document.getElementById("errorlog").innerHTML = error + " | " + error.message;
        });
}