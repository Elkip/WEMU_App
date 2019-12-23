/**
 * @file
 * Main JS file to include ads in certain areas of a page.
 *
 * Based on CSS breakpoints a page gets either mobile or desktop
 * ad treatment.
 */
;(function ($, Drupal, googletag, undefined) {
  Drupal.behaviors.responsive_ads = {
    attach: function(context, settings) {
      this.networkCode = settings.responsive_ads.networkCode;
      this.prefix = settings.responsive_ads.prefix;
      this.adUnitTypes = settings.responsive_ads.adUnitTypes;
      this.adUnits = settings.responsive_ads.adUnits;
      this.placements = settings.responsive_ads.placements;
      this.persistentPlacements = settings.responsive_ads.persistentPlacements;
      this.targeting = settings.responsive_ads.targeting;
      this.renderPersistentAds = window.onInitialPage;

      this.init();
    },

    /**
     * Puts ad templates on the page; sends config for ads; displays ads;
     */
    init: function () {
      this.injectAdUnits();
      this.configureAdUnits();
      this.displayAdUnits();
    },

    /**
     * Generate simple template for ad divs.
     */
    adUnitMarkup: function (name, type) {
      return '<div id="div-gpt-ad-' + name + '" class="ad ad-' + type + '"></div>';
    },

    /**
     * Write each ad unit's markup into the proper place on the page.
     */
    injectAdUnits: function () {
      var that = this;

      $.each(this.adUnits, function (key, adUnit) {
        // Don't inject persistent region ads on non-first page loads
        var adUnitPlacementIsPersistent = adUnit.name in that.persistentPlacements;
        if (that.renderPersistentAds == false && adUnitPlacementIsPersistent) {
          return;
        }

        var $domObject = $(that.placements[adUnit.name]);
        var adUnitMarkup = that.adUnitMarkup(adUnit.name, adUnit.type);

        // Place the ad unit
        $domObject.before(adUnitMarkup);
      });
    },

    /**
     * Configures the ad slots on the DFP side.
     */
    configureAdUnits: function () {
      var that = this;

      $.each(this.adUnits, function (key, adUnit) {
        var adUnitID = '/' + that.networkCode + '/' + that.prefix + '_' + adUnit.name;
        var adUnitType = that.adUnitTypes[adUnit.type];
        var slotId = 'div-gpt-ad-' + adUnit.name;
        var slot;
        var mapping;

        googletag.cmd.push(function () {
          // Constructs the ad slot and associates it with the div id. Enables the ads service.
          slot = googletag
            .defineSlot(adUnitID, [adUnit.width, adUnit.height], slotId)
            .addService(googletag.pubads());

          // Sets up the size mappings (what ad size is rendered for what viewport).
          mapping = googletag.sizeMapping();
          $.each(adUnitType.sizes, function (key, size) {
            mapping = mapping.addSize(size.viewportSize, size.slotSize);
          });
          mapping = mapping.build();
          slot.defineSizeMapping(mapping);
        });
      });

      if (typeof(googletag) != 'undefined' && typeof(googletag.pubads) != 'undefined') {
        googletag.pubads().collapseEmptyDivs(true);
        googletag.pubads().enableSingleRequest();
        this.setTargeting();
        googletag.enableServices();
      }
    },

    /**
     * Wrapper for targeting.
     */
    setTargeting: function () {
      if (typeof(googletag) != 'undefined' && typeof(googletag.pubads) != 'undefined') {
        $.each(this.targeting, function (key, element) {
          googletag.pubads().setTargeting(key, element);
        });
      }
    },

    /**
     * Makes the call to google to display our ads in their slots.
     */
    displayAdUnits: function () {
      if (typeof(googletag) != 'undefined' && typeof(googletag.pubads) != 'undefined') {
        $.each(this.adUnits, function (key, adUnit) {
          googletag.display('div-gpt-ad-' + adUnit.name);
        });
      }
    }
  };
})(jQuery, Drupal, googletag);
;
/**
 * @file
 * Javascript for getting the sitewide alert info.
 */
(function ($) {
  Drupal.behaviors.sitewidealert = {
    attach: function (context, settings) {
      $.ajax({
        type: 'GET',
        url: '/ajax/sitewide-alert',
        dataType: 'json',

        success: function (data) {
          var alert = $("<div/>", {
            "class": data.classes.join(' '),
            "html": $("<a>", {
              href: data.href,
              html: data.link_text,
              target: data.target
            })
          });

          $('#sitewide-alert').html(alert);
        }
      });
    }
  };
})(jQuery);;
/**
 * @file
 * Javascript for the pi_outrigger module.
 */
;(function ($, Drupal, undefined) {
  Drupal.behaviors.sharedCacheRoundTrip = {
    /**
     * Our attach funcionality.
     *
     * @param array context
     *   The drupal context.
     * @param array settings
     *   The drupal settings array.
     */
    attach: function (context, settings) {
      var $images = $("img.wysiwyg-asset-image-wrapper");
      var credit = null;
      var specifiedCssClass = null;
      var caption = '';
      var htmlMarkup = '';
      var cssMarkup = '';

      for (var i = 0; i < $images.length; i++) {
        cssMarkup = 'wysiwyg-asset-image-wrapper';
        credit = $($images[i]).data("attribution");
        specifiedCssClass = $($images[i]).attr('class');
        caption = $($images[i]).data("caption");

        // Remove class from img tag, we will apply it to wrapper instead.
        if (specifiedCssClass) {
          $($images[i]).removeClass(specifiedCssClass);
          cssMarkup = specifiedCssClass;
        }

        htmlMarkup = '<div class="' + cssMarkup + '">'
          + '<div class="wysiwyg-asset-image">'
          + '<a href="' + $($images[i]).attr('src') + '" class="popup">'
          + $images[i].outerHTML
          + '</a>'
          + '<div class="image-meta-wrapper">'
          + '<div class="cp-si-caption">' + (caption ? caption : '') + '</div>'
          + (credit ? '<div class="cp-si-credit">' + credit + '</div>' : '')
          +  '</div>'
          + '</div>'
          + '</div>';

        $images[i].outerHTML = htmlMarkup;
      }
    }
  };
})(jQuery, Drupal);
;
/**
 * @file
 * Main file for Triton player widget functionality.
 */

(function ($) {
  var timer;

  Drupal.behaviors.tritonPlayer = {
    attach: function () {
      var that = this;
      var widgetPlayer;

      // Retrieve C2 metadata
      that.retrieveAllMetadata();

      /**
       * Expand and collapse the dropdown menu.
       */
      $('.triton-more-toggle').unbind('click').click( function() {
        $('#triton-player').toggleClass('expanded');
      });

      /**
       * Callback for player ready event.
       *
       * Binds the widget object and sets the first stream as the current stream.
       *
       * @param {object} object The Triton widget object.
       */
      window.appReady = function (object) {
        widgetPlayer = object;

        // Handle stream selection CSS
        $('.triton-stream-selector-link:first').addClass('current');
      };

      /**
       * Callback for stream start event.
       *
       * Sets the current stream as playing, and expands the dropdown area.
       */
      window.onStreamStart = function () {
        // Handle stream selection CSS
        $('.triton-stream-selector-link.current').siblings().removeClass('playing');
        $('.triton-stream-selector-link.current, .td-player-bar').addClass('playing');
        $('#triton-player').addClass('expanded played playing');
      };

      /**
       * Callback for stream stop event.
       *
       * Unsets the current stream as playing.
       */
      window.onStreamStopped = function () {
        // Handle stream selection CSS
        $('#triton-player, .triton-stream-selector-link.current, .td-player-bar').removeClass('played playing');
      };

      /**
       * Callback for the click event on the stream selection links.
       *
       * Tells the widget to start playing the clicked stream, retrieves metadata from C2,
       * expands the dropdown menu area, and sets the current class on the currently selected stream.
       *
       * @param {event} e The click event.
       */
      $('.triton-stream-selector-link').click(function (e) {
        e.preventDefault();

        if (!widgetPlayer) {
          return;
        }

        widgetPlayer.trigger(
          'play',
          { station: $(this).data('stream-key') }
        );

        // Set the header for the current stream name
        var currentStreamName = $(this).data('stream-name');
        $('.stream-program-header').text(currentStreamName);

        // Handle stream selection CSS
        $('.triton-stream-selector-link').removeClass('current playing');
        $(this).addClass('current');

        // Retrieve C2 metadata
        that.retrieveAllMetadata();
      });

      /**
       * Callback for the click event on the main play/pause button.
       *
       * There seems to be a bug with Triton in which users need to move their
       * mouse after clicking play before a being able to pause. This is a workaround
       * to fix that by triggering "stop" events when required.
       *
       * @param {event} e The click event.
       */
      $('.triton-left').on('click', function (e) {

        if (!widgetPlayer) {
          return;
        }

        var $target = $(e.target);

        // Fixes for pause
        if ($target.hasClass('fa-pause')) {
          widgetPlayer.trigger('stop');
          return;
        }
        // Fixes for pause
        if ($target.hasClass('td-player-bar__nowplaying__cover-art') || $target.hasClass('tdcoverart')) {
          if ( $('#triton-player').hasClass('playing') ){
            widgetPlayer.trigger('stop');
            return;
          }
        }
      });
    },


    /**
     * Retrieves program and song metadata from Composer 2.
     *
     * Repeats the call to fetchNowPlaying every 20 seconds after the initial function call.
     */
    retrieveAllMetadata: function () {
      // Clear the current program and song metadata while waiting for C2 to return.
      this.renderCurrentStreamProgramMetadata('', '');
      this.renderCurrentStreamSongMetadata('', '', '', '');

      // Get all the stream UCSs
      var allStreamUcss = [];
      $('.stream-selector-links .stream-list li a').each(function () {
        allStreamUcss.push($(this).data('stream-ucs'));
      });

      // Get either the currently selected stream's UCS, or the first stream's UCS
      var $currentStream = $('.triton-stream-selector-link.current');
      var $firstStream = $('.triton-stream-selector-link:first');
      var currentStreamUcs = $currentStream.length ? $currentStream.data('stream-ucs') : $firstStream.data('stream-ucs');

      // Call the API function, and set an interval for it
      (function fetch() {
        clearTimeout(timer);
        // composer2.js will call render functions on success
        Drupal.behaviors.tritonPlayerComposer2.fetchNowPlaying(allStreamUcss, currentStreamUcs);
        timer = setTimeout(fetch, 20000);
      })();
    },

    /**
     * Render the program name for the UCS's provided.
     *
     * @param {string} ucs The stream UCS to render the name for.
     * @param {string} programName The program name to render.
     */
    renderStreamProgramName: function (ucs, programName) {
      $(".triton-stream-selector-link[data-stream-ucs='" + ucs + "'] .stream-selector-program-name").text(programName);
    },

    /**
     * Render the program metadata for the currently selected stream.
     *
     * @param {string} programName The name of the program.
     * @param {string} nextProgramInfo The time and name of the next program.
     */
    renderCurrentStreamProgramMetadata: function (programName, nextProgramInfo) {
      $('.stream-program-name').text(programName);
      $('.stream-program-nextinfo').text(nextProgramInfo);
    },

    /**
     * Render the song metadata for the currently selected stream.
     *
     * @param {string} songArtworkUrl Image Url for album artwork.
     * @param {string} trackName The name of the track.
     * @param {string} songArtist The artist or composer, for non-classical and classical songs, respectively.
     * @param {string} songCollection The song collection.
     */
    renderCurrentStreamSongMetadata: function (songArtworkUrl, trackName, songArtist, songCollection) {
      // If no song metadata is present, hide the div
      if (!songArtworkUrl && !trackName && !songArtist && !songCollection) {
        $('.stream-song-container').hide();
        return;
      }

      // Otherwise, show the div with song metadata
      if (songArtworkUrl) {
        $('.stream-song-artwork').css("background-image", 'url("' + songArtworkUrl + '")');
        $('.stream-song-artwork').show();
      }
      else {
        $('.stream-song-artwork').hide();
      }
      $('.stream-song-trackname').text(trackName);
      $('.stream-song-artist').text(songArtist);
      $('.stream-song-collection').text(songCollection);
      $('.stream-song-container').show();
    }
  }
})(jQuery);
;
/**
 * @file
 * Handles logic related to querying and processing Composer 2 programming metadata.
 */

