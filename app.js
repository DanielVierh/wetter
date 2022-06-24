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

// Button etc.
const currentLocationButton = document.getElementById('btnCurrLoc');
const weatherContainer = document.getElementById('weatherCard');
const cityContainer = document.getElementById('cityContainer');
const searchButton = document.getElementById('searchButton');
const searchField = document.getElementById('inpCityname');
const toasts = document.getElementById('toasts');
const progressValue_Temp = document.getElementById("progress_Temp");

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
    // weatherContainer.style.display = "flex";
    // cityContainer.style.display = "flex";
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
                weatherContainer.style.display = 'flex';
                cityContainer.style.display = 'flex';
                isCurrentLocation = false;
                document.getElementById('errorLeiste').hidden = true;
                document.getElementById('btnAddCity').hidden = false;
                adress = data.name;
                document.getElementById('outpOrt').innerHTML = adress;
                temp = parseInt(data.main.temp);
                document.getElementById('outpTemp').innerHTML = `${temp}°C`;
                iconVal = data.weather[0].icon;
                iconVal = iconVal.slice(-1);
                const imgSrc = `https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/widgets/${data.weather[0].icon}.png`;
                document.getElementById('weatherimg').src = imgSrc;
                document.getElementById('outpWeather').innerHTML =
                    data.weather[0].description;
                // const pressure = data.main.pressure;
                const windgesch = data.wind.speed * 3.6;
                const humidity = data.main.humidity;
                document.getElementById('outpWind').innerHTML = `${windgesch.toFixed(0)} Km/h`;
                document.getElementById("outpHumidity").innerHTML = `${humidity}%`
                const lat = data.coord.lat;
                const lon = data.coord.lon;
                timezone = data.timezone;
                requestWeatherForecast(lat, lon);
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
            // console.log(data);
            let tempMin;
            let tempMax;
            let temp;
            let weatherIcon;
            let imgSrc;
            let index;
            let hour;
            let weekDay;
            // let timezoneOffset = data.timezone_offset;
            let uvIndex = data.current.uvi;
            let nextUVIndex = 0;

            // Von heute Min und Max Temp eintragen

            tempMin = parseInt(data.daily[0].temp.min);
            tempMax = parseInt(data.daily[0].temp.max);
            
            const tempInPercent = parseInt(data.current.temp) * 100 / tempMax;
            progressValue_Temp.max = 100;
            progressValue_Temp.value = tempInPercent;
            let tempFeelsLike = parseInt(data.current.feels_like);
            document.getElementById("outp_MinTemp").innerHTML = `Min: ${tempMin}°C`;
            document.getElementById("outp_MaxTemp").innerHTML = `Max: ${tempMax}°C`;
            document.getElementById("outp_feltTemp").innerHTML = `Gefühlt: ${tempFeelsLike}°C`;
            // document.getElementById('outMinMax').innerHTML = `Min: ${tempMin}°C | Max: ${tempMax}°C | Gefühlt: ${tempFeelsLike}°C`;

            // Current UV Index
            document.getElementById("outUvIndx").innerHTML = `${uvIndex} - ${inerpreteUvIndex(uvIndex)}`;
            console.log(data);

            // Forecast Stunden Felder einblenden
            for (let i = 0; i <= 23; i++) {
                index = `hourForecastBlock${i}`;
                document.getElementById(index).hidden = false;
                temp = parseInt(data.hourly[i].temp);
                weatherIcon = data.hourly[i].weather[0].icon;
                hour = splitVal(
                    intTimeConvert(data.hourly[i].dt + timezone) + '',
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
            console.log(`Deepest ${deepestTemp}`);
            console.log(`Highest ${highestTemp}`);

            

            // Forecast Tage Felder mit Inhalt befüllen
            for (let i = 0; i <= 4; i++) {
                index = `forecastBlock${i}`;
                // Checkt, ob es morgen wärmer oder kühler wird
                if(i === 0) {
                    const tempDiffToday_Tomorrow = (data.daily[i + 1].temp.max - data.daily[i].temp.max).toFixed(2);
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
        
                
                document.getElementById(`tempDay${i}`).style.height = `${tempMax}px`;
                
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
                document.getElementById(
                    index,
                ).innerHTML = `${tempMin}°C / ${tempMax}°C`;
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
    // console.log(dte);
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
        document.getElementById('weatherCard').style.backgroundColor =
            'rgba(0,0,100,0.600';
    } else {
        document.getElementById('weatherCard').style.backgroundColor =
            'rgba(29, 28, 28, 0.247)';
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
    document.getElementById('outpOrt').innerHTML = 'Mein Standort';
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
