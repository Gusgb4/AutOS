import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listStock, deleteStockItem, type StockItem } from '../services/stock';

export default function Stock() {

  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [excluindo, setExcluindo] = useState<number | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro(null);
        const data = await listStock();
        setItems(data);
      } catch (e: any) {
        setErro(e.response?.data?.error ?? 'Não foi possível carregar o estoque.');
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  const totalItens = items.length;
  const estoqueBaixo = items.filter((item) => item.alerta_minimo).length;
  const valorTotal = items.reduce(
    (soma, item) => soma + item.quantidade * Number(item.valor_unitario),
    0,
  );
  const totalCategorias = new Set(
    items.map((item) => item.categoria).filter(Boolean),
  ).size;

  const termo = busca.trim().toLowerCase();
  const itensFiltrados = termo
    ? items.filter((item) =>
      [item.nome, item.categoria, item.fornecedor].some((campo) =>
        (campo ?? '').toLowerCase().includes(termo),
      ),
    )
    : items;

  async function handleExcluir(item: StockItem) {
    const confirmado = window.confirm(
      `Excluir "${item.nome}"? Essa ação não pode ser desfeita.`,
    );
    if (!confirmado) return;

    try {
      setExcluindo(item.id);
      setErro(null);
      await deleteStockItem(item.id);
      setItems((atuais) => atuais.filter((i) => i.id !== item.id));
    } catch (e: any) {
      setErro(e.response?.data?.error ?? 'Não foi possível excluir o item.');
    } finally {
      setExcluindo(null);
    }
  }

  return (
    <div className="p-8 min-h-screen bg-[#F8F9FA] font-sans">

      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Estoque</h1>
        <p className="text-gray-500 mt-1">Gerenciar o estoque de peças, suprimentos e materiais</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex justify-center items-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" /></svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total de itens</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalItens}</h3>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex justify-center items-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Estoque Baixo</p>
            <h3 className="text-2xl font-bold text-orange-500">{estoqueBaixo}</h3>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex justify-center items-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" /></svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Categorias</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalCategorias}</h3>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-500 flex justify-center items-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Valor Total</p>
            <h3 className="text-2xl font-bold text-gray-800">{valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
          </div>
        </div>
      </div>

      {/* Tabela Branca */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Barra de Ferramentas da Tabela */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 p-2 rounded-lg text-orange-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" /></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Lista de itens</h2>
              <p className="text-xs text-gray-400">Todos os itens de estoque registrados</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Procurar itens"
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              Filtro
            </button>
            <Link to="/estoque/novo" className="px-4 py-2 bg-[#F97316] text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-orange-600 transition">
              + Novo item
            </Link>
          </div>
        </div>

        {/* Corpo da Tabela */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="px-6 py-4">Nome do Item</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4">Quantidade Atual</th>
              <th className="px-6 py-4">Quantidade Mínima</th>
              <th className="px-6 py-4">Preço Unitário</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                  Carregando itens...
                </td>
              </tr>
            )}

            {!loading && erro && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-red-500">
                  {erro}
                </td>
              </tr>
            )}

            {!loading && !erro && itensFiltrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                  {termo
                    ? `Nenhum item encontrado para "${busca}".`
                    : 'Nenhum item cadastrado ainda.'}
                </td>
              </tr>
            )}

            {!loading && !erro && itensFiltrados.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex justify-center items-center font-bold bg-gray-100 text-gray-600">
                    {item.nome.charAt(0)}
                  </div>
                  <p className="font-bold text-gray-800 text-sm">{item.nome}</p>
                </td>

                <td className="px-6 py-4">
                  {item.categoria ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 w-max flex items-center gap-1">
                      {item.categoria}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>

                <td className="px-6 py-4 text-sm font-bold text-gray-700">
                  <span className={item.alerta_minimo ? 'text-orange-500' : ''}>
                    {item.quantidade}
                  </span>{' '}
                  <span className="text-gray-400 font-normal">unidades</span>
                </td>

                <td className="px-6 py-4 text-sm font-bold text-gray-700">
                  {item.quantidade_minima}
                </td>

                <td className="px-6 py-4 text-sm font-bold text-gray-800">
                  {Number(item.valor_unitario).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-max gap-1 ${item.alerta_minimo
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-green-600 bg-green-50'
                      }`}
                  >
                    {item.alerta_minimo ? 'Pouco Estoque' : 'Em Estoque'}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <Link
                          to={`/estoque/${item.id}/editar`}
                          title="Editar"
                          className="w-8 h-8 flex justify-center items-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </Link>

                        <button
                          onClick={() => handleExcluir(item)}
                          disabled={excluindo === item.id}
                          title="Excluir"
                          className="w-8 h-8 flex justify-center items-center rounded-lg border border-gray-200 text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Rodapé da Tabela */}
        <div className="px-6 py-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center">
          <span>Mostrando {itensFiltrados.length} de {totalItens} itens</span>
          <div className="flex gap-1">
            <button className="w-8 h-8 flex justify-center items-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50">&lt;</button>
            <button className="w-8 h-8 flex justify-center items-center rounded bg-[#F97316] text-white font-bold">1</button>
            <button className="w-8 h-8 flex justify-center items-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50">2</button>
            <button className="w-8 h-8 flex justify-center items-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50">3</button>
            <span className="w-8 h-8 flex justify-center items-center text-gray-400">...</span>
            <button className="w-8 h-8 flex justify-center items-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50">25</button>
            <button className="w-8 h-8 flex justify-center items-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50">&gt;</button>
          </div>
        </div>

      </div>
    </div>
  );
}