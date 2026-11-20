package com.br.ParkiFacil.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

@Entity
@Getter
@Setter
@Table(name = "Usuario")

public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id_Usuario")
    private  Integer IdUsuario;

    @Column(name = "NmUsuario")
    private  String NomeUsuario;
    @Column(name = "Cpf")
    private  String CPF;
    @Column(name = "Telefone")
    private  String telefone;
    @Column(name = "Email")
    private  String email;
    @Column(name = "Senha")
    private String  senha;

    @Lob
    @Column(name = "Imagem" , columnDefinition = "MEDIUMTEXT")
    private String  imagem;


}