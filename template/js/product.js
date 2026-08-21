

    /*
     * ---------- index ---------      
     * startProductPage
     * initializeThumbsHover
     */
    
    
    /*
     * Initialize functions
     */
    $(function() {
        startProductPage();
    });
    
    /*
     * --------- functions ---------
     */
 
    /*
     * startProductPage
     * 
     * Initializes all the functions for the product page
     */
     
     function getErrorMessage(error) {
      var errorResponse = error.response || {};
      var errorResponseData = errorResponse.data || {};
      var errorResponseError = errorResponseData.error || {};
      var gqlResponseErrors = errorResponse.errors || [];
      var firstGqlError = (gqlResponseErrors || [])[0];
      var gqlErrorExtensions = firstGqlError.extensions || {};
      var pointers = (errorResponseError.details && errorResponseError.details.pointers) || (firstGqlError.extensions && firstGqlError.extensions.pointers);
      var firstPointer = (pointers || [])[0];
    
      return (
        (firstPointer && firstPointer.message) ||
        (errorResponseError && errorResponseError.message) ||
        (errorResponseData && errorResponseData.message) ||
        (firstGqlError && firstGqlError.message)
      );
    }
     
    function startProductPage(){
        // initializeThumbsHover();
        // InitThumbScroll();
        // triggerLightbox();
        formValidation();
        
        if ($('#review-form-container').length > 0) {
            initReviews();
        }
        if ($('#product-form').length > 0) {
            AddToCartAjax('#product-form', '#add-response-modal');
        }
        if ($('.grid-product-form').length > 0) {
            AddToCartAjax('.grid-product-form', '#add-response-modal');
        }
        if ($('.wishlist-product-form').length > 0) {
            AddToCartAjax('.wishlist-product-form', '#add-response-modal');
        }
        if ($('#wishlist-to-cart-form').length > 0) {
            AddToCartAjax('#wishlist-to-cart-form', '#add-response-modal');
        }
        $('[data-window-url]').on('click', openWhatsappPopup);
        
        if (typeof Fancybox === 'function') {
            Fancybox.bind("[data-fancybox]", {
                Hash: false,
                Thumbs: {
                    type: "classic",
                },
                Carousel: {
                    infinite: false,
                },
                Toolbar: {
                    display: {
                        left: ['infobar'],
                        middle: [],
                        right: ['close'],
                    },
                },
            });
        }
        
        var thumbsSwiper = new Swiper(".product-thumbnails", {
            slidesPerView: 5,
            // slidesPerGroup: 1,
            watchSlidesProgress: true,
        });
    
        var fullImagesSwiper = new Swiper(".product-full-images", {
            slidesPerView: 1,
            slidesPerGroup: 1,
            navigation: {
                enabled: true,
                nextEl: '.swiper-button-next[data-target=".product-full-images"]',
                prevEl: '.swiper-button-prev[data-target=".product-full-images"]',
            },
            scrollbar: {
                el: '.swiper-scrollbar[data-target=".product-full-images"]',
          },
            thumbs: {
                swiper: thumbsSwiper
            }
        });
    }
    
    /*
     * initializeThumsHover
     * 
     * When a mouse hovers over a thumbnail image a function is triggered
     * The functions takes the value of the 'data-img' attribute of the hover image and 
     * replaces the source of the image inside of the element with the class '.main-image' with that value
     */
    // function initializeThumbsHover(){
    //     $('.thumbnail-container div:first-child img').addClass('active');
    //     $('.thumbnail-container img').on('mouseover', function(){
    //         $('.thumbnail-container .thumbnail').removeClass('active');
    //         $(this).addClass('active');
    //         $('.main-image img').attr('src', $(this).attr('data-img'));
    //     });
        
    // }
    
    // function InitThumbScroll() {
    //     var container       = $('.thumbs-side-layout .thumbnail-container');
    //     var thumbnail       = $(container).find(' .thumbnail');
        
    //     var MainImgHeight   = $('.main-image').outerHeight();
        
    //     container.delay($('.main-image img').load()).height(MainImgHeight).scrollTop(1000).delay(1000).animate({ scrollTop: 0}, 1000);
        
    //     $(window).resize(function() {
    //         var MainImgHeight   = $('.main-image').outerHeight();
    //         container.height(MainImgHeight);
    //     });
        
    // }

    /*
     * triggerLightbox
     * 
     * triggers a click event on the thumbnail with the class active
     * this click event triggers the lightbox that is used on the thumbnails
     */
     
    // function triggerLightbox() {
    //     $('.main-image').on('click', function(){
    //         $('#product-page-content .thumbnail-container .thumbnail.active').parent().trigger('click');
    //     });
    // }
    
    /*
     * AddToCartAjax
     * 
     * When the given form is submitted this fuction adds the product via an ajax call
     * If it succeeds or fails it will display a modal or alert (depending on the value in notification)
     *
     * Params
     * form             id or class     form to trigger function on submit
     * notification     string          method of displaying notification
     */
    function AddToCartAjax(formRef, modal) {
        var form = $(formRef);
        form.off('submit', handleAddToCartAjax).on('submit', {
            form: form,
            modal: modal
        }, handleAddToCartAjax);
    }
    
    function handleAddToCartAjax(e) {
        var form = e.data.form;
        var modal = e.data.modal;
        var url = $(this).attr('action');
        
        var formid = "#" + $(this).attr('id');
        form = $(formid);
        var submitButton = $(formid + ' .btn[type="submit"]');
        
        var form_data = form.serialize();
        
        var product_url = form.data('product-url');
        var cart_url = form.data('cart-url');
        
        var event_data = retrieveFormInput(form);
        var formattedItems = event_data.map(function(item) {
           return { sku: item.sku, quantity: parseInt(item.quantity, 10) };
        });
        
        if(modal == '#quick-view-modal') {
            $(modal).modal('show');
            $(modal + " .modal-body").html('<i class="fas fa-cog fa-spin fa-4x text-muted"></i>');
            $(modal + " .modal-body").addClass('text-center');
            $(modal + " .modal-header .modal-title").html($(modal).data("loading-title"));
            $(modal + " .modal-footer").addClass('hidden');
        }
        
        
        submitButton.addClass('btn-loading');
        submitButton.attr('disabled', true);
        
        Storefront.addCartItems(formattedItems)
            .then(function(result) {
                $(modal).modal('hide');
                openDrawer('#cart-drawer');
                $('.cart-toggle').trigger('cart:updated', result);
                afAddToCartEvent(event_data);
            })
            .catch(function(error) {
                $(modal + " .modal-header .modal-title").html($("#add-response-modal").data("error-title"));
                $(modal + " .modal-body").addClass('text-center');
                $(modal + " .modal-body").html('<span class="fa-stack fa-3x text-warning"><i class="far fa-circle fa-stack-2x"></i><i class="fas fa-exclamation fa-stack-1x"></i></span><p class="lead mt-15">' + getErrorMessage(error) + '</p>');
                $(modal).modal('show');
            }).finally(function() {
                submitButton.attr('disabled', false);
                submitButton.removeClass('btn-loading');
            });
        
        // $.ajax({
        //     type: "POST",
        //     url: url,
        //     data: form_data,
        //     beforeSend: function () {
                // if(modal == '#add-response-modal') {
                //     $('#quick-view-modal').modal('hide');
                // }
                // $(modal).modal('show');
                // $(modal + " .modal-body").html('<i class="fas fa-cog fa-spin fa-4x text-muted"></i>');
                // $(modal + " .modal-body").addClass('text-center');
                // $(modal + " .modal-header .modal-title").html($(modal).data("loading-title"));
                // $(modal + " .modal-footer").addClass('hidden');
                
        //     }, 
        //     success: function (event, request, settings) {
        //         $(modal + " .modal-body").removeClass('text-center');
        //         var modalContent = '';
        //         var currencySymbol = $('body').data('af-currency');
                
        //         if (typeof event.object.new_products !== 'undefined' && event.object.new_products.length > 0) {
                    
        //             var products = event.object.new_products;
        //             var newLines = event.object.new_lines;
                    
        //             var isBundle = event.object.post.bundle_name !== undefined;
                    
                    
        //             $(modal + " .modal-header .modal-title").html($(modal).data("success-title"));
                    
        //             modalContent += '<div class="d-flex flex-column">';
        //                 if (!isBundle) {
                            
        //                     $.each(products, function(key, prod) {
                                
        //                         modalContent += '<div class="d-flex w-100">';
        //                             modalContent += '<img src="' + prod.image_default.thumbs[100] + '" class="mr-20">';
        //                             modalContent += '<div class="flex-fill">';
        //                                 modalContent += '<h4>';
        //                                     modalContent += '<strong>';
        //                                         modalContent += prod.name;
        //                                     modalContent += '</strong>';
        //                                 modalContent += '</h4>';
                                        
        //                                 modalContent += '<div class="d-flex align-items-end">';
        //                                     modalContent += '<ul class="list-inline mb-0">';
        //                                         $.each(prod.attributes, function(key, option) {
        //                                             modalContent += '<li>';
        //                                                 modalContent += '<small class="text-muted">';
        //                                                     modalContent += option.label;
        //                                                 modalContent += '</small>';
        //                                                 modalContent += '<br />';
        //                                                 modalContent += '<span>';
        //                                                     $.each(option.options, function(key, value) {
        //                                                         if (value.active) {
        //                                                             modalContent += value.label;
        //                                                         }
        //                                                     })
        //                                                 modalContent += '</span>';
        //                                             modalContent += '</li>';
        //                                         })
        //                                     modalContent += '</ul>';
        //                                     modalContent += '<div class="ml-auto">';
        //                                         modalContent += '<strong>';
        //                                             modalContent += currencySymbol + ' ' + Number(parseFloat(prod.price)).toFixed(2).replace('.',',').replace(',00', ',-');
        //                                         modalContent += '</strong>';
        //                                     modalContent += '</div>';
        //                                 modalContent += '</div>';
        //                             modalContent += '</div>';
        //                         modalContent += '</div>';
        //                     });
                            
        //                 } else {
                            
        //                     var bundleItems = $.each(newLines, function(lineIndex, line) {
        //                         var thisLine = $.grep(products, function(item) {
        //                             return item.product_id === line.product_id;
        //                         });
                                
        //                         line.product = thisLine[0];
        //                         return line;
        //                     });
        //                     var bundleName = event.object.post.bundle_name,
        //                         bundlePrice = event.object.post.bundle_price,
        //                         bundleOriginalPrice = event.object.post.bundle_original_price,
        //                         bundleDiscount = event.object.post.bundle_discount;
                                
                                
        //                     modalContent += '<div class="d-flex w-100">';
        //                         modalContent += '<div class="flex-fill">';
        //                             modalContent += '<h4>';
        //                                 modalContent += '<strong>';
        //                                     modalContent += bundleName;
        //                                 modalContent += '</strong>';
        //                             modalContent += '</h4>';
        //                             modalContent += '<div class="d-flex flex-wrap mx-n5">';
        //                                 $.each(bundleItems, function(index, item) {
        //                                     modalContent += '<div class="d-flex align-items-center panel panel-default panel-body py-5 px-10 mx-5 mb-5">';
        //                                         modalContent += '<img src="' + item.product.image_default.thumbs[50] + '" class="icon-30 mr-10">';
        //                                         modalContent += item.product.name;
        //                                     modalContent += '</div>';
        //                                 });
        //                             modalContent += '</div>';
        //                             modalContent += '<div class="d-flex align-items-end mb-10">';
        //                                 modalContent += '<strong class="text-success">';
        //                                     modalContent += bundleDiscount;
        //                                 modalContent += '</strong>';
        //                                 modalContent += '<div class="ml-auto d-flex flex-column align-items-end">';
        //                                     modalContent += '<small>';
        //                                         modalContent += '<s>';
        //                                             modalContent += currencySymbol + ' ' + Number(parseFloat(bundleOriginalPrice)).toFixed(2).replace('.',',').replace(',00', ',-');
        //                                         modalContent += '</s>';
        //                                     modalContent += '</small>';
        //                                     modalContent += '<strong class="text-success">';
        //                                         modalContent += currencySymbol + ' ' + Number(parseFloat(bundlePrice)).toFixed(2).replace('.',',').replace(',00', ',-');
        //                                     modalContent += '</strong>';
        //                                 modalContent += '</div>';
        //                             modalContent += '</div>';
        //                         modalContent += '</div>';
        //                     modalContent += '</div>';
        //                 }
        //             modalContent += '</div>';
        //         } else {
        //             $(modal + " .modal-header .modal-title").html($(modal).data("success-title"));
        //             modalContent += '<div class="d-flex justify-content-center">';
        //                 modalContent += '<h2 class="text-center">';
        //                     modalContent += event.message;
        //                 modalContent += '</h2>';
        //             modalContent += '</div>';
        //         }
                
        //         $(modal + " .modal-body").html(modalContent);
                
        //         afAddToCartEvent(event_data);
                
        //         var url     = product_url;
        //         var element = modal + ' .modal-body .add-response-upsell-products';
        //         var input   = '.related-products-wrapper .product-container #product-grid > *';
        //         $(element).addClass('loading-ajax').css('min-height', '100px');
        //         $(element).addClass('slick-slider');
                
        //         $(element).load(url + ' ' + input , function(){
        //             startProductPage();
        //             quickViewModal();
        //             $(element).removeClass('loading-ajax').removeAttr('style');
        //             $('.add-response-upsell-products .btn-group.flex-25').remove();
        //             $('.add-response-upsell-products .btn-group.flex-50').removeClass('flex-50').addClass('btn-block');
        //             $(element).slick({
        //                 slidesToShow: 3,
        //                 infinite: false,
        //                 useCSS: true,
        //                 speed: 300,
        //                 useTransform: true,
        //                 cssEase: 'ease-in-out',
        //                 responsive: [
        //                     {
        //                         breakpoint: 1200,
        //                         settings: {
        //                             slidesToShow: 3,
        //                             slidesToScroll: 1,
        //                         }
        //                     },
        //                     {
        //                         breakpoint: 767,
        //                         settings: {
        //                             slidesToShow: 2,
        //                             slidesToScroll: 1,
        //                             draggable: true,
        //                         }
        //                     }
        //                 ]
        //             });
                    
        //         });
               
               
        //         $(modal + " .modal-footer.success-add").removeClass('hidden');
        //         updateCart(event.object, cart_url);
        //     },
        //     error: function (event, request, settings) {
        //         var response = $.parseJSON(event.responseText);
        //         $(modal + " .modal-header .modal-title").html($(modal).data("error-title"));
        //         $(modal + " .modal-body").html('<span class="fa-stack fa-4x text-danger"><i class="far fa-circle fa-stack-2x"></i><i class="fas fa-times fa-stack-1x"></i></span><p class="lead">' + response.message + '</p>');
        //     }
        // });
        e.preventDefault();
    }
    
    
    function updateCart(cart, url) {
        
        var count       = cart.count,
            items       = cart.items;
        
        var counter         = $('.cart-toggle .badge, .fixed-utilities .badge'),
            cartContainer   = $('.cart-overview-inner'),
            cartButtons     = $('.cart-overview-buttons');
        var cartHtml        = []; 
        
        var element = '#cart-drawer',
            input = '#cart-drawer>*';
        
        $.get(url, function(html) {
            var content = $('<div>' + html.replace(/>[\n\t ]+</g, "><") + '</div>');
            $(element).html(content.find(input));
            initCartPage();
            $('#cart-overview').removeClass('loading-ajax');
        });
        
        counter.html(cart.count);
        
        cartButtons.find('.btn').removeClass('disabled');
    }
    
    function afAddToCartEvent(data) {
        $(document).trigger('af.cart.add', [data]);
    }
    
    function retrieveFormInput(form) {
        var approvedAttributes = ['product_id', 'price', 'quantity', 'sku'];
        var products = form.serializeArray().reduce(function(product, item) {
            var val = 0;
            
            if (item.name.split('[')[1]) {
                key = item.name.split('[')[1].replace(']', '');
                attribute = item.name.split('[')[2].replace(']', '');
            } else {
                key = "0";
                attribute = item.name;
            }
            
            if ($.inArray(attribute, approvedAttributes) >= 0 && item.value !== "") {
                product[key] = product[key] || {};
                product[key][attribute] = item.value;
            }
            
            return product;
        }, []); 

        return products;
    }
    
    function openChat() {
        $('.trigger-chat').on('click', function(){
            $('#lc_chat_layout').removeAttr('style').removeClass('lc-collapsed').addClass('lc-expanded').css('height', 393);
        });
    }
    
    function openWhatsappPopup(e) {
        e.preventDefault();
        var url = $(this).data('window-url');
        
    	var w = 400;
    	var h = 400;
    	
    	var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
        var dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;	
    	
    	var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
        var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
    	
    	var left = (width - w) / 2 + dualScreenLeft;
    	var top = (height - h) / 2 + dualScreenTop;
    	
    	window.open(url, 'Coccinelle Whatsapp', 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
    }
    
    function setContactStatus() {
    $.each($('.show-contact-status'), function(idx, item) {
        var el = $(item),
            currentDate = moment(el.data('current-date'), 'X'),
            currentWeekday = currentDate.format('d'),
            currentTime = currentDate.format('HH:mm'),
            openDays = el.data('open-days').split(','),
            openFrom = moment(el.data('open-from'), 'HH:mm'),
            openTill = moment(el.data('open-till'), 'HH:mm');
            
        if($.inArray(currentWeekday, openDays) != -1) {
            if(currentDate.isBetween(openFrom, openTill)) {
                el.addClass('contact-status-open');
            }
        }
    });
}
