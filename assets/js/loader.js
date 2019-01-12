/**
 * CARGA DIFERIDA UNIVERSAL DE FICHEROS EXTERNOS 
 * (scripts, link, img, background-image)
 * -------------------------------------------------------------------------------------------
 * by Carlos Manuel Díaz Jorge
 * CC - by-nc-nd
 * https://stackoverflow.com/questions/14521108/dynamically-load-js-inside-js
 * -------------------------------------------------------------------------------------------
 *  <script>, 
 *  <link>, 
 *  <img>, 
 *  <style>background-image: url('');</style>
 * -------------------------------------------------------------------------------------------
 *  Todas las webs necesitan cargar ficheros externos, sin embargo
 * esto supone un problema en su rendimiento, dado que bloquean su presentación
 * hasta que los elementos externos están totalmente descargados.
 * La presentación de una web se agiliza si se carga en paralelo junto con los ficheros externos.
 * Por ejemplo, se puede mostrar la parte superior del HTML antes incluso de que las imágenes
 * del final de la página sean descargadas.
 * 
 * Para conseguir esto, se puede:
 *  JAVASCRIPT:
 *  - Cargar los JS en paralelo (async) junto a la página, evitando así bloquear la presentación de la web.
 *      Sin embargo, los JS no pueden ser cargados todos en paralelo, ya que unos dependen de otros.
 *      Por ejemplo, para poder usar una librería, es necesario que haya sido cargada previamente.
 *      En caso de dependencias cargamos los scripts de forma diferida y por fases.
 * 
 *  CSS:
 *  - Cargar los CSS en paralelo: ya se consigue agregando a la etiqueta link:
 *      <link rel="stylesheet" href="css.css" media="none" onload="if(media!='all')media='all'">
 *      https://www.filamentgroup.com/lab/async-css.html
 *      https://stackoverflow.com/questions/32759272/how-to-load-css-asynchronously
 * 
 *      CSS CRÍTICO
 *      Renderizamos la parte superior de la página con estilos inline
 *      https://www.smashingmagazine.com/2015/08/understanding-critical-css/
 *      Usando la herramienta Critical: 
 *        https://github.com/addyosmani/critical
 * 
 *    Dentro de los css también hay enlaces a ficheros externos que deberían revisarse.
 * 
 *  IMAGENES
 *  - Cargar las imagenes una vez que se haya cargado la página: tanto <img> como <style>background-image</style>
 *    Mediante un simple script podemos cargar todas las imagenes de la página de forma diferida
 *    realizando unicamente unos pequeños cambios en el HTML.
 *    - Todas las etiquetas <img> que queramos diferir contendran la clase deferload
 *      y también el atribugo data-src con la url de la imagen.
 *      El script de carga diferida cargará todas las imagenes una vez finalizada la carga del HTML.
 *    - Todas las cargas de imagenes de background se quitarán de los CSS.
 *      Para agregar un background en cualquier capa, se le agregará a la capa el atributo data-src.
 *      El script de carga diferida aplicará el background a la capa una vez finalizada la carga del HTML.
 * 
 *  FONTS (CSS): 
 *  - Cargar las fuentes también ralentiza la carga de la página.
 *    https://www.lockedownseo.com/load-google-fonts-asynchronously-for-page-speed/
 * -------------------------------------------------------------------------------------------
 */

//============================================================================================
/**
 * LISTADO DE SCRIPTS A CARGAR Y SUS DEPENDENCIAS (ORDEN DE CARGA)
 * Cada elemento de este array es un nivel.
 * Cada nivel se cargará después de terminar la carga de los scripts del anterior nivel.
 * En cada nivel, todos sus scripts se cargan en paralelo (async)
 */
var js = {
  "fases": [
    [
      // No dependientes entre si
      { "aws-sdk": "https://cdnjs.cloudflare.com/ajax/libs/aws-sdk/2.368.0/aws-sdk.min.js" }, // https://cdn.rawgit.com/aws/aws-sdk-js/master/dist/aws-sdk.js
      { "underscore": "https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js" },
      // { "angular": "https://ajax.googleapis.com/ajax/libs/angularjs/1.6.4/angular.min.js" },
      { "googleGapi": "https://apis.google.com/js/platform.js?onload=onLogIn" },
      { "popper": "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.3/umd/popper.min.js" },
      { "jquery": "https://code.jquery.com/jquery-1.9.1.min.js" },
    ],
    [
      { "bootstrap": "https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/js/bootstrap.min.js" }, // <- popper and jQuery
      { "cognito": "https://cdn.rawgit.com/aws/amazon-cognito-identity-js/master/dist/aws-cognito-sdk.min.js" }, // <- aws-sdk
      { "interaccion": domainURL + "/assets/js/interacciones.js" }, // jquery
    ],
    [
      { "cognito-id": "https://cdn.rawgit.com/aws/amazon-cognito-identity-js/master/dist/amazon-cognito-identity.min.js" }, // <- aws-sdk			
    ],
    [
      { "auth": domainURL + "/assets/js/auth.js" }, // <- aws-sdk, aws-cognito-sdk, amazon-cognito-identity
    ]
  ]
};