(function ($) {
  Drupal.behaviors.tritonPlayerComposer2 = {
    /**
     * Sends a request to Composer 2 to retrieve information about the
     * currently playing program.
     *
     * @param {array} allUcss An array containing all the stream UCSs.
     * @param {string} currentUcs The UCS of the currently selected stream.
     */
    fetchNowPlaying: function (allUcss, currentUcs) {
      var that = this;
      $.each(allUcss, function (index, ucs) {
        $.ajax({
          url: 'https://api.composer.nprstations.org/v1/widget/' + ucs + '/now?format=json',
          cache: false,
          dataType: "json",
          success: function (data) {
            if (data.status !== true || !data.hasOwnProperty('onNow') || data.onNow == null) {
              that.fetchNowPlayingError(ucs, (ucs === currentUcs));
            }
            else {
              that.fetchNowPlayingSuccess(ucs, (ucs === currentUcs), data);
            }
          },
          error: function () {
            that.fetchNowPlayingError(ucs, (ucs === currentUcs));
          }
        });
      });
    },

    /**
     * The callback for if the C2 request is successful.
     *
     * Processes the returned data, and calls the render functions to display the program/song metadata.
     *
     * @param {string} ucs The UCS of the stream that we made an API call for.
     * @param {boolean} isCurrent True if the UCS is for the currently selected stream.
     * @param {object} data The response data from the API call.
     */
    fetchNowPlayingSuccess: function (ucs, isCurrent, data) {
      // Render Program Name under the stream link
      Drupal.behaviors.tritonPlayer.renderStreamProgramName(ucs, data.onNow.program.name || '');

      if (isCurrent) {
        // Render Detailed Program Metadata
        var programName = data.onNow.program.name || '';
        var next = data.nextUp && data.nextUp[0] || {};
        var nextProgramInfo = 'Next at ' + this.twentyFourToTwelve(next.start_time) + ': ' + next.program.name;
        Drupal.behaviors.tritonPlayer.renderCurrentStreamProgramMetadata(programName, nextProgramInfo);

        // Render Detailed Song Metadata
        var song = data.onNow.song || {};
        var songTrackname = song.trackName || '';
        var songArtworkUrl = song.artworkUrl100 || '';
        var songArtist = (song.composerName || song.artistName) || '';
        var songCollection = song.collectionName || '';
        Drupal.behaviors.tritonPlayer.renderCurrentStreamSongMetadata(songArtworkUrl, songTrackname, songArtist, songCollection);
      }
    },

    /**
     * The callback for if the C2 request fails.
     *
     * @param {string} ucs The UCS of the stream that we made an API call for.
     * @param {boolean} isCurrent True if the UCS is for the currently selected stream.
     */
    fetchNowPlayingError: function (ucs, isCurrent) {
      Drupal.behaviors.tritonPlayer.renderStreamProgramName(ucs, '');
      if (isCurrent) {
        Drupal.behaviors.tritonPlayer.renderCurrentStreamProgramMetadata('', '');
        Drupal.behaviors.tritonPlayer.renderCurrentStreamSongMetadata('', '', '', '');
      }
    },

    /**
     * Converts 24 hour format times into 12 hour format times.
     *
     * @param {string} twentyFour A time in the form "14:00".
     * @returns {string} A time in the form "2:00pm".
     */
    twentyFourToTwelve: function (twentyFour) {
      var twentyFourArr = twentyFour.split(':');
      var h = parseInt(twentyFourArr[0], 10);
      var m = twentyFourArr[1];
      var suff = h < 12 ? 'am' : 'pm';
      h = h > 12 ? h % 12 : h;
      if (h == 0) {
        h = 12;
      }
      return h + ':' + m + suff;
    }
  }
})(jQuery);;
/* NProgress, (c) 2013, 2014 Rico Sta. Cruz - http://ricostacruz.com/nprogress
 * @license MIT */

