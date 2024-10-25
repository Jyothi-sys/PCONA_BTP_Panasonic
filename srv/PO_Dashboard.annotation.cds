using PO_Dashboard from './PO_Dashboard';

annotate PO_Dashboard.Get_PO_Purchase_Order_List_Hdr with {
    PurchaseOrder           @title: '{i18n>PurchasingDocNo}';
    CompanyCode             @title: '{i18n>CompanyCode}';
    PurchasingOrg           @title: '{i18n>PurchasingOrg}';
    BuyerGlobalLocationCode @title: '{i18n>BuyerGlobalLocationCode}';
    Vendor                  @title: '{i18n>Vendor}';
    VendorName              @title: '{i18n>VendorName}';
    POCreationDate          @title: '{i18n>POCreationDate}';
    PoTransmissionDate      @title: '{i18n>PoTransmissionDate}';
    Stock_Drop              @title: '{i18n>Stock_Drop}';
    Seller_Code             @title: '{i18n>Seller_Code}';
    Consignee_Code          @title: '{i18n>Consignee_Code}';
    POTransmission_Status   @title: '{i18n>POTransmission_Status}';
    TransmittedDestination  @title: '{i18n>TransmittedDestination}';
    SalesRoute_Code         @title: '{i18n>SalesRoute_Code}';
    Supplier_Code           @title: '{i18n>Supplier_Code}';
    SalesCurrency_Code      @title: '{i18n>SalesCurrency_Code}';
    DestinationCityCode     @title: '{i18n>DestinationCityCode}';
    ShippingMethodCode      @title: '{i18n>ShippingMethodCode}';
    OrderPriority_Id        @title: '{i18n>OrderPriority_Id}';
    Sending_System          @title: '{i18n>Sending_System}';
    Receiving_System        @title: '{i18n>Receiving_System}';
    VendorAssgnAcntGrp      @title: '{i18n>VendorAssgnAcntGrp}';
    ShipTo                  @title: '{i18n>ShipTo}';
    VendorCountry           @title: '{i18n>VendorCountry}';
}

