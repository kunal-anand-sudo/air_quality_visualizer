# Air Quality Visualizer for India

### Hosted on heroku - [air-quality-india.herokuapp.com](https://air-quality-india.herokuapp.com/)

**_Update July26_** - Fixed

**_Update July22_** - There is a glitch in this API since the past couple of days, which is causing it to return very few data points sometimes . Other websites using this API are also facing the same issue. I have contacted the author, hoping for a fix soon. 

* Fetches data from [this](https://data.gov.in/resources/real-time-air-quality-index-various-locations) Gov. of India API.
* This API gives air quality data by monitoring pollutants like SO2, NO2, PM2.5, PM10 from 1800 locations in real-time.
* Used [**MapBox Geolocation API**](https://docs.mapbox.com/api/search/geocoding/) to convert addresses fetched from Govt. API into coordinates.
* Used [**Mapbox GL**](https://docs.mapbox.com/mapbox-gl-js/api/), to display the fetched data in the form of a [**HeatMap**](https://en.wikipedia.org/wiki/Heat_map). Mapbox GL is a JavaScript library for interactive, customizable vector maps on the Web.

![Screenshot](https://user-images.githubusercontent.com/42826148/126744366-a5561ec7-74a3-42e4-b141-097ebacb62f7.jpeg)


