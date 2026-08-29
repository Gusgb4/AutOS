import React from 'react';
import { Link } from 'react-router-dom';

export default function NewStockItem() {
  return (
    <div className="p-8 min-h-screen bg-[#F8F9FA] font-sans flex justify-center">
      
      {/* Container limitador para centralizar tudo */}
      <div className="w-full max-w-4xl">
        
        {/* Cabeçalho da Página */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Adicionar novo item</h1>
            <p className="text-gray-500 mt-1">Preencha os detalhes para cadastrar um novo item de estoque.</p>
          </div>
          <Link to="/estoque" className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-50 shadow-sm transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Voltar para o inventário
          </Link>
        </div>

        {/* Container Principal Branco */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full">
          
          {/* Título da Seção */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex justify-center items-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Informação do item</h2>
              <p className="text-xs text-gray-400 mt-1">Todos os campos marcados com <span className="text-red-500">*</span> são obrigatórios</p>
            </div>
          </div>

          {/* Formulário Grid */}
          <form className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* Campo: Nome do Item */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nome do item</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>
                </div>
                <input type="text" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition" placeholder="Ex: carburador" />
              </div>
              <p className="text-xs text-gray-400 mt-2">Insira um nome de item claro e descritivo.</p>
            </div>

            {/* Campo: Categoria */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Categoria <span className="text-orange-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/></svg>
                </div>
                <select className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition">
                  <option value="" disabled selected>Selecione uma categoria</option>
                  <option value="freios">Freios</option>
                  <option value="lubrificantes">Lubrificantes</option>
                  <option value="filtros">Filtros</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Escolha a categoria mais relevante.</p>
            </div>

            {/* Campo: Quantidade Atual */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Quantidade Atual <span className="text-orange-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
                </div>
                <input type="number" className="w-full pl-10 pr-16 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition" placeholder="0" />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-xs font-semibold">
                  units
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Quantas unidades estão atualmente em estoque?</p>
            </div>

            {/* Campo: Quantidade Mínima */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Quantidade Mínima <span className="text-orange-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <input type="number" className="w-full pl-10 pr-20 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition" placeholder="0" />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-xs font-semibold">
                  unidades
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">O alerta será acionado quando o estoque cair abaixo desse valor.</p>
            </div>

            {/* Campo: Preço Unitário */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Preço Unitário <span className="text-orange-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 font-bold">
                  R$
                </div>
                <input type="number" step="0.01" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition" placeholder="0.00" />
              </div>
              <p className="text-xs text-gray-400 mt-2">Cost price per individual unit</p>
            </div>

            {/* Campo: Fornecedor */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Fornecedor</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zm-8.5 1.5l1.96 2.36L11 14.5V9.5h2v4.5l-1.5-1.5zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm13.5-8.5l1.96 2.36L19 14.5V9.5h2v4.5l-1.5-1.5zM18 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>
                </div>
                <input type="text" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition" placeholder="Ex: ..." />
              </div>
              <p className="text-xs text-gray-400 mt-2">Nome do fornecedor ou vendedor.</p>
            </div>

            {/* Banner de Alerta */}
            <div className="col-span-1 md:col-span-2 mt-2">
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 flex gap-4 items-start">
                <div className="text-orange-500 mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-orange-700">Alerta de estoque baixo</h4>
                  <p className="text-xs text-orange-600 mt-1">Quando a quantidade atual cair para o nível mínimo ou abaixo dele, o sistema sinalizará automaticamente o item e notificará o gerente da loja.</p>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="col-span-1 md:col-span-2 flex justify-end gap-4 mt-6 pt-6 border-t border-gray-100">
              <Link to="/estoque" className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                Cancelar
              </Link>
              <button type="button" className="px-6 py-2.5 bg-[#F97316] text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-orange-600 transition shadow-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
                Salvar item
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}