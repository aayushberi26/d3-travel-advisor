d3.queue()
    .defer(d3.csv,'AverageFare.csv')
    .defer(d3.csv,'publicTransportPrices.csv')
    .defer(d3.csv,'taxiPrices.csv')
    .defer(d3.csv,'avg_meal_cost.csv')
    .await( function (error,planeFare,pubTransport,taxiPrices,mealCosts) {

    });