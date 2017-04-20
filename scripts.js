var aggregateData;
var stateMapData;
var cityData = [];
var nestedData;

var selectedCityName = "New York";
var isAirbnb = true;
var isCheapMeal = true;
var isPublicTransit = true;

var projection = d3.geoAlbersUsa().scale(75);
var pathGenerator = d3.geoPath().projection(projection);

d3.queue()
    .defer(d3.json, "us.json")
    .defer(d3.csv, "aggregateData.csv")
    .await( function (error, rawMap, rawData) {
        stateMapData = topojson.feature(rawMap, rawMap.objects.states);

        aggregateData = rawData;
        aggregateData.forEach(function (d) {
            var city = {
                city: d["City"],
                airbnb: Number(d["Airbnb"]),
                hotel: Number(d["Hotel"]),
                latitude: Number(d["Latitude"]),
                longitude: Number(d["Longitude"]),
                expensiveMeal: Number(d["Meal for 2 People, Mid-range Restaurant, Three-course"])/ 2, // divide by two to get data for 1 person
                cheapMeal: Number(d["Meal, Inexpensive Restaurant"]),
                publicTransport: Number(d["Public Transport One Way"]),
                taxiCost: Number(d["Taxi Base"]) + 10*(Number(d["Taxi 1km"])/1.609), // convert from km to miles for 10 miles
                airfare: Number(d["AverageFare"]),
                totalCost: 0 // to be calculated
            }
            cityData.push(city);
        });

        nestedData = d3.nest()
            .key(function (d) {
                return d["City"];
            })
            .entries(rawData);

        calculateTotalCost();

        var svg = d3.select("#svgMap"); // We can rename these
        showMap(svg);
        addButtons(svg);
        plotCities(svg);
        makeBarChart(cityData,'airbnb','#bar1');
        makeBarChart(cityData,'cheapMeal','#bar2');
        makeBarChart(cityData,'publicTransport','#bar3');
        makeBarChart(cityData,'airfare','#bar4');

        makePie("circle", cityData, selectedCityName, ["publicTransport", "airbnb", "airfare", "cheapMeal"]);

        updateCityVisuals(cityData[0]);
    });

function showMap(svg) {
    projection.fitExtent([[0,0], [svg.attr("width"), svg.attr("height")]], stateMapData);
    pathGenerator = d3.geoPath().projection(projection);

    var paths = svg.selectAll("path.state").data(stateMapData.features);
    paths.enter().append("path").attr("class", "state")
    .merge(paths)
    .attr("d", function (state) {
        return pathGenerator(state);
    });
}

function addButtons(svg) {
    //isAirbnb, isCheapMeal, isPublicTransit are global variables

    var rad = document.selection.airbnb_hotel;
    for(var i = 0; i < rad.length; i++) {
        rad[i].onclick = function() {
            isAirbnb = this.value == "airbnb" ? true : false;
            calculateTotalCost(isAirbnb, isCheapMeal, isPublicTransit);

            makeBarChart(cityData,this.value,'#bar1');
            updateCityVisuals(getSingleCity(selectedCityName));
        };
    }

    rad = document.selection.meal_type;
    for(var i = 0; i < rad.length; i++) {
        rad[i].onclick = function() {
            isCheapMeal = this.value == "cheapMeal" ? true : false;
            calculateTotalCost(isAirbnb, isCheapMeal, isPublicTransit);

            makeBarChart(cityData,this.value,'#bar2');
            updateCityVisuals(getSingleCity(selectedCityName));
        };
    }

    rad = document.selection.transit_type;
    for(var i = 0; i < rad.length; i++) {
        rad[i].onclick = function() {
            isPublicTransit = this.value == "publicTransport" ? true : false;
            calculateTotalCost(isAirbnb, isCheapMeal, isPublicTransit);

            makeBarChart(cityData,this.value,'#bar3');
            updateCityVisuals(getSingleCity(selectedCityName));
        };
    }

    var selector = document.getElementById('cityselector');
    selector.addEventListener("change", function (){
        if (selector.value != selectedCityName){
            selectedCityName = selector.value;
            updateCityVisuals(getSingleCity(selectedCityName));
        }
    });

}

var bar1attr;
var bar2attr;
var bar3attr;
var bar4attr;

