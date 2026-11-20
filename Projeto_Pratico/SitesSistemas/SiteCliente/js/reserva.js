
// ===== CONEXÃO COM O BANCO REAL =====
const API = "http://localhost:8080";

// ===== RECUPERAR USUÁRIO LOGADO =====
function procurarUsuario(dados) {

    if (!dados || typeof dados !== "object") {
        return null;
    }

    if (dados.IdUsuario || dados.idUsuario) {
        return dados;
    }

    const campos = [
        "usuario",
        "user",
        "cliente",
        "dadosUsuario"
    ];

    for (const campo of campos) {

        const usuario = procurarUsuario(dados[campo]);

        if (usuario) {
            return usuario;
        }
    }

    return null;
}

function obterUsuarioLogado() {

    const armazenamentos = [
        sessionStorage,
        localStorage
    ];

    const chaves = [
        "usuarioLogado",
        "usuario",
        "dadosUsuario",
        "user",
        "cliente",
        "usuarioAutenticado",
        "dadosUsuarioLogado"
    ];

    for (const armazenamento of armazenamentos) {

        for (const chave of chaves) {

            const valor = armazenamento.getItem(chave);

            if (!valor) continue;

            try {

                const usuario = procurarUsuario(JSON.parse(valor));

                if (usuario) return usuario;

            } catch (erro) {
                // Continua procurando
            }
        }

        const idDireto =
            armazenamento.getItem("IdUsuario") ||
            armazenamento.getItem("idUsuario");

        if (idDireto && !isNaN(Number(idDireto))) {

            return {
                IdUsuario: Number(idDireto)
            };
        }

        for (let i = 0; i < armazenamento.length; i++) {

            const chave = armazenamento.key(i);
            const valor = armazenamento.getItem(chave);

            try {

                const usuario = procurarUsuario(JSON.parse(valor));

                if (usuario) return usuario;

            } catch (erro) {
                // Ignora valores que não sejam JSON
            }
        }
    }

    return null;
}
function showCustomAlert(mensagem, tipo = "success") {

    const alerta =
    document.getElementById("alerta");

    const mensagemAlerta =
    document.getElementById("mensagemAlerta");

    mensagemAlerta.textContent = mensagem;

    alerta.classList.remove("erro");

    if (tipo === "error") {

        alerta.classList.add("erro");
    }

    alerta.classList.add("show");

    setTimeout(() => {

        alerta.classList.remove("show");

    }, 3000);
}function showCustomAlert(mensagem, tipo = "success") {

    const alerta =
    document.getElementById("alerta");

    const mensagemAlerta =
    document.getElementById("mensagemAlerta");

    mensagemAlerta.textContent = mensagem;

    alerta.classList.remove("erro");

    if (tipo === "error") {

        alerta.classList.add("erro");
    }

    alerta.classList.add("show");

    setTimeout(() => {

        alerta.classList.remove("show");

    }, 3000);
}

// ===== FUNÇÕES AUXILIARES =====

function formatarHorario(hora) {
    if (!hora) return "00:00";

    return String(hora).substring(0, 2);
}

function montarEndereco(estacionamento) {

    const endereco = [
        estacionamento.Endereco,
        estacionamento.Numero,
        estacionamento.Complemento
    ].filter(Boolean).join(", ");

    const localidade = [
        estacionamento.Bairro,
        estacionamento.Cidade,
        estacionamento.Estado
    ].filter(Boolean).join(" - ");

    return [endereco, localidade].filter(Boolean).join(" - ");
}

function prepararImagem(imagem) {

    if (!imagem) return "";

    imagem = String(imagem).trim();

    if (
        imagem.startsWith("http://") ||
        imagem.startsWith("https://") ||
        imagem.startsWith("/") ||
        imagem.startsWith("../") ||
        imagem.startsWith("data:")
    ) {
        return imagem;
    }

    if (/^[A-Za-z0-9+/=\r\n]+$/.test(imagem) && imagem.length > 100) {

        let formato = "image/jpeg";

        if (imagem.startsWith("iVBOR")) {
            formato = "image/png";
        } else if (imagem.startsWith("R0lGOD")) {
            formato = "image/gif";
        } else if (imagem.startsWith("UklGR")) {
            formato = "image/webp";
        }

        return `data:${formato};base64,${imagem.replace(/\s/g, "")}`;
    }

    return imagem;
}

