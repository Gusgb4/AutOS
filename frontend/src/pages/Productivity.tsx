import { useEffect, useState } from "react";
import { Wrench, Search, Calendar, Loader2 } from "lucide-react";

interface MecanicoProdutividade {
  id: number;
  nome: string;
  totalServicos: number;
  valorGerado: number;
  comissaoEstimada: number;
}

export default function Productivity() {
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const [mecanicos, setMecanicos] = useState<MecanicoProdutividade[]>([]);
  const [loading, setLoading] = useState(true);

  const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  async function carregarDados() {
    try {
      setLoading(true);
      // Aqui chama a rota que acabámos de criar no backend
      const token = localStorage.getItem("@autos:token");
      const response = await fetch(`http://localhost:3333/productivity?mes=${mes}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMecanicos(data);
    } catch (error) {
      console.error("Erro ao carregar produtividade", error);
    } finally {
      setLoading(false);
    }
  }

  // Carrega sempre que a página abrir ou que o utilizador clicar em "Filtrar"
  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F1F1F]">Produtividade</h1>
          <p className="text-sm text-gray-500">Acompanhe os serviços e valores gerados por cada mecânico.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
            <Calendar size={16} className="text-gray-400" />
            <input 
              type="month" 
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="bg-transparent outline-none text-gray-700"
            />
          </div>
          <button 
            onClick={carregarDados}
            className="flex items-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e6690f]"
          >
            <Search size={16} />
            Filtrar
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-6 py-4 font-semibold">Mecânico</th>
                <th className="px-6 py-4 font-semibold text-center">Serviços Concluídos</th>
                <th className="px-6 py-4 font-semibold text-right">Valor Gerado</th>
                <th className="px-6 py-4 font-semibold text-right">Comissão (30%)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    <Loader2 size={24} className="mx-auto animate-spin text-[#FF7518]" />
                  </td>
                </tr>
              ) : mecanicos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    Nenhum mecânico ou serviço encontrado para este mês.
                  </td>
                </tr>
              ) : (
                mecanicos.map((mec) => (
                  <tr key={mec.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF75181A] text-[#FF7518]">
                          <Wrench size={18} />
                        </div>
                        <span className="font-medium text-[#1F1F1F]">{mec.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-600">
                      {mec.totalServicos}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-600">
                      {moeda(mec.valorGerado)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-[#FF7518]">
                      {moeda(mec.comissaoEstimada)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}