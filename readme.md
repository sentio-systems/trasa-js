# Trasa Public API

Ten projekt demonstruje działanie publicznego interfejsu systemu trasa.

API jest dostępne pod adresem:
```
https://coreapi.trasa.cloud
```

Do wszystkich zapytań proszę użyć tymczasowego tokenu ważnego do 05/03/2021:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiZHJpdmVyIiwidXBuIjoiZGVsaXZlcnkteHByZXNzIiwibmJmIjoxNjEyNDcwODAyLCJleHAiOjE2MTUwNjI4MDIsImlhdCI6MTYxMjQ3MDgwMn0.ajsOQSe7L35TcTTjE4kjGX3ATiNg7OkjgsJFye0uUlE
```

mozna zainstalowac to przykladowe API w jakimkolwiek projekcie nodejs uzywajac polecenia:

```shell
$ npm install trasa --save
```

W pliku `example.js` jest przykład wywołania API ze środowiska NodeJS:

```js
import {
  ServiceClient, Coordinates,
  GeocoderService, RoutingService,
  TripRequest
} from './index.js'

const printBuilding = (building) => {
  return `${building.street} ${building.number}, ${building.zipcode} ${building.city}`
}

const printBuildings = (buildings) => {
  for (const b of buildings) {
    console.log(' -', printBuilding(b))
  }
}

const main = async () => {
  const authKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    'eyJyb2xlIjoiZHJpdmVyIiwidXBuIjoiZGVsa' +
    'XZlcnkteHByZXNzIiwibmJmIjoxNjEyNDcwOD' +
    'AyLCJleHAiOjE2MTUwNjI4MDIsImlhdCI6MTY' +
    'xMjQ3MDgwMn0.ajsOQSe7L35TcTTjE4kjGX3A' +
    'TiNg7OkjgsJFye0uUlE'

  const serviceClient = new ServiceClient(authKey)
  const currentLocation = new Coordinates(18.64498, 54.402) // somewhere in Gdańsk, PL
  const geocoderService = new GeocoderService(serviceClient, currentLocation)
  const routingService = new RoutingService(serviceClient, currentLocation)

  const startingPoint = await geocoderService.bestMatch('mariacka 1')
  const finalPoint = await geocoderService.bestMatch('Oliwska 62')

  const waypoints = [
    await geocoderService.bestMatch('goralska 5c'),
    await geocoderService.bestMatch('zelwerowicza 59'),
    await geocoderService.bestMatch('spacerowa 14 karczemki'),
    await geocoderService.bestMatch('lipowa 5 sopot'),
    await geocoderService.bestMatch('trzy lipy 3')
  ]

  console.log('input:')
  console.log('starting point', printBuilding(startingPoint))
  console.log('final point', printBuilding(finalPoint))
  console.log('waypoints:')
  printBuildings(waypoints)

  const tripRequest = new TripRequest(startingPoint, finalPoint, waypoints)
  const tripResponse = await routingService.optimizeTrip(tripRequest)

  console.log()
  console.log('optimal order:')
  console.log('staring point:', printBuilding(tripResponse.starting_point.building))
  console.log('final point:', printBuilding(tripResponse.final_point.building))
  console.log('waypoints:')
  
  for (const waypoint of tripResponse.waypoints) {
    const buildingString = printBuilding(waypoint.building)
    const leg = tripResponse.legs.filter(w => w.from_building === waypoint.building.id)[0]
    console.log(' - ', buildingString, leg.cost)
  }
}

main()
```

wynik działania tego programu jest nastepujacy:

```
$ node example.js 
input:
starting point Mariacka 1, 80-833 Gdańsk
final point Oliwska 62, 80-542 Gdańsk
waypoints:
 - Góralska 5C, 80-281 Gdańsk
 - Aleksandra Zelwerowicza 59, 80-516 Gdańsk
 - Spacerowa 14, 80-209 Karczemki
 - Lipowa 5, 81-702 Sopot
 - Trzy Lipy 3, 80-172 Gdańsk

