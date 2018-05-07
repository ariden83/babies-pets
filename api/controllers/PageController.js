"use strict";
/**
 * ProductController
 *
 * @description :: Server-side logic for managing Products
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  /**
   * Homepage.
   * @param req
   * @param res
   * @returns {*}
     */
  home: function (req, res) {
    res.locals.scripts = [
      '/js/pages//pagehome/jquery.videoBG.js',
      '//maps.googleapis.com/maps/api/js?key=AIzaSyAC_NXSPj45x1dJADdCjvTIfLtvrx6T15E',
    ];
    const numByPage = 10;
    const currentPage = (req.query.page || 1);
    return Advertisement.find({
      where: {
        active: true,
      },
      sort: 'updatedAt DESC',
      limit: numByPage,
      skip: (numByPage * currentPage) - numByPage,
    })
    .then(data => {
      return res.view('page/home', {
        data: data,
        page: (req.query.page || 1),
        title: 'Babies Pets - site de petites annonces pour animaux' + (currentPage > 1 ? ' - annonces page ' + currentPage : ''),
        description: (currentPage > 1 ? 'Annonces page ' + currentPage + ' - ' : '') + 'Petites annonces animalières pour vendre, donner, acheter un animal de compagnie, chien, chat, poisson, oiseau, cheval rongeur, reptile et oiseaux',
      });
    })
    .catch(err => {
      sails.log.warn(err);
      res.redirect('/');
    });
  },


  list: function(req, res) {
    try {
      res.locals.scripts = [
        '//maps.googleapis.com/maps/api/js?key=AIzaSyAC_NXSPj45x1dJADdCjvTIfLtvrx6T15E',
      ];
      if (!req.params || !req.params.type) {
        res.redirect('/');
        return null;
      }
      return Advertisement.find({
          where: {
            active: true,
            cat: req.params.type,
          },
          sort: 'updatedAt DESC',
          limit: 100,
        })
        .then(data => {
          return res.view('ad/list', {
            title: "Babies Pets - annonce " + req.params.type + ', ' + req.params.undertype,
            description:  "Babies Pets - annonce " + req.params.type + ', ' + req.params.undertype,
            data: data,
            type: req.params.type,
          });
        })
        .catch(err => {
          sails.log.warn(err);
          res.redirect('/');
        });
    } catch (err) {
      return ErrorResp.view(res, err);
    }
  },

  annonce: function (req, res) {
    res.locals.scripts = [
      '/js/pages/pageannonce/jquery.ui.widget.js',
      '/js/pages/pageannonce/jquery.fileupload.js',
      '/js/pages/jquery-form-validator-lg-fr.js',
      '/js/pages/pageannonce/load-image.all.min.js',
      '/js/pages/pageannonce/canvas-to-blob.min.js',
      '/js/pages/pageannonce/jquery.Jcrop.js',
      '/js/pages/pageannonce/jquery.iframe-transport.js',
      '/js/pages/pageannonce/jquery.fileupload-process.js',
      '/js/pages/pageannonce/jquery.fileupload-image.js',
      "/js/pages/pageannonce/jquery.fileupload-validate.js",
      "/js/pages/pageannonce/jquery.fileupload-ui.js",
      "/js/pages/pageannonce/bootstrap-wysiwyg.js"
    ];
    res.view('page/annonce', {
      title: "Babies Pets - Publier votre petite annonce pour votre animal",
      description: "Site de petites annonces d'animaux pour vendre, donner, acheter un animal de compagnie chien, chat, poisson, oiseau, cheval rongeur, reptile et oiseaux",
      user_id: req.user_id || null,
    });
    return res;
  },

  /**
   * Sitemap.
   *
   * @param req
   * @param res
   */
  sitemap: function(req, res) {
    try {
      res.setHeader( "Content-type", "text/xml" );
      let adList;
      let userList;
      return Advertisement.find({
        active: true,
      })
      .then(dataAds => {
        adList = dataAds;
        return User.find({
          professional: true,
        });
      })
      .then(dataUsers => {
        userList = dataUsers;
        return Especes.find();
      })
      .then(especes => res.view('page/sitemap', {
        layout: false,
        ads: adList,
        departments: Geo.getDepartements(),
        users: userList,
        especes: especes,
      }))
      .catch(err => {
        sails.log.warn(err);
        res.view('page/sitemap', {
          layout: false,
          ads: [],
        })
      });
    } catch (err) {
      return ErrorResp.view(res, err);
    }
  },

  cgu: function(req, res) {
    res.view('page/cgu', {
      title: "Babies Pets - Conditions d'utilisation pour utiliser les services proposés par babies-pets",
      'description': "Retrouvez toutes les conditions d'utilisation pour utiliser les services proposés par babies-pets.fr",
    });
  },

  bienvenue: function(req, res) {
    try {
      let _userData;
      let _myAd;
      return User.findOne({user_id: req.user_id})
      .then(userData => {
        _userData = userData;
        return Advertisement.find({
          user_id: req.user_id,
        }).limit(1).sort('createdAt DESC');
      })
      /*.then(myAd => {
        _myAd = myAd;
        return Advertisement.find({
          active: true,
        }).limit(4).sort('createdAt DESC');
      })*/
      .then(myAd => {
        _myAd = myAd;
        res.view('page/bienvenue', {
          title: "Babies Pets - Vous venez de créer un nouveau compte sur babies-pets",
          description: "Bienvenu, vous venez de créer un nouveau compte sur babies-pets.fr. Vous pouvez désormais publiez vos annonces, voir vos messages reçus.",
          // data: data,
          myad: _myAd,
          user: _userData,
        });
      })
      .catch (err => {
        sails.log.warn(err);
        if (!req.user_id) {
          res.redirect('/mon-compte/inscription?c=401');
        } else {
          return res.view('page/bienvenue', {
            title: "Babies Pets - Vous venez de créer un nouveau compte sur babies-pets",
            description: "Bienvenu, vous venez de créer un nouveau compte sur babies-pets.fr. Vous pouvez désormais publiez vos annonces, voir vos messages reçus.",
            data: [],
          });
        }
      });
    } catch (err) {
      sails.log.warn(err);
      return res.view('page/bienvenue', {
        title: "Babies Pets - Vous venez de créer un nouveau compte sur babies-pets",
        description: "Bienvenu, vous venez de créer un nouveau compte sur babies-pets.fr. Vous pouvez désormais publiez vos annonces, voir vos messages reçus.",
        data: [],
      });
    }
  },

  soumise: function(req, res) {
    try {
      let _userData;
      return User.findOne({user_id: req.user_id})
        .then(userData => {
          _userData = userData;
          return Advertisement.find({
            active: true,
          }).limit(4).sort('createdAt DESC');
        })
        .then(data => res.view('page/soumise', {
          title: "Babies Pets - Vous venez de créer une nouvelle annonce sur babies-pets",
          description: "Bienvenu, vous venez de créer une nouvelle annonce sur babies-pets.fr. Vous pouvez désormais publiez vos annonces, voir vos messages reçus.",
          data: data,
          user: _userData,
        }))
        .catch (err => {
          sails.log.warn(err);
          if (!req.user_id) {
            res.redirect('/mon-compte/inscription?c=401');
          } else {
            sails.log.warn(err);
            return res.view('page/soumise', {
              title: "Babies Pets - Vous venez de créer une nouvelle annonce sur babies-pets",
              description: "Bienvenu, vous venez de créer une nouvelle annonce sur babies-pets.fr. Vous pouvez désormais publiez vos annonces, voir vos messages reçus.",
              data: [],
            });
          }
        });
    } catch (err) {
      sails.log.warn(err);
      return res.view('page/soumise', {
        title: "Babies Pets - Vous venez de créer une nouvelle annonce sur babies-pets",
        'description': "Bienvenu, vous venez de créer une nouvelle annonce sur babies-pets.fr. Vous pouvez désormais publiez vos annonces, voir vos messages reçus.",
        data: [],
      });
    }
  },

  popinAccount: function(req, res) {
    res.view('popin/account', {
      layout: false,
    });
  },

  /**
   * Static page who define process to create a new campaign.
   * @param req
   * @param res
   * @returns {*}
   */
  legacy: function (req, res) {
    res.view('page/legacy', {
      title: 'Mentions légales du site de petites annonces - babies-pets.fr',
      'description': 'Mentions légales du site babies-pets.fr. Vous trouverez les règles suivantes relatives aux services proposés par le site',
    });
    return res;
  },

  confidentialite: function (req, res) {
    res.view('page/confidentialite', {
      title: 'Politique de Confidentialité  du site de petites annonces - babies-pets.fr',
      'description': 'Date de mise à jour: 01/01/2017. Politique de Confidentialité  du site babies-pets.fr. Vous trouverez les règles suivantes relatives aux services proposés par le site',
    });
    return res;
  },

  /**
   * Static page who define process to create a new campaign.
   * @param req
   * @param res
   * @returns {*}
   */
  cookies: function (req, res) {
    res.view('page/cookies', {
      title: 'Information sur les cookies - babies-pets.fr',
      'description': 'Informations sur les cookies et informations personnelles stockés par le site babies-pets.fr',
    });
    return res;
  },

  credits: function (req, res) {
    res.view('page/credits', {
      title: 'A propos des droits d\'Auteur et crédit photos / videos - babies-pets.fr',
      'description': 'A propos des droits d\'Auteur et crédits photos / videos apparaissant sur les pages du site babies-pets.fr',
    });
    return res;
  },
};

