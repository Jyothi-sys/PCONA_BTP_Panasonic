const cds = require('@sap/cds');
const util = require('./util/util');
const log = require('./util/logger')


module.exports = cds.service.impl(async function () {

    const { POConfirmationData } = cds.entities('BTP.Panasonic')


    this.before('CREATE', 'Excecution_log', async (req) => {
        log.cfLoggingMessages('debug', 'Excecution_log.create' + req.data);
        const tx = cds.tx(req);
        if (!req.data.ID) {
            req.data.ID = await util.autoID('Excecution_log', 'ID', tx);
        }
    })


    this.on('ABLine_PostStatus', async req => {
        try {
            log.cfLoggingMessages('debug', "ABLine_PostStatus" + req);
            const data = req.data["POConfirmationData"];
            const count = Object.keys(data).length;
            const tx = cds.tx(req);

            // log.cfLoggingMessages('info', "count:" + count);
            for (let i = 0; i < count; i++) {
                const PurchaseOrder = data[i].PurchaseOrder;
                const PurchaseOrderItem = data[i].PurchaseOrderItem;
                const DeliveryDate = data[i].DeliveryDate;
                const SequenceNo = data[i].SequenceNo;
                const Status = data[i].Status;
                const Message = data[i].Message;

                const dataUpd = {
                    "Status": Status,
                    "Message": Message
                };
                // log.cfLoggingMessages('info', "dataUpd:" + JSON.stringify(dataUpd));

                await tx.run(UPDATE(POConfirmationData).set(dataUpd).where({ PurchaseOrder: PurchaseOrder, PurchaseOrderItem: PurchaseOrderItem, DeliveryDateETA: DeliveryDate, SequenceNo: SequenceNo }));
                // log.cfLoggingMessages('info', "status:Successfully updated");
            }

            return true;
        }
        catch (error) {
            log.cfLoggingMessages('error', 'Error in ABLine_PostStatus' + error)
            req.error({
                code: '400',
                message: e.message,
                target: 'ABLine_PostStatus',
                status: 418
            })
            return false;
        }
    })
})