import { Link } from "react-router-dom";
import { LegalPage, Section } from "../components/legal/LegalPage";
import { OFICINA } from "../config/oficina";

// Escrito para quem usa o sistema: o proprietário e os funcionários da oficina
export default function TermsOfService() {
  return (
    <LegalPage titulo="Termos de Uso">
      <Section title="1. O que é o AutOS">
        <p>
          O AutOS é o sistema interno de gestão da oficina{" "}
          <strong>{OFICINA.nome}</strong> (CNPJ {OFICINA.cnpj}), usado para
          cadastrar clientes e veículos, abrir ordens de serviço, controlar o
          estoque de peças e acompanhar o financeiro.
        </p>
        <p>
          O acesso é restrito ao proprietário e aos funcionários da oficina.
          Não existe cadastro aberto: as contas são criadas pelo proprietário.
          Ao entrar no sistema, você concorda com estes Termos e com a{" "}
          <Link
            to="/politica-de-privacidade"
            className="text-[#FF7518] hover:underline"
          >
            Política de Privacidade
          </Link>
          .
        </p>
      </Section>

      <Section title="2. Contas e perfis de acesso">
        <p>O sistema tem dois perfis:</p>
        <ul>
          <li>
            <strong>Proprietário:</strong> acesso completo, incluindo
            financeiro, pagamentos, relatórios, estoque, equipe e a remoção de
            dados de clientes.
          </li>
          <li>
            <strong>Funcionário:</strong> acesso ao dia a dia da oficina:
            cadastra clientes e veículos, trabalha nas ordens de serviço e
            consulta o estoque. Não acessa financeiro, pagamentos e relatórios,
            e não edita nem arquiva cadastros.
          </li>
        </ul>
        <p>
          Toda conta nova começa com uma senha provisória, que precisa ser
          trocada no primeiro acesso. A senha é pessoal: não a compartilhe e
          avise o proprietário se desconfiar que alguém a conhece. Depois de
          várias tentativas de login erradas, o acesso fica bloqueado por
          alguns minutos.
        </p>
        <p>
          Quando alguém deixa a oficina, o proprietário deve desativar a conta
          dessa pessoa. O histórico do que ela fez no sistema é mantido.
        </p>
      </Section>

      <Section title="3. Uso adequado">
        <p>Ao usar o AutOS, você se compromete a:</p>
        <ul>
          <li>Usar o sistema só para as atividades da oficina;</li>
          <li>
            Cadastrar dados de clientes verdadeiros e só os necessários para o
            atendimento;
          </li>
          <li>
            Não escrever nas observações da OS dados pessoais que não sejam
            necessários ao serviço (como documentos ou telefones de terceiros);
          </li>
          <li>
            Não tentar acessar funções ou dados que não fazem parte do seu
            perfil.
          </li>
        </ul>
      </Section>

      <Section title="4. Dados dos clientes">
        <p>
          Os dados dos clientes pertencem à relação entre a oficina e cada
          cliente, e são tratados conforme a Política de Privacidade. Se um
          cliente pedir a remoção dos dados dele, encaminhe o pedido ao
          proprietário, que faz a remoção pelo perfil do cliente.
        </p>
      </Section>

      <Section title="5. Registro de acesso">
        <p>
          Cada tentativa de login, com ou sem sucesso, é registrada com o
          e-mail informado, o endereço IP, o navegador e a data e hora. Esses
          registros são guardados por 6 meses e depois apagados
          automaticamente, conforme o art. 15 do Marco Civil da Internet (Lei
          nº 12.965/2014).
        </p>
      </Section>

      <Section title="6. Disponibilidade">
        <p>
          O AutOS funciona em serviços de hospedagem na nuvem e depende da
          internet. Não há garantia de funcionamento sem interrupções, e o
          sistema pode ficar fora do ar para manutenção ou por falhas desses
          serviços.
        </p>
      </Section>

      <Section title="7. Alterações destes Termos">
        <p>
          Estes Termos podem ser atualizados quando o sistema ou a lei
          mudarem. A data da última atualização fica no topo desta página.
        </p>
      </Section>

      <Section title="8. Legislação e foro">
        <p>
          Estes Termos seguem as leis brasileiras. Fica eleito o foro da
          comarca de {OFICINA.foro} para resolver qualquer questão relacionada
          a eles.
        </p>
      </Section>

      <Section title="9. Contato">
        <p>
          Dúvidas sobre estes Termos podem ser tratadas diretamente com a{" "}
          {OFICINA.nome}, pelo telefone {OFICINA.telefone} ou no endereço{" "}
          {OFICINA.endereco}.
        </p>
      </Section>
    </LegalPage>
  );
}
