const cds = require('@sap/cds');
const axios = require("axios");
const validation = require('./util/validation');
const util = require('./util/util');
const log = require('./util/logger');

module.exports = cds.service.impl(async function () {
    const { A_PurchaseOrderItem, A_PurchaseOrder, bolHeader, invoiceLine, ZMNETBUSINESS, POCrossRef, MNetStatusMonitoring, MNetStatusMonitoringItem, MNET_ACTION, MNET_SuplrInvcItemPurOrdRef, PO_Update } = cds.entities('BTP.Panasonic');

    const { GET_MNET_DATA, Environment, GET_MNET_DeliveryDocumentItem } = this.entities;
    //15-04-2024 added sales order entities

    const open_qty_srv = await cds.connect.to('MM_PUR_POITEMS_MONI_SRV');

    // this.after(['CREATE'], 'bolHeader', async function (_, req) {
    //     try {
    //         // const tx = cds.tx(req);
    //         // const houseBOLNumber = req.data.houseBOLNumber;
    //         log.cfLoggingMessages('debug', 'bolHeader Invoice JSON : - ' + JSON.stringify(Invoice_Posting(req)));
    //         log.cfLoggingMessages('debug', 'bolHeader IBD_Posting JSON : - ' + JSON.stringify(IBD_Posting(req)));
    //     }
    //     catch (error) {
    //         log.cfLoggingMessages('error', 'Error in bolHeader' + error)
    //         req.error({
    //             code: '400',
    //             message: error.message,
    //             target: 'bolHeader',
    //             status: 418
    //         })
    //     }
    // })

    const V_UPDATE_MNET_DATA = async (req, BOL, PO, ID) => {
        try {
            log.cfLoggingMessages('debug', 'V_UPDATE_MNET_DATA' + req)
            const result = await SELECT.distinct.from(GET_MNET_DATA).where({ houseBOLNumber: BOL, purchaseOrderNumber: PO, ID: ID }).columns('ID', 'houseBOLNumber', 'invoiceNumber', 'containerID', 'purchaseOrderNumber');
            //let result = await tx.run(query);
            // log.cfLoggingMessages('debug', JSON.stringify(result));
            for (const oudata of result) {
                const v_BOL_ID = oudata.ID;
                const V_BOL = oudata.houseBOLNumber;
                const V_INVID = oudata.invoiceNumber;
                const V_CONID = oudata.containerID;
                const V_PO = oudata.purchaseOrderNumber;

                let dbQuery = "CALL USP_GET_MNET_ACTION(V_BOLID => " + v_BOL_ID + " ,V_BOL => " + "'" + V_BOL + "'" + " ,V_INVID => " + "'" + V_INVID + "'" + " ,V_CONID => " + "'" + V_CONID + "'" + " ,V_PO => " + "'" + V_PO + "'" + ")";
                // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
                const result = await cds.run(dbQuery, {});
                // log.cfLoggingMessages('info', 'USP_GET_MNET_ACTION SP result' + JSON.stringify(result));

            }
            return true;

        }
        catch (e) {
            log.cfLoggingMessages('error', 'Error in V_UPDATE_MNET_DATA' + e)
            req.error({
                code: '400',
                message: e.message,
                target: 'V_UPDATE_MNET_DATA',
                status: 418
            })
        }
    }
    const updateErrorDetails = async (req, ID, data, tx) => {
        await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({
            INVOICENUMBER_HOUSEBOLNUMBER_ID: ID,
            INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: data.houseBOLNumber,
            PURCHASEORDERNUMBER: data.purchaseOrderNumber,
            orderItemNbr: data.PO_ITEMID,
            INVOICENUMBER_INVOICENUMBER: data.invoiceNumber,
            LINENUMBER: data.lineNumber
        }));
        // log.cfLoggingMessages('info', 'updateinvoice' + ":" + oudata.PurchaseOrderItem + ":" + oudata.invoiceNumber + ":" + oudata.lineNumber);
        let dbQuery = "CALL GET_MNETSTATUSMONITORING_ID(NEXT_ID => ?)";
        // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
        const result = await cds.run(dbQuery, {});
        // log.cfLoggingMessages('info', 'SP NEXT ID result' + JSON.stringify(result));
        let ID1 = result.NEXT_ID[0].ID;
        const insertMnetData = {
            ID: ID1,
            BOLID: ID,
            INVOICENUMBER: data.invoiceNumber,
            HOUSEBOLNUMBER: data.houseBOLNumber,
            CONTAINERID: data.containerID,
            Message: `Schedule Line Qty is greater than Open Qty. Invoice can not be posted. Adjust PO qty to post invoice.`,
            ObjectType: 'MNET',
            Status: 'E',
            IMPORTSHIPMENTNUMBER: data.importShipmentNumber
        }

        await tx.run(INSERT.into(MNetStatusMonitoring).entries(insertMnetData));
        const insertMnetItemData = {
            ID_ID: ID1,
            LINEID: 1,
            LINENUMBER: data.lineNumber,
            PURCHASEORDER: data.purchaseOrderNumber,
            PURCHASEORDERITEM: data.PO_ITEMID
        }
        await tx.run(INSERT.into(MNetStatusMonitoringItem).entries(insertMnetItemData));
        // log.cfLoggingMessages('info', "Parts Substitution Item=>" + insertMnetItemData + oudata.lineNumber);

    }
    const V1_Invoice_Posting = async (req, BOL, PO, ID) => {
        try {
            log.cfLoggingMessages('debug', 'V1_Invoice_Posting' + req)
            const db = await cds.connect.to('db');
            const tx = db.tx();

            const date = new Date();
            let day = (date.getDate()).toString(); //Asif changes on 27/11
            let month = (date.getMonth() + 1).toString();
            let year = date.getFullYear();
            let lmonth = month.length;
            let lday = day.length;
            let vmonth = null;
            let vday = null
            // let E_let = 'E';
            if (lmonth != 2) {
                vmonth = '0' + month.toString();
            }
            else {
                vmonth = month.toString();
            }
            if (lday != 2) {
                vday = '0' + day.toString();
            }
            else {
                vday = day.toString();
            }
            let v_date = year + '-' + vmonth + '-' + vday + 'T00:00:00';
            // log.cfLoggingMessages('info', 'INV v_date : -' + v_date);
            let CHINV = 'INV';
            let v_post_flag = 0;

            let result = await SELECT.distinct.from(GET_MNET_DATA).where({ houseBOLNumber: BOL, purchaseOrderNumber: PO, ID: ID, INV_FLAG: CHINV }).columns('houseBOLNumber', 'initialDestinationETA', 'invoiceNumber', 'supplierID', 'invoiceCurrencyCode', 'purchaseOrderNumber', 'supplierPartID', 'quantity', 'extendedCost', 'partUnitOfMeasurement', 'lineNumber', 'containerID', 'PurchaseOrderItem', 'Plant', 'CompanyCode', 'invoicedate', 'INVOICELINESTATUS', 'PurchaseOrderQuantityUnit', 'BTPIBDSTATUS','importShipmentNumber').orderBy('purchaseOrderNumber', 'PurchaseOrderItem');
            log.cfLoggingMessages('info', 'oData -> ' + JSON.stringify(result));
            // let v_flag = 'false';
            // let a_status = 'A';
            // let c_flag = 'true';
            let c_BTPIBDSTATUS;

            for (const oData of result) {
                // log.cfLoggingMessages('info', )
                let openQtyError = false;
                let v_BOL_ID = ID;
                let V_BOL = oData.houseBOLNumber;
                let V_INVID = oData.invoiceNumber;
                let V_CONID = oData.containerID;
                let V_PO = oData.purchaseOrderNumber;
                let V_lineNumber = oData.lineNumber;
                let V_PurchaseOrderItem = oData.PurchaseOrderItem; // defect 208
                let V_ObjType = 'Invoice';
                let V_DocumentDate = oData.invoicedate + 'T12:00:00'; //Asif changes in 27/11
                let v_INVOICELINESTATUS = oData.INVOICELINESTATUS;
                c_BTPIBDSTATUS = oData.BTPIBDSTATUS;
                let v_importShipmentNumber = oData.importShipmentNumber;
                v_post_flag = 0;
                // log.cfLoggingMessages('info', "invoice23:->" + v_BOL_ID + V_BOL + V_INVID + V_CONID + V_PO + V_ObjType + V_PurchaseOrderItem + V_lineNumber + v_INVOICELINESTATUS);
                if (v_INVOICELINESTATUS != 'E') {
                    let NEW_BOLID = "CALL GET_PREV_BOLID_1(V_PO =>" + "'" + V_PO + "'" + " ,V_PURCHASEORDERITEM => " + "'" + V_PurchaseOrderItem + "'" + ",V_BOL =>" + "'" + V_BOL + "'" + ",V_INVOICENUMBER => " + "'" + V_INVID + "'" + ",V_INVOICELINENUMBER =>" + "'" + V_lineNumber + "'" + ", V_BOLID =>" + v_BOL_ID + ",V_OBOLID => ?,O_CONTAINERID=> ?)";
                    // log.cfLoggingMessages('info', 'NEW_BOLID_INV' + NEW_BOLID);
                    const result_bol = await cds.run(NEW_BOLID, {});
                    // log.cfLoggingMessages('info', 'GET_PREV_BOLID_INV' + JSON.stringify(result_bol));

                    let inv_post = {
                        "BOLID": result_bol.V_OBOLID, // Defect 208
                        "importShipmentNumber": v_importShipmentNumber,
                        "houseBOLNumber": oData.houseBOLNumber,
                        "invoiceNumber": oData.ivoiceNumber,
                        "containerID": oData.containerID,
                        "CompanyCode": oData.CompanyCode,
                        "SupplierInvoiceIDByInvcgParty": oData.invoiceNumber,
                        "DocumentDate": V_DocumentDate, //Asif changes in 27/11
                        "PostingDate": v_date,
                        "InvoicingParty": oData.Supplier, // SELLER  of A_PurchaseOrder Table
                        "DocumentCurrency": oData.invoiceCurrencyCode,
                        "InvoiceGrossAmount": oData.extendedCost,
                        "DueCalculationBaseDate": v_date,
                        Action: [],
                        SuplrInvcItemPurOrdRef: [],
                    };


                    log.cfLoggingMessages('info', 'INV JSON 1: - ' + JSON.stringify(inv_post));

                    //MNET_ACTION
                    let action_result = await SELECT.distinct.from(MNET_ACTION).where({ BOLID: v_BOL_ID, BOL: V_BOL, INVID: V_INVID, CONID: V_CONID, PO: V_PO, lineNumber: V_lineNumber, OBJECTTYPE: V_ObjType }).columns('ACTION', 'DOCNUM', 'DATE', 'FISCALYEAR', 'REVERSALREASON', 'OBJECTTYPE', 'RID', 'lineNumber').orderBy('RID');

                    // log.cfLoggingMessages('info', 'action_result -> ' + JSON.stringify(action_result));
                    for (const oData_Action of action_result) {
                        if (c_BTPIBDSTATUS && c_BTPIBDSTATUS != '' && oData_Action.ACTION == 'C') {
                            const scheduleLineOpenQty = await V_GET_OPEN_QTY_V1(req, PO, oData.PurchaseOrderItem)
                            log.cfLoggingMessages('info', 'scheduleLineOpenQty ' + scheduleLineOpenQty);
                            log.cfLoggingMessages('info', 'oData.quantity ' + oData.quantity);
                            if (parseFloat(oData.quantity) > parseFloat(scheduleLineOpenQty)) {
                                // throw error
                                log.cfLoggingMessages('info', 'Quantity is greater than schedule line open qty');
                                openQtyError = true;
                                await updateErrorDetails(req, ID, oData, tx)
                            }
                        }
                        v_post_flag = 1;
                        if (openQtyError == false) {
                            if (oData_Action.ACTION == 'L' || oData_Action.ACTION == 'D' || oData_Action.ACTION == 'U') {
                                inv_post.Action.push({
                                    "BOLID": result_bol.V_OBOLID, // Defect 208
                                    "Action": oData_Action.ACTION,
                                    "DocNum": oData_Action.DOCNUM,
                                    "Date": oData_Action.DATE,
                                    "FiscalYear": oData_Action.FISCALYEAR,
                                    "ReversalReason": oData_Action.REVERSALREASON,
                                    "ObjectType": "Invoice"
                                });
                            }
                            else {
                                inv_post.Action.push({
                                    "BOLID": v_BOL_ID, // Defect 208
                                    "Action": oData_Action.ACTION,
                                    "DocNum": oData_Action.DOCNUM,
                                    "Date": oData_Action.DATE,
                                    "FiscalYear": oData_Action.FISCALYEAR,
                                    "ReversalReason": oData_Action.REVERSALREASON,
                                    "ObjectType": "Invoice"
                                });
                            }
                        }

                    }
                    log.cfLoggingMessages('debug', 'INV JSON 2: - ' + JSON.stringify(inv_post));
                    if (openQtyError == false) {
                        //MNET_SuplrInvcItemPurOrdRef
                        let Item_result = await SELECT.distinct.from(MNET_SuplrInvcItemPurOrdRef).where({ BOLID: v_BOL_ID, BOL: V_BOL, INVID: V_INVID, CONID: V_CONID, PO: V_PO, lineNumber: V_lineNumber }).columns('lineNumber', 'Material', 'PurchaseOrder', 'PurchaseOrderItem', 'SupplierInvoiceItem', 'Plant', 'TaxCode', 'DocumentCurrency', 'SupplierInvoiceItemAmount', 'PurchaseOrderQuantityUnit', 'QuantityInPurchaseOrderUnit', 'SupplierInvoiceItemText');
                        log.cfLoggingMessages('info', 'Item_result -> ' + JSON.stringify(Item_result));
                        for (const oData_Item of Item_result) {
                            log.cfLoggingMessages('info', 'before_qtyperSLS-');
                                let new_qtyPerSLSUnitPricePackType = await SELECT.from(A_PurchaseOrderItem).where({ PurchaseOrder_PurchaseOrder: oData_Item.PurchaseOrder, PurchaseOrderItem: oData_Item.PurchaseOrderItem }).columns('PurchaseOrderQuantityUnit','OrderPriceUnit');
                                log.cfLoggingMessages('info', 'after_qtyperSLS - ' + JSON.stringify(new_qtyPerSLSUnitPricePackType));
                            if (oData.PurchaseOrderQuantityUnit != 0) {
                                inv_post.SuplrInvcItemPurOrdRef.push({
                                    "lineNumber": oData_Item.lineNumber,
                                    "Material": oData_Item.Material,
                                    "PurchaseOrder": oData_Item.PurchaseOrder,
                                    "PurchaseOrderItem": oData_Item.PurchaseOrderItem,
                                    "SupplierInvoiceItem": oData_Item.SupplierInvoiceItem,
                                    "Plant": oData_Item.Plant,
                                    "TaxCode": oData_Item.TaxCode,
                                    "DocumentCurrency": oData_Item.DocumentCurrency,
                                    "SupplierInvoiceItemAmount": oData_Item.SupplierInvoiceItemAmount,
                                    // "PurchaseOrderQuantityUnit": oData_Item.PurchaseOrderQuantityUnit,
                                    // "PurchaseOrderQuantityUnit": oData.partUnitOfMeasurement,
                                    "PurchaseOrderQuantityUnit": new_qtyPerSLSUnitPricePackType[0].OrderPriceUnit, // changed for the Uom error 
                                    "PurchaseOrderPriceUnitSAPCode": oData.partUnitOfMeasurement, //Asif changes on 29/11
                                    "qtyPerSLSUnitPricePackType": oData.PurchaseOrderQuantityUnit,
                                    "QuantityInPurchaseOrderUnit": oData_Item.QuantityInPurchaseOrderUnit,
                                    "SupplierInvoiceItemText": oData_Item.SupplierInvoiceItemText
                                })
                            }
                            else {
                                // log.cfLoggingMessages('info', 'before_qtyperSLS-');
                                // let new_qtyPerSLSUnitPricePackType = await SELECT.from(A_PurchaseOrderItem).where({ PurchaseOrder_PurchaseOrder: oData_Item.PurchaseOrder, PurchaseOrderItem: oData_Item.PurchaseOrderItem }).columns('PurchaseOrderQuantityUnit','OrderPriceUnit');
                                // log.cfLoggingMessages('info', 'after_qtyperSLS - ' + JSON.stringify(new_qtyPerSLSUnitPricePackType));
                                // log.cfLoggingMessages('info', 'after_qtyperSLS - ' + new_qtyPerSLSUnitPricePackType.PurchaseOrderQuantityUnit);
                                inv_post.SuplrInvcItemPurOrdRef.push({
                                    "lineNumber": oData_Item.lineNumber,
                                    "Material": oData_Item.Material,
                                    "PurchaseOrder": oData_Item.PurchaseOrder,
                                    "PurchaseOrderItem": oData_Item.PurchaseOrderItem,
                                    "SupplierInvoiceItem": oData_Item.SupplierInvoiceItem,
                                    "Plant": oData_Item.Plant,
                                    "TaxCode": oData_Item.TaxCode,
                                    "DocumentCurrency": oData_Item.DocumentCurrency,
                                    "SupplierInvoiceItemAmount": oData_Item.SupplierInvoiceItemAmount,
                                    // "PurchaseOrderQuantityUnit": oData_Item.PurchaseOrderQuantityUnit,
                                    "PurchaseOrderQuantityUnit": new_qtyPerSLSUnitPricePackType[0].OrderPriceUnit, // changed for the Uom error 
                                    "PurchaseOrderPriceUnitSAPCode": oData.partUnitOfMeasurement, //Asif changes on 29/11
                                    "qtyPerSLSUnitPricePackType": new_qtyPerSLSUnitPricePackType[0].PurchaseOrderQuantityUnit,
                                    "QuantityInPurchaseOrderUnit": oData_Item.QuantityInPurchaseOrderUnit,
                                    "SupplierInvoiceItemText": oData_Item.SupplierInvoiceItemText
                                })
                            }
                        }
                    }

                    log.cfLoggingMessages('info', 'INV JSON 3: - ' + JSON.stringify(inv_post));
                    // log.cfLoggingMessages('info', 'v_post_flag - ' + v_post_flag);

                    ////// Call CPI API 
                    //Declarations 
                    if (v_post_flag != 0) {
                        try {
                            const CPI_URL_Data = await SELECT.one(Environment).where({ APPID: 'CPI_Invoice' }).columns('URL', 'tokenUrl', 'clientId', 'clientSecret');  //Asif changes on 27/01
                            // log.cfLoggingMessages('info', JSON.stringify(CPI_URL_Data));
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
                            let basicAuth = 'Basic ' + client_credentials;

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
                            const response1 = await axios({
                                method: "POST",
                                url: CPI_url,
                                headers: {
                                    "Authorization": bearerToken,
                                    'accept': "application/json",
                                    'content-type': "application/json",
                                    'x-requested-with': 'XMLHttpRequest',
                                },
                                data: inv_post
                            }).then(response1 => {

                                log.cfLoggingMessages('debug', 'INV response1 -> ' + JSON.stringify(response1.data));

                            }).catch(error => {
                                log.cfLoggingMessages('error', 'INV error -> ' + JSON.stringify(error.response.data));

                            });

                        }
                        catch (error) {
                            log.cfLoggingMessages('error', 'Error in V1_Invoice_Posting' + error.message);
                        }
                    }

                }
            }
            return true;

        }
        catch (e) {
            log.cfLoggingMessages('error', 'Error => V1_Invoice_Posting' + e)
            req.error({
                code: '400',
                message: e.message,
                target: 'V1_Invoice_Posting',
                status: 418
            })
        }
    }



    const V1_IBD_Posting = async (req, BOL, PO, ID) => {
        try {
            log.cfLoggingMessages('debug', 'V1_IBD_POSTING' + req)
            const db = await cds.connect.to('db');
            const tx = db.tx();

            const date = new Date();
            let day = date.getDay();
            let month = date.getMonth() + 1;
            let year = date.getFullYear();
            let lmonth = month.length;
            let vmonth = null;
            if (lmonth != 2) {
                vmonth = '0' + month.toString();
            }
            else {
                vmonth = month.toString();
            }
            // let v_date = year + '-' + vmonth + '-' + day + 'T00:00:00';
            // log.cfLoggingMessages('info', 'v_date : -' + v_date);
            //when v_ibd_flag is false, IBD creation will be executed, it is true creation is suppressed
            let v_ibd_flag = false;           //Defect206part3c.n  
            let v_ibd_GrStatus_Flag = false;  //Defect216.n
            let tmp_invnumber = '';         //Defect206part3c.n     
            let tmp_containerid = '';       //Defect206part3c.n
            let tmp_purchaseorder = '';     //Defect206part3c.n
            let tmp_initialDestinationETA = '';       //Defect206part3c.n
            // let tmp_linenumber = '';     //Defect206part3c.n
            // let tmp_V_PurchaseOrderItem = '';       //Defect206part3c.n
            // let tmp_TRATY = '';     //Defect206part3c.n
            // let tmp_supplierID = '';     //Defect206part3c.n
            // let E_let = 'E';
            let inv_post;

            const result = await SELECT.distinct.from(GET_MNET_DATA).where({ houseBOLNumber: BOL, purchaseOrderNumber: PO, ID: ID }).columns('purchaseOrderNumber', 'containerID', 'initialDestinationETA', 'houseBOLNumber', 'TRATY', 'invoiceNumber', 'supplierID', 'PurchaseOrderItem', 'lineNumber', 'INVOICELINESTATUS', 'PASCOriginalPartsNbr','importShipmentNumber').orderBy('initialDestinationETA', 'invoiceNumber', 'containerID', 'purchaseOrderNumber', 'lineNumber', 'PurchaseOrderItem', 'TRATY', 'supplierID');  //Defect206part3c.n
            log.cfLoggingMessages('debug', 'IBD_=>' + JSON.stringify(result));
            for (const oudata of result) {
                let v_BOL_ID = ID;
                let V_BOL = oudata.houseBOLNumber;
                let V_INVID = oudata.invoiceNumber;
                let V_CONID = oudata.containerID;
                let V_PO = oudata.purchaseOrderNumber;
                let V_ObjType = 'InboundDelivery';
                let V_supplierID = oudata.supplierID;
                let V_PurchaseOrderItem = oudata.PurchaseOrderItem; // defect 208
                let V_lineNumber = oudata.lineNumber; //defect 208
                let initialDestinationETA = oudata.initialDestinationETA;
                let V_TRATY = oudata.TRATY;
                let v_INVOICELINESTATUS = oudata.INVOICELINESTATUS;
                let v_importShipmentNumber = oudata.importShipmentNumber;
                log.cfLoggingMessages('info', "test23:->" + v_BOL_ID + V_BOL + V_INVID + V_CONID + V_PO + V_ObjType + V_supplierID + V_PurchaseOrderItem + V_lineNumber + v_INVOICELINESTATUS);
                if (v_INVOICELINESTATUS != 'E') {
                    if ((tmp_invnumber != V_INVID) || (tmp_containerid != V_CONID) || (tmp_purchaseorder != V_PO))
                    //BB206part3c.n
                    {
                        tmp_initialDestinationETA = initialDestinationETA;
                        tmp_invnumber = V_INVID;
                        tmp_containerid = V_CONID;
                        tmp_purchaseorder = V_PO;
                        tmp_linenumber = V_lineNumber
                        tmp_V_PurchaseOrderItem = V_PurchaseOrderItem;
                        tmp_TRATY = V_TRATY
                        tmp_supplierID = V_supplierID        // Defect 206part3c.n
                        v_ibd_flag = false;              // Defect 206part3c.n

                        //MNET_ACTION

                        let action_result = await SELECT.distinct.from(MNET_ACTION).where({ BOLID: v_BOL_ID, BOL: V_BOL, INVID: V_INVID, CONID: V_CONID, PO: V_PO, OBJECTTYPE: V_ObjType }).columns('ACTION', 'DOCNUM', 'DATE', 'FISCALYEAR', 'REVERSALREASON', 'OBJECTTYPE', 'RID', 'lineNumber').orderBy('RID', 'lineNumber');  // Defect 206part3c.n

                        log.cfLoggingMessages('info', 'action_result -> ' + JSON.stringify(action_result));
                        for (const oData_Action of action_result) {
                            let NEW_BOLID = "CALL GET_PREV_BOLID_1(V_PO =>" + "'" + V_PO + "'" + " ,V_PURCHASEORDERITEM => " + "'" + V_PurchaseOrderItem + "'" + ",V_BOL =>" + "'" + V_BOL + "'" + ",V_INVOICENUMBER => " + "'" + V_INVID + "'" + ",V_INVOICELINENUMBER =>" + "'" + V_lineNumber + "'" + ", V_BOLID =>" + v_BOL_ID + ",V_OBOLID => ?,O_CONTAINERID => ?)";
                            log.cfLoggingMessages('info', 'NEW_BOLID' + NEW_BOLID);
                            const result_bol = await cds.run(NEW_BOLID, {});
                            log.cfLoggingMessages('info', 'GET_PREV_BOLID' + JSON.stringify(result_bol));
                            if (oData_Action.ACTION == 'L' || oData_Action.ACTION == 'D' || oData_Action.ACTION == 'U') {
                                inv_post = {
                                    // "BOLID": result_bol.V_OBOLID, // Defect 208
                                    "BOLID":oData_Action.ACTION == 'U'? v_BOL_ID :result_bol.V_OBOLID,
                                    "importShipmentNumber": v_importShipmentNumber,
                                    "houseBOLNumber": V_BOL,
                                    "invoiceNumber": V_INVID,
                                    "containerID": result_bol.O_CONTAINERID,
                                    "DeliveryDate": initialDestinationETA + 'T12:00:00',
                                    "Supplier": V_supplierID,
                                    "BillOfLading": V_BOL,
                                    "MeansOfTransportType": V_TRATY,
                                    "MeansOfTransport": result_bol.O_CONTAINERID,
                                    Action: [],
                                    A_DeliveryDocumentItem: []
                                };
                            }
                            else {
                                log.cfLoggingMessages('info', 'CheckIBD_GRStatus_MNET==>' + v_BOL_ID + ":" + V_BOL + ":" + V_INVID + ":" + V_lineNumber + ":" + V_PO);
                                // v_ibd_GrStatus_Flag = await validation.CheckIBD_GRStatus(v_BOL_ID, V_BOL, V_INVID, V_lineNumber, V_PO, V_PurchaseOrderItem) //Defect206part3c.n
                                // The GR Number to check for the Prvious BOL ID 
                                v_ibd_GrStatus_Flag = await validation.CheckIBD_GRStatus(result_bol.V_OBOLID, V_BOL, V_INVID, V_lineNumber, V_PO, V_PurchaseOrderItem) 
                                log.cfLoggingMessages('debug', 'v_ibd_GrStatus_Flag=>' + v_ibd_GrStatus_Flag);
                                if (v_ibd_GrStatus_Flag == true) {    // Defect216part3c.n

                                    inv_post = {
                                        // "BOLID": v_BOL_ID, // Defect 208
                                        "BOLID":oData_Action.ACTION == 'R'? result_bol.V_OBOLID: v_BOL_ID,
                                        "importShipmentNumber": v_importShipmentNumber,
                                        "houseBOLNumber": V_BOL,
                                        "invoiceNumber": V_INVID,
                                        "containerID": V_CONID,
                                        "DeliveryDate": initialDestinationETA + 'T12:00:00',
                                        "Supplier": V_supplierID,
                                        "BillOfLading": V_BOL,
                                        "MeansOfTransportType": V_TRATY,
                                        "MeansOfTransport": V_CONID,
                                        Action: [],
                                        A_DeliveryDocumentItem: []
                                    }
                                }
                            }
                            log.cfLoggingMessages('debug', 'IBD JSON 1: - ' + JSON.stringify(inv_post));
                            const V_DocNum = oData_Action.DOCNUM;
                            const V_Action = oData_Action.ACTION;
                            let v_mnet_action_linenum = oData_Action.lineNumber; //defect 206part3a.n
                            // log.cfLoggingMessages('info', 'v_mnet_action_linenum ' + v_mnet_action_linenum + ' V_DocNum ' + V_DocNum + 'V_Action ' + V_Action + 'v_BOL_ID=>' + v_BOL_ID);  //defect206part3a.
                            //defect 216.sn 
                            if (V_Action == 'L') {
                                const V_GRObjType = 'GoodsReceipt';
                                // log.cfLoggingMessages('info', 'v_mnet_action_GR ' + V_BOL + ":" + V_INVID + V_CONID + ":" + V_PO + ":" + V_lineNumber + ":" + V_DocNum);

                                let invoiceline_resultid = "CALL GET_GRNO(V_BOL =>" + "'" + V_BOL + "'" + " ,V_BOLID =>" + "'" + result_bol.V_OBOLID + "'" + " ,V_INVID => " + "'" + V_INVID + "'" + ",V_CONID =>" + "'" + result_bol.O_CONTAINERID + "'" + ",V_PO => " + "'" + V_PO + "'" + ",V_LINENUMBER =>" + "'" + v_mnet_action_linenum + "'" + ", V_IBDNUMBER =>" + "'" + V_DocNum + "'" + ",V_OUTPUT => ?,V_OUTPUT_LINENUMBER => ?)";

                                // log.cfLoggingMessages('info', 'invoiceline_result' + invoiceline_resultid);
                                const invoiceline_result = await cds.run(invoiceline_resultid, {});

                                // log.cfLoggingMessages('info', 'invoiceline_result =>' + JSON.stringify(invoiceline_result));
                                if (invoiceline_result != 'null') {
                                    //    const BTP_GRNumber1 = invoiceline_result.BTP_GRNumber;
                                    let BTP_GRNumber1 = invoiceline_result.V_OUTPUT;
                                    let BTP_GRNumber_line = invoiceline_result.V_OUTPUT_LINENUMBER;
                                    // log.cfLoggingMessages('info', "BTP_GRNumber1 =>" + BTP_GRNumber1);

                                    if (BTP_GRNumber1) {
                                        let gr_action_result = await SELECT.distinct.from(MNET_ACTION).where({ BOLID: v_BOL_ID, BOL: V_BOL, INVID: V_INVID, CONID: V_CONID, PO: V_PO, OBJECTTYPE: V_GRObjType, DOCNUM: BTP_GRNumber1, lineNumber: BTP_GRNumber_line }).columns('ACTION', 'DOCNUM', 'DATE', 'FISCALYEAR', 'REVERSALREASON', 'lineNumber', 'OBJECTTYPE', 'RID').orderBy('RID');
                                        //defect 216.en 

                                        // log.cfLoggingMessages('info', 'gr_action_result -> ' + JSON.stringify(gr_action_result));
                                        for (const oData_Action_gr of gr_action_result) {
                                            // Defect216.n - Added ReverseGRItem
                                            inv_post.Action.push({
                                                "Action": oData_Action_gr.ACTION,
                                                "DocNum": oData_Action_gr.DOCNUM,
                                                "ReverseGRItem": oData_Action_gr.lineNumber,
                                                "Date": oData_Action_gr.DATE,
                                                "FiscalYear": oData_Action_gr.FISCALYEAR,
                                                "ReversalReason": oData_Action_gr.REVERSALREASON,
                                                "ObjectType": "GoodsReceipt"
                                            });
                                        }
                                    }
                                }
                            }
                            if (V_Action == 'C') {
                                // v_ibd_flag is true, if GR reversal fails, Inbound creations should not be processed
                                // v_ibd_flag == true;
                                if (v_ibd_flag == false) {
                                    inv_post.Action.push({
                                        "Action": oData_Action.ACTION,
                                        "DocNum": oData_Action.DOCNUM,
                                        "Date": oData_Action.DATE,
                                        "FiscalYear": oData_Action.FISCALYEAR,
                                        "ReversalReason": oData_Action.REVERSALREASON,
                                        "ObjectType": "InboundDelivery"
                                    });
                                }
                            }
                            else {
                                inv_post.Action.push({
                                    "Action": oData_Action.ACTION,
                                    "DocNum": oData_Action.DOCNUM,
                                    "Date": oData_Action.DATE,
                                    "FiscalYear": oData_Action.FISCALYEAR,
                                    "ReversalReason": oData_Action.REVERSALREASON,
                                    "ObjectType": "InboundDelivery"
                                });
                            }
                            log.cfLoggingMessages('debug', 'IBD JSON 2: - ' + JSON.stringify(inv_post));
                            log.cfLoggingMessages('info', 'GET_MNET_DeliveryDocumentItem v_BOL_ID : ' + v_BOL_ID + ' V_BOL: ' + V_BOL + ' V_INVID: ' + V_INVID + ' V_CONID: ' + V_CONID + ' V_PO: ' + V_PO + ' V_Action: ' + V_Action + ' V_DocNum: ' + V_DocNum);

                            // validate if IBD is false means IBD is ready to create
                            //if(v_ibd_flag == false){
                            //SIT3Optimize Replaced MNET_DeliveryDocumentItem with get.MNET_DeliveryDocumentItem to fix the issue
                            let item_result = await SELECT.distinct.from(GET_MNET_DeliveryDocumentItem).where({ BOLID: v_BOL_ID, BOL: V_BOL, INVID: V_INVID, CONID: V_CONID, PO: V_PO, Action: V_Action, IBD_NO: V_DocNum }).columns('Action', 'IBD_NO', 'IBD_LINE', 'lineNumber', 'Material', 'PurchaseOrder', 'PurchaseOrderItem', 'QuantityInPurchaseOrderUnit', 'ActualDeliveryQuantity', 'Batch', 'Plant', 'ReferenceSDDocument', 'ReferenceSDDocumentItem', 'InventoryValuationType', 'status','BTP_IBDStatus','BTP_IBDAction').orderBy('PurchaseOrderItem');

                            log.cfLoggingMessages('info', 'item_result2 -> ' + JSON.stringify(item_result));

                            if (v_mnet_action_linenum == '0' && V_Action == 'C') {
                                //SIT3 Defect67 Added Filter to Only process Status = 'O'
                                //const filteredArray = item_result.filter(item => item.PurchaseOrderItem != null);
                                const filteredArray = item_result.filter(item => item.PurchaseOrderItem != null && (item.status == 'O' || (item.BTP_IBDStatus == 'S' && item.BTP_IBDAction == 'D')));
                                log.cfLoggingMessages('info', 'if FilteredArray' + filteredArray);
                                for (const oData_item_result of filteredArray) {
                                    inv_post.A_DeliveryDocumentItem.push({
                                        "Action": oData_item_result.Action,
                                        "IBD_NO": oData_item_result.IBD_NO,
                                        "IBD_LINE": oData_item_result.IBD_LINE,
                                        "lineNumber": oData_item_result.lineNumber,
                                        "Material": oData_item_result.Material,
                                        "PurchaseOrder": oData_item_result.PurchaseOrder,
                                        "PurchaseOrderItem": oData_item_result.PurchaseOrderItem,
                                        "QuantityInPurchaseOrderUnit": oData_item_result.QuantityInPurchaseOrderUnit,
                                        "ActualDeliveryQuantity": oData_item_result.ActualDeliveryQuantity,
                                        "Batch": oData_item_result.Batch,
                                        "Plant": oData_item_result.Plant,
                                        "ReferenceSDDocument": oData_item_result.ReferenceSDDocument,
                                        "ReferenceSDDocumentItem": oData_item_result.ReferenceSDDocumentItem,
                                        "InventoryValuationType": oData_item_result.InventoryValuationType
                                    })
                                    // }
                                }
                            } else {
                                //SIT3 Defect67 Added Filter to Only process Status = 'O'
                                //const filteredArray = item_result.filter(item => item.PurchaseOrderItem != null);
                                const filteredArray = item_result.filter(item => item.PurchaseOrderItem != null && (item.status == 'O' || (item.BTP_IBDStatus == 'S' && item.BTP_IBDAction == 'D')));
                                log.cfLoggingMessages('info', 'filteredArray' + filteredArray)
                                for (const oData_item_result of filteredArray) {
                                    if (oData_item_result.lineNumber == v_mnet_action_linenum) {
                                        inv_post.A_DeliveryDocumentItem.push({
                                            "Action": oData_item_result.Action,
                                            "IBD_NO": oData_item_result.IBD_NO,
                                            "IBD_LINE": oData_item_result.IBD_LINE,
                                            "lineNumber": oData_item_result.lineNumber,
                                            "Material": oData_item_result.Material,
                                            "PurchaseOrder": oData_item_result.PurchaseOrder,
                                            "PurchaseOrderItem": oData_item_result.PurchaseOrderItem,
                                            "QuantityInPurchaseOrderUnit": oData_item_result.QuantityInPurchaseOrderUnit,
                                            "ActualDeliveryQuantity": oData_item_result.ActualDeliveryQuantity,
                                            "Batch": oData_item_result.Batch,
                                            "Plant": oData_item_result.Plant,
                                            "ReferenceSDDocument": oData_item_result.ReferenceSDDocument,
                                            "ReferenceSDDocumentItem": oData_item_result.ReferenceSDDocumentItem,
                                            "InventoryValuationType": oData_item_result.InventoryValuationType
                                        })
                                    }
                                }
                            }


                            log.cfLoggingMessages('info', 'IBD JSON 3: - ' + JSON.stringify(inv_post));
                            try {
                                ////// Call CPI API 
                                //Declarations 
                                const CPI_URL_Data = await SELECT.one(Environment).where({ APPID: 'CPI_IBD' }).columns('URL', 'tokenUrl', 'clientId', 'clientSecret');
                                log.cfLoggingMessages('debug', 'CPI_URL_Data' + JSON.stringify(CPI_URL_Data));
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
                                let basicAuth = 'Basic ' + client_credentials;

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
                                const response1 = await axios({
                                    method: "POST",
                                    url: CPI_url,
                                    headers: {
                                        "Authorization": bearerToken,
                                        'accept': "application/json",
                                        'content-type': "application/json",
                                        'x-requested-with': 'XMLHttpRequest',
                                    },
                                    data: inv_post
                                }).then(response1 => {
                                    log.cfLoggingMessages('debug', 'IBD response1_23 -> ' + JSON.stringify(response1.data));
                                }).catch(error => {
                                    log.cfLoggingMessages('error', 'IBD error -> ' + JSON.stringify(error.response.data));
                                });
                            }

                            catch (error) {
                                log.cfLoggingMessages('error', 'Error in V1_IBD_Posting' + error.message);
                            }

                            //} end of validate of IBD
                        } // end of for MNET_Action
                    }


                }//end if
            }

            return true;

        }
        catch (error) {
            log.cfLoggingMessages('error', 'Error => V1_IBD_Posting' + error.message);
        }
    }


    // const V_PO_UPDATE = async (req, BOL, PO, ID) => {
    //     try {
    //         log.cfLoggingMessages('debug', 'V_PO_UPDATE' + req)
    //         const db = await cds.connect.to('db');
    //         const tx = db.tx();

    //         const date = new Date();
    //         let day = date.getDay();
    //         let month = date.getMonth() + 1;
    //         let year = date.getFullYear();
    //         let lmonth = month.length;
    //         let vmonth = null;
    //         let v_status = 0;
    //         if (lmonth != 2) {
    //             vmonth = '0' + month.toString();
    //         }
    //         else {
    //             vmonth = month.toString();
    //         }
    //         let v_date = year + '-' + vmonth + '-' + day + 'T00:00:00';
    //         // log.cfLoggingMessages('info', 'v_date : -' + v_date);

    //         const result = await SELECT.distinct.from(GET_MNET_DATA).where({ houseBOLNumber: BOL, purchaseOrderNumber: PO, ID: ID });
    //         // log.cfLoggingMessages('info', JSON.stringify(result));
    //         const ErrorRec = Object.keys(result).length;

    //         if (ErrorRec > 0) {
    //             let inv_post = {
    //                 "PurchaseOrder": PO,
    //                 PurchaseOrderItem: []
    //             };

    //             for (const oudata of result) {
    //                 const PASCOriginalPartsNbr = oudata.PASCOriginalPartsNbr;
    //                 const supplierPartID = oudata.supplierPartID;
    //                 const unitPrice = oudata.unitPrice;
    //                 const NetPriceAmount = oudata.NetPriceAmount;
    //                 const ScheduleLineOpenQty = oudata.ScheduleLineOpenQty;
    //                 const quantity = oudata.quantity;
    //                 let balqty = Number(ScheduleLineOpenQty) - Number(quantity)


    //                 const v_unitPrice = Number(unitPrice).toFixed(2);
    //                 const v_NetPriceAmount = Number(NetPriceAmount).toFixed(2);

    //                 if (PASCOriginalPartsNbr != null && PASCOriginalPartsNbr != supplierPartID) {
    //                     v_status = v_status + 1;
    //                     //First creation need to be done for PO then Deletion later, only if successful
    //                     inv_post.PurchaseOrderItem.push({
    //                         "Action": "A",
    //                         "PurchaseOrderItem": null,
    //                         "Material": oudata.supplierPartID,
    //                         "Plant": oudata.Plant,
    //                         "StorageLocation": oudata.StorageLocation,
    //                         "MaterialGroup": null,
    //                         "OrderQuantity": oudata.quantity,
    //                         "PurchaseOrderQuantityUnit": oudata.qtyPerSLSUnitPricePackType,  // need to consider qtyPerSLSUnitPricePackType while creating new PO line items 61 defect
    //                         "DocumentCurrency": oudata.invoiceCurrencyCode,
    //                         "NetPriceAmount": oudata.unitPrice,
    //                         "ConditionType": "ZFOB",
    //                         "DeliveryDate": oudata.initialDestinationETA,
    //                         "ConfirmCat": "AB",
    //                         "Reference": oudata.invoiceNumber
    //                     });

    //                     if (balqty = 0) {
    //                         inv_post.PurchaseOrderItem.push({
    //                             "Action": "D",
    //                             "PurchaseOrderItem": oudata.PurchaseOrderItem,
    //                             "Material": null,
    //                             "Plant": null,
    //                             "StorageLocation": null,
    //                             "MaterialGroup": null,
    //                             "OrderQuantity": null,
    //                             "PurchaseOrderQuantityUnit": null,
    //                             "DocumentCurrency": null,
    //                             "NetPriceAmount": null,
    //                             "ConditionType": "ZFOB",
    //                             "DeliveryDate": null,
    //                             "ConfirmCat": null,
    //                             "Reference": null
    //                         });
    //                     }

    //                     if (balqty > 0) {
    //                         inv_post.PurchaseOrderItem.push({
    //                             "Action": "Q",
    //                             "PurchaseOrderItem": oudata.PurchaseOrderItem,
    //                             "Material": null,
    //                             "Plant": null,
    //                             "StorageLocation": null,
    //                             "MaterialGroup": null,
    //                             "OrderQuantity": balqty,
    //                             "PurchaseOrderQuantityUnit": null,
    //                             "DocumentCurrency": null,
    //                             "NetPriceAmount": null,
    //                             "ConditionType": "ZFOB",
    //                             "DeliveryDate": null,
    //                             "ConfirmCat": null,
    //                             "Reference": null
    //                         });
    //                     }


    //                 }
    //                 else {
    //                     if (v_unitPrice != v_NetPriceAmount) {
    //                         v_status = v_status + 1;
    //                         inv_post.PurchaseOrderItem.push({
    //                             "Action": "U",
    //                             "PurchaseOrderItem": oudata.PurchaseOrderItem,
    //                             "Material": null,
    //                             "Plant": null,
    //                             "StorageLocation": null,
    //                             "MaterialGroup": null,
    //                             "OrderQuantity": null,
    //                             "PurchaseOrderQuantityUnit": null,
    //                             "DocumentCurrency": null,
    //                             "NetPriceAmount": v_unitPrice,
    //                             "ConditionType": "ZFOB",
    //                             //"DeliveryDate": oudata.initialDestinationETA,
    //                             "DeliveryDate": null,
    //                             //"ConfirmCat": "AB",
    //                             "ConfirmCat": null,
    //                             //"Reference": oudata.invoiceNumber
    //                             "Reference": null
    //                         });
    //                     }
    //                 }

    //             }
    //             log.cfLoggingMessages('debug', 'PO JSON 3: - ' + JSON.stringify(inv_post));
    //             if (v_status != 0) {
    //                 try {
    //                     ////// Call CPI API 
    //                     //Declarations 
    //                     const CPI_URL_Data = await SELECT.one(Environment).where({ APPID: 'CPI_PO' }).columns('URL', 'tokenUrl', 'clientId', 'clientSecret');
    //                     log.cfLoggingMessages('debug', 'CPI_URL_Data' + JSON.stringify(CPI_URL_Data));
    //                     let CPI_clientId = "";
    //                     let CPI_clientSecret = "";
    //                     let CPI_tokenUrl = "";
    //                     let CPI_url = "";
    //                     if (CPI_URL_Data != null) {
    //                         CPI_clientId = CPI_URL_Data.clientId;
    //                         CPI_clientSecret = CPI_URL_Data.clientSecret;
    //                         CPI_tokenUrl = CPI_URL_Data.tokenUrl;
    //                         CPI_url = CPI_URL_Data.URL;
    //                     }

    //                     let client_credentials = btoa(CPI_clientId + ':' + CPI_clientSecret);
    //                     let basicAuth = 'Basic ' + client_credentials;

    //                     //Generate bearer token
    //                     const resToken = await axios.get(CPI_tokenUrl, {
    //                         headers: {
    //                             "Authorization": basicAuth,
    //                         },
    //                         params: {
    //                             "grant_type": "client_credentials",
    //                         },
    //                     });
    //                     let bearerToken = 'Bearer ' + resToken.data.access_token;
    //                     //log.cfLoggingMessages('info',bearerToken);
    //                     const response1 = await axios({
    //                         method: "POST",
    //                         url: CPI_url,
    //                         headers: {
    //                             "Authorization": bearerToken,
    //                             'accept': "application/json",
    //                             'content-type': "application/json",
    //                             'x-requested-with': 'XMLHttpRequest',
    //                         },
    //                         data: inv_post
    //                     }).then(response1 => {

    //                         log.cfLoggingMessages('debug', 'PO Update response1 -> ' + JSON.stringify(response1.data));

    //                     }).catch(error => {
    //                         log.cfLoggingMessages('error', 'PO Update  error -> ' + JSON.stringify(error.response.data));

    //                     });
    //                     // log.cfLoggingMessages('info', 'PO Update response1 - ' + response1.status);
    //                 }
    //                 catch (e) {
    //                     log.cfLoggingMessages('error', 'PO Update Error - ' + e.message);
    //                     return false;
    //                 }


    //             }


    //         }

    //         return true;

    //     }
    //     catch (e) {
    //         log.cfLoggingMessages('error', 'Error in V_PO_UPDATE' + e)
    //         req.error({
    //             code: '400',
    //             message: e.message,
    //             target: 'PO UPDATE',
    //             status: 418
    //         })
    //         return false;
    //     }
    // }


    const V_PO_UPDATE_V1 = async (req, BOL, PO, ID,importShipmentNumber) => {
        try {
            log.cfLoggingMessages('debug', 'V_PO_UPDATE_V1:ID:'+ID+',' + JSON.stringify(req.data))
            const db = await cds.connect.to('db');
            const tx = db.tx();

            const date = new Date();
            let day = date.getDay();
            let month = date.getMonth() + 1;
            let year = date.getFullYear();
            let lmonth = month.length;
            let vmonth = null;
            let v_status = 0;
            if (lmonth != 2) {
                vmonth = '0' + month.toString();
            }
            else {
                vmonth = month.toString();
            }
            let v_date = year + '-' + vmonth + '-' + day + 'T00:00:00';
            log.cfLoggingMessages('info', 'v_date : -' + v_date);
            // let v_potype = 'S';

            let result = await SELECT.distinct.from(GET_MNET_DATA).where({ houseBOLNumber: BOL, purchaseOrderNumber: PO, ID: ID });  // Asif changes for 196
            log.cfLoggingMessages('info', JSON.stringify(result));
            let ErrorRec = Object.keys(result).length;
            log.cfLoggingMessages('info','ErrorRec:'+ ErrorRec);
            let validatePO = await SELECT.one(A_PurchaseOrder).where({ PurchaseOrder: PO }).columns
            ('PurchaseOrder');

            log.cfLoggingMessages('info','ID:'+ID );
            log.cfLoggingMessages('info','ValidatePO:ID:'+ID + ',' + JSON.stringify(validatePO));
            if (validatePO && validatePO["PurchaseOrder"]) {
                log.cfLoggingMessages('info','if validatePO ID:'+ID );
                if (ErrorRec > 0) {
                    log.cfLoggingMessages('info','if ErrorRec ID:'+ID );                    
                    let inv_post = {
                        "PurchaseOrder": PO,
                        PurchaseOrderItem: []
                    };

                    for (const oudata of result) {
                        ErrorRec
                        const PASCOriginalPartsNbr = oudata.PASCOriginalPartsNbr;
                        const supplierPartID = oudata.supplierPartID;
                        const unitPrice = oudata.unitPrice;
                        const NetPriceAmount = oudata.NetPriceAmount;
                        const PurchaseOrderItem = oudata.PurchaseOrderItem;
                        let lineNumber = oudata.lineNumber;
                        // let PurchaseOrderQuantityUnit = oudata.PurchaseOrderQuantityUnit;
                        log.cfLoggingMessages('info','oudata:'+ JSON.stringify(oudata) );
                        const ScheduleLineOpenQty = await V_GET_OPEN_QTY(req, PO, PurchaseOrderItem)
                        log.cfLoggingMessages('info', 'ScheduleLineOpenQty ' + ScheduleLineOpenQty)
                        const quantity = oudata.quantity;
                        let balqty = Number(ScheduleLineOpenQty) - Number(quantity);
                        log.cfLoggingMessages('info', 'balQty -> ' + balqty);
                        let zero = 0;


                        const v_unitPrice = Number(unitPrice).toFixed(2);
                        const v_NetPriceAmount = Number(NetPriceAmount).toFixed(2);

                        if (PASCOriginalPartsNbr != null && PASCOriginalPartsNbr != supplierPartID) {
                            // check the PO is Drop
                            let dbQuery = "CALL GET_DROPSHIP_STATUS(PO => " + "'" + PO + "'" + ",STATUS => ?)";
                            log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
                            const result = await cds.run(dbQuery, {});
                            log.cfLoggingMessages('info', 'GET_DROPSHIP_STATUS=>' + JSON.stringify(result));
                            if (result.STATUS == 'Drop') {
                                try {
                                    await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({
                                        INVOICENUMBER_HOUSEBOLNUMBER_ID: ID,
                                        INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: BOL,
                                        PURCHASEORDERNUMBER: PO,
                                        orderItemNbr: oudata.PurchaseOrderItem,
                                        INVOICENUMBER_INVOICENUMBER: oudata.invoiceNumber,
                                        LINENUMBER: oudata.lineNumber
                                    }));
                                    log.cfLoggingMessages('info', 'updateinvoice' + ":" + oudata.PurchaseOrderItem + ":" + oudata.invoiceNumber + ":" + oudata.lineNumber);
                                    let dbQuery = "CALL GET_MNETSTATUSMONITORING_ID(NEXT_ID => ?)";
                                    log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
                                    const result = await cds.run(dbQuery, {});
                                    log.cfLoggingMessages('info', 'SP NEXT ID result' + JSON.stringify(result));
                                    let ID1 = result.NEXT_ID[0].ID;
                                    const insertMnetData = {
                                        ID: ID1,
                                        BOLID: ID,
                                        INVOICENUMBER: oudata.invoiceNumber,
                                        HOUSEBOLNUMBER: BOL,
                                        CONTAINERID: oudata.containerID,
                                        Message: `Parts Substitution is not allowed on DROP Ship Order`,
                                        ObjectType: 'MNET',
                                        Status: 'E',
                                    IMPORTSHIPMENTNUMBER: importShipmentNumber
                                    }

                                    await tx.run(INSERT.into(MNetStatusMonitoring).entries(insertMnetData));
                                    log.cfLoggingMessages('info', "Parts Substitution=>" + insertMnetData + oudata.invoiceNumber);
                                    const insertMnetItemData = {
                                        ID_ID: ID1,
                                        LINEID: 1,
                                        LINENUMBER: oudata.lineNumber,
                                        PURCHASEORDER: PO,
                                        PURCHASEORDERITEM: oudata.PurchaseOrderItem
                                    }
                                    await tx.run(INSERT.into(MNetStatusMonitoringItem).entries(insertMnetItemData));
                                    // log.cfLoggingMessages('info', "Parts Substitution Item=>" + insertMnetItemData + oudata.lineNumber);

                                }
                                catch (e) {
                                    log.cfLoggingMessages('error', 'Error in Parts Drop PO' + e)
                                    req.error({
                                        code: '400',
                                        message: e.message,
                                        target: 'Parts Drop PO',
                                        status: 418
                                    })
                                }
                            }
                            else {
                                v_status = v_status + 1;
                                //First creation need to be done for PO then Deletion later, only if successful
                                inv_post.PurchaseOrderItem.push({
                                    "Action": "A",
                                    "PurchaseOrderItem": null,
                                    "Material": oudata.supplierPartID,
                                    "Plant": oudata.Plant,
                                    "StorageLocation": oudata.StorageLocation,
                                    "MaterialGroup": null,
                                    "OrderQuantity": oudata.quantity,
                                    "PurchaseOrderQuantityUnit": oudata.PurchaseOrderQuantityUnit, // need to consider qtyPerSLSUnitPricePackType while creating new PO line items 61 defect
                                    "DocumentCurrency": oudata.invoiceCurrencyCode,
                                    "NetPriceAmount": oudata.unitPrice,
                                    "ConditionType": "ZFOB",
                                    "DeliveryDate": oudata.initialDestinationETA,
                                    "ConfirmCat": "AB",
                                    "Reference": oudata.invoiceNumber,
                                    "invoiceNumber": oudata.invoiceNumber,
                                    "BOLID": ID,
                                    "houseBOLNumber": BOL,
                                    "lineNumber": lineNumber
                                });

                                if (balqty == zero) {
                                    inv_post.PurchaseOrderItem.push({
                                        "Action": "D",
                                        "PurchaseOrderItem": oudata.PurchaseOrderItem,
                                        "Material": null,
                                        "Plant": null,
                                        "StorageLocation": null,
                                        "MaterialGroup": null,
                                        "OrderQuantity": null,
                                        "PurchaseOrderQuantityUnit": null,
                                        "DocumentCurrency": null,
                                        "NetPriceAmount": null,
                                        "ConditionType": "ZFOB",
                                        "DeliveryDate": null,
                                        "ConfirmCat": null,
                                        "Reference": null
                                    });
                                }

                                if (balqty > zero) {
                                    inv_post.PurchaseOrderItem.push({
                                        "Action": "Q",
                                        "PurchaseOrderItem": oudata.PurchaseOrderItem,
                                        "Material": null,
                                        "Plant": null,
                                        "StorageLocation": null,
                                        "MaterialGroup": null,
                                        "OrderQuantity": balqty,
                                        "PurchaseOrderQuantityUnit": null,
                                        "DocumentCurrency": null,
                                        "NetPriceAmount": null,
                                        "ConditionType": "ZFOB",
                                        "DeliveryDate": null,
                                        "ConfirmCat": null,
                                        "Reference": null
                                    });
                                }
                            }
                        }
                        else {
                            if (v_unitPrice != v_NetPriceAmount) {
                                v_status = v_status + 1;
                                inv_post.PurchaseOrderItem.push({
                                    "Action": "U",
                                    "PurchaseOrderItem": oudata.PurchaseOrderItem,
                                    "Material": null,
                                    "Plant": null,
                                    "StorageLocation": null,
                                    "MaterialGroup": null,
                                    "OrderQuantity": null,
                                    "PurchaseOrderQuantityUnit": null,
                                    "DocumentCurrency": null,
                                    "NetPriceAmount": v_unitPrice,
                                    "ConditionType": "ZFOB",
                                    //"DeliveryDate": oudata.initialDestinationETA,
                                    "DeliveryDate": null,
                                    //"ConfirmCat": "AB",
                                    "ConfirmCat": null,
                                    //"Reference": oudata.invoiceNumber
                                    "Reference": null
                                });
                            }
                        }

                    }
                    log.cfLoggingMessages('debug', 'PO JSON 3: - ' + JSON.stringify(inv_post));
                    if (v_status != 0) {
                        try {
                            ////// Call CPI API 
                            //Declarations 
                            const CPI_URL_Data = await SELECT.one(Environment).where({ APPID: 'CPI_PO' }).columns('URL', 'tokenUrl', 'clientId', 'clientSecret');
                            // log.cfLoggingMessages('info', JSON.stringify(CPI_URL_Data));
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
                            let basicAuth = 'Basic ' + client_credentials;

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
                                data: inv_post
                            }).then(response1 => {

                                // log.cfLoggingMessages('info', 'PO Update response1 -> ' + JSON.stringify(response1.data));

                            }).catch(async error => {
                                log.cfLoggingMessages('error', 'PO Update  error -> ' + JSON.stringify(error.response.data));
                                // insert into mnetstatus monitoring
                                const errorDetails = JSON.stringify(error.response.data)
                                log.cfLoggingMessages('error', 'Error Details ' + errorDetails);

                                let dbQuery = "CALL GET_MNETSTATUSMONITORING_ID(NEXT_ID => ?)";
                                // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
                                const result = await cds.run(dbQuery, {});
                                // log.cfLoggingMessages('info', 'SP NEXT ID result' + JSON.stringify(result));
                                let ID1 = result.NEXT_ID[0].ID;
                                const insertErrorData = {
                                    ID: ID1,
                                    BOLID: ID,
                                    INVOICENUMBER: null,
                                    HOUSEBOLNUMBER: BOL,
                                    CONTAINERID: null,
                                    Message: error.response.data.Message,
                                    ObjectType: error.response.data.ObjectType,
                                    Status: error.response.data.Status,
                                IMPORTSHIPMENTNUMBER: importShipmentNumber
                                }
                                // log.cfLoggingMessages('info', 'insertErrorData' + insertErrorData)
                                let inserteddata = await tx.run(INSERT.into(MNetStatusMonitoring).entries(insertErrorData));
                                // log.cfLoggingMessages('info', 'After insertErrorData' + inserteddata);
                                let insertMnetItemData = {
                                    ID_ID: ID1,
                                    LINEID: 1,
                                    LINENUMBER: "",
                                    PURCHASEORDER: error.response.data.PO,
                                    PURCHASEORDERITEM: error.response.data.PurchaseOrderItem
                                }
                                // log.cfLoggingMessages('info', 'After insertErrorItemData' + insertMnetItemData);
                                await tx.run(INSERT.into(MNetStatusMonitoringItem).entries(insertMnetItemData));
                                await tx.commit();
                            });
                        }
                        catch (e) {
                            log.cfLoggingMessages('error', 'PO Update Error - ' + e.message);
                            return false;
                        }


                    }


                }
            }
            return true;

        }
        catch (e) {
            log.cfLoggingMessages('error', 'Error in V_PO_UPDATE_V1' + e)
            req.error({
                code: '400',
                message: e.message,
                target: 'PO UPDATE',
                status: 418
            })
            return false;
        }
    }

    this.on('POST_MNET_V1', async req => {
        try {
            log.cfLoggingMessages('debug', 'POST_MNET_V1.on', req)
            const tx = cds.tx(req);
            let MNETFileDifferent = 1;  // Defect 172
            let INVOICEHEADER_ABSENT = 2; //Defect 172
            let ETA_Different = 3; //Defect 91.n        CheckDuplicateMnetFile will return 3 when ETA on current record/file is different from previous
            let BOL_Different = 4; //Defect 91.n        CheckDuplicateMnetFile will return 4 when BOL on current record/file is different from previous
            // log.cfLoggingMessages('info', 'POST_MNET_V1 =>' + JSON.stringify(req.data));

            //Check Duplicate payload from MNET File Reprocessing -- Start Defect 223_224
            let filebolHeader = req.data.bolHeader[0];
            let importShipmentNumber = req.data.bolHeader[0].importShipmentNumber;
            let HtoOInvLine = [];
            let HtoOStatus = [];
            let CHbrokerCode = [];
            // let changeToPrevStatusLine = [];
            let CurrentInvoiceStatus = [];
            let CurrInvLine = [];
            newMNETChange = await validation.checkDuplicateMNETfile(filebolHeader, HtoOStatus, HtoOInvLine, CHbrokerCode, CurrentInvoiceStatus, CurrInvLine);
            // log.cfLoggingMessages('info', 'newMNETChange **', newMNETChange, MNETFileDifferent, INVOICEHEADER_ABSENT, CurrentInvoiceStatus, CurrInvLine);
            // if ((newMNETChange == MNETFileDifferent) || (newMNETChange == INVOICEHEADER_ABSENT)) {   //Defect 172
            if ((newMNETChange == MNETFileDifferent) || (newMNETChange == INVOICEHEADER_ABSENT) || (newMNETChange == ETA_Different) || (newMNETChange == BOL_Different)) {   //Defect 91
                // log.cfLoggingMessages('info', 'Start MNET delta Process.-', newMNETChange);
                if ((newMNETChange == MNETFileDifferent)) {
                    //Set Item status to 'I' for previous BOLID
                    if (HtoOStatus.length) {
                        // log.cfLoggingMessages('info', 'HTOSTATUS', HtoOStatus, HtoOInvLine)
                        //Only change of status H => O, update the DB
                        for (let l = 0; l < HtoOInvLine.length; l++) {
                            await DELETE(invoiceLine).where({
                                partID: HtoOInvLine[l].partID,
                                lineNumber: HtoOInvLine[l].lineNumber,
                                INVOICENUMBER_HOUSEBOLNUMBER_ID: HtoOInvLine[l].INVOICENUMBER_HOUSEBOLNUMBER_ID,
                                INVOICENUMBER_INVOICENUMBER: HtoOInvLine[l].INVOICENUMBER_INVOICENUMBER,
                                INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: HtoOInvLine[l].INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER
                            });
                            let dbQuery = "CALL GET_MNETSTATUSMONITORING_ID(NEXT_ID => ?)";
                            // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
                            const result = await cds.run(dbQuery, {});
                            // log.cfLoggingMessages('info', 'SP NEXT ID result' + JSON.stringify(result));
                            let ID = result.NEXT_ID[0].ID;
                            const insertHToOMnetData = {
                                ID: ID,
                                BOLID: HtoOInvLine[l].INVOICENUMBER_HOUSEBOLNUMBER_ID,
                                INVOICENUMBER: HtoOInvLine[l].INVOICENUMBER_INVOICENUMBER,
                                HOUSEBOLNUMBER: HtoOInvLine[l].INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER,
                                CONTAINERID: HtoOInvLine[l].CONTAINERID,
                                Message: `Invoice Line with Status H has been processed for Invoice:${HtoOInvLine[l].INVOICENUMBER_INVOICENUMBER}, Invoice Line: ${HtoOInvLine[l].lineNumber}`,
                                ObjectType: 'MNET',
                                Status: 'S',
                                IMPORTSHIPMENTNUMBER: importShipmentNumber
                            }
                            log.cfLoggingMessages('debug', 'insertHToOMnetData' + insertHToOMnetData)
                            await tx.run(INSERT.into(MNetStatusMonitoring).entries(insertHToOMnetData));
                            log.cfLoggingMessages('debug', 'HTOINV LINE' + HtoOInvLine)
                            const insertMnetItemData = {
                                ID_ID: ID,
                                LINEID: l + 1,
                                LINENUMBER: HtoOInvLine[l].lineNumber,
                                PURCHASEORDER: HtoOInvLine[l].purchaseOrderNumber,
                                PURCHASEORDERITEM: HtoOInvLine[l].orderItemNbr
                            }
                            const insertResult = await tx.run(INSERT.into(MNetStatusMonitoringItem).entries(insertMnetItemData));
                            // log.cfLoggingMessages('info', 'INSERT RES', insertResult);

                        }
                        // log.cfLoggingMessages('info', 'HtoOInvLine_upd->', HtoOInvLine)

                    }
                    //Broker code only change check and update it, skip rest process
                    else if (CHbrokerCode.length) {

                        await tx.run(UPDATE(bolHeader).set({ brokerCode: CHbrokerCode[0].brokerCode }).where({
                            houseBOLNumber: CHbrokerCode[0].houseBOLNumber,
                            ID: CHbrokerCode[0].ID
                        }));
                        log.cfLoggingMessages('debug', 'CHbrokerCode->' + CHbrokerCode[0].brokerCode);
                        return;


                    }
                }
            }
            else {
                throw new Error('Duplicate MNET file received.');
            };
            // End Defect 223_224

            let houseBOLNumber = null;
            let ID = 0;
            for (let i = 0; i < Object.keys(req.data["bolHeader"]).length; i++) {
                ID = await util.autoID('bolHeader', 'ID', tx);
                req.data["bolHeader"][i].ID = ID;
                houseBOLNumber = req.data["bolHeader"][i].houseBOLNumber
                // log.cfLoggingMessages('info', 'houseBOLNumber - ' + houseBOLNumber);
                const dataUpd = removeEmptyOrNull(req.data["bolHeader"][i]);
                // log.cfLoggingMessages('info', 'dataUpd - ' + JSON.stringify(dataUpd));
                //tx.begin()
                await tx.run(INSERT.into(bolHeader).entries(dataUpd));
                // tx.commit();
                // //Asif changes 10-02 on 206 starts
                importShipmentNumber = req.data["bolHeader"][i].importShipmentNumber;
                importerOfRecord = req.data["bolHeader"][i].importerOfRecord;
                // log.cfLoggingMessages('info', 'importShipmentNumber =>' + importShipmentNumber + 'importerOfRecord => ' + importerOfRecord);
                //Defect224.sn
                log.cfLoggingMessages('info', 'CurrentInvoiceLine.length => ', CurrInvLine.length + ',CurrentInvoiceStatus.length => ' + CurrentInvoiceStatus.length + ',CurrentInvoiceStatus ' + CurrentInvoiceStatus);
                //if ((newMNETChange != INVOICEHEADER_ABSENT) && (CurrentInvoiceStatus.length)) {
                //Defect 91 - Check additionally for BOL_Different and ETA_Different    
                if ((newMNETChange != INVOICEHEADER_ABSENT) && (newMNETChange != ETA_Different) && (newMNETChange != BOL_Different) && (CurrentInvoiceStatus.length)) {
                    for (let l = 0; l < CurrentInvoiceStatus.length && l < CurrInvLine.length; l++) {
                        // for (let l = 0; l < CurrInvLine.length; l++) {
                        // log.cfLoggingMessages('info', 'Current INV LINE', CurrInvLine[l]);
                        await tx.run(UPDATE(invoiceLine).set({ Status: CurrentInvoiceStatus[l] }).where({
                            partID: CurrInvLine[l].partID,
                            lineNumber: CurrInvLine[l].lineNumber,
                            INVOICENUMBER_HOUSEBOLNUMBER_ID: ID,
                            INVOICENUMBER_INVOICENUMBER: CurrInvLine[l].INVOICENUMBER_INVOICENUMBER,
                            INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: CurrInvLine[l].INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER
                        }));
                        if (CurrentInvoiceStatus[l] == 'E') {
                            // const newID = await util.autoID('MNetStatusMonitoring', 'ID', tx);
                            let dbQuery = "CALL GET_MNETSTATUSMONITORING_ID(NEXT_ID => ?)";
                            // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
                            const result = await cds.run(dbQuery, {});
                            // log.cfLoggingMessages('info', 'SP NEXT ID result' + JSON.stringify(result));
                            let newID = result.NEXT_ID[0].ID;
                            let insertMnetData = {
                                ID: newID,
                                BOLID: ID,
                                INVOICENUMBER: CurrInvLine[l].INVOICENUMBER_INVOICENUMBER,
                                HOUSEBOLNUMBER: CurrInvLine[l].INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER,
                                CONTAINERID: CurrInvLine[l].CONTAINERID,
                                Message: `Part Substitution for this Invoice Line has already been processed for Invoice:${CurrInvLine[l].INVOICENUMBER_INVOICENUMBER}, Invoice Line: ${CurrInvLine[l].lineNumber}`,
                                ObjectType: 'MNET',
                                Status: 'E',
                                IMPORTSHIPMENTNUMBER: importShipmentNumber
                            }
                            log.cfLoggingMessages('debug', 'insertMnetData' + insertMnetData)
                            await tx.run(INSERT.into(MNetStatusMonitoring).entries(insertMnetData));
                            const insertMnetItemDataInPartSubstitution = {
                                ID_ID: newID,
                                LINEID: l + 1,
                                LINENUMBER: CurrInvLine[l].lineNumber,
                                PURCHASEORDER: CurrInvLine[l].purchaseOrderNumber,
                                PURCHASEORDERITEM: CurrInvLine[l].orderItemNbr
                            }
                            await tx.run(INSERT.into(MNetStatusMonitoringItem).entries(insertMnetItemDataInPartSubstitution));
                        }
                        else {

                            let dbQuery = "CALL GET_MNETSTATUSMONITORING_ID(NEXT_ID => ?)";
                            // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
                            const result = await cds.run(dbQuery, {});
                            // log.cfLoggingMessages('info', 'SP NEXT ID result' + JSON.stringify(result));
                            let MnetStatusMonitoringID = result.NEXT_ID[0].ID;
                            let insertData = {
                                ID: MnetStatusMonitoringID,
                                BOLID: ID,
                                INVOICENUMBER: CurrInvLine[l].INVOICENUMBER_INVOICENUMBER,
                                HOUSEBOLNUMBER: CurrInvLine[l].INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER,
                                CONTAINERID: CurrInvLine[l].CONTAINERID,
                                Message: `Received Line is duplicate,Invoice:${CurrInvLine[l].INVOICENUMBER_INVOICENUMBER}, Invoice Line: ${CurrInvLine[l].lineNumber}`,
                                ObjectType: 'MNET',
                                Status: 'S',
                                IMPORTSHIPMENTNUMBER: importShipmentNumber
                            }
                            // log.cfLoggingMessages('info', 'insertData', insertData)
                            await tx.run(INSERT.into(MNetStatusMonitoring).entries(insertData));
                            const insertMnetItem = {
                                ID_ID: MnetStatusMonitoringID,
                                LINEID: l + 1,
                                LINENUMBER: CurrInvLine[l].lineNumber,
                                PURCHASEORDER: CurrInvLine[l].purchaseOrderNumber,
                                PURCHASEORDERITEM: CurrInvLine[l].orderItemNbr
                            }
                            await tx.run(INSERT.into(MNetStatusMonitoringItem).entries(insertMnetItem));
                            // Deleting all rows which have temporaliy updated with status ='I' with current BOL. Current BOL will have multiple invoice numbers
                            await DELETE(invoiceLine).where({
                                Status: 'I',
                                INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: CurrInvLine[l].INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER
                            });
                        }

                        // }
                    }

                }
                // BOL check 
                let dbQuery = "CALL VALIDATE_AND_REPLICATE_FACTORYINVOICE(V_IMPORTSHIPMENTNUMBER => " + "'" + importShipmentNumber + "'" + " ,V_IMPORTEROFRECORD => " + "'" + importerOfRecord + "'" + " ,V_BOL => " + "'" + houseBOLNumber + "'" + " ,V_BOLID => " + ID + " ,V_STATUS => ?)";
                // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
                const sp_result = await cds.run(dbQuery, {});
                log.cfLoggingMessages('debug', 'Factory Invoice =>' + JSON.stringify(sp_result));
                let a_status = sp_result.V_STATUS;
                if (a_status == 'ERROR') {
                    let updateData = await UPDATE`BTP_PANASONIC_MNETSTATUSMONITORING`
                        .set`Status='ERROR'`
                        .where`ID = ${ID} and HOUSEBOLNUMBER = ${houseBOLNumber}`;
                    // log.cfLoggingMessages('info', "updateData==>", updateData);
                }
                //Asif changes 10-02 on 206 ends
                //start kanchan defect 204 seconpoint
                let INVLine = await SELECT.from`MNET_WORKFLOW.additionalInvoiceLine`.where`PARTID_INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER = ${houseBOLNumber} and PARTID_INVOICENUMBER_HOUSEBOLNUMBER_ID=${ID}`.orderBy`mecaOrderNbr`;
                for (let j = 0; j < INVLine.length; j++) {
                    if (INVLine[j].qtyPerSLSUnitPricePackType === '' || INVLine[j].qtyPerSLSUnitPricePackType === null) {
                        let resultsPOrderPriceUnit = await SELECT.from`MNET_WORKFLOW_A_PURCHASEORDERITEM`.where`PURCHASEORDER_PURCHASEORDER = ${INVLine[j].mecaOrderNbr} and PURCHASEORDERITEM=${INVLine[j].orderItemNbr}`;
                        //if Order Price Unit not inital, update Invoice line
                        if (resultsPOrderPriceUnit.length) {
                            let updateData = await UPDATE` BTP_PANASONIC_ADDITIONALINVOICELINE`
                                .set`qtyPerSLSUnitPricePackType=${resultsPOrderPriceUnit[0].ORDERPRICEUNIT}`
                                .where`PARTID_INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER = ${houseBOLNumber} and PARTID_INVOICENUMBER_HOUSEBOLNUMBER_ID =${ID} and MECAORDERNBR = ${resultsPOrderPriceUnit[0].PURCHASEORDER_PURCHASEORDER} and ORDERITEMNBR=${resultsPOrderPriceUnit[0].PURCHASEORDERITEM}`;
                            // log.cfLoggingMessages('info', "updateData==>", updateData)
                            //}
                        }
                    }
                }
                //end kanchan defect 204 seconpoint
            }
            //CS Def 62
            //insert Hold lines 
            try {
                checkHoldLines(req);
            } catch (Error) {
                log.cfLoggingMessages('error', 'Error in POST_MNET_V1[Hold Lines Post]' + error.message);
            }
            //CE

            let SelectQuery = "SELECT Distinct purchaseOrderNumber,INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER as houseBOLNumber,INVOICENUMBER_HOUSEBOLNUMBER_ID as BOLID  From MNET_WORKFLOW.invoiceLine Where INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER = " + "'" + [houseBOLNumber] + "' and INVOICENUMBER_HOUSEBOLNUMBER_ID =" + ID;
            let query = cds.parse.cql(SelectQuery);
            log.cfLoggingMessages('debug', 'V_UPDATE_OPEN_QTY_BEFORE -> query _ ' + JSON.stringify(query));
            let result = await tx.run(query);
            log.cfLoggingMessages('debug', 'V_UPDATE_OPEN_QTY_BEFORE -> ', JSON.stringify(result));
            // if (newMNETChange != INVOICEHEADER_ABSENT)    //Defect 172.n
            //Defect 91 - Check additionally for BOL_Different and ETA_Different  
            if ((newMNETChange != INVOICEHEADER_ABSENT) && (newMNETChange != ETA_Different) && (newMNETChange != BOL_Different)) {
                for (const oData of result) {
                    let V_BOL = oData.houseBOLNumber;
                    let V_PO = oData.purchaseOrderNumber;
                    let V_ID = oData.BOLID;
                    let po_update = await V_PO_UPDATE_V1(req, V_BOL, V_PO, V_ID,importShipmentNumber);
                    log.cfLoggingMessages('debug', 'po_update ->' + po_update);
                    await V_UPDATE_OPEN_QTY(req, V_PO, V_BOL, V_ID,importShipmentNumber);
                    log.cfLoggingMessages('debug', 'open_update ->');
                }
            }
                //call stored procedure
                let dbQuery_SP = "CALL GENERATE_MNET_ACTION (I_BOLID => " + "'" + ID + "'" + " ,I_BOL => " + "'" + houseBOLNumber + "'" + " ,I_IMPORTSHIPMENTNUMBER => " + "'" + importShipmentNumber + "')";
                // log.cfLoggingMessages('info', 'dbQuery_SP -> ' + dbQuery);
                const sp_result_SP = await cds.run(dbQuery_SP, {});
                log.cfLoggingMessages('debug', 'GENERATE_MNET_ACTION =>' + JSON.stringify(sp_result_SP));
            return result;
        }
        catch (error) {
            log.cfLoggingMessages('error', 'Error in POST_MNET_V1' + error)
            req.error({
                code: '400',
                message: error.message,
                target: 'some_field',
                status: 418
            })
        }

    })

    this.on('UPDATE_A_PurchaseOrder_V1', async req => {
        try {
            log.cfLoggingMessages('debug', 'UPDATE_A_PurchaseOrder_V1:' + JSON.stringify(req.data));
            const db = await cds.connect.to('db');
            const tx = db.tx();
            // log.cfLoggingMessages('info', JSON.stringify(req.data));
            const houseBOLNumber = req.data.houseBOLNumber;
            const BOLID = req.data.BOLID;
            const PO = req.data.PurchaseOrder;
            /**
            * Calling Procedure for Updating Invoice Line 
            */

            let dbQueryUpdateInvoiceLine = "CALL USP_UPDATE_PART_SUBSITUTION_PO_ITEM(V_PO => '" + PO + "', IS_UPDATES => ?)";
            // log.cfLoggingMessages('debug', 'dbQuery USP_UPDATE_INVOICELINE-> ' + JSON.stringify(dbQueryUpdateInvoiceLine));
            const sp_result = await cds.run(dbQueryUpdateInvoiceLine, {});
            log.cfLoggingMessages('debug', 'sp_result =>' + JSON.stringify(sp_result));
            // => 21/01 code changes of 190 defect
            // log.cfLoggingMessages('info', 'Result_21_01' + PO + BOLID + houseBOLNumber);
            const result1 = await SELECT.from(bolHeader).where({ houseBOLNumber: houseBOLNumber, ID: BOLID }).columns('recordType', 'modeOfTransport', 'action', 'status', 'importShipmentNumber', 'shipMethod');

            log.cfLoggingMessages('info', 'A_Purchase' + JSON.stringify(result1));
            let V_RECORDTYPE = result1[0].recordType;
            let V_MODEOFTRANSPORT = result1[0].modeOfTransport;
            // let V_BOLaction = result1[0].action;
            // let V_BOLstatus = result1[0].status;
            // let V_importShipmentNumber = result1[0].importShipmentNumber;
            let shipMethod = result1[0].shipMethod;
            if(PO){
            // log.cfLoggingMessages('info', 'Record_type_21' + V_RECORDTYPE + V_MODEOFTRANSPORT);
            const result2 = await SELECT.distinct.from(A_PurchaseOrderItem).where({ PurchaseOrder_PurchaseOrder: PO }).columns('Plant', 'PurchaseOrderItem').orderBy('PurchaseOrderItem');
            log.cfLoggingMessages('info', 'blue_23' + JSON.stringify(result2));

            if (result2.length) {

                let v_plant = result2[0].Plant;
                // log.cfLoggingMessages('info', 'Plant_21:' + v_plant);

                // log.cfLoggingMessages('info', 'before dbQuery_1 ->');
                // log.cfLoggingMessages('info', 'Record_type_22' + V_RECORDTYPE);
                let dbQuery_1 = "CALL UPD_INVOICELINE_ZBUS_INDC(V_RECORDTYPE => '" + V_RECORDTYPE + "' ,V_MODEOFTRANSPORT => " + "'" + V_MODEOFTRANSPORT + "'" + " ,v_plant => " + "'" + v_plant + "'" + " ,V_BOL => " + "'" + houseBOLNumber + "'" + ",V_ID =>   " + BOLID + " ,V_PO => " + "'" + PO + "'" + ")";
                // log.cfLoggingMessages('info', 'dbQuery_1 -> ' + dbQuery_1);
                const result_1 = await cds.run(dbQuery_1);
                // log.cfLoggingMessages('info', 'UPD_INVOICELINE_ZBUS_INDC result' + JSON.stringify(result_1));

                // => 21/01 code changes 190 defect end

                // let ZPAYCONCODE = null;
                let ZINBD_DLVY = null;
                let ZINVICE = null;
                // let ZGOODS_RECEIPT = null;
                // let ZDLVY_INSTR = null;
                // let ZANCITIPATED_REC = null;
                // let ZASN = null;

                const result = await SELECT.distinct.from(GET_MNET_DATA).where({ houseBOLNumber: houseBOLNumber, purchaseOrderNumber: PO, ID: BOLID }).columns('houseBOLNumber', 'purchaseOrderNumber', 'recordType', 'shipMethod', 'paymentConditionCode', 'POType', 'ID');
                for (const oudata of result) {
                    const recordType = oudata.recordType;
                    shipMethod = oudata.shipMethod;
                    const paymentConditionCode = oudata.paymentConditionCode;
                    const POType = oudata.POType;
                    const id = oudata.ID;
                    // log.cfLoggingMessages('info', 'id_result -> ' + id);
                    // log.cfLoggingMessages('info', 'recordType -> ' + recordType);
                    // log.cfLoggingMessages('info', 'shipMethod -> ' + shipMethod);
                    // log.cfLoggingMessages('info', 'paymentConditionCode -> ' + paymentConditionCode);
                    // log.cfLoggingMessages('info', 'POType -> ' + POType);
                    //defect 204 first point 7/2/2023ZMNETMODE 
                    if (shipMethod === null || shipMethod === '') {
                        const resultBolHeader = await SELECT.from(bolHeader).where({ houseBOLNumber: houseBOLNumber, ID: id }).columns('modeOfTransport');
                        // log.cfLoggingMessages('info', 'resultBolHeader -> ' + resultBolHeader);
                        const modeoftransport = resultBolHeader[0].modeOfTransport;
                        // log.cfLoggingMessages('info', 'modeoftransport -> ' + modeoftransport);
                        const resultzmnetmode = await SELECT.from`BTP_PANASONIC.ZMNETMODE`.columns`ZSHIPMETHOD`.where`TMODE =${modeoftransport}`;
                        // log.cfLoggingMessages('info', 'resultzmnetmode -> ' + resultzmnetmode);
                        shipMethod = resultzmnetmode[0].ZSHIPMETHOD;
                        // log.cfLoggingMessages('info', 'shipMethodnullvalue -> ' + shipMethod);
                    }
                    // Adjusted the code based on ZMNET_BUSINESS table to consider blank as CM
                    let tmp_zpayconcode = '';
                    if (paymentConditionCode === 'FR') {
                        tmp_zpayconcode = 'FR';
                    }

                    const result = await SELECT.distinct.from(ZMNETBUSINESS).where({ ZRECTYPE: recordType, ZSHIPMETHOD: shipMethod, ZPOIND: POType, ZPAYCONCODE: tmp_zpayconcode });
                    log.cfLoggingMessages('info', "ZMNET_Bresult" + JSON.stringify(result));

                    ZPAYCONCODE = result[0].ZPAYCONCODE;
                    ZINBD_DLVY = result[0].ZINBD_DLVY;
                    ZINVICE = result[0].ZINVICE;
                    ZGOODS_RECEIPT = result[0].ZGOODS_RECEIPT;
                    ZDLVY_INSTR = result[0].ZDLVY_INSTR;
                    ZANCITIPATED_REC = result[0].ZANCITIPATED_REC;
                    ZASN = result[0].ZASN;
                    // log.cfLoggingMessages('info', "Business ", ZPAYCONCODE, ZINBD_DLVY, ZINVICE, ZGOODS_RECEIPT, ZDLVY_INSTR, ZANCITIPATED_REC, ZASN);
                }

                let dbQuery;
                let sp_result = null;
                try{
                dbQuery = "CALL USP_UPDATE_MNET_STATUS(" + BOLID + "," + "'" + houseBOLNumber + "'" + " ," + "'" + PO.toString() + "'" + ", O_STATUS => ?)";
                log.cfLoggingMessages('debug', 'dbQuery -> ' + dbQuery);
                sp_result = await cds.run(dbQuery, {});
                log.cfLoggingMessages('info', 'SP result' + JSON.stringify(sp_result));
                }catch(error){
                    log.cfLoggingMessages('error', 'USP_UPDATE_MNET_STATUS' + JSON.stringify(error.message));
                }
                if (sp_result && sp_result.O_STATUS.length > 0) {
                    const a_status = sp_result.O_STATUS;
                    log.cfLoggingMessages('info', 'USP_UPDATE_MNET_STATUS' + a_status);
                    if (a_status === 'S') {
                        //  For incident no : INC0219526
                        // const v_mnet = await V_UPDATE_MNET_DATA(req, houseBOLNumber, PO, BOLID);
                        // log.cfLoggingMessages('info', 'V_UPDATE_MNET_DATA -> ' + v_mnet);
                        //Defect 216.n Re-adjusted order of calling Posting. Now Function/Method for Processing Inboun Delivery will process GR reversal followed by InboundDelivery. A check is put in place to ensure further processing is not done.
                        log.cfLoggingMessages('info', 'ZINBD_DLVY -> ' + ZINBD_DLVY)
                        if (ZINBD_DLVY === 'Y') {
                            const v_INV = await V1_IBD_Posting(req, houseBOLNumber, PO, BOLID);
                            log.cfLoggingMessages('info', 'V1_IBD_Posting -> ' + v_INV);
                        }
                        log.cfLoggingMessages('info', 'ZINVICE -> ' + ZINVICE)
                        if (ZINVICE === 'Y') {
                            const v_INV = await V1_Invoice_Posting(req, houseBOLNumber, PO, BOLID);
                            log.cfLoggingMessages('info', 'V1_Invoice_Posting -> ' + v_INV);
                        }

                    }
                } else {
                    log.cfLoggingMessages('info', ' no data for USP_UPDATE_MNET_STATUS (V1_UPDATE_A_PurchaseOrder_V1)');
                }
            }
            else {

                //Invalid PO exception Handling                
                //"Update Inv line item with Status E"
                await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ purchaseOrderNumber: PO, invoiceNumber_houseBOLNumber_ID: BOLID, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
                await tx.commit();
                //Raise Error
                const v_message = 'PO' + ' ' + PO + ' ' + 'is invalid';
                throw new Error(v_message);
                //Check for implementig Execution log"

            };
    }else{
        await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ invoiceNumber_houseBOLNumber_ID: BOLID, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: houseBOLNumber }));
        await tx.commit();
        const v_message = 'PO' + ' ' + PO + ' ' + 'is invalid';
        throw new Error(v_message);
    }
            return true;
        }
        catch (error) {
            log.cfLoggingMessages('error', 'Error in UPDATE_A_PurchaseOrder_V1' + error);
            req.error({
                code: '400',
                message: error.message,
                target: 'UPDATE_A_PurchaseOrder',
                status: 418
            })
        }

    })


    this.on('UPDATE_PO_DATA', async req => {
        try {

            const tx = cds.tx(req);
            // log.cfLoggingMessages('info', JSON.stringify(req.data));
            for (let i = 0; i < Object.keys(req.data["A_PurchaseOrder"]).length; i++) {
                const PO = req.data["A_PurchaseOrder"][i].PurchaseOrder;
                // log.cfLoggingMessages('info', 'PO-> ' + PO);
                const checkPO = await tx.run(SELECT.one(A_PurchaseOrder).where({ PurchaseOrder: PO }).columns('PurchaseOrder'));
                if (checkPO != null) {
                    const dataUpd = removeEmptyOrNull(req.data["A_PurchaseOrder"][i]);
                    await tx.run(UPDATE(A_PurchaseOrder).set(dataUpd).where({ PurchaseOrder: PO }));
                    // log.cfLoggingMessages('info', 'PO Updated ->' + PO);
                }

            }
            return true;
        }
        catch (e) {
            log.cfLoggingMessages('error', 'UPDATE_PO_DATA Error-> ' + e.message);
            return false;
        }
    })

    const removeEmptyOrNull = (obj) => {

        Object.keys(obj).forEach(k =>

            (obj[k] && typeof obj[k] === 'object') && removeEmptyOrNull(obj[k]) ||

            (!obj[k] && obj[k] !== undefined) && delete obj[k]

        );

        return obj;

    };

    const V_GET_OPEN_QTY = async (req, PO, ITEM) => {
        try {
            log.cfLoggingMessages('debug', 'V_GET_OPEN_QTY' + req)
            log.cfLoggingMessages('debug', 'PO ' + PO);
            log.cfLoggingMessages('debug', 'ITEM ' + ITEM);

            const Read_API = await open_qty_srv.tx(req).run({
                "SELECT": {
                    "from": {
                        "ref": [{
                            "id": "S4HanaService.C_PurchaseOrderItemMoni",
                            "where": [
                                { "ref": ["P_DisplayCurrency"] },
                                "=",
                                { "val": 'US' }
                            ]
                        },
                            "Results"
                        ]
                    },
                    "columns": [
                        { "ref": ["ID"] },
                        { "ref": ["ScheduleLineOpenQty"] }
                    ],
                    "where": [
                        { "ref": ["PurchaseOrder"] },
                        "=",
                        { "val": PO }
                        , 'and',
                        { ref: ['PurchaseOrderItem'] },
                        '=',
                        { val: ITEM }
                    ]
                }
            });


            log.cfLoggingMessages('info', 'Read_API - > ' + JSON.stringify(Read_API));
            for (const Read_API_RS of Read_API) {
                const schqty = Read_API_RS.ScheduleLineOpenQty;
                return schqty;
            }
            const schqty = 0;
            return schqty;

        }
        catch (error) {
            const schqty = 0;
            log.cfLoggingMessages('error', 'Error in V_GET_OPEN_QTY' + error.message);
            return schqty;
        }
    }
    const V_GET_OPEN_QTY_V1 = async (req, PO, ITEM) => {
        try {
            log.cfLoggingMessages('debug', 'V_GET_OPEN_QTY' + req)
            log.cfLoggingMessages('debug', 'PO ' + PO);
            log.cfLoggingMessages('debug', 'ITEM ' + ITEM);

            const Read_API = await open_qty_srv.tx(req).run({
                "SELECT": {
                    "from": {
                        "ref": [{
                            "id": "S4HanaService.C_PurchaseOrderItemMoni",
                            "where": [
                                { "ref": ["P_DisplayCurrency"] },
                                "=",
                                { "val": 'US' }
                            ]
                        },
                            "Results"
                        ]
                    },
                    "columns": [
                        { "ref": ["ID"] },
                        { "ref": ["InvoiceReceiptQty"] },
                        { "ref": ["GoodsReceiptQty"] },
                        { "ref": ["StillToBeDeliveredQuantity"] },
                        { "ref": ["StillToInvoiceQuantity"] },
                        { "ref": ["ScheduleLineOpenQty"] }
                    ],
                    "where": [
                        { "ref": ["PurchaseOrder"] },
                        "=",
                        { "val": PO }
                        , 'and',
                        { ref: ['PurchaseOrderItem'] },
                        '=',
                        { val: ITEM }
                    ]
                }
            });


            log.cfLoggingMessages('info', 'Read_API - > ' + JSON.stringify(Read_API));
            for (const Read_API_RS of Read_API) {
                const schqty = Read_API_RS.StillToInvoiceQuantity;
                log.cfLoggingMessages('info', 'QTY VALUES' + schqty)
                return schqty;
            }

        }
        catch (error) {
            const schqty = 0;
            log.cfLoggingMessages('error', 'Error in V_GET_OPEN_QTY' + error.message);
            return schqty;
        }
    }
    const V_UPDATE_OPEN_QTY = async (req, V_PO, V_BOL, V_ID,importShipmentNumber) => {
        try {
            log.cfLoggingMessages('debug', 'V_UPDATE_OPEN_QTY' + req)
            const db = await cds.connect.to('db');
            /* Implementation : Taking PO, BOL, ID from arguments and assigning to below letiables 
            and added data1 === null in if condition check to insert the data1 to PO_Update table.
            Change on : 10-05-2024
            Author: Kanchan & Nithyashree */

            let PO = V_PO;
            let BOL = V_BOL;
            let BOLID = V_ID;
            const tx = db.tx(req);
            let data1 = null;
            let schqty = 0;
            let invoiceqty = 0;
            // let schqty1 = 0;
            let grqty = 0;

            const result = await SELECT.distinct.from(A_PurchaseOrderItem).where({ PurchaseOrder_PurchaseOrder: PO }).columns('PurchaseOrderItem').groupBy('PurchaseOrderItem');
            log.cfLoggingMessages('info', 'result of PO -> ' + JSON.stringify(result));
            for (const oudata1 of result) {
                log.cfLoggingMessages('info', 'po -> ' + PO);
                log.cfLoggingMessages('info', 'PurchaseOrderItem -> ' + oudata1.PurchaseOrderItem);
                const POItem = oudata1.PurchaseOrderItem;
                // let quote_str = "'" + PO + "'";
                //  log.cfLoggingMessages('info', 'quote_str -> ' + quote_str);
                //Asif changes to 20/12
                const POCross_Result = await SELECT.one(POCrossRef).where({ Po_Old: PO, PoItem_Old: POItem, IsDelete: 'N' }).columns('Po_New', 'PoItem_New');
                //  log.cfLoggingMessages('info', "POCross_Result" + POCross_Result);
                let POCross_PO;
                let POCross_POOrderItem;
                if (POCross_Result) {
                    POCross_PO = POCross_Result.Po_New;
                    POCross_POOrderItem = POCross_Result.PoItem_New;
                }
                else if (!POCross_Result || POCross_Result == undefined || POCross_Result == null) {
                    POCross_PO = PO;
                    POCross_POOrderItem = POItem;
                }

                //  log.cfLoggingMessages('info', "PO Cross :-" + POCross_PO + POCross_POOrderItem);
                // log.cfLoggingMessages('info','Befores4call->');

                const Read_API = await open_qty_srv.tx(req).run({
                    "SELECT": {
                        "from": {
                            "ref": [{
                                "id": "S4HanaService.C_PurchaseOrderItemMoni",
                                "where": [
                                    { "ref": ["P_DisplayCurrency"] },
                                    "=",
                                    { "val": 'US' }
                                ]
                            },
                                "Results"
                            ]
                        },
                        "columns": [
                            { "ref": ["ID"] },
                            { "ref": ["InvoiceReceiptQty"] },
                            { "ref": ["GoodsReceiptQty"] },
                            { "ref": ["StillToBeDeliveredQuantity"] },
                            { "ref": ["StillToInvoiceQuantity"] },
                            { "ref": ["ScheduleLineOpenQty"] }
                        ],
                        "where": [
                            { "ref": ["PurchaseOrder"] },
                            "=",
                            { "val": POCross_PO }
                            , 'and',
                            { ref: ['PurchaseOrderItem'] },
                            '=',
                            { val: POCross_POOrderItem }
                        ]
                    }
                });


                log.cfLoggingMessages('info', 'V_UPDATE_OPEN_QTY Read_API_open - > ' + JSON.stringify(Read_API));

                if (Read_API && Read_API.length > 0) {
                    for (const Read_API_RS of Read_API) {

                        schqty = Read_API_RS.StillToInvoiceQuantity;

                        log.cfLoggingMessages('info', 'receipt -> ' + invoiceqty);
                        log.cfLoggingMessages('info', 'grqty-> ' + grqty);
                        data1 = {
                            "PurchaseOrder": POCross_PO,
                            "PurchaseOrderItem": POCross_POOrderItem,
                            "ScheduleLineOpenQty": schqty
                        };
                        log.cfLoggingMessages('info', 'Rest_data1 -> ' + JSON.stringify(data1));
                    }
                    log.cfLoggingMessages('debug', 'V_UPDATE_OPEN_QTY -> checkPO To Request -> ' + POCross_PO + POCross_POOrderItem);
                    let checkPO = await tx.run(SELECT.one(PO_Update).where({ PurchaseOrder: POCross_PO, PurchaseOrderItem: POCross_POOrderItem }).columns('PurchaseOrder'));
                    log.cfLoggingMessages('debug', 'V_UPDATE_OPEN_QTY -> checkPO-> ' + checkPO);
                    if (checkPO != undefined || checkPO != null) {
                        log.cfLoggingMessages('debug', 'V_UPDATE_OPEN_QTY -> checkPOInside-> ' + checkPO);
                        await tx.run(UPDATE(PO_Update).set({ ScheduleLineOpenQty: schqty }).where({ PurchaseOrder: POCross_PO, PurchaseOrderItem: POCross_POOrderItem }));
                    } else {
                        log.cfLoggingMessages('debug', 'V_UPDATE_OPEN_QTY -> checkPOElse-> ' + checkPO);
                        // check if data1 is null
                        if (data1 === null) {
                            let dbQuery = "CALL GET_MNETSTATUSMONITORING_ID(NEXT_ID => ?)";
                            // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
                            const result = await cds.run(dbQuery, {});
                            // log.cfLoggingMessages('info', 'SP NEXT ID result' + JSON.stringify(result));
                            let ID = result.NEXT_ID[0].ID;
                            const insertErrorData = {
                                ID: ID,
                                BOLID: BOLID,
                                INVOICENUMBER: null,
                                HOUSEBOLNUMBER: BOL,
                                CONTAINERID: null,
                                Message: 'Material is different',
                                ObjectType: 'MNET',
                                Status: 'E',
                                IMPORTSHIPMENTNUMBER: importShipmentNumber
                            }
                            log.cfLoggingMessages('debug', 'insertErrorData' + insertErrorData)
                            await tx.run(INSERT.into(MNetStatusMonitoring).entries(insertErrorData));

                        } else {
                            log.cfLoggingMessages('debug', 'data1_insert V_UPDATE_OPEN_QTY' + JSON.stringify(data1));
                            await tx.run(INSERT.into(PO_Update).entries(data1));

                        }
                    }
                } else {
                    log.cfLoggingMessages('debug', 'V_UPDATE_OPEN_QTY Read_API_open No Entry');
                }

            }

            return true;
        }
        catch (e) {
            log.cfLoggingMessages('error', 'Error in V_UPDATE_OPEN_QTY' + e)
            req.error({
                code: '400',
                message: e.message,
                target: 'V_UPDATE_OPEN_QTY',
                status: 418
            })
            return false;
        }
    }

    this.on('V_UPDATE_OPEN_QTY', async req => {
        try {
            log.cfLoggingMessages('debug', 'V_UPDATE_OPEN_QTY' + req)
            const tx = cds.tx(req);
            const PO = req.data.PurchaseOrder;
            let data1 = null;
            let schqty = null;

            const result = await SELECT.distinct.from(A_PurchaseOrderItem).where({ PurchaseOrder_PurchaseOrder: PO }).columns('PurchaseOrderItem');
            for (const oudata1 of result) {
                // log.cfLoggingMessages('info', 'po -> ' + PO);
                // log.cfLoggingMessages('info', 'PurchaseOrderItem -> ' + oudata1.PurchaseOrderItem);
                const PurchaseOrderItem = oudata1.PurchaseOrderItem;
                // log.cfLoggingMessages('info', 'POrderItem -> ' + PurchaseOrderItem);
                // let quote_str = "'" + PO + "'";
                // log.cfLoggingMessages('info', 'quote_str -> ' + quote_str);

                const Read_API = await open_qty_srv.tx(req).run({
                    "SELECT": {
                        "from": {
                            "ref": [{
                                "id": "S4HanaService.C_PurchaseOrderItemMoni",
                                "where": [
                                    { "ref": ["P_DisplayCurrency"] },
                                    "=",
                                    { "val": 'US' }
                                ]
                            },
                                "Results"
                            ]
                        },
                        "columns": [
                            { "ref": ["ID"] },
                            { "ref": ["ScheduleLineOpenQty"] }
                        ],
                        "where": [
                            { "ref": ["PurchaseOrder"] },
                            "=",
                            { "val": PO }
                            , 'and',
                            { ref: ['PurchaseOrderItem'] },
                            '=',
                            { val: oudata1.PurchaseOrderItem }
                        ]
                    }
                });


                log.cfLoggingMessages('debug', 'Read_API - > ' + JSON.stringify(Read_API));
                for (const Read_API_RS of Read_API) {
                    schqty = Read_API_RS.ScheduleLineOpenQty;
                    schqty.toFixed(2);
                    // log.cfLoggingMessages('info', 'ScheduleLineOpenQty -> ' + schqty);
                    let data1 = {
                        "PurchaseOrder": PO,
                        "PurchaseOrderItem": PurchaseOrderItem,
                        "ScheduleLineOpenQty": schqty
                    };
                    log.cfLoggingMessages('debug', 'data1 -> ' + JSON.stringify(data1));
                }
                const checkPO = await tx.run(SELECT.one(PO_Update).where({ PurchaseOrder: PO, PurchaseOrderItem: PurchaseOrderItem }).columns('PurchaseOrder'));
                if (checkPO != null) {
                    await tx.run(UPDATE(PO_Update).set({ ScheduleLineOpenQty: schqty }).where({ PurchaseOrder: PO, PurchaseOrderItem: PurchaseOrderItem }));
                } else {
                    await tx.run(INSERT.into(PO_Update).entries(data1));
                }


            }
            return true;
        }
        catch (e) {
            log.cfLoggingMessages('error', 'Error in V_UPDATE_OPEN_QTY' + e)
            req.error({
                code: '400',
                message: e.message,
                target: 'V_UPDATE_OPEN_QTY',
                status: 418
            })
        }
    })

    /**
     * Update_InvoiceLine_OrderItemNbr 
     * This Update will take place In - Process for PART Subsitution Where New PO Line Item Created in S4 and
     * the information needs to be updated on Invoice Line
     */

    this.on('Update_InvoiceLine_OrderItemNbr', async req => {
        try {
            log.cfLoggingMessages('debug', 'V_UPDATE_OPEN_QTY' + req)
            const tx = cds.tx(req);
            const PO = req.data.PurchaseOrder;
            const POItem = req.data.PurchaseOrderItem;
            // const Material = req.data.Material;
            const InvoiceNumber = req.data.invoiceNumber;
            const BolId = req.data.BOLID;
            const HouseBOLNumber = req.data.houseBOLNumber;
            const lineNumber = req.data.lineNumber;


            await tx.run(UPDATE(invoiceLine).set({ orderItemNbr: POItem }).where({
                INVOICENUMBER_INVOICENUMBER: InvoiceNumber,
                INVOICENUMBER_HOUSEBOLNUMBER_ID: BolId,
                INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: HouseBOLNumber,
                LINENUMBER: lineNumber,
                PURCHASEORDERNUMBER: PO
            }.and(
                `(orderItemNbr <> '${POItem}')`
            )));

            return {
                "Update_InvoiceLine_OrderItemNbr": "Success"
            };
        }
        catch (e) {
            log.cfLoggingMessages('error', 'Error in Update_InvoiceLine_OrderItemNbr' + e)
            req.error({
                code: '400',
                message: e.message,
                target: 'Update_InvoiceLine_OrderItemNbr',
                status: 418
            })
        }
    });

    this.on('Get_GR', async req => {

        let SelectQuery1 = await SELECT.from`MNET_Workflow.GetGRData`;
        return SelectQuery1;

    });
    /*
      Logic for Hold lines
  */
    const checkHoldLines = async (req) => {
        cds.tx(async tx => {
            for (let j = 0; j < Object.keys(req.data["bolHeader"]).length; j++) {
                let fileBolHeader = req.data.bolHeader[j];
                let importShipmentNumber = req.data.bolHeader[j].importShipmentNumber;
                let bolID = fileBolHeader.ID;
                let houseBOLNumber = fileBolHeader.houseBOLNumber;
                for (let i = 0; i < Object.keys(fileBolHeader["invoiceHeader"]).length; i++) {
                    let fileInvoiceHeader = fileBolHeader["invoiceHeader"][i];
                    let InvoiceNo = fileInvoiceHeader.invoiceNumber;
                    let statusHonly = true;
                    let statusMonitoringFullPayload = [];
                    for (let j = 0; j < Object.keys(fileInvoiceHeader["invoiceLine"]).length; j++) {
                        let fileInvoiceLine = fileInvoiceHeader["invoiceLine"][j];
                        let ContainerID = fileInvoiceLine.containerID;
                        let MNET_LINE = fileInvoiceLine.lineNumber;
                        let OrigPO = fileInvoiceLine.purchaseOrderNumber;
                        let status = fileInvoiceLine.status;
                        let additionalInvoiceLine = fileInvoiceLine.additionalInvoiceLine;
                        additionalInvoiceLine = additionalInvoiceLine && additionalInvoiceLine.length > 0 ? additionalInvoiceLine[0] : {};
                        let OrigPOLine = additionalInvoiceLine.orderItemNbr;
                        //get additional invoice line for poline ->orderItemNbr
                        if (status != "H") {
                            statusHonly = false;
                            break;
                        }
                        let statusMonitoringPayload = {
                            ID: "",
                            BOLID: bolID,
                            INVOICENUMBER: InvoiceNo,
                            HOUSEBOLNUMBER: houseBOLNumber,
                            CONTAINERID: ContainerID,
                            Message: "Invoice Line Item has been on HOLD",
                            ObjectType: 'MNET',
                            Status: 'H',
                            IMPORTSHIPMENTNUMBER: importShipmentNumber
                        }
                        let statusMonitoringItemPayload = {
                            ID_ID: "",
                            LINEID: 1,
                            LINENUMBER: MNET_LINE,
                            PURCHASEORDER: OrigPO,
                            PURCHASEORDERITEM: OrigPOLine
                        }
                        statusMonitoringFullPayload.push(
                            {
                                "statusMonitoring": statusMonitoringPayload,
                                "statusMonitoringItem": statusMonitoringItemPayload
                            }
                        )
                    };
                    //if statusHonly then insert into mnet status monitoring
                    if (statusHonly) {
                        for (let i = 0; i < statusMonitoringFullPayload.length; i++) {
                            let payload = statusMonitoringFullPayload[i];
                            let insertHMnetData = payload.statusMonitoring;
                            let insertMnetItemData = payload.statusMonitoringItem;
                            //post the mnetStatusmonitoring and mnetstatusmonitoringitem
                            let dbQuery = "CALL GET_MNETSTATUSMONITORING_ID(NEXT_ID => ?)";
                            // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
                            const result = await cds.run(dbQuery, {});
                            // log.cfLoggingMessages('info', 'SP NEXT ID result' + JSON.stringify(result));
                            let ID = result.NEXT_ID[0].ID;
                            insertHMnetData.ID = ID;
                            insertMnetItemData.ID_ID = ID;
                            // log.cfLoggingMessages('debug', 'insertHMnetData' + insertHMnetData)
                            await tx.run(INSERT.into(MNetStatusMonitoring).entries(insertHMnetData));

                            const insertResult = await tx.run(INSERT.into(MNetStatusMonitoringItem).entries(insertMnetItemData));
                            // log.cfLoggingMessages('info', 'INSERT RES', insertResult);

                        }

                    }
                }
            }
        });
    }
})
