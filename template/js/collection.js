// collection page specific scripts

    /*
     *  ---------- index ---------      
     *  initializeCollection
     *  equalizeElements
     *  replaceParamInUrl
     *  initializeFilterSliders
     */


    /*
     *  ---------- functions ---------
     */
    
    
    
    /*
     *initializeCollection
     *
     *  initializes function for the collection page
     */
    $(function() {
        initializeCollection();
        $(window).resize(function(){mobileMenus()});
    });
    
    function initializeCollection() {
        initializeFilterSliders();
        initPriceRangeFilter();
        mobileMenus();
        productLayout();
        quickViewModal();
        
        $('[data-simple-read-more]').simpleReadMore();
    }
    
    /*
     * ReplaceParamInUrl
     *
     * Replaces the parameters specified in the url
     *
     * Required by: initializeFilterSliders
     * 
     * usage: replaceParamInUrl([url], [param name], [param value])
     */
    
    function replaceParamInUrl(url, paramName, paramValue) {
        var pattern = new RegExp('('+paramName+'=).*?(&|$)'),
            newUrl  = url;
        
        //param exists already in url.    
        if (url.search(pattern) >= 0) {
            newUrl = url.replace(pattern,'$1' + paramValue + '$2');
        } else{
            newUrl = newUrl + (newUrl.indexOf('?') > 0 ? '&' : '?') + paramName + '=' + paramValue; 
        }
        
        return newUrl;
    }
    
    
    /*
     * removeParamInUrl
     *
     * Removes the parameters specified in the url
     *
     * Required by: initializeFilterSliders
     * 
     * usage: RemoveParamInUrl([url], [param name])
     */
    
    function removeParamInUrl(url, paramName) {
        var pattern = new RegExp('('+paramName+'=).*?(&|$)'),
            newUrl  = url;
        
        //param exists already in url.    
        if (url.search(pattern) >= 0) {
            newUrl = url.replace(pattern,'');
        } 
        
        return newUrl;
    }
    
    

    
    
    /*
     * initializeFilterSliders
     *
     * Makes the price slider on the collection page work and redirect to the same url but with a price range parameter
     *
     * Dependent on: replaceParamInUrl
     */ 
    
    function initializeFilterSliders () {
        var sliderElements = $('.filter-slider'); 
        
        if (sliderElements && sliderElements.length > 0) {
            $.each(sliderElements, function () {
                var slider          = $(this),
                    sliderContainer = slider.parent(),
                    rangeEl         = sliderContainer.find('.filter-slider-value'),
                    labelEl         = sliderContainer.find('.filter-slider-label'),
                    min             = slider.data('min'),
                    max             = slider.data('max'),
                    value           = slider.data('value').toString() || '';
               
                if (min !== '' && max !== '') {
                    slider.slider({
                        range  : true,
                        min    : min,
                        max    : max,
                        values : value.split('.'),
                        slide  : function ( event, ui ) {
                            labelEl.html("<span class='pull-left'>&euro; " + ui.values[0] + "</span>   <span class='pull-right'>&euro; " + ui.values[1] + "</span>");
                            rangeEl.val(ui.values[0] + "." + ui.values[1]);
                        },
                        stop   : function ( event, ui ) {
                            var newValue = ui.values[0] + '.' + ui.values[1];
                            document.location.href = replaceParamInUrl(window.location.href, 'price', newValue);
                        }
                    });
                    
                    labelEl.html("<span class='pull-left'>&euro; " + slider.slider("values", 0) + "</span>   <span class='pull-right'>&euro; " + slider.slider("values", 1) + "</span>");
                    
                    if (
                        Number(value.split('.')[0]) !== slider.data('min').toString() ||    //if current-minimum !== minimum of slider
                        Number(value.split('.')[1]) !== slider.data('max').toString()       //if current-maximum !== maximum of slider
                    ) {
                        rangeEl.val(slider.slider("values", 0) + "." + slider.slider("values", 1));
                    }
                }
            });
        }
    }
    
    
    function mobileMenus() {
        var sideMenu    = $('.sidebar-menu');
        var filterMenu  = $('#sub-filter-menu');
        var mobHeader   = $('.navbar').height();
        var mobButton   = $('.mob-button');
        var overlay     = $('.page-overlay');
        var parent      = $('#collection-content');
        
        if($(window).innerWidth() <= 991 ){
            
            // sideMenu.css('top', mobHeader).css('height', 'calc(100% - ' + mobHeader + 'px)');
            // filterMenu.css('top', mobHeader).css('height', 'calc(100% - ' + mobHeader + 'px)');
            
            mobButton.on('click', function(){
                if($(this).data('open') == 'sub-menu'){
                    parent.addClass('menu-is-open');
                } else {
                    parent.addClass('filters-is-open');
                }
            });
            overlay.on('click', function() {
                parent.removeClass('filters-is-open').removeClass('menu-is-open');
            });
            $('.filter .checkbox.af').on('click', function(){
                parent.removeClass('filters-is-open').removeClass('menu-is-open');
            });
            $('.close-mob').on('click', function() {
                parent.removeClass('filters-is-open').removeClass('menu-is-open');
            });
            
        }
    }
    
    function productLayout() {
        var grid = $('#product-grid:not(.no-switch)');
        var initial = localStorage.getItem('productLayout') || 'grid';
        
        grid.removeAttr('class');
        grid.addClass(initial);
        $('.layout-option[data-layout-option="' + initial + '"]').addClass("active");
        $('.layout-option').on('click', function() {
            var option = $(this).data('layout-option');
            grid.removeAttr('class').addClass(option);
            localStorage.setItem('productLayout',option);
            $(this).addClass('active').siblings('.layout-option').removeClass('active');
            
        });
    }
    
    
    function initPriceRangeFilter() {
        var trigger = $('#set-price-range'),
            minEl = $('#price-range-min'),
            maxEl = $('#price-range-max');
            
            
        function triggerPriceRangeCall(key) {
            if (key == 'enter') {
                trigger.trigger('click');
            }
        }
            
        minEl.on('keyup', function(e) { triggerPriceRangeCall(e.key.toLowerCase());  });
        maxEl.on('keyup', function(e) { triggerPriceRangeCall(e.key.toLowerCase()); });
        
        trigger.on('click', function() {
            var min = minEl.val(),
                max = maxEl.val(),
                ajaxEl = trigger.data('pr-ajax-element'),
                ajaxInput = trigger.data('pr-ajax-input'),
                newValue = ( min ? min : minEl.attr('placeholder') ) + '.' + ( max ? max : maxEl.attr('placeholder') ),
                url = replaceParamInUrl(window.location.href, 'price', newValue);
                
            $(ajaxEl).addClass('loading-ajax');
            
            $(ajaxEl).load(url + ' ' + ajaxInput , function() {
                initializeCollection();
                initAjax();
                wishlistModal();
                history.replaceState(null, null, url);
                $(ajaxEl).removeClass('loading-ajax');
            });
        });
    }
    
    function filterListItems() {
        var input = $(this);
        var value = input.val().toUpperCase();
        var list = $(input.data('target'));
        var options = list.find('li');
        
        for (i = 0; i < options.length; i++) {
            txtValue = options[i].textContent || options[i].innerText;
            if (txtValue.toUpperCase().indexOf(value) > -1) {
                $(options[i]).removeClass('hidden');
            } else {
                $(options[i]).addClass('hidden');
            }
        }
    }
    
    