optimal order:
staring point: Mariacka 1, 80-833 Gdańsk
final point: Oliwska 62, 80-542 Gdańsk
waypoints:
 -  Trzy Lipy 3, 80-172 Gdańsk { distance: '3827', duration: '448' }
 -  Góralska 5C, 80-281 Gdańsk { distance: '19104', duration: '1408' }
 -  Spacerowa 14, 80-209 Karczemki { distance: '17580', duration: '1604' }
 -  Lipowa 5, 81-702 Sopot { distance: '8432', duration: '1000' }
 -  Aleksandra Zelwerowicza 59, 80-516 Gdańsk { distance: '2901', duration: '394' }
```

# Geocoder

Moduł ten pozwala na zamienianie tekstowych reprezentacji adresów budynków na współrzędne (lat, lng) które nas†epnie są wejściem do algorytmu optymalizacji tras.

Przykład zapytania:

```json
curl --location --request POST 'http://coreapi.trasa.cloud/' \
--header 'Authorization: Bearer [TOKEN]' \
--data-raw '{
    "method": "geocode",
    "params": {
        "location": {
            "latitude": 54.402,
            "longitude": 18.64498
        },
        "mode": "text",
        "text": "spacerowa 14 karczemki"
    }
}'
```
Gdzie `location` to współrzędne naszej obecnej lokalizacji w której się znajdujemy. System zwróci budynki tylko z tego samego województwa w którym obecnie znajdujemy się.

Przykładowa odpowiedź:

```json
{
    "matches": [
        {
            "id": "1000000189200373",
            "coords": {
                "latitude": "54.444917",
                "longitude": "18.381888"
            },
            "city": "Karczemki",
            "street": "Spacerowa",
            "number": "14",
            "zipcode": "80-209"
        }
    ]
}
```

moż też być więcej niż jeden adres który API zwraca, jeśli zapytanie nie jest wystarzcająco dokładne. Dla przykładu, dla zapytania `spacerowa 14` (bez precyzowania miejscowości) otrzymamy: 

```json
{
    "matches": [
        {
            "id": "2264379840",
            "coords": {
                "latitude": "54.068747",
                "longitude": "18.81127"
            },
            "city": "Bałdowo",
            "street": "Spacerowa",
            "number": "14",
            "zipcode": ""
        },
        {
            "id": "2204372255",
            "coords": {
                "latitude": "54.47131",
                "longitude": "18.37392"
            },
            "city": "Bojano",
            "street": "Spacerowa",
            "number": "14",
            "zipcode": "84-207"
        },
        {
            "id": "1000000517760693",
            "coords": {
                "latitude": "54.326844",
                "longitude": "18.325789"
            },
            "city": "Borkowo",
            "street": "Spacerowa",
            "number": "14",
            "zipcode": "83-330"
        },
        ...
  ]
}
```

Jednak wszystko wyniki będą z województwa Pomorskiego (tam gdzie znajduje się parameter `location` w zapytaniu).

# Optymalizacja tras

Przykład zapytania:

```json
curl --location --request POST 'http://coreapi.trasa.cloud/' \
--header 'Authorization: Bearer [TOKEN]' \
--header 'Content-Type: application/json' \
--data-raw '{
    "method": "trip.sync",
    "params": {
        "location": {
            "latitude": 54.402,
            "longitude": 18.64498
        },
        "starting_point": {
            "building": {
                "id": "1000000106811082",
                "city": "Gdańsk",
                "street": "Góralska",
                "number": "5C",
                "zipcode": "80-281",
                "coords": {
                    "latitude": 54.374456,
                    "longitude": 18.564955
                }
            },
            "phone": "+48787912726",
            "notes": null,
            "input_method": "unknown"
        },
        "final_point": {
            "building": {
                "id": "1000000106811082",
                "city": "Gdańsk",
                "street": "Góralska",
                "number": "5C",
                "zipcode": "80-281",
                "coords": {
                    "latitude": 54.374456,
                    "longitude": 18.564955
                }
            },
            "phone": null,
            "notes": null,
            "input_method": "unknown"
        },
        "waypoints": [
            {
                "building": {
                    "id": "1000000095359718",
                    "city": "Gdańsk",
                    "street": "Aleksandra Zelwerowicza",
                    "number": "59",
                    "zipcode": "80-516",
                    "coords": {
                        "latitude": 54.402008,
                        "longitude": 18.644945
                    }
                },
                "notes": "Some random note - one 1",
                "input_method": "unknown"
            },
            {
                "building": {
                    "id": "1000000189200373",
                    "coords": {
                        "latitude": 54.444917,
                        "longitude": 18.381888
                    },
                    "city": "Karczemki",
                    "street": "Spacerowa",
                    "number": "14",
                    "zipcode": "80-209"
                }, 
                "notes": "Tu mieszka Grzesiu",
                "input_method": "unknown"
            },
            {
                "building": {
                    "id": "1000000123806270",
                    "coords": {
                        "latitude": "54.43762",
                        "longitude": "18.565568"
                    },
                    "city": "Sopot",
                    "street": "Lipowa",
                    "number": "5",
                    "zipcode": "81-702"
                },
                "notes": "Some random note - two 2",
                "input_method": "unknown"
            }
        ]
    }
}'
```

przykład odpowiedzi:

```json
{
    "starting_point": {
        "building": {
            "id": "1000000106811082",
            "coords": {
                "latitude": "54.374456",
                "longitude": "18.564955"
            },
            "city": "Gdańsk",
            "street": "Góralska",
            "number": "5C",
            "zipcode": "80-281"
        },
        "phone": "+48787912726",
        "notes": "null",
        "input_method": "unknown"
    },
    "final_point": {
        "building": {
            "id": "1000000106811082",
            "coords": {
                "latitude": "54.374456",
                "longitude": "18.564955"
            },
            "city": "Gdańsk",
            "street": "Góralska",
            "number": "5C",
            "zipcode": "80-281"
        },
        "phone": "null",
        "notes": "null",
        "input_method": "unknown"
    },
    "waypoints": [
        {
            "building": {
                "id": "1000000189200373",
                "coords": {
                    "latitude": "54.444917",
                    "longitude": "18.381888"
                },
                "city": "Karczemki",
                "street": "Spacerowa",
                "number": "14",
                "zipcode": "80-209"
            },
            "notes": "Tu mieszka Grzesiu",
            "input_method": "unknown"
        },
        {
            "building": {
                "id": "1000000123806270",
                "coords": {
                    "latitude": "54.43762",
                    "longitude": "18.565568"
                },
                "city": "Sopot",
                "street": "Lipowa",
                "number": "5",
                "zipcode": "81-702"
            },
            "notes": "Some random note - two 2",
            "input_method": "unknown"
        },
        {
            "building": {
                "id": "1000000095359718",
                "coords": {
                    "latitude": "54.402008",
                    "longitude": "18.644945"
                },
                "city": "Gdańsk",
                "street": "Aleksandra Zelwerowicza",
                "number": "59",
                "zipcode": "80-516"
            },
            "notes": "Some random note - one 1",
            "input_method": "unknown"
        }
    ],
    "legs": [
        {
            "from_building": "1000000106811082",
            "to_building": "1000000189200373",
            "cost": {
                "distance": "19104",
                "duration": "1408"
            }
        },
        {
            "from_building": "1000000189200373",
            "to_building": "1000000123806270",
            "cost": {
                "distance": "17580",
                "duration": "1604"
            }
        },
        {
            "from_building": "1000000123806270",
            "to_building": "1000000095359718",
            "cost": {
                "distance": "8432",
                "duration": "1000"
            }
        },
        {
            "from_building": "1000000095359718",
            "to_building": "1000000106811082",
            "cost": {
                "distance": "7833",
                "duration": "814"
            }
        }
    ],
    "geometry": "e~zjIgzhpBSR[XUZU (...) Dl@@TBZP~AP@b@JL?PCLKHGBEHILQPUHKT]T[ZYRS"
}
```

gdzie `geometry` jest polygonem który ma narysowany kształt mapy [zakodowany w formacie który pozwala od razu wyrenderowac na mapie](https://developers.google.com/maps/documentation/utilities/polylineutility).
