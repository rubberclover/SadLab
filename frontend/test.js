var str =  {
    "name": "Angola",
    "code": "AO",
    "capital": "Luanda",
    "region": "AF",
    "currency": {
        "code": "AOA",
        "name": "Angolan kwanza",
        "symbol": "Kz"
    },
    "language": {
        "code": "pt",
        "name": "Portuguese"
    },
    "flag": "https://restcountries.eu/data/ago.svg"
}

var buf = Buffer.from(JSON.stringify(str));
console.log(buf.length);
