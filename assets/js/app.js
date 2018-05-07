'use strict';

function defaultClass() {
     this.canHaveLog = false;
}
defaultClass.prototype = {
   init: function () {
      var t = this;
      $.each(this, function (k) {
           if (k.match(/^_init[0-9A-Z][0-9a-zA-Z]/) !== null) {
                t[k]();
           }
      });
   }
};
var Singleton = {
   listClassInlive:{},
   currentPage: null,
   canHaveLog: false,
   isConnected: false,
   isConfirmed: false,
   pseudo: '',
   email: '',
   favoris: [],
   position:  {
     userAsked: false,
     latitude: null,
     longitude: null,
   },
  /**
   * Init function.
   */
   init: function () {
      if ('console' in window && 'log' in window.console) {
           this.canHaveLog = true;
      }
      this.getCurrentPageClass();
    /**
     * User gestion.
     */
      this._isConnected();
    /**
     * All page gestion.
     */
      Singleton.extend(Allpage);
      var allpage = new Allpage();
      allpage.init();
   },
    /**
     * Is user connected.
     */
    _isConnected: function () {
        var that = this;
        if ($.cookie('token') && $.cookie('token') != "j:null" && this.isConnected === false) {
           $.ajax({
              url: '/compte/connecte',
              type: 'post',
              dataType: 'json',
              success: function(data) {
                that.isConnected = true;
                if (data.pseudo) {
                    that.pseudo = data.pseudo;
                }
                if (data.email) {
                  that.email = data.email;
                }
                if (data.isConfirmed) {
                  that.isConfirmed = data.isConfirmed;
                } else if (!Allpage.prototype.getCookie('confirmed-mail', {
                    cookie: true,
                  })) {
                  that._setAlertMailConfirmed();
                }
                that.setConnectedHeader();
              },
              error: function() {
                 // $.removeCookie('token');
              },
           });
        }
     },

  _setAlertMailConfirmed:function() {
    var that = this;
    Allpage.prototype._openMessage(
      "Confirmez votre adresse email via le mail de vérification, pour accéder à toutes les fonctionnalités.<br/>" +
      "<a href='#' title='Renvoyer la confirmation' class='resend-confirmation btn mg-top-20'>Renvoyer l'email</a>"
    );
    $('.action-messagePopin').on('click', '.action-close', function(e) {
      $.cookie('confirmed-mail', true, {
        expires: 1,
      });
    });
    $('.action-messagePopin').on('click', '.resend-confirmation', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $.cookie('confirmed-mail', true, {
        expires: 1,
      });
      $.ajax({
        url:  "/compte/renvoyer-mail-confirmation",
        type: 'post',
        dataType: "json",
        data: 'email=' + that.email,
        success: function() {
          Allpage.prototype._openMessage('Email de confirmation renvoyé');
        },
        error: function(err) {
          if (err && err.responseJSON && err.responseJSON.message) {
            Allpage.prototype._openMessage(err.responseJSON.message);
            return null;
          }
          Allpage.prototype._openMessage(err.statusText || null);
        },
      });
    });
  },

  /**
   *
   */
   setConnectedHeader: function () {
      $('#seeAccount').attr('href', '/mon-compte').html('Mon compte, ' + this.pseudo);
   },
  /**
   * Extend default function for a class.
   * @param destination
   */
   extend: function (destination) {
      destination.prototype.canHaveLog = this.canHaveLog;
      for (var property in defaultClass.prototype) {
          destination.prototype[property] = defaultClass.prototype[property];
      }
   },
    /**
     * Get only one instance for a class.
     * @param $class
     * @returns {*}
     */
    getInstance : function($class){
        try {
            if (!this.listClassInlive[$class]) {
                var maclass = eval($class);
                this.extend(maclass);
                if (typeof maclass.name === 'undefined') {
                    maclass.name = $class;
                }
                this.listClassInlive[maclass.name] = new maclass();
            }
            return this.listClassInlive[$class];
        } catch(e) {
            return null;
        }
    },
    /**
     * Set current page class.
     * @param $name
     */
    setCurrentPage: function($name) {
        if(typeof $name === "string"){
            this.currentPage = $name;
        }
    },
    /**
     * Get class for current page.
     */
    getCurrentPageClass: function() {
        if (!$('body').attr("class")) {
            return null;
        }
        var currentClasse = ($('body').attr("class") ? $('body').attr("class") : ''),
        regex             = new RegExp(/(body-)+([\S+$]+)/);
        currentClasse     = regex.exec(currentClasse);
        currentClasse     = currentClasse[0].replace("body", "");
        currentClasse     = currentClasse.replace(/-/gi, "");
        if (currentClasse === '') {
            return null;
        }
        try {
            this.setCurrentPage(currentClasse);
            var instance = this.getInstance(currentClasse);
            instance.init();
        } catch(e) {
            return null;
        }
    },
    /**
     * Remove error field.
     * @param bloc
     */
    removeErrorField:function(bloc) {
        bloc.find('.txt-error').remove();
    },
    /**
     * Set error field.
     * @private
     */
    setErrorField:function(field, message) {
        field.addClass('error');
        field.after( "<p class='txt-red txt-error'>" + message + "</p>" );
    }
};

function Allpage() {}
Allpage.prototype = {
  interface: 'lg',
  favoris: [],
  s4: function() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  },

  logger:function(message, code, url) {
    $.get( "/log", {
      code: code || 400,
      message: (message || 'message unsigned'),
      url: url || window.location.pathname,
      navigateur: navigator.appCodeName,
      env: navigator.appVersion,
      lang: navigator.language,
      platform: navigator.platform,
    });
  },

  compteCreate:function(xhr) {
    window.scrollTo(0, 0);
    Allpage.prototype.setCookie('oldAnnonce', '');
    Allpage.prototype.removeCookie('oldAnnonce');
    $.cookie('token', xhr.getResponseHeader("token"), { path: '/',  expires: 1 });
  },

  compteAlreadyExist: function(err, form) {
    Allpage.prototype.setCookie('oldAnnonce', form.serialize());
    if (err && err.responseJSON) {
      if (err.responseJSON.mustConnect === 1) {
        pageannonce.prototype.popinAccount();
      }
      if (err.responseJSON.message) {
        Allpage.prototype._openMessage(err.responseJSON.message);
      }
    } else {
      Allpage.prototype._openMessage(err.statusText || null);
    }
  },

  changehistory:function(title, page) {
    if (typeof window.history.pushState == 'function') {
      var stateObj = {};
      var title = title || "annonce suivante babies-pets.fr";
      document.title = title;
      window.history.pushState(stateObj, title, page);
      ga('send', 'pageview');
    }
  },

  guid:function() {
    return Allpage.prototype.s4() + Allpage.prototype.s4() + '-' + Allpage.prototype.s4() + '-' + Allpage.prototype.s4() + '-' +
      Allpage.prototype.s4() + '-' + Allpage.prototype.s4() + Allpage.prototype.s4() + Allpage.prototype.s4();
  },

  getCookie:function(key, obj) {
    if (obj && obj.cookie) {
      return $.cookie(key);
    }
    if (typeof(Storage) !== "undefined") {
      return localStorage.getItem(key);
    }
    return $.cookie(key);
  },

  setCookie:function(key, value, obj) {
    if (obj && obj.cookie) {
      return $.cookie(key, value);
    }
    if (typeof(Storage) !== "undefined") {
      return localStorage.setItem(key, value);
    } else if (obj && !obj.nocookie) {
      return $.cookie(key, value);
    }
    return null;
  },

  removeCookie:function(key, obj) {
    if (obj && obj.cookie) {
      return $.removeCookie(key);
    }
    if (typeof(Storage) !== "undefined") {
      return localStorage.removeItem(key);
    }
    return $.removeCookie(key);
  },

  _vibrate:function() {
    if ("vibrate" in navigator) {
      return window.navigator.vibrate(100);
    } else if ("mozVibrate" in navigator) {
      return window.navigator.mozVibrate(100);
    }
  },
  /**
   * Show popin message.
   * @param message
   * @private
   */
  _openMessage:function(message) {
    $('.action-messagePopin').remove();
    $('.mypts').remove();
    $( "header" ).append( '<div class="message action-messagePopin">' +
        '<h4 class="ttl-message">' + message + '</h4>' +
        '<a class="action-close btn-close sprite-before close" data-format="banner300-250" title="Fermer la popin">' +
        '</a></div>' );
    $('.action-messagePopin').on('click', '.btn-close', function(e) {
        $('.action-messagePopin').remove();
    });

    Allpage.prototype.logger('message retourné par l\'alerte :: ' + message);
    this._vibrate();
  },

  _init1InterfaceSize:function() {
    ['xs', 'sm', 'md', 'lg'].forEach(function(e) {
      if ($('.bloc-' + e).is(":visible")) {
        Allpage.prototype.interface = e;
      }
    });
  },

  _init2CookiesPopin:function() {
    if (!Allpage.prototype.getCookie('acceptCookies')) {
      $('body').append('<div class="bloc-information-cookies">' +
        '<div class="bloc container">' +
        '<h4 class="ttl-h4">Utilisation des cookies</h4>' +
        '<p class="txt-white">En poursuivant votre navigation sans modifier vos paramètres, vous acceptez l\'utilisation des cookies ou technologies similaires pour disposer de services et d\'offres adaptés à vos centres d\'intérêts ainsi que pour la sécurisation des transactions sur notre site. Pour plus d\'informations sur la page <a href="/a-propos/cookies-eu.html" target="_blank" title="Voir les informations sur les cookies">politique sur les cookies</a>.</p>' +
        '<a class="action-close btn-close sprite-before close" title="Fermer la popin d\'information sur les cookies"></a>' +
        '</div></div>');
      $('.bloc-information-cookies').on('click', '.action-close', function() {
        $('.bloc-information-cookies').remove();
        Allpage.prototype.setCookie('acceptCookies', true);
      });
    }
  },

  _setFav:function() {
    Singleton.favoris.forEach(function(e) {
      $('#fav-' + e).addClass('active');
    });
  },

  _init2Favoris:function() {
    var that = this;
    if (Allpage.prototype.getCookie('favoris')) {
      Singleton.favoris = Allpage.prototype.getCookie('favoris');
      Singleton.favoris = Singleton.favoris.split(",");
    }
    $('body').on('click', '.btn-favoris', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (!$(this).data('id')) {
        return false;
      }
      if( $(this).hasClass('active')) {
        $(this).removeClass('active');
        Singleton.favoris.splice(Singleton.favoris.indexOf($(this).data('id')), 1);
        that._removeFavoris($(this).data('id'));
      } else if (!~that.favoris.indexOf($(this).data('id'))) {
        Allpage.prototype._openMessage('Annonce mise en favoris');
        $(this).addClass('active');
        Singleton.favoris.push($(this).data('id'));
        that._addFavoris($(this).data('id'));
      } else {
        Allpage.prototype._openMessage('Annonce déjà en favoris');
        $(this).addClass('active');
      }
      Allpage.prototype.setCookie('favoris', Singleton.favoris);
    });
    that._setFav();
  },

  _addFavoris:function(id) {
    if (Singleton.isConnected) {
      $.ajax({
        url:  "/favoris/ajouter/" + id,
        type: 'post',
        dataType: "json",
      });
    }
  },

  _removeFavoris:function(id) {
    if (Singleton.isConnected) {
      $.ajax({
        url:  "/favoris/retirer/" + id,
        type: 'post',
        dataType: "json",
      });
    }
  },

  _init2PbmForm:function() {
    var bloc = $('.bloc-left-search');
    bloc.on('click', '.btn-more-search-sidebar', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if( bloc.hasClass('actif')) {
        bloc.removeClass('actif');
      } else {
        bloc.addClass('actif');
      }
    });
  },
  /**
   * Header > module conenxion.
   * @private
   */
  _init3Menu:function() {
    $('.bloc-menu').on('click', '.btn-menu', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if( $('.bloc-link').hasClass('active')) {
          $('.bloc-link').removeClass('active');
      } else {
          $('.bloc-link').addClass('active');
      }
    });
  },

  destroyPopin:function() {
    Allpage.prototype.setCookie('hideBeta', true);
    $('.popin-beta').hide();
  },

  _init4PopinBeta:function() {
    if (Allpage.prototype.getCookie('hideBeta')) {
      $('.popin-beta').hide();
    }
    $('.form-beta').on('click', '.btn-beta-form', function (e) {
      e.preventDefault();
      e.stopPropagation();
      $.ajax({
        url:  "/inscription/beta",
        type: 'post',
        dataType: "json",
        data: $('.form-beta').serialize(),
        success: function(data) {
           Allpage.prototype._openMessage(data.message || "Merci. Vous allez être alerté pour la sortie de la version beta");
          $('#form-beta').find('.form-content').html('');
          setTimeout(function(){
            window.location.replace("https://www.facebook.com/teamBabiesPets/");
          }, 2000);
        },
        error: function(err) {
          if (err && err.responseJSON && err.responseJSON.message) {
            Allpage.prototype._openMessage(err.responseJSON.message);
          } else {
            Allpage.prototype._openMessage(err.statusText || err || null);
          }
        },
      });
    });
  },

  _init5HeaderSize:function() {
    if (Allpage.prototype.interface !== 'xs') {
      $(window).scroll(function () {//Au scroll dans la fenetre on déclenche la fonction
        if ($(this).scrollTop() > 160) { //si on a défilé de plus de 160px du haut vers le bas
          $('header').addClass("header-small"); //on ajoute la classe "fixe" au header
        } else {
          $('header').removeClass("header-small");//sinon on retire la classe "fixe" (c'est pour laisser le header à son endroit de départ lors de la remontée
        }
      });
    }
  },

  _init6SearchBloc:function() {
    $('.form-search').on('click', '.btn', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $('.bloc-annonce').show();
      $('.action-search-checkbx').each(function() {
        var action = $(this).data('action');
        var values = $('.data-' + action);
        $(this).prop('checked') ?  '' : values.hide();
      });
      $('.action-search-input').each(function() {
        var action = $(this).data('action');
        var values = $(this).val();
        var sens = action === 'min' ? '>=' : '<=';
        if (values) {
          $('.bloc-annonce').each(function () {
            if ($(this).data('price') !== 'don') {
              eval($(this).data('price') + sens + values) ? '' : $(this).hide();
            }
          });
        }
      });
    });
  },

  _init7InscritAlerte:function() {
    if (Allpage.prototype.getCookie('alertes', {
        cookie: true
      })) {
      $('.bloc-newsletter').remove();
      return null;
    }
    $('.bloc-newsletter').removeClass('hide');
    $('.action-alerte').on('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $('.bloc-action-alerte').removeClass('hidden');
      $('.action-alerte').addClass('hidden');
      $('.action-alerte-valid').removeClass('hidden');
      if(Singleton.isConnected) {
        $('.bloc-alerte-email').hide();
      }
    });

    $('.action-alerte-valid').on('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      $.ajax({
        url:  "/alertes/inscription",
        type: 'post',
        dataType: "json",
        data: $('.form-alertes').serialize(),
        success: function() {
          Allpage.prototype._openMessage('Enregistrement de l\'alerte effectué');
          $('.bloc-newsletter').remove();
          Allpage.prototype.setCookie('alertes', true, {
            cookie: true
          });
        },
        error: function(err) {
          if (err && err.responseJSON && err.responseJSON.message) {
            Allpage.prototype._openMessage(err.responseJSON.message);
            return null;
          }
          Allpage.prototype._openMessage(err.statusText || null);
        },
      });
    });
  },

  _init8LoadPubs:function() {
    $( ".load-pub" ).each(function() {
      var format = 'carre';
      if (Allpage.prototype.interface !== 'xs') {
        format = $(this).data('format') || 'carre';
      }
      $(this).append('<iframe src="/pub/' + format + '" class="pub-'+format+'"/>');
      $(this).removeClass('load-pub');
    });
  },

  _init9MenuXS:function() {
    if (Allpage.prototype.interface === 'xs') {
      $('body').on('click', '.menu-xs', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $('.bloc-little-header').hasClass('hidden-xs') ? $('.bloc-little-header').removeClass('hidden-xs') : $('.bloc-little-header').addClass('hidden-xs');
        $('.bloc-menu').hasClass('hidden-xs') ? $('.bloc-menu').removeClass('hidden-xs') : $('.bloc-menu').addClass('hidden-xs');
      });
    }
  },

  _init3LoadImage:function() {
    $('img.lazy').jail({
      placeholder : '/thumb/deZ9GTa2x10z961YnCvJAlJxodk=/266x197/a8ebf308e9704ce0aa4c44f7cc406553',
      // triggerElement: 'body',
      callbackAfterEachImage : function($img) {
        $img.removeClass('lazy');
      },
      event: 'scroll'
    });
  },

  searchToObject: function() {
    var oParametre = {};
    if (window.location.search.length > 1) {
      for (var aItKey, nKeyId = 0, aCouples = window.location.search.substr(1).split("&"); nKeyId < aCouples.length; nKeyId++) {
        aItKey = aCouples[nKeyId].split("=");
        oParametre[unescape(aItKey[0])] = aItKey.length > 1 ? unescape(aItKey[1]) : "";
      }
    }
    return oParametre;
  }
};

