const testLink = 'https://api.openweathermap.org/data/2.5/onecall?lat={lat}&lon={lon}&exclude=hourly,daily&appid=253ebb991ba415df809a9978b3885e7e&lang=de&units=metric'
let temp = 0;
let cityCode = '';
let apiLink = '';
let cityList = [];
let adress = '';
let timezone;
let iconVal;
let isCurrentLocation = false;


// Load
window.onload = loadData();

// Eingegebene Stadt suchen
function showWeather() {
    adress = document.getElementById("inpCityname").value;
    if(adress.slice(-1)=== " ") {
        adress = adress.trimEnd();
        console.log(`Hatte Leerzeichen: ${adress}`)
    }
    weatherRequest();
    document.getElementById("inpCityname").value = "";
}



// Wetter Request
function weatherRequest() {
    if (adress != "") {
        if (isNaN(adress)) {
            apiLink = `https://api.openweathermap.org/data/2.5/weather?q=${adress}&appid=253ebb991ba415df809a9978b3885e7e&lang=de&units=metric`
        } else {
            apiLink = `https://api.openweathermap.org/data/2.5/weather?zip=${adress},de&APPID=253ebb991ba415df809a9978b3885e7e&lang=de&units=metric`
        }
        fetch(apiLink)
            .then(response => response.json())
            .then(data => {
                isCurrentLocation = false;
                document.getElementById("errorLeiste").hidden = true
                document.getElementById("btnAddCity").hidden = false
                document.getElementById("backgrLayer").hidden = false
                adress = data.name
                document.getElementById("outpOrt").innerHTML = adress
                temp = parseInt(data.main.temp)
                document.getElementById("outpTemp").innerHTML = `${temp}°C`
                iconVal = data.weather[0].icon
                iconVal = iconVal.slice(-1)
                const imgSrc = `https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/widgets/${data.weather[0].icon}.png`
                document.getElementById("weatherimg").src = imgSrc
                document.getElementById("outpWeather").innerHTML = data.weather[0].description
                document.getElementById("outMinMax").innerHTML = `Min: ${parseInt(data.main.temp_min)}°C | Max: ${parseInt(data.main.temp_max)}°C | Gefühlt: ${parseInt(data.main.feels_like)}°C`
                const pressure = data.main.pressure
                const windgesch = data.wind.speed * 3.6
                document.getElementById("outpWind").innerHTML = `Wind: ${windgesch.toFixed(0)} Km/h | Luftdruck: ${pressure} hPa`
                // Schauen, wie man die Standort spezifische Zeit anzeigen kann. Solange ausgeblendet
                // document.getElementById("outSun").innerHTML = `Sonnenaufgang: ${intTimeConvert(data.sys.sunrise)} | Sonnenuntergang: ${intTimeConvert(data.sys.sunset)}`
                const lat = data.coord.lat
                const lon = data.coord.lon
                timezone = data.timezone
                requestWeatherForecast(lat, lon)
            })
            .catch(error => {
                document.getElementById("errorLeiste").hidden = false
                document.getElementById("btnAddCity").hidden = true
                document.getElementById("outpOrt").innerHTML = ""
                document.getElementById("weatherimg").src = ""
                document.getElementById("outpTemp").innerHTML = "Ups :("
                document.getElementById("outpWeather").innerHTML = ""
                document.getElementById("outSun").innerHTML = ""
                document.getElementById("outpWind").innerHTML = ""
                document.getElementById("outMinMax").innerHTML = ""
                adress = ""
                let index
                for (let i = 0; i <= 5; i++) {
                    index = `forecastBlock${i}`
                    document.getElementById(index).hidden = true
                }
                for (let i = 0; i <= 23; i++) {
                    index = `hourForecastBlock${i}`
                    document.getElementById(index).hidden = true
                }
                console.log(`Error: ${error}`)
            })
    }
}