function makeBarChart(cities,attribute,elementid){
    if (elementid.slice(-1) == '1') {
        bar1attr = attribute;
    } else if (elementid.slice(-1) == '2') {
        bar2attr = attribute;
    } else if (elementid.slice(-1) == '3') {
        bar3attr = attribute;
    } else if (elementid.slice(-1) == '4') {
        bar4attr = attribute;
    }

    document.getElementById(elementid.substr(1)).innerHTML = "";

    cities.sort(function (a,b){return b[attribute] - a[attribute]});

    var padding = 15;
    var width = 230;
    var height= 300;
    var bottompadding = 100;
    var svg = d3.select(elementid).append("svg").attr("height",300).attr("width",350);
    var barWidth = (width - 20) / cities.length;
    svg.append('text')
    .attr("x",width-170)
    .attr('y',80)
    .attr('font-size','20px')
    .attr('class', elementid.substr(1) + "cityname");
    // .attr('class','cityname');

    svg.append('text')
    .attr('x',20)
    .attr('y',50)
    .text(humanizeLabels(attribute.charAt(0) + attribute.slice(1)))
    .attr('font-size','24px');

    svg.append('text')
    .text('Cost')
    .style("text-anchor", "middle")
    .attr('font-size','20px')
    .attr('x',15)
    .attr('y',height/2+30)
    .attr("transform","rotate(-90,15,180)");

    var max = d3.max(cities, function (d){
        return Number(d[attribute]);
    });

    var yScale = d3.scaleLinear().domain([0,max])
    .range([height-padding,bottompadding]);

    var bar = svg.selectAll("g")
    .data(cities)
    .enter().append("g");

    bar.append("rect").attr("fill", '#4169e1')
        .attr("transform", function(d, i) { return "translate(" + ((i * barWidth) + 64) + ",0)"; })
        .attr("y", function (d){return yScale(Number(d[attribute]))})
        .attr("width", barWidth - 2)
        .attr("height", function (d){return yScale(0) - yScale(Number(d[attribute]))})
        .on("mouseover", function (city) {
            updateCityVisuals(city);
        })
        .attr('class',function (city){
            var name = city.city.replace(/ /g,'');
            return name;
        });

    svg.append('line')
    .attr('x1',64).attr('x2',274)
    .attr('y1',height-padding).attr('y2',height-padding)
    .attr('stroke','black')
    .attr('stroke-width',5);

    if (attribute == "publicTransport") {
        var yAxis = d3.axisLeft(yScale).tickFormat(d3.format("$.2f"));
        svg.append("g").attr("transform", "translate(60,0)").call(yAxis);
    } else {
        var yAxis = d3.axisLeft(yScale).tickFormat(d3.format("$.0f"));
        svg.append("g").attr("transform", "translate(60,0)").call(yAxis);
    }
}

function humanizeLabels(label) {

    switch(label) {
        case 'airfare':
            return "Airfare";
            break;
        case 'airbnb':
            return "Airbnb (per night)";
            break;
        case 'cheapMeal':
            return "Cheap meal";
            break;
        case 'expensiveMeal':
            return "Expensive meal";
            break;
        case 'hotel':
            return "Hotel (per night)";
            break;
        case 'publicTransport':
            return "Public Transport (one way)";
            break;
        case 'taxiCost':
            return "Taxi Cost (10 mile ride)";
            break;
        default:
            return " ";
            break;
    }
}


function formatData(rawData, cityName, desiredFields) {
    // later desiredFields will be a selection
    var rawCity;
    var formattedCity = [];
    var color = d3.scaleOrdinal()
        .range(['#7fc97f','#beaed4','#fdc086','#ffff99','#386cb0']);
    rawData.forEach(function (d) {
        if(d.city == cityName) {
            rawCity = d;
        }
    })
    for (var i = 0; i < desiredFields.length; i ++) {
        var formattedData = {
            "label": humanizeLabels(desiredFields[i]),
            "value": rawCity[desiredFields[i]],
            "color": color(desiredFields[i])
        };
        formattedCity.push(formattedData)
    }
    return formattedCity;
}

function totalFromFields(rawData, cityName, desiredFields) {
    var total = 0;
    var rawCity;
    rawData.forEach(function (d) {
        if(d.city == cityName) {
            rawCity = d;
        };
    });
    for (var i = 0; i < desiredFields.length; i ++) {
        total += Number(rawCity[desiredFields[i]]);
    };
    return total;
}

