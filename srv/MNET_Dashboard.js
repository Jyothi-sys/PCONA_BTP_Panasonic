const cds = require('@sap/cds');
const axios = require("axios");
const log = require('./util/logger')


module.exports = cds.service.impl(async function () {

    const { MNET_ACTION, MNET_DiversionHeader, ZMNETBUSINESS, bolHeader, MNetStatusMonitoringItem, MNetStatusMonitoring, invoiceLine,A_PurchaseOrderItem } = cds.entities('BTP.Panasonic')
    const { GetGRData, GET_MNET_DATA, GET_PO_DATA, Environment, GET_MNET_Data_Detail, GET_MNET_DeliveryDocumentItem, GET_MNET_SuplrInvcItemPurOrdRef } = this.entities;
    const open_qty_srv = await cds.connect.to('MM_PUR_POITEMS_MONI_SRV');

    this.on('VALIDATE_MNET_ACTION', async req => {
        try {
            log.logger('debug', 'VALIDATE_MNET_ACTION -> ' + JSON.stringify(req.data));
            const BOL = req.data.houseBOLNumber;
            const PO = req.data.purchaseOrderNumber;
            const ID = req.data.ID;
            const Container_ID = req.data.containerID;
            const InvID = req.data.invID;
            const poType = req.data.potype;
            const PType = poType.charAt(0);
            const Paycode = req.data.payconcode;
            let importShipmentNumber = req.data.Folder_No;

            // log.logger('info', 'BOL -> ' + BOL);
            // log.logger('info', 'PO -> ' + PO);
            // log.logger('info', 'ID ->' + ID);

            let result = await SELECT.distinct.from(MNET_ACTION).where({ BOLID: ID, BOL: BOL, PO: PO }).columns('INVID', 'CONID', 'PO', 'BOL', 'BOLID', 'RID', 'lineNumber').orderBy('RID', 'lineNumber');

            log.logger('debug', 'result -> ' + JSON.stringify(result));
            if (result.length > 0) {
                log.logger('debug', 'result length-> ' + result.length);
            }
            else {
                // for (const oudata of result) {
                const v_BOL_ID = ID;
                const V_BOL = BOL;
                const V_INVID = InvID;
                const V_CONID = Container_ID;
                const V_PO = PO;

                // let dbQuery = "CALL USP_GET_MNET_ACTION(V_BOLID => " + v_BOL_ID + " ,V_BOL => " + "'" + V_BOL + "'" + " ,V_INVID => " + "'" + V_INVID + "'" + " ,V_CONID => " + "'" + V_CONID + "'" + " ,V_PO => " + "'" + V_PO + "'" + ")";
                // // log.logger('info', 'dbQuery -> ' + dbQuery);
                // const result = await cds.run(dbQuery, {});
                // log.logger('debug', 'USP_GET_MNET_ACTION SP result' + JSON.stringify(result));
                // INC0219526
                let dbQuery_SP = "CALL GENERATE_MNET_ACTION (I_BOLID => " + "'" + v_BOL_ID + "'" + " ,I_BOL => " + "'" + V_BOL + "'" + " ,I_IMPORTSHIPMENTNUMBER => " + "'" + importShipmentNumber + "')";
                log.cfLoggingMessages('info', 'Validate MNET Action-> dbQuery_SP -> ' + dbQuery_SP);
                const sp_result_SP = await cds.run(dbQuery_SP, {});
                log.cfLoggingMessages('debug', 'Validate MNET Action->GENERATE_MNET_ACTION =>' + JSON.stringify(sp_result_SP));
                // }
            }

            //added current logic to validate business indicator for reprocess from dashboard 
            var ZINBD_DLVY = null;
            var ZINVICE = null;
            var ZGOODS_RECEIPT = null;
            const resultBolHeader = await SELECT.from(bolHeader).where({ houseBOLNumber: BOL, ID: ID, }).columns('modeOfTransport', 'recordType');
            const modeoftransport = resultBolHeader[0].modeOfTransport;
            const recType = resultBolHeader[0].recordType;
            const resultzmnetmode = await SELECT.from`BTP_PANASONIC.ZMNETMODE`.columns`ZSHIPMETHOD`.where`TMODE =${modeoftransport}`;
            shipMethod = resultzmnetmode[0].ZSHIPMETHOD;
            // Adjusted the code based on ZMNET_BUSINESS table to consider blank as CM
            var tmp_zpayconcode = '';
            
            //new code adding indicator on invoice line
            const result2 = await SELECT.distinct.from(A_PurchaseOrderItem).where({ PurchaseOrder_PurchaseOrder: PO}).columns('Plant', 'PurchaseOrderItem').orderBy('PurchaseOrderItem');
            log.cfLoggingMessages('info', 'Validate_MNET_Action_result2==>' + JSON.stringify(result2));
            let v_plant = result2[0].Plant;
            let dbQuery_1 = "CALL UPD_INVOICELINE_ZBUS_INDC(V_RECORDTYPE => '" + recType + "' ,V_MODEOFTRANSPORT => " + "'" + modeoftransport + "'" + " ,v_plant => " + "'" + v_plant + "'" + " ,V_BOL => " + "'" + BOL + "'" + ",V_ID => " + ID + " ,V_PO => " + "'" + PO + "'" + ")";
                // log.cfLoggingMessages('info', 'dbQuery_1 -> ' + dbQuery_1);
                const result_1 = await cds.run(dbQuery_1);
                log.cfLoggingMessages('info', 'Validate_MNET_Action_result_1==>' + JSON.stringify(result_1));
            //end new code

            if (Paycode === 'FR') {
                tmp_zpayconcode = 'FR';
            }
            const resultBizInd = await SELECT.distinct.from(ZMNETBUSINESS).where({ ZRECTYPE: recType, ZSHIPMETHOD: shipMethod, ZPOIND: PType, ZPAYCONCODE: tmp_zpayconcode });
            // log.logger('info', "ZMNET_Bresult" + JSON.stringify(result));


            ZINBD_DLVY = resultBizInd[0].ZINBD_DLVY;
            ZINVICE = resultBizInd[0].ZINVICE;
            ZGOODS_RECEIPT = resultBizInd[0].ZGOODS_RECEIPT;


            const responseObject = {
                ZINBD_DLVY: ZINBD_DLVY,
                ZINVICE: ZINVICE,
                ZGOODS_RECEIPT: ZGOODS_RECEIPT
            };



            // Return the responseObject to UI5
            return responseObject;




        }
        catch (e) {
            log.logger('error', 'Error in VALIDATE_MNET_ACTION' + e);
            req.error({
                code: '400',
                message: e.message,
                target: 'some_field',
                status: 418
            })
        }
    })

    this.on('UpdateParentStatus',async req => {
        try {
            log.cfLoggingMessages('debug', 'UpdateParentStatus' + JSON.stringify(req.data))
            const tx = cds.tx(req);
            const iBOLID = req.data.BOLID;
            const BOL = req.data.houseBOLNumber;
            const ContainerID = req.data.containerID;
            const InvoiceNo = req.data.invID;
            const NewPO = req.data.NewPO;
            const NewPOLine = req.data.NewPOLine;
            const MNET_LINE = req.data.lineNumber;
            var statusCheck = 0;
            var statusText = '';
            var DivertedPOInfo = [];
            const DiversionPO = "SELECT ID_Purchase_Order,ID_PO_Line from Dashboard.MNET_DiversionDetail where ID_MNET_ID = '" +[iBOLID]+"' AND ID_houseBOLNumber = '" + [BOL] + "' and ID_Mnet_Line ='"+[MNET_LINE]+"'and ID_Mnet_No ='" +[InvoiceNo]+"' and ID_Container_ID ='"+[ContainerID]+"' and NewPurchasing_Order = '" + [NewPO] + "' AND NewPOLine = '" + [NewPOLine] + "'";
            let query4 = cds.parse.cql(DiversionPO);
            let result4 = await tx.run(query4);
            log.cfLoggingMessages('info_UpdateParentStatus_DiversionPO', JSON.stringify(result4));
            let OrigPO = result4[0].ID_Purchase_Order;
            let OrigPOLine = result4[0].ID_PO_Line;
            log.cfLoggingMessages('info_UpdateParentStatus OrigPO:'+OrigPO);
            log.cfLoggingMessages('info_UpdateParentStatus OrigPOLine'+OrigPOLine);
            
            const Output = "SELECT NewPurchasing_Order,NewPOLine,NewQuantity,UnitPrice,PartUnitOfMeasurement,ExtendedCost,Status from Diversion.MNET_DiversionDetail where ID_houseBOLNumber = '" + [BOL] + "' and ID_Mnet_No ='" +[InvoiceNo]+"' and ID_Container_ID ='"+[ContainerID]+"' and ID_Purchase_Order ='"+[OrigPO]+"' and ID_PO_Line ='"+[OrigPOLine]+"'";
            let query = cds.parse.cql(Output);
            let result = await tx.run(query);
            // let len = result.length;
            log.cfLoggingMessages('info_UpdateParentStatus', JSON.stringify(result));

            for (const oudata of result) {
                const NewPurchasing_Order = oudata.NewPurchasing_Order;
                const NewPOLine = oudata.NewPOLine;
                const NewQuantity = oudata.NewQuantity;
                // const UnitPrice   = oudata.UnitPrice;
                // const UOM = oudata.PartUnitOfMeasurement;
                // const ExtendedCost = oudata.ExtendedCost;
                const Status = oudata.Status;
                DivertedPOInfo.push({
                    "PO" :NewPurchasing_Order,
                    "POLine":NewPOLine,
                    "Qty":NewQuantity
                });
                //  log.cfLoggingMessages('info', "NewPurchasing_Order:" + NewPurchasing_Order + "NewPOLine:" + NewPOLine + "NewQuantity:" + NewQuantity);
                if(Status === 'E')
                {
                    //update the invoice line table for the Org PO to 'E'
                    statusCheck++;
                    continue;
                }
                else{
                    statusText = Status;
                }
                
            }
            if (statusCheck > 0)
            {
                log.cfLoggingMessages('info_UpdateParentStatus statusCheck '+statusCheck);
                await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ purchaseOrderNumber: OrigPO,InvoiceNumber_InvoiceNumber:InvoiceNo,INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER:BOL,ContainerID:ContainerID,orderItemNbr:OrigPOLine })); 
            }
            else{
                log.cfLoggingMessages('info_UpdateParentStatus statusText '+statusText);
                await tx.run(UPDATE(invoiceLine).set({ status:statusText }).where({ purchaseOrderNumber: OrigPO,InvoiceNumber_InvoiceNumber:InvoiceNo,INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER:BOL,ContainerID:ContainerID,orderItemNbr:OrigPOLine })); 
            }
            
            
        }
        catch (error) {
            log.cfLoggingMessages('error', 'Error in UpdateParentStatus' + error)
            req.error({
                code: '400',
                message: error.message,
                target: 'some_field',
                status: 418
            })
        }   
})


    this.on('GR_Posting', async req => {
        try {
            const tx = cds.tx(req);
            log.cfLoggingMessages('debug', 'GR_Posting -> ' + JSON.stringify(req.data))
            // const BOL = req.data.houseBOLNumber;
            const PO = req.data.purchaseOrderNumber;
            // const ID = req.data.ID;
            const INV = req.data.invID;
            // const InvLine = req.data.InvLine;
            let ActID = req.data.ActID;
            if (ActID && ActID == "U") {
                // await V1_Posting_Diversion(req);
                await V1_GR_Posting_Diversion(req)
            }
            /*
                Diverted Line Reporcess Scenario 
                04-06-2024
                Bhushan
                CE
            */
            else {
                // log.cfLoggingMessages('info', 'BOL -> ' + BOL);
                // log.cfLoggingMessages('info', 'PO -> ' + PO);
                // log.cfLoggingMessages('info', 'ID ->' + ID);

                const result = await tx.run(SELECT.distinct.from(GetGRData).where({ invoiceNumber: INV, purchaseOrderNumber: PO }).columns('ID', 'deliveryDocument', 'purchaseOrderNumber', 'houseBOLNumber', 'invoiceNumber', 'ETA', 'containerID'));
                // log.cfLoggingMessages('info', JSON.stringify(result));
                for (const oudata of result) {
                    const ID = oudata.ID;
                    const BOL = oudata.houseBOLNumber;
                    const invoiceNumber = oudata.invoiceNumber;
                    const deliveryDocument = oudata.deliveryDocument;
                    //added on 02/01/2024 by Preethi for reprocess 
                    const containerID = oudata.containerID;
                    const purchaseOrderNumber = oudata.purchaseOrderNumber;
                    const ETA_1 = oudata.ETA;

                    var GR_post = {
                        "ID": ID,
                        "HOUSEBOLNUMBER": BOL,
                        "INVOICENUMBER": invoiceNumber,
                        "DELIVERYDOCUMENT": deliveryDocument,
                        "PURCHASEORDERNUMBER": purchaseOrderNumber,
                        "CONTAINERID": containerID,
                        "ETA": ETA_1       //added by Asif for 186 defect
                    };
                    log.cfLoggingMessages('debug', 'JSON 1 : - ' + JSON.stringify(GR_post));
                    

                    // Now you have an array of GR_post objects
                    ////// Call CPI API 
                    //Declarations 
                    const CPI_URL_Data = await SELECT.one(Environment).where({ APPID: 'CPI_GR' }).columns('URL', 'tokenUrl', 'clientId', 'clientSecret');
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
                        data: GR_post
                    }).then(response1 => {

                        log.cfLoggingMessages('debug', 'response1 -> ' + JSON.stringify(response1.data));

                    }).catch(error => {
                        log.cfLoggingMessages('error', 'error in GR_Posting CPI CALL-> ' + JSON.stringify(error.response.data));
                    });

                }



                return true;
            }
        }
        catch (error) {
            log.cfLoggingMessages('error', 'error in GR_Posting' + error);
            req.error({
                code: '400',
                message: error.message,
                target: 'some_field',
                status: 418
            })

            return false;

        }


    })



    this.on('Invoice_Posting', async req => {
        try {
            log.cfLoggingMessages('debug', 'Invoice_Posting -> ' + req)
            const BOL = req.data.houseBOLNumber;
            const PO = req.data.purchaseOrderNumber;
            const ID = req.data.ID;
            const INV = req.data.invID;
            const InvLine = req.data.InvLine;
            /*
            Diverted Line Reporcess Scenario 
            04-06-2024
            Bhushan
            CS
            */
            let ActID = req.data.ActID;
            if (ActID && ActID == "U") {
                // await V1_Posting_Diversion(req);
                await V1_INV_Posting_Diversion(req)
            }
            /*
                Diverted Line Reporcess Scenario 
                04-06-2024
                Bhushan
                CE
            */
            else {
                await V1_Invoice_Posting(req, BOL, PO, ID, INV, InvLine);
            }
            return true;
        }
        catch (e) {
            log.cfLoggingMessages('error', 'Error in Invoice_Posting' + e)
            req.error({
                code: '400',
                message: e.message,
                target: 'V_Invoice_Posting',
                status: 418
            })
            return false;
        }

    })
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
                        { "ref": ["ScheduleLineOpenQty"] },
                        { "ref": ["StillToInvoiceQuantity"] }
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
    const partssubvalidation = async (req, data, tx) => {
        return cds.tx(async tx => {
            try {
                await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({
                    INVOICENUMBER_HOUSEBOLNUMBER_ID: data.houseBOLNumber_ID,
                    INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: data.BillofLanding,
                    PURCHASEORDERNUMBER: data.Purchasing_order,
                    orderItemNbr: data.PO_Line,
                    INVOICENUMBER_INVOICENUMBER: data.SupplierInvoice,
                    LINENUMBER: data.SupplierInvoice_Line

                }));
                log.cfLoggingMessages('info', 'updateinvoice' + ":" + data.PO_Line + ":" + data.SupplierInvoice + ":" + data.SupplierInvoice_Line);
                let dbQuery = "CALL GET_MNETSTATUSMONITORING_ID(NEXT_ID => ?)";
                log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
                const result = await cds.run(dbQuery, {});
                log.cfLoggingMessages('info', 'SP NEXT ID result' + JSON.stringify(result));
                let ID1 = result.NEXT_ID[0].ID;
                const insertMnetData = {
                    ID: ID1,
                    BOLID: data.houseBOLNumber_ID,
                    INVOICENUMBER: data.SupplierInvoice,
                    HOUSEBOLNUMBER: data.BillofLanding,
                    CONTAINERID: data.containerID,
                    Message: `Parts Substitution is not allowed on DROP Ship Order`,
                    ObjectType: 'MNET',
                    Status: 'E',
                    IMPORTSHIPMENTNUMBER: data.Folder_No
                }

                await tx.run(INSERT.into(MNetStatusMonitoring).entries(insertMnetData));
                log.cfLoggingMessages('info', "Parts Substitution inside partssubValidation=>" + insertMnetData + data.SupplierInvoice);
                const insertMnetItemData = {
                    ID_ID: ID1,
                    LINEID: 1,
                    LINENUMBER: data.SupplierInvoice_Line,
                    PURCHASEORDER: data.Purchasing_order,
                    PURCHASEORDERITEM: data.PO_Line
                }
                await tx.run(INSERT.into(MNetStatusMonitoringItem).entries(insertMnetItemData));
                // log.cfLoggingMessages('info', "partsSubErr" + partsSubErr);
                // return partsSubErr;
            }



            catch (err) {
                log.cfLoggingMessages('error', "partssubvalidation ", err);

                return false;
            }
        });
    }
    /* Implementation: Logic to update Execution log and update Status to E when schedule line open qty is greater than quantity
                                           Author: Kowsalyaa 
                                           Date: 15-07-2024  
                                           Start*/
    const updateErrorDetails = async (req, ID, data, tx) => {
        return cds.tx(async tx => {
            try {
                const checkupdate = await tx.run(UPDATE(invoiceLine).set({
                    status: 'E',
                    BTP_InvoiceStatus: 'E'
                }).where({
                    INVOICENUMBER_HOUSEBOLNUMBER_ID: ID,
                    INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: data.BillofLanding,
                    PURCHASEORDERNUMBER: data.Purchasing_order,
                    orderItemNbr: data.PO_Line,
                    INVOICENUMBER_INVOICENUMBER: data.SupplierInvoice,
                    LINENUMBER: data.SupplierInvoice_Line
                }));
                log.cfLoggingMessages('info', 'checkupdate' + checkupdate)

                let dbQuery = "CALL GET_MNETSTATUSMONITORING_ID(NEXT_ID => ?)";
                const result = await cds.run(dbQuery, {});
                log.cfLoggingMessages('info', 'SP NEXT ID result' + JSON.stringify(result));
                let ID1 = result.NEXT_ID[0].ID;
                const insertMnetData = {
                    ID: ID1,
                    BOLID: ID,
                    INVOICENUMBER: data.SupplierInvoice,
                    HOUSEBOLNUMBER: data.BillofLanding,
                    CONTAINERID: data.containerID,
                    Message: `Schedule Line Qty is greater than Open Qty. Invoice can not be posted. Adjust PO qty to post invoice.`,
                    ObjectType: 'Invoice',
                    Status: 'E',
                    IMPORTSHIPMENTNUMBER: data.Folder_No
                }

                const mnetStatusMonitoringResponse = await tx.run(INSERT.into(MNetStatusMonitoring).entries(insertMnetData));
                console.log('mnetStatusMonitoringResponse', mnetStatusMonitoringResponse)

                const insertMnetItemData = {
                    ID_ID: ID1,
                    LINEID: 1,
                    LINENUMBER: data.SupplierInvoice_Line,
                    PURCHASEORDER: data.Purchasing_order,
                    PURCHASEORDERITEM: data.PO_Line
                }
                const MNetStatusMonitoringItemResponse = await tx.run(INSERT.into(MNetStatusMonitoringItem).entries(insertMnetItemData));
                return true;
            } catch (err) {
                log.cfLoggingMessages('error', "updateErrorDetails ", err);
                return false;
            }
        });
    }
