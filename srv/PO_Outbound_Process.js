const cds = require('@sap/cds');
const axios = require("axios");
const log = require('./util/logger')



module.exports = cds.service.impl(async function () {


    const { A_PurchaseOrder, POStatusMonitoring, POConfirmationHistory, POConfirmationData, ZMM_MOS } = cds.entities('BTP.Panasonic')
    const { GetAdditionalData, PurchaseGroup_GlobalCode, ZCROSSREF, Environment } = this.entities;

    const { GetPOAdditionalFields, A_PurOrdAccountAssignment, PO_AdditionalData } = this.entities;


    const service1 = await cds.connect.to('API_SALES_ORDER_SRV');
    const service2 = await cds.connect.to('API_BUSINESS_PARTNER_API');
    const service3 = await cds.connect.to('SHIPPOINTADDR');

    // Kowsalyaa for Master Data Maintanaence
    this.on('fixedValueCreateAndUpdate', async (req) => {
        try {
            log.cfLoggingMessages('debug', 'fixedValueCreateAndUpdate' + req);
            const { Sequence_Number, SegDescription, Seg01, Field01, Seg02, Field02, Seg03, Field03, Seg04, Field04, Seg05, Field05, Value, MatType, modifiedBy, modifiedAt, createdBy, createdAt } = req.data;
            const existingRecord = await SELECT.from`BTP_PANASONIC.Fixed_Value`
                .where`Sequence_Number=${Sequence_Number}`;
            if (existingRecord.length > 0) {
                const update = await UPDATE`BTP_PANASONIC.Fixed_Value`
                    .set`SegDescription=${SegDescription}`
                    .set`Seg01=${Seg01}`
                    .set`Field01=${Field01}`
                    .set`Seg02=${Seg02}`
                    .set`Field02=${Field02}`
                    .set`Seg03=${Seg03}`
                    .set`Field03=${Field03}`
                    .set`Seg04=${Seg04}`
                    .set`Field04=${Field04}`
                    .set`Seg05=${Seg05}`
                    .set`Field05=${Field05}`.set`Value=${Value}`.set`MatType=${MatType}`
                    .set`MODIFIEDAT=${modifiedAt}`.set`MODIFIEDBY=${modifiedBy}`
                    .where`Sequence_Number=${Sequence_Number}`;
                // log.cfLoggingMessages('info', update);
            } else {
                delete req.data.modifiedBy;
                delete req.data.modifiedAt;
                const totalRecords = await SELECT.from`BTP_PANASONIC.Fixed_Value`;
                // log.cfLoggingMessages('info', 'Total Records in fixed value', totalRecords);
                req.data.Sequence_Number = (totalRecords.length + 1).toString();
                const newRecord = await INSERT.into('BTP_PANASONIC.Fixed_Value').entries(req.data);
                // log.cfLoggingMessages('info', newRecord);
            }
        } catch (err) {
            log.cfLoggingMessages('error', 'Error in fixedValueCreateAndUpdate' + err)
            req.error({
                code: '500',
                message: `Internal Server error ${err}`,
                target: 'fixedValueCreateAndUpdate',
                status: 500
            })
        }
    });
    this.on('orderMarkCreateAndUpdate', async (req) => {
        try {
            log.cfLoggingMessages('debug', 'orderMarkCreateAndUpdate' + req)
            const { MANDT, ORDERMARK, ORDERTYPE, FREEIND, SPECIND, PCBIND, TOOLIND, LARGEQTYIND, IGPIND, MAINPARTSIND, REFURBPARTSIND, DISCPARTSIND, SERVICEMANIND, REPAIRRETIND, SHIPMETHODIND } = req.data;
            const existingRecord = await SELECT.from`BTP_PANASONIC.OrderMark`
                .where`MANDT=${MANDT} and ORDERMARK=${ORDERMARK}`;
            if (existingRecord.length > 0) {
                const update = await UPDATE`BTP_PANASONIC.OrderMark`
                    .set`ORDERTYPE=${ORDERTYPE}`
                    .set`FREEIND=${FREEIND}`
                    .set`SPECIND=${SPECIND}`
                    .set`PCBIND=${PCBIND}`
                    .set`TOOLIND=${TOOLIND}`
                    .set`LARGEQTYIND=${LARGEQTYIND}`
                    .set`IGPIND=${IGPIND}`
                    .set`MAINPARTSIND=${MAINPARTSIND}`
                    .set`REFURBPARTSIND=${REFURBPARTSIND}`
                    .set`DISCPARTSIND=${DISCPARTSIND}`
                    .set`SERVICEMANIND=${SERVICEMANIND}`.set`REPAIRRETIND=${REPAIRRETIND}`.set`SHIPMETHODIND=${SHIPMETHODIND}`
                    .where`MANDT=${MANDT} and ORDERMARK=${ORDERMARK}`;
                // log.cfLoggingMessages('info', update);
            } else {
                const newRecord = await INSERT.into('BTP_PANASONIC.OrderMark').entries(req.data);
                // log.cfLoggingMessages('info', newRecord);
            }
        } catch (err) {
            log.cfLoggingMessages('error', 'Error in orderMarkCreateAndUpdate' + err)
            req.error({
                code: '500',
                message: `Internal Server error ${err}`,
                target: 'orderMarkCreateAndUpdate',
                status: 500
            })
        }
    });
    this.on('vendorRefCreateAndUpdate', async (req) => {
        try {
            log.cfLoggingMessages('debug', 'vendorRefCreateAndUpdate' + req)
            const { Client, Legacy, Vendor, MatlGroup, Producthierarchy, Changedby, LastChg, ChangeTime } = req.data;
            const existingRecord = await SELECT.from`BTP_PANASONIC.Vendor_Ref`
                .where`Client=${Client} and Legacy=${Legacy} and Vendor=${Vendor}`;
            if (existingRecord.length > 0) {
                const update = await UPDATE`BTP_PANASONIC.Vendor_Ref`
                    .set`MatlGroup=${MatlGroup}`
                    .set`Producthierarchy=${Producthierarchy}`
                    .set`Changedby=${Changedby}`
                    .set`LastChg=${LastChg}`
                    .set`ChangeTime=${ChangeTime}`
                    .where`Client=${Client} and Legacy=${Legacy} and Vendor=${Vendor}`;
                // log.cfLoggingMessages('debug', update);
            } else {
                delete req.data.Changedby;
                delete req.data.LastChg;
                delete req.data.ChangeTime;
                const newRecord = await INSERT.into('BTP_PANASONIC.Vendor_Ref').entries(req.data);
                // log.cfLoggingMessages('info', newRecord);
            }
        } catch (err) {
            log.cfLoggingMessages('error', 'Error in vendorRefCreateAndUpdate' + err)
            req.error({
                code: '500',
                message: `Internal Server error ${err}`,
                target: 'vendorRefCreateAndUpdate',
                status: 500
            })
        }
    })


    this.on('Create_PO_Out', async req => {
        try {
            log.cfLoggingMessages('debug', 'Create_PO_Out' + req.data)
            const data = req.data["PurchaseOrder"][0];
            const tx = cds.tx(req);
            // log.cfLoggingMessages('info', JSON.stringify(data));
            const PO = req.data["PurchaseOrder"][0].PurchaseOrder;
            const POItem = req.data["PurchaseOrder"][0].PurchaseOrderItem;
            const PurchasingGroup = req.data["PurchaseOrder"][0].PurchasingGroup;
            //Asif/Jyothi Changes for 193
            const VendorAssignmentAccountGroup = req.data["PurchaseOrder"][0].VendorAssignmentAccountGroup;
            // log.cfLoggingMessages('info', 'VendorAssignmentAccountGroup=>' + VendorAssignmentAccountGroup);
            //Asif/Jyothi Changes for 193

            /*Code added for additional data*/
            var PurchasingGroup1 = req.data["PurchaseOrder"][0].PurchasingGroup;
            var CompanyCode1 = req.data["PurchaseOrder"][0].CompanyCode;
            var ShipToParty1 = req.data["PurchaseOrder"][0].ShipToParty;
            var VendorCountry1 = req.data["PurchaseOrder"][0].VendorCountry;
            var account_length = req.data["PurchaseOrder"][0].A_PurchaseOrderItem[0].A_PurOrdAccountAssignment.length;
            var SalesOrderNo = account_length > 0 ? req.data["PurchaseOrder"][0].A_PurchaseOrderItem[0].A_PurOrdAccountAssignment[0].SalesOrder : "";

            V_UpdateAdditionalData(req, PO, PurchasingGroup1, CompanyCode1, ShipToParty1, VendorCountry1, SalesOrderNo, POItem);

            /*End*/


            const checkPO = await tx.run(SELECT.one(A_PurchaseOrder).where({ PurchaseOrder: PO }).columns('PurchaseOrder'));
            if (checkPO != null) {
                await tx.run(UPDATE(A_PurchaseOrder).set(data).where({ PurchaseOrder: PO }))
                // let dbQuery = "CALL GET_POSTATUSMONITORING_ID(NEXT_ID => ?)";
                // // log.cfLoggingMessages('debug', 'dbQuery -> ' + dbQuery);
                // const result = await cds.run(dbQuery, {});
                // log.cfLoggingMessages('debug', 'Create_PO_Out => SP NEXT ID result' + JSON.stringify(result));
                // const ID = result.NEXT_ID[0].ID;
                // // log.cfLoggingMessages('info', req.data);
                // /* Implementation: Passing PurchaseOrderItem at the time of insertion on POSTATUSMONITORING
                //                 Change on : 28-05-2024
                //                 Author : Kanchan */

                // var data1 = {
                //     "ID": ID,
                //     "PO": PO,
                //     "ObjectType": 'Outbound',
                //     "Status": 'U',
                //     "PurchaseOrderItem": POItem,
                //     "Message": 'Purchase Order Updated'
                // }
                // // log.cfLoggingMessages('info', JSON.stringify(data1));
                // await tx.run(INSERT.into(POStatusMonitoring).entries(data1));
               
                // replacing insert postatusmonitoring with stored procedure CS
                let uspObtectType = 'Outbound';
                let uspStatus = 'U';
                let uspMessage = 'Purchase Order Updated'
                let dbQuery = "CALL USP_CREATE_POSTATUSMONITORING(I_PURCHASEORDER => " + PO + " ,I_POLINEITEM => " + "'" + POItem + "'" + " ,I_OBJECTTYPE => " + "'" + uspObtectType + "'" + " ,I_STATUS => " + "'" + uspStatus + "'" + " ,I_MESSAGE => " + "'" + uspMessage + "'" + ")";
                // log.logger('info', 'dbQuery -> ' + dbQuery);
                const result = await cds.run(dbQuery, {});
                log.logger('debug', 'USP_CREATE_POSTATUSMONITORING SP result (create out) 189' + JSON.stringify(result));
                 // replacing insert postatusmonitoring with stored procedure CE
                 if (data.SupplierRespSalesPersonName == 'X') {
                    /* Implementation: Before exception, commit the insert and update query
                            Change on : 31-05-2024
                            Author : Kanchan */
                    await tx.commit();
                    // Raise exception when Purchase Order Output is Supressed
                    const errorMessage = 'Purchase Order Output is Supressed';
                    throw new Error(errorMessage);
                }
            }
            else {
                await tx.run(INSERT.into(A_PurchaseOrder).entries(data));

                // let dbQuery = "CALL GET_POSTATUSMONITORING_ID(NEXT_ID => ?)";
                // // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
                // const result = await cds.run(dbQuery, {});
                // // log.cfLoggingMessages('info', 'SP NEXT ID result' + JSON.stringify(result));
                // const ID = result.NEXT_ID[0].ID;
                // // log.cfLoggingMessages('info', req.data);
                // /* Implementation: Passing PurchaseOrderItem at the time of insertion on POSTATUSMONITORING
                //                 Change on : 28-05-2024
                //                 Author : Kanchan */

                // var data2 = {
                //     "ID": ID,
                //     "PO": PO,
                //     "ObjectType": 'Outbound',
                //     "Status": 'Created',
                //     "PurchaseOrderItem": POItem,
                //     "Message": 'Purchase Order Created'
                // }
                // // log.cfLoggingMessages('info', JSON.stringify(data2));
                // await tx.run(INSERT.into(POStatusMonitoring).entries(data2));

                 // replacing insert postatusmonitoring with stored procedure CS
                 let uspObtectType = 'Outbound';
                 let uspStatus = 'Created';
                 let uspMessage = 'Purchase Order Created'
                 let dbQuery = "CALL USP_CREATE_POSTATUSMONITORING(I_PURCHASEORDER => " + PO + " ,I_POLINEITEM => " + "'" + POItem + "'" + " ,I_OBJECTTYPE => " + "'" + uspObtectType + "'" + " ,I_STATUS => " + "'" + uspStatus + "'" + " ,I_MESSAGE => " + "'" + uspMessage + "'" + ")";
                 // log.logger('info', 'dbQuery -> ' + dbQuery);
                 const result = await cds.run(dbQuery, {});
                 log.logger('debug', 'USP_CREATE_POSTATUSMONITORING SP result (create out) 224' + JSON.stringify(result));
                  // replacing insert postatusmonitoring with stored procedure CE

                if (data.SupplierRespSalesPersonName == 'X') {
                    /* Implementation: Before exception, commit the insert and update query
                            Change on : 31-05-2024
                            Author : Kanchan */
                    await tx.commit();
                    // Raise exception when Purchase Order Output is Supressed
                    const errorMessage = 'Purchase Order Output is Supressed';
                    throw new Error(errorMessage);
                }
            }

            const Plant = req.data["PurchaseOrder"][0].A_PurchaseOrderItem[0].Plant;

            // Defect 193 on 19/02 - Validation for Vendor Account Assignment Group
            let query1 = await tx.run(SELECT.one(ZCROSSREF).where({ FUNCTION_CODE: 'VENDOR_ACCOUNT_GRP', SAP_Code: VendorAssignmentAccountGroup }));
            // log.cfLoggingMessages('info', "query1:", query1);
            //  Added undefined check for vendor account group fix - 15/04
            if (query1 !== null && query1 !== '' && query1 !== undefined) {



                const OutPut = await tx.run(SELECT.from(GetAdditionalData).where({ PurchaseOrder: [PO, '0'] }).columns('Seg', 'Value', 'Mattype'));
                log.cfLoggingMessages('debug', 'Output ####' + OutPut)
                // Kowsalyaa for Defect 182 on 25-01-24
                var MOS_Error;
                var customError;
                if (OutPut.length) {
                    OutPut.map(item => {
                        if (((item.Seg === 'SG9-TDT-C220-8066-1') || (item.Seg === 'SG9-TDT-C220-8066-2')) && !(item.Value)) {
                            MOS_Error = true;
                            // log.cfLoggingMessages('info', 'CUSTOM ERROR')
                            customError = new Error('MOS Value is Null');
                            customError.error = {
                                code: '400',
                                message: 'MOS value is null, PO not sent out',
                                target: 'edifact_field',
                                status: 400
                            };
                        };
                    })
                    if (MOS_Error) {
                        await tx.commit();
                        throw customError;
                    }
                }
                /*Implementaion: If Destination code is null, we should not send to the Edifact to the GITP.
                Defect: 58
                Author: Mohammed Asif Baba
                Date: 15-06-2024 */
                if (OutPut.length) {
                    OutPut.map(item => {
                        if (((item.Seg === 'SG9-SG10-LOC-C519-3223-1') || (item.Seg === 'SG9-SG10-LOC-C519-3223-2')) && !(item.Value)) {
                            MOS_Error = true;
                            // log.cfLoggingMessages('info', 'CUSTOM ERROR')
                            customError = new Error('Destination Value is Null');
                            customError.error = {
                                code: '400',
                                message: 'Destination value is null, PO not sent out',
                                target: 'edifact_field',
                                status: 400
                            };
                        };
                    })
                    if (MOS_Error) {
                        await tx.commit();
                        throw customError;
                    }
                }

                const GlobalValue = await tx.run(SELECT.one(PurchaseGroup_GlobalCode).where({ PurchaseGroup: PurchasingGroup }).columns('PartIndicator'));
                const PartIndicator = GlobalValue.PartIndicator;

                if (PartIndicator != null && PartIndicator == 'X') {

                    const Drop = await tx.run(SELECT.one(ZCROSSREF).where({ Function_Code: 'PART_DROP', SAP_Code: Plant }).columns('SAP_Code'));
                    if (Drop != null)
                        OutPut.unshift({ "Seg": "PurchaseOrderType", "Value": "PART_DROP" });
                    else
                        OutPut.unshift({ "Seg": "PurchaseOrderType", "Value": "PART_STOCK" });
                }
                else {
                    const Drop = await tx.run(SELECT.one(ZCROSSREF).where({ Function_Code: 'FG_DROP', SAP_Code: Plant }).columns('SAP_Code'));
                    if (Drop != null)
                        OutPut.unshift({ "Seg": "PurchaseOrderType", "Value": "FG_DROP" });
                    else
                        OutPut.unshift({ "Seg": "PurchaseOrderType", "Value": "FG_STOCK" });
                }
                //Asif changes 03/11
                return OutPut;
            } else {
                // Save the data to A_Purachaseorder Table when vendor Account group is not 1000
                await tx.commit();
                // Raise exception for vendor account group other than 1000
                const errorMessage = 'Vendor not relevant for GITP output. PO is ignored';
                throw new Error(errorMessage);
            }
        }
        catch (error) {
            log.cfLoggingMessages('error', 'ERROR in Create_PO_Out' + error)
            if (error?.message?.includes('invalid number exception: invalid number: not a valid number string \'\'')) {
                // log.cfLoggingMessages('info', 'ERROR IN IF')
                req.error({
                    code: '400',
                    message: 'MOS Value is null, PO not sent out',
                    target: 'Edifact_Field_Outside_Catch',
                    status: 400
                })
            } else if (error?.message?.includes('Vendor not relevant for GITP output. PO is ignored')) {
                log.cfLoggingMessages('errpr', 'ERROR IN ELSE' + error)
                req.error({
                    code: '400',
                    message: error.message,
                    target: 'some_field',
                    status: 418
                })
            }
            /*Implementaion: Added Purchase Order Output suppressed condition check explicitly send to send status as 418.
             Author: Kowsalyaa Kumar
             Date: 04-06-2024 */
            else if (error?.message?.includes('Purchase Order Output is Supressed')) {
                log.cfLoggingMessages('error', 'ERROR IN suppress' + error)
                req.error({
                    code: '400',
                    message: error.message,
                    target: 'some_field',
                    status: 418
                })
            }
            else {
                log.cfLoggingMessages('error', 'ERROR IN ELSE' + error)
                req.error({
                    code: '400',
                    message: error.message,
                    target: 'some_field',
                    status: 400
                })
            }
        } return false;
    })

    this.on('zvendor_ref_delete', async (req) => {
        const { Client, Legacy, Vendor } = req.data;
        var del9 = await DELETE.from`BTP_PANASONIC.VENDOR_REF`.where`Client=${Client} and Legacy=${Legacy} and Vendor=${Vendor}`;
        return del9;

    });

    this.on('zordermark_delete', async (req) => {
        const { MANDT, ORDERMARK } = req.data;
        var del10 = await DELETE.from`BTP_PANASONIC.ORDERMARK`.where`MANDT=${MANDT} and ORDERMARK=${ORDERMARK}`;
        return del10;

    });

    this.on('zfixed_delete', async (req) => {
        const { Sequence_Number } = req.data;
        var del12 = await DELETE.from`BTP_PANASONIC.FIXED_VALUE`.where`Sequence_Number=${Sequence_Number}`;
        return del12;
    });




    // this.on('PostData', async req => {

    //     try {
    //         const tx = cds.tx(req);
    //         log.cfLoggingMessages('debug', 'PostData' + req);
    //         // log.cfLoggingMessages('info',result);
    //         const request = require('request');
    //         const url = 'https://panasonic-corporation-of-north-america-dev-2cecmgyw-dev34b28eb0.cfapps.us21.hana.ondemand.com/po-outbound-process/A_PurchaseOrder';
    //         const data = {
    //             PurchaseOrder: '2222222222',
    //             CompanyCode: 'BOSS',
    //             PurchaseOrderType: 'AA',
    //             Supplier: 'BRAVE'
    //         };
    //         const post = request.post({ url: url, json: data });
    //         // log.cfLoggingMessages('info', post);
    //         return true;
    //     } catch (error) {
    //         log.cfLoggingMessages('error', 'Error in PostData' + error.message);
    //     }
    //     return false;

    // })



    this.before(['UPDATE'], 'A_PurchaseOrder', async (req) => {
        try {
            log.cfLoggingMessages('debug', 'A_PurchaseOrder.before' + req)
            const tx = cds.tx(req);

            const PurchaseOrder = req.data.PurchaseOrder;
            // log.cfLoggingMessages('info', 'PurchaseOrder' + PurchaseOrder);
            const ConfirmationString = req.data.poConfirmationString;
            // log.cfLoggingMessages('info', 'poConfirmationStringNew' + ConfirmationString);

            const GetPOValue = await tx.run(SELECT.one(A_PurchaseOrder).where({ PurchaseOrder: PurchaseOrder }).columns('PurchaseOrder', 'poConfirmationString'));

            if (GetPOValue != null) {
                const poConfirmationString = GetPOValue.poConfirmationString;
                // log.cfLoggingMessages('info', 'poConfirmationStringold:' + poConfirmationString);

                let selectQuery1 = "SELECT ifnull(max(LineItem)+1,1) as LineItem from PO_Outbound_Process.POConfirmationHistory where PO = '" + PurchaseOrder + "'";
                let query1 = cds.parse.cql(selectQuery1);
                let result1 = await tx.run(query1);
                const LineItem = result1[0].LineItem;


                // log.cfLoggingMessages('info', 'LineItemNo:' + LineItem);

                var data = {
                    "PO": PurchaseOrder,
                    "LineItem": LineItem,
                    "ConfirmationString": poConfirmationString
                }
                log.cfLoggingMessages('debug', 'data' + JSON.stringify(data));
                tx.run(INSERT.into(POConfirmationHistory).entries(data));

            }
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

    })

    this.after(['CREATE', 'UPDATE'], 'A_PurchaseOrder', async function (_, req) {
        try {
            log.cfLoggingMessages('debug', 'A_PurchaseOrder.after' + req)
            const tx = cds.tx(req);

            var PurchaseOrder = req.data.PurchaseOrder;
            var poConfirmationString = req.data.poConfirmationString;
            // log.cfLoggingMessages('info', 'PurchaseOrder 1' + PurchaseOrder);
            const V_PurchasingGroup = await tx.run(SELECT.one(A_PurchaseOrder).where({ PurchaseOrder: PurchaseOrder }).columns('PurchaseOrder', 'PurchasingGroup')); // Kowsalyaa For Defect FINT00011 ON 17-11
            // log.cfLoggingMessages('info', 'V_PurchasingGroup', V_PurchasingGroup)

            var ojson = poConfirmationString;
            var obj = JSON.parse(ojson);
            const ConDate = obj.Interchange.S_UNB.C_S004.D_0017;
            const ConTime = obj.Interchange.S_UNB.C_S004.D_0019;
            // log.cfLoggingMessages('info', 'ConDate 2' + ConDate);
            var year = ConDate.substring(0, 2);
            var month = ConDate.substring(2, 4);
            var day = ConDate.substring(4, 6);
            var hour = ConTime.substring(0, 2);
            var Min = ConTime.substring(2, 4);

            const ConfirmationDate = "20" + year + '-' + month + '-' + day + 'T' + hour + ':' + Min + ':00Z';
            // log.cfLoggingMessages('info', "ConfirmationDate" + ConfirmationDate);
            var PurchaseOrderItem = "", SequenceNo = 1, DeliveryDate = null, Quanity = 0, Material = "", Party_Id_Identification = "", FactoryRefNo = "";
            var Substitute = "", NetPriceAmount = "", ShipmentMethod = "", JapanPONumber = "", SupplierCode = "";
            var ReceiverCode = "", SalesTradeTermCode = "", ModelID = "", TransactionID = "", SettlementTradeTermCode = "", PurchasingOrganization = "", CompanyCode = "";
            var ResponsibleEmployee = "", PartnerCode = "", ConsigneeCode = "", PayerCode = "", SellerCode = "", VendorOrder = "";
            var PackageTypeCode = "", SalesUnitPrice = "", PurchaseOrderQuantityUnit = "", WarehouseCode = "", PartnerWarehouse = "", DeliveryDateETA = "";
            var Reasoncode_1 = "", Reasoncode_2 = "";  //Defect 211 on 08-02
            let Reasoncode = "";
            let Reasoncode_val1, Reasoncode_val2;
            // log.cfLoggingMessages('info', "PO Line" + Object.keys(obj.Interchange).length);
            const ConfirmationDataFinal = [];
            var ItemData = obj.Interchange.M_ORDRSP;
            // log.cfLoggingMessages('info', "data" + JSON.stringify(ItemData));
            PurchaseOrder = ItemData.S_BGM.D_1004;
            // log.cfLoggingMessages('info', "PurchaseOrder12:" + PurchaseOrder);


            for (let i = 0; i < Object.keys(ItemData.G_SG1).length; i++) {
                log.cfLoggingMessages('debug', 'G_SG1: :' + ItemData.G_SG1);
                var G_SG1 = {};
                if (Object.keys(ItemData.G_SG1).length == 1)
                    G_SG1 = ItemData.G_SG1;
                else G_SG1 = ItemData.G_SG1[i];
                // log.cfLoggingMessages('info', "G_SG1:" + JSON.stringify(G_SG1));

                if (G_SG1.S_RFF.C_C506.D_1153 == "SS")
                    FactoryRefNo = G_SG1.S_RFF.C_C506.D_1154;

                if (G_SG1.S_RFF.C_C506.D_1153 == "FR5")
                    ModelID = G_SG1.S_RFF.C_C506.D_1154;

                if (G_SG1.S_RFF.C_C506.D_1153 == "FR7")
                    TransactionID = G_SG1.S_RFF.C_C506.D_1154;

                if (G_SG1.S_RFF.C_C506.D_1153 == "FR1")
                    PurchasingOrganization = G_SG1.S_RFF.C_C506.D_1154;

                if (G_SG1.S_RFF.C_C506.D_1153 == "FR2")
                    CompanyCode = G_SG1.S_RFF.C_C506.D_1154;

                if (G_SG1.S_RFF.C_C506.D_1153 == "VN")
                    VendorOrder = G_SG1.S_RFF.C_C506.D_1154;

                if (G_SG1.S_RFF.C_C506.D_1153 == "SS")
                    FactoryRefNo = G_SG1.S_RFF.C_C506.D_1154;

            }
            for (let i = 0; i < Object.keys(ItemData.G_SG2).length; i++) {
                var G_SG2 = {};
                if (Object.keys(ItemData.G_SG2).length == 1)
                    G_SG2 = ItemData.G_SG2;
                else G_SG2 = ItemData.G_SG2[i];

                log.cfLoggingMessages('debug', "G_SG2:" + JSON.stringify(G_SG2));
                if (G_SG2.S_NAD.D_3035 == "BY") {

                    if (G_SG2.S_NAD.C_C080 != undefined)
                        Substitute = G_SG2.S_NAD.C_C080.D_3036_5;
                    if (G_SG2.G_SG5 != undefined)
                        ResponsibleEmployee = G_SG2.G_SG5.S_CTA.C_C056.D_3412;

                    Party_Id_Identification = G_SG2.S_NAD.C_C082.D_3039;
                }
                if (G_SG2.S_NAD.D_3035 == "SE") {
                    // Substitute = G_SG2.S_NAD.C_C080.D_3036_5;
                    if (G_SG2.G_SG5 != undefined)
                        SellerCode = G_SG2.G_SG5.S_CTA.C_C056.D_3412;
                }
                if (G_SG2.S_NAD.D_3035 == "PC")
                    PartnerCode = G_SG2.S_NAD.C_C082.D_3039;
                if (G_SG2.S_NAD.D_3035 == "CN")
                    ConsigneeCode = G_SG2.S_NAD.C_C082.D_3039;
                if (G_SG2.S_NAD.D_3035 == "PR")
                    PayerCode = G_SG2.S_NAD.C_C082.D_3039;

            }

            if (ItemData.G_SG11 != undefined)
                for (let i = 0; i < Object.keys(ItemData.G_SG11).length; i++) {

                    var G_SG11 = {};
                    if (Object.keys(ItemData.G_SG11).length == 1)
                        G_SG11 = ItemData.G_SG11;
                    else G_SG11 = ItemData.G_SG11[i];

                    log.cfLoggingMessages('debug', "G_SG11:" + JSON.stringify(G_SG11));

                    if (G_SG11.S_TOD.D_4055 == "1")
                        SalesTradeTermCode = G_SG11.S_TOD.C_C100.D_4053;
                    if (G_SG11.S_TOD.D_4055 == "6")
                        SettlementTradeTermCode = G_SG11.S_TOD.C_C100.D_4053;
                }

            // log.cfLoggingMessages('info', 'test');
            // log.cfLoggingMessages('info', Object.keys(ItemData.G_SG25).length);
            // log.cfLoggingMessages('info', JSON.stringify(ItemData.G_SG25));
            var count = 1;
            if (Array.isArray(ItemData.G_SG25))
                count = Object.keys(ItemData.G_SG25).length;

            // log.cfLoggingMessages('info', "Item length:" + count);

            for (let i = 0; i < count; i++) {
                Reasoncode = ""; Reasoncode_val1 = ""; Reasoncode_val2 = "";//def : 24 Bhushan
                let Status;
                let StatusMessage;
                const ConfirmationData = {};
                var G_SG25 = {};
                if (Array.isArray(ItemData.G_SG25))
                    G_SG25 = ItemData.G_SG25[i];
                else
                    G_SG25 = ItemData.G_SG25;

                // log.cfLoggingMessages('info', "G_SG25:" + JSON.stringify(G_SG25));


                PurchaseOrderItem = G_SG25.S_LIN.D_1082;
                Material = G_SG25.S_LIN.C_C212.D_7140;
                NetPriceAmount = G_SG25.G_SG27.S_PRI.C_C509.D_5118;

                if (G_SG25.G_SG29 != undefined) {
                    PackageTypeCode = G_SG25.G_SG29.S_PAC.C_C202.D_7065;
                }

                if (G_SG25.G_SG44 != undefined)
                    ShipmentMethod = G_SG25.G_SG44.S_TDT.C_C220.D_8066;

                for (let j = 0; j < Object.keys(G_SG25.G_SG28).length; j++) {

                    var G_SG28 = {};
                    if (Object.keys(G_SG28).length == 1)
                        G_SG28 = G_SG25.G_SG28;
                    else G_SG28 = G_SG25.G_SG28[j];

                    // log.cfLoggingMessages('info', "G_SG28:" + JSON.stringify(G_SG28));

                    if (G_SG28.S_RFF.C_C506.D_1153 == "JPO")
                        JapanPONumber = G_SG28.S_RFF.C_C506.D_1154;

                    if (G_SG28.S_RFF.C_C506.D_1153 == "EPD")
                        SalesUnitPrice = G_SG28.S_RFF.C_C506.D_1154;

                    //Defect 211 on 21-02
                    if (G_SG28.S_RFF.C_C506.D_1154) {
                        let Reason1, Reason2;

                        if (G_SG28.S_RFF.C_C506.D_1153 == "RFC") {
                            Reasoncode_1 = G_SG28.S_RFF.C_C506.D_1154;
                            // log.cfLoggingMessages('info', "Reasoncode_1" + Reasoncode_1);
                            // Defect211 on 15/02
                            Reason1 = await tx.run(SELECT.one(ZCROSSREF).where({ Function_Code: 'REASON_CODE', SAP_Code: Reasoncode_1 }).columns('Parameter2'));
                            // log.cfLoggingMessages('info', "Reason1: " + Reason1.Parameter2);
                            Reasoncode_val1 = Reason1.Parameter2;
                        }


                        if (G_SG28.S_RFF.C_C506.D_1153 == "DCN") {
                            Reasoncode_2 = G_SG28.S_RFF.C_C506.D_1154;
                            // log.cfLoggingMessages('info', "Reasoncode_2" + Reasoncode_2);
                            Reason2 = await tx.run(SELECT.one(ZCROSSREF).where({ Function_Code: 'REASON_CODE', SAP_Code: Reasoncode_2 }).columns('Parameter2'));
                            // log.cfLoggingMessages('info', "Reason2: " + Reason2.Parameter2);
                            Reasoncode_val2 = Reason2.Parameter2;

                        }
                        // log.cfLoggingMessages('info', "Reasoncode_val1: " + Reasoncode_val1);
                        // log.cfLoggingMessages('info', "Reasoncode_val2: " + Reasoncode_val2);

                        if (Reasoncode_val1 && Reasoncode_val2) {
                            // log.cfLoggingMessages('info', 'REASON CODE FINAL VALUE', Reasoncode)
                            Reasoncode = Reasoncode_val1 + ',' + Reasoncode_val2;
                            // log.cfLoggingMessages('info', "REASON CODE FINAL VALUE: " + Reasoncode);
                        }
                        else if (Reasoncode_val1) {
                            // log.cfLoggingMessages('info', "REASON CODE VAL1: " + Reasoncode);
                            Reasoncode = Reasoncode_val1;
                            // log.cfLoggingMessages('info', "REASON CODE VAL1: " + Reasoncode);

                        } else if (Reasoncode_val2) {
                            // log.cfLoggingMessages('info', "REASON CODE VAL2: " + Reasoncode);
                            Reasoncode = Reasoncode_val2;
                            // log.cfLoggingMessages('info', "REASON CODE VAL2: " + Reasoncode);
                        }


                    }


                }

                var count1 = 1;
                if (Array.isArray(G_SG25.G_SG34))
                    count1 = Object.keys(G_SG25.G_SG34).length;

                for (let j = 0; j < count1; j++) {

                    var G_SG34 = {};
                    if (Array.isArray(G_SG25.G_SG34))
                        G_SG34 = G_SG25.G_SG34[j];
                    else
                        G_SG34 = G_SG25.G_SG34;


                    log.cfLoggingMessages('debug', "G_SG34:" + JSON.stringify(G_SG34));

                    if (G_SG34.S_NAD.D_3035 == "SU")
                        SupplierCode = G_SG34.S_NAD.C_C082.D_3039;

                    if (G_SG34.S_NAD.D_3035 == "DP")
                        WarehouseCode = G_SG34.S_NAD.C_C082.D_3039;

                    if (G_SG34.S_NAD.D_3035 == "DP2")
                        PartnerWarehouse = G_SG34.S_NAD.C_C082.D_3039;
                }

                // Def 25 14-03-2024 Start

                // split quantity scenario G_SG48 is an array otherwise it is object
                //and making it as an array 
                //check G_SG48 is array
                if (!Array.isArray(G_SG25.G_SG48)) {
                    // log.cfLoggingMessages('info', "G_SG49:length" + JSON.stringify(Object.keys(G_SG25.G_SG48.G_SG49).length));
                    let G_SG48_val = G_SG25.G_SG48;
                    //Make G_SG48 as an array
                    G_SG25.G_SG48 = [G_SG48_val];
                }
                // else  // Removing this else part as it is not allowing the data to flow
                // log.cfLoggingMessages('info', "G_SG48:length" + JSON.stringify(Object.keys(G_SG25.G_SG48).length));

                //for loop sg48 starts
                for (let sg = 0; sg < G_SG25.G_SG48.length; sg++) {
                    var count2 = 1;
                    if (Array.isArray(G_SG25.G_SG48[sg].G_SG49))
                        count2 = Object.keys(G_SG25.G_SG48[sg].G_SG49).length;

                    for (let j = 0; j < count2; j++) {

                        var G_SG49 = {};
                        if (Array.isArray(G_SG25.G_SG48[sg].G_SG49))
                            G_SG49 = G_SG25.G_SG48[sg].G_SG49[j];
                        else
                            G_SG49 = G_SG25.G_SG48[sg].G_SG49;

                        // log.cfLoggingMessages('info', "G_SG49:" + JSON.stringify(G_SG49));
                        // log.cfLoggingMessages('info', "count" + G_SG49.S_QTY.C_C186);
                        // log.cfLoggingMessages('info', "count1" + G_SG49.S_QTY.C_C186.D_6063);

                        if (G_SG49.S_QTY.C_C186.D_6063 == "21") {
                            Quanity = G_SG49.S_QTY.C_C186.D_6060;
                            PurchaseOrderQuantityUnit = G_SG49.S_QTY.C_C186.D_6411;
                        }
                        // log.cfLoggingMessages('info', "Quanity" + Quanity);
                        // log.cfLoggingMessages('info', "PurchaseOrderQuantityUnit" + PurchaseOrderQuantityUnit);
                        log.cfLoggingMessages('info', 'checkvalues:' + PurchaseOrder + PurchaseOrderItem + parseInt(SequenceNo) + parseInt(Quanity));
                        if (G_SG49.S_DTM != undefined) {
                            for (let k = 0; k < Object.keys(G_SG49.S_DTM).length; k++) {
                                var S_DTM = {};
                                if (Object.keys(G_SG49.S_DTM).length == 1)
                                    S_DTM = G_SG49.S_DTM;
                                else S_DTM = G_SG49.S_DTM[k];

                                log.cfLoggingMessages('debug', "S_DTM:" + JSON.stringify(S_DTM));

                                if (S_DTM.C_C507.D_2005 == "133") { //PART and FG
                                    DeliveryDate = S_DTM.C_C507.D_2380;
                                    var year = DeliveryDate.substring(0, 4);
                                    var month = DeliveryDate.substring(4, 6);
                                    var day = DeliveryDate.substring(6, 8);

                                    DeliveryDate = year + '-' + month + '-' + day;//+'T00:00:00';
                                }
                                /* Implementation: As per the functional requirement FG should consider the 65P segment not the 65
                                Change on : 09-05-2024
                                Author : Mohammed Asif baba */
                                // if (S_DTM.C_C507.D_2005 == "65P") { //FG
                                //     DeliveryDateETA = S_DTM.C_C507.D_2380;
                                //     var year = DeliveryDateETA.substring(0, 4);
                                //     var month = DeliveryDateETA.substring(4, 6);
                                //     var day = DeliveryDateETA.substring(6, 8);

                                //     DeliveryDateETA = year + '-' + month + '-' + day;//+'T00:00:00';
                                // }

                            }


                            if (DeliveryDateETA == "") {

                                // log.cfLoggingMessages('info', "DeliveryDate:" + DeliveryDate);
                                var DeliveryDateETA1 = DeliveryDate;

                                if (DeliveryDate == "9999-99-99") {
                                    DeliveryDate = "2999-12-31";
                                }
                                if (DeliveryDate == "0000-00-00") {
                                    DeliveryDate = "1111-12-31";
                                }
                                if (DeliveryDate == "" || DeliveryDate == null || DeliveryDate == undefined) {
                                    DeliveryDate = "1111-12-31";
                                }
                                const checkETADays = await tx.run(SELECT.one(ZMM_MOS).where({ Mos_code: ShipmentMethod }).columns('NumberOfDays'));
                                log.cfLoggingMessages('debug', "checkETADays" + JSON.stringify(checkETADays));
                                log.cfLoggingMessages('debug', "DeliveryDate1" + JSON.stringify(DeliveryDate));
                                var DeliveryDt = new Date(DeliveryDate);
                                // log.cfLoggingMessages('info', "DeliveryDt1:" + DeliveryDt);
                                // const GlobalValue = await tx.run(SELECT.one(PurchaseGroup_GlobalCode).where({ PurchaseGroup: V_PurchasingGroup.PurchasingGroup }).columns('PartIndicator'));
                                // const PartIndicator = GlobalValue.PartIndicator;
                                // // log.cfLoggingMessages('info', 'PART INDICATIOR', PartIndicator);
                                // if (!PartIndicator) {
                                //     DeliveryDt.setDate(DeliveryDt.getDate()) // Kowsalyaa For Defect FINT00011 ON 17-11
                                // } else {
                                    DeliveryDt.setDate(DeliveryDt.getDate() + parseInt(checkETADays.NumberOfDays))
                                // }

                                // log.cfLoggingMessages('info', "DeliveryDt2:" + DeliveryDt);

                                var month = '' + (DeliveryDt.getMonth() + 1);
                                var day = '' + DeliveryDt.getDate();
                                var year = DeliveryDt.getFullYear();

                                if (month.length < 2)
                                    month = '0' + month;
                                if (day.length < 2)
                                    day = '0' + day;

                                DeliveryDateETA = year + '-' + month + '-' + day;
                                // log.cfLoggingMessages('info', "DeliveryDateETA:" + year + month + day);
                            }
                        }
                    }
                    const checkSequence = await tx.run(SELECT.one(POConfirmationData).where({ PurchaseOrder: PurchaseOrder, PurchaseOrderItem: PurchaseOrderItem, DeliveryDate: DeliveryDate }).orderBy({ SequenceNo: "desc" }).columns('SequenceNo','RevisionNumber'));
                        
                    if (i == 0) {
                       // const checkSequence = await tx.run(SELECT.one(POConfirmationData).where({ PurchaseOrder: PurchaseOrder, PurchaseOrderItem: PurchaseOrderItem, DeliveryDate: DeliveryDate }).orderBy({ SequenceNo: "desc" }).columns('SequenceNo','RevisionNumber'));
                        // log.cfLoggingMessages('debug', '1' + JSON.stringify(checkSequence));

                        // if (checkSequence != null && checkSequence.REVISIONNUMBER === undefined) {
                        //     // log.cfLoggingMessages('debug', '2' + JSON.stringify(checkSequence));
                        //     SequenceNo = SequenceNo + 1;
                        // }
                        if(checkSequence != null ){
                            SequenceNo = checkSequence.SequenceNo + 1;
                        }
                        // log.cfLoggingMessages('info', '3' + JSON.stringify(checkSequence));
                    }
                    else if (i > 0 && checkSequence == null) {
                        SequenceNo = SequenceNo + 1;
                    }
                    else if (i > 0 && checkSequence != null ) {
                        SequenceNo = checkSequence.SequenceNo + 1;
                    }
                    // log.cfLoggingMessages('info', "Asif_PO" + PurchaseOrder);
                    let Revision_num = 0;
                    let resultset = await tx.run("Select max(RevisionNumber) as Revision from BTP_Panasonic_POConfirmationData where PURCHASEORDER = '" + PurchaseOrder + "' ");
                    log.cfLoggingMessages('info', 'RevisionNumber' + resultset.Revision);
                    if (resultset[0].REVISION === null) {
                        resultset[0].REVISION == 0;
                        Revision_num = resultset[0].REVISION + 1;
                    }
                    else {
                        Revision_num = resultset[0].REVISION + 1;
                    }
                    log.cfLoggingMessages('info', 'RevisionNumber' + Revision_num);
                    let Edifact_id = await tx.run("Select PO,Max(BTP_Panasonic_PO_List.ID_ID) as MAXPO from BTP_Panasonic_PO_List  where BTP_Panasonic_PO_List.PO = '" + [PurchaseOrder] + "' and exists (Select BTP_Panasonic_Edifact_Header.ID from BTP_Panasonic_Edifact_header where BTP_Panasonic_PO_List.ID_ID = BTP_Panasonic_Edifact_Header.ID AND BTP_Panasonic_Edifact_Header.object = 'Inbound') group by BTP_Panasonic_PO_List.PO");
                    if (DeliveryDate == "2999-12-31" || DeliveryDateETA == "9999-99-99") {
                        Status = 'E-DATE';
                        StatusMessage = 'ETA Date not yet determined 9999-99-99'
                    }
                    if (DeliveryDate == "1111-12-31"  || DeliveryDateETA == "0000-00-00") {

                        Status = 'E-DATE';
                        StatusMessage = 'ETA Date not yet determined 0000-00-00'
                    }

                    if (DeliveryDate != "1111-12-31" && DeliveryDate != "2999-12-31" && DeliveryDateETA != "0000-00-00" && DeliveryDateETA != "9999-99-99") {
                        Status = undefined;
                        StatusMessage = undefined;
                    }
                    if (!DeliveryDate) {

                        Status = 'E-DATE';
                        StatusMessage = 'E-DATE'
                    }  // Nithya code 01/02

                    if (DeliveryDateETA == "9999-99-99") {
                        DeliveryDateETA = "2999-12-31";
                    }
                    if (DeliveryDateETA == "0000-00-00") {
                        DeliveryDateETA =  "1111-12-31";;
                    }
                    // Kanchan Code 15/01
                    const confirmationData = {
                        "PurchaseOrder": PurchaseOrder,
                        "PurchaseOrderItem": PurchaseOrderItem,
                        "SequenceNo": parseInt(SequenceNo),
                        "DeliveryDate": DeliveryDate,
                        "Quanity": parseInt(Quanity),
                        "Material": Material,
                        "Party_Id_Identification": Party_Id_Identification,
                        "FactoryRefNo": FactoryRefNo,
                        "Substitute": Substitute,
                        "NetPriceAmount": NetPriceAmount,
                        "ShipmentMethod": ShipmentMethod,
                        "JapanPONumber": JapanPONumber,
                        "SupplierCode": SupplierCode,
                        "ReceiverCode": ReceiverCode,
                        "SalesTradeTermCode": SalesTradeTermCode,
                        "ModelID": ModelID,
                        "TransactionID": TransactionID,
                        "SettlementTradeTermCode": SettlementTradeTermCode,
                        "PurchasingOrganization": PurchasingOrganization,
                        "CompanyCode": CompanyCode,
                        "ResponsibleEmployee": ResponsibleEmployee,
                        "PartnerCode": PartnerCode,
                        "ConsigneeCode": ConsigneeCode,
                        "PayerCode": PayerCode,
                        "SellerCode": SellerCode,
                        "VendorOrder": VendorOrder,
                        "PackageTypeCode": PackageTypeCode,
                        "SalesUnitPrice": SalesUnitPrice,
                        "Vendor": null,
                        "WarehouseCode": WarehouseCode,
                        "PartnerWarehouse": PartnerWarehouse,
                        "ConfirmationDate": ConfirmationDate,
                        "PurchaseOrderQuantityUnit": PurchaseOrderQuantityUnit,
                        "DeliveryDateETA": DeliveryDateETA,
                        "Status": Status,
                        "ReasonCode": Reasoncode,   //Defect 211 on 08-02
                        "Message": StatusMessage,
                        "RevisionNumber": Revision_num,
                        "EdifactId": Edifact_id[0].MAXPO.toString()
                    };

                    DeliveryDateETA = "";
                    log.cfLoggingMessages('info', 'confirmationData' + JSON.stringify(confirmationData));

                    try {
                        ConfirmationDataFinal.push(confirmationData);

                    }
                    catch (error) {
                        log.cfLoggingMessages('error', 'error in A_PurchaseOrder =>' + error.message);
                    }
                }  //for loop sg48 end
            }
            // Def 25 14-03-2024 END

            log.cfLoggingMessages('info', 'confirmationDataFinalData' + JSON.stringify(ConfirmationDataFinal));
            try {
                tx.run(INSERT.into(POConfirmationData).entries(ConfirmationDataFinal));
                log.cfLoggingMessages('info', 'Record added successfully');

                // let dbQuery = "CALL GET_POSTATUSMONITORING_ID(NEXT_ID => ?)";
                // // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
                // const result = await cds.run(dbQuery, {});
                // log.cfLoggingMessages('debug', 'SP NEXT ID result' + JSON.stringify(result));
                // const ID = result.NEXT_ID[0].ID;
                // /* Implementation: Passing PurchaseOrderItem at the time of insertion on POSTATUSMONITORING
                //                 Change on : 28-05-2024
                //                 Author : Kanchan */

                // var data1 = {
                //     "ID": ID,
                //     "PO": PurchaseOrder,
                //     "ObjectType": 'Inbound',
                //     "Status": 'S',
                //     "PurchaseOrderItem": PurchaseOrderItem,
                //     "Message": 'Purchase Order Confirmation Recevied'
                // }
                // // log.cfLoggingMessages('info', JSON.stringify(data1));
                // tx.run(INSERT.into(POStatusMonitoring).entries(data1));
               
                 // replacing insert postatusmonitoring with stored procedure CS
                 let uspObtectType = 'Inbound';
                 let uspStatus = 'S';
                 let uspMessage = 'Purchase Order Confirmation Recevied';
                 let dbQuery = "CALL USP_CREATE_POSTATUSMONITORING(I_PURCHASEORDER => " + PurchaseOrder + " ,I_POLINEITEM => " + "'" + PurchaseOrderItem + "'" + " ,I_OBJECTTYPE => " + "'" + uspObtectType + "'" + " ,I_STATUS => " + "'" + uspStatus + "'" + " ,I_MESSAGE => " + "'" + uspMessage + "'" + ")";
                 // log.logger('info', 'dbQuery -> ' + dbQuery);
                 const result = await cds.run(dbQuery, {});
                 log.logger('debug', 'USP_CREATE_POSTATUSMONITORING SP result (create out) 955' + JSON.stringify(result));
                  // replacing insert postatusmonitoring with stored procedure CE

            }
            catch (error) {
                log.cfLoggingMessages('error', 'Error in POConfirmationData insert' + error.message);
            }

            var PurchasingGroup1 = req.data.PurchasingGroup;
            var CompanyCode1 = req.data.CompanyCode;
            var ShipToParty1 = req.data.ShipToParty;
            var SalesOrderNo = "";
            const GetPOValue = await tx.run(SELECT.one(A_PurchaseOrder).where({ PurchaseOrder: PurchaseOrder }).columns('PurchaseOrder', 'ShipToParty'));

            if (GetPOValue != null) {
                ShipToParty1 = GetPOValue.ShipToParty;
            }

            const GetSalesOrderNo = await tx.run(SELECT.distinct.from(A_PurOrdAccountAssignment).where({ PurchaseOrder: PurchaseOrder }).columns('SalesOrder'));

            if (GetSalesOrderNo != null) {
                SalesOrderNo = GetSalesOrderNo.ShipToParty;
            }

            V_UpdateAdditionalData(req, PurchaseOrder, PurchasingGroup1, CompanyCode1, ShipToParty1, SalesOrderNo, PurchaseOrderItem);

        }
        catch (error) {
            log.cfLoggingMessages('error', 'Error in A_PurchaseOrder =>' + error)
            req.error({
                code: '400',
                message: error.message,
                target: 'some_field',
                status: 418
            })
        }
    })

    //Asif changes for defect #143 on 17/12
    this.on('UPDATE_ABLine', async req => {
        try {
            
            log.cfLoggingMessages('debug', 'Srinivas Debug' + req.data);
            log.cfLoggingMessages('info', 'Srinivas Info' + req.data);
            log.cfLoggingMessages('error', 'Srinivas Error' + req.data); 
            log.cfLoggingMessages('debug', 'UPDATE_ABLine.on' + req.data); // Srinivas June 3 
            const tx = cds.tx(req);


            /*Start:Logic added for AB line */
            const PurchaseOrder = req.data.PurchaseOrder;

            // log.cfLoggingMessages('info', "UPDATE_ABLine:PO-" + PurchaseOrder);
            var PODATA = {};
            PODATA = {
                "PurchaseOrderID": PurchaseOrder,
                "CorrespondenceExternalReference": "",
                Item: []
            };

            //Asif changes 10/12
            //defect 91 changes for FactoryRefNo on 09/01/24 by jyothi
            // let selectQuery0 = await SELECT.from`PO_Outbound_Process.POConfirmationData`.where`Status = null and PurchaseOrder=${PurchaseOrder}`.columns('DeliveryDateETA', 'Quanity', 'SequenceNo', 'FactoryRefNo');
            let selectQuery0_1 = "SELECT * from BTP_PANASONIC_POCONFIRMATIONDATA as A where A.PurchaseOrder = '" + PurchaseOrder + "' and a.createdat in ( select max (b.createdat) from BTP_PANASONIC_POCONFIRMATIONDATA as b where A.PurchaseOrder = B.PurchaseOrder and A.PurchaseOrderitem = b.PurchaseOrderItem and a.factoryrefno =  b.factoryrefno  group by b.factoryrefno)";
            let query = cds.parse.cql(selectQuery0_1);
            let selectQuery0 = await tx.run(query);
            // log.cfLoggingMessages('info', "selectQuery0: ->" + selectQuery0); Srinivas Commented on June 3, 2024
            log.cfLoggingMessages('info', 'selectQuery0' + JSON.stringify(selectQuery0));
            if (selectQuery0) {
                const ItemsCount = selectQuery0.length;
                if (ItemsCount > 0) {
                    let selectQuery2 = await SELECT.from`PO_Outbound_Process.A_PurchaseOrderItem`.where`PurchaseOrder_PurchaseOrder =${PurchaseOrder}`.columns('PurchaseOrderItem', 'NetPriceAmount', 'OrderQuantity', 'DocumentCurrency', 'OrderPriceUnit', 'PurchaseOrderQuantityUnit', 'Material');//Defect 211 on 08-02
                    log.cfLoggingMessages('info', "selectQuery2: ->" + JSON.stringify(selectQuery2)); // Srinivas Added June 3,2024

                    if (selectQuery2) {
                        // log.cfLoggingMessages('info', 'SELECT QUERY2', JSON.stringify(selectQuery2));
                        for (const skill of selectQuery2) {

                            var L_PurchaseOrderItem = skill.PurchaseOrderItem;
                            // log.cfLoggingMessages('info', L_PurchaseOrderItem);
                            var L_DocumentCurrency = skill.DocumentCurrency;
                            // log.cfLoggingMessages('info', L_DocumentCurrency);
                            var L_OrderPriceUnit = skill.OrderPriceUnit;
                            // log.cfLoggingMessages('info', L_OrderPriceUnit);
                            var L_PurchaseOrderQuantityUnit = skill.PurchaseOrderQuantityUnit;
                            // log.cfLoggingMessages('info', L_PurchaseOrderQuantityUnit);
                            var L_NetPriceAmount = skill.NetPriceAmount;
                            // log.cfLoggingMessages('info', L_NetPriceAmount);
                            var L_OrderQuantity = skill.OrderQuantity;
                            // log.cfLoggingMessages('info', L_OrderQuantity);

                            let dbQuery = "CALL CHECK_ORDER_QTY_VAL(" + PurchaseOrder + "," + "'" + L_PurchaseOrderItem + "'" + " , STATUS => ?)";
                            // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
                            const sp_result = await cds.run(dbQuery, {});
                            log.cfLoggingMessages('debug', 'SP result' + JSON.stringify(sp_result));
                            const a_status = sp_result.STATUS;

                            // new material code validation - Kowsalyaa on 23-02
                            let MatdbQuery = await checkMaterial(PurchaseOrder, L_PurchaseOrderItem);


                            async function checkMaterial(PO, PO_ITEM) {
                                try {
                                    let STATUS = '';
                                    let CONF_STATUS = '';
                                    let MATR, SEQ_NO, CONF_MATR, ID;

                                    // Get Material from BTP_PANASONIC_A_PURCHASEORDERITEM
                                    MATR = await getMaterialFromPurchaseOrderItem(PO, PO_ITEM);
                                    MATR = MATR[0].SupplierMaterialNumber;
                                    // log.cfLoggingMessages('info', 'ORIGINAL MATERIAL', MATR)
                                    // Get latest MATERIAL and SEQUENCENO from BTP_PANASONIC_POCONFIRMATIONDATA
                                    let confirmationData = await getConfirmationData(PO, PO_ITEM);
                                    if (confirmationData.length) {
                                        CONF_MATR = confirmationData[0].Material;
                                        SEQ_NO = confirmationData[0].SEQUENCENO;
                                        CONF_STATUS = confirmationData[0].Status;
                                        // log.cfLoggingMessages('info', 'CONFIRMATION DATA', CONF_MATR, SEQ_NO, CONF_STATUS)
                                    } else {
                                        log.cfLoggingMessages('info', 'NO Data found for PO with status null')
                                        STATUS = 'F'
                                        return STATUS;
                                    }

                                    /* Implementation: To Make the proper Error Message in the Execution Log for the PO Confirmation for the Parts Substitution 
                                    Author: Mohammed Asif Baba
                                    Date: 15-05-2024  
                                    Defect: UAT_90 */
                                    if (MATR !== CONF_MATR) {
                                        STATUS = 'F';
                                        // Update error message in BTP_PANASONIC_POCONFIRMATIONDATA
                                        await updateErrorMessageInPOConfirmation(PO, PO_ITEM, SEQ_NO, CONF_MATR);
                                        // Create error message in POStatusMonitoring Table 
                                        ID = await getMaxIDFromPOStatusMonitoring();
                                        /* Implementation: Passing PurchaseOrderItem(PO_ITEM) at the time of insertion on POSTATUSMONITORING
                                Change on : 28-05-2024
                                Author : Kanchan */

                                        await insertIntoPOStatusMonitoring(ID, PO, 'EParts_SUB', 'Supplier Material : ' + MATR + ' does not match. Item: ' + PO_ITEM + ' Substituted Material : ' + CONF_MATR, PO_ITEM);
                                        return STATUS;
                                    } else {
                                        STATUS = 'T';
                                        return STATUS;
                                    }
                                }
                                catch (e) {
                                    log.cfLoggingMessages('error', 'ERROR IN CHECK MATERIAL' + e)
                                    req.error({
                                        code: '400',
                                        message: 'ERROR IN CHECK MATERIAL',
                                        target: PurchaseOrder,
                                        status: 418
                                    })
                                    return true;
                                }
                            }

                            async function getMaterialFromPurchaseOrderItem(PO, PO_ITEM) {
                                // Simulate getting Material from BTP_PANASONIC_A_PURCHASEORDERITEM
                                let Material = await SELECT.from`PO_Outbound_Process.A_PurchaseOrderItem`.where`PurchaseOrder_PurchaseOrder =${PO} and PurchaseOrderItem = ${PO_ITEM}`.columns('SupplierMaterialNumber');
                                // log.cfLoggingMessages('info', 'MATERIALLL', Material);
                                return Material;
                            }

                            async function getConfirmationData(PO, PO_ITEM) {
                                // Simulate getting latest MATERIAL and SEQUENCENO from BTP_PANASONIC_POCONFIRMATIONDATA
                                let data = await SELECT.from`PO_Outbound_Process.POConfirmationData`.where`Status=null and PurchaseOrder =${PO} and PurchaseOrderItem = ${PO_ITEM}`.columns('Material', 'Status', 'SEQUENCENO')
                                // log.cfLoggingMessages('info', 'DATA', data);
                                // Srinivas Added June 3, 2024 Begin
                                if (data && data.length == 0) {
                                    data = await SELECT.from`PO_Outbound_Process.POConfirmationData`.where`PurchaseOrder =${PO} and PurchaseOrderItem = ${PO_ITEM}`.columns('Material', 'Status', 'SEQUENCENO')
                                }
                                // Srinivas Added June 3, 2024 End 
                                return data;
                            }
                            /* Implementation: To Make the proper Error Message in the Execution Log for the PO Confirmation for the Parts Substitution 
                            Author: Mohammed Asif Baba
                            Date: 15-05-2024  
                            Defect: UAT_90 */
                            async function updateErrorMessageInPOConfirmation(PO, PO_ITEM, SEQ_NO, CONF_MATR) {
                                // Simulate updating error message in BTP_PANASONIC_POCONFIRMATIONDATA
                                var update_poconfirmationdata = await tx.run(UPDATE(POConfirmationData).set({ status: 'E-SUB', message: 'Supplier Material does not match. Substituted Material is  ' + CONF_MATR }).where({ PurchaseOrder: PO, PurchaseOrderItem: PO_ITEM, SequenceNo: SEQ_NO, Material: CONF_MATR }));
                                // var update_poconfirmationdata = await tx.run(UPDATE(POConfirmationData).set({ status: 'E', message: 'Material is not matched' }).where({ PurchaseOrder: PO, PurchaseOrderItem: '20', SequenceNo: 3, Material: 'DHMX1206ZAMA' }));
                                // log.cfLoggingMessages('info', "update_poconfirmationdata:" + update_poconfirmationdata);
                                return update_poconfirmationdata;
                            }

                            async function getMaxIDFromPOStatusMonitoring() {
                                // Simulate getting MAX(ID) from BTP_PANASONIC_POSTATUSMONITORING
                                let dbQuery = "CALL GET_POSTATUSMONITORING_ID(NEXT_ID => ?)";
                                // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
                                const result = await cds.run(dbQuery, {});
                                // log.cfLoggingMessages('info', 'SP NEXT ID result' + JSON.stringify(result));
                                //req.data.ID =   result.NEXT_ID[0].ID;
                                const ID = result.NEXT_ID[0].ID;
                                return ID;
                            }
                            /* Implementation: Passing PurchaseOrderItem(PO_ITEM) at the time of insertion on POSTATUSMONITORING
                                Change on : 28-05-2024
                                Author : Kanchan */

                            async function insertIntoPOStatusMonitoring(ID, PO, STATUS, MESSAGE, PO_ITEM) {
                                // Simulate inserting into POStatusMonitoring Table
                                const data = {
                                    "ID": ID,
                                    "PO": PO,
                                    "Status": STATUS,
                                    "PurchaseOrderItem": PO_ITEM,
                                    "MESSAGE": MESSAGE
                                }
                                const insertQuery = await INSERT.into('BTP_PANASONIC.POStatusMonitoring').entries(data)
                                // log.cfLoggingMessages('info', 'INSERT QUERY', insertQuery);
                                return insertQuery;
                            }

                            // log.cfLoggingMessages('info', 'MatdbQuery -> ' + MatdbQuery);
                            // log.cfLoggingMessages('info', 'SP result' + JSON.stringify(MatdbQuery));
                            const b_status = MatdbQuery;  // Defect 211 pt6

                            if (a_status == "T" && b_status == "T") {
                                let selectQuery0_2 = "SELECT DELIVERYDATEETA as DeliveryDateETA,QUANITY as Quanity,max(SEQUENCENO) as SequenceNo,STATUS as Status,FACTORYREFNO as FactoryRefNo from BTP_PANASONIC_POCONFIRMATIONDATA as A where A.PurchaseOrder ='" + PurchaseOrder + "' and A.PurchaseOrderItem ='" + L_PurchaseOrderItem + "' and a.createdat in ( select max (b.createdat) from BTP_PANASONIC_POCONFIRMATIONDATA as b where A.PurchaseOrder = B.PurchaseOrder and A.PurchaseOrderitem = b.PurchaseOrderItem and a.factoryrefno =  b.factoryrefno  group by b.factoryrefno) group by A.PurchaseOrder, A.PurchaseOrderItem,DeliveryDateETA,Quanity,FactoryRefNo,Status"
                                let query0_1 = cds.parse.cql(selectQuery0_2);
                                let selectQuery3 = await tx.run(query0_1);
                                log.cfLoggingMessages('info','selectQuery3' + JSON.stringify(selectQuery3));
                                // log.cfLoggingMessages('info', "selectQuery3: ->" + selectQuery3);
                                // log.cfLoggingMessages('info', JSON.stringify(selectQuery3));

                                var ScheduleLine = [];
                                if (selectQuery3.length) {
                                     /*Implementaion: Added logic to remove the line item with E-Date not passing on to Update AB_Line CPI CALL
                                      Author: Kowsalyaa
                                      Date: 13-06-2024 */
                                 const lineItemsWithValidStatus = await selectQuery3.filter(item => item.Status != 'E-DATE')
                                 log.cfLoggingMessages('info', 'lineItemsWithValidStatus' + lineItemsWithValidStatus)
                                 if(lineItemsWithValidStatus.length){
                                    for (const skill of lineItemsWithValidStatus) {
                                        var L_ScheduleLine = ScheduleLine;
                                        L_DeliveryDateETA = skill.DeliveryDateETA;
                                        // log.cfLoggingMessages('info', L_DeliveryDateETA);
                                        L_Quanity = skill.Quanity;
                                        // log.cfLoggingMessages('info', L_Quanity);
                                        L_SequenceNo = skill.SequenceNo;
                                        L_FactoryRefNo = skill.FactoryRefNo; //defect 91 changes for FactoryRefNo on 09/01/24 by jyothi
                                        //Asif changes on 19/12
                                        if (L_Quanity != 0) {

                                            L_ScheduleLine.push(
                                                {
                                                    "ConfirmedDeliveryDate": L_DeliveryDateETA,//DeliverydateETA
                                                    "ConfirmedOrderQuantityByMaterialAvailableCheck": L_Quanity,//Poconfirmation.qunatity
                                                    "unitCode": L_PurchaseOrderQuantityUnit, // Asif Changes on defect 45 on 22-11 // == "PC" ? "ST" : L_OrderPriceUnit,
                                                    "SequenceNo": L_SequenceNo,
                                                    "FactoryRefNo": L_FactoryRefNo //defect 91 changes for FactoryRefNo on 09/01/24 by jyothi
                                                });
                                            
                                        }
                                        else {
                                            
                                            L_ScheduleLine.push(
                                                {
                                                    "ConfirmedDeliveryDate": L_DeliveryDateETA,//DeliverydateETA
                                                    "ConfirmedOrderQuantityByMaterialAvailableCheck": L_Quanity,//Poconfirmation.qunatity
                                                    "unitCode": L_PurchaseOrderQuantityUnit, // Asif Changes on defect 45 on 22-11 // == "PC" ? "ST" : L_OrderPriceUnit,
                                                    "SequenceNo": L_SequenceNo,
                                                    "FactoryRefNo": L_FactoryRefNo //defect 91 changes for FactoryRefNo on 09/01/24 by jyothi
                                                });
                                            
                                        }
                                    }
                                    // we have added code to capture scheudule line after loop
                                    PODATA.Item.push({
                                        "PurchaseOrderItemID": L_PurchaseOrderItem,
                                        NetPrice:
                                        {
                                            "Amount": L_NetPriceAmount,//Purchaseorderitem.NETPRICEAMout
                                            "currencyCode": L_DocumentCurrency,//documentcurrency
                                            "BaseQuantity": L_OrderQuantity,//PurchaseorderItem.Qunatity
                                            "unitCode": L_OrderPriceUnit// == "PC" ? "ST" : L_OrderPriceUnit
                                        },
                                        ScheduleLine: L_ScheduleLine
                                    });
                                }
                                // log.cfLoggingMessages('info', 'JSON: - ' + JSON.stringify(PODATA));
                            }
                        }
                            else {
                            }
                        }
                    } else {
                        req.error({
                            code: '400',
                            message: 'AB line confirmation is not available for Purchase Order :' + PurchaseOrder,
                            target: PurchaseOrder,
                            status: 418
                        })
                        return true;
                    }
                    log.cfLoggingMessages('info', 'JSON: PODATA -> ' + JSON.stringify(PODATA));

                    try {
                        ////// Call CPI API 
                        if (PODATA.Item.length > 0) {
                            const CPI_URL_Data = await tx.run(SELECT.one(Environment).where({ APPID: 'CPI_ABLine' }).columns('URL', 'tokenUrl', 'clientId', 'clientSecret'));
                            // log.cfLoggingMessages('info', JSON.stringify(CPI_URL_Data));
                            var CPI_clientId = "";
                            var CPI_clientSecret = "";
                            var CPI_tokenUrl = "";
                            var CPI_url = "";
                            if (CPI_URL_Data != null) {
                                CPI_clientId = CPI_URL_Data.clientId;
                                CPI_clientSecret = CPI_URL_Data.clientSecret;
                                CPI_tokenUrl = CPI_URL_Data.tokenUrl;
                                CPI_url = CPI_URL_Data.URL;
                            }
                            //Declarations 
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
                                data: PODATA
                            }).then(async response1 => {
                                log.cfLoggingMessages('debug', 'response1 -> ' + JSON.stringify(response1.data));
                                //update po item if qnty is zero
                                //20-05-2024 CS
                                // if(response1.status == 201){
                                for (let item_i = 0; item_i < PODATA.Item.length; item_i++) {
                                    let poitemObj = PODATA.Item[item_i].ScheduleLine;
                                    //check quantity is zero then update 
                                    if (poitemObj && poitemObj.length > 0) {
                                        //check each schedule line for qty zero
                                        for (let lineI = 0; lineI < poitemObj.length; lineI++) {
                                            let scheduleLineObj = poitemObj[lineI];
                                            //ConfirmedOrderQuantityByMaterialAvailableCheck 
                                            if (scheduleLineObj.ConfirmedOrderQuantityByMaterialAvailableCheck == 0) {
                                                let zerotQtyPO = PODATA.PurchaseOrderID;
                                                let zeroQtyPOITEM = PODATA.Item[item_i].PurchaseOrderItemID;
                                                log.cfLoggingMessages('info', 'JSON: ECANCEL -> ' + zerotQtyPO + zeroQtyPOITEM);
                                                if (zerotQtyPO && zeroQtyPOITEM) {
                                                    // let e_cancel = await zero_qty(zerotQtyPO, zeroQtyPOITEM);

                                                    /*Implementaion: Added  RevisionNumber to get latest iteartion wise records to update the status in table..
                                                    Author: Kowsalyaa
                                                    Date: 06-06-2024 */
                                                    let e_cancel = await UPDATE`PO_Outbound_Process.POConfirmationData`.set`Status='E-CANCEL'`.
                                                        set`Message='Order line is Canceled'`.where`PurchaseOrder=${zerotQtyPO}
                                                     and PurchaseOrderItem=${zeroQtyPOITEM} and RevisionNumber=${selectQuery0[0].REVISIONNUMBER}`;
                                                    log.cfLoggingMessages('info', 'JSON: ECANCEL RESPONSE -> ' + e_cancel);
                                                }
                                            }

                                        }
                                    }
                                    // }
                                }
                                //20-05-2024 CE
                            }).catch(error => {
                                log.cfLoggingMessages('error', 'error -> in UPDATE_ABLine CPI call' + JSON.stringify(error.response.data));
                            });

                            /*End:Logic added for AB line*/
                        }
                    }
                    catch (error) {
                        log.cfLoggingMessages('error', 'Error in UPDATE_ABLine' + error.message);
                        return false;
                    }
                    
                    log.cfLoggingMessages('debug', 'Srinivas Debug End');
                    return true;
                }
                else {
                    req.error({
                        code: '400',
                        message: 'AB line confirmation is not available for Purchase Order :' + PurchaseOrder,
                        target: PurchaseOrder,
                        status: 418
                    })
                    return true;
                }
            }
            else {
                req.error({
                    code: '400',
                    message: 'AB line confirmation is not available for Purchase Order :' + PurchaseOrder,
                    target: PurchaseOrder,
                    status: 418
                })
                return true;
            }
        }
        catch (e) {
            log.cfLoggingMessages('error', 'UPDATE_ABLine' + e)
            req.error({
                code: '400',
                message: e.message,
                target: 'UPDATE_ABLine',
                status: 418
            })
            return false;

        }

    })

    // const zero_qty = async (PurchaseOrder, L_PurchaseOrderItem, revisionNumber) => {
    //     try {
    //         const update = await UPDATE`PO_Outbound_Process.POConfirmationData`.set
    //             `Status='E-CANCEL'`.set`Message='Order line is Canceled'`.
    //             where`PurchaseOrder=${PurchaseOrder} and PurchaseOrderItem=${L_PurchaseOrderItem} and RevisionNumber=${revisionNumber}`;
    //         log.cfLoggingMessages('info', 'update zero_qty', update);
    //         // await tx.commit();
    //     } catch (error) {
    //         log.cfLoggingMessages('error', 'zero_qty =>' + error)
    //     }
    // }

    const V_UpdateAdditionalData = async (req, PO, PurchasingGrp, ComCode, ShipToPart, SalesOrderNo, PurchaseOrderItem) => {
        try {
            log.cfLoggingMessages('debug', 'V_UpdateAdditionalData' + PO + PurchasingGrp + ComCode + ShipToPart + SalesOrderNo);
            var PurchaseOrder = PO;
            var PurchaseOrderItem = PurchaseOrderItem;
            var PurchasingGroup = PurchasingGrp;
            var CompanyCode = ComCode;
            var ShipToParty = ShipToPart;
            log.cfLoggingMessages('info', "PurchaseOrder:" + PurchaseOrder + "PurchasingGroup:" + PurchasingGroup + "CompanyCode:" + CompanyCode + "ShipToParty:" + ShipToParty);
            var SoldToParty = "";
            var PurchaseOrderByCustomer = "";
            var DeliveryAddressName = "";
            var DeliveryAddressHouseNumber = "";
            var DeliveryAddressStreetName = "";
            var DeliveryAddressName2 = "";
            var DeliveryAddressPostalCode = "";
            var DeliveryAddressCityName = "";
            var DeliveryAddressRegion = "";
            var DeliveryAddressCountry = "";
            var Name1 = "";
            var Name2 = "";
            var Street = "";
            var CityPostalCode = "";
            var City = "";
            var POBoxCity = "";
            var Country = "";
            var Region = "";
            var Customer1 = "";
            /*customer for ship to party address*/
            // log.cfLoggingMessages('info', "SalesDataNo:" + JSON.stringify(SalesOrderNo));

            //var SalesOrderNo = SalesData.length == 1 ? String(SalesData[0].SalesOrder) : "";
            // log.cfLoggingMessages('info', "SalesOrder:" + SalesOrderNo);
            // 404 Error Changes By Srinivas
            if (ShipToParty && ShipToParty != null && ShipToParty.trim().length > 0) {
                try{
                const getBusinessPartnerAddressData = await service2.tx(req).run({
                    SELECT: {
                        from: { ref: ['PO_Outbound_Process.BusinessPartnerAddress'] },
                        where: [{ ref: ['BusinessPartner'] }, '=', { val: String(ShipToParty) }],
                        limit: { rows: { val: 1000 } },
                        orderBy: [{ ref: ['BusinessPartner'], sort: 'asc' }]
                    }
                });
                // log.cfLoggingMessages('info', "AddressData:" + JSON.stringify(getBusinessPartnerAddressData));
                if (getBusinessPartnerAddressData.length > 0) {
                    DeliveryAddressName = getBusinessPartnerAddressData[0].FullName;
                    DeliveryAddressHouseNumber = getBusinessPartnerAddressData[0].HouseNumber;
                    DeliveryAddressStreetName = getBusinessPartnerAddressData[0].StreetName;
                    DeliveryAddressName2 = getBusinessPartnerAddressData[0].FullName;
                    DeliveryAddressPostalCode = getBusinessPartnerAddressData[0].PostalCode;
                    DeliveryAddressCityName = getBusinessPartnerAddressData[0].CityName;
                    DeliveryAddressRegion = getBusinessPartnerAddressData[0].Region;
                    DeliveryAddressCountry = getBusinessPartnerAddressData[0].Country;
                }
            }catch(error){
                log.cfLoggingMessages('debug', "Error 1462:" + error);
            }
            }
            ///////////////////////////////////////////////
            if (SalesOrderNo && SalesOrderNo != null && SalesOrderNo.toString().trim().length > 0) {
                try{
                /*customer for shiping point address*/
                const getSalesOrderItemData = await service1.tx(req).run({
                    SELECT: {
                        from: { ref: ['PO_Outbound_Process.SalesOrderItem'] },
                        where: [{ ref: ['SalesOrder'] }, '=', { val: SalesOrderNo.toString() }],
                        limit: { rows: { val: 1 } },
                        orderBy: [{ ref: ['SalesOrder'], sort: 'asc' }]
                    }
                });

                // log.cfLoggingMessages('info', "SalesItemData1:" + JSON.stringify(getSalesOrderItemData));
                const ShippingPoint = getSalesOrderItemData.length == 1 ? String(getSalesOrderItemData[0].ShippingPoint) : "";
                log.cfLoggingMessages('info', "ShippingPoint:" + ShippingPoint);



                const getShippingPointData = await service3.tx(req).run({
                    SELECT: {
                        from: { ref: ['PO_Outbound_Process.ShipPointAddress'] },
                        where: [{ ref: ['ShippingPoint'] }, '=', { val: ShippingPoint.toString() }],
                        limit: { rows: { val: 1 } },
                        orderBy: [{ ref: ['ShippingPoint'], sort: 'asc' }]
                    }
                });

                // log.cfLoggingMessages('info', "getShippingPointData:" + JSON.stringify(getShippingPointData));
                if (getShippingPointData.length > 0) {
                    Name1 = getShippingPointData[0].Name1;
                    Name2 = getShippingPointData[0].Name2;
                    Street = getShippingPointData[0].Street;
                    CityPostalCode = getShippingPointData[0].CityPostalCode;
                    City = getShippingPointData[0].City;
                    POBoxCity = getShippingPointData[0].POBoxCity;
                    Country = getShippingPointData[0].Country;
                    Region = getShippingPointData[0].Region;
                }
            }catch(error){
                log.cfLoggingMessages('debug', "Error 1505:" + error);
            }
            }

            if (SalesOrderNo && SalesOrderNo != null && SalesOrderNo.toString().trim().length > 0) {
                try{
                /*customer */
                const getPartnerCustomerData = await service1.tx(req).run({
                    SELECT: {
                        from: { ref: ['PO_Outbound_Process.SalesOrderItem'] },
                        where: [{ ref: ['SalesOrder'] }, '=', { val: SalesOrderNo.toString() },
                            'and', { ref: ['SDProcessStatus'] }, '=', { val: 'C' }],
                        limit: { rows: { val: 1 } },
                        orderBy: [{ ref: ['SalesOrder'], sort: 'asc' }]
                    }
                });

                // log.cfLoggingMessages('info', "getPartnerCustomerData:" + JSON.stringify(getPartnerCustomerData));
                const ReferenceSDDocument = getPartnerCustomerData.length == 1 ? String(getPartnerCustomerData[0].ReferenceSDDocument) : "";
                log.cfLoggingMessages('info', "ReferenceSDDocument:" + ReferenceSDDocument);

                const getCustomerData = await service1.tx(req).run({
                    SELECT: {
                        from: { ref: ['PO_Outbound_Process.SalesOrderHeaderPartner'] },
                        where: [{ ref: ['SalesOrder'] }, '=', { val: ReferenceSDDocument.toString() }],
                        limit: { rows: { val: 1 } },
                        orderBy: [{ ref: ['SalesOrder'], sort: 'asc' }]
                    }
                });
                // log.cfLoggingMessages('info', "getCustomerData:" + JSON.stringify(getCustomerData));
                Customer1 = getCustomerData.length == 1 ? String(getCustomerData[0].Customer) : "";
                log.cfLoggingMessages('info', "Customer:" + Customer1);
            }catch(error){
                log.cfLoggingMessages('debug', "Error 1538:" + error);
            }
            }
            if (SalesOrderNo && SalesOrderNo != null && SalesOrderNo.toString().trim().length > 0) {
                try{
                const getSalesOrderData = await service1.tx(req).run({
                    SELECT: {
                        from: { ref: ['PO_Outbound_Process.SalesOrder'] },
                        where: [{ ref: ['SalesOrder'] }, '=', { val: SalesOrderNo.toString() }],
                        limit: { rows: { val: 1 } },
                        orderBy: [{ ref: ['SalesOrder'], sort: 'asc' }]
                    }
                });
                log.cfLoggingMessages('info', "SalesData1:" + JSON.stringify(getSalesOrderData));

                var SoldToParty = getSalesOrderData.length == 1 ? String(getSalesOrderData[0].SoldToParty) : "";
                var PurchaseOrderByCustomer = getSalesOrderData.length == 1 ? String(getSalesOrderData[0].PurchaseOrderByCustomer) : "";
            }catch(error){
                log.cfLoggingMessages('debug', "Error 1556:" + error);
            }
            }

            var PO_AddData = {
                "PurchaseOrder": PurchaseOrder,
                "PurchasingGroup": PurchasingGroup,
                "CompanyCode": CompanyCode,
                "Customer": Customer1,
                "Customer_Partner": "",
                "SoldToParty": SoldToParty,
                "PurchaseOrderByCustomer": PurchaseOrderByCustomer,
                "DeliveryAddressName": DeliveryAddressName,
                "DeliveryAddressHouseNumber": DeliveryAddressHouseNumber,
                "DeliveryAddressStreetName": DeliveryAddressStreetName,
                "DeliveryAddressName2": DeliveryAddressName2,
                "DeliveryAddressPostalCode": DeliveryAddressPostalCode,
                "DeliveryAddressCityName": DeliveryAddressCityName,
                "DeliveryAddressRegion": DeliveryAddressRegion,
                "DeliveryAddressCountry": DeliveryAddressCountry,
                "Name1": Name1,
                "Name2": Name2,
                "Street": Street,
                "CityPostalCode": CityPostalCode,
                "City": City,
                "POBoxCity": POBoxCity,
                "Country": Country,
                "Region": Region
            }
            log.cfLoggingMessages('info', 'PO_AddData' + JSON.stringify(PO_AddData));
            try {

                const checkPO = await SELECT.one(PO_AdditionalData).where({ PurchaseOrder: PurchaseOrder }).columns('PurchaseOrder');
                log.cfLoggingMessages('debug', "checkPO" + JSON.stringify(checkPO));

                // log.cfLoggingMessages('info', "1");
                if (checkPO != null) {
                    // log.cfLoggingMessages('info', "2");
                    await UPDATE(PO_AdditionalData).set(PO_AddData).where({ PurchaseOrder: PurchaseOrder });
                    log.cfLoggingMessages('info', "DataUpdated");
                }
                else {
                    // log.cfLoggingMessages('info', "3");
                    await INSERT.into(PO_AdditionalData).entries(PO_AddData);
                    log.cfLoggingMessages('info', "DataAdded");

                }
            }
            catch (error) {
                log.cfLoggingMessages('error', "error:" + error.message);
            }
            // log.cfLoggingMessages('info', "4");
            var result = await SELECT.one(GetPOAdditionalFields).where({ PurchaseOrder: PurchaseOrder }).columns('PurchaseOrder', 'ConsigneeCode', 'Warehouse', 'PartnerWarehouse', 'PartnerWarehouseCode', 'SellerCode', 'ShipmentMethod', 'CityID', 'PayerCode', 'SalesRouteCode');
            log.cfLoggingMessages('info', 'oData -> ' + JSON.stringify(result));

            const PO_AddData1 = {
                "ConsigneeCode": result.ConsigneeCode,
                "Warehouse": result.Warehouse,
                "PartnerWarehouse": result.PartnerWarehouse,
                "PartnerWarehouseCode": result.PartnerWarehouseCode,
                "SellerCode": result.SellerCode,
                "ShipmentMethod": result.ShipmentMethod,
                "CityID": result.CityID,
                "PayerCode": result.PayerCode,
                "SalesRouteCode": result.SalesRouteCode
            }

            log.cfLoggingMessages('info', 'oData1 -> ' + JSON.stringify(PO_AddData1));
            await UPDATE(PO_AdditionalData).set(PO_AddData1).where({ PurchaseOrder: PurchaseOrder });
            log.cfLoggingMessages('info', 'DataAdded to PO_AdditionalData');


            if (result.CityID == null || result.CityID.trim().length == 0) {

                // let dbQuery = "CALL GET_POSTATUSMONITORING_ID(NEXT_ID => ?)";
                // // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
                // const result = await cds.run(dbQuery, {});
                // // log.cfLoggingMessages('info', 'SP NEXT ID result' + JSON.stringify(result));
                // const ID = result.NEXT_ID[0].ID;
                // /* Implementation: Passing PurchaseOrderItem at the time of insertion on POSTATUSMONITORING
                //                 Change on : 28-05-2024
                //                 Author : Kanchan */

                // var data3 = {

                //     "ID": ID,
                //     "PO": PO,
                //     "Status": 'E',
                //     "PurchaseOrderItem": PurchaseOrderItem,
                //     "Message": 'City Destination code is not valid'
                // }
                // // log.cfLoggingMessages('info', JSON.stringify(data3));
                // INSERT.into(POStatusMonitoring).entries(data3);
                 // replacing insert postatusmonitoring with stored procedure CS
                 let uspObtectType = 'VALIDATION';
                 let uspStatus = 'E';
                 let uspMessage = 'City Destination code is not valid';
                 let dbQuery = "CALL USP_CREATE_POSTATUSMONITORING(I_PURCHASEORDER => " + PO + " ,I_POLINEITEM => " + "'" + PurchaseOrderItem + "'" + " ,I_OBJECTTYPE => " + "'" + uspObtectType + "'" + " ,I_STATUS => " + "'" + uspStatus + "'" + " ,I_MESSAGE => " + "'" + uspMessage + "'" + ")";
                 // log.logger('info', 'dbQuery -> ' + dbQuery);
                 const result = await cds.run(dbQuery, {});
                 log.logger('debug', 'USP_CREATE_POSTATUSMONITORING SP result (create out) 1624' + JSON.stringify(result));
                  // replacing insert postatusmonitoring with stored procedure CE
            }

            else {
                // log.cfLoggingMessages('info', "City Destination code is valid");
            }




        } catch (error) {
            log.cfLoggingMessages('error', 'Error in V_UpdateAdditionalData =>' + error)
            req.error({
                code: '400',
                message: error.message,
                target: 'some_field',
                status: 418
            })
        }
        return true;//service1.tx(req).run(req.query);
    }

    // function xmlToJson(xml) {

    //     // Create the return object
    //     var obj = {};

    //     if (xml.nodeType == 1) { // element
    //         // do attributes
    //         if (xml.attributes.length > 0) {
    //             obj["@attributes"] = {};
    //             for (var j = 0; j < xml.attributes.length; j++) {
    //                 var attribute = xml.attributes.item(j);
    //                 obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
    //             }
    //         }
    //     } else if (xml.nodeType == 3) { // text
    //         obj = xml.nodeValue;
    //     }



    //     return obj;
    // };

    // get user assigned roles access details
    this.on('UserDetails_1', async (req) => {
        try {
            const userId = req.user.id;
            const tenant = req.user.tenant;
            const hasManageUserRole = req.user.is('Factory_Manage_Role');
            const hasDisplayUserRole = req.user.is('Factory_ReadOnly_Role');
            return {
                userId,
                tenant,
                hasManageUserRole,
                hasDisplayUserRole,
            };
        } catch (error) {
            log.cfLoggingMessages('error', 'Error in GetUserDetails:' + error);
            req.error(500, 'An error occurred');
        }
    });

})