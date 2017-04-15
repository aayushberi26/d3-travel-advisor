d3.queue()
    .defer(d3.csv,'AverageFare')
    .defer(d3.csv,'publicTransportPrices.csv')
    .defer(d3.csv,'taxiPrices.csv')
    .defer(d3.csv,'avg_meal_cost.csv')
    .await( function (error,planeFare,pubTransport,taxiPrices,mealCosts) {

    });




function plotBarChart(elementid,data) {
	var svg = d3.select(elementid).append("svg")
	.attr("height", 200).attr("width", 300);

	var newdata = data;
	var xBands = d3.scaleBand()
	.domain(newdata.map(function (city) {
		 return city.;
	 }))
	.range([padding, width-padding]);

	var yScale = d3.scaleLinear()
	.domain([0,
		d3.max(newdata, function (bin) {
			 return bin.length;
		 }) ])
	.range([height - padding, padding]);

	newdata.forEach(function (bin) {
		svg.append("rect").attr("class", "bar")
		.attr("x", xBands(bin.x0))
		.attr("y", yScale(bin.length))
		.attr("width", xBands.bandwidth() - 2)
		.attr("height", yScale(0) - yScale(bin.length));
	});

	var myYaxis = d3.axisLeft(yScale);
	svg.append("g")
    .attr("transform", "translate(20,0)")
    .call(myYaxis);

    var xextent = d3.extent(newdata, function (d){
    	return d.x0;
    })

    var xScale = d3.scaleLinear().domain(xextent).range([padding,width-padding]);
    var myXaxis = d3.axisBottom(xScale);
    svg.append("g")
    .attr("transform", "translate(0,180)")
    .call(myXaxis);
}