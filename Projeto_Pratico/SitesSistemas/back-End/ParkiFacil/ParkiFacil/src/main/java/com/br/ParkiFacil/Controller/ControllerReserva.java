
package com.br.ParkiFacil.Controller;

import com.br.ParkiFacil.DAO.InterfaceReserva;
import com.br.ParkiFacil.DAO.InterfaceUsuario;
import com.br.ParkiFacil.DAO.InterfaceCarro;
import com.br.ParkiFacil.DAO.InterfaceEstacionamento;

import com.br.ParkiFacil.Entity.Reserva;
import com.br.ParkiFacil.Entity.Usuario;
import com.br.ParkiFacil.Entity.Carro;
import com.br.ParkiFacil.Entity.Estacionamento;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.sql.Time;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/reserva")
public class ControllerReserva {

    @Autowired
    private InterfaceReserva dao;

    @Autowired
    private InterfaceUsuario usuarioDao;

    @Autowired
    private InterfaceCarro carroDao;

    @Autowired
    private InterfaceEstacionamento estacionamentoDao;

    // Recuperar valores enviados pelo JavaScript
    private String obterTexto(Map<String, Object> dados, String... campos) {

        for (String campo : campos) {

            Object valor = dados.get(campo);

            if (valor != null && !valor.toString().isBlank()) {
                return valor.toString().trim();
            }
        }

        return null;
    }

