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
  // window.location.replace("/index.html");
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

function getHash(str, algo = "SHA-256") {
  let strBuf = new TextEncoder('utf-8').encode(str);
  return crypto.subtle.digest(algo, strBuf)
    .then(hash => {
      window.hash = hash;
      // here hash is an arrayBuffer, 
      // so we'll connvert it to its hex version
      let result = '';
      const view = new DataView(hash);
      for (let i = 0; i < hash.byteLength; i += 4) {
        result += ('00000000' + view.getUint32(i).toString(16)).slice(-8);
      }
      return result;
    });
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

    // CAMPOS: content-types.json
    // Leemos content-types.json para obtener los campos del tipo de contenido
    const keyCT = 'private/content-types/json/content-types.json';
    var fileParams = {Bucket: $scope.bucket, Key: keyCT};
    s3 = new AWS.S3();
    s3.getObject(fileParams, function (errGetObject, fileDataContentTypes) {
      if (errGetObject) {
        if (debug) console.log('El fichero ' + key + ' NO existe en el bucket o no tiene permisos.');
        if (debug) console.log(errGetObject);
        expiredToken();
      } else {
        var contentTypes = JSON.parse(fileDataContentTypes.Body.toString('utf-8'));
        $scope.cts = contentTypes;
        for (var key in contentTypes) {
          if (contentTypes[key].id === $scope.type) {
            $scope.pos = key;
          }
        }

        // VALORES slug.json
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
            var content = JSON.parse(f);
            $scope.content = content;
            // Agregamos valores a la estructura de datos
            for (var kCts in $scope.cts[$scope.pos].fields) {
              for (var k in $scope.content) {
                if ($scope.cts[$scope.pos].fields[kCts].id == $scope.content[k].id) {
                  if (typeof $scope.content[k].value !== 'undefined' && $scope.content[k].value !== "" ) {
                    $scope.cts[$scope.pos].fields[kCts].value = $scope.content[k].value;
                    break; // una vez encontrado, sale del bucle interno
                  }
                }
              }
            }
            $scope.$apply();
          }
        });
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
        var contentTypes = JSON.parse(fileData.Body.toString('utf-8'));
        $scope.cts = contentTypes;
        for (var key in contentTypes) {
          if (contentTypes[key].id === $scope.type) {
            $scope.pos = key;
          }
        }

        // Subimos las imagenes que haya
        for (var key in $scope.cts[$scope.pos].fields) {
          if ($scope.cts[$scope.pos].fields[key].type == 'image') {
            var idFileField = $scope.cts[$scope.pos].fields[key].id;
            var files = document.getElementById(idFileField).files;
            if (!files.length) {
              console.log('Campo obligatorio.');
            } else {
              var file = files[0];
              var fileName = file.name;
              // var albumPhotosKey = encodeURIComponent(albumName) + '//';
              var photoKey = 'home/assets/img/' + file.name;
              $scope.cts[$scope.pos].fields[key].value = domainURL + '/home/assets/img/' + file.name;
              s3.upload({
                Bucket: bucket,
                Key: photoKey,
                Body: file,
                ACL: 'public-read'
              }, function(err, data) {
                if (err) {
                  console.log('Error subiendo la foto: ', err.message);
                }
                console.log('Foto subida correctamente: ' + photoKey);
              });
            }
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
                       
            var now = new Date();
            var nextweek = new Date(now.getFullYear(), now.getMonth(), now.getDate()+30);
            
            // Para usar pako.deflate, debemos indicarlo en el objeto subido con el atributo ContentEncoding con el valor deflate
            var paramsHtmlObject = { 
              Bucket: $scope.bucket, 
              Key: keyHTML, 
              Body: htmlData, 
              ContentType: "text/html", 
              ContentEncoding: "deflate",
              Expires: nextweek,
              CacheControl: "max-age=2592000", // 30 dias: 60 * 60 * 24 * 30
              // Metadata: {
              //   'LastModified': now.toString(),
              //   'ETag': hash
              // }
            };
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
            }); // / putObject('/index.html)
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
                var contents = JSON.parse(fileData.Body.toString('utf-8'));
                var date = new Date(); // No necesito guardar la fecha porque puedo darle la vuelta al mostrar el fichero en la home con .reverse()
                var content = {"date": date, "img": img, "slug": slug, "title" : titulo, "type": type };
                var pos = -1;
                for (var key in contents) {
                  if (contents[key].slug === slug) {
                    pos = key;
                  }
                }
                contents.splice(pos, 1); // Eliminamos el contenido antiguo
                // AGREGAMOS el nuevo contenido a contents.json al final del fichero
                contents.push(content);
                var fileContents = JSON.stringify(contents);
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

                    // Cargamos el fichero /index.html
                    var keyHome = 'index.html';
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
                        // contents.json (contents)
                        // Eliminamos los elementos que no son artículos del fichero contents.json
                        for (var key in contents) {
                          if (contents[key].type != "article") {
                            // Elimina el elemento del array que no es un artículo
                            contents.splice(key, 1);
                          }
                        }
                        var last = contents.length - 1; // Empieza en cero.
                        // Obtenemos el slug y sacamos el titular del último elemento
                        //-----------------------------------------------------------------------------------------
                        for (var key in contents) {
                          contents[key].slug = slugify(contents[key].title);
                          if (key == last) {
                            var titular = contents[key];
                            contents.splice(key, 1);
                          }
                        }
                        // Tomamos sólo los artículos para la portada, dándoles la vuelta al array con .reverse()
                        contents = contents.reverse();
                        //=========================================================================================
                        // Aplicamos el json directamente sobre /index.html

                        // TITULAR HOME
                        doc.getElementById('titular').setAttribute('data-src', titular.img);
                        // /home/content/html/{{titular.type}}/{{titular.slug}}.html
                        var titularLink = "/home/content/html/" + titular.type + "/" + titular.slug + ".html";
                        doc.getElementById('titular-link').setAttribute('href', titularLink);
                        doc.getElementById('titular-title').innerHTML = titular.title;

                        // Primero nos cargamos todos los previamente generados
                        var generated = doc.getElementById("container-inside").querySelectorAll(".generated");
                        if (generated.length > 0) {
                          for (var i=0; i < generated.length;i++) {
                            doc.getElementById("container-inside").removeChild(generated[i]);
                          }
                        }

                        // ARTICULOS
                        for (var key in contents) {
                          if (key % 2 == 0) {
                            var teaserMidIzqOriginal = doc.getElementById('teaser-mid-izq');
                            var teaserMidIzqClone = teaserMidIzqOriginal.cloneNode(true); // "deep" clone
                            teaserMidIzqClone.id = 'teaser-mid-izq-' + key;
                            teaserMidIzqClone.classList.add("generated");
                            teaserMidIzqClone.style.display = "block";
                            teaserMidIzqClone.getElementsByClassName("teaser-izq-img")[0].setAttribute('data-src', contents[key].imgTeaser);
                            var teaserMidIzqLink = "/home/content/html/" + contents[key].type + "/" + contents[key].slug + ".html";
                            teaserMidIzqClone.getElementsByClassName("teaser-izq-link")[0].setAttribute('href', teaserMidIzqLink);
                            teaserMidIzqClone.getElementsByClassName("teaser-izq-title")[0].innerHTML = contents[key].title;
                            teaserMidIzqOriginal.parentNode.appendChild(teaserMidIzqClone);
                          } else {
                            var teaserMidDerOriginal = doc.getElementById('teaser-mid-der');
                            var teaserMidDerClone = teaserMidDerOriginal.cloneNode(true); // "deep" clone
                            teaserMidDerClone.id = 'teaser-mid-der-' + key;
                            teaserMidDerClone.classList.add("generated");
                            teaserMidDerClone.style.display = "block";
                            teaserMidDerClone.getElementsByClassName("teaser-der-img")[0].setAttribute('data-src', contents[key].imgTeaser);
                            var teaserMidDerLink = "/home/content/html/" + contents[key].type + "/" + contents[key].slug + ".html";
                            teaserMidDerClone.getElementsByClassName("teaser-der-link")[0].setAttribute('href', teaserMidDerLink);
                            teaserMidDerClone.getElementsByClassName("teaser-der-title")[0].innerHTML = contents[key].title;
                            teaserMidDerOriginal.parentNode.appendChild(teaserMidDerClone);
                          }
                          // doc.getElementById('').innerHTML = "";
                        }
                        //=========================================================================================                       
                        // Subimos el fichero /index.html

                        var oSerializer = new XMLSerializer();
                        var sHTML = oSerializer.serializeToString(doc);
                        
                        var now = new Date();
                        var nextweek = new Date(now.getFullYear(), now.getMonth(), now.getDate()+30);

                        // PAKO - DEFLATE FILE
                        // https://github.com/nodeca/pako
                        var pako = window.pako;
                        // Para usar pako.deflate, debemos indicarlo en putObject el atributo ContentEncoding con el valor deflate
                        var htmlData = pako.deflate(sHTML);
                        var paramsHTMLObject = { 
                          Bucket: $scope.bucket, 
                          Key: keyHome, 
                          Body: htmlData, 
                          ContentType: "text/html", 
                          ContentEncoding: "deflate", 
                          Expires: nextweek,
                          CacheControl: "max-age=2592000", // 30 dias: 60 * 60 * 24 * 30
                          // Metadata: {
                          //   'LastModified': now.toString(),
                          //   'ETag': hash
                          // }
                        };
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
                    }); // Cargamos el fichero /index.html
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