;(function(root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.NProgress = factory();
  }

})(this, function() {
  var NProgress = {};

  NProgress.version = '0.2.0';

  var Settings = NProgress.settings = {
    minimum: 0.08,
    easing: 'ease',
    positionUsing: '',
    speed: 200,
    trickle: true,
    trickleRate: 0.02,
    trickleSpeed: 800,
    showSpinner: true,
    barSelector: '[role="bar"]',
    spinnerSelector: '[role="spinner"]',
    parent: 'body',
    template: '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
  };

  /**
   * Updates configuration.
   *
   *     NProgress.configure({
   *       minimum: 0.1
   *     });
   */
  NProgress.configure = function(options) {
    var key, value;
    for (key in options) {
      value = options[key];
      if (value !== undefined && options.hasOwnProperty(key)) Settings[key] = value;
    }

    return this;
  };

  /**
   * Last number.
   */

  NProgress.status = null;

  /**
   * Sets the progress bar status, where `n` is a number from `0.0` to `1.0`.
   *
   *     NProgress.set(0.4);
   *     NProgress.set(1.0);
   */

  NProgress.set = function(n) {
    var started = NProgress.isStarted();

    n = clamp(n, Settings.minimum, 1);
    NProgress.status = (n === 1 ? null : n);

    var progress = NProgress.render(!started),
        bar      = progress.querySelector(Settings.barSelector),
        speed    = Settings.speed,
        ease     = Settings.easing;

    progress.offsetWidth; /* Repaint */

    queue(function(next) {
      // Set positionUsing if it hasn't already been set
      if (Settings.positionUsing === '') Settings.positionUsing = NProgress.getPositioningCSS();

      // Add transition
      css(bar, barPositionCSS(n, speed, ease));

      if (n === 1) {
        // Fade out
        css(progress, { 
          transition: 'none', 
          opacity: 1 
        });
        progress.offsetWidth; /* Repaint */

        setTimeout(function() {
          css(progress, { 
            transition: 'all ' + speed + 'ms linear', 
            opacity: 0 
          });
          setTimeout(function() {
            NProgress.remove();
            next();
          }, speed);
        }, speed);
      } else {
        setTimeout(next, speed);
      }
    });

    return this;
  };

  NProgress.isStarted = function() {
    return typeof NProgress.status === 'number';
  };

  /**
   * Shows the progress bar.
   * This is the same as setting the status to 0%, except that it doesn't go backwards.
   *
   *     NProgress.start();
   *
   */
  NProgress.start = function() {
    if (!NProgress.status) NProgress.set(0);

    var work = function() {
      setTimeout(function() {
        if (!NProgress.status) return;
        NProgress.trickle();
        work();
      }, Settings.trickleSpeed);
    };

    if (Settings.trickle) work();

    return this;
  };

  /**
   * Hides the progress bar.
   * This is the *sort of* the same as setting the status to 100%, with the
   * difference being `done()` makes some placebo effect of some realistic motion.
   *
   *     NProgress.done();
   *
   * If `true` is passed, it will show the progress bar even if its hidden.
   *
   *     NProgress.done(true);
   */

  NProgress.done = function(force) {
    if (!force && !NProgress.status) return this;

    return NProgress.inc(0.3 + 0.5 * Math.random()).set(1);
  };

  /**
   * Increments by a random amount.
   */

  NProgress.inc = function(amount) {
    var n = NProgress.status;

    if (!n) {
      return NProgress.start();
    } else {
      if (typeof amount !== 'number') {
        amount = (1 - n) * clamp(Math.random() * n, 0.1, 0.95);
      }

      n = clamp(n + amount, 0, 0.994);
      return NProgress.set(n);
    }
  };

  NProgress.trickle = function() {
    return NProgress.inc(Math.random() * Settings.trickleRate);
  };

  /**
   * Waits for all supplied jQuery promises and
   * increases the progress as the promises resolve.
   *
   * @param $promise jQUery Promise
   */
  (function() {
    var initial = 0, current = 0;

    NProgress.promise = function($promise) {
      if (!$promise || $promise.state() === "resolved") {
        return this;
      }

      if (current === 0) {
        NProgress.start();
      }

      initial++;
      current++;

      $promise.always(function() {
        current--;
        if (current === 0) {
            initial = 0;
            NProgress.done();
        } else {
            NProgress.set((initial - current) / initial);
        }
      });

      return this;
    };

  })();

  /**
   * (Internal) renders the progress bar markup based on the `template`
   * setting.
   */

  NProgress.render = function(fromStart) {
    if (NProgress.isRendered()) return document.getElementById('nprogress');

    addClass(document.documentElement, 'nprogress-busy');
    
    var progress = document.createElement('div');
    progress.id = 'nprogress';
    progress.innerHTML = Settings.template;

    var bar      = progress.querySelector(Settings.barSelector),
        perc     = fromStart ? '-100' : toBarPerc(NProgress.status || 0),
        parent   = document.querySelector(Settings.parent),
        spinner;
    
    css(bar, {
      transition: 'all 0 linear',
      transform: 'translate3d(' + perc + '%,0,0)'
    });

    if (!Settings.showSpinner) {
      spinner = progress.querySelector(Settings.spinnerSelector);
      spinner && removeElement(spinner);
    }

    if (parent != document.body) {
      addClass(parent, 'nprogress-custom-parent');
    }

    parent.appendChild(progress);
    return progress;
  };

  /**
   * Removes the element. Opposite of render().
   */

  NProgress.remove = function() {
    removeClass(document.documentElement, 'nprogress-busy');
    removeClass(document.querySelector(Settings.parent), 'nprogress-custom-parent');
    var progress = document.getElementById('nprogress');
    progress && removeElement(progress);
  };

  /**
   * Checks if the progress bar is rendered.
   */

  NProgress.isRendered = function() {
    return !!document.getElementById('nprogress');
  };

  /**
   * Determine which positioning CSS rule to use.
   */

  NProgress.getPositioningCSS = function() {
    // Sniff on document.body.style
    var bodyStyle = document.body.style;

    // Sniff prefixes
    var vendorPrefix = ('WebkitTransform' in bodyStyle) ? 'Webkit' :
                       ('MozTransform' in bodyStyle) ? 'Moz' :
                       ('msTransform' in bodyStyle) ? 'ms' :
                       ('OTransform' in bodyStyle) ? 'O' : '';

    if (vendorPrefix + 'Perspective' in bodyStyle) {
      // Modern browsers with 3D support, e.g. Webkit, IE10
      return 'translate3d';
    } else if (vendorPrefix + 'Transform' in bodyStyle) {
      // Browsers without 3D support, e.g. IE9
      return 'translate';
    } else {
      // Browsers without translate() support, e.g. IE7-8
      return 'margin';
    }
  };

  /**
   * Helpers
   */

  function clamp(n, min, max) {
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  /**
   * (Internal) converts a percentage (`0..1`) to a bar translateX
   * percentage (`-100%..0%`).
   */

  function toBarPerc(n) {
    return (-1 + n) * 100;
  }


  /**
   * (Internal) returns the correct CSS for changing the bar's
   * position given an n percentage, and speed and ease from Settings
   */

  function barPositionCSS(n, speed, ease) {
    var barCSS;

    if (Settings.positionUsing === 'translate3d') {
      barCSS = { transform: 'translate3d('+toBarPerc(n)+'%,0,0)' };
    } else if (Settings.positionUsing === 'translate') {
      barCSS = { transform: 'translate('+toBarPerc(n)+'%,0)' };
    } else {
      barCSS = { 'margin-left': toBarPerc(n)+'%' };
    }

    barCSS.transition = 'all '+speed+'ms '+ease;

    return barCSS;
  }

  /**
   * (Internal) Queues a function to be executed.
   */

  var queue = (function() {
    var pending = [];
    
    function next() {
      var fn = pending.shift();
      if (fn) {
        fn(next);
      }
    }

    return function(fn) {
      pending.push(fn);
      if (pending.length == 1) next();
    };
  })();

  /**
   * (Internal) Applies css properties to an element, similar to the jQuery 
   * css method.
   *
   * While this helper does assist with vendor prefixed property names, it 
   * does not perform any manipulation of values prior to setting styles.
   */

  var css = (function() {
    var cssPrefixes = [ 'Webkit', 'O', 'Moz', 'ms' ],
        cssProps    = {};

    function camelCase(string) {
      return string.replace(/^-ms-/, 'ms-').replace(/-([\da-z])/gi, function(match, letter) {
        return letter.toUpperCase();
      });
    }

    function getVendorProp(name) {
      var style = document.body.style;
      if (name in style) return name;

      var i = cssPrefixes.length,
          capName = name.charAt(0).toUpperCase() + name.slice(1),
          vendorName;
      while (i--) {
        vendorName = cssPrefixes[i] + capName;
        if (vendorName in style) return vendorName;
      }

      return name;
    }

    function getStyleProp(name) {
      name = camelCase(name);
      return cssProps[name] || (cssProps[name] = getVendorProp(name));
    }

    function applyCss(element, prop, value) {
      prop = getStyleProp(prop);
      element.style[prop] = value;
    }

    return function(element, properties) {
      var args = arguments,
          prop, 
          value;

      if (args.length == 2) {
        for (prop in properties) {
          value = properties[prop];
          if (value !== undefined && properties.hasOwnProperty(prop)) applyCss(element, prop, value);
        }
      } else {
        applyCss(element, args[1], args[2]);
      }
    }
  })();

  /**
   * (Internal) Determines if an element or space separated list of class names contains a class name.
   */

  function hasClass(element, name) {
    var list = typeof element == 'string' ? element : classList(element);
    return list.indexOf(' ' + name + ' ') >= 0;
  }

  /**
   * (Internal) Adds a class to an element.
   */

  function addClass(element, name) {
    var oldList = classList(element),
        newList = oldList + name;

    if (hasClass(oldList, name)) return; 

    // Trim the opening space.
    element.className = newList.substring(1);
  }

  /**
   * (Internal) Removes a class from an element.
   */

  function removeClass(element, name) {
    var oldList = classList(element),
        newList;

    if (!hasClass(element, name)) return;

    // Replace the class name.
    newList = oldList.replace(' ' + name + ' ', ' ');

    // Trim the opening and closing spaces.
    element.className = newList.substring(1, newList.length - 1);
  }

  /**
   * (Internal) Gets a space separated list of the class names on the element. 
   * The list is wrapped with a single space on each end to facilitate finding 
   * matches within the list.
   */

  function classList(element) {
    return (' ' + (element.className || '') + ' ').replace(/\s+/gi, ' ');
  }

  /**
   * (Internal) Removes an element from the DOM.
   */

  function removeElement(element) {
    element && element.parentNode && element.parentNode.removeChild(element);
  }

  return NProgress;
});

;
var linkIsInternal, ajaxLink, ajaxBefore, updateMetaData, updateTitle, updateCss, updatePager, ajaxAfter;

(function ($) {
  window.onInitialPage = true;
  var ajaxLoading = false;

  Drupal.behaviors.ajaxLinksApi = {
    attach: function (context) {
      var trigger = Drupal.settings.pi_ajax_links_api.trigger;
      var negativeTrigger = Drupal.settings.pi_ajax_links_api.negative_triggers;

      // Match the elements from the positive selector
      var $elements = $(trigger);

      // Remove elements if the negative trigger is specified
      if (negativeTrigger) {
        $elements = $elements.not(negativeTrigger);
      }

      // Add the click handler
      $elements.click(function(e) {
        var selector;
        var url = $(this).attr("href");
        var id = $(this).attr("rel");

        if (linkIsInternal(url)) {
          e.preventDefault();
          if(!ajaxLoading) {
            ajaxLoading = true;
            selector = Drupal.settings.pi_ajax_links_api.selector;
            ajaxBefore(selector);
            ajaxLink(selector, url, context, true);
          }
        }
      });

      // When click this will get the 'current url' (since onpopstat is called
      // AFTER the url change) and telling him not to add it to the state list.
      window.onpopstate = function (e) {
        var html5 = Drupal.settings.pi_ajax_links_api.html5;

        // window.history.state is to tell the system if it was a 'soft' link or
        // a 'hard link' ie if there was a page in between taht was not managed
        // by this script.
        if(html5 == 1 && window.history.state !== null) {
          var selector;

          if(!ajaxLoading) {
            ajaxLoading = true;
            selector = Drupal.settings.pi_ajax_links_api.selector;
            ajaxBefore(selector);
            ajaxLink(selector, document.URL, context, false);
          }
        }
      };
    }
  };

  /**
   * Determine if link is internal.
   *
   * @param url
   *   URL of the content to retrieve.
   *
   * @return boolean
   *   If the link is internal or not.
   */
  linkIsInternal = function(url) {
    var absoluteInternal = RegExp('^(https?:)?//(?=' + window.location.host + ')').test(url);
    var relative = !RegExp('^http').test(url);
    var internal = false;

    if (absoluteInternal || relative) {
      internal = true;
    }

    return internal;
  };

  /**
   * Get the link via ajax.
   *
   * @param selector
   *   The selector for what needs to be maintained.
   * @param url
   *   URL of the content to retrieve.
   * @param context
   *   The #document
   * @param dochangestate
   *   Flag for when user wishes to go 'back' a page.
   */
  ajaxLink = function(selector, url, context, dochangestate) {
    var scriptsIncluded = Drupal.settings.pi_ajax_links_api.scripts_included;

    // If $scripts not included, attach existing scripts
    if (scriptsIncluded == 0) {
      var selectorNew = context;
    }
    else {
      selectorNew = selector;
    }

    $.ajax({
      url: url,
      type: "GET",
      data: "ajax=1",

      beforeSend: function () {
        NProgress.configure({ showSpinner: false });
        NProgress.start();
      },

      complete: function () {
        NProgress.done();
      },

      success: function (data) {
        ajaxAfter(selector, url, data, window, document, scriptsIncluded, dochangestate);
        Drupal.attachBehaviors(selectorNew);
      },
      error: function (xhr) {
        var data = xhr.response.replace("?ajax=1", "");
        ajaxAfter(selector, url, data, window, document, scriptsIncluded, dochangestate);
      }
    });
  };

  /**
   * Preserve the height of the current content to avoid the entire page collapsing.
   *
   * @param selector
   *   The selector for what needs to be maintained.
   */
  ajaxBefore = function ajaxBefore(selector) {
    $(selector).css('height', $(selector).height() + 'px');

    if ($('.nav-wrapper.mobile .top-bar').hasClass('expanded')) {
      $('.nav-wrapper.mobile .toggle-topbar').click();
    }
  };

  /**
   * Replaces current page meta data & links with new ones received via AJAX.
   */
  updateMetaData = function(){
    // Get the new meta data received via AJAX.
    var newMetaData = $('#ajax-meta').remove();

    if (newMetaData.length) {
      // Remove all existing links and meta tags from the head.
      $('head > meta').remove();
      // Add the new meta data and links
      $('head').prepend(newMetaData.html());
    }
  };

  /**
   * Replaces the current page title to be the new one received via AJAX.
   *
   * @param url
   *   URL of the current page.
   * @param window
   *   Window in which the current HTML page is displayed.
   * @param dochangestate
   *   Flag for when user wishes to go 'back' a page.
   */
  updateTitle = function(url, window, dochangestate){
    var newTitle = $('#ajax-title').remove();
    var currentTitle = $('head > title');
    var previousTitle = currentTitle.text();

    // If new title exists, update the current title.
    if (newTitle.length) {
      currentTitle.text(newTitle.text());
    }

    // Change Url if option is selected and for html5 compatible browsers.
    var html5 = Drupal.settings.pi_ajax_links_api.html5;

    if (html5 == 1 && window.history.replaceState) {
      if (dochangestate) {
        // Store current url.
        window.history.replaceState(
          {page : 0}, previousTitle, window.location.href
        );

        // Change url.
        window.history.pushState(
          {page : 1} , currentTitle.text(), url
        );
      }
    }
  };

  /**
   * Updates CSS for various elements that change in look/feel on new page load.
   *
   * @param url
   *   URL of the current page.
   * @param selector
   *   Selector for the AJAX HTML content.
   */
  updateCss = function(url, selector) {
    // Reset the height of the container.
    $(selector).css('height', '');

    $('.page-load').removeClass('loading');

    // Update active class.
    $('a.active').removeClass('active').parents('li').removeClass('active-trail');

    // To check if the url ends with the link.
    $('a').filter(function() {
      var include = false;

      if ($(this).attr('href')) {
        include = url.endsWith($(this).attr('href'));
      }

      return include;
    }).addClass('activePP').parents('li').addClass('active-trail');
  };

  /**
   * Updates views pager, removes ajax=1 from links.
   *
   * @see Please check http://drupal.org/node/1907376 for details.
   *
   * @param selector
   *   Selector for the AJAX HTML content.
   */
  updatePager = function(selector) {
    var viewsPager = Drupal.settings.pi_ajax_links_api.vpager;

    if(viewsPager == 1) {
      $(selector + " .view .pager a").each(function(){
        var href = $(this).attr('href');
        href = href.replace("?ajax=1", "");
        href = href.replace("&ajax=1", "");
        $(this).attr('href', href);
      });
    }
  };

  /**
   * Updates form action, removes ajax=1 from path.
   *
   * @see Please check http://drupal.org/node/1760414 for details.
   *
   * @param selector
   *   Selector for the AJAX HTML content.
   */
  updateForm = function(selector) {
    var formAction = $(selector + " form").attr('action');

    if (formAction) {
      formAction = formAction.replace("?ajax=1", "");
      $("form").attr('action', formAction);
    }
  };

  /**
   * The main method to do the ajax replacements.
   *
   * @param selector
   *   The area in the body that will be replaced.
   * @param url
   *   The fetched url
   * @param data
   *   The requested data.
   * @param window
   *   The window object
   * @param document
   *   The DOM
   * @param scriptsIncluded
   *   Boolean if scripts are included.
   * @param docchagestate
   *   Flag to know if the document has changed.
   */
  ajaxAfter = function(selector, url, data, window, document, scriptsIncluded, dochangestate) {
    // Uncomment this if you are using html--ajax.tpl.php without $scripts.
    // For more details , check https://drupal.org/node/1923320
    if(scriptsIncluded == 0) {
      ajaxLoading = false;
    }

    // Replace the contents of the container with the data.
    $(selector).html(data);

    updateCss(url, selector);
    updateTitle(url, window, dochangestate);
    updateMetaData();
    updatePager(selector);
    updateForm(selector);

    window.onInitialPage = false;

    $(document).trigger('pi_ajax_links_api_page_loaded', [selector, url, data]);
  };

  /**
   * Makes sure that endsWith is part of the String object.
   *
   * Tends to be the case with Safari.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
   */
  if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (position === undefined || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
    };
  }
})(jQuery);
;
/**
 * @file
 *   Allow image gallery popup functionality for this field.
 */
