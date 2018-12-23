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
// Added a bunch of stuff from https://stackoverflow.com/a/5994334/1143732
// BaseURL https://github.com/expressjs/express/issues/1611#issuecomment-38358502
var express    = require('express')
var bodyparser = require('body-parser') // https://appdividend.com/2018/08/22/express-post-request-example-tutorial/
var app        = express()
var router     = express.Router()

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
//          _____ _                 _  __                    //
//         /  ___| |               (_)/ _|                   //
//         \ `--.| |__   ___  _ __  _| |_ _   _              //
//          `--. \ '_ \ / _ \| '_ \| |  _| | | |             //
//         /\__/ / | | | (_) | |_) | | | | |_| |             //
//         \____/|_| |_|\___/| .__/|_|_|  \__, |             //
//                           | |           __/ |             //
//                           |_|          |____/             //
//                                                           //
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

// https://www.npmjs.com/package/shopify-api-node
const Shopify = require('shopify-api-node');
const shopify = new Shopify({
  shopName: process.env.SHOPIFY_NAME || "test",
  apiKey:   process.env.SHOPIFY_API  || "test",
  password: process.env.SHOPIFY_PASS || "test"
})

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
//             _____                                         //
//            /  ___|                                        //
//            \ `--.  ___ _ ____   _____ _ __                //
//             `--. \/ _ \ '__\ \ / / _ \ '__|               //
//            /\__/ /  __/ |   \ V /  __/ |                  //
//            \____/ \___|_|    \_/ \___|_|                  //
//                                                           //
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

// The server runs on the NGinx reverse proxy
// As long as it's on port 3000, should be okay
app.set('port', (process.env.PORT || 3000))
app.use(express.static(__dirname + '/public')) // Assets

// Base URL
// This is meant to provide users with the ability to access the app on /order
// It allows us to use relative URL's without having to make a big deal about accepting inbound requests etc
app.use('/order', router);

// BodyParser
// Allows us to view/manage data passed through the body tag of the request
// https://stackoverflow.com/a/24330353/1143732
app.use(bodyparser.urlencoded());
app.use(bodyparser.json());

// Server
// Allows us to accept inbound requests
app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
//                 _____           _                         //
//                /  __ \         | |                        //
//                | /  \/ ___   __| | ___                    //
//                | |    / _ \ / _` |/ _ \                   //
//                | \__/\ (_) | (_| |  __/                   //
//                 \____/\___/ \__,_|\___|                   //
//                                                           //
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

// INBOUND
// This has to be JSON/XHR only && accept the data from the submitted form
// This will take the data, send it to Shopify and then build a "checkout" response
router
  .route('/')
  .post(function(request, response) {

    // This receives a payload from the user
    // Our job is to turn this payload into a draft order
    // If the draft order has been created, the next step is to create a Checkout object via the Checkout API
    // The checkout API is described here: https://help.shopify.com/en/api/guides/sales-channel-sdk/getting-started#completing-a-payment-using-web-url
    //var draftOrder = shopify.draftOrder.create()
    //response.send('test')

    // Get POST vars
    // https://scotch.io/tutorials/use-expressjs-to-get-url-and-post-parameters
    response.send( 'test' )

  }).get(function(request, response) {

    // Test to tell us if the setup works
    response.send('test')

});

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