    // ===== CANCELAR RESERVA =====
    @PostMapping("/{idReserva}/usuario/{idUsuario}/cancelar")
    @Transactional
    public ResponseEntity<?> cancelarReserva(
            @PathVariable Integer idReserva,
            @PathVariable Integer idUsuario) {

        Optional<Reserva> consulta = dao.findById(idReserva);

        if (consulta.isEmpty()) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    Map.of(
                            "success", false,
                            "message", "Reserva não encontrada!"
                    )
            );
        }

        Reserva reserva = consulta.get();

        // Verificar se a reserva pertence ao usuário
        if (reserva.getUsuario() == null ||
                !reserva.getUsuario().getIdUsuario().equals(idUsuario)) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    Map.of(
                            "success", false,
                            "message", "Reserva não encontrada para este usuário!"
                    )
            );
        }

        // Verificar se já foi cancelada ou encerrada
        if ("Encerrado".equalsIgnoreCase(reserva.getStatus()) ||
                "Cancelada".equalsIgnoreCase(reserva.getStatus()) ||
                "Cancelado".equalsIgnoreCase(reserva.getStatus())) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "Esta reserva não pode mais ser cancelada!"
                    )
            );
        }

        if (reserva.getDia() == null ||
                reserva.getHorarioChegada() == null) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "Não foi possível verificar o horário da reserva!"
                    )
            );
        }

        // Verificar data e horário de chegada
        LocalDateTime inicioReserva = LocalDateTime.of(
                reserva.getDia().toLocalDate(),
                reserva.getHorarioChegada().toLocalTime()
        );

        if (!LocalDateTime.now().isBefore(inicioReserva)) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "Não é possível cancelar uma reserva que já começou!"
                    )
            );
        }

        // Alterar situação
        reserva.setStatus("Cancelada");

        dao.save(reserva);

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "Reserva cancelada com sucesso!",
                        "IdReserva", reserva.getIdReserva(),
                        "StatusReserva", reserva.getStatus()
                )
        );
    }

    // ===== LISTAR RESERVAS DE UM USUÁRIO =====
    @GetMapping("/usuario/{idUsuario}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> listarReservasUsuario(
            @PathVariable Integer idUsuario) {

        Optional<Usuario> usuario = usuarioDao.findById(idUsuario);

        if (usuario.isEmpty()) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    Map.of(
                            "success", false,
                            "message", "Usuário não encontrado!"
                    )
            );
        }

        List<Reserva> reservas = dao.buscarPorUsuario(idUsuario);

        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Reserva reserva : reservas) {

            Map<String, Object> dados = new HashMap<>();

            Estacionamento estacionamento = reserva.getEstacionamento();
            Carro carro = reserva.getCarro();

            dados.put("IdReserva", reserva.getIdReserva());
            dados.put("IdUsuario", idUsuario);

            dados.put("Dia",
                    reserva.getDia() != null
                            ? reserva.getDia().toString()
                            : null);

            dados.put("HoraChegada",
                    reserva.getHorarioChegada() != null
                            ? reserva.getHorarioChegada().toString()
                            : null);

            dados.put("HoraSaida",
                    reserva.getHorarioSaida() != null
                            ? reserva.getHorarioSaida().toString()
                            : null);

            dados.put("StatusReserva", reserva.getStatus());
            dados.put("ValorTotal", reserva.getValorTotal());

            // Dados do estacionamento
            if (estacionamento != null) {

                dados.put("IdEstacionamento",
                        estacionamento.getIdEstacionamento());

                dados.put("NomeEstacionamento",
                        estacionamento.getNomeEstacionamento());

                dados.put("Endereco",
                        estacionamento.getEndereco());

                dados.put("Numero",
                        estacionamento.getNumero());

                dados.put("Complemento",
                        estacionamento.getComplemento());

                dados.put("Bairro",
                        estacionamento.getBairro());

                dados.put("Cidade",
                        estacionamento.getCidade());

                dados.put("Estado",
                        estacionamento.getEstado());

                dados.put("QtVagas",
                        estacionamento.getQtVagas());

                dados.put("ValorHora",
                        estacionamento.getValorHora());
            }

            // Dados do veículo
            if (carro != null) {

                dados.put("IdCarro", carro.getIdCarro());
                dados.put("Modelo", carro.getModelo());
                dados.put("Placa", carro.getPlaca());
                dados.put("Cor", carro.getCor());
                dados.put("Tipo", carro.getTipo());
                dados.put("Marca", carro.getMarca());
            }

            resultado.add(dados);
        }

        return ResponseEntity.ok(resultado);
    }

    // ===== CADASTRAR RESERVA =====
    @PostMapping
    @Transactional
    public ResponseEntity<?> cadastrarReserva(
            @RequestBody Map<String, Object> dados) {

        try {

            String usuarioTexto = obterTexto(
                    dados, "IdUsuario", "idUsuario"
            );

            String estacionamentoTexto = obterTexto(
                    dados, "IdEstacionamento", "idEstacionamento"
            );

            String carroTexto = obterTexto(
                    dados, "IdCarro", "idCarro"
            );

            String dataTexto = obterTexto(
                    dados, "dataReserva", "data", "Dia"
            );

            String chegadaTexto = obterTexto(
                    dados, "horaChegada", "horaInicio", "HoraChegada"
            );

            String saidaTexto = obterTexto(
                    dados, "horaSaida", "horaTermino", "HoraSaida"
            );

            String statusTexto = obterTexto(
                    dados, "StatusReserva", "status"
            );

            if (usuarioTexto == null ||
                    estacionamentoTexto == null ||
                    carroTexto == null ||
                    dataTexto == null ||
                    chegadaTexto == null ||
                    saidaTexto == null ||
                    statusTexto == null) {

                return ResponseEntity.badRequest().body(
                        Map.of(
                                "success", false,
                                "message", "Preencha todos os dados da reserva!"
                        )
                );
            }

            if (!statusTexto.equals("Pendente") &&
                    !statusTexto.equals("Em andamento") &&
                    !statusTexto.equals("Encerrado")) {

                return ResponseEntity.badRequest().body(
                        Map.of(
                                "success", false,
                                "message", "Situação da reserva inválida!"
                        )
                );
            }

            Integer idUsuario = Integer.valueOf(usuarioTexto);
            Integer idEstacionamento = Integer.valueOf(estacionamentoTexto);
            Integer idCarro = Integer.valueOf(carroTexto);

            LocalDate data = LocalDate.parse(dataTexto);
            LocalTime horaChegada = LocalTime.parse(chegadaTexto);
            LocalTime horaSaida = LocalTime.parse(saidaTexto);

            if (!horaSaida.isAfter(horaChegada)) {

                return ResponseEntity.badRequest().body(
                        Map.of(
                                "success", false,
                                "message", "A hora de saída deve ser depois da chegada!"
                        )
                );
            }

            // Buscar usuário
            Optional<Usuario> usuario = usuarioDao.findById(idUsuario);

            if (usuario.isEmpty()) {

                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        Map.of(
                                "success", false,
                                "message", "Usuário não encontrado!"
                        )
                );
            }

            // Buscar estacionamento
            Optional<Estacionamento> estacionamento =
                    estacionamentoDao.findById(idEstacionamento);

            if (estacionamento.isEmpty()) {

                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        Map.of(
                                "success", false,
                                "message", "Estacionamento não encontrado!"
                        )
                );
            }

            // Verificar se o veículo pertence ao usuário
            List<Carro> carrosUsuario =
                    carroDao.buscarPorUsuario(idUsuario);

            Optional<Carro> carroSelecionado = carrosUsuario.stream()
                    .filter(carro ->
                            carro.getIdCarro().equals(idCarro))
                    .findFirst();

            if (carroSelecionado.isEmpty()) {

                return ResponseEntity.badRequest().body(
                        Map.of(
                                "success", false,
                                "message", "Veículo não encontrado para este usuário!"
                        )
                );
            }

            // Valor por hora
            BigDecimal valorHora =
                    estacionamento.get().getValorHora();

            if (valorHora == null) {

                return ResponseEntity.badRequest().body(
                        Map.of(
                                "success", false,
                                "message", "Estacionamento sem valor por hora cadastrado!"
                        )
                );
            }

            // Calcular duração
            long duracaoMinutos = Duration.between(
                    horaChegada,
                    horaSaida
            ).toMinutes();

            // Calcular valor total
            BigDecimal valorTotal = valorHora
                    .multiply(BigDecimal.valueOf(duracaoMinutos))
                    .divide(
                            BigDecimal.valueOf(60),
                            2,
                            RoundingMode.HALF_UP
                    );

            // Criar reserva
            Reserva reserva = new Reserva();

            reserva.setDia(Date.valueOf(data));
            reserva.setHorarioChegada(Time.valueOf(horaChegada));
            reserva.setHorarioSaida(Time.valueOf(horaSaida));

            reserva.setStatus(statusTexto);
            reserva.setValorTotal(valorTotal);

            reserva.setUsuario(usuario.get());
            reserva.setCarro(carroSelecionado.get());
            reserva.setEstacionamento(estacionamento.get());

            // Salvar reserva
            Reserva novaReserva = dao.save(reserva);

            Map<String, Object> resposta = new HashMap<>();

            resposta.put("success", true);
            resposta.put("message", "Reserva cadastrada com sucesso!");
            resposta.put("IdReserva", novaReserva.getIdReserva());
            resposta.put("IdUsuario", idUsuario);
            resposta.put("IdEstacionamento", idEstacionamento);
            resposta.put("IdCarro", idCarro);
            resposta.put("DataReserva", data.toString());
            resposta.put("HoraChegada", horaChegada.toString());
            resposta.put("HoraSaida", horaSaida.toString());
            resposta.put("ValorTotal", valorTotal);
            resposta.put("StatusReserva", novaReserva.getStatus());

            return ResponseEntity.status(HttpStatus.CREATED).body(resposta);

        } catch (NumberFormatException erro) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "Um dos IDs informados é inválido!"
                    )
            );

        } catch (java.time.format.DateTimeParseException erro) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "Data ou horário inválido!"
                    )
            );
        }
    }
}
