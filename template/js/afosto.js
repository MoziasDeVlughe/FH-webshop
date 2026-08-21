    
/*
 *  ---------- index ---------      
 *  initSlider
 *  initAjax
 *  fixCartSum
 *  fixFooter
 *  initializeFixedHeader
 */
 
/*
 * Initialize functions
 */
 
$(function() {
    $('html').addClass('document-loaded');
    // initSlider();
    initAjax();
    BirthdateField();
   
    backToTop();
    
    var autoCompleteRequest;
    initTypeahead();
    focusSearch();
    
    toggleCartOverview();
    
    maskDateField();
    
    collectionSliderSwitch();
    if ($('.main-slider').length > 0) {
        initMainSlider();
    }
    // if ($('.full-width-slider').length > 0) {
    //     initFullWidthSlider();
    // }
    if($('.brand-slider').length > 0) {
        initBrandsSwiper();
    }
    if($('.prod-slider').length > 0) {
        initProductsSlider();
    } 
    if($('.home-prod-slider').length > 0) {
        initHomeProductsSlider();
    }
    if($('.collection-slider').length > 0) {
        initCollectionSlider()
    }
    if($('.collection-preview-slider').length > 0) {
        collectionSliderContentInit();
    }
    if($('#mobile-menu-container').length > 0) {
        initMMenu();
    } else {
        mobileMenuToggle();
    }
    
    if($('header.default').length > 0){
        initializeFixedHeader();
        $(window).resize(function() {
            initializeFixedHeader();
        });
    }
    formValidation();
});


document.addEventListener('lazybeforeunveil', function(e){
    var bg = e.target.getAttribute('data-bg');
    if(bg){
        e.target.style.backgroundImage = 'url(' + bg + ')';
    }
});

/**
 * check is user is on mobile device.
 * if he is, don't use input mask.
 * if he isn't, use input mask.
 * 
 * @method toggleRedeemCredits
 * @param {Object}      e       The event data object.
 */ 
function maskDateField() {
    var isMobile = false; //initiate as false
    // device detection
    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) isMobile = true;
        
        
    if(isMobile === true) {
        $('.form-control.datepicker').unmask();
    } else {
        $('.form-control.datepicker').mask('00-00-0000');
    }
}

/*
 * --------- functions ---------
 */
 
function intToPrice(val, shorten, hideCurrency) {
    var bodyData = $('body').data();
    var lang = $('html').attr('lang');
    
    if (hideCurrency) {
        if (shorten) {
            return Number(parseFloat(val)).toLocaleString(lang, { minimumFractionDigits: 2 }).toString().replace(',00', ',-');
        }
        
        return Number(parseFloat(val)).toLocaleString(lang, { minimumFractionDigits: 2 }).toString();
    }
    
    if (shorten) {
        return Number(parseFloat(val)).toLocaleString(lang, {style: 'currency', currency: bodyData.afCurrencyCode || 'EUR'}).toString().replace(',00', ',-');
    }
    
    return Number(parseFloat(val)).toLocaleString(lang, {style: 'currency', currency: bodyData.afCurrencyCode || 'EUR'});
}

/**
 * Intitalizes the MMenu plugin for a drilldown mobile menu
 * Documentation: http://mmenu.frebsite.nl/
 * 
 * @method initMMenu
 */ 
function initMMenu() {
    $("#mobile-menu-container").css('opacity', 1);
    $("#mobile-menu-container").mmenu({
        // options
        navbars: [
            {
                position: "top",
                content: [
                    "searchfield"
                ]
            }
        ],
        extensions: [
            "pagedim-black",
            "shadow-panels",
        ],
        offCanvas: {
            zposition : "next",
        },
        searchfield: {
            add: true,
            resultsPanel: true,
            search: false,
        }
    }, {
        // configuration
        offCanvas: {
            pageNodetype: "section",
            pageSelector: ".page-wrap",
        },
        searchfield:
        {
            form :	{
                action: $("#mobile-menu-container").data('search-url'),
                method: "get"
            },
            input: {
                type: "text",
                name: "q",
            }
            
        }
        
    });
    var API = $("#mobile-menu-container").data( "mmenu" );
  
    $(".navbar-toggle").click(function() {
        if($('html').hasClass('mm-opened')){
            API.close();
        } else {
            API.open();
        }
    });
}

