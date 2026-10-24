import { Fragment } from 'react';
import { Routes } from 'react-router';
import { ToastContainer } from 'react-toastify';
import AppRoutes from '../../app/router';

const AppMain = () => (
  <Fragment>
    <Routes>{AppRoutes()}</Routes>
    <ToastContainer />
  </Fragment>
);

export default AppMain;
