using BTP.Panasonic as BTP from '../db/data-model';

service  EdifactMesssage @(path: '/factoryint/edifact-message'){

    entity Edifact_Header             as projection on BTP.Edifact_Header;
    entity PO_List                    as projection on BTP.PO_List;
    

}