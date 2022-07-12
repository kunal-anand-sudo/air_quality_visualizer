import './App.css';
import React, { useRef, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import axios from 'axios'
import mapboxgl, { Marker } from 'mapbox-gl'
import coordinateJSON from './coordinateJSON.json'

// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;


mapboxgl.accessToken = process.env.REACT_APP_MAPBOX



function App() {

  const [showCard, setShowCard] = useState(true)
  const [properties, setProperties] = useState()


  const markerClicked = (title) => {
    // alert(title.place)
    setProperties(title)
    setShowCard(true)
  };


  const Marker = ({ onClick, children, feature }) => {
    const _onClick = (e) => {
      onClick(feature.properties);
    };

    const _onLeave = (e) => {
      setShowCard(false);
      setProperties()
    };

    return (

      <div className="opacity-0 hover:opacity-100 flex-col">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-6 text-gray-400 cursor-pointer" fill="black" viewBox="0 0 24 24" stroke="currentColor" onClick={_onClick} onMouseOver={_onClick} onMouseEnter={_onClick} onMouseLeave={_onLeave}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>


      </div>
    );
  };

  const [pollutionData, setPollutionData] = useState()
  const [seperateData, setSeperateData] = useState()

  useEffect(() => {
    const fetchPollutionData = async () => {
      try {

        let res = await axios.get('https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?format=json&offset=0&limit=10000&api-key=' + process.env.REACT_APP_GOV)
        res = res.data.records
        let mp = new Map()
        let arr = []
        let arr2 = []

        for (let rec of res) {
          if (rec.pollutant_avg === 'NA') continue
          if (!coordinateJSON[rec.station]) continue

          if (mp.has(rec.station)) {
            arr[mp.get(rec.station)].properties.avgPoll += parseInt(rec.pollutant_avg)
            arr2[mp.get(rec.station)].properties.pollutants.push({ pollutant_id: rec.pollutant_id, pollutant_avg: rec.pollutant_avg })
          }
          else {

            arr2.push({ type: "Feature", properties: { place: rec.station + ", " + rec.state, last_update: rec.last_update, pollutants: [{ pollutant_id: rec.pollutant_id, pollutant_avg: rec.pollutant_avg }] }, geometry: { coordinates: coordinateJSON[rec.station], type: "Point" } })
            arr.push({ type: "Feature", geometry: { type: "Point", coordinates: coordinateJSON[rec.station] }, properties: { 'avgPoll': parseInt(rec.pollutant_avg) } })
            mp.set(rec.station, arr.length - 1)
          }
        }
        // console.log({ arr, arr2 })
        setPollutionData({ type: "FeatureCollection", features: arr })
        setSeperateData({ type: "FeatureCollection", features: arr2 })

      } catch (err) {
        console.log(err)
      }

    }



    fetchPollutionData()



  }, [])

  useEffect(() => {



    if (pollutionData && seperateData && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        // style: 'mapbox://styles/dc2121dc/ckqr6uq8c402u19n2us8mv7m8',
        style: 'mapbox://styles/dc2121dc/ckqu1789a01xd17s298atr4el',

        center: [lng, lat],
        zoom: zoom
      });
      map.current.on('move', () => {
        setLng(map.current.getCenter().lng.toFixed(4));
        setLat(map.current.getCenter().lat.toFixed(4));
        setZoom(map.current.getZoom().toFixed(2));
      });

      map.current.on('load', function () {

        seperateData.features.forEach((feature) => {
          // Create a React ref
          const ref = React.createRef();
          // Create a new DOM node and save it to the React ref
          ref.current = document.createElement('div');
          // Render a Marker Component on our new DOM node
          ReactDOM.render(
            <Marker onClick={markerClicked} feature={feature} />,
            ref.current
          );
          // Create a Mapbox Marker at our new DOM node
          new mapboxgl.Marker(ref.current)
            .setLngLat(feature.geometry.coordinates)
            .addTo(map.current);
        });

        /********************************************************************************** */



        map.current.addSource('trees', {
          type: 'geojson',
          data: pollutionData
        });
        // add heatmap layer here
        map.current.addLayer({
          id: 'trees-heat',
          type: 'heatmap',
          source: 'trees',
          maxzoom: 15,
          paint: {
            // increase weight as diameter breast height increases
            'heatmap-weight': {
              property: 'avgPoll',
              type: 'exponential',
              stops: [
                [1, 0],
                [50, 1]
              ]
            },
            // increase intensity as zoom level increases
            'heatmap-intensity': {
              stops: [
                [11, 1],
                [15, 3]
              ]
            },
            // assign color values be applied to points depending on their density
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(25, 25, 112,0)',
              0.2, 'rgb(53, 94, 59)',
              0.4, 'rgb(228,155,15)',
              0.6, 'rgb(255,140,0)',
              0.8, 'rgb(136,8,0)'
            ],
            // increase radius as zoom increases
            'heatmap-radius': {
              stops: [
                [11, 15],
                [15, 20]
              ]
            },
            // decrease opacity to transition into the circle layer
            'heatmap-opacity': {
              default: 1,
              stops: [
                [14, 1],
                [15, 0]
              ]
            },
          }
        }, 'waterway-label');

        // add circle layer here
        map.current.addLayer({
          id: 'trees-point',
          type: 'circle',
          source: 'trees',
          minzoom: 14,
          paint: {
            // increase the radius of the circle as the zoom level and dbh value increases
            'circle-radius': {
              property: 'dbh',
              type: 'exponential',
              stops: [
                [{ zoom: 15, value: 1 }, 5],
                [{ zoom: 15, value: 62 }, 10],
                [{ zoom: 22, value: 1 }, 20],
                [{ zoom: 22, value: 62 }, 50],
              ]
            },
            'circle-color': {
              property: 'dbh',
              type: 'exponential',
              stops: [
                [0, 'rgba(236,222,239,0)'],
                [10, 'rgb(236,222,239)'],
                [20, 'rgb(208,209,230)'],
                [30, 'rgb(166,189,219)'],
                [40, 'rgb(103,169,207)'],
                [50, 'rgb(28,144,153)'],
                [60, 'rgb(1,108,89)']
              ]
            },
            'circle-stroke-color': 'white',
            'circle-stroke-width': 1,
            'circle-opacity': {
              stops: [
                [14, 0],
                [15, 1]
              ]
            }
          }
        }, 'waterway-label');

      });

    }
  }, [pollutionData, seperateData])



  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(77.12);
  const [lat, setLat] = useState(22.41);
  const [zoom, setZoom] = useState(3.5);

  const printArr = (arr) => {
    let str
    for(let i=0; i<arr.length; i++) {
      if(!arr[i] || !arr[i].pollutant_id || !arr[i].pollutant_avg) continue 
      str+=arr[i].pollutant_id
      str+=':'
      str+=arr[i].pollutant_avg
      str+=' | '
    }
    str = str.split('d')[2]
    return str.slice(0,-2)
  }

  return (
    <div className="App">
      {(!showCard||!properties) && <div className="sidebar">
        Air Quality Index 
        <br/>
        (Hover/Click on any Location for Details)
        <br/>
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>}

        {showCard && properties && <div className="sidebar">
          {properties.place}
          <br />
          {'Last Update: ' + properties.last_update}
          <br />
          {printArr(properties.pollutants)}
          

        </div>}


      <div ref={mapContainer} className="map-container" />
    </div>
  );
}

export default App;