annotate PO_Dashboard.Get_PO_Purchase_Order_List_Hdr with @(
    sap.searchable                   : false,
    UI.PresentationVariant           : {
        $Type         : 'UI.PresentationVariantType',
        RequestAtLeast: [PurchaseOrder],
    },
    UI.HeaderInfo                    : {
        TypeName      : 'Purchase Order List',
        TypeNamePlural: 'PO List',
    },
    UI.SelectionFields               : [
        PurchaseOrder,
        CompanyCode,
        PurchasingOrg,
        BuyerGlobalLocationCode,
        Vendor,
        VendorName,
        POCreationDate,
        PoTransmissionDate,
        POTransmission_Status
    ],
    UI.PresentationVariant           : {SortOrder: [{
        $Type     : 'Common.SortOrderType',
        Property  : 'PurchaseOrder',
        Descending: true
    }]},
    UI.LineItem                      : [
        {
            $Type: 'UI.DataField',
            Value: CompanyCode,
        },
        {
            $Type: 'UI.DataField',
            Value: PurchasingOrg
        },
        {
            $Type: 'UI.DataField',
            Value: BuyerGlobalLocationCode
        },
        {
            $Type: 'UI.DataField',
            Value: Vendor
        },
        {
            $Type: 'UI.DataField',
            Value: VendorName
        },
        {
            $Type : 'UI.DataField',
            Value : VendorAssgnAcntGrp
        },
        {
            $Type : 'UI.DataField',
            Value : VendorCountry
        },
        {
            $Type : 'UI.DataField',
            Value : ShipTo
        },
        {
            $Type: 'UI.DataField',
            Value: POCreationDate
        },
        {
            $Type: 'UI.DataField',
            Value: PoTransmissionDate
        },
        {
            $Type: 'UI.DataField',
            Value: Stock_Drop
        },
        {
            $Type: 'UI.DataField',
            Value: Seller_Code
        },
        {
            $Type: 'UI.DataField',
            Value: Consignee_Code
        },
        {
            $Type: 'UI.DataField',
            Value: POTransmission_Status
        },
        {
            $Type: 'UI.DataField',
            Value: TransmittedDestination
        },
        {
            $Type: 'UI.DataField',
            Value: SalesRoute_Code
        },
        {
            $Type: 'UI.DataField',
            Value: Supplier_Code
        },
        {
            $Type: 'UI.DataField',
            Value: SalesCurrency_Code
        },
        {
            $Type: 'UI.DataField',
            Value: OrderPriority_Id
        },
        {
            $Type: 'UI.DataField',
            Value: DestinationCityCode
        },
        {
            $Type: 'UI.DataField',
            Value: ShippingMethodCode
        },
    ],
    UI.FieldGroup #HeaderOrdeDetails1: {Data: [

        {
            $Type: 'UI.DataField',
            Value: PurchaseOrder
        },
        {
            $Type: 'UI.DataField',
            Value: CompanyCode
        },
        {
            $Type: 'UI.DataField',
            Value: BuyerGlobalLocationCode
        },
        {
            $Type: 'UI.DataField',
            Value: PurchasingOrg
        },
        {
            $Type: 'UI.DataField',
            Value: Vendor
        },
    ]},
    UI.FieldGroup #HeaderOrdeDetails2: {Data: [
        {
            $Type: 'UI.DataField',
            Value: VendorName
        },
        {
            $Type: 'UI.DataField',
            Value: Supplier_Code
        },
        {
            $Type: 'UI.DataField',
            Value: POCreationDate
        },
        {
            $Type: 'UI.DataField',
            Value: PoTransmissionDate
        },
        {
            $Type: 'UI.DataField',
            Value: POTransmission_Status
        },
        {
            $Type: 'UI.DataField',
            Value: Stock_Drop
        }
    ]},
    UI.HeaderFacets                  : [

        {

            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#HeaderOrdeDetails1',
            ID    : 'reffac1'

        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#HeaderOrdeDetails2',
            ID    : 'reffac2'

        },
    ],

    UI.Facets                        : [

    {
        $Type : 'UI.ReferenceFacet',
        Label : '{i18n>Purchase Order Detail}',
        Target: 'A_PurchaseOrderItem/@UI.LineItem#refitems',
        ID    : 'ItemId'
    }]
);

annotate PO_Dashboard.Get_PO_PurchaseOrderDetail with {
    Item             @title    : '{i18n>Item}';
    Material_No      @title    : '{i18n>Material_No}';
    Plant            @title    : '{i18n>Plant}';
    Storage_Location @title    : '{i18n>Storage_Location}';
    PO_Quantity      @title    : '{i18n>PO_Quantity}';
    Order_Unit_UOM   @title    : '{i18n>Order_Unit_UOM}';
    Unit_Price       @title    : '{i18n>Unit_Price}';
    Net_Price        @title    : '{i18n>Net_Price}';
    PurchaseOrder    @title    : '{i18n>PurchasingDocNo}'
                     @UI.Hidden: true;
    RevisedPrice     @title    : '{i18n>RevisedPrice}';
}

annotate PO_Dashboard.Get_PO_PurchaseOrderDetail with @(

    UI.HeaderInfo        : {
        TypeName      : 'Purchase Order Detail',
        TypeNamePlural: 'PO Material',
    },
    UI.LineItem #refitems: [
        {
            $Type: 'UI.DataField',
            Value: Item

        },
        {
            $Type: 'UI.DataField',
            Value: Material_No
        },
        {
            $Type: 'UI.DataField',
            Value: Plant
        },
        {
            $Type: 'UI.DataField',
            Value: Storage_Location
        },
        {
            $Type: 'UI.DataField',
            Value: PO_Quantity
        },
        {
            $Type: 'UI.DataField',
            Value: Order_Unit_UOM
        },
        {
            $Type: 'UI.DataField',
            Value: Unit_Price
        },
        {
            $Type: 'UI.DataField',
            Value: Net_Price
        },
        {
            $Type: 'UI.DataField',
            Value: RevisedPrice
        }

    ],


);
