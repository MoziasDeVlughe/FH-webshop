function initReviews() {
    $("input.rating").rating({
        step: 1,
        size: 'lg',
        showClear: false,
        clearButton: '<i class="fa fa-times fa-2x " aria-hidden="true"></i>',
        showCaption: false,
        symbol : '&#xe005;',
        filledStar : '<i class="fa fa-star fa-lg" aria-hidden="true"></i>',
        emptyStar : '<i class="fa fa-star fa-lg" aria-hidden="true"></i>',
    });  
}