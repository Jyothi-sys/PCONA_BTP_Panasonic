using MNET_Dashboard_Detail from './MNET_Dashboard_Detail';
 
annotate MNET_Dashboard_Detail.GET_MNET_Data_Detail with {
    Folder_No                     @title    : '{i18n>Folder_No}';
    action                        @title    : '{i18n>ACT_Id}';
    shippingInfo                  @title    : '{i18n>Biz_Id}';
    SupplierInvoice_Line          @title    : '{i18n>SupplierInvoice_Line}';
    Purchasing_order              @title    : '{i18n>Purchasing_Order}';
 
    PO_Line                       @title    : '{i18n>PO_Line}';
    status                        @title    : '{i18n>Status_Qty}';
    containerID                   @title    : '{i18n>Container}';
    buyerPartID                   @title    : '{i18n>Material}';
    Original_Material             @title    : '{i18n>Original_Material}';
    Original_PO_Line              @title    : '{i18n>Original_PO_Line}';
    quantity                      @title    : '{i18n>Quantity}';
    Plant                         @title    : '{i18n>DestinationPlant}';
    BTP_IBDNumber                 @title    : '{i18n>Inbound_Delivery}';
    deliveryListItemNbr           @title    : '{i18n>InboundDeliveryLineItem}';
    BTP_GRNumber                  @title    : '{i18n>Goods_Receipt}';
    Vender                        @title    : '{i18n>Vender}';
    invoiceItemNbr                @title    : '{i18n>invoiceItemNbr}';
    DI_Status                     @title    : '{i18n>DI_Status}';
    ASN_Status                    @title    : '{i18n>ASN_Status}';
    Receipt_Line                  @title    : '{i18n>Receipt_Line}';
    BTP_InvoiceStatus             @title    : '{i18n>Invoice_Status}';
    BTP_IBDStatus                 @title    : '{i18n>InboundDelivery_Status}';
    CompanyCode                   @title    : '{i18n>CompanyCode}';
    modeOfTransport               @title    : '{i18n>ModeofTransport}';
    initialDestinationDescription @title    : '{i18n>Destination}';
    BillofLanding                 @title    : '{i18n>BillofLanding}';
    GlobalCompanyCode             @title    : '{i18n>GlobalCompanyCode}';
    ETA                           @title    : '{i18n>ETA}';
    ProcessDate                   @title    : '{i18n>ProcessDate}';
    initialDestination            @title    : '{i18n>Destinationcode}';
    // invoiceNumber                 @title    : '{i18n>invoiceNumber}';
    // invoiceNum                    @title    : '{i18n>invoiceNum}';
    statusRemark                  @title    : '{i18n>statusRemark}';
    Received_Date                 @title    : '{i18n>Received_Date}'
                                  @UI.Hidden: true;
    BTP_InvoiceNumber             @title    : '{i18n>SAPInvoice}';
    ShippingMethodCode            @title    : '{i18n>ShippingMethodCode}'
                                  @UI.Hidden: true;
    SupplierInvoice               @title    : '{i18n>SupplierInvoice}' ;
                                //    @UI.Hidden: true;
    houseBOLNumber_ID             @title    : '{i18n>houseBOLNumber_ID}';
    DiversionFlag                 @title    : '{i18n>DiversionFlag}';
    Stock_Drop                    @title    : '{i18n>Stock_Drop}'
                                  @UI.Hidden: true;
    Po_Old                        @title    : '{i18n>Po_Old}'
                                  @UI.Hidden: true;
    paymentConditionCode @title    : '{i18n>paymentConditionCode}'
                         @UI.Hidden: true;
    CustomerReferenceNumber  @title    : '{i18n>Customer Reference Number}';
    UnitPrice @title : '{i18n>Unit_Price}' @UI.Hidden: true; 
    UOM @title : '{i18n>Order_Unit_UOM}' @UI.Hidden: true;
    DiversionId @title: '{i18n>DiversionId}' @UI.Hidden: true;
    CurrencyCode @title: '{i18n>Currency_Code}' @UI.Hidden: true;
    IBD_Action @title: '{i18n>IBD_Action}' @UI.Hidden: true;
    INV_Action @title: '{i18n>INV_Action}' @UI.Hidden: true;
    GR_Action @title: '{i18n>GR_Action}' @UI.Hidden: true;
};
 
 
annotate MNET_Dashboard_Detail.GET_MNET_Data_Detail with
@(
    Capabilities:{
    FilterRestrictions:{
        $Type : 'Capabilities.FilterRestrictionsType',
        RequiredProperties:[
            // CompanyCode
        ]
    }
},
 
    sap.searchable        : false,
    UI.PresentationVariant: {
        $Type         : 'UI.PresentationVariantType',
        RequestAtLeast: [
            BTP_InvoiceNumber,
            BTP_GRNumber,
            BTP_IBDNumber,
            Purchasing_order,
            SupplierInvoice,
            houseBOLNumber_ID,
            BillofLanding,
            Stock_Drop,
            Po_Old,
            paymentConditionCode,
            UnitPrice,
            UOM,
            DiversionId,
            CurrencyCode,
            IBD_Action,
            INV_Action,
            GR_Action
        ],
        SortOrder: [
            {
                $Type: 'Common.SortOrderType',
                Property: 'ProcessDate',
                Descending: true
            }
        ],
        GroupBy: [
            BillofLanding
        ]
    },
    UI.HeaderInfo         : {
        TypeName      : 'Invoice Detail Data',
        TypeNamePlural: 'Invoice Detail Data',
 
    },
    UI.SelectionFields    : [
        Folder_No,
        CompanyCode,
        modeOfTransport,
        initialDestinationDescription,
        BTP_IBDStatus,
        BillofLanding,
        GlobalCompanyCode,
        ETA,
        DI_Status,
        ASN_Status,
        Receipt_Line,
        // invoiceNum,
        SupplierInvoice,
        ProcessDate,
        initialDestination,
        BTP_InvoiceStatus,
        Vender,
        status,
        Purchasing_order
    ],
   
    UI.LineItem           : [
        {
            $Type: 'UI.DataField',
            Value: Folder_No
        },
        {
            $Type: 'UI.DataField',
            Value: BillofLanding
        },
        {
            $Type: 'UI.DataField',
            Value: action
        },
        {
            $Type: 'UI.DataField',
            Value: shippingInfo
        },
        //@gnaneshwar added for allignment
        {
            $Type: 'UI.DataField',
            Value: initialDestinationDescription
        },
        {
            $Type: 'UI.DataField',
            Value: ETA
        },
 
        {
            $Type: 'UI.DataField',
            Value: SupplierInvoice
        },
        {
            $Type: 'UI.DataField',
            Value: SupplierInvoice_Line
        },
 
        {
            $Type: 'UI.DataField',
            Value: PO_Line
        },
        //@ bhushan position 10
        {
            $Type: 'UI.DataField',
            Value: status
        },
        //@gnaneshwar position 11
        {
            $Type: 'UI.DataField',
            Value: containerID
        },
         //@gnaneshwar position 12
        {
            $Type: 'UI.DataField',
            Value: buyerPartID
        },
       //@gnaneshwar position 15
       {
            $Type: 'UI.DataField',
            Value: GlobalCompanyCode
        },
        //@gnaneshwar position 16
        {
            $Type: 'UI.DataField',
            Value: CompanyCode
        },
         //@gnaneshwar position 17
         {
            $Type: 'UI.DataField',
            Value: ProcessDate
        },
        //@gnaneshwar position 18
        {
            $Type: 'UI.DataField',
            Value: Vender
        },
        //@gnaneshwar position 19
        {
            $Type: 'UI.DataField',
            Value: CustomerReferenceNumber
        },
        {
            $Type: 'UI.DataField',
            Value: Original_Material
        },
        {
            $Type: 'UI.DataField',
            Value: Original_PO_Line
        },
        // //@gnaneshwar position 23
        // {
        //     $Type: 'UI.DataField',
        //     Value: DiversionFlag
        // },
       
        {
            $Type: 'UI.DataField',
            Value: quantity
        },
        // //@gnaneshwar position 26
        //  {
        //     $Type: 'UI.DataField',
        //     Value: BTP_InvoiceNumber
        // },
         //@gnaneshwar position 27
        {
            $Type: 'UI.DataField',
            Value: invoiceItemNbr
        },
        //@gnaneshwar position 28
         {
            $Type: 'UI.DataField',
            Value: BTP_InvoiceStatus
        },
         //@gnaneshwar position 29
        {
            $Type: 'UI.DataField',
            Value: Plant
        },
         //@gnaneshwar position 30
        {
            $Type: 'UI.DataField',
            Value: modeOfTransport
        },
        //@gnaneshwar position 31
        {
            $Type: 'UI.DataField',
            Value: initialDestination
        },
                {
            $Type: 'UI.DataField',
            Value: deliveryListItemNbr
        },
        {
            $Type: 'UI.DataField',
            Value: BTP_IBDStatus
        },
       
       
        {
            $Type: 'UI.DataField',
            Value: Receipt_Line
        },
       
       
        {
            $Type: 'UI.DataField',
            Value: DI_Status
        },
        {
            $Type: 'UI.DataField',
            Value: ASN_Status
        },
       
        //@gnaneshwar position 40
        {
            $Type: 'UI.DataField',
            Value: statusRemark
        },
        //@gnaneshwar position 41
        {
            $Type: 'UI.DataField',
            Value: houseBOLNumber_ID
        },
        {
        $Type: 'UI.DataField',
        Value: Purchasing_order,
        @UI.Hidden: true
        },
        {
        $Type: 'UI.DataField',
        Value: BTP_GRNumber,
        @UI.Hidden: true
        },
        {
        $Type: 'UI.DataField',
        Value: BTP_InvoiceNumber,
        @UI.Hidden: true
        },
        {
        $Type: 'UI.DataField',
        Value: BTP_IBDNumber,
        @UI.Hidden: true
        }
       
    ],
 
);
 
