using BTP.Panasonic as BTP from '../db/data-model';

service UI_PO_Confirmation @(path: '/factoryint/ui-po-confirmation'){

    entity A_PurchaseOrder                       as projection on BTP.A_PurchaseOrder;
    entity A_PurchaseOrderItem                   as projection on BTP.A_PurchaseOrderItem;
    entity POConfirmationData                    as projection on BTP.POConfirmationData;
    entity UserAssignment                        as projection on BTP.UserAssignment;
    entity POStatusMonitoring                    as projection on BTP.POStatusMonitoring;
    entity PurchaseGroup_GlobalCode              as projection on BTP.PurchaseGroup_GlobalCode;
    entity Edifact_Header                        as projection on BTP.Edifact_Header;
    entity PO_AdditionalData                     as projection on BTP.PO_AdditionalData;
    entity POConfirmationHistory                 as projection on BTP.POConfirmationHistory;
    action ABLine_PostStatus(ID : Integer, POConfirmationData : many POConfirmationData) returns Boolean;

    entity GetUserList                           as
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

    //Preethi changed the join conditions(inner->left) for defect 73 on 08/12,@line 39 added a condition on 20/12
    entity Get_Purchase_Order_Confirmations_List as
        select from POStatusMonitoring as T3
        left join A_PurchaseOrder as T0
            on T3.PO = T0.PurchaseOrder
        left join A_PurchaseOrderItem as T1
            on T1.PurchaseOrder.PurchaseOrder = T0.PurchaseOrder
        left join POConfirmationData as T2
            on T0.PurchaseOrder = T2.PurchaseOrder
            and T1.PurchaseOrderItem = T2.PurchaseOrderItem    
        inner join GetUserList as T4
            on  T4.CompanyCode = T0.CompanyCode
            and T4.PurchaseOrg = T0.PurchasingOrganization
        left join PurchaseGroup_GlobalCode as T5
            on T0.PurchasingOrganization = T5.PurchaseGroup
        left join PO_AdditionalData as T6
            on T0.PurchaseOrder = T6.PurchaseOrder
               {                                                        //Preethi added for defect 142 
           key cast(
                    (
                        T3.PO
                    ) as                                     String(10) //Preethi changed for defect 73 on 08/12
                ) as PurchaseOrder,  // Defect211_pt5
            key cast(
                    (
                        T1.PurchaseOrderItem
                    ) as                                     Integer
                ) as PurchaseOrderItem, //as POline_item, // Defect211_pt5
           key cast(                              
                    (
                       T2.RevisionNumber
                    ) as         String(10)
                ) as Revision_No,              // Preethi added Revision No  for defect 142 on 11/01
            key cast(
                    MAX(
                        T2.createdAt
                    ) as                                     Date
                ) as ConfirmationReceive_Date,  // Defect211_pt5
                cast(
                    MAX(
                        T2.DeliveryDate
                    ) as                                     Date
                ) as POConfirmation_Date,
                cast(
                    
                        
                               MAX (
                                    case
                                        when
                                            T2.Status = 'O'
                                        then
                                            ' '
                                        else
                                            T2.Status
                                    end
                                ) 
                             
                            
                         as String(10)
                        ) as Confirmation_Status,       //Preethi changed on 16/12
                        cast(
                            MIN(
                                T1.Material
                            ) as String(40)
                        ) as Material,
                cast(
                    MIN(
                        T1.PurchaseOrderItemText
                    ) as                                     String(40)
                ) as Material_Description,
                cast(
                    MAX(
                        T0.CreationDate
                    ) as                                     Date
                ) as POCreation_Date,
                cast(
                    MAX(
                        case
                            when
                                T3.Message = 'EDIFACT file sent to GITP.'
                            then
                                T3.createdAt
                        end
                    ) as                                     Date
                ) as PoTransmissionDate,
                cast(
                    (
                        GET_ETD(
                            T0.PurchaseOrder, T1.PurchaseOrderItem, T2.RevisionNumber
                        )
                    ) as                                     Date
                ) as ETD, //Preethi changed on 05/12 for FINT-00066
                cast(
                    (
                        GET_ETA_DATE(
                            T0.PurchaseOrder, T1.PurchaseOrderItem, T2.RevisionNumber
                        )
                    ) as                                     Date
                ) as ETA, //Preethi changed on 05/12 for FINT-00066
                cast(
                    MIN(
                        T2.FactoryRefNo
                    ) as                                     String(10)
                ) as FactroryRefrence_Number,
                cast(
                    (
                        GET_CONF_QTY(
                            T0.PurchaseOrder, T1.PurchaseOrderItem, T2.RevisionNumber
                        )
                    ) as                                     Integer
                ) as ConfirmQuantity, //Preethi changed for FINT-00063 on 04/12/23
                cast(
                    (
                        GET_NETPRICE(
                            T0.PurchaseOrder, T1.PurchaseOrderItem, T2.RevisionNumber
                        )
                    ) as                                     String(10)
                ) as Price, //Preethi changed for FINT-00063 on 04/12/23
                cast(
                    MIN(
                        T6.ShipmentMethod
                    ) as                                     String(15)
                ) as MethodofShipment,
                  cast(
                    MIN(
                         T2.ReasonCode
                    ) as     String(1000)       //Preethi changed on 19/12 defect 142
                ) as ReasonCode,
                cast(
                    MIN(
                        T0.CompanyCode
                    ) as                                     String(4)
                ) as CompanyCode,
                cast(
                    MIN(
                        T0.PurchasingOrganization
                    ) as                                     String(4)
                ) as PurchasingOrg_P001,
                cast(
                    (
                    select MIN(
                        T1.GlobalCode
                    ) as GlobalLocationCode from PurchaseGroup_GlobalCode as T1
                    where
                        T1.PurchaseGroup = cast(
                            MIN(
                                T0.PurchasingGroup
                            ) as                             String(4)
                        )
                ) as                                         String(10)
            )     as BuyerGlobalCode,
                cast(
                    MIN(
                        T0.Supplier
                    ) as                                     String(10)
                ) as Vendor,
                cast(
                    MIN(
                        T0.AddressName
                    ) as                                     String(40)
                ) as Vendor_Name,
                cast(
                    MIN(
                        T6.CityID
                    ) as                                     String(10)
                ) as Destination_Code,
                cast(
                    MIN(
                        case T5.PartIndicator
                            when
                                'X'
                            then
                                'GI2V11'
                            else
                                'GIS141'
                        end
                    ) as                                     String(15)
                ) as Sender_System,
                cast(
                    MIN(
                        case T5.PartIndicator
                            when
                                'X'
                            then
                                'GI2V12'
                            else
                                'GIS142'
                        end
                    ) as                                     String(15)
                ) as Receiving_System,

    }
    group by
        T2.PurchaseOrder,
        T0.PurchaseOrder,
        T3.PO,
        T2.RevisionNumber,              //Preethi added for defect 142 on 11/01
        T1.PurchaseOrderItem;

    //Preethi changed on 29/11 for FINT-00055
    //Preethi added PurchaseOrderItem field in Get_Execution_Log to show logs based on selected line items for defect 98 on 21/05/24
    entity Get_Excecution_log                    as
            select
                T0.ID,
                T0.PO,
                T0.PurchaseOrderItem,    
                T0.Message,
                T0.Status,
                T0.createdAt as DateTime

            from POStatusMonitoring as T0

        union all

            select
                null             as ID,
                T2.PurchaseOrder as PO,
                T2.PurchaseOrderItem,
                T2.Message,
                T2.Status,
                T2.createdAt     as DateTime

            from POConfirmationData as T2;

   entity Get_Edifact                           as
        select from Edifact_Header as T0
        // inner join A_PurchaseOrder as T1
        //     on T0.PO_List.PO = T1.PurchaseOrder
        inner join POConfirmationData as T2
        on T0.ID = T2.EdifactId
        {
                T0.Object,
                T0.EdifactID,
                T0.EdifactString,
                T0.PO_List.ID,
                T2.RevisionNumber,
                T2.PurchaseOrderItem,
            key T0.PO_List.PO as PO
        }
        where
            T0.Object = 'Inbound';


}