const cds = require('@sap/cds');
const log = require('./util/logger')



module.exports = cds.service.impl(async function () {


    const service1 = await cds.connect.to('API_SALES_ORDER_SRV');
    const service2 = await cds.connect.to('API_BUSINESS_PARTNER_API');

    const { SalesOrder, SalesOrderItem, SalesOrderItemPartner,
        SalesOrderHeaderPartner, BusinessPartner } = this.entities;


    this.on('READ', SalesOrder, async (req) => {
        log.cfLoggingMessages('debug', 'SalesOrder' + req.query);
        return await service1.tx(req).run(req.query);

    })
    this.on('READ', SalesOrderItem, async (req) => {
        log.cfLoggingMessages('debug', 'SalesOrderItem' + req.query);
        return await service1.tx(req).run(req.query);

    })
    this.on('READ', SalesOrderItemPartner, async (req) => {
        log.cfLoggingMessages('debug', 'SalesOrderItemPartner' + req.query);
        return await service1.tx(req).run(req.query);

    })
    this.on('READ', SalesOrderHeaderPartner, async (req) => {
        log.cfLoggingMessages('debug', 'SalesOrderHeaderPartner' + req.query);
        return await service1.tx(req).run(req.query);

    })


    // Ravi Added this code for testing ...
    this.on('READ', BusinessPartner, async (req) => {
        log.cfLoggingMessages('debug', 'BusinessPartner' + req.query);
        return await service2.tx(req).run(req.query);
    })
})