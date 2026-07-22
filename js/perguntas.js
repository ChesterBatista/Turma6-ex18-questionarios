let perguntaPossuiRespostas = false;
let perguntaOriginal = null;

function carregarPerguntas() {
  const tabela = document.getElementById("tabela-perguntas");

  if (!tabela) {
    return;
  }

  fetch(`${API_URL}/perguntas`)
    .then((resposta) => {
      if (!resposta.ok) {
        throw new Error("Erro ao carregar as perguntas.");
      }

      return resposta.json();
    })
    .then((perguntas) => {
      exibirPerguntas(perguntas);
    })
    .catch((erro) => {
      console.error(erro);

      tabela.innerHTML = `
        <tr>
          <td colspan="5">
            Não foi possível carregar as perguntas.
          </td>
        </tr>
      `;
    });
}

function exibirPerguntas(perguntas) {
  const tabela = document.getElementById("tabela-perguntas");

  tabela.innerHTML = "";

  perguntas.forEach((pergunta) => {
    const linha = document.createElement("tr");

    const alternativas = pergunta.alternativas
      ? pergunta.alternativas.join(", ")
      : "Não se aplica";

    const obrigatoria = pergunta.obrigatoria
      ? "Sim"
      : "Não";

    linha.innerHTML = `
      <td>${pergunta.enunciado}</td>
      <td>${formatarTipo(pergunta.tipo)}</td>
      <td>${obrigatoria}</td>
      <td>${alternativas}</td>
      <td>
        <a
          class="btn btn-editar"
          href="pergunta-form.html?id=${pergunta.id}"
        >
          Editar
        </a>

        <button
          class="btn btn-excluir"
          onclick='excluirPergunta(${JSON.stringify(pergunta.id)})'
        >
          Excluir
        </button>
      </td>
    `;

    tabela.appendChild(linha);
  });
}

function formatarTipo(tipo) {
  const tipos = {
    multipla_escolha: "Múltipla escolha",
    texto_curto: "Texto curto",
    texto_longo: "Texto longo",
    checkbox: "Checkbox"
  };

  return tipos[tipo] || tipo;
}

function excluirPergunta(id) {
  fetch(`${API_URL}/respostas`)
    .then((resposta) => {
      if (!resposta.ok) {
        throw new Error(
          "Erro ao consultar respostas vinculadas."
        );
      }

      return resposta.json();
    })
    .then((respostas) => {
      const perguntaFoiRespondida = respostas.some(
        (resposta) =>
          resposta.respostas?.some(
            (item) =>
              String(item.perguntaId) === String(id)
          )
      );

      if (perguntaFoiRespondida) {
        alert(
          "Esta pergunta já possui respostas vinculadas e não pode ser excluída."
        );
        return;
      }

      const confirmou = confirm(
        "Tem certeza que deseja excluir esta pergunta?"
      );

      if (!confirmou) {
        return;
      }

      return fetch(`${API_URL}/perguntas/${id}`, {
        method: "DELETE"
      });
    })
    .then((resposta) => {
      if (!resposta) {
        return;
      }

      if (!resposta.ok) {
        throw new Error("Erro ao excluir a pergunta.");
      }

      carregarPerguntas();
    })
    .catch((erro) => {
      console.error(erro);

      alert(
        "Não foi possível realizar a exclusão da pergunta."
      );
    });
}

function atualizarCampoAlternativas() {
  const tipo = document.getElementById("tipo");
  const grupoAlternativas =
    document.getElementById("grupo-alternativas");
  const campoAlternativas =
    document.getElementById("alternativas");

  if (!tipo || !grupoAlternativas || !campoAlternativas) {
    return;
  }

  const possuiAlternativas =
    tipo.value === "multipla_escolha" ||
    tipo.value === "checkbox";

  grupoAlternativas.hidden = !possuiAlternativas;

  if (!possuiAlternativas) {
    campoAlternativas.value = "";
  }
}

function obterAlternativas() {
  const campoAlternativas =
    document.getElementById("alternativas");

  if (!campoAlternativas) {
    return [];
  }

  return campoAlternativas.value
    .split("\n")
    .map((alternativa) => alternativa.trim())
    .filter((alternativa) => alternativa !== "");
}

function validarAlternativas(tipo, alternativas) {
  if (
    tipo !== "multipla_escolha" &&
    tipo !== "checkbox"
  ) {
    return "";
  }

  const quantidadeMinima =
    tipo === "multipla_escolha" ? 2 : 3;

  const quantidadeMaxima =
    tipo === "multipla_escolha" ? 10 : 15;

  if (alternativas.length < quantidadeMinima) {
    return `Esse tipo exige no mínimo ${quantidadeMinima} alternativas.`;
  }

  if (alternativas.length > quantidadeMaxima) {
    return `Esse tipo permite no máximo ${quantidadeMaxima} alternativas.`;
  }

  const alternativasNormalizadas = alternativas.map(
    (alternativa) => alternativa.toLowerCase()
  );

  const alternativasUnicas = new Set(
    alternativasNormalizadas
  );

  if (
    alternativasUnicas.size !== alternativas.length
  ) {
    return "Não é permitido cadastrar alternativas repetidas.";
  }

  return "";
}

