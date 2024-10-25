using MNET_Dashboard from './MNET_Dashboard';


annotate MNET_Dashboard.GET_MNET_Data_List_Hdr with {
    importShipmentNumber @title    : '{i18n>Folder_No}';
    BillofLading        @title    : '{i18n>BillofLanding}';
    CompanyCode          @title    : '{i18n>CompanyCode}';
    GlobalCompanyCode    @title    : '{i18n>GlobalCompanyCode}';
    MethodofShipment     @title    : '{i18n>MethodofShipment}';
    initialDestination   @title    : '{i18n>Destinationcode}';
    SupplierInvoice      @title    : '{i18n>SupplierInvoice}';
    status               @title    : '{i18n>Status}';
    Action               @title    : '{i18n>ACT_IdMnet}';
    Received_Date        @title    : '{i18n>Received_Date}';
    ETA                  @title    : '{i18n>ETAMnet}';
    ProcessDate          @title    : '{i18n>ProcessDate}';
    MPro_Date            @title    : '{i18n>MPro_Date}';
    PurchaseOrder       @title    : '{i18n>PurchasingOrder}';
    houseBOLNumber_ID    @title    : '{i18n>houseBOLNumber_ID}';
    FileName             @title     : '{i18n>File_Name}';
    
}

annotate MNET_Dashboard.GET_MNET_Data_List_Hdr with @(
    sap.searchable        : false,
    UI.HeaderInfo         : {
        TypeName      : 'Invoice Data List',
        TypeNamePlural: 'Invoice Data List',
    },
    UI.SelectionFields    : [
        importShipmentNumber,
        BillofLading,
        CompanyCode,
        GlobalCompanyCode,
        // MPro_Date,
        ProcessDate,
    ],

    UI.PresentationVariant            : {SortOrder : [{
        $Type      : 'Common.SortOrderType',
        Property   : 'ProcessDate',
        Descending : true
    }]},


    UI.LineItem           : [
        {
            $Type: 'UI.DataField',
            Value: importShipmentNumber
        },
        {
            $Type: 'UI.DataField',
            Value: BillofLading
        }, 
        {
            $Type: 'UI.DataField',
            Value: SupplierInvoice
        },
        {
            $Type: 'UI.DataField',
            Value: status
        },
        {
            $Type: 'UI.DataField',
            Value: Action
        },
        {
            $Type: 'UI.DataField',
            Value: Received_Date
        },
        {
            $Type: 'UI.DataField',
            Value: ETA
        },
        {
            $Type: 'UI.DataField',
            Value: ProcessDate
        },
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
            Value: GlobalCompanyCode
        },
        {
            $Type: 'UI.DataField',
            Value: MethodofShipment
        },
        {
            $Type: 'UI.DataField',
            Value: initialDestination
        },
        {
            $Type : 'UI.DataField',
            Value :  FileName        
        },
        
    ],
);
