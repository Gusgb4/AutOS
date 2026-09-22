import { prisma } from "../config/prisma";

export async function getProductivity(mesAno: string) {
  // Converte "2026-09" em datas de início e fim do mês
  const [ano, mes] = mesAno.split("-");
  const dataInicio = new Date(Number(ano), Number(mes) - 1, 1);
  const dataFim = new Date(Number(ano), Number(mes), 0, 23, 59, 59);

  // Procura os utilizadores/mecânicos e as suas Ordens de Serviço desse mês
  const mecanicos = await prisma.user.findMany({
    where: { 
      // Se os mecânicos usarem outro perfil (ex: "MECHANIC"), podes alterar aqui
      perfil: "PROPRIETARIO" 
    },
    include: {
      ordens_como_mecanico: {
        where: {
          created_at: { gte: dataInicio, lte: dataFim }
        }
      }
    }
  });

  return mecanicos.map((mec) => {
    const totalServicos = mec.ordens_como_mecanico.length;
    // Soma os valores das OS. Se a tua coluna na base de dados se chamar apenas "valor", ajusta abaixo:
    const valorGerado = mec.ordens_como_mecanico.reduce((soma, os: any) => soma + Number(os.valorTotal || os.valor || 0), 0);
    
    return {
      id: mec.id,
      nome: mec.nome,
      totalServicos,
      valorGerado,
      comissaoEstimada: valorGerado * 0.30 // 30% da comissão
    };
  });
}