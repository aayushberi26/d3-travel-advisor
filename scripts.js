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
        plotCities(svg);
        makeBarChart(cityData,'airbnb','body');
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


function makeBarChart(cities,attribute,elementid){
    cities.sort(function (a,b){return b[attribute] - a[attribute]});

    var padding = 20;
    width = 300;
    height= 200;
    var svg = d3.select(elementid).append("svg").attr("height",200).attr("width",300);
    var barWidth = width / cities.length;
    svg.append('text')
    .attr("x",width-110)
    .attr('y',50)
    .attr('id','cityname');

    var yScale = d3.scaleLinear().domain([30,
        d3.max(cities, function (city) {
             return city[attribute];
         }) ])
    .range([height-padding,padding]);

var bar = svg.selectAll("g")
      .data(cities)
    .enter().append("g");

    bar.append("rect").attr("fill", '#4169e1')
        .attr("transform", function(d, i) { return "translate(" + i * barWidth + ",0)"; })
        .attr("y", function (d){return yScale(d[attribute])})
        .attr("width", barWidth - 2)
        .attr("height", function (d){return yScale(0) - yScale(d[attribute])})
        .on("mouseover", function (city) {
            svg.select('#cityname').text(city.city);
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
    .attr('x1',0).attr('x2',width-2)
    .attr('y1',height).attr('y2',height)
    .attr('stroke','black')
    .attr('stroke-width',10);
}

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
        var xy = projection([city.longitude, city.latitude]);
        svg.select("#CityName").text(city.city)
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
    cityData.forEach(function (d) {
        var cost = d.airfare;
        cost += airbnb? d.airbnb: d.hotel;
        cost += cheapMeal? d.cheapMeal: d.expensiveMeal;
        cost += publicTransit? d.publicTransport: d.taxiCost;

        d.totalCost = cost;
    });

}


