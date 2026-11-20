// ===== CONEXÃO COM O BANCO REAL =====
const API = "http://localhost:8080";

// ===== ELEMENTOS DA PÁGINA =====
const lista = document.getElementById("lista");
const abas = document.querySelectorAll(".aba");

let abaAtual = "proximos";
let reservas = [];
let idUsuarioAtual = null;

const imagensCache = {};

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

        if (usuario) return usuario;
    }

    return null;
}

function obterIdUsuario() {

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

                if (usuario) {
                    return Number(
                        usuario.IdUsuario || usuario.idUsuario
                    );
                }

            } catch (erro) {
                // Continua procurando
            }
        }

        const idDireto =
            armazenamento.getItem("IdUsuario") ||
            armazenamento.getItem("idUsuario");

        if (idDireto && !isNaN(Number(idDireto))) {
            return Number(idDireto);
        }

        for (let i = 0; i < armazenamento.length; i++) {

            const valor = armazenamento.getItem(
                armazenamento.key(i)
            );

            try {

                const usuario = procurarUsuario(JSON.parse(valor));

                if (usuario) {
                    return Number(
                        usuario.IdUsuario || usuario.idUsuario
                    );
                }

            } catch (erro) {
                // Ignora valores que não sejam JSON
            }
        }
    }

    return null;
}

