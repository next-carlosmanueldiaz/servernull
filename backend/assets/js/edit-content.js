/**
 * Comprueba y recupera las credenciales de la sesión
 * @returns {Boolean}
 */
function getCredentials() {
  var debug = false;
  if (typeof (Storage) !== "undefined") {
    if (sessionStorage.accessKeyId && sessionStorage.secretAccessKey && sessionStorage.sessionToken && sessionStorage.expired) {
      var region = sessionStorage.region; // https://goo.gl/CLhMq3
      var credsData = {
        accessKeyId: sessionStorage.accessKeyId,
        secretAccessKey: sessionStorage.secretAccessKey,
        sessionToken: sessionStorage.sessionToken,
        expireTime: sessionStorage.expireTime,
        expired: sessionStorage.expired
      };
      var creds = new AWS.Credentials(credsData);
      AWS.config.update({region: region, credentials: creds});
      if (debug) console.log('Acceso condecido como administrador.');
      return true;
    }
  }
}

/**
 * Obtiene el valor de una variable pasada por GET
 * @param {type} variable
 * @returns {getQueryVariable.pair}
 */
function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  } 
  alert('Query Variable ' + variable + ' not found');
}

/**
 * Error: The provided token has expired.
 * @returns {undefined}
 */
function expiredToken() {
  sessionStorage.accessKeyId = "";
  sessionStorage.secretAccessKey = "";
  sessionStorage.sessionToken = "";
  sessionStorage.expired = "";
  console.log('User signed out.');
  // window.location.replace("/home/index.html");
}

/**
 * Convierte un texto en slug
 * @param {type} text
 * @returns {unresolved}
 */
function slugify (text) {
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
}

// const debug = true;
// const tengoAcceso = getCredentials();

