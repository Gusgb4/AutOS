import { Link } from "react-router-dom";
import { ArrowLeft, Wrench } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link to="/login" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF7518]">
              <Wrench size={18} className="text-white" />
            </div>
            <span className="font-semibold text-[#1F1F1F]">AutOS</span>
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#1F1F1F]"
          >
            <ArrowLeft size={15} />
            Voltar
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1F1F1F]">
            Política de Privacidade
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Última atualização: 30 de setembro de 2026
          </p>
        </div>

        <div className="space-y-8 rounded-2xl bg-white p-8 shadow-sm">
          <Section title="1. Introdução">
            <p>
              Esta Política de Privacidade descreve como o AutOS ("nós",
              "Plataforma") coleta, utiliza, armazena e protege dados
              pessoais no contexto do uso do sistema de gestão de oficinas
              mecânicas, em conformidade com a Lei Geral de Proteção de
              Dados Pessoais (Lei nº 13.709/2018 — "LGPD").
            </p>
            <p>
              Esta política se aplica a dois grupos de titulares de dados:{" "}
              <strong>(a) usuários da Plataforma</strong> — proprietários e
              funcionários das Oficinas que criam conta no AutOS — e{" "}
              <strong>(b) clientes finais das Oficinas</strong> — pessoas
              cujos dados são inseridos no sistema pelos usuários para fins
              de gestão de atendimento e ordens de serviço.
            </p>
          </Section>

          <Section title="2. Papéis: controlador e operador de dados">
            <p>
              Em relação aos dados de <strong>usuários da Plataforma</strong>{" "}
              (nome, e-mail e senha usados para login), o AutOS atua como{" "}
              <strong>Controlador</strong>, sendo responsável direto pelas
              decisões sobre esse tratamento.
            </p>
            <p>
              Em relação aos dados de <strong>clientes das Oficinas</strong>{" "}
              (nome, telefone, documento e dados de veículos inseridos pelo
              usuário), a Oficina contratante atua como{" "}
              <strong>Controladora</strong> desses dados, e o AutOS atua como{" "}
              <strong>Operador</strong>, processando as informações
              exclusivamente conforme as instruções da Oficina e para a
              finalidade de fornecer o Serviço contratado.
            </p>
          </Section>

          <Section title="3. Dados que coletamos">
            <p>
              <strong>3.1 Dados de cadastro de usuário:</strong> nome
              completo, e-mail e senha (armazenada de forma criptografada,
              nunca em texto plano), perfil de acesso (Proprietário ou
              Funcionário).
            </p>
            <p>
              <strong>3.2 Dados inseridos pelo usuário sobre clientes da
              Oficina:</strong> nome, telefone e documento (CPF ou CNPJ).
            </p>
            <p>
              <strong>3.3 Dados de veículos:</strong> placa, marca, modelo,
              ano e vínculo com o cliente proprietário do veículo.
            </p>
            <p>
              <strong>3.4 Dados técnicos e de uso:</strong> endereço IP, tipo
              de navegador, registros de acesso (logs), data e hora de uso,
              coletados automaticamente para fins de segurança e
              diagnóstico técnico.
            </p>
            <p>
              <strong>Observação:</strong> Atualmente a Plataforma{" "}
              <em>não coleta</em> endereço, e-mail ou status de
              relacionamento dos clientes das Oficinas — apenas os campos
              listados acima. Esta política será atualizada caso novos tipos
              de dados passem a ser tratados.
            </p>
          </Section>

          <Section title="4. Finalidade do tratamento">
            <p>Os dados são tratados para as seguintes finalidades:</p>
            <ul>
              <li>Viabilizar a autenticação e o controle de acesso à Plataforma;</li>
              <li>Permitir o cadastro, consulta, atualização e exclusão de clientes e veículos pela Oficina;</li>
              <li>Gerar registros de ordens de serviço vinculados a clientes e veículos;</li>
              <li>Emitir comunicações operacionais relacionadas ao funcionamento da conta;</li>
              <li>Prevenir fraudes, investigar incidentes de segurança e cumprir obrigações legais ou regulatórias.</li>
            </ul>
          </Section>

          <Section title="5. Base legal para o tratamento">
            <p>
              O tratamento de dados de usuários da Plataforma se baseia na{" "}
              <strong>execução de contrato</strong> (art. 7º, V, LGPD),
              necessário para a prestação do Serviço contratado.
            </p>
            <p>
              O tratamento de dados de clientes das Oficinas é realizado pelo
              AutOS como Operador, com base na relação contratual entre a
              Oficina (Controladora) e seus próprios clientes. Cabe à
              Oficina garantir que possui base legal adequada — como{" "}
              <strong>execução de contrato</strong> ou{" "}
              <strong>legítimo interesse</strong> — para inserir esses dados
              na Plataforma, conforme previsto em nossos Termos de Uso.
            </p>
          </Section>

          <Section title="6. Compartilhamento de dados">
            <p>Não vendemos dados pessoais a terceiros. Dados podem ser compartilhados apenas com:</p>
            <ul>
              <li>Provedores de infraestrutura em nuvem e banco de dados, sob obrigações contratuais de confidencialidade e segurança;</li>
              <li>Autoridades públicas, mediante ordem judicial ou exigência legal;</li>
              <li>Prestadores de serviços de suporte técnico, estritamente para fins de manutenção e resolução de problemas na Plataforma.</li>
            </ul>
          </Section>

          <Section title="7. Armazenamento e segurança">
            <p>
              Senhas de usuários são armazenadas utilizando algoritmo de hash
              criptográfico (bcrypt), nunca em texto plano. O acesso à
              Plataforma é protegido por autenticação baseada em token (JWT)
              com tempo de expiração configurado.
            </p>
            <p>
              Adotamos medidas técnicas e administrativas razoáveis para
              proteger os dados contra acessos não autorizados, perda,
              alteração ou destruição, incluindo controle de acesso por
              perfil de usuário (Proprietário/Funcionário) e comunicação
              criptografada entre cliente e servidor (HTTPS).
            </p>
            <p>
              Apesar dos esforços empregados, nenhum sistema é
              completamente livre de riscos. Em caso de incidente de
              segurança que possa acarretar risco relevante aos titulares,
              notificaremos a Autoridade Nacional de Proteção de Dados (ANPD)
              e os afetados, conforme exigido pela LGPD.
            </p>
          </Section>

          <Section title="8. Retenção de dados">
            <p>
              Os dados são mantidos enquanto a conta da Oficina estiver
              ativa e pelo período adicional necessário para cumprimento de
              obrigações legais, fiscais ou para exercício regular de
              direitos em processos administrativos ou judiciais.
            </p>
            <p>
              Ao excluir um cliente ou veículo da Plataforma, os dados
              correspondentes são removidos permanentemente do banco de
              dados ativo, conforme a operação de exclusão executada pelo
              próprio usuário.
            </p>
          </Section>

          <Section title="9. Direitos dos titulares">
            <p>Nos termos da LGPD, os titulares de dados podem solicitar:</p>
            <ul>
              <li>Confirmação da existência de tratamento e acesso aos dados;</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a LGPD;</li>
              <li>Portabilidade dos dados a outro fornecedor de serviço;</li>
              <li>Informação sobre entidades com as quais os dados foram compartilhados;</li>
              <li>Revogação do consentimento, quando aplicável.</li>
            </ul>
            <p>
              Usuários da Plataforma podem exercer esses direitos
              diretamente pelo suporte do AutOS. Clientes finais de uma
              Oficina — que não possuem conta direta no AutOS — devem
              direcionar suas solicitações à Oficina com a qual mantêm
              relacionamento, que atua como Controladora desses dados.
            </p>
          </Section>

          <Section title="10. Cookies e tecnologias similares">
            <p>
              A Plataforma utiliza armazenamento local do navegador (local
              storage) para manter a sessão de autenticação do usuário
              ativa. Não utilizamos cookies de rastreamento publicitário de
              terceiros.
            </p>
          </Section>

          <Section title="11. Transferência internacional de dados">
            <p>
              Caso a infraestrutura de hospedagem utilizada pelo AutOS esteja
              localizada fora do Brasil, eventuais transferências
              internacionais de dados serão realizadas em conformidade com
              os mecanismos previstos na LGPD, garantindo nível adequado de
              proteção aos titulares.
            </p>
          </Section>

          <Section title="12. Alterações desta política">
            <p>
              Esta Política de Privacidade pode ser atualizada
              periodicamente. Alterações relevantes serão comunicadas por
              e-mail ou aviso na Plataforma, com indicação da nova data de
              vigência no topo deste documento.
            </p>
          </Section>

          <Section title="13. Encarregado de Dados (DPO) e contato">
            <p>
              Para exercer seus direitos como titular de dados ou esclarecer
              dúvidas sobre esta política, entre em contato através do canal
              de suporte disponível na Plataforma, indicando claramente sua
              solicitação relacionada à proteção de dados pessoais.
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-base font-bold text-[#1F1F1F]">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-gray-600 [&_li]:ml-4 [&_li]:list-disc [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}