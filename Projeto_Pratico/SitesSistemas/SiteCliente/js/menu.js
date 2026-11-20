
 // ===== MENU DO USUÁRIO =====
const API_MENU = "http://localhost:8080";

// Caminho da página de perfil
const PAGINA_PERFIL = "../SiteCliente/perfil.html";

// ===== PROCURAR USUÁRIO =====
function procurarDadosUsuario(dados) {

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

        const usuario = procurarDadosUsuario(dados[campo]);

        if (usuario) {
            return usuario;
        }
    }

    return null;
}

// ===== RECUPERAR USUÁRIO =====
function recuperarUsuarioMenu() {

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

                const usuario = procurarDadosUsuario(
                    JSON.parse(valor)
                );

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

                const usuario = procurarDadosUsuario(
                    JSON.parse(valor)
                );

                if (usuario) return usuario;

            } catch (erro) {
                // Ignora valores inválidos
            }
        }
    }

    return null;
}

// ===== PREPARAR FOTO =====
function prepararFotoUsuario(imagem) {

    if (!imagem) return "";

    imagem = String(imagem).trim();

    if (
        imagem.startsWith("http://") ||
        imagem.startsWith("https://") ||
        imagem.startsWith("/") ||
        imagem.startsWith("data:")
    ) {
        return imagem;
    }

    return `data:image/jpeg;base64,${imagem}`;
}

// ===== CRIAR MENU DO PERFIL =====
function criarMenuPerfil(usuario) {

    const nav = document.querySelector("#menu nav");

    if (!nav) {
        console.error("Menu de navegação não encontrado.");
        return;
    }

    const itemLogin = nav.querySelector(
        'a[href*="loging.html"]'
    )?.closest("li");

    const itemCadastro = nav.querySelector(
        'a[href*="cadastro.html"]'
    )?.closest("li");

    if (itemLogin) {
        itemLogin.style.display = "none";
    }

    if (itemCadastro) {
        itemCadastro.style.display = "none";
    }

    let itemPerfil = document.getElementById("menuPerfil");

    if (!itemPerfil) {

        itemPerfil = document.createElement("li");
        itemPerfil.id = "menuPerfil";

        nav.appendChild(itemPerfil);
    }

    const nome = usuario.NomeUsuario ||
        usuario.nomeUsuario ||
        "Usuário";

    const imagem = usuario.imagem ||
        usuario.Imagem ||
        "";

    const iniciais = nome
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(parte => parte.charAt(0).toUpperCase())
        .join("");

    const foto = prepararFotoUsuario(imagem);

    itemPerfil.innerHTML = `
        <a
            href="${PAGINA_PERFIL}"
            title="Meu perfil"
            aria-label="Acessar meu perfil"
        >
            ${
                foto
                    ? `
                        <img
                            id="fotoUsuarioMenu"
                            src="${foto}"
                            alt="Foto do usuário"
                        >
                    `
                    : `
                        <span class="iniciaisUsuario">
                            ${iniciais}
                        </span>
                    `
            }
        </a>
    `;
}

// ===== ATUALIZAR MENU =====
async function atualizarMenuUsuario() {

    const nav = document.querySelector("#menu nav");

    if (!nav) return;

    const itemLogin = nav.querySelector(
        'a[href*="loging.html"]'
    )?.closest("li");

    const itemCadastro = nav.querySelector(
        'a[href*="cadastro.html"]'
    )?.closest("li");

    const usuario = recuperarUsuarioMenu();

    // ===== USUÁRIO DESLOGADO =====
    if (!usuario) {

        const itemPerfil = document.getElementById("menuPerfil");

        if (itemPerfil) {
            itemPerfil.remove();
        }

        if (itemLogin) {
            itemLogin.style.display = "";
        }

        if (itemCadastro) {
            itemCadastro.style.display = "";
        }

        return;
    }

    // ===== USUÁRIO LOGADO =====
    let usuarioAtualizado = usuario;

    const idUsuario = Number(
        usuario.IdUsuario || usuario.idUsuario
    );

    if (idUsuario && !usuario.imagem && !usuario.Imagem) {

        try {

            const resposta = await fetch(
                `${API_MENU}/usuario/${idUsuario}`
            );

            if (resposta.ok) {
                usuarioAtualizado = await resposta.json();
            }

        } catch (erro) {

            console.error(
                "Não foi possível carregar a foto do usuário:",
                erro
            );
        }
    }

    criarMenuPerfil(usuarioAtualizado);
}

// ===== ALERTA PERSONALIZADO =====
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

// ===== EXECUÇÃO =====
document.addEventListener(
    "DOMContentLoaded",
    atualizarMenuUsuario
);

// ===== ATUALIZAR QUANDO O ARMAZENAMENTO MUDAR =====
window.addEventListener("storage", atualizarMenuUsuario);
