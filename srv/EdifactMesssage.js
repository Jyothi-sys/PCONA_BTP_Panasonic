const cds = require('@sap/cds');
const log = require('./util/logger')

module.exports = cds.service.impl(async function () {

    this.before('CREATE', 'Edifact_Header', async (req) => {

        log.cfLoggingMessages('debug', 'Edifact_Header.before -> ' + req);
        let dbQuery = "CALL GET_EDIFACTHEADER_ID(NEXT_ID => ?)";
        // log.cfLoggingMessages('info','dbQuery -> ' + dbQuery);
        const result = await cds.run(dbQuery, {});
        log.cfLoggingMessages('debug', 'SP NEXT ID result' + JSON.stringify(result));
        req.data.ID = result.NEXT_ID[0].ID;
        log.cfLoggingMessages('debug', 'PO_List.before -> ' + req);
        //Bhushan 14-05-2024 Added SEQUENCE_NO for each PO in PO_List Starts
        let po_list_data = req.data.PO_List;
        for (let i = 0; i < po_list_data.length; i++) {
            let dbQuery1 = "CALL GET_SEQUENCE_NO(NEXT_ID => ?)";
            const result1 = await cds.run(dbQuery1, {});
            log.cfLoggingMessages('debug', 'PO_List SP NEXT ID result' + JSON.stringify(result1));
            req.data.PO_List[i].SEQUENCE_NO = result1.NEXT_ID[0].ID;
        }
        //Bhushan 14-05-2024 Added SEQUENCE_NO for each PO in PO_List ends
    })

})