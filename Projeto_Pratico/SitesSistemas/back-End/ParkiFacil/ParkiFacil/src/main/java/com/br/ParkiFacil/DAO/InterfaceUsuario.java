package com.br.ParkiFacil.DAO;

import com.br.ParkiFacil.Entity.Usuario;
import org.springframework.data.repository.CrudRepository;

import java.util.Optional;

public interface InterfaceUsuario extends CrudRepository<Usuario, Integer> {
    Optional<Usuario> findByEmailAndSenha(
            String email,
            String senha

    );
}
