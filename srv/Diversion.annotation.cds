using Diversion from './Diversion';

annotate Diversion.Get_Diversion with {
    
    Po_Old               @title : '{i18n>Po_Old}';
    PoItem_Old           @title : '{i18n>PoItem_Old}';
    Po_New               @title : '{i18n>Po_New}';
    PoItem_New           @title : '{i18n>PoItem_New}';
    ModeOfTransportation @title : '{i18n>ModeOfTransportation}';
    Material_Number      @title : '{i18n>Material_Number}';
    comment              @title : '{i18n>comment}';
    IsDelete             @title : '{i18n>IsDelete}';
    created_Date         @title :  '{i18n>created_Date}';
};

annotate Diversion.Get_Diversion with @(
    sap.searchable                    : false,
    UI.PresentationVariant            : {
        $Type          : 'UI.PresentationVariantType',
    },
    UI.HeaderInfo                     : {
        TypeName       : 'Diversion',
        TypeNamePlural : 'PO List',

    },
    UI.SelectionFields                : [
        Po_Old,
        PoItem_Old,
        Po_New,
        PoItem_New,
        Material_Number,
        created_Date
    ],
    
    UI.LineItem                  : [
        {
            $Type : 'UI.DataField',
            Value : Po_Old
        },
        {
            $Type : 'UI.DataField',
            Value : PoItem_Old
        },
        {
            $Type : 'UI.DataField',
            Value : Po_New
        },
        {
            $Type : 'UI.DataField',
            Value : PoItem_New
        },
        {
            $Type : 'UI.DataField',
            Value : Material_Number
        },
        {
            $Type : 'UI.DataField',
            Value : created_Date
        }
    ]
);
