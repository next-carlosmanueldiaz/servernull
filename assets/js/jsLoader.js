/**
 * JavaScript Loader
 * by Carlos Manuel Díaz Jorge
 * CC - by-nc-nd
 * https://stackoverflow.com/questions/14521108/dynamically-load-js-inside-js
 */

 /**
	* LISTADO DE SCRIPTS Y SUS DEPENDENCIAS (ORDEN DE CARGA)
	* Cada elemento de este array es un nivel.
	* Cada nivel se cargará después de terminar la carga de los scripts del anterior nivel.
	* En cada nivel, todos sus scripts se cargan en paralelo (async)
	*/
 var js = {
    "levels": [
			[
        // No dependientes entre si
        {"googleGapi"	: "https://apis.google.com/js/platform.js?onload=onLogIn"},
        {"popper"			: "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.3/umd/popper.min.js"},
        {"jquery"			: "https://code.jquery.com/jquery-1.9.1.min.js"},
        {"aws-sdk"		: "https://cdn.rawgit.com/aws/aws-sdk-js/master/dist/aws-sdk.js"},
        {"deferImages": "../assets/js/deferImages.js"},
        {"config"			: "../assets/js/config.js"},
			],
			[
				{"underscore"	: "https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js"},
        {"angular"		: "https://ajax.googleapis.com/ajax/libs/angularjs/1.6.4/angular.min.js"},
				{"bootstrap"	: "https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/js/bootstrap.min.js"}, // <- popper and jQuery
				{"cognito"		: "https://cdn.rawgit.com/aws/amazon-cognito-identity-js/master/dist/aws-cognito-sdk.min.js"}, // <- aws-sdk
				{"interaccion": "../assets/js/interacciones.js"}, // jquery
			],
			[
				{"cognito-id"	: "https://cdn.rawgit.com/aws/amazon-cognito-identity-js/master/dist/amazon-cognito-identity.min.js"}, // <- aws-sdk
				
			],
			[
				{"auth"				: "../assets/js/auth.js"}, // <- aws-sdk, aws-cognito-sdk, amazon-cognito-identity
			],
			[
				{"contents"		: "../assets/js/contents.js"}, // <- angular, underscore
			]
		]
 };

loadLevel(0, js.levels);

/** 
 * Una vez finalizada la carga de todas las librerías del nivel, 
 * cargamos los scripts del siguiente nivel.
*/
function loadLevel(numLevel, levels) {
	debug = false;
	var loaded = 0;
	var level = levels[numLevel];
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
		if (debug) console.log(numLevel + "-" +  i + " -> " + script.src);
			
		// Cada vez que se carga una librería, la contamos al cargarse
		script.onload = function () {
			debug = false;
			loaded++;
			if (debug) console.log(numLevel + "-" + loaded + ' cargada: ' + this.src);
			if (loaded === toLoad) {
				// Una vez cargados todos los scripts del nivel,
				// cargamos el siguiente.. si lo hay
				if( !(typeof levels[numLevel+1] === 'undefined') ) { 
					loadLevel(numLevel+1, levels); // <== LLAMADA RECURSIVA A CARGAR EL SIGUIENTE NIVEL.
				}
			}
		};
  }
}