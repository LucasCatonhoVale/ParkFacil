
package com.br.ParkiFacil.DAO;

import com.br.ParkiFacil.Entity.ImagensEstacionamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InterfaceImagensEstacionamento extends JpaRepository<ImagensEstacionamento, Integer> {

    @Query(value = "SELECT * FROM ImagemEstacionamento WHERE Id_Estacionamento = :id AND ImagemPrincipal IS NOT NULL AND ImagemPrincipal <> '' LIMIT 1", nativeQuery = true)
    Optional<ImagensEstacionamento> buscarImagemPrincipal(@Param("id") Integer id);

    @Query(value = "SELECT * FROM ImagemEstacionamento WHERE Id_Estacionamento = :id", nativeQuery = true)
    List<ImagensEstacionamento> buscarTodasImagens(@Param("id") Integer id);
}
