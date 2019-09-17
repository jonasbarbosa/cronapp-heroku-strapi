package app.dao;

import app.entity.*;
import java.util.*;
import org.springframework.stereotype.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.domain.*;
import org.springframework.data.repository.query.*;
import org.springframework.transaction.annotation.*; 


/**
 * Realiza operação de Create, Read, Update e Delete no banco de dados.
 * Os métodos de create, edit, delete e outros estão abstraídos no JpaRepository
 * 
 * @see org.springframework.data.jpa.repository.JpaRepository
 * 
 * @generated
 */
@Repository("RoleDAO")
@Transactional(transactionManager="app-TransactionManager")
public interface RoleDAO extends JpaRepository<Role, RolePK> {

  /**
   * Obtém a instância de Role utilizando os identificadores
   * 
   * @param id
   *          Identificador 
   * @param user_id
   *          Identificador 
   * @return Instância relacionada com o filtro indicado
   * @generated
   */    
  @Query("SELECT entity FROM Role entity WHERE entity.id = :id AND entity.user.id = :user_id")
  public Role findOne(@Param(value="id") java.lang.String id, @Param(value="user_id") java.lang.String user_id);

  /**
   * Remove a instância de Role utilizando os identificadores
   * 
   * @param id
   *          Identificador 
   * @param user_id
   *          Identificador 
   * @return Quantidade de modificações efetuadas
   * @generated
   */    
  @Modifying
  @Query("DELETE FROM Role entity WHERE entity.id = :id AND entity.user.id = :user_id")
  public void delete(@Param(value="id") java.lang.String id, @Param(value="user_id") java.lang.String user_id);



  /**
   * Foreign Key user
   * @generated
   */
  @Query("SELECT entity FROM Role entity WHERE entity.user.id = :id")
  public Page<Role> findRolesByUser(@Param(value="id") java.lang.String id, Pageable pageable);

}
