const cds = require('@sap/cds');
const util = require('./util/util');
const log = require('./util/logger')


module.exports = cds.service.impl(async function () {

    const { POStatusMonitoring } = cds.entities('BTP.Panasonic')


    this.before('CREATE', 'Excecution_log', async (req) => {
        log.cfLoggingMessages('debug', 'Excecution_log.before' + req);

        const tx = cds.tx(req);
        if (!req.data.ID) {
            req.data.ID = await util.autoID('Excecution_log', 'ID', tx);
        }

    })


    this.after(['UPDATE'], 'A_PurchaseOrder', async (req) => {
        try {
            const tx = cds.tx(req);
            log.cfLoggingMessages('debug', 'A_PurchaseOrder.after' + req);

            const PurchaseOrder = req.data.PurchaseOrder;
            const PurchaseOrderItem = req.data.PurchaseOrderItem;

            // let dbQuery = "CALL GET_POSTATUSMONITORING_ID(NEXT_ID => ?)";
            // // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
            // const result = await cds.run(dbQuery, {});
            // // log.cfLoggingMessages('info', 'SP NEXT ID result' + JSON.stringify(result));
            // const ID = result.NEXT_ID[0].ID;
            // // log.cfLoggingMessages('info', req.data);
            // /* Implementation: Passing PurchaseOrderItem at the time of insertion on POSTATUSMONITORING
            //                     Change on : 28-05-2024
            //                     Author : Kanchan */

            // var data1 = {
            //     "ID": ID,
            //     "PO": PurchaseOrder,
            //     "Status": 'U',
            //     "PurchaseOrderItem":PurchaseOrderItem,
            //     "Message": 'Purchase Order Updated'
            // }
            // // log.cfLoggingMessages('info', JSON.stringify(data1));
            // tx.run(INSERT.into(POStatusMonitoring).entries(data1));

             // replacing insert postatusmonitoring with stored procedure CS
             let uspObtectType = '';
             let uspStatus = 'U';
             let uspMessage = 'Purchase Order Updated';
             let dbQuery = "CALL USP_CREATE_POSTATUSMONITORING(I_PURCHASEORDER => " + PurchaseOrder + " ,I_POLINEITEM => " + "'" + PurchaseOrderItem + "'" + " ,I_OBJECTTYPE => " + "'" + uspObtectType + "'" + " ,I_STATUS => " + "'" + uspStatus + "'" + " ,I_MESSAGE => " + "'" + uspMessage + "'" + ")";
             // log.logger('info', 'dbQuery -> ' + dbQuery);
             const result = await cds.run(dbQuery, {});
             log.logger('debug', 'USP_CREATE_POSTATUSMONITORING SP result (A_PurchaseOrder) 56' + JSON.stringify(result));
              // replacing insert postatusmonitoring with stored procedure CE
        }
        catch (error) {
            log.cfLoggingMessages('error', 'Error in A_PurchaseOrder' + error)
            req.error({
                code: '400',
                message: error.message,
                target: 'some_field',
                status: 418
            })
        }
    });
})