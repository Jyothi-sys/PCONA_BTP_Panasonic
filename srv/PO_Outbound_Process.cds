using BTP.Panasonic as BTP from '../db/data-model';
using {API_BUSINESS_PARTNER_API as ext_BUSINESS_PARTNER} from './external/API_BUSINESS_PARTNER_API.csn';
using {API_SALES_ORDER_SRV as ext_SALES_ORDER} from './external/API_SALES_ORDER_SRV.csn';
using {SHIPPOINTADDR as ext_SHIPPOINTADDR} from './external/SHIPPOINTADDR.csn';
using {API_SUPPLIERINVOICE_PROCESS_SRV as ext_SUPPLIERINVOICE_PROCESS} from './external/API_SUPPLIERINVOICE_PROCESS_SRV.csn';


service PO_Outbound_Process @(path: '/factoryint/po-outbound-process') {

    entity A_PurchaseOrder             as projection on BTP.A_PurchaseOrder;
    entity A_PurchaseOrder_Update      as projection on A_PurchaseOrder;
    entity A_PurchaseOrderItem         as projection on BTP.A_PurchaseOrderItem;
    entity POStatusMonitoring          as projection on BTP.POStatusMonitoring;
    entity A_PurchaseOrderScheduleLine as projection on BTP.A_PurchaseOrderScheduleLine;
    entity A_PurOrdAccountAssignment   as projection on BTP.A_PurOrdAccountAssignment;
    entity A_PurOrdPricingElement      as projection on BTP.A_PurOrdPricingElement;
    entity PurchaseGroup_GlobalCode    as projection on BTP.PurchaseGroup_GlobalCode;
    entity ZCROSSREF                   as projection on BTP.ZCROSSREF;
    entity OrderMark                   as projection on BTP.OrderMark;
    entity Vendor_Ref                  as projection on BTP.Vendor_Ref;
    entity Fixed_Value                 as projection on BTP.Fixed_Value;
    entity POConfirmationHistory       as projection on BTP.POConfirmationHistory;
    entity POConfirmationData          as projection on BTP.POConfirmationData;
    entity Environment                 as projection on BTP.Environment;
    entity PO_AdditionalData           as projection on BTP.PO_AdditionalData;
    entity SalesOrder                  as projection on ext_SALES_ORDER.A_SalesOrder;
    entity SalesOrderItem              as projection on ext_SALES_ORDER.A_SalesOrderItem;
    entity SalesOrderItemPartner       as projection on ext_SALES_ORDER.A_SalesOrderItemPartner
    entity SalesOrderHeaderPartner     as projection on ext_SALES_ORDER.A_SalesOrderHeaderPartner;
    entity BusinessPartner             as projection on ext_BUSINESS_PARTNER.A_BusinessPartner;
    entity BusinessPartnerAddress      as projection on ext_BUSINESS_PARTNER.A_BusinessPartnerAddress;
    entity ShipPointAddress            as projection on ext_SHIPPOINTADDR.AddrShipPointSet;
    entity supplierInvoice             as projection on ext_SUPPLIERINVOICE_PROCESS.A_SupplierInvoice;
    function vendorRefCreateAndUpdate(Client : String, Legacy : String, Vendor : String, MatlGroup : String, Producthierarchy : String, Createdby : String, Created : Date, Time : Time, Changedby : String, LastChg : Date, ChangeTime : Time)                                                                                                           returns String;
    function orderMarkCreateAndUpdate(MANDT : String, ORDERMARK : String, ORDERTYPE : String, FREEIND : String, SPECIND : String, PCBIND : String, TOOLIND : String, LARGEQTYIND : String, IGPIND : String, MAINPARTSIND : String, REFURBPARTSIND : String, DISCPARTSIND : String, SERVICEMANIND : String, REPAIRRETIND : String, SHIPMETHODIND : String) returns String;

    function fixedValueCreateAndUpdate(Sequence_Number : String,
                                       SegDescription : String,
                                       Seg01 : String,
                                       Field01 : String,
                                       Seg02 : String,
                                       Field02 : String,
                                       Seg03 : String,
                                       Field03 : String,
                                       Seg04 : String,
                                       Field04 : String,
                                       Seg05 : String,
                                       Field05 : String,
                                       Value : String,
                                       MatType : String,
                                       modifiedBy : String,
                                       modifiedAt : DateTime,
                                       createdBy : String,
                                       createdAt : DateTime)                                                                                                                                                                                                                                                                                              returns String;

    function zvendor_ref_delete(Client : String, Legacy : String, Vendor : String)                                                                                                                                                                                                                                                                        returns String;
    function zordermark_delete(MANDT : String, ORDERMARK : String)                                                                                                                                                                                                                                                                                        returns String;
    function UserDetails_1()                                                                                                                                                                                                                                                                                                                              returns String;
    function zfixed_delete(Sequence_Number : String)                                                                                                                                                                                                                                                                                                      returns String;

    type TT_AdditionalData {
        Seg   : String(50);
        Value : String(50);
    }


    action   Create_PO_Out(ID : Integer, PurchaseOrder : many A_PurchaseOrder)                                                                                                                                                                                                                                                                            returns array of TT_AdditionalData;
    action   UPDATE_ABLine(PurchaseOrder : String(10))                                                                                                                                                                                                                                                                                                    returns Boolean;
    action   UPDATE_ABLine1(PurchaseOrder : String(10))                                                                                                                                                                                                                                                                                                   returns Boolean;
    function PostData()                                                                                                                                                                                                                                                                                                                                   returns Boolean; //Saurabh 27/01


    entity PO_S4_Data                  as
        select from A_PurchaseOrder as p0
        inner join A_PurchaseOrderItem as p1
            on p1.PurchaseOrder.PurchaseOrder = p0.PurchaseOrder
        inner join A_PurchaseOrderScheduleLine as p2
            on p2.PurchasingDocumentItem.PurchaseOrderItem = p1.PurchaseOrderItem
        {
            p0.PurchaseOrderType,
            p0.PurchaseOrder,
            p1.PurchaseOrderItem,
            p1.OrderQuantity,
            p1.PurchaseOrderQuantityUnit,
            p1.SupplierMaterialNumber,
        };

    entity GetPOAdditionalFields       as
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

    entity GetAdditionalData           as
            select from Fixed_Value as A {
                cast(
                    CONCAT_NAZ(
                        CONCAT_NAZ(
                            CONCAT_NAZ(
                                CONCAT_NAZ(
                                    CONCAT_NAZ(
                                        CONCAT_NAZ(
                                            CONCAT_NAZ(
                                                CONCAT_NAZ(
                                                    CONCAT_NAZ(
                                                        A.Seg01, '-' || A.Field01
                                                    ), '-' || A.Seg02
                                                ), '-' || A.Field02
                                            ), '-' || A.Seg03
                                        ), '-' || A.Field03
                                    ), '-' || A.Seg04
                                ), '-' || A.Field04
                            ), '-' || A.Seg05
                        ), '-' || A.Field05
                    ) as                          String(30)
                ) as Seg,
                Value,
                A.MatType,
                cast(
                    '0' as                        String(15)
                ) as PurchaseOrder
            }
        union
            select
                cast(
                    'UNB-0020' as                 String(30)
                ) as Seg,
                cast(
                    cast(
                        GET_SEQ() as              String(10)
                    ) as                          String(10)
                ) as Value,
                cast(
                    'PART_FG' as                  String(10)
                ) as MatType,
                cast(
                    '0' as                        String(15)
                ) as PurchaseOrder
            from Environment
            where
                APPID = 'PO'
        union
            select
                cast(
                    'DTM-C507-2380-5-' as         String(30)

                ) || B.PurchasingDocumentItem.PurchaseOrderItem as Seg,
                cast(
                    GET_ETD_OUTBOUND(
                        A.PurchaseOrder, A.CorrespncInternalReference, SUBSTRING(
                            A.SupplierPhoneNumber, 5
                        ), MIN(
                            B.ScheduleLineDeliveryDate
                        )
                    ) as                          String(10)
                )                                               as Value,
                cast(
                    'PART' as                     String(10)
                )                                               as MatType,
                A.PurchaseOrder
            from A_PurchaseOrder as A,
            A_PurchaseOrderScheduleLine as B
            where
                A.PurchaseOrder = B.PurchasingDocument
            group by
                A.PurchaseOrder,
                A.CorrespncInternalReference,
                A.SupplierPhoneNumber,
                B.PurchasingDocumentItem.PurchaseOrderItem
        union
            select
                cast(
                    'FTX-C108-4440' as            String(30)
                )            as Seg,
                A.GlobalCode as Value,
                cast(
                    'FG' as                       String(10)
                )            as MatType,
                B.PurchaseOrder
            from PurchaseGroup_GlobalCode as A
            inner join A_PurchaseOrder as B
                on A.PurchaseGroup = B.PurchasingGroup
        union
            select
                cast(
                    'FTX-C108-4440_2' as          String(30)
                )               as Seg,
                IFNULL(
                    A.Parameter1, ''
                )               as Value,
                cast(
                    'PART_FG' as                  String(10)
                )               as MatType,
                B.PurchaseOrder as PurchaseOrder
            from ZCROSSREF as A
            right join A_PurchaseOrder as B
                on  A.Company_Code  = B.CompanyCode
                and A.Function_Code = 'RECEIVER_CODE_PARTS'
                and A.SAP_Code      = B.VendorCountry
                and exists          (select C.PurchaseGroup from PurchaseGroup_GlobalCode as C
                where
                    C.PurchaseGroup = B.PurchasingGroup
                )
        union
            select distinct
                cast(
                    'SG1-RFF-C506-1154-3' as      String(30)
                )   as Seg,
                case D.Legacy
                    when
                        '3054'
                    then
                        '3'
                    when
                        '0549'
                    then
                        '6'
                    else
                        '1'
                end as Value,
                cast(
                    'PART' as                     String(10)
                )   as MatType,
                A.PurchaseOrder
            from A_PurchaseOrder as A
            inner join A_PurchaseOrderItem as B
                on B.PurchaseOrder.PurchaseOrder = A.PurchaseOrder
            left join A_PurOrdAccountAssignment as C
                on  B.PurchaseOrderItem           = C.PurchaseOrderItem.PurchaseOrderItem
                and B.PurchaseOrder.PurchaseOrder = C.PurchaseOrderItem.PurchaseOrder.PurchaseOrder
            left outer join Vendor_Ref as D
                on  D.Vendor =  C.PartnerAccountNumber
                and D.Legacy in (
                    '3054', '0549'
                )
        union
            select
                cast(
                    'SG1-RFF-C506-1154-4' as      String(30)
                )               as Seg,
                A.ORDERTYPE     as Value,
                cast(
                    'PART' as                     String(10)
                )               as MatType,
                B.PurchaseOrder as PurchaseOrder
            from OrderMark as A
            inner join A_PurchaseOrder as B
                on A.ORDERMARK = B.CorrespncExternalReference
        union
            select
                cast(
                    'SG1-RFF-C506-1154-5' as      String(30)
                )               as Seg,
                A.FREEIND       as Value,
                cast(
                    'PART' as                     String(10)
                )               as MatType,
                B.PurchaseOrder as PurchaseOrder
            from OrderMark as A
            inner join A_PurchaseOrder as B
                on A.ORDERMARK = B.CorrespncExternalReference

        union
            select
                cast(
                    'SG1-RFF-C506-1154-17' as     String(30)
                )               as Seg,

                IFNULL(
                    A.Legacy_Code, ''
                )               as Value,
                cast(
                    'FG' as                       String(10)
                )               as MatType,
                B.PurchaseOrder as PurchaseOrder
            from ZCROSSREF as A
            right outer join A_PurchaseOrder as B
                on  A.Company_Code  = B.CompanyCode
                and A.Function_Code = 'ORIGINATOR_CODE'
        union
            select
                cast(
                    'SG1-RFF-C506-1154-18' as     String(30)
                )            as Seg,
                A.GlobalCode as Value,
                cast(
                    'FG' as                       String(10)
                )            as MatType,
                B.PurchaseOrder
            from PurchaseGroup_GlobalCode as A
            inner join A_PurchaseOrder as B
                on A.PurchaseGroup = B.PurchasingGroup
        union
            select
                cast(
                    'SG1-RFF-C506-1154-22' as     String(30)

                ) as Seg,
                cast(
                    case A.PurchasingCollectiveNumber
                        when
                            'W'
                        then
                            'SCMS'
                        when
                            'M'
                        then
                            'SCMM'
                    end as                        String(5)
                ) as Value, //W = SCMS and if M = SCMM
                cast(
                    'FG' as                       String(10)
                ) as MatType,
                A.PurchaseOrder
            from A_PurchaseOrder as A
        union
            select
                cast(
                    'SG2-NAD-C082-3039-1' as      String(30)
                )            as Seg,
                A.GlobalCode as Value,
                cast(
                    'PART_FG' as                  String(10)
                )            as MatType,
                B.PurchaseOrder
            from PurchaseGroup_GlobalCode as A
            inner join A_PurchaseOrder as B
                on A.PurchaseGroup = B.PurchasingGroup
        union
            select
                cast(
                    'SG2-SG5-CTA-C056-3412-1' as  String(30)
                ) as Seg,
                cast(
                    B.Responsible_employee as     String(10)
                ) as Value,
                cast(
                    'PART_FG' as                  String(10)
                ) as MatType,
                A.PurchaseOrder
            from A_PurchaseOrder as A
            left join PurchaseGroup_GlobalCode as B
                on B.PurchaseGroup = A.PurchasingGroup
        union
            select
                cast(
                    'SG2-NAD-C082-3039-2' as      String(30)
                )                                   as Seg,
                cast(
                    GET_CONSIGNEECODE(
                        T0.PurchaseOrder
                    ) as                          String(10)
                                                            //T1.ConsigneeCode as String(10)
                                                  ) as Value,
                cast(
                    'PART_FG' as                  String(10)
                )                                   as MatType,
                T0.PurchaseOrder
            from A_PurchaseOrder as T0
        union
            select
                cast(
                    'SG2-NAD-C082-3039-3' as      String(30)
                ) as Seg,
                GET_SALESROUTECODE(
                    T0.PurchaseOrder
                ) as Value,
                cast(
                    'PART_FG' as                  String(10)
                ) as MatType,
                T0.PurchaseOrder
            from A_PurchaseOrder as T0 /*left join PO_AdditionalData as T1
            on T0.PurchaseOrder=T1.PurchaseOrder*/
        union
            select
                cast(
                    'SG2-NAD-C082-3039-4' as      String(30)
                ) as Seg,
                GET_PAYERCODE(
                    T0.PurchaseOrder
                ) as Value,
                cast(
                    'PART_FG' as                  String(10)
                ) as MatType,
                T0.PurchaseOrder
            from A_PurchaseOrder as T0 /*left join PO_AdditionalData as T1
            on T0.PurchaseOrder=T1.PurchaseOrder*/
        union
            //Asif seller code 07/11
            select
                cast(
                    'SG2-NAD-C082-3039-5' as      String(30)
                )               as Seg,
                IFNULL(
                    A.Parameter1, '00020000'
                )               as Value,
                cast(
                    'PART_FG' as                  String(10)
                )               as MatType,
                B.PurchaseOrder as PurchaseOrder
            from ZCROSSREF as A
            right join A_PurchaseOrder as B
                on A.Company_Code = B.CompanyCode
                and (
                        A.Function_Code = 'SELLER_CODE_PARTS'
                    and A.SAP_Code      = B.VendorCountry
                    and exists          (select C.PurchaseGroup from PurchaseGroup_GlobalCode as C
                    where
                            C.PurchaseGroup = B.PurchasingGroup
                        and C.PartIndicator = 'X'
                    )
                )
                or (
                        A.Function_Code = 'SELLER_CODE'
                    and B.Supplier      = A.SAP_Code
                    and exists          (select C.PurchaseGroup from PurchaseGroup_GlobalCode as C
                    where
                            C.PurchaseGroup =  B.PurchasingGroup
                        and C.PartIndicator != 'X'
                    )
                )
        union
            select
                cast(
                    'SG2-NAD-C082-3039-6' as      String(30)
                )                                   as Seg,
                cast(
                    GET_WAREHOUSE(
                        T0.PurchaseOrder
                    ) as                          String(10)
                                                            //T1.Warehouse as String(10)
                                                  ) as Value,
                cast(
                    'FG' as                       String(10)
                )                                   as MatType,
                T0.PurchaseOrder
            from A_PurchaseOrder as T0 /*left join PO_AdditionalData as T1
            on T0.PurchaseOrder=T1.PurchaseOrder*/
        union
            select
                cast(
                    'SG2-NAD-C082-3039-7' as      String(30)
                ) as Seg,
                GET_PARTNERWAREHOUSECODE(
                    T0.PurchaseOrder
                ) as Value,
                cast(
                    'FG' as                       String(10)
                ) as MatType,
                T0.PurchaseOrder
            from A_PurchaseOrder as T0 /*left join PO_AdditionalData as T1
            on T0.PurchaseOrder=T1.PurchaseOrder*/
        union
            select
                cast(
                    'SG2-NAD-C082-3039-8' as      String(30)
                ) as Seg,
                GET_PARTNERWAREHOUSE(
                    T0.PurchaseOrder
                ) as Value,
                cast(
                    'FG' as                       String(10)
                ) as MatType,
                T0.PurchaseOrder
            from A_PurchaseOrder as T0 /*left join PO_AdditionalData as T1
            on T0.PurchaseOrder=T1.PurchaseOrder*/
        union
            select
                cast(
                    'SG2-NAD-C082-3039-9' as      String(30)
                )               as Seg,
                IFNULL(
                    A.Legacy_Code, '00020000'
                )               as Value,
                cast(
                    'FG' as                       String(10)
                )               as MatType,
                B.PurchaseOrder as PurchaseOrder
            from ZCROSSREF as A
            right outer join A_PurchaseOrder as B
                on  A.Company_Code  = B.CompanyCode
                and A.Function_Code = 'SELLER_CODE_PARTS'
                and B.Supplier      = A.SAP_Code
        union
            select
                cast(
                    'SG2-SG5-CTA-C056-3412-9' as  String(30)
                ) as Seg,
                cast(
                    SubString(
                        B.OutboundDivision, 5
                    ) as                          String(10)
                ) as Value,
                cast(
                    'FG' as                       String(10)
                ) as MatType,
                A.PurchaseOrder
            from A_PurchaseOrder as A
            left join PurchaseGroup_GlobalCode as B
                on B.PurchaseGroup = A.PurchasingGroup
        union
            select
                cast(
                    'SG2-NAD-C082-3039-10' as     String(30)
                )                                   as Seg,
                cast(
                    //Asif  start changes 23/10
                    T0.GlobalVendor as            String(10)
                                                            //Asif end changes 23/10
                                                  ) as Value,
                cast(
                    'FG' as                       String(10)
                )                                   as MatType,
                T0.PurchaseOrder
            from A_PurchaseOrder as T0 /*left join PO_AdditionalData as T1
            on T0.PurchaseOrder=T1.PurchaseOrder*/
    /* Implementation: As per functional, FG_DROP there is Segment 'SG2-NAD-UD' should be available with default value of '00029052' and fetch this value in ZCROSSREF table
    Author: Mohammed Asif baba
    Date: 14-05-2024 */
        union
            select
                cast(
                    'SG2-NAD-C082-3039-11' as     String(30)
                )               as Seg,
                cast(
                    A.Parameter1 as               String(10)
                )               as Value,
                cast(
                    'FG' as                       String(10)
                )               as MatType,
                B.PurchaseOrder as PurchaseOrder
            from ZCROSSREF as A
            inner join A_PurchaseOrderItem as B
                on  A.SAP_Code = B.Plant
                and A.Legacy_Code  = 'ENDUSER_CODE'
                and A.Function_Code = 'FG_DROP_ENDUSER'
        union
            select
                cast(
                    'SG9-TDT-C220-8066-1' as      String(30)
                )                                   as Seg,
                cast(
                    GET_SHIPMETHD(
                        T0.PurchaseOrder
                    ) as                          String(10)
                                                            // T1.ShipmentMethod as String(15)
                                                  ) as Value,
                cast(
                    'PART' as                     String(10)
                )                                   as MatType,
                T0.PurchaseOrder
            from A_PurchaseOrder as T0 /*left join PO_AdditionalData as T1
            on T0.PurchaseOrder=T1.PurchaseOrder*/
        union
            select
                cast(
                    'SG9-SG10-LOC-C519-3223-1' as String(30)
                )                                   as Seg,
                cast(
                    GET_CITYID(
                        T0.PurchaseOrder
                    ) as                          String(10)
                                                            //T1.CityID as String(10)
                                                  ) as Value,
                cast(
                    'PART' as                     String(10)
                )                                   as MatType,
                T0.PurchaseOrder
            from A_PurchaseOrder as T0 /*left join PO_AdditionalData as T1
            on T0.PurchaseOrder=T1.PurchaseOrder*/
        union
            select
                cast(
                    'SG9-TDT-C220-8066-2' as      String(30)
                )                                   as Seg,
                cast(
                    GET_SHIPMETHD(
                        T0.PurchaseOrder
                    ) as                          String(10)
                                                            // T1.ShipmentMethod as String(15)
                                                  ) as Value,
                cast(
                    'FG' as                       String(10)
                )                                   as MatType,
                T0.PurchaseOrder
            from A_PurchaseOrder as T0 /*left join PO_AdditionalData as T1
            on T0.PurchaseOrder=T1.PurchaseOrder*/
        union
            select
                cast(
                    'SG9-SG10-LOC-C519-3223-2' as String(30)
                )                                   as Seg,
                cast(
                    GET_CITYID(
                        T0.PurchaseOrder
                    ) as                          String(10)
                                                            // T1.CityID as String(10)
                                                  ) as Value,
                cast(
                    'FG' as                       String(10)
                )                                   as MatType,
                T0.PurchaseOrder
            from A_PurchaseOrder as T0 /*left join PO_AdditionalData as T1
            on T0.PurchaseOrder=T1.PurchaseOrder*/
        union
            select
                cast(
                    'SG1-RFF-C506-1154-23' as     String(30)
                )               as Seg,
                A.Parameter1    as Value,
                cast(
                    'FG' as                       String(10)
                )               as MatType,
                B.PurchaseOrder as PurchaseOrder
            from ZCROSSREF as A
            inner join A_PurchaseOrder as B
                on  A.Company_Code  =  B.CompanyCode
                and A.Function_Code =  'ACTIVATION_KEYS'
                and A.SAP_Code      in (
                    select PurchaseGroup from PurchaseGroup_GlobalCode as C
                    where
                            C.PurchaseGroup   = B.PurchasingGroup
                        and B.PurchasingGroup = 'ZAK'
                )
            union
                select
                    cast(
                        'SG1-RFF-C506-1154-24' as String(30)
                    )               as Seg,
                    A.SPECIND       as Value,
                    cast(
                        'PART' as                 String(10)
                    )               as MatType,
                    B.PurchaseOrder as PurchaseOrder
                from OrderMark as A
                inner join A_PurchaseOrder as B
                    on A.ORDERMARK = B.CorrespncExternalReference
            union
                select
                    cast(
                        'SG1-RFF-C506-1154-25' as String(30)
                    )               as Seg,
                    A.PCBIND        as Value,
                    cast(
                        'PART' as                 String(10)
                    )               as MatType,
                    B.PurchaseOrder as PurchaseOrder
                from OrderMark as A
                inner join A_PurchaseOrder as B
                    on A.ORDERMARK = B.CorrespncExternalReference
            union
                select
                    cast(
                        'SG1-RFF-C506-1154-26' as String(30)
                    )               as Seg,
                    A.TOOLIND       as Value,
                    cast(
                        'PART' as                 String(10)
                    )               as MatType,
                    B.PurchaseOrder as PurchaseOrder
                from OrderMark as A
                inner join A_PurchaseOrder as B
                    on A.ORDERMARK = B.CorrespncExternalReference
            union
                select
                    cast(
                        'SG1-RFF-C506-1154-27' as String(30)
                    )               as Seg,
                    A.LARGEQTYIND   as Value,
                    cast(
                        'PART' as                 String(10)
                    )               as MatType,
                    B.PurchaseOrder as PurchaseOrder
                from OrderMark as A
                inner join A_PurchaseOrder as B
                    on A.ORDERMARK = B.CorrespncExternalReference
            union
                select
                    cast(
                        'SG1-RFF-C506-1154-28' as String(30)
                    )               as Seg,
                    A.IGPIND        as Value,
                    cast(
                        'PART' as                 String(10)
                    )               as MatType,
                    B.PurchaseOrder as PurchaseOrder
                from OrderMark as A
                inner join A_PurchaseOrder as B
                    on A.ORDERMARK = B.CorrespncExternalReference
            union
                select
                    cast(
                        'SG1-RFF-C506-1154-29' as String(30)
                    )               as Seg,
                    A.MAINPARTSIND  as Value,
                    cast(
                        'PART' as                 String(10)
                    )               as MatType,
                    B.PurchaseOrder as PurchaseOrder
                from OrderMark as A
                inner join A_PurchaseOrder as B
                    on A.ORDERMARK = B.CorrespncExternalReference
            union
                select
                    cast(
                        'SG1-RFF-C506-1154-30' as String(30)
                    )                as Seg,
                    A.REFURBPARTSIND as Value,
                    cast(
                        'PART' as                 String(10)
                    )                as MatType,
                    B.PurchaseOrder  as PurchaseOrder
                from OrderMark as A
                inner join A_PurchaseOrder as B
                    on A.ORDERMARK = B.CorrespncExternalReference
            union
                select
                    cast(
                        'SG1-RFF-C506-1154-31' as String(30)
                    )               as Seg,
                    A.DISCPARTSIND  as Value,
                    cast(
                        'PART' as                 String(10)
                    )               as MatType,
                    B.PurchaseOrder as PurchaseOrder
                from OrderMark as A
                inner join A_PurchaseOrder as B
                    on A.ORDERMARK = B.CorrespncExternalReference
            union
                select
                    cast(
                        'SG1-RFF-C506-1154-32' as String(30)
                    )               as Seg,
                    A.SERVICEMANIND as Value,
                    cast(
                        'PART' as                 String(10)
                    )               as MatType,
                    B.PurchaseOrder as PurchaseOrder
                from OrderMark as A
                inner join A_PurchaseOrder as B
                    on A.ORDERMARK = B.CorrespncExternalReference
            union
                select
                    cast(
                        'SG1-RFF-C506-1154-33' as String(30)
                    )               as Seg,
                    A.REPAIRRETIND  as Value,
                    cast(
                        'PART' as                 String(10)
                    )               as MatType,
                    B.PurchaseOrder as PurchaseOrder
                from OrderMark as A
                inner join A_PurchaseOrder as B
                    on A.ORDERMARK = B.CorrespncExternalReference;
}