/**
 * Inscription page.
 * @constructor
 */
function adhome() {}
adhome.prototype = {
  map: undefined,
  infowindow: undefined,
  page: 1,
  listRegions: {
    'Auvergne-Rhône-Alpes': 1, // done
    'Bourgogne Franche-Comté': 2, // done
    'Bretagne': 3, // done
    'Centre-Val de Loire': 4, // done
    'Corse': 5, // done
    'Grand-Est': 6, //fail
    'Hauts-de-France': 7, // fail (Nord-Pas-de-Calais Picardie)
    'Île-de-France': 8, // done
    "Provence-Alpes-Côte d'Azur": 9, // done
    "Pays-de-la-Loire": 10, // done
    'Normandie': 11, // done
    'Nouvelle-Aquitaine': 12, // fail (Aquitaine-Limousin-Poitou-Charentes)
    'Occitanie': 13, // fail (Languedoc-Roussillon Midi-Pyrénées)
    'Alsace-Champagne-Ardenne-Lorraine': 6, // done (Grand-Est)
    'Aquitaine-Limousin-Poitou-Charentes': 12, // done (Nouvelle-Aquitaine)
    'Languedoc-Roussillon Midi-Pyrénées': 13, // done (Occitanie)
    'Nord-Pas-de-Calais Picardie': 7,  // done (Hauts-de-France)
  },
  emailReg:  /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i,
  urlReg: /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/i,
  allNews: false,
  waiting: false,

  /**
   * Init bg video
   * @private
   */
  _init1BgVideo:function() {
    Allpage.prototype._init1InterfaceSize();
    if (Allpage.prototype.interface !== 'xs') {
      $('#bg-video').videoBG({
        zIndex: -1,
        loop: 1,
        top: '-220',
        mp4: '/img/puppy-4740.mp4',
        ogv: '/img/puppy-4740.mp4',
        webm: '/img/puppy-4740.webm',
        mov: '/img/puppy-4740.mov',
        poster: '/img/home.jpg'
      });
    }
  },
  _init2Favoris:function() {
    adlist.prototype._init2Favoris();
  },
  /**
   * Change cat
   * @private
   */
  _init2ChangeCat:function() {
    $('.bloc-accueil').on('click', '.btn', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var type = $("#type").val();
      var region =  $("#localisation").val();
      if (type != 'all') {
        document.location.href = "/annonces/" + type + "?region=" + region;
      }
    });
  },

  /**
   * Init get position.
   * @private
   */
  _init4GetPos:function() {
    function activeGeoPos() {
      $(this).off( "click",  activeGeoPos );
      if ($.cookie('geolocation')) {
        Singleton.position = JSON.parse($.cookie('geolocation'));
        return adhome.prototype.setGglmap();
      }
      if (!Singleton.position.userAsked && "geolocation" in navigator && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition( adhome.prototype.saveMyPosition,  adhome.prototype.erreurPosition, {maximumAge: 600000});
      }
    }
    $("#active-geoloc").on('click', activeGeoPos);
  },

  /**
   * Get user departement
   */
  getMyDepartement:function() {
    var t = this;
    if (Singleton.position.dep) {
      return this.updateDefaultSearch();
    }
    var geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(Singleton.position.latitude, Singleton.position.longitude);
    geocoder.geocode({
      'latLng': latlng,
    }, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK && results[0]) {
        var elt = results[0].address_components;
        for(var i in elt){
          if(elt[i].types[0] == 'administrative_area_level_1') {
            if (t.listRegions[elt[i].long_name]) {
              Singleton.position.dep = t.listRegions[elt[i].long_name];
              $.cookie('geolocation', JSON.stringify(Singleton.position));
            }
          }
        }
      }
    });
  },
  /**
   * Update default search
   * @param depName
   */
  updateDefaultSearch:function() {
    if (Singleton.position.dep) {
      $('#localisation').val(Singleton.position.dep);
    }
    if (Singleton.position.type) {
      $('#type').val(Singleton.position.type);
    }
  },
  /**
   * Get my position.
   */
  saveMyPosition:function(position) {
    Singleton.position = {
      userAsked: true,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    $.cookie('geolocation', JSON.stringify(Singleton.position));
    adhome.prototype.getMyDepartement();
    adhome.prototype.setGglmap();
  },

  /**
   * Set google maps.
   */
  setGglmap:function() {
    adhome.prototype.getMyDepartement();
    var latlng;
    var t = this;
    var setMyPos = true;
    var currentMap = $("#map");
    if (currentMap.data('lat') && currentMap.data('long')) {
      latlng = new google.maps.LatLng(currentMap.data('lat'), currentMap.data('long'));
    } else if (Singleton.position.latitude) {
      latlng = new google.maps.LatLng(Singleton.position.latitude, Singleton.position.longitude);
    } else {
      setMyPos = false;
      latlng = new google.maps.LatLng('48.8370989', '2.3666065');
    }
    t.map = new google.maps.Map(document.getElementById("map"), {
      center: latlng,
      zoom: 10,
      zoomControl: false,
      scaleControl: false,
      rotateControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      scrollwheel: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    this.infowindow = new google.maps.InfoWindow({
      content: ''
    });
    // Ajout d'un marqueur à la position trouvée
    if (setMyPos) {
      var marker = new google.maps.Marker({
        position: latlng,
        map: t.map,
        title: "Vous êtes ici"
      });
      marker.addListener('mouseover', function () {
        t.infowindow.setContent(this.title);
        t.infowindow.open(t.map, this);
      });
      marker.addListener('mouseout', function () {
        t.infowindow.close();
      });
    }
    this.map.panTo(latlng);
    this.setAddonGGL();
  },

  /**
   * Set favoris on map.
   */
  setAddonGGL:function() {
    var marker;
    var t = this;
    $('.bloc-annonce' ).each(function() {
      if ($(this).data('name') && $(this).data('lat') && $(this).data('long')) {
        marker = new google.maps.Marker({
          position: new google.maps.LatLng($(this).data('lat'), $(this).data('long')),
          map: t.map,
          title: $(this).data('name'),
          id: $(this).attr('id'),
        });
        marker.addListener('click', function() {
          $('html, body').animate({
            scrollTop: ($('#' + this.id).offset().top - 100)
          }, 'slow');
        });
        marker.addListener('mouseover', function() {
          t.infowindow.setContent(this.title);
          t.infowindow.open(t.map, this);
        });
        marker.addListener('mouseout', function() {
          t.infowindow.close();
        });
      }
    });
  },
  /**
   * Google maps error of position
   * @param error
   */
  erreurPosition:function(error) {
    var info = "Erreur lors de la géolocalisation : ";
    switch(error.code) {
      case error.TIMEOUT:
        info += "Timeout !";
        break;
      case error.PERMISSION_DENIED:
        info += "Vous n’avez pas donné la permission";
        break;
      case error.POSITION_UNAVAILABLE:
        info += "La position n’a pu être déterminée";
        break;
      case error.UNKNOWN_ERROR:
        info += "Erreur inconnue";
        break;
    }
    return adhome.prototype.setGglmap();
  },

  /**
   * init bns more and less for google maps.
   * @private
   */
  _init5BtnsMoreLess:function() {
    var btnsforgeo = $('.btns-for-geo');
    var t = this;
    btnsforgeo.on('click', '.action-more', function(e) {
      e.preventDefault();
      var size = $('#map').data('size');
      if (!size || size === '3') {
        return false;
      }
      switch(size) {
        case 1:
          btnsforgeo.find('.action-less').show();
          $('#map').show().height('150px').data('size', 2);
          break;
        case 2:
          $('#map').height('500px').data('size', 3);
          btnsforgeo.find('.action-more').hide();
          break;
      }
      $('html, body').animate({
        scrollTop: $('#beforemap').offset().top
      }, 'slow');
      google.maps.event.trigger(t.map, "resize");
    });
    btnsforgeo.on('click', '.action-less', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var size = $('#map').data('size');
      if (!size || size === '3') {
        return false;
      }
      switch(size) {
        case 3:
          btnsforgeo.find('.action-more').show();
          $('#map').height('150px').data('size', 2);
          break;
        case 2:
          btnsforgeo.find('.action-less').hide();
          $('#map').hide().data('size', 1);
          break;
      }
      $('html, body').animate({
        scrollTop: $('#beforemap').offset().top
      }, 'slow');
      google.maps.event.trigger(t.map, "resize");
    });
  },

  _addBlocAnnoncesFictives:function () {
    $('.allnews').append('<div class="row mg-bottom-20 bloc-annonce loadMoreNews">'+
      '<div class="col-xs-12 col-sm-3">'+
      '<div class="bloc-home-img bloc" style=" height: 196px; background-color: rgb(234, 234, 234);">'+
      '<div class="btn-more-photos sprite-before"><img src="/img/loading_big.gif" class="img-responsive">'+
      '</div></div></div>'+
      '<div class="col-xs-12 col-sm-8">'+
      '<p class="txt-right txt-12 mg-bottom-0">Date en attente<br>Lieu en attente</p>'+
      '<p class="txt-20 mg-top-20-"><span class="txt-bold">Espèce : </span>En cours de chargement</p>'+
      '<p class="txt-16 mg-top-20">Titre de l\'annonce en attente</p>'+
      '<p class="txt-four-lines txt-16 txt-justify txt-six-lines mg-top-30">... <img src="/img/loading_big.gif" style="width: 150px;" alt="En cours">...</p>'+
      '<div class="row mg-top-40">'+
      '<div class="col-xs-7">'+
      '<p class="txt-18"><span class="txt-bold">Tarif :</span> A venir</p>'+
      '</div>'+
      '<div class="col-xs-5"></div></div></div></div>');
  },

  _preventDefaultForScrollKeys:function(e) {
    if (typeof keys !== 'undefined' && e.keyCode && keys[e.keyCode]) {
      this._preventDefault(e);
      return false;
    }
  },

  _disableScroll: function() {
    if (window.addEventListener) { // older FF
      window.addEventListener('DOMMouseScroll', this._preventDefault, false);
    }
    window.onwheel = this._preventDefault; // modern standard
    window.onmousewheel = document.onmousewheel = this._preventDefault; // older browsers, IE
    window.ontouchmove  = this._preventDefault; // mobile
    document.onkeydown  = this._preventDefaultForScrollKeys;
  },

  _preventDefault:function(e) {
    e = e || window.event;
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.returnValue = false;
  },

  _enableScroll: function() {
    if (window.removeEventListener) {
      window.removeEventListener('DOMMouseScroll', this._preventDefault, false);
    }
    window.onmousewheel = document.onmousewheel = null;
    window.onwheel = null;
    window.ontouchmove = null;
    document.onkeydown = null;
  },

  _loadAds:function() {
    var t = this;
    $('.allnews').data('page', ( $('.allnews').data('page') + 1));
    $.ajax({
      url:  "/annonce/load",
      type: 'get',
      data: 'page=' +  $('.allnews').data('page') + '&type=' + $('.allnews').data('type'),
      success: function(data) {
        t.waiting = false;
        $('.allnews').append(data);
        $('.loadMoreNews').remove();
        setTimeout("adhome.prototype._enableScroll()", 200);
        Allpage.prototype._init8LoadPubs();
        Allpage.prototype._init3LoadImage();
      },
      error: function() {
        t.allNews = true;
        Allpage.prototype._openMessage("Toutes les annonces sont affichées");
        adhome.prototype._enableScroll();
        $('.loadMoreNews').remove();
      },
    });
  },

  _init12LoadMoreAds:function() {
    var t = this;
    $(window).scroll(function() {
      if($(window).scrollTop() + $(window).height() == $(document).height() && t.allNews === false && t.waiting === false) {
        t._disableScroll();
        $('html, body').animate({scrollTop: $('.allnews').offset().top + $('.allnews').height() -120}, 10);
        t._addBlocAnnoncesFictives();
        t._addBlocAnnoncesFictives();
        t._addBlocAnnoncesFictives();
        t.waiting = true;

        setTimeout("adhome.prototype._loadAds()", 200);
      }
    });
  },

  _init13Scroll:function() {
    var $window = $(window);
    $.fn.isInViewport = function() {
      var elementTop = $(this).offset().top;
      var elementBottom = elementTop + $(this).outerHeight();
      var viewportTop = $(window).scrollTop();
      var viewportBottom = viewportTop + $(window).height();

      return elementBottom > viewportTop && elementTop < viewportBottom;
    };

    adhome.prototype.page = $('.allnews').data('page');

    $(window).on('resize scroll', function() {
      $('.allnews').find('.bloc-annonce:visible').each(function() {
        var attr = $(this).attr('data-page');
        if ($(this).isInViewport() && typeof attr !== 'undefined') {
          if (attr == adhome.prototype.page) {
            return false;
          }
          adhome.prototype.page = $(this).attr('data-page');
          var pathname = window.location.pathname;
          var title = '';
          var params = Allpage.prototype.searchToObject();
          delete params.page;
          if (adhome.prototype.page !== "1") {
            params.page = adhome.prototype.page;
            title = "Annonces page " + adhome.prototype.page + " - ";
          }
          params = $.param(params);
          if (params) {
            pathname += '?' + params;
          }
          title += $('title').html();
          Allpage.prototype.changehistory(pathname, title);
          return false;
        }
      });
    });
  },

  _init14ScrollToContent:function() {
    var params = Allpage.prototype.searchToObject();
    if (params.page > 1) {
      $(".allnews").get(0).scrollIntoView();
    }

  },
};

function contactindex() {};
contactindex.prototype = {
  _submitForm:function() {
    $.ajax({
      url:  "/contact/soumettre",
      type: 'post',
      dataType: "json",
      data: $('.form-contact').serialize(),
      success: function() {
        Allpage.prototype._openMessage('Message envoyé');
      },
      error: function(err) {
        if (err && err.responseJSON && err.responseJSON.message) {
          Allpage.prototype._openMessage(err.responseJSON.message);
          return null;
        }
        Allpage.prototype._openMessage(err.statusText || null);
      },
    });
  },

  _init1ValidationForm:function() {
    $.validate({
      lang : 'fr',
      validateOnBlur : true, // disable validation when input looses focus
      errorMessagePosition : 'top', // Instead of 'inline' which is default
      scrollToTopOnError : true, // Set this property to true on longer forms
      form : '#contactsend',
      submitErrorMessageCallback : function($form, errorMessages, config) {
        if (errorMessages) {
          Allpage.prototype._openMessage('Renseignez les champs en anomalis');
        }
        return false; // prevent default behaviour
      },
      onSuccess : function($form) {
        contactindex.prototype._submitForm();
        return false; // Will stop the submission of the form
      },
    });
  },
};

function pagecompte() {}
pagecompte.prototype = {};

function compteannuaires() {}
compteannuaires.prototype = {};

function compteindex() {}
compteindex.prototype = {
  bannersUploaded: [],
  currentFile: {},
  coordinates: {
    x: 0,
    y: 0,
  },

  _init1Deconnexion:function() {
    $('body').on('click', '.btn-deconnexion', function(e) {
      e.preventDefault();
      e.stopPropagation();

      $.removeCookie('token');

      Allpage.prototype._openMessage("Vous êtes maintenant déconnecté, vous allez être rediriger vers la page de connexion");

      setTimeout(function () {
        window.location.replace('/mon-compte/inscription');
      }, 2000);
    });
  },

  /**
   * Load image
   * @private
   */
  _init3LoadImage:function() {
    try {
      $('#fileupload').on('change', compteindex.prototype.dropChangeHandler);
    } catch(err) {
      Allpage.prototype.logger('compteindex::_init3LoadImage :: ' + err);
    }
  },
  dropChangeHandler:function(e) {
    e.preventDefault();
    e.stopPropagation();

    var _e = e.originalEvent;
    var target = _e.dataTransfer || _e.target;
    var file = target && target.files && target.files[0];
    if (!file) {
      return;
    }
    compteindex.prototype.displayImage(file);
  },

  displayImage:function(file) {
    compteindex.prototype.currentFile = file;
    if (!loadImage(file, compteindex.prototype.updateResults, {
        maxWidth: 800,
        maxHeight: 500,
        minWidth: 600,
        minHeight: 400,
        canvas: true,
        pixelRatio: window.devicePixelRatio,
        downsamplingRatio: 0.5,
        orientation: true,
      }))
    {
      Allpage.prototype._openMessage('Votre navigateur ne supporte pas des URLs');
    }
  },

  updateResults:function(img) {
    if (!(img.src || img instanceof HTMLCanvasElement)) {
      Allpage.prototype._openMessage('Le chargement de l\image a échoué');
      return false;
    }
    var imgNode = compteindex.prototype.createPopin(img);
    if (img.getContext) {
      imgNode.Jcrop({
        aspectRatio: 1,
        bgColor: 'black',
        bgOpacity: .4,
        minSize: [136, 102],
        setSelect: [
          0,
          0,
          img.width,
          img.height
        ],
        onSelect: function (coords) {
          compteindex.prototype.coordinates = coords;
        },
        onRelease: function () {
          compteindex.prototype.coordinates = null;
        }
      });
    }
  },

  createPopin:function(img) {
    $('#popin-thumb-edit').remove();
    $('body').append('<div class="popin-bg" id="popin-thumb-edit">' +
      '<div class="container">' +
      '<div class="popin col-xs-10 col-xs-offset-1">' +
      '<div class="row thumb-content-data" id="thumb-content-data" ></div>' +
      '<div class="row bg-white thumb-content">' +
      '<p class="txt-18 thumb-ttl mg-left-20" style="float: left; width: 300px;"><i>Redimensionnez votre avatar</i></p>' +
      '<button type="button" class="btn float-right" id="btn-crop-thumb">Valider</button>' +
      '<button type="button" class="btn float-right mg-right-10 btn-orange" id="btn-crop-cancel">Annuler</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>');

    $('#thumb-content-data').html(img);
    var imgNode = $('#thumb-content-data').find('img, canvas');
    imgNode.addClass('img-responsive');

    $('#btn-crop-thumb').on('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var pixelRatio = window.devicePixelRatio || 1;
      if (img && compteindex.prototype.coordinates) {
        $('#popin-thumb-edit').hide();
        compteindex.prototype.endResult(loadImage.scale(imgNode[0], {
          left: compteindex.prototype.coordinates.x * pixelRatio,
          top: compteindex.prototype.coordinates.y * pixelRatio,
          sourceWidth: compteindex.prototype.coordinates.w * pixelRatio,
          sourceHeight: compteindex.prototype.coordinates.h * pixelRatio,
          minWidth: 683,
          maxWidth: 683,
          minHeight: 511,
          maxHeight: 511,
          meta: true,
          pixelRatio: pixelRatio,
          downsamplingRatio: 0.5
        }));
        compteindex.prototype.coordinates = null;
      }
    });
    $('#btn-crop-cancel').on('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $('#popin-thumb-edit').remove();
      $('#fileupload').val("");
      return false;
    });
    return imgNode;
  },

  endResult:function(img) {
    if (!(img.src || img instanceof HTMLCanvasElement)) {
      Allpage.prototype._openMessage('Le chargement de l\avatar a échoué');
      $('#popin-thumb-edit').remove();
      return false;
    }
    $('#thumb-content-data').html(img);
    var canvas = $('#thumb-content-data').find('img, canvas');
    canvas.addClass('img-responsive').width('319px');

    var ctx = canvas.get(0).getContext('2d');
    var logo = new Image();
    logo.src = '/img/logo-photo.png';
    logo.onload = function()
    {
      ctx.drawImage(logo, 10, 10, 140, 50);
      compteindex.prototype.sendFile(canvas.get(0));
    }
  },

  sendFile:function(img) {
    var t = this;
    var id = Allpage.prototype.guid();
    var file = $('<div/>')
      .append('<div class="loader">Loading...</div>')
      .append('<div class="loader-txt">Chargement de l\'avatar</div>')
      .append(img)
      .appendTo('#my-avatar');

    $('#my-avatar').css( "background-image" , 'url("")');

    var data = new FormData();
    data.append("images",
      pageannonce.prototype.canvasToBlob(img, pageannonce.prototype.currentFile.type || 'image/jpeg'),
      compteindex.prototype.currentFile.name
    );
    $('#popin-thumb-edit').remove();
    $.ajax({
      url: '/mon-compte/avatar',
      data: data,
      type:  "POST",
      contentType: false, // obligatoire pour de l'upload
      processData: false, // obligatoire pour de l'upload
      dataType: 'json', // selon le retour attendu
      success: function (data) {
        if (!data || !data.file) {
          Allpage.prototype._openMessage("Une erreur est survenue, veuillez reessayer");
          return;
        }
        setTimeout(function(){
          file.remove();
          $('#my-avatar').css( "background-image" , "url("+ (data.file || '') + ")");
          Allpage.prototype._openMessage('Votre photo de profil a été mis à jour');
          // t._setTemlate(response.file, response.id);
        }, 5000);
      }
    });
  },

  /*_init1LoadAvatar:function() {
    $('#fileupload').fileupload({
      url: '/mon-compte/avatar',
      dataType: 'json',
      done: function (e, data) {
        $('#my-avatar').css( "background-image" , "url("+data.result.file || ''+")");
        Allpage.prototype._openMessage('Votre photo de profil a été mis à jour');
        $('#progress').addClass('hidden');
        $('.progress-bar').css('width', '0%');
      },
      fail: function (e, data) {
        $('#progress').addClass('hidden');
        $('.progress-bar').css('width', '0%');
        if (data && data.jqXHR && data.jqXHR.responseJSON && data.jqXHR.responseJSON.message) {
          Allpage.prototype._openMessage(data.jqXHR.responseJSON.message);
        } else {
          Allpage.prototype._openMessage("Erreur, impossilble de télécharger votre nouvelle photo de profil");
        }
      },
      progress: function () {
        $('#progress').removeClass('hidden');
      },
      progressall: function (e, data) {
        $('#progress').removeClass('hidden');
        var progress = parseInt(data.loaded / data.total * 100, 10);
        $('#progress .progress-bar').css(
          'width',
          progress + '%'
        );
      }
    })
    .prop('disabled', !$.support.fileInput)
    .parent().addClass($.support.fileInput ? undefined : 'disabled');
  },*/

  _init2PasswordForm: function() {
    $.validate({
      lang : 'fr',
      validateOnBlur : true, // disable validation when input looses focus
      errorMessagePosition : 'top',
      scrollToTopOnError : true,
      form : '#form-password',
      submitErrorMessageCallback : function(form, errorMessages) {
        if (errorMessages) {
          Allpage.prototype._openMessage('Les champs mots de passe sont mal renseignés');
        }
        return false; // prevent default behaviour
      },
      onSuccess : function() {
        compteindex.prototype._submitPasswordForm();
        return false; // Will stop the submission of the form
      },
    });
  },
  _submitPasswordForm:function() {
    $.ajax({
      url:  "/compte/editpassword",
      type: 'post',
      dataType: "json",
      data: $('.form-password').serialize(),
      success: function(data, status, xhr) {
        Allpage.prototype._openMessage(data.message || 'Votre mot de passe a bien été modifié');
      },
      error: function(err) {
        if (err && err.responseJSON && err.responseJSON.message) {
          Allpage.prototype._openMessage(err.responseJSON.message);
          return null;
        }
        Allpage.prototype._openMessage(err.statusText || null);
      },
    });
  },

  _init3CompteForm: function() {
    $.validate({
      lang : 'fr',
      validateOnBlur : true, // disable validation when input looses focus
      errorMessagePosition : 'top',
      scrollToTopOnError : true,
      form : '#form-inscription',
      submitErrorMessageCallback : function(form, errorMessages) {
        if (errorMessages) {
          Allpage.prototype._openMessage('Renseignez les champs en anomalis');
        }
        return false; // prevent default behaviour
      },
      onSuccess : function() {
        compteindex.prototype._submitForm();
        return false; // Will stop the submission of the form
      },
    });
  },
  _submitForm:function() {
    $.ajax({
      url:  "/compte/edit",
      type: 'post',
      dataType: "json",
      data: $('.form-edition').serialize(),
      success: function(data, status, xhr) {
        Allpage.prototype._openMessage(data.message || 'Vos informations personnelles ont bien été modifiées');
      },
      error: function(err) {
        if (err && err.responseJSON && err.responseJSON.message) {
          Allpage.prototype._openMessage(err.responseJSON.message);
          return null;
        }
        Allpage.prototype._openMessage(err.statusText || null);
      },
    });
  },
  _init4Formater:function() {
    $('#description').trumbowyg({
      btns: [
        ['bold', 'italic', 'underline'],
        'btnGrp-justify',
        'unorderedList',
        ['fullscreen']
      ],
      removeformatPasted: true,
      autogrow: true
    });
  },
};

