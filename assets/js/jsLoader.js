/**
 * JavaScript Loader
 * by Carlos Manuel Díaz Jorge
 * CC - by-nc-nd
 * https://stackoverflow.com/questions/14521108/dynamically-load-js-inside-js
 */

 var js = {
    "levels": [
			[
        // No dependientes entre si
        "https://apis.google.com/js/platform.js?onload=onLogIn",
        "https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js",
        "https://ajax.googleapis.com/ajax/libs/angularjs/1.6.4/angular.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.3/umd/popper.min.js",
        "https://code.jquery.com/jquery-1.9.1.min.js",
        "https://cdn.rawgit.com/aws/aws-sdk-js/master/dist/aws-sdk.js",
        "../assets/js/deferImages.js",
        "../assets/js/config.js",
			],
			[
					"https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/js/bootstrap.min.js", // <- popper and jQuery
					"https://cdn.rawgit.com/aws/amazon-cognito-identity-js/master/dist/aws-cognito-sdk.min.js", // <- aws-sdk
					"https://cdn.rawgit.com/aws/amazon-cognito-identity-js/master/dist/amazon-cognito-identity.min.js", // <- aws-sdk
					"../assets/js/interacciones.js", // jquery
			],
			[
					"../assets/js/auth.js", // <- aws-sdk, aws-cognito-sdk, amazon-cognito-identity
			],
			[
				"../assets/js/contents.js", // <- angular, underscore
			]
		]
 };

loadLevel(0, js.levels);

/** 
 * Una vez finalizada la carga de todas las librerías del nivel, 
 * cargamos los scripts del siguiente nivel.
*/
function loadLevel(numLevel, levels) {
	var loaded = 0;
	var level = levels[numLevel];
	var toLoad = level.length;
  // Recorremos todos los scrpts de autor
  for (var i = 0; i < level.length; i++) {
		// Creamos el objeto script
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.async = "async";
		script.src = level[i];
		document.head.appendChild(script);
		console.log('Script ' + i + " -> " + script.src);
			
		// Cada vez que se carga una librería, la contamos al cargarse
		script.onload = function () {
			loaded++;
			console.log('Librería ' + loaded + ' cargada: ' + this.src);
			if (loaded === toLoad) {
				// Una vez cargados todos los scripts del nivel,
				// cargamos el siguiente.. si lo hay
				if(!typeof levels[numLevel+1] === 'undefined') { 
					loadLevel(numLevel+1, levels)
				}
			}
		};
  }
}