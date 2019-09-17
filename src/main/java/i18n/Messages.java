package i18n;

import java.util.Locale; 
import java.util.MissingResourceException;
import java.util.ResourceBundle;

public class Messages {
  
  private static final String BUNDLE_NAME = "i18n.Messages";
  
  private static final ResourceBundle DEFAULT_BUNDLE = ResourceBundle.getBundle(BUNDLE_NAME, new Locale("pt", "BR"));

  public static final ThreadLocal<ResourceBundle> RESOURCE_BUNDLE = new ThreadLocal<>();

  public static String getString(String key) {
    try {
      ResourceBundle bundle = RESOURCE_BUNDLE.get();
      if (bundle == null)
        return DEFAULT_BUNDLE.getString(key);
      else
        return RESOURCE_BUNDLE.get().getString(key);
    }
    catch(MissingResourceException e) {
      return '!' + key + '!';
    }
  }
  
  public static void set(Locale locale) {
    RESOURCE_BUNDLE.set(ResourceBundle.getBundle(BUNDLE_NAME, locale));
  }
}
