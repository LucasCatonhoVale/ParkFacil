package com.br.ParkiFacil.Entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "ImagemEstacionamento")
public class ImagensEstacionamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id_Imagem")
    private Integer IdImagem;
    @Column(name = "CaminhoImagem" , columnDefinition = "MEDIUMTEXT")
    private String  CaminhoImagem;
    @Column(name = "ImagemPrincipal" , columnDefinition = "MEDIUMTEXT")
    private String  principal;
    @ManyToOne
    @JoinColumn(name = "Id_Estacionamento")
    Estacionamento estacionamento;
}
