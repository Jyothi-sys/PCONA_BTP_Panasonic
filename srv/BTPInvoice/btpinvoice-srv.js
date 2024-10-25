const cds = require('@sap/cds');
const log = require('../util/logger')


module.exports = cds.service.impl(function () {


    this.on('zbtp_invoice', async (req) => {

        log.cfLoggingMessages('debug', 'zbtp_invoice -> ' + req);
        const { folderno, housebolno, invoiceno, invoicelineno, Serviceticketno } = req.data;

        let dbQuery = "CALL REVOKE_ZBTPINVOICE(" + "'" + folderno + "'" + "," + "'" + housebolno + "'" + "," + "'" + invoiceno + "'" + "," + "'" + invoicelineno + "'" + "," + "'" + Serviceticketno + "'" + ")";
        // log.cfLoggingMessages('info','dbQuery -> ' + dbQuery);
        const result = await cds.run(dbQuery, {});
        // log.cfLoggingMessages('info','result' + JSON.stringify(result));


    });

});