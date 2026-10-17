import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

export default function ChangePassword() {
  const { user, updateUser, signOut } = useAuth();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (novaSenha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);
      setErro("");
      
      // Ajusta a rota conforme o teu backend (ex: /auth/mudar-senha ou /users/change-password)
      await api.patch("/auth/mudar-senha", { senha: novaSenha });

      // Atualiza o estado local removendo a flag de trocar senha
      if (user) {
        updateUser({ ...user, trocar_senha: false });
      }
      window.location.href = "/";
    } catch (err: any) {
      setErro(err.response?.data?.error || "Erro ao alterar a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">Primeiro Acesso</h2>
        <p className="text-gray-400 mb-6 text-sm">
          Por razões de segurança, você precisa alterar a sua senha provisória antes de continuar.
        </p>

        {erro && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded mb-4 text-sm">{erro}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nova Senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="w-full p-2.5 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-orange-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirmar Nova Senha</label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="w-full p-2.5 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-orange-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 transition p-2.5 rounded font-bold mt-2"
          >
            {loading ? "A alterar..." : "Salvar Nova Senha e Entrar"}
          </button>
        </form>

        <button
          onClick={signOut}
          className="w-full text-center text-sm text-gray-400 hover:text-white mt-4"
        >
          Cancelar / Sair
        </button>
      </div>
    </div>
  );
}