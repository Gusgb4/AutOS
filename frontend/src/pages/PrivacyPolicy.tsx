import { LegalPage, Section } from "../components/legal/LegalPage";
import { OFICINA } from "../config/oficina";

// Escrita para dois públicos: os clientes da oficina e quem usa o sistema
export default function PrivacyPolicy() {
  return (
    <LegalPage titulo="Política de Privacidade">
      <Section title="1. Quem é o responsável pelos dados">
        <p>
          Esta política explica como a <strong>{OFICINA.nome}</strong> (CNPJ{" "}
          {OFICINA.cnpj}, {OFICINA.endereco}) trata dados pessoais no AutOS, o
          sistema que ela usa para atender seus clientes, conforme a Lei Geral
          de Proteção de Dados (Lei nº 13.709/2018, "LGPD").
        </p>
        <p>
          A {OFICINA.nome} é a <strong>controladora</strong>: é ela quem decide
          quais dados são tratados e para quê. Os serviços de hospedagem e quem
          faz a manutenção técnica do sistema atuam como{" "}
          <strong>operadores</strong>, tratando os dados só para manter o
          AutOS funcionando e conforme as instruções da oficina.
        </p>
        <p>Esta política vale para dois grupos de pessoas:</p>
        <ul>
          <li>
            <strong>Clientes da oficina</strong>, cujos dados são cadastrados
            no atendimento;
          </li>
          <li>
            <strong>Usuários do sistema</strong>: o proprietário e os
            funcionários da oficina.
          </li>
        </ul>
      </Section>

      <Section title="2. Quais dados são tratados">
        <p>
          <strong>Clientes:</strong> nome e telefone (obrigatórios); CPF ou
          CNPJ, e-mail e endereço (quando informados).
        </p>
        <p>
          <strong>Veículos:</strong> placa, marca, modelo, ano, quilometragem
          e, quando combinado com o cliente, os intervalos para o lembrete de
          revisão (em dias e em km).
        </p>
        <p>
          <strong>Serviços e pagamentos:</strong> ordens de serviço (serviços
          feitos, peças usadas, valores, datas, situação e observações) e
          pagamentos recebidos (valor, data e forma de pagamento).
        </p>
        <p>
          <strong>Usuários do sistema:</strong> nome, e-mail, senha (guardada
          de forma criptografada, nunca em texto puro) e perfil de acesso.
        </p>
        <p>
          <strong>Registros de acesso:</strong> em cada tentativa de login, o
          e-mail informado, o endereço IP, o navegador, a data e a hora e se a
          tentativa deu certo.
        </p>
      </Section>

      <Section title="3. Para que os dados são usados e com qual base legal">
        <ul>
          <li>
            <strong>Prestar o serviço contratado</strong>: identificar o
            cliente e o veículo, registrar o que foi feito e enviar o
            orçamento. Base: execução de contrato (art. 7º, V).
          </li>
          <li>
            <strong>Manter os registros financeiros e fiscais</strong> da
            oficina. Base: cumprimento de obrigação legal (art. 7º, II).
          </li>
          <li>
            <strong>Avisar o cliente da próxima revisão</strong>, quando ele
            tiver um lembrete cadastrado. Base: legítimo interesse (art. 7º,
            IX). O cliente pode pedir para não receber esses avisos a qualquer
            momento.
          </li>
          <li>
            <strong>Cobrar valores em aberto</strong>. Base: exercício regular
            de direitos (art. 7º, VI).
          </li>
          <li>
            <strong>Dar acesso ao sistema e mantê-lo seguro</strong>, incluindo
            o registro de acesso exigido pelo art. 15 do Marco Civil da
            Internet (Lei nº 12.965/2014). Base: execução de contrato e
            cumprimento de obrigação legal (art. 7º, V e II).
          </li>
        </ul>
        <p>
          Os dados não são usados para propaganda e não são vendidos a
          ninguém.
        </p>
      </Section>

      <Section title="4. Com quem os dados são compartilhados">
        <ul>
          <li>
            <strong>Hospedagem:</strong> o sistema, o servidor e o banco de
            dados funcionam em serviços de hospedagem na nuvem contratados para
            isso. Esses serviços guardam e processam os dados, mas não os usam
            para fins próprios.
          </li>
          <li>
            <strong>WhatsApp:</strong> orçamentos e avisos de revisão são
            enviados pelo próprio funcionário, pelo WhatsApp do aparelho dele.
            Ao enviar, o nome do cliente, o veículo e os valores passam pelo
            WhatsApp, que segue a política de privacidade dele.
          </li>
          <li>
            <strong>Autoridades públicas</strong>, quando houver ordem judicial
            ou exigência legal.
          </li>
        </ul>
      </Section>

      <Section title="5. Transferência para fora do Brasil">
        <p>
          Parte dos serviços de hospedagem usados pelo AutOS tem servidores
          fora do Brasil, por exemplo nos Estados Unidos. Por isso, os dados
          podem ser processados ou armazenados nesses países. Essa
          transferência se apoia nas garantias contratuais de proteção de
          dados oferecidas por esses serviços, conforme o art. 33 da LGPD.
        </p>
      </Section>

      <Section title="6. Como os dados são protegidos">
        <ul>
          <li>As senhas são guardadas com criptografia (bcrypt);</li>
          <li>
            Todo acesso exige login, e a sessão expira depois de algumas horas;
          </li>
          <li>
            Cada perfil vê só o que precisa: funcionários não acessam o
            financeiro nem os relatórios;
          </li>
          <li>
            Depois de várias tentativas de login erradas, o acesso fica
            bloqueado por alguns minutos;
          </li>
          <li>
            A comunicação entre o navegador e o servidor é criptografada
            (HTTPS).
          </li>
        </ul>
        <p>
          Se houver um incidente de segurança que possa causar risco ou dano
          relevante, a {OFICINA.nome} vai comunicar a Autoridade Nacional de
          Proteção de Dados (ANPD) e as pessoas afetadas, como manda a LGPD.
        </p>
      </Section>

      <Section title="7. Por quanto tempo os dados são guardados">
        <ul>
          <li>
            <strong>Clientes, veículos, ordens de serviço e pagamentos:</strong>{" "}
            enquanto o cliente for atendido pela oficina e por 5 anos depois do
            último serviço, que é o prazo das obrigações fiscais, de garantia e
            de cobrança. Passado esse prazo, a oficina pode remover os dados do
            cliente, como descrito no item 8.
          </li>
          <li>
            <strong>Registros de acesso:</strong> 6 meses. Depois disso, são
            apagados automaticamente.
          </li>
          <li>
            <strong>Usuários do sistema:</strong> enquanto a pessoa trabalhar na
            oficina. Depois, a conta é desativada e o histórico do que ela fez
            é mantido.
          </li>
        </ul>
      </Section>

      <Section title="8. Seus direitos">
        <p>Pela LGPD (art. 18), você pode pedir:</p>
        <ul>
          <li>A confirmação de que seus dados são tratados e o acesso a eles;</li>
          <li>A correção de dados incompletos, errados ou desatualizados;</li>
          <li>
            A anonimização, o bloqueio ou a eliminação de dados desnecessários
            ou tratados em desacordo com a lei;
          </li>
          <li>A portabilidade dos seus dados;</li>
          <li>
            A informação sobre com quem seus dados foram compartilhados;
          </li>
          <li>A oposição a um tratamento, como os avisos de revisão.</li>
        </ul>
        <p>
          <strong>Remoção dos dados:</strong> a pedido do cliente, a oficina
          apaga do sistema o nome, o telefone, o documento, o e-mail, o
          endereço e as placas dos veículos dele. O histórico de serviços e os
          valores continuam guardados, mas sem identificar a pessoa
          (anonimização, art. 16). As observações escritas nas ordens de
          serviço são revisadas no mesmo pedido. A remoção só pode ser feita
          depois que não houver serviço em andamento nem valor a receber.
        </p>
      </Section>

      <Section title="9. Armazenamento no navegador">
        <p>
          O sistema guarda no navegador (local storage) apenas o necessário
          para manter o usuário conectado. Não são usados cookies de
          rastreamento nem de propaganda.
        </p>
      </Section>

      <Section title="10. Contato e encarregado">
        <p>
          Para exercer seus direitos ou tirar dúvidas sobre esta política,
          fale com a {OFICINA.nome} pelo telefone{" "}
          <strong>{OFICINA.telefone}</strong> ou pessoalmente, no endereço{" "}
          {OFICINA.endereco}.
        </p>
        <p>
          Como agente de tratamento de pequeno porte, a oficina está
          dispensada de indicar um encarregado (Resolução CD/ANPD nº 2/2022,
          art. 11). O telefone acima é o canal de comunicação com os titulares
          dos dados.
        </p>
      </Section>

      <Section title="11. Alterações desta política">
        <p>
          Esta política pode ser atualizada quando o sistema ou a lei mudarem.
          A data da última atualização fica no topo desta página.
        </p>
      </Section>
    </LegalPage>
  );
}
