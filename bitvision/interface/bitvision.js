// GLOBALS
"use strict"

let fs = require('fs')
let blessed = require('blessed')
let contrib = require('blessed-contrib')
let childProcess = require('child_process')
let Gdax = require('gdax')

const dotfilePath = '~/.bitvision'
var gdaxClient = new Gdax.PublicClient()
let screen = blessed.screen({
	smartCSR: true
})
let MAX_HEADLINE_LENTH = 35

screen.title = 'Bitvision';

/**
 * Returns true if dotfile exists, false otherwise.
 *
 * @return {Boolean} File exists.
 */
 function checkForDotFile() {
 	fs.stat(dotfilePath, function(err, stat) {
 		if (err == null) {
 			return true
 		} else if (err.code == 'ENOENT') {
 			return false
 		}
 	});
 }

// COINBASE ACTION METHODS

function getCredentials() {
	var config = JSON.parse("~/.bitvision")
	return config["credentials"]
}

/**
 * Replaces public Coinbase client with authenticated client so trades
 * can be placed.
 *
 * @param  {dict} credentials dictionary
 */
 function authenticateWithCoinbase() {
 	let credentials = getCredentials()
 	let key = credentials["key"];
	let secret = btoa(credentials["secret"]) // Base 64 encoded secret
	let passphrase = credentials["passphrase"]

	// DO NOT USE
	// let apiURI = 'https://api.pro.coinbase.com';
	let sandboxURI = 'https://api-public.sandbox.pro.coinbase.com';

	gdaxClient = new Gdax.AuthenticatedClient(key,
	                                          secret,
	                                          passphrase,
	                                          sandboxURI
	                                          );
}

/**
 * Returns the current BTC price in USD.
 */
 function getUpdatedBitcoinPrice() {
 	gdaxClient.getProductTicker('ETH-USD', (error, response, data) => {
 		if (error) {
 			console.log("ERROR")
 		} else {
 			return data["price"]
 		}
 	});
 }

/**
 * Creates a buy order.
 *
 * @param  {Double} price In this format: '100.00'
 * @param  {Double} size  [description]
 */
 function createBuyOrder(price, size, callback) {
	// Buy 1 BTC @ 100 USD
	let buyParams = {
	  	price: `${price}`, // USD
	  	size: `${size}`, // BTC
	  	product_id: 'BTC-USD'
	  };
	  authedClient.buy(buyParams, callback);
	}

/**
 * Creates a sell order.
 *
 * @param  {Double} price
 * @param  {Double} size  [description]
 */
 function createSellOrder(price, size, callback) {
 	let sellParams = {
	  	price: `${price}`, // USD
	  	size: `${size}`, // BTC
	  	product_id: 'BTC-USD'
	  };
	  authedClient.sell(sellParams, callback);
	}


// CLI ACTION METHODS

function focusOnHeadlines() {
	headlineTable.focus()
}

/**
* Execute shell command.
**/
function executeShellCommand(command) {
	console.log(command)
	let args = command.split(" ")
  // Remove first element
  let program = args.splice(0, 1)[0];
  console.log(args)
  console.log(program)
  let cmd = childProcess.spawn(program, args);

  cmd.stdout.on('data', function(data) {
  	console.log('OUTPUT: ' + data);
  });

  cmd.on('close', function(code, signal) {
  	console.log('command finished...');
  });
}

// PYTHON CONTROL METHODS

function refreshData() {
	executeShellCommand("python3 refresh_data.py")
}

function retrainModel() {
	executeShellCommand("python3 retrain_model.py")
}

// Data generation methods

function getRandomInteger(min, max) {
	min = Math.ceil(min)
	max = Math.floor(max)

	return Math.floor(Math.random() * (max - min)) + min
}

function getRandomSentiment() {
	return String(Math.random().toFixed(2))
}

function getRandomDate() {
	let month = Math.floor(Math.random() * 12) + 1
	let day = Math.floor(Math.random() * 30) + 1
	return `${month}/${day}`
}

