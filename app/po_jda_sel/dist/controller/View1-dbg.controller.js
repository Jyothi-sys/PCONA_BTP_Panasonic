 ;
sap.ui.define([

    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,JSONModel,MessageBox) {
        var thisObj;
        var sNumber1 = "";
        "use strict";

        return Controller.extend("pojdasel.controller.View1", {
            onInit: function () {
                that = this;

                // var oView = this.getView();
                // var oModel = new sap.ui.model.json.JSONModel();
                // oView.byId("SimpleForm").setModel(oModel, "tableModel");
            },

            
            onGo : function(){
                 var oModel1 = this.getOwnerComponent().getModel("componentsPOModel");

                var sShip_Plan_Received_From = this.getView().byId("id_shipplanreqfrom").getValue();
                var sShip_Plan_Received_To = this.getView().byId("id_shipplanreqto").getValue();
                var sItem_Type = this.getView().byId("I3").getValue();
                var sShip_Plan_Source = this.getView().byId("I4").getValue();
                var sShip_Date_From = this.getView().byId("id_shipdatefrom").getValue();
                var sShip_Date_To = this.getView().byId("id_shipdateto").getValue();
                var sMaterial = this.getView().byId("I7").getValue();
                var sSalesOrder= this.getView().byId("I8").getValue();
                var sSales_Order_Line= this.getView().byId("I9").getValue();
                var ssPurchasing_Org = this.getView().byId("I10").getValue();
                var sPurchasing_Group = this.getView().byId("I11").getValue();
                var sPlant = this.getView().byId("I12").getValue();
                var sVendor_i_e_indicator = this.getView().byId("I13").getValue();
                var sVendor = this.getView().byId("I14").getValue();
                var sSubConVendor = this.getView().byId("I15").getValue();
               
                var sEmail = this.getView().byId("I16").getValue();
              that.string1 =  '/sel_create(ship_plan_received_from='+"'"+sShip_Plan_Received_From+"'"+',ship_plan_received_to='+"'"+sShip_Plan_Received_To+"'"+',itemtype='+"'"+sItem_Type+"'"+',ship_plan_source='+"'"+sShip_Plan_Source+"'"+',shipdate_from='+"'"+sShip_Date_From+"'"+',shipdate_to='+"'"+sShip_Date_To+"'"+',material='+"'"+sMaterial+"'"+',salesorder='+"'"+sSalesOrder+"'"+',salesorderline='+"'"+sSales_Order_Line+"'"+',purchasing_org='+"'"+ssPurchasing_Org+"'"+',purchasing_group='+"'"+sPurchasing_Group+"'"+',plant='+"'"+sPlant+"'"+',vendor_i_e_indicator='+"'"+sVendor_i_e_indicator+"'"+',vendor='+"'"+sVendor+"'"+',email='+"'"+sEmail+"'"+')'

              if (sShip_Plan_Received_From === "" || sShip_Plan_Received_To === "" || 
                sShip_Date_From === "" || sShip_Date_To === "" || ssPurchasing_Org === "" ||
                sPurchasing_Group === "" || sPlant === "" || sVendor_i_e_indicator === "") {

                MessageBox.warning("Please Fill Mandatory Fields")}

                else{
              oModel1.callFunction("/sel_create", {

                method: "GET",

               urlParameters: {
                    "ship_plan_received_from": sShip_Plan_Received_From,
                    "ship_plan_received_to": sShip_Plan_Received_To,
                    "itemtype": sItem_Type,
                    "ship_plan_source": sShip_Plan_Source,
                    "shipdate_from": sShip_Date_From,
                    "shipdate_to": sShip_Date_To,
                    "material": sMaterial,
                    "salesorder": sSalesOrder,
                    "salesorderline": sSales_Order_Line,
                    "purchasing_org": ssPurchasing_Org,
                    "purchasing_group": sPurchasing_Group,
                    "plant": sPlant,
                    "vendor_i_e_indicator": sVendor_i_e_indicator,
                    "vendor": sVendor,
                    "sub_con_vendor": sSubConVendor,
                    "email": sEmail,
                  },
                success: function (oData) {
                    MessageBox.success("Record Inserted Successfully ");
                }.bind(this),
                error: function (oErrror) {
                    MessageBox.error("Error while passing the data");
                    console.log(oErrror)
                }

            });
        }
        
               
                // oModel1.callFunction(that.string1,{
                //     method : "GET",
                //     url
                //     success: function (response) {
                //         MessageBox.success("Record Created Successfully ");
                       
                //     },
                //     error: function (error) {
                //      MessageBox.error("Error while creating the data");
                //     }
                // });

                // oModel1.read(that.string1,{
                       
                //         success: function (response) {
                //             MessageBox.success("Record Created Successfully ");
                           
                //         },
                //         error: function (error) {
                //             MessageBox.error("Error While Creating Data");
                //         }
                //     });

            },
            handleinput:function(oEvent)
        {
            thisObj = this;
			var myInteger = /^[0-9]*$/;
			var value = this.getView().byId("id_shipdatefrom").getValue();
			if (value.match(myInteger)) {
				sNumber1 = value;
			} else {
				oEvent.getSource().setValue(sNumber1);
			}
        },
        handleinput1:function(oEvent)
        {
            thisObj = this;
			var myInteger = /^[0-9]*$/;
			var value = this.getView().byId("id_shipdateto").getValue();
			if (value.match(myInteger)) {
				sNumber1 = value;
			} else {
				oEvent.getSource().setValue(sNumber1);
			}
        }
        });
    });
