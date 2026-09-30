import { Link } from "react-router-dom";
import { ArrowLeft, Wrench } from "lucide-react";

export default function TermsOfService() {
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
          <h1 className="text-2xl font-bold text-[#1F1F1F]">Termos de Uso</h1>
          <p className="mt-2 text-sm text-gray-500">
            Última atualização: 30 de setembro de 2026
          </p>
        </div>

        <div className="space-y-8 rounded-2xl bg-white p-8 shadow-sm">
          <Section title="1. Aceitação dos Termos">
            <p>
              Estes Termos de Uso ("Termos") regem o acesso e uso da
              plataforma AutOS ("Plataforma", "Serviço"), um sistema de gestão
              para oficinas mecânicas que permite o cadastro de clientes,
              veículos, ordens de serviço, controle de estoque e informações
              financeiras.
            </p>
            <p>
              Ao criar uma conta ou utilizar a Plataforma, você declara ter
              lido, compreendido e concordado integralmente com estes Termos e
              com nossa{" "}
              <Link to="/privacidade" className="text-[#FF7518] hover:underline">
                Política de Privacidade
              </Link>
              . Caso não concorde com qualquer disposição aqui prevista, você
              não deve utilizar o Serviço.
            </p>
          </Section>

          <Section title="2. Quem pode usar o AutOS">
            <p>
              O AutOS destina-se a pessoas físicas e jurídicas que exerçam
              atividade de reparação, manutenção ou comércio automotivo
              ("Oficina" ou "Cliente Contratante"). Para utilizar a
              Plataforma, você declara:
            </p>
            <ul>
              <li>Ter no mínimo 18 anos de idade ou ser representante legal de uma pessoa jurídica;</li>
              <li>Ter capacidade civil e legal para firmar este contrato;</li>
              <li>Fornecer informações verdadeiras, completas e atualizadas no momento do cadastro.</li>
            </ul>
          </Section>

          <Section title="3. Contas de usuário e perfis de acesso">
            <p>
              A Plataforma opera com dois perfis de acesso: <strong>Proprietário</strong>,
              com controle administrativo total sobre a conta da Oficina, e{" "}
              <strong>Funcionário</strong>, com acesso operacional às
              funcionalidades definidas pelo Proprietário.
            </p>
            <p>
              Você é integralmente responsável por manter a confidencialidade
              de sua senha e por todas as atividades realizadas em sua conta.
              O AutOS deve ser notificado imediatamente em caso de uso não
              autorizado ou suspeita de violação de segurança da conta.
            </p>
            <p>
              O Proprietário da conta é responsável por gerenciar os acessos
              concedidos a Funcionários, incluindo a revogação de acesso ao
              término do vínculo com a Oficina.
            </p>
          </Section>

          <Section title="4. Dados inseridos por você">
            <p>
              Ao utilizar o AutOS, você poderá inserir na Plataforma dados
              pessoais de terceiros — como nome, telefone e documento (CPF ou
              CNPJ) de seus clientes, além de informações de veículos (placa,
              marca, modelo e ano).
            </p>
            <p>Ao inserir esses dados, você declara e garante que:</p>
            <ul>
              <li>Possui base legal e, quando aplicável, consentimento válido para o tratamento desses dados, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018);</li>
              <li>As informações inseridas são verdadeiras, precisas e obtidas de forma lícita;</li>
              <li>Você é o único responsável perante seus clientes e perante autoridades competentes pelo tratamento adequado desses dados, atuando o AutOS exclusivamente como operador técnico dessas informações, conforme detalhado em nossa Política de Privacidade.</li>
            </ul>
          </Section>

          <Section title="5. Uso adequado da Plataforma">
            <p>Você concorda em não utilizar o AutOS para:</p>
            <ul>
              <li>Inserir dados falsos, fraudulentos ou de terceiros sem base legal adequada;</li>
              <li>Tentar acessar áreas, contas ou dados de outras Oficinas sem autorização;</li>
              <li>Realizar engenharia reversa, copiar, revender ou sublicenciar a Plataforma sem autorização prévia por escrito;</li>
              <li>Utilizar o Serviço para fins ilícitos ou que violem direitos de terceiros;</li>
              <li>Sobrecarregar, interromper ou comprometer a segurança ou disponibilidade da infraestrutura do AutOS.</li>
            </ul>
          </Section>

          <Section title="6. Planos, pagamento e cancelamento">
            <p>
              O acesso a determinadas funcionalidades da Plataforma pode
              estar condicionado à contratação de um plano pago, cujas
              condições comerciais (valores, periodicidade e forma de
              cobrança) serão informadas no momento da contratação.
            </p>
            <p>
              Você pode cancelar sua assinatura a qualquer momento através
              das configurações da conta. O cancelamento não gera reembolso
              proporcional de períodos já pagos, salvo disposição legal em
              contrário ou previsão específica no plano contratado.
            </p>
            <p>
              Em caso de inadimplência, o AutOS poderá suspender o acesso à
              conta até a regularização do pagamento, mediante aviso prévio.
            </p>
          </Section>

          <Section title="7. Disponibilidade e suporte">
            <p>
              Envidamos esforços razoáveis para manter a Plataforma
              disponível de forma contínua, porém não garantimos operação
              ininterrupta ou livre de erros. Manutenções programadas serão,
              sempre que possível, comunicadas com antecedência.
            </p>
            <p>
              Recomendamos que você mantenha registros e backups próprios de
              informações críticas do seu negócio, sem prejuízo das rotinas
              de backup mantidas pelo AutOS.
            </p>
          </Section>

          <Section title="8. Propriedade intelectual">
            <p>
              Todo o software, design, marca, logotipo e demais elementos da
              Plataforma são de propriedade do AutOS ou de seus licenciantes,
              sendo protegidos pela legislação de propriedade intelectual
              aplicável. Nenhuma disposição destes Termos transfere qualquer
              direito de propriedade intelectual ao usuário.
            </p>
            <p>
              Os dados inseridos por você (clientes, veículos, ordens de
              serviço) permanecem de sua titularidade, sendo o AutOS
              responsável apenas pelo seu tratamento técnico nos termos da
              Política de Privacidade.
            </p>
          </Section>

          <Section title="9. Limitação de responsabilidade">
            <p>
              Na máxima extensão permitida pela legislação aplicável, o AutOS
              não será responsável por danos indiretos, lucros cessantes ou
              perda de dados decorrentes de uso indevido da Plataforma,
              falhas de conexão à internet do usuário, ou de eventos fora de
              nosso controle razoável.
            </p>
            <p>
              A responsabilidade do AutOS, quando aplicável, estará limitada
              ao valor pago pela Oficina nos últimos 12 (doze) meses
              anteriores ao evento gerador do dano.
            </p>
          </Section>

          <Section title="10. Alterações destes Termos">
            <p>
              Podemos atualizar estes Termos periodicamente para refletir
              mudanças legais, técnicas ou comerciais. Alterações
              significativas serão comunicadas por e-mail ou aviso na
              Plataforma com antecedência razoável. O uso continuado do
              Serviço após a entrada em vigor das alterações constitui
              aceitação dos novos Termos.
            </p>
          </Section>

          <Section title="11. Rescisão">
            <p>
              Você pode encerrar sua conta a qualquer momento. O AutOS
              poderá suspender ou encerrar contas que violem estes Termos,
              mediante notificação prévia, exceto em casos de violação grave
              ou risco à segurança da Plataforma, quando a suspensão poderá
              ser imediata.
            </p>
          </Section>

          <Section title="12. Legislação aplicável e foro">
            <p>
              Estes Termos são regidos pelas leis da República Federativa do
              Brasil. Fica eleito o foro da comarca do domicílio do
              contratante para dirimir quaisquer controvérsias decorrentes
              destes Termos, salvo disposição legal em contrário.
            </p>
          </Section>

          <Section title="13. Contato">
            <p>
              Dúvidas sobre estes Termos podem ser enviadas para o canal de
              suporte disponível dentro da Plataforma ou para o e-mail de
              contato informado no site oficial do AutOS.
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