using {
  managed,
  sap.common
} from '@sap/cds/common';

context BTP.Panasonic {
  entity userInfo : managed {
    key id     : String(50);
        tenant : String(50);
        roles  : String(2000);
        attr   : String(2000);
        admin  : Boolean
  }

  entity Fixed_Value : managed {
    key Sequence_Number : Integer;
        SegDescription  : String(500);
        Seg01           : String(50);
        Field01         : String(50);
        Seg02           : String(50);
        Field02         : String(50);
        Seg03           : String(50);
        Field03         : String(50);
        Seg04           : String(50);
        Field04         : String(50);
        Seg05           : String(50);
        Field05         : String(50);
        Value           : String(50);
        MatType         : String(100);
  }

  entity POStatusMonitoring : managed {
    key ID      : Integer;
        PO      : String(10);
        PurchaseOrderItem : String(10);
        ObjectType : String(10);
        Status  : String(20);
        Message : String(1000);
  }


  entity POConfirmationHistory {
    key PO                 : String(15);
    key LineItem           : Integer;
        ConfirmationString : LargeString;

  }

  entity MNetStatusMonitoring : managed {
    key ID                       : Integer;
        BOLID                    : Integer;
        houseBOLNumber           : String(18);
        invoiceNumber            : String(16);
        containerID              : String(20);
        Date                     : DateTime;
        ObjectType               : String(50);
        ObjectRefNo              : String(30);
        GR_NO                    : String(30);
        GR_DATE                  : String(30);
        // GR_line_number            : String(30);
        importShipmentNumber     : String(30);
        ObjectRefDate            : DateTime;
        Status                   : String(10);
        Message                  : String(1000);
        LargeMessage             : LargeString; //clob
        Action                   : String(10);
        FiscalYear               : String(10);
        CancelInvNo              : String(30);
        Zstatus                  : String(5);
        MNetStatusMonitoringItem : Composition of many MNetStatusMonitoringItem
                                     on MNetStatusMonitoringItem.ID = $self;
  }

  entity MNetStatusMonitoringItem : managed {
    key ID                          : Association to MNetStatusMonitoring;
    key LineID                      : Integer;
        SAP_LineID                  : String(10);
        lineNumber                  : String(30);
        Material                    : String(50);
        PurchaseOrder               : String(50);
        PurchaseOrderItem           : String(10);
        QuantityInPurchaseOrderUnit : Decimal(13, 3);
  }

  entity MNET_ACTION {
    BOLID          : Integer;
    BOL            : String(30);
    INVID          : String(30);
    CONID          : String(30);
    PO             : String(30);
    ACTION         : String(10);
    DOCNUM         : String(30);
    DATE           : String(30);
    FISCALYEAR     : String(10);
    REVERSALREASON : String(5);
    OBJECTTYPE     : String(30);
    RID            : Integer;
    lineNumber     : String(30);
  }

  entity MNET_DeliveryDocumentItem {
    BOLID                       : Integer;
    BOL                         : String(30);
    INVID                       : String(30);
    CONID                       : String(30);
    PO                          : String(30);
    Action                      : String(10);
    IBD_NO                      : String(30);
    IBD_LINE                    : String(10);
    lineNumber                  : String(10);
    Material                    : String(30);
    PurchaseOrder               : String(30);
    PurchaseOrderItem           : String(10);
    QuantityInPurchaseOrderUnit : String(10);
    ActualDeliveryQuantity      : String(10);
    Batch                       : String(10);
    Plant                       : String(10);
    ReferenceSDDocument         : String(30);
    ReferenceSDDocumentItem     : String(5);
    InventoryValuationType      : String(30);
  }


  entity MNET_SuplrInvcItemPurOrdRef {
    BOLID                       : Integer;
    BOL                         : String(30);
    INVID                       : String(30);
    CONID                       : String(30);
    PO                          : String(30);
    Action                      : String(10);
    IBD_LINE                    : String(10);
    lineNumber                  : String(10);
    Material                    : String(30);
    PurchaseOrder               : String(30);
    PurchaseOrderItem           : String(10);
    SupplierInvoiceItem         : String(10);
    Plant                       : String(10);
    TaxCode                     : String(10) default 'I0';
    DocumentCurrency            : String(30);
    SupplierInvoiceItemAmount   : String(10);
    PurchaseOrderQuantityUnit   : String(30);
    QuantityInPurchaseOrderUnit : String(10);
    SupplierInvoiceItemText     : String(10);
  }

  entity PO_Update {
    key PurchaseOrder       : String(50);
    key PurchaseOrderItem   : String(10);
        ScheduleLineOpenQty : Decimal(13, 2);
  }

  entity Edifact_Header : managed {
    key ID            : Integer;
        Object        : String(20);
        EdifactID     : String(30);
        EdifactString : LargeString;
        PO_List       : Composition of many PO_List
                          on PO_List.ID = $self;
  }

  entity PO_List : managed {
    key ID          : Association to Edifact_Header;  
    key PO          : String(10);
    key SEQUENCE_NO : Integer;
  }

  entity POConfirmationData : managed {
        //key ID :Integer;
    key PurchaseOrder             : String(10);
    key PurchaseOrderItem         : String(5);
    key DeliveryDate              : Date;
    key SequenceNo                : Integer;
        Quanity                   : Integer;
        Material                  : String(40);
        Party_Id_Identification   : String(10);
        FactoryRefNo              : String(10);
        Substitute                : String(10);
        NetPriceAmount            : String(10);
        ShipmentMethod            : String(10);
        JapanPONumber             : String(10);
        SupplierCode              : String(10);
        ReceiverCode              : String(10);
        SalesTradeTermCode        : String(10);
        ModelID                   : String(10);
        TransactionID             : String(10);
        SettlementTradeTermCode   : String(10);
        PurchasingOrganization    : String(10);
        CompanyCode               : String(10);
        ResponsibleEmployee       : String(10);
        PartnerCode               : String(10);
        ConsigneeCode             : String(10);
        PayerCode                 : String(10);
        SellerCode                : String(10);
        VendorOrder               : String(10);
        PackageTypeCode           : String(10);
        SalesUnitPrice            : String(10);
        Vendor                    : String(10);
        WarehouseCode             : String(10);
        PartnerWarehouse          : String(10);
        ConfirmationDate          : DateTime;
        PurchaseOrderQuantityUnit : String(10);
        DeliveryDateETA           : Date;
        ReasonCode                : String(1000);
        RevisionNumber            : Integer;
        EdifactId                 : String(10);
        Status                    : String(10);
        Message                   : String(1000);

  }


  entity POCrossRef : managed {
    key Client               : String(3); //010
    key Po_Old               : String(10);
    key PoItem_Old           : String(5);
    key Po_New               : String(10);
    key PoItem_New           : String(5);
        ActionInd            : String(1); //A/M/D
        ModeOfTransportation : String(3);
        Material_Number      : String(18);
        comment              : String(120);
        IBDStatus            : String(10);
        IBDNumber            : String(10);
        SAP_LineID_IBD       : String(10);
        InvoiceStatus        : String(10);
        InvoiceNumber        : String(10);
        LineID_Invoice       : String(10);
        GRStatus             : String(10);
        GRNumber             : String(10);
        SAP_LineID_GR        : String(10);
        BTP_ASN_DI_Status    : String(10);
        BTP_ASN_DINumber     : String(10);
        Status               : String(1);
        IsDelete             : String(1) default 'N';
  }

  entity ZMM_MOS : managed {
    key Client       : Integer;
    key Mos_code     : String(20);
        NumberOfDays : String(2);
  }


  entity ZMM_ETD : managed {
    key Sequence_Number  : Integer;
    key Client           : Integer;
        PurchasingGroup  : String(3);
        Vendor           : String(10);
        Type             : String(5);
        MethodOfShipping : String(20);
        LeadTime         : String(3);
  }

  entity MNET_DiversionHeader {
    key ID                   : Integer;
    key MNET_ID              : Integer;
    key houseBOLNumber       : String(18);
    key MNET_No              : String(16);
    key Mnet_Line            : String(30);
    key Container_ID         : String(20);
    key Purchase_order       : String(50);
    key PO_Line              : String(5);
        Quantity             : String(17);
        Material             : String(50);
        Plant                : String(4);
        ShipmentMethod       : String(10);
        MNET_DiversionDetail : Composition of many MNET_DiversionDetail
                                 on MNET_DiversionDetail.ID = $self;
  }

  entity MNET_DiversionDetail {
    key ID                  : Association to MNET_DiversionHeader;
    key NewPurchasing_Order : String(50);
    key NewPOLine           : String(5);
        NewQuantity         : String(17);
        Delivery            : String(10);
        IBD_Item            : String(10);
        IBD_Status          : String(1);
        IBD_Action          : String(10);
        Invoice             : String(16); 
        INV_Item            : String(10);
        INV_Status          : String(1);
        INV_Action          : String(10);
        Receipt             : String(10);
        GR_Item             : String(10);
        GR_Status           : String(1);
        GR_Action           : String(10);
        ASN_DI              : String(10);
        Status              : String(10) default '';
        StatusFlag          : String(5); //U
        unitPrice           : Decimal(23,6);
        partUnitOfMeasurement                 : String(15);
        extendedCost        : Decimal(26,6)

  }

//As per email standards, making email ID and USERID length to 320 characters
  entity UserMaster : managed {
    key UserID         : String(320);
        EmailID        : String(320);
        FirstName      : String(40);
        LastName       : String(40);
        UserAssignment : Composition of many UserAssignment
                           on UserAssignment.UserID = $self;
  }

//As per email standards, making email ID length to 320 characters
  entity UserAssignment : managed {
    key ID                     : Integer;
        UserID                 : Association to UserMaster;
        EmailID                : String(320);
        CompanyCode            : String(10);
        CompanyCodeDescription : String(200);
        PurchaseOrg            : String(10);
        PurchaseOrgDescription : String(200);
  }

  entity PO_AdditionalData {
    key PurchaseOrder              : String(10);
        PurchaseOrderType          : String(10); //Stock/Drop
        CompanyCode                : String(4);
        PurchasingGroup            : String(3);
        ConsigneeCode              : String(15);
        Warehouse                  : String(10);
        PartnerWarehouse           : String(10);
        PartnerWarehouseCode       : String(10);
        SellerCode                 : String(15);
        ShipmentMethod             : String(15);
        CityID                     : String(10);
        PayerCode                  : String(10);
        SalesRouteCode             : String(10);
        Customer                   : String(10);
        Customer_Partner           : String(10);
        SoldToParty                : String(10);
        PurchaseOrderByCustomer    : String(35);
        DeliveryAddressName        : String(100);
        DeliveryAddressHouseNumber : String(100);
        DeliveryAddressStreetName  : String(100);
        DeliveryAddressName2       : String(100);
        DeliveryAddressPostalCode  : String(100);
        DeliveryAddressCityName    : String(100);
        DeliveryAddressRegion      : String(100);
        DeliveryAddressCountry     : String(100);
        Name1                      : String(40);
        Name2                      : String(40);
        Street                     : String(60);
        CityPostalCode             : String(10);
        City                       : String(40);
        POBoxCity                  : String(40);
        Country                    : String(3);
        Region                     : String(3)
  }

  entity Environment {
    key APPID        : String(20);
    key Environment  : String(10);
        URL          : String(1000);
        tokenUrl     : LargeString;
        clientId     : LargeString;
        clientSecret : LargeString;
    key Active       : String(1);
  }

/* Adding the SupplierRespSalesPersonName field, this is used for Diversion PO's, if it is 'X' then not process to Factory*/
  entity A_PurchaseOrder : managed {
    key PurchaseOrder                  : String(10);
        CompanyCode                    : String(4);
        PurchaseOrderType              : String(4);
        PurchasingDocumentDeletionCode : String(1);
        PurchasingGroup                : String(3) not null;
        Supplier                       : String(10);
        CreationDate                   : Date;
        PurchasingOrganization         : String(4) not null;
        LastChangeDateTime             : DateTime;
        PurchasingCollectiveNumber     : String(10);
        SupplierPhoneNumber            : String(16);
        SupplierRespSalesPersonName    : String(18); // Suppress output(X or Null)
        CorrespncExternalReference     : String(12);
        CorrespncInternalReference     : String(12);
        AddressName                    : String(40);
        Language                       : String(2);
        ShipToParty                    : String(10);
        GlobalVendor                   : String(10);
        VendorCountry                  : String(2);
        CustomerReferenceNumber        : String(35); //Asif changes
        VendorAssignmentAccountGroup   : String(4);  //Brahma Defect 193 02/10/2024
        A_PurchaseOrderItem            : Composition of many A_PurchaseOrderItem
                                           on A_PurchaseOrderItem.PurchaseOrder = $self;
        poConfirmationString           : LargeString; //blob
  }

  entity A_PurchaseOrderItem : managed {
    key PurchaseOrder                  : Association to A_PurchaseOrder;
    key PurchaseOrderItem              : String(5);
        PurchasingDocumentDeletionCode : String(1);
        PurchaseOrderItemText          : String(40);
        Plant                          : String(4);
        StorageLocation                : String(4);
        MaterialGroup                  : String(9);
        PurchasingInfoRecord           : String(10);
        SupplierMaterialNumber         : String(35);
        OrderQuantity                  : Decimal(13, 2);
        PurchaseOrderQuantityUnit      : String(3);
        OrderPriceUnit                 : String(3);
        OrderPriceUnitToOrderUnitNmrtr : Decimal(5, 0);
        OrdPriceUnitToOrderUnitDnmntr  : Decimal(5, 0);
        DocumentCurrency               : String(5);
        NetPriceAmount                 : Decimal(12, 2);
        NetPriceQuantity               : Decimal(5, 0);
        Material                       : String(40);
        PurchaseOrderItemCategory      : String(1);
        AccountAssignmentCategory      : String(1);
        Customer                       : String(10);
        DeliveryAddressID              : String(10);
        DeliveryAddressName            : String(40);
        DeliveryAddressName2           : String(40);
        DeliveryAddressFullName        : String(80);
        DeliveryAddressStreetName      : String(60);
        DeliveryAddressHouseNumber     : String(10);
        DeliveryAddressCityName        : String(40);
        DeliveryAddressPostalCode      : String(10);
        DeliveryAddressRegion          : String(3);
        DeliveryAddressCountry         : String(3);
        DeliveryAddressDistrictName    : String(40);
        TaxJurisdiction                : String(15);
        ScheduleLineOpenQty            : Decimal(13, 2);
        ValuationType                  : String(10);
        // VendorAssignmentAccountGroup   : String(4);   //Brahma Defect 193. This map should be at the Header.
        A_PurchaseOrderScheduleLine    : Composition of many A_PurchaseOrderScheduleLine
                                           on A_PurchaseOrderScheduleLine.PurchasingDocumentItem = $self;
        A_PurOrdAccountAssignment      : Composition of many A_PurOrdAccountAssignment
                                           on A_PurOrdAccountAssignment.PurchaseOrderItem = $self;
        A_PurOrdPricingElement         : Composition of many A_PurOrdPricingElement
                                           on A_PurOrdPricingElement.PurchaseOrderItem = $self;
  }

  entity A_PurchaseOrderScheduleLine : managed {
    key PurchasingDocument       : String(10);
    key PurchasingDocumentItem   : Association to A_PurchaseOrderItem;
    key ScheduleLine             : String(4);
        ScheduleLineDeliveryDate : Date;
  }

  entity A_PurOrdAccountAssignment : managed {
    key PurchaseOrder           : String(10);
    key PurchaseOrderItem       : Association to A_PurchaseOrderItem;
    key AccountAssignmentNumber : String(2);
        SalesOrder              : String(10);
        SalesOrderItem          : String(6);
        PartnerAccountNumber    : String(10);
        PurgDocNetAmount        : Decimal(14, 3);
  }

  entity A_PurOrdPricingElement : managed {
        PurchaseOrder                 : String(10);
    key PurchaseOrderItem             : Association to A_PurchaseOrderItem;
        ConditionAmount               : Decimal(16, 3);
        ConditionQuantityUnit         : String(3);
        ConditionQuantity             : Decimal(5, 0);
        ConditionCurrency             : String(5);
        ConditionType                 : String(4);
    key PricingDocument               : String(10) not null;
    key PricingDocumentItem           : String(6) not null;
    key PricingProcedureStep          : String(3) not null;
    key PricingProcedureCounter       : String(3) not null;
        ConditionRateValue            : Decimal(24, 9);
        PriceDetnExchangeRate         : String(12);
        TransactionCurrency           : String(5);
        ConditionApplication          : String(2);
        PricingDateTime               : String(14);
        ConditionCalculationType      : String(3);
        ConditionBaseValue            : Decimal(24, 9);
        ConditionToBaseQtyNmrtr       : Decimal(10, 0);
        ConditionToBaseQtyDnmntr      : Decimal(10, 0);
        ConditionCategory             : String(1);
        ConditionIsForStatistics      : Boolean;
        PricingScaleType              : String(1);
        IsRelevantForAccrual          : Boolean;
        CndnIsRelevantForInvoiceList  : String(1);
        ConditionOrigin               : String(1);
        IsGroupCondition              : String(1);
        CndnIsRelevantForLimitValue   : Boolean;
        ConditionSequentialNumber     : String(3);
        ConditionControl              : String(1);
        ConditionInactiveReason       : String(1);
        ConditionClass                : String(1);
        FactorForConditionBasisValue  : Double;
        PricingScaleBasis             : String(3);
        ConditionScaleBasisValue      : Decimal(24, 9);
        ConditionScaleBasisCurrency   : String(5);
        ConditionScaleBasisUnit       : String(3);
        CndnIsRelevantForIntcoBilling : Boolean;
        ConditionIsForConfiguration   : Boolean;
        ConditionIsManuallyChanged    : Boolean;
        ConditionRecord               : String(10);
        AccessNumberOfAccessSequence  : String(3);
  }

  //ztable

  entity ZCROSSREF {
    key Sequence_Number : Integer;
    key Function_Code   : String(50);
    key Clinet_Code     : String(50);
        Company_Code    : String(50);
        SAP_Code        : String(50);
        Legacy_Code     : String(50);
        Username        : String(50);
        Parameter1      : String(50);
        Parameter2      : String(50);
        Parameter3      : String(50);
        Parameter4      : String(50);
        Parameter5      : String(50);
  }

  entity PurchaseGroup_GlobalCode {
    key Client               : String(3);
    key PurchaseGroup        : String(5);
        GlobalCode           : String(10);
        PartIndicator        : String(1);
        GlobalCodeName       : String(40);
        OutboundDivision     : String(15);
        Responsible_employee : String(15);
  }

  entity Vendor_Ref {
    key Client           : String(50);
    key Legacy           : String(50);
    key Vendor           : String(50);
        MatlGroup        : String(50);
        Producthierarchy : String(50);
        Createdby        : String(50);
        Created          : Date;
        Time             : Time;
        Changedby        : String(50);
        LastChg          : Date;
        ChangeTime       : Time;
  }

  entity OrderMark {
    key MANDT          : String(10);
    key ORDERMARK      : String(10);
        ORDERTYPE      : String(10);
        FREEIND        : String(10);
        SPECIND        : String(10);
        PCBIND         : String(10);
        TOOLIND        : String(10);
        LARGEQTYIND    : String(10);
        IGPIND         : String(10);
        MAINPARTSIND   : String(10);
        REFURBPARTSIND : String(10);
        DISCPARTSIND   : String(10);
        SERVICEMANIND  : String(10);
        REPAIRRETIND   : String(10);
        SHIPMETHODIND  : String(10);
  }

  entity ZipCode_Destination {
    key Client_Code                  : String(3);
    key Destination                  : String(4);
    key Plant                        : String(4);
        Description                  : String(20);
        IPP_Devanning_Indicator      : String(1);
        Logical_Devanner_Destination : String(1);
        End_User                     : String(8);
        Default_DEST                 : String(1);
  }


  entity AccountReference {
    key Client          : String(3);
    key Legacy_Customer : String(11);
    key Sold_to_party   : String(10);
        Orderer_Code    : String(10);
        Accountee_Code  : String(10);
        Consignee_Code  : String(10);
        Drop_Ship_Name  : String(40);
  }


  ///MNET tables
  entity bolHeader : managed {
        fileName                      : String(100);
    key ID                            : Integer;
    key houseBOLNumber                : String(18);
        importShipmentNumber          : String(30);
        recordType                    : String(2);
        importerOfRecord              : String(10);
        brokerCode                    : String(20);
        forwarderCode                 : String(20);
        carrierCode                   : String(20);
        SCAC                          : String(4);
        vesselName                    : String(30);
        voyageOrFlightNumber          : String(20);
        modeOfTransport               : String(10);
        initialDestination            : String(20);
        numberOfPallets               : String(17);
        numberOfCartons               : String(17);
        numberOfContainers            : String(17);
        numberOfCrates                : String(17);
        otherPackageQuantity          : String(17);
        shipmentValue                 : Decimal(17, 2);
        portOfExport                  : String(15);
        exportPortDescription         : String(60);
        portOfUnlading                : String(4);
        unladingPortDescription       : String(60);
        totalQuantityOrPieces         : String(17);
        shipmentGrossWeight           : Decimal(17, 4);
        freightAmount                 : Decimal(17, 2);
        insuranceAmount               : Decimal(17, 4);
        shipmentVolume                : Decimal(17, 6);
        shipmentNetWeight             : Decimal(17, 4);
        shipmentType                  : String(2);
        incoterm                      : String(50);
        manualHold                    : String(1);
        ultimateConsigneeID           : String(20);
        deconsolidatorID              : String(20);
        containerLoad                 : String(1);
        localCarrierID                : String(20);
        status                        : String(1);
        freightTerms                  : String(50);
        totalShipmentValue            : Decimal(17, 2);
        pp1BatchID                    : String(50);
        initialDestinationDescription : String(50);
        entryType                     : String(2);
        action                        : String(1);
        receiverUserID                : String(12);
        shippingControl               : String(1);
        shippingInfo                  : String(2);
        transmitterCode               : String(8);
        finalDestDivCD                : String(8);
        transmissionCreateTime        : String(6);
        transmissionCreateDate        : String(10);
        invoiceCreateDate             : Date;
        transmissionType              : String(1);
        bolCounter                    : String(4);
        bolDetailCounter              : String(5);
        kitCounter                    : String(5);
        actionFlag                    : String(1);
        billOfLadingErrFlag           : String(1);
        billOfLadingErrMsg            : String(30);
        insuranceType                 : String(1);
        totalNbrOfInvoices            : String(9);
        totalAmtOfInvoices            : Decimal(17, 2);
        totalFreightChargeCurrency    : String(3);
        ISOTotalFreightChargeCurrency : String(3);
        shipCompany                   : String(3);
        dateOfDepartureRevisedID      : String(1);
        airCarrierCode                : String(3);
        inbondFlag                    : String(1);
        asnNbr                        : String(10);
        trailerNumber                 : String(12);
        wareHouseNumber               : String(5);
        dcNbr                         : String(5);
        transformCode                 : String(10);
        shipMethod                    : String(1);
        transformName                 : String(5);
        destinationCountryName        : String(10);
        ISODestinationCountryCode     : String(2);
        destinationCityName           : String(50);
        countryCode                   : String(3);
        cityCode                      : String(3);
        airCargoReceiptNbr            : String(11);
        flight2                       : String(12);
        flight3                       : String(12);
        ordererShortName              : String(15);
        ordererNameField1             : String(50);
        ordererNameField2             : String(50);
        ordererAddressLine1           : String(50);
        ordererAddressLine2           : String(50);
        shortName                     : String(15);
        nameField1                    : String(50);
        nameField2                    : String(50);
        addressLine1                  : String(50);
        addressLine2                  : String(50);
        salesAmountRevisedID          : String(1);
        priceTermName                 : String(30);
        kitsOrderedID                 : String(1);
        duplicateSalesNoteNbr         : String(1);
        representOrderNbr             : String(25);
        sectionCode                   : String(8);
        transactionTypeCode           : String(1);
        negoID                        : String(1);
        adjustmentRevisedID           : String(1);
        newSectionCode                : String(2);
        regionDepartmentCode          : String(8);
        opInsuranceCertificate        : String(54);
        transmissionSource            : String(1);
        bolTotalNbrOfInvoices         : String(9);
        bolTotalAmountOfInvoices      : Decimal(17, 2);
        batchID                       : String(50);
        masterBOLNumber               : String(18);
        totalFreightChargeForBOL      : Decimal(17, 2);
        ZSTATUSREMARKS1               : String(100);
        ZSTATUSREMARKS2               : String(100);
        ZSTATUSREMARKS3               : String(100);
        ZSTATUSREMARKS4               : String(100);
        ZSTATUSREMARKS5               : String(100);
        ZSTATUSREMARKS6               : String(100);
        ZSTATUSREMARKS7               : String(100);
        ZSTATUSREMARKS8               : String(100);
        ZSTATUSREMARKS9               : String(100);
        ZSTATUSREMARKS10              : String(100);
        ZMANUALNOTES1                 : String(100);
        ZMANUALNOTES2                 : String(100);
        ZMANUALNOTES3                 : String(100);
        ZGENERALCHARGES1              : String(100);
        ZGENERALCHARGES2              : String(100);
        ZGENERALCHARGES3              : String(100);
        ZGENERALCHARGES4              : String(100);
        ZGENERALCHARGES5              : String(100);
        ZGENERALCHARGES6              : String(100);
        ZGENERALCHARGES7              : String(100);
        generalCharges                : String(50); // updated not present in excel
        itNo                          : String; //data type not given
        initialDestinationETA         : Date;
        exportDate                    : Date;
        dateOfUnlading                : Date;
        portOfArrival                 : String(15);
        arrivalPortDescription        : String(60);
        ETA                           : Date;
        packingCost                   : Decimal(17, 2);
        countryOfImport               : String(3);
        ordererID                     : String(20);
        si                            : String; //data type not given
        notes                         : String(100);
        statusRemark                  : String(100);
        attribute1                    : String; //data type not given
        attribute2                    : String; //data type not given
        flag_bolchange                : Boolean;
        invoiceHeader                 : Composition of many invoiceHeader
                                          on invoiceHeader.houseBOLNumber = $self;


  }


  entity invoiceHeader {
        action                    : String(1);
    key invoiceNumber             : String(16);
    key houseBOLNumber            : Association to bolHeader; //fk
        shipperReferenceNumber    : String(30);
        importerReferenceNumber   : String(30);
        additionalInvoiceNumber   : String(12);
        invoiceType               : String(10);
        billToID                  : String(20);
        supplierID                : String(20);
        invoiceCurrencyCode       : String(3);
        contractExchangeRate      : Decimal(16, 6);
        invoiceAmount             : Decimal(12, 2);
        invoiceGrossWeight        : Decimal(17, 4);
        invoiceNetWeight          : Decimal(17, 4);
        numberOfPallets           : String(17);
        numberOfCartons           : String(17);
        numberOfContainers        : String(17);
        numberOfCrates            : String(17);
        numberOfOtherPackage      : String(17);
        transMethodCode           : String(30);
        invoiceQuantityOrPieces   : String(17);
        purchaseOrderNumber       : String(50);
        invoiceVolume             : Decimal(19, 6);
        adjustmentName            : String(30);
        adjustmentPrice           : Decimal(17, 2);
        adjustmentName2           : String(30);
        adjustmentPrice2          : Decimal(17, 2);
        adjustmentName3           : String(30);
        adjustmentPrice3          : Decimal(17, 2);
        adjustmentName4           : String(30);
        adjustmentPrice4          : Decimal(17, 2);
        insuranceAmt              : Decimal(13, 2);
        freightAmt                : Decimal(13, 2);
        code                      : String(8);
        billToShortName           : String(15);
        billToNameField1          : String(50);
        billToNameField2          : String(50);
        billToAddressLine1        : String(50);
        billToAddressLine2        : String(50);
        billToRevisedID           : String(1);
        salesCurrencyCode         : String(3);
        salesCurrencyMark         : String(4);
        saleCurrencyRevID         : String(1);
        paymentConditionCode      : String(2);
        paymentConditionRevisedID : String(1);
        adjustmentCode1           : String(1);
        adjustmentPCT             : String(1);
        adjustmentSubTotal        : String(10);
        adjustmentCode2           : String(1);
        adjustmentPCT2            : String(1);
        adjustmentSubTotal2       : String(10);
        adjustmentPCT3            : String(1);
        adjustmentCode3           : String(1);
        adjustmentSubTotal3       : String(10);
        adjustmentPCT4            : String(1);
        adjustmentSubTotal4       : String(10);
        adjustmentCode4           : String(1);
        totalAdjustmentName       : String(30);
        exchangeDescription       : String(30);
        exchangeCalculationID     : String(1);
        exchangeCurrencyCode      : String(3);
        indicativeCurrencyCode    : String(4);
        adjustmentRevID           : String(1);
        ISOExchangeCurrencyCode   : String(3);
        ISOindicativeCurrencyCode : String(3);
        shipperName2              : String(50);
        shipperName1              : String(50);
        lastComments1             : String(500); //updated
        ZLASTCOMMENTS1            : String(100);
        ZLASTCOMMENTS2            : String(100);
        ZLASTCOMMENTS3            : String(100);
        ZLASTCOMMENTS4            : String(100);
        ZLASTCOMMENTS5            : String(100);
        ZLASTCOMMENTS6            : String(100);
        ZLASTCOMMENTS7            : String(100);
        ZLASTCOMMENTS8            : String(100);
        ZLASTCOMMENTS9            : String(100);
        ZLASTCOMMENTS10           : String(100);
        ZLASTCOMMENTS11           : String(100);
        ZLASTCOMMENTS12           : String(100);
        ZLASTCOMMENTS13           : String(100);
        ZLASTCOMMENTS14           : String(100);
        ZLASTCOMMENTS15           : String(100);
        ZPAYTERMS1                : String(125);
        ZPAYTERMS2                : String(125);
        invoicedate               : Date;
        divison                   : String(8);
        importCountryCurrency     : String(3);
        buyerOrderCode            : String(30);
        containerID               : String(20);
        paymentTerms              : String(100);
        attribute1                : String(50); //data type not given
        attribute2                : String(50); //data type not given
        lastComments              : String(500);
        dueDate                   : Date; // updated
        salesBillingDate          : Date; // updated
        invoiceLine               : Composition of many invoiceLine
                                      on invoiceLine.invoiceNumber = $self;
  }


  entity invoiceLine {
    key partID                : String(50);   //changing key factor
        buyerOrderNumber      : String(30);
        buyerPartID           : String(50);
        supplierPartID        : String(50);
    key invoiceNumber         : Association to invoiceHeader; //fk
        countryOfOrigin       : String(2);
        countryOfExport       : String(2);
        quantity              : String(17);
        unitPrice             : Decimal(23, 6);
        extendedCost          : Decimal(17, 2);
        businessUnit          : String(10);
        netWeight             : Decimal(17, 4);
        grossWeight           : Decimal(17, 4);
        containerID           : String(20);
        purchaseOrderNumber   : String(50);
        lineVolume            : Decimal(22, 6);
        manufacturerID        : String(20);
        caseFrom              : String(20);
        caseTo                : String(20);
        caseType              : String(3);
        numberOfCase          : String(15);
        quantityPerCase       : String(15);
        partUnitOfMeasurement : String(15);
        containerType         : String(6);
        sampleType            : String(1);
        SWPMFlag              : String(1);
        SWPMCountryOfOrigin   : String(2);
        status                : String(1);
        brandName             : String(30);
        addlRefNo             : String(12);
        mecaOrderNbr          : String(50);
        orderItemNbr          : String(5);
        action                : String(1);
    key lineNumber            : String(30);
        finalDestinationCode  : String(3);
        buyerCode             : String(20);
        buyerDescription      : String(8);
        insuranceAmount       : Decimal(17, 2);
        freightAmount         : Decimal(17, 2);
        promotionalItems      : String(50); //data type not given
        supplierInvoiceNumber : String(16);
        houseBOLNumber        : String(18);
        notes                 : String(100);
        SWPMNotes             : String(100);
        packingCost           : Decimal(17, 2);
        statusRemark          : String(100);
        attribute1            : String(50); //data type not given
        attribute2            : String(50); //data type not given
        lineDuty              : String(50); //data type not given
        primaryDutyRate       : Decimal(17, 2);
        advaloremDutyRate     : Decimal(17, 2);
        otherDutyRate         : Decimal(17, 2);
        caseMarkings          : String(100);
        specifications        : String(100);
        mmvProAmt             : Decimal(17, 2);
        ndcProAmt             : Decimal(17, 2);
        BTP_IBDStatus         : String(10);
        BTP_IBDAction         : String(10);//defect 208
        BTP_IBDNumber         : String(10);
        SAP_LineID_IBD        : String(10);
        BTP_InvoiceStatus     : String(10);
        BTP_InvoiceNumber     : String(10);
        BTP_InvoiceAction     : String(10);//defect 208
        BTP_InvoiceDate       : DateTime;
        SAP_LineID_Invoice    : String(10);
        BTP_GRStatus          : String(10);
        BTP_GRNumber          : String(10);
        BTP_GRAction          : String(10); //Defect 216
        SAP_LineID_GR         : String(10);
        BTP_ASN_DI_Status     : String(10);
        BTP_ASN_DINumber      : String(10);
        statuserror           : String(100);
        DiversionFlag         : String(1);
        Zbusiness_indicator   : String(5); //Asif changes
        additionalInvoiceLine : Composition of many additionalInvoiceLine
                                  on additionalInvoiceLine.partID = $self;

  }

  entity additionalInvoiceLine {
       invoiceLineStatus                  : String(1) default 'N';
        //key invoiceNumber                  : Association to invoiceHeader; //fk
    key partID                             : Association to invoiceLine;
        invoiceItemNbr                     : String(4);
        invoiceSequenceNbr                 : String(3);
        purchaseOrderSuffixNbr             : String(1);
        poNbrTripartite                    : String(10);
        poItemNbrTripartite                : String(4);
        salesOfficeNbr                     : String(2);
        salesOfficeContinue                : String(10);
        invoiceItemNbrRevID                : String(1);
        endUserOrderNbr                    : String(25);
        endUserCode                        : String(8);
        endUserShortName                   : String(15);
        salesUnitPriceRevID                : String(1);
        unitPriceRevID                     : String(1);
        hsCode                             : String(9);
        commodityName                      : String(50);
        userCommodityName                  : String(50);
        colorCode                          : String(2);
        colorName                          : String(30);
        supplierShortName                  : String(15);
        saleUnitPrice                      : Decimal(19, 4);
        qtyPerSalesUnitPrice               : Decimal(7, 2);
        qtyPerSLSUnitPricePackType         : String(2);
        qtyPerSLSUnitPricePackNameOne      : String(15);
        qtyPerSLSUnitPricePackNameMany     : String(15);
        qtyPerFactoryUnitPricePackType     : String(2);
        qtyPerFactoryUnitPricePackNameOne  : String(15);
        qtyPerFactoryUnitPricePackNameMany : String(15);
        totalModelSalesPrice               : Decimal(17, 2);
        netWeightPerCartonOneModel         : String(9);
        totalNetWeightPerCarton            : String(9);
        grossWeightPerCarton               : String(9);
        PASCServiceModelNbr                : String(20);
        PASCServiceSparePartsName          : String(25);
        PASCOriginalPartsNbr               : String(20);
        parentModelNbr                     : String(20);
        packType                           : String(2);
        packTypeName                       : String(30);
        caShortName                        : String(7);
        qtyPerPack                         : Decimal(12, 2);
        mixedPackingID                     : String(1);
        nbrOfDifferentModelsInCarton       : String(5);
        originOfMxdPackingPLItemNbr        : String(6);
        originOfMxdPackingIVItemNbr        : String(4);
        originOfMxdPackingContItemNbr      : String(4);
        unitizedPackingStyleCode           : String(2);
        unitizedPackingStyleName           : String(30);
        unitizedNbrOfPacks                 : String(5);
        mxdPackingPONbr                    : String(10);
        mxdPackingPOItemNbr                : String(4);
        mxdPackingPOKitItemNbr             : String(4);
        mxdPackingSalesNoteNbr             : String(9);
        mxdPackingSalesNoteItemNbr         : String(4);
        mxdPackingSalesNoteKitNbr          : String(4);
        mxdPackingIVNbr                    : String(12);
        containerReferenceNbr              : String(9);
        containerItemNbr                   : String(4);
        containerSequenceNbr               : String(3);
        manifestNbr                        : String(24);
        containerSealNbr1                  : String(24);
        containerSealNbr2                  : String(24);
        containerSealNbr3                  : String(24);
        upcCode                            : String(12);
        shipmentID                         : String(9);
        packingListSuffixNbr               : String(2);
        deliveryListItemNbr                : String(6);
        caseNbrToRevID                     : String(1);
        caseNbrFromRevID                   : String(1);
        qtyPerPackRevID                    : String(1);
        qtyOfForwardingGoodsRevID          : String(1);
        salesNoteModelLineNbr              : String(4);
        salesNoteKitLineNbr                : String(4);
        salesNoteNbr                       : String(9);
        cocomid                            : String(1);
        exportLicenseNbrCocom              : String(15);
        lotNumber                          : String(50);
        napanaMasterBolNumber              : String(16);
        packingListNbr                     : String(10);
        lineVolumePerCase                  : Decimal(21, 2);
        caFactoryNbr                       : String(12);
        ZSTATUSREMARKS1                    : String(100);
        ZSTATUSREMARKS2                    : String(100);
        ZSTATUSREMARKS3                    : String(100);
        ZSTATUSREMARKS4                    : String(100);
        ZSTATUSREMARKS5                    : String(100);
        ZSTATUSREMARKS6                    : String(100);
        ZSTATUSREMARKS7                    : String(100);
        ZSTATUSREMARKS8                    : String(100);
        ZSTATUSREMARKS9                    : String(100);
        ZSTATUSREMARKS10                   : String(100);
        ZSPECIFICATION                     : String(100);
        ZSPECIFICATION1                    : String(100);
        ZSPECIFICATION2                    : String(100);
        ZSPECIFICATION3                    : String(100);
        ZSPECIFICATION4                    : String(100);
        ZSPECIFICATION5                    : String(100);
        ZSPECIFICATION6                    : String(100);
        ZSPECIFICATION7                    : String(100);
        ZSPECIFICATION8                    : String(100);
        SWPMNOTES1                         : String(100);
        SWPMNOTES2                         : String(100);
        SWPMNOTES3                         : String(100);
        ZNOTES1                            : String(100);
        ZNOTES2                            : String(100);
        ZNOTES3                            : String(50);
        ZCASEMARKING                       : String(100);
        ZCASEMARKING1                      : String(100);
        ZCASEMARKING2                      : String(100);
        ZCASEMARKING3                      : String(100);
        ZCASEMARKING4                      : String(100);
        ZCASEMARKING5                      : String(100);
        mecaOrderNbr                       : String(50);
        orderItemNbr                       : String(50);
  }

  // Config Table //
  entity ZMNETBUSINESS : managed {
    key MANDT            : String(3);
    key ZBUSINESS_IND    : String(2);
    key ZMODE            : String(1);
        ZRECTYPE         : String(2);
        ZPAYCONCODE      : String(2);
        ZSHIPMETHOD      : String(1);
        ZMNETDTLS_EXIST  : String(1);
        ZDEVANNABLE      : String(1);
        ZPOIND           : String(1);
        ZSPECIAL         : String(1);
        ZINBD_DLVY       : String(1);
        ZINVICE          : String(1);
        ZGOODS_RECEIPT   : String(1);
        ZDLVY_INSTR      : String(1);
        ZANCITIPATED_REC : String(1);
        ZASN             : String(1);
        ZDESCRIPTION     : String(80);

  }

  entity ZMNETMODE : managed {
    key MANDT       : String(3);
    key TMODE       : String(3);
        TRATY       : String(4);
        ZSHIPMETHOD : String(1);
        ZTMODEDESCR : String(35);
        ZSHIPTYPE   : String(2);
  }

  entity zjda_ship_plan {

        proc_date    : Date @cds.on.insert: $now;
        proc_time    : Time @cds.on.insert: $now;
    key counter      : Integer64;
    key matnr        : String(18);
    key salesord     : String(22);
    key salesordline : String(10);
        dest         : String(15);
        source       : String(15);
        sourcing     : String(40);
        shipdate     : Date;
        sardate      : Date;
        quantity     : String(13);
        tmode        : String(15);
        segment      : String(15);
        demand       : String(30);
        pattern      : String(10);
        itemtype     : String(15);
        jdasource    : String(10);
        jdasupply    : String(1);
        udest        : String(15);
        status       : String(15);

  }

  entity zjda_shipplan_sel_criterion {

    key ship_plan_received_from : Integer;
    key ship_plan_received_to   : Integer;
        itemtype                : String(15);
    key ship_plan_source        : String(10);
    key shipdate_from           : Integer;
    key shipdate_to             : Integer;
        supplyType              : String(1);
        material                : String(1000);
        salesorder              : String(22);
        salesorderline          : String(10);
    key purchasing_org          : String(4);
    key purchasing_group        : String(4);
    key plant                   : String(4);
    key vendor_i_e_indicator    : String(2);
        vendor                  : String(1000);
        sub_con_vendor          : String(20);
        email                   : String(1000);
  }

  entity Master_Lock : managed {
    key Id          : Integer;
        Table_Name  : String(30);
        Lock_Status : Boolean;
        UserID   : String(40);
  }
}