function makePie(div, rawData, cityName, desiredFields) {
    // code adapted from http://d3pie.org/
    document.getElementById(div).innerHTML = "";
    var pie = new d3pie(div, {
    "header": {
        "title": {
            "text": cityName,
            "fontSize": 24,
            "font": "open sans"
        },
        "subtitle": {
            "text": "   ",
            "color": "#999999",
            "fontSize": 12,
            "font": "open sans"
        },
        "titleSubtitlePadding": 9
    },
    "footer": {
        "color": "#999999",
        "fontSize": 10,
        "font": "open sans",
        "location": "bottom-left"
    },
    "size": {
        "canvasHeight": 450,
        "canvasWidth": 700,
        "pieInnerRadius": "50%",
        "pieOuterRadius": "85%"
    },
    "data": {
        "sortOrder": "value-desc",
        "content": formatData(rawData, cityName, desiredFields)
    },
    "labels": {
        "outer": {
            "pieDistance": 32
        },
        "inner": {
            "hideWhenLessThanPercentage": 3
        },
        "mainLabel": {
            "fontSize": 11
        },
        "percentage": {
            "color": "#000000",
            "decimalPlaces": 0
        },
        "value": {
            "color": "#adadad",
            "fontSize": 11
        },
        "lines": {
            "enabled": true
        },
        "truncation": {
            "enabled": true
        }
    },
    "effects": {
         "load": {
            "speed": 350
        },
        "pullOutSegmentOnClick": {
            "effect": "linear",
            "speed": 400,
            "size": 8
        }
    },
    "misc": {
        "gradient": {
            "enabled": false,
        }
    },
    "callbacks": {
        "onload": null,
        "onMouseoverSegment": function(info) {
            document.getElementById("circleLabel").innerHTML = info["data"]["label"] + ", $" + parseFloat(Math.round(Number(info["data"]["value"]) * 100) / 100).toFixed(2);
        },
        "onMouseoutSegment": function () {
            document.getElementById("circleLabel").innerHTML = " ";
        },
        "onClickSegment": null
    }
});
    var svg = d3.select("#circle_svg");
    svg.append("text")
        .attr("x", "350")
        .attr("y", "250")
        .attr("id", "circleLabel")
        .attr("style", "font-size: 14px;")
        .attr("text-anchor", "middle");
    svg.append("text")
        .attr("x", "110")
        .attr("y", "30")
        .attr("id", "totalCostLabel")
        .attr("style", "font-size: 18px;")
        .attr("text-anchor", "middle")
        .text("Total Cost: $" + getSingleCity(cityName).totalCost.toFixed(2));
}; 


// variable: string containing class property
function plotCities(svg, variable = "totalCost") {
    // Text element for mouseover
    d3.select("#svgMap").append("text")
    .attr("x", "50%")
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("id", "cityLabel")
    .attr("style", "font-size: 27px");

    svg.append("text")
    .attr("id", "CityName")
    .style("font-size", "16pt");

    var varExtent = d3.extent(cityData, function (d) { return d[variable]; });
    var radiusScale = d3.scaleSqrt().domain(varExtent).range([8,30]);

    var circles = svg.selectAll("circle").data(cityData);

    circles = circles.enter().append("circle")
    .merge(circles)
    // .transition().duration(500) // animation ??
    .attr("r", function (city) { return radiusScale(city[variable]); })
    .attr("cx", function (city) { return projection([city.longitude, city.latitude])[0]; })
    .attr("cy", function (city) { return projection([city.longitude, city.latitude])[1]; })
    .attr("opacity", 0.7)
    .attr("fill", "#4169e1")
    .on("mouseover", function (city) {
        updateCityVisuals(city);
    })
    .attr('class',function (city){
            var name = city.city.replace(/ /g,'');
            return name;
    });
}

function updatePie(city) {
    var transit = isPublicTransit? "publicTransport": "taxiCost"
    var lodging = isAirbnb? "airbnb" : "hotel";
    var meal = isCheapMeal? "cheapMeal" : "expensiveMeal";

    makePie("circle", cityData, city, [transit, lodging, "airfare", meal]);
}

// modifies cityData, and sets all totalCost attributes based on user preference
function calculateTotalCost(airbnb=true, cheapMeal=true, publicTransit=true) {
    // 3 meals a day, 2 transit rides, 2 airfare flights?
    cityData.forEach(function (d) {
        var cost = 2*d.airfare;
        cost += airbnb? d.airbnb: d.hotel;
        cost += cheapMeal? 3*d.cheapMeal: 3*d.expensiveMeal;
        cost += publicTransit? 2*d.publicTransport: 2*d.taxiCost;

        d.totalCost = cost;
    });
}

function getSingleCity(cityName) {
    var city;
    cityData.forEach(function (d) {
        if (d.city == cityName) {
            city = d;
        };
    })
    return city;
}

// highlights city in bar graph and map, changes pie chart
function updateCityVisuals(city) {
    var name = city.city.replace(/ /g,'');
    d3.selectAll('circle').attr('fill','#4169e1');
    d3.selectAll('rect').attr('fill', '#4169e1');
    d3.selectAll('.' + name).attr('fill','yellow');

    d3.selectAll('.bar1cityname').text(city.city + ": $" + city[bar1attr].toFixed(2));
    d3.selectAll('.bar2cityname').text(city.city + ": $" + city[bar2attr].toFixed(2));
    d3.selectAll('.bar3cityname').text(city.city + ": $" + city[bar3attr].toFixed(2));
    d3.selectAll('.bar4cityname').text(city.city + ": $" + city[bar4attr].toFixed(2));

    document.getElementById("cityLabel").innerHTML = "Total cost for " + city.city + ": $" + parseFloat(Math.round(Number(city["totalCost"]) * 100) / 100).toFixed(2);
    document.getElementById('cityselector').value = city.city;
    updatePie(city.city);
    selectedCityName = city.city;
}


