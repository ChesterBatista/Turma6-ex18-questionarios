let formularioAtual = null;
let perguntasAtuais = [];

function obterFormularioId() {
  const parametros = new URLSearchParams(
    window.location.search
  );

  return parametros.get("id");
}

function formularioDisponivel(formulario) {
  if (formulario.status !== "publicado") {
    return false;
  }

  const agora = new Date();

  if (
    formulario.dataInicio &&
    agora < new Date(formulario.dataInicio)
  ) {
    return false;
  }

  if (
    formulario.dataFim &&
    agora > new Date(formulario.dataFim)
  ) {
    return false;
  }

  return true;
}

function carregarFormularioPublico() {
  const conteudo = document.getElementById(
    "conteudo-formulario"
  );

  if (!conteudo) {
    return;
  }

  const formularioId = obterFormularioId();

  if (!formularioId) {
    conteudo.innerHTML = `
      <div class="mensagem-erro">
        Formulário não informado.
      </div>
    `;
    return;
  }

  Promise.all([
    fetch(`${API_URL}/formularios/${formularioId}`)
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error("Formulário não encontrado.");
        }

        return resposta.json();
      }),

    fetch(`${API_URL}/perguntas`)
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error("Erro ao carregar perguntas.");
        }

        return resposta.json();
      })
  ])
    .then(([formulario, perguntas]) => {
      formularioAtual = formulario;

      perguntasAtuais = perguntas.filter((pergunta) =>
        formulario.perguntas.some(
          (id) => String(id) === String(pergunta.id)
        )
      );

      if (!formularioDisponivel(formulario)) {
        conteudo.innerHTML = `
          <div class="mensagem-erro">
            Este formulário está indisponível ou encerrado.
          </div>
        `;
        return;
      }

      if (perguntasAtuais.length === 0) {
        conteudo.innerHTML = `
          <div class="mensagem-erro">
            Este formulário não possui perguntas válidas.
          </div>
        `;
        return;
      }

      renderizarFormulario();
    })
    .catch((erro) => {
      console.error(erro);

      conteudo.innerHTML = `
        <div class="mensagem-erro">
          Não foi possível carregar o formulário.
        </div>
      `;
    });
}

function renderizarFormulario() {
  const conteudo = document.getElementById(
    "conteudo-formulario"
  );

  conteudo.innerHTML = `
    <div class="cabecalho-formulario-publico">
      <h2>${formularioAtual.titulo}</h2>

      <p>
        ${
          formularioAtual.descricao ||
          "Responda às perguntas abaixo."
        }
      </p>
    </div>

    <form id="form-resposta">
      <label for="nome">Nome</label>

      <input
        type="text"
        id="nome"
        name="nome"
        minlength="2"
        required
      />

      <label for="email">E-mail</label>

      <input
        type="email"
        id="email"
        name="email"
        required
      />

      <div id="perguntas-formulario"></div>

      <div
        id="mensagem-resposta"
        class="mensagem-erro"
        hidden
      ></div>

      <button type="submit" class="btn btn-salvar">
        Enviar respostas
      </button>
    </form>
  `;

  const areaPerguntas = document.getElementById(
    "perguntas-formulario"
  );

  perguntasAtuais.forEach((pergunta, indice) => {
    areaPerguntas.appendChild(
      criarCampoPergunta(pergunta, indice)
    );
  });

  document
    .getElementById("form-resposta")
    .addEventListener("submit", enviarResposta);
}

function criarCampoPergunta(pergunta, indice) {
  const grupo = document.createElement("div");

  grupo.className = "grupo-pergunta";
  grupo.dataset.perguntaId = pergunta.id;

  const obrigatoriaTexto = pergunta.obrigatoria
    ? '<span class="obrigatoria">*</span>'
    : "";

  grupo.innerHTML = `
    <p class="titulo-pergunta">
      ${indice + 1}. ${pergunta.enunciado}
      ${obrigatoriaTexto}
    </p>
  `;

  if (pergunta.tipo === "texto_curto") {
    grupo.innerHTML += `
      <input
        type="text"
        name="pergunta-${pergunta.id}"
        maxlength="200"
        ${pergunta.obrigatoria ? "required" : ""}
      />
    `;
  }

  if (pergunta.tipo === "texto_longo") {
    grupo.innerHTML += `
      <textarea
        name="pergunta-${pergunta.id}"
        rows="5"
        ${pergunta.obrigatoria ? "required" : ""}
      ></textarea>
    `;
  }

  if (pergunta.tipo === "multipla_escolha") {
    pergunta.alternativas.forEach((alternativa) => {
      grupo.innerHTML += `
        <label class="opcao-resposta">
          <input
            type="radio"
            name="pergunta-${pergunta.id}"
            value="${alternativa}"
            ${pergunta.obrigatoria ? "required" : ""}
          />

          <span>${alternativa}</span>
        </label>
      `;
    });
  }

  if (pergunta.tipo === "checkbox") {
    pergunta.alternativas.forEach((alternativa) => {
      grupo.innerHTML += `
        <label class="opcao-resposta">
          <input
            type="checkbox"
            name="pergunta-${pergunta.id}"
            value="${alternativa}"
          />

          <span>${alternativa}</span>
        </label>
      `;
    });
  }

  return grupo;
}

