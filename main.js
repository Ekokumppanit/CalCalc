$.fn.show_message = function (message) {
  return this.each(function () {
    $(this).parent('div').parent().children('.' + message + '-msg').removeClass('hide');
  });
};

$.fn.hide_message = function (message) {
  return this.each(function () {
    $(this).parent('div').parent().children('.' + message + '-msg').addClass('hide');
  });
};

$.fn.valueChanged = function (callback) {
  return this.each(function () {
    var el = $(this),
        prev = null,
        focus = function () {
          prev = el.attr('value');
        },
        change = function () {
          var val = el.attr('value');
          if (val !== prev) {
            prev = val;
            callback.apply(this);
          }
        };
    el.bind('focus', focus).bind('blur', change).bind('keyup', change);
  });
};

var toFloat = function (str) {
  return Number(str.replace(/,/g, '.'));
};
var displayFloat = function (num) {
  return num.toString().replace(/\./g, ',');
};

// Okay, this should have been done using eq. JQuery-BBQ
// But changing it now would require some hacks as we don't want to break
// existing urls.
// (places=place+1;place+2 vs. places[]=place+1&places[]=place+2)
var HashSave = {
  settings: {
    filter: null,
    types: {},
    display: {}
  },
  init: function (settings) {
    $.extend(true, HashSave.settings, settings);
  },
  save: function (dict) {
    var hash = [],
        encode = function (value) {
          if (typeof value === 'string') {
            return value.replace(/\ /g, '+');
          }
          return value;
        };

    for (var key in dict) {
      if ((1 + $.inArray(key, HashSave.settings.ignored)) ||
          HashSave.settings.filter === null ||
          HashSave.settings.filter(key)) {
        continue;
      }

      var val;
      if ($.isArray(dict[key])) {
        var r = [];
        for (var i in dict[key]) {
          r.push(encode(dict[key][i]));
        }
        val = r.join(';');
      } else {
        val = encode(dict[key]);
      }
      hash.push(key + '=' + val);
    }

    location.hash = '!' + hash.join('&');
  },
  load: function (dict) {
    var hash = location.hash,
        display = HashSave.settings.display,
        decode = function (type, value) {
          if (type === 'string') {
            return value.replace(/\+/g, ' ');
          } else if (type === 'Number') {
            return toFloat(value);
          }
          return value;
        },
        types = HashSave.settings.types;

    if (!hash || hash[1] !== '!') return false;

    hash = hash.slice(2).split('&');
    for (var i in hash) {
      var a = hash[i].split('='),
          key = a[0], value = a[1];

      if ($.isArray(types[key])) {
        value = value.split(';');
        for (var b in value) {
          value[b] = decode(types[key][b], value[b]);
        }
      } else {
        value = decode(types[key], value);
      }

      console.log(value);
      dict[key] = value;
      if (key in display) {
        display[key]();
      }
    }

    return true;
  }
};

