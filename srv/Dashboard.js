const cds = require('@sap/cds');
const axios = require("axios");
const log = require('./util/logger');

module.exports = cds.service.impl(async function () {

    const { invoiceLine, MNET_DiversionDetail, Environment, POCrossRef, MNetStatusMonitoring, MNetStatusMonitoringItem } = cds.entities('BTP.Panasonic')
    const MNetStatusMonitoringItemEntity = MNetStatusMonitoringItem;
    const { GET_PO_MNET_DATA } = this.entities;
    //GET_POSTATUSMONITORING_ID
    this.before('CREATE', 'POStatusMonitoring', async (req) => {
        log.cfLoggingMessages('debug', 'POStatusMonitoring.before -> ' + req);
        let dbQuery = "CALL GET_POSTATUSMONITORING_ID(NEXT_ID => ?)";
        // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
        const result = await cds.run(dbQuery, {});
        log.cfLoggingMessages('debug', 'SP NEXT ID result' + JSON.stringify(result));
        req.data.ID = result.NEXT_ID[0].ID;

    });

    this.on('postatus_batch', async (req) => {
        log.cfLoggingMessages('debug', 'postatus_batch -> ' + req);
        const batch = req.data.batch;
        const results = [];

        try {


            for (const record of batch) {
                try {
                    const dbQuery = 'CALL GET_POSTATUSMONITORING_ID(NEXT_ID => ?)';
                    const idResult = await cds.run(dbQuery, {});
                    const generatedID = idResult && idResult.NEXT_ID && idResult.NEXT_ID.length > 0
                        ? idResult.NEXT_ID[0].ID
                        : null;
                    if (!generatedID) {
                        throw new Error('Failed to generate IDs for the batch.');
                    }
                    // Assign the generated ID to each record
                    record.ID = generatedID;

                    // Insert the record into the database
                    let result = await INSERT.into('btp.Panasonic.POStatusMonitoring').entries(record);
                    // Extract relevant information and store it in the results array
                    results.push({
                        success: true,
                        message: 'Record Inserted Successfully',
                    });
                } catch (error) {
                    // Handle any errors during record insertion
                    log.cfLoggingMessages('error', 'Error inserting record' + error)
                    results.push({
                        success: false,
                        message: `Error inserting record: ${error.message}`,
                    });
                }
            }
        } catch (error) {
            // Handle any errors during ID generation for the batch
            log.cfLoggingMessages('error', 'Error generating IDs for the batch' + error)
            results.push({
                success: false,
                message: `Error generating IDs for the batch: ${error.message}`,
            });
        }

        return results;
    });


    this.on('pohist_bol', async (req) => {
        log.cfLoggingMessages('debug', 'pohist_bol -> ' + req);
        const { houseBOLNumber } = req.data;
        var result = await SELECT.from`BTP.Panasonic.invoiceHeader`.where`houseBOLNumber_houseBOLNumber=${houseBOLNumber}`;
        return result;
    });

    this.on('pohist_head', async (req) => {
        log.cfLoggingMessages('debug', 'pohist_head -> ' + req);
        const { shipnumber } = req.data;
        var result = await SELECT.from`BTP.Panasonic.bolHeader`.where`importShipmentNumber=${shipnumber}`;
        return result;
    });

    this.on('pohist_invdate', async (req) => {
        log.cfLoggingMessages('debug', 'pohist_invdate -> ' + req);
        const { houseBOLNumber } = req.data;
        var result = await SELECT.from`BTP.Panasonic.invoiceHeader`.where`houseBOLNumber_houseBOLNumber=${houseBOLNumber}`;
        return result;
    });

    this.before('CREATE', 'MNetStatusMonitoring', async (req) => {

        log.cfLoggingMessages('debug', 'MNetStatusMonitoring.before -> ' + req);
        let dbQuery = "CALL GET_MNETSTATUSMONITORING_ID(NEXT_ID => ?)";
        // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
        const result = await cds.run(dbQuery, {});
        log.cfLoggingMessages('debug', 'SP NEXT ID result' + JSON.stringify(result));
        req.data.ID = result.NEXT_ID[0].ID;


        for (let i = 0; i < Object.keys(req.data["MNetStatusMonitoringItem"]).length; i++) {
            req.data["MNetStatusMonitoringItem"][i].LineID = (i + 1);
        }
        log.cfLoggingMessages('debug', 'MNetStatusMonitoring Data -> ' + JSON.stringify(req.data));

    })

    this.after(['CREATE'], 'MNetStatusMonitoring', async function (_, req) {
        try {
            log.cfLoggingMessages('debug', '--MNetStatusMonitoring--.after -> ' + req);
            let tx = cds.tx(req);
            // log.cfLoggingMessages('info', 'MNetStatusMonitoring =>' + req);
            let ObjectType = req.data.ObjectType.replace('/', '_').toUpperCase();
            let ObjectRefNo = req.data.ObjectRefNo;
            let Status = req.data.Status;
            let Action = req.data.Action;
            let iBOLID = req.data.BOLID;
            let houseBOLNumber = req.data.houseBOLNumber;
            let invoiceNumber = req.data.invoiceNumber;
            let containerID = req.data.containerID;
            let importShipmentNumber = req.data.importShipmentNumber;
            // Kowsalyaa for 206 V_Webmethod
            let lineNumber = [];

            const MNetStatusMonitoringItem = req.data.MNetStatusMonitoringItem;

            const count = Object.keys(MNetStatusMonitoringItem).length;
            log.cfLoggingMessages('debug', "--MNetStatusMonitoring--Data:" + JSON.stringify(MNetStatusMonitoringItem));

            if (count > 0) {
                await MNetStatusMonitoringItem.map(item => lineNumber.push(item.lineNumber))
            }

            const PurchaseOrder = MNetStatusMonitoringItem.length > 0 ? MNetStatusMonitoringItem[0].PurchaseOrder : "";
            if (count > 0) {
                for (let i = 0; i < count; i++) {
                    const PurchaseOrderItem = MNetStatusMonitoringItem[i].PurchaseOrderItem;
                    const SAP_LineID = MNetStatusMonitoringItem[i].SAP_LineID;
                    const MNET_LINE = MNetStatusMonitoringItem[i].lineNumber;


                    log.cfLoggingMessages('debug', "--MNetStatusMonitoring--PurchaseOrder:" + PurchaseOrder);
                    log.cfLoggingMessages('debug', "--MNetStatusMonitoring--PurchaseOrderItem:" + PurchaseOrderItem);
                    log.cfLoggingMessages('debug', "--MNetStatusMonitoring--SAP_LineID:" + SAP_LineID);

                    if (ObjectType == "INBOUNDDELIVERY") {

                        // 172 defect - To update part substituted line item in invoice line table

                        const fetchPartSubstitutedInvoice = "select DISTINCT A.PurchaseOrderNumber, A.linenumber, A.INVOICENUMBER_HOUSEBOLNUMBER_ID, A.INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER, A.CONTAINERID, A.SAP_LINEID_IBD, A.orderitemnbr, C.ID_ID, B.ID, C.PurchaseOrder, C.PurchaseOrderItem, C.SAP_LINEID  From BTP_PANASONIC_INVOICELINE as A, BTP_PANASONIC_MNETSTATUSMONITORING AS B, BTP_PANASONIC_MNETSTATUSMONITORINGITEM as C   where a.INVOICENUMBER_HOUSEBOLNUMBER_ID = b.BOLID AND a.INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER = b.HOUSEBOLNUMBER AND a.INVOICENUMBER_INVOICENUMBER = b.INVOICENUMBER AND    a.CONTAINERID = b.CONTAINERID AND  b.Objecttype = 'InboundDelivery' AND   b.id = c.id_id AND c.linenumber = a.lineNumber AND  c.purchaseOrder = a.purchaseOrderNumber AND a.orderitemnbr != c.purchaseorderitem AND a.purchaseOrderNumber='" + [PurchaseOrder] + "'"
                        let query = cds.parse.cql(fetchPartSubstitutedInvoice);
                        let fetchPartSubstitutedInvoiceResult = await tx.run(query);
                        log.cfLoggingMessages('debug', 'fetchPartSubstitutedInvoice RESULT' + fetchPartSubstitutedInvoiceResult)

                        if (fetchPartSubstitutedInvoiceResult.length) {
                            for (const result of fetchPartSubstitutedInvoiceResult) {
                                const update = await tx.run(UPDATE(invoiceLine).set({ orderItemNbr: result.PurchaseOrderItem }).where({ PurchaseOrderNumber: result.PurchaseOrderNumber, linenumber: result.linenumber, INVOICENUMBER_HOUSEBOLNUMBER_ID: result.INVOICENUMBER_HOUSEBOLNUMBER_ID, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: result.INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER, CONTAINERID: result.CONTAINERID, SAP_LINEID_IBD: result.SAP_LINEID_IBD }))
                            }
                        }


                        if (Status == "S") {
                            //Defect 232.n  - Moved Code from Before status check to within Status Check for "S"
                            await tx.run(UPDATE(invoiceLine).set({ BTP_IBDNumber: ObjectRefNo, BTP_IBDStatus: Status, SAP_LineID_IBD: SAP_LineID, BTP_IBDAction: Action }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                            const checkStatus = "SELECT Status from Dashboard.Get_StockDrop_Status where PurchaseOrder = '" + [PurchaseOrder] + "' AND PurchaseOrderItem = '" + [PurchaseOrderItem] + "'";
                            let query1 = cds.parse.cql(checkStatus);
                            let result1 = await tx.run(query1);
                            log.cfLoggingMessages('debug', "--MNetStatusMonitoring-- Status:" + JSON.stringify(result1));

                            const checkIBDStatus = "SELECT BTP_IBDStatus,BTP_InvoiceStatus,BTP_ASN_DI_Status,BTP_GRStatus,DIVERSIONFLAG,PurchaseOrderNumber,OrderItemNbr from Dashboard.invoiceLine where invoiceNumber_housebolnumber_id = '" + [iBOLID] + "' AND INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER = '" + [houseBOLNumber] + "' AND lineNumber = '" + [MNET_LINE] + "' AND INVOICENUMBER_INVOICENUMBER = '" + [invoiceNumber] + "' AND ContainerID = '" + [containerID] + "'";
                            let query3 = cds.parse.cql(checkIBDStatus);
                            let result3 = await tx.run(query3);
                            log.cfLoggingMessages('debug', "--MNetStatusMonitoring-- RESULT3->" + JSON.stringify(result3));
                            // kowsalyaa for defect 217 pt-1
                            const selectStatusFromDiversion = "SELECT IBD_Status,INV_Status,ID_HOUSEBOLNUMBER from Dashboard.MNET_DiversionDetail where NewPurchasing_Order = '" + [PurchaseOrder] + "' AND NewPOLine = '" + [PurchaseOrderItem] + "'";
                            let query4 = cds.parse.cql(selectStatusFromDiversion);
                            let result4 = await tx.run(query4);
                            const Length = result3.length;

                            log.cfLoggingMessages('debug', "--MNetStatusMonitoring-- RESULT3->" + JSON.stringify(result3));

                            // jyothi changed code for defect 199 on 24/01/2024
                            if (Length > 0) {
                                if (result1[0].Status == "Stock") {
                                    if (result3[0].BTP_InvoiceStatus == "E") {
                                        // Status E condition for Stock
                                        await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                                        await tx.run(UPDATE(MNET_DiversionDetail).set({ Status: 'E' }).where({ NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem }));

                                    } else {
                                        // Status C condition for Stock
                                        if (result3[0].DIVERSIONFLAG == 'D') {
                                            await tx.run(UPDATE(invoiceLine).set({ status: 'C' }).where({ purchaseOrderNumber: result3[0].PurchaseOrderNumber, orderItemNbr: result3[0].OrderItemNbr, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                                        } else {
                                            await tx.run(UPDATE(invoiceLine).set({ status: 'C' }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE,INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber  }));
                                        }
                                        await tx.run(UPDATE(MNET_DiversionDetail).set({ Status: 'C' }).where({ NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem }));
                                    }
                                } else if (result1[0].Status == "Drop") {
                                    // Status E condition for Drop
                                    if (result3[0].BTP_InvoiceStatus == "E") {
                                        await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                                        await tx.run(UPDATE(MNET_DiversionDetail).set({ Status: 'E' }).where({ NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem }));
                                    }
                                    else {
                                        // Status P condition
                                        if (result3[0].DIVERSIONFLAG == 'D') {
                                            await tx.run(UPDATE(invoiceLine).set({ status: 'P' }).where({ purchaseOrderNumber: result3[0].PurchaseOrderNumber, orderItemNbr: result3[0].OrderItemNbr, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                                        } else {
                                            await tx.run(UPDATE(invoiceLine).set({ status: 'P' }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                                        }
                                        await tx.run(UPDATE(MNET_DiversionDetail).set({ Status: 'P' }).where({ NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem }));
                                    }
                                }
                            }
                            else {
                                if (result1[0].Status == "Stock") {
                                    // Kowsalyaa for Defect 217 Pt.1 removed if and else conditions because result3 has no value here
                                    // Status C condition for Stock
                                    await tx.run(UPDATE(invoiceLine).set({ status: 'C' }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE }));
                                    await tx.run(UPDATE(MNET_DiversionDetail).set({ Status: 'C' }).where({ NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem }));

                                } else if (result1[0].Status == "Drop") {
                                    // Status P condition
                                    await tx.run(UPDATE(invoiceLine).set({ status: 'P' }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE }));
                                    await tx.run(UPDATE(MNET_DiversionDetail).set({ Status: 'P' }).where({ NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem }));
                                }
                            }

                            if (Action == 'D') {
                                await tx.run(UPDATE(invoiceLine).set({ status: 'E', BTP_IBDAction: 'D' }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE, BTP_IBDNumber: ObjectRefNo })); //added for defect 232
                                if (result3[0].DIVERSIONFLAG == 'D') {
                                    //update the parent line status when diversion takes place with parentline po number
                                    // await tx.run(UPDATE(invoiceLine).set({ status: 'E', BTP_IBDAction: 'D' }).where({ purchaseOrderNumber: result3[0].PurchaseOrderNumber, lineNumber: MNET_LINE, BTP_IBDNumber: ObjectRefNo })); //added for defect 232
                                    await tx.run(UPDATE(invoiceLine).set({ status: 'E', BTP_IBDAction: 'D' }).where({ purchaseOrderNumber: result3[0].PurchaseOrderNumber, orderItemNbr: result3[0].OrderItemNbr, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));

                                    /* Implementation: Logic to delete the child line from diversion detail table if reversal is succesful during diversion  and updating the Parent line with its details 
                                            Author: Preethi 
                                            Date: 04-06-2024  
                                            Start*/
                                    //validate if GR ,IBD & INV got reversed successfully and delete the corresponding line from mnet_diversiondetail table in case of diverted line 
                                    await tx.run(UPDATE(MNET_DiversionDetail).set({ Status: 'E', IBD_Status: Status, IBD_Action: Action }).where({ NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem, ID_HOUSEBOLNUMBER: houseBOLNumber, ID_MNET_NO: invoiceNumber, ID_MNET_LINE: MNET_LINE, ID_CONTAINER_ID: containerID }));
                                    const diversionStatus = "SELECT GR_Status,GR_Action,Receipt,GR_Item,IBD_Status,IBD_Action,Delivery,IBD_Item,INV_Status,INV_Action,Invoice,INV_Item from Dashboard.MNET_DiversionDetail where ID_MNET_ID = '" + [iBOLID] + "' AND ID_HOUSEBOLNUMBER = '" + [houseBOLNumber] + "' AND ID_MNET_LINE = '" + [MNET_LINE] + "' AND ID_MNET_NO = '" + [invoiceNumber] + "' AND ID_CONTAINER_ID = '" + [containerID] + "' AND ID_PURCHASE_ORDER = '" + [result3[0].PurchaseOrderNumber] + "' AND ID_PO_LINE = '" + [result3[0].OrderItemNbr] + "' AND NEWPURCHASING_ORDER='" + [PurchaseOrder] + "' AND NEWPOLINE = '" + [PurchaseOrderItem] + "'";
                                    let querydiv = cds.parse.cql(diversionStatus);
                                    log.cfLoggingMessages('info', "querydivIBD>" + querydiv);
                                    let resultdiv = await tx.run(querydiv);
                                    log.cfLoggingMessages('info', "RESULTdivIBD->" + JSON.stringify(resultdiv));

                                    if (!resultdiv[0].Receipt)   //if GRno is null ,0 or undefined 
                                    {
                                        if (resultdiv[0].INV_Status == 'S' && resultdiv[0].INV_Action == 'D') {
                                            await tx.run(DELETE(MNET_DiversionDetail).where({ ID_HOUSEBOLNUMBER: houseBOLNumber, ID_MNET_ID: iBOLID, ID_MNET_LINE: MNET_LINE, ID_CONTAINER_ID: containerID, ID_MNET_NO: invoiceNumber, NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem }));
                                            // update the mnetstatumonitoring and item table of the original PO and PO Line with msg to display the details of reversed line 
                                            let dbQuery = "CALL GET_MNETSTATUSMONITORING_ID(NEXT_ID => ?)";
                                            const result = await cds.run(dbQuery, {});
                                            let ID = result.NEXT_ID[0].ID;
                                            const insertDiversionMnetData = {
                                                ID: ID,
                                                BOLID: iBOLID,
                                                INVOICENUMBER: invoiceNumber,
                                                HOUSEBOLNUMBER: houseBOLNumber,
                                                CONTAINERID: containerID,
                                                Message: `Diverted PO/item:${PurchaseOrder}/${PurchaseOrderItem}with IBD#:${resultdiv[0].Delivery}/${resultdiv[0].IBD_Item},SAP Invoice#:${resultdiv[0].Invoice}/${resultdiv[0].INV_Item} has been reversed.Please check "U" for any new diversion activity.`,
                                                ObjectType: 'DIVERSION',
                                                Status: 'S',
                                                IMPORTSHIPMENTNUMBER: importShipmentNumber
                                            }
                                            log.cfLoggingMessages('debug', 'insertDiversionMnetData' + insertDiversionMnetData)
                                            await tx.run(INSERT.into(MNetStatusMonitoring).entries(insertDiversionMnetData));
                                            const insertMnetItemData = {
                                                ID_ID: ID,
                                                LINEID: 1,
                                                LINENUMBER: MNET_LINE,
                                                PURCHASEORDER: result3[0].PurchaseOrderNumber,
                                                PURCHASEORDERITEM: result3[0].OrderItemNbr
                                            }
                                            await tx.run(INSERT.into(MNetStatusMonitoringItemEntity).entries(insertMnetItemData));
                                            await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ purchaseOrderNumber: result3[0].PurchaseOrderNumber, orderItemNbr: result3[0].OrderItemNbr, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                                        }
                                    }
                                    else {
                                        if ((resultdiv[0].INV_Status == 'S' && resultdiv[0].INV_Action == 'D') && (resultdiv[0].GR_Status == 'S' && resultdiv[0].GR_Action == 'R')) {
                                            await tx.run(DELETE(MNET_DiversionDetail).where({ ID_HOUSEBOLNUMBER: houseBOLNumber, ID_MNET_ID: iBOLID, ID_MNET_LINE: MNET_LINE, ID_CONTAINER_ID: containerID, ID_MNET_NO: invoiceNumber, NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem }));
                                            // update the mnetstatumonitoring and item table of the original PO and PO Line with msg to display the details of reversed line    
                                            let dbQuery = "CALL GET_MNETSTATUSMONITORING_ID(NEXT_ID => ?)";
                                            const result = await cds.run(dbQuery, {});
                                            let ID = result.NEXT_ID[0].ID;
                                            const insertDiversionMnetData = {
                                                ID: ID,
                                                BOLID: iBOLID,
                                                INVOICENUMBER: invoiceNumber,
                                                HOUSEBOLNUMBER: houseBOLNumber,
                                                CONTAINERID: containerID,
                                                Message: `Diverted PO/item:${PurchaseOrder}/${PurchaseOrderItem}with IBD#:${resultdiv[0].Delivery}/${resultdiv[0].IBD_Item},SAP Invoice#:${resultdiv[0].Invoice}/${resultdiv[0].INV_Item},GR#:${resultdiv[0].Receipt}/${resultdiv[0].GR_Item} has been reversed.Please check "U" for any new diversion activity.`,
                                                ObjectType: 'DIVERSION',
                                                Status: 'S',
                                                IMPORTSHIPMENTNUMBER: importShipmentNumber
                                            }
                                            log.cfLoggingMessages('debug', 'insertDiversionMnetData' + insertDiversionMnetData)
                                            await tx.run(INSERT.into(MNetStatusMonitoring).entries(insertDiversionMnetData));
                                            const insertMnetItemData = {
                                                ID_ID: ID,
                                                LINEID: 1,
                                                LINENUMBER: MNET_LINE,
                                                PURCHASEORDER: result3[0].PurchaseOrderNumber,
                                                PURCHASEORDERITEM: result3[0].OrderItemNbr
                                            }
                                            await tx.run(INSERT.into(MNetStatusMonitoringItemEntity).entries(insertMnetItemData));
                                            await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ purchaseOrderNumber: result3[0].PurchaseOrderNumber, orderItemNbr: result3[0].OrderItemNbr, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                                        }
                                    }

                                }//END

                            }
                            // If action is 'U', updating the invoice line 15-02
                            if (Action == 'U') {
                                let dbQuery = "CALL UPD_IBDACTION(v_containerid => " + "'" + containerID + "'" + ", v_documentno => " + "'" + ObjectRefNo + "'" + ",v_bol => " + "'" + houseBOLNumber + "'" + ",v_invoiceno => " + "'" + invoiceNumber + "'" + ", v_BTP_IBDStatus => '" + Status + "', v_BTP_IBDAction => '" + Action + "', I_BOLID => '"+iBOLID+"' )";
                                const sp_result = await cds.run(dbQuery, {});

                            }
                            // If action is 'U', updating the invoice line 15-02

                            await tx.run(UPDATE(MNET_DiversionDetail).set({ Delivery: ObjectRefNo, IBD_Item: SAP_LineID, IBD_Status: Status, IBD_Action: Action }).where({ NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem, ID_HOUSEBOLNUMBER: houseBOLNumber, ID_MNET_NO: invoiceNumber, ID_MNET_LINE: MNET_LINE, ID_CONTAINER_ID: containerID }));
                            await tx.run(UPDATE(POCrossRef).set({ IBDNumber: ObjectRefNo, SAP_LineID_IBD: SAP_LineID, IBDStatus: Status }).where({ Po_New: PurchaseOrder, PoItem_New: PurchaseOrderItem }));


                        }
                        else {
                            //Defect 232.n  - Moved Code for IBDStatus from Before status check to within Status Check for "E"
                            await tx.run(UPDATE(invoiceLine).set({ status: 'E', BTP_IBDStatus: Status, BTP_IBDAction: Action }).where({ purchaseOrderNumber: PurchaseOrder, orderItemNbr: PurchaseOrderItem, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber, INVOICENUMBER_INVOICENUMBER: invoiceNumber, lineNumber: MNET_LINE,
                                INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID
                             }));
                            await tx.run(UPDATE(MNET_DiversionDetail).set({ Status: 'E', IBD_Status: Status, IBD_Action: Action }).where({ NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem, ID_HOUSEBOLNUMBER: houseBOLNumber, ID_MNET_NO: invoiceNumber, ID_MNET_LINE: MNET_LINE, ID_CONTAINER_ID: containerID }));
                        }
                    }
                    else if (ObjectType == "INVOICE") {


                        if (Status == "S") {
                            //Defect 232.n  - Moved Code from Before status check to within Status Check for "S"

                            await tx.run(UPDATE(invoiceLine).set({ BTP_InvoiceNumber: ObjectRefNo, BTP_InvoiceStatus: Status, SAP_LineID_Invoice: SAP_LineID, BTP_InvoiceAction: Action }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));

                            //defect 66 status error change 03/07
                            /*
                                INC0219526
                                Invoiceline status is updating to E which are not current linenumber
                                it is causing the issue when reversal happen
                            */
                            // await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: { 'not in': lineNumber }, BTP_InvoiceStatus: { '=': null } }));


                            let dbQuery = "CALL GET_DROPSHIP_STATUS(PO => " + "'" + PurchaseOrder + "'" + ",STATUS => ?)";
                            const result = await cds.run(dbQuery, {});
                            log.cfLoggingMessages('debug', 'GET_DROPSHIP_STATUS=>' + JSON.stringify(result));
                            let result1 = result.STATUS;

                            const checkIBDStatus = "SELECT BTP_IBDStatus,BTP_InvoiceStatus,BTP_ASN_DI_Status,BTP_GRStatus,DIVERSIONFLAG,PurchaseOrderNumber,OrderItemNbr from Dashboard.invoiceLine where invoiceNumber_housebolnumber_id = '" + [iBOLID] + "' AND INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER = '" + [houseBOLNumber] + "' AND lineNumber = '" + [MNET_LINE] + "' AND INVOICENUMBER_INVOICENUMBER = '" + [invoiceNumber] + "' AND ContainerID = '" + [containerID] + "'";
                            let query3 = cds.parse.cql(checkIBDStatus);
                            let result3 = await tx.run(query3);
                            log.cfLoggingMessages('debug', 'GET_DROPSHIP_STATUS=>' + JSON.stringify(result3));
                            if (Action == "C") {

                                if (result3[0].DIVERSIONFLAG == 'D') {
                                    // update the diverion lines with other po line items to e
                                    // for diversion scenario where it is updating other line items to C when diversion takes
                                    // await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ purchaseOrderNumber: result3[0].PurchaseOrderNumber, lineNumber: { 'not in': lineNumber }, BTP_InvoiceStatus: { '=': null } }));
                                    //EO
                                    
                                    await tx.run(UPDATE(MNET_DiversionDetail).set({ Invoice: ObjectRefNo, INV_Item: SAP_LineID, INV_Status: Status, INV_Action: Action }).where({ NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem, ID_HOUSEBOLNUMBER: houseBOLNumber, ID_MNET_NO: invoiceNumber, ID_MNET_LINE: MNET_LINE, ID_CONTAINER_ID: containerID }));
                                    //get the IBD_Status from diversion detail 
                                    const diversionIBDStatus = "SELECT IBD_Status from Dashboard.MNET_DiversionDetail where ID_MNET_ID = '" + [iBOLID] + "' AND ID_HOUSEBOLNUMBER = '" + [houseBOLNumber] + "' AND ID_MNET_LINE = '" + [MNET_LINE] + "' AND ID_MNET_NO = '" + [invoiceNumber] + "' AND ID_CONTAINER_ID = '" + [containerID] + "' AND ID_PURCHASE_ORDER = '" + [result3[0].PurchaseOrderNumber] + "' AND ID_PO_LINE = '" + [result3[0].OrderItemNbr] + "' AND NEWPURCHASING_ORDER='" + [PurchaseOrder] + "' AND NEWPOLINE = '" + [PurchaseOrderItem] + "'";
                                    let query4 = cds.parse.cql(diversionIBDStatus);
                                    log.cfLoggingMessages('info', "query4>" + query4);
                                    let result4 = await tx.run(query4);
                                    log.cfLoggingMessages('info', "RESULT4->" + JSON.stringify(result4));
                                    if (result4 && result4.length > 0 && result4[0].IBD_Status == 'E') {
                                        await tx.run(UPDATE(MNET_DiversionDetail).set({ Status: 'E' }).where({ ID_HOUSEBOLNUMBER: houseBOLNumber, ID_MNET_ID: iBOLID, NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem }));
                                    } else {
                                        if (result1 == 'Stock') {
                                            await tx.run(UPDATE(MNET_DiversionDetail).set({ Status: 'C' }).where({ ID_HOUSEBOLNUMBER: houseBOLNumber, ID_MNET_ID: iBOLID, NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem }));
                                        }
                                        else {
                                            await tx.run(UPDATE(MNET_DiversionDetail).set({ Status: 'P' }).where({ ID_HOUSEBOLNUMBER: houseBOLNumber, ID_MNET_ID: iBOLID, NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem }));
                                        }
                                    }
                                }
                                //changes end Bhushan 08-05-2024
                                else {
                                    // Check If BTP_IBDStatus is 'E'
                                    if (result3[0].BTP_IBDStatus == 'E') {
                                        // Update Status as 'E' in invoiceline table
                                        await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                                    }
                                    else {
                                        let OLD_BOLID = "CALL GET_PREV_BOLID_1(V_PO =>" + "'" + PurchaseOrder + "'" + " ,V_PURCHASEORDERITEM => " + "'" + PurchaseOrderItem + "'" + ",V_BOL =>" + "'" + houseBOLNumber + "'" + ",V_INVOICENUMBER => " + "'" + invoiceNumber + "'" + ",V_INVOICELINENUMBER =>" + "'" + MNET_LINE + "'" + ", V_BOLID =>" + iBOLID + ",V_OBOLID => ?,O_CONTAINERID => ?)";
                                        const result_bol = await cds.run(OLD_BOLID, {}); const checkIBDStatus_prevBol = "SELECT BTP_IBDStatus from Dashboard.invoiceLine where invoiceNumber_housebolnumber_id = '" + result_bol.V_OBOLID + "' AND ContainerID = '" + result_bol.O_CONTAINERID + "' AND purchaseOrderNumber= '" + PurchaseOrder + "' AND lineNumber= '" + MNET_LINE + "' AND INVOICENUMBER_INVOICENUMBER= '" + invoiceNumber + "' AND INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER= '" + houseBOLNumber + "'";
                                        let query_prevBol = cds.parse.cql(checkIBDStatus_prevBol);
                                        let result3_prevBol = await tx.run(query_prevBol);
                                        if (result1 == 'Stock') {
                                            /* Implementation: Before updating the InvoiceLine with Status as "C" we are validating with IBD Status, ASN_DI Status and Invoice Status
                                            Author: Mohammed Asif Baba
                                            Date: 15-05-2024  
                                            Defect: UAT_84 */

                                            
                                            if (result3[0].BTP_IBDStatus == 'S' && result3[0].BTP_InvoiceStatus == 'S' && result3[0].BTP_ASN_DI_Status == 'S') {
                                                // Status C condition for Stock
                                                await tx.run(UPDATE(invoiceLine).set({ status: 'C' }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                                            }
                                            /* Implementation: For Price change condition, before updating the InvoiceLine with Status as "C" we are validating BTP_IBDStatus of prev BOL_id equals to 'S' and current Invoice Status equals to 'S'.Before updating the InvoiceLine with Status as "E" we are validating BTP_IBDStatus of prev BOL_id equals to 'E' and current Invoice Status equals to 'S'.
                                            Author: Kanchan
                                            Date: 11-07-2024  
                                            Defect: 66 */
                                            else if (result3_prevBol[0].BTP_IBDStatus === 'S' && result3[0].BTP_InvoiceStatus == 'S') {
                                                await tx.run(UPDATE(invoiceLine).set({ status: 'C' }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                                            }
                                            else if ((result3_prevBol[0].BTP_IBDStatus === 'E' || result3_prevBol[0].BTP_IBDStatus === null) && result3[0].BTP_InvoiceStatus == 'S') {
                                                await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                                            }

                                        }
                                        /* Implementation: Before updating the InvoiceLine with Status as "C" we are validating with GR Status, IBD Status, ASN_DI Status and Invoice Status
                                        Author: Mohammed Asif Baba
                                        Date: 15-05-2024 
                                        Defect: UAT_84 */
                                        else {
                                            if (result3[0].BTP_IBDStatus == 'S' && result3[0].BTP_InvoiceStatus == 'S' && result3[0].BTP_ASN_DI_Status == 'S' && result3[0].BTP_GRStatus == 'S') {
                                                // Status P condition for Drop
                                                await tx.run(UPDATE(invoiceLine).set({ status: 'C' }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                                            }
                                            else if (result3[0].BTP_IBDStatus == 'S' && result3[0].BTP_InvoiceStatus == 'S') {
                                                await tx.run(UPDATE(invoiceLine).set({ status: 'P' }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                                            }

                                            /* Implementation: For Price change condition, before updating the InvoiceLine with Status as "P" we are validating BTP_IBDStatus of prev BOL_id equals to 'S' and current Invoice Status equals to 'S'.Before updating the InvoiceLine with Status as "E" we are validating BTP_IBDStatus of prev BOL_id equals to 'E' and current Invoice Status equals to 'S'.
                                            Author: Kanchan
                                            Date: 11-07-2024  
                                            Defect: 66 */
                                            else if (result3_prevBol[0].BTP_IBDStatus === 'S' && result3[0].BTP_InvoiceStatus == 'S') {
                                                await tx.run(UPDATE(invoiceLine).set({ status: 'P' }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                                            }
                                            else if ((result3_prevBol[0].BTP_IBDStatus === 'E' || result3_prevBol[0].BTP_IBDStatus === null) && result3[0].BTP_InvoiceStatus == 'S') {
                                                await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                                            }
                                        }
                                    }
                                }
                            }
                            // Kowsalyaa for Defect 202 on 31-01
                            if (Action == 'D') {
                                await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE, BTP_InvoiceNumber: ObjectRefNo }));
                                if (result3[0].DIVERSIONFLAG == 'D') {
                                    //update the parent line status when diversion takes place with parentline po number
                                    await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ purchaseOrderNumber: result3[0].PurchaseOrderNumber, orderItemNbr: result3[0].OrderItemNbr, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                                    /* Implementation: Logic to delete the child line from diversion detail table if reversal is succesful during diversion  and updating the Parent line with its details 
                                             Author: Preethi 
                                              Date: 04-06-2024  
                                              Start*/
                                    //validate if GR ,IBD & INV got reversed successfully and delete the corresponding line from mnet_diversiondetail table in case of diverted line 
                                    await tx.run(UPDATE(MNET_DiversionDetail).set({ Status: 'E', INV_Status: Status, INV_Action: Action }).where({ NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem, ID_HOUSEBOLNUMBER: houseBOLNumber, ID_MNET_NO: invoiceNumber, ID_MNET_LINE: MNET_LINE, ID_CONTAINER_ID: containerID }));
                                    const diversionStatus = "SELECT GR_Status,GR_Action,Receipt,GR_Item,IBD_Status,IBD_Action,Delivery,IBD_Item,INV_Status,INV_Action,Invoice,INV_Item from Dashboard.MNET_DiversionDetail where ID_MNET_ID = '" + [iBOLID] + "' AND ID_HOUSEBOLNUMBER = '" + [houseBOLNumber] + "' AND ID_MNET_LINE = '" + [MNET_LINE] + "' AND ID_MNET_NO = '" + [invoiceNumber] + "' AND ID_CONTAINER_ID = '" + [containerID] + "' AND ID_PURCHASE_ORDER = '" + [result3[0].PurchaseOrderNumber] + "' AND ID_PO_LINE = '" + [result3[0].OrderItemNbr] + "' AND NEWPURCHASING_ORDER='" + [PurchaseOrder] + "' AND NEWPOLINE = '" + [PurchaseOrderItem] + "'";
                                    let querydiv = cds.parse.cql(diversionStatus);
                                    log.cfLoggingMessages('info', "querydiv>" + querydiv);
                                    let resultdiv = await tx.run(querydiv);
                                    log.cfLoggingMessages('info', "RESULTdiv->" + JSON.stringify(resultdiv));

                                    if (!resultdiv[0].Receipt)   //if GRno is null ,0 or undefined 
                                    {
                                        if (resultdiv[0].IBD_Status == 'S' && resultdiv[0].IBD_Action == 'D') {
                                            await tx.run(DELETE(MNET_DiversionDetail).where({ ID_HOUSEBOLNUMBER: houseBOLNumber, ID_MNET_ID: iBOLID, ID_MNET_LINE: MNET_LINE, ID_CONTAINER_ID: containerID, ID_MNET_NO: invoiceNumber, NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem }));
                                            // update the mnetstatumonitoring and item table of the original PO and PO Line with msg to display the details of reversed line 
                                            let dbQuery = "CALL GET_MNETSTATUSMONITORING_ID(NEXT_ID => ?)";
                                            const result = await cds.run(dbQuery, {});
                                            let ID = result.NEXT_ID[0].ID;
                                            const insertDiversionMnetData = {
                                                ID: ID,
                                                BOLID: iBOLID,
                                                INVOICENUMBER: invoiceNumber,
                                                HOUSEBOLNUMBER: houseBOLNumber,
                                                CONTAINERID: containerID,
                                                Message: `Diverted PO/item:${PurchaseOrder}/${PurchaseOrderItem}with IBD#:${resultdiv[0].Delivery}/${resultdiv[0].IBD_Item},SAP Invoice#:${resultdiv[0].Invoice}/${resultdiv[0].INV_Item} has been reversed.Please check "U" for any new diversion activity.`,
                                                ObjectType: 'DIVERSION',
                                                Status: 'S',
                                                IMPORTSHIPMENTNUMBER: importShipmentNumber
                                            }
                                            log.cfLoggingMessages('debug', 'insertDiversionMnetData' + insertDiversionMnetData)
                                            await tx.run(INSERT.into(MNetStatusMonitoring).entries(insertDiversionMnetData));
                                            const insertMnetItemData = {
                                                ID_ID: ID,
                                                LINEID: 1,
                                                LINENUMBER: MNET_LINE,
                                                PURCHASEORDER: result3[0].PurchaseOrderNumber,
                                                PURCHASEORDERITEM: result3[0].OrderItemNbr
                                            }
                                            await tx.run(INSERT.into(MNetStatusMonitoringItemEntity).entries(insertMnetItemData));
                                            await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ purchaseOrderNumber: result3[0].PurchaseOrderNumber, orderItemNbr: result3[0].OrderItemNbr, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                                        }
                                    }
                                    else {
                                        if ((resultdiv[0].IBD_Status == 'S' && resultdiv[0].IBD_Action == 'D') && (resultdiv[0].GR_Status == 'S' && resultdiv[0].GR_Action == 'R')) {
                                            await tx.run(DELETE(MNET_DiversionDetail).where({ ID_HOUSEBOLNUMBER: houseBOLNumber, ID_MNET_ID: iBOLID, ID_MNET_LINE: MNET_LINE, ID_CONTAINER_ID: containerID, ID_MNET_NO: invoiceNumber, NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem }));
                                            // update the mnetstatumonitoring and item table of the original PO and PO Line with msg to display the details of reversed line    
                                            let dbQuery = "CALL GET_MNETSTATUSMONITORING_ID(NEXT_ID => ?)";
                                            const result = await cds.run(dbQuery, {});
                                            let ID = result.NEXT_ID[0].ID;
                                            const insertDiversionMnetData = {
                                                ID: ID,
                                                BOLID: iBOLID,
                                                INVOICENUMBER: invoiceNumber,
                                                HOUSEBOLNUMBER: houseBOLNumber,
                                                CONTAINERID: containerID,
                                                Message: `Diverted PO/item:${PurchaseOrder}/${PurchaseOrderItem}with IBD#:${resultdiv[0].Delivery}/${resultdiv[0].IBD_Item},SAP Invoice#:${resultdiv[0].Invoice}/${resultdiv[0].INV_Item},GR#:${resultdiv[0].Receipt}/${resultdiv[0].GR_Item} has been reversed.Please check "U" for any new diversion activity.`,
                                                ObjectType: 'DIVERSION',
                                                Status: 'S',
                                                IMPORTSHIPMENTNUMBER: importShipmentNumber
                                            }
                                            log.cfLoggingMessages('debug', 'insertDiversionMnetData' + insertDiversionMnetData)
                                            await tx.run(INSERT.into(MNetStatusMonitoring).entries(insertDiversionMnetData));
                                            const insertMnetItemData = {
                                                ID_ID: ID,
                                                LINEID: 1,
                                                LINENUMBER: MNET_LINE,
                                                PURCHASEORDER: result3[0].PurchaseOrderNumber,
                                                PURCHASEORDERITEM: result3[0].OrderItemNbr
                                            }
                                            await tx.run(INSERT.into(MNetStatusMonitoringItemEntity).entries(insertMnetItemData));
                                            await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ purchaseOrderNumber: result3[0].PurchaseOrderNumber, orderItemNbr: result3[0].OrderItemNbr, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                                        }
                                    }

                                }//END
                            }

                        }
                        else if (Status == "E") {

                            await tx.run(UPDATE(MNET_DiversionDetail).set({ Status: 'E', INV_Status: Status, INV_Action: Action }).where({ NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem, ID_HOUSEBOLNUMBER: houseBOLNumber, ID_MNET_NO: invoiceNumber, ID_MNET_LINE: MNET_LINE, ID_CONTAINER_ID: containerID }));

                            await tx.run(UPDATE(invoiceLine).set({ status: 'E', BTP_InvoiceStatus: Status, BTP_InvoiceAction: Action }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));

                        }
                    }
                    //added by Preethi for defect 232 to set E status to lineitem if GR goes to an error.
                    else if (ObjectType == "GOODSRECEIPT") {
                        const GR_NO = req.data.GR_NO; //Defect 216
                        if (Status == "S") {

                            log.cfLoggingMessages('debug', 'GR_Data_Update JSON' + JSON.stringify(req.data));
                            if (+GR_NO > 0) {
                                await tx.run(UPDATE(invoiceLine).set({ BTP_GRStatus: Status, BTP_GRNumber: GR_NO, SAP_LineID_GR: SAP_LineID, BTP_GRAction: Action }).where({ purchaseOrderNumber: PurchaseOrder, orderItemNbr: PurchaseOrderItem, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber, BTP_IBDNumber: ObjectRefNo }));//SAP_LineID_IBD: SAP_LineID_IBD
                            }

                            if (Action == 'C') {
                                //for GR posting we will consider only idb status 
                                await tx.run(UPDATE(invoiceLine).set({ status: 'C' }).where({ purchaseOrderNumber: PurchaseOrder, orderItemNbr: PurchaseOrderItem, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber, SAP_LineID_GR: SAP_LineID, BTP_GRNumber: GR_NO, BTP_IBDStatus: 'S', BTP_InvoiceAction: 'C' }));
                                // Lines =561 to 568 commented out becuase the BTP_InvioceStatus: 'S' in above update statement instead of BTP_IBDStatus
                                // if (BTP_InvoiceAction == '') {
                                let InvAct = "SELECT TOP 1 A.BTP_InvoiceStatus,A.BTP_InvoiceAction from BTP_PANASONIC_INVOICELINE AS A, BTP_PANASONIC_BOLHEADER AS B where A.INVOICENUMBER_INVOICENUMBER = '" + [invoiceNumber] + "' and A.PURCHASEORDERNUMBER = '" + [PurchaseOrder] + "' and A.ORDERITEMNBR = '" + [PurchaseOrderItem] + "' and B.ID = A.INVOICENUMBER_HOUSEBOLNUMBER_ID and B.HOUSEBOLNUMBER = A.INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER and B.importShipmentNumber = '" + [importShipmentNumber] + "' and A.SAP_LINEID_INVOICE <> '' ORDER BY A.INVOICENUMBER_HOUSEBOLNUMBER_ID DESC";
                                // let Inv_Action = await cds.run(InvAct);
                                // log.cfLoggingMessages('info', "Inv_Action" + Inv_Action);
                                let result_invact = await tx.run(InvAct);
                                log.cfLoggingMessages('info', "RESULTdiv->" + JSON.stringify(result_invact));
                                if (result_invact && result_invact.length > 0 && result_invact[0].BTP_INVOICESTATUS == 'S' && result_invact[0].BTP_INVOICEACTION == 'C') {
                                    await tx.run(UPDATE(invoiceLine).set({ status: 'C' }).where({ purchaseOrderNumber: PurchaseOrder, orderItemNbr: PurchaseOrderItem, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber, SAP_LineID_GR: SAP_LineID, BTP_GRNumber: GR_NO, BTP_IBDStatus: 'S' }));
                                }
                                await tx.run(UPDATE(MNET_DiversionDetail).set({ Status: 'C', Receipt: GR_NO, GR_Item: SAP_LineID, GR_Status: Status, GR_Action: Action }).where({ NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem, ID_HOUSEBOLNUMBER: houseBOLNumber, ID_MNET_NO: invoiceNumber, ID_MNET_LINE: MNET_LINE, ID_CONTAINER_ID: containerID }));
                                //need to add below corresponding fields in diversion details for above update
                                //  SAP_LineID_GR: SAP_LineID, BTP_GRNumber: GR_NO, BTP_InvoiceStatus: 'S', ?BTP_InvoiceAction: 'C' 
                            }
                        }//    Bhushan 28-04-2024 GR Update  Def.eo
                        else if (Status == "E") {
                            await tx.run(UPDATE(invoiceLine).set({ status: 'E', BTP_GRStatus: Status }).where({ purchaseOrderNumber: PurchaseOrder, orderItemNbr: PurchaseOrderItem, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                            await tx.run(UPDATE(MNET_DiversionDetail).set({ Status: 'E', GR_Status: Status, GR_Action: Action }).where({ NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem, ID_HOUSEBOLNUMBER: houseBOLNumber, ID_MNET_NO: invoiceNumber, ID_MNET_LINE: MNET_LINE, ID_CONTAINER_ID: containerID }));
                        }
                        else if (Action == 'R') {
                            await tx.run(UPDATE(invoiceLine).set({ status: 'C', BTP_GRStatus: Status, BTP_GRAction: Action }).where({ purchaseOrderNumber: PurchaseOrder, orderItemNbr: PurchaseOrderItem, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber, SAP_LineID_GR: SAP_LineID, BTP_GRNumber: GR_NO }));
                        }
                        await tx.run(UPDATE(MNET_DiversionDetail).set({ Receipt: GR_NO, GR_Item: SAP_LineID, GR_Status: Status, GR_Action: Action }).where({ NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem, ID_HOUSEBOLNUMBER: houseBOLNumber, ID_MNET_NO: invoiceNumber, ID_MNET_LINE: MNET_LINE, ID_CONTAINER_ID: containerID }));
                    }
                    else if (ObjectType == "ASN_DI") {

                        await tx.run(UPDATE(invoiceLine).set({ BTP_ASN_DINumber: ObjectRefNo, BTP_ASN_DI_Status: Status }).where({ purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber,
                        BTP_IBDNumber: ObjectRefNo }));

                        
                        if (Status == "S") {
                            await tx.run(UPDATE(MNET_DiversionDetail).set({ ASN_DI: ObjectRefNo }).where({ NewPurchasing_Order: PurchaseOrder, NewPOLine: PurchaseOrderItem }));

                        }
                    }
                }
            }
            else {
                if (ObjectType == 'INVOICE') {
                    // Kowsalyaa for Defect 202 on 01-02
                    // log.cfLoggingMessages('info', 'ACTION IN 323' + Action + ObjectRefNo);
                    if (Action == 'D') {
                        await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ BTP_InvoiceNumber: ObjectRefNo, purchaseOrderNumber: PurchaseOrder, lineNumber: MNET_LINE, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                    }
                }
            }
            //UPD_IBDACTION
            if (ObjectType == "INBOUNDDELIVERY" && Action == 'U') {

                // await tx.run(UPDATE(invoiceLine).set({BTP_IBDStatus: Status }).where({ BTP_IBDNumber: ObjectRefNo, INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID, INVOICENUMBER_INVOICENUMBER: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));

                let dbQuery = "CALL UPD_IBDACTION(v_containerid => " + "'" + containerID + "'" + ", v_documentno => " + "'" + ObjectRefNo + "'" + ",v_bol => " + "'" + houseBOLNumber + "'" + ",v_invoiceno => " + "'" + invoiceNumber + "'" + ", v_BTP_IBDStatus => '" + Status + "', v_BTP_IBDAction => '" + Action + "', I_BOLID => '"+ iBOLID + "' )";
                const sp_result = await cds.run(dbQuery, {});

            }

            if (ObjectType == "GOODSRECEIPT") {

                const GR_NO = req.data.GR_NO;    //Defect 232
                const PurchaseOrderItem_new = MNetStatusMonitoringItem.length > 0 ? MNetStatusMonitoringItem[0].PurchaseOrderItem : "";
                if (Status == "S") {
                    let sapLineId = MNetStatusMonitoringItem.length > 0 ? MNetStatusMonitoringItem[0].SAP_LineID : "";
                    log.cfLoggingMessages("info", "GR sapLineId Diversion Details " + sapLineId);
                    // , Status: Status
                    await tx.run(UPDATE(MNET_DiversionDetail).set({
                        Receipt: GR_NO, GR_Status: Status, GR_Item: sapLineId, GR_Action: Action, Status: 'C'
                    }).where({ Delivery: ObjectRefNo }));

                    //get the details from diversion detail table 
                    //CS
                    const Output = "SELECT ID_PURCHASE_ORDER,ID_PO_LINE,NewPurchasing_Order,NewPOLine,NewQuantity,UnitPrice,PartUnitOfMeasurement,ExtendedCost,Status from Diversion.MNET_DiversionDetail where ID_MNET_ID ='" + [iBOLID] + "' and ID_houseBOLNumber = '" + [houseBOLNumber] + "' and ID_Mnet_No ='" + [invoiceNumber] + "' and ID_Container_ID ='" + [containerID] + "' and NewPurchasing_Order ='" + [PurchaseOrder] + "' and NewPOLine ='" + [PurchaseOrderItem_new] + "'";
                    let query = cds.parse.cql(Output);
                    let result = await tx.run(query);
                    log.cfLoggingMessages('info', " 1 : " + JSON.stringify(result));
                    let OrigPO = "";
                    let OrigPOLine = "";
                    for (const oudata of result) {
                        OrigPO = oudata.ID_PURCHASE_ORDER;
                        OrigPOLine = oudata.ID_PO_LINE;
                    }
                    if (OrigPO && OrigPOLine) {
                        const Output1 = "SELECT ID_PURCHASE_ORDER,ID_PO_LINE,NewPurchasing_Order,NewPOLine,NewQuantity,UnitPrice,PartUnitOfMeasurement,ExtendedCost,Status from Diversion.MNET_DiversionDetail where ID_MNET_ID ='" + [iBOLID] + "' and  ID_houseBOLNumber = '" + [houseBOLNumber] + "' and ID_Mnet_No ='" + [invoiceNumber] + "' and ID_Container_ID ='" + [containerID] + "' and ID_Purchase_Order ='" + [OrigPO] + "' and ID_PO_Line ='" + [OrigPOLine] + "'";
                        query = cds.parse.cql(Output1);
                        result = await tx.run(query);
                        log.cfLoggingMessages('info', " 2 :" + JSON.stringify(result));
                        let statusCheck = 0;
                        let statusText = "";
                        for (const oudata of result) {
                            const Status = oudata.Status;
                            if (Status === 'E') {
                                //update the invoice line table for the Org PO to 'E'
                                statusCheck++;
                                continue;
                            }
                            else {
                                statusText = Status;
                            }
                        }
                        // log.cfLoggingMessages('info', " 3 :"+statusCheck+":"+statusText);
                        if (statusCheck > 0) {
                            await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ purchaseOrderNumber: OrigPO, InvoiceNumber_InvoiceNumber: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber, ContainerID: containerID, orderItemNbr: OrigPOLine }));
                        }
                        else {
                            log.cfLoggingMessages('info', " GR without Line Number :" + JSON.stringify(result));
                            await tx.run(UPDATE(invoiceLine).set({ status: 'C' }).where({ purchaseOrderNumber: OrigPO, InvoiceNumber_InvoiceNumber: invoiceNumber, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber, ContainerID: containerID, orderItemNbr: OrigPOLine }));
                        }
                    }
                    //CE

                    if (Action == 'R') {
                        await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ BTP_InvoiceNumber: ObjectRefNo }));
                    }
                }
            }
        }
        catch (e) {
            log.cfLoggingMessages('error', 'Error in MNetStatusMonitoring' + e.message);
            req.error({
                code: '400',
                message: e.message,
                target: 'MNetStatusMonitoring_Dashboard',
                status: 418
            })
        }

    })
    const CPI_ASN_DI = async (req, Result) => {
        //Declarations
        log.cfLoggingMessages('debug', "CPI_ASN_DI" + req);
        const CPI_URL_Data = await SELECT.one(Environment).where({ APPID: 'CPI_ASN_DI' }).columns('URL', 'tokenUrl', 'clientId', 'clientSecret');
        log.cfLoggingMessages('debug', "CPI_URL_Data" + JSON.stringify(CPI_URL_Data));
        let CPI_clientId = "";
        let CPI_clientSecret = "";
        let CPI_tokenUrl = "";
        let CPI_url = "";
        if (CPI_URL_Data != null) {
            CPI_clientId = CPI_URL_Data.clientId;
            CPI_clientSecret = CPI_URL_Data.clientSecret;
            CPI_tokenUrl = CPI_URL_Data.tokenUrl;
            CPI_url = CPI_URL_Data.URL;
        }

        let client_credentials = btoa(CPI_clientId + ':' + CPI_clientSecret);
        // log.cfLoggingMessages('info', "client_credentials", JSON.stringify(client_credentials));
        let basicAuth = 'Basic ' + client_credentials;
        // log.cfLoggingMessages('info', "basicAuth", JSON.stringify(basicAuth));

        //Generate bearer token

        const resToken = await axios.get(CPI_tokenUrl, {
            headers: {
                "Authorization": basicAuth,
            },
            params: {
                "grant_type": "client_credentials",
            },

        });

        let bearerToken = 'Bearer ' + resToken.data.access_token;

        //log.cfLoggingMessages('info',bearerToken);
        const response1 = await axios({
            method: "POST",

            url: CPI_url,
            headers: {

                "Authorization": bearerToken,

                'accept': "application/json",

                'content-type': "application/json",

                'x-requested-with': 'XMLHttpRequest',

            },

            data: Result

        }).then(response1 => {

            log.cfLoggingMessages('debug', 'response1 -> ' + JSON.stringify(response1.data));

        }).catch(error => {
            log.cfLoggingMessages('error', 'Error in CPI_ASN_DI -> ' + JSON.stringify(error.response.data));
        });
        return true;

    }
    let V_Webmethod_query = async (req, PO, iBOLID, IBDNum, lineNumber, count) => {
        return cds.tx(async tx => {
            // log.cfLoggingMessages('info','line number data => ' + lineNumber + 'payload data line=> ' + count);
            if (count > 1) {
                let SelectQuery1 = "SELECT Distinct ZINB_BOLID,houseBOLNumber,importShipmentNumber,invoiceNumber,containerID,ObjectRefNo,purchaseOrderNumber,PurchaseOrderItem,deliveryDocument,TRAID,ZTMODE,ZVESSEL,ZFOLDERNO,ZRECTYPE,ZVOYAGE_NO,ZBOL_DEST,ZORDERERID,ZCUSTPONO,ZCAFACNUM,ZSTATUS,ZSAPLINEIDIBD,ZINVLINENO,ZMECAPONO,ZFINVLINEQTY,ZNOOFCASE,ZQUANPERCASE,LIFEX,ZUNIFIEDMODELNO,ZASNDIV,ZCARRID,POTIM,DC,WHSE,ALTKN,TDSPRAS,EXPIRY_DATE_EXT,EXPIRY_DATE_EXT_B,ZCARR_ASN,ZINBTYPE,ZDIARIND,TDLINE1,TDLINE2,PODAT,PARTNER_ID,JURISDIC,LANGUAGE,ZDELVTONAME,ZSTREET1,ZSTREET2,ZSTREET4,ZPOSTALCODE,ZCITY1,ZSTATE,ZCOUNTRY,NAME1,NAME2,STREET1,POSTL_COD1,CITY1,CITY2,COUNTRY1,REGION,ZCARACT,NewPurchasing_Order,Purchasinggroup,TRATY, ZSALESORDNO From MNET_Dashboard.MNET_WebMethod Where purchaseOrderNumber = " + "'" + PO + "' and deliveryDocument = '" + IBDNum + "' and ZINB_BOLID = " + iBOLID + " and ZINVLINENO IN (" + lineNumber.map(str => `'${str}'`) + ")  ORDER BY houseBOLNumber, containerID, ObjectRefNo, deliveryDocument, purchaseOrderNumber, PurchaseOrderItem";    //added order by for 165 defect by Preethi on 09/01/24
                log.cfLoggingMessages('debug', "SelectQuery1_ ==>" + SelectQuery1);
                let query = cds.parse.cql(SelectQuery1);
                let Result_query = await tx.run(query);
                // log.cfLoggingMessages('info', "Result_query_ ==>", JSON.stringify(Result_query));
                return Result_query;
            }
            else if (count > 0) {
                let SelectQuery1 = "SELECT Distinct ZINB_BOLID,houseBOLNumber,importShipmentNumber,invoiceNumber,containerID,ObjectRefNo,purchaseOrderNumber,PurchaseOrderItem,deliveryDocument,TRAID,ZTMODE,ZVESSEL,ZFOLDERNO,ZRECTYPE,ZVOYAGE_NO,ZBOL_DEST,ZORDERERID,ZCUSTPONO,ZCAFACNUM,ZSTATUS,ZSAPLINEIDIBD,ZINVLINENO,ZMECAPONO,ZFINVLINEQTY,ZNOOFCASE,ZQUANPERCASE,LIFEX,ZUNIFIEDMODELNO,ZASNDIV,ZCARRID,POTIM,DC,WHSE,ALTKN,TDSPRAS,EXPIRY_DATE_EXT,EXPIRY_DATE_EXT_B,ZCARR_ASN,ZINBTYPE,ZDIARIND,TDLINE1,TDLINE2,PODAT,PARTNER_ID,JURISDIC,LANGUAGE,ZDELVTONAME,ZSTREET1,ZSTREET2,ZSTREET4,ZPOSTALCODE,ZCITY1,ZSTATE,ZCOUNTRY,NAME1,NAME2,STREET1,POSTL_COD1,CITY1,CITY2,COUNTRY1,REGION,ZCARACT,NewPurchasing_Order,Purchasinggroup,TRATY, ZSALESORDNO From MNET_Dashboard.MNET_WebMethod Where purchaseOrderNumber = " + "'" + PO + "' and deliveryDocument = '" + IBDNum + "' and ZINB_BOLID = " + iBOLID + " and ZINVLINENO = '" + lineNumber + "'  ORDER BY houseBOLNumber, containerID, ObjectRefNo, deliveryDocument, purchaseOrderNumber, PurchaseOrderItem";    //added order by for 165 defect by Preethi on 09/01/24            
                // log.cfLoggingMessages('info', "SelectQuery_1_ ==>", SelectQuery1);
                let query = cds.parse.cql(SelectQuery1);

                let Result_query = await tx.run(query);
                // log.cfLoggingMessages('info', "Result_query_1_ ==>", JSON.stringify(Result_query));
                return Result_query;
            }
            else {
                // this is for 'U' ETA change
                //added to fix multiple IBD sent to ASN for defect 206 01/03/24
                let SelectQuery_1 = "SELECT Distinct ZINB_BOLID,houseBOLNumber,importShipmentNumber,invoiceNumber,containerID,ObjectRefNo,purchaseOrderNumber,PurchaseOrderItem,deliveryDocument,TRAID,ZTMODE,ZVESSEL,ZFOLDERNO,ZRECTYPE,ZVOYAGE_NO,ZBOL_DEST,ZORDERERID,ZCUSTPONO,ZCAFACNUM,ZSTATUS,ZSAPLINEIDIBD,ZINVLINENO,ZMECAPONO,ZFINVLINEQTY,ZNOOFCASE,ZQUANPERCASE,LIFEX,ZUNIFIEDMODELNO,ZASNDIV,ZCARRID,POTIM,DC,WHSE,ALTKN,TDSPRAS,EXPIRY_DATE_EXT,EXPIRY_DATE_EXT_B,ZCARR_ASN,ZINBTYPE,ZDIARIND,TDLINE1,TDLINE2,PODAT,PARTNER_ID,JURISDIC,LANGUAGE,ZDELVTONAME,ZSTREET1,ZSTREET2,ZSTREET4,ZPOSTALCODE,ZCITY1,ZSTATE,ZCOUNTRY,NAME1,NAME2,STREET1,POSTL_COD1,CITY1,CITY2,COUNTRY1,REGION,ZCARACT,NewPurchasing_Order,Purchasinggroup,TRATY, ZSALESORDNO From MNET_Dashboard.MNET_WebMethod Where purchaseOrderNumber = " + "'" + PO + "' and deliveryDocument = '" + IBDNum + "' and ZSTATUS = 'U' and  ZINB_BOLID IN ( SELECT distinct MAX(A.ZINB_BOLID) from  MNET_DASHBOARD_MNET_WEBMETHOD As A where A.INVOICENUMBER = MNET_DASHBOARD_MNET_WEBMETHOD.INVOICENUMBER and A.deliveryDocument = MNET_DASHBOARD_MNET_WEBMETHOD.deliveryDocument and A.ZSTATUS = MNET_DASHBOARD_MNET_WEBMETHOD.ZSTATUS and A.PURCHASEORDERITEM = MNET_DASHBOARD_MNET_WEBMETHOD.PURCHASEORDERITEM and A.PURCHASEORDERNUMBER = MNET_DASHBOARD_MNET_WEBMETHOD.PURCHASEORDERNUMBER ) ORDER BY houseBOLNumber, containerID, ObjectRefNo, deliveryDocument, purchaseOrderNumber, PurchaseOrderItem";
                log.cfLoggingMessages('info', "SelectQuery_1 ==>", SelectQuery_1);
                let query = cds.parse.cql(SelectQuery_1);
                let Result_query = await tx.run(query);
                log.cfLoggingMessages('debug', "Result_query ==>" + JSON.stringify(Result_query));
                return Result_query;
            }
        });

    }


    const V_Webmethod = async (req, BOL, PO, containerID, iBOLID, IBDNum, lineNumber, count) => {
        try {
            // const tx = cds.tx(req);
            let Result = await V_Webmethod_query(req, PO, iBOLID, IBDNum, lineNumber, count); // Added for defect 208

            log.cfLoggingMessages('debug', "after V_Webmethod_query" + BOL + PO + containerID + iBOLID + IBDNum + lineNumber + count);
            log.cfLoggingMessages('debug', 'Web ->' + JSON.stringify(Result));
            //added by Kanchan defect 185 19/1/24
            for (var data1 = 0; data1 < Result.length; data1++) {
                // log.cfLoggingMessages('info', "data_ASN_DI_post", data1);
                // log.cfLoggingMessages('info', "Result[data1]_dashboard==>", Result[data1]);

                let update = '';
                if (Result[data1].ZSTATUS === 'C') {
                    update = 'A';

                    Result[data1].ZSTATUS = update;
                    // log.cfLoggingMessages('info', "update==>", update);
                }
                else if (Result[data1].ZSTATUS === 'D') {
                    update = 'D';

                    Result[data1].ZSTATUS = update;
                    // log.cfLoggingMessages('info', "update==>", update);
                }
                else if (Result[data1].ZSTATUS === 'U') {
                    update = 'M';

                    Result[data1].ZSTATUS = update;
                    // log.cfLoggingMessages('info', "update==>", update);
                }
                else if (Result[data1].ZSTATUS != 'C' && Result[data1].ZSTATUS != 'D') {
                    update = 'M';

                    Result[data1].ZSTATUS = update;
                    // log.cfLoggingMessages('info', "update==>", update);
                }
                log.cfLoggingMessages('debug', 'ASN_DI_inside_loop->' + JSON.stringify(Result));
            }

            //end added by Kanchan defect 185 19/1/24

            //// Call CPI API
            log.cfLoggingMessages('debug', 'ASN_DI_Payload->' + JSON.stringify(Result));
            // If Result is '0', which means ASN is null or blank, don't trigger the CPI.
            if (Result && Result.length > 0) {
                let cpi_call = await CPI_ASN_DI(req, Result);
            }
            return true;
        }
        catch (error) {
            log.cfLoggingMessages('error', 'Error in V_Webmethod' + error)
            req.error
                ({
                    code: '400',
                    message: error.message,
                    target: 'some_field',
                    status: 418
                })
        }

    }

    /* A new service has been implemented to address the failure of the previous ASN_DI call, which was caused by improper commits. This new CAP Service is activated upon IBD creation. CPI enforces validations: if the status is 'S', the response of IBD is 'S', and the purchase order is not null, then it triggers the ASN_DI Service.
    Date: 01-05-2024
    Author: Mohammed Asif Baba
    */

    this.on('asn_di', async (req) => {
        try {
            log.cfLoggingMessages('debug', 'ASN =>' + req);
            let tx = cds.tx(req);
            // log.cfLoggingMessages('info', 'ASN =>' + req);
            let ObjectType = req.data.batch[0].ObjectType.replace('/', '_').toUpperCase();
            let ObjectRefNo = req.data.batch[0].ObjectRefNo;
            let Status = req.data.batch[0].Status;
            let iBOLID = req.data.batch[0].BOLID;
            let houseBOLNumber = req.data.batch[0].houseBOLNumber;
            let containerID = req.data.batch[0].containerID;
            let lineNumber = [];

            log.cfLoggingMessages('debug', 'asn_di' + "ObjectType:" + ObjectType + "ObjectRefNo:" + ObjectRefNo + "Status:" + Status + "iBOLID:" + iBOLID);
            const MNetStatusMonitoringItem = req.data.batch[0].MNetStatusMonitoringItem;
            const count = Object.keys(MNetStatusMonitoringItem).length;
            // log.cfLoggingMessages('info', "count:" + count);
            // log.cfLoggingMessages('info', "Data:" + JSON.stringify(MNetStatusMonitoringItem));
            if (count > 0) {
                await MNetStatusMonitoringItem.map(item => lineNumber.push(item.lineNumber))
            }
            const PurchaseOrder = MNetStatusMonitoringItem.length > 0 ? MNetStatusMonitoringItem[0].PurchaseOrder : "";

            // log.cfLoggingMessages('info', 'PO LENGTH -> ' + PurchaseOrder.length);
            if (PurchaseOrder.length != 0) {
                V_Webmethod(req, houseBOLNumber, PurchaseOrder, containerID, iBOLID, ObjectRefNo, lineNumber, count); // Added objectrefno for defect208
            }
            else {
                const existingflag = await tx.run(SELECT.one(GET_PO_MNET_DATA).where({ ObjectRefNo: ObjectRefNo }).columns('PurchaseOrder'));
                if (existingflag != null) {
                    const v_po = existingflag.PurchaseOrder;
                    // log.cfLoggingMessages('info', 'v_po -> ' + v_po);
                    V_Webmethod(req, houseBOLNumber, v_po, containerID, iBOLID, ObjectRefNo, lineNumber, count); // Added objectrefno for defect208
                    // log.cfLoggingMessages('info', 'V_webmethod => ' + lineNumber);
                }
            }
            // log.cfLoggingMessages('info', 'Web_end');
        } catch (error) {
            log.cfLoggingMessages('error', 'Error in ASN' + error);
            req.error({
                code: 'ASN_ERROR',
                message: error.message,
                target: 'ASN',
                status: 500
            });
        }
    });
})
