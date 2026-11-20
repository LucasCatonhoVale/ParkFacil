
// ===== CONEXÃO COM O BANCO REAL =====
const API = "http://localhost:8080";

// Dados da reserva selecionada
let reservaAtual = null;
let estacionamentoAtual = null;
let enderecoEstacionamento = "";
let telefoneEstacionamento = "";

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

            const chave = armazenamento.key(i);
            const valor = armazenamento.getItem(chave);

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

function formatarValor(valor) {

    return Number(valor || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
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

function montarEndereco(estacionamento) {

    const endereco = [
        estacionamento.Endereco,
        estacionamento.Numero,
        estacionamento.Complemento
    ].filter(Boolean).join(", ");

    const localidade = [
        estacionamento.Bairro,
        estacionamento.Cidade,
        estacionamento.Estado,
        estacionamento.Cep
    ].filter(Boolean).join(" - ");

    return [endereco, localidade].filter(Boolean).join(" - ");
}

// ===== CALCULAR DURAÇÃO =====
function calcularDuracao(horaInicio, horaTermino) {

    const [hi, mi] = horaInicio.split(":").map(Number);
    const [ht, mt] = horaTermino.split(":").map(Number);

    const inicio = hi * 60 + mi;
    const termino = ht * 60 + mt;

    const minutos = termino - inicio;

    const horas = Math.floor(minutos / 60);
    const restante = minutos % 60;

    return `${horas}h${restante > 0 ? restante + "min" : ""}`;
}

// ===== CALCULAR SITUAÇÃO DA RESERVA =====
function calcularSituacao(reserva) {

    const statusSalvo = String(
        reserva.StatusReserva || ""
    ).toLowerCase();

    if (statusSalvo === "cancelada" || statusSalvo === "cancelado") {
        return "Cancelada";
    }

    const data = String(reserva.Dia).substring(0, 10);
    const chegada = formatarHorario(reserva.HoraChegada);
    const saida = formatarHorario(reserva.HoraSaida);

    if (!data || !chegada || !saida) {
        return reserva.StatusReserva || "Não informado";
    }

    const [ano, mes, dia] = data.split("-").map(Number);
    const [hi, mi] = chegada.split(":").map(Number);
    const [hf, mf] = saida.split(":").map(Number);

    const inicioReserva = new Date(
        ano, mes - 1, dia, hi, mi
    );

    const fimReserva = new Date(
        ano, mes - 1, dia, hf, mf
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

// ===== CARREGAR DADOS COMPLETOS DO ESTACIONAMENTO =====
async function buscarEstacionamento(idEstacionamento) {

    const resposta = await fetch(`${API}/estacionamento`);

    if (!resposta.ok) {
        throw new Error("Não foi possível carregar os estacionamentos.");
    }

    const estacionamentos = await resposta.json();

    const estacionamento = estacionamentos.find(
        item => Number(item.IdEstacionamento) === Number(idEstacionamento)
    );

    if (!estacionamento) {
        throw new Error("Estacionamento não encontrado.");
    }

    estacionamentoAtual = estacionamento;

    enderecoEstacionamento = montarEndereco(estacionamento);

    telefoneEstacionamento =
        estacionamento.Telefone ||
        estacionamento.telefone ||
        "";

    return estacionamento;
}

// ===== BUSCAR IMAGEM PRINCIPAL =====
async function buscarImagemPrincipal(idEstacionamento) {

    try {

        const resposta = await fetch(
            `${API}/estacionamento/${idEstacionamento}/imagem-principal`
        );

        if (!resposta.ok) return "";

        const imagem = await resposta.text();

        return prepararImagem(imagem);

    } catch (erro) {

        console.error("Erro ao carregar imagem:", erro);

        return "";
    }
}

// ===== GERAR QR CODE =====
function gerarQRCode(reserva) {

    const divQr = document.getElementById("qrCode");

    if (!divQr) return;

    divQr.innerHTML = `
        <div id="code">
            <img src="../SiteCliente/img/qr.png" alt="QR Code">
            <h1>Comprovante da Reserva</h1>
        </div>
    `;

    if (typeof QRCode === "undefined") {

        console.error("Biblioteca QRCode não foi carregada.");

        divQr.insertAdjacentHTML(
            "beforeend",
            "<p>QR Code indisponível.</p>"
        );

        return;
    }

    new QRCode(divQr, {
        text: `Reserva-${reserva.IdReserva}`,
        width: 140,
        height: 140
    });

    divQr.insertAdjacentHTML("beforeend", `
        <h2>
            Apresente esta QR Code na entrada
            <br>
            do estacionamento
        </h2>
    `);
}

// ===== ENVIAR MENSAGEM PELO WHATSAPP =====
function enviarMensagem() {

    if (!telefoneEstacionamento) {

        showCustomAlert("Telefone do estacionamento não encontrado.");
        return;
    }

    let numero = String(telefoneEstacionamento).replace(/\D/g, "");

    // Acrescenta o código do Brasil quando necessário
    if (numero.length === 10 || numero.length === 11) {
        numero = "55" + numero;
    }

    const mensagem = encodeURIComponent(
        `Olá! Estou com dúvidas sobre minha reserva número ${reservaAtual.IdReserva} no estacionamento ${reservaAtual.NomeEstacionamento}.`
    );

    const url = `https://wa.me/${numero}?text=${mensagem}`;

    window.open(url, "_blank", "noopener,noreferrer");
}

// ===== ABRIR LOCALIZAÇÃO NO WAZE =====
function abrirNoWaze() {

    if (!enderecoEstacionamento) {

        showCustomAlert("Endereço do estacionamento não encontrado.");
        return;
    }

    const url = `https://waze.com/ul?q=${encodeURIComponent(enderecoEstacionamento)}&navigate=yes`;

    window.open(url, "_blank", "noopener,noreferrer");
}

// ===== EXIBIR DETALHES DA RESERVA =====
function detalhesReserva(Reserva, dadosCarro, estacionamento) {

    const containerInformacoes = document.getElementById("detalhes");

    if (!containerInformacoes) {

        console.error('Container "detalhes" não encontrado.');

        return;
    }

    // Horários
    const horaInicio = formatarHorario(Reserva.HoraChegada);
    const horaTermino = formatarHorario(Reserva.HoraSaida);

    // Duração
    const duracaoTexto = calcularDuracao(
        horaInicio,
        horaTermino
    );

    // Situação
    const situacao = calcularSituacao(Reserva);

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

    // Valor total salvo no banco
    const valorEstimado = Reserva.ValorTotal != null
        ? Number(Reserva.ValorTotal)
        : (
            (Number(Reserva.ValorHora || estacionamento.ValorHora || 0)) *
            (
                (Number(horaTermino.split(":")[0]) * 60 +
                 Number(horaTermino.split(":")[1])) -
                (Number(horaInicio.split(":")[0]) * 60 +
                 Number(horaInicio.split(":")[1]))
            ) / 60
        );

    const valorFormatado = formatarValor(valorEstimado);

    const nomeEstacionamento = escaparHTML(
        Reserva.NomeEstacionamento ||
        estacionamento.NomeEstacionamento
    );

    const endereco = escaparHTML(enderecoEstacionamento);

    const imagem = Reserva.imagem || "";

    const modeloCarro = escaparHTML(dadosCarro.Modelo || "Não informado");
    const marcaCarro = escaparHTML(dadosCarro.Marca || "");
    const placaCarro = escaparHTML(dadosCarro.Placa || "Não informada");
    const corCarro = escaparHTML(dadosCarro.Cor || "Não informada");
    const tipoCarro = escaparHTML(dadosCarro.Tipo || "");

    const tituloCarro = [marcaCarro, modeloCarro]
        .filter(Boolean)
        .join(" ");

    const dataFormatada = formatarData(Reserva.Dia);

    containerInformacoes.innerHTML = `
        <div id="estacionamento">

            <img
                id="cage"
                src="${imagem}"
                alt="${nomeEstacionamento}"
            >

            <div id="NomeEndereco">
                <h1>${nomeEstacionamento}</h1>
                <h2>${endereco}</h2>
            </div>

            ${selo}

            <div class="linhas"></div>

            <div class="c">

                <div class="elementos">
                    <img src="../SiteCliente/img/calendario.png" alt="Calendário">
                    <h1>Data de Reserva</h1>
                    <h2>${dataFormatada}</h2>
                </div>

                <div class="linha"></div>

                <div class="elementos">
                    <img src="../SiteCliente/img/relogio.png" alt="Relógio">
                    <h1 style="margin-top: 12px;">Horario de entrada</h1>
                    <h2 style="padding:20px 50px 0 110px">
                        ${horaInicio}
                    </h2>
                </div>

                <div class="linha"></div>

                <div class="elementos">
                    <img src="../SiteCliente/img/relogio.png" alt="Relógio">
                    <h1 style="margin-top: 12px;">Horario de saida</h1>
                    <h2 style="padding:20px 50px 0 110px">
                        ${horaTermino}
                    </h2>
                    <h4>(${duracaoTexto} de permanencia)</h4>
                </div>

            </div>

        </div>

        <div id="qrCode"></div>

        <div id="Dados">

            <div class="CarroPagamento">

                <div class="inicio">
                    <img
                        style="width:70px; margin-left:-10px; margin-top:-5px"
                        src="../SiteCliente/img/carro.png"
                        alt="Carro"
                    >
                    <h1 style="margin-left:-10px; float:left">
                        Veiculo
                    </h1>
                </div>

                <div id="carro">
                    <img src="../SiteCliente/img/carro.png" alt="Veículo">
                    <h1>${tituloCarro}</h1>
                    <h2>Placa: ${placaCarro}</h2>
                    <h2>Cor: ${corCarro}</h2>
                    ${tipoCarro ? `<h2>Tipo: ${tipoCarro}</h2>` : ""}
                </div>

            </div>

            <div
                style="margin-left:-10px; height:130px; margin-top:5px"
                class="linha">
            </div>

            <div
                style="margin-left:10px;"
                class="CarroPagamento">

                <div class="inicio">
                    <img
                        src="../SiteCliente/img/pagamento.png"
                        alt="Pagamento"
                    >
                    <h1 style="margin-top:5px">
                        Pagamento
                    </h1>
                </div>

                <div id="carro">
                    <img
                        style="width:70px; margin-top:5px; margin-left:-40px"
                        src="../SiteCliente/img/pagamento2.png"
                        alt="Pagamento"
                    >
                    <h1>Pagamento realizado no local</h1>
                    <h2>Total a pagar: R$ ${valorFormatado}</h2>
                </div>

            </div>

        </div>
    `;

    gerarQRCode(Reserva);

    // Configurar botão do Waze
    const botaoWaze = document.getElementById("bt_waze");

    if (botaoWaze) {
        botaoWaze.addEventListener("click", abrirNoWaze);
    }
}

// ===== BUSCAR RESERVA SELECIONADA =====
async function exibir() {

    const containerInformacoes = document.getElementById("detalhes");

    try {

        // Recuperar usuário logado
        const idUsuario = obterIdUsuario();

        if (!idUsuario) {

            throw new Error(
                "Não foi possível identificar o usuário logado."
            );
        }

        // Recuperar ID da reserva escolhido no histórico
        const idReserva = Number(
            sessionStorage.getItem("agendamentoSelecionado")
        );

        if (!idReserva) {

            throw new Error(
                "Nenhuma reserva foi selecionada no histórico."
            );
        }

        containerInformacoes.innerHTML = `
            <p>Carregando detalhes da reserva...</p>
        `;

        // Buscar reservas desse usuário
        const resposta = await fetch(
            `${API}/reserva/usuario/${idUsuario}`
        );

        if (!resposta.ok) {
            throw new Error("Não foi possível buscar as reservas do usuário.");
        }

        const reservas = await resposta.json();

        // Encontrar a reserva selecionada
        const reserva = reservas.find(item =>
            Number(item.IdReserva) === idReserva
        );

        if (!reserva) {
            throw new Error(
                "A reserva selecionada não foi encontrada para este usuário."
            );
        }

        // Recuperar dados completos do estacionamento
        const estacionamento = await buscarEstacionamento(
            reserva.IdEstacionamento
        );

        // Buscar imagem principal
        const imagem = await buscarImagemPrincipal(
            reserva.IdEstacionamento
        );

        // Organizar os dados
        reserva.imagem = imagem;

        reserva.NomeEstacionamento =
            reserva.NomeEstacionamento ||
            estacionamento.NomeEstacionamento;

        reserva.Endereco =
            montarEndereco(estacionamento);

        reserva.ValorHora =
            Number(estacionamento.ValorHora || 0);

        // Dados do veículo já vêm na resposta do ControllerReserva
        const dadosCarro = {
            IdCarro: reserva.IdCarro,
            Modelo: reserva.Modelo,
            Marca: reserva.Marca,
            Placa: reserva.Placa,
            Cor: reserva.Cor,
            Tipo: reserva.Tipo
        };

        reservaAtual = reserva;

        // Exibir os detalhes
        detalhesReserva(
            reserva,
            dadosCarro,
            estacionamento
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar detalhes da reserva:",
            erro
        );

        containerInformacoes.innerHTML = `
            <div class="vazio">
                ${escaparHTML(erro.message)}
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
document.addEventListener("DOMContentLoaded", exibir);