function lerDadosSalvos(chave) {

    try {
        return JSON.parse(sessionStorage.getItem(chave) || "null");
    } catch (erro) {
        console.error("Erro ao recuperar:", chave, erro);
        return null;
    }
}

// ===== RECUPERAR DADOS DA RESERVA =====
function recuperarDadosReserva() {

    const estacionamentoSalvo = lerDadosSalvos(
        "estacionamentoSelecionado"
    );

    const periodoSalvo = lerDadosSalvos(
        "periodoReserva"
    );

    const IdEstacionamento = Number(
        sessionStorage.getItem("IdEstacionamento") ||
        estacionamentoSalvo?.IdEstacionamento ||
        estacionamentoSalvo?.id
    );

    const data = sessionStorage.getItem("dataReserva") ||
        periodoSalvo?.data;

    const horaInicio = sessionStorage.getItem("horaChegada") ||
        periodoSalvo?.horaInicio;

    const horaTermino = sessionStorage.getItem("horaSaida") ||
        periodoSalvo?.horaTermino;

    return {
        IdEstacionamento,
        data,
        horaInicio,
        horaTermino
    };
}

// ===== CALCULAR SITUAÇÃO PELO RELÓGIO DO COMPUTADOR =====
function calcularStatusReserva(data, horaSaida) {

    const [ano, mes, dia] = data.split("-").map(Number);
    const [hora, minuto] = horaSaida.split(":").map(Number);

    const terminoReserva = new Date(
        ano,
        mes - 1,
        dia,
        hora,
        minuto,
        0
    );

    const agora = new Date();

    if (agora >= terminoReserva) {
        return "Encerrado";
    }

    return "Em andamento";
}

// ===== INFORMAÇÕES DO ESTACIONAMENTO =====
function informacaoEstacionamento(estacionamento, dadosReserva) {

    const containerInformacoes = document.getElementById(
        "Informacao-estacionamento"
    );

    if (!containerInformacoes) {
        console.error('Container "Informacao-estacionamento" não encontrado.');
        return;
    }

    // Cálculo da duração
    const [hi, mi] = dadosReserva.horaInicio.split(":").map(Number);
    const [ht, mt] = dadosReserva.horaTermino.split(":").map(Number);

    const duracaoMinutos = (ht * 60 + mt) - (hi * 60 + mi);

    const horas = Math.floor(duracaoMinutos / 60);
    const minutos = duracaoMinutos % 60;

    const duracaoTexto =
        `${horas}h${minutos > 0 ? minutos + "min" : ""}`;

    // Valor estimado
    const valorEstimado = (
        (duracaoMinutos / 60) * estacionamento.Valores
    ).toFixed(2).replace(".", ",");

    const dataFormatada = dadosReserva.data
        .split("-")
        .reverse()
        .join("/");

    const cobertura = estacionamento.coberto === true
        ? "Coberto"
        : estacionamento.coberto === false
            ? "Descoberto"
            : "Não informado";

    const horario =
        estacionamento.inicio === "00:00" &&
        (
            estacionamento.termino === "00:00" ||
            estacionamento.termino === "24:00"
        )
            ? "24h"
            : `${estacionamento.inicio} às ${estacionamento.termino}`;

    containerInformacoes.innerHTML = `
        <div id="informa">

            <h1 id="estacionamento">Estacionamento selecionado</h1>

            <div class="estacionamento">

                <img
                    src="${estacionamento.imagem || ""}"
                    alt="imagem principal do estacionamento"
                />

                <h1>${estacionamento.NomeEstacionamento}</h1>

                <div class="endereco">
                    <h3>${estacionamento.Endereco}</h3>
                </div>

                <div id="icones">

                    <div class="icone" style="width: 120px;">
                        <img src="../SiteCliente/img/calendario.png" alt="Ícone de vagas">
                        <h2>${estacionamento.vagas} vagas</h2>
                    </div>

                    <div class="icone" style="margin-left:-6px">
                        <img src="../SiteCliente/img/carro.png" alt="Ícone do carro">
                        <h2>Coberto</h2>
                    </div>

                    <div class="icone" style="margin-left:-8px">
                        <img src="../SiteCliente/img/relogio.png" alt="Ícone do relógio">
                        <h2>${horario}</h2>
                    </div>

                </div>

            </div>

            <div class="linhas"></div>

            <div id="Dado">

                <h1>Dados da reserva</h1>

                <div class="dados">
                    <h2>Data</h2>
                    <p>${dataFormatada}</p>
                </div>

                <div class="dados">
                    <h2>Hora de início</h2>
                    <p>${dadosReserva.horaInicio}</p>
                </div>

                <div class="dados">
                    <h2>Hora do término</h2>
                    <p>${dadosReserva.horaTermino}</p>
                </div>

                <div class="dados">
                    <h2>Duração</h2>
                    <p>${duracaoTexto}</p>
                </div>

                <div class="dados">
                    <h2>Valor estimado</h2>
                    <p>R$ ${valorEstimado}</p>
                </div>

            </div>

            <div class="aviso">
                <h3>&#9432 O pagamento será realizado no local.</h3>
            </div>

        </div>
    `;
}

