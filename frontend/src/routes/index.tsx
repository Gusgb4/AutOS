import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import Clients from "../pages/Clients";
import ClientProfile from "../pages/ClientProfile";
import NewStockItem from "../pages/NewStockItem";
import Reports from "../pages/Reports";
import Stock from "../pages/Stock";
import Financial from "../pages/Financial";
import ServiceOrders from "../pages/ServiceOrders";
import NewServiceOrder from "../pages/NewServiceOrder";
import ServiceOrderDetails from "../pages/ServiceOrderDetails";
import NotFound from "../pages/NotFound";
import Productivity from "../pages/Productivity";
import TermsOfUse from "../pages/TermsOfSerivce";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import Team from "../pages/Team";
import ChangePassword from "../pages/ChangePassword"; // <-- Importa a tela nova
import { useAuth } from "../contexts/AuthContext";

// Componente auxiliar para verificar se precisa de trocar senha nas rotas protegidas
function PasswordCheckWrapper() {
  const { user } = useAuth();
  if (user?.trocar_senha) {
    return <ChangePassword />;
  }
  return <Layout />;
}

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/termos-de-uso", element: <TermsOfUse /> },
  { path: "/politica-de-privacidade", element: <PrivacyPolicy /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <PasswordCheckWrapper />, // <-- Intercepta o Layout principal
        children: [
          { index: true, element: <Dashboard /> },
          { path: "ordens-servico", element: <ServiceOrders /> },
          { path: "ordens-servico/:id", element: <ServiceOrderDetails /> },
          { path: "clientes", element: <Clients /> },
          { path: "clientes/:id", element: <ClientProfile /> },
          { path: "estoque", element: <Stock /> },
          {
            element: <RoleRoute allowed={["PROPRIETARIO"]} />,
            children: [
              { path: "estoque/novo", element: <NewStockItem /> },
              { path: "estoque/:id/editar", element: <NewStockItem /> },
              { path: "equipe", element: <Team /> },
              { path: "financeiro", element: <Financial /> },
            ],
          },
          { path: "ordens-servico/novo", element: <NewServiceOrder /> },
          { path: "/produtividade", element: <Productivity /> },
          { path: "relatorios", element: <Reports /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);