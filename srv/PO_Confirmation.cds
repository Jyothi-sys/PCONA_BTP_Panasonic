using BTP.Panasonic as BTP from '../db/data-model';

service PO_Confirmation @(path: '/factoryint/po-confirmation'){
entity A_PurchaseOrderScheduleLine as projection on BTP.A_PurchaseOrderScheduleLine;
entity bolHeader                   as projection on BTP.bolHeader;
entity invoiceHeader               as projection on BTP.invoiceHeader;
entity invoiceLine                 as projection on BTP.invoiceLine;
entity additionalInvoiceLine       as projection on BTP.additionalInvoiceLine;
entity A_PurchaseOrderItem        as projection on BTP.A_PurchaseOrderItem;


    type ScheduleLine {
        PurchaseOrder                 : String(50);
        PurchaseOrderItem             : String(10);
        DelivDateCategory             : String(1);
        ScheduleLineDeliveryDate      : Date;
        ScheduleLineOrderQuantity     : Decimal(18, 4);
        ScheduleLineDeliveryTime      : Time;
        SchedLineStscDeliveryDate     : Date;
        PurchaseRequisition           : String(10);
        PurchaseRequisitionItem       : String(10);
        ScheduleLineCommittedQuantity : Decimal(18, 4);
        PerformancePeriodStartDate    : Date;
        PerformancePeriodEndDate      : Date;
    };

entity POConfirmationData as projection on BTP.POConfirmationData;

    action Testing_Method() returns String;
    
    action Testing_MethodNew() returns String;
   
   entity GET_MNET_DATA as 
   Select from bolHeader AS T0 
   Inner join invoiceHeader AS  T1 on T0.houseBOLNumber = T1.houseBOLNumber.houseBOLNumber
   inner join invoiceLine As T2 on T1.invoiceNumber = T2.invoiceNumber.invoiceNumber
   Inner join A_PurchaseOrderItem As P1 on P1.PurchaseOrder.PurchaseOrder = T2.purchaseOrderNumber 
   And P1.Material = T2.buyerPartID
   {
     T0.houseBOLNumber,
     T0.initialDestinationETA,
     T1.invoiceNumber,
     T1.supplierID,
     T1.invoiceCurrencyCode,
     T2.purchaseOrderNumber,
     T2.buyerPartID,
     T2.quantity,
     T2.extendedCost,
     T2.partUnitOfMeasurement,
     T2.lineNumber,
     T2.containerID,
     P1.PurchaseOrderItem,
     P1.Plant,
     P1.PurchaseOrder.CompanyCode

   };

}