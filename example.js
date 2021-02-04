/*
 * Copyright (c) 2021 Sentio Ltd <support@sentio.cloud>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of mosquitto nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

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
