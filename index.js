///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
//  _____            __ _     _____         _                //
// |  _  \          / _| |   |  _  |       | |               //
// | | | |_ __ __ _| |_| |_  | | | |_ __ __| | ___ _ __ ___  //
// | | | | '__/ _` |  _| __| | | | | '__/ _` |/ _ \ '__/ __| //
// | |/ /| | | (_| | | | |_  \ \_/ / | | (_| |  __/ |  \__ \ //
// |___/ |_|  \__,_|_|  \__|  \___/|_|  \__,_|\___|_|  |___/ //
//                                                           //
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
// This takes requests to https://g6k.carte-grise-pref.fr/order and sends the data to Shopify's API
// The returned data should then provide us with the ability to build a "checkout" object
// The checkout object gives us the ability to obtain a "web url" for the order, which we're able to direct the buyer to
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

// Express
var express = require('express')
var app = express()

// Shopify
const Shopify = require('shopify-api-node');
const shopify = new Shopify({
  shopName: process.env.SHOPIFY_NAME,
  apiKey:   process.env.SHOPIFY_API,
  password: process.env.SHOPIFY_PASS
})

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

// Server
app.set('port', (process.env.PORT || 3000))
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
  response.send('Hello World!')
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
