const cds = require('@sap/cds');
const axios = require("axios");
const log = require('./util/logger')


module.exports = cds.service.impl(async function () {
    const { Environment, MNET_SuplrInvcItemPurOrdRef } = cds.entities('BTP.Panasonic')
    const { invoiceLine,bolHeader } = cds.entities('BTP.Panasonic')
    const { Get_Reverse } = this.entities;

    /*
    Implementation://Added this VALIDATE_DROPSHIP function to validate the POType during reversal process from dashboard for defect 74 (a) 
    Author:Preethi
    Date:04/07/2024
    Start
    */

    this.on('VALIDATE_DROPSHIP', async (req) => {
        let PO = req.data.PurchaseOrder;
        let dbQuery = "CALL GET_DROPSHIP_STATUS(PO => " + "'" + PO + "'" + ",STATUS => ?)";
        // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
        const result = await cds.run(dbQuery, {});
        log.cfLoggingMessages('debug', 'VALIDATE_DROPSHIP=>GET_DROPSHIP_STATUS=>' + JSON.stringify(result));
        let POType = result.STATUS;
        
        return POType;
    });

    //End

    this.on('Inbound_Reverse', async req => {
        try {

            log.cfLoggingMessages('debug', 'Inbound_Reverse -> ' + req);
            const tx = cds.tx(req);
            const DocNum = req.data.DocNum;
            const houseBOLNumber = req.data.houseBOLNumber;
            const invoiceNumber = req.data.invoiceNumber;
            const PurchaseOrder = req.data.PurchaseOrder;
            const PurchaseOrderItem = req.data.PurchaseOrderItem;
            const GRNum = req.data.GRNum;
            const GRLineNum = req.data.GRLineNum;          //added on 26/12 for GR Reversal by Preethi 
            const BolID = req.data.BolID;

            //added on 26/12 for GR Reversal by Preethi 
            if (GRNum) {
                log.cfLoggingMessages('debug', 'GRDocumnetNumber: -' + GRNum);
                let GDocNum = GRNum;
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
                //  log.cfLoggingMessages('info', 'IBD v_date : -' + v_date);
                //log.cfLoggingMessages('info','v_date : -' + v_date);
                var ObjType = 'InboundDelivery';
                var Status = 'S';
                 // INC0220466 removing bolnumber where clause (houseBOLNumber: houseBOLNumber,)
                const result = await tx.run(SELECT.distinct.from(Get_Reverse).where({ ObjectRefNo: DocNum,  invoiceNumber: invoiceNumber, PurchaseOrder: PurchaseOrder, PurchaseOrderItem: PurchaseOrderItem, ObjectType: ObjType, Status: Status, BOLID: BolID }));
                //let result = await tx.run(SELECT.from(MNetStatusMonitoring).where({ ObjectRefNo: DocNum, ObjectType: ObjType, Status: Status }));
                log.cfLoggingMessages('debug', 'result' + JSON.stringify(result));
                for (const oData of result) {
                    var inv_post = {
                        "BOLID": oData.BOLID,
                        "importShipmentNumber": oData.importShipmentNumber,
                        "houseBOLNumber": oData.houseBOLNumber,
                        "invoiceNumber": oData.invoiceNumber,
                        "containerID": oData.containerID,
                        "DeliveryDate": v_date,
                        "Supplier": null,
                        "BillOfLading": oData.houseBOLNumber,
                        "MeansOfTransportType": null,
                        "MeansOfTransport": null,
                        Action: [],
                        A_DeliveryDocumentItem: []
                    };
                    //  log.cfLoggingMessages('info', 'houseBOLNumber %%%', houseBOLNumber)
                    //  log.cfLoggingMessages('info', 'invoiceNumber &&&', invoiceNumber)
                    ObjType = 'GoodsReceipt';
                    Status = 'S';
                    // INC0220466 removing bolnumber where clause (houseBOLNumber: houseBOLNumber,)
                    const GR_DATA = await tx.run(SELECT.distinct.from(Get_Reverse).where({ ObjectRefNo: DocNum,  invoiceNumber: invoiceNumber, ObjectType: ObjType, Status: Status }).columns('ObjectRefNo', 'GR_DATE'));
                    //  log.cfLoggingMessages('info', 'GR_DATA: - ' + JSON.stringify(GR_DATA));
                    const TotalRec = GR_DATA.length;
                    //  log.cfLoggingMessages('info', "GR_DATA =>" + TotalRec);
                    if (TotalRec > 0) {
                        for (const OData of GR_DATA) {
                            GR_POSTING_FLAG = 'T';
                            const year = OData.GR_DATE.split('-')[0];  // Extracting Year
                            inv_post.Action.push({
                                "Action": "R",
                                "DocNum": GDocNum,
                                "ReverseGRItem": GRLineNum,
                                "Date": year,
                                "FiscalYear": null,
                                "ReversalReason": null,
                                "ObjectType": "GoodsReceipt"
                            });
                        }
                        inv_post.Action.push({
                            "Action": "D",
                            "DocNum": DocNum,
                            "Date": null,
                            "FiscalYear": null,
                            "ReversalReason": null,
                            "ObjectType": "InboundDelivery"
                        });
                    } else {
                        inv_post.Action.push({
                            "Action": "D",
                            "DocNum": DocNum,
                            "Date": null,
                            "FiscalYear": null,
                            "ReversalReason": null,
                            "ObjectType": "InboundDelivery"
                        });
                    }

                    inv_post.A_DeliveryDocumentItem.push({
                        "Action": "D",
                        "IBD_NO": DocNum,
                        "IBD_LINE": oData.SAP_LineID,
                        "lineNumber": oData.lineNumber,
                        "Material": oData.Material,
                        "PurchaseOrder": PurchaseOrder,
                        "PurchaseOrderItem": PurchaseOrderItem,
                        "QuantityInPurchaseOrderUnit": "0",
                        "ActualDeliveryQuantity": "0",
                        "Batch": null,
                        "Plant": null,
                        "ReferenceSDDocument": PurchaseOrder,
                        "ReferenceSDDocumentItem": PurchaseOrderItem,
                        "InventoryValuationType": null
                    })

                    log.cfLoggingMessages('debug', 'IBD_JSON 1 : - ' + JSON.stringify(inv_post));
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
                        log.cfLoggingMessages('debug', 'response1 -> ' + JSON.stringify(response1.data));
                    }).catch(error => {
                        log.cfLoggingMessages('error', 'error in Inbound_Reverse CPI CALL-> ' + JSON.stringify(error.response.data));
                    });


                }

                return true;
            }
            if (DocNum) {
                log.cfLoggingMessages('debug', 'DocumnetNumber: -' + DocNum);
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
                // log.cfLoggingMessages('info', 'IBD v_date : -' + v_date);
                //log.cfLoggingMessages('info','v_date : -' + v_date);
                var ObjType = 'InboundDelivery';
                var Status = 'S';
                 // INC0220466 removing bolnumber where clause (houseBOLNumber: houseBOLNumber,)
                const result = await tx.run(SELECT.distinct.from(Get_Reverse).where({ ObjectRefNo: DocNum,  invoiceNumber: invoiceNumber, PurchaseOrder: PurchaseOrder, PurchaseOrderItem: PurchaseOrderItem, ObjectType: ObjType, Status: Status, BOLID: BolID }));
                // log.cfLoggingMessages('info', JSON.stringify(result));
                for (const oData of result) {
                    var inv_post = {
                        "BOLID": oData.BOLID,
                        "houseBOLNumber": oData.houseBOLNumber,
                        "invoiceNumber": oData.invoiceNumber,
                        "containerID": oData.containerID,
                        "DeliveryDate": v_date,
                        "Supplier": null,
                        "BillOfLading": oData.houseBOLNumber,
                        "MeansOfTransportType": null,
                        "MeansOfTransport": null,
                        Action: [],
                        A_DeliveryDocumentItem: []
                    };
                    ObjType = 'GoodsReceipt';
                    Status = 'S';
                     // INC0220466 removing bolnumber where clause (houseBOLNumber: houseBOLNumber,)
                    const GR_DATA = await tx.run(SELECT.distinct.from(Get_Reverse).where({ ObjectRefNo: DocNum,  invoiceNumber: invoiceNumber, ObjectType: ObjType, Status: Status }).columns('ObjectRefNo', 'GR_DATE'));
                    // log.cfLoggingMessages('info', 'GR_DATA: - ' + JSON.stringify(GR_DATA));
                    const TotalRec = GR_DATA.length;
                    // log.cfLoggingMessages('info', "GR_DATA =>" + TotalRec);
                    if (TotalRec > 0) {
                        for (const OData of GR_DATA) {
                            GR_POSTING_FLAG = 'T';
                            inv_post.Action.push({
                                "Action": "R",
                                "DocNum": DocNum,
                                "Date": OData.GR_DATE,
                                "FiscalYear": null,
                                "ReversalReason": null,
                                "ObjectType": "GoodsReceipt"
                            });
                        }
                        inv_post.Action.push({
                            "Action": "D",
                            "DocNum": DocNum,
                            "Date": null,
                            "FiscalYear": null,
                            "ReversalReason": null,
                            "ObjectType": "InboundDelivery"
                        });
                    } else {
                        inv_post.Action.push({
                            "Action": "D",
                            "DocNum": DocNum,
                            "Date": null,
                            "FiscalYear": null,
                            "ReversalReason": null,
                            "ObjectType": "InboundDelivery"
                        });
                    }

                    inv_post.A_DeliveryDocumentItem.push({
                        "Action": "D",
                        "IBD_NO": DocNum,
                        "IBD_LINE": oData.SAP_LineID,
                        "lineNumber": oData.lineNumber,
                        "Material": oData.Material,
                        "PurchaseOrder": PurchaseOrder,
                        "PurchaseOrderItem": PurchaseOrderItem,
                        "QuantityInPurchaseOrderUnit": "0",
                        "ActualDeliveryQuantity": "0",
                        "Batch": null,
                        "Plant": null,
                        "ReferenceSDDocument": PurchaseOrder,
                        "ReferenceSDDocumentItem": PurchaseOrderItem,
                        "InventoryValuationType": null
                    })

                    log.cfLoggingMessages('debug', 'IBD_JSON 1 : - ' + JSON.stringify(inv_post));
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
                        log.cfLoggingMessages('debug', 'response1 -> ' + JSON.stringify(response1.data));
                    }).catch(error => {
                        log.cfLoggingMessages('error', 'error in Inbound_Reverse -> ' + JSON.stringify(error.response.data));
                    });


                }
                return true;

            }
            else {
                // log.cfLoggingMessages('info', 'Inbound  Cannot be Reversed');
                return false;
            }
        }

        catch (e) {
            req.error({
                code: '400',
                message: e.message,
                target: 'Inbound_Reverse',
                status: 418
            })
            log.cfLoggingMessages('error', 'Inbound_Reverse :-> ' + e.message);
            return false;
        }


    })


    // const GR_POSTING = async (req, BOL, invoiceNumber, deliveryDocument) => {
    //     try {
    //         var GR_post = {
    //             "ID": 1,
    //             "houseBOLNumber": BOL,
    //             "invoiceNumber": invoiceNumber,
    //             "deliveryDocument": deliveryDocument
    //         };

    //         log.cfLoggingMessages('debug', 'GR_POSTING JSON 1 : - ' + JSON.stringify(GR_post));

    //         ////// Call CPI API
    //         //Declarations
    //         const CPI_URL_Data = await SELECT.one(Environment).where({ APPID: 'CPI_GR' }).columns('URL', 'tokenUrl', 'clientId', 'clientSecret');
    //         // log.cfLoggingMessages('info', JSON.stringify(CPI_URL_Data));
    //         let CPI_clientId = "";
    //         let CPI_clientSecret = "";
    //         let CPI_tokenUrl = "";
    //         let CPI_url = "";
    //         if (CPI_URL_Data != null) {
    //             CPI_clientId = CPI_URL_Data.clientId;
    //             CPI_clientSecret = CPI_URL_Data.clientSecret;
    //             CPI_tokenUrl = CPI_URL_Data.tokenUrl;
    //             CPI_url = CPI_URL_Data.URL;
    //         }
    //         let client_credentials = btoa(CPI_clientId + ':' + CPI_clientSecret);
    //         let basicAuth = 'Basic ' + client_credentials;

    //         //Generate bearer token
    //         const resToken = await axios.get(CPI_tokenUrl, {
    //             headers: {
    //                 "Authorization": basicAuth,
    //             },
    //             params: {
    //                 "grant_type": "client_credentials",
    //             },
    //         });
    //         let bearerToken = 'Bearer ' + resToken.data.access_token;
    //         //log.cfLoggingMessages('info',bearerToken);
    //         const response1 = await axios({
    //             method: "POST",
    //             url: CPI_url,
    //             headers: {
    //                 "Authorization": bearerToken,
    //                 'accept': "application/json",
    //                 'content-type': "application/json",
    //                 'x-requested-with': 'XMLHttpRequest',
    //             },
    //             data: GR_post
    //         }).then(response1 => {

    //             log.cfLoggingMessages('debug', 'GR_POSTING Res -> ' + JSON.stringify(response1.data));

    //         }).catch(error => {
    //             log.cfLoggingMessages('error', 'GR_POSTING CPI CALL error -> ' + JSON.stringify(error.response.data));
    //         });
    //         return true;

    //     }
    //     catch (e) {
    //         log.cfLoggingMessages('error', 'GR_POSTING :-> ' + e.message);
    //         return false;
    //     }
    // }



    this.on('Invoice_Reverse', async req => {
        try {
            log.cfLoggingMessages('debug', 'Invoice_Reverse -> ' + req);
            const tx = cds.tx(req);
            const houseBOLNumber = req.data.houseBOLNumber;
            const invoiceNumber = req.data.invoiceNumber;
            const PurchaseOrder = req.data.PurchaseOrder;
            const PurchaseOrderItem = req.data.PurchaseOrderItem;
            const DocNum = req.data.DocNum;
            const BolID = req.data.BolID;
            const ActID = req.data.ActID || "";//added for diversion scenario for U line
            const DiversionId = req.data.DiversionId || "";
            const CurrencyCode = req.data.CurrencyCode || ""; //document currency
            const Plant = req.data.Plant;
            //Added by Preethi on 27/12 for Invoice Reversal validation
            if (DocNum) {
                log.cfLoggingMessages('debug', 'DocumnetNumber: -' + DocNum);
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
                let v_date = year + '-' + vmonth + '-' + vday + 'T00:00:00';
                // log.cfLoggingMessages('info', 'INV v_date : -' + v_date);
                //log.cfLoggingMessages('info','v_date : -' + v_date);

                var ObjType = 'Invoice';
                var Status = 'S';
                const result = await tx.run(SELECT.distinct.from(Get_Reverse).where({ ObjectRefNo: DocNum, houseBOLNumber: houseBOLNumber, invoiceNumber: invoiceNumber, PurchaseOrder: PurchaseOrder, PurchaseOrderItem: PurchaseOrderItem, ObjectType: ObjType, Status: Status, BOLID: BolID }));
                //let result = await tx.run(SELECT.from(MNetStatusMonitoring).where({ houseBOLNumber: houseBOLNumber,invoiceNumber: invoiceNumber,ID_PurchaseOrder: PurchaseOrder,ID_PurchaseOrderItem: PurchaseOrderItem, ObjectType: ObjType, Status: Status }));
                // log.cfLoggingMessages('info', JSON.stringify(result));
                for (const oData of result) {

                    var inv_post = {
                        "BOLID": oData.BOLID,       //added for defect 66 #2
                        "importShipmentNumber": oData.importShipmentNumber,
                        "houseBOLNumber": oData.houseBOLNumber,
                        "invoiceNumber": oData.invoiceNumber,
                        "containerID": oData.containerID,
                        "CompanyCode": null,
                        "SupplierInvoiceIDByInvcgParty": oData.invoiceNumber,
                        "DocumentDate": v_date,
                        "PostingDate": v_date,
                        "InvoicingParty": null,
                        "DocumentCurrency": CurrencyCode,
                        "InvoiceGrossAmount": null,
                        "DueCalculationBaseDate": v_date,
                        Action: [],
                        SuplrInvcItemPurOrdRef: []

                    };

                    inv_post.Action.push({
                        "BOLID": oData.BOLID,       //added for defect 66 #2
                        "Action": "D",
                        "DocNum": DocNum,
                        "Date": oData.ObjectRefDate,
                        "FiscalYear": oData.FiscalYear,
                        "ReversalReason": "03",
                        "ObjectType": "Invoice"
                    });
                    log.cfLoggingMessages('debug', 'INV_JSON 1 : - ' + JSON.stringify(inv_post));
                    //Diversion Reversal of U line send invoice item details
                    //31-05-2024 Bhushan
                    //CS
                    if (ActID == "U") {
                        const Output = "SELECT NewPurchasing_Order,NewPOLine,NewQuantity,UnitPrice,PartUnitOfMeasurement,ExtendedCost,ID_MNET_LINE as lineNumber, ID_MNET_NO as material,INV_ITEM as SupplierInvoiceItem  from Diversion.MNET_DiversionDetail where ID_ID = '" + [DiversionId] + "' and NewPurchasing_Order='" + PurchaseOrder + "' and NewPOLine='" + PurchaseOrderItem + "'";
                        let query = cds.parse.cql(Output);
                        let result = await tx.run(query);
                        // log.cfLoggingMessages('info', JSON.stringify(result));

                        for (const oudata of result) {
                            const newPurchasing_Order = oudata.NewPurchasing_Order;
                            const newPOLine = oudata.NewPOLine;
                            const newQuantity = oudata.NewQuantity;
                            const UOM = oudata.PartUnitOfMeasurement;
                            const extendedCost = oudata.ExtendedCost;
                            inv_post.InvoiceGrossAmount = oudata.ExtendedCost;
                            const material = oudata.material;
                            const lineNumber = oudata.lineNumber;
                            const supplierInvoiceItem = oudata.SupplierInvoiceItem;
                            inv_post.SuplrInvcItemPurOrdRef.push({
                                "lineNumber": lineNumber,
                                "Material": material,
                                "PurchaseOrder": newPurchasing_Order,
                                "PurchaseOrderItem": newPOLine,
                                "SupplierInvoiceItem": supplierInvoiceItem,
                                "Plant": Plant,
                                "TaxCode": 'I0',
                                "DocumentCurrency": CurrencyCode,
                                "SupplierInvoiceItemAmount": extendedCost,
                                "PurchaseOrderQuantityUnit": UOM,
                                // "PurchaseOrderPriceUnitSAPCode": oData.partUnitOfMeasurement, //Asif changes on 29/11
                                // "qtyPerSLSUnitPricePackType": oData.qtyPerSLSUnitPricePackType,
                                "QuantityInPurchaseOrderUnit": newQuantity,
                                "SupplierInvoiceItemText": lineNumber
                            })
                        }

                        //CE
                    } else {
                        //MNET_SuplrInvcItemPurOrdRef  added by Preethi on 09/02 for pt 4 214
                        let Item_result = await SELECT.distinct.from(MNET_SuplrInvcItemPurOrdRef).where({ BOLID: BolID, BOL: houseBOLNumber, PurchaseOrder: PurchaseOrder, PurchaseOrderItem: PurchaseOrderItem }).columns('lineNumber', 'Material', 'PurchaseOrder', 'PurchaseOrderItem', 'SupplierInvoiceItem', 'Plant', 'TaxCode', 'DocumentCurrency', 'SupplierInvoiceItemAmount', 'PurchaseOrderQuantityUnit', 'QuantityInPurchaseOrderUnit', 'SupplierInvoiceItemText');
                        // log.cfLoggingMessages('info', 'Item_result -> ' + JSON.stringify(Item_result));
                        for (const oData_Item of Item_result) {

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
                                "PurchaseOrderQuantityUnit": oData_Item.PurchaseOrderQuantityUnit,
                                // "PurchaseOrderPriceUnitSAPCode": oData.partUnitOfMeasurement, //Asif changes on 29/11
                                // "qtyPerSLSUnitPricePackType": oData.qtyPerSLSUnitPricePackType,
                                "QuantityInPurchaseOrderUnit": oData_Item.QuantityInPurchaseOrderUnit,
                                "SupplierInvoiceItemText": oData_Item.SupplierInvoiceItemText
                            })
                        }
                        // }
                    }
                    log.cfLoggingMessages('debug', 'INV JSON 2: - ' + JSON.stringify(inv_post));
                    // log.cfLoggingMessages('info','v_post_flag - ' + v_post_flag);
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
                        log.cfLoggingMessages('debug', 'response1 -> Invoice Reverse:' + JSON.stringify(response1.data));
                    }).catch(error => {
                        log.cfLoggingMessages('error', 'error in Invoice_Reverse cpi call-> ' + JSON.stringify(error.response.data));
                    });


                }
                return true;
            }
            else {
                // log.cfLoggingMessages('info', 'Invoice Cannot be Reversed');
                return false;
            }
        }
        catch (e) {
            req.error({
                code: '400',
                message: e.message,
                target: 'Invoice_Reverse',
                status: 418
            })
            log.cfLoggingMessages('error', 'Invoice_Reverse :-> ' + e.message);
            return false;
        }
    })

    this.on('A_POlineitem', async () => {
        const allRecords = await SELECT.from`BTP.Panasonic.A_PurchaseOrderItem`.columns('PurchaseOrder_PurchaseOrder', 'PurchaseOrderItem', 'OrderQuantity');
        log.cfLoggingMessages('debug', 'allRecords -> ' + allRecords);
        return allRecords;
    });

    this.on('GR_DataUpdate', async req => {
        try {
            log.cfLoggingMessages('debug', 'GR_DataUpdate -> ' + req);
            const data = req.data;
            const tx = cds.tx(req);

            let houseBOLNumber = data.houseBOLNumber;
            let purchaseOrderNumber = data.purchaseOrderNumber;
            let BTP_InvoiceNumber = data.BTP_InvoiceNumber;
            let BTP_IBDNumber = data.BTP_IBDNumber;
            let status = data.status;
            let BTP_GRStatus = data.BTP_GRStatus;
            let BTP_GRNumber = data.BTP_GRNumber;
            let SAP_LineID_GR = data.SAP_LineID_GR;
            let bolid = data.bolid;
            let Purchaseorderlineitem = data.po_line;
            let supplierinvoice = data.supplierinvoice;
            let supplierinvoice_line = data.supplierinvoice_line;
            var data1 = {
                "status": status,
                "PurchaseOrderItem": BTP_GRStatus,
                "BTP_GRNumber": BTP_GRNumber,
                "SAP_LineID_GR": SAP_LineID_GR
            };
            log.cfLoggingMessages('debug', 'data1 -> ' + JSON.stringify(data1));

            // Logic to Update status as "C", when any line item is 'E' and 'S' which they don't want to move forward or use that Purchase order line item then they can make status as "C", which indicates complete and no further action required
            if (status == "C") {
                await tx.run(UPDATE(invoiceLine).set({ status: status }).where({ invoiceNumber_houseBOLNumber_houseBOLNumber: houseBOLNumber, purchaseOrderNumber: purchaseOrderNumber, lineNumber: supplierinvoice_line, INVOICENUMBER_HOUSEBOLNUMBER_ID: bolid, INVOICENUMBER_INVOICENUMBER: supplierinvoice, orderItemNbr: Purchaseorderlineitem }));
            }
            else {
                await tx.run(UPDATE(invoiceLine).set({ BTP_GRStatus: BTP_GRStatus, BTP_GRNumber: BTP_GRNumber, SAP_LineID_GR: SAP_LineID_GR }).where({ BTP_IBDNumber: BTP_IBDNumber, invoiceNumber_houseBOLNumber_houseBOLNumber: houseBOLNumber, purchaseOrderNumber: purchaseOrderNumber, lineNumber: supplierinvoice_line, INVOICENUMBER_HOUSEBOLNUMBER_ID: bolid, INVOICENUMBER_INVOICENUMBER: supplierinvoice, orderItemNbr: Purchaseorderlineitem }));
            }


            // log.cfLoggingMessages('info', "data Successfully updated");
            return true;
        } catch (error) {
            log.cfLoggingMessages('error', 'Error in GR_DataUpdate' + error)
            req.error({
                code: '400',
                message: error.message,
                target: 'GR_DataUpdate',
                status: 418
            })
            return false;
        }
    })
    this.after("READ", "GET_MNET_Data_Detail", async req => {
        let data = req;
        data = data && data.length > 0 ? data : [];
        log.cfLoggingMessages('debug', 'GET_MNET_Data_Detail data -> ' + JSON.stringify(data));
        // check IBD_NO IS NULL AND INV NO > 0 AND IBD_ACTION IS NULL THEN 
        // CALL SP GET_PREV_BOLID_WITHTYPES THEN CHECK PREV QTY AND CURR QTY IF NO CHANGE 
        // THEN COPY SP VALUES TO CURRENT OBJECT
        for (let i = 0; i < data.length; i++) {
            let detailObj = data[i];
            log.cfLoggingMessages('debug', i+':GET_MNET_Data_Detail -> ' + JSON.stringify(detailObj));
            let BTP_IBDNumber = detailObj.BTP_IBDNumber ? detailObj.BTP_IBDNumber.trim() : "";
            let BTP_InvoiceNumber = detailObj.BTP_InvoiceNumber ? detailObj.BTP_InvoiceNumber.trim() : "";
            let BTP_GRNumber = detailObj.BTP_GRNumber ? detailObj.BTP_GRNumber.trim() : "";
            let BTP_IBDAction = detailObj.IBD_Action;//need to add in service
            let BTP_InvoiceAction = detailObj.INV_Action;
            let GR_Action = detailObj.GR_Action;
            // let INV_Action = detailObj.INV_Action;
            let INV_Status = detailObj.BTP_InvoiceStatus;
            let IBD_Status = detailObj.BTP_IBDStatus;
            let V_PO = detailObj.Purchasing_order;
            let V_PURCHASEORDERITEM = detailObj.PO_Line;
            let V_BOL = detailObj.BillofLanding;
            let V_INVOICENUMBER = detailObj.SupplierInvoice;
            let V_INVOICELINENUMBER = detailObj.SupplierInvoice_Line;
            let V_BOLID = detailObj.houseBOLNumber_ID;
            let V_QTY = detailObj.quantity;
            // let V_PRICE = detailObj.UnitPrice;
            // let processDate = detailObj.ProcessDate;
            // let V_ProcessDate = new Date(processDate);
            // let V_Status = detailObj.status;
            let V_IMPORTSHIPMENTNUMBER = detailObj.Folder_No;
            let action = detailObj.action;
            if(action == "U"){
                //cleare original material and original po line
                detailObj["Original_Material"]="";
                detailObj["Original_PO_Line"]="";
            }
            // log.cfLoggingMessages('debug', 'GR_Action->' + GR_Action);
            // log.cfLoggingMessages('debug', 'BTP_GRNumber->' + BTP_GRNumber);
            //price change Scenario
            //Invoice will be deleted and created
            if (!BTP_IBDNumber && !BTP_IBDAction && ((+BTP_InvoiceNumber > 0 && BTP_InvoiceAction == "C" ) || (!IBD_Status && INV_Status == "E"))) {
                try {
                    //call the store procedure
                    log.cfLoggingMessages('info', 'price change');
                    let dbQuery = "CALL GET_PREV_BOLID_WITHTYPES(V_PO =>  '" + V_PO + "',V_PURCHASEORDERITEM => '" + V_PURCHASEORDERITEM + "',V_BOL => '" + V_BOL + "',V_INVOICENUMBER => '" + V_INVOICENUMBER + "',   V_INVOICELINENUMBER => '" + V_INVOICELINENUMBER + "', V_IMPORTSHIPMENTNUMBER => '" + V_IMPORTSHIPMENTNUMBER + "', V_BOLID => " + V_BOLID + ",V_OBOLID => ?,OUT_CONTAINERID => ?,OUT_UNITPRICE => ?,OUT_BTP_IBDSTATUS => ?,OUT_BTP_IBDNUMBER => ?,OUT_BTP_INVOICESTATUS => ?,OUT_SAP_LINEID_IBD => ?,OUT_BTP_INVOICENUMBER => ?,OUT_SAP_LINEID_INVOICE => ?,OUT_BTP_GRSTATUS => ?,OUT_BTP_GRNUMBER => ?,OUT_BTP_ASN_DI_STATUS => ?,OUT_BTP_ASN_DINUMBER => ?,OUT_QUANTITY => ?, OUT_INITIALDESTINATIONETA => ?,OUT_PREVIOUS_RECORD_EXISTING => ?,OUT_DIVERSIONFLAG => ?)";
                    log.cfLoggingMessages('info', 'GET_PREV_BOLID_WITHTYPES dbQuery -> ' + dbQuery);
                    const result = await cds.run(dbQuery, {});
                    log.cfLoggingMessages('debug', 'GET_PREV_BOLID_WITHTYPES SP result' + JSON.stringify(result));
                    let OUT_PREVIOUS_RECORD_EXISTING = result.OUT_PREVIOUS_RECORD_EXISTING;
                    log.cfLoggingMessages('debug', 'GET_PREV_BOLID_WITHTYPES OUT_PREVIOUS_RECORD_EXISTING' + OUT_PREVIOUS_RECORD_EXISTING);
                    if (OUT_PREVIOUS_RECORD_EXISTING) {
                        let OUT_QUANTITY = result.OUT_QUANTITY;
                        if (+V_QTY == +OUT_QUANTITY) {
                            let OUT_BTP_IBDSTATUS = result.OUT_BTP_IBDSTATUS;
                            detailObj["BTP_IBDStatus"] = OUT_BTP_IBDSTATUS;
                            let OUT_BTP_IBDNUMBER = result.OUT_BTP_IBDNUMBER;
                            if (!BTP_IBDNumber) {
                                detailObj["BTP_IBDNumber"] = OUT_BTP_IBDNUMBER;
                                let deliveryListItemNbr = result.OUT_SAP_LINEID_IBD;
                                if (deliveryListItemNbr) {
                                    detailObj["deliveryListItemNbr"] = deliveryListItemNbr;
                                }
                            }

                            if (!BTP_GRNumber && GR_Action != "R") {
                                let OUT_BTP_GRNUMBER = result.OUT_BTP_GRNUMBER;
                                detailObj["BTP_GRNumber"] = OUT_BTP_GRNUMBER;
                                // log.cfLoggingMessages('info','GR_NUBer 1->'+BTP_GRNumber+" ->"+OUT_BTP_GRNUMBER);
                            }
                            let OUT_BTP_ASN_DI_STATUS = result.OUT_BTP_ASN_DI_STATUS;
                            if (!detailObj["ASN_Status"]) {
                                detailObj["ASN_Status"] = OUT_BTP_ASN_DI_STATUS;
                            }
                            // let DI_Status = result.OUT_DI_Status;
                            if (!detailObj["DI_Status"]) {
                                detailObj["DI_Status"] = OUT_BTP_ASN_DI_STATUS;
                            }
                            // let OUT_INITIALDESTINATIONETA = result.OUT_INITIALDESTINATIONETA;
                        }
                    }
                } catch (error) {
                    log.cfLoggingMessages('error', 'Error in GET_PREV_BOLID_WITHTYPES' + error);
                }
            }
            //ETA Changed
            //IBD Get updated consider status S
            else if (!BTP_IBDNumber && !BTP_InvoiceNumber) { //&& V_Status != "E"
                //call the store procedure
                try {
                    let dbQuery = "CALL GET_PREV_BOLID_WITHTYPES(V_PO =>  '" + V_PO + "',V_PURCHASEORDERITEM => '" + V_PURCHASEORDERITEM + "',V_BOL => '" + V_BOL + "',V_INVOICENUMBER => '" + V_INVOICENUMBER + "',   V_INVOICELINENUMBER => '" + V_INVOICELINENUMBER + "', V_IMPORTSHIPMENTNUMBER => '" + V_IMPORTSHIPMENTNUMBER + "', V_BOLID => " + V_BOLID + ",V_OBOLID => ?,OUT_CONTAINERID => ?,OUT_UNITPRICE => ?,OUT_BTP_IBDSTATUS => ?,OUT_BTP_IBDNUMBER => ?,OUT_BTP_INVOICESTATUS => ?,OUT_SAP_LINEID_IBD => ?,OUT_BTP_INVOICENUMBER => ?,OUT_SAP_LINEID_INVOICE => ?,OUT_BTP_GRSTATUS => ?,OUT_BTP_GRNUMBER => ?,OUT_BTP_ASN_DI_STATUS => ?,OUT_BTP_ASN_DINUMBER => ?,OUT_QUANTITY => ?, OUT_INITIALDESTINATIONETA => ?,OUT_PREVIOUS_RECORD_EXISTING => ?,OUT_DIVERSIONFLAG => ?)";
                    log.cfLoggingMessages('info', 'GET_PREV_BOLID_WITHTYPES dbQuery -> ' + dbQuery);
                    const result = await cds.run(dbQuery, {});
                    log.cfLoggingMessages('debug', 'GET_PREV_BOLID_WITHTYPES SP result' + JSON.stringify(result));
                    let OUT_PREVIOUS_RECORD_EXISTING = result.OUT_PREVIOUS_RECORD_EXISTING;
                    log.cfLoggingMessages('debug', 'GET_PREV_BOLID_WITHTYPES OUT_PREVIOUS_RECORD_EXISTING' + OUT_PREVIOUS_RECORD_EXISTING);
                    if (OUT_PREVIOUS_RECORD_EXISTING) {
                        let out_processDate = result.OUT_INITIALDESTINATIONETA;
                        let prevDate = new Date(out_processDate);
                        //if dates are different considering eta change
                        //   if(V_ProcessDate.getTime() != prevDate.getTime()){
                        let OUT_BTP_IBDSTATUS = result.OUT_BTP_IBDSTATUS;
                        detailObj["BTP_IBDStatus"] = OUT_BTP_IBDSTATUS;
                        if (!BTP_IBDNumber) {
                            let OUT_BTP_IBDNUMBER = result.OUT_BTP_IBDNUMBER;
                            detailObj["BTP_IBDNumber"] = OUT_BTP_IBDNUMBER;
                        }
                        let deliveryListItemNbr = result.OUT_SAP_LINEID_IBD;
                        if (deliveryListItemNbr && !detailObj["deliveryListItemNbr"]) {
                            detailObj["deliveryListItemNbr"] = deliveryListItemNbr;
                        }
                        // let V_OBOLID = result.V_OBOLID;
                        // let OUT_CONTAINERID = result.OUT_CONTAINERID;
                        // let OUT_UNITPRICE = result.OUT_UNITPRICE;
                        let OUT_BTP_INVOICESTATUS = result.OUT_BTP_INVOICESTATUS;
                        detailObj["BTP_InvoiceStatus"] = OUT_BTP_INVOICESTATUS
                        //   let OUT_SAP_LINEID_IBD = result.OUT_SAP_LINEID_IBD;
                        if (!BTP_InvoiceNumber && BTP_InvoiceAction != "D") {
                            let OUT_BTP_INVOICENUMBER = result.OUT_BTP_INVOICENUMBER;
                            detailObj["BTP_InvoiceNumber"] = OUT_BTP_INVOICENUMBER;
                        }
                        let OUT_SAP_LINEID_INVOICE = result.OUT_SAP_LINEID_INVOICE;
                        let LV_invoiceItemNbr =   detailObj["invoiceItemNbr"] ? detailObj["invoiceItemNbr"].trim() : "";
                        if (OUT_SAP_LINEID_INVOICE && !LV_invoiceItemNbr) {
                            detailObj["invoiceItemNbr"] = OUT_SAP_LINEID_INVOICE;
                        }
                        // let OUT_BTP_GRSTATUS = result.OUT_BTP_GRSTATUS;
                        if (!BTP_GRNumber && GR_Action != "R") {
                            let OUT_BTP_GRNUMBER = result.OUT_BTP_GRNUMBER;
                            detailObj["BTP_GRNumber"] = OUT_BTP_GRNUMBER;
                            // log.cfLoggingMessages('info','GR_NUBer 2->'+BTP_GRNumber+" ->"+OUT_BTP_GRNUMBER);
                        }
                        let OUT_BTP_ASN_DI_STATUS = result.OUT_BTP_ASN_DI_STATUS;
                        if (!detailObj["ASN_Status"]) {
                            detailObj["ASN_Status"] = OUT_BTP_ASN_DI_STATUS;
                        }
                        // let DI_Status = result.OUT_DI_Status;
                        if (!detailObj["DI_Status"]) {
                            detailObj["DI_Status"] = OUT_BTP_ASN_DI_STATUS;
                        }
                        // let OUT_INITIALDESTINATIONETA = result.OUT_INITIALDESTINATIONETA;
                        //   }
                    }
                } catch (error) {
                    log.cfLoggingMessages('error', 'Error in GET_PREV_BOLID_WITHTYPES' + error);
                }
            }
            else if(BTP_IBDNumber && !BTP_InvoiceNumber){
                try {
                    let dbQuery = "CALL GET_PREV_BOLID_WITHTYPES(V_PO =>  '" + V_PO + "',V_PURCHASEORDERITEM => '" + V_PURCHASEORDERITEM + "',V_BOL => '" + V_BOL + "',V_INVOICENUMBER => '" + V_INVOICENUMBER + "',   V_INVOICELINENUMBER => '" + V_INVOICELINENUMBER + "', V_IMPORTSHIPMENTNUMBER => '" + V_IMPORTSHIPMENTNUMBER + "', V_BOLID => " + V_BOLID + ",V_OBOLID => ?,OUT_CONTAINERID => ?,OUT_UNITPRICE => ?,OUT_BTP_IBDSTATUS => ?,OUT_BTP_IBDNUMBER => ?,OUT_BTP_INVOICESTATUS => ?,OUT_SAP_LINEID_IBD => ?,OUT_BTP_INVOICENUMBER => ?,OUT_SAP_LINEID_INVOICE => ?,OUT_BTP_GRSTATUS => ?,OUT_BTP_GRNUMBER => ?,OUT_BTP_ASN_DI_STATUS => ?,OUT_BTP_ASN_DINUMBER => ?,OUT_QUANTITY => ?, OUT_INITIALDESTINATIONETA => ?,OUT_PREVIOUS_RECORD_EXISTING => ?,OUT_DIVERSIONFLAG => ?)";
                    log.cfLoggingMessages('info', 'GET_PREV_BOLID_WITHTYPES dbQuery -> ' + dbQuery);
                    const result = await cds.run(dbQuery, {});
                    log.cfLoggingMessages('debug', 'GET_PREV_BOLID_WITHTYPES SP result' + JSON.stringify(result));
                    let OUT_PREVIOUS_RECORD_EXISTING = result.OUT_PREVIOUS_RECORD_EXISTING;
                    log.cfLoggingMessages('debug', 'GET_PREV_BOLID_WITHTYPES OUT_PREVIOUS_RECORD_EXISTING' + OUT_PREVIOUS_RECORD_EXISTING);
                    if (OUT_PREVIOUS_RECORD_EXISTING) {
                        let out_processDate = result.OUT_INITIALDESTINATIONETA;
                        let prevDate = new Date(out_processDate);
                        //if dates are different considering eta change
                        //   if(V_ProcessDate.getTime() != prevDate.getTime()){
                        // let OUT_BTP_IBDSTATUS = result.OUT_BTP_IBDSTATUS;
                        // detailObj["BTP_IBDStatus"] = OUT_BTP_IBDSTATUS;
                        // if (!BTP_IBDNumber) {
                        //     let OUT_BTP_IBDNUMBER = result.OUT_BTP_IBDNUMBER;
                        //     detailObj["BTP_IBDNumber"] = OUT_BTP_IBDNUMBER;
                        // }
                        // let deliveryListItemNbr = result.OUT_SAP_LINEID_IBD;
                        // if (deliveryListItemNbr && !detailObj["deliveryListItemNbr"]) {
                        //     detailObj["deliveryListItemNbr"] = deliveryListItemNbr;
                        // }
                        // let V_OBOLID = result.V_OBOLID;
                        // let OUT_CONTAINERID = result.OUT_CONTAINERID;
                        // let OUT_UNITPRICE = result.OUT_UNITPRICE;
                        let OUT_BTP_INVOICESTATUS = result.OUT_BTP_INVOICESTATUS;
                        detailObj["BTP_InvoiceStatus"] = OUT_BTP_INVOICESTATUS
                        //   let OUT_SAP_LINEID_IBD = result.OUT_SAP_LINEID_IBD;
                        if (!BTP_InvoiceNumber && BTP_InvoiceAction != "D") {
                            let OUT_BTP_INVOICENUMBER = result.OUT_BTP_INVOICENUMBER;
                            detailObj["BTP_InvoiceNumber"] = OUT_BTP_INVOICENUMBER;
                        }
                        let OUT_SAP_LINEID_INVOICE = result.OUT_SAP_LINEID_INVOICE;
                        let LV_invoiceItemNbr =   detailObj["invoiceItemNbr"] ? detailObj["invoiceItemNbr"].trim() : "";
                        if (OUT_SAP_LINEID_INVOICE && !LV_invoiceItemNbr) {
                            detailObj["invoiceItemNbr"] = OUT_SAP_LINEID_INVOICE;
                        }
                        // let OUT_BTP_GRSTATUS = result.OUT_BTP_GRSTATUS;
                        if (!BTP_GRNumber && GR_Action != "R") {
                            let OUT_BTP_GRNUMBER = result.OUT_BTP_GRNUMBER;
                            detailObj["BTP_GRNumber"] = OUT_BTP_GRNUMBER;
                            // log.cfLoggingMessages('info','GR_NUBer 3->'+BTP_GRNumber+" ->"+OUT_BTP_GRNUMBER);
                        }
                        let OUT_BTP_ASN_DI_STATUS = result.OUT_BTP_ASN_DI_STATUS;
                        if (!detailObj["ASN_Status"]) {
                            detailObj["ASN_Status"] = OUT_BTP_ASN_DI_STATUS;
                        }
                        // let DI_Status = result.OUT_DI_Status;
                        if (!detailObj["DI_Status"]) {
                            detailObj["DI_Status"] = OUT_BTP_ASN_DI_STATUS;
                        }
                        // let OUT_INITIALDESTINATIONETA = result.OUT_INITIALDESTINATIONETA;
                        //   }
                    }
                } catch (error) {
                    log.cfLoggingMessages('error', 'Error in GET_PREV_BOLID_WITHTYPES' + error);
                }
            }
            
            if(GR_Action == "R"){
                detailObj["BTP_GRNumber"] = "";
            }

        }
        log.cfLoggingMessages('debug', 'GET_MNET_Data_Detail data final ' + JSON.stringify(data));
        return data;
    })
    this.on('PrevBolDetails', async req => {
        const tx = cds.tx(req);
        let data = {
            prev_record_existing: false,
            houseBOLNumber: ""
        }
        let V_PO = req.data.PO;
        let V_PURCHASEORDERITEM = req.data.PO_ITEM;
        let V_BOL = req.data.BOL;
        let V_INVOICENUMBER = req.data.invNO;
        let V_INVOICELINENUMBER = req.data.invLine;
        let V_IMPORTSHIPMENTNUMBER = req.data.importShipmentNumber;
        let V_BOLID = req.data.boId;
        try {
            // const resultBolHeader1 = await SELECT.from(bolHeader).where({ houseBOLNumber: V_BOL }).columns('flag_bolchange');
            // const flag_bolchange = resultBolHeader1[0].flag_bolchange;
            // //if flag_bolchange is true then need get prev bol id
            // if (flag_bolchange) {
                let dbQuery = "CALL GET_PREV_BOLID_WITHTYPES(V_PO =>  '" + V_PO + "',V_PURCHASEORDERITEM => '" + V_PURCHASEORDERITEM + "',V_BOL => '" + V_BOL + "',V_INVOICENUMBER => '" + V_INVOICENUMBER + "',   V_INVOICELINENUMBER => '" + V_INVOICELINENUMBER + "', V_IMPORTSHIPMENTNUMBER => '" + V_IMPORTSHIPMENTNUMBER + "', V_BOLID => " + V_BOLID + ",V_OBOLID => ?,OUT_CONTAINERID => ?,OUT_UNITPRICE => ?,OUT_BTP_IBDSTATUS => ?,OUT_BTP_IBDNUMBER => ?,OUT_BTP_INVOICESTATUS => ?,OUT_SAP_LINEID_IBD => ?,OUT_BTP_INVOICENUMBER => ?,OUT_SAP_LINEID_INVOICE => ?,OUT_BTP_GRSTATUS => ?,OUT_BTP_GRNUMBER => ?,OUT_BTP_ASN_DI_STATUS => ?,OUT_BTP_ASN_DINUMBER => ?,OUT_QUANTITY => ?, OUT_INITIALDESTINATIONETA => ?,OUT_PREVIOUS_RECORD_EXISTING => ?,OUT_DIVERSIONFLAG => ?)";
                // log.cfLoggingMessages('info', 'GET_PREV_BOLID_WITHTYPES dbQuery -> ' + dbQuery);
                const result = await cds.run(dbQuery, {});
                // log.cfLoggingMessages('debug', 'GET_PREV_BOLID_WITHTYPES SP result' + JSON.stringify(result));
                let OUT_PREVIOUS_RECORD_EXISTING = result.OUT_PREVIOUS_RECORD_EXISTING;
                // log.cfLoggingMessages('debug', 'GET_PREV_BOLID_WITHTYPES OUT_PREVIOUS_RECORD_EXISTING' + OUT_PREVIOUS_RECORD_EXISTING);
                if (OUT_PREVIOUS_RECORD_EXISTING) {
                    let V_OBOLID = result.V_OBOLID;
                    //get housebol number from bol header
                    const resultBolHeader = await SELECT.from(bolHeader).where({ ID: V_OBOLID }).columns('houseBOLNumber');
                    const prevhouseBOLNumber = resultBolHeader[0].houseBOLNumber;
                    data.prev_record_existing = OUT_PREVIOUS_RECORD_EXISTING;
                    data.houseBOLNumber = prevhouseBOLNumber;
                }
            // }
        } catch (error) {
            log.cfLoggingMessages('info',  'error:'+error.message);
        }
        return data;
    })

})