;(function ($, Drupal, undefined) {
  Drupal.behaviors.npr_gallery = {
    attach: function (context, settings) {
      $('.gallery li:not(:first-child)').hide();
      
      $('.gallery').each(function() {
        var that = this;

        $(this).magnificPopup({
          delegate: 'a',
          type: 'image',
          gallery: {
            enabled: true,
            navigateByImgClick: true,
            preload: [0,1]
          },
          mainClass: 'mfp-img-mobile',
          image: {
            titleSrc: function(item) {
              var li = $('li', $(that)).eq(item.index);
              var captionAndCredit = $('figcaption', li).html();

              return captionAndCredit;
            },
            tError: '<a href="%url%">The image #%curr%</a> could not be loaded.'
          }
        });
      });
    }
  };
})(jQuery, Drupal);
;
/**
 * @file
 *   Allow image gallery popup functionality for an embedded image.
 */
(function ($, Drupal, undefined) {
  Drupal.behaviors.pi_assets_image_popup = {
    attach: function (context, settings) {
      $('.wysiwyg-asset-image-wrapper').magnificPopup({
        delegate: 'a',
        type: 'image',
        gallery: {
          enabled: true,
          navigateByImgClick: true,
          preload: [0,1]
        },
        image: {
          titleSrc: function(item) {
            return item.el.parent().find('.image-meta').html();
          },
          tError: '<a href="%url%">The image #%curr%</a> could not be loaded.'
        }
      });
    }
  };
})(jQuery, Drupal);
;
/**
 * @file
 * Javascript for the river block pager.
 */

