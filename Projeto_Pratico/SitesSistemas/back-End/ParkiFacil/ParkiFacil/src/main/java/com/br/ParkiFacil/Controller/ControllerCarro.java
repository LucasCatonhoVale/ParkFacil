
package com.br.ParkiFacil.Controller;

import com.br.ParkiFacil.DAO.InterfaceCarro;
import com.br.ParkiFacil.DAO.InterfaceUsuario;
import com.br.ParkiFacil.Entity.Carro;
import com.br.ParkiFacil.Entity.Usuario;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin("*")
@RequestMapping("/carro")
public class ControllerCarro {

    @Autowired
    private InterfaceCarro dao;

    @Autowired
    private InterfaceUsuario usuarioDao;

    // Listar veículos de um usuário
    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<?> listarCarros(@PathVariable Integer idUsuario) {

        List<Carro> carros = dao.buscarPorUsuario(idUsuario);
        return ResponseEntity.ok(carros.stream().map(carro -> Map.of(
                "IdCarro", carro.getIdCarro(),
                "Modelo", carro.getModelo(),
                "Placa", carro.getPlaca(),
                "cor", carro.getCor(),
                "tipo", carro.getTipo(),
                "marca", carro.getMarca()
        )).toList());
    }

    // Cadastrar veículo
    @PostMapping("/usuario/{idUsuario}")
    public ResponseEntity<?> cadastrarCarro(
            @PathVariable Integer idUsuario,
            @RequestBody Carro carro) {

        Optional<Usuario> usuario = usuarioDao.findById(idUsuario);

        if (usuario.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    Map.of("message", "Usuário não encontrado!")
            );
        }

        carro.setUsuario(usuario.get());

        Carro novoCarro = dao.save(carro);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of(
                        "success", true,
                        "message", "Veículo cadastrado com sucesso!",
                        "IdCarro", novoCarro.getIdCarro()
                )
        );
    }

    // Excluir veículo
    @DeleteMapping("/{idCarro}/usuario/{idUsuario}")
    public ResponseEntity<?> excluirCarro(
            @PathVariable Integer idCarro,
            @PathVariable Integer idUsuario) {

        Optional<Carro> carro = dao.findById(idCarro);

        if (carro.isEmpty() ||
                !carro.get().getUsuario().getIdUsuario().equals(idUsuario)) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    Map.of("message", "Veículo não encontrado para este usuário!")
            );
        }

        dao.delete(carro.get());

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "Veículo excluído com sucesso!"
                )
        );
    }
}
