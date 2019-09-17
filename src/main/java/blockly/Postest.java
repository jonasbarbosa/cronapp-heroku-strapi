package blockly;

import cronapi.*;
import cronapi.rest.security.CronappSecurity;
import java.util.concurrent.Callable;


@CronapiMetaData(type = "blockly")
@CronappSecurity
public class Postest {

public static final int TIMEOUT = 300;

/**
 *
 * @return Var
 */
// postest
public static Var postesteeer() throws Exception {
 return new Callable<Var>() {

   private Var url = Var.VAR_NULL;
   private Var produto = Var.VAR_NULL;

   public Var call() throws Exception {
    url = Var.valueOf(Var.valueOf("https://cronapp-heroku-strapi.herokuapp.com/posts/").toString());
    produto = cronapi.util.Operations.getURLFromOthers(Var.valueOf("POST"), Var.valueOf("application/x-www-form-urlencoded"), url, Var.VAR_NULL, Var.VAR_NULL, cronapi.map.Operations.createObjectMapWith(Var.valueOf("title",cronapi.screen.Operations.getValueOfField(Var.valueOf("postDateAndTime.active.data"))) , Var.valueOf("content",cronapi.screen.Operations.getValueOfField(Var.valueOf("postDateAndTime.active.hora")))));
    System.out.println(produto.getObjectAsString());
    return Var.VAR_NULL;
   }
 }.call();
}

}

