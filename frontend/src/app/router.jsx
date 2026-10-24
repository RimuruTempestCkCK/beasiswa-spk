import { Suspense, lazy } from 'react';
import { Route, Navigate } from 'react-router';
import SuspenseFallback from '../Layout/AppMain/SuspenseFallback';

const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));
const DatasetListPage = lazy(() => import('../features/datasets/DatasetListPage'));
const DatasetDetailPage = lazy(() => import('../features/datasets/DatasetDetailPage'));
const ImportPage = lazy(() => import('../features/datasets/ImportPage'));
const PreprocessingPage = lazy(() => import('../features/preprocessing/PreprocessingPage'));
const ClusteringPage = lazy(() => import('../features/clustering/ClusteringPage'));
const TrainingPage = lazy(() => import('../features/training/TrainingPage'));
const EvaluationPage = lazy(() => import('../features/evaluation/EvaluationPage'));
const PredictionsPage = lazy(() => import('../features/predictions/PredictionsPage'));
const ReportsPage = lazy(() => import('../features/reports/ReportsPage'));
const UsersPage = lazy(() => import('../features/users/UsersPage'));

const lazyRoute = (Component) => (
  <Suspense fallback={<SuspenseFallback type="ball-pulse-rise" />}>
    <Component />
  </Suspense>
);

export default function AppRoutes() {
  return (
    <>
      <Route path="/dashboard" element={lazyRoute(DashboardPage)} />
      <Route path="/datasets" element={lazyRoute(DatasetListPage)} />
      <Route path="/datasets/import" element={lazyRoute(ImportPage)} />
      <Route path="/datasets/:id" element={lazyRoute(DatasetDetailPage)} />
      <Route path="/records" element={lazyRoute(DatasetDetailPage)} />
      <Route path="/preprocessing" element={lazyRoute(PreprocessingPage)} />
      <Route path="/clustering" element={lazyRoute(ClusteringPage)} />
      <Route path="/training" element={lazyRoute(TrainingPage)} />
      <Route path="/evaluation" element={lazyRoute(EvaluationPage)} />
      <Route path="/predictions" element={lazyRoute(PredictionsPage)} />
      <Route path="/reports" element={lazyRoute(ReportsPage)} />
      <Route path="/users" element={lazyRoute(UsersPage)} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </>
  );
}
