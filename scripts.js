var aggregateData;
var stateMapData;
var cityData = [];
var nestedData;

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
            nestedData = d3.nest()
            .key(function (d) {
                return d["city"];
            })
            .entries(cityData);
        });

        calculateTotalCost();

        var svg = d3.select("#svgMap"); // We can rename these
        showMap(svg);
        addSlider(svg, d3.select("#slider"));
        plotCities(svg);
        makeBarChart(cityData,'airbnb','#bar1');
        makeBarChart(cityData,'expensiveMeal','#bar2');
        makeBarChart(cityData,'publicTransport','#bar3');
        makeBarChart(cityData,'airfare','#bar4');

        makePie("circle", cityData, "New York", ["taxiCost", "hotel", "airfare", "cheapMeal"]);
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

function addSlider(svg, sliderDiv) {
    // Is there a better way to do this?
    var variables = ["totalCost", "airfare", "airbnb", "hotel", "expensiveMeal", "cheapMeal", "publicTransport", "taxiCost"];

    sliderDiv
    .append("div").text(variables[0]).attr("id", "sliderLabel")
    .append("div")
    .append("input").attr("type", "range").attr("class", "slider")
    .attr("min", 0)
    .attr("max", 700)
    .attr("step", "100")
    .attr("value", 0)
    .on("input", function () {
        var val = Number(this.value);
        d3.select("sliderLabel").text(variables[val/100]); // text isn't changing
        console.log(variables[val/100]);

        plotCities(svg, variables[val/100]);
    });

}

function makeBarChart(cities,attribute,elementid){
    cities.sort(function (a,b){return b[attribute] - a[attribute]});

    var padding = 20;
    var width = 300;
    var height= 300;
    var bottompadding = 100;
    var svg = d3.select(elementid).append("svg").attr("height",300).attr("width",300);
    var barWidth = (width - 20) / cities.length;
    svg.append('text')
    .attr("x",width-120)
    .attr('y',80)
    .attr('font-size','20px')
    .attr('class','cityname');

    svg.append('text')
    .attr('x',20)
    .attr('y',50)
    .text(attribute.charAt(0).toUpperCase() + attribute.slice(1))
    .attr('font-size','30px');

    svg.append('text')
    .text('Cost')
    .attr('style',"writing-mode: tb;")
    .attr("letter-spacing", "0.5em")
    .attr('font-size','20px')
    .attr('rotate','-90')
    .attr('x',10)
    .attr('y',height/2);

    var max = d3.max(cities, function (d){
        return Number(d[attribute]);
    });

    var yScale = d3.scaleLinear().domain([0,max])
    .range([height-padding,bottompadding]);

    var bar = svg.selectAll("g")
    .data(cities)
    .enter().append("g");

    bar.append("rect").attr("fill", '#4169e1')
        .attr("transform", function(d, i) { return "translate(" + ((i * barWidth) + 20) + ",0)"; })
        .attr("y", function (d){return yScale(Number(d[attribute]))})
        .attr("width", barWidth - 2)
        .attr("height", function (d){return yScale(0) - yScale(Number(d[attribute]))})
        .on("mouseover", function (city) {
            d3.selectAll('.cityname').text(city.city);
        })
        .attr('class',function (city){
            var name = city.city.replace(/ /g,'');
            return name;
        })
        .on('mouseenter', function (city){
            var name = city.city.replace(/ /g,'');
            d3.selectAll('.' + name).attr('fill','yellow');
        })
        .on('mouseleave', function (city){
            var name = city.city.replace(/ /g,'');
            d3.selectAll('.' + name).attr('fill','#4169e1');
        });

    svg.append('line')
    .attr('x1',20).attr('x2',width-2)
    .attr('y1',height-padding).attr('y2',height-padding)
    .attr('stroke','black')
    .attr('stroke-width',10);
}



