// document.addEventListener("DOMContentLoaded", function(event) {
    var defaultThrottle = 250;
    window.stickyFrom = null;
    var stickyEnabled = true;
    
    window.addEventListener("scroll", function(){
      // Sólo muestra la cabecera cuando está arriba del todo.
      if(window.scrollY==0){
        // Si está arriba del todo, muestra
        document.getElementsByClassName('header-main').classList.remove('oculta-header'); // despliega header
      } else {
        // Si no está arriba del todo (hace scroll), oculta
        document.getElementsByClassName('header-main').classList.add('oculta-header'); // comprime header
      }
    });


    // SCROLL CABECERA
    // $(document).ready(function () {
    //     if (!stickyEnabled) {
    //         return;
    //     }

    //     var stickyFrom = window.stickyFrom;

    //     var header = $('.header-main');
    //     //var headerHeight = header.height();
    //     var headerHeight = 153;

    //     if (!stickyFrom) {
    //         stickyFrom = header.attr('data-sticky-from');
    //     }

    //     if (stickyFrom && stickyFrom.match(/^\d+(\s*px)?$/)) {
    //         stickyFrom = parseInt(stickyFrom.replace(/\s*px/g, ''));

    //     } else {
    //         var el = $(stickyFrom);

    //         if (el.length > 0) {
    //             stickyFrom = el.offset().top + el.outerHeight(false) + 40;
    //         }
    //     }

    //     if (!stickyFrom) {
    //         stickyFrom = headerHeight;
    //     }

    //     //var totalHeader = $('header').height() + 20;
    //     var totalHeader = headerHeight + 20;
    //     var cintillo = $('.cintillo');
    //     if (cintillo.length > 0) totalHeader = totalHeader + cintillo.height() + 10;

    //     stickyFrom = Math.max(50, Math.min($(document).height() - $(window).height() - headerHeight, stickyFrom), totalHeader);

    //     var checkScroll = function () {
    //         if (!stickyEnabled) {
    //             return;
    //         }

    //         var sticky = $('.header-main'),
    //             scroll = $(window).scrollTop();

    //         if (scroll >= stickyFrom) {
    //             sticky.addClass('fixed');
    //             $('body').css('padding-top', headerHeight + "px");
    //             $(window).trigger('resize');

    //         } else {
    //             sticky.removeClass('fixed');
    //             $('body').css('padding-top', '0px');
    //             $(window).trigger('resize');
    //         }
    //     };

    //     $(window).scroll(_.throttle(checkScroll, defaultThrottle));
    //     checkScroll();
    // });

    // DOCUMENT-READY
    $(document).ready(function () {     
      // Login div
      $('.btn-login').click(function() {
        //$('.login-box').animate({width:'toggle'},500);
        $('.login-box').toggle('fast');
      });
      
    });
//   });