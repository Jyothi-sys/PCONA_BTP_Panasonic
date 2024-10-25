
// eslint-disable-next-line no-undef
module.exports = { autoID: async function (entity, ID, tx) {

    let selectQuery = "SELECT from BTP.Panasonic ." + entity + "{max(" + ID + ")max}"
    let query = cds.parse.cql(selectQuery);
    let result = await tx.run(query);

    return result[0].max + 1;
}
}
