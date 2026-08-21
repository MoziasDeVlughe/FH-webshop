(function($) {
	$.fn.simpleReadMore = function(options) {
		
		var settings = $.extend({
			collapsedHeight: 0,
			speed: 200,
			button: '.read-more-toggle',
		}, options);
		
		var element = $(this),
			collapsedHeight = element.data('read-height') || settings.collapsedHeight,
			readMoreText = element.data('read-more'),
			readLessText = element.data('read-less'),
			toggle = $(settings.button);
		
		var transitionCss = '.af-read-more {overflow: hidden; max-height: none; transition: height ' + settings.speed + 'ms}',
			styleTag = document.createElement('style');
		
		styleTag.appendChild(document.createTextNode(transitionCss));
		document.getElementsByTagName('head')[0].appendChild(styleTag);
		element.addClass('af-read-more').css('height', collapsedHeight);
		toggle.html(readMoreText);
		
		function toggleReadMoreBlock(toggle, element) {
			element = $(element);
			var isOpen = element.data('read-is-open'),
				openHeight = element.prop('scrollHeight');
			
			element
				.css("height", isOpen ? collapsedHeight : openHeight)
				.data('read-is-open', !isOpen)
				.attr('aria-expanded', !isOpen);
			toggle.html(isOpen ? readMoreText : readLessText);
		}
		
		toggle.on('click', function(e) {
			e.preventDefault();
			toggleReadMoreBlock($(this), $(this).data('target'));
		});
		$(window).resize(function() {
			if(element.data('read-is-open')) {
				element.removeAttr('style');
				element.css("height", element.prop('scrollHeight'));
			}
		});
		
		return this;
	};
}(jQuery));