// ===== LISTAR MODELOS DE CARROS =====
function Modelo(carros, pessoa) {

    return carros;
}

// ===== LER RESPOSTA DA API =====
async function lerResposta(resposta) {

    const texto = await resposta.text();

    if (!texto) return {};

    try {
        return JSON.parse(texto);
    } catch (erro) {
        return {
            message: texto
        };
    }
}

// ===== EXIBIR INFORMAÇÕES DO VEÍCULO =====
function InformaçãoVeiculo(dadosReserva, carros, pessoa, estacionamento) {

    const containerInformacoes = document.getElementById(
        "Informacao-veiculo"
    );

    if (!containerInformacoes) {
        console.error('Container "Informacao-veiculo" não encontrado.');
        return;
    }

    const modelosCarros = Modelo(carros, pessoa);

    containerInformacoes.innerHTML = `
        <div id="geral">

            <h1>Dados do veículo</h1>

            <div id="Formulario1">

                <label for="veiculo">Selecione um veículo</label>
                <br>

                <select id="veiculo" name="veiculo" required>

                    <option value="" selected disabled>
                        Selecione...
                    </option>

                    ${modelosCarros.length > 0
                        ? modelosCarros.map(carro => `
                            <option value="${carro.IdCarro}">
                                ${carro.Modelo} - ${carro.Placa}
                            </option>
                        `).join("")
                        : `
                            <option value="" disabled>
                                Nenhum veículo cadastrado na conta
                            </option>
                        `
                    }

                </select>

            </div>

            <h2 id="ou">Ou cadastre o seu novo veiculo</h2>

            <div id="Formulario2">

                <form action="">

                    <div class="forms">
                        <label for="placa" name="placa">Placa(ex: ABC1023)</label>
                        <br>
                        <input
                            type="text"
                            name="placa"
                            id="placa"
                            placeholder="ABC2013"
                        >
                    </div>

                    <div class="forms">
                        <label for="modelo" name="modelo">Modelo do Veiculo</label>
                        <br>
                        <input
                            type="text"
                            name="modelo"
                            id="modelo"
                            placeholder="Ex:Civic"
                        >
                    </div>

                    <div class="forms">
                        <label for="cor" name="cor">Cor</label>
                        <br>
                        <input
                            type="text"
                            name="cor"
                            id="cor"
                            placeholder="Ex:Prata"
                        >
                    </div>

                    <div class="form-group">

                        <label for="veiculo">Selecione o tipo do veículo</label>
                        <br>

                        <select id="veiculo" name="veiculo" required>

                            <option value="" selected disabled>
                                Selecione...
                            </option>

                            <option value="carro">Carro</option>
                            <option value="moto">Moto</option>

                        </select>

                    </div>

                </form>

            </div>

            <button id="bt2">Confirmar a reserva</button>

        </div>
    `;

    // ===== CONFIRMAR RESERVA =====
    containerInformacoes.querySelector("#bt2").addEventListener("click", async () => {

        const botao = containerInformacoes.querySelector("#bt2");

        // Seleção do veículo existente
        const selectCarro = containerInformacoes.querySelector(
            "#Formulario1 select"
        );

        // Dados do novo veículo
        const placa = containerInformacoes.querySelector("#placa")
            .value.trim().toUpperCase();

        const modelo = containerInformacoes.querySelector("#modelo")
            .value.trim();

        const cor = containerInformacoes.querySelector("#cor")
            .value.trim();

        const tipo = containerInformacoes.querySelector(
            "#Formulario2 .form-group select"
        ).value;

        const idCarroSelecionado = selectCarro.value;

        const temDadosNovoCarro = Boolean(
            placa || modelo || cor || tipo
        );

        let idCarro = null;

        botao.disabled = true;
        botao.textContent = "Processando...";

        try {

            // ===== CADASTRAR NOVO VEÍCULO =====
            if (temDadosNovoCarro) {

                if (!placa || !modelo || !cor || !tipo) {

                    showCustomAlert("Preencha todos os dados do novo veículo.");
                    return;
                }

                const respostaCarro = await fetch(
                    `${API}/carro/usuario/${pessoa.IdUsuario}`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            Modelo: modelo,
                            Placa: placa,
                            cor: cor,
                            tipo: tipo,
                            marca: ""
                        })
                    }
                );

                const resultadoCarro = await lerResposta(respostaCarro);

                if (!respostaCarro.ok || !resultadoCarro.success) {

                    throw new Error(
                        resultadoCarro.message ||
                        "Não foi possível cadastrar o veículo."
                    );
                }

                idCarro = Number(resultadoCarro.IdCarro);

            } else {

                // ===== UTILIZAR VEÍCULO CADASTRADO =====
                if (!idCarroSelecionado) {

                    showCustomAlert("Selecione um veículo ou cadastre um novo.");
                    return;
                }

                idCarro = Number(idCarroSelecionado);
            }

            // ===== CALCULAR SITUAÇÃO =====
            const statusReserva = calcularStatusReserva(
                dadosReserva.data,
                dadosReserva.horaTermino
            );

            // ===== MONTAR DADOS DA RESERVA =====
            const dadosParaReserva = {

                IdUsuario: pessoa.IdUsuario,

                IdEstacionamento:
                    estacionamento.IdEstacionamento,

                IdCarro: idCarro,

                dataReserva: dadosReserva.data,

                horaChegada: dadosReserva.horaInicio,

                horaSaida: dadosReserva.horaTermino,

                StatusReserva: statusReserva
            };

            console.log("Dados enviados para reserva:", dadosParaReserva);

            // ===== SALVAR RESERVA NO BANCO =====
            const respostaReserva = await fetch(
                `${API}/reserva`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(dadosParaReserva)
                }
            );

            const resultadoReserva = await lerResposta(respostaReserva);

            if (!respostaReserva.ok || !resultadoReserva.success) {

                throw new Error(
                    resultadoReserva.message ||
                    "Não foi possível confirmar a reserva."
                );
            }

            // Guardar a confirmação
            sessionStorage.setItem(
                "reservaConfirmada",
                JSON.stringify(resultadoReserva)
            );

            showCustomAlert(
                `Reserva confirmada com sucesso!`
            );

        } catch (erro) {

            console.error("Erro ao confirmar reserva:", erro);

            showCustomAlert(
                erro.message ||
                "Ocorreu um erro ao confirmar a reserva."
            );

        } finally {

            botao.disabled = false;
            botao.textContent = "Confirmar a reserva";
        }
    });
}

