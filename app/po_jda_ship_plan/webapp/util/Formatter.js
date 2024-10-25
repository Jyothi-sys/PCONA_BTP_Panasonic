sap.ui.define([], function () {
    "use strict";      // @gnaneshwar Defect-65 20-03-2024
    return {
        dateFormat: function (value) {
            if (value) {
               
                // Create date object
                var userDate = new Date(value);

                // Adjust for IST (UTC+5:30)
                userDate.setHours(userDate.getHours() + 5);
                userDate.setMinutes(userDate.getMinutes() + 30);

                // Format the date based on the user's time zone
                var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                    pattern: "MM-dd-yyyy",
                    UTC: true
                });
                value = oDateFormat.format(userDate);
                
                return value;
            } else {
                return value;
            }
        }
    };
});