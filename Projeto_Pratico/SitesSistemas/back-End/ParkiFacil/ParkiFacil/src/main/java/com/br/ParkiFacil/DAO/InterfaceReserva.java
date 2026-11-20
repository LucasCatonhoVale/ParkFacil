package com.br.ParkiFacil.DAO;

import com.br.ParkiFacil.Entity.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InterfaceReserva extends JpaRepository<Reserva, Integer> {

    @Query(value = """
        SELECT * FROM Reserva
        WHERE Id_Usuario = :idUsuario
        ORDER BY Dia DESC, HoraChegada DESC
        """, nativeQuery = true)
    List<Reserva> buscarPorUsuario(
            @Param("idUsuario") Integer idUsuario
    );
}