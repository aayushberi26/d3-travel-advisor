var planeFare;
var pubTransport;
var taxiPrices;
var mealCosts;
var lodgingData;
var locationData;

d3.queue()

    .defer(d3.csv, )
    .await( function (error, planeRaw, publicTransportRaw, taxiRaw, mealRaw, lodgingRaw, locationRaw, aggregateData) {
        planeFare = planeRaw;
        pubTransport = publicTransportRaw;
        taxiPrices = taxiRaw;
        mealCosts = mealRaw;
        lodgingData = lodgingRaw;
        locationData = locationRaw;

    });