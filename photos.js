/*global jQuery*/

var setupPhotos = (function ($) {

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

    function imageAppender (id) {
        var holder = document.getElementById(id);
        return function (img) {
            var elm = document.createElement('div');
            
            elm.className = 'photo';
            
            var fava = document.createElement('a'), favi = document.createElement('i');

            fava.className = 'favorite';

            if(checkFavorite(img)) {
                favi.className = 'icon-heart';
            }
            else {
                favi.className = 'icon-heart-empty';
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

        if(fav.className == 'icon-heart') {
            fav.className = 'icon-heart-empty';
        }
        else {
            fav.className = 'icon-heart';
        }

        if($('.icon-heart').length > 0) {
            $('.icon-heart').each(function(i, el) {
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
    
    var max_per_tag = 5;
    return function setup (tags, callback) {
        loadAllPhotos(tags, max_per_tag, function (err, items) {
            if (err) { return callback(err); }

            each(items.map(renderPhoto), imageAppender('photos'));

            $(document).delegate('.favorite', 'click', function(ev) {
                markFavorite(ev.target);
            });

            callback();

        });
    };
}(jQuery));
