const cds = require('@sap/cds');
const dbClass = require("sap-hdbext-promisfied");
const hdbext = require("@sap/hdbext");
const log = require('../util/logger');
const axios = require("axios");


module.exports = cds.service.impl(function () {
    const {
        Environment
        } = cds.entities(
        'BTP.Panasonic'
        )


    this.before('CREATE', 'zjda_ship_plan', async (req) => {

        log.cfLoggingMessages('debug', 'zjda_ship_plan -> ' + req);
        var count_seq = await SELECT.from`BTP.Panasonic.zjda_ship_plan`;
        // log.cfLoggingMessages('debug', 'count_seq -> ', count_seq);
        // log.cfLoggingMessages('info',count_seq);
        req.data.counter = count_seq.length + 1;
    });

    // Defect 42 - Part 2 changes added by Nithya on 19/03

    this.on('jdashipplan_records', async () => {
        
        let allRecords = [];
        let result;
        var read = await SELECT.from`BTP.Panasonic.zjda_ship_plan`;
        result = read.length;
        log.cfLoggingMessages('debug', 'result -> ' + result);
        // log.cfLoggingMessages('info',result);
        allRecords = allRecords.concat(read);

        while (read && read.__next) {
            const response = await fetch(read.__next);
            read = await response.json();
            allRecords = allRecords.concat(read);
        }
        log.cfLoggingMessages('info' + allRecords);
        return allRecords;
    });


    // this.on('po_create', async () => {
    //     try {
    //         // log.cfLoggingMessages('debug', 'po_create -> ' + req);
    //         // const db = await cds.connect.to('db');
    //         // let dbConn = new dbClass(await dbClass.createConnection(db.options.credentials));
    //         // const sp = await dbConn.loadProcedurePromisified(hdbext, null, 'PO_CREATE');
    //         // const result = await dbConn.callProcedurePromisified(sp, []);
    //         // log.cfLoggingMessages('debug', 'result -> ' + result);
    //         // // log.cfLoggingMessages('info',result);
    //         // return { status: "200", response: result.results };
    //         //Adjusted the code as procedure pattern as changed
    //         let dbQuery = "CALL PO_CREATE(OUT_DATA => ?)"
    //         log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
    //         const result = await cds.run(dbQuery, {});
    //         log.cfLoggingMessages('info', 'PO_CREATE SP result' + JSON.stringify(result));
    //         const sendData = result ? JSON.stringify(result.OUT_DATA): {};
    //         return sendData;
    //     }
    //     catch (error) {
    //         log.cfLoggingMessages('error','Error in po_create' + error)
    //         return { status: "500", response: error };
    //     }
    // });


    // this.on('po_create', async () => {
    //     try {
    //         let dbQuery = "CALL PO_CREATE(OUT_DATA => ?)";
    //         log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
            
    //         // Call the procedure
    //         const result = await cds.run(dbQuery, []);
    //         log.cfLoggingMessages('info', 'PO_CREATE SP result' + JSON.stringify(result));
            
    //         // Extract the data from the result
    //         const data = result ? result.OUT_DATA : [];
            
    //         // Return the data directly
    //         return data;
    //     } catch (error) {
    //         log.cfLoggingMessages('error', 'Error in po_create: ' + error);
    //         return { status: "500", response: error };
    //     }
    // });

        this.on('po_create', async () => {
        try {
            let dbQuery = "CALL PO_CREATE(OUT_DATA => ?)";
            log.cfLoggingMessages('info', 'dbQuery -> ' + dbQuery);
            
            // Call the procedure
            const result = await cds.run(dbQuery, []);
            log.cfLoggingMessages('info', 'PO_CREATE SP result: ' + JSON.stringify(result));
            
            // Extract the data from the result
            const data = Array.isArray(result.OUT_DATA) ? result.OUT_DATA : [];
            log.cfLoggingMessages('info', 'Extracted data: ' + JSON.stringify(data));
            
            // Return the data directly
            return { status: "200", response:data };
        } catch (error) {
            log.cfLoggingMessages('error', 'Error in po_create: ' + error);
            return { status: "500", response: error };
        }
    });


    // this.on('sel_create', async (req) => {
    //     log.cfLoggingMessages('debug', 'sel_create -> ' + JSON.stringify(req.data));
    
    //     // Extract the input data fields from req.data
    //     const { 
    //         ship_plan_received_from,
    //         ship_plan_received_to,
    //         itemtype,
    //         ship_plan_source,
    //         shipdate_from,
    //         shipdate_to,
    //         supplyType,
    //         material,
    //         salesorder,
    //         salesorderline,
    //         purchasing_org,
    //         purchasing_group,
    //         plant,
    //         vendor_i_e_indicator,
    //         vendor,
    //         sub_con_vendor 
    //     } = req.data;
    
    //     try {
    //         // Check if a record with the same fields already exists
    //         const existingRecord = await SELECT.from`BTP_PANASONIC.zjda_shipplan_sel_criterion`
    //             .where`
    //                 ship_plan_received_from=${ship_plan_received_from} and 
    //                 ship_plan_received_to=${ship_plan_received_to} and 
    //                 itemtype=${itemtype} and 
    //                 ship_plan_source=${ship_plan_source} and 
    //                 shipdate_from=${shipdate_from} and 
    //                 shipdate_to=${shipdate_to} and 
    //                 supplyType=${supplyType} and 
    //                 material=${material} and 
    //                 salesorder=${salesorder} and 
    //                 salesorderline=${salesorderline} and 
    //                 purchasing_org=${purchasing_org} and 
    //                 purchasing_group=${purchasing_group} and 
    //                 plant=${plant} and 
    //                 vendor_i_e_indicator=${vendor_i_e_indicator} and 
    //                 vendor=${vendor} and 
    //                 sub_con_vendor=${sub_con_vendor}`;
    
    //         if (existingRecord.length > 0) {
    //             log.cfLoggingMessages('info', 'Record already exists with the same fields.');
    //             req.error(409, 'Record already exists.');
    //             return;
    //         }
    
    //         // Insert a new record if no existing record found
    //         const newRecord = await INSERT.into('BTP_PANASONIC.zjda_shipplan_sel_criterion').entries(req.data);
    //         log.cfLoggingMessages('info', 'New record inserted -> ' + JSON.stringify(newRecord));
    //         return newRecord;
    
    //     } catch (error) {
    //         log.cfLoggingMessages('error', 'Error during record creation -> ' + error.message);
    //         req.error(500, 'Error processing the request');
    //     }
    // });
    

    this.on('sel_create', async (req) => {
        log.cfLoggingMessages('debug', 'sel_create -> ' + JSON.stringify(req.data));
    
        // Extract the input data fields from req.data
        const { 
            ship_plan_received_from, 
            ship_plan_received_to, 
            itemtype, 
            ship_plan_source, 
            shipdate_from, 
            shipdate_to, 
            supplyType, 
            material, 
            salesorder, 
            salesorderline, 
            purchasing_org, 
            purchasing_group, 
            plant, 
            vendor_i_e_indicator, 
            vendor, 
            sub_con_vendor, 
           
        } = req.data;
    
        try {
            // Check if a record with the same key fields already exists
            const existingRecord = await SELECT.from`BTP_PANASONIC.zjda_shipplan_sel_criterion`
                .where`
                    ship_plan_received_from=${ship_plan_received_from} and 
                    ship_plan_received_to=${ship_plan_received_to} and 
                    ship_plan_source=${ship_plan_source} and 
                    shipdate_from=${shipdate_from} and 
                    shipdate_to=${shipdate_to} and 
                    purchasing_org=${purchasing_org} and 
                    purchasing_group=${purchasing_group} and 
                    plant=${plant} and 
                    vendor_i_e_indicator=${vendor_i_e_indicator}`;
    
            if (existingRecord.length > 0) {
                // If record exists, update the existing record
                const updatedRecord = await UPDATE`BTP_PANASONIC.zjda_shipplan_sel_criterion`
                    .set`
                        itemtype = ${itemtype}, 
                        supplyType = ${supplyType}, 
                        material = ${material}, 
                        salesorder = ${salesorder}, 
                        salesorderline = ${salesorderline}, 
                        vendor = ${vendor}, 
                        sub_con_vendor = ${sub_con_vendor}`
                    .where`
                        ship_plan_received_from=${ship_plan_received_from} and 
                        ship_plan_received_to=${ship_plan_received_to} and 
                        ship_plan_source=${ship_plan_source} and 
                        shipdate_from=${shipdate_from} and 
                        shipdate_to=${shipdate_to} and 
                        purchasing_org=${purchasing_org} and 
                        purchasing_group=${purchasing_group} and 
                        plant=${plant} and 
                        vendor_i_e_indicator=${vendor_i_e_indicator}`;
    
                log.cfLoggingMessages('info', 'Existing record updated -> ' + JSON.stringify(updatedRecord));
                return updatedRecord;
            } else {
                // If no existing record, insert a new one
                const newRecord = await INSERT.into('BTP_PANASONIC.zjda_shipplan_sel_criterion').entries(req.data);
                log.cfLoggingMessages('info', 'New record inserted -> ' + JSON.stringify(newRecord));
                return newRecord;
            }
        } catch (error) {
            log.cfLoggingMessages('error', 'Error during sel_create -> ' + error.message);
            req.error(500, 'Error processing the request');
        }
    });
    
    
    
     // added by Jyothi, this service is created to trigger cpi interface
//date: 27-08-2024

// this.on('cpi_srv', async (req) => {
//     try {
//         ////// Call CPI API 
//         //Declarations 
//         const CPI_URL_Data = await SELECT.one(Environment).where({ APPID: 'CPI_COM' }).columns('URL', 'tokenUrl', 'clientId', 'clientSecret');
//         log.cfLoggingMessages('debug', 'CPI_URL_Data' + JSON.stringify(CPI_URL_Data));
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
//         const response1 = await axios({
//             method: "GET",
//             url: CPI_url,
//             headers: {
//                 "Authorization": bearerToken,
//                 'accept': "application/json",
//                 'content-type': "application/json",
//                 'x-requested-with': 'XMLHttpRequest',
//             },
//             // data: inv_post
//         }).then(response1 => {
//            // log.cfLoggingMessages('debug', 'IBD response1_23 -> ' + JSON.stringify(response1.data));
//         }).catch(error => {
//             //log.cfLoggingMessages('error', 'IBD error -> ' + JSON.stringify(error.response.data));
//         });
//     }

//     catch (error) {
//         log.cfLoggingMessages('error', 'componentsrv ' + error.message);
//     }
// });

// added by Jyothi, this service is created to trigger cpi interface
//date: 06-09-2024

this.on('cpi_srv', async (req) => {
    try {
        // Extract the input parameters from the request
        const {
            ship_plan_received_from,
            ship_plan_received_to,
            itemtype,
            ship_plan_source,
            shipdate_from,
            shipdate_to,
            supplyType,
            material,
            salesorder,
            salesorderline,
            purchasing_org,
            purchasing_group,
            plant,
            vendor_i_e_indicator,
            vendor,
            sub_con_vendor
        } = req.data;

        // Call CPI API
        const CPI_URL_Data = await SELECT.one(Environment).where({ APPID: 'CPI_COM' }).columns('URL', 'tokenUrl', 'clientId', 'clientSecret');
        log.cfLoggingMessages('debug', 'CPI_URL_Data: ' + JSON.stringify(CPI_URL_Data));

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

        // Generate bearer token
        const resToken = await axios.get(CPI_tokenUrl, {
            headers: {
                "Authorization": basicAuth,
            },
            params: {
                "grant_type": "client_credentials",
            },
        });
        let bearerToken = 'Bearer ' + resToken.data.access_token;

        // Prepare the payload to send to CPI
        const payload = {
            ship_plan_received_from : req.data.ship_plan_received_from,
            ship_plan_received_to : req.data.ship_plan_received_to,
            itemtype : req.data.itemtype,
            ship_plan_source : req.data.ship_plan_source,
            shipdate_from : req.data.shipdate_from,
            shipdate_to : req.data.shipdate_to,
            supplyType : req.data.supplyType,
            material : req.data.material,
            salesorder : req.data.salesorder,
            salesorderline : req.data.salesorderline,
            purchasing_org : req.data.purchasing_org,
            purchasing_group : req.data.purchasing_group,
            plant : req.data.plant,
            vendor_i_e_indicator : req.data.vendor_i_e_indicator,
            vendor : req.data.vendor,
            sub_con_vendor : req.data.sub_con_vendor
        };

        // Send the payload to CPI via POST
        const response = await axios({
            method: "GET", // Change to POST or PUT based on CPI configuration
            url: CPI_url,
            headers: {
                "Authorization": bearerToken,
                'accept': "application/json",
                'content-type': "application/json",
                'x-requested-with': 'XMLHttpRequest',
            },
            data: payload // Send the payload
        });

        log.cfLoggingMessages('debug', 'CPI Response: ' + JSON.stringify(response.data));

        // Return a success message as a String
        return "CPI interface triggered successfully";

    } catch (error) {
        log.cfLoggingMessages('error', 'CPI Service Error: ' + error.message);
        // Return an error message as a String
        return "Error in triggering CPI: " + error.message;
    }
});





// Added by Jyothi, this service is created to call the procedure
//date: 27-08-2024
this.on('po_create_final', async (req) => {
    try {
        // Extract the input parameters from the request
        const {
            ship_plan_received_from,
            ship_plan_received_to,
            itemtype,
            ship_plan_source,
            shipdate_from,
            shipdate_to,
            supplyType,
            material,
            salesorder,
            salesorderline,
            purchasing_org,
            purchasing_group,
            plant,
            vendor_i_e_indicator,
            vendor,
            sub_con_vendor                
        } = req.data;

        
     let dbQuery = "CALL PO_CREATE_FINAL(p_ship_plan_received_from => " + ship_plan_received_from + " ,p_ship_plan_received_to => " +  ship_plan_received_to + " ,p_itemtype => " + "'" + itemtype + "'" + " ,p_ship_plan_source => " + "'" + ship_plan_source + "'" + ",p_shipdate_from => " +  shipdate_from + ",p_shipdate_to => " +  shipdate_to  + ",p_supplyType => " + "'" + supplyType + "'" + ",p_material => " + "'" + material + "'" + ",p_salesorder => " + "'" + salesorder + "'" + ",p_salesorderline => " + "'" + salesorderline + "'" + ",p_purchasing_org => " + "'" + purchasing_org + "'" + ",p_purchasing_group => " + "'" + purchasing_group + "'" + ",p_plant => " + "'" + plant + "'" + ",p_vendor_i_e_indicator => " + "'" + vendor_i_e_indicator + "'" + ",p_vendor => " + "'" + vendor + "'" + ",p_sub_con_vendor => " + "'" + sub_con_vendor + "'" + ", OUT_DATA => ?)";

        log.cfLoggingMessages('info', 'Executing dbQuery:', dbQuery);
        
        // Execute the procedure
        const result = await cds.run(dbQuery, {});
        // const result = await cds.run({
        //     query: dbQuery,
        //     params: [ 
        //         // Parameters for OUT_DATA if needed
        //     ]
        // });

        log.cfLoggingMessages('info','PO_CREATE_FINAL SP result:', JSON.stringify(result));

        // Extract the data from the result
        const data = result && result.OUT_DATA ? result.OUT_DATA : [];
        log.cfLoggingMessages('info','Extracted data:', JSON.stringify(data));

        // Return the extracted data
        return { status: "200", response: data };
    } catch (error) {
        // Log the error and return a 500 status with the error message
        log.cfLoggingMessages('Error in pocreate_final:', error.message);
        return { status: "500", response: error.message };
    }
});



// added by Jyothi, to get the status from cpi, we created this service
//date: 27-08-2024
// this.on('getstatus', async(req) => {

//     const { counter, matnr, salesord, salesordline } = req.data;
//     var data = await SELECT.from`BTP.Panasonic.zjda_ship_plan`.where`counter=${counter} and matnr=${matnr} and salesord=${salesord} and salesordline=${salesordline}`.columns('counter', 'matnr', 'salesord', 'salesordline');
//     return data;
// });
// added by Jyothi, to get the status from cpi, we created this service
//date: 29-08-2024
this.on('status', async(req) => {

    const { counter, matnr, salesord, salesordline, status } = req.data;
    const update = await UPDATE`BTP.Panasonic.zjda_ship_plan`.set`status=${status}`.where`counter=${counter} and matnr=${matnr} and salesord=${salesord} and salesordline=${salesordline}`;
    // console.log(update);
});

});