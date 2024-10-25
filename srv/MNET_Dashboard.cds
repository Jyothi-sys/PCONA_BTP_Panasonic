using BTP.Panasonic as BTP from '../db/data-model';
using MNET_DASHBOARD_GET_MNET_DATA_LIST_HDR_VIEW as MNET_DASHBOARD_GET_MNET_DATA_LIST_HDR_VIEW from '../db/data-model';


service MNET_Dashboard @(path: '/factoryint/mnet-dashboard') {
    entity Environment                     as projection on BTP.Environment;
    entity bolHeader                       as projection on BTP.bolHeader;
    entity invoiceHeader                   as projection on BTP.invoiceHeader;
    entity invoiceLine                     as projection on BTP.invoiceLine;
    entity A_PurchaseOrderItem             as projection on BTP.A_PurchaseOrderItem;
    entity A_PurchaseOrder                 as projection on BTP.A_PurchaseOrder;
    entity PurchaseGroup_GlobalCode        as projection on BTP.PurchaseGroup_GlobalCode;
    entity MNetStatusMonitoring            as projection on BTP.MNetStatusMonitoring;
    entity ZMNETMODE                       as projection on BTP.ZMNETMODE;
    entity additionalInvoiceLine           as projection on BTP.additionalInvoiceLine;
    entity POCrossRef                      as projection on BTP.POCrossRef;
    entity ZCROSSREF                       as projection on BTP.ZCROSSREF;
    entity A_PurOrdAccountAssignment       as projection on BTP.A_PurOrdAccountAssignment;
    entity ZMNETBUSINESS                   as projection on BTP.ZMNETBUSINESS;
    entity UserAssignment                  as projection on BTP.UserAssignment;
    entity PO_AdditionalData               as projection on BTP.PO_AdditionalData;
    entity MNET_DiversionDetail            as projection on BTP.MNET_DiversionDetail;
    entity MNET_DiversionHeader            as projection on BTP.MNET_DiversionHeader;
    entity MNET_ACTION                     as projection on BTP.MNET_ACTION;
    entity MNET_DeliveryDocumentItem       as projection on BTP.MNET_DeliveryDocumentItem;
    entity MNET_SuplrInvcItemPurOrdRef     as projection on BTP.MNET_SuplrInvcItemPurOrdRef;
    entity GET_MNET_Data_List_Hdr          as projection on MNET_DASHBOARD_GET_MNET_DATA_LIST_HDR_VIEW;
     //31-07-2024 --Preethi -- Service to update the status of Parent line during diversion based on child line status and update the execution log of Parent Line on reprocess 
    action UpdateParentStatus(BOLID : Integer,houseBOLNumber : String,containerID : String,invID : String,NewPO : String,NewPOLine : String,lineNumber:String)returns Boolean;
    action GR_Posting(invID : String(18), InvLine : String(30), houseBOLNumber : String(18), purchaseOrderNumber : String(50), ID : Integer, ActID : String(1), DiversionId : Integer, PurchaseOrderItem : String(5))      returns Boolean;
    action Invoice_Posting(invID : String(18), InvLine : String(30), houseBOLNumber : String(18), purchaseOrderNumber : String(50), ID : Integer, ActID : String(1), DiversionId : Integer, PurchaseOrderItem : String(5)) returns Boolean;
    action Inbound_Posting(invID : String(18), InvLine : String(30), houseBOLNumber : String(18), purchaseOrderNumber : String(50), ID : Integer, ActID : String(1), DiversionId : Integer, PurchaseOrderItem : String(5)) returns Boolean;
    action ASN_DIPosting(invID : String(18), houseBOLNumber : String(18), purchaseOrderNumber : String(50),IBDNum: String(10),IBDLineNum:String(10) /* orderItemNbr : String(50)*/)                                                                                 returns Boolean;
     action VALIDATE_MNET_ACTION(Folder_No: String(30) ,houseBOLNumber : String(18), purchaseOrderNumber : String(50), ID : Integer, containerID : String(18), invID : String(18), potype : String(10), payconcode : String(2))                    returns String;

    /*
        Diverted Line Reporcess Scenario
        04-06-2024
        Bhushan
        CS
        */
    entity GET_MNET_DeliveryDocumentItem   as
        select from MNET_DeliveryDocumentItem as T0
        inner join invoiceLine as T1
            on  T0.INVID      = T1.invoiceNumber.invoiceNumber
            and T0.BOL        = T1.invoiceNumber.houseBOLNumber.houseBOLNumber
            and T0.BOLID      = T1.invoiceNumber.houseBOLNumber.ID
            and T0.lineNumber = T1.lineNumber
            and T0.CONID      = T1.containerID
        inner join additionalInvoiceLine as T2
            on  T1.partID     = T2.partID.partID
            and T0.INVID      = T2.partID.invoiceNumber.invoiceNumber
            and T0.BOL        = T2.partID.invoiceNumber.houseBOLNumber.houseBOLNumber
            and T0.BOLID      = T2.partID.invoiceNumber.houseBOLNumber.ID
            and T0.lineNumber = T2.partID.lineNumber
        //   and T0.CONID          = T2.partID.containerID
        inner join A_PurchaseOrderItem as T3
            on  T0.PurchaseOrder     = T3.PurchaseOrder.PurchaseOrder
            and T0.PurchaseOrderItem = T3.PurchaseOrderItem

        distinct {
            T0.BOLID,
            T0.BOL,
            T0.INVID,
            T0.CONID,
            T0.PO,
            T0.Action,
            T0.IBD_NO,
            T0.IBD_LINE,
            T0.lineNumber,
            T0.Material,
            T0.PurchaseOrder,
            T0.PurchaseOrderItem,
            T0.QuantityInPurchaseOrderUnit,
            T0.ActualDeliveryQuantity,
            T0.Batch,
            T0.Plant,
            T0.ReferenceSDDocument,
            T0.ReferenceSDDocumentItem,
            T0.InventoryValuationType,
            T1.status,
            T2.PASCOriginalPartsNbr,
            T2.orderItemNbr as PASCOrderItemNbr,
            T3.SupplierMaterialNumber,
            T1.supplierPartID
        //   T1.BTP_IBDStatus,
        //   T1.BTP_IBDAction
        }
        where
            T1.status in (
                'C', 'H', 'O', 'P', 'E'
            );

    entity GET_MNET_SuplrInvcItemPurOrdRef as
        select from MNET_SuplrInvcItemPurOrdRef as T0
        inner join A_PurchaseOrderItem as T1
            on  T0.PurchaseOrder     = T1.PurchaseOrder.PurchaseOrder
            and T0.PurchaseOrderItem = T1.PurchaseOrderItem
        distinct {
            T0.BOLID,
            T0.BOL,
            T0.INVID,
            T0.CONID,
            T0.PO,
            T0.Action,
            T0.IBD_LINE,
            T0.lineNumber,
            T0.Material,
            T0.PurchaseOrder,
            T0.PurchaseOrderItem,
            T0.SupplierInvoiceItem,
            T0.Plant,
            T0.TaxCode,
            T0.DocumentCurrency,
            T0.SupplierInvoiceItemAmount,
            T0.PurchaseOrderQuantityUnit,
            T0.QuantityInPurchaseOrderUnit,
            T0.SupplierInvoiceItemText,
            T1.SupplierMaterialNumber
        };

    entity GET_PO_DATA                     as
        select from A_PurchaseOrderItem as P1
        left join ZCROSSREF as P2
            on P1.Plant = P2.SAP_Code
        {
            P1.PurchaseOrder.PurchaseOrder,
            P1.PurchaseOrderItem,
            P1.Plant,
            P1.PurchaseOrder.CompanyCode,
            P1.OrderQuantity,
            P1.NetPriceAmount,
            P1.StorageLocation,
            P1.PurchaseOrder.Supplier,
            P1.Material,
            cast(
                case ifnull(
                    P2.SAP_Code, 'X'
                )
                    when
                        'X'
                    then
                        'S'
                    else
                        'D'
                end as String(1)
            ) as POType
        };

    /*
Diverted Line Reporcess Scenario
04-06-2024
Bhushan
CE
*/
    entity GetUserList                     as
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


    // entity GET_MNET_Data_List_Hdr      as
    //     select from MNetStatusMonitoring as T4
    //     left outer join bolHeader as T0
    //         on T4.houseBOLNumber = T0.houseBOLNumber
    //         AND	T4.ID = ( SELECT max(CAST( ifnull(TA.ID, 0) AS String)) AS LatestID FROM MNetStatusMonitoring AS TA
    // 		WHERE TA.houseBOLNumber = T0.houseBOLNumber

    // 	)
    //     left join invoiceHeader AS T1
    // 	    on T0.houseBOLNumber = T1.houseBOLNumber.houseBOLNumber
    // 	    and T0.ID = T1.houseBOLNumber.ID

    //     left join invoiceLine as T2
    //         on T0.ID = T2.invoiceNumber.houseBOLNumber.ID
    //         and T1.invoiceNumber = T2.invoiceNumber.invoiceNumber
    //         and T0.houseBOLNumber = T2.invoiceNumber.houseBOLNumber.houseBOLNumber
    //     left join A_PurchaseOrder as P1
    //         on T2.purchaseOrderNumber = P1.PurchaseOrder
    //     left join A_PurchaseOrderItem as P2
    //         on T2.purchaseOrderNumber = P2.PurchaseOrder.PurchaseOrder
    //     inner join GetUserList as U1
    //         on  U1.CompanyCode = P1.CompanyCode
    //         and U1.PurchaseOrg = P1.PurchasingOrganization
    //     left outer join (
    //         select
    //         max(
    //             C.ID
    //         )                               as max_id,
    //         C.houseBOLNumber                as v_bol_number
    //         from bolHeader as C group by C.ID, C.houseBOLNumber
    //     ) as T0B
    //         on  T0B.max_id       = T4.BOLID
    //         and T0B.v_bol_number = T4.houseBOLNumber
    //     inner join (
    //         select
    //         Max(
    //             T0A.ID
    //         )                               as Max_ID,

    //         T2A.invoiceNumber.invoiceNumber as M_INVOICE,
    //         T0A.importShipmentNumber        as Folder_NO

    //         from bolHeader as T0A
    //         inner join invoiceLine as T2A
    //             on T2A.invoiceNumber.houseBOLNumber.houseBOLNumber = T0A.houseBOLNumber
    //             and T2A.invoiceNumber.houseBOLNumber.ID = T0A.ID
    //         group by T0A.importShipmentNumber,  T2A.invoiceNumber.invoiceNumber
    //     ) as LatestBOL
    //         on  T0.importShipmentNumber        = LatestBOL.Folder_NO

    //         and T0.ID                          = LatestBOL.Max_ID

    //         and T2.invoiceNumber.invoiceNumber = M_INVOICE
    //     distinct {
    //         cast(
    //             (
    //                 T0.ID
    //             ) as Integer
    //         )                               as houseBOLNumber_ID,
    //     key cast(
    //             (
    //                 T0.importShipmentNumber
    //             ) as String(30)
    //         )                               as importShipmentNumber,
    //     key cast(
    //             (
    //                 T4.houseBOLNumber
    //             ) as String(18)
    //         )                               as BillofLading,
    //         cast(
    //                 (
    //                    T0.fileName
    //                 ) as         String(100)
    //             ) as FileName,
    //         cast(
    //             (
    //                 T2.invoiceNumber.invoiceNumber
    //             ) as String(16)
    //         )                               as SupplierInvoice,
    //         cast(
    //             GET_MNET_STATUS1(
    //                 T4.houseBOLNumber, T2.invoiceNumber.invoiceNumber
    //             ) as String(1)
    //         )                               as status,
    //     key cast(
    //             (
    //                 T2.action
    //             ) as String(1)
    //         )                               as Action,
    //         //Added Action from invoiceline, initially it was taken from Mnetstatusmonitoring on 24/04
    //     key cast(
    //             (
    //                 T0.createdAt
    //             ) as Date
    //         )                               as Received_Date,
    //         cast(
    //             (
    //                 T0.initialDestinationETA
    //             ) as Date
    //         )                               as ETA,
    //         cast(
    //             (
    //                 T4.modifiedAt
    //             ) as Date
    //         )                               as ProcessDate,
    //         cast(
    //             (
    //                 T2.BTP_InvoiceDate
    //             ) as Date
    //         )                               as MPro_Date,
    //         cast(
    //             (
    //                 T0.representOrderNbr
    //             ) as String(25)
    //         )                               as PurchaseOrder,
    //         cast(
    //             (
    //                 P1.CompanyCode
    //             ) as String(4)
    //         )                               as CompanyCode,
    //         cast(
    //             (
    //                 T0.ordererID
    //             ) as String(20)
    //         )                               as GlobalCompanyCode,
    //         cast(
    //             (
    //                 T0.transformCode
    //             ) as String(10)
    //         )                               as MethodofShipment,
    //         cast(
    //             (
    //                 T0.initialDestination
    //             ) as String(20)
    //         )                               as initialDestination

    //     }

    //         ;

    // entity GET_MNET_Data_List_Hdr          as
    //     select from MNetStatusMonitoring as T4
    //     inner join (
    //         (
    //             select
    //                 max(
    //                     TA_12.createdAt
    //                 ) as CREATEDAT,
    //                 max(
    //                     TA_12.ID
    //                 ) as ID,
    //                 max(
    //                     TA_12.BOLID
    //                 ) as BOLID,
    //                 TB_13.houseBOLNumber,
    //                 TB_13.importShipmentNumber,
    //                 TB_13.initialDestination,
    //                 TB_13.initialDestinationDescription,
    //                 TB_13.initialDestinationETA,
    //                 TB_13.transformCode,
    //                 TB_13.ordererID,
    //                 TB_13.fileName,
    //                 TB_13.representOrderNbr,
    //                 CAST( ifnull(TC_14.Company_Code,'DUMMY') AS String(4)) AS CompanyCode,								
	// 				CAST( ifnull(TC_14.Parameter2,'DUMMY') AS String(4)) AS PurchasingOrganization
    //             from MNetStatusMonitoring as TA_12
    //             left outer join bolHeader as TB_13
    //                 on  TA_12.houseBOLNumber = TB_13.houseBOLNumber
    //                 and TA_12.BOLID          = TB_13.ID
    //             left outer join	ZCROSSREF AS TC_14
	// 				on TC_14.Function_Code = 'GLOBAL_CODE' and TC_14.Legacy_Code = 'ACOUNTEE_CODE'
    //             where
    //                 TA_12.importShipmentNumber = TB_13.importShipmentNumber
    //             group by
    //                 TB_13.houseBOLNumber,
    //                 TB_13.importShipmentNumber,
    //                 TB_13.initialDestination,
    //                 TB_13.initialDestinationDescription,
    //                 TB_13.initialDestinationETA,
    //                 TB_13.transformCode,
    //                 TB_13.ordererID,
    //                 TB_13.fileName,
    //                 TB_13.representOrderNbr,
    //                 TC_14.Company_Code,
	// 				TC_14.Parameter2
    //         )
    //     ) as LatestStatusRecords
    //         on  T4.ID                   = LatestStatusRecords.ID
    //         and T4.houseBOLNumber       = LatestStatusRecords.houseBOLNumber
    //         and T4.importShipmentNumber = LatestStatusRecords.importShipmentNumber
    //     left join invoiceLine as T2
    //         on  LatestStatusRecords.BOLID          = T2.invoiceNumber.houseBOLNumber.ID
    //         and LatestStatusRecords.houseBOLNumber = T2.invoiceNumber.houseBOLNumber.houseBOLNumber
    //     left join A_PurchaseOrder as P1
    //         on T2.purchaseOrderNumber = P1.PurchaseOrder
    //     //left join A_PurchaseOrderItem as P2                       // Brahma Not Used 
    //     //    on T2.purchaseOrderNumber = P2.PurchaseOrder.PurchaseOrder
    //     // Brahma The join to GetUserList should consider Default data, if PurchaseOrder does not exist in S4
    //     inner join GetUserList as U1
    //         on ifnull(P1.CompanyCode, LatestStatusRecords.CompanyCode) = U1.CompanyCode
    //         and ifnull(P1.PurchasingOrganization, LatestStatusRecords.PurchasingOrganization )  = U1.PurchaseOrg          
    //       //on  U1.CompanyCode = P1.CompanyCode
    //       //and U1.PurchaseOrg = P1.PurchasingOrganization
    //       // Brahma Inner Join below will not pick up conditions where the whole BOL was rejected and an error logged in MnetStatusMonitoring.
    //     //inner join (
    //     left join (
    //         select
    //             Max(
    //                 T0A.ID
    //             )                               as Max_ID,

        //         T2A.invoiceNumber.invoiceNumber as M_INVOICE,
        //         T0A.importShipmentNumber        as Folder_NO

        //     from bolHeader as T0A
        //     inner join invoiceLine as T2A
        //         on  T2A.invoiceNumber.houseBOLNumber.houseBOLNumber = T0A.houseBOLNumber
        //         and T2A.invoiceNumber.houseBOLNumber.ID             = T0A.ID
        //     group by
        //         T0A.importShipmentNumber,
        //         T2A.invoiceNumber.invoiceNumber
        // ) as LatestBOL
        //      // Removed check for ImportShipmentNumber as BOLID is associated with an Importshipment Number
        //     on  /*LatestStatusRecords.importShipmentNumber        = LatestBOL.Folder_NO    and 
        //      LatestStatusRecords.BOLID      = LatestBOL.Max_ID */
        //     T2.invoiceNumber.houseBOLNumber.ID = LatestBOL.Max_ID    
        //     and T2.invoiceNumber.invoiceNumber = LatestBOL.M_INVOICE
        // distinct {
        //         cast(
        //             (
        //                 LatestStatusRecords.BOLID
        //             ) as Integer
        //         ) as houseBOLNumber_ID,
        //     key cast(
        //             (
        //                 LatestStatusRecords.importShipmentNumber
        //             ) as String(30)
        //         ) as importShipmentNumber,
        //     key cast(
        //             (
        //                 T4.houseBOLNumber
        //             ) as String(18)
        //         ) as BillofLading,
        //         cast(
        //             (
        //                 LatestStatusRecords.fileName
        //             ) as String(100)
        //         ) as FileName,
        //         cast(
        //             (
        //                 T2.invoiceNumber.invoiceNumber
        //             ) as String(16)
        //         ) as SupplierInvoice,
        //         cast(
        //             GET_MNET_STATUS1(
        //                 T4.houseBOLNumber, T2.invoiceNumber.invoiceNumber
        //             ) as String(1)
        //         ) as status,
        //     key cast(
        //             (
        //                 T2.action
        //             ) as String(1)
        //         ) as

        //     action,
        //         //Added Action from invoiceline, initially it was taken from Mnetstatusmonitoring on 24/04
        //     key cast(
        //             (
        //                 LatestStatusRecords.CREATEDAT
        //             ) as Date
        //         ) as Received_Date,
        //         cast(
        //             (
        //                 LatestStatusRecords.initialDestinationETA
        //             ) as Date
        //         ) as ETA,
        //         cast(
        //                 (
        //                     ifnull(  T4.modifiedAt, T4.createdAt )
        //              )as         Date
        //         ) as ProcessDate,
        //         cast(
        //             (
        //                 T2.BTP_InvoiceDate
        //             ) as Date
        //         ) as MPro_Date,
        //         cast(
        //             (
        //                 LatestStatusRecords.representOrderNbr
        //             ) as String(25)
        //         ) as PurchaseOrder,
        //         cast(
        //             (
        //                 P1.CompanyCode
        //             ) as String(4)
        //         ) as CompanyCode,
        //         cast(
        //             (
        //                 LatestStatusRecords.ordererID
        //             ) as String(20)
        //         ) as GlobalCompanyCode,
        //         cast(
        //             (
        //                 LatestStatusRecords.transformCode
        //             ) as String(10)
        //         ) as MethodofShipment,
        //         cast(
        //             (
        //                 LatestStatusRecords.initialDestination
        //             ) as String(20)
        //         ) as initialDestination

        // }

        // ;


    // added  join on 23/01 for defect 186 by Preethi
    // Defect 232 Brahma - Add logic to get latest data for latest BOLID related to BOLHeader.Also commented out redundant criteria.
    // entity GetGRData                   as
    //     select from GET_MNET_DATA as T0
    //     inner join MNetStatusMonitoring as T1
    //         on  T0.houseBOLNumber = T1.houseBOLNumber
    //         and T0.invoiceNumber  = T1.invoiceNumber
    //         and T0.containerID    = T1.containerID
    //     inner join invoiceHeader as T6
    //         on  T0.houseBOLNumber = T6.houseBOLNumber.houseBOLNumber
    //         and T0.ID             = T6.houseBOLNumber.ID
    //     inner join invoiceLine as T4
    //         on  T0.houseBOLNumber = T4.invoiceNumber.houseBOLNumber.houseBOLNumber
    //         and T0.invoiceNumber  = T4.invoiceNumber.invoiceNumber
    //         AND T0.ID = T4.invoiceNumber.houseBOLNumber.ID
    //         AND T0.lineNumber = T4.lineNumber
    //         and T0.purchaseOrderNumber = T4.purchaseOrderNumber
    //         and (
    //                T4.BTP_GRNumber =  ''
    //             or T4.BTP_GRNumber is null
    //         )
    //         and (
    //                T4.BTP_IBDNumber <>     ''
    //             or T4.BTP_IBDNumber is not null
    //         )
    //     inner join ZMNETBUSINESS as T5
    //         on T4.Zbusiness_indicator = T5.ZBUSINESS_IND
    //     distinct {
    //         T0.ID,
    //         T0.houseBOLNumber,
    //         T0.invoiceNumber,
    //         T0.containerID,
    //         T0.purchaseOrderNumber,
    //         T1.ObjectRefNo           as deliveryDocument,
    //         T0.initialDestinationETA as ETA
    //     }
    //     where
    //             T0.ID         in (
    //             select MAX(
    //                 T7.ID
    //             ) as v_BOLid from bolHeader as T7
    //             where
    //                 T7.houseBOLNumber = T0.houseBOLNumber
    //         )
    //         and T1.ObjectType =  'InboundDelivery'
    //         and T1.Status     =  'S'
    //         and T0.POType     =  'D'
    //         and not           exists(select 1 as ID from MNetStatusMonitoring as T2
    //         where
    //                 T1.houseBOLNumber =  T2.houseBOLNumber
    //             and T1.invoiceNumber  =  T2.invoiceNumber
    //             and T1.containerID    =  T2.containerID
    //             and T1.ObjectRefNo    =  T2.ObjectRefNo
    //             and T2.ObjectType     =  'GoodsReceipt'
    //             and T2.Status         =  'S'
    //             and IFNULL(
    //                 T2.GR_NO, ''
    //             )                     != ''
    //             and T2.Action         =  'C'
    //         )
    //         and (
    //             (
    //                     T5.ZGOODS_RECEIPT <> ''
    //                 and T5.ZGOODS_RECEIPT <> 'N'
    //             )
    //             and (
    //                 (
    //                         T5.ZGOODS_RECEIPT        =  'Y'
    //                     and T0.initialDestinationETA <= CURRENT_DATE
    //                 )
    //                 or T5.ZGOODS_RECEIPT = '0'
    //                 or (
    //                     ADD_DAYS(
    //                         T0.initialDestinationETA, -1 * (
    //                             case T5.ZGOODS_RECEIPT
    //                                 when
    //                                     'Y'
    //                                 then
    //                                     0
    //                                 else
    //                                     T5.ZGOODS_RECEIPT
    //                             end
    //                         )
    //                     ) <= CURRENT_DATE
    //                 )
    //             )
    //         );


    entity GetGRData                       as
        select from GET_MNET_DATA as T0
        inner join invoiceLine as T4
            on  T0.houseBOLNumber      =  T4.invoiceNumber.houseBOLNumber.houseBOLNumber
            and T0.invoiceNumber       =  T4.invoiceNumber.invoiceNumber
            and T0.purchaseOrderNumber =  T4.purchaseOrderNumber
            and T0.ID                  =  T4.invoiceNumber.houseBOLNumber.ID
            and T0.lineNumber          =  T4.lineNumber
            and T4.status              =  'E'
            and T4.BTP_GRStatus        =  'E'
            and (
                   T4.BTP_GRNumber is null
                or T4.BTP_GRNumber =  ''
            )
            // and not
            //               (
            //       T4.BTP_GRNumber <>     ''
            //   and T4.BTP_GRNumber is not null
            // )
            // and not               (
            //       T4.BTP_GRStatus <>     ''
            //   and T4.BTP_GRStatus is not null
            // )
            and (
                    T4.BTP_IBDAction <> 'D'
                and T4.BTP_IBDAction <> 'L'
            )
            and T4.BTP_IBDStatus       <> 'E'
            and (
                    T4.BTP_IBDNumber <>     ''
                and T4.BTP_IBDNumber is not null
            )
        inner join ZMNETBUSINESS as T5
            on  T4.Zbusiness_indicator = T5.ZBUSINESS_IND
            and T0.POType              = 'D'
            and (
                    T5.ZGOODS_RECEIPT <> ''
                and T5.ZGOODS_RECEIPT <> 'N'
            )
            and (
                (
                        T5.ZGOODS_RECEIPT        =  'Y'
                    and T0.initialDestinationETA <= CURRENT_DATE
                )
                or T5.ZGOODS_RECEIPT = '0'
                or (
                    ADD_DAYS(
                        T0.initialDestinationETA, -1 * case T5.ZGOODS_RECEIPT
                                                           when
                                                               'Y'
                                                           then
                                                               0
                                                           else
                                                               T5.ZGOODS_RECEIPT
                                                       end
                    ) <= CURRENT_DATE
                )
            )
        distinct {
            T0.ID,
            T0.houseBOLNumber,
            T0.invoiceNumber,
            T0.containerID,
            T0.purchaseOrderNumber,
            T4.BTP_IBDNumber         as deliveryDocument,
            T0.initialDestinationETA as ETA,
            T0.importShipmentNumber

        }
        where
            (
                T0.ID in (
                    select MAX(
                        T1.ID
                    ) as v_BOLid from bolHeader as T1
                    inner join invoiceHeader as T7
                        on T1.ID = T7.houseBOLNumber.ID
                        and T1.houseBOLNumber = T7.houseBOLNumber.houseBOLNumber
                    inner join invoiceLine as T8
                        on  T8.invoiceNumber.invoiceNumber                 =  T7.invoiceNumber
                        and T8.invoiceNumber.houseBOLNumber.ID             =  T7.houseBOLNumber.ID
                        and T8.invoiceNumber.houseBOLNumber.houseBOLNumber =  T7.houseBOLNumber.houseBOLNumber
                        and not                                            (
                                T8.BTP_GRNumber <>     ''
                            and T8.BTP_GRNumber is not null
                        )
                        and                                             (
                                T8.BTP_GRStatus <>     'S'
                        )
                        and (
                                T8.BTP_IBDAction <> 'D'
                            and T8.BTP_IBDAction <> 'L'
                        )
                        and T8.BTP_IBDStatus                               <> 'E'
                        and (
                                T8.BTP_IBDNumber <>     ''
                            and T8.BTP_IBDNumber is not null
                        )
                    where
                        T7.invoiceNumber = T0.invoiceNumber
                )
            )
        order by
            deliveryDocument asc ,
            T0.ID            desc;

    // Removed the GET_PO_ITEMID function, has it is redundant code for the OrderItemnumber.
    // PO_ITEMID is been picked from Invoicline's OrderItemnumber which will contain assocaited Orderitem number for Substituted part and part ordered on PO
    entity GET_MNET_DATA                   as
        select from bolHeader as T0
        inner join invoiceHeader as T1
            on  T0.houseBOLNumber = T1.houseBOLNumber.houseBOLNumber
            and T0.ID             = T1.houseBOLNumber.ID
        inner join invoiceLine as T2
            on  T1.invoiceNumber                 = T2.invoiceNumber.invoiceNumber
            and T1.houseBOLNumber.houseBOLNumber = T2.invoiceNumber.houseBOLNumber.houseBOLNumber
            and T1.houseBOLNumber.ID             = T2.invoiceNumber.houseBOLNumber.ID
        inner join additionalInvoiceLine as T3
            on  T2.partID                                      = T3.partID.partID
            and T2.invoiceNumber.invoiceNumber                 = T3.partID.invoiceNumber.invoiceNumber
            and T2.lineNumber                                  = T3.partID.lineNumber
            and T2.invoiceNumber.houseBOLNumber.houseBOLNumber = T3.partID.invoiceNumber.houseBOLNumber.houseBOLNumber
        left join A_PurchaseOrderItem as P1
            on  P1.PurchaseOrder.PurchaseOrder = T2.purchaseOrderNumber
            and P1.Material                    = cast(
                GET_MNET_ITEM(
                    T2.partID
                ) as String(50)
            )
            and P1.PurchaseOrderItem           = T2.orderItemNbr
        left join ZMNETMODE as TM
            on TM.TMODE = T0.modeOfTransport
        left join ZCROSSREF as T5
            on P1.Plant = T5.SAP_Code
        distinct {
            T0.ID,
            T0.houseBOLNumber,
            T0.initialDestinationETA,
            T1.invoiceNumber,
            T1.supplierID,
            T1.invoiceCurrencyCode,
            T1.invoicedate, //Asif changes 27/11
            T2.purchaseOrderNumber,
            T2.buyerPartID,
            T2.quantity,
            T2.extendedCost,
            T2.unitPrice,
            T2.partUnitOfMeasurement,
            T3.qtyPerSLSUnitPricePackType, // added on 03/01 by Preethi for defect 154
            T2.lineNumber,
            T2.containerID,
            cast(
                IFNULL(
                    P1.PurchaseOrderItem, T3.orderItemNbr
                ) as   String(10)
            )                    as PurchaseOrderItem,
            P1.Plant,
            cast(
                GET_COMPANY_CODE(
                    T2.purchaseOrderNumber
                ) as   String(4)
            )                    as CompanyCode,

            T3.PASCOriginalPartsNbr,
            P1.OrderQuantity,
            P1.NetPriceAmount,
            P1.StorageLocation,
            P1.ScheduleLineOpenQty,
            T2.businessUnit,
            //GET_MNET_ITEM replaced with GET_MNET_SUPPLIERPARTID  Def 70 26-03-2024
            cast(
                GET_MNET_SUPPLIER_PARTID(
                    T2.partID
                ) as   String(50)
            )                    as supplierPartID,
            T0.recordType,
            T0.shipMethod,
            T1.paymentConditionCode,
            cast(
                case
                    when
                        T1.paymentConditionCode = 'FR'
                    then
                        'FREE'
                    else
                        'INV'
                end as String(5)
            )                    as INV_FLAG,
            cast(
                case ifnull(
                    T5.SAP_Code, 'X'
                )
                    when
                        'X'
                    then
                        'S'
                    else
                        'D'
                end as String(1)
            )                    as POType,
            TM.TRATY,
            P1.ValuationType,
            T0.status            as BOLSTATUS,
            T2.action            as INVACTION,
            T2.BTP_IBDStatus     as BTPIBDSTATUS,
            T2.BTP_InvoiceStatus as BTPINVSTATUS,
            T2.BTP_GRStatus      as BTPGRSTATUS,
            T2.BTP_ASN_DI_Status as BTPASNDISTATUS,
            T0.importShipmentNumber,
            // cast(
            //     GET_PO_ITEMID(
            //         T2.purchaseOrderNumber, GET_MNET_ITEM(
            //             T2.partID
            //         )
            //     ) as   String(10)
            // )                    as PO_ITEMID
            T2.orderItemNbr      as PO_ITEMID

        }

        where
                T2.status != 'H'
            and T2.status != 'I';

    // Removed the GET_PO_ITEMID function, has it is redundant code for the OrderItemnumber.
    // PO_ITEMID is been picked from Invoicline's OrderItemnumber which will contain assocaited Orderitem number for Substituted part and part ordered on PO
    // entity Get_MNET                        as
    //     select from MNetStatusMonitoring as T10
    //     left join bolHeader as T0
    //         on(
    //                 T10.houseBOLNumber = T0.houseBOLNumber
    //             and T10.ID             = (
    //                 select max(
    //                     cast(
    //                         ifnull(
    //                             TA.ID, 0
    //                         ) as String
    //                     )
    //                 ) as LatestID from MNetStatusMonitoring as TA
    //                 where
    //                     TA.houseBOLNumber = T0.houseBOLNumber

    //             )

    //         )

    //     left join invoiceHeader as T1
    //         on  T0.houseBOLNumber = T1.houseBOLNumber.houseBOLNumber
    //         and T0.ID             = T1.houseBOLNumber.ID
    //     left join invoiceLine as T2
    //         on  T1.invoiceNumber                               =  T2.invoiceNumber.invoiceNumber
    //         and T0.ID                                          =  T2.invoiceNumber.houseBOLNumber.ID
    //         and T2.invoiceNumber.houseBOLNumber.houseBOLNumber =  T1.houseBOLNumber.houseBOLNumber
    //         and T2.status                                      in (
    //             'C', 'H', 'O', 'P', 'E'
    //         )

    //     left join additionalInvoiceLine as T3
    //         on(
    //                 T2.partID                                      = T3.partID.partID
    //             and T2.invoiceNumber.houseBOLNumber.houseBOLNumber = T3.partID.invoiceNumber.houseBOLNumber.houseBOLNumber
    //             and T2.invoiceNumber.houseBOLNumber.ID             = T3.partID.invoiceNumber.houseBOLNumber.ID
    //             and T2.invoiceNumber.invoiceNumber                 = T3.partID.invoiceNumber.invoiceNumber
    //             and T2.lineNumber                                  = T3.partID.lineNumber
    //         )
    //     left join A_PurchaseOrderItem as P1
    //         on  P1.PurchaseOrder.PurchaseOrder = T2.purchaseOrderNumber
    //         // and P1.Material                    = IFNULL(
    //         //   T3.PASCOriginalPartsNbr, cast(
    //         //     GET_MNET_ITEM(
    //         //       T2.partID
    //         //     ) as String(50)
    //         //   )
    //         // )
    //         and T2.orderItemNbr                = P1.PurchaseOrderItem
    //     left join A_PurchaseOrder as P2
    //         on P2.PurchaseOrder = T2.purchaseOrderNumber
    //     // left join POCrossRef as T4
    //     //     on  T4.Po_Old     = T2.purchaseOrderNumber
    //     //     and T4.PoItem_Old = T2.orderItemNbr
    //     left join ZMNETBUSINESS as T5
    //         on T5.ZBUSINESS_IND = T2.Zbusiness_indicator
    //     left join ZMNETMODE as TM
    //         on TM.TMODE = T0.modeOfTransport

    //     //Brahma ... Replacing Inner Join with Outer join to list the errors when BOL and invoicelines are rejected but an error Occurs... After this change Duplicate check needs to be checked.
    //     //inner join (
    //     left join (
    //         (
    //             select
    //                 Max(
    //                     T0.ID
    //                 ) as MAX_ID,
    //                 cast(
    //                     (
    //                         (
    //                             RPAD(
    //                                 ifnull(
    //                                     T0.importShipmentNumber, ''
    //                                 ), 30
    //                             ) || RPAD(
    //                                 ifnull(
    //                                     T2.invoiceNumber.invoiceNumber, ''
    //                                 ), 16
    //                             ) || RPAD(
    //                                 ifnull(
    //                                     T2.lineNumber, ''
    //                                 ), 5
    //                             )
    //                         )
    //                     ) as     String(51)
    //                 ) as V_REF
    //             from (
    //                 (
    //                     bolHeader as T0
    //                     inner join invoiceHeader as T1
    //                         on T0.ID = T1.houseBOLNumber.ID
    //                 )
    //                 inner join invoiceLine as T2
    //                     on  T1.invoiceNumber                 = T2.invoiceNumber.invoiceNumber
    //                     and T1.houseBOLNumber.houseBOLNumber = T2.invoiceNumber.houseBOLNumber.houseBOLNumber
    //                     and T0.ID                            = T2.invoiceNumber.houseBOLNumber.ID
    //             )

    //             group by(
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
    //         and T0.ID                   = LatestBOL.MAX_ID
    //     distinct {
    //             cast(
    //                 (
    //                     T0.ID
    //                 ) as         Integer
    //             ) as houseBOLNumber_ID,
    //         key cast(
    //                 (
    //                     T0.importShipmentNumber
    //                 ) as         String(12) //Bhushan changed length 30 to 12 on 30-04-2024
    //             ) as Folder_No,

    //             cast(
    //                 (
    //                     T10.houseBOLNumber
    //                 ) as         String(18) // Preethi changed for defect 93 on 18/12 Bhushan changed 18 to 12 on 30-04-2024
    //             ) as BillofLanding,

    //         key cast(
    //                 (
    //                     T2.invoiceNumber.invoiceNumber
    //                 ) as         String(12) //Bhushan changed 16 to 12 on 30-04-2024
    //             ) as SupplierInvoice,

    //         key cast(
    //                 (
    //                     T2.lineNumber
    //                 ) as         String(12) //Bhushan changed 16 to 12 on 30-04-2024
    //             ) as SupplierInvoice_Line,

    //             cast(
    //                 (
    //                     T0.initialDestinationDescription
    //                 ) as         String(15) //Bhushan changed length 50 to 15 on 30-04-2024
    //             ) as initialDestinationDescription,

    //             cast(
    //                 (
    //                     T0.createdAt
    //                 ) as         Date
    //             ) as Received_Date,
    //             // Considering initialDestinationETA for the ETA from file 23_03
    //             cast(
    //                 (
    //                     T0.initialDestinationETA
    //                 ) as         Date
    //             ) as ETA,

    //             // jyothi changed for defect 175-point7
    //             // Brahma  Changed the Logic for determination of ProcessDate.
    //             cast(
    //                 ifnull(
    //                     T10.modifiedAt
    //                     , T10.createdAt
    //                 ) as         Date
    //             ) as ProcessDate,
    //             cast(
    //                 (
    //                     T0.transformCode
    //                 ) as         String(10)
    //             ) as modeOfTransport,
    //             cast(
    //                 (
    //                     T0.ordererID
    //                 ) as         String(20)
    //             ) as GlobalCompanyCode,
    //             cast(
    //                 (
    //                     T0.initialDestination
    //                 ) as         String(20)
    //             ) as initialDestination,
    //             cast(
    //                 (
    //                     T2.action
    //                 ) as         String(1)
    //             ) as action,
    //             cast(
    //                 (
    //                     T2.Zbusiness_indicator
    //                 ) as         String(2)
    //             ) as shippingInfo,

    //         key cast(
    //                 (
    //                     T2.purchaseOrderNumber
    //                 ) as         String(12) // Bhushan Changed length 50 to 25  & Gnaneshwar Changed length 25 to 12
    //             ) as Purchasing_order,
    //         key cast(
    //                 (
    //                     T2.orderItemNbr
    //                 ) as         String(5) // Defect 172 - Change to get Substituted PO line item
    //             ) as PO_Line,
    //             cast(
    //                 (
    //                     T2.status
    //                 ) as         String(1)
    //             ) as status,
    //             cast(
    //                 (
    //                     T2.containerID
    //                 ) as         String(20)
    //             ) as containerID,
    //             // cast(
    //             //     (
    //             //         T2.partID
    //             //     ) as         String(50)
    //             // ) as buyerPartID,
    //             cast(
    //                 (
    //                     case
    //                         when
    //                             length(
    //                                 RTRIM(
    //                                     SUBSTR(
    //                                         T2.partID, (
    //                                             INSTR(
    //                                                 T2.partID, '~', 1
    //                                             )+1
    //                                         ), (
    //                                             LOCATE(
    //                                                 T2.partID, '~', -1
    //                                             )-INSTR(
    //                                                 T2.partID, '~', 1
    //                                             )-1
    //                                         )
    //                                     )
    //                                 )
    //                             ) < 3
    //                         then
    //                             RTRIM(
    //                                 SUBSTR(
    //                                     T2.partID, 1, (
    //                                         INSTR(
    //                                             T2.partID, '~', 1
    //                                         )-1
    //                                     )
    //                                 )
    //                             )
    //                         else
    //                             RTRIM(
    //                                 SUBSTR(
    //                                     T2.partID, (
    //                                         INSTR(
    //                                             T2.partID, '~', 1
    //                                         )+1
    //                                     ), (
    //                                         LOCATE(
    //                                             T2.partID, '~', -1
    //                                         )-INSTR(
    //                                             T2.partID, '~', 1
    //                                         )-1
    //                                     )
    //                                 )
    //                             )
    //                     end
    //                 ) as         String(50)
    //             ) as buyerPartID,
    //             cast(
    //                 (
    //                     T3.PASCOriginalPartsNbr
    //                 ) as         String(17)
    //             ) as Original_Material,
    //             cast(
    //                 case
    //                     when
    //                         T3.PASCOriginalPartsNbr is not null
    //                     then
    //                         (
    //                             T3.orderItemNbr
    //                         )
    //                     else
    //                         ''
    //                 end as       String(5)
    //             ) as Original_PO_Line, // defect 172 added original PO line on 05/03
    //             cast(
    //                 (
    //                     T2.quantity
    //                 ) as         String(17)
    //             ) as quantity,
    //             cast(
    //                 (
    //                     case
    //                         when
    //                             IFNULL(
    //                                 T2.BTP_IBDStatus, 'X'
    //                             ) = 'X'
    //                             and IFNULL(
    //                                 T2.BTP_IBDAction, 'X'
    //                             ) = 'X'
    //                         then
    //                             ' '
    //                         else
    //                             case IFNULL(
    //                                 T2.BTP_IBDStatus, 'X'
    //                             )
    //                                 when
    //                                     'S'
    //                                 then
    //                                     T2.BTP_IBDStatus
    //                                 else
    //                                     ''
    //                             end
    //                     end

    //                 ) as         String(10)
    //             ) as BTP_IBDStatus,
    //             cast(
    //                 (
    //                     T2.BTP_IBDAction
    //                 ) as         String(2)
    //             ) as IBD_Action,
    //             cast(
    //                 (
    //                     case
    //                         when
    //                             IFNULL(
    //                                 T2.BTP_IBDStatus, 'X'
    //                             ) = 'X'
    //                             and IFNULL(
    //                                 T2.BTP_IBDAction, 'X'
    //                             ) = 'X'
    //                         then
    //                             ' '
    //                         else
    //                             case
    //                                 when
    //                                     IFNULL(
    //                                         T2.BTP_IBDStatus, 'X'
    //                                     ) = 'S'
    //                                     and IFNULL(
    //                                         T2.BTP_IBDAction, 'X'
    //                                     ) = 'C'
    //                                     or IFNULL(
    //                                         T2.BTP_IBDAction, 'X'
    //                                     ) = 'U'

    //                                 then
    //                                     T2.BTP_IBDNumber
    //                                 else
    //                                     ''
    //                             end
    //                     end


    //                 ) as         String(10)
    //             ) as BTP_IBDNumber,
    //             cast(
    //                 (
    //                     case
    //                         when
    //                             IFNULL(
    //                                 T2.BTP_IBDStatus, 'X'
    //                             ) = 'X'
    //                             and IFNULL(
    //                                 T2.BTP_IBDAction, 'X'
    //                             ) = 'X'
    //                         then
    //                             ' '
    //                         else
    //                             case
    //                                 when
    //                                     IFNULL(
    //                                         T2.BTP_IBDStatus, 'X'
    //                                     ) = 'S'
    //                                     and IFNULL(
    //                                         T2.BTP_IBDAction, 'X'
    //                                     ) = 'C'
    //                                     or IFNULL(
    //                                         T2.BTP_IBDAction, 'X'
    //                                     ) = 'U'
    //                                 then
    //                                     T2.SAP_LineID_IBD
    //                                 else
    //                                     ''
    //                             end
    //                     end

    //                 ) as         String(10)
    //             ) as deliveryListItemNbr,
    //             cast(
    //                 (
    //                     T2.BTP_GRAction
    //                 ) as         String(2)
    //             ) as GR_Action,
    //             // cast(
    //             //     (
    //             //         case
    //             //          IFNULL(
    //             //             T2.BTP_GRAction,
    //             //     'X')
    //             //     when 'S'
    //             //      then T2.BTP_GRNumber
    //             //      else
    //             //      ''
    //             //      end

    //             //     ) as String(10)
    //             //   ) as BTP_GRNumber,
    //             //     cast(
    //             //         (
    //             //             case IFNULL(
    //             //                 T2.BTP_GRAction, 'X'
    //             //             )
    //             //                 when
    //             //                     'S'
    //             //                 then
    //             //                     T2.SAP_LineID_GR
    //             //                 else
    //             //                     ''
    //             //             end

    //             //         ) as         String(10)
    //             //     )         as Receipt_Line,
    //             cast(
    //                 (
    //                     case
    //                         when
    //                             IFNULL(
    //                                 T2.BTP_GRStatus, 'X'
    //                             ) = 'X'
    //                             and IFNULL(
    //                                 T2.BTP_GRAction, 'X'
    //                             ) = 'X'
    //                         then
    //                             ' '
    //                         else
    //                             case
    //                                 when
    //                                     IFNULL(
    //                                         T2.BTP_GRStatus, 'X'
    //                                     ) = 'S'
    //                                     and IFNULL(
    //                                         T2.BTP_GRAction, 'X'
    //                                     ) = 'C'
    //                                 then
    //                                     T2.BTP_GRNumber
    //                                 else
    //                                     ''
    //                             end
    //                     end


    //                 ) as         String(10)
    //             ) as BTP_GRNumber,
    //             cast(
    //                 (
    //                     case
    //                         when
    //                             IFNULL(
    //                                 T2.BTP_GRStatus, 'X'
    //                             ) = 'X'
    //                             and IFNULL(
    //                                 T2.BTP_GRAction, 'X'
    //                             ) = 'X'
    //                         then
    //                             ' '
    //                         else
    //                             case
    //                                 when
    //                                     IFNULL(
    //                                         T2.BTP_GRStatus, 'X'
    //                                     ) = 'S'
    //                                     and IFNULL(
    //                                         T2.BTP_GRAction, 'X'
    //                                     ) = 'C'
    //                                 then
    //                                     T2.SAP_LineID_GR
    //                                 else
    //                                     ''
    //                             end
    //                     end

    //                 ) as         String(10)
    //             ) as Receipt_Line,
    //             cast(
    //                 (
    //                     case
    //                         when
    //                             IFNULL(
    //                                 T2.BTP_InvoiceStatus, 'X'
    //                             ) = 'X'
    //                             and IFNULL(
    //                                 T2.BTP_InvoiceAction, 'X'
    //                             ) = 'X'
    //                         then
    //                             ' '
    //                         else
    //                             case IFNULL(
    //                                 T2.BTP_InvoiceStatus, 'X'
    //                             )
    //                                 when
    //                                     'S'
    //                                 then
    //                                     T2.BTP_InvoiceStatus
    //                                 else
    //                                     ''
    //                             end
    //                     end
    //                 ) as         String(10)
    //             ) as BTP_InvoiceStatus,
    //             cast(
    //                 (
    //                     T2.BTP_InvoiceAction
    //                 ) as         String(2)
    //             ) as INV_Action,
    //             cast(
    //                 (
    //                     case
    //                         when
    //                             IFNULL(
    //                                 T2.BTP_InvoiceStatus, 'X'
    //                             ) = 'X'
    //                             and IFNULL(
    //                                 T2.BTP_InvoiceAction, 'X'
    //                             ) = 'X'
    //                         then
    //                             ' '
    //                         else
    //                             case
    //                                 when
    //                                     IFNULL(
    //                                         T2.BTP_InvoiceStatus, 'X'
    //                                     ) = 'S'
    //                                     and IFNULL(
    //                                         T2.BTP_InvoiceAction, 'X'
    //                                     ) = 'C'
    //                                 then
    //                                     T2.BTP_InvoiceNumber
    //                                 else
    //                                     ''
    //                             end
    //                     end

    //                 ) as         String(10)
    //             ) as BTP_InvoiceNumber,
    //             cast(
    //                 (
    //                     case
    //                         when
    //                             IFNULL(
    //                                 T2.BTP_InvoiceStatus, 'X'
    //                             ) = 'X'
    //                             and IFNULL(
    //                                 T2.BTP_InvoiceAction, 'X'
    //                             ) = 'X'
    //                         then
    //                             ' '
    //                         else
    //                             case
    //                                 when
    //                                     IFNULL(
    //                                         T2.BTP_InvoiceStatus, 'X'
    //                                     ) = 'S'
    //                                     and IFNULL(
    //                                         T2.BTP_InvoiceAction, 'X'
    //                                     ) = 'C'
    //                                 then
    //                                     T2.SAP_LineID_Invoice
    //                                 else
    //                                     ''
    //                             end
    //                     end
    //                 ) as         String(10)
    //             ) as invoiceItemNbr,
    //             cast(
    //                 (
    //                     case
    //                         when
    //                             T2.BTP_ASN_DI_Status = 'ET'
    //                         then
    //                             ''
    //                         else
    //                             T2.BTP_ASN_DI_Status
    //                     end
    //                 ) as         String(3)
    //             ) as ASN_Status,
    //             cast(
    //                 (
    //                     case
    //                         when
    //                             T2.BTP_ASN_DI_Status = 'EH'
    //                         then
    //                             ''
    //                         else
    //                             T2.BTP_ASN_DI_Status
    //                     end
    //                 ) as         String(3)
    //             ) as DI_Status,
    //             cast(
    //                 (
    //                     T2.statusRemark
    //                 ) as         String(100)
    //             ) as statusRemark,
    //             cast(
    //                 (
    //                     T1.supplierID
    //                 ) as         String(20)
    //             ) as Vender,
    //             cast(
    //                 (
    //                     T1.paymentConditionCode
    //                 ) as         String(2)
    //             ) as paymentConditionCode,
    //             cast(
    //                 (
    //                     T2.DiversionFlag
    //                 ) as         String(10)
    //             ) as DiversionFlag,

    //             cast(
    //                 (
    //                     T2.Zbusiness_indicator
    //                 ) as         String(10)
    //             ) as Zbusiness_indicator,


    //             cast(
    //                 (

    //                 ''

    //                 ) as         String(10) //passing empty string since pocross ref is not used and to avoid dump
    //             ) as Po_Old,
    //             cast(
    //                 ('') as      String(5)
    //             ) as PoItem_Old,
    //             cast(
    //                 (
    //                     T2.unitPrice
    //                 ) as         String(10)
    //             ) as UnitPrice,
    //             cast(
    //                 (
    //                     T2.partUnitOfMeasurement
    //                 ) as         String(10)
    //             ) as UOM,
    //             //SIT3 Def #26
    //             T1.invoiceCurrencyCode,
    //             T2.extendedCost,
    //             // T3.qtyPerSLSUnitPricePackType,
    //             P1.PurchaseOrderQuantityUnit, //Adding to consider the quantity unit from A_PurchaseorderItem level
    //             P1.OrderPriceUnit,// added to consider the price unit from A_PurchaseOrderItem 
    //             T1.invoicedate,
    //             TM.TRATY


    //     };


        entity Get_MNET                    as
        select from 
         (
            SELECT
                    max(T6.createdAt) AS CREATEDAT,
			max(T6.ID) AS ID,
			max(T6.BOLID) AS BOLID,
			T7.importShipmentNumber,
			T9.invoiceNumber.invoiceNumber AS invoiceNumber,
			T8.supplierID,
			T8.paymentConditionCode,
			T8.invoiceCurrencyCode,
			T8.invoicedate,
			T9.lineNumber,
			T7.initialDestination,
			T7.initialDestinationDescription,
			T7.initialDestinationETA,
			T7.transformCode,
			T7.ordererID,
			T7.modeOfTransport,
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
			T9.partUnitOfMeasurement,
			T9.extendedCost
            FROM MNetStatusMonitoring AS T6 
            left join bolHeader AS T7 
                on T6.houseBOLNumber = T7.houseBOLNumber and T6.BOLID = T7.ID
            left join invoiceHeader as T8
				on T7.houseBOLNumber = T8.houseBOLNumber.houseBOLNumber and T7.ID = T8.houseBOLNumber.ID  
			left join invoiceLine as T9
				on T8.invoiceNumber = T9.invoiceNumber.invoiceNumber
					and T8.houseBOLNumber.ID = T9.invoiceNumber.houseBOLNumber.ID
					and T8.houseBOLNumber.houseBOLNumber = T9.invoiceNumber.houseBOLNumber.houseBOLNumber 
					and T9.status in ( 'C', 'H', 'O', 'P', 'E' )
			inner join (
				(
                select
                    Max(
                        T0.ID
                     ) as MAX_BOLID, // MAX_BOLID is BOLID
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
                        on T1.invoiceNumber = T2.invoiceNumber.invoiceNumber
                        and T1.houseBOLNumber.houseBOLNumber = T2.invoiceNumber.houseBOLNumber.houseBOLNumber
                        and T0.ID = T2.invoiceNumber.houseBOLNumber.ID
                )
                group by
                    T0.importShipmentNumber, 
                    T2.invoiceNumber.invoiceNumber, 
                    T2.lineNumber
                    
                )
        ) as LatestBOL
            on  T9.invoiceNumber.invoiceNumber = LatestBOL.M_invoiceNumber 
            and T9.lineNumber = LatestBOL.lineNumber 
            and T9.invoiceNumber.houseBOLNumber.ID = LatestBOL.MAX_BOLID
			and T7.importShipmentNumber = LatestBOL.importShipmentNumber
		WHERE T6.importShipmentNumber = T7.importShipmentNumber
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
                T7.modeOfTransport,
				T9.action,
				T9.Zbusiness_indicator,
				T9.purchaseOrderNumber,
				T9.orderItemNbr,
				T9.status,
				T9.containerID,
				T9.partID,
                T8.invoicedate,
                T9.extendedCost,
                T7.modeOfTransport,
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
        on 
			T10.ID = LatestStatusRecords.BOLID 
			and
			T10.importShipmentNumber = LatestStatusRecords.importShipmentNumber
        left join additionalInvoiceLine as T3
            on(
                LatestStatusRecords.partID = T3.partID.partID
                and T10.houseBOLNumber = T3.partID.invoiceNumber.houseBOLNumber.houseBOLNumber
                and LatestStatusRecords.BOLID = T3.partID.invoiceNumber.houseBOLNumber.ID
                and LatestStatusRecords.invoiceNumber = T3.partID.invoiceNumber.invoiceNumber
                and LatestStatusRecords.lineNumber = T3.partID.lineNumber
            )
        left join A_PurchaseOrderItem as P1
            on  P1.PurchaseOrder.PurchaseOrder = LatestStatusRecords.purchaseOrderNumber
            
            and LatestStatusRecords.orderItemNbr                = P1.PurchaseOrderItem
        left join A_PurchaseOrder as P2
            on P2.PurchaseOrder = LatestStatusRecords.purchaseOrderNumber
        left join POCrossRef as T4
            on  LatestStatusRecords.purchaseOrderNumber = T4.Po_Old
            and LatestStatusRecords.orderItemNbr = T4.PoItem_Old
        left join ZMNETBUSINESS as T5
            on LatestStatusRecords.Zbusiness_indicator = T5.ZBUSINESS_IND
        left join ZMNETMODE as TM
            on TM.TMODE = LatestStatusRecords.modeOfTransport
        distinct {
                cast(
                    (
                        LatestStatusRecords.BOLID
                    ) as         Integer
                ) as houseBOLNumber_ID,
            key cast(
                    (
                        LatestStatusRecords.importShipmentNumber
                    ) as         String(12) //Bhushan changed length 30 to 12 on 30-04-2024
                ) as Folder_No,

                cast(
                    (
                        T10.houseBOLNumber
                    ) as         String(18) // Preethi changed for defect 93 on 18/12 Bhushan changed 18 to 12 on 30-04-2024
                ) as BillofLanding,

            key cast(
                    (
                        LatestStatusRecords.invoiceNumber
                    ) as         String(16)       
                ) as SupplierInvoice,

            key cast(
                    (
                        LatestStatusRecords.lineNumber
                    ) as         String(12) //Bhushan changed 16 to 12 on 30-04-2024
                ) as SupplierInvoice_Line,

                cast(
                    (
                        LatestStatusRecords.initialDestinationDescription
                    ) as         String(15) //Bhushan changed length 50 to 15 on 30-04-2024 
                ) as initialDestinationDescription,

                cast(
                    (
                        LatestStatusRecords.CREATEDAT
                    ) as         Date
                ) as Received_Date,
                // Considering initialDestinationETA for the ETA from file 23_03
                cast(
                    (
                        LatestStatusRecords.initialDestinationETA
                    ) as         Date
                ) as ETA,

                // jyothi changed for defect 175-point7
                // Kowsalyaa changed for Process Date Blank issue for Header error
                cast(
                        // Brahma Added the logic to have processdate be same as createdat if Modifedat is null.. 
                      ( ifnull
                     ( T10.modifiedAt
                     , T10.createdAt )
                     )as         Date
                ) as ProcessDate,
                cast(
                    (
                        LatestStatusRecords.transformCode
                    ) as         String(10)
                ) as modeOfTransport,
                cast(
                    (
                        LatestStatusRecords.ordererID
                    ) as         String(20)
                ) as GlobalCompanyCode,
                cast(
                    (
                        LatestStatusRecords.initialDestination
                    ) as         String(20)
                ) as initialDestination,
                cast(
                    (
                        LatestStatusRecords.action
                    ) as         String(1)
                ) as action,
                cast(
                    (
                        LatestStatusRecords.Zbusiness_indicator
                    ) as         String(2)
                ) as shippingInfo,

              key cast(
                    (
                        LatestStatusRecords.purchaseOrderNumber
                    ) as         String(12) // Bhushan Changed length 50 to 25  & Gnaneshwar Changed length 25 to 12
                ) as Purchasing_order,
               key cast(
                    (
                        LatestStatusRecords.orderItemNbr
                    ) as         String(5) // Defect 172 - Change to get Substituted PO line item
                ) as PO_Line,
                cast(
                    (
                        LatestStatusRecords.status
                    ) as         String(1)
                ) as status,
                cast(
                    (
                        LatestStatusRecords.containerID
                    ) as         String(20)
                ) as containerID,
                // cast(
                //     (
                //         LatestStatusRecords.partID
                //     ) as         String(50)
                // ) as buyerPartID,
                cast(
                    (
                        case when length(
                    RTRIM(
                        SUBSTR(
                            LatestStatusRecords.partID, (INSTR(LatestStatusRecords.partID, '~', 1) +1), (
                                LOCATE(LatestStatusRecords.partID, '~', -1)-INSTR(LatestStatusRecords.partID, '~', 1) -1
                                )
                            )
                        )) < 3 then 
                         RTRIM(SUBSTR(LatestStatusRecords.partID, 1, (INSTR(LatestStatusRecords.partID, '~', 1) - 1)))
                    	else 
                    	RTRIM(
                        SUBSTR(
                            LatestStatusRecords.partID, (INSTR(LatestStatusRecords.partID, '~', 1) +1), (
                                LOCATE(LatestStatusRecords.partID, '~', -1)-INSTR(LatestStatusRecords.partID, '~', 1) -1
                                )
                            )
                        )
                        end
                    ) as String(50)
                ) as buyerPartID,
                cast(
                    (
                        T3.PASCOriginalPartsNbr
                    ) as         String(17)
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
                    end as       String(5)
                ) as Original_PO_Line, // defect 172 added original PO line on 05/03
                cast(
                    (
                        LatestStatusRecords.quantity
                    ) as         String(17)
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

                    ) as         String(10)
                ) as BTP_IBDStatus,
                cast(
                    (
                        LatestStatusRecords.BTP_IBDAction
                    ) as         String(2)
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


                    ) as         String(10)
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

                    ) as         String(10)
                ) as deliveryListItemNbr,
                cast(
                    (
                        LatestStatusRecords.BTP_GRAction
                    ) as         String(2)
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

                    ) as         String(10)
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

                    ) as         String(10)
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
                    ) as         String(10)
                ) as BTP_InvoiceStatus,
                cast(
                    (
                        LatestStatusRecords.BTP_InvoiceAction
                    ) as         String(2)
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

                    ) as         String(10)
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
                    ) as         String(10)
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
                    ) as         String(3)
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
                    ) as         String(3)
                ) as DI_Status,
                cast(
                    (
                        LatestStatusRecords.statusRemark
                    ) as         String(100)
                ) as statusRemark,
                cast(
                    (
                        LatestStatusRecords.supplierID
                    ) as         String(20)
                ) as Vender,
                cast(
                    (
                        LatestStatusRecords.paymentConditionCode
                    ) as         String(2)
                ) as paymentConditionCode,
                cast(
                    (
                        LatestStatusRecords.DiversionFlag
                    ) as         String(10)
                ) as DiversionFlag,

                cast(
                    (
                        LatestStatusRecords.Zbusiness_indicator
                    ) as         String(10)
                ) as Zbusiness_indicator,


                cast(
                    (
                        
                        case 
                           when
                             IFNULL(T4.Po_Old, 'X') = 'X' 
                            then '' 
                            else
                             T4.Po_Old
                            end          
                        
                    ) as         String(10)     //passing empty string since pocross ref is not used and to avoid dump 
                ) as Po_Old,
                cast(
                    (
                        case
                          when IFNULL(T4.PoItem_Old, 'X') = 'X' 
                        then '' 
                        else T4.PoItem_Old
                        end 
                    ) as         String(5)
                ) as PoItem_Old,
                 cast(
                    (
                        LatestStatusRecords.unitPrice
                    ) as         String(10)
                ) as UnitPrice,
                 cast(
                    (
                        LatestStatusRecords.partUnitOfMeasurement
                    ) as         String(10)
                ) as UOM,
                //SIT3 Def #26 
                LatestStatusRecords.invoiceCurrencyCode,
                LatestStatusRecords.extendedCost,
                P1.PurchaseOrderQuantityUnit,
                P1.OrderPriceUnit,
                LatestStatusRecords.invoicedate,
                TM.TRATY
 
        }
        ;


    entity Get_MNET_Diversion              as
        select from MNetStatusMonitoring as T10
        left join bolHeader as T0
            on  T10.houseBOLNumber = T0.houseBOLNumber
            and T10.ID             = (
                        select max(
                            cast(
                                ifnull(
                                    TA.ID, 0
                                ) as String
                            )
                        ) as LatestID from MNetStatusMonitoring as TA
                        where
                            TA.houseBOLNumber = T0.houseBOLNumber
                    )
            left join invoiceHeader as T1
                on  T0.houseBOLNumber = T1.houseBOLNumber.houseBOLNumber
                and T0.ID             = T1.houseBOLNumber.ID
            left join invoiceLine as T2
                on  T1.invoiceNumber                 =  T2.invoiceNumber.invoiceNumber
                and T1.houseBOLNumber.ID             =  T2.invoiceNumber.houseBOLNumber.ID
                and T1.houseBOLNumber.houseBOLNumber =  T2.invoiceNumber.houseBOLNumber.houseBOLNumber
                and T2.status                        in (
                    'C', 'H', 'O', 'P', 'E'
                )
            left join additionalInvoiceLine as T3
                on  T2.partID                                      = T3.partID.partID
                and T2.invoiceNumber.houseBOLNumber.houseBOLNumber = T3.partID.invoiceNumber.houseBOLNumber.houseBOLNumber
                and T2.invoiceNumber.houseBOLNumber.ID             = T3.partID.invoiceNumber.houseBOLNumber.ID
                and T2.invoiceNumber.invoiceNumber                 = T3.partID.invoiceNumber.invoiceNumber
                and T2.lineNumber                                  = T3.partID.lineNumber
            left join A_PurchaseOrderItem as P1
                on  P1.PurchaseOrder.PurchaseOrder = T2.purchaseOrderNumber
                // and P1.Material                    = IFNULL(
                //   T3.PASCOriginalPartsNbr, cast(
                //     GET_MNET_ITEM(
                //       T2.partID
                //     ) as String(50)
                //   )
                // )
                and T2.orderItemNbr                = P1.PurchaseOrderItem
            //left join A_PurchaseOrder as P2                           // Not used
            //    on P2.PurchaseOrder = T2.purchaseOrderNumber      
            inner join MNET_DiversionHeader as T11
                on  T2.purchaseOrderNumber                         = T11.Purchase_order
                and T2.lineNumber                                  = T11.Mnet_Line
                and T2.invoiceNumber.invoiceNumber                 = T11.MNET_No
                and T2.invoiceNumber.houseBOLNumber.ID             = T11.MNET_ID
                and T2.invoiceNumber.houseBOLNumber.houseBOLNumber = T11.houseBOLNumber
                and T2.orderItemNbr                                = T11.PO_Line
                and T2.containerID                                 = T11.Container_ID
            inner join MNET_DiversionDetail as T12
                on T11.ID = T12.ID.ID
            left join POCrossRef as T4
                on  T4.Po_Old     = T2.purchaseOrderNumber
                and T4.PoItem_Old = T2.orderItemNbr
            left join ZMNETBUSINESS as T5
                on T5.ZBUSINESS_IND = T2.Zbusiness_indicator
            left join ZMNETMODE as TM
                on TM.TMODE = T0.modeOfTransport

            distinct {
                    cast(
                        (
                            T0.ID
                        ) as         Integer
                    ) as houseBOLNumber_ID,
                key cast(
                        (
                            T0.importShipmentNumber
                        ) as         String(30)
                    ) as Folder_No,

                    cast(
                        (
                            T0.houseBOLNumber
                        ) as         String(18)
                    ) as BillofLanding,

                    cast(
                        (
                            T2.invoiceNumber.invoiceNumber
                        ) as         String(16)
                    ) as SupplierInvoice,
                key cast(
                        (
                            T2.lineNumber
                        ) as         String(30)
                    ) as SupplierInvoice_Line,
                    cast(
                        (
                            T0.initialDestinationDescription
                        ) as         String(50)
                    ) as initialDestinationDescription,

                    cast(
                        (
                            T0.createdAt
                        ) as         Date
                    ) as Received_Date,

                    cast(
                        (
                            T0.initialDestinationETA
                        ) as         Date
                    ) as ETA,
                    cast(
                    (
                                ifnull(  T10.modifiedAt, T10.createdAt )
                     )as         Date
                    ) as ProcessDate,
                    cast(
                        (
                            T0.transformCode
                        ) as         String(10)
                    ) as modeOfTransport,
                    cast(
                        (
                            T0.ordererID
                        ) as         String(20)
                    ) as GlobalCompanyCode,
                    cast(
                        (
                            T0.initialDestination
                        ) as         String(20)
                    ) as initialDestination,
                    //     cast(
                    //         MIN(
                    //             T1.invoiceNumber
                    //         ) as        String(16)
                    //     ) as invoiceNumber,

                    // key cast(
                    //         MIN(
                    //             T1.invoiceNumber
                    //         ) as        String(16)
                    //     ) as invoiceNum,
                    cast(
                        ('U') as     String(1)
                    ) as action,
                    cast(
                        (
                            T2.Zbusiness_indicator
                        ) as         String(2)
                    ) as shippingInfo,
                    // key cast(
                    //         MIN(
                    //             T2.lineNumber
                    //         ) as        String(30)
                    //     ) as SupplierInvoice_Line,
                    cast(
                        (
                            T12.NewPurchasing_Order
                        ) as         String(50)
                    ) as Purchasing_order,
                    cast(
                        (
                            T12.NewPOLine
                        ) as         String(5)
                    ) as PO_Line,
                    cast(
                        (
                            T12.Status
                        ) as         String(1)
                    ) as status,
                    cast(
                        (
                            T2.containerID
                        ) as         String(20)
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
                        ) as         String(50)
                    ) as buyerPartID,
                    cast(
                        (
                            T3.PASCOriginalPartsNbr
                        ) as         String(17)
                    ) as Original_Material,
                    cast(
                        (
                            T12.ID.PO_Line
                        ) as         String(5)
                    ) as Original_PO_Line, // defect 172 added original PO line on 05/03
                    cast(
                        (
                            T12.NewQuantity
                        ) as         String(17)
                    ) as quantity,
                    //Implemetation:changed ibd ,gr and inv mapping based on action and status conditions
                    //date:06-06-24
                    //author:Preethi
                    //  cast(
                    //     (
                    //         case ifnull(
                    //             T12.IBD_Status, 'S'
                    //         )
                    //             when
                    //                 'S'
                    //             then
                    //                 T12.IBD_Status
                    //             else
                    //                 ''
                    //         end
                    //     ) as        String(10)
                    // ) as BTP_IBDStatus,
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

                        ) as         String(10)
                    ) as BTP_IBDStatus,
                    cast(
                        (
                            T12.IBD_Action

                        ) as         String(2)
                    ) as IBD_Action,
                    // cast(
                    //     MAX(
                    //         case ifnull(
                    //             T8.Action, 'S'
                    //         )
                    //             when
                    //                 'S'
                    //             then
                    //                 T11.Delivery
                    //             else
                    //                 ''
                    //         end
                    //     ) as        String(10)
                    // ) as BTP_IBDNumber,
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


                        ) as         String(10)
                    ) as BTP_IBDNumber,
                    // cast(
                    //     MAX(
                    //         case ifnull(
                    //             T8.Action, 'S'
                    //         )
                    //             when
                    //                 'S'
                    //             then
                    //                 T11.IBD_Item
                    //             else
                    //                 ''
                    //         end
                    //     ) as        String(10)
                    // ) as deliveryListItemNbr,
                    // cast(
                    //     (
                    //         case ifnull(
                    //             T12.IBD_Status, 'X'
                    //         )
                    //             when
                    //                 'S'
                    //             then
                    //                 T12.IBD_Item
                    //             else
                    //                 ''
                    //         end
                    //     ) as        String(10)
                    // ) as deliveryListItemNbr,
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
                        end as       String(10)
                    ) as deliveryListItemNbr,
                    cast(
                        (
                            T12.GR_Action
                        ) as         String(2)
                    ) as GR_Action,
                    // cast(
                    //     (
                    //         case
                    //         when
                    //         ifnull(
                    //             T12.GR_Status, 'X')
                    //             = 'S'
                    //             then
                    //                 T12.Receipt
                    //             else
                    //                 ''
                    //         end
                    //     ) as        String(10)
                    // ) as BTP_GRNumber,
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


                        ) as         String(10)

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

                        ) as         String(10)
                    ) as Receipt_Line,
                    // cast(
                    //     (
                    //         case ifnull(
                    //             T12.INV_Status, 'S'
                    //         )
                    //             when
                    //                 'S'
                    //             then
                    //                 T12.INV_Status
                    //             else
                    //                 ''
                    //         end
                    //     ) as        String(10)
                    // ) as BTP_InvoiceStatus,
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
                        ) as         String(10)
                    ) as BTP_InvoiceStatus,
                    cast(
                        (
                            T12.INV_Action
                        ) as         String(2)
                    ) as INV_Action,
                    // cast(
                    //     (
                    //         case
                    //         when
                    //          ifnull(T12.INV_Status, 'X') ='S'
                    //             then
                    //                 T12.Invoice
                    //             else
                    //                 ''
                    //         end
                    //     ) as        String(10)
                    // ) as BTP_InvoiceNumber,
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

                        ) as         String(10)
                    ) as BTP_InvoiceNumber,
                    // cast(
                    //     (
                    //         case ifnull(
                    //             T12.INV_Status, 'X'
                    //         )
                    //             when
                    //                 'S'
                    //             then
                    //                 T12.INV_Item
                    //             else
                    //                 ''
                    //         end
                    //     ) as        String(10)
                    // ) as invoiceItemNbr,
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
                        ) as         String(10)
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
                        ) as         String(3)
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
                        ) as         String(3)
                    ) as DI_Status,
                    cast(
                        (
                            T2.statusRemark
                        ) as         String(100)
                    ) as statusRemark,
                    cast(
                        (
                            T1.supplierID
                        ) as         String(20)
                    ) as Vender,
                    cast(
                        (
                            T1.paymentConditionCode
                        ) as         String(2)
                    ) as paymentConditionCode,
                    cast(
                        (
                            T2.DiversionFlag
                        ) as         String(10)
                    ) as DiversionFlag,
                    cast(
                        (
                            T2.Zbusiness_indicator
                        ) as         String(10)
                    ) as Zbusiness_indicator,
                    cast(
                        ('') as      String(10)
                    ) as Po_Old,
                    cast(
                        ('') as      String(5)
                    ) as PoItem_Old,
                    cast(
                        (
                            T2.unitPrice
                        ) as         String(10)
                    ) as UnitPrice,
                    cast(
                        (
                            T2.partUnitOfMeasurement
                        ) as         String(10)
                    ) as UOM,
                    //SIT3 Def #26
                    cast(
                        (
                            T12.ID.ID
                        ) as         Integer
                    ) as DiversionId,
                    //SIT3 Def #26
                    T1.invoiceCurrencyCode,
                    T2.extendedCost,
                    // T3.qtyPerSLSUnitPricePackType,
                    P1.PurchaseOrderQuantityUnit, //Adding to consider the quantity unit from A_PurchaseorderItem level
                    P1.OrderPriceUnit,// added to consider the price unit from 
                    T1.invoicedate,
                    TM.TRATY


            };

    entity Get_MNET_Diversion_R            as
        select from bolHeader as T0
        inner join invoiceHeader as T1
            on  T0.houseBOLNumber = T1.houseBOLNumber.houseBOLNumber
            and T0.ID             = T1.houseBOLNumber.ID
        inner join invoiceLine as T2
            on T1.invoiceNumber = T2.invoiceNumber.invoiceNumber
            //Brahma Added additional Join criteria to avoid cartesian
            and T1.houseBOLNumber.ID = T2.invoiceNumber.houseBOLNumber.ID 
		    and T1.houseBOLNumber.houseBOLNumber = T2.invoiceNumber.houseBOLNumber.houseBOLNumber 
		    and T2.status IN ('C','O','P', 'E','S') 
        left join additionalInvoiceLine as T3
            on  T2.partID = T3.partID.partID 
		    and T2.invoiceNumber.houseBOLNumber.houseBOLNumber = T3.partID.invoiceNumber.houseBOLNumber.houseBOLNumber 
		    and T2.invoiceNumber.houseBOLNumber.ID = T3.partID.invoiceNumber.houseBOLNumber.ID
		    and T2.invoiceNumber.invoiceNumber = T3.partID.invoiceNumber.invoiceNumber 
		    and T2.lineNumber = T3.partID.lineNumber
        left join A_PurchaseOrderItem as P1
            on  P1.PurchaseOrder.PurchaseOrder = T2.purchaseOrderNumber
            // and P1.Material                    = IFNULL(
            //   T3.PASCOriginalPartsNbr, cast(
            //     GET_MNET_ITEM(
            //       T2.partID
            //     ) as String(50)
            //   )
            // )
            and T2.orderItemNbr                = P1.PurchaseOrderItem
        //left join A_PurchaseOrder as P2                   // Brahma This table is Not Used, hence removed to reduce memory consumption. Also adjusted inner joins for DiversionHeader
        //    on P2.PurchaseOrder = T2.purchaseOrderNumber  
        
        inner join MNET_DiversionHeader as T10
            on  T2.invoiceNumber.houseBOLNumber.ID = T10.MNET_ID
            and T2.invoiceNumber.houseBOLNumber.houseBOLNumber = T10.houseBOLNumber
            and T2.invoiceNumber.invoiceNumber = T10.MNET_No
            and T2.lineNumber = T10.Mnet_Line
            and T2.containerID = T10.Container_ID
			and T2.purchaseOrderNumber = T10.Purchase_order 
			and T2.orderItemNbr= T10.PO_Line
        inner join MNET_DiversionDetail as T11
            on T10.ID = T11.ID.ID
        // left join POCrossRef as T4
        //     on T4.Po_Old = T2.purchaseOrderNumber
        left join ZMNETBUSINESS as T5
            on T5.ZBUSINESS_IND = T2.Zbusiness_indicator
        left join Get_PO as T12
            on T2.purchaseOrderNumber = T12.PurchaseOrder
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
                        T2.buyerPartID
                        //Code has been modified to update buyerPartID, so the function call to partID can be avoided
                     /* GET_MNET_ITEM(
                            T2.partID 
                        ) */
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
                ) as invoiceCurrencyCode,
                cast(
                    MIN(
                        T2.extendedCost
                    ) as        String(18)
                ) as extendedCost,
                // cast(
                //    MIN (
                //         T3.qtyPerSLSUnitPricePackType,
                //     ) as        String(2)
                // ) as qtyPerSLSUnitPricePackType,
                cast(
                    MIN(
                        P1.PurchaseOrderQuantityUnit,
                    ) as        String(2)
                ) as PurchaseOrderQuantityUnit,
                // P1.PurchaseOrderQuantityUnit, //Adding to consider the quantity unit from A_PurchaseorderItem level
                cast(
                    MIN(
                P1.OrderPriceUnit,
                    ) as String(2)
                ) as OrderPriceUnit,
                cast(
                    MIN(
                        T1.invoicedate,
                    ) as        Date
                ) as invoicedate,
                cast(
                    MIN(
                        TM.TRATY,
                    ) as        String(4)
                ) as TRATY


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


    entity Get_PO                          as
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


    entity GET_MNET_Data_Detail            as
            select from Get_MNET as T0
            left join Get_PO as T1
                on T0.Purchasing_order = T1.PurchaseOrder
                and T0.PO_Line = T1.PurchaseOrderItem
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
                    T0.extendedCost,
                    // T0.qtyPerSLSUnitPricePackType,
                    T0.invoicedate,
                    T0.TRATY,
                    T0.PurchaseOrderQuantityUnit,
                    T0.OrderPriceUnit,
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
                    cast(
                        (
                            T0.Vender
                        ) as     String(10)
                    )                      as supplierID,
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
                on T0.Purchasing_order = T1.PurchaseOrder
                and T0.PO_Line = T1.PurchaseOrderItem
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
                    T0.extendedCost,
                    // T0.qtyPerSLSUnitPricePackType,
                    T0.invoicedate,
                    T0.TRATY,
                    T0.PurchaseOrderQuantityUnit,
                    T0.OrderPriceUnit,
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
                    cast(
                        (
                            T0.Vender
                        ) as     String(10)
                    )                      as supplierID,
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
            };
