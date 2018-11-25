/**
 * 
 */
// DEFER IMAGES FUNCTION
function deferImages(){
	// get all images with 'deferload' class
	var $images = document.querySelectorAll("img.deferload");
	
	// if there are images on the page run through each and update src
	if($images.length > 0) {
		for (var i = 0, len = $images.length; i < len; i++) {
			
			// get url from each image
			var image_url = $images[i].getAttribute("data-src");
			// set image src 
			$images[i].src = image_url;
			
			// debugging
			var $lognumber = i + 1;
			console.log("Image No." + $lognumber + " loaded");
		}
	}
	console.log("All Images loaded");
}


// PAGE LOADED
window.addEventListener('load', function() {
	// run defer image function
   deferImages();
}, false);


// JQUERY
// LAZY LOAD FUNCTION
/*
function lazyLoadImages(){
	// get all images with 'lazyload' class
	var $images = $(".deferload");
	
	// if there are images on the page run through each and update src
	if($images.length > 0) {
		$($images).each(function(i) {
			var image_url = $(this).attr("data-delaysrc");
			$(this).prop("src", image_url)
			
			// debugging
			var $lognumber = i + 1;
			console.log("Image No." + $lognumber + " loaded");
		});
	}
	console.log("Images loaded")
}


// PAGE LOADED
$(window).load(function(){  
	console.log("Page loaded");
	// run lazy load function
   lazyLoadImages();  
});
*/
