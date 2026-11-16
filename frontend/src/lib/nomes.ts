// "gustavo FRANZ" vira "Gustavo Franz": nomes de pessoas são salvos como
// foram digitados, e a tela e os PDFs mostram com as iniciais maiúsculas
export function capitalizeName(nome: string) {
  return nome
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(" ");
}
