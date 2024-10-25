using BTP.Panasonic as BTP from '../db/data-model';
using {API_BUSINESS_PARTNER_API as ext_BUSINESS_PARTNER} from './external/API_BUSINESS_PARTNER_API.csn';
using {API_SALES_ORDER_SRV as ext_SALES_ORDER} from './external/API_SALES_ORDER_SRV.csn';
using {MM_PUR_POITEMS_MONI_SRV as ext_MM_PUR_POITEMS_MONI} from './external/MM_PUR_POITEMS_MONI_SRV.csn';
using {SHIPPOINTADDR as ext_SHIPPOINTADDR} from './external/SHIPPOINTADDR.csn';
using {API_SUPPLIERINVOICE_PROCESS_SRV as ext_SUPPLIERINVOICE_PROCESS} from './external/API_SUPPLIERINVOICE_PROCESS_SRV.csn';


service MNET_WORKFLOW @(path: '/factoryint/mnet-workflow') {
  entity bolHeader                      as projection on BTP.bolHeader;
  entity invoiceHeader                  as projection on BTP.invoiceHeader;
  entity invoiceLine                    as projection on BTP.invoiceLine;
  entity additionalInvoiceLine          as projection on BTP.additionalInvoiceLine;
  entity A_PurchaseOrderItem            as projection on BTP.A_PurchaseOrderItem;
  entity A_PurchaseOrder                as projection on BTP.A_PurchaseOrder;
  entity MNetStatusMonitoring           as projection on BTP.MNetStatusMonitoring;
  entity MNetStatusMonitoringItem       as projection on BTP.MNetStatusMonitoringItem;
  entity ZMNETBUSINESS                  as projection on BTP.ZMNETBUSINESS;
  entity ZMNETMODE                      as projection on BTP.ZMNETMODE;

  entity POCrossRef                     as projection on BTP.POCrossRef
                                           where
                                             IsDelete = 'N';

  entity ZCROSSREF                      as projection on BTP.ZCROSSREF;
  entity A_PurOrdAccountAssignment      as projection on BTP.A_PurOrdAccountAssignment;
  entity PO_AdditionalData              as projection on BTP.PO_AdditionalData;
  entity SalesOrder                     as projection on ext_SALES_ORDER.A_SalesOrder;
  entity SalesOrderItem                 as projection on ext_SALES_ORDER.A_SalesOrderItem;
  entity SalesOrderItemPartner          as projection on ext_SALES_ORDER.A_SalesOrderItemPartner
  entity SalesOrderHeaderPartner        as projection on ext_SALES_ORDER.A_SalesOrderHeaderPartner;
  entity BusinessPartner                as projection on ext_BUSINESS_PARTNER.A_BusinessPartner;
  entity BusinessPartnerAddress         as projection on ext_BUSINESS_PARTNER.A_BusinessPartnerAddress;
  entity ShipPointAddress               as projection on ext_SHIPPOINTADDR.AddrShipPointSet;
  entity supplierInvoice                as projection on ext_SUPPLIERINVOICE_PROCESS.A_SupplierInvoice;
  entity Environment                    as projection on BTP.Environment;
  entity C_PurchaseOrderItemMoni        as projection on ext_MM_PUR_POITEMS_MONI.C_PurchaseOrderItemMoni;
  entity C_PurchaseOrderItemMoniResults as projection on ext_MM_PUR_POITEMS_MONI.C_PurchaseOrderItemMoniResults;
  entity MNET_ACTION                    as projection on BTP.MNET_ACTION;
  entity MNET_DeliveryDocumentItem      as projection on BTP.MNET_DeliveryDocumentItem;
  entity MNET_SuplrInvcItemPurOrdRef    as projection on BTP.MNET_SuplrInvcItemPurOrdRef;

  type TT_MNET {
    purchaseOrderNumber : String(50);
    houseBOLNumber      : String(50);
    BOLID               : Integer
  };

  action   POST_MNET(ID : Integer, bolHeader : many bolHeader)                                                                                                                                                                   returns array of TT_MNET;
  action   POST_MNET_V1(ID : Integer, bolHeader : many bolHeader)                                                                                                                                                                returns array of TT_MNET;
  action   V_UPDATE_OPEN_QTY(PurchaseOrder : String(10))                                                                                                                                                                         returns Boolean;
  action   UPDATE_A_PurchaseOrder(BOLID : Integer, houseBOLNumber : String(50), A_PurchaseOrder : many A_PurchaseOrder)                                                                                                          returns Boolean;
  action   UPDATE_A_PurchaseOrder_V1(BOLID : Integer, houseBOLNumber : String(50), PurchaseOrder : String(50))                                                                                                                   returns Boolean;
  action   UPDATE_PO_DATA(ID : Integer, A_PurchaseOrder : many A_PurchaseOrder)                                                                                                                                                  returns Boolean;
  function Get_GR()                                                                                                                                                                                                              returns array of String;
  action   Update_InvoiceLine_OrderItemNbr(PurchaseOrder : String(10), PurchaseOrderItem : String(10), Material : String(20), invoiceNumber : String(16), BOLID : Integer, houseBOLNumber : String(18), lineNumber : String(30)) returns array of String;

  entity GET_MNET_DeliveryDocumentItem  as
    select from MNET_DeliveryDocumentItem as T0
    inner join invoiceLine as T1
      on  T0.INVID      = T1.invoiceNumber.invoiceNumber
      and T0.BOL        = T1.invoiceNumber.houseBOLNumber.houseBOLNumber
      and T0.BOLID      = T1.invoiceNumber.houseBOLNumber.ID
      and T0.lineNumber = T1.lineNumber
      and T0.CONID      = T1.containerID
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
      T1.BTP_IBDStatus,
      T1.BTP_IBDAction
    }
    where
      T1.status in (
        'C', 'H', 'O', 'P', 'E'
      );
  // This view is used for processing IBDs in the event an Mnet File is processed.

  // Removed the GET_PO_ITEMID function, has it is redundant code for the OrderItemnumber.
  // PO_ITEMID is been picked from Invoicline's OrderItemnumber which will contain assocaited Orderitem number for Substituted part and part ordered on PO
  // Added GET_PO_ITEMID function to take OrderItem Number for parts Substituted line
  entity GET_MNET_DATA                  as
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
      // and P1.Material                    = IFNULL(
      //   T3.PASCOriginalPartsNbr, cast(
      //     GET_MNET_ITEM(
      //       T2.partID
      //     ) as String(50)
      //   )
      // )
      and T2.orderItemNbr                = P1.PurchaseOrderItem
    left join A_PurchaseOrder as P2
      on P2.PurchaseOrder = T2.purchaseOrderNumber
    left join ZMNETMODE as TM
      on TM.TMODE = T0.modeOfTransport
    left join ZCROSSREF as T5
      on P1.Plant = T5.SAP_Code
      and (
           T5.Function_Code = 'FG_DROP'
        or T5.Function_Code = 'PART_DROP'
      )
    distinct {
      T0.ID,
      T0.houseBOLNumber,
      T0.initialDestinationETA,
      T1.invoiceNumber,
      T1.supplierID,
      T1.invoiceCurrencyCode,
      T1.invoicedate,
      T2.purchaseOrderNumber,
      T2.buyerPartID,
      T2.quantity,
      T2.extendedCost,
      T2.unitPrice,
      T2.partUnitOfMeasurement,
      //T3.qtyPerSLSUnitPricePackType,
      P1.PurchaseOrderQuantityUnit, //Adding to consider the quantity unit from A_PurchaseorderItem level
      T2.lineNumber,
      T2.containerID,
      // cast(
      //   IFNULL(
      //     P1.PurchaseOrderItem, T3.orderItemNbr
      //   ) as   String(10)
      // )                    as PurchaseOrderItem,
      T2.orderItemNbr      as PurchaseOrderItem,
      P1.Plant,
      // cast(
      //   GET_COMPANY_CODE(
      //     T2.purchaseOrderNumber
      //   ) as   String(4)
      // )                    as CompanyCode,
      P2.CompanyCode       as CompanyCode,
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
      T2.status            as INVOICELINESTATUS, // defect 61 on 24/03
      T2.action            as INVACTION,
      T2.BTP_IBDStatus     as BTPIBDSTATUS,
      T2.BTP_InvoiceStatus as BTPINVSTATUS,
      T2.BTP_GRStatus      as BTPGRSTATUS,
      T2.BTP_GRNumber      as BTPGRNUMBER, // defect 61 on 24/03
      T2.BTP_ASN_DI_Status as BTPASNDISTATUS,
      T0.importShipmentNumber,
      // cast(
      //            GET_PO_ITEMID(
      //                T2.purchaseOrderNumber, GET_MNET_ITEM(
      //                    T2.partID
      //                )
      //           ) as   String(10)
      //        )                    as PO_ITEMID,
      T2.orderItemNbr      as PO_ITEMID,
      T3.orderItemNbr      as PASCOrderItemNbr
    }

    where
          T2.status != 'H'
      and T2.status != 'I';

  entity GET_MNET_DATA_SUB              as
    select from GET_MNET_DATA as T0
    left join A_PurchaseOrderItem as P1
      on  T0.purchaseOrderNumber = P1.PurchaseOrder.PurchaseOrder
      and T0.supplierPartID      = P1.Material
      and T0.PO_ITEMID           = P1.PurchaseOrderItem
    {
      T0.ID,
      T0.houseBOLNumber,
      T0.initialDestinationETA,
      T0.invoiceNumber,
      T0.supplierID,
      T0.invoiceCurrencyCode,
      T0.purchaseOrderNumber,
      T0.buyerPartID,
      T0.quantity,
      T0.extendedCost,
      T0.unitPrice,
      T0.partUnitOfMeasurement,
      T0.lineNumber,
      T0.containerID,
      T0.PurchaseOrderItem,
      P1.Plant,
      P1.PurchaseOrder.CompanyCode,
      T0.PASCOriginalPartsNbr,
      P1.OrderQuantity,
      P1.NetPriceAmount,
      P1.StorageLocation,
      P1.ScheduleLineOpenQty,
      T0.businessUnit,
      T0.supplierPartID,
      T0.recordType,
      T0.shipMethod,
      T0.paymentConditionCode,
      T0.INV_FLAG,
      T0.POType,
      T0.TRATY,
      P1.ValuationType,
      T0.BOLSTATUS,
      T0.INVACTION,
      T0.importShipmentNumber,
      T0.PO_ITEMID

    }
    where
      IFNULL(
        T0.PASCOriginalPartsNbr, ''
      ) != '';

  // entity GetGRData_1                    as
  //   select from bolHeader as T0
  //   inner join invoiceHeader as T1
  //     on  T0.houseBOLNumber = T1.houseBOLNumber.houseBOLNumber
  //     and T0.ID             = T1.houseBOLNumber.ID
  //   inner join MNetStatusMonitoring as T2
  //     on  T0.houseBOLNumber = T2.houseBOLNumber
  //     and T1.invoiceNumber  = T2.invoiceNumber
  //   distinct {
  //     T0.houseBOLNumber,
  //     T1.invoiceNumber,
  //     T2.ObjectRefNo as deliveryDocument
  //   }
  //   where
  //         T2.ObjectType =  'InboundDelivery'
  //     and T2.Status     =  'S'
  //     and TO_VARCHAR(
  //       TO_DATE(
  //         T0.initialDestinationETA
  //       ), 'YYYY-MM-DD'
  //     )                 <= TO_VARCHAR(
  //       TO_DATE(
  //         now()
  //       ), 'YYYY-MM-DD'
  //     );

  //altered getgrdata entity for defect 232 due reduce the execution time
  /* Implementation: We have added the logic for Max_ID from the InvoiceLine using the Status.
  Author: Mohammed Asif Baba
  Date: 15-05-2024
  Defect: UAT_82 */
  entity GetGRData                      as
    select from GET_MNET_DATA as T0
    inner join invoiceLine as T4
      on  T0.houseBOLNumber      =  T4.invoiceNumber.houseBOLNumber.houseBOLNumber
      and T0.invoiceNumber       =  T4.invoiceNumber.invoiceNumber
      and T0.purchaseOrderNumber =  T4.purchaseOrderNumber
      and T0.ID                  =  T4.invoiceNumber.houseBOLNumber.ID
      and T0.lineNumber          =  T4.lineNumber
      and T4.status              =  'P'
      and (
           T4.BTP_GRStatus is null
        or T4.BTP_GRStatus =  ''
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
      T0.importShipmentNumber,
      T0.houseBOLNumber,
      T0.invoiceNumber,
      T0.containerID,
      T0.purchaseOrderNumber,
      T4.BTP_IBDNumber         as deliveryDocument,
      T0.initialDestinationETA as ETA

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
            and not                                            (
                  T8.BTP_GRStatus <>     ''
              and T8.BTP_GRStatus is not null
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
  // defect 232 - Preethi

  entity GetPOAdditionalFields          as
    select from A_PurchaseOrder as T0 {
      T0.PurchaseOrder,
      T0.CompanyCode,
      T0.PurchasingGroup,
      cast(
        GET_CONSIGNEECODE(
          T0.PurchaseOrder
        ) as String(10)
      ) as ConsigneeCode,
      cast(
        GET_WAREHOUSE(
          T0.PurchaseOrder
        ) as String(10)
      ) as Warehouse,
      cast(
        GET_PARTNERWAREHOUSE(
          T0.PurchaseOrder
        ) as String(10)
      ) as PartnerWarehouse,
      cast(
        GET_PARTNERWAREHOUSECODE(
          T0.PurchaseOrder
        ) as String(10)
      ) as PartnerWarehouseCode,
      cast(
        GET_SELLERCODE(
          T0.PurchaseOrder
        ) as String(10)
      ) as SellerCode,
      cast(
        GET_SHIPMETHD(
          T0.PurchaseOrder
        ) as String(10)
      ) as ShipmentMethod,
      cast(
        GET_CITYID(
          T0.PurchaseOrder
        ) as String(10)
      ) as CityID,
      cast(
        GET_PAYERCODE(
          T0.PurchaseOrder
        ) as String(10)
      ) as PayerCode,
      cast(
        GET_SALESROUTECODE(
          T0.PurchaseOrder
        ) as String(10)
      ) as SalesRouteCode
    };

}