// Forecast
function requestWeatherForecast(lat, lon) {
    apiLink = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely&appid=253ebb991ba415df809a9978b3885e7e&lang=de&units=metric`;
    fetch(apiLink)
        .then(response => response.json())
        .then(data => {
            console.log(data)
            let tempMin
            let tempMax
            let temp
            let weatherIcon
            let imgSrc
            let index
            let hour
            let weekDay;

            // Forecast Stunden Felder einblenden
            for (let i = 0; i <= 23; i++) {
                index = `hourForecastBlock${i}`
                document.getElementById(index).hidden = false
                temp = parseInt(data.hourly[i].temp)
                weatherIcon = data.hourly[i].weather[0].icon
                hour = splitVal((intTimeConvert(data.hourly[i].dt + timezone) + ''),' ', 4)
                hour = splitVal(hour, ':', 0)
                index = `hourOutp${i}`
                document.getElementById(index).innerHTML = `${hour} Uhr`
                index = `hourOutpPlus${i}`
                document.getElementById(index).innerHTML = `${temp}°C`
                imgSrc = `https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/widgets/${weatherIcon}.png`
                index = `hourForecastImg${i}`
                document.getElementById(index).src = imgSrc
            }

            // Forecast Tage Felder mit Inhalt befüllen
            for (let i = 0; i <= 4; i++) {
                index = `forecastBlock${i}`
                document.getElementById(index).hidden = false
                tempMin = parseInt(data.daily[i + 1].temp.min)
                tempMax = parseInt(data.daily[i + 1].temp.max)
                weatherIcon = data.daily[i + 1].weather[0].icon
                weekDay = splitVal((intTimeConvert(data.daily[i + 1].dt) + ''),' ', 0)
                weekDay = getDate(weekDay)
                index = `outpDay${i}`
                document.getElementById(index).innerHTML = weekDay
                index = `outpDayPlus${i}`
                document.getElementById(index).innerHTML = `${tempMin}°C / ${tempMax}°C`
                imgSrc = `https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/widgets/${weatherIcon}.png`
                index = `foreCastImg${i}`
                document.getElementById(index).src = imgSrc
            }
            index = `forecastBlock${5}`
            document.getElementById(index).hidden = false

            // Bei Geolocation
            if(isCurrentLocation === true) {
                temp = parseInt(data.current.temp)
                document.getElementById("outpTemp").innerHTML = `${temp}°C`
                iconVal = data.current.weather[0].icon
                iconVal = iconVal.slice(-1)
                console.log(`Datum:${intTimeConvert(data.daily[0].dt)}`)
                const imgSrc = `https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/widgets/${data.current.weather[0].icon}.png`
                document.getElementById("weatherimg").src = imgSrc
                document.getElementById("outpWeather").innerHTML = data.current.weather[0].description
                document.getElementById("outMinMax").innerHTML = `Min: ${parseInt(data.daily[0].temp.min)}°C | Max: ${parseInt(data.daily[0].temp.max)}°C | Gefühlt: ${parseInt(data.current.feels_like)}°C`
                const pressure = data.current.pressure
                const windgesch = data.current.wind_speed * 3.6
                document.getElementById("outpWind").innerHTML = `Wind: ${windgesch.toFixed(0)} Km/h | Luftdruck: ${pressure} hPa`
            }

            ausw()
        })
        .catch(error => {
            console.log(`Forecast Err: ${error}`)
        })
}

// Wandelt die Zeit um
function intTimeConvert(num) {
    let dte = new Date(num * 1000);
    return dte;
}

// Auswertung z.B farbliche Änderung bei Temperaturen und Tag / Nacht anzeige
function ausw() {
    // Temperatur
    if (temp > 30) {
        document.getElementById("outpTemp").style.color = 'orange';
    } else if (temp > 10) {
        document.getElementById("outpTemp").style.color = 'white';
    } else {
        document.getElementById("outpTemp").style.color = 'lightblue';
    }
    // Tag / Nacht
    if(iconVal === 'n') {
        document.getElementById("weatherCard").style.backgroundColor = 'rgba(0,0,100,0.700';
    }else{
        document.getElementById("weatherCard").style.backgroundColor = 'rgba(29, 28, 28, 0.247)';
    }

    // Höhe anpassen
    /*
        var left = document.getElementById("left");
        var right = document.getElementById("right");

        if(left.offsetHeight > right.offsetHeight)
        {
            right.style.height = left.offsetHeight+"px";
        }
    */
}

// Lädt die zuerst abgespeicherte Stadt
function loadData() {
    if (localStorage.getItem('stored_CityList') != null) {
        cityList = JSON.parse(localStorage.getItem("stored_CityList"));
        adress = cityList[0];
        weatherRequest();
        showSavedCitys();
    }
}

// Zeigt abgespeicherte Städte an
function showSavedCitys() {
    document.getElementById("outCitys").innerHTML = "";
    for (let i = 0; i < cityList.length; i++) {
        const cty = cityList[i];
        const btn = document.createElement("button");
        btn.appendChild(document.createTextNode(cty));
        btn.onclick = getCity;
        let ul = document.getElementById("outCitys");
        ul.appendChild(btn);
    }
}

// Speichert eine Stadt in den localStorage
function saveCity() {
    localStorage.setItem("stored_CityList", JSON.stringify(cityList));
}

// Fügt die Stadt in die Liste der Städte hinzu, nach Überprüfung, ob diese bereits vorhanden ist
function addCity() {
    if (cityList.includes(adress)) {
        alert("Den Ort hast du bereits abgespeichert")
    } else {
        if (adress != "") {
            cityList.push(adress);
            saveCity();
            alert(`${adress} wurde gespeichert`);
            showSavedCitys();
        }
    }
    // console.log(cityList);
}

// Ausgewählte Stadt anzeigen
function getCity() {
    adress = this.innerText;
    weatherRequest();
}

function getDate(weekDay) {
    let day = '';
    switch (weekDay) {
        case 'Sun':
            day = 'So'
            break;
        case 'Mon':
            day = 'Mo'
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
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition)
    }else{
        alert("Geolocation ist nicht verfügbar");
        isCurrentLocation = false;
    }
}

function showPosition(position) {
    const lat = position.coords.latitude.toFixed(1);
    const lon = position.coords.longitude.toFixed(1);
    isCurrentLocation = true;
    //console.log(`Lat: ${lat} / Lon: ${lon}`)
    document.getElementById("outpOrt").innerHTML = "Mein Standort";
    requestWeatherForecast(lat, lon);
}