function eleveurprofil() {}
eleveurprofil.prototype = {
  _init1Geopos:function() {
    adindex.prototype._init4Geopos();
  },

  _init2Carousel:function() {
    $('body').on('click', '.example-image-link', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $('.youtube').remove();
      $('.grosplan').removeClass('hidden').attr('src', $(this).attr('href'));
    });
  },

  _init3ShareSocial:function() {
    $('.btn-share').on('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $('.btns-annonces').removeClass('active');
      $('.bloc-annonces').addClass('hidden');
      if ($(this).hasClass('active')) {
        $(this).removeClass('active');
        $('.bloc-share-social').addClass('hidden');
      } else {
        $(this).addClass('active');
        $('.bloc-share-social').removeClass('hidden');
      }
    });
  },

  _init4Phone:function() {
    $('.btn-phone').on('click', function(e) {
      if (Allpage.prototype.interface !== 'xs' && Allpage.prototype.interface !== 'sm') {
        e.preventDefault();
        e.stopPropagation();
        $('.btns-annonces').removeClass('active');
        $('.bloc-annonces').addClass('hidden');
        if ($(this).hasClass('active')) {
          $(this).removeClass('active');
          $('.bloc-phone').addClass('hidden');
        } else {
          $(this).addClass('active');
          $('.bloc-phone').removeClass('hidden');
        }
      }
    });
  },

  _init5Localisation:function() {
    $('.btn-localisation').on('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $('.btns-annonces').removeClass('active');
      $('.bloc-annonces').addClass('hidden');
      if ($(this).hasClass('active')) {
        $(this).removeClass('active');
        $('.bloc-localisation').addClass('hidden');
      } else {
        $(this).addClass('active');
        $('.bloc-localisation').removeClass('hidden');
      }
    });
  },

  _init6Inscription:function() {
    $('.btn-write').on('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $('.btns-annonces').removeClass('active');
      $('.bloc-annonces').addClass('hidden');
      if ($(this).hasClass('active')) {
        $(this).removeClass('active');
        $('.bloc-commentaire').addClass('hidden');
      } else {
        $(this).addClass('active');
        $('.bloc-commentaire').removeClass('hidden');
      }
    });
  },

  _init7MessageForm:function() {
    $.validate({
      lang : 'fr',
      validateOnBlur : true, // disable validation when input looses focus
      errorMessagePosition : 'top', // Instead of 'inline' which is default
      scrollToTopOnError : true, // Set this property to true on longer forms
      form : '#formmessage',
      submitErrorMessageCallback : function($form, errorMessages) {
        if (errorMessages) {
          Allpage.prototype._openMessage('Renseignez les champs en anomalis');
        }
        return false; // prevent default behaviour
      },
      onSuccess : function($form) {
        eleveurprofil.prototype._submitForm();
        return false; // Will stop the submission of the form
      },
    });
  },

  _submitForm:function() {
    $.ajax({
      url:  "/ecrire-eleveur",
      type: 'post',
      dataType: "json",
      data: $('.form-message').serialize(),
      success: function(data, status, xhr) {
        Allpage.prototype._openMessage('Votre message a été envoyé');
        $('#button_submit').hide();
        $('#formmessage').find('input').attr('disabled', 'disabled');
        $('#formmessage').find('textarea').attr('disabled', 'disabled');
      },
      error: function(err) {
        if (err && err.responseJSON && err.responseJSON.message) {
          Allpage.prototype._openMessage(err.responseJSON.message);
          return null;
        }
        Allpage.prototype._openMessage(err.statusText || null);
      },
    });
  },

  _init8Signaler:function() {
    $('.action-signaler').on('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var adId = $(this).data('id');
      $('body').append('<div class="popin-bg" id="popin-signaler">' +
        '<div class="container">' +
        '<div class="popin col-md-6 col-md-offset-3">' +
        '<div class="row bg-white">' +
        '<form class="form-signaler" method="post" id="form-signaler">' +
        '<div class="col-xs-12 mg-bottom-20 bg-ciel">' +
        '<h3 class="ttl-h3 ttl-h3 txt-white mg-top-20">Signaler le professionnel à la team Babies-pets</h3>' +
        '</div>' +
        '<div class="col-xs-3 txt-16">Raison</div>' +
        '<div class="col-xs-8 mg-bottom-10">' +
        '<select name="raison" class="field">' +
        '<option></option>' +
        '<option value="alert">Arnaque</option>' +
        '<option value="miscategorized">Mauvaise catégorie</option>' +
        '<option value="incomplète">Profil incomplet</option>' +
        '<option value="expired">A fermer</option>' +
        '</select>' +
        '</div>' +
        '<div class="col-xs-3 txt-16">Message</div>' +
        '<div class="col-xs-8">' +
        '<textarea class="field-area field-description" rows="7" cols="45" name="message" id="message"></textarea>' +
        '</div>' +
        '<div class="col-xs-12 col-md-11 mg-bottom-20">' +
        '<button type="button" class="btn float-right" id="btn-submit">Valider</button>' +
        '<button type="button" class="btn float-right mg-right-10 btn-orange" id="btn-cancel">Annuler</button>' +
        '</div>' +
        '</form></div></div></div></div>');
      $('#btn-submit').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $.ajax({
          url:  "/signaler/eleveur/" + adId,
          type: 'post',
          dataType: "json",
          data: $('.form-signaler').serialize(),
          success: function(data, status, xhr) {
            Allpage.prototype._openMessage('Votre signalement a été envoyé');
            $('#popin-signaler').remove();
          },
          error: function(err) {
            if (err && err.responseJSON && err.responseJSON.message) {
              Allpage.prototype._openMessage(err.responseJSON.message);
              return null;
            }
            Allpage.prototype._openMessage(err.statusText || null);
          },
        });
      });
      $('#btn-cancel').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('#popin-signaler').remove();
      });
    });
  },

  _init9Vote:function() {
    var currentPage = $('.action-vote').data('id');
    var currentDate = new Date();
    var title = 'v-' + currentPage + '-' + currentDate.getDay() + '-' + currentDate.getMonth()
    if (Allpage.prototype.getCookie(title)) {
      $('.action-vote').attr('disabled', 'disabled');
      return false;
    }
    $('body').on('click', '.action-vote', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $.ajax({
        url:  "/mon-compte/profil/" + currentPage+"/a-vote",
        type: 'post',
        dataType: "json",
        success: function() {
          Allpage.prototype._openMessage('Vous avez voté pour aujourd\'hui, revenez demain pour voter à nouveau');
          Allpage.prototype.setCookie(title, true);
          $('body').off('click', '.action-vote');
          $('.action-vote').attr('disabled', 'disabled');
        },
        error: function(err) {
          if (err && err.responseJSON && err.responseJSON.message) {
            Allpage.prototype._openMessage(err.responseJSON.message);
            return null;
          }
          Allpage.prototype._openMessage(err.statusText || null);
        },
      });
    });
  },
};

