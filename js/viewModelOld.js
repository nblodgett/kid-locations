var map;
var geocoder;

// Initialize
initMap = function() {
    var mapCenter = {
        lat: 37.6624,
        lng: -121.8820
    };

    // Instantiate Google Maps map
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: mapCenter
    });

    // Instantiate Google Maps Geocoder
    geocoder = new google.maps.Geocoder();

    // Apply bindings and instantiate AppViewModel
    ko.applyBindings(new AppViewModel());
};

function AppViewModel() {
    var self = this;

    // Search box input
    self.filterResults = ko.observable("");

    // Observe when extra features should be disabled
    self.showExtras = ko.observable(true);

    // Observe hamburger input to hide and show menu
    self.navToggle = ko.observable(true);

    // Array of Google Map Markers
    var markers = [];

    // Array of Google Map Infowindows
    var infoWindows = [];

    // Initial array of places
    self.initialLocations = [{
        placeName: "Pump It Up",
        googleId: "ChIJWWlgdKnpj4ARzozLyS5OFOI",
        foursquareId: "4b5b2fe4f964a520a2e928e3"
    }, {
        placeName: "Chuck E. Cheese's",
        googleId: "ChIJfX2QMWrsj4ARwuumaU_NQx0",
        foursquareId: "4b1ae229f964a520e1f323e3"
    }, {
        placeName: "Livermore Cinemas",
        googleId: "ChIJLejCJqDnj4ARE8vd-IHvrdc",
        foursquareId: "4a5fa92bf964a520ffbf1fe3"
    }, {
        placeName: "Mission Hills Park",
        googleId: "ChIJ_2mH4Mbpj4ARXWPztOKr5jc",
        foursquareId: "4c0bd8017e3fc928d8dbf582"
    }, {
        placeName: "Taco Bell",
        googleId: "ChIJe20AkTnpj4ARLqelQBR_Urw",
        foursquareId: "4c0d46f2b1b676b0f957e086"
    }, {
        placeName: "Shadow Cliffs Regional Recreation",
        googleId: "ChIJP40E40Toj4ARde_vhOcsrRY",
        foursquareId: "4b9ac1c8f964a520f0d235e3"
    }];

    // place constructor function
    self.Place = function(place) {
        this.placeName = place.placeName;
        this.placeId = place.googleId;
        this.foursquareId = place.foursquareId;
        this.showResult = ko.observable(true);
        this.removedResult = ko.observable(false);
        this.marker = ko.observable();
        this.infowindow;
        //this.marker.setVisible = function(){};
        this.latlng;
        this.location;
        this.address = "Not Found";
        this.city = "Not Found";
        //this.results;
        this.rating = "Not Found";
        this.url = "Not Found";
        //this.setVisible = function(){};
    };

    self.foursquareRequest = function(place){
        // Foursquare Login Credentials
        var CLIENT_ID = "YZ500XJ5SXV3IXBQVCRCRT3GAYTRWHU3KRSTT5GIABUFW0U5";
        var CLIENT_SECRET = "5QP3GVZZII2BE20DF35QA3BZSEPQDRPI2ZH5QXVRK5XRRKKH";
        var venueId = place.foursquareId;
        var url = "https://api.foursquare.com/v2/venues/" + venueId +
        "?client_id=" + CLIENT_ID + "&client_secret=" + CLIENT_SECRET +
        "&v=20170403";

        // Foursquare AJAX Request
        $.ajax({
            url: url,
            datatype: "json",
            success: function(data) {
                // Store rating, url, location (address & city) for infowindow
                place.rating = data.response.venue.rating;
                place.url = data.response.venue.url;
                place.location = data.response.venue.location;
                place.address = place.location.address;
                place.city = place.location.city;
            }
        });
    };

    // Geocode location
    // Adapted from Google geocoding documentation
    // https://developers.google.com/maps/documentation/geocoding/intro
    self.geocode = function(place) {
        geocoder.geocode({ "placeId": place.placeId },
            function(results, status) {
                if (status === "OK") {
                    // Store results from geocode request
                    //place.results = results;
                    // Store lat long results
                    place.latlng = results[0].geometry.location;
                    // Create Google Maps Marker
                    marker = new google.maps.Marker({
                        map: map,
                        position: place.latlng,
                        title: place.placeName,
                        animation: google.maps.Animation.DROP
                    });

                    // Check Foursquare Results
                    // Leave off ratings area if undefined
                    if(typeof place.rating === "undefined") {
                        place.rating = "";
                        } else {
                            place.rating = "<span>Rating: " + place.rating + "</span><br>"
                    }
                    // Leave off url area if undefined
                    if(typeof place.url === "undefined") {
                        place.url = "";
                        } else {
                            place.url = '<span>URL: <a href="' + place.url + '" target="_blank">' +
                            place.url + '</a></span>';
                    }

                    // Put together a string for the marker's infowindow
                    var contentString = "<div id='content'>" +
                    "<span>" + place.placeName + "</span><br>" +
                    "<span>Address: " + place.address + "</span><br>" +
                    "<span>City: " + place.city + "</span><br>" +
                    place.rating +
                    place.url +
                    '<img src="img/foursquare.png" class="foursquareImg" style="display: block; max-width: 100px">';

                    // Create info window for each pin
                    var infoWindow = new google.maps.InfoWindow({
                        content: contentString
                    });

                    // Define infowindow as a property of current place
                    place.infoWindow = infoWindow;
                    // Push infowindow to an infoWindow array
                    infoWindows.push(infoWindow);

                    // Add listener to open and close info windows
                    marker.addListener ("click", (function(markerCopy) {
                        return function() {
                            for(i = 0; i < infoWindows.length; i++) {
                                // Close all open info windows
                                infoWindows[i].close();
                                // Stop all existing marker animations
                                markers[i].setAnimation(null);
                            }
                            // Center the map to the marker
                            map.setCenter(markerCopy.getPosition());
                            // Open info window on clicked marker
                            infoWindow.open(map, markerCopy);
                            // Animate clicked marker
                            markerCopy.setAnimation(google.maps.Animation.BOUNCE);
                        };
                    })(marker));

                    // Add marker to markers array
                    markers.push(marker);
                    // Make marker a property of current place
                    place.marker = marker;
                    return place;
                    // If Geocoding was not successfull log it
                } else {
                    console.log("Geocoding " + currentPlace.placeName + " unsuccessful!");
                }
                return place;
            });
        return place;
    };

    self.Place.prototype.setVisible = function(input) {
        console.log("function exec!")
        self.Place.prototype.marker.setVisible(input);
    };

    self.markerBounce = function(place) {
        // Stop any marker animation and close info windows
        self.stopAllMarkers();
        // Center the window to the highlighted marker
        map.setCenter(place.marker.getPosition());
        // Set marker selected marker to animate
        place.marker.setAnimation(google.maps.Animation.BOUNCE);
        // Open selected marker's info window
        place.infoWindow.open(map, place.marker);
    };

    self.stopAllMarkers = function() {
        for(i = 0; i < infoWindows.length; i++) {
            // Close all open info windows
            infoWindows[i].close();
            // Stop all existing marker animations
            markers[i].setAnimation(null);
        }
    };


    self.Place.prototype.showMarker = function() {
        Place.marker.setVisible(true);
    };

    self.Place.prototype.hideMarker = function() {
        Place.marker.setVisible(false);
    };


    // initialize the array of locations
    self.init = function() {
        var len = self.initialLocations.length;
        for (i = 0; i < len; i++) {
            var x = self.initialLocations[i];
            // Instantiate place
            place = new self.Place(x);
            // puch new place to the locations array
            self.locations().push(place);
            // Send AJAX Request to Foursquare for additional data
            self.foursquareRequest(place);
            // Geocode place and populate map
            self.geocode(place);
        }
    };

    self.locations = ko.observableArray([]);
    var locationArray = self.locations();

    self.init();


    // Move location from one list to the other
    self.updateList = function(place) {
        if (place.showResult() === true) {
            self.remove(place);
            //self.hideMarker(place);
        } else {
            self.show(place);
        }
    };









    // Check location tags against checked tags, return true if match
    /*
    self.verify = function(location) {

        //console.log(location);
        var array = self.toggleList();
        // Loop through locations[i].tags
        for (ii = 0; ii < location.types.length; ii++) {
            // Check if the current location tag is still checked in the toggleList
            var test = array.indexOf(location.types[ii]);
            // If location tag is checked in toggleList, condition met and location is rendered
            if (test > -1) {
                self.show(location);
                return;
            }
            // No match for any tags, remove location from rendered list
            self.remove(location);
        }

    };
    */
    //TODO: finish filter function

    self.filterFunc = function(query) {
        // Keeps track of at least one result from search
        // to keep current results visible rather than clear search list
        // with bad search query
        //var newResults = ko.observable(false);

        // Convert search query to lower case
        query = query.toLowerCase();
        //console.log('query: ' + query);

        var length = self.locations().length;
        //console.log("length: " + length);
        // Loop through names in array
        for (i = 0; i < length; i++) {
            //console.log(length);
            //console.log("ran " + i);

            // Current location to check
            var location = self.locations()[i];

            //console.log(location.types);

            // Initially remove location
            //self.remove(location);

            // Convert to lower case
            //console.log(location.placeName());
            var lowerCase = location.placeName.toLowerCase();
            //console.log(lowerCase);

            // Check for match of place name to query
            var check1 = lowerCase.indexOf(query);
            //console.log("check1 = " + check1)

            // Convert tags of location to string
            //var toString = location.types;
            //console.log("toString = " + toString);

            // Check for a match of search query to tags
            //check2 = toString.indexOf(query);
            //console.log("check2 = " + check2);
            // If search is not found location is hidden
            if (check1 > -1) { // || check2 <= -1) {
                // Show results that match
                self.show(location);
            } else {
                // Hide results that do not hit either match
                self.remove(location);
            }
        }
    };

    // Update both lists based on checkbox statuses
    /*
    self.checkList = ko.computed(function() {

        // Loop through locations

        var location = self.locations();
        for (i = 0; i < location.length; i++) {
            self.verify(location[i]);
        }

    });
    */



    // Add setVisible function to Place constructor
    //self.Place.prototype.toggleMarker = function(trueOrFalse) {
    //    this.marker.setVisible(trueOrFalse);
    //};

    /*
    // Hide or Show marker on Google Map
    self.toggleMarker = function(input) {
        this.marker.setVisible(input)
    }
    */



    // Add location to list of shown places and show marker
    self.show = function(currentPlace) {
        currentPlace.showResult(true);
        currentPlace.removedResult(false);

        // Add show marker on map
        currentPlace.setVisible(true);
        //currentPlace.toggleMarker(true);
        //currentPlace.marker.setVisible(true);
    };

    // Remove location from shown places and hide marker
    self.remove = function(currentPlace) {
        currentPlace.showResult(false);
        currentPlace.removedResult(true);

        // Hide marker from map
        currentPlace.setVisible(false);
        //currentPlace.showMarker();
        //currentPlace.toggleMarker(false);

        // Close info window if open and location is removed from view
        currentPlace.infoWindow.close();
    };

        // Render all locations
    self.reset = function() {
        // Clear filter box
        self.filterResults("");
        // Reset checkboxes array
        //self.toggleList.removeAll();
        //self.toggleList(self.types().slice());
        // Reset shown locations
        for (i = 0; i < self.locations().length; i++) {
            self.show(self.locations()[i]);
        }
    };

    // Remove extra search features when search bar
    self.filterResultsFunc = ko.computed(function() {
        // Filter Results
        // If there is no input in the filter box, bring back extra filtering features
        if (self.filterResults() === "") {
            self.reset();
            // Show extra filtering features
            self.showExtras(true);
        } else {
            // Hide extra filtering features;
            self.showExtras(false)
            // Filter shown results
            self.filterFunc(self.filterResults());
        }
    });

    self.Place.prototype.setVisible = function(input) {
        console.log("function exec!")
        this.marker.setVisible(input);
    };
};
