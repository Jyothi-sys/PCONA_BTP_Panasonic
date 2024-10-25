const cds = require('@sap/cds');
const log = require('../util/logger')

module.exports = cds.service.impl(function () {


    this.on('zipcode', async (req) => {
        log.cfLoggingMessages('debug', 'zipcode -> ' + req);
        let { purchasegroup } = req.data;
        let data = await SELECT.from`BTP.Panasonic.PurchaseGroup_GlobalCode`.where`PurchaseGroup=${purchasegroup}`;
        log.cfLoggingMessages('debug', 'data -> ' + data);
        return data;    
    });

    
    this.on('fifo', async (req) => {
        log.cfLoggingMessages('debug', 'fifo -> ' + req);
        let tx = cds.tx(req);
        let { purchase,order,ibdnum,lineid } = req.data;
        let SelectQuery1 = "SELECT max(a.ID),b.INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER,b.countryOfOrigin,b.quantity,b.unitPrice,b.netWeight,b.containerID,b.manufacturerID from BTP_PANASONIC_BOLHEADER as a join BTP_PANASONIC_INVOICELINE as b on a.housebolnumber = b.INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER Where b.purchaseOrderNumber = " + "'" + purchase + "' and b.orderItemNbr = '" + order + "' and b.BTP_IBDNumber = '" + ibdnum + "' and b.SAP_LineID_IBD = '" + lineid + "'  group by b.INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER,b.countryOfOrigin,b.quantity,b.unitPrice,b.netWeight,b.containerID,b.manufacturerID";   
        // log.cfLoggingMessages('info',"SelectQuery_1_ ==>", SelectQuery1);
        // log.cfLoggingMessages('debug', 'SelectQuery1 -> ', SelectQuery1);
        let query = cds.parse.cql(SelectQuery1);
        let Result_query = await tx.run(query);
        log.cfLoggingMessages('debug',"Result_query_1_ ==>" + JSON.stringify(Result_query));
        return Result_query;
    });
    
    this.on('shipment', async (req) => {
        log.cfLoggingMessages('debug', 'shipment -> ' + req);
        let { id_num,bol_number } = req.data;
        let data = await SELECT.from`BTP.Panasonic.bolHeader`.where`ID=${id_num} and houseBOLNumber=${bol_number}`.columns('importShipmentNumber','brokerCode');
        // log.cfLoggingMessages('debug', 'data -> ', data);
        return data;    
    });
});