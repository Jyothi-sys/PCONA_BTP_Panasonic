using BTP.Panasonic as BTP from '../db/data-model';


service MNET_Dashboard_Detail @(path: '/factoryint/mnet-dashboard-detail') {
    entity bolHeader                   as projection on BTP.bolHeader;
    entity invoiceHeader               as projection on BTP.invoiceHeader;
    entity invoiceLine                 as projection on BTP.invoiceLine;
    entity A_PurchaseOrder             as projection on BTP.A_PurchaseOrder;
    entity A_PurchaseOrderItem         as projection on BTP.A_PurchaseOrderItem;
    entity additionalInvoiceLine       as projection on BTP.additionalInvoiceLine;
    entity MNetStatusMonitoring        as projection on BTP.MNetStatusMonitoring;
    entity MNetStatusMonitoringItem    as projection on BTP.MNetStatusMonitoringItem;
    entity UserAssignment              as projection on BTP.UserAssignment;
    entity PO_AdditionalData           as projection on BTP.PO_AdditionalData;
    //Added the few more fields in GR_DataUpdate
    action   GR_DataUpdate(houseBOLNumber : String(18), purchaseOrderNumber : String(50), BTP_InvoiceNumber : String(10), BTP_IBDNumber : String(10), status : String(1), BTP_GRStatus : String(10), BTP_GRNumber : String(10), SAP_LineID_GR : String(10), bolid : Integer, po_line : String(20), supplierinvoice : String(20), supplierinvoice_line : String(20)) returns Boolean;
    entity Environment                 as projection on BTP.Environment;
    entity MNET_DiversionHeader        as projection on BTP.MNET_DiversionHeader;
    entity MNET_DiversionDetail        as projection on BTP.MNET_DiversionDetail;
    entity ZMNETBUSINESS               as projection on BTP.ZMNETBUSINESS;
    entity ZMNETMODE                   as projection on BTP.ZMNETMODE;
    entity POCrossRef                  as projection on BTP.POCrossRef;
    entity ZCROSSREF                   as projection on BTP.ZCROSSREF;
    // entity plant                       as projection on BTP.plant;
    entity PurchaseGroup_GlobalCode    as projection on BTP.PurchaseGroup_GlobalCode;
    entity MNET_SuplrInvcItemPurOrdRef as projection on BTP.MNET_SuplrInvcItemPurOrdRef;
    function A_POlineitem()                                                                                                                                                                                                                                                                                                                                         returns array of A_PurchaseOrderItem;

    type prevBol {
        prev_record_existing : Boolean;
        houseBOLNumber       : String(18);
    };

    action   PrevBolDetails(PO : String(10), PO_ITEM : String(5), BOL : String(18), invNO : String(16), invLine : String(30), importShipmentNumber : String(30), boId : Integer)                                                                                                                                                                                    returns prevBol;
    //Added to validate the POType during reversal process from dashboard for defect 74 a by Preethi
    action   VALIDATE_DROPSHIP(PurchaseOrder : String(50))                                                                                                                                                                                                                                                                                                          returns String;

    entity GetUserList                 as
        select from UserAssignment as T0 {
            T0.UserID,
            T0.EmailID,
            T0.UserID.UserID as user,
            T0.CompanyCode,
            T0.PurchaseOrg,
            T0.CompanyCodeDescription,
            T0.PurchaseOrgDescription
        }
        where
            upper(
                T0.UserID.UserID
            ) = upper($user);

    @cds.query.limit: {
        default: 6000,
        max    : 20000
    }
    entity Get_Excecution_log_Mnet     as
        select from MNetStatusMonitoring as T0
        left join MNetStatusMonitoringItem as T1
            on T0.ID = T1.ID.ID
        {
                T0.ID,
            key T0.houseBOLNumber, //Preethi added for defect 156
                T0.ObjectType,
                T0.ObjectRefNo,
                T0.Status,
                cast(
                    case
                        when
                            T1.ID.ID is null
                        then
                            concat(
                                'Header Error:', T0.Message
                            )
                        else
                            T0.Message
                    end as String(985)
                )            as Message,
                cast(
                    ifnull(
                        T1.PurchaseOrder, null
                    ) as   String(10)
                )            as PurchaseOrder, //Preethi changed for defect 156 on 18/12
                cast(
                    ifnull(
                        T1.PurchaseOrderItem, null
                    ) as   String(10)
                )            as PurchaseOrderItem,
                T0.createdAt as DateTime,
        };

    action   Invoice_Reverse(BolID : Integer, DocNum : String(18), houseBOLNumber : String(18), invoiceNumber : String(16), PurchaseOrder : String(50), PurchaseOrderItem : String(10), ActID : String(1), DiversionId : Integer, CurrencyCode : String(3))                                                                                                         returns Boolean;
    action   Inbound_Reverse(BolID : Integer, DocNum : String(18), houseBOLNumber : String(18), invoiceNumber : String(16), PurchaseOrder : String(50), PurchaseOrderItem : String(10), GRNum : String(10), GRLineNum : String(10))                                                                                                                                 returns Boolean; //added by Preethi on 27/12

    entity Get_Reverse                 as
        select from MNetStatusMonitoring as T0
        inner join MNetStatusMonitoringItem as T1
            on T0.ID = T1.ID.ID
        INNER JOIN invoiceLine AS T2
        ON T2.invoiceNumber.houseBOLNumber.ID = T0.BOLID                                               
        AND T2.invoiceNumber.invoiceNumber = T0.invoiceNumber
        AND (T2.lineNumber = T1.lineNumber OR T1.lineNumber IS NULL)
        AND T1.PurchaseOrder = T2.purchaseOrderNumber
        AND T1.PurchaseOrderItem = T2.orderItemNbr
        AND T0.ObjectType IN ('GoodsReceipt','InboundDelivery','Invoice')
        {
            T0.ID,
            T0.BOLID, // adding 66 defect, field used for get the proper data
            T0.houseBOLNumber,
            T0.invoiceNumber,
            T0.containerID,
            T0.ObjectType,
            T0.ObjectRefNo,
            T0.Action,
            T0.FiscalYear,
            T0.GR_NO,
            T0.GR_DATE,
            T0.Status,
            T0.importShipmentNumber,
            T1.PurchaseOrder,
            T1.PurchaseOrderItem,
            T0.ObjectRefDate,
            T1.SAP_LineID,
            T1.lineNumber,
            T1.Material
        }
        where
            T0.Status = 'S';


    entity Get_POCrossRef              as
        select from POCrossRef as T0 {
            key T0.Po_Old,
            key T0.PoItem_Old,
                T0.Po_New,
                T0.PoItem_New,
                T0.Status,
                T0.Material_Number,
                T0.InvoiceNumber,
                T0.LineID_Invoice,
                T0.InvoiceStatus,
                T0.IBDNumber,
                T0.SAP_LineID_IBD,
                T0.IBDStatus,
                T0.GRNumber,
                T0.SAP_LineID_GR,
                T0.GRStatus,
                T0.BTP_ASN_DINumber,
                T0.BTP_ASN_DI_Status
        };

    //Preethi changed the join conditions(inner->left) for defect 93 on 18/12
    // Nithya changed Max logic for BOL for defect 57 on 20/03
    // entity Get_MNET                    as
    //     select from MNetStatusMonitoring as T10
    //     left join bolHeader as T0
    //         on T10.houseBOLNumber = T0.houseBOLNumber
    //     left join invoiceHeader as T1
    //         on  T0.houseBOLNumber = T1.houseBOLNumber.houseBOLNumber
    //         and T0.ID             = T1.houseBOLNumber.ID
    //     left join invoiceLine as T2
    //         on  T1.invoiceNumber =  T2.invoiceNumber.invoiceNumber
    //         and T0.ID            =  T2.invoiceNumber.houseBOLNumber.ID
    //         and T2.status        != 'I'
    //     left join additionalInvoiceLine as T3
    //         on  T2.partID                      = T3.partID.partID
    //         and T2.invoiceNumber.invoiceNumber = T3.partID.invoiceNumber.invoiceNumber
    //         and T2.lineNumber                  = T3.partID.lineNumber
    //     left join POCrossRef as T4
    //         on T4.Po_Old = T2.purchaseOrderNumber
    //     left join ZMNETBUSINESS as T5
    //         on T5.ZBUSINESS_IND = T2.Zbusiness_indicator
    //     left join MNetStatusMonitoring as T6
    //         on  T6.ObjectRefNo = T2.BTP_ASN_DINumber
    //         and T6.ObjectType  = 'ASN/DI'
    //         and T6.Status      = 'S'
    //     left join MNetStatusMonitoring as T7
    //         on  T7.ObjectRefNo = T2.BTP_InvoiceNumber
    //         and T7.ObjectType  = 'Invoice'
    //         and (
    //                T7.Action = 'D'
    //             or T7.Action = 'R'
    //             or T7.Action = 'C'

    //         )
    //         and T7.Status      = 'S'

    //     left join MNetStatusMonitoring as T8
    //         on  T2.invoiceNumber.houseBOLNumber.ID = T8.BOLID
    //         and T8.ObjectRefNo                     = T2.BTP_IBDNumber
    //         and T8.ObjectType                      = 'InboundDelivery'
    //         and (
    //                T8.Action = 'D'
    //             or T8.Action = 'R'
    //             or T8.Action = 'L'
    //             or T8.Action = 'C'
    //         )
    //         and T8.Status                          = 'S'
    //     left join MNetStatusMonitoring as T9
    //         on  T9.ObjectRefNo = T2.BTP_GRNumber
    //         and T9.ObjectType  = 'GoodsReceipt'
    //         and (
    //                T9.Action = 'D'
    //             or T9.Action = 'R'

    //         )
    //         and T9.Status      = 'S'
    //     inner join (
    //         (
    //             select distinct
    //             T0.ID as Max_ID,
    //             cast(
    //                 MAX(
    //                     (
    //                         RPAD(
    //                             ifnull(
    //                                 T0.importShipmentNumber, ''
    //                             ), 30
    //                         ) || RPAD(
    //                             ifnull(
    //                                 T2.invoiceNumber.invoiceNumber, ''
    //                             ), 16
    //                         ) || RPAD(
    //                             ifnull(
    //                                 T2.lineNumber, ''
    //                             ), 5
    //                         )
    //                     )
    //                 ) as   String(51)
    //             )     as V_REF
    //             from bolHeader as T0
    //             inner join invoiceHeader as T1
    //                 on T0.houseBOLNumber = T1.houseBOLNumber.houseBOLNumber
    //             inner join invoiceLine as T2
    //                 on T1.invoiceNumber = T2.invoiceNumber.invoiceNumber
    //             group by T0.ID, (
    //                 RPAD(
    //                     ifnull(
    //                         T0.importShipmentNumber, ''
    //                     ), 30
    //                 ) || RPAD(
    //                     ifnull(
    //                         T2.invoiceNumber.invoiceNumber, ''
    //                     ), 16
    //                 ) || RPAD(
    //                     ifnull(
    //                         T2.lineNumber, ''
    //                     ), 5
    //                 )
    //             )

    //         )
    //     ) as LatestBOL
    //         on  T1.invoiceNumber        = TRIM(
    //             SUBSTRING(
    //                 LatestBOL.V_REF, 31, 16
    //             )
    //         )
    //         and T0.importShipmentNumber = TRIM(
    //             SUBSTRING(
    //                 LatestBOL.V_REF, 1, 30
    //             )
    //         )
    //         and T2.lineNumber           = TRIM(
    //             SUBSTRING(
    //                 LatestBOL.V_REF, 47, 5
    //             )
    //         )
    //         and T0.ID                   = LatestBOL.Max_ID
    //     {
    //             cast(
    //                 max(
    //                     T0.ID
    //                 ) as   Integer
    //             )     as houseBOLNumber_ID,
    //         key cast(
    //                 min(
    //                     T0.importShipmentNumber
    //                 ) as   String(30)
    //             )     as Folder_No,

    //             cast(
    //                 (
    //                     T10.houseBOLNumber
    //                 ) as   String(18) // Preethi changed for defect 93 on 18/12
    //             )     as BillofLanding,

    //             cast(
    //                 (
    //                     T1.invoiceNumber
    //                 ) as   String(16)
    //             )     as SupplierInvoice,

    //             cast(
    //                 MIN(
    //                     T0.initialDestinationDescription
    //                 ) as   String(50)
    //             )     as initialDestinationDescription,

    //             cast(
    //                 MIN(
    //                     T0.createdAt
    //                 ) as   Date
    //             )     as Received_Date,
    //             // Considering initialDestinationETA for the ETA from file 23_03
    //             cast(
    //                 MAX(
    //                     T0.initialDestinationETA
    //                 ) as   Date
    //             )     as ETA,

    //             // jyothi changed for defect 175-point7
    //             cast(
    //                 MAX(
    //                     T10.modifiedAt
    //                 ) as   Date
    //             )     as ProcessDate,
    //             cast(
    //                 MIN(
    //                     T0.transformCode
    //                 ) as   String(10)
    //             )     as modeOfTransport,
    //             cast(
    //                 MIN(
    //                     T0.ordererID
    //                 ) as   String(20)
    //             )     as GlobalCompanyCode,
    //             cast(
    //                 MIN(
    //                     T0.initialDestination
    //                 ) as   String(20)
    //             )     as initialDestination,
    //             cast(
    //                 (
    //                     T1.invoiceNumber
    //                 ) as   String(16)
    //             )     as invoiceNumber,

    //         key cast(
    //                 (
    //                     T1.invoiceNumber
    //                 ) as   String(16)
    //             )     as invoiceNum,
    //             cast(
    //                 (
    //                     GET_MNET_ACT(
    //                         T10.houseBOLNumber, T1.invoiceNumber, T2.orderItemNbr
    //                     ) //added by Preethi for to display latest Action for 214 pt 11 on 12/02/24
    //                 ) as   String(1)
    //             )     as action,
    //             cast(
    //                 MIN(
    //                     T2.Zbusiness_indicator
    //                 ) as   String(2)
    //             )     as shippingInfo,
    //         key cast(
    //                 (
    //                     T2.lineNumber
    //                 ) as   String(30)
    //             )     as SupplierInvoice_Line,
    //             cast(
    //                 MIN(
    //                     T2.purchaseOrderNumber
    //                 ) as   String(50)
    //             )     as Purchasing_order,
    //             cast(
    //                 (
    //                     T2.orderItemNbr
    //                 ) as   String(5) // Defect 172 - Change to get Substituted PO line item
    //             )     as PO_Line,
    //             cast(
    //                 (
    //                     GET_MNET_STATUS(
    //                         T10.houseBOLNumber, T1.invoiceNumber, T2.orderItemNbr, T2.lineNumber
    //                     ) //added by Preethi to display latest Status for 214 pt 11 on 12/02/24
    //                 ) as   String(1)
    //             )     as status,
    //             cast(
    //                 (
    //                     GET_MNET_CONT(
    //                         T10.houseBOLNumber, T1.invoiceNumber, T2.orderItemNbr
    //                     ) //added by Preethi for to display latest Action for 214 pt 11 on 12/02/24
    //                 ) as   String(20)
    //             )     as containerID,
    //             cast(
    //                 MIN(
    //                     GET_MNET_ITEM(
    //                         T2.partID
    //                     )
    //                 ) as   String(50)
    //             )     as buyerPartID,
    //             cast(
    //                 MIN(
    //                     T3.PASCOriginalPartsNbr
    //                 ) as   String(17)
    //             )     as Original_Material,
    //             cast(
    //                 case
    //                     when
    //                         T3.PASCOriginalPartsNbr is not null
    //                     then
    //                         MIN(
    //                             T3.orderItemNbr
    //                         )
    //                     else
    //                         ''
    //                 end as String(5)
    //             )     as Original_PO_Line, // defect 172 added original PO line on 05/03
    //             cast(
    //                 (
    //                     GET_MNET_QTY(
    //                         T10.houseBOLNumber, T1.invoiceNumber, T2.orderItemNbr, T2.lineNumber
    //                     ) //added by Preethi for to display latest qty for 214 pt 11 on 12/02/24
    //                 ) as   String(17)
    //             )     as quantity,
    //             cast(
    //                 MAX(
    //                     case
    //                         when
    //                             IFNULL(
    //                                 T8.Status, 'S'
    //                             ) = 'S'
    //                             and IFNULL(
    //                                 T2.BTP_IBDAction, 'D'
    //                             ) = 'D'
    //                         then
    //                             ' '
    //                         else
    //                             case IFNULL(
    //                                 T8.Status, 'S'
    //                             )
    //                                 when
    //                                     'S'
    //                                 then
    //                                     T2.BTP_IBDNumber
    //                                 else
    //                                     ''
    //                             end
    //                     end
    //                 ) as   String(10) //preethi changed on 19/02/24 for defect 214 #5
    //             )     as BTP_IBDNumber,
    //             cast(
    //                 MAX(
    //                     case
    //                         when
    //                             IFNULL(
    //                                 T8.Status, 'S'
    //                             ) = 'S'
    //                             and IFNULL(
    //                                 T2.BTP_IBDAction, 'D'
    //                             ) = 'D'
    //                         then
    //                             ' '
    //                         else
    //                             case IFNULL(
    //                                 T8.Status, 'S'
    //                             )
    //                                 when
    //                                     'S'
    //                                 then
    //                                     T2.SAP_LineID_IBD
    //                                 else
    //                                     ''
    //                             end
    //                     end
    //                 ) as   String(10) //added on 21/02/24 by Preethi for defect 214 #5
    //             )     as deliveryListItemNbr,
    //             cast(
    //                 MAX(
    //                     case
    //                        when
    //                               IFNULL(
    //                                 T9.Status, 'S'
    //                             ) = 'S'
    //                             and IFNULL(
    //                                 T2.BTP_GRAction, 'R'
    //                             ) = 'R'
    //                         then
    //                             ' '
    //                         else
    //                              case IFNULL(
    //                                 T9.Status, 'S'
    //                             )
    //                                 when
    //                                     'S'
    //                                 then
    //                                     T2.BTP_GRNumber
    //                                 else
    //                                     ''
    //                             end
    //                     end

    //                 ) as     String(10)
    //             )     as BTP_GRNumber,
    //             cast(
    //                 MAX(
    //                     case
    //                         when
    //                             IFNULL(
    //                                 T9.Status, 'S'
    //                             ) = 'S'
    //                             and IFNULL(
    //                                 T2.BTP_GRAction, 'R'
    //                             ) = 'R'
    //                         then
    //                             ' '
    //                         else
    //                             case IFNULL(
    //                                 T9.Status, 'S'

    //                             )
    //                                 when
    //                                     'S'
    //                                 then
    //                                     T2.SAP_LineID_GR
    //                                 else
    //                                     ''
    //                             end
    //                     end
    //                 ) as   String(10)
    //             )     as Receipt_Line,
    //             cast(
    //                 MAX(
    //                     case
    //                         when
    //                             IFNULL(
    //                                 T7.Status, 'S'
    //                             ) = 'S'
    //                             and IFNULL(
    //                                 T2.BTP_InvoiceAction, 'D'
    //                             ) = 'D'
    //                         then
    //                             ' '
    //                         else
    //                             case IFNULL(
    //                                 T7.Status, 'S'
    //                             )
    //                                 when
    //                                     'S'
    //                                 then
    //                                     T2.SAP_LineID_Invoice
    //                                 else
    //                                     ''
    //                             end
    //                     end
    //                 ) as   String(10) //added on 11/03/24 by Nithya for defect to show invoice lineitem
    //             )     as invoiceItemNbr,
    //             cast(
    //                 MIN(
    //                     T1.supplierID,
    //                 ) as   String(20)
    //             )     as Vender,
    //             cast(
    //                 (
    //                     GET_DISTATUS(
    //                         T0.houseBOLNumber, T1.invoiceNumber
    //                     )
    //                 ) as   String(3)
    //             )     as DI_Status, // Nithya change FINT-00065 on 7/12
    //             cast(
    //                 (
    //                     GET_ASNSTATUS(
    //                         T0.houseBOLNumber, T1.invoiceNumber
    //                     )
    //                 ) as   String(3)
    //             )     as ASN_Status, // Nithya change FINT-00065 on 7/12
    //             cast(
    //                 MAX(
    //                     case
    //                         when
    //                             IFNULL(
    //                                 T7.Status, 'S'
    //                             ) = 'S'
    //                             and IFNULL(
    //                                 T2.BTP_InvoiceAction, 'D'
    //                             ) = 'D'
    //                         then
    //                             ' '
    //                         else
    //                             case IFNULL(
    //                                 T7.Status, 'S'
    //                             )
    //                                 when
    //                                     'S'
    //                                 then
    //                                     T2.BTP_InvoiceStatus
    //                                 else
    //                                     ''
    //                             end
    //                     end
    //                 ) as   String(10) //added by Nithya on 11/03 for defect to show Invoice status
    //             )     as BTP_InvoiceStatus,
    //             cast(
    //                 MAX(
    //                     case
    //                         when
    //                             IFNULL(
    //                                 T8.Status, 'S'
    //                             ) = 'S'
    //                             and IFNULL(
    //                                 T2.BTP_IBDAction, 'D'
    //                             ) = 'D'
    //                         then
    //                             ' '
    //                         else
    //                             case IFNULL(
    //                                 T8.Status, 'S'
    //                             )
    //                                 when
    //                                     'S'
    //                                 then
    //                                     T2.BTP_IBDStatus
    //                                 else
    //                                     ''
    //                             end
    //                     end
    //                 ) as   String(10) //added by Preethi on 21/02 for defect 214 #5
    //             )     as BTP_IBDStatus,


    //             cast(
    //                 MAX(
    //                     T2.statusRemark
    //                 ) as   String(100)
    //             )     as statusRemark,
    //             cast(
    //                 MAX(
    //                     case
    //                         when
    //                             IFNULL(
    //                                 T7.Status, 'S'
    //                             ) = 'S'
    //                             and IFNULL(
    //                                 T2.BTP_InvoiceAction, 'D'
    //                             ) = 'D'
    //                         then
    //                             ' '
    //                         else
    //                             case IFNULL(
    //                                 T7.Status, 'S'
    //                             )
    //                                 when
    //                                     'S'
    //                                 then
    //                                     T2.BTP_InvoiceNumber
    //                                 else
    //                                     ''
    //                             end
    //                     end
    //                 ) as   String(10)
    //             )     as BTP_InvoiceNumber, // changed the logic for defect 214
    //             cast(
    //                 MAX(
    //                     T2.DiversionFlag
    //                 ) as   String(10)
    //             )     as DiversionFlag,

    //             cast(
    //                 MIN(
    //                     T4.Po_Old
    //                 ) as   String(10)
    //             )     as Po_Old,
    //             cast(
    //                 MAX(
    //                     T1.paymentConditionCode
    //                 ) as   String(2)
    //             )     as paymentConditionCode,
    //             cast(
    //                 MAX(
    //                     T7.Action
    //                 ) as   String(2)
    //             )     as INV_Action,
    //             cast(
    //                 MAX(
    //                     T8.Action
    //                 ) as   String(2)
    //             )     as IBD_Action,
    //             cast(
    //                 MAX(
    //                     T9.Action
    //                 ) as   String(2)
    //             )     as GR_Action
    //     }
    //     group by
    //         T2.lineNumber,
    //         T2.orderItemNbr,
    //         T3.PASCOriginalPartsNbr,
    //         T0.houseBOLNumber,
    //         T1.invoiceNumber,
    //         T10.houseBOLNumber;


    entity Get_MNET                    as
        select from (
            select
                max(
                    T6.createdAt
                )                              as CREATEDAT,
                max(
                    T6.ID
                )                              as ID, // MNetStatusMonitoring Status ID is not same as BOL ID
                max(
                    T6.BOLID
                )                              as BOLID,
                T7.importShipmentNumber,
                T9.invoiceNumber.invoiceNumber as invoiceNumber,
                T8.supplierID,
                T8.paymentConditionCode,
                T8.invoiceCurrencyCode,
                T9.lineNumber,
                T7.initialDestination,
                T7.initialDestinationDescription,
                T7.initialDestinationETA,
                T7.transformCode,
                T7.ordererID,
                T9.action,
                T9.Zbusiness_indicator,
                T9.purchaseOrderNumber,
                T9.orderItemNbr,
                T9.status,
                T9.containerID,
                T9.partID,
                T9.quantity,
                T9.BTP_IBDStatus,
                T9.BTP_IBDAction,
                T9.BTP_IBDNumber,
                T9.SAP_LineID_IBD,
                T9.BTP_GRStatus,
                T9.BTP_GRAction,
                T9.BTP_GRNumber,
                T9.SAP_LineID_GR,
                T9.BTP_InvoiceStatus,
                T9.BTP_InvoiceAction,
                T9.BTP_InvoiceNumber,
                T9.SAP_LineID_Invoice,
                T9.BTP_ASN_DI_Status,
                T9.statusRemark,
                T9.DiversionFlag,
                T9.unitPrice,
                T9.partUnitOfMeasurement
            from MNetStatusMonitoring as T6
            left join bolHeader as T7
                on  T6.houseBOLNumber = T7.houseBOLNumber
                and T6.BOLID          = T7.ID
            left join invoiceHeader as T8
                on  T7.houseBOLNumber = T8.houseBOLNumber.houseBOLNumber
                and T7.ID             = T8.houseBOLNumber.ID
            left join invoiceLine as T9
                on  T8.invoiceNumber                 =  T9.invoiceNumber.invoiceNumber
                and T8.houseBOLNumber.ID             =  T9.invoiceNumber.houseBOLNumber.ID
                and T8.houseBOLNumber.houseBOLNumber =  T9.invoiceNumber.houseBOLNumber.houseBOLNumber
                and T9.status                        in (
                    'C', 'H', 'O', 'P', 'E'
                )
            inner join (
                (
                    select
                        Max(
                            T0.ID
                        )                              as MAX_BOLID, // MAX_BOLID is BOLID
                        T0.importShipmentNumber,
                        T2.invoiceNumber.invoiceNumber as M_invoiceNumber,
                        T2.lineNumber
                    from (
                        (
                            bolHeader as T0
                            inner join invoiceHeader as T1
                                on T0.ID = T1.houseBOLNumber.ID
                        )
                        inner join invoiceLine as T2
                            on  T1.invoiceNumber                 = T2.invoiceNumber.invoiceNumber
                            and T1.houseBOLNumber.houseBOLNumber = T2.invoiceNumber.houseBOLNumber.houseBOLNumber
                            and T0.ID                            = T2.invoiceNumber.houseBOLNumber.ID
                    )
                    group by
                        T0.importShipmentNumber,
                        T2.invoiceNumber.invoiceNumber,
                        T2.lineNumber

                )
            ) as LatestBOL
                on  T9.invoiceNumber.invoiceNumber     = LatestBOL.M_invoiceNumber
                and T9.lineNumber                      = LatestBOL.lineNumber
                and T9.invoiceNumber.houseBOLNumber.ID = LatestBOL.MAX_BOLID
                and T7.importShipmentNumber            = LatestBOL.importShipmentNumber
            where
                T6.importShipmentNumber = T7.importShipmentNumber
            group by
                T7.importShipmentNumber,
                T9.invoiceNumber.invoiceNumber,
                T8.supplierID,
                T8.paymentConditionCode,
                T8.invoiceCurrencyCode,
                T9.lineNumber,
                T7.initialDestination,
                T7.initialDestinationDescription,
                T7.initialDestinationETA,
                T7.transformCode,
                T7.ordererID,
                T9.action,
                T9.Zbusiness_indicator,
                T9.purchaseOrderNumber,
                T9.orderItemNbr,
                T9.status,
                T9.containerID,
                T9.partID,
                T9.quantity,
                T9.BTP_IBDStatus,
                T9.BTP_IBDAction,
                T9.BTP_IBDNumber,
                T9.SAP_LineID_IBD,
                T9.BTP_GRStatus,
                T9.BTP_GRAction,
                T9.BTP_GRNumber,
                T9.SAP_LineID_GR,
                T9.BTP_InvoiceStatus,
                T9.BTP_InvoiceAction,
                T9.BTP_InvoiceNumber,
                T9.SAP_LineID_Invoice,
                T9.BTP_ASN_DI_Status,
                T9.statusRemark,
                T9.DiversionFlag,
                T9.unitPrice,
                T9.partUnitOfMeasurement
        ) as LatestStatusRecords
        left join bolHeader as T10
            on  T10.ID                   = LatestStatusRecords.BOLID
            and T10.importShipmentNumber = LatestStatusRecords.importShipmentNumber
        left join additionalInvoiceLine as T3
            on(
                    LatestStatusRecords.partID        = T3.partID.partID
                and T10.houseBOLNumber                = T3.partID.invoiceNumber.houseBOLNumber.houseBOLNumber
                and LatestStatusRecords.BOLID         = T3.partID.invoiceNumber.houseBOLNumber.ID
                and LatestStatusRecords.invoiceNumber = T3.partID.invoiceNumber.invoiceNumber
                and LatestStatusRecords.lineNumber    = T3.partID.lineNumber
            )
        left join POCrossRef as T4
            on  LatestStatusRecords.purchaseOrderNumber = T4.Po_Old
            and LatestStatusRecords.orderItemNbr        = T4.PoItem_Old
        left join ZMNETBUSINESS as T5
            on LatestStatusRecords.Zbusiness_indicator = T5.ZBUSINESS_IND

        distinct {
                cast(
                    (
                        LatestStatusRecords.BOLID
                    ) as   Integer
                ) as houseBOLNumber_ID,
            key cast(
                    (
                        LatestStatusRecords.importShipmentNumber
                    ) as   String(12) //Bhushan changed length 30 to 12 on 30-04-2024
                ) as Folder_No,

                cast(
                    (
                        T10.houseBOLNumber
                    ) as   String(18) // Preethi changed for defect 93 on 18/12 Bhushan changed 18 to 12 on 30-04-2024
                ) as BillofLanding,

            key cast(
                    (
                        LatestStatusRecords.invoiceNumber
                    ) as   String(16)
                ) as SupplierInvoice,

            key cast(
                    (
                        LatestStatusRecords.lineNumber
                    ) as   String(12) //Bhushan changed 16 to 12 on 30-04-2024
                ) as SupplierInvoice_Line,

                cast(
                    (
                        LatestStatusRecords.initialDestinationDescription
                    ) as   String(15) //Bhushan changed length 50 to 15 on 30-04-2024
                ) as initialDestinationDescription,

                cast(
                    (
                        LatestStatusRecords.CREATEDAT
                    ) as   Date
                ) as Received_Date,
                // Considering initialDestinationETA for the ETA from file 23_03
                cast(
                    (
                        LatestStatusRecords.initialDestinationETA
                    ) as   Date
                ) as ETA,

                // jyothi changed for defect 175-point7
                // Kowsalyaa changed for Process Date Blank issue for Header error
                // cast(
                //         // Brahma Added the logic to have processdate be same as createdat if Modifedat is null..
                //       ( ifnull
                //      ( T10.modifiedAt
                //      , T10.createdAt )
                //      )as         Date
                // ) as ProcessDate,
                cast(
                    (
                        LatestStatusRecords.CREATEDAT
                    ) as   Date
                ) as ProcessDate,
                cast(
                    (
                        LatestStatusRecords.transformCode
                    ) as   String(10)
                ) as modeOfTransport,
                cast(
                    (
                        LatestStatusRecords.ordererID
                    ) as   String(20)
                ) as GlobalCompanyCode,
                cast(
                    (
                        LatestStatusRecords.initialDestination
                    ) as   String(20)
                ) as initialDestination,
                cast(
                    (
                        LatestStatusRecords.action
                    ) as   String(1)
                ) as action,
                cast(
                    (
                        LatestStatusRecords.Zbusiness_indicator
                    ) as   String(2)
                ) as shippingInfo,

            key cast(
                    (
                        LatestStatusRecords.purchaseOrderNumber
                    ) as   String(12) // Bhushan Changed length 50 to 25  & Gnaneshwar Changed length 25 to 12
                ) as Purchasing_order,
            key cast(
                    (
                        LatestStatusRecords.orderItemNbr
                    ) as   String(5) // Defect 172 - Change to get Substituted PO line item
                ) as PO_Line,
                cast(
                    (
                        LatestStatusRecords.status
                    ) as   String(1)
                ) as status,
                cast(
                    (
                        LatestStatusRecords.containerID
                    ) as   String(20)
                ) as containerID,
                // cast(
                //     (
                //         LatestStatusRecords.partID
                //     ) as         String(50)
                // ) as buyerPartID,
                cast(
                    (
                        case
                            when
                                length(
                                    RTRIM(
                                        SUBSTR(
                                            LatestStatusRecords.partID, (
                                                INSTR(
                                                    LatestStatusRecords.partID, '~', 1
                                                )+1
                                            ), (
                                                LOCATE(
                                                    LatestStatusRecords.partID, '~', -1
                                                )-INSTR(
                                                    LatestStatusRecords.partID, '~', 1
                                                )-1
                                            )
                                        )
                                    )
                                ) < 3
                            then
                                RTRIM(
                                    SUBSTR(
                                        LatestStatusRecords.partID, 1, (
                                            INSTR(
                                                LatestStatusRecords.partID, '~', 1
                                            )-1
                                        )
                                    )
                                )
                            else
                                RTRIM(
                                    SUBSTR(
                                        LatestStatusRecords.partID, (
                                            INSTR(
                                                LatestStatusRecords.partID, '~', 1
                                            )+1
                                        ), (
                                            LOCATE(
                                                LatestStatusRecords.partID, '~', -1
                                            )-INSTR(
                                                LatestStatusRecords.partID, '~', 1
                                            )-1
                                        )
                                    )
                                )
                        end
                    ) as   String(50)
                ) as buyerPartID,
                cast(
                    (
                        T3.PASCOriginalPartsNbr
                    ) as   String(17)
                ) as Original_Material,
                cast(
                    case
                        when
                            T3.PASCOriginalPartsNbr is not null
                        then
                            (
                                T3.orderItemNbr
                            )
                        else
                            ''
                    end as String(5)
                ) as Original_PO_Line, // defect 172 added original PO line on 05/03
                cast(
                    (
                        LatestStatusRecords.quantity
                    ) as   String(17)
                ) as quantity,
                cast(
                    (
                        case
                            when
                                IFNULL(
                                    LatestStatusRecords.BTP_IBDStatus, 'X'
                                ) = 'X'
                                and IFNULL(
                                    LatestStatusRecords.BTP_IBDAction, 'X'
                                ) = 'X'
                            then
                                ' '
                            else
                                case IFNULL(
                                    LatestStatusRecords.BTP_IBDStatus, 'X'
                                )
                                    when
                                        'S'
                                    then
                                        LatestStatusRecords.BTP_IBDStatus
                                    else
                                        ''
                                end
                        end

                    ) as   String(10)
                ) as BTP_IBDStatus,
                cast(
                    (
                        LatestStatusRecords.BTP_IBDAction
                    ) as   String(2)
                ) as IBD_Action,
                cast(
                    (
                        case
                            when
                                IFNULL(
                                    LatestStatusRecords.BTP_IBDStatus, 'X'
                                ) = 'X'
                                and IFNULL(
                                    LatestStatusRecords.BTP_IBDAction, 'X'
                                ) = 'X'
                            then
                                ' '
                            else
                                case
                                    when
                                        IFNULL(
                                            LatestStatusRecords.BTP_IBDStatus, 'X'
                                        ) = 'S'
                                        and IFNULL(
                                            LatestStatusRecords.BTP_IBDAction, 'X'
                                        ) = 'C'
                                        or IFNULL(
                                            LatestStatusRecords.BTP_IBDAction, 'X'
                                        ) = 'U'

                                    then
                                        LatestStatusRecords.BTP_IBDNumber
                                    else
                                        ''
                                end
                        end


                    ) as   String(10)
                ) as BTP_IBDNumber,
                cast(
                    (
                        case
                            when
                                IFNULL(
                                    LatestStatusRecords.BTP_IBDStatus, 'X'
                                ) = 'X'
                                and IFNULL(
                                    LatestStatusRecords.BTP_IBDAction, 'X'
                                ) = 'X'
                            then
                                ' '
                            else
                                case
                                    when
                                        IFNULL(
                                            LatestStatusRecords.BTP_IBDStatus, 'X'
                                        ) = 'S'
                                        and IFNULL(
                                            LatestStatusRecords.BTP_IBDAction, 'X'
                                        ) = 'C'
                                        or IFNULL(
                                            LatestStatusRecords.BTP_IBDAction, 'X'
                                        ) = 'U'
                                    then
                                        LatestStatusRecords.SAP_LineID_IBD
                                    else
                                        ''
                                end
                        end

                    ) as   String(10)
                ) as deliveryListItemNbr,
                cast(
                    (
                        LatestStatusRecords.BTP_GRAction
                    ) as   String(2)
                ) as GR_Action,
                cast(
                    (
                        case
                            when
                                IFNULL(
                                    LatestStatusRecords.BTP_GRStatus, 'X'
                                ) = 'X'
                                and IFNULL(
                                    LatestStatusRecords.BTP_GRAction, 'X'
                                ) = 'X'
                            then
                                ' '
                            else
                                case
                                    when
                                        IFNULL(
                                            LatestStatusRecords.BTP_GRStatus, 'X'
                                        ) = 'S'
                                        and IFNULL(
                                            LatestStatusRecords.BTP_GRAction, 'X'
                                        ) = 'C'
                                    then
                                        LatestStatusRecords.BTP_GRNumber
                                    else
                                        ''
                                end
                        end

                    ) as   String(10)
                ) as BTP_GRNumber,
                cast(
                    (
                        case
                            when
                                IFNULL(
                                    LatestStatusRecords.BTP_GRStatus, 'X'
                                ) = 'X'
                                and IFNULL(
                                    LatestStatusRecords.BTP_GRAction, 'X'
                                ) = 'X'
                            then
                                ' '
                            else
                                case
                                    when
                                        IFNULL(
                                            LatestStatusRecords.BTP_GRStatus, 'X'
                                        ) = 'S'
                                        and IFNULL(
                                            LatestStatusRecords.BTP_GRAction, 'X'
                                        ) = 'C'
                                    then
                                        LatestStatusRecords.SAP_LineID_GR
                                    else
                                        ''
                                end
                        end

                    ) as   String(10)
                ) as Receipt_Line,
                cast(
                    (
                        case
                            when
                                IFNULL(
                                    LatestStatusRecords.BTP_InvoiceStatus, 'X'
                                ) = 'X'
                                and IFNULL(
                                    LatestStatusRecords.BTP_InvoiceAction, 'X'
                                ) = 'X'
                            then
                                ' '
                            else
                                case IFNULL(
                                    LatestStatusRecords.BTP_InvoiceStatus, 'X'
                                )
                                    when
                                        'S'
                                    then
                                        LatestStatusRecords.BTP_InvoiceStatus
                                    else
                                        ''
                                end
                        end
                    ) as   String(10)
                ) as BTP_InvoiceStatus,
                cast(
                    (
                        LatestStatusRecords.BTP_InvoiceAction
                    ) as   String(2)
                ) as INV_Action,
                cast(
                    (
                        case
                            when
                                IFNULL(
                                    LatestStatusRecords.BTP_InvoiceStatus, 'X'
                                ) = 'X'
                                and IFNULL(
                                    LatestStatusRecords.BTP_InvoiceAction, 'X'
                                ) = 'X'
                            then
                                ' '
                            else
                                case
                                    when
                                        IFNULL(
                                            LatestStatusRecords.BTP_InvoiceStatus, 'X'
                                        ) = 'S'
                                        and IFNULL(
                                            LatestStatusRecords.BTP_InvoiceAction, 'X'
                                        ) = 'C'
                                    then
                                        LatestStatusRecords.BTP_InvoiceNumber
                                    else
                                        ''
                                end
                        end

                    ) as   String(10)
                ) as BTP_InvoiceNumber,
                cast(
                    (
                        case
                            when
                                IFNULL(
                                    LatestStatusRecords.BTP_InvoiceStatus, 'X'
                                ) = 'X'
                                and IFNULL(
                                    LatestStatusRecords.BTP_InvoiceAction, 'X'
                                ) = 'X'
                            then
                                ' '
                            else
                                case
                                    when
                                        IFNULL(
                                            LatestStatusRecords.BTP_InvoiceStatus, 'X'
                                        ) = 'S'
                                        and IFNULL(
                                            LatestStatusRecords.BTP_InvoiceAction, 'X'
                                        ) = 'C'
                                    then
                                        LatestStatusRecords.SAP_LineID_Invoice
                                    else
                                        ''
                                end
                        end
                    ) as   String(10)
                ) as invoiceItemNbr,
                cast(
                    (
                        case
                            when
                                LatestStatusRecords.BTP_ASN_DI_Status = 'ET'
                            then
                                ''
                            else
                                LatestStatusRecords.BTP_ASN_DI_Status
                        end
                    ) as   String(3)
                ) as ASN_Status,
                cast(
                    (
                        case
                            when
                                LatestStatusRecords.BTP_ASN_DI_Status = 'EH'
                            then
                                ''
                            else
                                LatestStatusRecords.BTP_ASN_DI_Status
                        end
                    ) as   String(3)
                ) as DI_Status,
                cast(
                    (
                        LatestStatusRecords.statusRemark
                    ) as   String(100)
                ) as statusRemark,
                cast(
                    (
                        LatestStatusRecords.supplierID
                    ) as   String(20)
                ) as Vender,
                cast(
                    (
                        LatestStatusRecords.paymentConditionCode
                    ) as   String(2)
                ) as paymentConditionCode,
                cast(
                    (
                        LatestStatusRecords.DiversionFlag
                    ) as   String(10)
                ) as DiversionFlag,

                cast(
                    (
                        LatestStatusRecords.Zbusiness_indicator
                    ) as   String(10)
                ) as Zbusiness_indicator,


                cast(
                    (

                        case
                            when
                                IFNULL(
                                    T4.Po_Old, 'X'
                                ) = 'X'
                            then
                                ''
                            else
                                T4.Po_Old
                        end

                    ) as   String(10) //passing empty string since pocross ref is not used and to avoid dump
                ) as Po_Old,
                cast(
                    (
                        case
                            when
                                IFNULL(
                                    T4.PoItem_Old, 'X'
                                ) = 'X'
                            then
                                ''
                            else
                                T4.PoItem_Old
                        end
                    ) as   String(5)
                ) as PoItem_Old,
                cast(
                    (
                        LatestStatusRecords.unitPrice
                    ) as   String(10)
                ) as UnitPrice,
                cast(
                    (
                        LatestStatusRecords.partUnitOfMeasurement
                    ) as   String(10)
                ) as UOM,
                //SIT3 Def #26
                LatestStatusRecords.invoiceCurrencyCode

        };


    // T2.action;  // Preethi chnged for defect 209 on 31/01
    //Preethi added condn @494 for defect 194 on 29/01


    // entity Get_MNET_Diversion          as
    //     select from bolHeader as T0
    //     inner join invoiceHeader as T1
    //         on  T0.houseBOLNumber = T1.houseBOLNumber.houseBOLNumber
    //         and T0.ID             = T1.houseBOLNumber.ID
    //     inner join invoiceLine as T2
    //         on T1.invoiceNumber = T2.invoiceNumber.invoiceNumber
    //     inner join additionalInvoiceLine as T3
    //         on  T2.partID                      = T3.partID.partID
    //         and T2.invoiceNumber.invoiceNumber = T3.partID.invoiceNumber.invoiceNumber
    //         and T2.lineNumber                  = T3.partID.lineNumber
    //     inner join MNET_DiversionHeader as T10
    //         on  T2.purchaseOrderNumber = T10.Purchase_order
    //         and T2.lineNumber          = T10.Mnet_Line
    //     inner join MNET_DiversionDetail as T11
    //         on T10.ID = T11.ID.ID
    //     left join POCrossRef as T4
    //         on T4.Po_Old = T2.purchaseOrderNumber
    //     left join ZMNETBUSINESS as T5
    //         on T5.ZBUSINESS_IND = T2.Zbusiness_indicator
    //     left join MNetStatusMonitoring as T6
    //         on  T6.ObjectRefNo = T11.ASN_DI
    //         and T6.ObjectType  = 'ASN/DI'
    //         and T6.Status      = 'S'
    //     left join MNetStatusMonitoring as T7
    //         on  T7.ObjectRefNo = T11.Invoice
    //         and T7.ObjectType  = 'Invoice'
    //         and (
    //                T7.Action = 'D'
    //             or T7.Action = 'R'
    //         )
    //         and T7.Status      = 'S'

    //     left join MNetStatusMonitoring as T8
    //         on  T8.ObjectRefNo = T11.Delivery
    //         and T8.ObjectType  = 'InboundDelivery'
    //         and (
    //                T8.Action = 'D'
    //             or T8.Action = 'R'
    //             or T8.Action = 'L'
    //         )
    //         and T8.Status      = 'S'
    //     left join MNetStatusMonitoring as T9
    //         on  T9.ObjectRefNo = T11.Delivery
    //         and T9.ObjectType  = 'GoodsReceipt'
    //         and (
    //                T9.Action = 'D'
    //             or T9.Action = 'R'
    //         )
    //         and T9.Status      = 'S'
    //     {
    //             cast(
    //                 MIN(
    //                     T0.ID
    //                 ) as        Integer
    //             ) as houseBOLNumber_ID,
    //         key cast(
    //                 min(
    //                     T0.importShipmentNumber
    //                 ) as        String(30)
    //             ) as Folder_No,

    //             cast(
    //                 min(
    //                     T0.houseBOLNumber
    //                 ) as        String(18)
    //             ) as BillofLanding,

    //             cast(
    //                 MIN(
    //                     T1.invoiceNumber
    //                 ) as        String(16)
    //             ) as SupplierInvoice,

    //             cast(
    //                 MIN(
    //                     T0.initialDestinationDescription
    //                 ) as        String(50)
    //             ) as initialDestinationDescription,

    //             cast(
    //                 MIN(
    //                     T0.createdAt
    //                 ) as        Date
    //             ) as Received_Date,

    //             cast(
    //                 MAX(
    //                     T0.ETA
    //                 ) as        Date
    //             ) as ETA,
    //             cast(
    //                 MAX(
    //                     T2.BTP_InvoiceDate
    //                 ) as        Date
    //             ) as ProcessDate,
    //             cast(
    //                 MIN(
    //                     T0.transformCode
    //                 ) as        String(10)
    //             ) as modeOfTransport,
    //             cast(
    //                 MIN(
    //                     T0.ordererID
    //                 ) as        String(20)
    //             ) as GlobalCompanyCode,
    //             cast(
    //                 MIN(
    //                     T0.initialDestination
    //                 ) as        String(20)
    //             ) as initialDestination,
    //             cast(
    //                 MIN(
    //                     T1.invoiceNumber
    //                 ) as        String(16)
    //             ) as invoiceNumber,

    //         key cast(
    //                 MIN(
    //                     T1.invoiceNumber
    //                 ) as        String(16)
    //             ) as invoiceNum,
    //             cast(
    //                 MIN('U') as String(1)
    //             ) as action,
    //             cast(
    //                 MIN(
    //                     T2.Zbusiness_indicator
    //                 ) as        String(2)
    //             ) as shippingInfo,
    //         key cast(
    //                 MIN(
    //                     T2.lineNumber
    //                 ) as        String(30)
    //             ) as SupplierInvoice_Line,
    //             cast(
    //                 MIN(
    //                     T11.NewPurchasing_Order
    //                 ) as        String(50)
    //             ) as Purchasing_order,
    //             cast(
    //                 MIN(
    //                     T11.NewPOLine
    //                 ) as        String(5)
    //             ) as PO_Line,
    //             cast(
    //                 MAX(
    //                     T11.Status
    //                 ) as        String(1)
    //             ) as status,
    //             cast(
    //                 MIN(
    //                     T2.containerID
    //                 ) as        String(20)
    //             ) as containerID,
    //             cast(
    //                 MIN(
    //                     GET_MNET_ITEM(
    //                         T2.partID
    //                     )
    //                 ) as        String(50)
    //             ) as buyerPartID,
    //             cast(
    //                 MIN(
    //                     T3.PASCOriginalPartsNbr
    //                 ) as        String(17)
    //             ) as Original_Material,
    //             cast(
    //                 case
    //                     when
    //                         T3.PASCOriginalPartsNbr is not null
    //                     then
    //                         MIN(
    //                             T3.orderItemNbr
    //                         )
    //                     else
    //                         ''
    //                 end as      String(5)
    //             ) as Original_PO_Line, // defect 172 added original PO line on 05/03
    //             cast(
    //                 MIN(
    //                     T2.quantity
    //                 ) as        String(17)
    //             ) as quantity,
    //             cast(
    //                 MAX(
    //                     case ifnull(
    //                         T8.Action, 'S'
    //                     )
    //                         when
    //                             'S'
    //                         then
    //                             T11.Delivery
    //                         else
    //                             ''
    //                     end
    //                 ) as        String(10)
    //             ) as BTP_IBDNumber,
    //             cast(
    //                 MAX(
    //                     case ifnull(
    //                         T8.Action, 'S'
    //                     )
    //                         when
    //                             'S'
    //                         then
    //                             T11.IBD_Item
    //                         else
    //                             ''
    //                     end
    //                 ) as        String(10)
    //             ) as deliveryListItemNbr,
    //             cast(
    //                 MAX(
    //                     case ifnull(
    //                         T9.Action, 'S'
    //                     )
    //                         when
    //                             'S'
    //                         then
    //                             T11.Receipt
    //                         else
    //                             ''
    //                     end
    //                 ) as        String(10)
    //             ) as BTP_GRNumber,
    //             cast(
    //                 MAX(
    //                     case ifnull(
    //                         T9.Action, 'S'
    //                     )
    //                         when
    //                             'S'
    //                         then
    //                             T11.GR_Item
    //                         else
    //                             ''
    //                     end
    //                 ) as        String(10)
    //             ) as Receipt_Line,
    //             cast(
    //                 MAX(
    //                     case ifnull(
    //                         T7.Action, 'S'
    //                     )
    //                         when
    //                             'S'
    //                         then
    //                             T11.INV_Item
    //                         else
    //                             ''
    //                     end
    //                 ) as        String(10)
    //             ) as invoiceItemNbr,
    //             cast(
    //                 MIN(
    //                     T1.supplierID,
    //                 ) as        String(20)
    //             ) as Vender,
    //             cast(
    //                 (
    //                     GET_DISTATUS(
    //                         T0.houseBOLNumber, T1.invoiceNumber
    //                     )
    //                 ) as        String(3)
    //             ) as DI_Status, // Preethi change defect 194 on 30/01
    //             cast(
    //                 (
    //                     GET_ASNSTATUS(
    //                         T0.houseBOLNumber, T1.invoiceNumber
    //                     )
    //                 ) as        String(3)
    //             ) as ASN_Status, //  Preethi change defect 194 on 30/01

    //             cast(
    //                 MAX(
    //                     case ifnull(
    //                         T7.Action, 'S'
    //                     )
    //                         when
    //                             'S'
    //                         then
    //                             T11.INV_Status
    //                         else
    //                             ''
    //                     end
    //                 ) as        String(10)
    //             ) as BTP_InvoiceStatus,
    //             cast(
    //                 MAX(
    //                     case ifnull(
    //                         T8.Action, 'S'
    //                     )
    //                         when
    //                             'S'
    //                         then
    //                             T11.IBD_Status
    //                         else
    //                             ''
    //                     end
    //                 ) as        String(10)
    //             ) as BTP_IBDStatus,


    //             cast(
    //                 MAX(
    //                     T2.statusRemark
    //                 ) as        String(100)
    //             ) as statusRemark,
    //             cast(
    //                 MAX(
    //                     case ifnull(
    //                         T7.Action, 'S'
    //                     )
    //                         when
    //                             'S'
    //                         then
    //                             T11.Invoice
    //                         else
    //                             ''
    //                     end
    //                 ) as        String(10)
    //             ) as BTP_InvoiceNumber,
    //             cast(
    //                 MAX(
    //                     T2.DiversionFlag
    //                 ) as        String(10)
    //             ) as DiversionFlag,
    //             cast(
    //                 MIN(
    //                     T4.Po_Old
    //                 ) as        String(10)
    //             ) as Po_Old,
    //             cast(
    //                 MAX(
    //                     T1.paymentConditionCode
    //                 ) as        String(2)
    //             ) as paymentConditionCode,
    //             cast(
    //                 MAX(
    //                     T7.Action
    //                 ) as        String(2)
    //             ) as INV_Action,
    //             cast(
    //                 MAX(
    //                     T8.Action
    //                 ) as        String(2)
    //             ) as IBD_Action,
    //             cast(
    //                 MAX(
    //                     T9.Action
    //                 ) as        String(2)
    //             ) as GR_Action
    //     }
    //     group by
    //         T2.lineNumber,
    //         T3.orderItemNbr,
    //         T3.PASCOriginalPartsNbr,
    //         T0.houseBOLNumber,
    //         T1.invoiceNumber,
    //         T11.NewPurchasing_Order,
    //         T11.NewPOLine;

    entity Get_MNET_Diversion          as
        select from MNetStatusMonitoring as T10
        // Brahma Replaced query to get latest set of Record based on CreateDat
        // left join bolHeader as T0
        //    on T10.houseBOLNumber = T0.houseBOLNumber
        //    	AND	T10.ID = ( SELECT max(CAST( ifnull(TA.ID, 0) AS String)) AS LatestID FROM MNetStatusMonitoring AS TA
        // 	WHERE TA.houseBOLNumber = T0.houseBOLNumber
        // )
        inner join (
            select
                max(
                    T6_12.createdAt
                ) as CREATEDAT,
                max(
                    T6_12.ID
                ) as ID, // MNetStatusMonitoring Status ID is not same as BOL ID
                max(
                    T6_12.BOLID
                ) as BOLID,
                T7_13.houseBOLNumber,
                T7_13.importShipmentNumber,
                T7_13.initialDestination,
                T7_13.initialDestinationDescription,
                T7_13.initialDestinationETA,
                T7_13.transformCode,
                T7_13.ordererID
            from MNetStatusMonitoring as T6_12
            left join bolHeader as T7_13
                on  T6_12.houseBOLNumber = T7_13.houseBOLNumber
                and T6_12.BOLID          = T7_13.ID
            where
                T6_12.importShipmentNumber = T7_13.importShipmentNumber
            group by
                T7_13.houseBOLNumber,
                T7_13.importShipmentNumber,
                T7_13.initialDestination,
                T7_13.initialDestinationDescription,
                T7_13.initialDestinationETA,
                T7_13.transformCode,
                T7_13.ordererID
        ) as LatestStatusRecords
            on  T10.ID                   = LatestStatusRecords.ID
            and T10.houseBOLNumber       = LatestStatusRecords.houseBOLNumber
            and T10.importShipmentNumber = LatestStatusRecords.importShipmentNumber
        left join invoiceHeader as T1
            on  LatestStatusRecords.houseBOLNumber = T1.houseBOLNumber.houseBOLNumber
            and LatestStatusRecords.BOLID          = T1.houseBOLNumber.ID
        left join invoiceLine as T2
            on  T1.invoiceNumber                 =  T2.invoiceNumber.invoiceNumber
            and T1.houseBOLNumber.ID             =  T2.invoiceNumber.houseBOLNumber.ID
            and T1.houseBOLNumber.houseBOLNumber =  T2.invoiceNumber.houseBOLNumber.houseBOLNumber
            and T2.status                        in (
                'C', 'O', 'P', 'E', 'S'
            )
        // Brahma The Status 'S' is invalid and will never occur.
        left join additionalInvoiceLine as T3
            on  T2.partID                                      = T3.partID.partID
            and T2.invoiceNumber.houseBOLNumber.houseBOLNumber = T3.partID.invoiceNumber.houseBOLNumber.houseBOLNumber
            and T2.invoiceNumber.houseBOLNumber.ID             = T3.partID.invoiceNumber.houseBOLNumber.ID
            and T2.invoiceNumber.invoiceNumber                 = T3.partID.invoiceNumber.invoiceNumber
            and T2.lineNumber                                  = T3.partID.lineNumber
        inner join MNET_DiversionHeader as T11
            on  T2.invoiceNumber.houseBOLNumber.houseBOLNumber = T11.houseBOLNumber
            and T2.invoiceNumber.houseBOLNumber.ID             = T11.MNET_ID
            and T2.invoiceNumber.invoiceNumber                 = T11.MNET_No
            and T2.lineNumber                                  = T11.Mnet_Line
            and T2.containerID                                 = T11.Container_ID
            and T2.purchaseOrderNumber                         = T11.Purchase_order
            and T2.orderItemNbr                                = T11.PO_Line
        inner join MNET_DiversionDetail as T12
            on T11.ID = T12.ID.ID
        // left join POCrossRef as T4
        //     on T4.Po_Old = T2.purchaseOrderNumber
        //     and T4.PoItem_Old = T2.orderItemNbr
        left join ZMNETBUSINESS as T5
            on T5.ZBUSINESS_IND = T2.Zbusiness_indicator
        // left join ZMNETMODE as TM
        //     on TM.TMODE = T0.modeOfTransport

        distinct {
                cast(
                    (
                        LatestStatusRecords.BOLID
                    ) as     Integer
                ) as houseBOLNumber_ID,
            key cast(
                    (
                        LatestStatusRecords.importShipmentNumber
                    ) as     String(30)
                ) as Folder_No,

                cast(
                    (
                        LatestStatusRecords.houseBOLNumber
                    ) as     String(18)
                ) as BillofLanding,

                cast(
                    (
                        T2.invoiceNumber.invoiceNumber
                    ) as     String(16)
                ) as SupplierInvoice,
            key cast(
                    (
                        T2.lineNumber
                    ) as     String(30)
                ) as SupplierInvoice_Line,
                cast(
                    (
                        LatestStatusRecords.initialDestinationDescription
                    ) as     String(50)
                ) as initialDestinationDescription,

                cast(
                    (
                        LatestStatusRecords.CREATEDAT
                    ) as     Date
                ) as Received_Date,

                cast(
                    (
                        LatestStatusRecords.initialDestinationETA
                    ) as     Date
                ) as ETA,
                // Kowsalyaa changed for Process Date Blank issue for Header error
                cast(
                    (
                        IFNULL(
                            T10.modifiedAt, T10.createdAt
                        )
                    ) as     Date
                ) as ProcessDate,
                cast(
                    (
                        LatestStatusRecords.transformCode
                    ) as     String(10)
                ) as modeOfTransport,
                cast(
                    (
                        LatestStatusRecords.ordererID
                    ) as     String(20)
                ) as GlobalCompanyCode,
                cast(
                    (
                        LatestStatusRecords.initialDestination
                    ) as     String(20)
                ) as initialDestination,
                cast(
                    ('U') as String(1)
                ) as action,
                cast(
                    (
                        T2.Zbusiness_indicator
                    ) as     String(2)
                ) as shippingInfo,
                cast(
                    (
                        T12.NewPurchasing_Order
                    ) as     String(50)
                ) as Purchasing_order,
                cast(
                    (
                        T12.NewPOLine
                    ) as     String(5)
                ) as PO_Line,
                cast(
                    (
                        T12.Status
                    ) as     String(1)
                ) as status,
                cast(
                    (
                        T2.containerID
                    ) as     String(20)
                ) as containerID,
                cast(
                    (
                        case
                            when
                                length(
                                    RTRIM(
                                        SUBSTR(
                                            T2.partID, (
                                                INSTR(
                                                    T2.partID, '~', 1
                                                )+1
                                            ), (
                                                LOCATE(
                                                    T2.partID, '~', -1
                                                )-INSTR(
                                                    T2.partID, '~', 1
                                                )-1
                                            )
                                        )
                                    )
                                ) < 3
                            then
                                RTRIM(
                                    SUBSTR(
                                        T2.partID, 1, (
                                            INSTR(
                                                T2.partID, '~', 1
                                            )-1
                                        )
                                    )
                                )
                            else
                                RTRIM(
                                    SUBSTR(
                                        T2.partID, (
                                            INSTR(
                                                T2.partID, '~', 1
                                            )+1
                                        ), (
                                            LOCATE(
                                                T2.partID, '~', -1
                                            )-INSTR(
                                                T2.partID, '~', 1
                                            )-1
                                        )
                                    )
                                )
                        end
                    ) as     String(50)
                ) as buyerPartID,
                cast(
                    (
                        T3.PASCOriginalPartsNbr
                    ) as     String(17)
                ) as Original_Material,
                cast(
                    (
                        T12.ID.PO_Line
                    ) as     String(5)
                ) as Original_PO_Line, // defect 172 added original PO line on 05/03
                cast(
                    (
                        T12.NewQuantity
                    ) as     String(17)
                ) as quantity,
                cast(
                    (
                        case
                            when
                                IFNULL(
                                    T12.IBD_Status, 'X'
                                ) = 'X'
                                and IFNULL(
                                    T12.IBD_Action, 'X'
                                ) = 'X'
                            then
                                ' '
                            when
                                IFNULL(
                                    T12.IBD_Action, 'X'
                                ) = 'D'
                            then
                                ''
                            else
                                case IFNULL(
                                    T12.IBD_Status, 'X'
                                )
                                    when
                                        'S'
                                    then
                                        T12.IBD_Status
                                    else
                                        ''
                                end
                        end

                    ) as     String(10)
                ) as BTP_IBDStatus,
                cast(
                    (
                        T12.IBD_Action

                    ) as     String(2)
                ) as IBD_Action,
                cast(
                    (
                        case
                            when
                                IFNULL(
                                    T12.IBD_Status, 'X'
                                ) = 'X'
                                and IFNULL(
                                    T12.IBD_Action, 'X'
                                ) = 'X'
                            then
                                ' '
                            else
                                case
                                    when
                                        IFNULL(
                                            T12.IBD_Status, 'X'
                                        ) = 'S'
                                        and IFNULL(
                                            T12.IBD_Action, 'X'
                                        ) = 'C'


                                    then
                                        T12.Delivery
                                    else
                                        ''
                                end
                        end


                    ) as     String(10)
                ) as BTP_IBDNumber,
                cast(
                    case
                        when
                            IFNULL(
                                T12.IBD_Status, 'X'
                            ) = 'X'
                            and IFNULL(
                                T12.IBD_Action, 'X'
                            ) = 'X'
                        then
                            ' '
                        else
                            case
                                when
                                    IFNULL(
                                        T12.IBD_Status, 'X'
                                    ) = 'S'
                                    and IFNULL(
                                        T12.IBD_Action, 'X'
                                    ) = 'C'
                                then
                                    T12.IBD_Item
                                else
                                    ''
                            end
                    end as   String(10)
                ) as deliveryListItemNbr,
                cast(
                    (
                        T12.GR_Action
                    ) as     String(2)
                ) as GR_Action,
                cast(
                    (
                        case
                            when
                                IFNULL(
                                    T12.GR_Status, 'X'
                                ) = 'X'
                                and IFNULL(
                                    T12.GR_Action, 'X'
                                ) = 'X'
                            then
                                ' '
                            else
                                case
                                    when
                                        IFNULL(
                                            T12.GR_Status, 'X'
                                        ) = 'S'
                                        and IFNULL(
                                            T12.GR_Action, 'X'
                                        ) = 'C'


                                    then
                                        T12.Receipt
                                    else
                                        ''
                                end
                        end


                    ) as     String(10)

                ) as BTP_GRNumber,
                cast(
                    (
                        case
                            when
                                IFNULL(
                                    T12.GR_Status, 'X'
                                ) = 'X'
                                and IFNULL(
                                    T12.GR_Action, 'X'
                                ) = 'X'
                            then
                                ' '
                            else
                                case
                                    when
                                        IFNULL(
                                            T12.GR_Status, 'X'
                                        ) = 'S'
                                        and IFNULL(
                                            T12.GR_Action, 'X'
                                        ) = 'C'
                                    then
                                        T12.GR_Item
                                    else
                                        ''
                                end
                        end

                    ) as     String(10)
                ) as Receipt_Line,
                cast(
                    (
                        case
                            when
                                IFNULL(
                                    T12.INV_Status, 'X'
                                ) = 'X'
                                and IFNULL(
                                    T12.INV_Action, 'X'
                                ) = 'X'
                            then
                                ' '
                            when
                                IFNULL(
                                    T12.INV_Action, 'X'
                                ) = 'D'
                            then
                                ''
                            else
                                case IFNULL(
                                    T12.INV_Status, 'X'
                                )
                                    when
                                        'S'
                                    then
                                        T12.INV_Status
                                    else
                                        ''
                                end
                        end
                    ) as     String(10)
                ) as BTP_InvoiceStatus,
                cast(
                    (
                        T12.INV_Action
                    ) as     String(2)
                ) as INV_Action,
                cast(
                    (
                        case
                            when
                                IFNULL(
                                    T12.INV_Status, 'X'
                                ) = 'X'
                                and IFNULL(
                                    T12.INV_Action, 'X'
                                ) = 'X'
                            then
                                ' '
                            else
                                case
                                    when
                                        IFNULL(
                                            T12.INV_Status, 'X'
                                        ) = 'S'
                                        and IFNULL(
                                            T12.INV_Action, 'X'
                                        ) = 'C'
                                    then
                                        T12.Invoice
                                    else
                                        ''
                                end
                        end

                    ) as     String(10)
                ) as BTP_InvoiceNumber,
                cast(
                    (
                        case
                            when
                                IFNULL(
                                    T12.INV_Status, 'X'
                                ) = 'X'
                                and IFNULL(
                                    T12.INV_Action, 'X'
                                ) = 'X'
                            then
                                ' '
                            else
                                case
                                    when
                                        IFNULL(
                                            T12.INV_Status, 'X'
                                        ) = 'S'
                                        and IFNULL(
                                            T12.INV_Action, 'X'
                                        ) = 'C'
                                    then
                                        T12.INV_Item
                                    else
                                        ''
                                end
                        end
                    ) as     String(10)
                ) as invoiceItemNbr,
                cast(
                    (
                        case
                            when
                                T2.BTP_ASN_DI_Status = 'ET'
                            then
                                ''
                            else
                                T2.BTP_ASN_DI_Status
                        end
                    ) as     String(3)
                ) as ASN_Status,
                cast(
                    (
                        case
                            when
                                T2.BTP_ASN_DI_Status = 'EH'
                            then
                                ''
                            else
                                T2.BTP_ASN_DI_Status
                        end
                    ) as     String(3)
                ) as DI_Status,
                cast(
                    (
                        T2.statusRemark
                    ) as     String(100)
                ) as statusRemark,
                cast(
                    (
                        T1.supplierID
                    ) as     String(20)
                ) as Vender,
                cast(
                    (
                        T1.paymentConditionCode
                    ) as     String(2)
                ) as paymentConditionCode,
                cast(
                    (
                        T2.DiversionFlag
                    ) as     String(10)
                ) as DiversionFlag,
                cast(
                    (
                        T2.Zbusiness_indicator
                    ) as     String(10)
                ) as Zbusiness_indicator,
                cast(
                    ('') as  String(10)
                ) as Po_Old,
                cast(
                    ('') as  String(5)
                ) as PoItem_Old,
                cast(
                    (
                        T2.unitPrice
                    ) as     String(10)
                ) as UnitPrice,
                cast(
                    (
                        T2.partUnitOfMeasurement
                    ) as     String(10)
                ) as UOM,
                //SIT3 Def #26
                cast(
                    (
                        T12.ID.ID
                    ) as     Integer
                ) as DiversionId,
                //SIT3 Def #26
                T1.invoiceCurrencyCode


        };


    entity Get_MNET_Diversion_R        as
        select from bolHeader as T0
        inner join invoiceHeader as T1
            on  T0.houseBOLNumber = T1.houseBOLNumber.houseBOLNumber
            and T0.ID             = T1.houseBOLNumber.ID
        inner join invoiceLine as T2
            on  T1.invoiceNumber                 =  T2.invoiceNumber.invoiceNumber
            // Brahma Replaced query to include fields for join to avoid cartesian resultset .
            and T1.houseBOLNumber.ID             =  T2.invoiceNumber.houseBOLNumber.ID
            and T1.houseBOLNumber.houseBOLNumber =  T2.invoiceNumber.houseBOLNumber.houseBOLNumber
            and T2.status                        in (
                'C', 'O', 'P', 'E', 'S'
            )
        left join additionalInvoiceLine as T3
            on  T2.partID                                      = T3.partID.partID
            and T2.invoiceNumber.houseBOLNumber.houseBOLNumber = T3.partID.invoiceNumber.houseBOLNumber.houseBOLNumber
            and T2.invoiceNumber.houseBOLNumber.ID             = T3.partID.invoiceNumber.houseBOLNumber.ID
            and T2.invoiceNumber.invoiceNumber                 = T3.partID.invoiceNumber.invoiceNumber
            and T2.lineNumber                                  = T3.partID.lineNumber
        inner join MNET_DiversionHeader as T10
            on  T2.invoiceNumber.houseBOLNumber.ID             = T10.MNET_ID
            and T2.invoiceNumber.houseBOLNumber.houseBOLNumber = T10.houseBOLNumber
            and T2.invoiceNumber.invoiceNumber                 = T10.MNET_No
            and T2.lineNumber                                  = T10.Mnet_Line
            and T2.containerID                                 = T10.Container_ID
            and T2.purchaseOrderNumber                         = T10.Purchase_order
            and T2.orderItemNbr                                = T10.PO_Line
        inner join MNET_DiversionDetail as T11
            on T10.ID = T11.ID.ID
        left join ZMNETBUSINESS as T5
            on T5.ZBUSINESS_IND = T2.Zbusiness_indicator
        left join Get_PO as T12
            on  T2.purchaseOrderNumber = T12.PurchaseOrder
            and T2.orderItemNbr        = T12.PurchaseOrderItem
        left join MNetStatusMonitoring as T6
            on  T6.ObjectRefNo = T11.ASN_DI
            and T6.ObjectType  = 'ASN/DI'
            and T6.Status      = 'S'
        left join MNetStatusMonitoring as T7
            on  T7.ObjectRefNo = T11.Invoice
            and T7.ObjectType  = 'Invoice'
            and (
                   T7.Action = 'D'
                or T7.Action = 'R'
            )
            and T7.Status      = 'S'

        left join MNetStatusMonitoring as T8
            on  T8.ObjectRefNo = T11.Delivery
            and T8.ObjectType  = 'InboundDelivery'
            and (
                   T8.Action = 'D'
                or T8.Action = 'R'
                or T8.Action = 'L'
            )
            and T8.Status      = 'S'
        left join MNetStatusMonitoring as T9
            on  T9.ObjectRefNo = T11.Delivery
            and T9.ObjectType  = 'GoodsReceipt'
            and (
                   T9.Action = 'D'
                or T9.Action = 'R'
            )
            and T9.Status      = 'S'
        left join ZMNETMODE as TM
            on TM.TMODE = T0.modeOfTransport
        {
                cast(
                    MIN(
                        T0.ID
                    ) as        Integer
                ) as houseBOLNumber_ID,
                cast(
                    min(
                        T0.importShipmentNumber
                    ) as        String(30)
                ) as Folder_No,

                cast(
                    min(
                        T0.houseBOLNumber
                    ) as        String(18)
                ) as BillofLanding,

                cast(
                    MIN(
                        T1.invoiceNumber
                    ) as        String(16)
                ) as SupplierInvoice,

                cast(
                    MIN(
                        T0.initialDestinationDescription
                    ) as        String(50)
                ) as initialDestinationDescription,

                cast(
                    MIN(
                        T0.createdAt
                    ) as        Date
                ) as Received_Date,

                cast(
                    MAX(
                        T0.ETA
                    ) as        Date
                ) as ETA,
                cast(
                    MAX(
                        T2.BTP_InvoiceDate
                    ) as        Date
                ) as ProcessDate,
                cast(
                    MIN(
                        T0.transformCode
                    ) as        String(10)
                ) as modeOfTransport,
                cast(
                    MIN(
                        T0.ordererID
                    ) as        String(20)
                ) as GlobalCompanyCode,
                cast(
                    MIN(
                        T0.initialDestination
                    ) as        String(20)
                ) as initialDestination,
                cast(
                    MIN(
                        T1.invoiceNumber
                    ) as        String(16)
                ) as invoiceNumber,

                cast(
                    MIN(
                        T1.invoiceNumber
                    ) as        String(16)
                ) as invoiceNum,
            key cast(
                    MIN('U') as String(1)
                ) as action,
                cast(
                    MIN(
                        T2.Zbusiness_indicator
                    ) as        String(2)
                ) as shippingInfo,
                cast(
                    MIN(
                        T2.lineNumber
                    ) as        String(30)
                ) as SupplierInvoice_Line,
            key cast(
                    MIN(
                        T11.NewPurchasing_Order
                    ) as        String(50)
                ) as Purchasing_order,
            key cast(
                    MIN(
                        T11.NewPOLine
                    ) as        String(5)
                ) as PO_Line,
                cast(
                    MAX(
                        T11.Status
                    ) as        String(1)
                ) as status,
                cast(
                    MIN(
                        T2.containerID
                    ) as        String(20)
                ) as containerID,
                cast(
                    MIN(
                        GET_MNET_ITEM(
                            T2.partID
                        )
                    ) as        String(50)
                ) as buyerPartID,
                cast(
                    MIN(
                        T3.PASCOriginalPartsNbr
                    ) as        String(17)
                ) as Original_Material,
                cast(
                    case
                        when
                            T3.PASCOriginalPartsNbr is not null
                        then
                            MIN(
                                T3.orderItemNbr
                            )
                        else
                            ''
                    end as      String(5)
                ) as Original_PO_Line, // defect 172 added original PO line on 05/03
                cast(
                    MIN(
                        T2.quantity
                    ) as        String(17)
                ) as quantity,
                cast(
                    MAX(
                        case ifnull(
                            T8.Action, 'S'
                        )
                            when
                                'S'
                            then
                                T11.Delivery
                            else
                                ''
                        end
                    ) as        String(10)
                ) as BTP_IBDNumber,
                cast(
                    MAX(
                        case ifnull(
                            T8.Action, 'S'
                        )
                            when
                                'S'
                            then
                                T11.IBD_Item
                            else
                                ''
                        end
                    ) as        String(10)
                ) as deliveryListItemNbr,
                cast(
                    MAX(
                        case ifnull(
                            T9.Action, 'S'
                        )
                            when
                                'S'
                            then
                                T11.Receipt
                            else
                                ''
                        end
                    ) as        String(10)
                ) as BTP_GRNumber,
                cast(
                    MAX(
                        case ifnull(
                            T9.Action, 'S'
                        )
                            when
                                'S'
                            then
                                T11.GR_Item
                            else
                                ''
                        end
                    ) as        String(10)
                ) as Receipt_Line,
                cast(
                    MAX(
                        case ifnull(
                            T7.Action, 'S'
                        )
                            when
                                'S'
                            then
                                T11.INV_Item
                            else
                                ''
                        end
                    ) as        String(10)
                ) as invoiceItemNbr,
                cast(
                    MIN(
                        T1.supplierID,
                    ) as        String(20)
                ) as Vender,
                cast(
                    MAX(
                        case
                            when
                                T6.Message         = 'ASN/DI sent to FTP.'
                                and T5.ZDLVY_INSTR = 'Y'
                            then
                                'S'
                            else
                                ' '
                        end
                    ) as        String(1)
                ) as DI_Status,
                cast(
                    MAX(
                        case
                            when
                                T6.Message  = 'ASN/DI sent to FTP.'
                                and T5.ZASN = 'Y'
                            then
                                'S'
                            else
                                ' '
                        end
                    ) as        String(1)
                ) as ASN_Status,

                cast(
                    MAX(
                        case ifnull(
                            T7.Action, 'S'
                        )
                            when
                                'S'
                            then
                                T11.INV_Status
                            else
                                ''
                        end
                    ) as        String(10)
                ) as BTP_InvoiceStatus,
                cast(
                    MAX(
                        case ifnull(
                            T8.Action, 'S'
                        )
                            when
                                'S'
                            then
                                T11.IBD_Status
                            else
                                ''
                        end
                    ) as        String(10)
                ) as BTP_IBDStatus,
                cast(
                    MAX(
                        T2.statusRemark
                    ) as        String(100)
                ) as statusRemark,
                cast(
                    MAX(
                        case ifnull(
                            T7.Action, 'S'
                        )
                            when
                                'S'
                            then
                                T11.Invoice
                            else
                                ''
                        end
                    ) as        String(10)
                ) as BTP_InvoiceNumber,
                cast(
                    MAX(
                        T2.DiversionFlag
                    ) as        String(10)
                ) as DiversionFlag,
                cast(
                    ('') as     String(10)
                ) as Po_Old,
                cast(
                    MAX(
                        T1.paymentConditionCode
                    ) as        String(2)
                ) as paymentConditionCode,
                cast(
                    MAX(
                        T7.Action
                    ) as        String(2)
                ) as INV_Action,
                cast(
                    MAX(
                        T8.Action
                    ) as        String(2)
                ) as IBD_Action,
                cast(
                    MAX(
                        T9.Action
                    ) as        String(2)
                ) as GR_Action,
                cast(
                    MAX(
                        T2.unitPrice
                    ) as        String(10)
                ) as UnitPrice,
                cast(
                    MIN(
                        T2.partUnitOfMeasurement
                    ) as        String(10)
                ) as UOM,
                //SIT3 Def #26
                cast(
                    MAX(
                        T11.ID.ID
                    ) as        Integer
                ) as DiversionId,
                //SIT3 Def #26
                cast(
                    MAX(
                        T1.invoiceCurrencyCode
                    ) as        String(3)
                ) as invoiceCurrencyCode
        // cast(
        //    MIN (
        //         T2.extendedCost
        //     ) as        String(18)
        // ) as extendedCost,
        // cast(
        //    MIN (
        //         T3.qtyPerSLSUnitPricePackType,
        //     ) as        String(2)
        // ) as qtyPerSLSUnitPricePackType,
        // cast(
        //    MIN (
        //         T1.invoicedate ,
        //     ) as        Date
        // ) as invoicedate,
        // cast(
        //    MIN (
        //         TM.TRATY,
        //     ) as        String(4)
        // ) as TRATY


        }
        group by
            T2.lineNumber,
            T3.orderItemNbr,
            T3.PASCOriginalPartsNbr,
            T0.houseBOLNumber,
            T11.NewPurchasing_Order,
            T11.NewPOLine
        having
                ifnull(
                Min(
                    T12.SAP_Code
                ), 'X'
            ) =  'X'
            and max(
                T7.Action
            ) in ('D')
            and max(
                T8.Action
            ) in (
                'D', 'L'
            )
            or (
                ifnull(
                    Min(
                        T12.SAP_Code
                    ), 'X'
                ) <> 'X'
                and (
                        max(
                        T7.Action
                    ) in ('D')
                    and max(
                        T8.Action
                    ) in (
                        'D', 'L'
                    )
                    and max(
                        T9.Action
                    ) in ('R')
                )
            );

    entity Get_PO                      as
        select from A_PurchaseOrder as P1
        left join A_PurchaseOrderItem as P2
            on P1.PurchaseOrder = P2.PurchaseOrder.PurchaseOrder
        left join PurchaseGroup_GlobalCode as T3
            on P1.PurchasingOrganization = T3.PurchaseGroup
        left join PO_AdditionalData as P3
            on P1.PurchaseOrder = P3.PurchaseOrder
        left join PO_AdditionalData as P5
            on P1.PurchaseOrder = P5.PurchaseOrder
        left join ZCROSSREF as P4
            on(
                (
                    (
                        (
                            P4.Function_Code in (
                                'FG_DROP', 'PART_DROP'
                            )
                        )
                    )
                    and ifnull(
                        P4.SAP_Code, 'false'
                    ) = trim(
                        P2.Plant
                    )
                )
            )

        {
            cast(
                MIN(
                    P1.PurchaseOrder
                ) as   String(10)
            ) as PurchaseOrder,
            cast(
                MIN(
                    P2.PurchaseOrderItem
                ) as   String(5)
            ) as PurchaseOrderItem,
            cast(
                MIN(
                    P1.CompanyCode
                ) as   String(4)
            ) as CompanyCode,
            cast(
                MIN(
                    P1.Supplier
                ) as   String(10) // Added by Preethi on 17/01 for pt #10 175
            ) as Supplier,
            cast(
                MIN(
                    P1.PurchasingOrganization
                ) as   String(10)
            ) as PurchasingOrganization,
            cast(
                MIN(
                    P2.Plant
                ) as   String(4)
            ) as Plant,
            cast(
                (
                    P5.ShipmentMethod
                ) as   String(10)
            ) as ShippingMethodCode,
            cast(
                case
                    when
                        (
                            (
                                P4.Function_Code in (
                                    'FG_DROP', 'PART_DROP'
                                )
                            )
                            and ifnull(
                                P4.SAP_Code, 'false'
                            ) = trim(
                                P2.Plant
                            )
                        )
                    then
                        'Drop'
                    else
                        'Stock'
                end as String(10)
            ) as Stock_Drop, // added by Asif 22/01  190 defect
            cast(
                MIN(
                    P4.SAP_Code
                ) as   String(10)
            ) as SAP_Code,
            cast(
                (
                    P1.CustomerReferenceNumber
                ) as   String(10)
            ) as CustomerReferenceNumber, // Added Customer ref num by Nithya defect175_pt1
        }
        group by
            P1.PurchaseOrder,
            P5.ShipmentMethod,
            P2.PurchaseOrderItem,
            T3.PartIndicator,
            P4.Function_Code,
            P4.SAP_Code,
            P2.Plant,
            P1.CustomerReferenceNumber;

    //Preethi changed inner->left join @1311
    //changed to innner Join and added the ZCROSSREF to pick up the 'US14' for those PO's which is not available in A_purchaseorder
    entity GET_MNET_Data_Detail        as
            select from Get_MNET as T0
            left join Get_PO as T1
                on  T0.Purchasing_order = T1.PurchaseOrder
                and T0.PO_Line          = T1.PurchaseOrderItem
            inner join ZCROSSREF as TX
                on  TX.Function_Code = 'GLOBAL_CODE'
                and TX.Legacy_Code   = 'ACOUNTEE_CODE'
                and TX.Parameter1    = T0.GlobalCompanyCode
            inner join GetUserList as U1
                on  U1.CompanyCode = (
                    case
                        when
                            IFNULL(
                                T1.CompanyCode, 'X'
                            ) = 'X'
                        then
                            TX.Company_Code
                        else
                            T1.CompanyCode
                    end
                )
                and U1.PurchaseOrg = (
                    case
                        when
                            IFNULL(
                                T1.PurchasingOrganization, 'X'
                            ) = 'X'
                        then
                            TX.Parameter2
                        else
                            T1.PurchasingOrganization
                    end
                )

            {
                    // T0.extendedCost,
                    // T0.qtyPerSLSUnitPricePackType,
                    // T0.invoicedate,
                    // T0.TRATY,
                    T0.houseBOLNumber_ID,
                key T0.Folder_No,
                    T0.BillofLanding,
                key T0.SupplierInvoice,
                    T0.initialDestinationDescription,
                    T0.Received_Date,
                    T0.ETA,
                    T0.ProcessDate,
                    T0.modeOfTransport,
                    cast(
                        case
                            when
                                ifNULL(
                                    T1.CompanyCode, 'X'
                                ) = 'X'
                            then
                                U1.CompanyCode
                            else
                                T1.CompanyCode
                        end as   String(4)
                    )                      as CompanyCode,
                    // T1.CompanyCode,
                    T0.GlobalCompanyCode,
                    T0.initialDestination,
                    //     T0.invoiceNumber,
                    // key T0.invoiceNbr,
                    T0.action,
                    T0.shippingInfo, // Its a business indicator from invoice line
                key T0.SupplierInvoice_Line,
                key T0.Purchasing_order,
                key T0.PO_Line,
                    T0.status,
                    T0.containerID,
                    T0.buyerPartID,
                    T0.Original_Material,
                    T0.Original_PO_Line, //defect 172 on 05/03
                    T0.quantity,
                    T1.Plant,
                    T0.statusRemark,
                    T0.Po_Old,
                    T0.BTP_IBDNumber,
                    T0.BTP_IBDStatus,
                    T0.deliveryListItemNbr,
                    T0.BTP_InvoiceNumber,
                    T0.BTP_InvoiceStatus,
                    T0.invoiceItemNbr,
                    T0.BTP_GRNumber,
                    T0.Receipt_Line,
                    T1.CustomerReferenceNumber,
                    cast(
                        (
                            case
                                when
                                    T1.Stock_Drop = 'Stock'
                                then
                                    T0.ASN_Status
                                else
                                    ''
                            end
                        ) as     String(10)
                    )                      as ASN_Status, // Nithya added for defect_175_pt.4
                    T0.DI_Status,
                    T0.DiversionFlag,
                    cast(
                        (
                            T1.Supplier
                        ) as     String(20)
                    )                      as Vender, //  Added by Preethi on 17/01 for pt #10 175
                    T0.paymentConditionCode,
                    T1.ShippingMethodCode,
                    T1.Stock_Drop,
                    T0.UnitPrice,
                    T0.UOM,
                    //SIT3 Def #26
                    cast(
                        ('0') as Integer
                    )                      as DiversionId,
                    T0.invoiceCurrencyCode as CurrencyCode,
                    cast(
                        (
                            T0.IBD_Action
                        ) as     String(2)
                    )                      as IBD_Action,
                    cast(
                        (
                            T0.INV_Action
                        ) as     String(2)
                    )                      as INV_Action,
                    cast(
                        (
                            T0.GR_Action
                        ) as     String(2)
                    )                      as GR_Action

            // T1.VendorOrder

            }
        union all
            select from Get_MNET_Diversion as T0
            left join Get_PO as T1
                on  T0.Purchasing_order = T1.PurchaseOrder
                and T0.PO_Line          = T1.PurchaseOrderItem
            // inner join Get_MNET_Diversion as T3
            //   on T3.Purchasing_order = T0.Purchasing_order
            inner join ZCROSSREF as TX
                on  TX.Function_Code = 'GLOBAL_CODE'
                and TX.Legacy_Code   = 'ACOUNTEE_CODE'
                and TX.Parameter1    = T0.GlobalCompanyCode
            inner join GetUserList as U1
                on  U1.CompanyCode = (
                    case
                        when
                            IFNULL(
                                T1.CompanyCode, 'X'
                            ) = 'X'
                        then
                            TX.Company_Code
                        else
                            T1.CompanyCode
                    end
                )
                and U1.PurchaseOrg = (
                    case
                        when
                            IFNULL(
                                T1.PurchasingOrganization, 'X'
                            ) = 'X'
                        then
                            TX.Parameter2
                        else
                            T1.PurchasingOrganization
                    end
                )

            {
                    // T0.extendedCost,
                    // T0.qtyPerSLSUnitPricePackType,
                    // T0.invoicedate,
                    // T0.TRATY,
                    T0.houseBOLNumber_ID,
                key T0.Folder_No,
                    T0.BillofLanding,
                key T0.SupplierInvoice,
                    T0.initialDestinationDescription,
                    T0.Received_Date,
                    T0.ETA,
                    T0.ProcessDate,
                    T0.modeOfTransport,
                    cast(
                        case
                            when
                                ifNULL(
                                    T1.CompanyCode, 'X'
                                ) = 'X'
                            then
                                U1.CompanyCode
                            else
                                T1.CompanyCode
                        end as   String(4)
                    )                      as CompanyCode,
                    // T1.CompanyCode,
                    T0.GlobalCompanyCode,
                    T0.initialDestination,
                    // T0.invoiceNumber,
                    // key T0.invoiceNum,
                    T0.action,
                    T0.shippingInfo,
                key T0.SupplierInvoice_Line,
                key T0.Purchasing_order,
                key T0.PO_Line,
                    T0.status,
                    T0.containerID,
                    T0.buyerPartID,
                    T0.Original_Material,
                    T0.Original_PO_Line, //defect 172 on 05/03
                    T0.quantity,
                    T1.Plant,
                    T0.statusRemark,
                    T0.Po_Old,
                    T0.BTP_IBDNumber,
                    T0.BTP_IBDStatus,
                    T0.deliveryListItemNbr,
                    T0.BTP_InvoiceNumber,
                    T0.BTP_InvoiceStatus,
                    T0.invoiceItemNbr,
                    T0.BTP_GRNumber,
                    T0.Receipt_Line,
                    T1.CustomerReferenceNumber,
                    cast(
                        (
                            case
                                when
                                    T1.Stock_Drop = 'Stock'
                                then
                                    T0.ASN_Status
                                else
                                    ''
                            end
                        ) as     String(10)
                    )                      as ASN_Status, // Preethi added for defect_194_pt.1
                    T0.DI_Status,
                    cast(
                        null as  String(10)
                    )                      as DiversionFlag,
                    T0.Vender,
                    T0.paymentConditionCode,
                    T1.ShippingMethodCode,
                    T1.Stock_Drop,
                    T0.UnitPrice,
                    T0.UOM,
                    //SIT3 Def #26
                    cast(
                        (
                            T0.DiversionId
                        ) as     Integer
                    )                      as DiversionId,
                    T0.invoiceCurrencyCode as CurrencyCode,
                    cast(
                        (
                            T0.IBD_Action
                        ) as     String(2)
                    )                      as IBD_Action,
                    cast(
                        (
                            T0.INV_Action
                        ) as     String(2)
                    )                      as INV_Action,
                    cast(
                        (
                            T0.GR_Action
                        ) as     String(2)
                    )                      as GR_Action
            // T1.VendorOrder
            }
/* Brahma Not required       minus
           select from Get_MNET_Diversion_R as T0
           left join Get_PO as T1
               on T0.Purchasing_order = T1.PurchaseOrder
               and T0.PO_Line = T1.PurchaseOrderItem
           // inner join Get_MNET_Diversion_R as T3
           //   on T3.Purchasing_order = T0.Purchasing_order
          Inner Join  ZCROSSREF as TX
              on TX.Function_Code ='GLOBAL_CODE'
              and TX.Legacy_Code='ACOUNTEE_CODE'
              and TX.Parameter1 = T0.GlobalCompanyCode
           Inner Join GetUserList AS U1
             ON U1.CompanyCode =  ( CASE WHEN IFNULL(T1.CompanyCode, 'X') = 'X' THEN TX.Company_Code ELSE T1.CompanyCode END )
            AND U1.PurchaseOrg = ( CASE WHEN IFNULL(T1.PurchasingOrganization, 'X') = 'X'  THEN TX.Parameter2 ELSE T1.PurchasingOrganization END )

           {
                   // T0.extendedCost,
                   // T0.qtyPerSLSUnitPricePackType,
                   // T0.invoicedate,
                   // T0.TRATY,
                   T0.houseBOLNumber_ID,
                   T0.Folder_No,
                   T0.BillofLanding,
                   T0.SupplierInvoice,
                   T0.initialDestinationDescription,
                   T0.Received_Date,
                   T0.ETA,
                   T0.ProcessDate,
                   T0.modeOfTransport,
                   CAST(
                       CASE
                            when
                              ifNULL(T1.CompanyCode, 'X') = 'X'
                              then
                              U1.CompanyCode
                             else
                             T1.CompanyCode
                           end
                   AS String(4)
                   ) AS CompanyCode,
                   // T1.CompanyCode,
                   T0.GlobalCompanyCode,
                   T0.initialDestination,
                   // T0.invoiceNumber,
                   // T0.invoiceNum,
               key T0.action,
                   T0.shippingInfo,
                   T0.SupplierInvoice_Line,
               key T0.Purchasing_order,
               key T0.PO_Line,
                   T0.status,
                   T0.containerID,
                   T0.buyerPartID,
                   T0.Original_Material,
                   T0.Original_PO_Line, // defect 172 on 05/03
                   T0.quantity,
                   T1.Plant,
                   T0.statusRemark,
                   T0.Po_Old,
                   T0.BTP_IBDNumber,
                   T0.BTP_IBDStatus,
                   T0.deliveryListItemNbr,
                   T0.BTP_InvoiceNumber,
                   T0.BTP_InvoiceStatus,
                   T0.invoiceItemNbr,
                   T0.BTP_GRNumber,
                   T0.Receipt_Line,
                   T1.CustomerReferenceNumber,
                   T0.ASN_Status,
                   T0.DI_Status,
                   cast(
                       null as String(10)
                   ) as DiversionFlag,
                   T0.Vender,
                   T0.paymentConditionCode,
                   T1.ShippingMethodCode,
                   T1.Stock_Drop,
                   T0.UnitPrice,
                   T0.UOM,
                    //SIT3 Def #26
                    cast(
                       (
                           T0.DiversionId
                       ) as    Integer
                   ) as DiversionId,
                   T0.invoiceCurrencyCode as CurrencyCode,
                   cast( (T0.IBD_Action) as String(2)) as IBD_Action,
                   cast( (T0.INV_Action) as String(2)) as INV_Action,
                   cast( (T0.GR_Action) as String(2)) as GR_Action
           };*/


};