/* Not Required        minus
            select from Get_MNET_Diversion_R as T0
            left join Get_PO as T1
                on T0.Purchasing_order = T1.PurchaseOrder
                and T0.PO_Line = T1.PurchaseOrderItem
            // inner join Get_MNET_Diversion_R as T3
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
                    T0.extendedCost,
                    // T0.qtyPerSLSUnitPricePackType,
                    T0.invoicedate,
                    T0.TRATY,
                    T0.PurchaseOrderQuantityUnit,
                    T0.OrderPriceUnit,
                    T0.houseBOLNumber_ID,
                    T0.Folder_No,
                    T0.BillofLanding,
                    T0.SupplierInvoice,
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
                        null as  String(10)
                    )                      as DiversionFlag,
                    T0.Vender,
                    cast(
                        (
                            T0.Vender
                        ) as     String(10)
                    )                      as supplierID,
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
            };*/
//Preethi added conditions for diversion PO in b5 and b6 table for INC0222193 on 18/09/2024
    entity MNET_WebMethod                  as
        select from bolHeader as b1
        inner join invoiceHeader as b2
            on  b1.houseBOLNumber = b2.houseBOLNumber.houseBOLNumber
            and b1.ID             = b2.houseBOLNumber.ID
        inner join invoiceLine as b3
            on  b2.invoiceNumber                 = b3.invoiceNumber.invoiceNumber
            and b2.houseBOLNumber.houseBOLNumber = b3.invoiceNumber.houseBOLNumber.houseBOLNumber
            and b2.houseBOLNumber.ID             = b3.invoiceNumber.houseBOLNumber.ID
        inner join additionalInvoiceLine as b4
            on  b3.partID                                      = b4.partID.partID
            and b3.invoiceNumber.invoiceNumber                 = b4.partID.invoiceNumber.invoiceNumber
            and b3.invoiceNumber.houseBOLNumber.ID             = b4.partID.invoiceNumber.houseBOLNumber.ID
            and b3.invoiceNumber.houseBOLNumber.houseBOLNumber = b4.partID.invoiceNumber.houseBOLNumber.houseBOLNumber
            and b3.lineNumber                                  = b4.partID.lineNumber
        left join MNET_DiversionHeader as b12
            on  b12.Purchase_order = b3.purchaseOrderNumber
            and b12.PO_Line        = b3.orderItemNbr
        left join MNET_DiversionDetail as b13
            on b13.ID.ID = b12.ID
        left join A_PurchaseOrder as b5
        on (
           (ifnull(b13.NewPurchasing_Order, '') <> '' 
            and b5.PurchaseOrder = b13.NewPurchasing_Order)
        or  
           (ifnull(b13.NewPurchasing_Order, '') = ''
            and b5.PurchaseOrder = b3.purchaseOrderNumber)
            )
        left join A_PurchaseOrderItem as b6
        on (
            (ifnull(b13.NewPurchasing_Order, '') <> '' 
            and b6.PurchaseOrder.PurchaseOrder = b13.NewPurchasing_Order
            and b6.PurchaseOrderItem = b13.NewPOLine)
        or
           (ifnull(b13.NewPurchasing_Order, '') = ''
            and  b6.PurchaseOrder.PurchaseOrder = b3.purchaseOrderNumber
            and  b6.PurchaseOrderItem           = b3.orderItemNbr)
            )
        left join ZCROSSREF as b7
            on  b7.Function_Code = 'WAREHOUSE'
            and b7.Company_Code  = b5.CompanyCode
            and b7.SAP_Code      = b6.Plant
        left join A_PurOrdAccountAssignment as b8
            on  b8.PurchaseOrder                       = b6.PurchaseOrder.PurchaseOrder
            and b8.PurchaseOrderItem.PurchaseOrderItem = b6.PurchaseOrderItem
        left join ZMNETBUSINESS as b9
            on b9.ZBUSINESS_IND = b3.Zbusiness_indicator
        left join PO_AdditionalData as b11
            on b11.PurchaseOrder = b5.PurchaseOrder
        left join ZCROSSREF as T5
            on  b6.Plant         = T5.SAP_Code
            and T5.Function_Code = 'FG_DROP'   
        left join POCrossRef as b14
            on b14.Po_Old = b3.purchaseOrderNumber
        left join ZMNETMODE as TM
            on TM.TMODE = b1.modeOfTransport
        {
            b1.houseBOLNumber,
            b1.importShipmentNumber,
            b2.invoiceNumber,
            b3.containerID,
            b3.invoiceNumber.houseBOLNumber.ID as ZINB_BOLID,
            // b3.BTP_IBDNumber          as ObjectRefNo,
            cast(
                case
                    when
                        ifnull(
                            b13.NewPurchasing_Order, ''
                        ) <> ''
                    then
                        b13.Delivery
                    when
                        ifnull(
                            b14.Po_New, ''
                        ) <> ''
                    then
                        b14.IBDNumber
                    else
                        b3.BTP_IBDNumber
                end as                                                    String(10)
            )                                  as ObjectRefNo,
            cast(
                case
                    when
                        ifnull(
                            b13.NewPurchasing_Order, ''
                        ) <> ''
                    then
                        b13.NewPurchasing_Order
                    when
                        ifnull(
                            b14.Po_New, ''
                        ) <> ''
                    then
                        b14.Po_New
                    else
                        b3.purchaseOrderNumber
                end as                                                    String(10)
            )                                  as purchaseOrderNumber,
            cast(
                case
                    when
                        ifnull(
                            b13.NewPOLine, ''
                        ) <> ''
                    then
                        b13.NewPOLine
                    when
                        ifnull(
                            b14.PoItem_New, ''
                        ) <> ''
                    then
                        b14.PoItem_New
                    else
                        b3.orderItemNbr // replace with b3.orderItemNbr Bhushan
                end as                                                    String(10)
            )                                  as PurchaseOrderItem,
            cast(
                case
                    when
                        ifnull(
                            b13.NewPurchasing_Order, ''
                        ) <> ''
                    then
                        b13.Delivery
                    when
                        ifnull(
                            b14.Po_New, ''
                        ) <> ''
                    then
                        b14.IBDNumber
                    else
                        b3.BTP_IBDNumber
                end as                                                    String(10)
            )                                  as deliveryDocument,
            b1.modeOfTransport                 as ZTMODE,
            b1.houseBOLNumber                  as TRAID, //updated
            b1.vesselName                      as ZVESSEL, // updated
            b1.importShipmentNumber            as ZFOLDERNO,
            b1.recordType                      as ZRECTYPE,
            b1.voyageOrFlightNumber            as ZVOYAGE_NO,
            b1.initialDestination              as ZBOL_DEST,
            b1.ordererID                       as ZORDERERID,
            // b1.transmissionCreateDate          as ZTRANCREDATE,
            b4.endUserOrderNbr                 as ZCUSTPONO,
            b2.invoiceNumber                   as ZCAFACNUM,
            // b3.BTP_IBDAction                   as ZSTATUS, //defect 208
                        cast(
                case
                    when
                        ifnull(
                            b13.NewPurchasing_Order, ''
                        ) <> ''
                    then
                        b13.IBD_Action
                    else
                        b3.BTP_IBDAction
                
                end as                                                    String(2)
            )                                  as ZSTATUS, // added by Preethi on 12/09/24 for INC0221149 
            cast(
                case ifnull(
                    b3.SAP_LineID_IBD, 'X'
                )
                    when
                        'X'
                    then
                        b13.IBD_Item
                    else
                        b3.SAP_LineID_IBD
                end as                                                    String(10)

            )                                  as ZSAPLINEIDIBD,
            b3.lineNumber                      as ZINVLINENO,
            b4.mecaOrderNbr                    as ZMECAPONO, // Nithya changes on 7/12- mecaordernum getting from additionalinvoiceline
            b3.quantity                        as ZFINVLINEQTY,
            b3.numberOfCase                    as ZNOOFCASE,
            b3.quantityPerCase                 as ZQUANPERCASE,
            b2.invoiceNumber                   as LIFEX,
            b2.additionalInvoiceNumber         as ZADDINVENO, //Asif change in 29/11
            cast(
                case
                    when
                        T5.Function_Code = 'FG_DROP'
                    then
                        IFNULL(
                            b8.SalesOrder, ''
                        )
                    else
                        ''
                end as                                                    String(10)
            )                                  as ZSALESORDNO, // Nithya change on 24/01
            cast(
                b1.SCAC || '-' || 'UNDEFINED' as                          String(50)
            )                                  as TDLINE1,
            cast(
                b3.invoiceNumber.invoiceNumber || '-' || b3.lineNumber as String(50)
            )                                  as TDLINE2,
            b5.CreationDate                    as PODAT,
            b6.Plant                           as PARTNER_ID,
            b6.TaxJurisdiction                 as JURISDIC,
            b5.Language                        as LANGUAGE,
            TM.TRATY,
            cast(
                case ifnull(
                    T5.SAP_Code, 'X'
                )
                    when
                        'X'
                    then
                        b6.DeliveryAddressName
                    else
                        b11.DeliveryAddressName
                end as                                                    String(100)
            )                                  as ZDELVTONAME,
            cast(
                case ifnull(
                    T5.SAP_Code, 'X'
                )
                    when
                        'X'
                    then
                        b6.DeliveryAddressStreetName
                    else
                        b11.DeliveryAddressStreetName
                end as                                                    String(100)
            )                                  as ZSTREET1,
            cast(
                case ifnull(
                    T5.SAP_Code, 'X'
                )
                    when
                        'X'
                    then
                        b6.DeliveryAddressStreetName
                    else
                        b11.DeliveryAddressStreetName
                end as                                                    String(100)
            )                                  as ZSTREET2,
            cast(
                case ifnull(
                    T5.SAP_Code, 'X'
                )
                    when
                        'X'
                    then
                        b6.DeliveryAddressName2
                    else
                        b11.DeliveryAddressName2
                end as                                                    String(100)
            )                                  as ZSTREET4,
            cast(
                case ifnull(
                    T5.SAP_Code, 'X'
                )
                    when
                        'X'
                    then
                        b6.DeliveryAddressPostalCode
                    else
                        b11.DeliveryAddressPostalCode
                end as                                                    String(100)
            )                                  as ZPOSTALCODE,
            cast(
                case ifnull(
                    T5.SAP_Code, 'X'
                )
                    when
                        'X'
                    then
                        b6.DeliveryAddressCityName
                    else
                        b11.DeliveryAddressCityName
                end as                                                    String(100)
            )                                  as ZCITY1,
            cast(
                case ifnull(
                    T5.SAP_Code, 'X'
                )
                    when
                        'X'
                    then
                        b6.DeliveryAddressRegion
                    else
                        b11.DeliveryAddressRegion
                end as                                                    String(100)
            )                                  as ZSTATE,
            cast(
                case ifnull(
                    T5.SAP_Code, 'X'
                )
                    when
                        'X'
                    then
                        b6.DeliveryAddressCountry
                    else
                        b11.DeliveryAddressCountry
                end as                                                    String(100)
            )                                  as ZCOUNTRY,
            b11.Name1                          as NAME1,
            b11.Name2                          as NAME2,
            b11.Street                         as STREET1,
            b11.CityPostalCode                 as POSTL_COD1,
            b11.City                           as CITY1,
            b11.POBoxCity                      as CITY2,
            b11.Country                        as COUNTRY1,
            b11.Region                         as REGION,
            b5.PurchasingGroup                 as Purchasinggroup, //Asif change on 185 on 15/01
            b5.ShipToParty                     as ZCARACT,
            cast(
                SUBSTR(
                    b3.partID, 1, (
                        INSTR(
                            b3.partID, '~', 1
                        )-1
                    )
                ) as                                                      String(50)
            )                                  as ZUNIFIEDMODELNO,
            b4.salesOfficeContinue             as ZASNDIV,
            b1.carrierCode                     as ZCARRID,
            cast(
                b5.LastChangeDateTime as                                  Time
            )                                  as POTIM,
            cast(
                SUBSTRING(
                    b7.Legacy_Code, 1, 3
                ) as                                                      String(3)
            )                                  as DC,
            cast(
                SUBSTRING(
                    b7.Legacy_Code, 4, 3
                ) as                                                      String(3)
            )                                  as WHSE,
            b8.PartnerAccountNumber            as ALTKN,
            cast(
                'E' as                                                    String(1)
            )                                  as TDSPRAS,
            cast(
                '0' as                                                    String(1)
            )                                  as EXPIRY_DATE_EXT,
            cast(
                '0' as                                                    String(1)
            )                                  as EXPIRY_DATE_EXT_B,
            cast(
                'VS' as                                                   String(2)
            )                                  as ZCARR_ASN,
            b9.ZPOIND                          as ZINBTYPE,
            cast(
                case b9.ZDLVY_INSTR || b9.ZASN
                    when
                        'YN'
                    then
                        '1'
                    when
                        'NY'
                    then
                        '2'
                    when
                        'YY'
                    then
                        '3'
                end as                                                    String(1)
            )                                  as ZDIARIND,
            b13.NewPurchasing_Order,
            b13.NewPOLine


        }
        where
            ifnull(
                b3.status, ''
            ) != 'H'
            and (
                b3.BTP_IBDStatus = 'S'
                or (
                        ifnull(
                        b13.NewPurchasing_Order, ''
                    )                  <> ''
                    and b13.IBD_Status =  'S'
                )
                or (
                        ifnull(
                        b14.Po_New, ''
                    )                 <> ''
                    and b14.IBDStatus =  'S'
                )
            )
            and (
                   b9.ZDLVY_INSTR != 'N'
                or b9.ZASN        != 'N'
            ) //Defect 208partb.n
            ;
}
