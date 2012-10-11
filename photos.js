/*global jQuery*/

var setupPhotos = (function ($) {

    var defaults, options;

    defaults = {
        tags: ['squirrel', 'cat'],
        max_per_tag: 5,
        holder: 'photos',
        classes : {
            favoriteWrapper : 'favorite',
            favoriteActive : 'icon-heart',
            favoriteInactive : 'icon-heart-empty',
            photo : 'photo'
        }
    }

    options = $.extend({}, defaults, options); 
    
    function each (items, callback) {
        var i;
        for (i = 0; i < items.length; i += 1) {
            setTimeout(callback.bind(this, items[i]), 0);
        }
    }

    function flatten (items) {
        return items.reduce(function (a, b) {
            return a.concat(b);
        });
    }

    function loadPhotosByTag (tag, max, callback) {
        
        var photos = [];
        var callback_name = 'callback_' + Math.floor(Math.random() * 100000);

        window[callback_name] = function (data) {
            delete window[callback_name];
            var i;
            for (i = 0; i < max; i += 1) {
                photos.push(data.items[i].media.m);
            }
            callback(null, photos);
        };

        $.ajax({
            url: 'http://api.flickr.com/services/feeds/photos_public.gne',
            data: {
                tags: tag,
                lang: 'en-us',
                format: 'json',
                jsoncallback: callback_name
            },
            dataType: 'jsonp'
        });
    }

    function loadAllPhotos (tags, max, callback) {
        var results = [];
        function handleResult (err, photos) {
            if (err) { return callback(err); }

            results.push(photos);
            if (results.length === tags.length) {
                callback(null, flatten(results));
            }
        }

        each(tags, function (tag) {
            loadPhotosByTag(tag, max, handleResult);
        });
    }

    function renderPhoto (photo) {
        var img = new Image();
        img.src = photo;
        return img;
    }

    function imageAppender () {
        var holder = document.getElementById(options.holder);
        return function (img) {
            var elm = document.createElement('div');
            
            elm.className = options.classes.photo;
            
            var fava = document.createElement('a'), favi = document.createElement('i');

            fava.className = options.classes.favoriteWrapper;

            if(checkFavorite(img)) {
                favi.className = options.classes.favoriteActive;
            }
            else {
                favi.className = options.classes.favoriteInactive;
            }

            fava.appendChild(favi);

            elm.appendChild(img);
            holder.appendChild(elm);
            elm.appendChild(fava);

        };
    }

    function markFavorite(fav) {
        
        var favSrc, favSrcs;

        favSrcs = [];

        if(fav.className == options.classes.favoriteActive) {
            fav.className = options.classes.favoriteInactive;
        }
        else {
            fav.className = options.classes.favoriteActive;
        }

        if($('.'+options.classes.favoriteActive).length > 0) {
            $('.'+options.classes.favoriteActive).each(function(i, el) {
                favSrc = $(el).parent('a').prev('img').attr('src');
                favSrcs.push(encodeURIComponent(favSrc));
            });
        }

        document.cookie = 'user_favorites='+favSrcs.join(',');
    }


    function checkFavorite(img) {

        var cookieData = document.cookie.split(';');
        var galleryData = '';

        $.each(cookieData, function(k,v) {
            if(!galleryData && v.match(/^\s?user_favorites=/)) {
                galleryData = decodeURIComponent(
                    v.split('=').pop()
                ).split(',');
            };
        });

        if(jQuery.inArray($(img).attr('src'), galleryData) != -1) {
            return true;
        }

        return false;
    }

    // ----
    
    return function setup (settings, callback) {
  
        options = $.extend({}, defaults, settings);  
       
        loadAllPhotos(options.tags, options.max_per_tag, function (err, items) {
            if (err) { return callback(err); }

            each(items.map(renderPhoto), imageAppender());

            $(document).delegate('.'+options.classes.favoriteWrapper, 'click', function(ev) {
                markFavorite(ev.target);
            });

            callback();

        });
    };
}(jQuery));
