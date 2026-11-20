package com.br.ParkiFacil.DAO;

import com.br.ParkiFacil.Entity.Estacionamento;
import org.springframework.data.repository.CrudRepository;

public interface InterfaceEstacionamento extends CrudRepository<Estacionamento, Integer> {
}