loadLevel(0, js.fases);

/** 
 * Una vez finalizada la carga de todas las librerías del nivel, 
 * cargamos los scripts del siguiente nivel.
*/
function loadLevel(numLevel, fases) {
  debug = false;
  var loaded = 0;
  var level = fases[numLevel];
  var toLoad = level.length;
  // Recorremos todos los scrpts de autor
  for (var i = 0; i < level.length; i++) {
    // Creamos el objeto script
    var script = document.createElement('script');
    script.id = Object.keys(level[i])[0]; // Establecemos la KEY como ID.
    script.async = "async";
    script.type = 'text/javascript';
    script.src = Object.values(level[i])[0];
    document.head.appendChild(script);
    if (debug) console.log(numLevel + "-" + i + " -> " + script.src);

    // Cada vez que se carga una librería, la contamos al cargarse
    script.onload = function () {
      debug = false;
      loaded++;
      if (debug) console.log(numLevel + "-" + loaded + ' cargada: ' + this.src);
      if (loaded === toLoad) {
        // Una vez cargados todos los scripts de la fase actual,
        // cargamos la siguiente fase.. si la hay
        if (!(typeof fases[numLevel + 1] === 'undefined')) {
          loadLevel(numLevel + 1, fases); // <== LLAMADA RECURSIVA A CARGAR LA SIGUIENTE FASE.
        }
      }
    };
  }
}

//============================================================================================
/**
 * Toma todas las etiquetas de imágenes con clase deferload
 * https://codepen.io/NickMcBurney/pen/RagyeW?editors=1010
 */

/**
 * DEFER <IMG> TAG FUNCTION
 * Toma todos los tags de imagen <img> y les asigna el src una vez finalizada la carga de la página.
 * Con esto conseguimos diferir la carga de las imagenes de la página.
 * La carga de imágenes no impide la carga de la página (se cargan en paralelo)
 */
function deferImg(){
	var debug = false;
	// Toma todas las imagenes con la clase 'deferload'
	var $images = document.querySelectorAll("img.deferload");
	// Si hay imagenes en la pagina, ejecuta cada una y actualiza su src.
	if($images.length > 0) {
		for (var i = 0, len = $images.length; i < len; i++) {		
			// Obtenemos la url de cada imagen desde el atributo data-src
			var image_url = $images[i].getAttribute("data-src");
			// Establecemos el src
			$images[i].src = image_url;		
			// debugging
			var $lognumber = i + 1;
			if (debug) console.log("Image No." + $lognumber + " loaded");
		}
	}
	if (debug) console.log("All Images loaded");
}

// PAGE LOADED
window.addEventListener('load', function() {
	// Ejecuta la función deferImg()
   deferImg();
}, false);

//===============================================================================
//===============================================================================

/**
 * Difiere todas las propiedades CSS background-image
 * https://codepen.io/anon/pen/rryxoK
 */

function deferBackgroundImage() {
	// Tomamos todos los divs con atributo data-src
	var imgDefer = document.querySelectorAll('div[data-src]');
	var styleBackgroundImg = "background-image: url({url});";
  // var style = "{url}";
  for (var i = 0; i < imgDefer.length; i++) {
    oldStyle = imgDefer[i].getAttribute('style');
    if (oldStyle) {
      newStyle = styleBackgroundImg.replace("{url}", imgDefer[i].getAttribute('data-src')) + oldStyle;
    } else {
      newStyle = styleBackgroundImg.replace("{url}", imgDefer[i].getAttribute('data-src'));
    }
		
    imgDefer[i].setAttribute('style', newStyle );
  }
}
// window.onload = deferBackgroundImage();
window.addEventListener('load', function() {
	// Ejecuta la función deferBackgroundImage()
  deferBackgroundImage();
}, false);
