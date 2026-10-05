type Celula = string | number | null | undefined;

function escapar(valor: Celula): string {
  if (valor === null || valor === undefined) return "";
  const texto =
    typeof valor === "number" ? String(valor).replace(".", ",") : String(valor);
  return /[";\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

// Separador ";" e BOM: é o formato que o Excel em português abre sem quebrar acento
export function downloadCsv(nomeArquivo: string, linhas: Celula[][]) {
  const conteudo =
    "\uFEFF" + linhas.map((l) => l.map(escapar).join(";")).join("\r\n");
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}
