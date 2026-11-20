package com.br.ParkiFacil.Entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.TargetEmbeddable;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Time;
import java.text.DecimalFormat;

@Entity
@Getter
@Setter
@Table(name = "Reserva")

public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id_Reserva")
    private Integer IdReserva;
    @Column(name = "HoraChegada")
    private Time    horarioChegada;
    @Column(name = "HoraSaida")
    private Time    horarioSaida;
    @Column(name = "Dia")
    private Date    dia;
    @Column(name = "StatusReserva")
    private String  Status;
    @Column(name = "ValorTotal")
    private BigDecimal valorTotal;
    @ManyToOne
    @JoinColumn(name = "Id_Carro")
    Carro Carro;
    @ManyToOne
    @JoinColumn(name = "Id_Estacionamento")
    Estacionamento estacionamento;
    @ManyToOne
    @JoinColumn(name = "Id_Usuario")
    Usuario Usuario;
}
