
package com.br.ParkiFacil.DAO;

import com.br.ParkiFacil.Entity.Carro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InterfaceCarro extends JpaRepository<Carro, Integer> {

    @Query(value = "SELECT * FROM Carro WHERE Id_Usuario = :idUsuario", nativeQuery = true)
    List<Carro> buscarPorUsuario(@Param("idUsuario") Integer idUsuario);
}