/**
* Intitalizes the swiper slider plugin
*/

function initMainSlider() {
    var swiper = new Swiper(".main-slider", {
        lazyLoad: 'ondemand',
        effect: 'fade',
    });
}

// function initFullWidthSlider() {
//     var swiper = new Swiper(".full-width-slider", {
//         lazyLoad: 'ondemand',
//         effect: 'fade',
//     });
// }

function initBrandsSwiper() {
    var swiper = new Swiper(".brand-slider", {
        slidesPerView: 1,
        slidesPerGroup: 1,
        loop: true,
        autoplay: {
          delay: 2500,
        },
        breakpoints: {
            440: {
                slidesPerView: 2,
            },
            767: {
                slidesPerView: 3,
            },
            1200: {
                slidesPerView: 4,
            },
        },
    });
}

function initProductsSlider() {
    var swiper = new Swiper(".prod-slider", {
        slidesPerView: 1,
        slidesPerGroup: 1,
        pagination: {
            el: '.swiper-pagination[data-target=".prod-slider"]',
        },
        navigation: {
            enabled: true,
            nextEl: '.swiper-button-next[data-target=".prod-slider"]',
            prevEl: '.swiper-button-prev[data-target=".prod-slider"]',
        },
        breakpoints: {
            767: {
                slidesPerView: 3,
                slidesPerGroup: 3,
                
            },
            1200: {
                slidesPerView: 6,
                slidesPerGroup: 6,
            },
        },
    });
}
function initHomeProductsSlider() {
    var swiper = new Swiper(".home-prod-slider", {
        slidesPerView: 1,
        slidesPerGroup: 1,
        pagination: {
            el: '.swiper-pagination[data-target=".home-prod-slider"]',
        },
        navigation: {
            enabled: true,
            nextEl: '.swiper-button-next[data-target=".home-prod-slider"]',
            prevEl: '.swiper-button-prev[data-target=".home-prod-slider"]',
        },
        breakpoints: {
            767: {
                slidesPerView: 3,
                slidesPerGroup: 3,
                
            },
            1200: {
                slidesPerView: 3,
                slidesPerGroup: 3,
            },
        },
    });
}

function initCollectionSlider() {
    var swiper = new Swiper(".collection-slider", {
        pagination: {
            el: '.swiper-pagination[data-target=".collection-slider"]',
        },
        navigation: {
            enabled: true,
            nextEl: '.swiper-button-next[data-target=".collection-slider"]',
            prevEl: '.swiper-button-prev[data-target=".collection-slider"]',
        },
        slidesToShow: 1,
        slidesToScroll: 1,
        breakpoints: {
            767: {
                slidesPerView: 3,
                slidesPerGroup: 3,
            },
            1200: {
                slidesPerView: 4,
                slidesPerGroup: 4,
            },
        },
    });
}

/**
 * Load slider content from a collection page.
 * 
 * @method collectionSliderSwitch
 */ 
function collectionSliderSwitch() {
    $('[data-ps-collection]').off('click').on('click',function(e){
        
        var el      = $(this);
        var url     = el.data('ps-collection');
        var element = el.data('ps-ajax-element');
        var input   = el.data('ps-ajax-input');
        var title   = $(this).html();
        var button  = $('.category-selection');
        var more    = $('.category-selected-more');
        
        
        $(element).addClass('loading-ajax');
        
        if(element !== undefined && input !== undefined) {
            $.get(url, function(html) {
                var content = $('<div>' + html.replace(/>[\n\t ]+</g, "><") + '</div>');
                $(element).replaceWith(content.find(input));
                
                $(element).unSlick;
                $(element).removeClass('slick-initialized slick-slider slick-dotted');
                $(element).removeClass('loading-ajax');
                
                $(button).html(title + ' <i class="fa fa-angle-down"></i>');
                $(more).attr('data-af-href', url);
                
                initCollectionSlider();
                
                initAjax();
                
            });
        } else {
            console.log("missing elements to load and placeholder to load into");
        }
    });
}


