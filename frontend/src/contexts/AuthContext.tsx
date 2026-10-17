import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import * as authService from "../services/auth";
import type { LoginPayload, RegisterPayload } from "../services/auth";

// Atualizamos a interface User para reconhecer a flag trocar_senha
export interface User {
  id: number | string;
  nome: string;
  email: string;
  perfil: string;
  trocar_senha?: boolean;
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  needsPasswordChange: boolean; // Novo estado para controlar se precisa trocar a senha
  signIn: (payload: LoginPayload) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signOut: () => void;
  updateUser: (updatedUser: User) => void; // Para atualizar o estado após a troca de senha
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

const TOKEN_KEY = "@autos:token";
const USER_KEY = "@autos:user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaura sessão ao carregar o app
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  async function signIn(payload: LoginPayload) {
    const { user: loggedUser, token } = await authService.login(payload);

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
    setUser(loggedUser);
  }

  async function signUp(payload: RegisterPayload) {
    await authService.register(payload);
    await signIn({ email: payload.email, senha: payload.senha });
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  function updateUser(updatedUser: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  }

  // Verifica se o usuário logado precisa trocar a senha obrigatoriamente
  const needsPasswordChange = !!user?.trocar_senha;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        needsPasswordChange,
        signIn,
        signUp,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}