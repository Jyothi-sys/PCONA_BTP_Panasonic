const cds = require('@sap/cds');
const axios = require("axios");
const log = require('./util/logger')



module.exports = cds.service.impl(async function () {

    // this.on('Testing_Method', async req => {
    //     try {
    //         log.cfLoggingMessages('debug', 'Testing_Method' + req)
    //         var ojson = '{"Interchange":{"S_UNB":{"C_S001":{"D_0001":"UNOA","D_0002":"1"},"C_S002":{"D_0004":"GIS331"},"C_S003":{"D_0010":"GIS332"},"C_S004":{"D_0017":"221110","D_0019":"0614"},"D_0020":"20221110061431"},"M_ORDRSP":{"S_UNH":{"D_0062":"1","C_S009":{"D_0065":"ORDRSP","D_0052":"1","D_0054":"921","D_0051":"UN"}},"S_BGM":{"C_C002":{"D_1001":"230","D_3055":"6"},"D_1004":"4500000361","D_1225":"9"},"S_DTM":[{"C_C507":{"D_2005":"137","D_2380":"20221110","D_2379":"102"}},{"C_C507":{"D_2005":"97","D_2380":"202211100613","D_2379":"203"}}],"G_SG1":[{"S_RFF":{"C_C506":{"D_1153":"SYS","D_1154":"P"}}},{"S_RFF":{"C_C506":{"D_1153":"ZA1","D_1154":"1"}}},{"S_RFF":{"C_C506":{"D_1153":"ADJ","D_1154":"1"}}},{"S_RFF":{"C_C506":{"D_1153":"ADK","D_1154":"1"}}},{"S_RFF":{"C_C506":{"D_1153":"TMH","D_1154":"00021220"}}},{"S_RFF":{"C_C506":{"D_1153":"SS","D_1154":"RR-UR3N"}}},{"S_RFF":{"C_C506":{"D_1153":"VN","D_1154":"236908501"}}},{"S_RFF":{"C_C506":{"D_1153":"FR0","D_1154":"139010 O48"}}},{"S_RFF":{"C_C506":{"D_1153":"FR1","D_1154":"171019"}}},{"S_RFF":{"C_C506":{"D_1153":"FR2","D_1154":"00029052"}}},{"S_RFF":{"C_C506":{"D_1153":"FR5","D_1154":"C"}}},{"S_RFF":{"C_C506":{"D_1153":"FR7","D_1154":"1"}}},{"S_RFF":{"C_C506":{"D_1153":"ZA2","D_1154":"1"}}},{"S_RFF":{"C_C506":{"D_1153":"ZA5","D_1154":"1"}}}],"G_SG2":[{"S_NAD":{"D_3035":"BY","C_C082":{"D_3039":"00029052","D_3055":"MEI"}},"G_SG5":{"S_CTA":{"D_3139":"PIC","C_C056":{"D_3412":"SAPTEAM"}}}},{"S_NAD":{"D_3035":"SE","C_C082":{"D_3039":"00020000","D_3055":"MEI"}},"G_SG5":{"S_CTA":{"D_3139":"PIC","C_C056":{"D_3412":"PCSC"}}}},{"S_NAD":{"D_3035":"CN","C_C082":{"D_3039":"00029052","D_3055":"MEI"}}},{"S_NAD":{"D_3035":"PR","C_C082":{"D_3039":"00029052","D_3055":"MEI"}}},{"S_NAD":{"D_3035":"PC","C_C082":{"D_3039":"00029052","D_3055":"MEI"}}}],"G_SG7":[{"S_CUX":{"C_C504":{"D_6347":"5","D_6345":"USD","D_6343":"4"}}},{"S_CUX":{"C_C504":{"D_6347":"5","D_6343":"17"},"C_C504_2":{"D_6347":"1","D_6345":"USD","D_6343":"4"}}}],"G_SG11":[{"S_TOD":{"D_4055":"1","D_4215":"0","C_C100":{"D_4053":"FOB","D_3055":"MEI"}}},{"S_TOD":{"D_4055":"6","C_C100":{"D_4053":"FOB","D_3055":"MEI"}}}],"G_SG18":{"S_ALC":{"D_5463":"E"},"G_SG21":{"S_MOA":{"C_C516":{"D_5025":"8","D_6345":"USD"}}}},"G_SG25":{"S_LIN":{"D_1082":"10","D_1229":"1","C_C212":{"D_7140":"FZ-BAZ2016","D_7143":"MN","D_3055":"MEI"}},"S_PIA":{"D_4347":"5","C_C212_4":{"D_7140":"FZ-BAZ2016","D_7143":"UA","D_3055":"92"},"C_C212_5":{"D_7140":"FZ-BAZ2016","D_7143":"IND","D_3055":"90"}},"G_SG27":{"S_PRI":{"C_C509":{"D_5125":"NEW","D_5118":"140","D_5375":"QT","D_5387":"INV","D_5284":"1","D_6411":"PC"}}},"G_SG28":[{"S_RFF":{"C_C506":{"D_1153":"ZE1","D_1154":"1"}}},{"S_RFF":{"C_C506":{"D_1153":"F01","D_1156":"0010"}}},{"S_RFF":{"C_C506":{"D_1153":"F02","D_1156":"0010"}}},{"S_RFF":{"C_C506":{"D_1153":"EPD","D_1154":"0"}}},{"S_RFF":{"C_C506":{"D_1153":"QPD","D_1154":"0"}}},{"S_RFF":{"C_C506":{"D_1153":"ZE2","D_1154":"1"}}},{"S_RFF":{"C_C506":{"D_1153":"F04","D_1156":"0010"}}}],"G_SG29":{"S_PAC":{"C_C531":{"D_7075":"2"},"C_C202":{"D_7065":"CB","D_3055":"MEI"}}},"G_SG34":[{"S_NAD":{"D_3035":"SU","C_C082":{"D_3039":"00021220","D_3055":"MEI"}}},{"S_NAD":{"D_3035":"DP","C_C082":{"D_3039":"00029052","D_3055":"MEI"}}},{"S_NAD":{"D_3035":"DP2","C_C082":{"D_3039":"00029052","D_3055":"MEI"}}}],"G_SG44":{"S_TDT":{"D_8051":"12","C_C220":{"D_8066":"AIR.F"}},"G_SG45":{"S_LOC":{"D_3227":"8","C_C519":{"D_3223":"LWK","D_3055":"MEI"}}}},"G_SG48":{"S_SCC":{"D_4017":"1"},"S_RFF":{"C_C506":{"D_1153":"OQD","D_1154":"0"}},"G_SG49":{"S_QTY":{"C_C186":{"D_6063":"21","D_6060":"11","D_6411":"PC"}},"S_DTM":[{"C_C507":{"D_2005":"133","D_2380":"20221121","D_2379":"102"}},{"C_C507":{"D_2005":"65","D_2380":"20221114","D_2379":"102"}},{"C_C507":{"D_2005":"65P","D_2380":"20221121","D_2379":"102"}}]}}},"S_UNT":{"D_0074":"54","D_0062":"1"}}}}';
    //         var obj = JSON.parse(ojson);
    //         const myJSON = JSON.stringify(obj);
    //         var Reference = '';
    //         // log.cfLoggingMessages('info', myJSON);
    //         // log.cfLoggingMessages('info', 'PO length  : ' + Object.keys(obj.Interchange.M_ORDRSP).length);
    //         // log.cfLoggingMessages('info', 'Purchase Oreder No : ' + obj.Interchange.M_ORDRSP.S_BGM.D_1004);

    //         // log.cfLoggingMessages('info', 'Item length  : ' + Object.keys(obj.Interchange.M_ORDRSP.G_SG25).length);

    //         var pocofirmation = {
    //             "ID": "1",
    //             ScheduleLine: []
    //         };



    //         if (Array.isArray(obj.Interchange.M_ORDRSP.G_SG1)) {
    //             for (let i = 0; i < Object.keys(obj.Interchange.M_ORDRSP.G_SG1).length; i++) {
    //                 const D_1153 = obj.Interchange.M_ORDRSP.G_SG1[i].S_RFF.C_C506.D_1153;
    //                 const D_1154 = obj.Interchange.M_ORDRSP.G_SG1[i].S_RFF.C_C506.D_1154;
    //                 if (D_1153 == 'SS') {
    //                     Reference = D_1154;
    //                 }
    //             }


    //             if (Array.isArray(obj.Interchange.M_ORDRSP.G_SG25)) {

    //                 for (let i = 0; i < Object.keys(obj.Interchange.M_ORDRSP.G_SG25).length; i++) {
    //                     const PONO = obj.Interchange.M_ORDRSP.S_BGM.D_1004;
    //                     // log.cfLoggingMessages('info', 'Item No : ' + obj.Interchange.M_ORDRSP.G_SG25[i].S_LIN.D_1082);
    //                     const PurchaseOrderItem = obj.Interchange.M_ORDRSP.G_SG25[i].S_LIN.D_1082;
    //                     // log.cfLoggingMessages('info', 'G_SG49/S_DTM length  :' + Object.keys(obj.Interchange.M_ORDRSP.G_SG25[i].G_SG48.G_SG49[1].S_DTM).length);
    //                     for (let j = 0; j < Object.keys(obj.Interchange.M_ORDRSP.G_SG25[i].G_SG48.G_SG49[1].S_DTM).length; j++) {
    //                         // log.cfLoggingMessages('info', 'D_2005 : ' + obj.Interchange.M_ORDRSP.G_SG25[i].G_SG48.G_SG49[1].S_DTM[j].C_C507.D_2005);
    //                         if (obj.Interchange.M_ORDRSP.G_SG25[i].G_SG48.G_SG49[1].S_DTM[j].C_C507.D_2005 == '133') {
    //                             // log.cfLoggingMessages('info', 'ScheduleLineDeliveryDate : ' + obj.Interchange.M_ORDRSP.G_SG25[i].G_SG48.G_SG49[1].S_DTM[j].C_C507.D_2380);
    //                             const ScheduleLineDeliveryDate = obj.Interchange.M_ORDRSP.G_SG25[i].G_SG48.G_SG49[1].S_DTM[j].C_C507.D_2380;

    //                             var year = ScheduleLineDeliveryDate.substring(0, 4);
    //                             var month = ScheduleLineDeliveryDate.substring(4, 6);
    //                             var day = ScheduleLineDeliveryDate.substring(6, 8);
    //                             var date = year + '-' + month + '-' + day + 'T00:00:00';
    //                             const ScheduleLineOrderQuantity = obj.Interchange.M_ORDRSP.G_SG25[i].G_SG48.G_SG49[1].S_QTY.C_C186.D_6060;


    //                             pocofirmation.ScheduleLine.push({

    //                                 "PurchaseOrder": PONO,
    //                                 "PurchaseOrderItem": PurchaseOrderItem,

    //                                 "DeliveryDate": date,
    //                                 "Quantity": ScheduleLineOrderQuantity,

    //                                 "ConfirmCat": "AB",
    //                                 "Reference": Reference
    //                             });

    //                             // log.cfLoggingMessages('info', 'ScheduleLineOrderQuantity : ' + obj.Interchange.M_ORDRSP.G_SG25[i].G_SG48.G_SG49[1].S_QTY.C_C186.D_6060);


    //                         }



    //                     }

    //                 }

    //             }
    //             else {

    //                 const PONO = obj.Interchange.M_ORDRSP.S_BGM.D_1004;
    //                 log.cfLoggingMessages('debug', 'Item No : ' + obj.Interchange.M_ORDRSP.G_SG25.S_LIN.D_1082);
    //                 const PurchaseOrderItem = obj.Interchange.M_ORDRSP.G_SG25.S_LIN.D_1082;
    //                 // log.cfLoggingMessages('info', 'G_SG49/S_DTM length  :' + Object.keys(obj.Interchange.M_ORDRSP.G_SG25.G_SG48.G_SG49.S_DTM).length);
    //                 for (let j = 0; j < Object.keys(obj.Interchange.M_ORDRSP.G_SG25.G_SG48.G_SG49.S_DTM).length; j++) {
    //                     // log.cfLoggingMessages('info', 'D_2005 : ' + obj.Interchange.M_ORDRSP.G_SG25.G_SG48.G_SG49.S_DTM[j].C_C507.D_2005);
    //                     if (obj.Interchange.M_ORDRSP.G_SG25.G_SG48.G_SG49.S_DTM[j].C_C507.D_2005 == '133') {
    //                         // log.cfLoggingMessages('info', 'ScheduleLineDeliveryDate : ' + obj.Interchange.M_ORDRSP.G_SG25.G_SG48.G_SG49.S_DTM[j].C_C507.D_2380);
    //                         const ScheduleLineDeliveryDate = obj.Interchange.M_ORDRSP.G_SG25.G_SG48.G_SG49.S_DTM[j].C_C507.D_2380;

    //                         var year = ScheduleLineDeliveryDate.substring(0, 4);
    //                         var month = ScheduleLineDeliveryDate.substring(4, 6);
    //                         var day = ScheduleLineDeliveryDate.substring(6, 8);
    //                         var date = year + '-' + month + '-' + day + 'T00:00:00';
    //                         const ScheduleLineOrderQuantity = obj.Interchange.M_ORDRSP.G_SG25.G_SG48.G_SG49.S_QTY.C_C186.D_6060;


    //                         pocofirmation.ScheduleLine.push({
    //                             "PurchaseOrder": PONO,
    //                             "PurchaseOrderItem": PurchaseOrderItem,
    //                             "DeliveryDate": date,
    //                             "Quantity": ScheduleLineOrderQuantity,
    //                             "ConfirmCat": "AB",
    //                             "Reference": Reference
    //                         });

    //                         // log.cfLoggingMessages('info', 'ScheduleLineOrderQuantity : ' + obj.Interchange.M_ORDRSP.G_SG25.G_SG48.G_SG49.S_QTY.C_C186.D_6060);

    //                     }

    //                 }

    //             }



    //             return JSON.stringify(pocofirmation);
    //         }
    //     }
    //     catch (error) {
    //         log.cfLoggingMessages('error', 'Error in Testing_Method' + error)
    //         req.error({
    //             code: '400',
    //             message: error.message,
    //             target: 'some_field',
    //             status: 418
    //         })
    //     }

    // })


    // this.on('Testing_MethodNew', async req => {
    //     try {
    //         log.cfLoggingMessages('debug', 'Testing_MethodNew.on' + req)
    //         const tx = cds.tx(req);
    //         var ojson = '{"Interchange":{"S_UNB":{"C_S001":{"D_0001":"UNOA","D_0002":"1"},"C_S002":{"D_0004":"GIS331"},"C_S003":{"D_0010":"GIS332"},"C_S004":{"D_0017":"221110","D_0019":"0614"},"D_0020":"20221110061431"},"M_ORDRSP":{"S_UNH":{"D_0062":"1","C_S009":{"D_0065":"ORDRSP","D_0052":"1","D_0054":"921","D_0051":"UN"}},"S_BGM":{"C_C002":{"D_1001":"230","D_3055":"6"},"D_1004":"4500000361","D_1225":"9"},"S_DTM":[{"C_C507":{"D_2005":"137","D_2380":"20221110","D_2379":"102"}},{"C_C507":{"D_2005":"97","D_2380":"202211100613","D_2379":"203"}}],"G_SG1":[{"S_RFF":{"C_C506":{"D_1153":"SYS","D_1154":"P"}}},{"S_RFF":{"C_C506":{"D_1153":"ZA1","D_1154":"1"}}},{"S_RFF":{"C_C506":{"D_1153":"ADJ","D_1154":"1"}}},{"S_RFF":{"C_C506":{"D_1153":"ADK","D_1154":"1"}}},{"S_RFF":{"C_C506":{"D_1153":"TMH","D_1154":"00021220"}}},{"S_RFF":{"C_C506":{"D_1153":"SS","D_1154":"RR-UR3N"}}},{"S_RFF":{"C_C506":{"D_1153":"VN","D_1154":"236908501"}}},{"S_RFF":{"C_C506":{"D_1153":"FR0","D_1154":"139010 O48"}}},{"S_RFF":{"C_C506":{"D_1153":"FR1","D_1154":"171019"}}},{"S_RFF":{"C_C506":{"D_1153":"FR2","D_1154":"00029052"}}},{"S_RFF":{"C_C506":{"D_1153":"FR5","D_1154":"C"}}},{"S_RFF":{"C_C506":{"D_1153":"FR7","D_1154":"1"}}},{"S_RFF":{"C_C506":{"D_1153":"ZA2","D_1154":"1"}}},{"S_RFF":{"C_C506":{"D_1153":"ZA5","D_1154":"1"}}}],"G_SG2":[{"S_NAD":{"D_3035":"BY","C_C082":{"D_3039":"00029052","D_3055":"MEI"}},"G_SG5":{"S_CTA":{"D_3139":"PIC","C_C056":{"D_3412":"SAPTEAM"}}}},{"S_NAD":{"D_3035":"SE","C_C082":{"D_3039":"00020000","D_3055":"MEI"}},"G_SG5":{"S_CTA":{"D_3139":"PIC","C_C056":{"D_3412":"PCSC"}}}},{"S_NAD":{"D_3035":"CN","C_C082":{"D_3039":"00029052","D_3055":"MEI"}}},{"S_NAD":{"D_3035":"PR","C_C082":{"D_3039":"00029052","D_3055":"MEI"}}},{"S_NAD":{"D_3035":"PC","C_C082":{"D_3039":"00029052","D_3055":"MEI"}}}],"G_SG7":[{"S_CUX":{"C_C504":{"D_6347":"5","D_6345":"USD","D_6343":"4"}}},{"S_CUX":{"C_C504":{"D_6347":"5","D_6343":"17"},"C_C504_2":{"D_6347":"1","D_6345":"USD","D_6343":"4"}}}],"G_SG11":[{"S_TOD":{"D_4055":"1","D_4215":"0","C_C100":{"D_4053":"FOB","D_3055":"MEI"}}},{"S_TOD":{"D_4055":"6","C_C100":{"D_4053":"FOB","D_3055":"MEI"}}}],"G_SG18":{"S_ALC":{"D_5463":"E"},"G_SG21":{"S_MOA":{"C_C516":{"D_5025":"8","D_6345":"USD"}}}},"G_SG25":{"S_LIN":{"D_1082":"10","D_1229":"1","C_C212":{"D_7140":"FZ-BAZ2016","D_7143":"MN","D_3055":"MEI"}},"S_PIA":{"D_4347":"5","C_C212_4":{"D_7140":"FZ-BAZ2016","D_7143":"UA","D_3055":"92"},"C_C212_5":{"D_7140":"FZ-BAZ2016","D_7143":"IND","D_3055":"90"}},"G_SG27":{"S_PRI":{"C_C509":{"D_5125":"NEW","D_5118":"140","D_5375":"QT","D_5387":"INV","D_5284":"1","D_6411":"PC"}}},"G_SG28":[{"S_RFF":{"C_C506":{"D_1153":"ZE1","D_1154":"1"}}},{"S_RFF":{"C_C506":{"D_1153":"F01","D_1156":"0010"}}},{"S_RFF":{"C_C506":{"D_1153":"F02","D_1156":"0010"}}},{"S_RFF":{"C_C506":{"D_1153":"EPD","D_1154":"0"}}},{"S_RFF":{"C_C506":{"D_1153":"QPD","D_1154":"0"}}},{"S_RFF":{"C_C506":{"D_1153":"ZE2","D_1154":"1"}}},{"S_RFF":{"C_C506":{"D_1153":"F04","D_1156":"0010"}}}],"G_SG29":{"S_PAC":{"C_C531":{"D_7075":"2"},"C_C202":{"D_7065":"CB","D_3055":"MEI"}}},"G_SG34":[{"S_NAD":{"D_3035":"SU","C_C082":{"D_3039":"00021220","D_3055":"MEI"}}},{"S_NAD":{"D_3035":"DP","C_C082":{"D_3039":"00029052","D_3055":"MEI"}}},{"S_NAD":{"D_3035":"DP2","C_C082":{"D_3039":"00029052","D_3055":"MEI"}}}],"G_SG44":{"S_TDT":{"D_8051":"12","C_C220":{"D_8066":"AIR.F"}},"G_SG45":{"S_LOC":{"D_3227":"8","C_C519":{"D_3223":"LWK","D_3055":"MEI"}}}},"G_SG48":{"S_SCC":{"D_4017":"1"},"S_RFF":{"C_C506":{"D_1153":"OQD","D_1154":"0"}},"G_SG49":{"S_QTY":{"C_C186":{"D_6063":"21","D_6060":"11","D_6411":"PC"}},"S_DTM":[{"C_C507":{"D_2005":"133","D_2380":"20221121","D_2379":"102"}},{"C_C507":{"D_2005":"65","D_2380":"20221114","D_2379":"102"}},{"C_C507":{"D_2005":"65P","D_2380":"20221121","D_2379":"102"}}]}}},"S_UNT":{"D_0074":"54","D_0062":"1"}}}}';
    //         var obj = JSON.parse(ojson);
    //         const myJSON = JSON.stringify(obj);
    //         var Reference = '';
    //         // log.cfLoggingMessages('info', myJSON);
    //         // log.cfLoggingMessages('info', 'PO length  : ' + Object.keys(obj.Interchange.M_ORDRSP).length);
    //         // log.cfLoggingMessages('info', 'Purchase Oreder No : ' + obj.Interchange.M_ORDRSP.S_BGM.D_1004);

    //         // log.cfLoggingMessages('info', 'Item length  : ' + Object.keys(obj.Interchange.M_ORDRSP.G_SG25).length);

    //         var pocofirmation = {
    //             "ID": "1",
    //             ScheduleLine: []
    //         };
    //         var confirmationData = {};

    //         var ConfirmationDate =  obj.Interchange.S_UNB.C_S004.D_0017;
    //         log.cfLoggingMessages('debug','confirmation date' + JSON.stringify(ConfirmationDate));

    //         if (Array.isArray(obj.Interchange.M_ORDRSP.G_SG1)) {
    //             for (let i = 0; i < Object.keys(obj.Interchange.M_ORDRSP.G_SG1).length; i++) {
    //                 const D_1153 = obj.Interchange.M_ORDRSP.G_SG1[i].S_RFF.C_C506.D_1153;
    //                 const D_1154 = obj.Interchange.M_ORDRSP.G_SG1[i].S_RFF.C_C506.D_1154;
    //                 if (D_1153 == 'SS') {
    //                     Reference = D_1154;
    //                 }
    //             }


    //             if (Array.isArray(obj.Interchange.M_ORDRSP.G_SG25)) {

    //                 for (let i = 0; i < Object.keys(obj.Interchange.M_ORDRSP.G_SG25).length; i++) {
    //                     const PONO = obj.Interchange.M_ORDRSP.S_BGM.D_1004;
    //                     // log.cfLoggingMessages('info', 'Item No : ' + obj.Interchange.M_ORDRSP.G_SG25[i].S_LIN.D_1082);
    //                     const PurchaseOrderItem = obj.Interchange.M_ORDRSP.G_SG25[i].S_LIN.D_1082;
    //                     // log.cfLoggingMessages('info', 'G_SG49/S_DTM length  :' + Object.keys(obj.Interchange.M_ORDRSP.G_SG25[i].G_SG48.G_SG49[1].S_DTM).length);
    //                     for (let j = 0; j < Object.keys(obj.Interchange.M_ORDRSP.G_SG25[i].G_SG48.G_SG49[1].S_DTM).length; j++) {
    //                         // log.cfLoggingMessages('info', 'D_2005 : ' + obj.Interchange.M_ORDRSP.G_SG25[i].G_SG48.G_SG49[1].S_DTM[j].C_C507.D_2005);
    //                         if (obj.Interchange.M_ORDRSP.G_SG25[i].G_SG48.G_SG49[1].S_DTM[j].C_C507.D_2005 == '133') {
    //                             // log.cfLoggingMessages('info', 'ScheduleLineDeliveryDate : ' + obj.Interchange.M_ORDRSP.G_SG25[i].G_SG48.G_SG49[1].S_DTM[j].C_C507.D_2380);
    //                             const ScheduleLineDeliveryDate = obj.Interchange.M_ORDRSP.G_SG25[i].G_SG48.G_SG49[1].S_DTM[j].C_C507.D_2380;

    //                             var year = ScheduleLineDeliveryDate.substring(0, 4);
    //                             var month = ScheduleLineDeliveryDate.substring(4, 6);
    //                             var day = ScheduleLineDeliveryDate.substring(6, 8);
    //                             var date = year + '-' + month + '-' + day + 'T00:00:00';
    //                             const ScheduleLineOrderQuantity = obj.Interchange.M_ORDRSP.G_SG25[i].G_SG48.G_SG49[1].S_QTY.C_C186.D_6060;


    //                             const checkSequence = await tx.run(SELECT.one(POConfirmationData).where({ PurchaseOrder: PONO, PurchaseOrderItem: PurchaseOrderItem }).columns('SequenceNo'));
    //                             // log.cfLoggingMessages('info', '1' + JSON.stringify(checkSequence));
    //                             var SequenceNo = 1;
    //                             if (checkSequence != null) {
    //                                 // log.cfLoggingMessages('info', '2' + JSON.stringify(checkSequence));
    //                                 SequenceNo = int.parse(checkSequence.SequenceNo) + 1;
    //                             }
    //                             // log.cfLoggingMessages('info', '3' + JSON.stringify(checkSequence));

    //                             confirmationData.push({
    //                                 "PurchaseOrder": PONO,
    //                                 "PurchaseOrderItem": PurchaseOrderItem,
    //                                 "SequenceNo": SequenceNo,
    //                                 "DeliveryDateTime": date,
    //                                 "Quanity": ScheduleLineOrderQuantity,
    //                                 "Material": null,
    //                                 "Party_Id_Identification": null,
    //                                 "FactoryRefNo": "A1542",
    //                                 "Substitute": null,
    //                                 "NetPriceAmount": "12",
    //                                 "ShipmentMethod": null,
    //                                 "JapanPONumber": null,
    //                                 "SupplierCode": null,
    //                                 "ReceiverCode": null,
    //                                 "SalesTradeTermCode": null,
    //                                 "ModelID": null,
    //                                 "TransactionID": null,
    //                                 "SettlementTradeTermCode": null,
    //                                 "PurchasingOrganization": null,
    //                                 "CompanyCode": null,
    //                                 "ResponsibleEmployee": null,
    //                                 "PartnerCode": null,
    //                                 "ConsigneeCode": null,
    //                                 "PayerCode": null,
    //                                 "SellerCode": null,
    //                                 "VendorOrder": null,
    //                                 "PackageTypeCode": null,
    //                                 "SalesUnitPrice": null,
    //                                 "Vendor": null,
    //                                 "WarehouseCode": null,
    //                                 "PartnerWarehouse": null,
    //                                 "ConfirmationDate": null
    //                             });
    //                             // log.cfLoggingMessages('info', JSON.stringify(confirmationData));
    //                             tx.run(INSERT.into(POConfirmationData).entries(confirmationData));

    //                             pocofirmation.ScheduleLine.push({
    //                                 "PurchaseOrder": PONO,
    //                                 "PurchaseOrderItem": PurchaseOrderItem,
    //                                 "DeliveryDate": date,
    //                                 "Quantity": ScheduleLineOrderQuantity,
    //                                 "ConfirmCat": "AB",
    //                                 "Reference": Reference
    //                             });

    //                             // log.cfLoggingMessages('info', 'ScheduleLineOrderQuantity : ' + obj.Interchange.M_ORDRSP.G_SG25[i].G_SG48.G_SG49[1].S_QTY.C_C186.D_6060);


    //                         }



    //                     }

    //                 }

    //             }
    //             else {

    //                 const PONO = obj.Interchange.M_ORDRSP.S_BGM.D_1004;
    //                 // log.cfLoggingMessages('info', 'Item No : ' + obj.Interchange.M_ORDRSP.G_SG25.S_LIN.D_1082);
    //                 const PurchaseOrderItem = obj.Interchange.M_ORDRSP.G_SG25.S_LIN.D_1082;
    //                 // log.cfLoggingMessages('info', 'G_SG49/S_DTM length  :' + Object.keys(obj.Interchange.M_ORDRSP.G_SG25.G_SG48.G_SG49.S_DTM).length);
    //                 for (let j = 0; j < Object.keys(obj.Interchange.M_ORDRSP.G_SG25.G_SG48.G_SG49.S_DTM).length; j++) {
    //                     // log.cfLoggingMessages('info', 'D_2005 : ' + obj.Interchange.M_ORDRSP.G_SG25.G_SG48.G_SG49.S_DTM[j].C_C507.D_2005);
    //                     if (obj.Interchange.M_ORDRSP.G_SG25.G_SG48.G_SG49.S_DTM[j].C_C507.D_2005 == '133') {
    //                         // log.cfLoggingMessages('info', 'ScheduleLineDeliveryDate : ' + obj.Interchange.M_ORDRSP.G_SG25.G_SG48.G_SG49.S_DTM[j].C_C507.D_2380);
    //                         const ScheduleLineDeliveryDate = obj.Interchange.M_ORDRSP.G_SG25.G_SG48.G_SG49.S_DTM[j].C_C507.D_2380;

    //                         var year = ScheduleLineDeliveryDate.substring(0, 4);
    //                         var month = ScheduleLineDeliveryDate.substring(4, 6);
    //                         var day = ScheduleLineDeliveryDate.substring(6, 8);
    //                         var date = year + '-' + month + '-' + day + 'T00:00:00';
    //                         const ScheduleLineOrderQuantity = obj.Interchange.M_ORDRSP.G_SG25.G_SG48.G_SG49.S_QTY.C_C186.D_6060;

    //                         const checkSequence = await tx.run(SELECT.one(POConfirmationData).where({ PurchaseOrder: PONO, PurchaseOrderItem: PurchaseOrderItem }).columns('SequenceNo'));
    //                         // log.cfLoggingMessages('info', '1' + JSON.stringify(checkSequence));
    //                         var SequenceNo = 1;
    //                         if (checkSequence != null) {
    //                             // log.cfLoggingMessages('info', '2' + JSON.stringify(checkSequence));
    //                             SequenceNo = int.parse(checkSequence.SequenceNo) + 1;
    //                         }
    //                         // log.cfLoggingMessages('info', '3' + JSON.stringify(checkSequence));

    //                         confirmationData.push({
    //                             "PurchaseOrder": PONO,
    //                             "PurchaseOrderItem": PurchaseOrderItem,
    //                             "SequenceNo": SequenceNo,
    //                             "DeliveryDateTime": date,
    //                             "Quanity": ScheduleLineOrderQuantity,
    //                             "Material": null,
    //                             "Party_Id_Identification": null,
    //                             "FactoryRefNo": "A1542",
    //                             "Substitute": null,
    //                             "NetPriceAmount": "12",
    //                             "ShipmentMethod": null,
    //                             "JapanPONumber": null,
    //                             "SupplierCode": null,
    //                             "ReceiverCode": null,
    //                             "SalesTradeTermCode": null,
    //                             "ModelID": null,
    //                             "TransactionID": null,
    //                             "SettlementTradeTermCode": null,
    //                             "PurchasingOrganization": null,
    //                             "CompanyCode": null,
    //                             "ResponsibleEmployee": null,
    //                             "PartnerCode": null,
    //                             "ConsigneeCode": null,
    //                             "PayerCode": null,
    //                             "SellerCode": null,
    //                             "VendorOrder": null,
    //                             "PackageTypeCode": null,
    //                             "SalesUnitPrice": null,
    //                             "Vendor": null,
    //                             "WarehouseCode": null,
    //                             "PartnerWarehouse": null,
    //                             "ConfirmationDate": null
    //                         });

    //                         tx.run(INSERT.into(POConfirmationData).entries(confirmationData));

    //                         pocofirmation.ScheduleLine.push({
    //                             "PurchaseOrder": PONO,
    //                             "PurchaseOrderItem": PurchaseOrderItem,
    //                             "DeliveryDate": date,
    //                             "Quantity": ScheduleLineOrderQuantity,

    //                             "ConfirmCat": "AB",
    //                             "Reference": Reference
    //                         });

    //                         // log.cfLoggingMessages('info', 'ScheduleLineOrderQuantity : ' + obj.Interchange.M_ORDRSP.G_SG25.G_SG48.G_SG49.S_QTY.C_C186.D_6060);

    //                     }

    //                 }

    //             }



    //             return confirmationData;
    //         }
    //     }
    //     catch (error) {
    //         log.cfLoggingMessages('error', 'Error in Testing_MethodNew' + error)
    //         req.error({
    //             code: '400',
    //             message: error.message,
    //             target: 'some_field',
    //             status: 418
    //         })
    //     }

    // })


})