/**
 * Initializes the collection slider with content form the url.
 * 
 * @method collectionSLiderContentInit
 */ 
function collectionSliderContentInit() {
    var url;
    // if ( Cookies.get('lastSelectedCat') === undefined || Cookies.get('lastSelectedCat') === '' ) {
        url = $('.collection-preview-slider').data('default-url');
    // } else {
    //     url     = Cookies.get('lastSelectedCatUrl');
    // }
    var element = '.collection-slider';
    var input   = '#ajax-collection-slider .collection-slider';
    var title;
    // if ( Cookies.get('lastSelectedCat') === undefined || Cookies.get('lastSelectedCat') === '' ) {
        title = $('.collection-preview-slider').data('default-title');
    // } else {
    //     title     = Cookies.get('lastSelectedCat');
    // }
    var button  = $('.category-selection');
    var more    = $('.category-selected-more');
    
    $(element).addClass('loading-ajax');
    
    if(element !== undefined && input !== undefined ) {
        $.get(url, function(html) {
            var content = $('<div>' + html.replace(/>[\n\t ]+</g, "><") + '</div>');
            $(element).replaceWith(content.find(input));
            $(element).unSlick;
            $(element).removeClass('slick-initialized slick-slider slick-dotted');
            $(element).removeClass('loading-ajax');
            
            $(button).html(title + ' <i class="fa fa-angle-down"></i>');
            $(more).attr('data-af-href', url);
            
            initCollectionSlider();
            
            initAjax();
            wishlistModal();
        });
    } else {
        // console.log("missing elements to load and placeholder to load into");
    }
}


/**
 * Set default settings for lightbox.
 * 
 */ 
lightbox.option({
    'resizeDuration': 200,
    'wrapAround': true,
    'fadeDuration': 200,
    'imageFadeDuration': 200
});


 /**
 * Catches every element with a data attribute named 'data-af-href' and turns it into a link that can't be seen by webspiders
 * If the element has the af-ajax-element and af-ajax-input data attributes it makes a ajax call
 * It places the given 'input' into the defined 'element'
 * 
 * @method initAjax
 */ 
 
function initAjax() {
    $('[data-af-href]').off('click').on('click',function(e){
        var el      = $(this);
        var url     = el.data('af-href');
        var element = el.data('af-ajax-element');
        var input   = el.data('af-ajax-input');
        var target   = el.attr('target');
        $(element).addClass('loading-ajax');
        
        if(element !== undefined && input !== undefined) {
            $.get(url, function(html) {
                var content = $('<div>' + html.replace(/>[\n\t ]+</g, "><") + '</div>');
                var ecomScript = content.find('script#ga-ce');
                
                $(element).html(content.find(input));
                
                if(ecomScript) {
                    var newScript = document.createElement('script');
                    var scriptContent = ecomScript.text();
                    var newScriptContent = document.createTextNode(scriptContent);
                    
                    newScript.appendChild(newScriptContent);
                    document.getElementsByTagName("body")[0].appendChild(newScript);
                }
                
                
                startProductPage();
                initializeCollection();
                initAjax();
                wishlistModal();
                history.replaceState(null, null, url);
                $(element).removeClass('loading-ajax');
            });
        } else {
            if (target) {
                window.open(url, target);
            } else {
                window.location.href = url;
            }
        }
        return false;
    });
}


/**
 * When the window is scrolled this function cheks if the screen is bigger than mobile
 * and sets the navigation to a top fixed position when it has scrolled past the usps header.
 * It also sets the header to the complete height of all elements it contains so the page doesn't contract.
 * 
 * @method initializeFixedHeader
 */ 
 
