
package com.br.ParkiFacil.Controller;

import com.br.ParkiFacil.DAO.InterfaceEstacionamento;
import com.br.ParkiFacil.DAO.InterfaceImagensEstacionamento;
import com.br.ParkiFacil.Entity.ImagensEstacionamento;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin("*")
@RequestMapping("/estacionamento")
public class ControllerEstacionamento {

    @Autowired
    private InterfaceEstacionamento dao;

    @Autowired
    private InterfaceImagensEstacionamento daoImagens;

    // Listar todos os estacionamentos
    @GetMapping
    public ResponseEntity<?> ListarEstacionamentos() {
        return ResponseEntity.ok(dao.findAll());
    }

    // Buscar somente a imagem principal
    @GetMapping("/{id}/imagem-principal")
    public ResponseEntity<?> BuscarImagemPrincipal(@PathVariable Integer id) {

        return daoImagens.buscarImagemPrincipal(id)
                .map(imagem -> ResponseEntity.ok(imagem.getPrincipal()))
                .orElse(ResponseEntity.notFound().build());
    }

    // Buscar todas as imagens do estacionamento
    @GetMapping("/{id}/imagens")
    public ResponseEntity<?> ListarImagens(@PathVariable Integer id) {

        List<ImagensEstacionamento> imagens =
                daoImagens.buscarTodasImagens(id);

        List<Map<String, Object>> resultado = imagens.stream().map(imagem -> {

            Map<String, Object> dados = new HashMap<>();

            dados.put("IdImagem", imagem.getIdImagem());
            dados.put("CaminhoImagem", imagem.getCaminhoImagem());
            dados.put("principal", imagem.getPrincipal());

            return dados;

        }).toList();

        return ResponseEntity.ok(resultado);
    }
}
