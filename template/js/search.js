var searchFilterOptionTemplate = '';
searchFilterOptionTemplate += '<div class="checkbox af m-0">';
    searchFilterOptionTemplate += '<label class="filter-option">';
    searchFilterOptionTemplate += '<input type="checkbox" value="{{value}}" {{#isRefined}}checked{{/isRefined}} />';
    searchFilterOptionTemplate += '<div class="checkbox-button"></div>';
    searchFilterOptionTemplate += '<span class="mr-12">{{label}}</span>';
    searchFilterOptionTemplate += '<span class="filter-option-count ml-auto">({{count}})</span>';
    searchFilterOptionTemplate += '</label>';
searchFilterOptionTemplate += '</div>';


var searchItemTemplate = '';
searchItemTemplate += '<div class="product-image">';
searchItemTemplate += '<a href="{{metadata.url}}" title="{{metadata.name}}">';
    searchItemTemplate += '<div class="lazyload-wrapper lazyload-square">';
        searchItemTemplate += '<img src="{{metadata.image}}" alt="{{metadata.name}}" class="lazyload lazyload-cover" />';
    searchItemTemplate += '</div>';
    searchItemTemplate += '<div class="product-name"><strong>{{metadata.name}}</strong></div>';
searchItemTemplate += '</div>';
searchItemTemplate += '<div class="product-info">';
    searchItemTemplate += '<div class="product-info-description hidden-xs list-visible">';
        searchItemTemplate += '<a data-af-href="{{metadata.url}}" class="product-name list-visible" title="{{metadat.name}}">';
            searchItemTemplate += '{{metadata.name}}';
        searchItemTemplate += '</a>';
    searchItemTemplate += '</div>';
searchItemTemplate += '</div>';
searchItemTemplate += '<div class="product-action">';
    searchItemTemplate += '<div class="product-action-text">';
        searchItemTemplate += '<strong class="product-price">';
            searchItemTemplate += '{{#metadata.price_discount}}';
                searchItemTemplate += '{{metadata.price_discount}}';
            searchItemTemplate += '{{/metadata.price_discount}}';
            searchItemTemplate += '{{^metadata.price_discount}}';
                searchItemTemplate += '{{metadata.price}}';
            searchItemTemplate += '{{/metadata.price_discount}}';
            searchItemTemplate += '{{#metadata.price_discount}}';
                searchItemTemplate += '<small><s>{{metadata.price}}</s></small>';
            searchItemTemplate += '{{/metadata.price_discount}}';
        searchItemTemplate += '</strong>';
    searchItemTemplate += '</div>';
searchItemTemplate += '</div>';




function createDataAttributes(refinement) {
  return Object.keys(refinement)
    .map(function(key) {return 'data-' + key + '="' + refinement[key] + '"'})
    .join(' ');
}

function renderListItem(item) {
    var listItemHTML = '';
    
    return  item.refinements.map(function(refinement) {
        return '<div class="p-4"><button class="btn btn-default" type="button" ' + createDataAttributes(refinement) + '>' + refinement.value + ' <i class="fa fa-times fa-w-10 fw-fw ml-12"></i></button></div>';
    }).join('');
}

function renderCurrentRefinements(renderOptions, isFirstRender) {
    var items = renderOptions.items;
    var refine = renderOptions.refine;
    var createURL = renderOptions.createUrl;
    var widgetParams = renderOptions.widgetParams;
    var container = document.querySelector(widgetParams.container);

    if (items.length > 0) {
        container.innerHTML = '<div class="mt-16 mt-md-0 mb-24"><div class="d-flex flex-wrap m-n4">' + items.map(renderListItem).join('') + '</div></div>';
    } else {
        container.innerHTML = '';
    }
    
    (container.querySelectorAll('button') || []).forEach(function(element) {
    element.addEventListener('click', function(event) {
      var item = Object.keys(event.currentTarget.dataset).reduce(
        function(acc, key) {
            acc[key] = event.currentTarget.dataset[key];
            console.log(acc);
            return acc;
        },
        {}
      );

      refine(item);
    });
  });
}