function initializeFixedHeader () {
    var lastScrollTop = 0;
    
    $(window).scroll(function() {
        
        var ScrollTop           = $(window).scrollTop();
        var stickyElement       = '.navbar'; 
        var header              = 'header.default';
        var HeaderHeight        = $(header + " .navbar").outerHeight(true) + $(header + " .header-usps").outerHeight(true);
        var mainHeaderHeight    = $('.header-usps').outerHeight(true);
        
        if (window.innerWidth >= 767) {

            
            if (ScrollTop >= mainHeaderHeight) {
                $(header).css('height', HeaderHeight);
                $(stickyElement).addClass('fixed-header');
            } else {
                $(header).removeAttr('style');
                $(stickyElement).removeClass('fixed-header');
            }
             
        }
        if(window.innerWidth >= 767){
            if(ScrollTop > lastScrollTop && ScrollTop >= 100) {
                $(stickyElement).addClass('fix-up').css('transform', 'translateY(-' + $('.navbar-header').outerHeight(true) + 'px)');
                lastScrollTop = ScrollTop;
            } else {
                $(stickyElement).removeClass('fix-up').removeAttr('style');
                lastScrollTop = ScrollTop;
            }
        }
    });
    var header = 'header.default';
    if( window.innerWidth <= 767 ) {
        $('.navbar').addClass('fixed-header');
        $('input[type="text"]:not(.no-fix-up), input[type="tel"], input[type="number"], input[type="email"], input[type="number"], select, textarea ').focusin(function() {
            $('.navbar').addClass('fix-up');
        }).focusout(function() {
            $('.navbar').removeClass('fix-up');
        });
    }
    $(window).resize(function(){
        var HeaderHeight = $(header + " .navbar").outerHeight(true) + $(header + " .header-usps").outerHeight(true);
        $(header).css('height', HeaderHeight);
        
        if( window.innerWidth <= 767 ) {
            
           $('input[type="text"]:not(.no-fix-up), input[type="tel"], input[type="number"], input[type="email"], input[type="number"], select, textarea').focusin(function() {
                $('.navbar').addClass('fix-up');
                console.log('xs');
            }).focusout(function() {
                $('.navbar').removeClass('fix-up');
            });
        }
    });
  
}


/**
 * Function that builds a button that will smoothly scroll the page back to the top
 * documentation: https://codyhouse.co/gem/back-to-top/
 * 
 * @method backToTop
 */ 

function backToTop(){
    // browser window scroll (in pixels) after which the "back to top" link is shown
    var offset = 300,
	//browser window scroll (in pixels) after which the "back to top" link opacity is reduced
    offset_opacity = 1200,
    //duration of the top scrolling animation (in ms)
    scroll_top_duration = 500,
    //grab the "back to top" link
    $back_to_top = $('.cd-top');

    //hide or show the "back to top" link
    $(window).scroll(function(){
        ( $(this).scrollTop() > offset ) ? $back_to_top.addClass('cd-is-visible') : $back_to_top.removeClass('cd-is-visible cd-fade-out');
        if( $(this).scrollTop() > offset_opacity ) { 
            $back_to_top.addClass('cd-fade-out');
        }
    });

    //smooth scroll to top
    $back_to_top.on('click', function(event){
    event.preventDefault();
        $('body,html').animate({
            scrollTop: 0 ,
            }, scroll_top_duration            );
    });
}


var timeoutSearch;
var autoCompleteRequest;
/**
 * Initializes the twitter typeahead plugin.
 * 
 * @method initTypeahead
 */ 
