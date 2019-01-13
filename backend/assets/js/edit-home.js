/**
 * Editar la home (/index.html)
 * Usamos promesas para gestionar mejor las peticiones asíncronas y organizar mejor el código de las peticiones a AWS SDK
 * Una mejor organización de código puede ser la creación de una clase con las diferentes peticiones.
 * Gestión de promesas: https://docs.aws.amazon.com/es_es/sdk-for-javascript/v2/developer-guide/using-promises.html
 */

/**
 * Error: The provided token has expired.
 * @returns {undefined}
 */
function expiredToken() {
  console.log('User signed out.');
  window.location.replace("/");
}
/**
 * Cargamos/Borra las imágenes en el atributo src de los tags <img>
 * El atributo src de los <img> no debe estar relleno originalmente en el HTML para evitar la carga automática e incontrolada de imágenes.
 * La carga mediante esta función se hace de arriba a abajo, insertando el valor de data-src en el atributo src.
 * @param {String} doc 
 * @param {String} direction {forward, reward}
 */
function deferImg(doc, direction){
	var debug = false;
	// Toma todas las imagenes con la clase 'deferload'
	var $images = doc.querySelectorAll("img.deferload");
	// Si hay imagenes en la pagina, ejecuta cada una y actualiza su src.
	if($images.length > 0) {
		for (var i = 0, len = $images.length; i < len; i++) {		
			// Obtenemos la url de cada imagen desde el atributo data-src
			var image_url = $images[i].getAttribute("data-src");
      // Establecemos el src
      if (direction == "forward") {
        $images[i].src = image_url;
      } else {
        $images[i].src = "";
      }
			// debugging
			var $lognumber = i + 1;
			if (debug) console.log("Image No." + $lognumber + " loaded");
		}
	}
  if (debug) console.log("All Images loaded");
  return doc;
}
//===============================================================================
/**
 * Carga las imágenes indicadas en los estilos CSS "background-image".
 * Este estilo no debe existir originalmente en los HTML ni CSS, para evitar la carga automática e incontrolada de imágenes.
 * Esta función obtiene todos los divs del HTML con atributo data-src y les agrega el estilo background-image con la url que contiene el campo data-src.
 * https://codepen.io/anon/pen/rryxoK
 */
function deferBackgroundImage(doc, direction) {
	// Tomamos todos los divs con atributo data-src
	var imgDefer = doc.querySelectorAll('div[data-src]');
	var styleBackgroundImg = "background-image: url({url});";
  // var style = "{url}";
  for (var i = 0; i < imgDefer.length; i++) {
    oldStyle = imgDefer[i].getAttribute('style');
    if (oldStyle) {
      if (direction == "forward") {
        newStyle = styleBackgroundImg.replace("{url}", imgDefer[i].getAttribute('data-src')) + oldStyle;
      } else {
        var styleToRemove = styleBackgroundImg.replace("{url}", imgDefer[i].getAttribute('data-src'));
        newStyle = oldStyle.replace(styleToRemove, "");
      }
    } else {
      if (direction == "forward") {
        newStyle = styleBackgroundImg.replace("{url}", imgDefer[i].getAttribute('data-src'));
      } else {
        newStyle = "";
      }
    }
		
    imgDefer[i].setAttribute('style', newStyle );
  }

  return doc;
}

