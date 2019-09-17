import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;

import java.util.TimeZone;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

@SpringBootApplication
@ComponentScan(basePackages = {
	
	"cronapp.framework.authentication.normal",
	"cronapp.framework.authentication.security",
	"cronapp.framework.rest",
	"cronapp.framework.scheduler",
	"auth.permission",
	"api.rest.events",
	"api.rest.webservices",
	"reports",
	"cronapi",
	"blockly",
	"app"
})
@EnableAutoConfiguration(exclude = { DataSourceAutoConfiguration.class, HibernateJpaAutoConfiguration.class })
public class SpringBootMain extends SpringBootServletInitializer {

    static {
        TimeZone.setDefault(TimeZone.getTimeZone("Brazil/East"));
    }

	public static void main(String[] args) throws Exception {
		CronappApplication.run(args);
	}

}