var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope) {
  
  this.$onInit = function () {
    const permisos = getAccess();

    $scope.bucket = bucket; // config.js
    $scope.type = getQueryVariable('tipo');
    $scope.slug = getQueryVariable('id');
    // JSON
    //---------------------------------------------------------------------------------
    var keyJson = 'home/content/json/' + $scope.type + '/' + $scope.slug  + '.json';
    
    var fileParams = {Bucket: $scope.bucket, Key: keyJson};
    s3 = new AWS.S3();
    s3.getObject(fileParams, function (errGetObject, fileData) {
      if (errGetObject) {
        if (debug) console.log('El fichero ' + keyJson + ' NO existe en el bucket o no tiene permisos.');
        if (debug) console.log(errGetObject);
        // expiredToken();
      } else {
        var f = fileData.Body.toString('utf-8');
        // preserve newlines, etc - use valid JSON
        f = f.replace(/\\n/g, "\\n")  
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, "\\&")
        .replace(/\\r/g, "\\r")
        .replace(/\\t/g, "\\t")
        .replace(/\\b/g, "\\b")
        .replace(/\\f/g, "\\f");
        // remove non-printable and other non-valid JSON chars
        f = f.replace(/[\u0000-\u0019]+/g,""); 
        var file = JSON.parse(f);
        $scope.content = file;
        $scope.$apply();
      }
    });
  }
  
  /**
   * SUBMIT FORMULARIO: 
   *  - guardamos los datos del contenido en el nuevo json
   *  - Actualizamos el JSON con el listado de contenidos.
   *  - Creamos el fichero HTML mezclando la base (html.html), template y datos
   * 
   * @returns {undefined}
   */
  $scope.submit = function () {
    var titulo = "";
    const permisos = getAccess();

    //---------------------------------------------------------------------------------
    // Necesitamos content-types.json para obtener el css y tpl
    const keyCT = 'private/content-types/json/content-types.json';
    var fileParams = {Bucket: $scope.bucket, Key: keyCT};
    s3 = new AWS.S3();
    s3.getObject(fileParams, function (errGetObject, fileData) {
      if (errGetObject) {
        if (debug) console.log('El fichero ' + keyCT + ' NO existe en el bucket o no tiene permisos.');
        if (debug) console.log(errGetObject);
        // expiredToken();
      } else {
        const id = getQueryVariable("id");
        var file = JSON.parse(fileData.Body.toString('utf-8'));
        $scope.cts = file;
        for (var key in file) {
          if (file[key].id === $scope.type) {
            $scope.pos = key;
          }
        }
        
        // HTML POST
        // ========================================================================
        // Obtenemos el HTML GENÉRICO DEL POST
        const keyHtml = 'backend/html.html';
        var fileParams = {Bucket: $scope.bucket, Key: keyHtml};
        s3 = new AWS.S3();
        s3.getObject(fileParams, function (errGetObject, fileData) {
          if (errGetObject) {
            if (debug) console.log('El fichero ' + keyHtml + ' NO existe en el bucket o no tiene permisos.');
            if (debug) console.log(errGetObject);
            // expiredToken();
          } else {
            // Rellenamos el contenido del HTML con los datos
            //---------------------------------------------------------------------------------
            var html = fileData.Body.toString('utf-8');
            html = html.replace("{{googleSigninClientId}}", $scope.googleSigninClientId);
            html = html.replace("{{title}}", $scope.content[0].value);
            html = html.replace("{{script}}", "\r\n" + $scope.cts[$scope.pos].js);
            html = html.replace("{{css}}", "\r\n" + $scope.cts[$scope.pos].css);
            
            titulo = $scope.content[0].value;

            var tpl = $scope.cts[$scope.pos].tpl;
            for (var key in $scope.cts[$scope.pos].fields) {
              var mascara = "{{content." + $scope.cts[$scope.pos].fields[key].id + "}}";
              tpl = tpl.replace(mascara, $scope.content[key].value);
            }
            html = html.replace("{{content}}", tpl);

            // Guardamos el fichero HTML
            var keyHTML = 'home/content/html/' + $scope.type + '/' + $scope.slug + '.html';
            
            // PAKO - DEFLATE FILE
            // https://github.com/nodeca/pako
            var pako = window.pako;
            // Para usar pako.deflate, debemos indicarlo en putObject el atributo ContentEncoding con el valor deflate
            var htmlData = pako.deflate(html);
                       
            var today = new Date();
            var nextweek = new Date(today.getFullYear(), today.getMonth(), today.getDate()+7);
            
            // Para usar pako.deflate, debemos indicarlo en el objeto subido con el atributo ContentEncoding con el valor deflate
            var paramsHtmlObject = { Bucket: $scope.bucket, Key: keyHTML, Body: htmlData, ContentType: "text/html", ContentEncoding: "deflate", Expires: nextweek};
            // var paramsHtmlObject = { Bucket: $scope.bucket, Key: keyHTML, Body: htmlData, ContentType: "text/html", ContentEncoding: "", Expires: nextweek};
            s3.putObject(paramsHtmlObject, function (errSavingFile, dataPutObject) {
              if (errSavingFile) {
                if (debug) console.log('El fichero ' + keyHTML + ' NO existe en el bucket o no tiene permisos.');
                if (debug) console.log('Error guardando el fichero')
                if (debug) console.log(errSavingFile);
                // expiredToken();
              } else {
                if (debug) console.log('%c HTML ', 'background: #222; color: #bada55', 'guardado correctamente en ' + keyHTML);
              }
            }); // / putObject('title.html)
          }
        });
        
        // JSON POST
        // ========================================================================
        var keyJSON = 'home/content/json/' + $scope.type + '/' + $scope.slug + '.json';
        // ========================================================================
        // Generamos el JSON con los datos del contenido
        var img = "";
        var contenido = "[";
        // Recogemos los valores del formulario
        for (var key in $scope.cts[$scope.pos].fields) {
          var idCampo     = $scope.cts[$scope.pos].fields[key].id;
          var nameCampo   = $scope.cts[$scope.pos].fields[key].name;
          var typeCampo   = $scope.cts[$scope.pos].fields[key].type;
          var valueCampo  = $scope.content[key].value;

          valueCampo = valueCampo.replace(/(\r?\n|\r|\n)/gm, '<br/>');

          var campo = '{ "id" : "' + idCampo + '", "name" : "' + nameCampo + '", "type" : "' + typeCampo + '", "value" : "' + valueCampo + '" },';

          if (img == "") {
            if (idCampo == "img") {
              img = valueCampo;
            }
          }

          contenido += campo;
        }
        contenido = contenido.slice(0, -1);
        contenido += "]";

        // Guardamos los datos del contenido en el fichero JSON DEL POST
        var paramsObject = { Bucket: $scope.bucket, Key: keyJSON, Body: contenido };
        s3.putObject(paramsObject, function (errSavingFile, dataPutObject) {
          if (errSavingFile) {
            if (debug) console.log('El fichero JSON ' + keyJSON + ' NO existe en el bucket o no tiene permisos.');
            if (debug) console.log('Error guardando el fichero')
            if (debug) console.log(errSavingFile);
            // expiredToken();
          } else {
            if (debug) console.log('%c JSON ', 'background: #222; color: #bada55', 'guardado correctamente en ' + keyJSON);
            // ========================================================================
            // ACTUALIZAMOS (OBTENEMOS, AGREGAMOS Y GUARDAMOS) EL JSON CON EL LISTADO DE CONTENIDOS
            const keyCL = 'home/content/json/contents.json';
            // ========================================================================
            var fileParams = {Bucket: $scope.bucket, Key: keyCL};
            s3.getObject(fileParams, function (errGetObject, fileData) {
              if (errGetObject) {
                if (debug) console.log('El fichero ' + key + ' NO existe en el bucket o no tiene permisos.');
                if (debug) console.log(errGetObject);
                expiredToken();
              } else {
                // OBTENEMOS contents.json
                //---------------------------------------------------------------------------------
                const type = getQueryVariable("tipo");
                const slug = getQueryVariable("id");
                var file = JSON.parse(fileData.Body.toString('utf-8'));
                var date = new Date(); // No necesito guardar la fecha porque puedo darle la vuelta al mostrar el fichero en la home con .reverse()
                var content = {"date": date, "img": img, "slug": slug, "title" : titulo, "type": type };
                var pos = -1;
                for (var key in file) {
                  if (file[key].slug === slug) {
                    pos = key;
                  }
                }
                file.splice(pos, 1); // Eliminamos el contenido antiguo
                // AGREGAMOS el nuevo contenido a contents.json al final del fichero
                file.push(content);
                var fileContents = JSON.stringify(file);
                // GUARDAMOS el nuevo contents.json
                var paramsContentsObject = { Bucket: $scope.bucket, Key: keyCL, Body: fileContents };
                s3.putObject(paramsContentsObject, function (errSavingFile, dataPutObject) {
                  if (errSavingFile) {
                    if (debug) console.log('El fichero ' + key + ' NO existe en el bucket o no tiene permisos.');
                    if (debug) console.log('Error guardando el fichero')
                    if (debug) console.log(errSavingFile);
                    expiredToken();
                  } else {
                    if (debug) console.log('%c JSON ', 'background: #222; color: #bada55', 'guardado correctamente en ' + keyCL);

                    //---------------------------------------------------------------------------------
                    // MODIFICAMOS LA HOME
                    // Cada vez que se modifica el contenido de un artículo, la home cambia.
                    // No vamos a usar angular para la home, ya que es una mala solución
                    // Usaremos HTML

                    // Cargamos el fichero home/index.html
                    var keyHome = 'home/index.html';
                    s3 = new AWS.S3();
                    var fileParams = { Bucket: $scope.bucket, Key: keyHome };
                    s3.getObject(fileParams, function (errGetObject, data) {
                      if (errGetObject) {
                        if (debug) console.log('Error al leer  ' + keyContents + ' o no tiene permisos.');
                        if (debug) console.log(errGetObject);
                        // expiredToken();
                      } else {
                        //=========================================================================================
                        // OBTENEMOS EL HTML DE index.html en forma de texto
                        //=========================================================================================
                        var fileHTML = data.Body.toString('utf-8');
                        // CONVERTIRMOS EL TEXTO A DOM
                        doc = new DOMParser().parseFromString(fileHTML, "text/html");
                        
                        //=========================================================================================
                        // Eliminamos los elementos que no son artículos del fichero contents.json
                        for (var key in file) {
                          if (file[key].type != "article") {
                            // Elimina el elemento del array que no es un artículo
                            file.splice(key, 1);
                          }
                        }
                        var last = file.length - 1; // Empieza en cero.
                        // Obtenemos el slug y sacamos el titular del último elemento
                        for (var key in file) {
                          file[key].slug = slugify(file[key].title);
                          // fileContents[key].img = "background-image: url(" + fileContents[key].img + ");"
                          if (key == last) {
                            var titular = file[key];
                            file.splice(key, 1);
                          }
                        }
                        // Tomamos sólo los artículos para la portada, dándoles la vuelta al array con .reverse()
                        file = file.reverse();
                        //=========================================================================================
                        // Aplicamos el json directamente sobre home/index.html
                        doc.getElementById('titular').setAttribute('data-src', titular.img);
                        // /home/content/html/{{titular.type}}/{{titular.slug}}.html
                        var titularLink = "/home/content/html/" + titular.type + "/" + titular.slug + ".html";
                        doc.getElementById('titular-link').setAttribute('href', titularLink);                       
                        doc.getElementById('titular-title').innerHTML = titular.title;

                        // doc.getElementById('').innerHTML = "";
                        // doc.getElementById('').innerHTML = "";

                        var oSerializer = new XMLSerializer();
                        var sXML = oSerializer.serializeToString(doc);
                        var paramsHTMLObject = { Bucket: $scope.bucket, Key: keyHome, Body: sXML, ContentType: "text/html", ContentEncoding: "deflate", Expires: nextweek};
                        s3.putObject(paramsHTMLObject, function (errSavingFile, dataPutObject) {
                          if (errSavingFile) {
                            if (debug) console.log('El fichero HTML ' + keyHome + ' NO existe en el bucket o no tiene permisos.');
                            if (debug) console.log('Error guardando el fichero')
                            if (debug) console.log(errSavingFile);
                          } else {
                            if (debug) console.log('%c HTML ', 'background: #222; color: #bada55', 'guardado correctamente en ' + keyHome);
                          }
                        }); // /putObject('contents.json)
                      }
                    });
                    // Cargamos el fichero index.html de la home
                    // 


                  }
                }); // /putObject('contents.json)
              }
            }); // /getObject('contents.json)
          }
        }); // / putObject('nuevo-contenido.json)        
        
      }
    });
  }; // /submit
});