function compteinscription() {}
compteinscription.prototype = {
  _init1CreationForm:function() {
    $.validate({
      lang : 'fr',
      validateOnBlur : true, // disable validation when input looses focus
      errorMessagePosition : 'top',
      scrollToTopOnError : true,
      form : '#form-inscription',
      submitErrorMessageCallback : function(form, errorMessages) {
        if (errorMessages) {
          Allpage.prototype._openMessage('Renseignez les champs en anomalis');
        }
        return false; // prevent default behaviour
      },
      onSuccess : function() {
        compteinscription.prototype._submitForm();
        return false; // Will stop the submission of the form
      },
    });
  },

  /**
   * Change select type.
   * @private
   */
  _init1ChangeType:function() {
    pageannonce.prototype.setValuesForSltProf($( ".field-professional" ).val());
    compteinscription.prototype.setValuesForProf($( ".field-professional" ).val());
    $( ".field-professional" ).on('change', function() {
      pageannonce.prototype.setValuesForSltProf(this.value);
      compteinscription.prototype.setValuesForProf(this.value);
    });
  },

  setValuesForProf:function(val) {
    $('.field-postal').addClass('hidden');
    if (val === "true") {
      $('.field-postal').removeClass('hidden');
    }
  },

  _submitForm:function() {
    $.ajax({
      url:  "/compte/creation",
      type: 'post',
      dataType: "json",
      data: $('.form-inscription').serialize() + "&" + jQuery.param(Singleton.position),
      success: function(data, status, xhr) {
        $.cookie('token', xhr.getResponseHeader("token"), { path: '/',  expires: 1 });
        window.location.href = '/mon-compte/bienvenue';
      },
      error: function(err) {
        if (err && err.responseJSON && err.responseJSON.message) {
          Allpage.prototype._openMessage(err.responseJSON.message);
          return null;
        }
        Allpage.prototype._openMessage(err.statusText || null);
      },
    });
  },

  _init2LoginForm:function() {
    $.validate({
      lang : 'fr',
      validateOnBlur : true, // disable validation when input looses focus
      errorMessagePosition : 'top', // Instead of 'inline' which is default
      scrollToTopOnError : true, // Set this property to true on longer forms
      form : '#form-connexion',
      submitErrorMessageCallback : function(form, errorMessages) {
        if (errorMessages) {
          Allpage.prototype._openMessage('Renseignez les champs en anomalis');
        }
        return false;
      },
      onSuccess : function() {
        compteinscription.prototype._submitLoginForm();
        return false;
      },
    });
  },

  _submitLoginForm:function() {
    $.ajax({
      url:  "/compte/authentification",
      type: 'post',
      dataType: "json",
      data: $('.form-connexion').serialize(),
      success: function(data, status, xhr) {
        $.cookie('token', xhr.getResponseHeader("token"), { path: '/',  expires: 1 });
        // window.location.href = '/mon-compte';
        if (data.favoris && Array.isArray(data.favoris) && data.favoris.length) {
          Allpage.prototype.setCookie('favoris', data.favoris);
        }
        window.location.href = '/mon-compte';
        return false;
      },
      error: function(err) {
        if (err && err.responseJSON && err.responseJSON.message) {
          Allpage.prototype._openMessage(err.responseJSON.message);
          return null;
        }
        Allpage.prototype._openMessage(err.statusText || null);
        return false;
      },
    });
  },

  _init1GetPos:function() {
    if ($.cookie('geolocation')) {
      Singleton.position = JSON.parse($.cookie('geolocation'));
    }
    if (!Singleton.position.userAsked && "geolocation" in navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this.saveMyPosition, this.erreurPosition, {maximumAge: 600000});
    }
  },

  // Get my position.
  saveMyPosition:function(position) {
    Singleton.position = {
      userAsked: true,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    $.cookie('geolocation', JSON.stringify(Singleton.position));
  },

  //Google maps error of position
  erreurPosition:function(error) {
    console.warn(error);
  },
};

