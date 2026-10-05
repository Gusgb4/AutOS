import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import Clients from "../pages/Clients";
import ClientProfile from "../pages/ClientProfile";
import NewStockItem from "../pages/NewStockItem";
import Reports from "../pages/Reports";
/// import Vehicles from "../pages/Vehicles";
import Stock from "../pages/Stock";
import Financial from "../pages/Financial";
import ServiceOrders from "../pages/ServiceOrders";
import NewServiceOrder from "../pages/NewServiceOrder";
import ServiceOrderDetails from "../pages/ServiceOrderDetails";
import NotFound from "../pages/NotFound";
import Productivity from "../pages/Productivity";
import TermsOfUse from "../pages/TermsOfSerivce";
import PrivacyPolicy from "../pages/PrivacyPolicy";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/termos-de-uso", element: <TermsOfUse /> },
  { path: "/politica-de-privacidade", element: <PrivacyPolicy /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <Layout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "ordens-servico", element: <ServiceOrders /> },
          { path: "ordens-servico/:id", element: <ServiceOrderDetails /> },
          { path: "clientes", element: <Clients /> },
          { path: "clientes/:id", element: <ClientProfile /> },
          { path: "estoque", element: <Stock /> },
          { path: "estoque/novo", element: <NewStockItem /> },
          { path: "estoque/:id/editar", element: <NewStockItem /> },
          { path: "ordens-servico/novo", element: <NewServiceOrder /> },
          { path: "financeiro", element: <Financial /> },
          { path: "/produtividade", element: <Productivity /> },
          { path: "relatorios", element: <Reports /> },

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
