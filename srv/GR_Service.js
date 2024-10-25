const cds = require('@sap/cds');
const log = require('./util/logger')


module.exports = cds.service.impl(async function () {

    const { invoiceLine, MNET_DiversionDetail } = cds.entities('BTP.Panasonic');

    /* This Service is only for Stock GR's */
    this.on('GR_Data_Update', async req => {
        try {
            const tx = cds.tx(req);
            log.cfLoggingMessages('debug', 'GR_Data_Update JSON' + JSON.stringify(req.data));

            for (let i = 0; i < Object.keys(req.data["GR_UPDATE"]).length; i++) {
                const BTP_IBDNumber = req.data["GR_UPDATE"][i].BTP_IBDNumber;
                const SAP_LineID_IBD = req.data["GR_UPDATE"][i].SAP_LineID_IBD;
                const BTP_GRStatus = req.data["GR_UPDATE"][i].BTP_GRStatus;
                const BTP_GRNumber = req.data["GR_UPDATE"][i].BTP_GRNumber;
                const SAP_LineID_GR = req.data["GR_UPDATE"][i].SAP_LineID_GR;
                //Added code for 225 defect Asif
                const existingRecord = await SELECT.from`BTP_PANASONIC.INVOICELINE`
                .where`BTP_IBDNumber=${BTP_IBDNumber} and SAP_LineID_IBD = ${SAP_LineID_IBD}`;
                if (existingRecord.length > 0) 
                {
                    await tx.run(UPDATE(invoiceLine).set({ BTP_GRStatus: BTP_GRStatus, BTP_GRNumber: BTP_GRNumber, SAP_LineID_GR: SAP_LineID_GR, BTP_GRAction: 'C' }).where({ BTP_IBDNumber: BTP_IBDNumber, SAP_LineID_IBD: SAP_LineID_IBD }));
                }else{
                    await tx.run(UPDATE(MNET_DiversionDetail).set({ GR_STATUS: BTP_GRStatus, Receipt: BTP_GRNumber, GR_Item:SAP_LineID_GR, GR_ACTION: 'C' }).where({ DELIVERY: BTP_IBDNumber, IBD_ITEM: SAP_LineID_IBD }));
                }   
                                //update mnetstatusmonitoring               
            }
            return true; 
        } catch (error) {

            log.cfLoggingMessages('error', 'Error in GR_Data_Update' + error);
            req.error({
                code: '400',
                message: error.message,
                target: 'invoiceLine',
                status: 418
            })
            return false;
        }
    })
})