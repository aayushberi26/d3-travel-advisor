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

function makeBarChart(cities,attribute,elementid){
    cities.sort(function (a,b){return b[attribute] - a[attribute]});
    var text = svg.append('text')
    .attr("x",50)
    .attr('y',50);

    var padding = 20;
    width = 300;
    height= 200;
    var svg = d3.select(elementid).append("svg").attr("height",200).attr("width",300);
    var barWidth = width / cities.length;

    var yScale = d3.scaleLinear().domain([30,
        d3.max(cities, function (city) {
             return city[attribute];
         }) ])
    .range([height-padding,padding]);

var bar = svg.selectAll("g")
      .data(cities)
    .enter().append("g");

    bar.append("rect").attr("class", "bar")
        .attr("transform", function(d, i) { return "translate(" + i * barWidth + ",0)"; })
        .attr("y", function (d){return yScale(d[attribute])})
        .attr("width", barWidth - 2)
        .attr("height", function (d){return yScale(0) - yScale(d[attribute])});
        


}