// ===== CARREGAR ESTACIONAMENTO DO BANCO =====
async function buscarEstacionamento(idEstacionamento) {

    const resposta = await fetch(`${API}/estacionamento`);

    if (!resposta.ok) {
        throw new Error("Não foi possível consultar os estacionamentos.");
    }

    const estacionamentos = await resposta.json();

    const estacionamento = estacionamentos.find(p =>
        Number(p.IdEstacionamento) === Number(idEstacionamento)
    );

    if (!estacionamento) {
        throw new Error("Estacionamento não encontrado.");
    }

    // Buscar imagem principal
    let imagem = "";

    try {

        const respostaImagem = await fetch(
            `${API}/estacionamento/${idEstacionamento}/imagem-principal`
        );

        if (respostaImagem.ok) {

            const conteudo = await respostaImagem.text();

            imagem = prepararImagem(conteudo);
        }

    } catch (erro) {

        console.error(
            "Não foi possível carregar a imagem principal:",
            erro
        );
    }

    return {

        ...estacionamento,

        IdEstacionamento: estacionamento.IdEstacionamento,

        imagem: imagem,

        NomeEstacionamento: estacionamento.NomeEstacionamento,

        Endereco: montarEndereco(estacionamento),

        vagas: estacionamento.QtVagas ?? 0,

        Valores: Number(estacionamento.ValorHora ?? 0),

        inicio: formatarHorario(estacionamento.HorarioAbertura),

        termino: formatarHorario(estacionamento.HorarioFechamento),

        coberto: estacionamento.Coberto ?? null
    };
}

