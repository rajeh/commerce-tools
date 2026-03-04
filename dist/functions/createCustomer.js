const { app } = require("@azure/functions");
const { apiRoot } = require("../services/commercetoolsClient.js");

app.http("CreateCustomer", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    context.log("Initiated");
 
    try {

      const body = await request.json();
    const mutation = `
        mutation CreateCustomer($email: String!, $password: String!, $firstName: String!, $lastName: String!) {
            customerSignUp(draft: {
                email: $email
                password: $password
                firstName: $firstName
                lastName: $lastName
            }) {
                customer {
                    id
                    email
                    firstName
                    lastName
                }
            }
        }
    `;

    const response = await apiRoot.graphql().post({
        body: {
            query: mutation,
            variables: {
                email: body.email,
                password: body.password,
                firstName: body.firstName,
                lastName: body.lastName
            }
        }
    }).execute();

    return {
        status: 200,
        jsonBody: response.body.data
    };
    
    
    } catch (error) {
      context.error("Error creating customer:", error);
      return {
        status: 500,
        jsonBody: {
          Message: "Failed",
          error: error.message
        }
      };
    }
  },
});