function getRandomHeadline() {
	let possiblities = [ "Zerocoin's widget promises Bitcoin privacy",
	"Bitcoin is bad news for stability",
	"WikiLeaks' Assange hypes bitcoin in secret talk",
	"Butterfly Labs' Jalapeno aims to spice up bitcoin mining",
	"Are alternative Ecoins 'anti-bitcoins'?",
	"Canada to tax bitcoin users",
	"Google Ventures invests in Bitcoin competitor OpenCoin",
	"Economists wrestle with Bitcoin's 'narrative problem'" ]
	return possiblities[Math.floor(Math.random() * possiblities.length)]
}

// Utilities

function trimIfLongerThan(text, len) {
	if (text.length > len) {
		return text.slice(0, len)
	} else {
		return text
	}
}

/**
 * Takes three arrays and zips them into a list of lists like this:
 *
 * [1,2,3]
 * [a,b,c] -> [ [1,a,!], [2,b,@], [3,c,#] ]
 * [!,@,#]
 */
 function zipThreeArrays(a, b, c) {
 	let zipped = []
 	for (var i = 0; i < a.length; i++) {
 		zipped.push([a[i], b[i], c[i]])
 	}
 	return zipped
 }

// Takes dictionary with key -> list pairs and returns a list of lists.
function unpackData(dict) {
	var listOfIndicatorData = []
	Object.keys(dict["data"]).forEach(function(key) {
		listOfIndicatorData.push([key, dict["data"][key]["value"], dict["data"][key]["signal"]])
	});

	return listOfIndicatorData
}

// TESTING DATA

let headlineDates = [...Array(16).keys()].map((key) => {
	return getRandomDate()
})

let headlines = [...Array(16).keys()].map((key) => {
	return getRandomHeadline()
})

let headlineSentiment = [...Array(16).keys()].map((key) => {
	return getRandomSentiment()
})

let headlinesTrimmed = headlines.map(str => trimIfLongerThan(str, MAX_HEADLINE_LENTH));
let headlinesZipped = zipThreeArrays(headlineDates, headlinesTrimmed, headlineSentiment)

let exchangeRateSeries = {
	title: "Exchange Rate",
	x: [...Array(24).keys()].map((key) => {
		return String(key) + ":00"
	}),
	y: [...Array(24).keys()].map((key) => {
		return key * getRandomInteger(1000, 1200)
	})
}

var signalEnum = Object.freeze ({ buy: "BUY", sell: "SELL" });

let networkIndicatorData = {
	"name": "NETWORK_DATA",
	"data": {
		"Confirmation Time": { value: "42ms", signal: signalEnum.buy },
		"Block Size": { value: "129MB", signal: signalEnum.sell },
		"Avg Transaction Cost": { value: "Val", signal: signalEnum.buy },
		"Difficulty": { value: "Val", signal: signalEnum.sell },
		"Transaction Value": { value: "Val", signal: signalEnum.buy },
		"Hash Rate": { value: "Val", signal: signalEnum.sell },
		"Transactions per Block": { value: "Val", signal: signalEnum.sell },
		"Unique Addresses": { value: "Val", signal: signalEnum.buy },
		"Total BTC": { value: "Val", signal: signalEnum.sell },
		"Transaction Fees": { value: "Val", signal: signalEnum.buy },
		"Transactions per Day": { value: "Val", signal: signalEnum.sell }
	}
}

let networkIndicators = unpackData(networkIndicatorData)
console.log(networkIndicators)

let technicalIndicatorData = {
	"name": "TECHNICAL_INDICATORS",
	"data": {
		"Rate of Change Ratio": { value: "Val", signal: signalEnum.buy },
		"Momentum": { value: "Val", signal: signalEnum.sell },
		"Avg Directional Index": { value: "Val", signal: signalEnum.buy },
		"Williams %R": { value: "Val", signal: signalEnum.sell },
		"Relative Strength Index": { value: "Val", signal: signalEnum.buy },
		"Moving Avg Convergence Divergence": { value: "Val", signal: signalEnum.sell },
		"Avg True Range": { value: "Val", signal: signalEnum.sell },
		"On-Balance Volume": { value: "Val", signal: signalEnum.buy },
		"Triple Exponential Moving Avg": { value: "Val", signal: signalEnum.sell }
	}
}

