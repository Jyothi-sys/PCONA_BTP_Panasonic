//const errmsg = require("./response-message.json");
const log = require('./logger')

module.exports = {
    checkDuplicateMNETfile: async function (fileBolHeader, HtoOStatus, HtoOInvLine, CHbrokerCode, CurrentInvoiceStatus, CurrInvLine) {

        
        var houseBOLNumber = fileBolHeader.houseBOLNumber;
        var importShipmentNumber = fileBolHeader.importShipmentNumber;
        let MNETFileDifferent = 0;            // defect 172.n   This value is checked in calling program. It is set to 1 in the code below when record is different
        let INVOICEHEADER_ABSENT = 2;         // defect 172.n   This value is checked in calling program
        let DUPLICATERecord_present = 0;      // defect 172.n
        let invoiceheadertagexists = false;   // defect 172.n
        let partsubstituteflag;
        let HToPresent = false;
        let ETAFileDifferent = 0;  // defect 91 This value is for check ETA
        let BOLFileDifferent = 0;  // defect 91 This value is for check BOL
        // Replaced return value of "true" with multiple values to accommodate Part Substitution for ETA and BOL change.
        // If invoiceheaderflagexists = false ... set return value to 1 for  duplicate check and  2 for existence of 
        // invoiceheader if invoiceheader does not exist it is an ETA / BOL change

        var dbresult = await SELECT.from`BTP.Panasonic.bolHeader`.where`houseBOLNumber=${houseBOLNumber} 
                                                                    and importShipmentNumber =${importShipmentNumber}`.columns('ID', 'houseBOLNumber', 'initialDestinationETA', 'brokerCode');

        if (dbresult.length > 0) {

            dbresult.sort((a, b) => b.ID - a.ID);
            log.cfLoggingMessages('debug','dbresult after sort latest ' + dbresult[0]);
            const dbinitialDestinationETA = dbresult[0].initialDestinationETA;
            const dbinitialhouseBOLNumber = dbresult[0].houseBOLNumber;
            const fileinitialDestinationETA = fileBolHeader.initialDestinationETA;
            const dbbrokerCode = dbresult[0].brokerCode;
            const filebrokerCode = fileBolHeader.brokerCode;
            const id = dbresult[0].ID;

            //Compare broker Code
            if (dbbrokerCode === filebrokerCode || (!dbbrokerCode && !filebrokerCode)) {
                log.cfLoggingMessages('debug','Broker Code in if' + dbbrokerCode + filebrokerCode);
            } else {
                log.cfLoggingMessages('debug','Broker Code' + dbbrokerCode + filebrokerCode);
                CHbrokerCode.push({ houseBOLNumber: houseBOLNumber, ID: id, brokerCode: filebrokerCode });
            };

            //Compare ETA date
            if (dbinitialDestinationETA === fileinitialDestinationETA || (!dbinitialDestinationETA && !fileinitialDestinationETA)) {
                log.cfLoggingMessages('debug','initialDestinationETA in if' +  dbinitialDestinationETA + fileinitialDestinationETA);
                log.cfLoggingMessages('debug','fileinitialDestinationETA in if' + fileinitialDestinationETA);
                DUPLICATERecord_present = 1;        //defect 224.n
            } else {
                log.cfLoggingMessages('debug','initialDestinationETA' + dbinitialDestinationETA);
                log.cfLoggingMessages('debug','fileinitialDestinationETA' + fileinitialDestinationETA);
                // MNETFileDifferent = 1; //defect 224.n 
                ETAFileDifferent = 1;
            };

            //Compare BOL Change(BOL Number)
            if (dbinitialhouseBOLNumber === houseBOLNumber || (!dbinitialhouseBOLNumber && !houseBOLNumber)) {
                 log.cfLoggingMessages('debug','dbinitialhouseBOLNumber in if' + dbinitialhouseBOLNumber + houseBOLNumber);
                
            } else {
                log.cfLoggingMessages('debug','dbinitialhouseBOLNumber' + dbinitialhouseBOLNumber);
                log.cfLoggingMessages('debug','houseBOLNumber' + houseBOLNumber);
                BOLFileDifferent = 1;
            };

            //Compare Invoiceline values
            for (let i = 0; i < Object.keys(fileBolHeader["invoiceHeader"]).length; i++) {
                var fileInvoiceHeader = fileBolHeader["invoiceHeader"][i];
                invoiceheadertagexists = true;      // defect 172.n

                //compare invoice line
                for (let j = 0; j < Object.keys(fileInvoiceHeader["invoiceLine"]).length; j++) {
                    var fileInvoiceLine = fileInvoiceHeader["invoiceLine"][j];
                    DUPLICATERecord_present = 1;        //defect 224.n
                    HToPresent = false;
                    //Select DB record & Compare Invoice Line
                    //changed for defect 67 H->O duplicate check on 29/03 
                    var dbInvoiceLine = await SELECT.from`BTP.Panasonic.invoiceLine`.where`INVOICENUMBER_INVOICENUMBER=${fileInvoiceHeader.invoiceNumber} 
                                                                                    
                                                                                    and INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER=${houseBOLNumber}
                                                                                    and lineNumber=${fileInvoiceLine.lineNumber} 
                                                                                    and partID=${fileInvoiceLine.partID}`.columns('INVOICENUMBER_HOUSEBOLNUMBER_ID', 'INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER', 'INVOICENUMBER_INVOICENUMBER', 'lineNumber', 'partID', 'action', 'quantity', 'unitPrice', 'containerID', 'status', 'orderItemNbr', 'purchaseOrderNumber');

                    if (dbInvoiceLine.length > 0) {

                        dbInvoiceLine.sort((a, b) => b.INVOICENUMBER_HOUSEBOLNUMBER_ID - a.INVOICENUMBER_HOUSEBOLNUMBER_ID);
                        log.cfLoggingMessages('debug','dbInvoiceLine after sort latest ' + dbInvoiceLine[0]);
                        //compare action
                        if (dbInvoiceLine[0].action === fileInvoiceLine.action || (!dbInvoiceLine[0].action && !fileInvoiceLine.action || fileInvoiceLine.action === 'A' || fileInvoiceLine.action === 'M')) {
                            log.cfLoggingMessages('debug','InvoiceLine.action' + dbInvoiceLine[0].action);
                            log.cfLoggingMessages('debug','InvoiceLine.action' + fileInvoiceLine.action);
                        } else {
                            log.cfLoggingMessages('debug','InvoiceLine.action' + dbInvoiceLine[0].action + fileInvoiceLine.action);
                            DUPLICATERecord_present = 0;        //defect 224.n
                        };

                        //compare Quantity
                        if (dbInvoiceLine[0].quantity === fileInvoiceLine.quantity || (!dbInvoiceLine[0].quantity && !fileInvoiceLine.quantity)) {
                            log.cfLoggingMessages('debug','InvoiceLine.quantity' + dbInvoiceLine[0].quantity + fileInvoiceLine.quantity);
                        } else {
                           log.cfLoggingMessages('debug','InvoiceLine.quantity' + dbInvoiceLine[0].quantity + fileInvoiceLine.quantity);
                            DUPLICATERecord_present = 0;        //defect 224.n
                        };

                        //Compare Unit Price, format price before comparison
                        let dbInvoiceLinePrice = parseFloat(dbInvoiceLine[0].unitPrice).toFixed(2).replace(/\.?0+$/, '');
                        if (dbInvoiceLinePrice === fileInvoiceLine.unitPrice || (!dbInvoiceLinePrice && !fileInvoiceLine.unitPrice)) {
                            log.cfLoggingMessages('debug','InvoiceLine.unitPrice' + dbInvoiceLinePrice + fileInvoiceLine.unitPrice);
                        } else {
                            log.cfLoggingMessages('debug','InvoiceLine.unitPrice' + dbInvoiceLinePrice + fileInvoiceLine.unitPrice);
                            DUPLICATERecord_present = 0;        //defect 224.n
                        };

                        // containerID:
                        if (dbInvoiceLine[0].containerID === fileInvoiceLine.containerID || (!dbInvoiceLine[0].containerID && !fileInvoiceLine.containerID)) {
                            log.cfLoggingMessages('debug','InvoiceLine.containerID' + dbInvoiceLine[0].containerID + fileInvoiceLine.containerID);
                        } else {
                            log.cfLoggingMessages('debug','InvoiceLine.containerID' + dbInvoiceLine[0].containerID + fileInvoiceLine.containerID);
                            DUPLICATERecord_present = 0;        //defect 224.n
                        };

                        //status
                        if (dbInvoiceLine[0].status === fileInvoiceLine.status || (!dbInvoiceLine[0].status && !fileInvoiceLine.status || fileInvoiceLine.status === 'O')) {
                            log.cfLoggingMessages('debug','InvoiceLine.status' + dbInvoiceLine[0].status, fileInvoiceLine.status);
                            //Check DB status H, file Status O, trigger Update to Invoice line with Status 'I'.
                            if (fileInvoiceLine.status === 'O' && dbInvoiceLine[0].status === 'H') {

                                HtoOStatus.push('Y');
                                HtoOInvLine.push(dbInvoiceLine[0]);
                                HToPresent = true;
                            }

                        } else {
                            log.cfLoggingMessages('debug','InvoiceLine.status' + dbInvoiceLine[0].status + fileInvoiceLine.status);
                            DUPLICATERecord_present = 1;        //defect 224.n
                        };

                        //Compare Additional Invoice line
                        for (let k = 0; k < Object.keys(fileInvoiceLine["additionalInvoiceLine"]).length; k++) {
                            var fileAdditionalInvoiceLine = fileInvoiceLine["additionalInvoiceLine"][k];

                          //changed the query for defect 67 H->O duplicate check on 29/03 
                            var dbAdditionalInvoiceLine = await SELECT.from`BTP.Panasonic.additionalInvoiceLine`.where`PARTID_PARTID=${fileInvoiceLine.partID} 
                                                                                                          and PARTID_INVOICENUMBER_INVOICENUMBER=${fileInvoiceHeader.invoiceNumber} 
                                                                                                          
                                                                                                          and PARTID_INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER=${houseBOLNumber}
                                                                                                          and PARTID_LINENUMBER=${fileInvoiceLine.lineNumber}`.columns('PARTID_INVOICENUMBER_HOUSEBOLNUMBER_ID','mecaOrderNbr', 'orderItemNbr', 'qtyPerSLSUnitPricePackType', 'PASCOriginalPartsNbr', 'PARTID_LINENUMBER');

                            if (dbAdditionalInvoiceLine.length) {

                                dbAdditionalInvoiceLine.sort((a, b) => b.PARTID_INVOICENUMBER_HOUSEBOLNUMBER_ID - a.PARTID_INVOICENUMBER_HOUSEBOLNUMBER_ID);
                                log.cfLoggingMessages('debug','dbAdditionalInvoiceLine after sort latest ' + dbAdditionalInvoiceLine[0]);

                                //compare mecaOrderNbr i.e. PO
                                if (dbAdditionalInvoiceLine[0].mecaOrderNbr === fileAdditionalInvoiceLine.mecaOrderNbr || (!dbAdditionalInvoiceLine[0].mecaOrderNbr && !fileAdditionalInvoiceLine.mecaOrderNbr)) {
                                    log.cfLoggingMessages('debug','InvoiceLine.mecaOrderNbr' + dbAdditionalInvoiceLine[0].mecaOrderNbr + fileAdditionalInvoiceLine.mecaOrderNbr);
                                } else {
                                    log.cfLoggingMessages('debug','InvoiceLine.mecaOrderNbr' + dbAdditionalInvoiceLine[0].mecaOrderNbr + fileAdditionalInvoiceLine.mecaOrderNbr);
                                    DUPLICATERecord_present = 0;        //defect 224.n
                                };

                                //compare orderItemNbr i.e. PO Items#
                                if (dbAdditionalInvoiceLine[0].orderItemNbr === fileAdditionalInvoiceLine.orderItemNbr || (!dbAdditionalInvoiceLine[0].orderItemNbr && !fileAdditionalInvoiceLine.orderItemNbr)) {
                                    log.cfLoggingMessages('debug','InvoiceLine.orderItemNbr' + dbAdditionalInvoiceLine[0].orderItemNbr + fileAdditionalInvoiceLine.orderItemNbr);
                                } else {
                                    log.cfLoggingMessages('debug','InvoiceLine.orderItemNbr' + dbAdditionalInvoiceLine[0].orderItemNbr + fileAdditionalInvoiceLine.orderItemNbr);
                                    DUPLICATERecord_present = 0;        //defect 224.n
                                };

                                //compare qtyPerSLSUnitPricePackType i.e. QtyUnit in InvoiceLine
                                if (dbAdditionalInvoiceLine[0].qtyPerSLSUnitPricePackType === fileAdditionalInvoiceLine.qtyPerSLSUnitPricePackType || (!dbAdditionalInvoiceLine[0].qtyPerSLSUnitPricePackType && !fileAdditionalInvoiceLine.qtyPerSLSUnitPricePackType)) {
                                    log.cfLoggingMessages('debug','InvoiceLine.qtyPerSLSUnitPricePackType' + dbAdditionalInvoiceLine[0].qtyPerSLSUnitPricePackType + fileAdditionalInvoiceLine.qtyPerSLSUnitPricePackType);
                                } else {
                                    log.cfLoggingMessages('debug','InvoiceLine.qtyPerSLSUnitPricePackType' + dbAdditionalInvoiceLine[0].qtyPerSLSUnitPricePackType + fileAdditionalInvoiceLine.qtyPerSLSUnitPricePackType);
                                    DUPLICATERecord_present = 0;        //defect 224.n
                                };

                                //compare PASCOriginalPartsNbr
                                if ((dbAdditionalInvoiceLine[0].PASCOriginalPartsNbr !== null && fileAdditionalInvoiceLine.PASCOriginalPartsNbr !== null) && dbAdditionalInvoiceLine[0].PASCOriginalPartsNbr === fileAdditionalInvoiceLine.PASCOriginalPartsNbr) {
                                    log.cfLoggingMessages('debug','InvoiceLine.PASCOriginalPartsNbr' + dbAdditionalInvoiceLine[0].PASCOriginalPartsNbr + fileAdditionalInvoiceLine.PASCOriginalPartsNbr);
                                    partsubstituteflag = true;       //defect 224.n    
                                    //         fileInvoiceLine.status = 'E';  // Check in Debug if this actually updates the request datastructure, if not you will need to update the database after record is inserted into Invoiceline in calling program
                                    CurrentInvoiceStatus.push('E');
                                    CurrInvLine.push(dbInvoiceLine[0]); // Need to check value that is required for assisting with Update -- brahma
                                    log.cfLoggingMessages('debug','CurrInvLine_push2' + CurrInvLine + CurrentInvoiceStatus);
                                } else if ((dbAdditionalInvoiceLine[0].PASCOriginalPartsNbr !== null && fileAdditionalInvoiceLine.PASCOriginalPartsNbr !== null) && dbAdditionalInvoiceLine[0].PASCOriginalPartsNbr !== fileAdditionalInvoiceLine.PASCOriginalPartsNbr) {
                                    partsubstituteflag = false;
                                    log.cfLoggingMessages('debug','InvoiceLine.PASCOriginalPartsNbr' + dbAdditionalInvoiceLine[0].PASCOriginalPartsNbr + fileAdditionalInvoiceLine.PASCOriginalPartsNbr);
                                    //return MNETFileDifferent;
                                    DUPLICATERecord_present = 0;        //defect 224.n
                                } else {
                                    partsubstituteflag = false;
                                }

                            }
                            else {
                                log.cfLoggingMessages('info' + 'New AdditionalInvoiceLine');
                                DUPLICATERecord_present = 0;        //defect 224.n
                            };

                        };
                        if ((partsubstituteflag == false) && (DUPLICATERecord_present == 1)) {
                            // Delete record from inbound request or update linestatus with a code that can later be used to delete the record from db.
                            // update linestatus with "I" so that the record in db can be deleted in the calling program
                            if (HToPresent == false) {
                                CurrentInvoiceStatus.push('I');
                                log.cfLoggingMessages('debug','CurrInvLine_push' + CurrInvLine + CurrentInvoiceStatus);
                                CurrInvLine.push(dbInvoiceLine[0]);
                                log.cfLoggingMessages('debug','CurrInvLine_push' + CurrInvLine + CurrentInvoiceStatus);
                            } else {
                                MNETFileDifferent = 1;
                            }
                        }
                    }
                    else {
                        log.cfLoggingMessages('info' + 'New InvoiceLine');
                        DUPLICATERecord_present = 0;        //defect 224.n
                        MNETFileDifferent = 1;
                    }

                    if (DUPLICATERecord_present == 0) MNETFileDifferent = 1;
                };    // End of For Loop for Invoice Line

                if (DUPLICATERecord_present == 0) {    //defect 224.n
                    MNETFileDifferent = 1;
                }

            };      // End of For Loop for Invoice Header
            if (invoiceheadertagexists == false) {                  //Defect 224.sn
                return INVOICEHEADER_ABSENT;
            } else {
                if (DUPLICATERecord_present == 0 || HToPresent == 1) MNETFileDifferent = 1;
                else 
                    if (ETAFileDifferent == 1) MNETFileDifferent = 3;      //Defect 91.n    Value 3 Implies ETA change
                    else 
                        if (BOLFileDifferent == 1) MNETFileDifferent = 4;  //Defect 91.n    Value 4 Implies BOL Change
                return MNETFileDifferent;
            }                                                              //Defect 224.en
        }

        else {
            //New MNET document
            log.cfLoggingMessages('debug','Duplicate MNET Check - No DATA');                                                      //Defect 224.en
            MNETFileDifferent = 1;      //Defect 224.en
            return MNETFileDifferent;
        }
    },

    CheckIBD_GRStatus: async function (v_BOL_ID, V_BOL, V_INVID, V_lineNumber, V_PO) { //Defect216part3c.n
        // Put logic for querying the Invoiceline table Status for IBD, GR and InvoiceLine Status, if either one of this has an error, then return false. IBD or Invoice Processing should not occur for that line. When query returns null resultset or if the fields are null or '' then return true. Downstream Processing should occur.invoiceLine
        log.cfLoggingMessages('debug','CheckIBD_GRStatus==>' + v_BOL_ID + ":" + V_BOL + ":" + V_INVID + ":" + V_lineNumber + ":" + V_PO);
        let ibd_gr = await SELECT.from`BTP.Panasonic.invoiceLine`.where({ purchaseOrderNumber: V_PO, lineNumber: V_lineNumber, INVOICENUMBER_HOUSEBOLNUMBER_ID: v_BOL_ID, INVOICENUMBER_INVOICENUMBER: V_INVID, INVOICENUMBER_HOUSEBOLNUMBER_HOUSEBOLNUMBER: V_BOL }).columns('BTP_IBDStatus', 'BTP_InvoiceStatus', 'BTP_GRStatus');
        if (ibd_gr.BTP_IBDStatus == 'E' || ibd_gr.BTP_GRStatus == 'E') {
            return false;
        }
        else {
            log.cfLoggingMessages('debug','ibd_true');
            return true;
        }
    } //Defect216part3c.n
}