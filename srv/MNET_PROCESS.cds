using BTP.Panasonic as BTP from '../db/data-model';


service MNET_PROCESS @(path: '/factoryint/mnet-process'){

    entity bolHeader                 as projection on BTP.bolHeader;
    entity invoiceHeader             as projection on BTP.invoiceHeader;
    entity invoiceLine               as projection on BTP.invoiceLine;
    entity additionalInvoiceLine     as projection on BTP.additionalInvoiceLine;
    entity A_PurchaseOrder           as projection on BTP.A_PurchaseOrder;
    entity ZCROSSREF                 as projection on BTP.ZCROSSREF;
    entity A_PurOrdAccountAssignment as projection on BTP.A_PurOrdAccountAssignment;
    entity A_PurchaseOrderItem       as projection on BTP.A_PurchaseOrderItem;
    entity MNetStatusMonitoring      as projection on BTP.MNetStatusMonitoring;
    entity ZMNETBUSINESS             as projection on BTP.ZMNETBUSINESS;

}