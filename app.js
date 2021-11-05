
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
}

function weatherRequest() {
    if(adress != "") {
        if(isNaN(adress)) {
            apiLink = `http://api.openweathermap.org/data/2.5/weather?q=${adress}&appid=253ebb991ba415df809a9978b3885e7e&lang=de&units=metric`
        }else{
            apiLink = `http://api.openweathermap.org/data/2.5/weather?zip=${adress},de&APPID=253ebb991ba415df809a9978b3885e7e&lang=de&units=metric`
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
            document.getElementById("outMinMax").innerHTML = `Min: ${parseInt(data.main.temp_min)} / Max: ${parseInt(data.main.temp_max)} / Gefühlt: ${parseInt(data.main.feels_like)}`       
            // document.getElementById("outpLastUpdt").innerHTML = `Letztes Update: ${}`
            ausw()
        })
        .catch(error => {
            document.getElementById("errorLeiste").hidden = false
            document.getElementById("btnAddCity").hidden = true
            document.getElementById("outpOrt").innerHTML = ""
            document.getElementById("weatherimg").src = ""
            document.getElementById("outpTemp").innerHTML = "Ups"
            document.getElementById("outpWeather").innerHTML = ""
            adress = ""
        })
    }
}


function ausw() {
    if(temp > 30) {
        document.getElementById("outpTemp").style.color = 'orange';
    }else if(temp > 10) {
        document.getElementById("outpTemp").style.color = 'white';
    }else{
        document.getElementById("outpTemp").style.color = 'blue';
    }
}


function loadData() {
    if(localStorage.getItem('stored_CityList') != null) {
       cityList = JSON.parse(localStorage.getItem("stored_CityList")); 
        adress = cityList[0];
        weatherRequest();
        for(let i = 0; i < cityList.length; i++) {
            const cty = cityList[i];
            const btn = document.createElement("button");
            btn.appendChild(document.createTextNode(cty));
            btn.onclick = getCity;
            let ul = document.getElementById("outCitys");
            ul.appendChild(btn);
        }
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
        }
    }
    console.log(cityList);
}

function getCity() {
   adress = this.innerText;
   weatherRequest();
}


















/**
 * 
 * 
 * 
 * 
    af Afrikaans
    al Albanian
    ar Arabic
    az Azerbaijani
    bg Bulgarian
    ca Catalan
    cz Czech
    da Danish
    de German
    el Greek
    en English
    eu Basque
    fa Persian (Farsi)
    fi Finnish
    fr French
    gl Galician
    he Hebrew
    hi Hindi
    hr Croatian
    hu Hungarian
    id Indonesian
    it Italian
    ja Japanese
    kr Korean
    la Latvian
    lt Lithuanian
    mk Macedonian
    no Norwegian
    nl Dutch
    pl Polish
    pt Portuguese
    pt_br Português Brasil
    ro Romanian
    ru Russian
    sv, se	Swedish
    sk Slovak
    sl Slovenian
    sp, es	Spanish
    sr Serbian
    th Thai
    tr Turkish
    ua, uk Ukrainian
    vi Vietnamese
    zh_cn Chinese Simplified
    zh_tw Chinese Traditional
    zu Zulu

 */