function mostrarMensagemResposta(mensagem) {
  const elemento = document.getElementById(
    "mensagem-resposta"
  );

  elemento.textContent = mensagem;
  elemento.hidden = false;
}

function ocultarMensagemResposta() {
  const elemento = document.getElementById(
    "mensagem-resposta"
  );

  elemento.textContent = "";
  elemento.hidden = true;
}

function normalizarEmail(email) {
  return email.trim().toLowerCase();
}

function coletarRespostas() {
  const respostas = [];

  for (const pergunta of perguntasAtuais) {
    const nomeCampo = `pergunta-${pergunta.id}`;

    if (pergunta.tipo === "checkbox") {
      const selecionadas = document.querySelectorAll(
        `input[name="${nomeCampo}"]:checked`
      );

      const valores = Array.from(selecionadas).map(
        (campo) => campo.value
      );

      if (pergunta.obrigatoria && valores.length === 0) {
        return {
          erro: `Responda a pergunta: ${pergunta.enunciado}`
        };
      }

      if (valores.length > 0) {
        respostas.push({
          perguntaId: String(pergunta.id),
          valor: valores
        });
      }

      continue;
    }

    const campo = document.querySelector(
      `[name="${nomeCampo}"]:checked`
    ) || document.querySelector(
      `[name="${nomeCampo}"]`
    );

    const valor = campo
      ? campo.value.trim()
      : "";

    if (pergunta.obrigatoria && !valor) {
      return {
        erro: `Responda a pergunta: ${pergunta.enunciado}`
      };
    }

    if (valor) {
      respostas.push({
        perguntaId: String(pergunta.id),
        valor
      });
    }
  }

  return { respostas };
}

function verificarRespostaDuplicada(
  formularioId,
  email
) {
  return fetch(`${API_URL}/respostas`)
    .then((resposta) => {
      if (!resposta.ok) {
        throw new Error(
          "Erro ao verificar respostas anteriores."
        );
      }

      return resposta.json();
    })
    .then((respostas) => {
      return respostas.some((resposta) => {
        return (
          String(resposta.formularioId) ===
            String(formularioId) &&
          normalizarEmail(resposta.email) ===
            normalizarEmail(email)
        );
      });
    });
}

function enviarResposta(evento) {
  evento.preventDefault();

  ocultarMensagemResposta();

  const nome = document
    .getElementById("nome")
    .value
    .trim();

  const email = document
    .getElementById("email")
    .value
    .trim();

  if (nome.length < 2) {
    mostrarMensagemResposta(
      "O nome deve possuir pelo menos 2 caracteres."
    );
    return;
  }

  const emailValido =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!emailValido) {
    mostrarMensagemResposta(
      "Digite um e-mail válido."
    );
    return;
  }

  const resultado = coletarRespostas();

  if (resultado.erro) {
    mostrarMensagemResposta(resultado.erro);
    return;
  }

  verificarRespostaDuplicada(
    formularioAtual.id,
    email
  )
    .then((duplicada) => {
      if (duplicada) {
        throw new Error(
          "Este e-mail já respondeu este formulário."
        );
      }

      const respostaFormulario = {
        formularioId: String(formularioAtual.id),
        nome,
        email: normalizarEmail(email),
        respostas: resultado.respostas,
        enviadoEm: new Date().toISOString()
      };

      return fetch(`${API_URL}/respostas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(respostaFormulario)
      });
    })
    .then((resposta) => {
      if (!resposta.ok) {
        throw new Error(
          "Não foi possível enviar as respostas."
        );
      }

      return resposta.json();
    })
    .then(() => {
  const conteudo = document.getElementById(
    "conteudo-formulario"
  );

  conteudo.innerHTML = `
    <div class="mensagem-sucesso">
      <h2>Resposta enviada com sucesso!</h2>

      <p>
        Obrigado por responder ao formulário.
      </p>

      <p>
        Você será redirecionado em alguns segundos...
      </p>

      <a
        href="formularios.html"
        class="btn btn-novo"
      >
        Voltar agora
      </a>
    </div>
  `;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  setTimeout(() => {
    window.location.href = "formularios.html";
  }, 3000);
})
    .catch((erro) => {
      console.error(erro);

      mostrarMensagemResposta(erro.message);
    });
}

carregarFormularioPublico();