document.addEventListener('DOMContentLoaded', function() {
    if ($('#searchbox').length > 0) {
        var searchClient = window.afostoSearchClient('afostotoppers');
        
        var search = instantsearch({
          indexName: 'azalp-products',
          searchClient: searchClient,
        });
        
        var customCurrentRefinements = instantsearch.connectors.connectCurrentRefinements(renderCurrentRefinements);
    
        search.addWidgets([
            instantsearch.widgets.searchBox({
                container: '#searchbox',
                cssClasses: {
                    input: ['form-control'],
                    submit: ['btn', 'btn-sm', 'btn-primary', 'mx-8'],
                    reset: ['btn', 'btn-sm', 'btn-default'],
                    form: ['d-flex'],
                },
                showLoadingIndicator: false,
                templates: {
                    submit: '<i class="fa fa-search fa-fw"></i>',
                    reset: '<i class="fa fa-times fa-fw"></i>',
                },
            }),
            
            customCurrentRefinements({
                container: '#current-filters',
            }),
            
            instantsearch.widgets.clearRefinements({
                container: '#clear-filters',
                templates: {
                    resetLabel: '<i class="fa fa-times fa-w-10 fa-fw icon-fs-10"></i>Verwijder alle filters',
                },
                cssClasses: {
                    button: ['btn', 'btn-link', 'fw-400', 'p-0', 'mt-24', 'mb-48'],
                    disabledButton: ['hidden'],
                },
            }),
    
            instantsearch.widgets.hitsPerPage({
                container: '#hits-per-page',
                cssClasses: {
                    select: ['form-control'],
                },
                items: [
                    { label: '24', value: 24, default: true },
                    { label: '48', value: 48 },
                    { label: '72', value: 72 },
                    { label: '96', value: 96 },
                ]
            }),
    
            instantsearch.widgets.refinementList({
                container: '#subcat-list',
                attribute: 'sub_category',
                showMore: true,
                cssClasses: {
                    item: ['mb-8'],
                    showMore: ['btn', 'btn-xs', 'btn-link', 'p-0', 'text-body-m', 'pt-4', 'fw-400'],
                    list: ['list-unstyled'],
                    root: ['filter'],
                    disabledShowMore: ['hidden'],
                },
                templates: {
                    item: searchFilterOptionTemplate,
                    showMoreText: '{{#isShowingMore}}' + ($('#subcat-list').data('less-label') || 'Read more') + '<i class="fa fa-angle-up fa-w-10 ml-8"></i>{{/isShowingMore}}{{^isShowingMore}}' + ($('#subcat-list').data('more-label') || 'Read more') + '<i class="fa fa-angle-down fa-w-10 ml-8"></i>{{/isShowingMore}}'
                }
            }),
            
            instantsearch.widgets.refinementList({
                container: '#materials-list',
                attribute: 'material',
                showMore: true,
                cssClasses: {
                    item: ['mb-8'],
                    showMore: ['btn', 'btn-xs', 'btn-link', 'p-0', 'text-body-m', 'pt-4', 'fw-400'],
                    list: ['list-unstyled'],
                    root: ['filter'],
                    disabledShowMore: ['hidden'],
                },
                templates: {
                    item: searchFilterOptionTemplate,
                    showMoreText: '{{#isShowingMore}}' + ($('#subcat-list').data('less-label') || 'Read more') + '<i class="fa fa-angle-up fa-w-10 ml-8"></i>{{/isShowingMore}}{{^isShowingMore}}' + ($('#subcat-list').data('more-label') || 'Read more') + '<i class="fa fa-angle-down fa-w-10 ml-8"></i>{{/isShowingMore}}'
                }
            }),
            
            instantsearch.widgets.refinementList({
                container: '#wood-type-list',
                attribute: 'wood_type',
                showMore: true,
                cssClasses: {
                    item: ['mb-0'],
                    showMore: ['btn', 'btn-xs', 'btn-link', 'p-0', 'text-body-m', 'pt-4', 'fw-400'],
                    list: ['list-unstyled'],
                    root: ['filter'],
                    disabledShowMore: ['hidden'],
                },
                templates: {
                    item: searchFilterOptionTemplate,
                    showMoreText: '{{#isShowingMore}}' + ($('#subcat-list').data('less-label') || 'Read more') + '<i class="fa fa-angle-up fa-w-10 ml-8"></i>{{/isShowingMore}}{{^isShowingMore}}' + ($('#subcat-list').data('more-label') || 'Read more') + '<i class="fa fa-angle-down fa-w-10 ml-8"></i>{{/isShowingMore}}'
                }
            }),
            
            instantsearch.widgets.pagination({
                container: '#pagination',
                cssClasses: {
                    list: ['pagination'],
                    selectedItem: ['active'],
                    noRefinementRoot: ['hidden'],
                },
            }),
            
            instantsearch.widgets.stats({
                container: '#stats-products',
                templates: {
                    text: '{{#hasNoResults}}' + ($('#stats-products').data('no-results') || 'No results') + '{{/hasNoResults}}{{#hasOneResult}}' + ($('#stats-products').data('one-result') || '1 result') + '{{/hasOneResult}}{{#hasManyResults}}' + ($('#stats-products').data('many-results').replace('[n]', '{{#helpers.formatNumber}}{{nbHits}}{{/helpers.formatNumber}}') || '{{#helpers.formatNumber}}{{nbHits}}{{/helpers.formatNumber}} results') + '{{/hasManyResults}}',
                },
            }),
    
          instantsearch.widgets.hits({
            container: '#hits-products',
            cssClasses: {
                root: 'MyCustomHits',
                list: ['product-grid', 'grid', 'list-unstyled'],
                item: ['product-grid-item', 'col-xs-6', 'col-sm-4', 'col-md-4', 'col-lg-3']
            },
            templates: {
                item: searchItemTemplate,
                empty: $('#hits-products').data('empty'),
            },
            transformItems: function(items) {
                return items.map(function(item) {
                    var metadata = item.metadata;
                    metadata.price = intToPrice(metadata.price, true, true);
                    item.metadata = metadata;
                    return item;
                });
            },
          }),
    
          instantsearch.widgets.index({ indexName: 'azalp-pages' }).addWidgets([
            instantsearch.widgets.stats({
                container: '#stats-pages',
                templates: {
                    text: '{{#hasNoResults}}' + ($('#stats-pages').data('no-results') || 'No results') + '{{/hasNoResults}}{{#hasOneResult}}' + ($('#stats-pages').data('one-result') || '1 result') + '{{/hasOneResult}}{{#hasManyResults}}' + ($('#stats-pages').data('many-results').replace('[n]', '{{#helpers.formatNumber}}{{nbHits}}{{/helpers.formatNumber}}') || '{{#helpers.formatNumber}}{{nbHits}}{{/helpers.formatNumber}} results') + '{{/hasManyResults}}',
                },
            }),
              
            instantsearch.widgets.hits({
                container: '#hits-pages',
                templates: {
                    item: '<div class="ais-Hits-list-item"><div class="hit-name">{{metadata.label}}</div><div class="hit-description"><a href="{{metadata.url}}" target="_blank">{{metadata.title}}</a></div></div>',
                    empty: $('#hits-pages').data('empty'),
                },
            }),
          ]),
        ]);
    
        search.start();
    }
});
