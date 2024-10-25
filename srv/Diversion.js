const cds = require('@sap/cds');
const axios = require("axios");
const util = require('./util/util');
const log = require('./util/logger')
module.exports = cds.service.impl(async function () {

    const { invoiceLine, POCrossRef, MNET_DiversionHeader, ZMNETBUSINESS,MNetStatusMonitoring,MNetStatusMonitoringItem, bolHeader,A_PurchaseOrderItem } = cds.entities('BTP.Panasonic');

    const { GET_MNET_DATA, Environment, GetGRData, GET_PO_DATA } = this.entities

    // Kowsalyaa for Master Data Maintanaence
    this.on('accountReferenceCreateAndUpdate', async (req) => {
        try {
            // log.cfLoggingMessages('info', req.data)
            log.cfLoggingMessages('debug', 'Account Ref Create and UPDATE' + req.data)
            const { Client, Legacy_Customer, Sold_to_party, Orderer_Code, Accountee_Code, Consignee_Code, Drop_Ship_Name } = req.data;
            const existingRecord = await SELECT.from`BTP_PANASONIC.AccountReference`
                .where`Client=${Client} and Legacy_Customer=${Legacy_Customer} and Sold_to_party=${Sold_to_party}`;
            if (existingRecord.length > 0) {
                const update = await UPDATE`BTP_PANASONIC.AccountReference`
                    .set`Orderer_Code=${Orderer_Code}`
                    .set`Accountee_Code=${Accountee_Code}`
                    .set`Consignee_Code=${Consignee_Code}`
                    .set`Drop_Ship_Name=${Drop_Ship_Name}`
                    .where`Client=${Client} and Legacy_Customer=${Legacy_Customer} and Sold_to_party=${Sold_to_party}`;
                log.cfLoggingMessages('debug', 'update acc ref create and update' + update);
            } else {
                const newRecord = await INSERT.into('BTP_PANASONIC.AccountReference').entries(req.data);
                log.cfLoggingMessages('debug', 'new record acc ref create' + newRecord);
            }
        } catch (err) {
            log.cfLoggingMessages('error', 'Error in accountReferenceCreateAndUpdate' + err)
            req.error({
                code: '500',
                message: `Internal Server error ${err}`,
                target: 'accountReferenceCreateAndUpdate',
                status: 500
            })
        }
    })
    this.on('purchaseGroupGlobalCodeCreateAndUpdate', async (req) => {
        try {
            log.cfLoggingMessages('debug', 'purchaseGroupGlobalCodeCreateAndUpdate ' + req.data)
            const { Client, PurchaseGroup, GlobalCode, PartIndicator, GlobalCodeName, OutboundDivision, Responsible_employee } = req.data;
            const existingRecord = await SELECT.from`BTP_PANASONIC.PurchaseGroup_GlobalCode`
                .where`Client=${Client} and PurchaseGroup=${PurchaseGroup}`;
            if (existingRecord.length > 0) {
                const update = await UPDATE`BTP_PANASONIC.PurchaseGroup_GlobalCode`
                    .set`GlobalCode=${GlobalCode}`
                    .set`PartIndicator=${PartIndicator}`
                    .set`GlobalCodeName=${GlobalCodeName}`
                    .set`OutboundDivision=${OutboundDivision}`
                    .set`Responsible_employee=${Responsible_employee}`
                    .where`Client=${Client} and PurchaseGroup=${PurchaseGroup}`;
                log.cfLoggingMessages('info', 'purchaseGroupGlobalCodeCreateAndUpdate' + update);
            } else {
                const newRecord = await INSERT.into('BTP_PANASONIC.PurchaseGroup_GlobalCode').entries(req.data);
                log.cfLoggingMessages('info', 'purchaseGroupGlobalCodeCreateAndUpdate' + newRecord);
            }
        } catch (err) {
            log.cfLoggingMessages('error', 'Error in purchaseGroupGlobalCodeCreateAndUpdate' + err)
            req.error({
                code: '500',
                message: `Internal Server error ${err}`,
                target: 'purchaseGroupGlobalCodeCreateAndUpdate',
                status: 500
            })
        }
    })
    this.on('userMasterCreateAndUpdate', async (req) => {
        try {
            log.cfLoggingMessages('debug', 'userMasterCreateAndUpdate ' + req.data)
            const { UserID, EmailID, FirstName, LastName, modifiedBy, modifiedAt, } = req.data;
            const existingRecord = await SELECT.from`BTP_PANASONIC.UserMaster`
                .where`EmailID=${EmailID}`;
            if (existingRecord.length > 0) {
                const update = await UPDATE`BTP_PANASONIC.UserMaster`
                    .set`UserID=${UserID}`
                    .set`FirstName=${FirstName}`
                    .set`LastName=${LastName}`
                    .set`MODIFIEDAT=${modifiedAt}`
                    .set`MODIFIEDBY=${modifiedBy}`
                    .where`EmailID=${EmailID}`;
                log.cfLoggingMessages('info', 'purchaseGroupGlobalCodeCreateAndUpdate' + update);
            } else {
                delete req.data.modifiedBy;
                delete req.data.modifiedAt;
                const newRecord = await INSERT.into('BTP_PANASONIC.UserMaster').entries(req.data);
                log.cfLoggingMessages('info', 'purchaseGroupGlobalCodeCreateAndUpdate' + newRecord);
            }
        } catch (err) {
            log.cfLoggingMessages('error', 'Error in userMasterCreateAndUpdate' + err)
            req.error({
                code: '500',
                message: `Internal Server error ${err}`,
                target: 'userMasterCreateAndUpdate',
                status: 500
            })
        }
    });

    this.on('ZCrossRefCreateAndUpdate', async (req) => {
        try {
            log.cfLoggingMessages('debug', 'ZCrossRefCreateAndUpdate' + req.data)
            const { Sequence_Number, Function_Code, Clinet_Code, Company_Code, SAP_Code, Legacy_Code, Username, Parameter1, Parameter2, Parameter3, Parameter4, Parameter5 } = req.data;
            const existingRecord = await SELECT.from`BTP_PANASONIC.ZCROSSREF`
                .where`Sequence_Number=${Sequence_Number} and Function_Code=${Function_Code} and Clinet_Code=${Clinet_Code}`;
            if (existingRecord.length > 0) {
                const update = await UPDATE`BTP_PANASONIC.ZCROSSREF`
                    .set`Company_Code=${Company_Code}`
                    .set`Clinet_Code=${Clinet_Code}`
                    .set`Function_Code=${Function_Code}`
                    .set`SAP_Code=${SAP_Code}`
                    .set`Legacy_Code=${Legacy_Code}`
                    .set`Username=${Username}`
                    .set`Parameter1=${Parameter1}`
                    .set`Parameter2=${Parameter2}`
                    .set`Parameter3=${Parameter3}`
                    .set`Parameter4=${Parameter4}`
                    .set`Parameter5=${Parameter5}`
                    .where`Sequence_Number=${Sequence_Number} and Function_Code=${Function_Code} and Clinet_Code=${Clinet_Code}`;
                log.cfLoggingMessages('debug', 'ZCrossRefCreateAndUpdate' + update);
            } else {
                const totalRecords = await SELECT.from`BTP_PANASONIC.ZCROSSREF`;
                // log.cfLoggingMessages('info', 'total records in ZCROSSREF', totalRecords);
                req.data.Sequence_Number = (totalRecords.length + 1).toString();
                const newRecord = await INSERT.into('BTP_PANASONIC.ZCROSSREF').entries(req.data);
                log.cfLoggingMessages('debug', 'ZCrossRefCreateAndUpdate' + newRecord);
            }
        } catch (err) {
            log.cfLoggingMessages('error', 'Error in ZCrossRefCreateAndUpdate' + err)
            req.error({
                code: '500',
                message: `Internal Server error ${err}`,
                target: 'ZCrossRefCreateAndUpdate',
                status: 500
            })
        }
    })
    this.on('ZipCodeDestinationCreateAndUpdate', async (req) => {

        log.cfLoggingMessages('debug', 'ZipCodeDestinationCreateAndUpdate' + req.data)
        const { Client_Code, Destination, Plant, Description, IPP_Devanning_Indicator, Logical_Devanner_Destination, End_User, Default_DEST } = req.data;
        const existingRecord = await SELECT.from`BTP_PANASONIC.ZipCode_Destination`
            .where`Client_Code=${Client_Code} and Destination=${Destination} and Plant=${Plant}`;
        if (existingRecord.length > 0) {
            const update = await UPDATE`BTP_PANASONIC.ZipCode_Destination`
                .set`Description=${Description}`
                .set`IPP_Devanning_Indicator=${IPP_Devanning_Indicator}`
                .set`Logical_Devanner_Destination=${Logical_Devanner_Destination}`
                .set`End_User=${End_User}`
                .set`Default_DEST=${Default_DEST}`
                .where`Client_Code=${Client_Code} and Destination=${Destination} and Plant=${Plant}`;
            log.cfLoggingMessages('debug', 'ZipCodeDestinationCreateAndUpdate' + update);
        } else {
            const newRecord = await INSERT.into('BTP_PANASONIC.ZipCode_Destination').entries(req.data);
            log.cfLoggingMessages('debug', 'ZipCodeDestinationCreateAndUpdate' + newRecord);
        }
    })
    this.on('ZMMETDCreateAndUpdate', async (req) => {

        log.cfLoggingMessages('debug', 'ZMMETDCreateAndUpdate' + req.data)
        const { Sequence_Number, Client, PurchasingGroup, Vendor, Type, MethodOfShipping, LeadTime, modifiedBy, modifiedAt } = req.data;
        // log.cfLoggingMessages('info', 'REQUEST **', req.data.Sequence_Number, req.data.Client);
        const existingRecord = await SELECT.from`BTP_PANASONIC.ZMM_ETD`
            .where`Sequence_Number=${Sequence_Number} and Client=${Client}`;
        // log.cfLoggingMessages('info', 'existingRecord', existingRecord)
        if (existingRecord.length > 0) {
            const update = await UPDATE`BTP_PANASONIC.ZMM_ETD`
                .set`PurchasingGroup=${PurchasingGroup}`
                .set`Vendor=${Vendor}`
                .set`Type=${Type}`
                .set`MethodOfShipping=${MethodOfShipping}`
                .set`LeadTime=${LeadTime}`
                .set`MODIFIEDAT=${modifiedAt}`.set`MODIFIEDBY=${modifiedBy}`
                .where`Sequence_Number=${Sequence_Number} and Client=${Client}`;
            // log.cfLoggingMessages('info', 'update', update);
        } else {
            delete req.data.modifiedBy;
            delete req.data.modifiedAt;
            const totalRecords = await SELECT.from`BTP_PANASONIC.ZMM_ETD`;
            //  log.cfLoggingMessages('info', 'total records in ZMM_ETD', totalRecords.length);
            req.data.Sequence_Number = (totalRecords.length + 1).toString();
            const newRecord = await INSERT.into('BTP_PANASONIC.ZMM_ETD').entries(req.data);
            // log.cfLoggingMessages('info', 'NEW RECORD', newRecord);
        }
    })
    this.on('ZMMMOSCreateAndUpdate', async (req) => {

        log.cfLoggingMessages('debug', 'ZMMMOSCreateAndUpdate' + req.data)
        const { Client, Mos_code, NumberOfDays, modifiedBy, modifiedAt } = req.data;
        const existingRecord = await SELECT.from`BTP_PANASONIC.ZMM_MOS`
            .where`Mos_code=${Mos_code} and Client=${Client}`;
        if (existingRecord.length > 0) {
            const update = await UPDATE`BTP_PANASONIC.ZMM_MOS`
                .set`NumberOfDays=${NumberOfDays}`
                .set`MODIFIEDAT=${modifiedAt}`.set`MODIFIEDBY=${modifiedBy}`
                .where`Mos_code=${Mos_code} and Client=${Client}`;
            // log.cfLoggingMessages('info', update);
        } else {
            delete req.data.modifiedBy;
            delete req.data.modifiedAt;
            const newRecord = await INSERT.into('BTP_PANASONIC.ZMM_MOS').entries(req.data);
            // log.cfLoggingMessages('info', newRecord);
        }
    })

    this.on('ZMNETBusinessCreateAndUpdate', async (req) => {
        try {

            log.cfLoggingMessages('debug', 'ZMNETBusinessCreateAndUpdate' + req.data)
            const { MANDT, ZBUSINESS_IND, ZMODE, ZRECTYPE, ZPAYCONCODE, ZSHIPMETHOD, ZMNETDTLS_EXIST, ZDEVANNABLE, ZPOIND, ZSPECIAL,
                ZINBD_DLVY, ZINVICE, ZGOODS_RECEIPT, ZDLVY_INSTR, ZANCITIPATED_REC, ZASN, ZDESCRIPTION, modifiedBy, modifiedAt, createdBy, createdAt } = req.data;
            const existingRecord = await SELECT.from`BTP_PANASONIC.ZMNETBUSINESS`
                .where`ZBUSINESS_IND=${ZBUSINESS_IND} and MANDT=${MANDT} and ZMODE=${ZMODE}`;
            if (existingRecord.length > 0) {
                const update = await UPDATE`BTP_PANASONIC.ZMNETBUSINESS`
                    .set`ZRECTYPE=${ZRECTYPE}`.set`ZPAYCONCODE=${ZPAYCONCODE}`.set`ZSHIPMETHOD=${ZSHIPMETHOD}`.set`ZMNETDTLS_EXIST=${ZMNETDTLS_EXIST}`.set`ZDEVANNABLE =${ZDEVANNABLE}`.set`ZPOIND=${ZPOIND}`
                    .set`ZSPECIAL=${ZSPECIAL}`.set`ZINBD_DLVY=${ZINBD_DLVY}`.set`ZINVICE=${ZINVICE}`.set`ZGOODS_RECEIPT =${ZGOODS_RECEIPT}`.set`ZDLVY_INSTR=${ZDLVY_INSTR}`
                    .set`ZANCITIPATED_REC=${ZANCITIPATED_REC}`.set`ZASN=${ZASN}`.set`ZDESCRIPTION=${ZDESCRIPTION}`
                    .set`MODIFIEDAT=${modifiedAt}`.set`MODIFIEDBY=${modifiedBy}`
                    .where`ZBUSINESS_IND=${ZBUSINESS_IND} and ZMODE=${ZMODE} and MANDT=${MANDT}`;
                // log.cfLoggingMessages('info', update);
            } else {
                delete req.data.modifiedBy;
                delete req.data.modifiedAt;
                const newRecord = await INSERT.into('BTP_PANASONIC.ZMNETBUSINESS').entries(req.data);
                // log.cfLoggingMessages('info', 'newRecord', newRecord);
            }
        } catch (err) {
            log.cfLoggingMessages('error', 'Error in ZMNET Business' + err)
            req.error({
                code: '500',
                message: `Internal Server error ${err}`,
                target: 'ZMNETBusinessCreateAndUpdate',
                status: 500
            })
        }

    })

    this.on('ZMNETModeCreateAndUpdate', async (req) => {

        log.cfLoggingMessages('debug', 'ZMNETModeCreateAndUpdate' + req.data)
        const { MANDT, TMODE, TRATY, ZSHIPMETHOD, ZTMODEDESCR, ZSHIPTYPE, modifiedBy, modifiedAt } = req.data;
        const existingRecord = await SELECT.from`BTP_PANASONIC.ZMNETMODE`
            .where`TMODE=${TMODE} and MANDT=${MANDT}`;
        if (existingRecord.length > 0) {
            const update = await UPDATE`BTP_PANASONIC.ZMNETMODE`
                .set`TRATY=${TRATY}`.set`ZSHIPMETHOD=${ZSHIPMETHOD}`.set`ZTMODEDESCR=${ZTMODEDESCR}`.set`ZSHIPTYPE =${ZSHIPTYPE}`
                .set`MODIFIEDAT=${modifiedAt}`.set`MODIFIEDBY=${modifiedBy}`
                .where`TMODE=${TMODE} and MANDT=${MANDT}`;
            // log.cfLoggingMessages('info', update);
        } else {
            delete req.data.modifiedBy;
            delete req.data.modifiedAt;
            const newRecord = await INSERT.into('BTP_PANASONIC.ZMNETMODE').entries(req.data);
            // log.cfLoggingMessages('info', newRecord);
        }
    })
    this.on('userAssignmentCreate', async (req) => {

        log.cfLoggingMessages('debug', 'userAssignmentCreate' + req.data)
        const { ID, UserID_UserID, EmailID, CompanyCode, CompanyCodeDescription, PurchaseOrg, PurchaseOrgDescription, modifiedBy, modifiedAt } = req.data;
        const existingRecord = await SELECT.from`BTP_PANASONIC.USERASSIGNMENT`
            .where`ID=${ID} and UserID_UserID=${UserID_UserID} and CompanyCode=${CompanyCode}`;
        if (existingRecord.length > 0) {
            const update = await UPDATE`BTP_PANASONIC.USERASSIGNMENT`
                .set`UserID_UserID=${UserID_UserID}`.set`EmailID=${EmailID}`.set`CompanyCode=${CompanyCode}`.set`CompanyCodeDescription =${CompanyCodeDescription}`.set`PurchaseOrg=${PurchaseOrg}`.set`PurchaseOrgDescription=${PurchaseOrgDescription}`
                .set`MODIFIEDAT=${modifiedAt}`.set`MODIFIEDBY=${modifiedBy}`
                .where`ID=${ID}`;
            // log.cfLoggingMessages('info', update);
        } else {
            delete req.data.modifiedBy;
            delete req.data.modifiedAt;
            const totalRecords = await SELECT.from`BTP_PANASONIC.USERASSIGNMENT`;
            // log.cfLoggingMessages('info', 'total records in USERASSIGNMENT', totalRecords.length);
            req.data.ID = (totalRecords.length + 1).toString();
            const newRecord = await INSERT.into('BTP_PANASONIC.USERASSIGNMENT').entries(req.data);
            // log.cfLoggingMessages('info', newRecord);
        }
    })

    this.on('Factory_supplier', async (req) => {

        log.cfLoggingMessages('debug', 'Factory_supplier' + req.data)
        const { PurchaseOrder } = req.data;
        var data1 = await SELECT.from`BTP_PANASONIC.A_PURCHASEORDER`.where`PurchaseOrder=${PurchaseOrder}`.columns('Supplier');
        return data1;

    });

    this.on('mnetmode_delete', async (req) => {

        log.cfLoggingMessages('debug', 'mnetmode_delete' + req.data)
        const { MANDT, TMODE } = req.data;
        var del1 = await DELETE.from`BTP_PANASONIC.ZMNETMODE`.where`MANDT=${MANDT} and TMODE=${TMODE}`;
        return del1;

    });

    this.on('mm_mos_delete', async (req) => {

        log.cfLoggingMessages('debug', 'mm_mos_delete' + req.data)
        const { Client, Mos_code } = req.data;
        var del3 = await DELETE.from`BTP_PANASONIC.ZMM_MOS`.where`Client=${Client} and Mos_code=${Mos_code}`;
        return del3;

    });



    this.on('mnetbusiness_delete', async (req) => {

        log.cfLoggingMessages('debug', 'mnetbusiness_delete' + req.data)
        const { MANDT, ZBUSINESS_IND, ZMODE } = req.data;
        var del2 = await DELETE.from`BTP_PANASONIC.ZMNETBUSINESS`.where`MANDT=${MANDT} and ZBUSINESS_IND=${ZBUSINESS_IND} and ZMODE=${ZMODE}`;
        return del2;

    });


    this.on('zipcode_delete', async (req) => {

        log.cfLoggingMessages('debug', 'zipcode_delete' + req.data)
        const { Client_Code, Destination, Plant } = req.data;
        var del4 = await DELETE.from`BTP_PANASONIC.ZIPCODE_DESTINATION`.where`Client_Code=${Client_Code} and Destination=${Destination} and Plant=${Plant}`;
        return del4;

    });

    this.on('zcrossref_delete', async (req) => {

        log.cfLoggingMessages('debug', 'zcrossref_delete' + req.data)
        const { Sequence_Number, Function_Code, Clinet_Code } = req.data;
        var del5 = await DELETE.from`BTP_PANASONIC.ZCROSSREF`.where`Sequence_Number=${Sequence_Number} and Function_Code=${Function_Code} and Clinet_Code=${Clinet_Code}`;
        return del5;

    });

    this.on('zusermaster_delete', async (req) => {

        log.cfLoggingMessages('debug', 'zusermaster_delete' + req.data)
        const { EmailID } = req.data;
        var del6 = await DELETE.from`BTP_PANASONIC.USERMASTER`.where`EmailID=${EmailID}`;
        return del6;

    });

    this.on('zuserassign_delete', async (req) => {

        log.cfLoggingMessages('debug', 'zuserassign_delete' + req.data)
        const { ID, EmailID } = req.data;
        var del7 = await DELETE.from`BTP_PANASONIC.USERASSIGNMENT`.where`ID=${ID} and EmailID=${EmailID}`;
        return del7;

    });

    this.on('zglobalcode_delete', async (req) => {

        log.cfLoggingMessages('debug', 'zglobalcode_delete' + req.data)
        const { Client, PurchaseGroup } = req.data;
        var del8 = await DELETE.from`BTP_PANASONIC.PURCHASEGROUP_GLOBALCODE`.where`Client=${Client} and PurchaseGroup=${PurchaseGroup}`;
        return del8;

    });

    this.on('zaccountref_delete', async (req) => {

        log.cfLoggingMessages('debug', 'zaccountref_delete' + req.data)
        const { Client, Legacy_Customer, Sold_to_party } = req.data;
        var del11 = await DELETE.from`BTP_PANASONIC.ACCOUNTREFERENCE`.where`Client=${Client} and Legacy_Customer=${Legacy_Customer} and Sold_to_party=${Sold_to_party}`;
        return del11;

    });

    this.on('zmmetd_delete', async (req) => {

        log.cfLoggingMessages('debug', 'zmmetd_delete' + req.data)
        const { Sequence_Number, Client } = req.data;
        var del13 = await DELETE.from`BTP_PANASONIC.ZMM_ETD`.where`Client=${Client} and Sequence_Number=${Sequence_Number}`;
        return del13;
    });


    this.before('CREATE', 'POCrossRef', async (req) => {

        try {
            log.cfLoggingMessages('debug', 'POCrossRef.before' + req)
            const tx = cds.tx(req);

            if (!req.data.Client) {
                req.data.Client = Client
            }
            const Client = req.data.Client;

            if (!req.data.Po_Old) {
                req.data.Po_Old = Po_Old
            }
            const Po_Old = req.data.Po_Old;

            if (!req.data.PoItem_Old) {
                req.data.PoItem_Old = PoItem_Old
            }
            const PoItem_Old = req.data.PoItem_Old;

            if (!req.data.Po_New) {
                req.data.Po_New = Po_New
            }
            const Po_New = req.data.Po_New;

            if (!req.data.PoItem_New) {
                req.data.PoItem_New = PoItem_New
            }
            const PoItem_New = req.data.PoItem_New;

            const existingflag = await tx.run(SELECT.one(POCrossRef).where({ Client: Client, Po_Old: Po_Old, PoItem_Old: PoItem_Old, Po_New: Po_New, PoItem_New: PoItem_New }).columns('Client'));
            if (existingflag != null) {
                req.error({
                    code: '400',
                    message: 'Record Already Exists',
                    target: 'some_field',
                    status: 418
                })
            }
            else {
                log.cfLoggingMessages('info'+ "New Record Added Successfully")
            }
        } catch (error) {
            // log.cfLoggingMessages('error', error.message);
        }

    })

    this.before('CREATE', 'MNET_DiversionHeader', async (req) => {
        try {

            log.cfLoggingMessages('debug', 'MNET_DiversionHeader.before' + req)
            const tx = cds.tx(req);
            if (!req.data.ID) {
                req.data.ID = await util.autoID('MNET_DiversionHeader', 'ID', tx);
                // log.cfLoggingMessages('info', req.data);
            }



        }
        catch (e) {
            log.cfLoggingMessages('error', 'Error in MNET_DiversionHeader' + e.message);
            req.error({
                code: '400',
                message: e.message,
                target: 'MNET_DiversionHeader',
                status: 418
            })
        }



    })
    this.after(['CREATE'], 'MNET_DiversionHeader', async function (_, req) {
        try {

            log.cfLoggingMessages('debug', 'MNET_DiversionHeader.after' + req)
            const tx = cds.tx(req);
            const Purchase_order = req.data.Purchase_order;
            let poLine = req.data.PO_Line;
            // DiversionFlag
            let bolid = req.data.MNET_ID;
            let invNo = req.data.MNET_No;
            let invLine = req.data.Mnet_Line;
            let houseBOLNumber = req.data.houseBOLNumber;

            await tx.run(UPDATE(invoiceLine).set({ DiversionFlag: 'D' }).where({ purchaseOrderNumber: Purchase_order, orderItemNbr: poLine,INVOICENUMBER_HOUSEBOLNUMBER_ID:bolid,INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER:houseBOLNumber,InvoiceNumber_InvoiceNumber:invNo,LINENUMBER:invLine}));

        }
        catch (e) {
            log.cfLoggingMessages('error', 'Error in MNET_DiversionHeader:' + e.message);
            req.error({
                code: '400',
                message: e.message,
                target: 'MNET_DiversionHeader',
                status: 418
            })
        }

    })

    this.on('Update_AllActionMethods', async req => {
        try {
            log.cfLoggingMessages('debug', 'Update_AllActionMethods' + JSON.stringify(req.data))
            const tx = cds.tx(req);
            //  log.cfLoggingMessages('info', JSON.stringify(req.data));
            const HeaderID = req.data.ID;

            const Diversion_Data = await tx.run(SELECT.one(MNET_DiversionHeader).where({ ID: HeaderID }).columns('MNET_No', 'Mnet_Line', 'Container_ID', 'Purchase_order', 'PO_Line', 'houseBOLNumber', 'MNET_ID'));
            // log.cfLoggingMessages('info', JSON.stringify(Diversion_Data));

            const MNET_No = Diversion_Data.MNET_No;
            const Mnet_Line = Diversion_Data.Mnet_Line;
            const Container_ID = Diversion_Data.Container_ID;
            const Purchase_order = Diversion_Data.Purchase_order;
            const PO_Line = Diversion_Data.PO_Line;
            const houseBOLNumber = Diversion_Data.houseBOLNumber;
            const MNET_ID = Diversion_Data.MNET_ID;
            // log.cfLoggingMessages('info', "MNET_No:" + MNET_No + "Mnet_Line:" + Mnet_Line + "Container_ID:" + Container_ID + "Purchase_order:" + Purchase_order + "PO_Line:" + PO_Line);


            const Output = "SELECT NewPurchasing_Order,NewPOLine,NewQuantity,UnitPrice,PartUnitOfMeasurement,ExtendedCost from Diversion.MNET_DiversionDetail where ID_ID = '" + [HeaderID] + "'";
            let query = cds.parse.cql(Output);
            let result = await tx.run(query);
            // log.cfLoggingMessages('info', JSON.stringify(result));

            for (const oudata of result) {
                const NewPurchasing_Order = oudata.NewPurchasing_Order;
                const NewPOLine = oudata.NewPOLine;
                const NewQuantity = oudata.NewQuantity;
                // const UnitPrice   = oudata.UnitPrice;
                // const UOM = oudata.PartUnitOfMeasurement;
                const ExtendedCost = oudata.ExtendedCost;
                //  log.cfLoggingMessages('info', "NewPurchasing_Order:" + NewPurchasing_Order + "NewPOLine:" + NewPOLine + "NewQuantity:" + NewQuantity);
                await V_IBD_Posting(req, MNET_No, houseBOLNumber, MNET_ID, Mnet_Line, Container_ID, Purchase_order, PO_Line, NewPurchasing_Order, NewPOLine, NewQuantity);
                // CS for checking paymentconditiontype FR dnt process Inv
                let ZINVICE = null;
                const result = await SELECT.distinct.from(GET_MNET_DATA).where({ houseBOLNumber: houseBOLNumber, purchaseOrderNumber: Purchase_order }).columns('houseBOLNumber', 'purchaseOrderNumber', 'recordType', 'shipMethod', 'paymentConditionCode', 'POType', 'ID');
                for (const oudata of result) {
                    const recordType = oudata.recordType;
                    var shipMethod = oudata.shipMethod;
                    const paymentConditionCode = oudata.paymentConditionCode;
                    const POType = oudata.POType;
                    const id = oudata.ID;
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
                    var tmp_zpayconcode = '';
                    if (paymentConditionCode === 'FR') {
                        tmp_zpayconcode = 'FR';
                    }

                    const result = await SELECT.distinct.from(ZMNETBUSINESS).where({ ZRECTYPE: recordType, ZSHIPMETHOD: shipMethod, ZPOIND: POType, ZPAYCONCODE: tmp_zpayconcode });
                    // log.cfLoggingMessages('info', "ZMNET_Bresult" + JSON.stringify(result));

                    ZPAYCONCODE = result[0].ZPAYCONCODE;
                    ZINBD_DLVY = result[0].ZINBD_DLVY;
                    ZINVICE = result[0].ZINVICE;
                    ZGOODS_RECEIPT = result[0].ZGOODS_RECEIPT;
                    ZDLVY_INSTR = result[0].ZDLVY_INSTR;
                    ZANCITIPATED_REC = result[0].ZANCITIPATED_REC;
                    ZASN = result[0].ZASN;
                    // log.cfLoggingMessages('info', "Business ", ZPAYCONCODE, ZINBD_DLVY, ZINVICE, ZGOODS_RECEIPT, ZDLVY_INSTR, ZANCITIPATED_REC, ZASN);
                }
                //CE
                if (ZINVICE === 'Y') {
                    await V_Invoice_Posting(req, MNET_No, houseBOLNumber, MNET_ID, Mnet_Line, Container_ID, Purchase_order, PO_Line, NewPurchasing_Order, NewPOLine, NewQuantity,ExtendedCost);
                }
                // await V_Invoice_Posting(req, MNET_No, houseBOLNumber, MNET_ID, Mnet_Line, Container_ID, Purchase_order, PO_Line, NewPurchasing_Order, NewPOLine, NewQuantity);
                // await v_ASNDI_POSTING(req, houseBOLNumber, NewPurchasing_Order); // uncommented for defect 169 on 16/01 by Preethi 
                await GR_Posting(req, houseBOLNumber, Purchase_order, MNET_ID);

            }
        }
        catch (error) {
            log.cfLoggingMessages('error', 'Error in Update_AllActionMethods' + error)
            req.error({
                code: '400',
                message: error.message,
                target: 'UPDATE_A_PurchaseOrder',
                status: 418
            })
        }

    })
    /* Implementation: Service to update the status of Parent line during diversion based on child line status and update the execution log of Parent Line 
    Author: Preethi
    Date: 04-06-2024  
    */
    this.on('UpdateParentLine',async req => {
        try {
            log.cfLoggingMessages('debug', 'UpdateParentLine' + JSON.stringify(req.data))
            const tx = cds.tx(req);
            const iBOLID = req.data.BOLID;
            const BOL = req.data.houseBOLNumber;
            const ContainerID = req.data.containerID;
            const InvoiceNo = req.data.invID;
            const OrigPO = req.data.OriginalPO;
            const OrigPOLine = req.data.OriginalPOLine;
            const MNET_LINE = req.data.lineNumber;
            let importShipmentNumber= req.data.importShipmentNumber;
            var statusCheck = 0;
            var statusText = '';
            var DivertedPOInfo = [];
            
            const Output = "SELECT NewPurchasing_Order,NewPOLine,NewQuantity,UnitPrice,PartUnitOfMeasurement,ExtendedCost,Status from Diversion.MNET_DiversionDetail where ID_houseBOLNumber = '" + [BOL] + "' and ID_Mnet_No ='" +[InvoiceNo]+"' and ID_Container_ID ='"+[ContainerID]+"' and ID_Purchase_Order ='"+[OrigPO]+"' and ID_PO_Line ='"+[OrigPOLine]+"'";
            let query = cds.parse.cql(Output);
            let result = await tx.run(query);
            // let len = result.length;
            log.cfLoggingMessages('info', JSON.stringify(result));

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
                 //Incident no : INC0219607
                // when diversion takes place it is not considering invoice line to update status so it is updating all ther invoice lines for po and po line
                await tx.run(UPDATE(invoiceLine).set({ status: 'E' }).where({ purchaseOrderNumber: OrigPO,InvoiceNumber_InvoiceNumber:InvoiceNo,INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER:BOL,ContainerID:ContainerID,orderItemNbr:OrigPOLine,lineNumber: MNET_LINE,INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID})); 
            }
            else{
                //Incident no : INC0219607
                // when diversion takes place it is not considering invoice line to update status so it is updating all ther invoice lines for po and po line
                await tx.run(UPDATE(invoiceLine).set({ status:statusText }).where({ purchaseOrderNumber: OrigPO,InvoiceNumber_InvoiceNumber:InvoiceNo,INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER:BOL,ContainerID:ContainerID,orderItemNbr:OrigPOLine,lineNumber: MNET_LINE,INVOICENUMBER_HOUSEBOLNUMBER_ID: iBOLID })); 
            }
            var divlen = DivertedPOInfo.length;
            var msg = '';
            let dbQuery = "CALL GET_MNETSTATUSMONITORING_ID(NEXT_ID => ?)";
            // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
            const result1 = await cds.run(dbQuery, {});
            // log.cfLoggingMessages('info', 'SP NEXT ID result' + JSON.stringify(result));
            let ID = result1.NEXT_ID[0].ID;
            for(var i=0;i<divlen;i++)
           
            {
                 msg = msg + ":" + (DivertedPOInfo[i].PO) + "/" + (DivertedPOInfo[i].POLine);
            }
             
            
        
            const insertDiversionMnetData = {
                ID: ID,
                BOLID:iBOLID ,
                INVOICENUMBER: InvoiceNo,
                HOUSEBOLNUMBER: BOL,
                CONTAINERID: ContainerID,
                Message:`Original PO/item:${OrigPO}/${OrigPOLine} diverted to ${msg}.. Please check "U" Lines for details.`,
                ObjectType: 'DIVERSION',
                Status: 'S',
                IMPORTSHIPMENTNUMBER: importShipmentNumber
            }
            log.cfLoggingMessages('debug', 'insertDiversionMnetData' + insertDiversionMnetData)
            await tx.run(INSERT.into(MNetStatusMonitoring).entries(insertDiversionMnetData));
            const insertMnetItemData = {
                ID_ID: ID,
                LINEID:1,
                LINENUMBER:MNET_LINE,
                PURCHASEORDER: OrigPO,
                PURCHASEORDERITEM: OrigPOLine
            }
            await tx.run(INSERT.into(MNetStatusMonitoringItem).entries(insertMnetItemData));   

            
        }
        catch (error) {
            log.cfLoggingMessages('error', 'Error in UpdateParentLine' + error)
            req.error({
                code: '400',
                message: error.message,
                target: 'UPDATE_A_PurchaseOrder',
                status: 418
            })
        }   
})
    this.on('A_POlineitem', async () => {
        const allRecords = await SELECT.from`BTP.Panasonic.A_PurchaseOrderItem`.columns('PurchaseOrder_PurchaseOrder', 'PurchaseOrderItem', 'OrderQuantity', 'Material');
        //  log.cfLoggingMessages('debug', 'allRecords ->', allRecords)  //commented because of 15k records
        return allRecords;
    });     // Added for limitation issue
    this.on('A_PO_Update', async () => {
        const allRecords = await SELECT.from`BTP.Panasonic.PO_Update`.columns('PurchaseOrder', 'PurchaseOrderItem', 'ScheduleLineOpenQty');
        // log.cfLoggingMessages('info', allRecords); //commented because of lot of records
        return allRecords;
    });
  //to check the dropship status we are writing this service
    //31-05-2024
    //CS
    this.on('Check_DropShip_Status', async (req) => {
        let PurchaseOrder = req.data.OriginalPO;
        let dbQuery = "CALL GET_DROPSHIP_STATUS(PO => " + "'" + PurchaseOrder + "'" + ",STATUS => ?)";
        // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
        const result = await cds.run(dbQuery, {});
        log.cfLoggingMessages('debug', 'GET_DROPSHIP_STATUS=>' + JSON.stringify(result));
        let result1 = result.STATUS;
        PurchaseOrder = req.data.NewPO;
        dbQuery = "CALL GET_DROPSHIP_STATUS(PO => " + "'" + PurchaseOrder + "'" + ",STATUS => ?)";
        // log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
        const resultNew = await cds.run(dbQuery, {});
        log.cfLoggingMessages('debug', 'GET_DROPSHIP_STATUS=>' + JSON.stringify(resultNew));
        let result2 = resultNew.STATUS;
        return result1 == result2;
    });
    //CE
    const V_Invoice_Posting = async (req, MNET_No, houseBOLNumber, MNET_ID, Mnet_Line, Container_ID, Purchase_order, PO_Line, NewPurchasing_Order, NewPOLine, NewQuantity,ExtendedCost) => {
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

            let result = await tx.run(SELECT.from(GET_MNET_DATA).where({ ID: MNET_ID, houseBOLNumber: houseBOLNumber, invoiceNumber: MNET_No, lineNumber: Mnet_Line, containerID: Container_ID, purchaseOrderNumber: Purchase_order, orderItemNbr: PO_Line }));
            // log.cfLoggingMessages('info', JSON.stringify(result));
            for (const oData of result) {
                let v_importShipmentNumber =oData.importShipmentNumber;
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
                    let PoOrderQtyUnit = "";
                    let OdrPriceUnit = "";
                    //check PurchaseOrderQuantityUnit is null then get the PurchaseOrderQuantityUnit from A_PurchaseOrderitem
                    let result_PC = await tx.run(SELECT.from(A_PurchaseOrderItem).where({ PurchaseOrder_PurchaseOrder: NewPurchasing_Order, PurchaseOrderItem: NewPOLine }));
                    log.cfLoggingMessages('debug', ' result_PC ' + JSON.stringify(result_PC));
                    if (!oData.PurchaseOrderQuantityUnit) {
                        
                        OdrPriceUnit = result_PC && result_PC.length > 0 ? result_PC[0].OrderPriceUnit : ""
                        PoOrderQtyUnit = result_PC && result_PC.length > 0 ? result_PC[0].PurchaseOrderQuantityUnit : ""
                        log.cfLoggingMessages('debug', ' PoOrderQtyUnit ' + PoOrderQtyUnit);
                        log.cfLoggingMessages('debug', ' OrderPriceUnit ' + OdrPriceUnit);
                    } else {
                        PoOrderQtyUnit = oData.PurchaseOrderQuantityUnit;
                        OdrPriceUnit = result_PC && result_PC.length > 0 ? result_PC[0].OrderPriceUnit : ""
                        log.cfLoggingMessages('debug', ' PoOrderQtyUnit_else ' + PoOrderQtyUnit);
                        log.cfLoggingMessages('debug', ' OrderPriceUnit_else ' + OdrPriceUnit);
                    }
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
                        "PurchaseOrderQuantityUnit":OdrPriceUnit,
                        "qtyPerSLSUnitPricePackType": PoOrderQtyUnit,
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

                        log.cfLoggingMessages('debug', 'response1 -> ' + JSON.stringify(response1.data));

                    }).catch(error => {
                        log.cfLoggingMessages('error', 'error in  V_Invoice_Posting in cpi call' + JSON.stringify(error.response.data));
                    });
                    //log.cfLoggingMessages('info','response1 - ' + response1.status);
                }

            }


        }
        catch (e) {
            log.cfLoggingMessages('error', 'error in  V_Invoice_Posting ' + JSON.stringify(e));
            req.error({
                code: '400',
                message: e.message,
                target: 'V_Invoice_Posting',
                status: 418
            })
        }
    }

    const V_IBD_Posting = async (req, MNET_No, houseBOLNumber, MNET_ID, Mnet_Line, Container_ID, Purchase_order, PO_Line, NewPurchasing_Order, NewPOLine, NewQuantity) => {
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
            let v_date = year + '-' + vmonth + '-' + vday + 'T00:00:00';
            // log.cfLoggingMessages('info', 'IBD v_date : -' + v_date);
            const result = await tx.run(SELECT.distinct.from(GET_MNET_DATA).where({ ID: MNET_ID, houseBOLNumber: houseBOLNumber, invoiceNumber: MNET_No, lineNumber: Mnet_Line, containerID: Container_ID, purchaseOrderNumber: Purchase_order, orderItemNbr: PO_Line }));
            // log.cfLoggingMessages('info', JSON.stringify(result));
            for (const oudata of result) {
                const initialDestinationETA = oudata.initialDestinationETA;
                const CI = oudata.containerID;
                const Supplier = oudata.Supplier;
                // log.cfLoggingMessages('info', 'Supplier_ID' + Supplier);
                // log.cfLoggingMessages('info', 'ETA -> ' + initialDestinationETA);
                // log.cfLoggingMessages('info', 'containerID->' + CI);
                const TRATY = oudata.TRATY;
                let v_importShipmentNumber =oudata.importShipmentNumber;
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
                        "importShipmentNumber":v_importShipmentNumber,
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
                log.cfLoggingMessages('debug', 'IBD JSON 3: - ' + JSON.stringify(inv_post));

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

                    log.cfLoggingMessages('debug', 'response1 -> ' + JSON.stringify(response1.data));

                }).catch(error => {
                    log.cfLoggingMessages('error', 'error in V_IBD_Posting cpi call' + JSON.stringify(error.response.data));
                });

            }///



        }


        catch (e) {
            log.cfLoggingMessages('error', 'Error in V_IBD_Posting' + e)
            req.error({
                code: '400',
                message: e.message,
                target: 'V_IBD_Posting',
                status: 418
            })
        }
    }

    const GR_Posting = async (req, houseBOLNumber, Purchase_order, MNET_ID) => {
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

                    log.cfLoggingMessages('debug', 'response1 -> ' + JSON.stringify(response1.data));

                }).catch(error => {
                    log.cfLoggingMessages('error', 'error in GR_Posting cpi call ' + JSON.stringify(error.response.data));
                });

            }



            return true;
        }
        catch (error) {
            log.cfLoggingMessages('error', 'Error in GR_Posting' + error.message);
            req.error({
                code: '400',
                message: error.message,
                target: 'some_field',
                status: 418
            })

            return false;

        }
    }



    // const v_ASNDI_POSTING = async (req, houseBOLNumber, NewPurchasing_Order) => {
    //     try {
    //         const tx = cds.tx(req);
    //         log.cfLoggingMessages('debug', 'Req.Data -> ' + JSON.stringify(req.data));

    //         let SelectQuery1 = "SELECT Distinct houseBOLNumber,invoiceNumber,containerID,ObjectRefNo,purchaseOrderNumber,PurchaseOrderItem,deliveryDocument,TRAID,ZTMODE,ZVESSEL,ZFOLDERNO,ZRECTYPE,ZVOYAGE_NO,ZBOL_DEST,ZORDERERID,ZTRANCREDATE,ZCUSTPONO,ZCAFACNUM,ZSTATUS,ZSAPLINEIDIBD,ZINVLINENO,ZMECAPONO,ZFINVLINEQTY,ZNOOFCASE,ZQUANPERCASE,LIFEX,ZUNIFIEDMODELNO,ZASNDIV,ZCARRID,POTIM,DC,WHSE,ALTKN,TDSPRAS,EXPIRY_DATE_EXT,EXPIRY_DATE_EXT_B,ZCARR_ASN,ZINBTYPE,ZDIARIND,TDLINE1,TDLINE2,PODAT,PARTNER_ID,JURISDIC,LANGUAGE,ZDELVTONAME,ZSTREET1,ZSTREET2,ZSTREET4,ZPOSTALCODE,ZCITY1,ZSTATE,ZCOUNTRY,NAME1,NAME2,STREET1,POSTL_COD1,CITY1,CITY2,COUNTRY1,REGION,Purchasinggroup,ZCARACT From MNET_Dashboard.MNET_WebMethod Where TRAID = " + "'" + houseBOLNumber + "' And NewPurchasing_Order = " + "'" + NewPurchasing_Order + "' ORDER BY houseBOLNumber, containerID, ObjectRefNo, deliveryDocument, purchaseOrderNumber, PurchaseOrderItem";    //added order by for 165 defect by Preethi on 15/01/24";
    //         let query = cds.parse.cql(SelectQuery1);
    //         let ASN_DI_post = await tx.run(query);

    //         // log.cfLoggingMessages('info', 'SelectQuery1->' + SelectQuery1);
    //         // log.cfLoggingMessages('info', 'ASN_DI_post->' + JSON.stringify(ASN_DI_post));
    //         // log.cfLoggingMessages('info', 'ASN_DI->' + ASN_DI_post);
    //         //added by Kanchan defect 185 19/1/24
    //         for (var data1 = 0; data1 < ASN_DI_post.length; data1++) {
    //             // log.cfLoggingMessages('info', "data_ASN_DI_post", data1);
    //             // log.cfLoggingMessages('info', "Result[data1]_diversion==>", ASN_DI_post[data1]);

    //             let update = '';

    //             if (ASN_DI_post[data1].ZSTATUS === 'C') {
    //                 update = 'A';

    //                 ASN_DI_post[data1].ZSTATUS = update;
    //                 //  log.cfLoggingMessages('info', "update==>", update);
    //             }
    //             else if (ASN_DI_post[data1].ZSTATUS === 'D') {
    //                 update = 'D';

    //                 ASN_DI_post[data1].ZSTATUS = update;

    //                 //  log.cfLoggingMessages('info', "update==>", update);

    //             }
    //             else if (ASN_DI_post[data1].ZSTATUS != 'C' && ASN_DI_post[data1].ZSTATUS) {
    //                 update = 'M';

    //                 ASN_DI_post[data1].ZSTATUS = update;

    //                 //  log.cfLoggingMessages('info', "update==>", update);

    //             }
    //             // log.cfLoggingMessages('info', 'ASN_DI_INSIDE_loop->' + JSON.stringify(ASN_DI_post));
    //         }
    //         log.cfLoggingMessages('debug', 'ASN_DI_post_Payload->' + JSON.stringify(ASN_DI_post));
    //         //end added by Kanchan defect 185 19/1/24
    //         ////// Call CPI API
    //         //Declarations

    //         const CPI_URL_Data = await SELECT.one(Environment).where({ APPID: 'CPI_ASN_DI' }).columns('URL', 'tokenUrl', 'clientId', 'clientSecret');
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

    //             data: ASN_DI_post

    //         }).then(response1 => {

    //             log.cfLoggingMessages('debug', 'response1 -> ' + JSON.stringify(response1.data));

    //         }).catch(error => {
    //             //  log.cfLoggingMessages('error', 'error in v_ASNDI_POSTING CPI call', JSON.stringify(error.response.data));
    //         });
    //         //  log.cfLoggingMessages('info', "ASN_DI_post:" + JSON.stringify(ASN_DI_post));
    //         return true;


    //     } catch (error) {
    //         log.cfLoggingMessages('error', 'error in v_ASNDI_POSTING' + error)
    //         req.error
    //             ({
    //                 code: '400',
    //                 message: error.message,
    //                 target: 'some_field',
    //                 status: 418
    //             })
    //     }


    // }



    this.on("READ", "GET_userInfo", async (req, res) => {

        log.cfLoggingMessages('debug', 'GET_userInfo-> ' + req);
        if (req.user.is('POManager')) {
            const user = await {
                id: req.user.id,
                tenant: req.user.tenant,
                roles: req.user._roles,
                attr: req.user.attr,
                admin: "true"
            }
            return user;
        } else {
            const user = await {
                id: req.user.id,
                tenant: req.user.tenant,
                roles: req.user._roles,
                attr: req.user.attr,
                admin: "false"
            }
            return user;
        }
    });
    //@Gnaneshwar: fetching authentication token from .env file
    this.on('fetchAuthToken', async (req) => {
        try {
            log.cfLoggingMessages('debug', 'fetchAuthToken -> ' + req);
            var result = process.env.AUTH_TOKEN;
            return result;
        } catch (err) {
            log.cfLoggingMessages('error', 'Error in fetchAuthToken' + err)
            req.error({
                code: '500',
                message: `Internal Server error ${err}`,
                target: 'fetchAuthToken',
                status: 500
            })
        }
    });

    // get user assigned role access
    this.on('UserDetails', async (req) => {
        try {
            log.cfLoggingMessages('debug', 'UserDetails -> ' + req);
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