(function ($) {
  Drupal.behaviors.nprriver = {
    /**
     * Manipulate the default pager functionality and direct to a custom path.
     *
     * @param array context
     *   The drupal context.
     * @param array settings
     *   The drupal settings array.
     */
    attach: function (context, settings) {
      var selector = '#block-npr-river-npr-river-block-all ul.pager a';

      $.each($(selector), function(index, element) {
        var url = $(element).prop('href');
        var query = url.substr(url.indexOf("?") + 1);
        var newUrl = '/river?' + query;

        $(element).prop('href', newUrl);
      });
    },
  };
})(jQuery);
;
(function($, Drupal) {
  Drupal.behaviors.schedule_selector = {
    attach: function (context) {
      var changeStationDropdown = $('#change-station');

      changeStationDropdown.off('click');
      changeStationDropdown.click(function() {
        $('ul.tv-radio').fadeToggle();
      });
    }
  };
})(jQuery, Drupal);
;
function AddNamespace(namespacePath){var rootObject=window;var namespaceParts=namespacePath.split('.');for(var i=0;i<namespaceParts.length;i++){var currentPart=namespaceParts[i];if(!rootObject[currentPart]){rootObject[currentPart]=new Object();}
rootObject=rootObject[currentPart];}}
AddNamespace('NPR.ServerConstants');NPR.ServerConstants.webHost='www.npr.org';NPR.ServerConstants.phototoolImgTmpUploadDir='/assets/tmp';NPR.ServerConstants.crowdCookieTokenkey='crowd.token_key';NPR.ServerConstants.googleAnalyticsAccount='UA-5828686-4';AddNamespace('NPR.PageInfo');NPR.PageInfo.page={};NPR.PageInfo.page.web_host='http://'+NPR.ServerConstants.webHost;(function(){AddNamespace('NPR.Iframe');NPR.Iframe.load=function(storyId,location,twittersource){if(typeof(twittersource)==="undefined")
{twittersource='nprmusic';}
var id='iframe-4ee0adbddd0ca',props={src:NPR.PageInfo.page.web_host+'/templates/event/eventCard.php?&storyId='+storyId+'&station='+window.location+'&twittersource='+twittersource,width:'100%',style:'padding: 0; margin: 0; border: none; display: block; height: 0; overflow: hidden;',scrolling:'no',frameBorder:0,id:id},iframe=document.createElement('iframe'),i,script,messageHandler,setHeight=function(height){document.getElementById(id).style.height=height+'px';};for(i in props){try{if(i!=='style'){iframe[i]=props[i];}else{iframe[i].cssText=props[i];}}catch(ex){}}
try{script=document.getElementById(location);if(script){script.appendChild(iframe);if(window.postMessage){messageHandler=function(e){var matches=e.origin.match(/npr.org$/);if(matches.length=1){if(!isNaN(e.data)){try{setHeight(e.data);}catch(ex){}}}};if(window.addEventListener){window.addEventListener('message',messageHandler,false);}else if(window.attachEvent){window.attachEvent('onmessage',messageHandler);}}else{setInterval(function(){var hash=window.location.hash,matches=hash.match(/^#h(\d+)$/);if(matches){if(!isNAN(matches[1])){setHeight(matches[1]);}}},150);}}}catch(ey){}}})();;
/* Modernizr 2.8.3 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-shiv-cssclasses-load
 */
;window.Modernizr=function(a,b,c){function u(a){j.cssText=a}function v(a,b){return u(prefixes.join(a+";")+(b||""))}function w(a,b){return typeof a===b}function x(a,b){return!!~(""+a).indexOf(b)}function y(a,b,d){for(var e in a){var f=b[a[e]];if(f!==c)return d===!1?a[e]:w(f,"function")?f.bind(d||b):f}return!1}var d="2.8.3",e={},f=!0,g=b.documentElement,h="modernizr",i=b.createElement(h),j=i.style,k,l={}.toString,m={},n={},o={},p=[],q=p.slice,r,s={}.hasOwnProperty,t;!w(s,"undefined")&&!w(s.call,"undefined")?t=function(a,b){return s.call(a,b)}:t=function(a,b){return b in a&&w(a.constructor.prototype[b],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(b){var c=this;if(typeof c!="function")throw new TypeError;var d=q.call(arguments,1),e=function(){if(this instanceof e){var a=function(){};a.prototype=c.prototype;var f=new a,g=c.apply(f,d.concat(q.call(arguments)));return Object(g)===g?g:f}return c.apply(b,d.concat(q.call(arguments)))};return e});for(var z in m)t(m,z)&&(r=z.toLowerCase(),e[r]=m[z](),p.push((e[r]?"":"no-")+r));return e.addTest=function(a,b){if(typeof a=="object")for(var d in a)t(a,d)&&e.addTest(d,a[d]);else{a=a.toLowerCase();if(e[a]!==c)return e;b=typeof b=="function"?b():b,typeof f!="undefined"&&f&&(g.className+=" "+(b?"":"no-")+a),e[a]=b}return e},u(""),i=k=null,function(a,b){function l(a,b){var c=a.createElement("p"),d=a.getElementsByTagName("head")[0]||a.documentElement;return c.innerHTML="x<style>"+b+"</style>",d.insertBefore(c.lastChild,d.firstChild)}function m(){var a=s.elements;return typeof a=="string"?a.split(" "):a}function n(a){var b=j[a[h]];return b||(b={},i++,a[h]=i,j[i]=b),b}function o(a,c,d){c||(c=b);if(k)return c.createElement(a);d||(d=n(c));var g;return d.cache[a]?g=d.cache[a].cloneNode():f.test(a)?g=(d.cache[a]=d.createElem(a)).cloneNode():g=d.createElem(a),g.canHaveChildren&&!e.test(a)&&!g.tagUrn?d.frag.appendChild(g):g}function p(a,c){a||(a=b);if(k)return a.createDocumentFragment();c=c||n(a);var d=c.frag.cloneNode(),e=0,f=m(),g=f.length;for(;e<g;e++)d.createElement(f[e]);return d}function q(a,b){b.cache||(b.cache={},b.createElem=a.createElement,b.createFrag=a.createDocumentFragment,b.frag=b.createFrag()),a.createElement=function(c){return s.shivMethods?o(c,a,b):b.createElem(c)},a.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+m().join().replace(/[\w\-]+/g,function(a){return b.createElem(a),b.frag.createElement(a),'c("'+a+'")'})+");return n}")(s,b.frag)}function r(a){a||(a=b);var c=n(a);return s.shivCSS&&!g&&!c.hasCSS&&(c.hasCSS=!!l(a,"article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}mark{background:#FF0;color:#000}template{display:none}")),k||q(a,c),a}var c="3.7.0",d=a.html5||{},e=/^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,f=/^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,g,h="_html5shiv",i=0,j={},k;(function(){try{var a=b.createElement("a");a.innerHTML="<xyz></xyz>",g="hidden"in a,k=a.childNodes.length==1||function(){b.createElement("a");var a=b.createDocumentFragment();return typeof a.cloneNode=="undefined"||typeof a.createDocumentFragment=="undefined"||typeof a.createElement=="undefined"}()}catch(c){g=!0,k=!0}})();var s={elements:d.elements||"abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output progress section summary template time video",version:c,shivCSS:d.shivCSS!==!1,supportsUnknownElements:k,shivMethods:d.shivMethods!==!1,type:"default",shivDocument:r,createElement:o,createDocumentFragment:p};a.html5=s,r(b)}(this,b),e._version=d,g.className=g.className.replace(/(^|\s)no-js(\s|$)/,"$1$2")+(f?" js "+p.join(" "):""),e}(this,this.document),function(a,b,c){function d(a){return"[object Function]"==o.call(a)}function e(a){return"string"==typeof a}function f(){}function g(a){return!a||"loaded"==a||"complete"==a||"uninitialized"==a}function h(){var a=p.shift();q=1,a?a.t?m(function(){("c"==a.t?B.injectCss:B.injectJs)(a.s,0,a.a,a.x,a.e,1)},0):(a(),h()):q=0}function i(a,c,d,e,f,i,j){function k(b){if(!o&&g(l.readyState)&&(u.r=o=1,!q&&h(),l.onload=l.onreadystatechange=null,b)){"img"!=a&&m(function(){t.removeChild(l)},50);for(var d in y[c])y[c].hasOwnProperty(d)&&y[c][d].onload()}}var j=j||B.errorTimeout,l=b.createElement(a),o=0,r=0,u={t:d,s:c,e:f,a:i,x:j};1===y[c]&&(r=1,y[c]=[]),"object"==a?l.data=c:(l.src=c,l.type=a),l.width=l.height="0",l.onerror=l.onload=l.onreadystatechange=function(){k.call(this,r)},p.splice(e,0,u),"img"!=a&&(r||2===y[c]?(t.insertBefore(l,s?null:n),m(k,j)):y[c].push(l))}function j(a,b,c,d,f){return q=0,b=b||"j",e(a)?i("c"==b?v:u,a,b,this.i++,c,d,f):(p.splice(this.i++,0,a),1==p.length&&h()),this}function k(){var a=B;return a.loader={load:j,i:0},a}var l=b.documentElement,m=a.setTimeout,n=b.getElementsByTagName("script")[0],o={}.toString,p=[],q=0,r="MozAppearance"in l.style,s=r&&!!b.createRange().compareNode,t=s?l:n.parentNode,l=a.opera&&"[object Opera]"==o.call(a.opera),l=!!b.attachEvent&&!l,u=r?"object":l?"script":"img",v=l?"script":u,w=Array.isArray||function(a){return"[object Array]"==o.call(a)},x=[],y={},z={timeout:function(a,b){return b.length&&(a.timeout=b[0]),a}},A,B;B=function(a){function b(a){var a=a.split("!"),b=x.length,c=a.pop(),d=a.length,c={url:c,origUrl:c,prefixes:a},e,f,g;for(f=0;f<d;f++)g=a[f].split("="),(e=z[g.shift()])&&(c=e(c,g));for(f=0;f<b;f++)c=x[f](c);return c}function g(a,e,f,g,h){var i=b(a),j=i.autoCallback;i.url.split(".").pop().split("?").shift(),i.bypass||(e&&(e=d(e)?e:e[a]||e[g]||e[a.split("/").pop().split("?")[0]]),i.instead?i.instead(a,e,f,g,h):(y[i.url]?i.noexec=!0:y[i.url]=1,f.load(i.url,i.forceCSS||!i.forceJS&&"css"==i.url.split(".").pop().split("?").shift()?"c":c,i.noexec,i.attrs,i.timeout),(d(e)||d(j))&&f.load(function(){k(),e&&e(i.origUrl,h,g),j&&j(i.origUrl,h,g),y[i.url]=2})))}function h(a,b){function c(a,c){if(a){if(e(a))c||(j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}),g(a,j,b,0,h);else if(Object(a)===a)for(n in m=function(){var b=0,c;for(c in a)a.hasOwnProperty(c)&&b++;return b}(),a)a.hasOwnProperty(n)&&(!c&&!--m&&(d(j)?j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}:j[n]=function(a){return function(){var b=[].slice.call(arguments);a&&a.apply(this,b),l()}}(k[n])),g(a[n],j,b,n,h))}else!c&&l()}var h=!!a.test,i=a.load||a.both,j=a.callback||f,k=j,l=a.complete||f,m,n;c(h?a.yep:a.nope,!!i),i&&c(i)}var i,j,l=this.yepnope.loader;if(e(a))g(a,0,l,0);else if(w(a))for(i=0;i<a.length;i++)j=a[i],e(j)?g(j,0,l,0):w(j)?B(j):Object(j)===j&&h(j,l);else Object(a)===a&&h(a,l)},B.addPrefix=function(a,b){z[a]=b},B.addFilter=function(a){x.push(a)},B.errorTimeout=1e4,null==b.readyState&&b.addEventListener&&(b.readyState="loading",b.addEventListener("DOMContentLoaded",A=function(){b.removeEventListener("DOMContentLoaded",A,0),b.readyState="complete"},0)),a.yepnope=k(),a.yepnope.executeStack=h,a.yepnope.injectJs=function(a,c,d,e,i,j){var k=b.createElement("script"),l,o,e=e||B.errorTimeout;k.src=a;for(o in d)k.setAttribute(o,d[o]);c=j?h:c||f,k.onreadystatechange=k.onload=function(){!l&&g(k.readyState)&&(l=1,c(),k.onload=k.onreadystatechange=null)},m(function(){l||(l=1,c(1))},e),i?k.onload():n.parentNode.insertBefore(k,n)},a.yepnope.injectCss=function(a,c,d,e,g,i){var e=b.createElement("link"),j,c=i?h:c||f;e.href=a,e.rel="stylesheet",e.type="text/css";for(j in d)e.setAttribute(j,d[j]);g||(n.parentNode.insertBefore(e,n),m(c,0))}}(this,document),Modernizr.load=function(){yepnope.apply(window,[].slice.call(arguments,0))};
;
/* MediaMatch v.2.0.2 - Testing css media queries in Javascript. Authors & copyright (c) 2013: WebLinc, David Knight. */

window.matchMedia||(window.matchMedia=function(c){var a=c.document,w=a.documentElement,l=[],t=0,x="",h={},G=/\s*(only|not)?\s*(screen|print|[a-z\-]+)\s*(and)?\s*/i,H=/^\s*\(\s*(-[a-z]+-)?(min-|max-)?([a-z\-]+)\s*(:?\s*([0-9]+(\.[0-9]+)?|portrait|landscape)(px|em|dppx|dpcm|rem|%|in|cm|mm|ex|pt|pc|\/([0-9]+(\.[0-9]+)?))?)?\s*\)\s*$/,y=0,A=function(b){var z=-1!==b.indexOf(",")&&b.split(",")||[b],e=z.length-1,j=e,g=null,d=null,c="",a=0,l=!1,m="",f="",g=null,d=0,f=null,k="",p="",q="",n="",r="",k=!1;if(""===
b)return!0;do{g=z[j-e];l=!1;if(d=g.match(G))c=d[0],a=d.index;if(!d||-1===g.substring(0,a).indexOf("(")&&(a||!d[3]&&c!==d.input))k=!1;else{f=g;l="not"===d[1];a||(m=d[2],f=g.substring(c.length));k=m===x||"all"===m||""===m;g=-1!==f.indexOf(" and ")&&f.split(" and ")||[f];d=g.length-1;if(k&&0<=d&&""!==f){do{f=g[d].match(H);if(!f||!h[f[3]]){k=!1;break}k=f[2];n=p=f[5];q=f[7];r=h[f[3]];q&&(n="px"===q?Number(p):"em"===q||"rem"===q?16*p:f[8]?(p/f[8]).toFixed(2):"dppx"===q?96*p:"dpcm"===q?0.3937*p:Number(p));
k="min-"===k&&n?r>=n:"max-"===k&&n?r<=n:n?r===n:!!r;if(!k)break}while(d--)}if(k)break}}while(e--);return l?!k:k},B=function(){var b=c.innerWidth||w.clientWidth,a=c.innerHeight||w.clientHeight,e=c.screen.width,j=c.screen.height,g=c.screen.colorDepth,d=c.devicePixelRatio;h.width=b;h.height=a;h["aspect-ratio"]=(b/a).toFixed(2);h["device-width"]=e;h["device-height"]=j;h["device-aspect-ratio"]=(e/j).toFixed(2);h.color=g;h["color-index"]=Math.pow(2,g);h.orientation=a>=b?"portrait":"landscape";h.resolution=
d&&96*d||c.screen.deviceXDPI||96;h["device-pixel-ratio"]=d||1},C=function(){clearTimeout(y);y=setTimeout(function(){var b=null,a=t-1,e=a,j=!1;if(0<=a){B();do if(b=l[e-a])if((j=A(b.mql.media))&&!b.mql.matches||!j&&b.mql.matches)if(b.mql.matches=j,b.listeners)for(var j=0,g=b.listeners.length;j<g;j++)b.listeners[j]&&b.listeners[j].call(c,b.mql);while(a--)}},10)},D=a.getElementsByTagName("head")[0],a=a.createElement("style"),E=null,u="screen print speech projection handheld tv braille embossed tty".split(" "),
m=0,I=u.length,s="#mediamatchjs { position: relative; z-index: 0; }",v="",F=c.addEventListener||(v="on")&&c.attachEvent;a.type="text/css";a.id="mediamatchjs";D.appendChild(a);for(E=c.getComputedStyle&&c.getComputedStyle(a)||a.currentStyle;m<I;m++)s+="@media "+u[m]+" { #mediamatchjs { position: relative; z-index: "+m+" } }";a.styleSheet?a.styleSheet.cssText=s:a.textContent=s;x=u[1*E.zIndex||0];D.removeChild(a);B();F(v+"resize",C);F(v+"orientationchange",C);return function(a){var c=t,e={matches:!1,
media:a,addListener:function(a){l[c].listeners||(l[c].listeners=[]);a&&l[c].listeners.push(a)},removeListener:function(a){var b=l[c],d=0,e=0;if(b)for(e=b.listeners.length;d<e;d++)b.listeners[d]===a&&b.listeners.splice(d,1)}};if(""===a)return e.matches=!0,e;e.matches=A(a);t=l.push({mql:e,listeners:null});return e}}(window));
;
/*! matchMedia() polyfill addListener/removeListener extension. Author & copyright (c) 2012: Scott Jehl. Dual MIT/BSD license */
(function(){
  // monkeypatch unsupported addListener/removeListener with polling
  if( !window.matchMedia( "all" ).addListener ){
    var oldMM = window.matchMedia;

    window.matchMedia = function( q ){
      var ret = oldMM( q ),
      listeners = [],
      last = ret.matches,
      timer,
      check = function(){
        var list = oldMM( q ),
        unmatchToMatch = list.matches && !last,
        matchToUnmatch = !list.matches && last;

        //fire callbacks only if transitioning to or from matched state
        if( unmatchToMatch || matchToUnmatch ){
          for( var i =0, il = listeners.length; i< il; i++ ){
            listeners[ i ].call( ret, list );
          }
        }
        last = list.matches;
      };

      ret.addListener = function( cb ){
        listeners.push( cb );
        if( !timer ){
          timer = setInterval( check, 1000 );
        }
      };

      ret.removeListener = function( cb ){
        for( var i =0, il = listeners.length; i< il; i++ ){
          if( listeners[ i ] === cb ){
            listeners.splice( i, 1 );
          }
        }
        if( !listeners.length && timer ){
          clearInterval( timer );
        }
      };

      return ret;
    };
  }
}());
;
/*!
 * enquire.js v2.1.0 - Awesome Media Queries in JavaScript
 * Copyright (c) 2014 Nick Williams - http://wicky.nillia.ms/enquire.js
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 */

!function(a,b,c){var d=window.matchMedia;"undefined"!=typeof module&&module.exports?module.exports=c(d):"function"==typeof define&&define.amd?define("matchmedia",function(){return b[a]=c(d)}):b[a]=c(d)}("enquire",this,function(a){"use strict";function b(a,b){var c,d=0,e=a.length;for(d;e>d&&(c=b(a[d],d),c!==!1);d++);}function c(a){return"[object Array]"===Object.prototype.toString.apply(a)}function d(a){return"function"==typeof a}function e(a){this.options=a,!a.deferSetup&&this.setup()}function f(b,c){this.query=b,this.isUnconditional=c,this.handlers=[],this.mql=a(b);var d=this;this.listener=function(a){d.mql=a,d.assess()},this.mql.addListener(this.listener)}function g(){if(!a)throw new Error("matchMedia not present, legacy browsers require a polyfill");this.queries={},this.browserIsIncapable=!a("only all").matches}return e.prototype={setup:function(){this.options.setup&&this.options.setup(),this.initialised=!0},on:function(){!this.initialised&&this.setup(),this.options.match&&this.options.match()},off:function(){this.options.unmatch&&this.options.unmatch()},destroy:function(){this.options.destroy?this.options.destroy():this.off()},equals:function(a){return this.options===a||this.options.match===a}},f.prototype={addHandler:function(a){var b=new e(a);this.handlers.push(b),this.matches()&&b.on()},removeHandler:function(a){var c=this.handlers;b(c,function(b,d){return b.equals(a)?(b.destroy(),!c.splice(d,1)):void 0})},matches:function(){return this.mql.matches||this.isUnconditional},clear:function(){b(this.handlers,function(a){a.destroy()}),this.mql.removeListener(this.listener),this.handlers.length=0},assess:function(){var a=this.matches()?"on":"off";b(this.handlers,function(b){b[a]()})}},g.prototype={register:function(a,e,g){var h=this.queries,i=g&&this.browserIsIncapable;return h[a]||(h[a]=new f(a,i)),d(e)&&(e={match:e}),c(e)||(e=[e]),b(e,function(b){h[a].addHandler(b)}),this},unregister:function(a,b){var c=this.queries[a];return c&&(b?c.removeHandler(b):(c.clear(),delete this.queries[a])),this}},new g});
;
/**
 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
 *
 * @version 0.6.11
 * @codingstandard ftlabs-jsv2
 * @copyright The Financial Times Limited [All Rights Reserved]
 * @license MIT License (see LICENSE.txt)
 */

/*jslint browser:true, node:true*/
/*global define, Event, Node*/


/**
 * Instantiate fast-clicking listeners on the specificed layer.
 *
 * @constructor
 * @param {Element} layer The layer to listen on
 */
function FastClick(layer) {
	'use strict';
	var oldOnClick, self = this;


	/**
	 * Whether a click is currently being tracked.
	 *
	 * @type boolean
	 */
	this.trackingClick = false;


	/**
	 * Timestamp for when when click tracking started.
	 *
	 * @type number
	 */
	this.trackingClickStart = 0;


	/**
	 * The element being tracked for a click.
	 *
	 * @type EventTarget
	 */
	this.targetElement = null;


	/**
	 * X-coordinate of touch start event.
	 *
	 * @type number
	 */
	this.touchStartX = 0;


	/**
	 * Y-coordinate of touch start event.
	 *
	 * @type number
	 */
	this.touchStartY = 0;


	/**
	 * ID of the last touch, retrieved from Touch.identifier.
	 *
	 * @type number
	 */
	this.lastTouchIdentifier = 0;


	/**
	 * Touchmove boundary, beyond which a click will be cancelled.
	 *
	 * @type number
	 */
	this.touchBoundary = 10;


	/**
	 * The FastClick layer.
	 *
	 * @type Element
	 */
	this.layer = layer;

	if (!layer || !layer.nodeType) {
		throw new TypeError('Layer must be a document node');
	}

	/** @type function() */
	this.onClick = function() { return FastClick.prototype.onClick.apply(self, arguments); };

	/** @type function() */
	this.onMouse = function() { return FastClick.prototype.onMouse.apply(self, arguments); };

	/** @type function() */
	this.onTouchStart = function() { return FastClick.prototype.onTouchStart.apply(self, arguments); };

	/** @type function() */
	this.onTouchMove = function() { return FastClick.prototype.onTouchMove.apply(self, arguments); };

	/** @type function() */
	this.onTouchEnd = function() { return FastClick.prototype.onTouchEnd.apply(self, arguments); };

	/** @type function() */
	this.onTouchCancel = function() { return FastClick.prototype.onTouchCancel.apply(self, arguments); };

	if (FastClick.notNeeded(layer)) {
		return;
	}

	// Set up event handlers as required
	if (this.deviceIsAndroid) {
		layer.addEventListener('mouseover', this.onMouse, true);
		layer.addEventListener('mousedown', this.onMouse, true);
		layer.addEventListener('mouseup', this.onMouse, true);
	}

	layer.addEventListener('click', this.onClick, true);
	layer.addEventListener('touchstart', this.onTouchStart, false);
	layer.addEventListener('touchmove', this.onTouchMove, false);
	layer.addEventListener('touchend', this.onTouchEnd, false);
	layer.addEventListener('touchcancel', this.onTouchCancel, false);

	// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
	// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
	// layer when they are cancelled.
	if (!Event.prototype.stopImmediatePropagation) {
		layer.removeEventListener = function(type, callback, capture) {
			var rmv = Node.prototype.removeEventListener;
			if (type === 'click') {
				rmv.call(layer, type, callback.hijacked || callback, capture);
			} else {
				rmv.call(layer, type, callback, capture);
			}
		};

		layer.addEventListener = function(type, callback, capture) {
			var adv = Node.prototype.addEventListener;
			if (type === 'click') {
				adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
					if (!event.propagationStopped) {
						callback(event);
					}
				}), capture);
			} else {
				adv.call(layer, type, callback, capture);
			}
		};
	}

	// If a handler is already declared in the element's onclick attribute, it will be fired before
	// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
	// adding it as listener.
	if (typeof layer.onclick === 'function') {

		// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
		// - the old one won't work if passed to addEventListener directly.
		oldOnClick = layer.onclick;
		layer.addEventListener('click', function(event) {
			oldOnClick(event);
		}, false);
		layer.onclick = null;
	}
}


/**
 * Android requires exceptions.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;


/**
 * iOS requires exceptions.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);


/**
 * iOS 4 requires an exception for select elements.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS4 = FastClick.prototype.deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


/**
 * iOS 6.0(+?) requires the target element to be manually derived
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOSWithBadTarget = FastClick.prototype.deviceIsIOS && (/OS ([6-9]|\d{2})_\d/).test(navigator.userAgent);


/**
 * Determine whether a given element requires a native click.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element needs a native click
 */
FastClick.prototype.needsClick = function(target) {
	'use strict';
	switch (target.nodeName.toLowerCase()) {

	// Don't send a synthetic click to disabled inputs (issue #62)
	case 'button':
	case 'select':
	case 'textarea':
		if (target.disabled) {
			return true;
		}

		break;
	case 'input':

		// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
		if ((this.deviceIsIOS && target.type === 'file') || target.disabled) {
			return true;
		}

		break;
	case 'label':
	case 'video':
		return true;
	}

	return (/\bneedsclick\b/).test(target.className);
};


/**
 * Determine whether a given element requires a call to focus to simulate click into element.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
 */
FastClick.prototype.needsFocus = function(target) {
	'use strict';
	switch (target.nodeName.toLowerCase()) {
	case 'textarea':
		return true;
	case 'select':
		return !this.deviceIsAndroid;
	case 'input':
		switch (target.type) {
		case 'button':
		case 'checkbox':
		case 'file':
		case 'image':
		case 'radio':
		case 'submit':
			return false;
		}

		// No point in attempting to focus disabled inputs
		return !target.disabled && !target.readOnly;
	default:
		return (/\bneedsfocus\b/).test(target.className);
	}
};


/**
 * Send a click event to the specified element.
 *
 * @param {EventTarget|Element} targetElement
 * @param {Event} event
 */
FastClick.prototype.sendClick = function(targetElement, event) {
	'use strict';
	var clickEvent, touch;

	// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
	if (document.activeElement && document.activeElement !== targetElement) {
		document.activeElement.blur();
	}

	touch = event.changedTouches[0];

	// Synthesise a click event, with an extra attribute so it can be tracked
	clickEvent = document.createEvent('MouseEvents');
	clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
	clickEvent.forwardedTouchEvent = true;
	targetElement.dispatchEvent(clickEvent);
};

FastClick.prototype.determineEventType = function(targetElement) {
	'use strict';

	//Issue #159: Android Chrome Select Box does not open with a synthetic click event
	if (this.deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
		return 'mousedown';
	}

	return 'click';
};


/**
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.focus = function(targetElement) {
	'use strict';
	var length;

	// Issue #160: on iOS 7, some input elements (e.g. date datetime) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
	if (this.deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time') {
		length = targetElement.value.length;
		targetElement.setSelectionRange(length, length);
	} else {
		targetElement.focus();
	}
};


/**
 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
 *
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.updateScrollParent = function(targetElement) {
	'use strict';
	var scrollParent, parentElement;

	scrollParent = targetElement.fastClickScrollParent;

	// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
	// target element was moved to another parent.
	if (!scrollParent || !scrollParent.contains(targetElement)) {
		parentElement = targetElement;
		do {
			if (parentElement.scrollHeight > parentElement.offsetHeight) {
				scrollParent = parentElement;
				targetElement.fastClickScrollParent = parentElement;
				break;
			}

			parentElement = parentElement.parentElement;
		} while (parentElement);
	}

	// Always update the scroll top tracker if possible.
	if (scrollParent) {
		scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
	}
};


/**
 * @param {EventTarget} targetElement
 * @returns {Element|EventTarget}
 */
FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {
	'use strict';

	// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
	if (eventTarget.nodeType === Node.TEXT_NODE) {
		return eventTarget.parentNode;
	}

	return eventTarget;
};


/**
 * On touch start, record the position and scroll offset.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchStart = function(event) {
	'use strict';
	var targetElement, touch, selection;

	// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
	if (event.targetTouches.length > 1) {
		return true;
	}

	targetElement = this.getTargetElementFromEventTarget(event.target);
	touch = event.targetTouches[0];

	if (this.deviceIsIOS) {

		// Only trusted events will deselect text on iOS (issue #49)
		selection = window.getSelection();
		if (selection.rangeCount && !selection.isCollapsed) {
			return true;
		}

		if (!this.deviceIsIOS4) {

			// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
			// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
			// with the same identifier as the touch event that previously triggered the click that triggered the alert.
			// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
			// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
			if (touch.identifier === this.lastTouchIdentifier) {
				event.preventDefault();
				return false;
			}

			this.lastTouchIdentifier = touch.identifier;

			// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
			// 1) the user does a fling scroll on the scrollable layer
			// 2) the user stops the fling scroll with another tap
			// then the event.target of the last 'touchend' event will be the element that was under the user's finger
			// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
			// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
			this.updateScrollParent(targetElement);
		}
	}

	this.trackingClick = true;
	this.trackingClickStart = event.timeStamp;
	this.targetElement = targetElement;

	this.touchStartX = touch.pageX;
	this.touchStartY = touch.pageY;

	// Prevent phantom clicks on fast double-tap (issue #36)
	if ((event.timeStamp - this.lastClickTime) < 200) {
		event.preventDefault();
	}

	return true;
};


/**
 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.touchHasMoved = function(event) {
	'use strict';
	var touch = event.changedTouches[0], boundary = this.touchBoundary;

	if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
		return true;
	}

	return false;
};


/**
 * Update the last position.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchMove = function(event) {
	'use strict';
	if (!this.trackingClick) {
		return true;
	}

	// If the touch has moved, cancel the click tracking
	if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
		this.trackingClick = false;
		this.targetElement = null;
	}

	return true;
};


/**
 * Attempt to find the labelled control for the given label element.
 *
 * @param {EventTarget|HTMLLabelElement} labelElement
 * @returns {Element|null}
 */
FastClick.prototype.findControl = function(labelElement) {
	'use strict';

	// Fast path for newer browsers supporting the HTML5 control attribute
	if (labelElement.control !== undefined) {
		return labelElement.control;
	}

	// All browsers under test that support touch events also support the HTML5 htmlFor attribute
	if (labelElement.htmlFor) {
		return document.getElementById(labelElement.htmlFor);
	}

	// If no for attribute exists, attempt to retrieve the first labellable descendant element
	// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
	return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
};


/**
 * On touch end, determine whether to send a click event at once.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchEnd = function(event) {
	'use strict';
	var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

	if (!this.trackingClick) {
		return true;
	}

	// Prevent phantom clicks on fast double-tap (issue #36)
	if ((event.timeStamp - this.lastClickTime) < 200) {
		this.cancelNextClick = true;
		return true;
	}

	// Reset to prevent wrong click cancel on input (issue #156).
	this.cancelNextClick = false;

	this.lastClickTime = event.timeStamp;

	trackingClickStart = this.trackingClickStart;
	this.trackingClick = false;
	this.trackingClickStart = 0;

	// On some iOS devices, the targetElement supplied with the event is invalid if the layer
	// is performing a transition or scroll, and has to be re-detected manually. Note that
	// for this to function correctly, it must be called *after* the event target is checked!
	// See issue #57; also filed as rdar://13048589 .
	if (this.deviceIsIOSWithBadTarget) {
		touch = event.changedTouches[0];

		// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
		targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
		targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
	}

	targetTagName = targetElement.tagName.toLowerCase();
	if (targetTagName === 'label') {
		forElement = this.findControl(targetElement);
		if (forElement) {
			this.focus(targetElement);
			if (this.deviceIsAndroid) {
				return false;
			}

			targetElement = forElement;
		}
	} else if (this.needsFocus(targetElement)) {

		// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
		// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
		if ((event.timeStamp - trackingClickStart) > 100 || (this.deviceIsIOS && window.top !== window && targetTagName === 'input')) {
			this.targetElement = null;
			return false;
		}

		this.focus(targetElement);

		// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
		if (!this.deviceIsIOS4 || targetTagName !== 'select') {
			this.targetElement = null;
			event.preventDefault();
		}

		return false;
	}

	if (this.deviceIsIOS && !this.deviceIsIOS4) {

		// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
		// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
		scrollParent = targetElement.fastClickScrollParent;
		if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
			return true;
		}
	}

	// Prevent the actual click from going though - unless the target node is marked as requiring
	// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
	if (!this.needsClick(targetElement)) {
		event.preventDefault();
		this.sendClick(targetElement, event);
	}

	return false;
};


/**
 * On touch cancel, stop tracking the click.
 *
 * @returns {void}
 */
FastClick.prototype.onTouchCancel = function() {
	'use strict';
	this.trackingClick = false;
	this.targetElement = null;
};


/**
 * Determine mouse events which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onMouse = function(event) {
	'use strict';

	// If a target element was never set (because a touch event was never fired) allow the event
	if (!this.targetElement) {
		return true;
	}

	if (event.forwardedTouchEvent) {
		return true;
	}

	// Programmatically generated events targeting a specific element should be permitted
	if (!event.cancelable) {
		return true;
	}

	// Derive and check the target element to see whether the mouse event needs to be permitted;
	// unless explicitly enabled, prevent non-touch click events from triggering actions,
	// to prevent ghost/doubleclicks.
	if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

		// Prevent any user-added listeners declared on FastClick element from being fired.
		if (event.stopImmediatePropagation) {
			event.stopImmediatePropagation();
		} else {

			// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
			event.propagationStopped = true;
		}

		// Cancel the event
		event.stopPropagation();
		event.preventDefault();

		return false;
	}

	// If the mouse event is permitted, return true for the action to go through.
	return true;
};


/**
 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
 * an actual click which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onClick = function(event) {
	'use strict';
	var permitted;

	// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
	if (this.trackingClick) {
		this.targetElement = null;
		this.trackingClick = false;
		return true;
	}

	// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
	if (event.target.type === 'submit' && event.detail === 0) {
		return true;
	}

	permitted = this.onMouse(event);

	// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
	if (!permitted) {
		this.targetElement = null;
	}

	// If clicks are permitted, return true for the action to go through.
	return permitted;
};


/**
 * Remove all FastClick's event listeners.
 *
 * @returns {void}
 */
FastClick.prototype.destroy = function() {
	'use strict';
	var layer = this.layer;

	if (this.deviceIsAndroid) {
		layer.removeEventListener('mouseover', this.onMouse, true);
		layer.removeEventListener('mousedown', this.onMouse, true);
		layer.removeEventListener('mouseup', this.onMouse, true);
	}

	layer.removeEventListener('click', this.onClick, true);
	layer.removeEventListener('touchstart', this.onTouchStart, false);
	layer.removeEventListener('touchmove', this.onTouchMove, false);
	layer.removeEventListener('touchend', this.onTouchEnd, false);
	layer.removeEventListener('touchcancel', this.onTouchCancel, false);
};


/**
 * Check whether FastClick is needed.
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.notNeeded = function(layer) {
	'use strict';
	var metaViewport;
	var chromeVersion;

	// Devices that don't support touch don't need FastClick
	if (typeof window.ontouchstart === 'undefined') {
		return true;
	}

	// Chrome version - zero for other browsers
	chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

	if (chromeVersion) {

		if (FastClick.prototype.deviceIsAndroid) {
			metaViewport = document.querySelector('meta[name=viewport]');
			
			if (metaViewport) {
				// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
				if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
					return true;
				}
				// Chrome 32 and above with width=device-width or less don't need FastClick
				if (chromeVersion > 31 && window.innerWidth <= window.screen.width) {
					return true;
				}
			}

		// Chrome desktop doesn't need FastClick (issue #15)
		} else {
			return true;
		}
	}

	// IE10 with -ms-touch-action: none, which disables double-tap-to-zoom (issue #97)
	if (layer.style.msTouchAction === 'none') {
		return true;
	}

	return false;
};


/**
 * Factory method for creating a FastClick object
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.attach = function(layer) {
	'use strict';
	return new FastClick(layer);
};


if (typeof define !== 'undefined' && define.amd) {

	// AMD. Register as module.
	define('fastclick', function() {
		'use strict';
		return FastClick;
	});
} else if (typeof module !== 'undefined' && module.exports) {
	module.exports = FastClick.attach;
	module.exports.FastClick = FastClick;
} else {
	window.FastClick = FastClick;
}
;
/**
 * @file
 * 
 */
(function ($) {
  Drupal.behaviors.blockfactory = {
    attach: function (context, settings) {
      // Currently does nothing.
    }
  };
})(jQuery, Drupal);
;