/*
// code adapted from http://zeroviscosity.com/d3-js-step-by-step/step-1-a-basic-pie-chart
function makePie(svg_id, dataset, city, height, width) {
    var cityObject;
    var cityArray = [];
    var ignoredKeys = ["airbnb", "cheapMeal", "city", "latitude", "longitude", "publicTransport", "totalCost"];
    for (var i = 0; i < dataset.length; i++) {
        if (dataset[i]["key"] == city) {
            cityObject = dataset[i];
            break;
        }
    }
    console.log(cityObject)
    for (var key in cityObject["values"][0]) {
        if(ignoredKeys.indexOf(key) == -1) {
            console.log(key + ', ' + cityObject["values"][0][key])
            cityArray.push(cityObject["values"][0][key])
        }
    }
    //console.log(cityArray)
    var radius = Math.min(height, width) / 2;
    var svg = d3.select(svg_id)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(' + (width / 2) +  ',' + (height / 2) + ')');

    //var color = d3.scaleOrdinal(d3.schemeCategory20b);
    var color = d3.scaleOrdinal()
        .range(['#A60F2B', '#648C85', '#B3F2C9', '#528C18', '#C3F25C']);

    var arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    var pie = d3.pie()
        .value(function (d) {return d; })
        .sort(null);

    var path = svg.selectAll('path')
        .data(pie(cityArray))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', function (d, i) {
            return color(d.data);
        });
    }
*/



function formatData(rawData, cityName, desiredFields) {
    // later desiredFields will be a selection
    var rawCity;
    var formattedCity = [];
    var color = d3.scaleOrdinal()
        .range(['#d7191c','#fdae61','#ffffbf','#abdda4','#2b83ba']);
    rawData.forEach(function (d) {
        if(d.city == cityName) {
            rawCity = d;
        }
    })
    for (var i = 0; i < desiredFields.length; i ++) {
        var formattedData = {
            "label": desiredFields[i],
            "value": rawCity[desiredFields[i]],
            "color": color(desiredFields[i])
        };
        formattedCity.push(formattedData)
    }
    console.log(formattedCity);
    return formattedCity;
}

function makePie(div, rawData, cityName, desiredFields) {
    // code adapted from http://d3pie.org/
    document.getElementById(div).innerHTML = "";
    var pie = new d3pie(div, {
    "header": {
        "title": {
            "text": "Cost of " + cityName,
            "fontSize": 24,
            "font": "open sans"
        },
        "subtitle": {
            "text": "",
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
        "canvasWidth": 700,
        "pieInnerRadius": "44%",
        "pieOuterRadius": "90%"
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
            "color": "#ffffff",
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
        "pullOutSegmentOnClick": {
            "effect": "linear",
            "speed": 400,
            "size": 8
        }
    },
    "misc": {
        "gradient": {
            "enabled": true,
            "percentage": 100
        }
    }
});

};


// variable: string containing class property
function plotCities(svg, variable = "totalCost") {
    // Text element for mouseover
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
    .attr("fill", "#48f")
    .on("mouseover", function (city) {
        d3.selectAll('.cityname').text(city.city);
        var xy = projection([city.longitude, city.latitude]);
        svg.select("#CityName").text(city.city + ": " + city[variable])
        .attr("x", xy[0]+10)
        .attr("y", xy[1]);
    })
    .on("mouseout", function (city) {
        svg.select("#CityName").text("");
    })
    .on("click", function (city) { // is this outer function necessary?
        showCityDetails(svg, city);
    })
    .attr('class',function (city){
            var name = city.city.replace(/ /g,'');
            return name;
    })
    .on('mouseenter', function (city){
            var name = city.city.replace(/ /g,'');
            d3.selectAll('.' + name).attr('fill','yellow');
    })
    .on('mouseleave', function (city){
            var name = city.city.replace(/ /g,'');
            d3.selectAll('.' + name).attr('fill','#4169e1');
        });
}


function showCityDetails(svg, city) {
    console.log(city.city);
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


