import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './shell/AppShell';
import { SessionGate } from '../features/access/SessionGate';
import { HomePage } from '../features/home/HomePage';
import { ReceiptLogPage } from '../features/receiving/ReceiptLogPage';
import { InventoryBalancePage } from '../features/inventory/InventoryBalancePage';
import { BatchHistoryPage } from '../features/inventory/BatchHistoryPage';
import { MaterialHistoryPage } from '../features/inventory/MaterialHistoryPage';
import { LocationMapPage } from '../features/locations/LocationMapPage';
import { OperationsSummaryPage } from '../features/administration/OperationsSummaryPage';
import { CatalogManagementPage } from '../features/w2/CatalogManagementPage';
import { CreateInspectionPage } from '../features/w2/CreateInspectionPage';
import { EvaluateMaterialPage } from '../features/w2/EvaluateMaterialPage';
import { InspectionHistoryPage } from '../features/w2/InspectionHistoryPage';
import { InspectionPrintPage } from '../features/w2/InspectionPrintPage';
import { MaterialQcAssignmentPage } from '../features/w2/MaterialQcAssignmentPage';
import { QcConfigurationPage } from '../features/w2/QcConfigurationPage';
import { RoleManagementPage } from '../features/w2/RoleManagementPage';
import { BatchLabelsPage } from '../features/w3/BatchLabelsPage';
import { MultiplePoAttachmentPage } from '../features/w3/MultiplePoAttachmentPage';
import { ReceiptEditorPage } from '../features/w3/ReceiptEditorPage';
import { ReceiveWithPoPage } from '../features/w3/ReceiveWithPoPage';
import { ReceiveWithoutPoPage } from '../features/w3/ReceiveWithoutPoPage';
import { SinglePoAttachmentPage } from '../features/w3/SinglePoAttachmentPage';
import { WarehouseReceiptPage } from '../features/w3/WarehouseReceiptPage';
import { BatchCountPage } from '../features/w4/BatchCountPage';
import { DeclareInventoryPage } from '../features/w4/DeclareInventoryPage';
import { LocationCountPage } from '../features/w4/LocationCountPage';
import { PutAwayPage } from '../features/w4/PutAwayPage';
import { RelocatePage } from '../features/w4/RelocatePage';
import { SplitBatchPage } from '../features/w4/SplitBatchPage';
import { TakeDownPage } from '../features/w4/TakeDownPage';
import { EditRequestPage } from '../features/w5/EditRequestPage';
import { OverPlanRequestPage } from '../features/w5/OverPlanRequestPage';
import { PlannedRequestPage } from '../features/w5/PlannedRequestPage';
import { RequestsPage } from '../features/w5/RequestsPage';
import { UnplannedRequestPage } from '../features/w5/UnplannedRequestPage';
import { BatchPickingPage } from '../features/w6/BatchPickingPage';
import { GoodsIssuePage } from '../features/w6/GoodsIssuePage';
import { IssueDocumentsPage } from '../features/w6/IssueDocumentsPage';
import { IssuePrintPage } from '../features/w6/IssuePrintPage';
import { PickingQueuePage } from '../features/w6/PickingQueuePage';
import { ConfirmInternalReturnPage } from '../features/w7/ConfirmInternalReturnPage';
import { CreateInternalReturnPage } from '../features/w7/CreateInternalReturnPage';
import { SplitReturnBatchPage } from '../features/w7/SplitReturnBatchPage';
import { NotFoundPage } from './shell/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <SessionGate />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/home" replace /> },
          { path: '/home', element: <HomePage /> },
          { path: '/receiving/log', element: <ReceiptLogPage /> },
          { path: '/inventory/balances', element: <InventoryBalancePage /> },
          { path: '/inventory/batches/:batchId?', element: <BatchHistoryPage /> },
          { path: '/inventory/materials/:materialId?', element: <MaterialHistoryPage /> },
          { path: '/locations', element: <LocationMapPage /> },
          { path: '/administration/operations', element: <OperationsSummaryPage /> },
          { path: '/administration/access', element: <RoleManagementPage /> },
          { path: '/administration/catalogs', element: <CatalogManagementPage /> },
          { path: '/quality/configuration', element: <QcConfigurationPage /> },
          { path: '/quality/material-assignments', element: <MaterialQcAssignmentPage /> },
          { path: '/quality/inspections/new', element: <CreateInspectionPage /> },
          { path: '/quality/evaluation/:inspectionId?', element: <EvaluateMaterialPage /> },
          { path: '/quality/history', element: <InspectionHistoryPage /> },
          { path: '/quality/print/:inspectionId?', element: <InspectionPrintPage /> },
          { path: '/receiving/with-po', element: <ReceiveWithPoPage /> },
          { path: '/receiving/without-po', element: <ReceiveWithoutPoPage /> },
          { path: '/receiving/receipts/:receiptId?', element: <ReceiptEditorPage /> },
          { path: '/receiving/attach-po', element: <SinglePoAttachmentPage /> },
          { path: '/receiving/attach-multiple-pos/:receiptId?', element: <MultiplePoAttachmentPage /> },
          { path: '/receiving/warehouse', element: <WarehouseReceiptPage /> },
          { path: '/receiving/batch-labels', element: <BatchLabelsPage /> },
          { path: '/inventory/declare', element: <DeclareInventoryPage /> },
          { path: '/inventory/split-batch', element: <SplitBatchPage /> },
          { path: '/inventory/count-batch', element: <BatchCountPage /> },
          { path: '/inventory/count-location', element: <LocationCountPage /> },
          { path: '/locations/put-away', element: <PutAwayPage /> },
          { path: '/locations/relocate', element: <RelocatePage /> },
          { path: '/locations/take-down', element: <TakeDownPage /> },
          { path: '/outbound/requests/planned', element: <PlannedRequestPage /> },
          { path: '/outbound/requests/unplanned', element: <UnplannedRequestPage /> },
          { path: '/outbound/requests/over-plan', element: <OverPlanRequestPage /> },
          { path: '/outbound/requests/edit/:requestId?', element: <EditRequestPage /> },
          { path: '/outbound/requests', element: <RequestsPage /> },
          { path: '/outbound/picking', element: <PickingQueuePage /> },
          { path: '/outbound/picking/:requestId/batches', element: <BatchPickingPage /> },
          { path: '/outbound/goods-issue/:requestId', element: <GoodsIssuePage /> },
          { path: '/outbound/issue-documents', element: <IssueDocumentsPage /> },
          { path: '/outbound/issue-documents/:documentId/print', element: <IssuePrintPage /> },
          { path: '/returns/internal', element: <CreateInternalReturnPage /> },
          { path: '/returns/internal/confirmation', element: <ConfirmInternalReturnPage /> },
          { path: '/returns/internal/split-batch', element: <SplitReturnBatchPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
