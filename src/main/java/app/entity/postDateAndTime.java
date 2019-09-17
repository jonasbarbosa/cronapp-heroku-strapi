package app.entity;

import java.io.*;
import javax.persistence.*;
import java.util.*;
import javax.xml.bind.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonFilter;
import cronapi.rest.security.CronappSecurity;


/**
 * Classe que representa a tabela POSTDATEANDTIME
 * @generated
 */
@Entity
@Table(name = "\"POSTDATEANDTIME\"")
@XmlRootElement
@CronappSecurity
@JsonFilter("app.entity.postDateAndTime")
public class postDateAndTime implements Serializable {

  /**
   * UID da classe, necessário na serialização
   * @generated
   */
  private static final long serialVersionUID = 1L;

  /**
   * @generated
   */
  @Id
  @Column(name = "id", nullable = false, insertable=true, updatable=true)
  private java.lang.String id = UUID.randomUUID().toString().toUpperCase();

  /**
  * @generated
  */
  @Temporal(TemporalType.DATE)
  @Column(name = "data", nullable = true, unique = false, insertable=true, updatable=true)
  
  private java.util.Date data;

  /**
  * @generated
  */
  @Temporal(TemporalType.TIME)
  @Column(name = "hora", nullable = true, unique = false, insertable=true, updatable=true)
  
  private java.util.Date hora;

  /**
   * Construtor
   * @generated
   */
  public postDateAndTime(){
  }


  /**
   * Obtém id
   * return id
   * @generated
   */
  
  public java.lang.String getId(){
    return this.id;
  }

  /**
   * Define id
   * @param id id
   * @generated
   */
  public postDateAndTime setId(java.lang.String id){
    this.id = id;
    return this;
  }

  /**
   * Obtém data
   * return data
   * @generated
   */
  
  public java.util.Date getData(){
    return this.data;
  }

  /**
   * Define data
   * @param data data
   * @generated
   */
  public postDateAndTime setData(java.util.Date data){
    this.data = data;
    return this;
  }

  /**
   * Obtém hora
   * return hora
   * @generated
   */
  
  public java.util.Date getHora(){
    return this.hora;
  }

  /**
   * Define hora
   * @param hora hora
   * @generated
   */
  public postDateAndTime setHora(java.util.Date hora){
    this.hora = hora;
    return this;
  }

  /**
   * @generated
   */
  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    postDateAndTime object = (postDateAndTime)obj;
    if (id != null ? !id.equals(object.id) : object.id != null) return false;
    return true;
  }

  /**
   * @generated
   */
  @Override
  public int hashCode() {
    int result = 1;
    result = 31 * result + ((id == null) ? 0 : id.hashCode());
    return result;
  }

}