@cds.persistence.exists 
Entity MNET_DASHBOARD_GET_MNET_DATA_LIST_HDR_VIEW {
       key![houseBOLNumber_ID]: Integer not null  @title: 'houseBOLNumber_ID' ; 
       key![importShipmentNumber]: String(30)  @title: 'importShipmentNumber' ; 
       key![BillofLading]: String(18)  @title: 'BillofLading' ; 
       key![FileName]: String(100)  @title: 'FileName' ; 
       key![SupplierInvoice]: String(16)  @title: 'SupplierInvoice' ; 
       status: String(1)  @title: 'status' ; 
       action: String(1)  @title: 'action' ; 
       key![Received_Date]: Date  @title: 'Received_Date' ; 
        ETA: Date  @title: 'ETA' ; 
        ProcessDate: Date  @title: 'ProcessDate' ; 
        MPro_Date: Date  @title: 'MPro_Date' ; 
        PurchaseOrder: String(25)  @title: 'PurchaseOrder' ; 
        CompanyCode: String(4)  @title: 'CompanyCode' ; 
        GlobalCompanyCode: String(20)  @title: 'GlobalCompanyCode' ; 
        MethodofShipment: String(10)  @title: 'MethodofShipment' ; 
        initialDestination: String(20)  @title: 'initialDestination' ; 
}