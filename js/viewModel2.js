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


    self.locations = ko.observableArray([]);

    //var locationArray = self.locations();

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
    Place = function(place) {
        this.placeName = place.placeName;
        this.placeId = place.googleId;
        this.foursquareId = place.foursquareId;
        this.showResult = ko.observable(true);
        this.removedResult = ko.observable(false);
        this.marker; // = ko.observable();
        this.infowindow;
        //this.marker.setVisible = function(){};
        this.latlng;
        this.location;
        this.address = "Address Not Found";
        this.city = "";
        //this.results = "";
        this.geocodeStatus = "";
        this.rating = "";
        this.url = "";
        //this.setVisible = function(){};
    };

    Place.prototype.foursquareRequest = function() {
        place = this;
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
    Place.prototype.geocode = function() {
        var place = this;
        geocoder.geocode({ "placeId": place.placeId },
            function(results, status) {
                place.geocodeStatus = status;
                if (status === "OK") {
                    //place.results = results[0];
                    // Store lat long results
                    place.latlng = results[0].geometry.location;
                    place.createMarker();

                } else {
                    console.log("Geocoding " + currentPlace.placeName + " unsuccessful!");
                }
            });
    };

    Place.prototype.createMarker = function() {

        // Create Google Maps Marker
        marker = new google.maps.Marker({
            map: map,
            position: place.latlng,
            title: place.placeName,
            animation: google.maps.Animation.DROP
        });
        // Add marker to markers array
        markers.push(marker);
        // Make marker a property of current place
        this.marker = marker;
    };

    Place.prototype.createInfoWindow = function() {
        // Check Foursquare Results
        // And create html for infowindow contentString
        var place = this;

        // Returns 'Address not found' if address is not found by foursquare or undefined
        if (typeof place.address !== "undefined") {
                place.address = "<span>" + place.address + "</span><br>"
        }
        // Leave off city area if undefined
    if (typeof place.city === "undefined") {
        place.city = "";
    } else {
        place.city = "<span>" + place.city + "</span><br>"
    }

    // Leave off ratings area if undefined
    if (typeof place.rating === "undefined") {
        place.rating = "";
    } else {
        place.rating = "<span>Rating: " + place.rating + "</span><br>"
    }

    // Leave off url area if undefined
    if (typeof place.url === "undefined") {
        place.url = "";
    } else {
        place.url = '<span>URL: <a href="' + place.url + '" target="_blank">' +
            place.url + '</a></span>';
    }

    // Put together a string for the marker's infowindow
    var contentString = "<div id='content'>" +
        "<span>" + place.placeName + "</span><br>" +
        "<span>Address: " + place.address + "</span><br>" +
        place.city +
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
    };

    Place.prototype.addMarkerListener = function() {
        // Add listener to open and close info windows
        this.marker.addListener("click", (function(markerCopy) {
            return function() {
                for (i = 0; i < infoWindows.length; i++) {
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
        })(this.marker));
    };


    // Move location from one list to the other
    Place.prototype.updateList = function() {
        var place = this;
        if (place.showResult() === true) {
            self.remove(place);
            //self.hideMarker(place);
        } else {
            self.show(place);
        }
    };

    // initialize the array of locations
    self.init = function() {
        var len = self.initialLocations.length;
        for (i = 0; i < len; i++) {
            var x = self.initialLocations[i];
            // Instantiate place
            place = new Place(x);
            // puch new place to the locations array
            self.locations().push(place);
            // Send AJAX Request to Foursquare for additional data
            place.foursquareRequest();
            // Geocode Location
            place.geocode();
            // Create Marker for location
            //self.createMarker(place);
            // Create InfoWindow for Marker
            //self.createInfoWindow(place);
            // Add Marker Listener to open infowindow when clicked
            //self.addMarkerListener(place);
            //console.log(place);
        }
    };

    // Move location from one list to the other
    Place.prototype.updateList = function() {
        var place = this;
        if (place.showResult() === true) {
            self.remove(place);
            //self.hideMarker(place);
        } else {
            self.show(place);
        }
    };

    self.filterFunc = function(query) {
        // Convert search query to lower case
        query = query.toLowerCase();
        var length = self.locations().length;

        // Loop through names in array
        for (i = 0; i < length; i++) {
            // Current location to check
            var location = self.locations()[i];
            // Convert to lower case
            var lowerCase = location.placeName.toLowerCase();
            // Check for match of place name to query
            var check1 = lowerCase.indexOf(query);
            // If search is not found location is hidden
            if (check1 > -1) {
                // Show results that match
                self.show(location);
            } else {
                // Hide results that do not hit either match
                self.remove(location);
            }
        }
    };

    // Add location to list of shown places and show marker
    Place.prototype.show = function() {
        var currentPlace = this;
        currentPlace.showResult(true);
        currentPlace.removedResult(false);

        // Add show marker on map
        //currentPlace.setVisible(true);
    };

    // Remove location from shown places and hide marker
    Place.prototype.remove = function() {
        var currentPlace = this;
        currentPlace.showResult(false);
        currentPlace.removedResult(true);

        // Hide marker from map
        //currentPlace.setVisible(false);

        // Close info window if open and location is removed from view
        currentPlace.infoWindow.close();
    };

    // Render all locations
    self.reset = function() {
        // Clear filter box
        self.filterResults("");
        // Reset shown locations
        for (i = 0; i < self.locations().length; i++) {
            self.show(self.locations()[i]);
        }
    };

    // Remove extra search features when using filtering
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

    //self.Place.prototype.setVisible = function(input) {
        //console.log("function exec!")
    //    this.marker.setVisible(input);
    //};

    self.init();
};






