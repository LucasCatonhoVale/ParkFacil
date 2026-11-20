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




document.addEventListener("DOMContentLoaded", () => {

    const emailInput = document.getElementById("email");
    const senhaInput = document.getElementById("senha");
    const botaoEntrar = document.getElementById("ent");
    const formulario = document.querySelector(".formulario form");

    async function realizarLogin() {

        const email = emailInput.value.trim();
        const senha = senhaInput.value;

        // Validar campos
        if (email === "" || senha === "") {
            showCustomAlert("Preencha todos os campos!");
            return;
        }

        if (!emailInput.checkValidity()) {
            showCustomAlert("Informe um e-mail válido!");
            return;
        }

        botaoEntrar.disabled = true;
        botaoEntrar.textContent = "Entrando...";

        try {

            const resposta = await fetch("http://localhost:8080/usuario/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    senha: senha
                })
            });

            const dados = await resposta.json();

            if (!resposta.ok || !dados.success) {
                showCustomAlert(dados.message || "E-mail ou senha inválidos!");
                return;
            }

            // Salvar os dados do usuário logado
            localStorage.setItem("usuarioLogado", JSON.stringify({
                IdUsuario: dados.usuario.IdUsuario,
                NomeUsuario: dados.usuario.NomeUsuario,
                email: dados.usuario.email
            }));

            // Também salvar o ID separadamente para facilitar o acesso
            localStorage.setItem("IdUsuario", dados.usuario.IdUsuario);

            showCustomAlert("Login realizado com sucesso!");

            // Redirecionar para a página inicial
            window.location.href = "../SiteCliente/index.html";

        } catch (erro) {

            console.error("Erro no login:", erro);
            showCustomAlert("Não foi possível conectar ao servidor!");

        } finally {

            botaoEntrar.disabled = false;
            botaoEntrar.textContent = "Entrar";

        }
    }

    formulario.addEventListener("submit", (event) => {
        event.preventDefault();
        realizarLogin();
    });

    botaoEntrar.addEventListener("click", (event) => {
        event.preventDefault();
        realizarLogin();
    });

});
