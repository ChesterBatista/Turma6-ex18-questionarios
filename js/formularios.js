let formularioOriginal = null;
let formularioPossuiRespostas = false;
let perguntasFormularioBloqueadas = false;

function carregarFormularios() {
  const tabela = document.getElementById("tabela-formularios");

  if (!tabela) {
    return;
  }

  fetch(`${API_URL}/formularios`)
    .then((resposta) => {
      if (!resposta.ok) {
        throw new Error("Erro ao carregar formulários.");
      }

      return resposta.json();
    })
    .then((formularios) => {
      exibirFormularios(formularios);
    })
    .catch((erro) => {
      console.error(erro);

      tabela.innerHTML = `
        <tr>
          <td colspan="5">
            Não foi possível carregar os formulários.
          </td>
        </tr>
      `;
    });
}

function exibirFormularios(formularios) {
  const tabela = document.getElementById("tabela-formularios");
  tabela.innerHTML = "";

  if (formularios.length === 0) {
    tabela.innerHTML = `
      <tr>
        <td colspan="5">
          Nenhum formulário cadastrado.
        </td>
      </tr>
    `;
    return;
  }

  formularios.forEach((formulario) => {
    const linha = document.createElement("tr");

    const quantidadePerguntas =
      formulario.perguntas?.length || 0;

    const vigencia = formatarVigencia(
      formulario.dataInicio,
      formulario.dataFim
    );

    linha.innerHTML = `
      <td>${formulario.titulo}</td>
      <td>${formatarStatus(formulario.status)}</td>
      <td>${quantidadePerguntas}</td>
      <td>${vigencia}</td>
      <td>
        <a
          class="btn btn-editar"
          href="formulario-form.html?id=${formulario.id}"
        >
          Editar
        </a>

        <a
          class="btn btn-responder"
          href="responder.html?id=${formulario.id}"
        >
          Responder
        </a>

        <a
          class="btn btn-respostas"
          href="respostas.html?formularioId=${formulario.id}"
        >
          Respostas
        </a>

        <button
          class="btn btn-excluir"
          onclick='excluirFormulario(
            ${JSON.stringify(formulario.id)}
          )'
        >
          Excluir
        </button>
      </td>
    `;

    tabela.appendChild(linha);
  });
}

function formatarStatus(status) {
  const statusFormatados = {
    rascunho: "Rascunho",
    publicado: "Publicado",
    encerrado: "Encerrado"
  };

  return statusFormatados[status] || status;
}

