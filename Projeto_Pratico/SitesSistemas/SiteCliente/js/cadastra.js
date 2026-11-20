
document.addEventListener("DOMContentLoaded", () => {

    const formCadastro = document.getElementById("cadastroForm");

    const campoNome = document.getElementById("name");
    const campoEmail = document.getElementById("email");
    const campoCpf = document.getElementById("cpf");
    const campoTelefone = document.getElementById("telefone");
    const campoSenha = document.getElementById("senha");
    const campoConfSenha = document.getElementById("confSenha");

    if (!formCadastro || !campoNome || !campoEmail ||
        !campoCpf || !campoTelefone || !campoSenha || !campoConfSenha) {
        console.error("Erro: campos do cadastro não encontrados.");
        return;
    }

    // Formatação do CPF
    campoCpf.addEventListener("input", () => {
        let cpf = campoCpf.value.replace(/\D/g, "").slice(0, 11);

        cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
        cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
        cpf = cpf.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

        campoCpf.value = cpf;
    });

    // Formatação do telefone
    campoTelefone.addEventListener("input", () => {
        let telefone = campoTelefone.value.replace(/\D/g, "").slice(0, 11);

        if (telefone.length > 10) {
            telefone = telefone.replace(
                /^(\d{2})(\d{5})(\d{4})$/,
                "($1) $2-$3"
            );
        } else if (telefone.length > 6) {
            telefone = telefone.replace(
                /^(\d{2})(\d{4})(\d{0,4})$/,
                "($1) $2-$3"
            );
        } else if (telefone.length > 2) {
            telefone = telefone.replace(/^(\d{2})(\d+)/, "($1) $2");
        }

        campoTelefone.value = telefone;
    });

    // Validação do CPF
    function validarCPF(cpf) {
        cpf = cpf.replace(/\D/g, "");

        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
            return false;
        }

        let soma = 0;

        for (let i = 0; i < 9; i++) {
            soma += Number(cpf[i]) * (10 - i);
        }

        let resto = (soma * 10) % 11;
        if (resto === 10) resto = 0;

        if (resto !== Number(cpf[9])) return false;

        soma = 0;

        for (let i = 0; i < 10; i++) {
            soma += Number(cpf[i]) * (11 - i);
        }

        resto = (soma * 10) % 11;
        if (resto === 10) resto = 0;

        return resto === Number(cpf[10]);
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




    // Envio do cadastro
    formCadastro.addEventListener("submit", async (event) => {

        event.preventDefault();

        const nomeCompleto = campoNome.value.trim();
        const email = campoEmail.value.trim();
        const CPF = campoCpf.value.replace(/\D/g, "");
        const telefone = campoTelefone.value.replace(/\D/g, "");
        const senha = campoSenha.value;
        const confirmarSenha = campoConfSenha.value;

        if (!nomeCompleto || !email || !CPF || !telefone || !senha || !confirmarSenha) {
            showCustomAlert("Preencha todos os campos!");
            return;
        }

        if (!validarCPF(CPF)) {
            showCustomAlert("CPF inválido!");
            campoCpf.focus();
            return;
        }

        if (telefone.length < 10 || telefone.length > 11) {
            showCustomAlert("Telefone inválido!");
            campoTelefone.focus();
            return;
        }

        if (senha.length < 8) {
            showCustomAlert("A senha deve ter pelo menos 8 caracteres!");
            campoSenha.focus();
            return;
        }

        if (senha !== confirmarSenha) {
            showCustomAlert("As senhas não coincidem!");
            campoConfSenha.focus();
            return;
        }

        const partesNome = nomeCompleto.split(/\s+/);

        if (partesNome.length < 2) {
            showCustomAlert("Informe seu nome e sobrenome!");
            campoNome.focus();
            return;
        }

        // Dados enviados com os nomes exatos da entidade Usuario
        const dadosUsuario = {
            IdUsuario: null,
            NomeUsuario: partesNome[0],
            SobreNome: partesNome.slice(1).join(" "),
            CPF: CPF,
            telefone: telefone,
            email: email,
            senha: senha,
            imagem: null,
            TipoUsuario: "CLIENTE",
            Ativo: true
        };

        console.log("Dados enviados:", dadosUsuario);

        try {

            const resposta = await fetch("http://localhost:8080/usuario", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dadosUsuario)
            });

            const resultado = await resposta.json().catch(() => null);

            if (!resposta.ok) {
                throw new Error(
                    resultado?.message ||
                    resultado?.mensagem ||
                    "Erro ao realizar cadastro."
                );
            }

            showCustomAlert("Cadastro realizado com sucesso!");

            formCadastro.reset();

        } catch (erro) {

            console.error("Erro no cadastro:", erro);

            showCustomAlert(erro.message || "Erro ao conectar com o servidor.");

        }

    });

});
