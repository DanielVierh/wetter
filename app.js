const ak = '142ebb880ba304df7*8a8867b2774e6e'
let temp = 0;
let cityCode = '';
let apiLink = '';
let cityList = [];
let ky = '';
let adress = '';
let timezone;
const winterTime = 3600;
const summerTime = 7200;
let iconVal;
let iconValRaw;
let isCurrentLocation = false;
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

let weatherSettings = {
    appeareanceMode: ''
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

//?####################################################################################################
// Load
ky = dcrK(ak);
window.onload = loadData();

//?####################################################################################################
// Eingegebene Stadt suchen
function showWeather() {
    adress = searchField.value;
    if (adress.slice(-1) === ' ') {
        adress = adress.trimEnd();
    }
    weatherRequest();
    searchField.value = '';
}

//?####################################################################################################
// Wenn mit Enter gesucht wird
window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        showWeather();
    }
});

// Interessant wenn die Map location marker funtioniert
// https://openweathermap.org/api/geocoding-api   -- Reverse geocoding
//?####################################################################################################
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
                deleteSpinner()
                weatherContainer.style.display = 'flex';
                cityContainer.style.display = 'flex';
                isCurrentLocation = false;
                document.getElementById('errorLeiste').hidden = true;
                document.getElementById('btnAddCity').hidden = false;
                adress = data.name;
                ortLabel.innerHTML = adress;
                temp = parseInt(data.main.temp);
                document.getElementById('outpTemp').innerHTML = `🌡`;
                setTimeout(() => {
                    initUpcountingTemp(temp);
                }, 1000);
                iconValRaw = data.weather[0].icon;
                iconVal = iconValRaw.slice(-1);
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
                document.getElementById("outpAirQuali").innerHTML = 'Lade Werte ...';
                ausw();
                loadMap(lat, lon)
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
                    2000
                );
                deleteSpinner();
                console.log('In nicht gefunden');
                adress = '';
                let index;
                for (let i = 0; i <= 7; i++) {
                    index = `forecastBlock${i}`;
                    document.getElementById(index).hidden = true;
                }
                for (let i = 0; i <= 24; i++) {
                    index = `hourForecastBlock${i}`;
                    document.getElementById(index).hidden = true;
                }
            });
    }
}






//?####################################################################################################
// Open Streetmap

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
        maxZoom: 900, attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(meineKarte);

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

