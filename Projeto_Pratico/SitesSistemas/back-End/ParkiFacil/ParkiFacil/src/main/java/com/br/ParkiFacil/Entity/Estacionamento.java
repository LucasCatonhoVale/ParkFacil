package com.br.ParkiFacil.Entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "Estacionamento")
public class Estacionamento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id_Estacionamento")
    private Integer IdEstacionamento;
    @Column(name = "NmEstacionamento")
    private String  NomeEstacionamento;
    @Column(name = "Cnpj")
    private String Cnpj;

    @Column(name = "QtVagas")
    private Integer QtVagas;

    @Column(name = "Telefone")
    private String Telefone;

    @Column(name = "Email")
    private String Email;

    @Column(name = "ValorHora")
    private java.math.BigDecimal ValorHora;

    @Column(name = "Descricao")
    private String Descricao;

    @Column(name = "Endereco")
    private String Endereco;

    @Column(name = "Numero")
    private String Numero;

    @Column(name = "Complemento")
    private String Complemento;

    @Column(name = "Bairro")
    private String Bairro;

    @Column(name = "Cidade")
    private String Cidade;

    @Column(name = "Estado")
    private String Estado;

    @Column(name = "Cep")
    private String Cep;

    @Column(name = "HorarioAbertura")
    private java.time.LocalTime HorarioAbertura;

    @Column(name = "HorarioFechamento")
    private java.time.LocalTime HorarioFechamento;
}
