
const API_USUARIO = "http://localhost:8080/usuario";
const API_CARRO = "http://localhost:8080/carro";

let UsuarioAtual = null;
let CarrosAtuais = [];

function showCustomAlert(mensagem, tipo = "success") {

    const alerta = document.getElementById("alerta");
    const mensagemAlerta = document.getElementById("mensagemAlerta");

    if (!alerta || !mensagemAlerta) return;

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

// ======================================
// BUSCAR USUÁRIO E VEÍCULOS NO BANCO
// ======================================

function obterIdUsuario() {

    const sessao = JSON.parse(
        localStorage.getItem("usuarioLogado") || "null"
    );

    return sessao?.IdUsuario ||
        sessao?.usuario?.IdUsuario ||
        localStorage.getItem("IdUsuario");
}

async function Exibir() {

    try {

        const idUsuario = obterIdUsuario();

        if (!idUsuario) {
            showCustomAlert("Usuário não identificado. Faça login novamente.");
            window.location.href = "../SiteCliente/loging.html";
            return;
        }

        // BUSCAR USUÁRIO NO MYSQL
        const respostaUsuario = await fetch(
            `${API_USUARIO}/${idUsuario}`
        );

        if (!respostaUsuario.ok) {
            throw new Error("Não foi possível carregar os dados do usuário.");
        }

        UsuarioAtual = await respostaUsuario.json();

        // BUSCAR VEÍCULOS NO MYSQL
        const respostaCarros = await fetch(
            `${API_CARRO}/usuario/${idUsuario}`
        );

        if (!respostaCarros.ok) {
            throw new Error("Não foi possível carregar os veículos.");
        }

        CarrosAtuais = await respostaCarros.json();

        // ORGANIZAR DADOS DO USUÁRIO PARA A TELA
        const usuarioTela = {

            IdUsuario: UsuarioAtual.IdUsuario,
            NomeUsuario: UsuarioAtual.NomeUsuario || UsuarioAtual.nomeUsuario || "",
            Cpf: UsuarioAtual.CPF,
            email: UsuarioAtual.email,
            telefone: UsuarioAtual.telefone,
            foto: UsuarioAtual.imagem,

            endereco: "Não informado",
            cep: "Não informado",
            entrada: "Não informado"
        };

        // ORGANIZAR VEÍCULOS PARA A TELA
        const carrosTela = CarrosAtuais.map(carro => ({

            IdCarro: carro.IdCarro,
            IdUsuario: usuarioTela.IdUsuario,
            Modelo: carro.Modelo,
            placa: carro.Placa,
            cor: carro.cor,
            tipo: carro.tipo,
            marca: carro.marca

        }));

        // EXIBIR DADOS REAIS
        Dados(usuarioTela);
        Conteudo(usuarioTela);
        DadosVeiculos(usuarioTela, carrosTela);

    } catch (erro) {

        console.error("Erro ao carregar perfil:", erro);
        showCustomAlert(erro.message);
    }
}

// ======================================
// DADOS DO USUÁRIO
// ======================================

function Dados(usuario) {

    const ccontainerTela = document.getElementById("Dados");

    if (!ccontainerTela) {
        console.error('Container "dados" não encontrado.');
        return;
    }

    ccontainerTela.innerHTML = `
        <div class="dados">

            <img src="${usuario.foto || '../SiteCliente/img/usuario.png'}"
                 alt="Foto do usuário">

            <h1>${usuario.NomeUsuario || "Usuário"}</h1>

            <div class="email">
                <img src="../SiteCliente/img/email.png" alt="">
                <h2>${usuario.email || "E-mail não informado"}</h2>
            </div>

            <div class="linha"></div>

            <div class="dados2">
                <img src="../SiteCliente/img/telefone.png"
                     alt=""
                     style="margin-left:15px; margin-top:-1px">

                <h2>${usuario.telefone || "Não informado"}</h2>
            </div>

            <div class="dados2">
                <img src="../SiteCliente/img/calendario.png"
                     alt=""
                     style="width:60px">

                <h2 style="margin-left:-10px;">
                    Membro desde: ${usuario.entrada}
                </h2>
            </div>

            <button type="button" id="editarPerfil">
                <img src="../SiteCliente/img/caneta.png" alt="">
                <h1 id="bt">Editar Perfil</h1>
            </button>

        </div>

        <div id="Senha">

            <div class="trocar" style="width:200px">
                <h1>Trocar Senha</h1>

                <button type="button" id="trocaSenha">
                    <img style="width:50px; margin-top:-10px"
                         src="../SiteCliente/img/senha.png">
                </button>
            </div>

            <div class="trocar" style="margin-left:10px">
                <h1>Sair</h1>

                <button type="button" id="sairConta">
                    <img src="../SiteCliente/img/sair.png">
                </button>
            </div>

        </div>
    `;
}

// ======================================
// CONTEÚDO DOS DADOS PESSOAIS
// ======================================

function Conteudo(Usuario) {

    const containerTela = document.getElementById("conteudo");

    if (!containerTela) {
        console.error('Container "conteudo" não encontrado.');
        return;
    }

    containerTela.innerHTML = `
        <div class="conteudo">

            <div class="destaque">
                <img src="img/boneco.png" alt="">
                <h1>Meus Dados</h1>
            </div>

            <div class="meus">

                <div class="tipo">
                    <h1>Nome Completo</h1>
                    <h2>${Usuario.NomeUsuario || "Não informado"}</h2>
                </div>

                <div class="tipo">
                    <h1>E-mail</h1>
                    <h2>${Usuario.email || "Não informado"}</h2>
                </div>

                <div class="tipo">
                    <h1>Telefone</h1>
                    <h2>${Usuario.telefone || "Não informado"}</h2>
                </div>

                <div class="tipo">
                    <h1>CPF</h1>
                    <h2>${Usuario.Cpf || "Não informado"}</h2>
                </div>

                <div class="tipo">
                    <h1>Endereço</h1>
                    <h2>${Usuario.endereco} - ${Usuario.cep}</h2>
                </div>

            </div>
        </div>
    `;
}

// ======================================
// VEÍCULOS DO USUÁRIO
// ======================================

function DadosVeiculos(Usuario, carros) {

    const containerTela = document.getElementById("carros");

    if (!containerTela) {
        console.error('Container "carros" não encontrado.');
        return;
    }

    if (carros.length === 0) {

        containerTela.innerHTML = `
            <div class="destaque" style="margin-left:550px;margin-top:20px">
                <img src="img/carro.png" alt="">
                <h1>Meus Veiculos</h1>
            </div>

            <div class="carros">
                <h2 style="text-align: center; font-family: 'Poppins', sans-serif;">
                    Nenhum veículo cadastrado.
                </h2>
            </div>
        `;

        return;
    }

    containerTela.innerHTML = `
        <div class="destaque" style="margin-left:550px;margin-top:20px">
            <img src="img/carro.png" alt="">
            <h1>Meus Veiculos</h1>
        </div>

        <div class="carros">

            ${carros.map(carro => `

                <div class="veiculo">

                    <h2>Modelo ${carro.Modelo}</h2>

                    <div class="informacoes">

                        <p style="margin-left:5px">
                            Placa: ${carro.placa}
                        </p>

                        <p>
                            Cor: ${carro.cor}
                        </p>

                        <p>
                            Tipo: ${carro.tipo}
                        </p>

                    </div>

                    <button class="cancelar"
                            data-id-carro="${carro.IdCarro}">
                        Deletar
                    </button>

                </div>

            `).join("")}

        </div>
    `;
}

// ======================================
// MODAIS DE EDITAR PERFIL E TROCAR SENHA
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    const modalEditar = document.getElementById("modalEditarPerfil");
    const modalSenha = document.getElementById("modalTrocarSenha");

    const formEditar = document.getElementById("formEditarPerfil");
    const formSenha = document.getElementById("formTrocarSenha");

    const inputNome = document.getElementById("nomeUsuario");
    const inputEmail = document.getElementById("emailUsuario");
    const inputTelefone = document.getElementById("telefoneUsuario");

    const inputImagem = document.getElementById("imagemPerfil");
    const previewImagem = document.getElementById("previewImagem");

    let imagemSelecionada = "";

    // ABRIR MODAL DE EDIÇÃO
    document.getElementById("Dados").addEventListener("click", event => {

        if (!event.target.closest("#editarPerfil")) return;

        if (!UsuarioAtual) {
            showCustomAlert("Os dados do usuário ainda não foram carregados.");
            return;
        }

        inputNome.value = UsuarioAtual.NomeUsuario || UsuarioAtual.nomeUsuario || "";
        inputEmail.value = UsuarioAtual.email || "";
        inputTelefone.value = UsuarioAtual.telefone || "";

        imagemSelecionada = UsuarioAtual.imagem || "";

        previewImagem.src = imagemSelecionada ||
            "../SiteCliente/img/perfil.jpg";

        inputImagem.value = "";

        modalEditar.classList.add("ativo");
    });

    // SELECIONAR IMAGEM
    inputImagem.addEventListener("change", () => {

        const arquivo = inputImagem.files[0];

        if (!arquivo) return;

        if (!arquivo.type.startsWith("image/")) {
            showCustomAlert("Selecione uma imagem válida!");
            inputImagem.value = "";
            return;
        }

        if (arquivo.size > 2 * 1024 * 1024) {
            showCustomAlert("A imagem deve ter no máximo 2 MB!");
            inputImagem.value = "";
            return;
        }

        const leitor = new FileReader();

        leitor.onload = () => {

            imagemSelecionada = leitor.result;
            previewImagem.src = imagemSelecionada;

        };

        leitor.onerror = () => {
            showCustomAlert("Não foi possível carregar a imagem.");
        };

        leitor.readAsDataURL(arquivo);
    });

    // SALVAR EDIÇÃO NO MYSQL
    formEditar.addEventListener("submit", async event => {

        event.preventDefault();

        const idUsuario = obterIdUsuario();

        const nomeUsuario = inputNome.value.trim();
        const email = inputEmail.value.trim();
        const telefone = inputTelefone.value.trim();

        if (!nomeUsuario || !email || !telefone) {
            showCustomAlert("Preencha todos os campos!");
            return;
        }

        try {

            const resposta = await fetch(
                `${API_USUARIO}/${idUsuario}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        NomeUsuario: nomeUsuario,
                        email: email,
                        telefone: telefone,
                        imagem: imagemSelecionada
                    })
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok || !dados.success) {
                throw new Error(
                    dados.message || "Erro ao atualizar perfil."
                );
            }

            showCustomAlert("Perfil atualizado com sucesso!");

            modalEditar.classList.remove("ativo");

            // BUSCAR NOVAMENTE OS DADOS DIRETO DO BANCO
            await Exibir();

            // ATUALIZAR NOME DA SESSÃO
            const sessao = JSON.parse(
                localStorage.getItem("usuarioLogado") || "null"
            );

            if (sessao) {

                if (sessao.usuario) {
                    sessao.usuario.NomeUsuario = nomeUsuario;
                } else {
                    sessao.NomeUsuario = nomeUsuario;
                }

                localStorage.setItem(
                    "usuarioLogado",
                    JSON.stringify(sessao)
                );
            }

        } catch (erro) {

            console.error("Erro ao editar perfil:", erro);
            showCustomAlert(erro.message);
        }
    });

    // ABRIR MODAL TROCAR SENHA
    document.getElementById("Dados").addEventListener("click", event => {

        if (!event.target.closest("#trocaSenha")) return;

        formSenha.reset();

        modalSenha.classList.add("ativo");
    });

    // TROCAR SENHA NO MYSQL
    formSenha.addEventListener("submit", async event => {

        event.preventDefault();

        const idUsuario = obterIdUsuario();

        const senhaAtual =
            document.getElementById("senhaAtual").value;

        const novaSenha =
            document.getElementById("novaSenha").value;

        const confirmarSenha =
            document.getElementById("confirmarSenha").value;

        if (novaSenha.length < 6) {
            showCustomAlert("A nova senha deve ter pelo menos 6 caracteres!");
            return;
        }

        if (novaSenha !== confirmarSenha) {
            showCustomAlert("As senhas não coincidem!");
            return;
        }

        if (senhaAtual === novaSenha) {
            showCustomAlert("A nova senha deve ser diferente da atual!");
            return;
        }

        try {

            const resposta = await fetch(
                `${API_USUARIO}/${idUsuario}/senha`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        senhaAtual: senhaAtual,
                        novaSenha: novaSenha,
                        confirmarSenha: confirmarSenha
                    })
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok || !dados.success) {
                throw new Error(
                    dados.message || "Erro ao alterar senha."
                );
            }

            showCustomAlert("Senha alterada com sucesso!");

            formSenha.reset();

            modalSenha.classList.remove("ativo");

        } catch (erro) {

            console.error("Erro ao trocar senha:", erro);
            showCustomAlert(erro.message);
        }
    });

    // FECHAR MODAIS
    document.querySelectorAll("[data-fechar]").forEach(botao => {

        botao.addEventListener("click", () => {

            const modal = document.getElementById(
                botao.dataset.fechar
            );

            modal.classList.remove("ativo");
        });
    });

    // FECHAR CLICANDO FORA
    [modalEditar, modalSenha].forEach(modal => {

        modal.addEventListener("click", event => {

            if (event.target === modal) {
                modal.classList.remove("ativo");
            }
        });
    });

    // FECHAR COM ESC
    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {
            modalEditar.classList.remove("ativo");
            modalSenha.classList.remove("ativo");
        }
    });

    // ======================================
    // SAIR DA CONTA - CORRIGIDO
    // ======================================

    document.getElementById("Dados").addEventListener("click", event => {

        if (!event.target.closest("#sairConta")) return;

        if (!confirm("Deseja realmente sair da sua conta?")) {
            return;
        }

        // Remover os dados de autenticação conhecidos
        const chavesUsuario = [
            "usuarioLogado",
            "usuario",
            "dadosUsuario",
            "user",
            "cliente",
            "usuarioAutenticado",
            "dadosUsuarioLogado",
            "IdUsuario",
            "idUsuario"
        ];

        [localStorage, sessionStorage].forEach(armazenamento => {

            chavesUsuario.forEach(chave => {
                armazenamento.removeItem(chave);
            });

            // Remover outras chaves que contenham dados
            // de usuário identificado
            const chavesExtras = [];

            for (let i = 0; i < armazenamento.length; i++) {

                const chave = armazenamento.key(i);
                const valor = armazenamento.getItem(chave);

                try {

                    const dados = JSON.parse(valor);

                    if (
                        dados &&
                        typeof dados === "object" &&
                        (
                            dados.IdUsuario ||
                            dados.idUsuario
                        )
                    ) {
                        chavesExtras.push(chave);
                    }

                } catch (erro) {
                    // Ignorar valores que não sejam JSON
                }
            }

            chavesExtras.forEach(chave => {
                armazenamento.removeItem(chave);
            });
        });

        // Limpar dados carregados na página
        UsuarioAtual = null;
        CarrosAtuais = [];

        // Redirecionar para Login
        window.location.replace("../SiteCliente/index.html");
    });

});

// ======================================
// CARREGAR PERFIL QUANDO A PÁGINA ABRIR
// ======================================

document.addEventListener("DOMContentLoaded", Exibir);
