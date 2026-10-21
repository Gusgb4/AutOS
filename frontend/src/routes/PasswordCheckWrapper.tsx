import Layout from "../components/layout/Layout";
import { useAuth } from "../contexts/AuthContext";
import ChangePassword from "../pages/ChangePassword";

// Nas rotas protegidas: quem ainda está com a senha provisória cai na troca de senha
export default function PasswordCheckWrapper() {
  const { user } = useAuth();
  if (user?.trocar_senha) {
    return <ChangePassword />;
  }
  return <Layout />;
}