function exibirMensagemErro(mensagem) {
  const mensagemErro =
    document.getElementById("mensagem-erro");

  if (!mensagemErro) {
    return;
  }

  mensagemErro.textContent = mensagem;
  mensagemErro.hidden = false;
}

function ocultarMensagemErro() {
  const mensagemErro =
    document.getElementById("mensagem-erro");

  if (!mensagemErro) {
    return;
  }

  mensagemErro.textContent = "";
  mensagemErro.hidden = true;
}

function preencherFormularioPergunta(pergunta) {
  document.getElementById("enunciado").value =
    pergunta.enunciado;

  document.getElementById("tipo").value =
    pergunta.tipo;

  document.getElementById("obrigatoria").checked =
    pergunta.obrigatoria;

  atualizarCampoAlternativas();

  if (pergunta.alternativas) {
    document.getElementById("alternativas").value =
      pergunta.alternativas.join("\n");
  }
}

function verificarPerguntaRespondida(id) {
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
      return respostas.some((resposta) =>
        resposta.respostas?.some(
          (item) =>
            String(item.perguntaId) === String(id)
        )
      );
    });
}

function bloquearCamposEstruturais() {
  const tipo = document.getElementById("tipo");
  const alternativas =
    document.getElementById("alternativas");

  tipo.disabled = true;
  alternativas.disabled = true;

  const grupoAlternativas =
    document.getElementById("grupo-alternativas");

  const aviso = document.createElement("div");

  aviso.className = "mensagem-aviso";

  aviso.textContent =
    "Esta pergunta já possui respostas. O tipo e as alternativas não podem ser alterados.";

  grupoAlternativas.parentNode.insertBefore(
    aviso,
    grupoAlternativas
  );
}


function initFormPergunta() {
  const form = document.getElementById("form-pergunta");

  if (!form) {
    return;
  }

  const tipo = document.getElementById("tipo");

  tipo.addEventListener(
    "change",
    atualizarCampoAlternativas
  );

  const parametros = new URLSearchParams(
    window.location.search
  );

  const id = parametros.get("id");

  if (id) {
    document.getElementById("titulo-form").textContent =
      "Editar pergunta";

    Promise.all([
      fetch(`${API_URL}/perguntas/${id}`)
        .then((resposta) => {
          if (!resposta.ok) {
            throw new Error("Pergunta não encontrada.");
          }

          return resposta.json();
        }),

      verificarPerguntaRespondida(id)
    ])
      .then(([pergunta, possuiRespostas]) => {
        perguntaOriginal = pergunta;
        perguntaPossuiRespostas = possuiRespostas;

        preencherFormularioPergunta(pergunta);

        if (perguntaPossuiRespostas) {
          bloquearCamposEstruturais();
        }
      })
      .catch((erro) => {
        console.error(erro);

        exibirMensagemErro(
          "Não foi possível carregar a pergunta."
        );
      });
  }

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();

    ocultarMensagemErro();

    const enunciado = document
      .getElementById("enunciado")
      .value
      .trim();

    const tipoPergunta =
      document.getElementById("tipo").value;

    const obrigatoria =
      document.getElementById("obrigatoria").checked;

    if (!enunciado) {
      exibirMensagemErro(
        "O enunciado da pergunta é obrigatório."
      );
      return;
    }

    const tiposValidos = [
      "multipla_escolha",
      "texto_curto",
      "texto_longo",
      "checkbox"
    ];

    if (!tiposValidos.includes(tipoPergunta)) {
      exibirMensagemErro(
        "Selecione um tipo válido de pergunta."
      );
      return;
    }

    const alternativas = obterAlternativas();

    const erroAlternativas = validarAlternativas(
      tipoPergunta,
      alternativas
    );

    if (erroAlternativas) {
      exibirMensagemErro(erroAlternativas);
      return;
    }

    const pergunta = {
      enunciado,
      tipo: perguntaPossuiRespostas
        ? perguntaOriginal.tipo
        : tipoPergunta,
      obrigatoria
    };

    if (perguntaPossuiRespostas) {
      if (perguntaOriginal.alternativas) {
        pergunta.alternativas =
          perguntaOriginal.alternativas;
      }
    } else if (
      tipoPergunta === "multipla_escolha" ||
      tipoPergunta === "checkbox"
    ) {
      pergunta.alternativas = alternativas;
    }

    const url = id
      ? `${API_URL}/perguntas/${id}`
      : `${API_URL}/perguntas`;

    const metodo = id ? "PUT" : "POST";

    if (!id) {
      pergunta.criadaEm = new Date().toISOString();
    }

    if (id && perguntaOriginal?.criadaEm) {
      pergunta.criadaEm = perguntaOriginal.criadaEm;
    }

    fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(pergunta)
    })
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error(
            "Erro ao salvar a pergunta."
          );
        }

        return resposta.json();
      })
      .then(() => {
        window.location.href = "perguntas.html";
      })
      .catch((erro) => {
        console.error(erro);

        exibirMensagemErro(
          "Não foi possível salvar a pergunta."
        );
      });
  });
}

initFormPergunta();
carregarPerguntas();