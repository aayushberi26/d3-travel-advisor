var aggregateData;
var stateMapData;
var cityData = [];

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
            }
            cityData.push(city);
        });

        var svg = d3.select("#svgMap"); // We can rename these
        showMap(svg) // might want to pass in more?
    });

function showMap(svg) {
    console.log("Showing map");
    projection.fitExtent([[0,0], [svg.attr("width"), svg.attr("height")]], stateMapData);
    pathGenerator = d3.geoPath().projection(projection);

    var paths = svg.selectAll("path.state").data(stateMapData.features);
    paths.enter().append("path").attr("class", "state")
    .merge(paths)
    .style("fill", "#aaa")
    .attr("d", function (state) {
        return pathGenerator(state);
    });
}

function makePie(svg, dataset) {
    var radius = 100;
    svg.append('g')
        .attr('transform','translate(100, 100)');

    var color = d3.scaleOrdinal(d3.schemeCategory20b);

    var arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    var pie = d3.pie()
        .value(function (d) {return d["City"]; })
        .sort(null);

    var path = svg.selectAll('path')
        .data(pie(dataset))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', function (d, i) {
            color(d.data["city"]);
        });



}