function adlist() {};
adlist.prototype = {
  _init1GooglePos:function() {
    adhome.prototype._init4GetPos();
    adhome.prototype._init5BtnsMoreLess();
    adhome.prototype._init12LoadMoreAds();
  },
  _init2Favoris:function() {
    if (!Allpage.prototype.getCookie('favoris')) {
      return false;
    }
    var favoris = Allpage.prototype.getCookie('favoris');
    favoris = favoris.split(",");
    $.ajax({
      url:  "/favoris/list",
      type: 'post',
      data: {
        favoris: favoris.join(),
      },
      success: function(data) {
        $('#mes-favoris').html(data);
        adhome.prototype.setAddonGGL();
        Allpage.prototype._init8LoadPubs();
        Allpage.prototype._setFav();
        Allpage.prototype._init3LoadImage();
      },
    });
  },
};
function adunderlist() {};
adunderlist.prototype = {
  _init1GooglePos:function() {
    adhome.prototype._init4GetPos();
    adhome.prototype._init5BtnsMoreLess();
  }
};

function favorisindex() {};
favorisindex.prototype = {
  _init1Ggl:function() {
    adhome.prototype.setGglmap();
    adhome.prototype._init5BtnsMoreLess();
  }
};
function adindex() {};
adindex.prototype = {
  map: null,
  _init1ShareSocial:function() {
    $('.btn-share').on('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $('.btns-annonces').removeClass('active');
      $('.bloc-annonces').addClass('hidden');
      if ($(this).hasClass('active')) {
        $(this).removeClass('active');
        $('.bloc-share-social').addClass('hidden');
      } else {
        $(this).addClass('active');
        $('.bloc-share-social').removeClass('hidden');
      }
    });
  },
  _init2Localisation:function() {
    $('.btn-localisation').on('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $('.btns-annonces').removeClass('active');
      $('.bloc-annonces').addClass('hidden');
      if ($(this).hasClass('active')) {
        $(this).removeClass('active');
        $('.bloc-localisation').addClass('hidden');
      } else {
        $(this).addClass('active');
        $('.bloc-localisation').removeClass('hidden');
      }
    });
  },
  _init3Inscription:function() {
    $('.btn-write').on('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $('.btns-annonces').removeClass('active');
      $('.bloc-annonces').addClass('hidden');
      if ($(this).hasClass('active')) {
        $(this).removeClass('active');
        $('.bloc-commentaire').addClass('hidden');
      } else {
        $(this).addClass('active');
        $('.bloc-commentaire').removeClass('hidden');
      }
    });
  },

  _init4Geopos:function() {
    var latlng;
    var t = this;
    var setMyPos = true;
    var mapDiv = $('#map');
    if (mapDiv.data('lat') && mapDiv.data('long') ) {
      latlng = new google.maps.LatLng(mapDiv.data('lat'), mapDiv.data('long'));
    } else {
      setMyPos = false;
      latlng = new google.maps.LatLng('48.8370989', '2.3666065');
    }
    t.map = new google.maps.Map(document.getElementById("map"), {
      center: latlng,
      zoom: 10,
      zoomControl: true,
      scaleControl: true,
      rotateControl: true,
      streetViewControl: false,
      mapTypeControl: true,
      scrollwheel: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    this.infowindow = new google.maps.InfoWindow({
      content: ''
    });
    /**
     * Ajout d'un marqueur à la position trouvée
     */
    var marker = new google.maps.Marker({
      position: latlng,
      map: t.map,
      title: "Lieu de l'annonce"
    });
    marker.addListener('mouseover', function () {
      t.infowindow.setContent(this.title);
      t.infowindow.open(t.map, this);
    });
    marker.addListener('mouseout', function () {
      t.infowindow.close();
    });
    this.map.panTo(latlng);
    // Ajout d'un marqueur pour la position de l'utilisateur
    if ($.cookie('geolocation')) {
      Singleton.position = JSON.parse($.cookie('geolocation'));
    }
    if (Singleton.position.latitude && Singleton.position.longitude) {
      latlng = new google.maps.LatLng(Singleton.position.latitude, Singleton.position.longitude);
    } else {
      latlng = new google.maps.LatLng('48.8869264', '2.3666065');
    }
    marker = new google.maps.Marker({
      position: latlng,
      map: t.map,
      title: 'Vous êtes ici',
    });
    marker.addListener('mouseover', function () {
      t.infowindow.setContent(this.title);
      t.infowindow.open(t.map, this);
    });
    marker.addListener('mouseout', function () {
      t.infowindow.close();
    });
  },

  _init5Carousel:function() {
    $('body').on('click', '.example-image-link', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $('.youtube').remove();
      $('.grosplan').removeClass('hidden').attr('src', $(this).attr('href'));
    });
  },

  _init6MessageForm:function() {
    $.validate({
      lang : 'fr',
      validateOnBlur : true, // disable validation when input looses focus
      errorMessagePosition : 'top', // Instead of 'inline' which is default
      scrollToTopOnError : true, // Set this property to true on longer forms
      form : '#formmessage',
      submitErrorMessageCallback : function($form, errorMessages) {
        if (errorMessages) {
          Allpage.prototype._openMessage('Renseignez les champs en anomalis');
        }
        return false; // prevent default behaviour
      },
      onSuccess : function($form) {
        adindex.prototype._submitForm();
        return false; // Will stop the submission of the form
      },
    });
  },
  _init7Signaler:function() {
    $('.action-signaler').on('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var adId = $(this).data('id');
      $('body').append('<div class="popin-bg" id="popin-signaler">' +
        '<div class="container">' +
        '<div class="popin col-xs-6 col-xs-offset-3">' +
        '<div class="row bg-white">' +
        '<form class="form-signaler" method="post" id="form-signaler">' +
        '<div class="col-xs-12 mg-bottom-20 bg-ciel">' +
        '<h3 class="ttl-h3 ttl-h3 txt-white mg-top-20">Signaler l\'annonce à la team Babies-pets</h3>' +
        '</div>' +
        '<div class="col-xs-3 txt-16">Raison</div>' +
        '<div class="col-xs-8 mg-bottom-10">' +
        '<select name="raison" class="field">' +
        '<option></option>' +
        '<option value="alert">Arnaque</option>' +
        '<option value="miscategorized">Mauvaise catégorie</option>' +
        '<option value="incomplète">Annonce incomplète</option>' +
        '<option value="expired">Expirée</option>' +
        '</select>' +
        '</div>' +
        '<div class="col-xs-3 txt-16">Message</div>' +
        '<div class="col-xs-8">' +
        '<textarea class="field-area field-description" rows="7" cols="45" name="message" id="message"></textarea>' +
        '</div>' +
        '<div class="col-xs-11 mg-bottom-20">' +
        '<button type="button" class="btn float-right" id="btn-submit">Valider</button>' +
        '<button type="button" class="btn float-right mg-right-10 btn-orange" id="btn-cancel">Annuler</button>' +
        '</div>' +
        '</form>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>');
      $('#btn-submit').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $.ajax({
          url:  "/signaler/" + adId,
          type: 'post',
          dataType: "json",
          data: $('.form-signaler').serialize(),
          success: function(data, status, xhr) {
            Allpage.prototype._openMessage('Votre signalement a été envoyé');
            $('#popin-signaler').remove();
          },
          error: function(err) {
            if (err && err.responseJSON && err.responseJSON.message) {
              Allpage.prototype._openMessage(err.responseJSON.message);
              return null;
            }
            Allpage.prototype._openMessage(err.statusText || null);
          },
        });
      });
      $('#btn-cancel').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('#popin-signaler').remove();
      });
    });
  },
  _submitForm:function() {
    $.ajax({
      url:  "/ecrire",
      type: 'post',
      dataType: "json",
      data: $('.form-message').serialize(),
      success: function(data, status, xhr) {
        Allpage.prototype._openMessage('Votre message a été envoyé');
        $('#button_submit').hide();
        $('#formmessage').find('input').attr('disabled', 'disabled');
        $('#formmessage').find('textarea').attr('disabled', 'disabled');
      },
      error: function(err) {
        if (err && err.responseJSON && err.responseJSON.message) {
          Allpage.prototype._openMessage(err.responseJSON.message);
          return null;
        }
        Allpage.prototype._openMessage(err.statusText || null);
      },
    });
  },
};