function formatarData(data) {
  if (!data) {
    return null;
  }

  const partes = data.slice(0, 10).split("-");

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarVigencia(dataInicio, dataFim) {
  if (!dataInicio && !dataFim) {
    return "Sem período definido";
  }

  const inicio = formatarData(dataInicio) || "Sem início";
  const fim = formatarData(dataFim) || "Sem fim";

  return `${inicio} até ${fim}`;
}

function excluirFormulario(id) {
  fetch(`${API_URL}/respostas`)
    .then((resposta) => {
      if (!resposta.ok) {
        throw new Error(
          "Erro ao consultar as respostas do formulário."
        );
      }

      return resposta.json();
    })
    .then((respostas) => {
      const possuiRespostas = respostas.some(
        (resposta) =>
          String(resposta.formularioId) === String(id)
      );

      if (possuiRespostas) {
        alert(
          "Este formulário já possui respostas e não pode ser excluído. Altere o status para encerrado."
        );
        return;
      }

      const confirmou = confirm(
        "Tem certeza que deseja excluir este formulário?"
      );

      if (!confirmou) {
        return;
      }

      return fetch(`${API_URL}/formularios/${id}`, {
        method: "DELETE"
      });
    })
    .then((resposta) => {
      if (!resposta) {
        return;
      }

      if (!resposta.ok) {
        throw new Error("Erro ao excluir formulário.");
      }

      carregarFormularios();
    })
    .catch((erro) => {
      console.error(erro);

      alert(
        "Não foi possível realizar a exclusão do formulário."
      );
    });
}

function exibirErroFormulario(mensagem) {
  const elemento = document.getElementById(
    "mensagem-erro-formulario"
  );

  if (!elemento) {
    return;
  }

  elemento.textContent = mensagem;
  elemento.hidden = false;
}

function ocultarErroFormulario() {
  const elemento = document.getElementById(
    "mensagem-erro-formulario"
  );

  if (!elemento) {
    return;
  }

  elemento.textContent = "";
  elemento.hidden = true;
}

function carregarPerguntasFormulario(
  perguntasSelecionadas = []
) {
  const lista = document.getElementById("lista-perguntas");

  if (!lista) {
    return Promise.resolve([]);
  }

  return fetch(`${API_URL}/perguntas`)
    .then((resposta) => {
      if (!resposta.ok) {
        throw new Error("Erro ao carregar perguntas.");
      }

      return resposta.json();
    })
    .then((perguntas) => {
      lista.innerHTML = "";

      if (perguntas.length === 0) {
        lista.innerHTML = `
          <p>
            Nenhuma pergunta cadastrada.
            Cadastre perguntas antes de montar um formulário.
          </p>
        `;

        return perguntas;
      }

      perguntas.forEach((pergunta) => {
        const item = document.createElement("label");
        item.className = "item-pergunta";

        const selecionada = perguntasSelecionadas.some(
          (id) => String(id) === String(pergunta.id)
        );

        item.innerHTML = `
          <input
            type="checkbox"
            name="perguntas"
            value="${pergunta.id}"
            ${selecionada ? "checked" : ""}
          />

          <span>
            <strong>${pergunta.enunciado}</strong>
            <small>
              ${formatarTipoPergunta(pergunta.tipo)}
            </small>
          </span>
        `;

        lista.appendChild(item);
      });

      return perguntas;
    })
    .catch((erro) => {
      console.error(erro);

      lista.innerHTML = `
        <p class="mensagem-erro">
          Não foi possível carregar as perguntas.
        </p>
      `;

      return [];
    });
}

function formatarTipoPergunta(tipo) {
  const tipos = {
    multipla_escolha: "Múltipla escolha",
    texto_curto: "Texto curto",
    texto_longo: "Texto longo",
    checkbox: "Checkbox"
  };

  return tipos[tipo] || tipo;
}

function obterPerguntasSelecionadas() {
  const marcadas = document.querySelectorAll(
    'input[name="perguntas"]:checked'
  );

  return Array.from(marcadas).map(
    (campo) => campo.value
  );
}

function preencherFormularioFormulario(formulario) {
  document.getElementById("titulo").value =
    formulario.titulo;

  document.getElementById("descricao").value =
    formulario.descricao || "";

  document.getElementById("status").value =
    formulario.status;

  document.getElementById("dataInicio").value =
    formulario.dataInicio
      ? formulario.dataInicio.slice(0, 10)
      : "";

  document.getElementById("dataFim").value =
    formulario.dataFim
      ? formulario.dataFim.slice(0, 10)
      : "";
}

function verificarFormularioRespondido(id) {
  return fetch(`${API_URL}/respostas`)
    .then((resposta) => {
      if (!resposta.ok) {
        throw new Error(
          "Erro ao consultar respostas vinculadas."
        );
      }

      return resposta.json();
    })
    .then((respostas) => {
      return respostas.some(
        (resposta) =>
          String(resposta.formularioId) === String(id)
      );
    });
}

function bloquearPerguntasFormulario() {
  perguntasFormularioBloqueadas = true;

  const camposPerguntas = document.querySelectorAll(
    'input[name="perguntas"]'
  );

  camposPerguntas.forEach((campo) => {
    campo.disabled = true;
  });

  const lista = document.getElementById(
    "lista-perguntas"
  );

  if (!lista) {
    return;
  }

  const aviso = document.createElement("div");

  aviso.className = "mensagem-aviso";

  aviso.textContent =
    aviso.textContent =
  "Este formulário já possui respostas. As perguntas vinculadas não podem ser alteradas.";

  lista.parentNode.insertBefore(aviso, lista);
}


function initFormFormulario() {
  const form = document.getElementById(
    "form-formulario"
  );

  if (!form) {
    return;
  }

  const parametros = new URLSearchParams(
    window.location.search
  );

  const id = parametros.get("id");

  if (id) {
  document.getElementById("titulo-form").textContent =
    "Editar formulário";

  Promise.all([
    fetch(`${API_URL}/formularios/${id}`)
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error(
            "Formulário não encontrado."
          );
        }

        return resposta.json();
      }),

    verificarFormularioRespondido(id)
  ])
    .then(([formulario, possuiRespostas]) => {
      formularioOriginal = formulario;
      formularioPossuiRespostas = possuiRespostas;

      preencherFormularioFormulario(formulario);

      return carregarPerguntasFormulario(
        formulario.perguntas || []
      );
    })
    .then(() => {
      if (formularioPossuiRespostas) {
  bloquearPerguntasFormulario();
}
    })
    .catch((erro) => {
      console.error(erro);

      exibirErroFormulario(
        "Não foi possível carregar o formulário."
      );
    });
} else {
  carregarPerguntasFormulario();
}

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();

    ocultarErroFormulario();

    const titulo = document
      .getElementById("titulo")
      .value
      .trim();

    const descricao = document
      .getElementById("descricao")
      .value
      .trim();

    const status =
      document.getElementById("status").value;

    const dataInicio =
      document.getElementById("dataInicio").value;

    const dataFim =
      document.getElementById("dataFim").value;

    const perguntasSelecionadas =
  obterPerguntasSelecionadas();

const perguntas = perguntasFormularioBloqueadas
  ? formularioOriginal.perguntas
  : perguntasSelecionadas;

    if (!titulo) {
      exibirErroFormulario(
        "O título do formulário é obrigatório."
      );
      return;
    }

    const statusValidos = [
      "rascunho",
      "publicado",
      "encerrado"
    ];

    if (!statusValidos.includes(status)) {
      exibirErroFormulario(
        "Selecione um status válido."
      );
      return;
    }

    if (perguntas.length === 0) {
      exibirErroFormulario(
        "Selecione pelo menos uma pergunta."
      );
      return;
    }

    if (
      dataInicio &&
      dataFim &&
      new Date(dataFim) < new Date(dataInicio)
    ) {
      exibirErroFormulario(
        "A data final não pode ser anterior à data inicial."
      );
      return;
    }

    const formulario = {
      titulo,
      descricao,
      perguntas,
      status
    };

    if (dataInicio) {
      formulario.dataInicio =
        new Date(`${dataInicio}T00:00:00`).toISOString();
    }

    if (dataFim) {
      formulario.dataFim =
        new Date(`${dataFim}T23:59:59`).toISOString();
    }

    if (!id) {
      formulario.criadoEm =
        new Date().toISOString();
    }

    if (id && formularioOriginal?.criadoEm) {
  formulario.criadoEm =
    formularioOriginal.criadoEm;
    }

    const url = id
      ? `${API_URL}/formularios/${id}`
      : `${API_URL}/formularios`;

    const metodo = id ? "PUT" : "POST";

    fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formulario)
    })
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error(
            "Erro ao salvar o formulário."
          );
        }

        return resposta.json();
      })
      .then(() => {
        window.location.href =
          "formularios.html";
      })
      .catch((erro) => {
        console.error(erro);

        exibirErroFormulario(
          "Não foi possível salvar o formulário."
        );
      });
  });
}
initFormFormulario();
carregarFormularios();