annotate MNET_Dashboard_Detail.Get_POCrossRef with {
    Po_Old            @title: '{i18n>Po_Old}';
    PoItem_Old        @title: '{i18n>PoItem_Old}';
    Po_New            @title: '{i18n>Po_New}';
    PoItem_New        @title: '{i18n>PoItem_New}';
    Status            @title: '{i18n>Status}';
    Material_Number   @title: '{i18n>Material_Number}';
    InvoiceNumber     @title: '{i18n>SAPInvoice}';
    LineID_Invoice    @title: '{i18n>invoiceItemNbr}';
    InvoiceStatus     @title: '{i18n>Invoice_Status}';
    IBDNumber         @title: '{i18n>Inbound_Delivery}';
    SAP_LineID_IBD    @title: '{i18n>InboundDeliveryLineItem}';
    IBDStatus         @title: '{i18n>InboundDelivery_Status}';
    GRNumber          @title: '{i18n>Receipt}';
    SAP_LineID_GR     @title: '{i18n>Receipt_Line}';
    GRStatus          @title: '{i18n>GR_Status}';
    BTP_ASN_DINumber  @title: '{i18n>BTP_ASN_DINumber}';
    BTP_ASN_DI_Status @title: '{i18n>BTP_ASN_DI_Status}';
}