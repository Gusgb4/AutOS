import React from 'react';
import { Link } from 'react-router-dom';

// Dados fake baseados na imagem
const fakeStock = [
  { id: 1, name: 'Óleo de motor 5W-30', sku: 'CIL-5W30-001', category: 'Lubrificantes', categoryColor: 'text-blue-600 bg-blue-50', quantity: 3, minQuantity: 10, price: 12.50, status: 'Pouco Estoque', statusColor: 'text-orange-600 bg-orange-50' },
  { id: 2, name: 'Pastilhas de freio', sku: 'BRK-PAD-F02', category: 'Freios', categoryColor: 'text-purple-600 bg-purple-50', quantity: 24, minQuantity: 8, price: 45.00, status: 'Em Estoque', statusColor: 'text-green-600 bg-green-50' },
  { id: 3, name: 'Filtro de ar — Universal', sku: 'FLT-AIR-003', category: 'Filtros', categoryColor: 'text-gray-600 bg-gray-100', quantity: 5, minQuantity: 10, price: 18.75, status: 'Pouco Estoque', statusColor: 'text-orange-600 bg-orange-50' },
  { id: 4, name: 'Vela de ignição NGK Iridium', sku: 'SPK-NGK-IR04', category: 'Ignição', categoryColor: 'text-emerald-600 bg-emerald-50', quantity: 48, minQuantity: 16, price: 8.90, status: 'Em Estoque', statusColor: 'text-green-600 bg-green-50' },
  { id: 5, name: 'Bateria de 12 V e 60 Ah', sku: 'BAT-12V-60-05', category: 'Elétrica', categoryColor: 'text-yellow-600 bg-yellow-50', quantity: 4, minQuantity: 4, price: 89.00, status: 'Pouco Estoque', statusColor: 'text-orange-600 bg-orange-50' },
];

export default function Stock() {
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
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total de itens</p>
            <h3 className="text-2xl font-bold text-gray-800">248</h3>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex justify-center items-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Estoque Baixo</p>
            <h3 className="text-2xl font-bold text-orange-500">5</h3>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex justify-center items-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Categorias</p>
            <h3 className="text-2xl font-bold text-gray-800">12</h3>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-500 flex justify-center items-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Valor Total</p>
            <h3 className="text-2xl font-bold text-gray-800">R$ 18.430,00</h3>
          </div>
        </div>
      </div>

      {/* Tabela Branca */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Barra de Ferramentas da Tabela */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 p-2 rounded-lg text-orange-500">
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Lista de itens</h2>
              <p className="text-xs text-gray-400">Todos os itens de estoque registrados</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="text" placeholder="Procurar itens" className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
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
            {fakeStock.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex justify-center items-center font-bold ${item.categoryColor.replace('text-', 'bg-').replace('600', '100')} ${item.categoryColor}`}>
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-max gap-1 ${item.categoryColor}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current"></div> {item.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-700">
                  <span className={item.quantity <= item.minQuantity ? 'text-orange-500' : ''}>{item.quantity}</span> <span className="text-gray-400 font-normal">unidades</span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-700">{item.minQuantity}</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-800">
                  R$ {item.price.toFixed(2).replace('.', ',')}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-max gap-1 ${item.statusColor}`}>
                    ▲ {item.status}
                  </span>
                </td>
                <td className="px-6 py-4">

                  <div className="flex justify-center gap-2">
                     <button className="text-blue-500 hover:text-blue-700 p-1 bg-blue-50 rounded"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                     <button className="text-orange-500 hover:text-orange-700 p-1 bg-orange-50 rounded"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Rodapé da Tabela */}
        <div className="px-6 py-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center">
           <span>Mostrando <strong className="text-gray-700">1-5</strong> de 248 itens</span>
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