var map;
var geocoder;
var infowindow;

// Global function that is called when Google Maps Authentication fails
function gm_authFailure() {
    alert('There is a problem with Google Maps, please try again later...');
};

// Initialize
initMap = function() {
    var mapCenter = {
        lat: 37.6624,
        lng: -121.8820
    };
    // Instantiate Google Maps map
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: mapCenter
    });
    // Instantiate Google Maps InfoWindow
    infowindow = new google.maps.InfoWindow();
    // Instantiate Google Maps Geocoder
    geocoder = new google.maps.Geocoder();
    // Apply bindings and instantiate AppViewModel
    ko.applyBindings(new AppViewModel());
};

function AppViewModel() {
    var self = this;
    // place constructor function
    self.Place = function(place) {
        this.placeName = place.placeName;
        this.placeId = place.googleId;
        this.foursquareId = place.foursquareId;
        this.showResult = ko.observable(true);
        this.removedResult = ko.observable(false);
        this.marker;
        //this.infowindow = ko.observable();
        this.latlng;
        this.location;
        this.status = ko.observable(true); // Google geocoding status
        this.address = ko.observable('');
        this.city = ko.observable('');
        this.rating = ko.observable('');
        this.url = ko.observable('');
        this.foursquarePng = '<img src="img/foursquare.png" style="display: block; width: 100px">';
        this.windowInfo = ko.computed(function() {
            return this.placeName + this.address() + this.city() + this.rating() + this.url() + this.foursquarePng;
        }, this);
        // Geocode location
        self.geocode(this);
    };

    // Search box input
    self.filterResults = ko.observable('');

    // Observe when extra features should be disabled
    self.showExtras = ko.observable(true);

    // Observe hamburger input to hide and show menu
    self.navToggle = ko.observable(true);

    // Array of Google Map Markers
    var markers = [];

    // Observable array of listed locations
    self.locations = ko.observableArray([]);

    self.foursquareRequest = function(place) {
        // Foursquare Login Credentials
        var CLIENT_ID = 'YZ500XJ5SXV3IXBQVCRCRT3GAYTRWHU3KRSTT5GIABUFW0U5';
        var CLIENT_SECRET = '5QP3GVZZII2BE20DF35QA3BZSEPQDRPI2ZH5QXVRK5XRRKKH';
        var venueId = place.foursquareId;
        var url = 'https://api.foursquare.com/v2/venues/' + venueId +
            '?client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET +
            '&v=20170403';
        // Foursquare AJAX Request
        $.ajax({
            url: url,
            datatype: "json",
            success: function(data) {
                place.data = data;
                // store rating if defined (requested successfully from Foursquare)
                if (typeof place.data.response.venue.rating !== 'undefined') {
                    place.rating('<span>Rating: ' + place.data.response.venue.rating + '</span><br>');
                }
                // store URL if defined (requested successfully from Foursquare)
                if (typeof place.data.response.venue.url !== 'undefined') {
                    place.url('<a target="blank" href="' + place.data.response.venue.url + '">' + place.data.response.venue.url + '</a><br>');
                }
                // store city if defined (requested successfully from Foursquare)
                if (typeof place.data.response.venue.location.city !== 'undefined') {
                    place.city('<span>' + place.data.response.venue.location.city + '</span><br>');
                }
                // store address if defined (requested successfully from Foursquare)
                if (typeof place.data.response.venue.location.address !== 'undefined') {
                    place.address('<br><span>' + place.data.response.venue.location.address + '</span><br>');
                } else {
                    place.address('<img src="img/sad.gif" alt="sad day" style="display: block; max-width: 100px">' +
                        '<div style = "display: block">Error retrieving address-<br>Try Refreshing...</div>');
                }
                self.changeInfowindow(place);
            },
            // If Foursquare request fails, display error in infowindow
            error: function() {
                place.address('<img src="img/sad.gif" alt="sad day" style="display: block; max-width: 200px">' +
                    '<div style = "display: block"> Foursquare failed to return results-<br>Please try again later...</div>');
                    self.changeInfowindow(place);
            }
        });
    };

    // Geocode location
    // Adapted from Google geocoding documentation
    // https://developers.google.com/maps/documentation/geocoding/intro
    self.geocode = function(place) {
        geocoder.geocode({ 'placeId': place.placeId },
            function(results, status) {
                if (status === 'OK') {
                    place.status(true);
                    place.latlng = results[0].geometry.location;
                    // Create Google Maps Marker
                    marker = new google.maps.Marker({
                        map: map,
                        position: place.latlng,
                        title: place.placeName,
                        animation: google.maps.Animation.DROP
                    });
                    // Make current marker a property of place
                    place.marker = marker;
                    // Add marker to markers array
                    markers.push(marker);
                    // Add marker listener
                    place.marker.addListener('click', (function(markerCopy) {
                        return function() {
                        self.foursquareRequest(place);
                        }
                    })(place.marker));
                    // If Geocoding was not successfull remove from list and flag status as false
                } else {
                    place.status(false);
                    place.showResult(false);
                    place.removedResult(false);
                }
            });
    };

    self.changeInfowindow = function(place) {
        self.stopAllMarkers();
        // Center the window to the clicked location
        map.setCenter(place.marker.getPosition());
        // Update infowindow with current marker's info
        infowindow.setContent(place.windowInfo());
        // Set marker selected marker to animate
        place.marker.setAnimation(google.maps.Animation.BOUNCE);
        // Open selected marker's info window
        infowindow.open(map, place.marker);
    }

    // Stop any existing markers bouncing
    self.stopAllMarkers = function() {
        for (i = 0; i < markers.length; i++) {
            // Stop all existing marker animations
            markers[i].setAnimation(null);
        }
    };

    // initialize the array of locations
    self.init = function() {
        var len = initialLocations.length;
        for (i = 0; i < len; i++) {
            var x = initialLocations[i];
            // Instantiate place
            place = new self.Place(x);
            // push new place to the locations array
            self.locations().push(place);
        }
    };

    // Move location from one list to the other
    self.updateList = function(place) {
        if (place.showResult() === true) {
            self.remove(place);
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
            if (check1 > -1) { // || check2 <= -1) {
                // Show results that match
                self.show(location);
            } else {
                // Hide results that do not hit either match
                self.remove(location);
            }
        }
    };

    // Set visible function declared to avoid errors on init()
    self.setVisible = function() {}

    // Add location to list of shown places and show marker
    self.show = function(currentPlace) {
        currentPlace.showResult(true);
        currentPlace.removedResult(false);
        // Add show marker on map
        self.setVisible(currentPlace, true);
    };

    // Remove location from shown places and hide marker
    self.remove = function(currentPlace) {
        currentPlace.showResult(false);
        currentPlace.removedResult(true);
        // Hide marker from map
        self.setVisible(currentPlace, false);
        // Close info window if locations are being removed from view
        infowindow.close();
    };

    // Render all locations
    self.reset = function() {
        // Clear filter box
        self.filterResults('');
        // Reset shown locations
        for (i = 0; i < self.locations().length; i++) {
            // If geocode status was ok then show location
            if (self.locations()[i].status() === true) {
                self.show(self.locations()[i]);
            }
        }
    };

    // Remove extra search features when search bar
    self.filterResultsFunc = ko.computed(function() {
        // Filter Results
        // If there is no input in the filter box, bring back extra filtering features
        if (self.filterResults() === '') {
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

    // Show or hide a marker
    self.setVisible = function(place, input) {
        place.marker.setVisible(input);
    };

    // INIT
    self.init();
};
