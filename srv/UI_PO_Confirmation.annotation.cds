using UI_PO_Confirmation from './UI_PO_Confirmation';

annotate UI_PO_Confirmation.Get_Purchase_Order_Confirmations_List with {
    PurchaseOrder               @title           : '{i18n>PurchasingDocNo}';
    PurchaseOrderItem           @title           : '{i18n>POline_item}'
                                @UI.HiddenFilter : true;
    ConfirmationReceive_Date    @title           : '{i18n>ConfirmationReceive_Date}';
    POConfirmation_Date         @title           : '{i18n>PO_Confirmation_Date}';
    Confirmation_Status         @title           : '{i18n>Confirmation_Status}';
    Material                    @title           : '{i18n>Material}'
                                @UI.HiddenFilter : true;
    Material_Description        @title           : '{i18n>Material_Description}'
                                @UI.HiddenFilter : true;
    POCreation_Date             @title           : '{i18n>POCreation_Date}';
    ETD                         @title           : '{i18n>ETD}';
    ETA                         @title           : '{i18n>ETA}';
    FactroryRefrence_Number     @title           : '{i18n>FactroryRefrence_Number}'
                                @UI.HiddenFilter : true;
    ConfirmQuantity             @title           : '{i18n>ConfirmQuantity}'
                                @UI.HiddenFilter : true;
    Price                       @title           : '{i18n>Price}'
                                @UI.HiddenFilter : true;
    MethodofShipment            @title           : '{i18n>MethodofShipment}'
                                @UI.HiddenFilter : true;
    CompanyCode                 @title           : '{i18n>CompanyCode}';
    PurchasingOrg_P001          @title           : '{i18n>PurchasingOrg_P001}';
    BuyerGlobalCode             @title           : '{i18n>BuyerGlobalCode}';
    Vendor                      @title           : '{i18n>Vendor}';
    Vendor_Name                 @title           : '{i18n>VendorName}';
    ConfirmationProcessing_Logs @title           : '{i18n>ConfirmationProcessing_Logs}'
                                @UI.HiddenFilter : true;
    Destination_Code            @title           : '{i18n>Destination_Code}'
                                @UI.HiddenFilter : true;
    Sender_System               @title           : '{i18n>Sender_System}';
    Receiving_System            @title           : '{i18n>Receiving_System}';
    PoTransmissionDate          @title           : '{i18n>PoTransmissionDate}';
    ReasonCode                   @title           : '{i18n>RCode}'; 
    Revision_No                   @title           : '{i18n>RNum}';
}

annotate UI_PO_Confirmation.Get_Purchase_Order_Confirmations_List with @(
    sap.searchable         : false,
    UI.PresentationVariant : {
        $Type          : 'UI.PresentationVariantType',
        RequestAtLeast : [PurchaseOrder],
    },
    UI.HeaderInfo          : {
        TypeName       : 'Purchase_Order_Confirmations_List',
        TypeNamePlural : 'PO List',
    
    },
    UI.SelectionFields     : [
        PurchaseOrder,
        CompanyCode,
        PurchasingOrg_P001,
        BuyerGlobalCode,
        ConfirmationReceive_Date,
        Confirmation_Status,
        Vendor,
        Vendor_Name,
        POCreation_Date,
        POConfirmation_Date,
        Sender_System,
        ETD,
        ETA
    ],
    UI.PresentationVariant            : {
        SortOrder : [
        {
        $Type      : 'Common.SortOrderType',
        Property   : 'PurchaseOrder',
        Descending : false
        },
        {
        $Type      : 'Common.SortOrderType',
        Property   : 'Revision_No',
        Descending : false
        }
    ]},

    UI.LineItem            : [
        {
            $Type : 'UI.DataField',
            Value : PurchaseOrderItem
        },
        {
            $Type : 'UI.DataField',
            Value :  Revision_No        
        },                          // Nithya Added Revision No for Defect 142 on 21/12
        {
            $Type : 'UI.DataField',
            Value : ConfirmationReceive_Date
        },
        {
            $Type : 'UI.DataField',
            Value : Confirmation_Status
        },
        {
            $Type : 'UI.DataField',
            Value : Material
        },
       
        {
            $Type : 'UI.DataField',
            Value : ETD
        },
        {
            $Type : 'UI.DataField',
            Value : ETA
        },
        {
            $Type : 'UI.DataField',
            Value : FactroryRefrence_Number
        },
        //@gnaneshwar -31-05-24 for position change
        {
            $Type : 'UI.DataField',
            Value : Material_Description
        },
        {
            $Type : 'UI.DataField',
            Value : POCreation_Date
        },
        {
            $Type : 'UI.DataField',
            Value : ConfirmQuantity
        },
        {
            $Type : 'UI.DataField',
            Value : Price
        },
        {
            $Type : 'UI.DataField',
            Value : MethodofShipment
        },
        {
            $Type : 'UI.DataField',
            Value : CompanyCode
        },
        {
            $Type : 'UI.DataField',
            Value : PurchasingOrg_P001
        },
        {
            $Type : 'UI.DataField',
            Value : BuyerGlobalCode
        },
        {
            $Type : 'UI.DataField',
            Value : Vendor
        },
        {
            $Type : 'UI.DataField',
            Value : Vendor_Name
        },
        {
            $Type : 'UI.DataField',
            Value : Destination_Code
        },
        {
            $Type : 'UI.DataField',    // Preethi changed on 19/12 for defect 142 
            Value : ReasonCode
        },
        {
            $Type : 'UI.DataField',
            Value : PurchaseOrder
        }
    ]
);
