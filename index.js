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
const express = require('express')
const app     = express()
const router  = express.Router()

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
  shopName: process.env.SHOPIFY_NAME,
  apiKey:   process.env.SHOPIFY_API,
  password: process.env.SHOPIFY_PASS
});

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
// No need for bodyparser package anymore - https://expressjs.com/en/4x/api.html#express.json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error
// https://webapplog.com/error-handling-and-running-an-express-js-app/
app.use(function(err, req, res, next) {
    if(!err) return next(); // required otherwise the middleware will fire every time

    // Erroneous response
    // https://gist.github.com/zcaceres/2854ef613751563a3b506fabce4501fd#handling-errors
    if (!err.statusCode) err.statusCode = 500; // If err has no specified error code, set error code to 'Internal Server Error (500)'
    res.status(err.statusCode).send(err.message); // All HTTP requests must have a response, so let's send back an error with its status code and message
});

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

// Properties Function
// Would rather this be inline but apparently Node can't do that
function properties(params,callback){
  let properties = [];

  // Cycle through params
  // Only need "properties" params
  for (property in params) {

    // Skip nil values
    if(params[property] === "") { continue; }

    // build new custom option from the property
    // add it to the properties variable
    let item = { "name": property, "value": JSON.stringify(params[property]) }
    properties.push(item);

  }
  return callback(properties);
}

// INBOUND
// https://g6k.carte-grise-pref.fr/order (POST)
// This has to be JSON/XHR only && accept the data from the submitted form
// This will take the data, send it to Shopify and then build a "checkout" response
router
  .route('/')
  .post(express.urlencoded({extended: false}), function(request, response, next) {

    // This receives a payload from the user
    // Our job is to turn this payload into a draft order
    // If the draft order has been created, the next step is to create a Checkout object via the Checkout API
    // The checkout API is described here: https://help.shopify.com/en/api/guides/sales-channel-sdk/getting-started#completing-a-payment-using-web-url
    // param - https://stackoverflow.com/a/49943829/1143732
    let params = request.body;

    // POST vars
    // Send the above data through to Shopify and parse the response
    // The draftOrder API is as follows: https://help.shopify.com/en/api/reference/orders/draftorder
    // POST /admin/draft_orders.json
    // {
    //   "draft_order": {
    //     "line_items": [
    //       {
    //         "title": "Taxe De Payer",
    //         "price": "20.00",
    //         "quantity": 2
    //       }
    //     ]
    //   }
    // }

    // Create draftOrder
    // If successful, should create an order on the platform and respond with invoice_url
    shopify.draftOrder.create({
      "line_items": [
        {

          // Standard Options
          // This allows us to select the base variants for the product
          "variant_id": params.id,
          "quantity":   params.quantity,

          // Properties
          // Needs to cycle through params and assign them
          // We need to include things such as the simulator specific credits etc
          "properties": properties(params, (data) => { return data; })

        },
        {
          
          // Custom line item
          // Allows us to determine price the user pays
          "title":   "Taxes",
          "price":   params["properties[_y6_taxes_a_payer]"],
          "taxable": false,
          "quantity": 1

        }
      ]
    })
    .then(function(draftOrder){ response.send(draftOrder); })
    .catch(next); // http://expressjs.com/en/guide/error-handling.html

    // This does not need the checkout API any more
    // All we need to do is send the draft order to the platform and then accept the returned values
    // We need to make the front-end look prettier, but that has nothing to do with this script
    // The main things we need is some exception handling (for Shopify Auth + draftOrder management), and the ability to clarify what's been sent

});

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
