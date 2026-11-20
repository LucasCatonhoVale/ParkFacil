
// ===== CONEXÃO COM O BANCO REAL =====
const API = "http://localhost:8080";

// Lista que receberá os estacionamentos do banco
let estacionamentos = [];

// ===== ELEMENTOS DA PÁGINA =====
const container = document.querySelector("#estacionamento");
const noResults = document.querySelector("#noResults");
const inputLocal = document.querySelector("#loca");
const inputInicio = document.querySelector("#inicio");
const inputTermino = document.querySelector("#termino");
const btnFiltrar = document.querySelector("#filtrar");

// ===== FUNÇÕES AUXILIARES =====

// Converte "08:30" -> 510 minutos
function paraMinutos(hora) {
    if (!hora) return 0;

    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
}

// Normaliza o horário vindo do Java
function formatarHorario(hora) {
    if (!hora) return "00:00";
    return hora.substring(0, 5);
}

// Monta o endereço completo
function montarEndereco(p) {
    return [
        p.Endereco,
        p.Numero,
        p.Complemento,
        p.Bairro,
        p.Cidade,
        p.Estado,
        p.Cep
    ].filter(Boolean).join(", ");
}

// Prepara a imagem para exibição
function prepararImagem(imagem) {
    if (!imagem) return "";

    imagem = imagem.trim();

    // Caso seja uma URL ou caminho
    if (
        imagem.startsWith("http://") ||
        imagem.startsWith("https://") ||
        imagem.startsWith("/") ||
        imagem.startsWith("../") ||
        imagem.startsWith("data:")
    ) {
        return imagem;
    }

    // Caso seja Base64, identifica o formato
    let formato = "image/jpeg";

    if (imagem.startsWith("iVBOR")) {
        formato = "image/png";
    } else if (imagem.startsWith("UklGR")) {
        formato = "image/webp";
    } else if (imagem.startsWith("R0lGOD")) {
        formato = "image/gif";
    }

    return `data:${formato};base64,${imagem}`;
}

// Texto do horário mostrado no card
function textoHorario(p) {
    if (p.inicio === "00:00" && p.termino === "00:00") {
        return "24h";
    }

    return `${p.inicio} às ${p.termino}`;
}

// ===== BUSCAR IMAGEM PRINCIPAL =====
async function buscarImagemPrincipal(id) {
    try {
        const resposta = await fetch(
            `${API}/estacionamento/${id}/imagem-principal`
        );

        if (!resposta.ok) {
            return "";
        }

        const imagem = await resposta.text();

        return prepararImagem(imagem);

    } catch (erro) {
        console.error("Erro ao buscar imagem principal:", erro);
        return "";
    }
}

// ===== CARREGAR ESTACIONAMENTOS DO BANCO =====
async function carregarEstacionamentos() {
    try {
        const resposta = await fetch(`${API}/estacionamento`);

        if (!resposta.ok) {
            throw new Error("Não foi possível buscar os estacionamentos.");
        }

        const dados = await resposta.json();

        // Converte os campos do banco para os nomes usados nos cards
        estacionamentos = await Promise.all(
            dados.map(async (p) => {

                const imagem = await buscarImagemPrincipal(
                    p.IdEstacionamento
                );

                return {
                    ...p,

                    id: p.IdEstacionamento,
                    imagem: imagem,

                    NomeEstacionamento: p.NomeEstacionamento,

                    Endereco: montarEndereco(p),

                    vagas: p.QtVagas,

                    Valores: Number(p.ValorHora),

                    inicio: formatarHorario(p.HorarioAbertura),

                    termino: formatarHorario(p.HorarioFechamento),

                    sobre: p.Descricao
                };
            })
        );

        renderProducts(estacionamentos);

    } catch (erro) {
        console.error("Erro ao carregar estacionamentos:", erro);

        container.innerHTML = "";

        noResults.style.display = "flex";
        noResults.style.justifyContent = "center";
        noResults.innerHTML = "Não foi possível carregar os estacionamentos.";
    }
}

// ===== RENDERIZAÇÃO DOS CARDS =====
function renderProducts(lista) {
    container.innerHTML = "";

    // SEM RESULTADO
    if (lista.length === 0) {
        noResults.style.display = "flex";
        noResults.style.justifyContent = "center";
        noResults.innerHTML = "Nenhum estacionamento encontrado.";
        return;
    }

    noResults.style.display = "none";

    // CARDS
    lista.forEach((p) => {

        const card = document.createElement("div");
        card.className = "estacionamento-card";

        card.innerHTML = `
            <img class="imagem"
                 src="${p.imagem}"
                 alt="Foto de ${p.NomeEstacionamento}">

            <div class="detalhes">
                <h3>${p.NomeEstacionamento}</h3>

                <p class="endereco">${p.Endereco}</p>

                <div class="info">
                    <div class="tipo">
                        <img class="icone" src="../SiteCliente/img/carro.png" alt="">
                        <p>${p.vagas ?? 0} vagas</p>
                    </div>

                    <div class="tipo">
                        <img class="icone" src="../SiteCliente/img/carro.png" alt="">
                        <p>${textoHorario(p)}</p>
                    </div>
                </div>
            </div>

            <div class="reserva">
                <p class="preco">
                    R$ ${p.Valores.toFixed(2).replace(".", ",")}
                    <span>/hora</span>
                </p>

                <button type="button" class="btnReservar">
                    Ver detalhes
                </button>
            </div>
        `;

        // Guarda o estacionamento escolhido e abre detalhes
        card.querySelector(".btnReservar").addEventListener("click", () => {

            sessionStorage.setItem(
                "estacionamentoSelecionado",
                JSON.stringify(p)
            );

            // Guarda também o ID separadamente
            sessionStorage.setItem(
                "IdEstacionamento",
                p.IdEstacionamento
            );

            window.location.href = "../SiteCliente/detalhes.html";
        });

        container.appendChild(card);
    });
}

// ===== FILTRO =====
function aplicarFiltros() {
    const termo = inputLocal.value.trim().toLowerCase();
    const inicio = inputInicio.value;
    const termino = inputTermino.value;

    console.log("filtrando:", { termo, inicio, termino });

    // Horário inválido
    if (inicio && termino && paraMinutos(termino) <= paraMinutos(inicio)) {
        showCustomAlert("O horário de término precisa ser depois do início.");
        return;
    }

    const ini = inicio ? paraMinutos(inicio) : null;
    const fim = termino ? paraMinutos(termino) : null;

    // 1) Localização
    let resultado = estacionamentos.filter(p =>
        p.Endereco.toLowerCase().includes(termo) ||
        p.NomeEstacionamento.toLowerCase().includes(termo)
    );

    // 2) Horário
    resultado = resultado.filter(p => {

        const abre = paraMinutos(p.inicio);
        const fecha = paraMinutos(p.termino);

        if (ini !== null && (ini < abre || ini >= fecha)) {
            return false;
        }

        if (fim !== null && (fim <= abre || fim > fecha)) {
            return false;
        }

        return true;
    });

    renderProducts(resultado);
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



// ===== EVENTOS =====
btnFiltrar.addEventListener("click", (e) => {
    e.preventDefault();
    aplicarFiltros();
});

// ===== INICIALIZAÇÃO =====
carregarEstacionamentos();
