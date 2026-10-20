import crypto from "crypto";

export function gerarSenhaProvisoria(tamanho = 10): string {
  // Gera bytes aleatórios e converte para base64url (caracteres seguros e legíveis)
  return crypto.randomBytes(Math.ceil(tamanho * 0.75)).toString("base64url").slice(0, tamanho);
}