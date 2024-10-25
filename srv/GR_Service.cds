using BTP.Panasonic as BTP from '../db/data-model';


service GR @(path: '/factoryint/gr'){
    entity invoiceLine         as projection on BTP.invoiceLine;
    entity A_PurchaseOrderItem as projection on BTP.A_PurchaseOrderItem;
    entity ZCROSSREF           as projection on BTP.ZCROSSREF;
    entity MNET_DiversionDetail as projection on BTP.MNET_DiversionDetail;
    type GR_UPDATE 
    {
        BTP_IBDNumber : String(10);
        SAP_LineID_IBD : String(10);
        BTP_GRStatus : String(10);
        BTP_GRNumber : String(10);
        SAP_LineID_GR : String(10);
    }
    /* This Service is only for Stock GR's */
    action GR_Data_Update(ID : Integer, GR_UPDATE : many GR_UPDATE) returns Boolean;

    entity Get_Stock_GR        as
        select from invoiceLine as T0
        inner join A_PurchaseOrderItem as T1
            on T0.purchaseOrderNumber = T1.PurchaseOrder.PurchaseOrder
        left join ZCROSSREF as T2
            on T1.Plant = T2.SAP_Code
        {
            cast(
                MAX(
                    T0.BTP_IBDNumber
                ) as String(30)
            ) as IBD_NO,
            cast(
                MAX(
                    T0.SAP_LineID_IBD
                ) as String(10)
            ) as IBD_LINE
        }
        where
                ifnull(
                T2.SAP_Code, 'X'
            ) =  'X'
            and ifnull(
                T0.BTP_GRNumber, ''
            ) =  ''
            and ifnull(
                T0.BTP_IBDNumber, ''
            ) <> ''
            and ifnull(
                T0.SAP_LineID_IBD, ''
            ) <> ''
        group by
            T0.purchaseOrderNumber;
}