/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import * as authService from "../services/auth";
import type { LoginPayload, User } from "../services/auth";

export type { User };

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  needsPasswordChange: boolean;
  signIn: (payload: LoginPayload) => Promise<User>;
  signOut: () => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

const TOKEN_KEY = "@autos:token";
const USER_KEY = "@autos:user";

export function AuthProvider({ children }: { children: ReactNode }) {
  // O usuário salvo já aparece na primeira renderização; o efeito só confirma com o backend
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    const storedToken = localStorage.getItem(TOKEN_KEY);
    return storedUser && storedToken ? JSON.parse(storedUser) : null;
  });
  // Sem sessão salva não tem o que conferir, então nem começa carregando
  const [loading, setLoading] = useState(() => user !== null);

  useEffect(() => {
    // Mesma condição do useState acima: precisa do usuário e do token salvos
    if (!localStorage.getItem(USER_KEY) || !localStorage.getItem(TOKEN_KEY)) {
      return;
    }

    authService
      .getMe()
      .then((freshUser) => {
        localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch(() => {
        // Se der 401, o interceptor do api.ts já limpa e redireciona
      })
      .finally(() => setLoading(false));
  }, []);

  async function signIn(payload: LoginPayload): Promise<User> {
    const { user: loggedUser, token } = await authService.login(payload);

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
    setUser(loggedUser);
    return loggedUser;
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

  const needsPasswordChange = !!user?.trocar_senha;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        needsPasswordChange,
        signIn,
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