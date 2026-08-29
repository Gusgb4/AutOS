import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import Clients from "../pages/Clients";
import ClientProfile from "../pages/ClientProfile";
import NotFound from "../pages/NotFound";
import Stock from "../pages/Stock";
import NewStockItem from "../pages/NewStockItem";
import ServiceOrders from "../pages/ServiceOrders";

/* 
!!! TIRE DO COMENTARIO QUANDO ESTIVER FEITO ALGUMA DAS PAGINAS ABAIXO !!!

import Clients from "../pages/Clients";
import Vehicles from "../pages/Vehicles";
*/

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "ordens-servico", element: <ServiceOrders /> },
      { path: "clientes", element: <Clients /> },
      { path: "estoque", element: <Stock /> },
      { path: "estoque/novo", element: <NewStockItem /> },
      { path: "clientes/:id", element: <ClientProfile /> },
      //{ path: "veiculos", element: <Vehicles /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);