function pagebienvenue() {};
function pageannonce() {};
pageannonce.prototype = {
  bannersUploaded: [],
  currentFile: {},
  coordinates: {
    x: 0,
    y: 0,
  },
  setValuesForSltType:function(val) {
    $('.undetype').addClass('hidden');
    $('.field-portee').addClass('hidden');
    $('.field-portee').addClass('hidden');
    $('.select-' + val).removeClass('hidden');
    if (val === 'chiens' || val === 'chats') {
      $('.field-portee').removeClass('hidden');
    }
  },

  setValuesForSltProf:function(val) {
    $('.field-siren').addClass('hidden');
    if (val === "true") {
      $('.field-siren').removeClass('hidden');
    }
  },
  /**
   * Change select type.
   * @private
   */
  _init1ChangeType:function() {
    pageannonce.prototype.setValuesForSltType($( ".select-type" ).val());
    $( ".select-type" ).on('change', function() {
      pageannonce.prototype.setValuesForSltType(this.value);
    });
    pageannonce.prototype.setValuesForSltProf($( ".field-professional" ).val());
    $( ".field-professional" ).on('change', function() {
      pageannonce.prototype.setValuesForSltProf(this.value);
    });
  },

  _init1GetPos:function() {
    if ($.cookie('geolocation')) {
      Singleton.position = JSON.parse($.cookie('geolocation'));
    }
    if (!Singleton.position.userAsked && "geolocation" in navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this.saveMyPosition, this.erreurPosition, {maximumAge: 600000});
    }
  },

  /**
   * Get my position.
   */
  saveMyPosition:function(position) {
    Singleton.position = {
      userAsked: true,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    $.cookie('geolocation', JSON.stringify(Singleton.position));
  },

  /**
   * Google maps error of position
   * @param error
   */
  erreurPosition:function(error) {
    console.warn(error);
  },

  /**
   * If an annonce already created but not finish
   * @private
   */
  _init1SignedCookies:function() {
    if (Allpage.prototype.getCookie('oldAnnonce')) {
      var t = this;
      var search =  Allpage.prototype.getCookie('oldAnnonce');
      var ss = {};
      try {
        ss = JSON.parse('{"' + decodeURIComponent(search)
            .replace(/"/g, '\\"')
            .replace(/%40/g, '","')
            .replace(/&/g, '","')
            .replace(/\+/g, ' ')
            .replace(/=/g,'":"') + '"}');
      } catch(err) {
        console.warn(err);
      }
      for (var s in ss) {
        $("[name='" + s + "']").val(ss[s]);
      }
      pageannonce.prototype.setValuesForSltType($(".select-type").val());
      pageannonce.prototype.setValuesForSltProf($(".field-professional").val());
      if (ss.list && ss.list.length > 10) {
        $.ajax({
          url:  "/mon-compte/my-upload-files",
          type: 'POST',
          dataType: "json",
          data: {
            list: ss.list
          },
          success: function(data) {
            if (!data || !data.images) {
              return false;
            }
            data.images.forEach(function(e) {
              t._setTemlate(e.path || '', e.id || '');
            });
          },
          error: function(err) {
            console.warn(err);
          },
        });
      }
    }
  },

  _init2ValidationForm:function() {
    $.validate({
      lang : 'fr',
      validateOnBlur : true, // disable validation when input looses focus
      errorMessagePosition : 'top', // Instead of 'inline' which is default
      scrollToTopOnError : true, // Set this property to true on longer forms
      form : '#form-annonce',
      submitErrorMessageCallback : function($form, errorMessages) {
        if (errorMessages) {
          Allpage.prototype._openMessage('Renseignez les champs en anomalis');
        }
        return false; // prevent default behaviour
      },
      onSuccess : function($form) {
        pageannonce.prototype._submitForm();
        return false; // Will stop the submission of the form
      },
    });
  },

  canvasToBlob:function(canvas, type) {
    var byteString = atob(canvas.toDataURL().split(",")[1]),
      ab = new ArrayBuffer(byteString.length),
      ia = new Uint8Array(ab),
      i;
    for (i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {
      type: type
    });
  },

  sendFile:function(img) {
    var t = this;
    var id = Allpage.prototype.guid();
    var file = $('<div class="col-xs-12 col-sm-4 bloc-banner mg-bottom-20" id="tempfile-' + id + '"/>')
      .append('<div class="loader">Loading...</div>')
      .append('<div class="loader-txt">Chargement de l\'image</div>')
      .append(img)
      .appendTo('#files');
    var data = new FormData();
    data.append("images",
      pageannonce.prototype.canvasToBlob(img, pageannonce.prototype.currentFile.type || 'image/jpeg'),
      pageannonce.prototype.currentFile.name

    );
    $('#popin-thumb-edit').remove();
    $.ajax({
      url: '/annonce/upload',
      data: data,
      type:  "POST",
      contentType: false, // obligatoire pour de l'upload
      processData: false, // obligatoire pour de l'upload
      dataType: 'json', // selon le retour attendu
      success: function (response) {
        if (!response || !response.file || !response.id) {
          Allpage.prototype._openMessage("Une erreur est survenue, veuillez reessayer");
          return;
        }
        file.remove();
        t._setTemlate(response.file, response.id);
      }
    });
  },

  endResult:function(img) {
    if (!(img.src || img
      instanceof HTMLCanvasElement)) {
      Allpage.prototype._openMessage('Le chargement de l\image a échoué');
      $('#popin-thumb-edit').remove();
      return false;
    }
    $('#thumb-content-data').html(img);
    var canvas = $('#thumb-content-data').find('img, canvas');
    canvas.addClass('img-responsive').width('319px').height('239px');

    var ctx = canvas.get(0).getContext('2d');
    var logo = new Image();
    logo.src = '/img/logo-photo.png';
    logo.onload = function()
    {
      ctx.drawImage(logo, 10, 10, 140, 50);
      pageannonce.prototype.sendFile(canvas.get(0));
    }
  },

  createPopin:function(img) {
    $('#popin-thumb-edit').remove();
    $('body').append('<div class="popin-bg" id="popin-thumb-edit">' +
        '<div class="container">' +
          '<div class="popin col-xs-10 col-xs-offset-1">' +
            '<div class="row thumb-content-data" id="thumb-content-data" ></div>' +
            '<div class="row bg-white thumb-content">' +
              '<p class="txt-18 thumb-ttl mg-left-20" style="float: left; width: 300px;"><i>Redimensionnez votre image</i></p>' +
              '<button type="button" class="btn float-right" id="btn-crop-thumb">Valider</button>' +
              '<button type="button" class="btn float-right mg-right-10 btn-orange" id="btn-crop-cancel">Annuler</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>');

    $('#thumb-content-data').html(img);
    var imgNode = $('#thumb-content-data').find('img, canvas');
    imgNode.addClass('img-responsive');

    $('#btn-crop-thumb').on('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var pixelRatio = window.devicePixelRatio || 1;
      if (img && pageannonce.prototype.coordinates) {
        $('#popin-thumb-edit').hide();
        pageannonce.prototype.endResult(loadImage.scale(imgNode[0], {
          left: pageannonce.prototype.coordinates.x * pixelRatio,
          top: pageannonce.prototype.coordinates.y * pixelRatio,
          sourceWidth: pageannonce.prototype.coordinates.w * pixelRatio,
          sourceHeight: pageannonce.prototype.coordinates.h * pixelRatio,
          minWidth: 683,
          maxWidth: 683,
          minHeight: 511,
          maxHeight: 511,
          meta: true,
          pixelRatio: pixelRatio,
          downsamplingRatio: 0.5
        }));
        pageannonce.prototype.coordinates = null;
      }
    });
    $('#btn-crop-cancel').on('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $('#popin-thumb-edit').remove();
      $('#fileupload').val("");
      return false;
    });
    return imgNode;
  },

  updateResults:function(img) {
    if (!(img.src || img instanceof HTMLCanvasElement)) {
      Allpage.prototype._openMessage('Le chargement de l\image a échoué');
      return false;
    }
    var imgNode = pageannonce.prototype.createPopin(img);
    if (img.getContext) {
      imgNode.Jcrop({
        aspectRatio: 1.335,
        bgColor: 'black',
        bgOpacity: .4,
        minSize: [136, 102],
        setSelect: [
          0,
          0,
          img.width,
          img.height
        ],
        onSelect: function (coords) {
          pageannonce.prototype.coordinates = coords;
        },
        onRelease: function () {
          pageannonce.prototype.coordinates = null;
        }
      });
    }
  },

  displayImage:function(file) {
    pageannonce.prototype.currentFile = file;
    if (!loadImage(file, pageannonce.prototype.updateResults, {
        maxWidth: 800,
        maxHeight: 500,
        minWidth: 600,
        minHeight: 400,
        canvas: true,
        pixelRatio: window.devicePixelRatio,
        downsamplingRatio: 0.5,
        orientation: true,
      }))
    {
      Allpage.prototype._openMessage('Votre navigateur ne supporte pas des URLs');
    }
  },

  dropChangeHandler:function(e) {
    e.preventDefault();
    e.stopPropagation();

    var _e = e.originalEvent;
    var target = _e.dataTransfer || _e.target;
    var file = target && target.files && target.files[0];
    if (!file) {
      return;
    }
    pageannonce.prototype.displayImage(file);
  },

  /**
   * Load image
   * @private
   */
  _init3LoadImage:function() {
    try {
      $('#fileupload').on('change', pageannonce.prototype.dropChangeHandler);
    } catch(err) {
      Allpage.prototype.logger('pageannonce::_init3LoadImage :: ' + err);
    }
  },

  _init4Quit:function() {
    window.onbeforeunload = function test() {
      Allpage.prototype.setCookie('oldAnnonce', $('.form-annonce').serialize());
    };
  },

  /**
   * Set template for each banners.
   * @param container
   * @param file
   * @param format
   * @private
   */
  _setTemlate:function(file, id) {
    this.bannersUploaded.push(id);
    $('#list-values').val(this.bannersUploaded.join());
    var t = this;

    var img = $('<img/>', {
        src: file,
        id: id,
        alt: "Nouvelle photo pour l'annonce",
        class: 'bann-uploaded img-responsive',
      }),
    container = $('<div class="' + 'col-xs-12 col-sm-4'  +' bloc-banner  mg-bottom-20" data-url="' + file + '" id="tempfile-' + id + '"/>'),
    closeBtn =  $('<a class="action-close btn-close sprite-before close" title="Supprimer la bannière"></a>');
    closeBtn.appendTo(container);
    img.appendTo(container);
    container.appendTo($('#files'));
    $('#tempfile-' + id).on('click', '.action-close', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $('#tempfile-' + id).remove();
      t.bannersUploaded.splice(t.bannersUploaded.indexOf(id), 1);
      $('#list-values').val(t.bannersUploaded.join());
    });
    setTimeout(function(){
      $("#" + id).attr("src", file);
    }, 1000);
  },

  popinAccount:function() {
    $.ajax({
      url:  "/popin/account",
      type: 'GET',
      success: function(data) {
        if (!data) {
          return false;
        }
        $('body').append(data);
        $('#popin-account').on('click', '.action-close', function(e) {
          e.preventDefault();
          e.stopPropagation();
          $('#popin-account').remove();
        });
        $('#popin-account').on('click', '#button-connexion', function(e) {
          e.preventDefault();
          e.stopPropagation();
          pageannonce.prototype._submitLoginForm();
        });
      },
      error: function(err) {},
    });
  },

  _loginForm:function() {
    $.validate({
      lang : 'fr',
      validateOnBlur : true, // disable validation when input looses focus
      errorMessagePosition : 'top', // Instead of 'inline' which is default
      scrollToTopOnError : true, // Set this property to true on longer forms
      form : '#form-connexion',
      submitErrorMessageCallback : function(form, errorMessages) {
        if (errorMessages) {
          Allpage.prototype._openMessage('Renseignez les champs en anomalis');
        }
        return false;
      },
      onSuccess : function() {
        pageannonce.prototype._submitLoginForm();
        return false;
      },
    });
  },

  _submitLoginForm:function() {
    $.ajax({
      url:  "/compte/authentification",
      type: 'post',
      dataType: "json",
      data: $('.form-connexion').serialize(),
      success: function(data, status, xhr) {
        $.cookie('token', xhr.getResponseHeader("token"), { path: '/',  expires: 1 });
        if (data.favoris && Array.isArray(data.favoris) && data.favoris.length) {
          Allpage.prototype.setCookie('favoris', data.favoris);
        }

        $('#popin-account').remove();
        $('#bloc-authentification').remove();

        Allpage.prototype._openMessage('Vous êtes maintenant authentifié');
        return false;
      },
      error: function(err) {
        if (err && err.responseJSON && err.responseJSON.message) {
          Allpage.prototype._openMessage(err.responseJSON.message);
          return null;
        }
        Allpage.prototype._openMessage(err.statusText || null);
        return false;
      },
    });
  },

  _submitForm:function() {
    $('#list-values').val(this.bannersUploaded.join());
    $.ajax({
      url:  "/annonce/soumettre",
      type: 'post',
      dataType: "json",
      data: $('.form-annonce').serialize() + "&" + jQuery.param(Singleton.position),
      success: function(data, status, xhr) {
        Allpage.prototype.compteCreate(xhr);
        Allpage.prototype._openMessage(data.message || "Votre compte et votre annonce ont été créés");
        setTimeout(function(){
          window.location.replace('/mon-compte/compte-cree-et-annonce-soumise');
        }, 2000);
      },
      error: function(err) {
        Allpage.prototype.compteAlreadyExist(err, $('.form-annonce'));
      },
    });
  },
  _init4Formater:function() {
    $('#detail').trumbowyg({
      btns: [
        ['bold', 'italic', 'underline'],
        'btnGrp-justify',
        'unorderedList',
        ['fullscreen']
      ],
      removeformatPasted: true,
      autogrow: true
    });
  },
  // pageannonce
  _init5GetToffIds:function() {
    $('#files').find('.bloc-banner').each(function( index ) {
      pageannonce.prototype.bannersUploaded.push($( this ).attr('id'));
    });
    $('#list-values').val(pageannonce.prototype.bannersUploaded.join());
  },
};

