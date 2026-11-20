
package com.br.ParkiFacil.Controller;

import com.br.ParkiFacil.DAO.InterfaceUsuario;
import com.br.ParkiFacil.Entity.Usuario;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.ArrayList;
import java.util.List;

@RestController
@CrossOrigin("*")
@RequestMapping("/usuario")
public class ControllerUsuario {

    @Autowired
    private InterfaceUsuario dao;

    // Montar os dados do usuário sem retornar a senha
    private Map<String, Object> dadosUsuario(Usuario usuario) {

        Map<String, Object> dados = new HashMap<>();

        dados.put("IdUsuario", usuario.getIdUsuario());
        dados.put("NomeUsuario", usuario.getNomeUsuario());
        dados.put("CPF", usuario.getCPF());
        dados.put("email", usuario.getEmail());
        dados.put("telefone", usuario.getTelefone());
        dados.put("imagem", usuario.getImagem());

        return dados;
    }

    // Listar usuários sem expor as senhas
    @GetMapping
    public ResponseEntity<?> ListarUsuario() {

        List<Map<String, Object>> usuarios = new ArrayList<>();

        dao.findAll().forEach(usuario ->
                usuarios.add(dadosUsuario(usuario))
        );

        return ResponseEntity.ok(usuarios);
    }

    // Cadastrar usuário
    @PostMapping
    public ResponseEntity<?> criarUsuario(@RequestBody Usuario usuarios) {

        if (usuarios.getSenha() == null || usuarios.getSenha().isBlank()) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "A senha é obrigatória!"
                    )
            );
        }

        Usuario novo = dao.save(usuarios);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of(
                        "success", true,
                        "message", "Usuário cadastrado com sucesso!",
                        "IdUsuario", novo.getIdUsuario(),
                        "NomeUsuario", novo.getNomeUsuario(),
                        "email", novo.getEmail()
                )
        );
    }

    // Login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Usuario usuario) {

        Optional<Usuario> cadastro = dao.findByEmailAndSenha(
                usuario.getEmail(),
                usuario.getSenha()
        );

        if (cadastro.isPresent()) {

            Usuario usuarioLogado = cadastro.get();

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "Login realizado com sucesso!",
                            "usuario", dadosUsuario(usuarioLogado)
                    )
            );

        } else {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of(
                            "success", false,
                            "message", "Usuário ou senha inválidos"
                    )
            );
        }
    }

    // Buscar usuário pelo ID
    @GetMapping("/{idUsuario}")
    public ResponseEntity<?> buscarUsuario(
            @PathVariable Integer idUsuario) {

        Optional<Usuario> cadastro = dao.findById(idUsuario);

        if (cadastro.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(
                dadosUsuario(cadastro.get())
        );
    }

    // Editar perfil e imagem
    @PutMapping("/{idUsuario}")
    public ResponseEntity<?> editarPerfil(
            @PathVariable Integer idUsuario,
            @RequestBody Map<String, Object> dados) {

        Optional<Usuario> cadastro = dao.findById(idUsuario);

        if (cadastro.isEmpty()) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    Map.of(
                            "success", false,
                            "message", "Usuário não encontrado!"
                    )
            );
        }

        Usuario usuario = cadastro.get();

        // Nome: aceita os dois formatos enviados pelo JavaScript
        Object nomeRecebido = dados.containsKey("NomeUsuario")
                ? dados.get("NomeUsuario")
                : dados.get("nomeUsuario");

        if (nomeRecebido != null &&
                !nomeRecebido.toString().isBlank()) {

            usuario.setNomeUsuario(nomeRecebido.toString().trim());
        }

        // E-mail
        if (dados.get("email") != null &&
                !dados.get("email").toString().isBlank()) {

            usuario.setEmail(dados.get("email").toString().trim());
        }

        // Telefone
        if (dados.get("telefone") != null &&
                !dados.get("telefone").toString().isBlank()) {

            usuario.setTelefone(dados.get("telefone").toString().trim());
        }

        // Imagem
        if (dados.containsKey("imagem")) {
            usuario.setImagem((String) dados.get("imagem"));
        }

        Usuario atualizado = dao.save(usuario);

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "Perfil atualizado com sucesso!",
                        "usuario", dadosUsuario(atualizado)
                )
        );
    }

    // Trocar senha
    @PutMapping("/{idUsuario}/senha")
    public ResponseEntity<?> trocarSenha(
            @PathVariable Integer idUsuario,
            @RequestBody Map<String, String> dados) {

        Optional<Usuario> cadastro = dao.findById(idUsuario);

        if (cadastro.isEmpty()) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    Map.of(
                            "success", false,
                            "message", "Usuário não encontrado!"
                    )
            );
        }

        Usuario usuario = cadastro.get();

        String senhaAtual = dados.get("senhaAtual");
        String novaSenha = dados.get("novaSenha");
        String confirmarSenha = dados.get("confirmarSenha");

        if (senhaAtual == null || novaSenha == null ||
                confirmarSenha == null ||
                senhaAtual.isBlank() || novaSenha.isBlank() ||
                confirmarSenha.isBlank()) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "Preencha todos os campos!"
                    )
            );
        }

        if (!usuario.getSenha().equals(senhaAtual)) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "A senha atual está incorreta!"
                    )
            );
        }

        if (!novaSenha.equals(confirmarSenha)) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "As senhas não coincidem!"
                    )
            );
        }

        if (novaSenha.length() < 6) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "A nova senha deve ter pelo menos 6 caracteres!"
                    )
            );
        }

        usuario.setSenha(novaSenha);

        dao.save(usuario);

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "Senha alterada com sucesso!"
                )
        );
    }
}