function initTypeahead () {
    var field = $('#search-field'),
        productsHeading = field.data('products-heading'),
        pagesHeading = field.data('pages-heading');
        var currencySymbol = $('body').data('af-currency');
    
    var productsResource = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('items'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
            url: '/search/suggest?q=%QUERY%&version=2',
            wildcard: '%QUERY%',
            transform: function(response) {
                return response.products;
            }
        },
    });
    
    var pagesResource = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('items'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
            url: '/search/suggest?q=%QUERY%&version=2',
            wildcard: '%QUERY%',
            transform: function(response) {
                return response.pages;
            }
        },
    });
    
    
    field.typeahead(null, {
        name: 'pages',
        display: 'title',
        source: pagesResource,
        templates: {
            header: '<div class="tt-heading">' + (pagesHeading || 'Pagina\'s') + '</div>',
            suggestion: function (data) {
                return '<div class="tt-page-suggestion"><a class="d-flex" href="' + data.url + '"><span>' + data.title + '</span></a></div>';
            },
        },
    }, {
        name: 'products',
        display: 'name',
        source: productsResource,
        templates: {
            header: '<div class="tt-heading">' + (productsHeading || 'Producten') + '</div>',
            suggestion: function (data) {
                return  '<div class="tt-product-suggestion">' + 
                            '<a class="d-flex" href="' + data.url + '">' +
                                '<img src="' + data.image_default.thumbs['50'] + '" />' + 
                                '<div class="d-flex flex-column justify-content-between">' + 
                                    '<span>' + data.name + '</span>' + 
                                    '<small class="text-muted"> ' + currencySymbol + ' ' + parseFloat(data.price).toFixed(2).replace('.',',') + '</small>' + 
                                '</div>' + 
                            '</a>' + 
                        '</div>';
            }
        }
    }).on('typeahead:selected', function(e, selected) {
        document.location.href = selected.url;
    });
    
    var typeaheadTimer;
    $('#search-field').bind('typeahead:asyncreceive', function(ev, q, data) {
        if (typeaheadTimer) {
            clearTimeout(typeaheadTimer);
        }
        
        typeaheadTimer = setTimeout(function() {
            ga('send', 'pageview', '/search/suggest?q=' + encodeURIComponent(ev.currentTarget.value) + '&version=2');
        }, 200);
    });
    
    $('#search-field').keypress(function (e) {
        if (e.which == 13) {
            if(autoCompleteRequest) {
                autoCompleteRequest.abort();
            }
            $('.navbar-form').submit();
            return true;
        }
    });
}

function focusSearch() {
    $('.tt-input').on('focusin', function() {
        $('#cart-overview').removeClass('open');
        $('.cart-overview-underlay').removeClass('active');
        $('.search-focus-overlay').addClass('focused');
        $('html').addClass('static');
    });
    $('.tt-input').on('focusout', function() {
        $('.search-focus-overlay').removeClass('focused');
        $('html').removeClass('static');
    });
}


function toggleCartOverview() {
    $('#toggle-cart-overview, .cart-overview-underlay').on('click', function(){
       $('#cart-overview').toggleClass('open'); 
       $('.cart-overview-underlay').toggleClass('active');
       $('html').toggleClass('static');
    });
}

function formValidation() {
    if($('.form-validate').length){
        $('.form-validate').parsley({
            trigger: "focusout",
            successClass: "form-val-success",
            errorClass: "form-val-error",
            errorsContainer: function(el) {
                return el.$element.parents('.form-group').find('.field-error-container');
            },
            classHandler: function(el) {
                return el.$element.closest(".validation-container");
            },
            errorsWrapper: "<ul class='list-unstyled text-danger'></ul>",
        });
          
        Parsley.addMessages('nl', {
          defaultMessage:       "Deze waarde is onjuist.",
          type: {
            email:              "Dit is geen geldig e-mail adres.",
            url:                "Dit is geen geldige URL.",
            number:             "Deze waarde moet een nummer zijn.",
            integer:            "Deze waarde moet een nummer zijn.",
            digits:             "Deze waarde moet numeriek zijn.",
            alphanum:           "Deze waarde moet alfanumeriek zijn."
          },
          notblank:             "Deze waarde mag niet leeg zijn.",
          required:             "Dit veld is verplicht.",
          pattern:              "Deze waarde is onjuist te zijn.",
          min:                  "Deze waarde mag niet lager zijn dan %s.",
          max:                  "Deze waarde mag niet groter zijn dan %s.",
          range:                "Deze waarde moet tussen %s en %s liggen.",
          minlength:            "Deze tekst is te kort. Deze moet uit minimaal %s karakters bestaan.",
          maxlength:            "Deze waarde is te lang. Deze mag maximaal %s karakters lang zijn.",
          length:               "Deze waarde moet tussen %s en %s karakters lang zijn.",
          equalto:              "Deze waardes moeten identiek zijn.",
        });
        
        Parsley.setLocale('nl');
        Parsley.addValidator('nofuturedates', {
            validateString: function(value, requirement) {
                var input   = moment(value).unix();
                var max     = moment(requirement).unix();
                var min     = moment('19000101', 'YYYYMMDD').unix();
                return input < max && input > min;
            },
            messages: {
                nl: "Deze datum is niet juist."
            }
        });
        
        Parsley.addValidator('validtel', {
            requirementType: 'string',
            validateString: function(value, settings) {
                if (typeof libphonenumber !== 'undefined') {
                    
                }
                var countryCode = $(settings.countryCodeInput).val();
                var hasError = $(settings.numberInput).data('is-bad-number');
                var parsed = libphonenumber.parse(value, countryCode);
                if ('phone' in parsed && !hasError){
                    return true;
                } else {
                    return false;
                }
            },
            messages: {
                en: 'Please enter a valid phone number.',
                nl: 'Vul een geldig telefoonnummer in.',
                de: 'Die Eingabe muss eine gültige Telefonnummer sein.',
            }
        });
        
        Parsley.addValidator('requiredIf', {
            requirementType: 'string',
            validateString: function(value, requirement) {
                if ($(requirement).val() !== '' && value === '') {
                    return false;
                }
                
                return true;
            },
            messages: {
                en: 'This is a required field.',
                nl: "Dit veld is verplicht.",
                de: "Dies ist ein Pflichtfeld.",
            }
        });
    }
}


