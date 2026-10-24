import { Routes } from 'react-router';
import { ToastContainer } from 'react-toastify';
import AppRoutes from '../../app/router';

export default function AppMain() {
  return (
    <>
      <Routes>{AppRoutes()}</Routes>
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}
