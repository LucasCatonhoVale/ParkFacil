package com.br.ParkiFacil.Entity;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "Carro")
public class Carro {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id_Carro")
    private Integer IdCarro;
    @Column(name = "Modelo")
    private String  Modelo;
    @Column(name = "Placa")
    private String  Placa;
    @Column(name = "Cor")
    private String  cor;
    @Column(name = "Tipo")
    private String  tipo;
    @Column(name = "Marca")
    private String  marca;
    @ManyToOne
    @JoinColumn(name = "Id_Usuario")
    private Usuario usuario;
}