const fetch = require("node-fetch");
const https = require("https");
const { ClientBuilder } = require("@commercetools/sdk-client-v2");
const { createApiBuilderFromCtpClient } = require("@commercetools/platform-sdk");

// Handle SSL certificate issues (for development only)
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === "production",
});

const customFetch = (url, options = {}) => {
  if (url.startsWith("https://")) {
    options.agent = httpsAgent;
  }
  return fetch(url, options);
};

/**
 * Validate required environment variables
 */
function validateEnv() {
  const requiredEnvVars = [
    "CT_PROJECT_KEY",
    "CT_AUTH_URL",
    "CT_API_URL",
    "CT_CLIENT_ID",
    "CT_CLIENT_SECRET",
  ];

  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

// Run validation at startup (important for Azure Functions cold start)
validateEnv();

const {
  CT_PROJECT_KEY: projectKey,
  CT_AUTH_URL: authUrl,
  CT_API_URL: apiUrl,
  CT_CLIENT_ID: clientId,
  CT_CLIENT_SECRET: clientSecret,
} = process.env;

/**
 * Auth Middleware Configuration (Client Credentials Flow)
 */


const authMiddlewareOptions = {
  host: authUrl,
  projectKey,
  credentials: {
    clientId,
    clientSecret,
  },
  fetch: customFetch,
};

/**
 * HTTP Middleware Configuration
 */
const httpMiddlewareOptions = {
  host: apiUrl,
  fetch: customFetch,
};

/**
 * Build Commercetools Client
 */
const ctpClient = new ClientBuilder()
  .withClientCredentialsFlow(authMiddlewareOptions)
  .withHttpMiddleware(httpMiddlewareOptions)
  .build();

/**
 * Export API Root (used across Azure Functions/services)
 */
const apiRoot = createApiBuilderFromCtpClient(ctpClient).withProjectKey({
  projectKey,
});

module.exports = {
  apiRoot,
};