// ===== FUNÇÕES AUXILIARES =====
function escaparHTML(valor) {

    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

function formatarData(data) {

    if (!data) return "";

    const partes = String(data).substring(0, 10).split("-");

    if (partes.length !== 3) return data;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarHorario(hora) {

    if (!hora) return "";

    return String(hora).substring(0, 5);
}

function montarEndereco(reserva) {

    const endereco = [
        reserva.Endereco,
        reserva.Numero,
        reserva.Complemento
    ].filter(Boolean).join(", ");

    const localidade = [
        reserva.Bairro,
        reserva.Cidade,
        reserva.Estado
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

async function lerResposta(resposta) {

    const texto = await resposta.text();

    if (!texto) return {};

    try {
        return JSON.parse(texto);
    } catch (erro) {
        return { message: texto };
    }
}

// ===== CALCULAR SITUAÇÃO PELO RELÓGIO DO COMPUTADOR =====
function calcularSituacaoReserva(reserva) {

    const statusSalvo = String(
        reserva.StatusReserva || ""
    ).toLowerCase();

    if (
        statusSalvo === "cancelada" ||
        statusSalvo === "cancelado"
    ) {
        return "Cancelada";
    }

    const data = String(
        reserva.Dia || reserva.DataReserva || ""
    ).substring(0, 10);

    const horaInicio = formatarHorario(
        reserva.HoraChegada || reserva.horaInicio
    );

    const horaTermino = formatarHorario(
        reserva.HoraSaida || reserva.horaTermino
    );

    if (!data || !horaInicio || !horaTermino) {
        return reserva.StatusReserva || "Não informado";
    }

    const [ano, mes, dia] = data.split("-").map(Number);
    const [hi, mi] = horaInicio.split(":").map(Number);
    const [hf, mf] = horaTermino.split(":").map(Number);

    const inicioReserva = new Date(
        ano, mes - 1, dia, hi, mi, 0
    );

    const fimReserva = new Date(
        ano, mes - 1, dia, hf, mf, 0
    );

    const agora = new Date();

    if (agora < inicioReserva) {
        return "Pendente";
    }

    if (agora >= fimReserva) {
        return "Encerrado";
    }

    return "Em andamento";
}

// ===== BUSCAR IMAGEM PRINCIPAL =====
async function buscarImagemPrincipal(idEstacionamento) {

    if (!idEstacionamento) return "";

    if (!imagensCache[idEstacionamento]) {

        imagensCache[idEstacionamento] = fetch(
            `${API}/estacionamento/${idEstacionamento}/imagem-principal`
        )
            .then(async resposta => {

                if (!resposta.ok) return "";

                const imagem = await resposta.text();

                return prepararImagem(imagem);
            })
            .catch(erro => {

                console.error("Erro ao buscar imagem:", erro);

                return "";
            });
    }

    return imagensCache[idEstacionamento];
}

// ===== ORGANIZAR DADOS DA RESERVA =====
async function organizarReserva(reserva) {

    const imagem = await buscarImagemPrincipal(
        reserva.IdEstacionamento
    );

    return {

        ...reserva,

        Id: reserva.IdReserva,

        data: String(reserva.Dia || "").substring(0, 10),

        horaInicio: formatarHorario(reserva.HoraChegada),

        horaTermino: formatarHorario(reserva.HoraSaida),

        situacao: calcularSituacaoReserva(reserva),

        imagem: imagem,

        NomeEstacionamento:
            reserva.NomeEstacionamento || "Estacionamento",

        Endereco: montarEndereco(reserva),

        ValorHora: Number(reserva.ValorHora || 0),

        ValorTotal: reserva.ValorTotal != null
            ? Number(reserva.ValorTotal)
            : null
    };
}

// ===== CRIAR OS CARDS =====
function CriarCard(Rerserva) {

    const situacao = Rerserva.situacao;

    let estiloSelo = "";

    if (situacao === "Pendente") {

        estiloSelo = "background-color:#FFF3CD; color:#856404;";

    } else if (situacao === "Encerrado") {

        estiloSelo = "background-color:#FF6347; color:white; margin-top:35px;";

    } else if (situacao === "Cancelada") {

        estiloSelo = "background-color:#DDD; color:#555;";
    }

    const selo = `
        <div class="selo" style="${estiloSelo}">
            <h1>${escaparHTML(situacao)}</h1>
        </div>
    `;

    let valorEstimado = Rerserva.ValorTotal;

    if (valorEstimado == null) {

        const [hi, mi] = Rerserva.horaInicio.split(":").map(Number);
        const [hf, mf] = Rerserva.horaTermino.split(":").map(Number);

        const duracaoMinutos = (hf * 60 + mf) - (hi * 60 + mi);

        valorEstimado = (duracaoMinutos / 60) * Rerserva.ValorHora;
    }

    const valorFormatado = Number(valorEstimado).toLocaleString(
        "pt-BR",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

    // Somente reservas pendentes podem ser canceladas
    const cancelar = situacao === "Pendente"
        ? `
            <button
                class="cancelar"
                type="button"
                data-cancelar="${Rerserva.IdReserva}"
            >
                Cancelar
            </button>
        `
        : "";

    return `
        <div class="Cards">

            <img
                id="foto"
                src="${Rerserva.imagem}"
                alt="${escaparHTML(Rerserva.NomeEstacionamento)}"
                onerror="this.style.display='none'"
            >

            <div class="Nome_Endereco">
                <h1>${escaparHTML(Rerserva.NomeEstacionamento)}</h1>
                <br>
                <h2>${escaparHTML(Rerserva.Endereco)}</h2>
            </div>

            <div class="dados">
                <h1>Data</h1>
                <br>
                <h2>${formatarData(Rerserva.data)}</h2>
            </div>

            <div class="dados" style="margin-left:1px">
                <h1>Horario</h1>
                <br>
                <h2>${Rerserva.horaInicio} - ${Rerserva.horaTermino}</h2>
            </div>

            <div class="dados">
                <h1>Valor</h1>
                <br>
                <h2>R$ ${valorFormatado}</h2>
            </div>

            ${selo}

            <br>

            <button
                class="btn_detalhes"
                type="button"
                data-detalhes="${Rerserva.IdReserva}"
            >
                Ver detalhes
            </button>

            <br>

            ${cancelar}

        </div>
    `;
}

// ===== MOSTRAR LISTA =====
function mostrarLista() {

    const proximos = reservas.filter(reserva =>
        reserva.situacao === "Pendente" ||
        reserva.situacao === "Em andamento"
    );

    const historico = reservas.filter(reserva =>
        reserva.situacao === "Encerrado" ||
        reserva.situacao === "Cancelada"
    );

    const filtrados = abaAtual === "proximos"
        ? proximos
        : historico;

    if (filtrados.length === 0) {

        lista.innerHTML = abaAtual === "proximos"
            ? `
                <div class="vazio">
                    Você não tem agendamentos próximos.
                    <a href="./buscar.html">Buscar estacionamentos</a>
                </div>
            `
            : `
                <div class="vazio">
                    Nenhum agendamento no histórico ainda.
                </div>
            `;

        return;
    }

    lista.innerHTML = filtrados
        .map(reserva => CriarCard(reserva))
        .join("");
}

// ===== CANCELAR RESERVA NO BANCO =====
async function cancelarReserva(idReserva, botao) {

    const confirmacao = confirm(
        "Tem certeza de que deseja cancelar esta reserva?"
    );

    if (!confirmacao) return;

    botao.disabled = true;
    botao.textContent = "Cancelando...";

    try {

        // POST sem corpo e sem cabeçalhos personalizados
        const resposta = await fetch(
            `${API}/reserva/${idReserva}/usuario/${idUsuarioAtual}/cancelar`,
            {
                method: "POST"
            }
        );

        const resultado = await lerResposta(resposta);

        if (!resposta.ok || !resultado.success) {

            throw new Error(
                resultado.message ||
                "Não foi possível cancelar a reserva."
            );
        }

        // Atualizar situação na lista atual
        const reserva = reservas.find(
            item => Number(item.IdReserva) === Number(idReserva)
        );

        if (reserva) {

            reserva.StatusReserva = "Cancelada";
            reserva.situacao = "Cancelada";
        }

        showCustomAlert("Reserva cancelada com sucesso!");

        // Atualizar os cards: a reserva irá para o Histórico
        mostrarLista();

    } catch (erro) {

        console.error("Erro ao cancelar reserva:", erro);

        showCustomAlert(
            erro.message ||
            "Ocorreu um erro ao cancelar a reserva."
        );

        botao.disabled = false;
        botao.textContent = "Cancelar";
    }
}

// ===== TROCA DE ABAS =====
abas.forEach(botao => {

    botao.addEventListener("click", () => {

        abaAtual = botao.dataset.aba;

        abas.forEach(b => {

            const ativa = b === botao;

            b.classList.toggle("ativa", ativa);

            b.setAttribute(
                "aria-selected",
                String(ativa)
            );
        });

        mostrarLista();
    });
});

// ===== BOTÕES DOS CARDS =====
lista.addEventListener("click", async e => {

    const botao = e.target.closest("button");

    if (!botao) return;

    const idDetalhes = botao.dataset.detalhes;
    const idCancelar = botao.dataset.cancelar;

    // Abrir detalhes da reserva
    if (idDetalhes) {

        const reservaSelecionada = reservas.find(
            reserva =>
                Number(reserva.IdReserva) === Number(idDetalhes)
        );

        if (!reservaSelecionada) return;

        sessionStorage.setItem(
            "agendamentoSelecionado",
            idDetalhes
        );

        sessionStorage.setItem(
            "agendamentoSelecionadoDados",
            JSON.stringify(reservaSelecionada)
        );

        window.location.href =
            "../SiteCliente/detalhesReserva.html";

        return;
    }

    // Cancelar reserva
    if (idCancelar) {

        await cancelarReserva(idCancelar, botao);
    }
});

// ===== BUSCAR RESERVAS DO USUÁRIO =====
async function carregarReservas() {

    try {

        idUsuarioAtual = obterIdUsuario();

        if (!idUsuarioAtual) {

            lista.innerHTML = `
                <div class="vazio">
                    Não foi possível identificar o usuário.
                    Entre novamente na sua conta.
                </div>
            `;

            return;
        }

        lista.innerHTML = `
            <div class="vazio">
                Carregando seus agendamentos...
            </div>
        `;

        const resposta = await fetch(
            `${API}/reserva/usuario/${idUsuarioAtual}`
        );

        if (!resposta.ok) {

            const mensagem = await resposta.text();

            throw new Error(
                mensagem || "Não foi possível carregar os agendamentos."
            );
        }

        const dados = await resposta.json();

        if (!Array.isArray(dados)) {
            throw new Error("A API não retornou uma lista de reservas.");
        }

        reservas = await Promise.all(
            dados.map(reserva => organizarReserva(reserva))
        );

        mostrarLista();

    } catch (erro) {

        console.error("Erro ao carregar histórico:", erro);

        lista.innerHTML = `
            <div class="vazio">
                Não foi possível carregar seus agendamentos.
                Verifique a conexão com o servidor.
            </div>
        `;
    }
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

    }, 3000);}




// ===== EXECUÇÃO =====
document.addEventListener("DOMContentLoaded", carregarReservas);