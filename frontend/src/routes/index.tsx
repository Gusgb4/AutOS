import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import Clients from "../pages/Clients";
import ClientProfile from "../pages/ClientProfile";
import NewStockItem from "../pages/NewStockItem";
/// import Vehicles from "../pages/Vehicles";
import Stock from "../pages/Stock";
import ServiceOrders from "../pages/ServiceOrders";
import NotFound from "../pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <Layout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "ordens-servico", element: <ServiceOrders /> },
          { path: "clientes", element: <Clients /> },
          { path: "clientes/:id", element: <ClientProfile /> },
          { path: "estoque", element: <Stock /> },
          { path: "estoque/novo", element: <NewStockItem /> },
          /// { path: "veiculos", element: <Vehicles /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);