function adedit() {};
adedit.prototype = {
  currentFile: {},
  coordinates: {
    x: 0,
    y: 0,
  },

  /**
   * Load image
   * @private
   */
  _init2DownloadImage:function() {
    try {
      $('#fileupload').on('change', pageannonce.prototype.dropChangeHandler);
    } catch(err) {
      Allpage.prototype.logger('adedit::_init2DownloadImage :: ' + err);
    }
  },

  _init5GetToffIds:function() {
    pageannonce.prototype._init5GetToffIds();
  },

  _init2ValidationForm:function() {
    $.validate({
      lang : 'fr',
      validateOnBlur : true, // disable validation when input looses focus
      errorMessagePosition : 'top', // Instead of 'inline' which is default
      scrollToTopOnError : true, // Set this property to true on longer forms
      form : '#form-annonce',
      submitErrorMessageCallback : function($form, errorMessages) {
        if (errorMessages) {
          Allpage.prototype._openMessage('Renseignez les champs en anomalis');
        }
        return false; // prevent default behaviour
      },
      onSuccess : function($form) {
        adedit.prototype._submitForm();
        return false; // Will stop the submission of the form
      },
    });
  },

  _init3DeleteToff:function() {
    var t = this;
    $('.action-close').on('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var id = $(this).data('id');
      pageannonce.prototype.bannersUploaded.splice(pageannonce.prototype.bannersUploaded.indexOf(id), 1);
      $('#list-values').val(pageannonce.prototype.bannersUploaded.join());
      $('#'+ id).remove();
    });
  },

  _submitForm:function() {
    $('#list-values').val(pageannonce.prototype.bannersUploaded.join());
    $.ajax({
      url:  "/annonce/edit/" + $('#form-annonce').data('id'),
      type: 'post',
      dataType: "json",
      data: $('.form-annonce').serialize(),
      success: function(data, status, xhr) {
        Allpage.prototype.compteCreate(xhr);
        Allpage.prototype._openMessage('L\'annonce a bien été modifée, la team Babies-pets va valider les modifications');
      },
      error: function(err) {
        Allpage.prototype.compteAlreadyExist(err, $('.form-annonce'));
      },
    });
  },

  _init5Cloture:function() {
    $('#cloture').on('click', function(e) {
      $.ajax({
        url:  "/annonce/cloture/" + $('#form-annonce').data('id'),
        type: 'post',
        dataType: "json",
        data: 'cloture=' + ($('#cloture').prop('checked') ? 1 : 0),
        success: function(data) {
          Allpage.prototype._openMessage(data.message);
        },
        error: function(err) {
          if (err && err.responseJSON && err.responseJSON.message) {
            Allpage.prototype._openMessage(err.responseJSON.message);
            return null;
          }
          Allpage.prototype._openMessage(err.statusText || null);
        },
      });
    });
  },

  _init4Formater:function() {
    $('#detail').trumbowyg({
      btns: [
        ['bold', 'italic', 'underline'],
        'btnGrp-justify',
        'unorderedList',
        ['fullscreen']
      ],
      removeformatPasted: true,
      autogrow: true
    });
  },
};

function comptedepartement() {};
comptedepartement.prototype = {};

function eleveurdepartement() {};
eleveurdepartement.prototype = {};

function eleveurrecuperation() {};
eleveurrecuperation.prototype = {
  imgUploaded: "",
  coordinates: {
    x: 0,
    y: 0,
  },
  currentFile: {},
  _init1getPos:function() {
    pageannonce.prototype._init1GetPos();
  },
  _init1ChangeType:function() {
    eleveurcreation.prototype._init1ChangeType();
  },
  _init1LoadImage:function() {
    eleveurcreation.prototype._init1LoadImage();
  },
  _init1SignedCookies:function() {
    pageannonce.prototype._init1SignedCookies();
  },
  _init1CompteForm: function() {
    $.validate({
      lang : 'fr',
      validateOnBlur : true, // disable validation when input looses focus
      errorMessagePosition : 'top',
      scrollToTopOnError : true,
      form : '#form-inscription',
      submitErrorMessageCallback : function(form, errorMessages) {
        if (errorMessages) {
          Allpage.prototype._openMessage('Renseignez les champs en anomalis');
        }
        return false; // prevent default behaviour
      },
      onSuccess : function() {
        eleveurrecuperation.prototype._submitForm();
        return false; // Will stop the submission of the form
      },
    });
  },

  _submitForm:function() {
    $.ajax({
      url:  "/mon-compte/eleveur/reassign",
      type: 'post',
      dataType: "json",
      data: $('.form-inscription').serialize(),
      success: function(data, status, xhr) {
        Allpage.prototype.compteCreate(xhr);
        Allpage.prototype._openMessage(data.message || 'Votre compte a été créé et la page a bien été associée à votre compte');
        setTimeout(function(){
          window.location.replace('/mon-compte');
        }, 2000);
      },
      error: function(err) {
        Allpage.prototype.compteAlreadyExist(err, $('.form-inscription'));
      },
    });
  },

  _init4Formater:function() {
    compteindex.prototype._init4Formater();
  },

  _init5GetToffIds:function() {
    pageannonce.prototype._init5GetToffIds();
  },
};

function eleveurcreation() {}
eleveurcreation.prototype = {
  bannersUploaded: [],
  currentFile: {},
  coordinates: {
    x: 0,
    y: 0,
  },

  _init1ChangeType:function() {
    eleveurcreation.prototype.setFieldsWithCat($( ".field-categorie" ).val());
    $( ".field-categorie" ).on('change', function() {
      eleveurcreation.prototype.setFieldsWithCat(this.value);
      pageannonce.prototype.setValuesForSltType($( ".select-type" ).val());
    });
    pageannonce.prototype.setValuesForSltType($( ".select-type" ).val());
    $( ".select-type" ).on('change', function() {
      pageannonce.prototype.setValuesForSltType(this.value);
    });
  },

  setFieldsWithCat:function(val) {
    $('.field-type').addClass('hidden');
    if (val === "Eleveur") {
      $('.field-type').removeClass('hidden');
    }
  },

  _init5GetToffIds:function() {
    pageannonce.prototype._init5GetToffIds();
  },
  /**
   * Load image
   * @private
   */
  _init1LoadImage:function() {
    try {
      $('#fileupload').on('change', pageannonce.prototype.dropChangeHandler);
    } catch(err) {
      Allpage.prototype.logger('eleveurcreation::_init1LoadImage :: ' + err);
    }
  },

  _init3CompteForm: function() {
    $.validate({
      lang : 'fr',
      validateOnBlur : true, // disable validation when input looses focus
      errorMessagePosition : 'top',
      scrollToTopOnError : true,
      form : '#form-inscription',
      submitErrorMessageCallback : function(form, errorMessages) {
        if (errorMessages) {
          Allpage.prototype._openMessage('Renseignez les champs en anomalis');
        }
        return false; // prevent default behaviour
      },
      onSuccess : function() {
        eleveurcreation.prototype._submitForm();
        return false; // Will stop the submission of the form
      },
    });
  },

  _submitForm:function() {
    $.ajax({
      url:  "/mon-compte/eleveur/edit",
      type: 'post',
      dataType: "json",
      data: $('.form-edition').serialize(),
      success: function(data, status, xhr) {
        Allpage.prototype._openMessage('Les informations de votre page ont bien été modifiées');
      },
      error: function(err) {
        if (err && err.responseJSON && err.responseJSON.message) {
          Allpage.prototype._openMessage(err.responseJSON.message);
          return null;
        }
        Allpage.prototype._openMessage(err.statusText || null);
      },
    });
  },

  _init4Formater:function() {
    compteindex.prototype._init4Formater();
  },
};

function comptegetmypassword() {};
comptegetmypassword.prototype = {
  _init1ValidationForm:function() {
    $.validate({
      lang : 'fr',
      validateOnBlur : true, // disable validation when input looses focus
      errorMessagePosition : 'top', // Instead of 'inline' which is default
      scrollToTopOnError : true, // Set this property to true on longer forms
      form : '#form-lostpassword',
      submitErrorMessageCallback : function($form, errorMessages) {
        if (errorMessages) {
          Allpage.prototype._openMessage("Email en cours d'envoi");
        }
        return false; // prevent default behaviour
      },
      onSuccess : function($form) {
        comptegetmypassword.prototype._submitForm();
        return false; // Will stop the submission of the form
      },
    });
  },

  _submitForm:function() {
    $.ajax({
      url:  "/mon-compte/renvoyer",
      type: 'post',
      dataType: "json",
      data: $('.form-lostpassword').serialize(),
      success: function() {
        Allpage.prototype._openMessage('Votre mot de passe vous a bien été envoyé');
      },
      error: function(err) {
        if (err && err.responseJSON && err.responseJSON.message) {
          Allpage.prototype._openMessage(err.responseJSON.message);
          return null;
        }
        Allpage.prototype._openMessage(err.statusText || null);
      },
    });
  },
};

function especeraces() {}
especeraces.prototype = {
  allNews: false,
  title: '',
  currentURL: '',
  type: '',
  name: '',
  page: 1,
  waiting: false,
  /**
   * Init filed type
   * @private
   */
  _init1Search:function() {
    especeraces.prototype.page = $('.bloc-list-fiches').data('page');
    especeraces.prototype.type = $('.bloc-list-fiches').data('type');
    $( '#especename' ).easyAutocomplete({
      url: function() {
        especeraces.prototype.type = $("[name='type']").val();
        return "/especes/list?type=" + especeraces.prototype.type;
      },
      getValue: "name",
      list: {
        onClickEvent: function() {
          especeraces.prototype.name = $("#especename").val();
          especeraces.prototype.loadContent({name: especeraces.prototype.name});
        },
        match: {
          enabled: true
        }
      },
      theme: "square"
    });
  },

  _init2NextBTN:function() {
    $('body').on('click', '.action-next-fiches', function(e) {
      e.preventDefault();
      e.stopPropagation();
      adhome.prototype._disableScroll();
      $('html, body').animate({scrollTop: $('.bloc-list-fiches').offset().top + $('.bloc-list-fiches').height() -120}, 10);
      especeraces.prototype.waiting = true;
      setTimeout("especeraces.prototype._loadContentOnScroll()", 200);
    });
  },

  loadContent:function(data) {
    especeraces.prototype.allNews = false;
    especeraces.prototype.page = 1;
    $.ajax({
      url: '/especes/load',
      type: 'post',
      data: data,
      cache: true,
      dataType: 'html',
      success: function(html) {
        $( "#results" ).html( html );
        Allpage.prototype._init3LoadImage();
      },
      error: function() {
        // $.removeCookie('token');
      },
    });
  },

  isDogType:function(val) {
    if (val !== 'chiens') {
      $('.bloc-group').hide();
    } else {
      $('.bloc-group').show();
    }
  },

  _init2Type: function() {
    especeraces.prototype.isDogType($('#field-type').val());
    $('body').on('change', '#field-type', function() {
      especeraces.prototype.type = this.value;
      especeraces.prototype.loadContent({type: especeraces.prototype.type});
      especeraces.prototype.isDogType(especeraces.prototype.type);

      if (especeraces.prototype.type !== 'all') {
        especeraces.prototype.title = 'Babies Pets - liste des type de ' + especeraces.prototype.type;
        especeraces.prototype.currentURL = '/especes/' + especeraces.prototype.type;

      } else {
        especeraces.prototype.title = 'Babies Pets - liste des type de tous les animaux domestiques';
        especeraces.prototype.currentURL = '/especes';
      }

      Allpage.prototype.changehistory(especeraces.prototype.title, especeraces.prototype.currentURL);
    });
  },

  _init3Group: function() {
    $('body').on('change', '#field-group', function() {
      var search = {
        type: 'chiens'
      };
      if (this.value != '') {
        search.group = this.value;
        especeraces.prototype.title = 'Babies Pets - liste des type de chiens de catégories ' + this.value;
        especeraces.prototype.currentURL = '/especes/chiens/' + this.value;

      } else {
        especeraces.prototype.title = 'Babies Pets - liste des type de chiens';
        especeraces.prototype.currentURL = '/especes/chiens';
      }

      Allpage.prototype.changehistory(especeraces.prototype.title, especeraces.prototype.currentURL);
      especeraces.prototype.loadContent(search);
    });
  },

  _init12LoadMoreFiches:function() {
    $(window).scroll(function() {
      if($(window).scrollTop() + $(window).height() == $(document).height() && especeraces.prototype.allNews === false && especeraces.prototype.waiting === false) {
        adhome.prototype._disableScroll();
        $('html, body').animate({scrollTop: $('.bloc-list-fiches').offset().top + $('.bloc-list-fiches').height() -120}, 10);
        especeraces.prototype.waiting = true;
        setTimeout("especeraces.prototype._loadContentOnScroll()", 200);
      }
    });
  },

  _loadContentOnScroll:function() {
    especeraces.prototype.page ++;
    $('.bloc-list-fiches').data('page', especeraces.prototype.page);

    var query = 'page=' + especeraces.prototype.page + (especeraces.prototype.type === 'all' ? '' : '&type=' + especeraces.prototype.type);
    $.ajax({
      url:  "/especes/load",
      type: 'post',
      data: query,
      success: function(data) {
        especeraces.prototype.waiting = false;
        Allpage.prototype.changehistory(
          especeraces.prototype.title + ', page ' + especeraces.prototype.page,
          especeraces.prototype.currentURL + '?' + 'page=' + especeraces.prototype.page
        );

        $('.bloc-list-fiches').append(data);
        setTimeout("adhome.prototype._enableScroll()", 1300);
        Allpage.prototype._init8LoadPubs();
        Allpage.prototype._init3LoadImage();
      },
      error: function() {
        especeraces.prototype.waiting = false;
        especeraces.prototype.allNews = true;
        $('.action-next-btn').remove();
        adhome.prototype._enableScroll();
      },
    });
  },

  _disableScroll: function() {
    if (window.addEventListener) { // older FF
      window.addEventListener('DOMMouseScroll', this._preventDefault, false);
    }
    window.onwheel = this._preventDefault; // modern standard
    window.onmousewheel = document.onmousewheel = this._preventDefault; // older browsers, IE
    window.ontouchmove  = this._preventDefault; // mobile
    document.onkeydown  = this._preventDefaultForScrollKeys;
  },
};

