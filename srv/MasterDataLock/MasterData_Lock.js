const cds = require('@sap/cds');
const log = require('../util/logger')


module.exports = cds.service.impl(async function () {
    // Kowsalyaa for Master Data Maintanaence Lock  
    this.on('UpdateMasterDataLock', async (req) => {
        try {
            const { Table_Name, Lock_Status, UserID } = req.data;
            const update = await UPDATE`BTP_PANASONIC.Master_Lock`
                .set`Lock_Status=${Lock_Status}`
                .set`UserID=${UserID}`
                .where`Table_Name=${Table_Name}`;
            log.cfLoggingMessages('debug', 'update in UpdateMasterDataLock' + update);
        } catch (err) {
            log.cfLoggingMessages('error', 'Error in UpdateMasterDataLock' + err)
            req.error({
                code: '500',
                message: `Internal Server error ${err}`,
                target: 'UpdateMasterDataLock',
                status: 500
            })
        }
    })
})
