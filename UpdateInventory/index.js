const { cp } = require("fs");
const { apiRoot } = require("../dist/services/commercetoolsClient.js");
 
module.exports = async function (context, request) {
  try {
    const sku = request.body.sku;
    const quantity = request.body.quantity || 1; // Default to adding 1 if quantity is not provided
 
    context.log(`Fetching product with sku: ${sku}`);
 
   // Call Commercetools API
    const response = await apiRoot
      .productProjections()
      .get({
        queryArgs: {
          // Filter variants to match the specific SKU
          where: `masterVariant(sku="${sku}") or variants(sku="${sku}")`,
          staged: true, // Set to true for unpublished, false for published
          priceCurrency: 'USD',
          limit: 1
        },
      })
      .execute();

if (!response.body.results.length) {
  throw new Error(`Product with sku ${sku} not found`);
}
context.log(`Fetching product with sku: ${response.body.results[0].id}`);

const supplychannel = await apiRoot.channels().get({
  queryArgs: {
    where: `key="INV-STK"`,    
    limit: 1
  },
}).execute();

context.log(`Fetching supply channel: ${supplychannel.body.results.length > 0 ? supplychannel.body.results[0].id : 'No supply channel found'}`);

const inventory = await apiRoot
  .inventory()
  .get({
    queryArgs: {
      where: `sku="${sku}" and supplyChannel(id="${supplychannel.body.results[0].id}")`,
      limit: 1
    },
  })
  .execute();

context.log(`Fetching inventory for sku: ${inventory.body.results.length > 0 ? inventory.body.results[0].supplyChannel?.id : 'No inventory entry found'}`);
if (inventory.body.results.length > 0) {
  const inventoryEntry = inventory.body.results[0];
  const inventoryId = inventoryEntry.id;
  const currentVersion = inventoryEntry.version;  
  const newQuantity = inventoryEntry.availableQuantity + quantity;
  context.log(`Current inventory quantity: ${inventoryEntry.availableQuantity}, New inventory quantity: ${newQuantity}`);

  const updateResponse = await apiRoot.inventory().withId({ ID: inventoryId }).post({
    body: {
      version: currentVersion,
      actions: [    
        {
          action: "changeQuantity",
          quantity: newQuantity   
        }
      ]
    }
  }).execute();
} else {
  throw new Error(`Inventory entry not found for sku ${sku} with channel INV-STK`);
}

const transformed = inventory.body.results[0];
    context.res = {
      status: 200,
      body: {
        success: true,
        data: transformed,
        raw: inventory.body,
      },
    };
  } catch (error) {
    context.log.error("Error fetching product:", error);
    context.res = {
      status: 500,
      body: {
        success: false,
        message: "Failed to fetch product from Commercetools",
        error: error?.message || "Internal Server Error",
      },
    };
  }
};