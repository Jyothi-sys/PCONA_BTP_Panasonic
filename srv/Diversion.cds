using BTP.Panasonic as BTP from '../db/data-model';

service Diversion @(path: '/factoryint/diversion'){
  entity POCrossRef               as projection on BTP.POCrossRef;
  entity ZMM_MOS                  as projection on BTP.ZMM_MOS;
  entity MNET_DiversionHeader     as projection on BTP.MNET_DiversionHeader;
  entity MNET_DiversionDetail     as projection on BTP.MNET_DiversionDetail;
  entity bolHeader                as projection on BTP.bolHeader;
  entity invoiceHeader            as projection on BTP.invoiceHeader;
  entity invoiceLine              as projection on BTP.invoiceLine;
  entity additionalInvoiceLine    as projection on BTP.additionalInvoiceLine;
  entity A_PurchaseOrderItem      as projection on BTP.A_PurchaseOrderItem;
  entity A_PurchaseOrder          as projection on BTP.A_PurchaseOrder;
  entity ZMNETBUSINESS            as projection on BTP.ZMNETBUSINESS;
  entity ZMM_ETD                  as projection on BTP.ZMM_ETD;
  entity ZipCode_Destination      as projection on BTP.ZipCode_Destination;
  entity MNetStatusMonitoring     as projection on BTP.MNetStatusMonitoring;
  entity MNetStatusMonitoringItem as projection on BTP.MNetStatusMonitoringItem;
  entity UserAssignment           as projection on BTP.UserAssignment;
  entity ZCROSSREF                as projection on BTP.ZCROSSREF;
  entity PurchaseGroup_GlobalCode as projection on BTP.PurchaseGroup_GlobalCode;
  entity Environment              as projection on BTP.Environment;
  entity UserMaster               as projection on BTP.UserMaster;
  entity AccountReference         as projection on BTP.AccountReference;
  entity ZMNETMODE                as projection on BTP.ZMNETMODE;
  entity PO_Update                as projection on BTP.PO_Update;
  action   Update_AllActionMethods(ID : Integer)                                                                                                                                                                                                                                                        returns Boolean;
  function userAssignmentCreate(ID : String, UserID_UserID : String, EmailID : String, CompanyCode : String, CompanyCodeDescription : String, PurchaseOrg : String, PurchaseOrgDescription : String, modifiedBy : String, modifiedAt : DateTime, createdBy : String, createdAt : DateTime)              returns String;
  function ZMNETModeCreateAndUpdate(MANDT : String, TMODE : String, TRATY : String, ZSHIPMETHOD : String, ZTMODEDESCR : String, ZSHIPTYPE : String, modifiedBy : String, modifiedAt : DateTime, createdBy : String, createdAt : DateTime)                                                               returns String;
  function Factory_supplier(PurchaseOrder : String)                                                                                                                                                                                                                                                     returns String;
  function ZMMMOSCreateAndUpdate(Client : String, Mos_code : String, NumberOfDays : String, modifiedBy : String, modifiedAt : DateTime, createdBy : String, createdAt : DateTime)                                                                                                                       returns String;
  function UserDetails()                                                                                                                                                                                                                                                                                returns String;
  function A_POlineitem()                                                                                                                                                                                                                                                                               returns array of A_PurchaseOrderItem;
  function A_PO_Update()        returns array of PO_Update;  
  //31-05-2024 To Know the DropShip Status of the PO in Diversion Validation CS 
  action Check_DropShip_Status(OriginalPO : String, NewPO : String) returns Boolean;
  //04-06-2024 --Preethi -- Service to update the status of Parent line during diversion based on child line status and update the execution log of Parent Line 
  action UpdateParentLine(BOLID : Integer,houseBOLNumber : String,containerID : String,invID : String,OriginalPO : String,OriginalPOLine : String,lineNumber:String,importShipmentNumber:String)returns Boolean;
  //CE
  function ZMNETBusinessCreateAndUpdate(MANDT : String,
                                        ZBUSINESS_IND : String,
                                        ZMODE : String,
                                        ZRECTYPE : String,
                                        ZPAYCONCODE : String,
                                        ZSHIPMETHOD : String,
                                        ZMNETDTLS_EXIST : String,
                                        ZDEVANNABLE : String,
                                        ZPOIND : String,
                                        ZSPECIAL : String,
                                        ZINBD_DLVY : String,
                                        ZINVICE : String,
                                        ZGOODS_RECEIPT : String,
                                        ZDLVY_INSTR : String,
                                        ZANCITIPATED_REC : String,
                                        ZASN : String,
                                        ZDESCRIPTION : String,
                                        modifiedBy : String,
                                        modifiedAt : DateTime,
                                        createdBy : String,
                                        createdAt : DateTime)                                                                                                                                                                                                                                           returns String;

  function ZMMETDCreateAndUpdate(Sequence_Number : String, Client : String, PurchasingGroup : String, Vendor : String, Type : String, MethodOfShipping : String, LeadTime : String, modifiedBy : String, modifiedAt : DateTime, createdBy : String, createdAt : DateTime)                               returns String;
  function ZipCodeDestinationCreateAndUpdate(Client_Code : String, Destination : String, Plant : String, Description : String, IPP_Devanning_Indicator : String, Logical_Devanner_Destination : String, End_User : String, Default_DEST : String)                                                       returns String;
  function ZCrossRefCreateAndUpdate(Sequence_Number : String, Function_Code : String, Clinet_Code : String, Company_Code : String, SAP_Code : String, Legacy_Code : String, Username : String, Parameter1 : String, Parameter2 : String, Parameter3 : String, Parameter4 : String, Parameter5 : String) returns String;
  function userMasterCreateAndUpdate(UserID : String, EmailID : String, FirstName : String, LastName : String, modifiedBy : String, modifiedAt : DateTime, createdBy : String, createdAt : DateTime)                                                                                                    returns String;
  function purchaseGroupGlobalCodeCreateAndUpdate(Client : String, PurchaseGroup : String, GlobalCode : String, PartIndicator : String, GlobalCodeName : String, OutboundDivision : String, Responsible_employee : String)                                                                              returns String;
  function accountReferenceCreateAndUpdate(Client : String, Legacy_Customer : String, Sold_to_party : String, Orderer_Code : String, Accountee_Code : String, Consignee_Code : String, Drop_Ship_Name : String)                                                                                         returns String;
  function mnetmode_delete(MANDT : String, TMODE : String)                                                                                                                                                                                                                                              returns String;
  function mnetbusiness_delete(MANDT : String, ZBUSINESS_IND : String, ZMODE : String)                                                                                                                                                                                                                  returns String;
  function mm_mos_delete(Client : String, Mos_code : String)                                                                                                                                                                                                                                            returns String;
  function zipcode_delete(Client_Code : String, Destination : String, Plant : String)                                                                                                                                                                                                                   returns String;
  function zcrossref_delete(Sequence_Number : String, Function_Code : String, Clinet_Code : String)                                                                                                                                                                                                     returns String;
  function zusermaster_delete(EmailID : String)                                                                                                                                                                                                                                                         returns String;
  function zuserassign_delete(ID : String, EmailID : String)                                                                                                                                                                                                                                            returns String;
  function zglobalcode_delete(Client : String, PurchaseGroup : String)                                                                                                                                                                                                                                  returns String;
  function zaccountref_delete(Client : String, Legacy_Customer : String, Sold_to_party : String)                                                                                                                                                                                                        returns String;
  function zmmetd_delete(Sequence_Number : String, Client : String)                                                                                                                                                                                                                                     returns String;
  function fetchAuthToken()              returns String;

  entity GetUserList              as
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


  entity GET_userInfo @(restrict: [
    {
      grant: ['READ'],
      to   : ['POViewer']
    },
    {
      grant: ['*'],
      to   : ['POManager']
    }
  ])                              as projection on BTP.userInfo;


  entity Get_Diversion @(restrict: [
    {
      grant: ['READ'],
      to   : ['POViewer']
    },
    {
      grant: ['*'],
      to   : ['POManager']
    }
  ])                              as
    select from POCrossRef as T0
    inner join A_PurchaseOrder as T1
      on T1.PurchaseOrder = T0.Po_Old
    inner join GetUserList as T2
      on  T1.CompanyCode            = T2.CompanyCode
      and T1.PurchasingOrganization = T2.PurchaseOrg
    {
          //T0.Client,
          cast(
            T0.createdAt as Date
          ) as created_Date,
      key T0.Po_Old,
          T0.PoItem_Old,
          T0.Po_New,
          T0.PoItem_New,
          //T0.ActionInd,
          T0.ModeOfTransportation,
          T0.Material_Number,
          T0.comment,
          T0.IsDelete
    }
    where
      T0.IsDelete = 'N';

  entity GET_MNET_DATA            as
    select from bolHeader as T0
    inner join invoiceHeader as T1
      on  T0.houseBOLNumber = T1.houseBOLNumber.houseBOLNumber
      and T0.ID             = T1.houseBOLNumber.ID
    inner join invoiceLine as T2
      on  T1.invoiceNumber                 = T2.invoiceNumber.invoiceNumber
      and T1.houseBOLNumber.houseBOLNumber = T2.invoiceNumber.houseBOLNumber.houseBOLNumber
      and T1.houseBOLNumber.ID             = T2.invoiceNumber.houseBOLNumber.ID
    inner join additionalInvoiceLine as T3
      on  T2.partID                      = T3.partID.partID
      and T2.invoiceNumber.invoiceNumber = T3.partID.invoiceNumber.invoiceNumber
      and T2.lineNumber                  = T3.partID.lineNumber
      and T2.invoiceNumber.houseBOLNumber.houseBOLNumber = T3.partID.invoiceNumber.houseBOLNumber.houseBOLNumber
    left join MNET_DiversionHeader as T4
      on  T2.invoiceNumber.invoiceNumber                 = T4.MNET_No
      and T2.invoiceNumber.houseBOLNumber.houseBOLNumber = T4.houseBOLNumber
      and T2.invoiceNumber.houseBOLNumber.ID             = T4.MNET_ID
    left join A_PurchaseOrder as P2
      on P2.PurchaseOrder = T2.purchaseOrderNumber
    left join A_PurchaseOrderItem as P1
      on  P1.PurchaseOrder.PurchaseOrder = T2.purchaseOrderNumber
      and P1.Material                    = cast(
        GET_MNET_ITEM(
          T2.partID
        ) as String(50)
      )
      and T3.orderItemNbr                = P1.PurchaseOrderItem
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
      T2.purchaseOrderNumber,
      T2.buyerPartID,
      T2.quantity,
      T2.extendedCost,
      T2.unitPrice,
      T2.partUnitOfMeasurement,
      // T3.qtyPerSLSUnitPricePackType,
      P1.PurchaseOrderQuantityUnit, //Adding to consider the quantity unit from A_PurchaseorderItem level
      T2.lineNumber,
      T2.containerID,
      P1.PurchaseOrderItem,
      P1.Plant,
      P1.PurchaseOrder.CompanyCode,
      T3.PASCOriginalPartsNbr,
      P1.OrderQuantity,
      P1.NetPriceAmount,
      P1.StorageLocation,
      P1.ScheduleLineOpenQty,
      T2.businessUnit,
      P2.Supplier,
      T3.orderItemNbr,
      // T2.supplierPartID,
      //GET_MNET_ITEM replaced with GET_MNET_SUPPLIERPARTID  Def 70 26-03-2024
      cast(
        GET_MNET_SUPPLIER_PARTID(
          T2.partID
        ) as   String(50)
      )         as supplierPartID,
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
      )         as INV_FLAG,
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
      )         as POType,
      TM.TRATY,
      P1.ValuationType,
      T0.status as BOLSTATUS,
      T2.action as INVACTION,
      T0.importShipmentNumber

    }

    where
          T2.status != 'H'
      and T2.status != 'I';


  entity GET_PO_DATA              as
    select from A_PurchaseOrderItem as P1
    left join ZCROSSREF as P2
      on P1.Plant = P2.SAP_Code
    distinct {
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

  // added  join on 23/01 for defect 186 by Preethi
  // Defect 232 Brahma - Add logic to get latest data for latest BOLID related to BOLHeader.Also commented out redundant criteria.
  // entity GetGRData                as
  //   select from GET_MNET_DATA as T0
  //   inner join MNetStatusMonitoring as T1
  //     on  T0.houseBOLNumber = T1.houseBOLNumber
  //     and T0.invoiceNumber  = T1.invoiceNumber
  //     and T0.containerID    = T1.containerID
  //   inner join invoiceHeader as T6
  //     on  T0.houseBOLNumber = T6.houseBOLNumber.houseBOLNumber
  //     and T0.ID             = T6.houseBOLNumber.ID
  //   inner join invoiceLine as T4
  //     on  T0.houseBOLNumber = T4.invoiceNumber.houseBOLNumber.houseBOLNumber
  //     and T0.invoiceNumber  = T4.invoiceNumber.invoiceNumber
  //     and (
  //          T4.BTP_GRNumber =  ''
  //       or T4.BTP_GRNumber is null
  //     )
  //     and (
  //          T4.BTP_IBDNumber <>     ''
  //       or T4.BTP_IBDNumber is not null
  //     )
  //   inner join ZMNETBUSINESS as T5
  //     on T4.Zbusiness_indicator = T5.ZBUSINESS_IND
  //   distinct {
  //     T0.ID,
  //     T0.houseBOLNumber,
  //     T0.invoiceNumber,
  //     T0.containerID,
  //     T0.purchaseOrderNumber,
  //     T1.ObjectRefNo           as deliveryDocument,
  //     T0.initialDestinationETA as ETA
  //   }
  //   where
  //         T1.ObjectType = 'InboundDelivery'
  //     and T1.Status     = 'S'
  //     and T0.POType     = 'D'
  //     and not           exists(select 1 as ID from MNetStatusMonitoring as T2
  //     where
  //           T0.ID             in (
  //         select MAX(
  //           T7.ID
  //         ) as v_BOLid from bolHeader as T7
  //         where
  //           T7.houseBOLNumber = T0.houseBOLNumber
  //       )
  //       and T1.houseBOLNumber =  T2.houseBOLNumber
  //       and T1.invoiceNumber  =  T2.invoiceNumber
  //       and T1.containerID    =  T2.containerID
  //       and T1.ObjectRefNo    =  T2.ObjectRefNo
  //       and T2.ObjectType     =  'GoodsReceipt'
  //       and T2.Status         =  'S'
  //       and IFNULL(
  //         T2.GR_NO, ''
  //       )                     != ''
  //       and T2.Action         =  'C'
  //     )
  //     and (
  //       (
  //             T5.ZGOODS_RECEIPT <> ''
  //         and T5.ZGOODS_RECEIPT <> 'N'
  //       )
  //       and (
  //         (
  //               T5.ZGOODS_RECEIPT        =  'Y'
  //           and T0.initialDestinationETA <= CURRENT_DATE
  //         )
  //         or T5.ZGOODS_RECEIPT = '0'
  //         or (
  //           ADD_DAYS(
  //             T0.initialDestinationETA, -1 * (
  //               case T5.ZGOODS_RECEIPT
  //                 when
  //                   'Y'
  //                 then
  //                   0
  //                 else
  //                   T5.ZGOODS_RECEIPT
  //               end
  //             )
  //           ) <= CURRENT_DATE
  //         )
  //       )
  //     );

  entity GetGRData as
select
from GET_MNET_DATA as T0
    inner join MNET_DiversionDetail as T1 on T0.houseBOLNumber = T1.ID.houseBOLNumber
    and T0.invoiceNumber = T1.ID.MNET_No
    and T0.containerID = T1.ID.Container_ID
    and T0.ID = T1.ID.MNET_ID
    AND T0.lineNumber = T1.ID.Mnet_Line
    inner join invoiceLine as T2 on T1.ID.MNET_No = T2.invoiceNumber.invoiceNumber
    AND T1.ID.houseBOLNumber = T2.invoiceNumber.houseBOLNumber.houseBOLNumber 
    AND T1.ID.MNET_ID = T2.invoiceNumber.houseBOLNumber.ID
    AND T1.ID.Mnet_Line = T2.lineNumber 
    AND T1.Status = 'P'
    AND (T1.GR_Status IS NULL OR T1.GR_Status = '') 
    //  and not (
    //     T1.GR_Item  <> ''
    //     and T1.GR_Item is not null
    // )
    // and  not (
    //     T1.GR_Status <> ''
    //     and T1.GR_Status is not null
    // )
    and  not (
        T1.GR_Status <> ''
        and T1.GR_Status is not null
    )
    and (
            T1.IBD_Action <> 'D'
        and T1.IBD_Action <> 'L'
      )
      and ( T1.IBD_Status  <> 'E')
      and (
            T1.ASN_DI <>     ''
        and T1.ASN_DI is not null
      )
    inner join ZMNETBUSINESS as T5 on T2.Zbusiness_indicator = T5.ZBUSINESS_IND distinct { T0.ID,
    T0.houseBOLNumber,
    T0.invoiceNumber,
    T0.containerID,
    T1.NewPurchasing_Order as PurchaseOrderNumber,
    T1.Delivery as deliveryDocument,
    T0.initialDestinationETA as ETA,
    T0.importShipmentNumber 
    }
where  
       (T1.Delivery IS NOT NULL)
       and
       (T1.GR_Status NOT IN ('S', 'E') OR T1.GR_Status IS NULL OR T1.GR_Status = '')
       and (
            T5.ZGOODS_RECEIPT <> ''
            and T5.ZGOODS_RECEIPT <> 'N'
        )
        and (
            (
                T5.ZGOODS_RECEIPT = 'Y'
                and T0.initialDestinationETA <= CURRENT_DATE
            )
            or T5.ZGOODS_RECEIPT = '0'
            or (
                ADD_DAYS(
                    T0.initialDestinationETA,
                    -1 * (
                        case
                            T5.ZGOODS_RECEIPT
                            when 'Y' then 0
                            else T5.ZGOODS_RECEIPT
                        end
                    )
                ) <= CURRENT_DATE
            )
        );


}