var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope) {

  this.$onInit = function () {
    const permisos = getAccess(); // auth.js
    $scope.bucket = bucket; // config.js

    // ----------------------------------------------------------------------------------------------------
    // HOME: Leemos el fichero /index.html
    const keyHome = 'index.html';
    var fileParams = {Bucket: $scope.bucket, Key: keyHome};

    var promiseGetIndex = new AWS.S3().getObject(fileParams, function (errGetObject, fileDataContentTypes) {}).promise(); // create the promise object
    // Manejamos los estados completado/rechazado de la promesa
    promiseGetIndex.then(
      function(fileData) {
        var fileHTML = fileData.Body.toString('utf-8');
        // CONVERTIRMOS EL TEXTO A DOM para operar con el DOM
        var doc = new DOMParser().parseFromString(fileHTML, "text/html");
        // FORZAMOS LA PRECARGA DE IMÁGENES.
        doc = deferBackgroundImage(doc, "forward");
        doc = deferImg(doc, "forward");
        // RECONVERTIRMOS EL DOM EN TEXTO
        var oSerializer = new XMLSerializer();
        var sHTML = oSerializer.serializeToString(doc);

        $scope.htmlCode = sHTML;
        $scope.$apply();

        // Mostramos el CKEDITOR con el contenido del textarea
        // CKEDITOR (lo cargamos después de meter el contenido en el textarea)
        CKEDITOR.replace('htmlCode', {
          fullPage: true,
          // extraPlugins: 'docprops',
          // Deshabilitamos el filtro de contenido porque si usamos el modo de página completa, probablemente
          // queremos libremente meter cualquier contenido en modo source sin limitaciones.
          allowedContent: true,
          height: 640
        });
      },
      function(errGetObject) {
        if (debug) console.log('El fichero ' + keyHome + ' NO existe en el bucket o no tiene permisos.');
        if (debug) console.log(errGetObject);
        expiredToken();
      }
    );
  }

  /**
   * SUBMIT FORMULARIO:
   * Guardamos el fichero index.html de la home.
   */
  $scope.submit = function () {
    const permisos = getAccess(); // auth.js
    $scope.bucket = bucket; // config.js

    // ----------------------------------------------------------------------------------------------------
    // HOME: Guardamos en el fichero /index.html
    // ----------------------------------------------------------------------------------------------------
    const keyHome = 'index.html';
    var now = new Date();
    var nextweek = new Date(now.getFullYear(), now.getMonth(), now.getDate()+30);

    // Antes de actualizar el contenido, le quitamos las imágenes que le agregamos en Init:
    fileHTML = CKEDITOR.instances.htmlCode.getData();
    // CONVERTIRMOS EL TEXTO A DOM para operar con el DOM
    var doc = new DOMParser().parseFromString(fileHTML, "text/html");
    // FORZAMOS LA PRECARGA DE IMÁGENES.
    doc = deferBackgroundImage(doc, "rewind"); // deshacemos la carga de imagenes con estilos
    doc = deferImg(doc, "rewind"); // deshacemos la carga de imagenes 
    // RECONVERTIRMOS EL DOM EN TEXTO
    var oSerializer = new XMLSerializer();
    var sHTML = oSerializer.serializeToString(doc);

    // PAKO - DEFLATE FILE
    // https://github.com/nodeca/pako
    // Para usar pako.deflate, debemos indicarlo en putObject el atributo ContentEncoding con el valor deflate
    var pako = window.pako;   
    var htmlData = pako.deflate(sHTML); // Obtenemos el html modificado del ckeditor
    var paramsHTMLObject = { 
      Bucket: $scope.bucket, 
      Key: keyHome, 
      Body: htmlData, 
      ContentType: "text/html", 
      ContentEncoding: "deflate", 
      Expires: nextweek,
      CacheControl: "max-age=2592000", // 30 dias: 60 * 60 * 24 * 30
    };

    var promisePutIndex = new AWS.S3().putObject(paramsHTMLObject, function (errSavingFile, dataPutObject) {}).promise(); // create the promise object
    // Manejamos los estados completado/rechazado de la promesa
    promisePutIndex.then(
      function(dataPutObject) {
        if (debug) console.log('%c HTML ', 'background: #222; color: #bada55', 'guardado correctamente en ' + keyHome);
      },
      function(errSavingFile) {
        if (debug) console.log('El fichero HTML ' + keyHome + ' NO existe en el bucket o no tiene permisos.');
        if (debug) console.log('Error guardando el fichero')
        if (debug) console.log(errSavingFile);
      }
    );
  };
});