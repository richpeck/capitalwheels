///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

// Express
// Added a bunch of stuff from https://stackoverflow.com/a/5994334/1143732
// BaseURL https://github.com/expressjs/express/issues/1611#issuecomment-38358502
const express = require('express')
const cors    = require('cors')
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

// Shopify
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
app.use('/', router);

// BodyParser
// Allows us to view/manage data passed through the body tag of the request
// https://stackoverflow.com/a/24330353/1143732
// No need for bodyparser package anymore - https://expressjs.com/en/4x/api.html#express.json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

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

// INBOUND
// https://capital-wheels.myshopify.com -> https://capitalwheels.herokuapp.com
// This has to be JSON/XHR only & take a querystring that allows us to return products
// This will take the data, send it to Shopify and then build a "checkout" response
router
  .route('/')
  .get(express.urlencoded({extended: false}), cors(), function(request,response,next) {

    // Products
    // This is used to get a list of all the products that the store has
    // We're then able to filter the products based on their tags (much more direct than collections)
    // After doing this, we add the product to the applicable variables
    shopify.product.list({ fields: ["id", "title", "handle", "body_html", "tags", "images"] }).then(function(products){

      // Vars
      // This is used to get all the data required to show the products
      // Basically add the products to the variables mentioned below and return the ones which fit everything directly
      // Corresponding to a specific group of collections
      // https://dev.to/claireparker/how-to-create-an-array-of-unique-values-in-javascript-using-sets-5dg6
      var bolt_patterns = new Set();
      var central_bores = new Set();
      var rim_offsets   = new Set();
      var items         = new Set();

      // Product ID's
      // This allows us to get access to each product (to manage their tags)
      // We cycle through the collections and build arrays of those which match the patterns
      products.forEach(function(product){

        // Tags
        // This splits up the tags var and allows us to manage it
        var tags = product["tags"].split(", ");

        // Values
        // These are used to build a query against which we can filter the products
        var bolt_pattern = (request.query.bolt_pattern) ? request.query.bolt_pattern.toString().toUpperCase()   : ""; // uppercase needed to ensure we could match 5X100
        var central_bore = (request.query.central_bore) ? parseFloat(request.query.central_bore)                : ""; // allows us to determine which bore is being sent
        var rim_offset   = (request.query.offset)       ? request.query.offset.split(",")                       : ""; // allows us to determine which offset is being sent

        // Bolt Pattern
        // Direct match (5x112)
        // Need to build an array of "bolt pattern" listings
        if( tags.indexOf(bolt_pattern) !== -1 ) { // Direct match
          bolt_patterns.add(product);
        }

        // Others
        // This is required because otherwise, we'd have to regex against each element of the array
        tags.forEach(function(tag) {

          // Central Bore (CB)
          // Mathematical (> 64.1)
          // Allows us to identify based on the CB of the wheel
          if( RegExp('CB*').test(tag) ) {
            value = tag.split(" "); // CB[0] 66.6[1]
            if(value[1] >= central_bore) central_bores.add(product); // Only if bore is greater than spec
          }

          // Rim (ET Offset)
          // Mathematical (< 45mm)
          // Helps us identify the right wheel
          if( RegExp('ET*').test(tag) ) {
            value = tag.split(" "); // ET[0] 42MM[1]
            val = Number((value[1]).match(/\d+$/)); // 42

            // Cycle through provided offsets (should be array)
            // If match, add it!
            if (rim_offset) {
              rim_offset.forEach(function(offset) {
                if(val <= offset.replace(/[^\d.-]/g,'')) rim_offsets.add(product); // Only if ET is less than specoffset) items.add(product); // Only if ET is less than spec
              });
            }
          }

        });
      });

      // Merge
      // We only need the wheels which match all of the above
      // This means we only need the items which appear in all arrays
      // We need to base everything around the bolt_pattern values
      // Bolt_pattern is a direct thing, meaning we can cycle through it and see if there are any matches with the other arrays
      // https://stackoverflow.com/a/45304197/1143732
      console.log("TESSSST");
      console.log(bolt_patterns);
      //bolt_patterns.some(v => rim_offset.includes(v));
      console.log(bolt_patterns);

      // Response
      // This allows us to send specific groups of products back to the user
      // Based on the "Bold Pattern" -> "Central Bore" -> "Rim ET/Offset"
      response.send( Array.from(items) );

    });
});

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