function mobileMenuToggle() {
    var trigger = $('.toggle-mobile-menu');
    var target  = $('.main-nav');
    
    $('.toggle-mobile-menu, .main-nav-backdrop').on('click', function() {
       target.toggleClass('open-menu'); 
    });
}


function BirthdateField() {
    var el = $('.datepicker');
    var customer = moment(el.data('customer-birthdate') , 'YYYY-MM-DD');
    if(customer.isValid()) {
        el.val(customer.clone().format('DD-MM-YYYY'));
        el.siblings(".datefield").val(customer.clone().format('YYYY-MM-DD'));
        el.siblings(".date_parser").val(customer.clone().format('YYYY-MM-DD'));
    }
    el.on('change blur', function() {
        var input = $(this).val();
        if(moment(input, 'YYYY-MM-DD').isValid()) {
            $(this).siblings(".date_parser").val(moment(input, 'DD-MM-YYYY').clone().format('YYYY-MM-DD'));
        } else {
            $(this).siblings(".date_parser").val('');
        }
    });
    el.siblings(".datefield").on('change blur', function() {
        var input = $(this).val();
        if(moment(input, 'YYYY-MM-DD').isValid()) {
            $(this).siblings(".date_parser").val(moment(input, 'YYYY-MM-DD').clone().format('YYYY-MM-DD'));
        } else {
            $(this).siblings(".date_parser").val('');
        }
    });
}

// $('#email-my-cart-form').on('submit', emailMyCart);

// function emailMyCart(e) {
//     e.preventDefault();
    
//     var form = $(this);
//     var values = serializeObject(form);
//     var url = "https://api.afosto.io/mes/emails/form";
    
