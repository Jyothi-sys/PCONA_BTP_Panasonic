using BTP.Panasonic as BTP from '../db/data-model';


service Dashboard @(path: '/factoryint/dashboard'){

    entity POStatusMonitoring            as projection on BTP.POStatusMonitoring;
    entity MNetStatusMonitoring          as projection on BTP.MNetStatusMonitoring;
    entity bolHeader                     as projection on BTP.bolHeader;
    entity additionalInvoiceLine         as projection on BTP.additionalInvoiceLine;
    entity invoiceLine                   as projection on BTP.invoiceLine;
    entity invoiceHeader                 as projection on BTP.invoiceHeader;
    entity A_PurchaseOrder               as projection on BTP.A_PurchaseOrder;
    entity A_PurchaseOrderItem           as projection on BTP.A_PurchaseOrderItem;
    entity ZCROSSREF                     as projection on BTP.ZCROSSREF;
    entity POCrossRef                    as projection on BTP.POCrossRef;
    entity MNetStatusMonitoringItem      as projection on BTP.MNetStatusMonitoringItem;
    entity Environment                   as projection on BTP.Environment;
    entity MNET_DiversionHeader          as projection on BTP.MNET_DiversionHeader;
    entity MNET_DiversionDetail          as projection on BTP.MNET_DiversionDetail;
    entity MNET_ACTION                 as projection on BTP.MNET_ACTION;
    entity PurchaseGroup_GlobalCode      as projection on BTP.PurchaseGroup_GlobalCode;
    function pohist_bol(houseBOLNumber : String)     returns String;
    function pohist_head(shipnumber : String)        returns String;
    function pohist_invdate(houseBOLNumber : String) returns String;
    action postatus_batch (batch: array of POStatusMonitoring) returns array of String;
    action asn_di(batch: array of MNetStatusMonitoring) returns Boolean;
    
    // Asif changes on 01-03
    entity Get_MNetStatusMonitoring_Data as
        select from additionalInvoiceLine as T0
        inner join invoiceLine as T1
            on T0.partID.partID = T1.partID
            and T0.partID.invoiceNumber.houseBOLNumber.ID = T1.invoiceNumber.houseBOLNumber.ID
            and T0.partID.invoiceNumber.houseBOLNumber.houseBOLNumber = T1.invoiceNumber.houseBOLNumber.houseBOLNumber
            and T0.partID.invoiceNumber.invoiceNumber = T1.invoiceNumber.invoiceNumber
            and T0.partID.lineNumber = T1.lineNumber
        inner join invoiceHeader as T2
            on T2.invoiceNumber = T0.partID.invoiceNumber.invoiceNumber
            and T2.houseBOLNumber.houseBOLNumber = T0.partID.invoiceNumber.houseBOLNumber.houseBOLNumber
            and T2.houseBOLNumber.ID = T0.partID.invoiceNumber.houseBOLNumber.ID
        inner join bolHeader as T3
            on  T3.houseBOLNumber                         = T0.partID.invoiceNumber.houseBOLNumber.houseBOLNumber
            and T0.partID.invoiceNumber.houseBOLNumber.ID = T3.ID
        {
            T3.ID,
            T2.invoiceNumber                   as invoiceNumber,
            T0.orderItemNbr                    as orderItemNbr,
            T1.partID                          as partID,
            T3.houseBOLNumber                  as houseBOLNumber,
            T1.invoiceNumber.houseBOLNumber.ID as InvoiceNumber_ID,
            T1.purchaseOrderNumber
        };


    //Defect 85. This view gives an incorrect Stock/Drop Status. Also redundant join to PurchaseGroup_GlobalCode is made here and this is removed. This is because the view evaluates Stock and Drop value based on the plant associated with existing purchase orderlineitem. A Separate Procedure (Get_StockDrop_Status) must be called for the subset of records to be processed off this view. Do Not use the StockDrop Status as is from this view. For this view modifed left join on ZCROSSREF to a left outer join and removed redundant checks on Function_Code
    entity Get_StockDrop_Status          as  
        select from A_PurchaseOrder as T0
        inner join A_PurchaseOrderItem as T1
            on T0.PurchaseOrder = T1.PurchaseOrder.PurchaseOrder
        //left join PurchaseGroup_GlobalCode as T3
        //    on T0.PurchasingOrganization = T3.PurchaseGroup
        //    left join ZCROSSREF as T2
        left outer join ZCROSSREF as T2
            on ((
        //        ((T2.Function_Code = 'FG_DROP' or  T2.Function_Code = 'PART_DROP') or  //Defect 85.o
        //(T2.Function_Code <> 'FG_DROP' and T2.Function_Code <> 'PART_DROP')) and       //Defect 85.o 
         T2.SAP_Code=trim(T1.Plant)))       
         {
            T0.PurchaseOrder,
            T1.PurchaseOrderItem,
            cast(
                case when ((T2.Function_Code = 'FG_DROP' OR T2.Function_Code = 'PART_DROP' OR T2.Function_Code = 'FG_DROP_ENDUSER') and
                    ifnull(
                    T2.SAP_Code, 'false'  
                ) = trim(T1.Plant))
                    then
                        'Drop'
                    else
                        'Stock'
                end as String(10)
            ) as Status,   // added by Asif 22/01  190 defect
        };


    //Created get service for Price Changes Report
    entity Get_Price_Changes_Report      as
        select from A_PurchaseOrderItem as T0
        inner join invoiceLine as T1
            on T0.PurchaseOrder.PurchaseOrder = T1.purchaseOrderNumber
        inner join bolHeader as T2
            on T1.invoiceNumber.houseBOLNumber.ID = T2.ID
        {
            T0.PurchaseOrder         as PurchaseOrder,
            T0.Material,
            T0.NetPriceAmount        as OriginalPrice,
            T1.unitPrice             as RevisedPrice,
            T2.initialDestinationETA as RevisedDate,
        }
        where
            T0.NetPriceAmount <> T1.unitPrice;

    entity GET_PO_MNET_DATA              as
        select from MNetStatusMonitoring as T0
        inner join MNetStatusMonitoringItem as T1
            on T0.ID = T1.ID.ID
        distinct {
            T1.PurchaseOrder,
            T0.ObjectRefNo
        }
        where
                T0.ObjectType = 'InboundDelivery'
            and T0.Status     = 'S';
}