/**
 * Toma todas las etiquetas de imágenes con clase deferload
 * https://codepen.io/NickMcBurney/pen/RagyeW?editors=1010
 */

/**
 * DEFER IMAGES TAG FUNCTION
 * Toma todos los tags de imagen <img> y les asigna el src una vez finalizada la carga de la página.
 * Con esto conseguimos diferir la carga de las imagenes de la página.
 * La carga de imágenes no impide la carga de la página (se cargan en paralelo)
 */
function deferImg(){
	var debug = true;
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
  var style = "background-image: url('{url}')";
  for (var i = 0; i < imgDefer.length; i++) {
    imgDefer[i].setAttribute('style', style.replace("{url}", imgDefer[i].getAttribute('data-src')));
  }
}
window.onload = deferBackgroundImage();