// ===== BUSCAR VEÍCULOS DO USUÁRIO =====
async function buscarCarros(idUsuario) {

    const resposta = await fetch(
        `${API}/carro/usuario/${idUsuario}`
    );

    if (!resposta.ok) {
        throw new Error("Não foi possível carregar os veículos do usuário.");
    }

    return await resposta.json();
}

// ===== INICIALIZAÇÃO DA TELA =====
async function exibir() {

    try {

        // Recuperar usuário logado
        const pessoa = obterUsuarioLogado();

        if (!pessoa || !(pessoa.IdUsuario || pessoa.idUsuario)) {

            showCustomAlert(
                "Não foi possível identificar o usuário logado. Entre na sua conta novamente."
            );

            return;
        }

        pessoa.IdUsuario = Number(
            pessoa.IdUsuario || pessoa.idUsuario
        );

        // Recuperar dados enviados pela tela de detalhes
        const dadosReserva = recuperarDadosReserva();

        if (
            !dadosReserva.IdEstacionamento ||
            !dadosReserva.data ||
            !dadosReserva.horaInicio ||
            !dadosReserva.horaTermino
        ) {

            showCustomAlert(
                "Os dados da reserva não foram encontrados. Volte aos detalhes do estacionamento."
            );

            return;
        }

        // Validar horários
        if (dadosReserva.horaTermino <= dadosReserva.horaInicio) {

            showCustomAlert("O horário de saída precisa ser depois da chegada.");
            return;
        }

        // Buscar estacionamento escolhido
        const estacionamento = await buscarEstacionamento(
            dadosReserva.IdEstacionamento
        );

        // Buscar veículos do usuário logado
        const carros = await buscarCarros(
            pessoa.IdUsuario
        );

        // Exibir informações do estacionamento
        informacaoEstacionamento(
            estacionamento,
            dadosReserva
        );

        // Exibir informações dos veículos
        InformaçãoVeiculo(
            dadosReserva,
            carros,
            pessoa,
            estacionamento
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar tela de reserva:",
            erro
        );

        showCustomAlert(
            erro.message ||
            "Não foi possível carregar as informações da reserva."
        );
    }
}

// ===== EXECUÇÃO =====
document.addEventListener("DOMContentLoaded", exibir);
