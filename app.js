const testLink = 'https://api.openweathermap.org/data/2.5/onecall?lat={lat}&lon={lon}&exclude=hourly,daily&appid=253ebb991ba415df809a9978b3885e7e&lang=de&units=metric'
let temp = 0;
let cityCode = '';
let apiLink = '';
let cityList = [];
let adress = '';

window.onload = loadData();

function showWeather() {
    adress = document.getElementById("inpCityname").value; 
    weatherRequest();
    document.getElementById("inpCityname").value = "";
}

function weatherRequest() {
    if(adress != "") {
        if(isNaN(adress)) {
            apiLink = `https://api.openweathermap.org/data/2.5/weather?q=${adress}&appid=253ebb991ba415df809a9978b3885e7e&lang=de&units=metric`
        }else{
            apiLink = `https://api.openweathermap.org/data/2.5/weather?zip=${adress},de&APPID=253ebb991ba415df809a9978b3885e7e&lang=de&units=metric`
        }
        
        fetch(apiLink)
        .then(response => response.json())
        .then(data => {
            document.getElementById("errorLeiste").hidden = true
            document.getElementById("btnAddCity").hidden = false
            console.log(data)
            adress = data.name
            document.getElementById("outpOrt").innerHTML = adress
            temp = parseInt(data.main.temp)
            document.getElementById("outpTemp").innerHTML = `${temp}°C`  
            const imgSrc = `https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/widgets/${data.weather[0].icon}.png`
            document.getElementById("weatherimg").src = imgSrc  
            document.getElementById("outpWeather").innerHTML = data.weather[0].description
            document.getElementById("outMinMax").innerHTML = `Min: ${parseInt(data.main.temp_min)}°C | Max: ${parseInt(data.main.temp_max)}°C | Gefühlt: ${parseInt(data.main.feels_like)}°C`       
            // Gibt irgendwie immer die gleichen Werte aus.
            // const visibilityInKm = parseInt(data.visibility / 1000)
            const pressure = data.main.pressure
            const windgesch = data.wind.speed * 3.6
            document.getElementById("outpWind").innerHTML = `Wind: ${windgesch.toFixed(0)} Km/h | Luftdruck: ${pressure} hPa`
            // Schauen, wie man die Standort spezifische Zeit anzeigen kann. Solange ausgeblendet
            // document.getElementById("outSun").innerHTML = `Sonnenaufgang: ${dezTimeInTime(data.sys.sunrise)} | Sonnenuntergang: ${dezTimeInTime(data.sys.sunset)}`
            const lat = data.coord.lat
            const lon = data.coord.lon
            ausw()
            requestWeatherForecast(lat, lon)
        })
        .catch(error => {
            document.getElementById("errorLeiste").hidden = false
            document.getElementById("btnAddCity").hidden = true
            document.getElementById("outpOrt").innerHTML = ""
            document.getElementById("weatherimg").src = ""
            document.getElementById("outpTemp").innerHTML = "Ups"
            document.getElementById("outpWeather").innerHTML = ""
            document.getElementById("outSun").innerHTML = ""
            document.getElementById("outpWind").innerHTML = ""
            document.getElementById("outMinMax").innerHTML = ""
            adress = ""
            console.log(`Error: ${error}`)
        })
    }
}

// Forecast
function requestWeatherForecast(lat, lon) {
    apiLink = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=hourly&appid=253ebb991ba415df809a9978b3885e7e`;
    fetch(apiLink)
        .then(response => response.json())
        .then(data => {
            console.log(data)
        })
    .catch(error => {
        console.log(`Uff: ${error}`)
    })
}

// Wandelt die Zeit um
function dezTimeInTime(num) {
  let dte = new Date(num * 1000);
  return dte;
}

// Auswertung z.B farbliche Änderung bei Temperaturen und Tag / Nacht anzeige
function ausw() {
    if(temp > 30) {
        document.getElementById("outpTemp").style.color = 'orange';
    }else if(temp > 10) {
        document.getElementById("outpTemp").style.color = 'white';
    }else{
        document.getElementById("outpTemp").style.color = 'lightblue';
    }
}

// Lädt die zuerst abgespeicherte Stadt
function loadData() {
    if(localStorage.getItem('stored_CityList') != null) {
       cityList = JSON.parse(localStorage.getItem("stored_CityList")); 
        adress = cityList[0];
        weatherRequest();
        showSavedCitys();
    }
}


function showSavedCitys() {
    document.getElementById("outCitys").innerHTML = "";
    for(let i = 0; i < cityList.length; i++) {
            const cty = cityList[i];
            const btn = document.createElement("button");
            btn.appendChild(document.createTextNode(cty));
            btn.onclick = getCity;
            let ul = document.getElementById("outCitys");
            ul.appendChild(btn);
        }
}


function saveCity(){
    localStorage.setItem("stored_CityList", JSON.stringify(cityList));
}

function addCity() {
    if(cityList.includes(adress)) {
        alert("Den Ort hast du bereits abgespeichert")
    }else{
        if(adress != "") {
            cityList.push(adress);
            saveCity();
            alert(`${adress} wurde gespeichert`);
            showSavedCitys();
        }
    }
    // console.log(cityList);
}


function getCity() {
   adress = this.innerText;
   weatherRequest();
}