using BTP.Panasonic as BTP from '../db/data-model';
using {API_BUSINESS_PARTNER_API as ext_BUSINESS_PARTNER} from './external/API_BUSINESS_PARTNER_API.csn';
using {API_SALES_ORDER_SRV as ext_SALES_ORDER} from './external/API_SALES_ORDER_SRV.csn';
using {SHIPPOINTADDR as ext_SHIPPOINTADDR} from './external/SHIPPOINTADDR.csn';
using {API_SUPPLIERINVOICE_PROCESS_SRV as ext_SUPPLIERINVOICE_PROCESS} from './external/API_SUPPLIERINVOICE_PROCESS_SRV.csn';


service PO_Services @(path: '/factoryint/po-services'){

 entity A_PurchaseOrder             as projection on BTP.A_PurchaseOrder;

entity PO_AdditionalData as projection on BTP.PO_AdditionalData;
entity SalesOrder as projection on ext_SALES_ORDER.A_SalesOrder;
entity SalesOrderItem as projection on ext_SALES_ORDER.A_SalesOrderItem;
entity SalesOrderItemPartner as projection on ext_SALES_ORDER.A_SalesOrderItemPartner
entity SalesOrderHeaderPartner as projection on ext_SALES_ORDER.A_SalesOrderHeaderPartner;
entity BusinessPartner as projection on ext_BUSINESS_PARTNER.A_BusinessPartner;
entity BusinessPartnerAddress as projection on ext_BUSINESS_PARTNER.A_BusinessPartnerAddress;
entity ShipPointAddress as projection on ext_SHIPPOINTADDR.AddrShipPointSet;
entity supplierInvoice as projection on ext_SUPPLIERINVOICE_PROCESS.A_SupplierInvoice;
entity A_PurOrdAccountAssignment as projection on BTP.A_PurOrdAccountAssignment;

entity GetPOAdditionalFields as 
    select from A_PurchaseOrder as T0
    {
        T0.PurchaseOrder,
        T0.CompanyCode,
        T0.PurchasingGroup,
        cast(GET_CONSIGNEECODE(T0.PurchaseOrder) as String(10)) as ConsigneeCode,
        cast(GET_WAREHOUSE(T0.PurchaseOrder) as String(10)) as Warehouse,
        cast(GET_PARTNERWAREHOUSE(T0.PurchaseOrder) as String(10)) as PartnerWarehouse,
        cast(GET_PARTNERWAREHOUSECODE(T0.PurchaseOrder) as String(10)) as PartnerWarehouseCode,
        cast(GET_SELLERCODE(T0.PurchaseOrder) as String(10)) as SellerCode,
        cast(GET_SHIPMETHD(T0.PurchaseOrder) as String(10)) as ShipmentMethod,
        cast(GET_CITYID(T0.PurchaseOrder) as String(10)) as CityID,
        cast(GET_PAYERCODE(T0.PurchaseOrder) as String(10)) as PayerCode,
        cast(GET_SALESROUTECODE(T0.PurchaseOrder) as String(10)) as SalesRouteCode
    };
  
}