//     var buttonStyle = "padding: 12px 16px; background-color: green; color: #fff; border-radius: 4px; display: inline-block; margin-top: 16px; margin-bottom: 32px; text-decoration: none;";
//     var htmlBody = '';
//     htmlBody += '<table style="font-family: sans-serif; padding: 32px 16px;">';
//         htmlBody += '<tr>';
//             htmlBody += '<td>';
//                 htmlBody += '<img src="https://content.afosto.io/5719193282412544/brand/AFO-Logo-compleet-kleur-RGBat4x.png?h=40" height="40" style="margin-bottom: 40px">';
//             htmlBody += '</td>';
//         htmlBody += '</tr>';
//         htmlBody += '<tr>';
//             htmlBody += '<td>';
//                 htmlBody += '<h1>';
//                     htmlBody += 'Beste ' + values.name + ',';
//                 htmlBody += '</h1>';
//             htmlBody += '</td>';
//         htmlBody += '</tr>';
//         htmlBody += '<tr>';
//             htmlBody += '<td>';
//                 htmlBody += '<p>';
//                     htmlBody += 'Verdergaan waar je gebleven was is heel simpel. Klik op onderstaande button om je winkelwagen opnieuw te openen en door te gaan.';
//                 htmlBody += '</p>';
//             htmlBody += '</td>';
//         htmlBody += '</tr>';
//         htmlBody += '<tr>';
//             htmlBody += '<td>';
//                 htmlBody += '<a href="' + location.origin + '/cart/?hash=' + values.hash + '" style="' + buttonStyle + '">';
//                     htmlBody += 'Ga naar je winkelwagen';
//                 htmlBody += '</a>';
//             htmlBody += '</td>';
//         htmlBody += '</tr>';
//         htmlBody += '<tr>';
//             htmlBody += '<td>';
//                 htmlBody += '<p style="margin-bottom: 24px">';
//                     htmlBody += 'Heb je vragen over het bestellen bij Azalp of over onze producten? Antwoord dan op deze e-mail en we komen zo spoedig mogelijk bij je terug.';
//                 htmlBody += '</p>';
//             htmlBody += '</td>';
//         htmlBody += '</tr>';
//         htmlBody += '<tr>';
//             htmlBody += '<td>';
//                 htmlBody += '<p style="margin-bottom: 24px">';
//                     htmlBody += 'Met vriendelijke groet,';
//                 htmlBody += '</p>';
//             htmlBody += '</td>';
//         htmlBody += '</tr>';
//         htmlBody += '<tr>';
//             htmlBody += '<td>';
//                 htmlBody += '<p style="margin-bottom: 24px">';
//                     htmlBody += 'Azalp';
//                 htmlBody += '</p>';
//             htmlBody += '</td>';
//         htmlBody += '</tr>';
//     htmlBody += '</table>';
    
    
//     $.ajax({
//         url : url,
//         method: "POST",
// 		contentType: 'application/json',
// 		data: JSON.stringify({
// 		    from: {
// 		        name: 'template shop',
// 		        email: 'info@faktu.nl'
// 		    },
// 			to: [
// 			    {
// 			        name: values.name,
// 			        email: values.email,
// 			    },
// 		    ],
// 		    recaptcha_response: values['g-recaptcha-response'],
// 		    subject: 'We hebben je winkelwagen opgeslagen!',
// 		    html_body: htmlBody,
// 		    folder: 'sent',
// 		}),
//         beforeSend: function () {
//             form.addClass('loading-ajax');
//         }, 
//         success: function (event, request, settings) {
//             form.removeClass('loading-ajax');
//         },
//         error: function (error) {
//             $(element).removeClass('loading-ajax');
//         }
//     });
// }


// Drawer
$(function () {
    $('body').on('click', '[data-toggle="drawer"]', toggleDrawer);
    $('body').on('click', '[data-dismiss="drawer"]', closeDrawer);
    $('html').on('keyup', function (e) {
        if (e.keyCode == 27) {
            e.preventDefault();
            closeDrawer();
        }
    });
});

function closeDrawer() {
    $('.drawer').trigger('drawer:close');
    $('.drawer-backdrop').off('click touchend', closeDrawer);
    $('.drawer').removeClass('in');
    $('.drawer-backdrop').removeClass('in');
    $('body').css('overflow', '');
    $(window).off('hashchange', closeDrawerOnHashChange);
    if (window.location.hash === '#drawer-open') {
        history.back();
    }
    
    setTimeout(function () {
        $('.drawer-backdrop').remove();
    }, 300);
}

function openDrawer(target) {
    $(target).trigger('drawer:open');
    if ($('.drawer-backdrop').length === 0) {
        $('html').append('<div class="drawer-backdrop"></div>');
        $('.drawer-backdrop').on('click touchend', closeDrawer);
    }
    
    setTimeout(function () {
        $('.drawer-backdrop').addClass('in');
        $(target).addClass('in');
        $('body').css('overflow', 'hidden');
        history.pushState(null, null, '#drawer-open');
        // window.location.hash = 'drawer-open';
        
        $(window).on('hashchange', closeDrawerOnHashChange);
    }, 10);
}

function closeDrawerOnHashChange() {
    if (window.location.hash !== '#drawer-open') {
        closeDrawer();
    }
}

function toggleDrawer() {
    var trigger = $(this);
    var target = $(trigger.data('target'));
    
    if (target.hasClass('in')) {
        closeDrawer(target);
    } else {
       openDrawer(target);
    }
}
// end Drawer

