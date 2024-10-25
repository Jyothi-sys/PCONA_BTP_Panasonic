"use strict";

const tracer = require('@sap/xotel-agent-ext-js/dist/common/tracer');
const cds = require("@sap/cds");
const proxy = require("@sap/cds-odata-v2-adapter-proxy");
const fesr = require("@sap/fesr-to-otel-js");
require(
    'dotenv'
    ).config();

cds.on("bootstrap", async app => {
    fesr.registerFesrEndpoint(app);
    app.use(proxy());
});

module.exports = cds.server;

/* If cds-odata-v2-adapter-proxy is deprecated, please enable below code */
// const cds = require("@sap/cds");
// const cov2ap = require("@cap-js-community/odata-v2-adapter");
// cds.on("bootstrap", (app) => app.use(cov2ap()));
// module.exports = cds.server;