/**
 * Prototype Clase CrudS3 para el proceso de peticiones asíncronas a AWS S3.
 * 
 * @param {JSON} args 
 */
function CrudS3 (args) {
  this.fileType = args.fileType;
  this.bucket = args.bucket;
  this.key = args.key;
  this.params = args.params;
  this.fileParams = {Bucket: this.bucket, Key: this.key };
  this.file = "";

  /** Método getFile de la clase CrudS3
   * El fichero puede ser HTML o JSON
   * Dependiendo del fichero será tratado de una manera u otra
   */
  this.getFile = function () {
    // create the promise object
    this.promiseGetObject = new AWS.S3().getObject(this.fileParams, function (errGetObject, fileData) {}).promise();
    // Manejamos los estados completado/rechazado de la promesa
    this.promiseGetObject.then(
      function(fileData) {
        this.file = JSON.parse(fileData.Body.toString('utf-8'));

        if (this.fileType == 'json') {

        }


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
          allowedContent: true,
          height: 640
        });
      },
      function(errGetObject) {
        if (debug) console.log('El fichero ' + key + ' NO existe en el bucket o no tiene permisos.');
        if (debug) console.log(errGetObject);
        expiredToken();
      }
    );
  }; // Fin metodo getFile()

  /** Genera un slug de un texto dado. 
   * Los slugs se usan para las URLs y nombres de los ficheros.
   * @param String text
   * @returns String
   */
  this.slugify = function(text) {
    const a = 'àáäâèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ·/_,:;'
    const b = 'aaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzh------'
    const p = new RegExp(a.split('').join('|'), 'g')

    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(p, c =>
        b.charAt(a.indexOf(c)))     // Replace special chars
      .replace(/&/g, '-and-')         // Replace & with 'and'
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '')             // Trim - from end of text
  }; // Fin metodo slugify

}; // Fin Prototype o Clase getFile

// PRUEBA
// IMPLEMENTACIÓN DE OBJETOS BASADOS EN LA CLASE
var args = {
  'bucket'  : 'www.diezideas.com',
  'key'     : 'home/content/json/contents.json',
  'fileType': 'json',
  'params'  : []
};
var file = new getFile(args);