function eleveurannuaires() {};
eleveurannuaires.prototype = {

  /**
   * Init filed type
   * @private
   */
  _init1Search:function() {
    $( '#especename' ).easyAutocomplete({
      url: function() {
        return "/especes/list?type=" + $("[name='type']").val();
      },
      list: {
        onClickEvent: function() {
           $("#especename").val();
        },
        match: {
          enabled: true
        }
      },
      theme: "square"
    });
  },

  _init2Selection: function() {
    $('body').on('change', '#field-type',  function() {
      if (this.value != '' && this.value !== 'all') {
        document.location.href = '/categorie/' + this.value;
      }
    });
  },

  _init3MostVoted:function() {
    $.ajax({
      url:  "/eleveurs/top-vote",
      type: 'get',
      cache: false,
      success: function(data) {
        $('#most-voted').html(data);
      },
      error: function(err) {
        $('#more-voted').html('aucun vote');
      },
    });
  },
};

function especeadd() {};
especeadd.prototype = {
  imgUploaded: "",
  coordinates: {
    x: 0,
    y: 0,
  },
  currentFile: {},
  _init1getPos:function() {
    pageannonce.prototype._init1GetPos();
  },

  _init1SignedCookies:function() {
    pageannonce.prototype._init1SignedCookies();
  },

  _init1ValidationForm:function() {
    $.validate({
      lang : 'fr',
      validateOnBlur : true, // disable validation when input looses focus
      errorMessagePosition : 'top', // Instead of 'inline' which is default
      scrollToTopOnError : true, // Set this property to true on longer forms
      form : '#form-annonce',
      submitErrorMessageCallback : function($form, errorMessages) {
        if (errorMessages) {
          Allpage.prototype._openMessage(errorMessages);
        }
        return false; // prevent default behaviour
      },
      onSuccess : function($form) {
        especeadd.prototype._submitForm();
        return false; // Will stop the submission of the form
      },
    });
  },

  /**
   * Google maps error of position
   * @param error
   */
  erreurPosition:function(error) {
    console.warn(error);
  },

  _submitForm:function() {
    $.ajax({
      url:  "/especes/add-espece",
      type: 'post',
      dataType: "json",
      data: $('.form-annonce').serialize(),
      success: function(data, status, xhr) {
        Allpage.prototype.compteCreate(xhr);
        Allpage.prototype._openMessage("Merci pour la fiche, un modérateur va la valider d'ici 48h");
      },
      error: function(err) {
        Allpage.prototype.compteAlreadyExist(err, $('.form-annonce'));
      },
    });
  },

  _init4Formater:function() {
    compteindex.prototype._init4Formater();
  },

  sendFile:function(img) {
    var t = this;
    var id = Allpage.prototype.guid();
    var file = $('<div class="col-xs-12 col-sm-4 bloc-banner mg-bottom-20" id="tempfile-' + id + '"/>')
      .append('<div class="loader">Loading...</div>')
      .append('<div class="loader-txt">Chargement de l\'image</div>')
      .append(img)
      .appendTo('#files');
    var data = new FormData();
    data.append("images",
      pageannonce.prototype.canvasToBlob(img, especeadd.prototype.currentFile.type || 'image/jpeg'),
      especeadd.prototype.currentFile.name
    );
    $('#popin-thumb-edit').remove();
    $.ajax({
      url: '/especes/upload',
      data: data,
      type:  "POST",
      contentType: false, // obligatoire pour de l'upload
      processData: false, // obligatoire pour de l'upload
      dataType: 'json', // selon le retour attendu
      success: function (response) {
        if (!response || !response.file || !response.id) {
          Allpage.prototype._openMessage("Une erreur est survenue, veuillez reessayer");
          return;
        }
        setTimeout(function(){
          file.remove();
          t._setTemlate(response.file, response.id);
        }, 4000);
      }
    });
  },

  endResult:function(img) {
    if (!(img.src || img instanceof HTMLCanvasElement)) {
      Allpage.prototype._openMessage('Le chargement de l\image a échoué');
      $('#popin-thumb-edit').remove();
      return false;
    }
    $('#thumb-content-data').html(img);
    var canvas = $('#thumb-content-data').find('img, canvas');
    canvas.addClass('img-responsive').width('319px').height('239px');

    var ctx = canvas.get(0).getContext('2d');
    var logo = new Image();
    logo.src = '/img/logo-photo.png';
    logo.onload = function()
    {
      ctx.drawImage(logo, 10, 10, 140, 50);
      especeadd.prototype.sendFile(canvas.get(0));
    }
  },

  createPopin:function(img) {
    $('#popin-thumb-edit').remove();
    $('body').append('<div class="popin-bg" id="popin-thumb-edit">' +
      '<div class="container">' +
      '<div class="popin col-xs-10 col-xs-offset-1">' +
      '<div class="row thumb-content-data" id="thumb-content-data" ></div>' +
      '<div class="row bg-white thumb-content">' +
      '<p class="txt-18 thumb-ttl mg-left-20" style="float: left; width: 300px;"><i>Redimensionnez votre image</i></p>' +
      '<button type="button" class="btn float-right" id="btn-crop-thumb">Valider</button>' +
      '<button type="button" class="btn float-right mg-right-10 btn-orange" id="btn-crop-cancel">Annuler</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>');

    $('#thumb-content-data').html(img);
    var imgNode = $('#thumb-content-data').find('img, canvas');
    imgNode.addClass('img-responsive');

    $('#btn-crop-thumb').on('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var pixelRatio = window.devicePixelRatio || 1;
      if (img && especeadd.prototype.coordinates) {
        $('#popin-thumb-edit').hide();
        especeadd.prototype.endResult(loadImage.scale(imgNode[0], {
          left: especeadd.prototype.coordinates.x * pixelRatio,
          top: especeadd.prototype.coordinates.y * pixelRatio,
          sourceWidth: especeadd.prototype.coordinates.w * pixelRatio,
          sourceHeight: especeadd.prototype.coordinates.h * pixelRatio,
          minWidth: 683,
          maxWidth: 683,
          minHeight: 511,
          maxHeight: 511,
          meta: true,
          pixelRatio: pixelRatio,
          downsamplingRatio: 0.5
        }));
        especeadd.prototype.coordinates = null;
      }
    });
    $('#btn-crop-cancel').on('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $('#popin-thumb-edit').remove();
      $('#fileupload').val("");
      return false;
    });
    return imgNode;
  },

  updateResults:function(img) {
    if (!(img.src || img instanceof HTMLCanvasElement)) {
      Allpage.prototype._openMessage('Le chargement de l\image a échoué');
      return false;
    }
    var imgNode = especeadd.prototype.createPopin(img);
    if (img.getContext) {
      imgNode.Jcrop({
        aspectRatio: 1.8,
        bgColor: 'black',
        bgOpacity: .4,
        minSize: [136, 102],
        setSelect: [
          0,
          0,
          img.width,
          img.height
        ],
        onSelect: function (coords) {
          especeadd.prototype.coordinates = coords;
        },
        onRelease: function () {
          especeadd.prototype.coordinates = null;
        }
      });
    }
  },

  displayImage:function(file) {
    especeadd.prototype.currentFile = file;
    if (!loadImage(file, especeadd.prototype.updateResults, {
        maxWidth: 800,
        maxHeight: 500,
        minWidth: 600,
        minHeight: 400,
        canvas: true,
        pixelRatio: window.devicePixelRatio,
        downsamplingRatio: 0.5,
        orientation: true,
      }))
    {
      Allpage.prototype._openMessage('Votre navigateur ne supporte pas des URLs');
    }
  },

  dropChangeHandler:function(e) {
    e.preventDefault();
    e.stopPropagation();

    var _e = e.originalEvent;
    var target = _e.dataTransfer || _e.target;
    var file = target && target.files && target.files[0];
    if (!file) {
      return;
    }
    especeadd.prototype.displayImage(file);
  },

  /**
   * Load image
   * @private
   */
  _init3LoadImage:function() {
    try {
      $('#fileupload').on('change', especeadd.prototype.dropChangeHandler);
    } catch(err) {
      Allpage.prototype.logger('especeadd::_init3LoadImage :: ' + err);
    }
  },

  /**
   * Set template for each banners.
   * @param container
   * @param file
   * @param format
   * @private
   */
  _setTemlate:function(file, id) {
    this.imgUploaded = id;
    $('#list-values').val(this.imgUploaded);
    var t = this;

    var img = $('<img/>', {
        src: file,
        id: id,
        alt: "Nouvelle photo pour l'annonce",
        class: 'bann-uploaded img-responsive',
      }),
      container = $('<div class="' + 'col-xs-12 col-sm-4'  +' bloc-banner  mg-bottom-20" data-url="' + file + '" id="tempfile-' + id + '"/>'),
      closeBtn =  $('<a class="action-close btn-close sprite-before close" title="Supprimer la bannière"></a>');
    closeBtn.appendTo(container);
    img.appendTo(container);
    $('#files').empty();
    container.appendTo($('#files'));
    $('#tempfile-' + id).on('click', '.action-close', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $('#tempfile-' + id).remove();
      t.imgUploaded = "";
      $('#list-values').val(t.imgUploaded);
    });
    setTimeout(function(){
      $("#" + id).attr("src", file);
    }, 1000);
  },

  whichType:function(val) {
    $('.bloc-for-type').hide();
    $('.bloc-' + val).show();
  },

  _init2Type: function() {
    especeadd.prototype.whichType($('#type').val());
    $('body').on('change', '#type', function() {
      especeadd.prototype.whichType(this.value);
    });
  },

  _init8AutoImplementEspeces:function() {
    $( "#especename" ).easyAutocomplete({
      url: function() {
        return "/especes/list?type=" + $("[name='type']").val()+ '&all=1';
      },
      getValue: "name",
      list: {
        match: {
          enabled: true
        }
      },
      theme: "square"
    });
  },
};

$(function() {
  Singleton.init();
});