//?####################################################################################################
// Forecast
//?####################################################################################################
function requestWeatherForecast(lat, lon) {
    loadSpinner();
    apiLink = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely&appid=${ky}&lang=de&units=metric`;
    fetch(apiLink)
        .then((response) => response.json())
        .then((data) => {
            deleteSpinner();
            console.log('ForecastData', data);
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

            //?####################################################################################################
            // Wetteralarm
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

                // Weiter Button
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
            document.getElementById("outpHumidity").innerHTML = `${humidity}% <br/><br/> <hr> <strong>Taupunkt</strong> <br/> <br/>${dewPoint}°C`


            //?####################################################################################################
            // Sonnen auf - untergang

            if(splitVal(intTimeConvert(data.current.sunrise) + '', " ", 5) === 'GMT+0200') {
                timeSubstract = summerTime;
            }else {
                timeSubstract = winterTime;
            }

            // Sonnenaufgang roh für Sonnenstand
            const sunriseRaw = intTimeConvert(data.current.sunrise + timezone - timeSubstract);
            const sunsetRaw = intTimeConvert(data.current.sunset + timezone - timeSubstract);
            // Für Anzeige Auf-Untergang
            const sunrise = rawDatetime_in_Time(data.current.sunrise);
            const sunset = rawDatetime_in_Time(data.current.sunset);
            outSun.innerHTML = "⬆️ " + sunrise + " |  ⬇️ " + sunset;


            // Akt. Ortsdatum & Zeit
            const dateTimeNowRaw = intTimeConvert(data.current.dt + timezone - timeSubstract);
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
                var styleElem = document.head.appendChild(document.createElement("style"));
                styleElem.innerHTML = "#sunstand:after {left: 95px; top: 0px; background-Color: transparent;}";

            } else if (isAfterSunrise === false && isAfterSunset === false && isBeforeSunrise == true) {
                // ? Nachts nach Mitternacht
                var styleElem = document.head.appendChild(document.createElement("style"));
                styleElem.innerHTML = "#sunstand:after {left: -15px; top: -3px; background-Color: transparent;}";
            } else {
                // ? Tagsüber
                const todayTimeDiff = sunsetRaw - sunriseRaw;
                const currentTimeDiff = sunsetRaw - dateTimeNowRaw;
                const currentTimeProzentDiff = (currentTimeDiff * 100) / todayTimeDiff;
                const currentTimeProzent = parseInt(100 - currentTimeProzentDiff);
                var styleElem = document.head.appendChild(document.createElement("style"));
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
                    intTimeConvert(data.hourly[i].dt + timezone - timeMinusSummertime) + '',
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
                    const tomorrowWeatherTrend = data.daily[i + 1].weather[0].description;
                    if (tempDiffToday_Tomorrow >= 1) {
                        lblTempDiff.innerHTML = `Morgen wird es ca. ${parseInt(tempDiffToday_Tomorrow)}°C wärmer, mit einer maximalen Temperatur von ${parseInt(maxTomorrow)}°C`;
                    } else if (tempDiffToday_Tomorrow <= -1) {
                        lblTempDiff.innerHTML = `Morgen kühlt es um ${parseInt(tempDiffToday_Tomorrow)}°C, auf eine maximale Temperatur von ${parseInt(maxTomorrow)}°C ab.`;
                    } else {
                        lblTempDiff.innerHTML = `Die Temperatur bleibt morgen stabil. Die maximale Temperatur wird in etwa ${parseInt(maxTomorrow)}°C betragen.`;
                    }
                    document.getElementById("outputWeatherTrend").innerHTML = `Das Wetter morgen: ${tomorrowWeatherTrend}.`;

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
                
                weekDay = getDate(weekDay);
                index = `outpDay${i}`;
                document.getElementById(index).innerHTML = weekDay;
                index = `outpDayPlus${i}`;
                const viewport_width = window.innerWidth;
                if(viewport_width > 600) {
                    document.getElementById(index).innerHTML = `${tempMin}°C / ${tempMax}°C`;
                }else {
                    document.getElementById(index).innerHTML = `${tempMin}°C-${tempMax}°C`;
                }
                imgSrc = `https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/widgets/${weatherIcon}.png`;
                index = `foreCastImg${i}`;
                document.getElementById(index).src = imgSrc;

            }



            //?####################################################################################################
            // Bei Geolocation
            if (isCurrentLocation === true) {
                temp = parseInt(data.current.temp);
                document.getElementById('outpTemp').innerHTML = `${temp}°C`;
                iconValRaw = data.current.weather[0].icon;
                iconVal = iconValRaw.slice(-1);
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
            document.getElementById("outpRain").innerHTML = `${rain} mm`;
            document.getElementById('niedrschl').innerHTML = '<strong>Regen</strong>';
            if(snow > 0) {
                document.getElementById('niedrschl').innerHTML = '<strong>Schnee</strong>';
                document.getElementById("outpRain").innerHTML = `${snow} mm`;
            }

            if (tomorrowRain === 0 && tomorrowSnow === 0) {
                document.getElementById("outputRainTomorrow").innerHTML = `Es bleibt morgen trocken.`;
            } else if(tomorrowRain > 0) {
                document.getElementById("outputRainTomorrow").innerHTML = `Im laufe des Tages werden ${tomorrowRain} mm Regen erwartet.`;
            }else if(tomorrowSnow > 0) {
                document.getElementById("outputRainTomorrow").innerHTML = `Im laufe des Tages werden ${tomorrowSnow} mm Schnee erwartet.`;
               
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
function ausw() {

    //?####################################################################################################
    // Temperatur
    if (temp >= 32) {
        document.getElementById('outpTemp').style.textShadow = '0px 0px 15px red';
    } else if (temp >= 30) {
        document.getElementById('outpTemp').style.textShadow = '0px 0px 15px orange';
    } else if (temp >= 25) {
        document.getElementById('outpTemp').style.textShadow = '0px 0px 15px yellow';
    } else if (temp > 10) {
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
    setAppearance('opt_normalmode');
    reset_Col();
    loadSpinner()
    setTimeout(() => {
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
    }, 1500);


    if (localStorage.getItem('stored_WeatherSettings') != null) {
        weatherSettings = JSON.parse(localStorage.getItem('stored_WeatherSettings'));
        try {
            setAppearance(`${weatherSettings.appeareanceMode}`);
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
    }
}

//?####################################################################################################
// Speichert eine Stadt in den localStorage
function saveCity() {
    localStorage.setItem('stored_CityList', JSON.stringify(cityList));
}

function saveSettings() {
    localStorage.setItem('stored_WeatherSettings', JSON.stringify(weatherSettings));
}

//?####################################################################################################
// Fügt die Stadt in die Liste der Städte hinzu, nach Überprüfung, ob diese bereits vorhanden ist
function addCity() {
    if (adress != '') {
        if (cityList.includes(adress)) {
            createNotification(
                `"${adress}" hast du bereits abgespeichert!`,
                'warning',
                3000
            );
        } else {
            if (adress != '') {
                cityList.push(adress);
                saveCity();
                createNotification(`${adress} wurde gespeichert`, 'success', 3000);
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
    adress = this.innerText;
    weatherRequest();
}

//?####################################################################################################
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

//?####################################################################################################
// Funktion, welche ein Uhrzeit extrahiert. In Berücksichtigung der Zeitzohne
function rawDatetime_in_Time(rawDatetime) {
    const raw = intTimeConvert(rawDatetime + timezone - timeSubstract);
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
// Geolocation
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        createNotification('Geolocation ist nicht verfügbar', 'alert', 3000);
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
    const cityName = adress;
    const arrIndex = cityList.indexOf(adress);
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
        temp = parseInt(savedData.hourly[i].temp);
        weatherIcon = savedData.hourly[i].weather[0].icon;
        nextUVIndex = savedData.hourly[i].uvi;
        const nextHumidity = savedData.hourly[i].humidity;
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
            intTimeConvert(savedData.hourly[i].dt + timezone - timeMinusSummertime) + '',
            ' ',
            4,
        );
        hour = splitVal(hour, ':', 0);

        index = `hourOutp${i}`;
        document.getElementById(index).innerHTML = `${hour} Uhr`;
        index = `hourOutpPlus${i}`;
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
            console.log(data);
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
            // Debugging
            //document.getElementById("errorlog").innerHTML = 'getAirPollutionInfo = ok';
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
    console.log(value);
}


function setAppearance(value) {
    if (value === 'opt_darkmode') {
        theBody.classList.remove("lightMode");
        theBody.classList.remove("normalMode");
        theBody.classList.add("darkMode");
    }

    if (value === 'opt_normal') {
        theBody.classList.remove("darkMode");
        theBody.classList.remove("lightMode");
        theBody.classList.add("normalMode");
    }

    if (value === 'opt_lightmode') {
        theBody.classList.remove("darkMode");
        theBody.classList.remove("normalMode");
        theBody.classList.add("lightMode");
    }

}


if(btn_scroll_up) {
    btn_scroll_up.addEventListener("click", ()=> {
        window.scroll(0,0);
    })
}

window.addEventListener("scroll", (e)=> {
    if(window.pageYOffset > 400) {
        btn_scroll_up.classList.add("active");
    }else {
        btn_scroll_up.classList.remove("active");
    }
})

function reset_Col() {
    for(let i = 0; i < 7; i++) {
        const balken = document.getElementById(`tempDay${i}`);
        balken.style.height = `0px`;
        balken.style.marginBottom = `0px`;
        balken.style.marginTop = `0px`;
    }
}

function loadSpinner() {
    console.log('Show Spinner');
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
    if(randomDirection === 1) {
        document.getElementById("windDirect").style.transform = `rotate(${windDeg_minus_20}deg)`
    }else {
        document.getElementById("windDirect").style.transform = `rotate(${winDeg_plus_20}deg)`
    }
    setTimeout(() => {
        document.getElementById("windDirect").style.transform = `rotate(${windDeg}deg)`
    }, 1300);
}, 10000);