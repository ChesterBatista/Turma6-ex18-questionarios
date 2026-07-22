let formulariosRespostas = [];
let perguntasRespostas = [];
let respostasRecebidas = [];

function obterFormularioIdFiltro() {
  const parametros = new URLSearchParams(
    window.location.search
  );

  return parametros.get("formularioId");
}

function carregarRespostas() {
  const lista = document.getElementById(
    "lista-respostas"
  );

  if (!lista) {
    return;
  }

  Promise.all([
    fetch(`${API_URL}/respostas`).then((resposta) => {
      if (!resposta.ok) {
        throw new Error("Erro ao carregar respostas.");
      }

      return resposta.json();
    }),

    fetch(`${API_URL}/formularios`).then((resposta) => {
      if (!resposta.ok) {
        throw new Error("Erro ao carregar formulários.");
      }

      return resposta.json();
    }),

    fetch(`${API_URL}/perguntas`).then((resposta) => {
      if (!resposta.ok) {
        throw new Error("Erro ao carregar perguntas.");
      }

      return resposta.json();
    })
  ])
    .then(([respostas, formularios, perguntas]) => {
      respostasRecebidas = respostas;
      formulariosRespostas = formularios;
      perguntasRespostas = perguntas;

      exibirRespostas();
    })
    .catch((erro) => {
      console.error(erro);

      lista.innerHTML = `
        <div class="mensagem-erro">
          Não foi possível carregar as respostas.
          Verifique se o servidor está rodando.
        </div>
      `;
    });
}

function exibirRespostas() {
  const lista = document.getElementById(
    "lista-respostas"
  );

  const formularioIdFiltro =
    obterFormularioIdFiltro();

  let respostasFiltradas = [
    ...respostasRecebidas
  ];

  if (formularioIdFiltro) {
    respostasFiltradas =
      respostasFiltradas.filter((resposta) => {
        return (
          String(resposta.formularioId) ===
          String(formularioIdFiltro)
        );
      });
  }

  respostasFiltradas.sort((a, b) => {
    return (
      new Date(b.enviadoEm) -
      new Date(a.enviadoEm)
    );
  });

  lista.innerHTML = "";

  if (respostasFiltradas.length === 0) {
    lista.innerHTML = `
      <p class="mensagem-vazia">
        Nenhuma resposta encontrada.
      </p>
    `;
    return;
  }

  respostasFiltradas.forEach((resposta) => {
    const formulario = formulariosRespostas.find(
      (item) =>
        String(item.id) ===
        String(resposta.formularioId)
    );

    const tituloFormulario = formulario
      ? formulario.titulo
      : "Formulário não encontrado";

    const card = document.createElement("article");

    card.className = "card-resposta";

    card.innerHTML = `
      <div class="cabecalho-resposta">
  <div>
    <h3>${tituloFormulario}</h3>

    <p>
      <strong>Nome:</strong>
      ${resposta.nome}
    </p>

    <p>
      <strong>E-mail:</strong>
      ${resposta.email}
    </p>

    <p>
      <strong>Enviado em:</strong>
      ${formatarDataHora(resposta.enviadoEm)}
    </p>
  </div>

  <span class="badge-historico">
    Histórico preservado
  </span>
</div>

      <div class="conteudo-resposta">
        ${montarRespostasDetalhadas(resposta)}
      </div>
    `;

    lista.appendChild(card);
  });
}

function montarRespostasDetalhadas(resposta) {
  if (
    !resposta.respostas ||
    resposta.respostas.length === 0
  ) {
    return `
      <p>
        Nenhuma resposta foi registrada.
      </p>
    `;
  }

  return resposta.respostas
    .map((item, indice) => {
      const pergunta = perguntasRespostas.find(
        (perguntaAtual) =>
          String(perguntaAtual.id) ===
          String(item.perguntaId)
      );

      const enunciado = pergunta
        ? pergunta.enunciado
        : "Pergunta não encontrada";

      const valorFormatado =
        formatarValorResposta(item.valor);

      return `
        <div class="item-resposta">
          <p class="pergunta-resposta">
            ${indice + 1}. ${enunciado}
          </p>

          <p class="valor-resposta">
            ${valorFormatado}
          </p>
        </div>
      `;
    })
    .join("");
}

function formatarValorResposta(valor) {
  if (Array.isArray(valor)) {
    return valor.join(", ");
  }

  return valor || "Sem resposta";
}

function formatarDataHora(data) {
  if (!data) {
    return "Data não informada";
  }

  return new Date(data).toLocaleString("pt-BR");
}



carregarRespostas();