let technicalIndicators = unpackData(technicalIndicatorData)
console.log(technicalIndicators)

// Placing widgets

var grid = new contrib.grid({rows: 12, cols: 12, screen: screen})

// Place tables on the left side of the screen.

var headlineTable = grid.set(0, 0, 4, 4, contrib.table,
                             { keys: true
                             	, fg: 'green'
                             	, label: 'Headlines'
                             	, interactive: true
                             	, columnSpacing: 1
                             	, columnWidth: [7, 38, 10]
                             })

headlineTable.setData({ headers: ['Date', 'Title', 'Sentiment'],
                      data: headlinesZipped})

headlineTable.focus()

headlineTable.on('keypress', function(ch, key) {
	console.log('DSKLF')
	if (key.name.toLowerCase() === 'o') {
		console.log('OPEN UP')
	}
})

var technicalTable = grid.set(4, 0, 3.5, 4, contrib.table,
                              { keys: true
                              	, fg: 'green'
                              	, label: 'Technical Indicators'
                              	, interactive: false
                              	, columnSpacing: 1
                              	, columnWidth: [35, 10, 10]
                              })

technicalTable.setData({ headers: ['Name', 'Value', 'Signal'],
                       data: technicalIndicators})

var networkTable = grid.set(7.2, 0, 4, 4, contrib.table,
                            { keys: true
                            	, fg: 'green'
                            	, label: 'Network Indicators'
                            	, interactive: false
                            	, columnSpacing: 1
                            	, columnWidth: [35, 10, 10]})

networkTable.setData({ headers: ['Name', 'Value', 'Signal'],
                     data: networkIndicators})


// Line chart on the right of the tables

var exchangeRateCurve = grid.set(0, 4, 6, 6, contrib.line, {
	style: {
		line: "yellow",
		text: "green",
		baseline: "black"
	},
	xLabelPadding: 3,
	xPadding: 5,
	showLegend: true,
	wholeNumbersOnly: false,
	label: "Exchange Rate"
})

// Countdown under chart

var countdown = grid.set(6, 4, 3, 3, contrib.lcd, {
	segmentWidth: 0.06,
	segmentInterval: 0.10,
	strokeWidth: 0.1,
	elements: 4,
	display: "0000",
	elementSpacing: 4,
	elementPadding: 2,
  color: 'white', // color for the segments
  label: 'Minutes Until Next Trade'
})

let menubar = blessed.listbar({
	parent: screen,
	mouse: true,
	keys: true,
	bottom: 0,
	left: 0,
	height: 1,
	commands: {
		"Toggle Trading": {
			keys: [ 't', 'T' ],
			callback: () => toggleTrading()
		},
		"Refresh Data": {
			keys: [ 'r', 'R' ],
			callback: () => refreshData()
		},
		"Buy BTC": {
			keys: [ 'b', "B" ],
			callback: () => buyBitcoin()
		},
		"Sell BTC": {
			keys: [ 's', "S" ],
			callback: () => sellBitcoin()
		},
		"Exit": {
			keys: [ 'q', 'Q', 'C-c', 'escape' ],
			callback: () => process.exit(0)
		}
	}
})

// countdown.setDisplay("23:59")

function setLineData(mockData, line) {
	for (var i=0; i<mockData.length; i++) {
		var last = mockData[i].y[mockData[i].y.length-1]
		mockData[i].y.shift()
		var num = Math.max(last + Math.round(Math.random()*10) - 5, 10)
		mockData[i].y.push(num)
	}

	line.setData(mockData)
}

setLineData([exchangeRateSeries], exchangeRateCurve)

setInterval(function() {
	setLineData([exchangeRateSeries], exchangeRateCurve)
	screen.render()
}, 500)

// // Quit functionality
// screen.key(['escape', 'q', 'C-c'], function(ch, key) {
// 	return process.exit(0);
// });

// Resizing
screen.on('resize', function() {
	technicalTable.emit('attach');
	networkTable.emit('attach');
	headlineTable.emit('attach');
	exchangeRateCurve.emit('attach');
});

screen.render()
