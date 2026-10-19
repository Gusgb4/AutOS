import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333/api",
});

// Injeta o token em toda requisição, se existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("@autos:token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Se o token expirar/for inválido, desloga automaticamente
// Se precisar trocar a senha (403 TROCAR_SENHA), redireciona para /trocar-senha
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("@autos:token");
      localStorage.removeItem("@autos:user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    if (
      error.response?.status === 403 &&
      error.response?.data?.codigo === "TROCAR_SENHA"
    ) {
      const storedUser = localStorage.getItem("@autos:user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          parsed.trocar_senha = true;
          localStorage.setItem("@autos:user", JSON.stringify(parsed));
        } catch {
          // ignora erro de parse
        }
      }
      if (window.location.pathname !== "/trocar-senha") {
        window.location.href = "/trocar-senha";
      }
    }

    return Promise.reject(error);
  },
);