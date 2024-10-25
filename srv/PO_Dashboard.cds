using BTP.Panasonic as BTP from '../db/data-model';

service PO_Dashboard @(path: '/factoryint/po-dashboard'){
    entity A_PurchaseOrder                as projection on BTP.A_PurchaseOrder;
    entity A_PurchaseOrderItem            as projection on BTP.A_PurchaseOrderItem;
    entity UserAssignment                 as projection on BTP.UserAssignment;
    entity Edifact_Header                 as projection on BTP.Edifact_Header;
    entity POStatusMonitoring             as projection on BTP.POStatusMonitoring;
    entity PurchaseGroup_GlobalCode       as projection on BTP.PurchaseGroup_GlobalCode;
    entity ZCROSSREF                      as projection on BTP.ZCROSSREF;
    entity invoiceLine                    as projection on BTP.invoiceLine;
    entity PO_AdditionalData              as projection on BTP.PO_AdditionalData;
    // entity plant                          as projection on BTP.plant;


    entity GetUserList                    as
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

    //Preethi changed the join conditions(inner->left) for defect 69 on 06/12
    //redundant the Plant table from this view 22/4
    /*Implementaion: Added Distinct and FG_DROP_ENDUSER in Stock_Drop, as ther was change in Segment. It was giving duplicates, so added the distinct to it.
    Author: Mohammed Asif Baba
    Date: 14-05-2024 */
    /*Implementaion: Added logic to get POTransmissionStatus based on ObjectType in OutboundG.
    Author: Nithyashree V
    Date: 04-06-2024 */
    entity Get_PO_Purchase_Order_List_Hdr as
        select from POStatusMonitoring as T1
        left join A_PurchaseOrder as T0
            on T1.PO = T0.PurchaseOrder
        inner join GetUserList as T2
            on  T2.CompanyCode = T0.CompanyCode
            and T2.PurchaseOrg = T0.PurchasingOrganization
        left join PurchaseGroup_GlobalCode as T3
            on T0.PurchasingOrganization = T3.PurchaseGroup
        left join A_PurchaseOrderItem as T4
            on T0.PurchaseOrder = T4.PurchaseOrder.PurchaseOrder
        left join ZCROSSREF as T5
            on T4.Plant = T5.SAP_Code
        left join ZCROSSREF AS T8 ON T8.Company_Code = T0.CompanyCode 
        AND (T8.Function_Code = 'VENDOR_ACCOUNT_GRP')
        left join ZCROSSREF as T6
            on T6.Company_Code = T0.CompanyCode
            and (
                    T6.Function_Code = 'SELLER_CODE_PARTS'
                and T6.SAP_Code      = T0.VendorCountry
                and exists           (select T3.PurchaseGroup from PurchaseGroup_GlobalCode as T3
                where
                        T3.PurchaseGroup = T0.PurchasingGroup
                    and T3.PartIndicator = 'X'
                )
            )
            or (
                    T6.Function_Code = 'SELLER_CODE'
                and T0.Supplier      = T6.SAP_Code
                and exists           (select T3.PurchaseGroup from PurchaseGroup_GlobalCode as T3
                where
                        T3.PurchaseGroup =  T0.PurchasingGroup
                    and T3.PartIndicator != 'X'
                )
            )

        left join PO_AdditionalData as T7
            on T0.PurchaseOrder = T7.PurchaseOrder
        left join A_PurchaseOrderItem as T10
            on T10.PurchaseOrder.PurchaseOrder = T0.PurchaseOrder  and T10.PurchaseOrderItem = (select min(CAST(b.PurchaseOrderItem AS Integer)) AS MINPurchaseOrderItem from A_PurchaseOrderItem as b
								where b.PurchaseOrder.PurchaseOrder = T10.PurchaseOrder.PurchaseOrder)  
       
        distinct {
            key cast(
                    MIN(
                        T1.PO
                    ) as           String(10) //Preethi defect FINT-00069 on 06/12
                ) as PurchaseOrder,
                cast(
                    MIN(
                        T0.CompanyCode
                    ) as           String(4)
                ) as CompanyCode,
                cast(
                    MIN(
                        T0.PurchasingOrganization
                    ) as           String(4)
                ) as PurchasingOrg,
                cast(
                    (
                    select MIN(
                        T1.GlobalCode
                    ) as GlobalLocationCode from PurchaseGroup_GlobalCode as T1
                    where
                        T1.PurchaseGroup = cast(
                            MIN(
                                T0.PurchasingGroup
                            ) as   String(4)
                        )
                ) as               String(10)
            )     as BuyerGlobalLocationCode,

                cast(
                    MIN(
                        T0.Supplier
                    ) as           String(10)
                ) as Vendor,
                cast(
                    MIN(
                        T0.AddressName
                    ) as           String(40)
                ) as VendorName,
                cast(
                    MAX(
                        T0.CreationDate
                    ) as           Date
                ) as POCreationDate,
                cast(
                    GET_TRANSDATE(
                        T0.PurchaseOrder,
                        T0.VendorAssignmentAccountGroup,
                        TRIM (MIN(T8.SAP_Code)),
                        T0.SupplierRespSalesPersonName,
                        T0.createdAt
                    ) as           Date
                ) as PoTransmissionDate,
                 cast(
 
                    case
                        when
                            (T5.Function_Code = 'FG_DROP' or T5.Function_Code = 'PART_DROP' or T5.Function_Code = 'FG_DROP_ENDUSER') AND (ifnull(T5.SAP_Code, 'false') = trim(T4.Plant))
                       
                                then
                                    'Drop'
                                else
                                    'Stock'
                          
 
                    end as         String(10)
                ) as Stock_Drop,//kanchan changes on 22/4
                cast(
                    COALESCE(
                        MIN(
                            T6.Parameter1
                        ), '00020000'
                    ) as           String(10)
                ) as Seller_Code, //Preethi defect 60 on 24/11
                cast(
                    MIN(
                        T7.ConsigneeCode
                    ) as           String(10)
                ) as Consignee_Code,
                    cast(
                        COALESCE(
                            MAX(
                                case
                                    when
                                        T1.ObjectType = 'OutboundG'
                                    then
                                        T1.Status
                                    else
                                        null
                                end
                            ), MAX(
                                case
                                    when
                                        T1.ObjectType = 'Outbound'
                                    then
                                        case
                                            when
                                                T1.Status = 'O'
                                            then
                                                ' '
                                            else
                                                T1.Status
                                        end
                                    else
                                        null
                                end
                            ), 'E'
                        ) as                           String(6)
                    ) as POTransmission_Status,
                cast(
                    MIN('GITP') as String(15)
                ) as TransmittedDestination,
                cast(
                    MIN(
                        T7.SalesRouteCode
                    ) as           String(10)
                ) as SalesRoute_Code,
                cast(
                    MIN(
                        T0.GlobalVendor
                    ) as           String(10)
                ) as Supplier_Code,
                cast(
                    MIN(
                        T0.A_PurchaseOrderItem.DocumentCurrency
                    ) as           String(5)
                ) as SalesCurrency_Code,
                cast(
                    MIN(
                        case T0.PurchasingCollectiveNumber
                            when
                                'W'
                            then
                                'SCMS'
                            when
                                'M'
                            then
                                'SCMM'
                        end
                    ) as           String(5)
                ) as OrderPriority_Id,
                // 
                cast(
                    GET_CITYID(
                        T0.PurchaseOrder
                    ) as           String(10)
                ) as DestinationCityCode,
                cast(
                    MIN(
                        T0.VendorAssignmentAccountGroup
                    ) as           String(4) //added for defect 31 on 13/03/24 by Preethi for dashboard reprocessing
                ) as VendorAssgnAcntGrp,
                cast(
                    MIN(
                        T0.ShipToParty
                    ) as           String(10) //added for defect 31 on 13/03/24 by Preethi for dashboard reprocessing
                ) as ShipTo,
                cast(
                    MIN(
                        T0.VendorCountry
                    ) as           String(2) //added for defect 31 on 13/03/24 by Preethi for dashboard reprocessing
                ) as VendorCountry,
                cast(
                    MIN(
                        T7.ShipmentMethod
                    ) as           String(15)
                ) as ShippingMethodCode,
                cast(
                    MIN(
                        case T3.PartIndicator
                            when
                                'X'
                            then
                                'GI2V11'
                            else
                                'GIS141'
                        end
                    ) as           String(15)
                ) as Sending_System,
                cast(
                    MIN(
                        case T3.PartIndicator
                            when
                                'X'
                            then
                                'GI2V12'
                            else
                                'GIS142'
                        end
                    ) as           String(15)
                ) as Receiving_System,
                T0.A_PurchaseOrderItem : redirected to Get_PO_PurchaseOrderDetail
    }
    group by

        T1.PO,
        T5.SAP_Code,
       T5.Function_Code,
       T8.SAP_Code,
       T4.Plant,
        T6.Parameter1,
        T0.PurchaseOrder,
        T0.VendorAssignmentAccountGroup,
        T0.SupplierRespSalesPersonName,
        T0.createdAt,
        T3.PartIndicator;

    entity Get_PO_PurchaseOrderDetail     as
        select from A_PurchaseOrderItem as T0 {
            T0.PurchaseOrder,
            // T0.PurchaseOrderItem as Item,
            /*changed to integer for proper sorting
            Date:02-05-24 
             author : gnaneshwar*/
            key cast(
                    (
                       T0.PurchaseOrderItem
                    ) as                                     Integer
                ) as Item, //02-05-24 @gnaneshwar
            T0.Material          as Material_No,
            T0.Plant,
            T0.StorageLocation   as Storage_Location,
            T0.OrderQuantity     as PO_Quantity,
            T0.OrderPriceUnit    as Order_Unit_UOM,
            T0.NetPriceAmount    as Unit_Price,
            cast(
                ifnull(
                    T0.NetPriceAmount, 0
                ) * (
                    ifnull(
                        T0.OrderQuantity, 0
                    )
                ) as Decimal(18, 2)
            )                    as Net_Price,
            cast(
                (
                select distinct (
                    T1.unitPrice
                ) as RevisedPrice from invoiceLine as T1
                where
                        T1.unitPrice           <> T0.NetPriceAmount
                    and T1.purchaseOrderNumber =  T0.PurchaseOrder.PurchaseOrder
                    and T1.orderItemNbr        =  T0.PurchaseOrderItem
            ) as     Decimal(12, 2)
            )                    as RevisedPrice
    };


    entity Get_Excecution_log             as
        select from POStatusMonitoring as T0
        left join A_PurchaseOrder as T1
            on T1.PurchaseOrder =  T0.PO
            or T1.PurchaseOrder is null
        {
                T0.ID,
            key T0.PO,
                T0.Message,
                T0.Status,
                T0.createdAt as DateTime,
        };

    entity Get_Edifact                    as
        select from Edifact_Header as T0
        // inner join A_PurchaseOrder as T1
        //     on T0.PO_List.PO = T1.PurchaseOrder
        {
                T0.Object,
                T0.EdifactID,
                T0.EdifactString,
                T0.PO_List.ID,
            key T0.PO_List.PO as PO
        }
        where
            T0.Object = 'Outbound';


}