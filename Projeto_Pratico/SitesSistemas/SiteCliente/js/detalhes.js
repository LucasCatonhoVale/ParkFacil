
// ===== CONEXÃO COM O BANCO REAL =====
const API = "http://localhost:8080";

// ===== FUNÇÕES AUXILIARES =====

// Formata o horário recebido do Java
function formatarHorario(hora) {
    if (!hora) return "00:00";

    return String(hora).substring(0, 2);
}

// Monta o endereço completo
function montarEndereco(estacionamento) {
    const endereco = [
        estacionamento.Endereco ?? estacionamento.endereco,
        estacionamento.Numero ?? estacionamento.numero,
        estacionamento.Complemento ?? estacionamento.complemento
    ].filter(Boolean).join(", ");

    const localidade = [
        estacionamento.Bairro ?? estacionamento.bairro,
        estacionamento.Cidade ?? estacionamento.cidade,
        estacionamento.Estado ?? estacionamento.estado,
        estacionamento.Cep ?? estacionamento.cep
    ].filter(Boolean).join(", ");

    return [endereco, localidade].filter(Boolean).join("<br>");
}

// Prepara a imagem para exibição
function prepararImagem(imagem) {
    if (!imagem) return "";

    imagem = String(imagem).trim();

    if (
        imagem.startsWith("http://") ||
        imagem.startsWith("https://") ||
        imagem.startsWith("/") ||
        imagem.startsWith("./") ||
        imagem.startsWith("../") ||
        imagem.startsWith("data:")
    ) {
        return imagem;
    }

    // Caso a imagem esteja em Base64
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

// ===== EXIBIR AS IMAGENS DA GALERIA =====
function carregarImagens(estacionamento) {
    const containerGaleria = document.getElementById("galeria-estacionamento");

    if (!containerGaleria) {
        console.error('Container "galeria-estacionamento" não encontrado.');
        return;
    }

    const IMAGENS = estacionamento.imagens;

    if (!IMAGENS || IMAGENS.length === 0) {
        containerGaleria.innerHTML = "Nenhuma imagem cadastrada.";
        return;
    }

    containerGaleria.innerHTML = `
        <div class="galeria">
            <div class="imagem-principal">
                <img
                    id="imagemPrincipal"
                    src="${IMAGENS[0].src}"
                    alt="${IMAGENS[0].alt}"
                >
            </div>

            <div class="miniaturas">
                ${IMAGENS.map((img, indice) => `
                    <button
                        type="button"
                        class="miniatura ${indice === 0 ? "ativa" : ""}"
                        data-indice="${indice}"
                        aria-label="Ver imagem: ${img.alt}"
                        aria-pressed="${indice === 0}"
                    >
                        <img src="${img.src}" alt="${img.alt}">
                    </button>
                `).join("")}
            </div>
        </div>
    `;

    configurarTrocaImagem(estacionamento);
}

// ===== CONFIGURAR TROCA DA IMAGEM PRINCIPAL =====
function configurarTrocaImagem(estacionamento) {
    const IMAGENS = estacionamento.imagens;
    const containerGaleria = document.getElementById("galeria-estacionamento");

    if (!containerGaleria) return;

    const imagemPrincipal = containerGaleria.querySelector("#imagemPrincipal");
    const miniaturas = containerGaleria.querySelectorAll(".miniatura");

    miniaturas.forEach((miniatura) => {
        miniatura.addEventListener("click", () => {
            const ativa = Number(miniatura.dataset.indice);

            imagemPrincipal.src = IMAGENS[ativa].src;
            imagemPrincipal.alt = IMAGENS[ativa].alt;

            miniaturas.forEach((botao, indice) => {
                botao.classList.toggle("ativa", indice === ativa);
                botao.setAttribute("aria-pressed", String(indice === ativa));
            });
        });
    });
}

// ===== INFORMAÇÕES DO ESTACIONAMENTO =====
function carregarInformacoes(estacionamento) {
    const containerInformacoes = document.getElementById("informacoes-estacionamento");

    if (!containerInformacoes) {
        console.error('Container "informacoes-estacionamento" não encontrado.');
        return;
    }

    const cobertura = estacionamento.coberto === true
        ? "Coberto"
        : estacionamento.coberto === false
            ? "Descoberto"
            : "Não informado";

 const horario =
    estacionamento.inicio === "00:00" &&
    estacionamento.termino === "23:59"
        ? "24h"
        : `${formatarHorario(estacionamento.inicio)} às ${formatarHorario(estacionamento.termino)}`;
    const quantidadeAvaliacoes = estacionamento.avaliacoes;

    containerInformacoes.innerHTML = `
        <div class="informacoes-estacionamento">

            <h2 class="titulo">${estacionamento.NomeEstacionamento}</h2>

            <div class="avalia">
                <img src="../SiteCliente/img/estrala.png" alt="estrela de avaliação">

                <h3>
                    ${quantidadeAvaliacoes > 0
                        ? `${quantidadeAvaliacoes} avaliações`
                        : "Sem avaliações"}
                </h3>
            </div>

            <div class="endereco">
                <h3>${estacionamento.Endereco}</h3>
            </div>

            <div id="icones">
                <div class="icone" style="width: 120px;">
                    <img src="../SiteCliente/img/calendario.png" alt="Icone do carro">
                    <h2>${estacionamento.vagas} vagas</h2>
                </div>

                <div class="icone" style="margin-left:-6px">
                    <img src="../SiteCliente/img/carro.png" alt="Icone do carro">
                    <h2>Coberto</h2>
                </div>

                <div class="icone" style="margin-left:-8px">
                    <img src="../SiteCliente/img/relogio.png" alt="Ícone do relógio">
                    <h2>${horario}</h2>
                </div>
            </div>

            <div class="linhas"></div>

            <div class="sobre">
                <h1>Sobre o estacionamento</h1>
                <p>${estacionamento.sobre || "Descrição não informada."}</p>
            </div>

            <div class="linhas"></div>

            <div id="comodidades">
                <h1>Comodidades</h1>

                <div class="como">
                    <img src="../SiteCliente/img/acerto.png" alt="acerto">
                    <h2>Segurança 24h</h2>
                </div>

                <div class="como">
                    <img src="../SiteCliente/img/acerto.png" alt="acerto">
                    <h2>Cameras de monitoriamento</h2>
                </div>

                <div class="como">
                    <img src="../SiteCliente/img/acerto.png" alt="acerto">
                    <h2>Acessibilidade</h2>
                </div>

                <div class="como">
                    <img src="../SiteCliente/img/acerto.png" alt="acerto">
                    <h2>Elevador</h2>
                </div>
            </div>

        </div>
    `;
}

// ===== TABELA DOS VALORES E RESERVA =====
function CarregarTabela(estacionamento) {
    const containerTabela = document.getElementById("Tabela-estacionamento");

    if (!containerTabela) {
        console.error('Container "Tabela-estacionamento" não encontrado.');
        return;
    }

    const valorFormatado = Number(estacionamento.Valores).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    containerTabela.innerHTML = `
        <form action="">

            <div id="comeco">
                <h1>A partir de</h1>
                <p>${valorFormatado}</p>
                <h1>por hora</h1>
            </div>

            <h2>Selecione o periodo</h2>

            <div class="forms">
                <label for="data">Data</label>
                <br>
                <input type="date" id="data">
            </div>

            <div class="forms">
                <label for="horaInicio">Hora de Inicio</label>
                <br>
                <input type="time" id="horaInicio">
            </div>

            <div class="forms">
                <label for="horaTermino">Hora de Termino</label>
                <br>
                <input type="time" id="horaTermino">
            </div>

            <button type="button" id="bt">Reserva Agora</button>

        </form>
    `;

    // ===== ENVIAR DADOS PARA A PÁGINA DE RESERVA =====
    containerTabela.querySelector("#bt").addEventListener("click", () => {

        const data = containerTabela.querySelector("#data").value;
        const horaChegada = containerTabela.querySelector("#horaInicio").value;
        const horaSaida = containerTabela.querySelector("#horaTermino").value;

        // Verifica os campos
        if (!data || !horaChegada || !horaSaida) {
            showCustomAlert("Preencha a data e os horários.");
            return;
        }

        // Verifica os horários
        if (horaSaida <= horaChegada) {
            showCustomAlert("A hora de saída deve ser depois da hora de chegada.");
            return;
        }

        // Recupera o ID real do estacionamento
        const idEstacionamento = estacionamento.IdEstacionamento;

        if (!idEstacionamento) {
            showCustomAlert("Não foi possível identificar o estacionamento.");
            return;
        }

        // Envia o ID do estacionamento
        sessionStorage.setItem(
            "IdEstacionamento",
            idEstacionamento
        );

        // Envia a data
        sessionStorage.setItem(
            "dataReserva",
            data
        );

        // Envia a hora de chegada
        sessionStorage.setItem(
            "horaChegada",
            horaChegada
        );

        // Envia a hora de saída
        sessionStorage.setItem(
            "horaSaida",
            horaSaida
        );

        // Mantém os dados agrupados
        sessionStorage.setItem(
            "periodoReserva",
            JSON.stringify({
                data: data,
                horaInicio: horaChegada,
                horaTermino: horaSaida
            })
        );

        // Guarda os dados do estacionamento sem as imagens pesadas
        const estacionamentoReserva = {
            ...estacionamento,
            imagens: []
        };

        sessionStorage.setItem(
            "estacionamentoSelecionado",
            JSON.stringify(estacionamentoReserva)
        );

        // Vai para a página de reserva
        window.location.href = "../SiteCliente/reserva.html";
    });
}

// ===== MONTAR LISTA DE IMAGENS DO BANCO =====
function montarListaImagens(registros) {
    const imagens = [];

    function adicionarImagem(conteudo, descricao) {
        const src = prepararImagem(conteudo);

        if (!src) return;

        // Evita imagens repetidas
        if (imagens.some(img => img.src === src)) return;

        imagens.push({
            src: src,
            alt: descricao
        });
    }

    // Adiciona primeiro a imagem principal
    const principal = registros.find(img =>
        img.principal && String(img.principal).trim() !== ""
    );

    if (principal) {
        adicionarImagem(
            principal.principal,
            "Imagem principal do estacionamento"
        );
    }

    // Adiciona as demais imagens
    registros.forEach((img, indice) => {
        adicionarImagem(
            img.CaminhoImagem,
            `Imagem do estacionamento ${indice + 1}`
        );
    });

    return imagens;
}

// ===== INICIAR GALERIA E INFORMAÇÕES =====
async function GaleriaEstacionamento() {

    // Recupera o estacionamento escolhido na busca
    let estacionamentoSalvo = null;

    try {
        estacionamentoSalvo = JSON.parse(
            sessionStorage.getItem("estacionamentoSelecionado")
        );
    } catch (erro) {
        console.error("Erro ao recuperar estacionamento:", erro);
    }

    const idEstacionamento = Number(
        sessionStorage.getItem("IdEstacionamento") ||
        estacionamentoSalvo?.IdEstacionamento ||
        estacionamentoSalvo?.idEstacionamento ||
        estacionamentoSalvo?.id
    );

    if (!idEstacionamento) {
        showCustomAlert("Selecione um estacionamento na tela de busca.");
        return;
    }

    try {

        // Busca os estacionamentos cadastrados
        const respostaEstacionamentos = await fetch(`${API}/estacionamento`);

        if (!respostaEstacionamentos.ok) {
            throw new Error("Erro ao buscar os estacionamentos.");
        }

        const listaEstacionamentos = await respostaEstacionamentos.json();

        // Localiza o estacionamento escolhido pelo ID
        const dados = listaEstacionamentos.find(p =>
            Number(p.IdEstacionamento ?? p.idEstacionamento ?? p.id) === idEstacionamento
        );

        if (!dados) {
            throw new Error("Estacionamento não encontrado no banco.");
        }

        // Busca todas as imagens desse estacionamento
        const respostaImagens = await fetch(
            `${API}/estacionamento/${idEstacionamento}/imagens`
        );

        if (!respostaImagens.ok) {
            throw new Error("Erro ao buscar as imagens do estacionamento.");
        }

        const registrosImagens = await respostaImagens.json();

        // Monta as imagens da galeria
        const imagens = montarListaImagens(registrosImagens);

        // Organiza os dados reais
        const estacionamento = {

            ...dados,

            IdEstacionamento:
                dados.IdEstacionamento ?? dados.idEstacionamento ?? dados.id,

            NomeEstacionamento:
                dados.NomeEstacionamento ?? dados.nomeEstacionamento,

            Endereco: montarEndereco(dados),

            vagas: dados.QtVagas ?? dados.qtVagas ?? 0,

            Valores: Number(dados.ValorHora ?? dados.valorHora ?? 0),

            inicio: formatarHorario(
                dados.HorarioAbertura ?? dados.horarioAbertura
            ),

            termino: formatarHorario(
                dados.HorarioFechamento ?? dados.horarioFechamento
            ),

            sobre: dados.Descricao ?? dados.descricao ?? "",

            coberto: dados.Coberto ?? dados.coberto ?? null,

            avaliacoes: Number(dados.Avaliacoes ?? dados.avaliacoes ?? 0),

            imagens: imagens
        };

        // Atualiza os dados do estacionamento escolhido
        sessionStorage.setItem(
            "IdEstacionamento",
            estacionamento.IdEstacionamento
        );

        sessionStorage.setItem(
            "estacionamentoSelecionado",
            JSON.stringify(estacionamento)
        );

        // Exibe as informações na página
        carregarImagens(estacionamento);
        carregarInformacoes(estacionamento);
        CarregarTabela(estacionamento);

    } catch (erro) {
        console.error("Erro ao carregar detalhes:", erro);
        showCustomAlert("Não foi possível carregar os detalhes do estacionamento.");
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
document.addEventListener("DOMContentLoaded", GaleriaEstacionamento);
