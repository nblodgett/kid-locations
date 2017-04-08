# Name: Kid Locations
## Project: Neighborhood Map

Project is hosted on Github, to run click the link: https://nblodgett.github.io/kid-locations/

Or download the zip file, unzip, and execute index.html.

This project is a single page app utilizing knockout.js framework to display page elements.

The following APIs are used:

Google Maps API for the map information:
	* Map
	* Geocordinates for locations
	* Markers and infowindows

Foursquare API for the location details:
	* Address
	* City
	* Rating
	* URL

## Notes of changes from previous project review


### index.html Changes from code review:
* Line 10:  `type` attributes removed from style sheets and scripts
* Line 14: map div changed to main tag
* Line 53: added `async` and `defer` attributes to Google Maps API loading


### viewModel.js
* double-quotes have been replaced with single-quotes
* initialLocations have been moved out of the viewModel and into model.js
* infowindow was optimized to move and populate with marker's info rather than create multiple infowindows
* Foursquare AJAX request refactored so clicking marker will fire request and load data.
* error handling was added to google maps, foursquare
* if geocode fails, location is removed from the view entirely
* filter function is working
* setVisible called directly on marker object