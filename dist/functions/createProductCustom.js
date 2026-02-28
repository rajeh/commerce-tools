const { app } = require("@azure/functions");
const { apiRoot } = require("../services/commercetoolsClient");

app.http("CreateProductCustom", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const inventoryGraphql= "query { inventoryEntries(limit: 100) { results { id, sku, quantityOnStock } } }";
            const inventoryResponse = await apiRoot
                .graphql()
                .post({
                    body: { query: inventoryGraphql }
                })
                .execute();

            const inventoryEntries = inventoryResponse.body.data.inventoryEntries.results;
            context.log("Fetched Inventory Entries:", inventoryEntries);    

            const categoryName = body.categoryName || "Default Category112";
            const createCategoryMutation = `
                mutation CreateCategory($key: String!, $slug: [LocalizedStringItemInputType!]!, $name: [LocalizedStringItemInputType!]!) {
                    createCategory(draft: {
                        key: $key
                        slug: $slug
                        name: $name
                    }) {
                        id
                        key
                        name
                        slug
                    }
                }
            `;

            const categoryResponse = await apiRoot
                .graphql()
                .post({
                    body: {
                        query: createCategoryMutation,
                        variables: {
                            key: body.categoryKey || "default-category112",
                            slug: [{ locale: "en", value: body.categorySlug || "default-category112" }],
                            name: [{ locale: "en", value: categoryName }]
                        }
                    }
                })
                .execute();

            const newCategory = categoryResponse.body.data.createCategory;
            context.log("Created Category:", newCategory);

            // 1. Validate mandatory fields for the commercetools ProductDraft
            
        const graphqlQuery = `
            query {
                categories(limit: 100) {
                    results {
                        id
                        key
                        slug
                        description
                    }
                }
            }
        `;
    
             
        
        const categoriesResponse = await apiRoot
            .graphql()
            .post({
                body: { query: graphqlQuery }
            })
            .execute();

        const categories = categoriesResponse.body.data.categories.results;
        context.log("Fetched Categories:", categories);

            const productPayload={    "productType": {
        "id": "4538047d-72c7-4aa3-b585-ef5ed5e092ae",
        "typeId": "product-type"
    },
 
    "name": {
        "en": "new00117"
    },
    "slug": {
        "en": "new001177"
    },
    "priceMode": "Embedded",
    "categories": [
        {
            "id": newCategory.id,
            "typeId": "category"
        }
    ],
    "masterVariant": {
        "id": 1,
        "key": "VER001171",
        "sku": "SKU001171",
        "attributes": [
                        {
                            "name": "designer",
                            "value": {
                                "key": "guess",
                                "label": "Guess"
                            }
                        }]
    },
    "variants": [],
    "productkey": "00117",
    "description": {
        "en": "New Product"
    },
    "taxCategory": {
        "id": "27790438-c32d-406c-bccf-34ef9311cff2",
        "typeId": "tax-category",
        "obj": {
            "id": "27790438-c32d-406c-bccf-34ef9311cff2",
            "name": "standard"
        }
    },
    "metaTitle": {
        "en": "",
        "de": "",
        "fr": ""
    },
    "metaDescription": {
        "en": "",
        "de": "",
        "fr": ""
    }
}           // 2. Execute the Create request
            const response = await apiRoot
                .products()
                .post({
                    body: productPayload
                })
                .execute();

            return {
                status: 201,
                jsonBody: {
                    success: true,
                    productId: response.body.id,
                    product: response.body
                }
            };

        } catch (error) {
            context.error("Failed to create product:", error.message);
            return {
                status: error.statusCode || 500,
                jsonBody: {
                    success: false,
                    error: error.message,
                    details: error.body?.errors || []
                }
            };
        }
    }
});