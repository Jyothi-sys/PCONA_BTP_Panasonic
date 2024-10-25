using BTP.Panasonic as BTP from '../db/data-model';


service componentspo_Srv @(impl: './Components/component-srv.js') @(path: '/ComponentsSrv') {
    entity zjda_ship_plan as projection on BTP.zjda_ship_plan;
    entity zjda_shipplan_sel_criterion as projection on BTP.zjda_shipplan_sel_criterion;
    function po_create() returns String;
    entity Environment                   as projection on BTP.Environment;
    action po_create_final(ship_plan_received_from: Integer,
    ship_plan_received_to: Integer,
    itemtype: String,
    ship_plan_source: String,
    shipdate_from: Integer,
    shipdate_to: Integer,
    supplyType: String,
    material: String,
    salesorder: String,
    salesorderline: String,
    purchasing_org: String,
    purchasing_group: String,
    plant: String,
    vendor_i_e_indicator: String,
    vendor: String, 
    sub_con_vendor: String) returns String;

      action status (
        counter: Integer,
        matnr: String, 
        salesord: String, 
        salesordline: String, 
        status: String
    ) returns String;
    
    // function getstatus(counter: Integer,matnr: String,salesord: String,salesordline: String) returns String;

      function cpi_srv(ship_plan_received_from:Integer,ship_plan_received_to:Integer,itemtype:String,ship_plan_source:String,shipdate_from:Integer,shipdate_to:Integer,supplyType:String,material:String,salesorder:String,salesorderline:String,purchasing_org:String,purchasing_group:String,plant:String,vendor_i_e_indicator:String,vendor:String,sub_con_vendor:String) returns String;
    function jdashipplan_records() returns array of zjda_ship_plan;
    function sel_create(ship_plan_received_from:Integer,ship_plan_received_to:Integer,itemtype: String,ship_plan_source: String,shipdate_from: Integer, shipdate_to: Integer,supplyType: String,material: String,salesorder: String,salesorderline: String,purchasing_org: String,purchasing_group: String,plant: String,vendor_i_e_indicator: String,vendor: String, sub_con_vendor: String) returns String;
}

service zipcode_Srv @(impl: './Zipcode/zipcode-srv.js') @(path: '/ZipcodeSrv') {

    function zipcode(purchasegroup: String)  returns array of String;
    function fifo(purchase: String,order: String,ibdnum: String,lineid: String) returns String;
    function shipment(id_num: Integer,bol_number: String) returns String;
}

service btpinvoice_Srv @(impl: './BTPInvoice/btpinvoice-srv.js') @(path: '/factoryint/BTPInvoiceSrv') {
    
    function zbtp_invoice(folderno: String,housebolno: String,invoiceno: String,invoicelineno: String,Serviceticketno: String) returns String;
    
}


