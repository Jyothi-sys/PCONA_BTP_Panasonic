var that;
jQuery.sap.require("pojdashipplan.util.Formatter");
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    'sap/m/Token',
    "sap/ui/core/date/UI5Date",
    "sap/m/MessageBox",
    'sap/ui/model/Sorter',
    'sap/ui/core/util/Export',
    'sap/ui/export/Spreadsheet',
    'sap/ui/core/util/ExportTypeCSV',
    "sap/m/BusyDialog",
    '../util/Formatter'

], function (Controller, Fragment, jsonModel, Filter, FilterOperator, MessageToast, Token, UI5Date, MessageBox, Sorter, Export, Spreadsheet, ExportTypeCSV, BusyDialog, Formatter) {
    "use strict";

    return Controller.extend("pojdashipplan.controller.View1", {
        Formatter: Formatter,
        onInit: function (oRetrievedResult) {

            // initialization of required global variables
            that = this;
            that.filteredData;
            that.busy = new BusyDialog();
            // setting default date as soon as user logs in
            this.setMaxDateforDateRange();
            // setting default Plant code
            // this.getView().byId("id_Plant").addToken(new Token({
            //     text: "14DM"
            // }));
            var oView = this.getView();
            var oModel = new sap.ui.model.json.JSONModel();
            // oView.byId("Table").setModel(oModel, "tableModel");
            var omod = {
                "colVisible1": true, "colVisible2": true, "colVisible3": true,
                "colVisible4": true, "colVisible5": true, "colVisible6": true,
                "colVisible7": true, "colVisible8": true, "colVisible9": true,
                "colVisible10": true, "colVisible11": true, "colVisible12": true, "colVisible13": true,
                "colVisible14": true, "colVisible15": true, "colVisible16": true, "colVisible17": true,
                "colVisible18": true, "colVisible19": true,
            }
            var json2 = new jsonModel(omod);

            this.getView().setModel(json2, "columnModel");
            this.pivsReadCall();
            this.oFilterBar = this.getView().byId("filterbar");

            //=========================================================            

        },

        pivsReadCall: function () {
            var oModel1 = this.getOwnerComponent().getModel("SalesSrv_global_model");
            that.busy.open()
            oModel1.read("/jdashipplan_records",
                {
                    success: function (oRetrievedResult) {
                        for (var i = 0; i < oRetrievedResult.results.length; i++) {
                            var myDate = new Date(oRetrievedResult.results[i].proc_date);
                            var myDate1 = new Date(oRetrievedResult.results[i].shipdate);
                            var myDate2 = new Date(oRetrievedResult.results[i].sardate);
                            // added by Preethi on 31/10/2023
                            var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                                pattern: "MM-dd-yyyy",
                                UTC: true
                            });
                            oRetrievedResult.results[i].proc_date = oDateFormat.format(new Date(myDate));
                            oRetrievedResult.results[i].shipdate = oDateFormat.format(new Date(myDate1));
                            oRetrievedResult.results[i].sardate = oDateFormat.format(new Date(myDate2));
                            // oRetrievedResult.results[i].proc_date = myDate.toLocaleDateString().replaceAll("/", "-");
                            // oRetrievedResult.results[i].shipdate = myDate1.toLocaleDateString().replaceAll("/", "-");
                        }
                        that.oTable = that.getView().byId("Table");
                        var oData1 = new sap.ui.model.json.JSONModel(oRetrievedResult.results);

                        that.getView().setModel(oRetrievedResult.results, "globalMainData")
                        // that.getView().setModel(oData1,"globalMainData")
                        that.getView().setModel(oData1, "tableModel");
                        that.getView().byId("hdtxt").setProperty("text", "ComponentPOStatus(" + oRetrievedResult.results.length + ")")
                        //that.oTable.setModel(oData1,"tableModel"); 
                        that.busy.close()
                    },
                    error: function (oError) {
                        that.busy.close()
                    },

                });
        },

        // setMaxDateforDateRange: function (oEvent) {
        //     var date = new Date();
        //     var day = date.setDate(date.getDate() - 1);
        //     day = new Date(day).getDate();
        //     day = day.toString().padStart(2, '0');
        //     var month = date.getMonth() + 1;
        //     month = month.toString().padStart(2, '0');
        //     var year = date.getFullYear().toString();
        //     that.completeDate = month + '-' + day + '-' + year;
        //     const dateObject = new Date(year, month - 1, day);
        //     var oDatePicker = this.getView().byId("id_datePicker1");
        //     // Set the value and disable future dates
        //     //oDatePicker.setValue(that.completeDate);
        //     oDatePicker.setMaxDate(dateObject);
        // },



        /* To enable all the future dates in the UI App, we changed this code
        Date: 11-06-2024
        Author: Jyothi*/ 
        
        setMaxDateforDateRange: function (oEvent) {
            var date = new Date();
            var day = date.setDate(date.getDate());
            day = new Date(day).getDate();
            day = day.toString().padStart(2, '0');
            var month = date.getMonth() + 1;
            month = month.toString().padStart(2, '0');
            var year = date.getFullYear().toString();
            that.completeDate = month + '-' + day + '-' + year;
         
            var oDatePicker = this.getView().byId("id_datePicker1");
            // Set the value
            // oDatePicker.setValue(this.completeDate);
            // Do not set max date to disable future dates
            // oDatePicker.setMaxDate(dateObject);
        },

        handleChangeDate: function (oEvent) {

            that.startDate = oEvent.mParameters.value.substr(0, 10);
            that.endDate = oEvent.mParameters.value.substr(13, 20);

        },
        handleChangeShipDate: function (oEvent) {

            that.startShipDate = oEvent.mParameters.value.substr(0, 10);
            that.endShipDate = oEvent.mParameters.value.substr(13, 20);

        },


        //=================
        // Fragments starts here           

        onOpenTimeFragment: function (oEvent) {
            if (this.oTimeFrag) {
                this.oTimeFrag = undefined;
            }
            if (!this.oTimeFrag) {
                that.busy.open()
                this.oTimeFrag = sap.ui.xmlfragment("pojdashipplan.Fragments.time", this);
                this.getView().addDependent(that.oTimeFrag);
                var data1 = that.getView().getModel("globalMainData")

                var lookup = {};
                var items = data1;
                var result = [];

                for (var item, i = 0; item = items[i++];) {
                    var name = item.time;

                    if (!(name in lookup)) {
                        lookup[name] = 1;
                        result.push({ "time": name });
                    }
                }

                var oTimeModel = new jsonModel(result);
                this.getView().setModel(oTimeModel, "timeGlobalData")
                this.oTimeFrag.setModel(oTimeModel, "timeData");
            }
            that.busy.close()
            this.oTimeFrag.open();

        },

        //plant selected tokens
        // onSelectionTime: function (oEvent) {
        //     var aContexts = oEvent.getParameter("selectedContexts");
        //     var oMultiInput = this.getView().byId("id_Time");
        //     var oSelectedContextP = [];
        //     var oModel = that.getView().getModel("timeGlobalData");
        //     for (var i = 0; i < aContexts.length; i++) {
        //         oSelectedContextP.push(aContexts[i]);
        //     }
        //     var oTimeModel = [];
        //     //Check for Unique Data
        //     $.each(oSelectedContextP, function (i, el) {
        //         if ($.inArray(oSelectedContextP[i].ProductId, oTimeModel) === -1) oTimeModel.push(oSelectedContextP[i].getObject());
        //     });
        //     oModel.setProperty("/tokens2", oTimeModel);
        //     var oItemTemplateP;
        //     oItemTemplateP = oMultiInput.getTokens()[0];
        //     //Create the Template for token
        //     if (!oItemTemplateP) {
        //         oItemTemplateP = new Token({
        //             text: "{Time}",
        //             key: "{Time}"
        //         });
        //     } else {
        //         oItemTemplateP = oMultiInput.getTokens()[0].clone();
        //     }
        //     //Bind the tokens
        //     oTimeModel.forEach(function (item) {
        //         oMultiInput.addToken(new Token({
        //             text: item.Time
        //         }));
        //     })

        // },

        onOpenCounterFragment: function (oEvent) {
            if (this.oCounterFrag) {
                this.oCounterFrag = undefined;
            }
            if (!this.oCounterFrag) {
                that.busy.open()
                this.oCounterFrag = sap.ui.xmlfragment("pojdashipplan.Fragments.counter", this);
                this.getView().addDependent(that.oCounterFrag);
                var data1 = that.getView().getModel("globalMainData")

                var lookup = {};
                var items = data1;
                var result = [];

                for (var item, i = 0; item = items[i++];) {
                    var name = item.counter;

                    if (!(name in lookup)) {
                        lookup[name] = 1;
                        result.push({ "counter": name });
                    }
                }

                var oCounterModel = new jsonModel(result);
                this.getView().setModel(oCounterModel, "counterGlobalData")
                this.oCounterFrag.setModel(oCounterModel, "counterData");
            }
            that.busy.close()
            this.oCounterFrag.open();

        },

        //plant selected tokens
        onSelectionCounter: function (oEvent) {
            var aContexts = oEvent.getParameter("selectedContexts");
            var oMultiInput = this.getView().byId("id_Counter");
            var oSelectedContextP = [];
            var oModel = that.getView().getModel("counterGlobalData");
            for (var i = 0; i < aContexts.length; i++) {
                oSelectedContextP.push(aContexts[i]);
            }
            var oCounterModel = [];
            //Check for Unique Data
            $.each(oSelectedContextP, function (i, el) {
                if ($.inArray(oSelectedContextP[i].ProductId, oCounterModel) === -1) oCounterModel.push(oSelectedContextP[i].getObject());
            });
            oModel.setProperty("/tokens3", oCounterModel);
            var oItemTemplateP;
            oItemTemplateP = oMultiInput.getTokens()[0];
            //Create the Template for token
            if (!oItemTemplateP) {
                oItemTemplateP = new Token({
                    text: "{counter}",
                    key: "{counter}"
                });
            } else {
                oItemTemplateP = oMultiInput.getTokens()[0].clone();
            }
            //Bind the tokens
            oCounterModel.forEach(function (item) {
                oMultiInput.addToken(new Token({
                    text: item.counter
                }));
            })

        },

        onOpenMaterialFragment: function (oEvent) {
            if (this.oMaterialFrag) {
                this.oMaterialFrag = undefined;
            }
            if (!this.oMaterialFrag) {
                that.busy.open()
                this.oMaterialFrag = sap.ui.xmlfragment("pojdashipplan.Fragments.material", that);
                this.getView().addDependent(that.oMaterialFrag);
                var materialData = that.getView().getModel("globalMainData")

                var lookup = {};
                var items = materialData;
                var result = [];

                for (var item, i = 0; item = items[i++];) {
                    var name = item.matnr;

                    if (!(name in lookup)) {
                        lookup[name] = 1;
                        result.push({ "matnr": name });
                    }
                }


                var oMaterialModel = new jsonModel(result);
                this.getView().setModel(oMaterialModel, "materialGlobalData")
                this.oMaterialFrag.setModel(oMaterialModel, "materialData");

            }
            that.busy.close()
            this.oMaterialFrag.open();

        },

        // handleChangeStatus: function(oEvent) {

        //      var oValidatedComboBox = oEvent.getSource();
        //      that.statusKey = oValidatedComboBox.getSelectedKey();
        //      var sValue = oValidatedComboBox._getSelectedItemText();

        //   },

        //   handleChangeIndicator: function(oEvent) {

        //     var oValidatedComboBox = oEvent.getSource();
        //     that.indicatorKey = oValidatedComboBox.getSelectedKey();
        //     var sindicatorValue = oValidatedComboBox._getSelectedItemText();

        //  },

        // selected material
        onSelectionMaterial: function (oEvent) {
            this.getView().byId("id_Material").setTokens([]);
            that.oMaterialModel = [];
            var aContexts = oEvent.getParameter("selectedContexts");
            var oMultiInput = this.getView().byId("id_Material");
            var oSelectedContextM = [];
            var oModel = this.getView().getModel("materialGlobalData");
            for (var i = 0; i < aContexts.length; i++) {
                oSelectedContextM.push(aContexts[i]);
            }
            that.oMaterialModel = [];
            //Check for Unique Data
            $.each(oSelectedContextM, function (i, el) {
                if ($.inArray(oSelectedContextM[i].ProductId, that.oMaterialModel) === -1) that.oMaterialModel.push(oSelectedContextM[i].getObject());
            });
            oModel.setProperty("/tokens4", that.oMaterialModel);
            var oItemTemplateMat;
            oItemTemplateMat = oMultiInput.getTokens()[0];
            //Create the Template for token
            if (!oItemTemplateMat) {
                oItemTemplateMat = new Token({
                    text: "{matnr}",     //changed to matnr Gnaneshwar
                    key: "{matnr}"         //changed to matnr Gnaneshwar
                });
            } else {
                oItemTemplateMat = oMultiInput.getTokens()[0].clone();
            }
            //Bind the tokens
            that.oMaterialModel.forEach(function (item) {
                oMultiInput.addToken(new Token({
                    text: item.matnr   //changed to matnr Gnaneshwar
                }));
            })

        },

        // onOpenShipFragment: function (oEvent) {
        //     if (this.oShipDateFrag) {
        //         this.oShipDateFrag = undefined;
        //     }
        //     if (!this.oShipDateFrag) {
        //         that.busy.open()
        //         this.oShipDateFrag = sap.ui.xmlfragment("pojdashipplan.Fragments.shipdate", that);
        //         this.getView().addDependent(that.oShipDateFrag);
        //         var shipDateData = that.getView().getModel("globalMainData")

        //         var lookup = {};
        //         var items = shipDateData;
        //         var result = [];

        //         for (var item, i = 0; item = items[i++];) {
        //             var name = item.shipdate;

        //             if (!(name in lookup)) {
        //                 lookup[name] = 1;
        //                 result.push({ "shipdate": name });
        //             }
        //         }
        //         var oShipDateModel = new jsonModel(result);
        //         this.getView().setModel(oShipDateModel, "shipDateGlobalData")
        //         this.oShipDateFrag.setModel(oShipDateModel, "shipDateData");
        //     }
        //     that.busy.close()
        //     this.oShipDateFrag.open();
        // },

        // selected shipdate Group
        // onSelectionShipDate: function (oEvent) {
        //     var aContexts = oEvent.getParameter("selectedContexts");
        //     var oMultiInput = this.getView().byId("id_Ship");
        //     var oSelectedContextMG = [];
        //     var oModel = this.getView().getModel("shipDataGlobalData");
        //     for (var i = 0; i < aContexts.length; i++) {
        //         oSelectedContextMG.push(aContexts[i]);
        //     }
        //     var oShipDateModel = [];
        //     //Check for Unique Data
        //     $.each(oSelectedContextMG, function (i, el) {
        //         if ($.inArray(oSelectedContextMG[i].ProductId, oShipDateModel) === -1) oShipDateModel.push(oSelectedContextMG[i].getObject());
        //     });
        //     oModel.setProperty("/tokens5", oShipDateModel);
        //     var oItemTemplateMG;
        //     oItemTemplateMG = oMultiInput.getTokens()[0];
        //     //Create the Template for token
        //     if (!oItemTemplateMG) {
        //         oItemTemplateMG = new Token({
        //             text: "{shipdate}",
        //             key: "{shipdate}"
        //         });
        //     } else {
        //         oItemTemplateMG = oMultiInput.getTokens()[0].clone();
        //     }
        //     //Bind the tokens
        //     oShipDateModel.forEach(function (item) {
        //         oMultiInput.addToken(new Token({
        //             text: item.shipdate
        //         }));
        //     })
        // },

        // onOpenSarFragment: function (oEvent) {
        //     if (this.oSarrDateFrag) {
        //         this.oSarrDateFrag = undefined;
        //     }
        //     if (!this.oSarrDateFrag) {
        //         that.busy.open()
        //         this.oSarrDateFrag = sap.ui.xmlfragment("pojdashipplan.Fragments.sarrdate", that);
        //         this.getView().addDependent(that.oSarrDateFrag);
        //         var sarrDateData = that.getView().getModel("globalMainData")

        //         var lookup = {};
        //         var items = sarrDateData;
        //         var result = [];

        //         for (var item, i = 0; item = items[i++];) {
        //             var name = item.sardate;

        //             if (!(name in lookup)) {
        //                 lookup[name] = 1;
        //                 result.push({ "sardate": name });
        //             }
        //         }
        //         var oSarrDateModel = new jsonModel(result);
        //         this.getView().setModel(oSarrDateModel, "sarrDateGlobalData")
        //         this.oSarrDateFrag.setModel(oSarrDateModel, "sarrDateData");
        //     }
        //     that.busy.close()
        //     this.oSarrDateFrag.open();
        // },

        // selected shipdate Group
        // onSelectionSarrDate: function (oEvent) {
        //     var aContexts = oEvent.getParameter("selectedContexts");
        //     var oMultiInput = this.getView().byId("id_Sarr");
        //     var oSelectedContextMG = [];
        //     var oModel = this.getView().getModel("sarrDataGlobalData");
        //     for (var i = 0; i < aContexts.length; i++) {
        //         oSelectedContextMG.push(aContexts[i]);
        //     }
        //     var oSarrDateModel = [];
        //     //Check for Unique Data
        //     $.each(oSelectedContextMG, function (i, el) {
        //         if ($.inArray(oSelectedContextMG[i].ProductId, oSarrDateModel) === -1) oSarrDateModel.push(oSelectedContextMG[i].getObject());
        //     });
        //     oModel.setProperty("/tokens6", oSarrDateModel);
        //     var oItemTemplateMG;
        //     oItemTemplateMG = oMultiInput.getTokens()[0];
        //     //Create the Template for token
        //     if (!oItemTemplateMG) {
        //         oItemTemplateMG = new Token({
        //             text: "{sarrdate}",
        //             key: "{sarrdate}"
        //         });
        //     } else {
        //         oItemTemplateMG = oMultiInput.getTokens()[0].clone();
        //     }
        //     //Bind the tokens
        //     oSarrDateModel.forEach(function (item) {
        //         oMultiInput.addToken(new Token({
        //             text: item.sarrdate
        //         }));
        //     })
        // },

        // onOpenSourceFragment: function (oEvent) {
        //     if (this.oSourceFrag) {
        //         this.oSourceFrag = undefined;
        //     }
        //     if (!this.oSourceFrag) {
        //         that.busy.open()
        //         this.oSourceFrag = sap.ui.xmlfragment("pojdashipplan.Fragments.jdasource", that);
        //         this.getView().addDependent(that.oSourceFrag);
        //         var sourceData = that.getView().getModel("globalMainData")

        //         var lookup = {};
        //         var items = sourceData;
        //         var result = [];

        //         for (var item, i = 0; item = items[i++];) {
        //             var name = item.jdasource;

        //             if (!(name in lookup)) {
        //                 lookup[name] = 1;
        //                 result.push({ "jdasource": name });
        //             }
        //         }
        //         var oSourceModel = new jsonModel(result);
        //         this.getView().setModel(oSourceModel, "sourceGlobalData")
        //         this.oSourceFrag.setModel(oSourceModel, "sourceData");
        //     }
        //     that.busy.close()
        //     this.oSourceFrag.open();
        // },

        // selected shipdate Group
        // onSelectionSource: function (oEvent) {
        //     var aContexts = oEvent.getParameter("selectedContexts");
        //     var oMultiInput = this.getView().byId("id_Source");
        //     var oSelectedContextMG = [];
        //     var oModel = this.getView().getModel("sourceGlobalData");
        //     for (var i = 0; i < aContexts.length; i++) {
        //         oSelectedContextMG.push(aContexts[i]);
        //     }
        //     var oSourceModel = [];
        //     //Check for Unique Data
        //     $.each(oSelectedContextMG, function (i, el) {
        //         if ($.inArray(oSelectedContextMG[i].ProductId, oSourceModel) === -1) oSourceModel.push(oSelectedContextMG[i].getObject());
        //     });
        //     oModel.setProperty("/tokens7", oSourceModel);
        //     var oItemTemplateMG;
        //     oItemTemplateMG = oMultiInput.getTokens()[0];
        //     //Create the Template for token
        //     if (!oItemTemplateMG) {
        //         oItemTemplateMG = new Token({
        //             text: "{source}",
        //             key: "{source}"
        //         });
        //     } else {
        //         oItemTemplateMG = oMultiInput.getTokens()[0].clone();
        //     }
        //     //Bind the tokens
        //     oSourceModel.forEach(function (item) {
        //         oMultiInput.addToken(new Token({
        //             text: item.source
        //         }));
        //     })
        // }, 

        onSearchMaterial: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter("matnr", sap.ui.model.FilterOperator.Contains, sValue);
            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },
        onSearchCounter: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter("counter", sap.ui.model.FilterOperator.Contains, sValue);
            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },

        // onSearchSource: function (oEvent) {
        //     var sValue = oEvent.getParameter("value");
        //     var oFilter = new Filter("source", sap.ui.model.FilterOperator.Contains, sValue);
        //     var oBinding = oEvent.getParameter("itemsBinding");
        //     oBinding.filter([oFilter]);
        // },
        // onSearchSarrDate: function (oEvent) {
        //     var sValue = oEvent.getParameter("value");
        //     var oFilter = new Filter("sarrdate", sap.ui.model.FilterOperator.Contains, sValue);
        //     var oBinding = oEvent.getParameter("itemsBinding");
        //     oBinding.filter([oFilter]);
        // },
        onSearchShipDate: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter("shipdate", sap.ui.model.FilterOperator.Contains, sValue);
            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },
        // onSearchTime: function (oEvent) {
        //     var sValue = oEvent.getParameter("value");
        //     var oFilter = new Filter("Time", sap.ui.model.FilterOperator.Contains, sValue);
        //     var oBinding = oEvent.getParameter("itemsBinding");
        //     oBinding.filter([oFilter]);
        // },


        onDialogClose: function (oEvent) {
            if (this.oCounterFrag) {
                this.oCounterFrag = undefined;
                this.oCounterFrag = null
            }
            else if (this.oMaterialFrag) {
                this.oMaterialFrag = undefined;
                this.oMaterialFrag = null
            }
            else if (this.oTimeFrag) {
                this.oTimeFrag = undefined;
                this.oTimeFrag = null
            }
            else if (this.oSourceFrag) {
                this.oSourceFrag = undefined;
                this.oSourceFrag = null
            }
            else if (this.oSarrDateFrag) {
                this.oSarrDateFrag = undefined;
                this.oSarrDateFrag = null
            }
            else if (this.oShipDateFrag) {
                this.oShipFrag = undefined;
                this.oShipFrag = null
            }

        },

        onFilterChange: function (oEvent) {
            var aFilters = [];
            var sValue = oEvent.getParameter("value");
            var sPath = oEvent.getSource().getBindingContext().getPath();
            var sColumn = sPath.split("/").pop(); // Get the column name from the binding path
            if (sValue) {
                var oFilter = new sap.ui.model.Filter(sColumn, sap.ui.model.FilterOperator.Contains, sValue);
                aFilters.push(oFilter);
            }
            var oTable = this.byId("Table");
            var oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters, sap.ui.model.FilterType.Application);
        },
        // on click of Go button
        onGoToReport: function () {
            that.busy.open();
            var counterTokens = this.getView().byId("id_Counter").getTokens();
            that.sCounterValues = counterTokens.map(function (oToken) {
                return oToken.getText();
            }).join(",");

            // get all material tokens
            var materialTokens = this.getView().byId("id_Material").getTokens();
            that.sMaterialValues = materialTokens.map(function (oToken) {
                return oToken.getText();
            }).join(",");


            // var sourceTokens = this.getView().byId("id_Source").getTokens();
            // that.sSourceValues = sourceTokens.map(function (oToken) {
            //     return oToken.getText();
            // }).join(",");

            // var sarrTokens = this.getView().byId("id_Sarr").getTokens();
            // that.sSarrValues = sarrTokens.map(function (oToken) {
            //     return oToken.getText();
            // }).join(",");

            // var shipTokens = this.getView().byId("id_Ship").getTokens();
            // that.sShipValues = shipTokens.map(function (oToken) {
            //     return oToken.getText();
            // }).join(",");

            // var timeTokens = this.getView().byId("id_Time").getTokens();
            // that.sTimeValues = timeTokens.map(function (oToken) {
            //     return oToken.getText();
            // }).join(",");


            var filters = [];
            //  if (that.completeDate === undefined || that.completeDate.toString().includes("undefined")) {
            // if ((that.startDate === "" && that.endDate === "") || (that.startDate === undefined && that.endDate === undefined)) {
            //     MessageBox.warning("Please Select Mandatory Fields")
            //     that.busy.close()
            // } else {
            if (that.sMaterialValues !== "") {

                var matVal = that.sMaterialValues.split(",");
                if (matVal.length > 0) {
                    $.each(matVal, function (i, UIitem) {
                        filters.push(new sap.ui.model.Filter("matnr", sap.ui.model.FilterOperator.Contains, UIitem));// changed to matnr Gnaneshwar
                    });
                };
            }
            if (that.sCounterValues !== "") {
                var counterVal = that.sCounterValues.split(",");
                if (counterVal.length > 0) {
                    $.each(counterVal, function (i, UIitem) {
                        filters.push(new sap.ui.model.Filter("counter", sap.ui.model.FilterOperator.Contains, UIitem));
                    });
                };
            }
            // if (that.sSourceValues !== "") {
            //     var sourceVal = that.sSourceValues.split(",");
            //     if (sourceVal.length > 0) {
            //         $.each(sourceVal, function (i, UIitem) {
            //             filters.push(new sap.ui.model.Filter("source", sap.ui.model.FilterOperator.Contains, UIitem));
            //         });
            //     };
            // }

            // if (that.sSarrDateValues !== "") {
            //     var sarrVal = that.sSarrDateValues.split(",");
            //     if (sarrVal.length > 0) {
            //         $.each(sarrVal, function (i, UIitem) {
            //             filters.push(new sap.ui.model.Filter("sarrdate", sap.ui.model.FilterOperator.Contains, UIitem));
            //         });
            //     };
            // }

            // if (that.sShipValues !== "") {
            //     var shipVal = that.sShipValues.split(",");
            //     if (shipVal.length > 0) {
            //         $.each(shipVal, function (i, UIitem) {
            //             filters.push(new sap.ui.model.Filter("shipdate", sap.ui.model.FilterOperator.Contains, UIitem));
            //         });
            //     };
            // }

            // if (that.sTimeValues !== "") {
            //     var timeVal = that.sTimeValues.split(",");
            //     if (timeVal.length > 0) {
            //         $.each(timeVal, function (i, UIitem) {
            //             filters.push(new sap.ui.model.Filter("Time", sap.ui.model.FilterOperator.Contains, UIitem));
            //         });
            //     };
            // }

            if ((that.startDate !== "" && that.endDate !== "") || (that.startDate !== undefined && that.endDate !== undefined)) {

                var startDate = that.startDate;
                var endDate = that.endDate;

                if (startDate) {
                    filters.push(new sap.ui.model.Filter("proc_date", sap.ui.model.FilterOperator.BT, startDate, endDate)); /// changed to proc_date from date Gnaneshwar

                };
            }

            if ((that.startShipDate !== "" && that.endShipDate !== "") || (that.startShipDate !== undefined && that.endShipDate !== undefined)) {

                var startShipDate = that.startShipDate;
                var endShipDate = that.endShipDate;

                if (startShipDate) {
                    filters.push(new sap.ui.model.Filter("shipdate", sap.ui.model.FilterOperator.BT, startShipDate, endShipDate)); /// changed to proc_date from date Gnaneshwar

                };
                // }

                // if (that.statusKey !== "" && that.statusKey !== undefined) {
                //     var selectedStatusKey = that.statusKey;
                //     if (selectedStatusKey) {
                //         filters.push(new sap.ui.model.Filter("status", sap.ui.model.FilterOperator.Contains, selectedStatusKey));

                //     };
                // }

                // if (that.indicatorKey !== "" && that.indicatorKey !== undefined) {
                //     var selectedindicatorKey = that.indicatorKey;
                //     if (selectedindicatorKey) {
                //         filters.push(new sap.ui.model.Filter("indicator", sap.ui.model.FilterOperator.Contains, selectedindicatorKey));

                //     };
                //}




                that.tableMainModelfiltereddata = undefined
                that.tableMainModelfiltereddata = new jsonModel(that.getView().getModel("globalMainData"));
                that.getView().setModel(that.tableMainModelfiltereddata, "tableModel")

                that.getView().byId("Table").getBinding("items").filter(filters);
                that.filteredData = true;
                that.filteredDataToExport = [];
                var selectedITemsLength = this.getView().byId("Table").getBinding("items").aIndices.length;
                // var selectedITemsLength = that.tableMainModelfiltereddata.oData.oData.length;
                that.filteredIndices = this.getView().byId("Table").getBinding("items").aIndices;
                for (var i = 0; i < selectedITemsLength; i++) {

                    that.filteredDataToExport.push(that.tableMainModelfiltereddata.oData[that.filteredIndices[i]]);
                }
                var tableFilteredModel = new jsonModel(that.filteredDataToExport);
                that.getView().setModel(tableFilteredModel, "tableModel");
                that.getView().byId("hdtxt").setProperty("text", "ComponentPOStatus(" + tableFilteredModel.oData.length + ")")
                // var oModel2 = this.getOwnerComponent().getModel("SalesSrv_global_model");
                // oModel2.read("/zjda_ship_plan", {
                //     filters: filters,
                //     success: function (oData) {

                //         that.oTable = that.getView().byId("Table");
                //         var oData1 = new sap.ui.model.json.JSONModel(oData.results); 
                //         // that.oTable.setModel(oData1,"globalMainData")
                //         that.oTable.setModel(oData1,"tableModel"); 
                //         that.busy.close()    
                //     },
                //     error: function (oError) {

                //         console.log("error")
                //     }

                // });
                that.busy.close();
            }
        },


        onPressClear: function (oEvent) {
            that.filteredData = false;
            this.getView().byId("id_datePicker1").setValue("");
            this.getView().byId("id_Shipdate").setValue("");
            this.getView().byId("id_Counter").setTokens([]);
            this.getView().byId("id_Material").setTokens([]);
            // this.getView().byId("id_Sarr").setTokens([]);
            // this.getView().byId("id_Ship").setSelectedKey();
            // this.getView().byId("id_Source").setSelectedKey();
            // this.getView().byId("id_Time").setSelectedKey();
            var tableMainModel = new jsonModel();
            that.getView().setModel(tableMainModel, "tableModel")
            that.completeDate = ""
            // that.statusKey = ""
            //that.indicatorKey = ""
            that.startDate = ""
            that.endDate = ""
            that.startShipDate = "";
            that.endShipDate = "";

        },
        // 12-04-2024 Depprecated calls issue for excel SAP Recommendation @gnaneshwar
        onExportSelected: function (oEvent) {
            this.onGoToReport();
            var selectedItemsLength = this.getView().byId("Table").getSelectedItems().length;
            var oItem = this.getView().byId("Table").getSelectedItem();
            var selectedEntries = this.getView().getModel("globalMainData");
            var oselectedModel;

            if (that.filteredData === true) {
                oselectedModel = new sap.ui.model.json.JSONModel(that.getView().getModel("tableModel").oData);
            } else {
                oselectedModel = new sap.ui.model.json.JSONModel(that.selectedEntries.getData());
            }

            var aCols = [
                { label: "Date", property: "proc_date" },
                { label: "Counter", property: "counter" },
                { label: "Material", property: "matnr" },
                { label: "Sales Order", property: "salesord" },
                { label: "SalesOrderLine", property: "salesordline" },
                { label: "Dest", property: "dest" },
                { label: "Source", property: "source" },
                { label: "Sourcing", property: "sourcing" },
                { label: "ShipDate", property: "shipdate" },
                { label: "SarrDate", property: "sardate" },
                { label: "Quantity", property: "quantity" },
                { label: "Tmode", property: "tmode" },
                { label: "Segment", property: "segment" },
                { label: "Demand", property: "demand" },
                { label: "Pattern", property: "pattern" },
                { label: "ItemType", property: "itemtype" },
                { label: "JDASource", property: "jdasource" },
                { label: "Supply Type", property: "jdasupply" },
                { label: "U.Destination", property: "udest" }
            ];

            var oSettings = {
                workbook: {
                    columns: aCols,
                    context: {
                        sheetName: 'ComponentPOExport_' + this.attachDateToExcel()
                    },
                },
                dataSource: oselectedModel.getData(),
                fileName: "ComponentPOExport_" + this.attachDateToExcel() + ".xlsx",
                sheetName: "ComponentPOExport_" + this.attachDateToExcel()
            };

            var oSpreadsheet = new sap.ui.export.Spreadsheet(oSettings);
            oSpreadsheet.build().then(function () {
                oSpreadsheet.destroy();
            });
        },


        // onExportSelected: function (oEvent) {
        //     this.onGoToReport();
        //     var selectedITemsLength = this.getView().byId("Table").getSelectedItems().length
        //     that.oItem = this.getView().byId("Table").getSelectedItem();
        //     that.selectedEntries = that.getView().getModel("globalMainData")
        //     if (that.filteredData === true) {

        //         var oselectedModel = new sap.ui.model.json.JSONModel(that.getView().getModel("tableModel").oData)
        //     }
        //     else {
        //         var oselectedModel = new sap.ui.model.json.JSONModel(that.selectedEntries)
        //     }
        //     var oExport = new sap.ui.core.util.Export({
        //         exportType: new sap.ui.core.util.ExportTypeCSV({
        //             separatorChar: "\t",
        //             mimeType: "application/vnd.ms-excel",
        //             charset: "utf-8",
        //             fileExtension: "xls"
        //         }),

        //         models: oselectedModel,

        //         rows: {
        //             path: "/"
        //         },
        //         columns: [{
        //             name: "Date",
        //             template: {
        //                 content: "{proc_date}"
        //             }
        //         }, {
        //             name: "Counter",
        //             template: {
        //                 content: "{counter}"
        //             }
        //         }, {
        //             name: "Material",
        //             template: {
        //                 content: "{matnr}"
        //             }
        //         }, {
        //             name: "Sales Order",
        //             template: {
        //                 content: "{salesord}"
        //             }
        //         }, {
        //             name: "SalesOrderLine",
        //             template: {
        //                 content: "{salesordline}"
        //             }
        //         }, {
        //             name: "Dest",
        //             template: {
        //                 content: "{dest}"
        //             }
        //         }, {
        //             name: "Source",
        //             template: {
        //                 content: "{source}"
        //             }
        //         }, {
        //             name: "Sourcing",
        //             template: {
        //                 content: "{sourcing}"
        //             }
        //         }, {
        //             name: "ShipDate",
        //             template: {
        //                 content: "{shipdate}"
        //             }
        //         }, {
        //             name: "SarrDate",
        //             template: {
        //                 content: "{sardate}"
        //             }
        //         }, {
        //             name: "Quantity",
        //             template: {
        //                 content: "{quantity}"
        //             }
        //         }, {
        //             name: "Tmode",
        //             template: {
        //                 content: "{tmode}"
        //             }
        //         }, {
        //             name: "Segment",
        //             template: {
        //                 content: "{segment}"
        //             }
        //         },{
        //             name: "Demand",
        //             template: {
        //                 content: "{demand}"
        //             }
        //         },{
        //             name: "Pattern",
        //             template: {
        //                 content: "{pattern}"
        //             }
        //         },{
        //             name: "ItemType",
        //             template: {
        //                 content: "{itemtype}"
        //             }
        //         },{
        //             name: "JDASource",
        //             template: {
        //                 content: "{jdasource}"
        //             }
        //         },{
        //             name: "Supply Type",
        //             template: {
        //                 content: "{jdasupply}"
        //             }
        //         },{
        //             name: "U.Destination",
        //             template: {
        //                 content: "{udest}"
        //             }
        //         }

        //     ]

        //     });

        //     //* download exported file

        //     oExport.saveFile("ComponentPOExport_"+this.attachDateToExcel()).always(function () {

        //         this.destroy();

        //     });
        // },
        attachDateToExcel: function () {
            var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                pattern: "MM-dd-yyyy"
            });
            var passCurrentdate = oDateFormat.format(new Date());
            return passCurrentdate;

        },

        handleSortButtonPressed: function (oEvent) {

            if (this.oSortFrag) {
                this.oSortFrag = undefined;
            }
            if (!this.oSortFrag) {
                that.busy.open()
                this.oSortFrag = sap.ui.xmlfragment("pojdashipplan.Fragments.ascAndDscSort", that);
                this.getView().addDependent(that.oSortFrag);

            }
            that.busy.close()
            this.oSortFrag.open();

        },

        // handle sort
        handleSortDialogConfirm: function (oEvent) {

            var oTable = this.byId("Table"),
                mParams = oEvent.getParameters(),
                oBinding = oTable.getBinding("items"),
                sPath,
                bDescending,
                aSorters = [];

            sPath = mParams.sortItem.getKey();
            bDescending = mParams.sortDescending;
            aSorters.push(new Sorter(sPath, bDescending));

            // apply the selected sort and group settings
            oBinding.sort(aSorters);
        },

        handleSelectionChange: function (oEvent) {


            if (oEvent.mParameters.selected === true) {
                var differenceModel = this.getView().getModel("columnModel")
                that.myselectedcolumnskeys = oEvent.oSource.mProperties.selectedKeys
                if (that.myselectedcolumnskeys.includes('Date')) {
                    differenceModel.setProperty("/colVisible1", true);
                }
                if (that.myselectedcolumnskeys.includes('Counter')) {
                    differenceModel.setProperty("/colVisible2", true);
                }
                if (that.myselectedcolumnskeys.includes('Material')) {
                    differenceModel.setProperty("/colVisible3", true);
                }
                if (that.myselectedcolumnskeys.includes('SalesOrder')) {
                    differenceModel.setProperty("/colVisible4", true);
                }
                if (that.myselectedcolumnskeys.includes('SalesOrderLine')) {
                    differenceModel.setProperty("/colVisible5", true);
                }
                if (that.myselectedcolumnskeys.includes('Dest')) {
                    differenceModel.setProperty("/colVisible6", true);
                }
                if (that.myselectedcolumnskeys.includes('Source')) {
                    differenceModel.setProperty("/colVisible7", true);
                }
                if (that.myselectedcolumnskeys.includes('Sourcing')) {
                    differenceModel.setProperty("/colVisible8", true);
                }
                if (that.myselectedcolumnskeys.includes('ShipDate')) {
                    differenceModel.setProperty("/colVisible9", true);
                }
                if (that.myselectedcolumnskeys.includes('SarrDate')) {
                    differenceModel.setProperty("/colVisible10", true);
                }
                if (that.myselectedcolumnskeys.includes('Quantity')) {
                    differenceModel.setProperty("/colVisible11", true);
                }
                if (that.myselectedcolumnskeys.includes('Tmode')) {
                    differenceModel.setProperty("/colVisible12", true);
                }
                if (that.myselectedcolumnskeys.includes('Segment')) {
                    differenceModel.setProperty("/colVisible13", true);
                }
                if (that.myselectedcolumnskeys.includes('Demand')) {
                    differenceModel.setProperty("/colVisible14", true);
                }
                if (that.myselectedcolumnskeys.includes('Pattern')) {
                    differenceModel.setProperty("/colVisible15", true);
                }
                if (that.myselectedcolumnskeys.includes('ItemType')) {
                    differenceModel.setProperty("/colVisible16", true);
                }
                if (that.myselectedcolumnskeys.includes('JDASource')) {
                    differenceModel.setProperty("/colVisible17", true);
                }
                if (that.myselectedcolumnskeys.includes('SupplyType')) {
                    differenceModel.setProperty("/colVisible18", true);
                }
                if (that.myselectedcolumnskeys.includes('U.Destination')) {
                    differenceModel.setProperty("/colVisible19", true);
                }


            }
            else if (oEvent.mParameters.selected === false) {

                var differenceModel = this.getView().getModel("columnModel")
                that.myselectedcolumnskeys = oEvent.oSource.mProperties.selectedKeys
                if (oEvent.mParameters.changedItem.mProperties.key === 'Date') {
                    differenceModel.setProperty("/colVisible1", false);
                }
                if (oEvent.mParameters.changedItem.mProperties.key === 'Counter') {
                    differenceModel.setProperty("/colVisible2", false);
                }
                if (oEvent.mParameters.changedItem.mProperties.key === 'Material') {
                    differenceModel.setProperty("/colVisible3", false);
                }
                if (oEvent.mParameters.changedItem.mProperties.key === 'SalesOrder') {
                    differenceModel.setProperty("/colVisible4", false);
                }
                if (oEvent.mParameters.changedItem.mProperties.key === 'SalesOrderLine') {
                    differenceModel.setProperty("/colVisible5", false);
                }
                if (oEvent.mParameters.changedItem.mProperties.key === 'Dest') {
                    differenceModel.setProperty("/colVisible6", false);
                }
                if (oEvent.mParameters.changedItem.mProperties.key === 'Source') {
                    differenceModel.setProperty("/colVisible7", false);
                }
                if (oEvent.mParameters.changedItem.mProperties.key === 'Sourcing') {
                    differenceModel.setProperty("/colVisible8", false);
                }
                if (oEvent.mParameters.changedItem.mProperties.key === 'ShipDate') {
                    differenceModel.setProperty("/colVisible9", false);
                }
                if (oEvent.mParameters.changedItem.mProperties.key === 'SarrDate') {
                    differenceModel.setProperty("/colVisible10", false);
                }
                if (oEvent.mParameters.changedItem.mProperties.key === 'Quantity') {
                    differenceModel.setProperty("/colVisible11", false);
                }
                if (oEvent.mParameters.changedItem.mProperties.key === 'Tmode') {
                    differenceModel.setProperty("/colVisible12", false);
                }
                if (oEvent.mParameters.changedItem.mProperties.key === 'Segment') {
                    differenceModel.setProperty("/colVisible13", false);
                }
                if (oEvent.mParameters.changedItem.mProperties.key === 'Demand') {
                    differenceModel.setProperty("/colVisible14", false);
                }
                if (oEvent.mParameters.changedItem.mProperties.key === 'Pattern') {
                    differenceModel.setProperty("/colVisible15", false);
                }
                if (oEvent.mParameters.changedItem.mProperties.key === 'ItemType') {
                    differenceModel.setProperty("/colVisible16", false);
                }
                if (oEvent.mParameters.changedItem.mProperties.key === 'JDASource') {
                    differenceModel.setProperty("/colVisible17", false);
                }
                if (oEvent.mParameters.changedItem.mProperties.key === 'SupplyType') {
                    differenceModel.setProperty("/colVisible18", false);
                }
                if (oEvent.mParameters.changedItem.mProperties.key === 'U.Destination') {
                    differenceModel.setProperty("/colVisible19", false);
                }

            }
        },

    });

});