var CalCalc = {
  mets: {
    bike: {
      text: 'Pyöräillen',
      text2: 'pyöräilen',
      travelMode: google.maps.TravelMode.BICYCLING,
      googleLink: '&mra=ltm&lci=bike&z=14&oq=mann&t=h&dirflg=b',
      data: {
        18: {activity: 'Hidas', met: 6.8, description: '16-19 km/h'},
        21: {activity: 'Normaali', met: 8.0, description: '19-23 km/h'},
        24: {activity: 'Nopea', met: 10.0, description: '23-26 km/h'}
      }
    },
    foot: {
      text: 'Jalan',
      text2: 'kuljen jalan',
      travelMode: google.maps.TravelMode.WALKING,
      googleLink: '&t=h&dirflg=w&mra=ltm&z=14',
      data: {
        5: {activity: 'Kävely', met: 3.0, description: '70 m/min'},
        12: {activity: 'Juoksu', met: 11.8, description: '200 m/min'}
      }
    }
  },
  genders: {
    0: 'Puuttuu',
    1: 'Mies',
    2: 'Nainen'
  },
  calories: [
    {name: 'omenaa', kcal: 46},
    {name: 'maitolasillista', kcal: 100},
    {name: 'jäätelötuuttia', kcal: 200},
    {name: 'korvapuustia', kcal: 380},
    {name: 'hampurilaista', kcal: 500},
    {name: 'pakastepizzaa', kcal: 900},
    {name: 'sipsipussia', kcal: 1800}
  ],
  vars: {
    places: [null, null],
    calories: 0,
    weight: 70, // default weight
    distance: 0,
    method: ['bike', 21],
    gender: 0
  },
  settings: {
    reporting: false
  },
  display: {
    places: function () {
      $("#place1").attr('value', CalCalc.vars.places[0]);
      $("#place2").attr('value', CalCalc.vars.places[1]);
    },
    calories: function () {
      $('#calories').html(CalCalc.vars.calories);
    },
    distance: function () {
      $('#distance').attr('value', displayFloat(CalCalc.vars.distance));
    },
    weight: function () {
      $('#weight').attr('value', displayFloat(CalCalc.vars.weight));
    },
    method: function () {
      var el = $('#selectedSpeed');
      el.find('.activity').html(CalCalc.mets[CalCalc.vars.method[0]].text + ', ' + CalCalc.mets[CalCalc.vars.method[0]].data[CalCalc.vars.method[1]].activity);
      el.find('.description').html(CalCalc.mets[CalCalc.vars.method[0]].data[CalCalc.vars.method[1]].description);

      $('#speed li').removeClass('active');
      $('#speed a[data-method=' + CalCalc.vars.method[0] + '][data-speed=' + CalCalc.vars.method[1] + ']').parent().addClass('active');
    },
    url: function (value) {
      return value.replace(/\ /g, '+');
    }
  },
  onReady: function () {
    // Google Places Autocomplete
    var autocompleteOptions = {componentRestrictions: {country: 'fi'}, types: ['geocode']},
        place1complete = new google.maps.places.Autocomplete($('#place1').get(0), autocompleteOptions),
        place2complete = new google.maps.places.Autocomplete($('#place2').get(0), autocompleteOptions);

    // Activate inputs with prefilled data
    $('#weight').attr('placeholder', CalCalc.vars.weight);
    $('#distance').attr('placeholder', CalCalc.vars.distance);
    var speedList = '';
    for (var method in CalCalc.mets) {
      speedList += '<li class="nav-header">' + CalCalc.mets[method].text + '</li>';
      for (var speed in CalCalc.mets[method].data) {
        speedList += '<li><a href="#" data-method="' + method + '" data-speed="' + speed + '">' + CalCalc.mets[method].data[speed].activity + '</a></li>';
      }
    }
    $('#speed').html(speedList);
    CalCalc.display.method();

    // Update variables if input value changes
    $('#place1, #place2').bind('keyup', function (event) {
      if (event.keyCode === 13) {
        if (CalCalc.addressChange()) {
          $(this).blur();
          $(this).addClass('focus');
        }
      }
    });
    $('#compute').click(CalCalc.addressChange);
    $('#weight').valueChanged(CalCalc.weightChange);
    $('#distance').valueChanged(CalCalc.distanceChange);
    $('#speed').find('a').click(CalCalc.speedChange);
    $('#gender').find('button').click(CalCalc.genderChange);

    HashSave.init({
      ignored: ['gender', 'calories'],
      filter: function (key) {
        // Skip distance if both places are set
        // Skip places if either of places is null
        return ((CalCalc.vars.places[0] !== null && CalCalc.vars.places[1] !== null) && key === 'distance') ||
               ((CalCalc.vars.places[0] === null || CalCalc.vars.places[1] === null) && key === 'places');
      },
      types: {
        calories: 'Number',
        weight: 'Number',
        distance: 'Number',
        method: ['string', 'Number'],
        places: ['string', 'string']
      },
      display: CalCalc.display
    });


    // Read hashbang
    if (HashSave.load(CalCalc.vars)) {
      if (CalCalc.vars.places[0] !== null && CalCalc.vars.places[1] !== null) {
        CalCalc.updateRoute();
      } else {
        CalCalc.update();
      }
    }

    // Android - Dropdown fix - Bootstrap 2.1.1
    // https://github.com/twitter/bootstrap/issues/4550
    $('body').on('touchstart.dropdown', '.dropdown-menu', function (e) {
      e.stopPropagation();
    });
    $('a.dropdown-toggle').on('touchstart', function (e) {
      e.stopPropagation();
    });
  },
  update: function () {
    var reportTimeout = null;
    return function () {
      if (CalCalc.vars.distance !== null &&
          CalCalc.vars.method[0] !== null && CalCalc.vars.method[1] !== null &&
          CalCalc.vars.weight !== null) {

        var duration = CalCalc.vars.distance / CalCalc.vars.method[1], // -> hours
            met = CalCalc.mets[CalCalc.vars.method[0]].data[CalCalc.vars.method[1]].met;

        CalCalc.vars.calories = (met * CalCalc.vars.weight * duration).toFixed(0);

        CalCalc.display.calories();

        var multi,
            food,
            fuu = 0;

        for (var i in CalCalc.calories) {
          if (CalCalc.vars.calories > CalCalc.calories[i].kcal) {
            fuu = i;
          }
        }

        food = CalCalc.calories[fuu].name;
        multi = (CalCalc.vars.calories / CalCalc.calories[fuu].kcal).toFixed(2);
        if (multi > 0) {
          $('#control').html(', tämä vastaa ' + displayFloat(multi) + ' ' + food);
        } else {
          $('#control').html('');
        }


        // 5 sec after latest update, report values
        clearTimeout(reportTimeout);
        reportTimeout = setTimeout(CalCalc.report, 5000);

        HashSave.save(CalCalc.vars);
      }
    };
  }(),
  distanceChange: function () {
    var el = $('#distance').removeClass('from-route'),
        distance = toFloat(el.attr('value'));

    if (!isNaN(distance)) {
      CalCalc.vars.places[0] = null;
      CalCalc.vars.places[1] = null;
      $('#place1').attr('value', '').hide_message('error');
      $('#place2').attr('value', '').hide_message('error').hide_message('zero-results').hide_message('google-maps');

      CalCalc.vars.distance = distance || 0;
      el.hide_message('error');
      CalCalc.update();
    } else {
      CalCalc.vars.distance = null;
      el.show_message('error');
    }
  },
  weightChange: function () {
    var el = $(this),
        weight = toFloat(el.attr('value'));

    if (!isNaN(weight)) {
      CalCalc.vars.weight = weight || toFloat(el.attr('placeholder'));
      el.hide_message('error');
      CalCalc.update();
    } else {
          // Parse error - weight not number
      CalCalc.vars.weight = null;
      el.show_message('error');
    }
  },
  speedChange: function (e) {
    e.preventDefault();

    var data = $(this).data('speed');
    var data2 = $(this).data('method');
    if (data2 in CalCalc.mets && data in CalCalc.mets[data2].data) {
      CalCalc.vars.method = [data2, data];
      CalCalc.display.method();
      if (!CalCalc.updateRoute()) {
        CalCalc.update();
      }
    }
  },
  genderChange: function () {
    var data = $(this).data('gender');
    if (data in CalCalc.genders) {
      CalCalc.vars.gender = data;
    }
  },
  addressChange: function () {
    CalCalc.vars.places[0] = $("#place1").attr('value');
    CalCalc.vars.places[1] = $("#place2").attr('value');
    CalCalc.updateRoute();

    return CalCalc.vars.places[0] !== '' && CalCalc.vars.places[1] !== '';
  },
  updateRoute: function () {
    var service = new google.maps.DirectionsService();
    return function () {
      $("#place2").hide_message('zero-results').hide_message('not-found');
      if (!CalCalc.vars.places[0] || !CalCalc.vars.places[1]) return false;

      var request = {
        destination: CalCalc.vars.places[1],
        origin: CalCalc.vars.places[0],
        travelMode: CalCalc.mets[CalCalc.vars.method[0]].travelMode,
        region: 'fi'
      };

      service.route(request, function (result, status) {
        // console.log(status);
        if (status === google.maps.DirectionsStatus.ZERO_RESULTS) {
          $("#place2").show_message('zero-results').hide_message('google-maps');
        } else if (status === google.maps.DirectionsStatus.NOT_FOUND) {
          $("#place2").show_message('not-found').hide_message('google-maps');
        } else if (status === google.maps.DirectionsStatus.OK && result.routes.length !== 0 || result.routes[0].legs.length !== 0) {
          $("#place2").show_message('google-maps');
          $(".google-maps-msg").attr('href', 'https://maps.google.com/maps?saddr=' + CalCalc.display.url(CalCalc.vars.places[0]) + '&daddr=' + CalCalc.display.url(CalCalc.vars.places[1]) + CalCalc.mets[CalCalc.vars.method[0]].googleLink);

          // console.log(result.routes[0].legs[0]);
          CalCalc.vars.places[0] = result.routes[0].legs[0].start_address;
          CalCalc.vars.places[1] = result.routes[0].legs[0].end_address;
          CalCalc.display.places();

          CalCalc.vars.distance = result.routes[0].legs[0].distance.value / 1000; // m -> km
          $('#distance').addClass('from-route').hide_message('error');//.attr('value', displayFloat(CalCalc.vars.distance.toFixed(2)));
          CalCalc.display.distance();
          CalCalc.update();
        }

        // Now that input value has been changed, focus can be returned to it.
        $("#place1, #place2").filter(".focus").focus().removeClass('focus');
      });
      return true;
    };
  }(),
  report: function () {
    if (CalCalc.vars.distance > 100 || !CalCalc.settings.reporting) return;

    _gaq.push(['_trackEvent', 'CalCalc', 'Weight', 'Weight', Number(CalCalc.vars.weight.toFixed(0)), true]);
    _gaq.push(['_trackEvent', 'CalCalc', 'Distance', 'Distance', Number(CalCalc.vars.distance.toFixed(0)), true]);
    _gaq.push(['_trackEvent', 'CalCalc', 'Kilocalories', 'Kilocalories', Number(CalCalc.vars.calories), true]);
    _gaq.push(['_trackEvent', 'CalCalc', 'Gender', CalCalc.genders[CalCalc.vars.gender], undefined, true]);
  }
};

$(document).ready(function () {
  $('[rel=tooltip]').tooltip({
   container: 'body'
  });
  CalCalc.onReady();
});