// END
    const V1_Invoice_Posting = async (req, BOL, PO, ID, INV, InvLine) => {
        try {

            log.cfLoggingMessages('debug', 'V1_Invoice_Posting - req' + req)
            log.cfLoggingMessages('debug', 'V1_Invoice_Posting - BOL' + BOL)
            log.cfLoggingMessages('debug', 'V1_Invoice_Posting - PO' + PO)
            log.cfLoggingMessages('debug', 'V1_Invoice_Posting - ID' + ID)
            log.cfLoggingMessages('debug', 'V1_Invoice_Posting - INV' + INV)
            log.cfLoggingMessages('debug', 'V1_Invoice_Posting - InvLine' + InvLine)
            const db = await cds.connect.to('db');
            const tx = db.tx();

            const date = new Date();
            let day = (date.getDate()).toString();
            let month = (date.getMonth() + 1).toString(); //Asif changes defect #22 17/11
            let year = date.getFullYear();
            let lmonth = month.length;
            let lday = day.length;
            let vmonth = null;
            let vday = null
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
            // log.cfLoggingMessages('info', 'v_date : -' + v_date);
            // var CHINV = 'INV';
            let v_post_flag = 0;

            let result = await SELECT.distinct.from(GET_MNET_Data_Detail)
                .where({
                    // BillOfLading: BOL,
                    SupplierInvoice: INV,
                    Purchasing_order: PO,
                    // SupplierInvoice_Line: InvLine
                    // ID: ID,
                })
                .and(`(BTP_InvoiceStatus = '' OR BTP_InvoiceStatus = ' ' OR BTP_InvoiceStatus = 'E' OR BTP_InvoiceStatus IS NULL)`)
                .columns(
                    'houseBOLNumber_ID',
                    'supplierID',
                    'Original_Material',
                    'BillofLanding',
                    'ETA',
                    'SupplierInvoice',
                    'Vender',
                    'CurrencyCode',
                    'Purchasing_order',
                    'buyerPartID',
                    'quantity',
                    'extendedCost',
                    'UOM',
                    'SupplierInvoice_Line',
                    'containerID',
                    'PO_Line',
                    'Plant',
                    'CompanyCode',
                    // 'qtyPerSLSUnitPricePackType',
                    'PurchaseOrderQuantityUnit',
                    'OrderPriceUnit',
                    'invoicedate',
                    'Folder_No',
                    'BTP_InvoiceStatus',
                    'INV_Action'
                )
                .orderBy('PO_Line')
                ;
            log.cfLoggingMessages('debug', 'GET_MNET_DATA_detail.result1 -> ' + JSON.stringify(result));
            // log.cfLoggingMessages('debug', 'GET_MNET_DATA_detail.result2 -> ' + (result));
            for (const oData of result) {
                let openQtyError = false;
                let partsSubErr = false;

                // const v_BOL_ID = ID;
                const v_BOL_ID = oData.houseBOLNumber_ID;
                const V_BOL = oData.BillofLanding;
                const V_INVID = oData.SupplierInvoice;
                const V_CONID = oData.containerID;
                const V_PO = oData.Purchasing_order;
                const V_lineNumber = oData.SupplierInvoice_Line;
                const V_DocumentDate = oData.invoicedate + 'T12:00:00'; //Asif changes in 27/11
                const v_importShipmentNumber = oData.Folder_No;
                const V_ObjType = 'Invoice';
                const PASCOriginalPartsNbr = oData.Original_Material;
                const supplierPartID = oData.supplierID;
                
                const BTP_InvoiceStatus = oData.BTP_InvoiceStatus;
                const BTP_InvoiceAction = oData.INV_Action;

                var inv_post = {
                    "BOLID": v_BOL_ID, // added by Preethi for Defect 215 on 21/02/24
                    "importShipmentNumber": v_importShipmentNumber,
                    "houseBOLNumber": oData.BillofLanding,
                    "invoiceNumber": oData.SupplierInvoice,
                    "containerID": oData.containerID,
                    "CompanyCode": oData.CompanyCode,
                    "SupplierInvoiceIDByInvcgParty": oData.SupplierInvoice,
                    "DocumentDate": V_DocumentDate, //Asif changes in 27/11
                    "PostingDate": v_date,
                    "InvoicingParty": oData.Supplier,  // SELLER  of A_PurchaseOrder Table
                    "DocumentCurrency": oData.CurrencyCode,
                    "InvoiceGrossAmount": oData.extendedCost,
                    "DueCalculationBaseDate": v_date,
                    Action: [],
                    SuplrInvcItemPurOrdRef: []
                };
                log.cfLoggingMessages('debug', 'INV JSON 1: - ' + JSON.stringify(inv_post));
                //MNET_ACTION
                let action_result = await SELECT.distinct.from(MNET_ACTION).where({ BOLID: v_BOL_ID, BOL: V_BOL, INVID: V_INVID, CONID: V_CONID, PO: V_PO, lineNumber: V_lineNumber, OBJECTTYPE: V_ObjType }).columns('ACTION', 'DOCNUM', 'DATE', 'FISCALYEAR', 'REVERSALREASON', 'OBJECTTYPE', 'RID', 'lineNumber').orderBy('RID');
                log.cfLoggingMessages('debug', 'action_result_invoice_posting -> ' + JSON.stringify(action_result));
                for (const oData_Action of action_result) {

                    // function to trigger parts sub validation
                    if (PASCOriginalPartsNbr != null && PASCOriginalPartsNbr != supplierPartID) {
                        log.cfLoggingMessages('info', 'PASCOriginalPartsNbr' + PASCOriginalPartsNbr);
                        log.cfLoggingMessages('info', 'supplierPartID' + supplierPartID);
                        log.cfLoggingMessages('info', 'PO ' + V_PO);
                        let dbQuery = "CALL GET_DROPSHIP_STATUS(PO => " + "'" + V_PO + "'" + ",STATUS => ?)";
                        log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
                        const result = await cds.run(dbQuery, {});
                        log.cfLoggingMessages('info', 'GET_DROPSHIP_STATUS inside partssubvalidation =>' + JSON.stringify(result));
                        if (result.STATUS == 'Drop') {
                            partsSubErr = true;
                            // const partsubresult = await partssubvalidation(req,oData,tx);
                            await partssubvalidation(req, oData, tx);
                            log.cfLoggingMessages('info', 'partsubresult_V1_Invoice_Posting' + partsSubErr);// true
                        }
                    }
                    /* Implementation: Logic to check whether schedule line open qty is greater than quantity
                                            Author: Kowsalyaa 
                                            Date: 09-07-2024  
                                            Start*/
                    if ( (BTP_InvoiceAction == 'C' && BTP_InvoiceStatus != 'S') || BTP_InvoiceAction == null){
                        const scheduleLineOpenQty = await V_GET_OPEN_QTY(req, PO, oData.PO_Line)
                        log.cfLoggingMessages('info', 'scheduleLineOpenQty ' + scheduleLineOpenQty);
                        log.cfLoggingMessages('info', 'oData.quantity ' + oData.quantity);
                        if (parseFloat(oData.quantity) > parseFloat(scheduleLineOpenQty)) {
                            // throw error
                            log.cfLoggingMessages('info', 'Quantity is greater than schedule line open qty');
                            openQtyError = true;
                            await updateErrorDetails(req, ID, oData, tx)
                        }
                    // END
                    }
                    v_post_flag = 1;
                    if (openQtyError == false && partsSubErr == false) {
                        inv_post.Action.push({
                            "BOLID": v_BOL_ID,        // added by Preethi for Defect 215
                            "Action": oData_Action.ACTION,
                            "DocNum": oData_Action.DOCNUM,
                            "Date": oData_Action.DATE,
                            "FiscalYear": oData_Action.FISCALYEAR,
                            "ReversalReason": oData_Action.REVERSALREASON,
                            "ObjectType": "Invoice"
                        });

                    }
                    log.cfLoggingMessages('debug', 'INV JSON 2: - ' + JSON.stringify(inv_post));
                    //MNET_SuplrInvcItemPurOrdRef

                    let item_result = await SELECT.distinct.from(GET_MNET_SuplrInvcItemPurOrdRef).where({ BOLID: v_BOL_ID, BOL: V_BOL, INVID: V_INVID, CONID: V_CONID, PO: V_PO, lineNumber: V_lineNumber }).columns('lineNumber', 'Material', 'PurchaseOrder', 'PurchaseOrderItem', 'SupplierInvoiceItem', 'Plant', 'TaxCode', 'DocumentCurrency', 'SupplierInvoiceItemAmount', 'PurchaseOrderQuantityUnit', 'QuantityInPurchaseOrderUnit', 'SupplierInvoiceItemText', 'SupplierMaterialNumber');
                    log.cfLoggingMessages('debug', 'Item_result_INVOICE_POSTING -> ' + JSON.stringify(item_result));
                    const filteredArray = item_result.filter(item => item.Material == item.SupplierMaterialNumber);
                    // const filteredArray = item_result.filter(item => (item.status == 'E'|| (item.BTP_IBDStatus == 'S' && item.BTP_IBDAction == 'D')));
                    log.cfLoggingMessages('debug', 'if FilteredArray' + filteredArray);
                    for (const oData_Item of filteredArray) {
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
                            "PurchaseOrderQuantityUnit": oData.OrderPriceUnit,
                            "qtyPerSLSUnitPricePackType": oData.PurchaseOrderQuantityUnit,
                            "QuantityInPurchaseOrderUnit": oData_Item.QuantityInPurchaseOrderUnit,
                            "SupplierInvoiceItemText": oData_Item.SupplierInvoiceItemText
                        })

                    }
                }
                log.cfLoggingMessages('debug', 'INV JSON 3: - ' + JSON.stringify(inv_post));
                // log.cfLoggingMessages('info', 'v_post_flag - ' + v_post_flag);

                let length = inv_post.Action.length;
                let length1 = inv_post.SuplrInvcItemPurOrdRef.length;
                log.cfLoggingMessages('debug', 'Dashboard length INV JSON 3: - ' + JSON.stringify(length));
                if ((length && length1) > 0) {
                    ////// Call CPI API 
                    //Declarations 
                    if (v_post_flag != 0) {
                        try {
                            const CPI_URL_Data = await SELECT.one(Environment).where({ APPID: 'CPI_Invoice' }).columns('URL', 'tokenUrl', 'clientId', 'clientSecret');
                            //  log.cfLoggingMessages('info', JSON.stringify(CPI_URL_Data));
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

                                log.cfLoggingMessages('debug', 'INV response1 -> ' + JSON.stringify(response1.data));

                            }).catch(error => {
                                log.cfLoggingMessages('error', 'INV error -> ' + JSON.stringify(error.response.data));

                            });

                        }
                        catch (error) {
                            log.cfLoggingMessages('error', 'Error in V1_Invoice_Posting' + error.message);
                            //return false;
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
    const V1_IBD_Posting_Diversion = async (req) => {
        try {
            // log.cfLoggingMessages('debug', 'Diversion Reprocess' + JSON.stringify(req.data))
            const tx = cds.tx(req);
            //  log.cfLoggingMessages('info', JSON.stringify(req.data));
            const HeaderID = req.data.DiversionId;
            const PurchaseOrder = req.data.purchaseOrderNumber;
            const PurchaseOrderItem = req.data.PurchaseOrderItem;

            const Diversion_Data = await tx.run(SELECT.one(MNET_DiversionHeader).where({ ID: HeaderID }).columns('MNET_No', 'Mnet_Line', 'Container_ID', 'Purchase_order', 'PO_Line', 'houseBOLNumber', 'MNET_ID'));

            const MNET_No = Diversion_Data.MNET_No;
            const Mnet_Line = Diversion_Data.Mnet_Line;
            const Container_ID = Diversion_Data.Container_ID;
            const Purchase_order = Diversion_Data.Purchase_order;
            const PO_Line = Diversion_Data.PO_Line;
            const houseBOLNumber = Diversion_Data.houseBOLNumber;
            const MNET_ID = Diversion_Data.MNET_ID;
            const Output = "SELECT NewPurchasing_Order,NewPOLine,NewQuantity,UnitPrice,PartUnitOfMeasurement,ExtendedCost from Diversion.MNET_DiversionDetail where ID_ID = '" + [HeaderID] + "' and NewPurchasing_Order='" + PurchaseOrder + "' and NewPOLine='" + PurchaseOrderItem + "'";
            let query = cds.parse.cql(Output);
            let result = await tx.run(query);
            // log.cfLoggingMessages('info', JSON.stringify(result));

            for (const oudata of result) {
                const NewPurchasing_Order = oudata.NewPurchasing_Order;
                const NewPOLine = oudata.NewPOLine;
                const NewQuantity = oudata.NewQuantity;
                // const UnitPrice = oudata.UnitPrice;
                // const UOM = oudata.PartUnitOfMeasurement;
                // const ExtendedCost = oudata.ExtendedCost;
                // //  log.cfLoggingMessages('info', "NewPurchasing_Order:" + NewPurchasing_Order + "NewPOLine:" + NewPOLine + "NewQuantity:" + NewQuantity);
                await V_IBD_Posting_Diversion(req, MNET_No, houseBOLNumber, MNET_ID, Mnet_Line, Container_ID, Purchase_order, PO_Line, NewPurchasing_Order, NewPOLine, NewQuantity);
            }
        }
        catch (error) {
            log.cfLoggingMessages('error', 'Error in Diversion Line Reprocess' + error)
            req.error({
                code: '400',
                message: error.message,
                target: 'IBD_Posting',
                status: 418
            })
        }
    }
    const V1_INV_Posting_Diversion = async (req) => {
        try {
            // log.cfLoggingMessages('debug', 'Diversion Reprocess' + JSON.stringify(req.data))
            const tx = cds.tx(req);
            //  log.cfLoggingMessages('info', JSON.stringify(req.data));
            const HeaderID = req.data.DiversionId;
            const PurchaseOrder = req.data.purchaseOrderNumber;
            const PurchaseOrderItem = req.data.PurchaseOrderItem;

            const Diversion_Data = await tx.run(SELECT.one(MNET_DiversionHeader).where({ ID: HeaderID }).columns('MNET_No', 'Mnet_Line', 'Container_ID', 'Purchase_order', 'PO_Line', 'houseBOLNumber', 'MNET_ID'));

            const MNET_No = Diversion_Data.MNET_No;
            const Mnet_Line = Diversion_Data.Mnet_Line;
            const Container_ID = Diversion_Data.Container_ID;
            const Purchase_order = Diversion_Data.Purchase_order;
            const PO_Line = Diversion_Data.PO_Line;
            const houseBOLNumber = Diversion_Data.houseBOLNumber;
            const MNET_ID = Diversion_Data.MNET_ID;
            const Output = "SELECT NewPurchasing_Order,NewPOLine,NewQuantity,UnitPrice,PartUnitOfMeasurement,ExtendedCost from Diversion.MNET_DiversionDetail where ID_ID = '" + [HeaderID] + "' and NewPurchasing_Order='" + PurchaseOrder + "' and NewPOLine='" + PurchaseOrderItem + "'";
            let query = cds.parse.cql(Output);
            let result = await tx.run(query);
            // log.cfLoggingMessages('info', JSON.stringify(result));

            for (const oudata of result) {
                const NewPurchasing_Order = oudata.NewPurchasing_Order;
                const NewPOLine = oudata.NewPOLine;
                const NewQuantity = oudata.NewQuantity;
                // const UnitPrice = oudata.UnitPrice;
                // const UOM = oudata.PartUnitOfMeasurement;
                const ExtendedCost = oudata.ExtendedCost;
                //  log.cfLoggingMessages('info', "NewPurchasing_Order:" + NewPurchasing_Order + "NewPOLine:" + NewPOLine + "NewQuantity:" + NewQuantity);
                await V_Invoice_Posting_Diversion(req, MNET_No, houseBOLNumber, MNET_ID, Mnet_Line, Container_ID, Purchase_order, PO_Line, NewPurchasing_Order, NewPOLine, NewQuantity, ExtendedCost);
            }
        }
        catch (error) {
            log.cfLoggingMessages('error', 'Error in Diversion Line Reprocess' + error)
            req.error({
                code: '400',
                message: error.message,
                target: 'IBD_Posting',
                status: 418
            })
        }
    }
    const V1_GR_Posting_Diversion = async (req) => {
        try {
            // log.cfLoggingMessages('debug', 'Diversion Reprocess' + JSON.stringify(req.data))
            const tx = cds.tx(req);
            //  log.cfLoggingMessages('info', JSON.stringify(req.data));
            const HeaderID = req.data.DiversionId;

            const Diversion_Data = await tx.run(SELECT.one(MNET_DiversionHeader).where({ ID: HeaderID }).columns('MNET_No', 'Mnet_Line', 'Container_ID', 'Purchase_order', 'PO_Line', 'houseBOLNumber', 'MNET_ID'));

            // const MNET_No = Diversion_Data.MNET_No;
            // const Mnet_Line = Diversion_Data.Mnet_Line;
            // const Container_ID = Diversion_Data.Container_ID;
            const Purchase_order = Diversion_Data.Purchase_order;
            // const PO_Line = Diversion_Data.PO_Line;
            const houseBOLNumber = Diversion_Data.houseBOLNumber;
            const MNET_ID = Diversion_Data.MNET_ID;

            // for (const oudata of result) { 
            await V_GR_Posting_Diversion(req, houseBOLNumber, Purchase_order, MNET_ID);
            //  }
        }
        catch (error) {
            log.cfLoggingMessages('error', 'Error in Diversion Line Reprocess' + error)
            req.error({
                code: '400',
                message: error.message,
                target: 'IBD_Posting',
                status: 418
            })
        }
    }

    this.on('Inbound_Posting', async req => {
        try {

            log.cfLoggingMessages('debug', 'Inbound_Posting -> ' + req)
            // const tx = cds.tx(req);
            const BOL = req.data.houseBOLNumber;
            const PO = req.data.purchaseOrderNumber;
            const ID = req.data.ID;
            const INV = req.data.invID;
            const ActID = req.data.ActID;
            if (ActID == "U") {
                await V1_IBD_Posting_Diversion(req);
            } else {
                await V1_IBD_Posting(req, BOL, PO, ID, INV);
            }
            return true;

        }
        catch (e) {
            log.cfLoggingMessages('error', 'Error in Inbound_Posting' + e);
            req.error({
                code: '400',
                message: e.message,
                target: 'V_IBD_Posting',
                status: 418
            })
            return false;
        }

    })

    const V1_IBD_Posting = async (req, BOL, PO, ID, INV) => {
        try {
            const db = await cds.connect.to('db');
            const tx = db.tx();
            log.cfLoggingMessages('debug', 'V1_IBD_Posting BOL' + BOL)
            log.cfLoggingMessages('debug', 'V1_IBD_Posting PO' + PO)
            log.cfLoggingMessages('debug', 'V1_IBD_Posting ID' + ID)
            log.cfLoggingMessages('debug', 'V1_IBD_Posting INV' + INV)
            const date = new Date();
            let day = (date.getDay()).toString();
            let month = date.getMonth() + 1;
            let year = date.getFullYear();
            let lmonth = month.length;
            let lday = day.length;
            let vmonth = null;
            let vday = null
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
            log.cfLoggingMessages('info', 'v_date : -' + v_date);
            let v_post_flag = 0;

            let result = await SELECT.distinct.from(GET_MNET_Data_Detail).
                where({
                    // BillOfLading: BOL,
                    SupplierInvoice: INV,
                    Purchasing_order: PO
                    // ID: ID,
                }).and(`(BTP_IBDStatus = '' OR BTP_IBDStatus = ' ' OR BTP_IBDStatus = 'E' OR BTP_IBDStatus IS NULL)`)
                .and(`(Status = 'E' OR Status = 'O')`)
                .columns('houseBOLNumber_ID', 'Purchasing_order', 'containerID', 'ETA', 'BillofLanding', 'TRATY', 'SupplierInvoice',
                    'Vender', 'supplierID',
                    'Original_Material','Folder_No');
            log.cfLoggingMessages('debug', 'GET_MNET_DATA_Detail.result.IBD -> ' + JSON.stringify(result));
            for (const oudata of result) {
                // let partsSubErr = false;
                // const v_BOL_ID = ID;
                let v_BOL_ID = oudata.houseBOLNumber_ID;
                let V_BOL = oudata.BillofLanding;
                let V_INVID = oudata.SupplierInvoice;
                let V_CONID = oudata.containerID;
                let V_PO = oudata.Purchasing_order;
                let V_ObjType = 'InboundDelivery';
                let V_supplierID = oudata.Vender;
                let initialDestinationETA = oudata.ETA;
                let V_TRATY = oudata.TRATY;
                let v_importShipmentNumber = oudata.Folder_No;
                // const PASCOriginalPartsNbr = oudata.Original_Material;
                // const supplierPartID = oudata.supplierID;

                log.cfLoggingMessages('debug', 'v_BOL_ID.IBD -> ' + (v_BOL_ID));
                log.cfLoggingMessages('debug', 'V_BOL.IBD -> ' + (V_BOL));
                log.cfLoggingMessages('debug', 'V_INVID.IBD -> ' + (V_INVID));
                log.cfLoggingMessages('debug', 'V_CONID.IBD -> ' + (V_CONID));
                log.cfLoggingMessages('debug', 'V_PO.IBD -> ' + (V_PO));
                log.cfLoggingMessages('debug', 'V_ObjType.IBD -> ' + (V_ObjType));

                // log.cfLoggingMessages('info', 'RESULT OF GET_MNET_DATA_DETAIL ' + (oudata));
                log.cfLoggingMessages('info', 'RESULT OF GET_MNET_DATA_DETAIL IBD_Posting ' + JSON.stringify(oudata));
                //MNET_ACTION
                let action_result = await SELECT.distinct.from(MNET_ACTION).where({ BOLID: v_BOL_ID, BOL: V_BOL, INVID: V_INVID, CONID: V_CONID, PO: V_PO, OBJECTTYPE: V_ObjType }).columns('ACTION', 'DOCNUM', 'DATE', 'FISCALYEAR', 'REVERSALREASON', 'OBJECTTYPE', 'RID').orderBy('RID');
                log.cfLoggingMessages('info', 'action_result -> ' + JSON.stringify(action_result));
                for (const oData_Action of action_result) {


                    v_post_flag = v_post_flag + 1;
                    log.cfLoggingMessages('info', 'v_post_flag -> ' + (v_post_flag));

                    var inv_post = {
                        "BOLID": v_BOL_ID,     //added by Preethi for defect 215 on 21/02
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
                    };
                    log.cfLoggingMessages('debug', 'IBD JSON 1: - ' + JSON.stringify(inv_post));

                    const V_DocNum = oData_Action.DOCNUM;
                    const V_Action = oData_Action.ACTION;
                    const V_GRObjType = 'GoodsReceipt';

                    let gr_action_result = await SELECT.distinct.from(MNET_ACTION).where({ BOLID: v_BOL_ID, BOL: V_BOL, INVID: V_INVID, CONID: V_CONID, PO: V_PO, OBJECTTYPE: V_GRObjType, DOCNUM: V_DocNum }).columns('ACTION', 'DOCNUM', 'DATE', 'FISCALYEAR', 'REVERSALREASON', 'OBJECTTYPE', 'RID').orderBy('RID');
                    log.cfLoggingMessages('debug', 'gr_action_result -> ' + JSON.stringify(gr_action_result));
                    for (const oData_Action_gr of gr_action_result) {
                        v_post_flag = v_post_flag + 1;

                        inv_post.Action.push({
                            "Action": oData_Action_gr.ACTION,
                            "DocNum": oData_Action_gr.DOCNUM,
                            "Date": oData_Action_gr.DATE,
                            "FiscalYear": oData_Action_gr.FISCALYEAR,
                            "ReversalReason": oData_Action_gr.REVERSALREASON,
                            "ObjectType": "GoodsReceipt"
                        });
                    }

                    inv_post.Action.push({
                        "Action": oData_Action.ACTION,
                        "DocNum": oData_Action.DOCNUM,
                        "Date": oData_Action.DATE,
                        "FiscalYear": oData_Action.FISCALYEAR,
                        "ReversalReason": oData_Action.REVERSALREASON,
                        "ObjectType": "InboundDelivery"
                    });

                    log.cfLoggingMessages('debug', 'IBD JSON 2: - ' + JSON.stringify(inv_post));
                    //MNET_DeliveryDocumentItem
                    log.cfLoggingMessages('info', 'MNET_DeliveryDocumentItem v_BOL_ID : ' + v_BOL_ID + ' V_BOL: ' + V_BOL + ' V_INVID: ' + V_INVID + ' V_CONID: ' + V_CONID + ' V_PO: ' + V_PO + ' V_Action: ' + V_Action + ' V_DocNum: ' + V_DocNum);
                    let item_result = await SELECT.distinct.from(GET_MNET_DeliveryDocumentItem).where({ BOLID: v_BOL_ID, BOL: V_BOL, INVID: V_INVID, CONID: V_CONID, PO: V_PO, Action: V_Action, IBD_NO: V_DocNum }).columns('Action', 'IBD_NO', 'IBD_LINE', 'lineNumber', 'Material', 'PurchaseOrder', 'PurchaseOrderItem', 'QuantityInPurchaseOrderUnit', 'ActualDeliveryQuantity', 'Batch', 'Plant', 'ReferenceSDDocument', 'ReferenceSDDocumentItem', 'InventoryValuationType', 'status', 'PASCOriginalPartsNbr', 'PASCOrderItemNbr', 'SupplierMaterialNumber', 'supplierPartID').orderBy('PurchaseOrderItem');
                    log.cfLoggingMessages('debug', 'item_result -> ' + JSON.stringify(item_result));
                    const filteredArray = item_result.filter(item => item.PurchaseOrderItem != null && item.status == 'E' && item.supplierPartID == item.SupplierMaterialNumber);
                    // const filteredArray = item_result.filter(item => (item.status == 'E'|| (item.BTP_IBDStatus == 'S' && item.BTP_IBDAction == 'D')));
                    log.cfLoggingMessages('debug', 'if FilteredArray' + filteredArray);

                    for (const oData_item_result of filteredArray) {
                        let PASCOriginalPartsNbr = oData_item_result.PASCOriginalPartsNbr;
                        let PASCOrderItemNbr = oData_item_result.PASCOrderItemNbr;
                        let PurchaseOrderItem = oData_item_result.PurchaseOrderItem;
                        if (PASCOriginalPartsNbr == null || (PASCOriginalPartsNbr != null && PASCOrderItemNbr != PurchaseOrderItem)) {
                            log.cfLoggingMessages('debug', 'PurchaseOrderItem:' + PurchaseOrderItem + ",PASCOrderItemNbr:" + PASCOrderItemNbr);
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
                    // }
                    log.cfLoggingMessages('debug', 'Dashboard IBD JSON 3: - ' + JSON.stringify(inv_post));
                    let length = inv_post.A_DeliveryDocumentItem.length;
                    log.cfLoggingMessages('debug', 'Dashboard length IBD JSON 3: - ' + JSON.stringify(length));
                    if (length > 0) {
                        // log.cfLoggingMessages('info', 'v_post_flag - ' + v_post_flag);
                        // if (v_post_flag > 0) {
                        try {
                            ////// Call CPI API 
                            //Declarations 
                            const CPI_URL_Data = await SELECT.one(Environment).where({ APPID: 'CPI_IBD' }).columns('URL', 'tokenUrl', 'clientId', 'clientSecret');
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

                                log.cfLoggingMessages('debug', 'IBD response1 -> ' + JSON.stringify(response1.data));

                            }).catch(error => {
                                log.cfLoggingMessages('error', 'IBD error V1_IBD_Posting -> ' + JSON.stringify(error.response.data));
                            });
                            // log.cfLoggingMessages('info','response1 - ' + response1.status);
                        }
                        catch (error) {
                            log.cfLoggingMessages('error', 'Error in V1_IBD_Posting' + error.message);
                        }
                    }
                    // }//
                }


            }
            return true;
        }
        catch (error) {
            log.cfLoggingMessages('error', 'Error => V1_IBD_Posting' + error);
        }
    }

    this.on('ASN_DIPosting', async req => {
        try {

            log.cfLoggingMessages('debug', 'ASN_DIPosting-> ' + JSON.stringify(req.data));
            const tx = cds.tx(req);
            const BOL = req.data.houseBOLNumber;
            const PO = req.data.purchaseOrderNumber;
            let IBDNum = req.data.IBDNum;
            log.cfLoggingMessages('info', 'ASN_DI 1146->' + IBDNum);
            let IBDLineNum = req.data.IBDLineNum;
            let SelectQuery1 = "SELECT Distinct ZINB_BOLID,houseBOLNumber,importShipmentNumber,invoiceNumber,containerID,ObjectRefNo,purchaseOrderNumber,PurchaseOrderItem,deliveryDocument,TRAID,ZTMODE,ZVESSEL,ZFOLDERNO,ZRECTYPE,ZVOYAGE_NO,ZBOL_DEST,ZORDERERID,ZCUSTPONO,ZCAFACNUM,ZSTATUS,ZSAPLINEIDIBD,ZINVLINENO,ZMECAPONO,ZFINVLINEQTY,ZNOOFCASE,ZQUANPERCASE,LIFEX,ZADDINVENO,ZSALESORDNO,ZUNIFIEDMODELNO,ZASNDIV,ZCARRID,POTIM,DC,WHSE,ALTKN,TDSPRAS,EXPIRY_DATE_EXT,EXPIRY_DATE_EXT_B,ZCARR_ASN,ZINBTYPE,ZDIARIND,TDLINE1,TDLINE2,PODAT,PARTNER_ID,JURISDIC,LANGUAGE,ZDELVTONAME,ZSTREET1,ZSTREET2,ZSTREET4,ZPOSTALCODE,ZCITY1,ZSTATE,ZCOUNTRY,NAME1,NAME2,STREET1,POSTL_COD1,CITY1,CITY2,COUNTRY1,REGION,ZCARACT,NewPurchasing_Order,Purchasinggroup,TRATY From MNET_Dashboard.MNET_WebMethod Where TRAID = " + "'" + BOL + "' And purchaseOrderNumber = " + "'" + PO + "' And ObjectRefNo = '"+IBDNum+"' ORDER BY houseBOLNumber, containerID, ObjectRefNo, deliveryDocument, purchaseOrderNumber, PurchaseOrderItem";    //added order by for 165 defect by Preethi on 09/01/24";
            let query = cds.parse.cql(SelectQuery1);
            let ASN_DI_post = await tx.run(query);

            // log.cfLoggingMessages('info', 'SelectQuery1->' + SelectQuery1);
            log.cfLoggingMessages('info', 'ASN_DI_post 1153->' + JSON.stringify(ASN_DI_post));

            // log.cfLoggingMessages('info', 'ASN_DI ->' + ASN_DI_post);
            //added by Kanchan defect 185 19/1/24
            for (var data1 = 0; data1 < ASN_DI_post.length; data1++) {
                log.cfLoggingMessages('debug', "data_ASN_DI_post_loop" + data1);
                let update;
                if (ASN_DI_post[data1].ZSTATUS === 'C') {
                    update = 'A';

                    ASN_DI_post[data1].ZSTATUS = update;
                    //  log.cfLoggingMessages('info', "update==>", update);
                }
                else if (ASN_DI_post[data1].ZSTATUS === 'D') {
                    update = 'D';

                    ASN_DI_post[data1].ZSTATUS = update;
                    // log.cfLoggingMessages('info', "update==>", update);

                }
                //Asif changes 10-02
                else if (ASN_DI_post[data1].ZSTATUS === 'U') {
                    update = 'M';

                    ASN_DI_post[data1].ZSTATUS = update;
                    // log.cfLoggingMessages('info', "update==>", update);
                }
                //Asif changes 10-02
                else if (ASN_DI_post[data1].ZSTATUS != 'C' && ASN_DI_post[data1].ZSTATUS != 'D') {
                    update = 'M';

                    ASN_DI_post[data1].ZSTATUS = update;
                    //  log.cfLoggingMessages('info', "update==>", update);

                }
            }

            //end added by Kanchan defect 185 19/1/24       
            ////// Call CPI API
            //Declarations

            const CPI_URL_Data = await SELECT.one(Environment).where({ APPID: 'CPI_ASN_DI' }).columns('URL', 'tokenUrl', 'clientId', 'clientSecret');
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

                data: ASN_DI_post

            }).then(response1 => {

                log.cfLoggingMessages('debug', 'response1 -> ' + JSON.stringify(response1.data));

            }).catch(error => {
                log.cfLoggingMessages('error', 'error -> ASN_DIPosting' + JSON.stringify(error.response.data));
            });

            log.cfLoggingMessages('debug', "ASN_DI_post:" + JSON.stringify(ASN_DI_post));
            return true;
        }
        catch (error) {
            log.cfLoggingMessages('error', 'Error in ASN_DIPosting' + error);
            req.error
                ({
                    code: '400',
                    message: error.message,
                    target: 'some_field',
                    status: 418
                })
        }
    })
    /*
    For Diversion Scenario U Line Reporcess
    Date: 03-06-2024
    Author: Bhushan
    Code Begins
    */
    // const V1_Posting_Diversion = async (req) => {
    //     try {
    //         log.cfLoggingMessages('debug', 'Diversion Reprocess' + JSON.stringify(req.data))
    //         const tx = cds.tx(req);
    //         //  log.cfLoggingMessages('info', JSON.stringify(req.data));
    //         const HeaderID = req.data.DiversionId;
    //         /*diverted po and poline to post only selected line
    //           05-06-2024 
    //           CS
    //         */
    //         const PurchaseOrder = req.data.purchaseOrderNumber;
    //         const PurchaseOrderItem = req.data.PurchaseOrderItem;
    //         /*diverted po and poline to post only selected line
    //           05-06-2024 
    //           CE
    //         */
    //         const Diversion_Data = await tx.run(SELECT.one(MNET_DiversionHeader).where({ ID: HeaderID }).columns('MNET_No', 'Mnet_Line', 'Container_ID', 'Purchase_order', 'PO_Line', 'houseBOLNumber', 'MNET_ID'));
    //         // log.cfLoggingMessages('info', JSON.stringify(Diversion_Data));

    //         const MNET_No = Diversion_Data.MNET_No;
    //         const Mnet_Line = Diversion_Data.Mnet_Line;
    //         const Container_ID = Diversion_Data.Container_ID;
    //         const Purchase_order = Diversion_Data.Purchase_order;
    //         const PO_Line = Diversion_Data.PO_Line;
    //         const houseBOLNumber = Diversion_Data.houseBOLNumber;
    //         const MNET_ID = Diversion_Data.MNET_ID;
    //         // log.cfLoggingMessages('info', "MNET_No:" + MNET_No + "Mnet_Line:" + Mnet_Line + "Container_ID:" + Container_ID + "Purchase_order:" + Purchase_order + "PO_Line:" + PO_Line);

    //         /*filterd by diverted po and poline to post only selected line
    //          05-06-2024 
    //        */
    //         const Output = "SELECT NewPurchasing_Order,NewPOLine,NewQuantity,UnitPrice,PartUnitOfMeasurement,ExtendedCost from Diversion.MNET_DiversionDetail where ID_ID = '" + [HeaderID] + "' and NewPurchasing_Order='" + PurchaseOrder + "' and NewPOLine='" + PurchaseOrderItem + "'";
    //         let query = cds.parse.cql(Output);
    //         let result = await tx.run(query);
    //         // log.cfLoggingMessages('info', JSON.stringify(result));

    //         for (const oudata of result) {
    //             const NewPurchasing_Order = oudata.NewPurchasing_Order;
    //             const NewPOLine = oudata.NewPOLine;
    //             const NewQuantity = oudata.NewQuantity;
    //             const UnitPrice = oudata.UnitPrice;
    //             const UOM = oudata.PartUnitOfMeasurement;
    //             const ExtendedCost = oudata.ExtendedCost;
    //             //  log.cfLoggingMessages('info', "NewPurchasing_Order:" + NewPurchasing_Order + "NewPOLine:" + NewPOLine + "NewQuantity:" + NewQuantity);
    //             await V_IBD_Posting_Diversion(req, MNET_No, houseBOLNumber, MNET_ID, Mnet_Line, Container_ID, Purchase_order, PO_Line, NewPurchasing_Order, NewPOLine, NewQuantity);
    //             // CS for checking paymentconditiontype FR dnt process Inv
    //             let ZINVICE = null;
    //             const result = await SELECT.distinct.from(GET_MNET_DATA).where({ houseBOLNumber: houseBOLNumber, purchaseOrderNumber: Purchase_order }).columns('houseBOLNumber', 'purchaseOrderNumber', 'recordType', 'shipMethod', 'paymentConditionCode', 'POType', 'ID');
    //             for (const oudata of result) {
    //                 const recordType = oudata.recordType;
    //                 var shipMethod = oudata.shipMethod;
    //                 const paymentConditionCode = oudata.paymentConditionCode;
    //                 const POType = oudata.POType;
    //                 const id = oudata.ID;
    //                 //defect 204 first point 7/2/2023ZMNETMODE 
    //                 if (shipMethod === null || shipMethod === '') {
    //                     const resultBolHeader = await SELECT.from(bolHeader).where({ houseBOLNumber: houseBOLNumber, ID: id }).columns('modeOfTransport');
    //                     // log.cfLoggingMessages('info', 'resultBolHeader -> ' + resultBolHeader);
    //                     const modeoftransport = resultBolHeader[0].modeOfTransport;
    //                     // log.cfLoggingMessages('info', 'modeoftransport -> ' + modeoftransport);
    //                     const resultzmnetmode = await SELECT.from`BTP_PANASONIC.ZMNETMODE`.columns`ZSHIPMETHOD`.where`TMODE =${modeoftransport}`;
    //                     // log.cfLoggingMessages('info', 'resultzmnetmode -> ' + resultzmnetmode);
    //                     shipMethod = resultzmnetmode[0].ZSHIPMETHOD;
    //                     // log.cfLoggingMessages('info', 'shipMethodnullvalue -> ' + shipMethod);
    //                 }
    //                 // Adjusted the code based on ZMNET_BUSINESS table to consider blank as CM
    //                 var tmp_zpayconcode = '';
    //                 if (paymentConditionCode === 'FR') {
    //                     tmp_zpayconcode = 'FR';
    //                 }

    //                 const result = await SELECT.distinct.from(ZMNETBUSINESS).where({ ZRECTYPE: recordType, ZSHIPMETHOD: shipMethod, ZPOIND: POType, ZPAYCONCODE: tmp_zpayconcode });
    //                 // log.cfLoggingMessages('info', "ZMNET_Bresult" + JSON.stringify(result));

    //                 ZPAYCONCODE = result[0].ZPAYCONCODE;
    //                 ZINBD_DLVY = result[0].ZINBD_DLVY;
    //                 ZINVICE = result[0].ZINVICE;
    //                 ZGOODS_RECEIPT = result[0].ZGOODS_RECEIPT;
    //                 ZDLVY_INSTR = result[0].ZDLVY_INSTR;
    //                 ZANCITIPATED_REC = result[0].ZANCITIPATED_REC;
    //                 ZASN = result[0].ZASN;
    //                 // log.cfLoggingMessages('info', "Business ", ZPAYCONCODE, ZINBD_DLVY, ZINVICE, ZGOODS_RECEIPT, ZDLVY_INSTR, ZANCITIPATED_REC, ZASN);
    //             }
    //             //CE
    //             if (ZINVICE === 'Y') {
    //                 await V_Invoice_Posting_Diversion(req, MNET_No, houseBOLNumber, MNET_ID, Mnet_Line, Container_ID, Purchase_order, PO_Line, NewPurchasing_Order, NewPOLine, NewQuantity, ExtendedCost);
    //             }
    //             // await V_Invoice_Posting_Diversion(req, MNET_No, houseBOLNumber, MNET_ID, Mnet_Line, Container_ID, Purchase_order, PO_Line, NewPurchasing_Order, NewPOLine, NewQuantity);
    //             // await v_ASNDI_POSTING(req, houseBOLNumber, NewPurchasing_Order); // uncommented for defect 169 on 16/01 by Preethi 
    //             await GR_Posting_Diversion(req, houseBOLNumber, Purchase_order, MNET_ID);

    //         }
    //     }
    //     catch (error) {
    //         log.cfLoggingMessages('error', 'Error in Diversion Line Reprocess' + error)
    //         req.error({
    //             code: '400',
    //             message: error.message,
    //             target: 'Invoice_Posting',
    //             status: 418
    //         })
    //     }
    // }
    const V_Invoice_Posting_Diversion = async (req, MNET_No, houseBOLNumber, MNET_ID, Mnet_Line, Container_ID, Purchase_order, PO_Line, NewPurchasing_Order, NewPOLine, NewQuantity, ExtendedCost) => {
        try {
            const db = await cds.connect.to('db');
            const tx = db.tx();

            const date = new Date();
            let day1 = (date.getDay()).toString(); // Kowsalyaa For NoOfDays Issue
            let month = (date.getMonth() + 1).toString();
            let year = date.getFullYear();
            let lmonth = month.length;
            let lday = day1.length;
            let vmonth = null;
            let vday = null;
            // log.cfLoggingMessages('info', "day:" + day1 + "lday:" + lday);
            // log.cfLoggingMessages('info', "month:" + month + "lmonth:" + lmonth);
            if (lmonth != 2) {
                vmonth = '0' + month.toString();
            }
            else {
                vmonth = month.toString();
            }
            if (lday != 2) {
                vday = '0' + day1.toString();
            }
            else {
                vday = day1.toString();
            }
            let v_date = year + '-' + vmonth + '-' + vday + 'T00:00:00';
            // log.cfLoggingMessages('info', 'INV v_date : -' + v_date);
            

            let result = await tx.run(SELECT.from(GET_MNET_DATA).where({ ID: MNET_ID, houseBOLNumber: houseBOLNumber, invoiceNumber: MNET_No, lineNumber: Mnet_Line, containerID: Container_ID, purchaseOrderNumber: Purchase_order, PO_ITEMID: PO_Line }));
            // log.cfLoggingMessages('info', JSON.stringify(result));
            for (const oData of result) {
                let v_importShipmentNumber = oData.importShipmentNumber;
                let PO_Result = await tx.run(SELECT.from(GET_PO_DATA).where({ PurchaseOrder: NewPurchasing_Order, PurchaseOrderItem: NewPOLine }));
                // log.cfLoggingMessages('info', "PO_Result =>" + JSON.stringify(PO_Result));
                for (const oPODATA of PO_Result) {
                    var inv_post = {
                        "BOLID": oData.ID, // Asif 03-05
                        "importShipmentNumber": v_importShipmentNumber,
                        "houseBOLNumber": oData.houseBOLNumber,
                        "invoiceNumber": oData.invoiceNumber,
                        "containerID": oData.containerID,
                        "CompanyCode": oPODATA.CompanyCode, // PO
                        "SupplierInvoiceIDByInvcgParty": oData.invoiceNumber,
                        "DocumentDate": v_date,
                        "PostingDate": v_date,
                        "InvoicingParty": oPODATA.Supplier, //PO   // Preethi changed on 15/12 for #170
                        "DocumentCurrency": oData.invoiceCurrencyCode,
                        "InvoiceGrossAmount": ExtendedCost,//oData.extendedCost,
                        "DueCalculationBaseDate": v_date,
                        Action: [],
                        SuplrInvcItemPurOrdRef: []
                    };

                    log.cfLoggingMessages('debug', 'JSON 1 : - ' + JSON.stringify(inv_post));
                    inv_post.Action.push({
                        "BOLID": oData.ID, // Asif 03-05
                        "Action": "C",
                        "DocNum": null,
                        "Date": null,
                        "FiscalYear": null,
                        "ReversalReason": null,
                        "ObjectType": "Invoice"
                    });
                    log.cfLoggingMessages('debug', 'JSON 2 : - ' + JSON.stringify(inv_post));
                    log.cfLoggingMessages('info', 'before_qtyperSLS-');
                    let new_qtyPerSLSUnitPricePackType = await SELECT.from(A_PurchaseOrderItem).where({ PurchaseOrder_PurchaseOrder: oPODATA.PurchaseOrder, PurchaseOrderItem: oPODATA.PurchaseOrderItem }).columns('PurchaseOrderQuantityUnit','OrderPriceUnit');
                    log.cfLoggingMessages('info', 'after_qtyperSLS - ' + JSON.stringify(new_qtyPerSLSUnitPricePackType));
                    inv_post.SuplrInvcItemPurOrdRef.push({
                        "lineNumber": oData.lineNumber,
                        "Material": oPODATA.Material, // PO
                        "PurchaseOrder": oPODATA.PurchaseOrder, // PO
                        "PurchaseOrderItem": oPODATA.PurchaseOrderItem, //PO
                        "QuantityInPurchaseOrderUnit": NewQuantity,
                        "SupplierInvoiceItem": "1",
                        "Plant": oPODATA.Plant, //PO
                        "TaxCode": "I0",
                        "DocumentCurrency": oData.invoiceCurrencyCode,
                        "SupplierInvoiceItemAmount": ExtendedCost,// oData.extendedCost,
                        // "PurchaseOrderQuantityUnit": oData.partUnitOfMeasurement,
                        "PurchaseOrderQuantityUnit":new_qtyPerSLSUnitPricePackType[0].OrderPriceUnit, // changed for the Uom error 
                        // "qtyPerSLSUnitPricePackType": oData.qtyPerSLSUnitPricePackType,  // uncommented on 15/12 by Preethi for #170
                        "qtyPerSLSUnitPricePackType":new_qtyPerSLSUnitPricePackType[0].PurchaseOrderQuantityUnit,// changed for the Uom error 
                        "QuantityInPurchaseOrderUnit": NewQuantity,
                        "SupplierInvoiceItemText": oData.lineNumber
                    })

                    log.cfLoggingMessages('debug', 'JSON 3: - ' + JSON.stringify(inv_post));
                    /** Srinivas Added Begin */
                    log.cfLoggingMessages('debug', 'JSON 4.5: - ' + JSON.stringify(inv_post));
                    /** Srinivas Added End */

                    ////// Call CPI API 
                    //Declarations 
                    const CPI_URL_Data = await SELECT.one(Environment).where({ APPID: 'CPI_Invoice' }).columns('URL', 'tokenUrl', 'clientId', 'clientSecret');
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
                    log.cfLoggingMessages('info' + bearerToken);
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

                        log.cfLoggingMessages('debug', 'response1 (Diversion Reprocess) -> ' + JSON.stringify(response1.data));

                    }).catch(error => {
                        log.cfLoggingMessages('error', 'error in  V_Invoice_Posting_Diversion(Diversion Reprocess) in cpi call' + JSON.stringify(error.response.data));
                    });
                    //log.cfLoggingMessages('info','response1 - ' + response1.status);
                }

            }


        }
        catch (e) {
            log.cfLoggingMessages('error', 'error in  V_Invoice_Posting_Diversion (Diversion Reprocess)' + JSON.stringify(e));
            req.error({
                code: '400',
                message: e.message,
                target: 'V_Invoice_Posting',
                status: 418
            })
        }
    }

    const V_IBD_Posting_Diversion = async (req, MNET_No, houseBOLNumber, MNET_ID, Mnet_Line, Container_ID, Purchase_order, PO_Line, NewPurchasing_Order, NewPOLine, NewQuantity) => {
        try {
            const db = await cds.connect.to('db');
            const tx = db.tx();

            const date = new Date();
            let day1 = date.getDay();
            let month = date.getMonth() + 1;
            let year = date.getFullYear();
            let lmonth = month.length;
            let lday = day1.length;
            let vmonth = null;
            let vday = null;
            // log.cfLoggingMessages('info', "day:" + day1 + "lday:" + lday);
            // log.cfLoggingMessages('info', "month:" + month + "lmonth:" + lmonth);
            if (lmonth != 2) {
                vmonth = '0' + month.toString();
            }
            else {
                vmonth = month.toString();
            }
            if (lday != 2) {
                vday = '0' + day1.toString();
            }
            else {
                vday = day1.toString();
            }
            // let v_date = year + '-' + vmonth + '-' + vday + 'T00:00:00';
            // log.cfLoggingMessages('info', 'IBD v_date : -' + v_date);
            const result = await tx.run(SELECT.distinct.from(GET_MNET_DATA).where({ ID: MNET_ID, houseBOLNumber: houseBOLNumber, invoiceNumber: MNET_No, lineNumber: Mnet_Line, containerID: Container_ID, purchaseOrderNumber: Purchase_order, PO_ITEMID: PO_Line }));
            // log.cfLoggingMessages('info', JSON.stringify(result));
            for (const oudata of result) {
                const initialDestinationETA = oudata.initialDestinationETA;
                const CI = oudata.containerID;
                const Supplier = oudata.Supplier;
                let v_importShipmentNumber =oudata.importShipmentNumber;
                // log.cfLoggingMessages('info', 'Supplier_ID' + Supplier);
                // log.cfLoggingMessages('info', 'ETA -> ' + initialDestinationETA);
                // log.cfLoggingMessages('info', 'containerID->' + CI);
                const TRATY = oudata.TRATY;

                let PO_Result = await tx.run(SELECT.from(GET_PO_DATA).where({ PurchaseOrder: NewPurchasing_Order, PurchaseOrderItem: NewPOLine }));
                for (const oPODATA of PO_Result) {
                    const invoiceNumber = oudata.invoiceNumber;
                    // const supplierID = oPODATA.Supplier;
                    // const invoiceCurrencyCode = oudata.invoiceCurrencyCode;
                    //  log.cfLoggingMessages('info', 'invoiceNumber :- ' + invoiceNumber)
                    const purchaseOrderNumber = oPODATA.PurchaseOrder;
                    // log.cfLoggingMessages('info', 'purchaseOrderNumber :- ' + purchaseOrderNumber)

                    var inv_post = {
                        "BOLID": oudata.ID, // Asif 03-05
                        "importShipmentNumber": v_importShipmentNumber,
                        "houseBOLNumber": oudata.houseBOLNumber,
                        "invoiceNumber": invoiceNumber,
                        "containerID": CI,
                        "DeliveryDate": initialDestinationETA + 'T00:00:00',
                        "Supplier": Supplier,  // Asif changes 11/01
                        "BillOfLading": oudata.houseBOLNumber,
                        "MeansOfTransportType": TRATY,
                        "MeansOfTransport": CI,
                        Action: [],
                        A_DeliveryDocumentItem: []
                    };
                    inv_post.Action.push({
                        "BOLID": oudata.ID,  // Asif 03-05
                        "Action": "C",
                        "DocNum": null,
                        "Date": null,
                        "FiscalYear": null,
                        "ReversalReason": null,
                        "ObjectType": "InboundDelivery"
                    });

                    const buyerPartID = oPODATA.Material;
                    const quantity = NewQuantity;
                    const lineNumber = oudata.lineNumber;
                    const l_PurchaseOrderItem = oPODATA.PurchaseOrderItem;
                    const l_Plant = oPODATA.Plant;
                    const V_ValuationType = oudata.ValuationType;

                    log.cfLoggingMessages('debug', 'JSON 2 : - ' + JSON.stringify(inv_post));
                    inv_post.A_DeliveryDocumentItem.push({
                        "Action": "C",
                        "IBD_NO": null,
                        "IBD_LINE": null,
                        "lineNumber": lineNumber,
                        "Material": buyerPartID,
                        "PurchaseOrder": purchaseOrderNumber,
                        "PurchaseOrderItem": l_PurchaseOrderItem,
                        "QuantityInPurchaseOrderUnit": quantity,
                        "ActualDeliveryQuantity": quantity,
                        "Batch": null,
                        "Material": buyerPartID,
                        "Plant": l_Plant,
                        "ReferenceSDDocument": purchaseOrderNumber,
                        "ReferenceSDDocumentItem": l_PurchaseOrderItem,
                        "InventoryValuationType": V_ValuationType
                    })

                }
                log.cfLoggingMessages('debug', 'IBD JSON 3: (Diversion Reprocess) - ' + JSON.stringify(inv_post));

                ////// Call CPI API 
                //Declarations 
                const CPI_URL_Data = await SELECT.one(Environment).where({ APPID: 'CPI_IBD' }).columns('URL', 'tokenUrl', 'clientId', 'clientSecret');
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
                //  log.cfLoggingMessages('info', bearerToken);
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

                    log.cfLoggingMessages('debug', 'response1(IBD Diversion Reprocess) -> ' + JSON.stringify(response1.data));

                }).catch(error => {
                    log.cfLoggingMessages('error', 'error in V_IBD_Posting_Diversion cpi call' + JSON.stringify(error.response.data));
                });

            }///

        }

        catch (e) {
            log.cfLoggingMessages('error', 'Error in V_IBD_Posting_Diversion' + e)
            req.error({
                code: '400',
                message: e.message,
                target: 'V_IBD_Posting',
                status: 418
            })
        }
    }

    const V_GR_Posting_Diversion = async (req, houseBOLNumber, Purchase_order, MNET_ID) => {
        try {
            const tx = cds.tx(req);

            // log.cfLoggingMessages('info', 'BOL -> ' + houseBOLNumber);
            // log.cfLoggingMessages('info', 'PO -> ' + Purchase_order);
            // log.cfLoggingMessages('info', 'ID ->' + MNET_ID);

            const result = await tx.run(SELECT.distinct.from(GetGRData).where({ houseBOLNumber: houseBOLNumber, purchaseOrderNumber: Purchase_order, ID: MNET_ID }).columns('purchaseOrderNumber', 'houseBOLNumber', 'invoiceNumber'));
            // log.cfLoggingMessages('info', JSON.stringify(result));
            for (const oudata of result) {
                const BOL = oudata.houseBOLNumber;
                const invoiceNumber = oudata.invoiceNumber;
                const deliveryDocument = oudata.deliveryDocument;

                var GR_post = {
                    "houseBOLNumber": BOL,
                    "invoiceNumber": invoiceNumber,
                    "deliveryDocument": deliveryDocument
                };
                log.cfLoggingMessages('debug', 'JSON 1 : - ' + JSON.stringify(GR_post));

                ////// Call CPI API 
                //Declarations 
                const CPI_URL_Data = await SELECT.one(Environment).where({ APPID: 'CPI_GR' }).columns('URL', 'tokenUrl', 'clientId', 'clientSecret');
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
                    data: GR_post
                }).then(response1 => {

                    log.cfLoggingMessages('debug', 'response1 ->(Diversion Reprocess) ' + JSON.stringify(response1.data));

                }).catch(error => {
                    log.cfLoggingMessages('error', 'error in GR_Posting_Diversion cpi call ' + JSON.stringify(error.response.data));
                });

            }

            return true;
        }
        catch (error) {
            log.cfLoggingMessages('error', 'Error in GR_Posting_Diversion' + error.message);
            req.error({
                code: '400',
                message: error.message,
                target: 'some_field',
                status: 418
            })
            return false;

        }
    }

    /*
        For Diversion Scenario U Line Reporcess
        Date: 03-06-2024
        Author: Bhushan
        Code Ends
    */
})