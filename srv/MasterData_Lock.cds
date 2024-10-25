using BTP.Panasonic as BTP from '../db/data-model';

service MasterDataLock @(impl: './MasterDataLock/MasterData_Lock.js') @(path: '/factoryint/MasterData_Lock') {
    entity Master_Lock as projection on BTP.Master_Lock;
    function UpdateMasterDataLock(Table_Name : String, Lock_Status : Boolean, UserID : String) returns String;
}
