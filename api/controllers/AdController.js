"use strict";

const numByPage = 10;

/**
 * AdController
 *
 * @description :: Server-side logic for managing ad
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
        return res.view('ad/home', {
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
      var where = {
        active: true,
        cat: req.params.type,
      };
      if (req.query.region && req.query.region != '0') {
        where.region = Number(req.query.region);
      }
      return Advertisement.find({
        where: where,
        sort: 'updatedAt DESC',
        limit: numByPage,
      })
      .then(data => {
        return res.view('ad/list', {
          title: "Babies Pets - annonces gratuites - " + req.params.type,
          description:  "Babies Pets - Trouvez votre animal de compagnie dans les annonces gratuites dédiées aux " + req.params.type,
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

  load:function(req, res) {
    try {
      let error = new Error();
      error.code = 412;
      if (!req.query.page) {
        error.message = "Erreur de chargement des annonces supplémentaires";
        throw error;
      }
      const where = {
        active: true,
      };
      if (req.query.type && req.query.type !== 'all') {
        where.cat = req.query.type;
      }
      return Advertisement.find({
        where: where,
        sort: 'updatedAt DESC',
        limit: numByPage,
        skip: (numByPage * req.query.page) - numByPage,
      })
      .then(data => {
        if (data.length < 1) {
          error.code = 404;
          error.message = 'Plus d\'annonces';
          throw error;
        }
        return res.view('ad/more', {
          data: data,
          layout: false,
          currentPage: req.query.page,
        });
      })
      .catch(err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },

  underlist:function(req, res) {
    try {
      res.locals.scripts = [
        '//maps.googleapis.com/maps/api/js?key=AIzaSyAC_NXSPj45x1dJADdCjvTIfLtvrx6T15E',
      ];
      if (!req.params || !req.params.type) {
        res.redirect('/');
        return null;
      }
      if (!req.params || !req.params.undertype) {
        res.redirect('/annonces/' + req.params.type);
        return null;
      }
      return Advertisement.find({
        where: {
          undercat: req.params.undertype,
          active: true,
          cat: req.params.type,
        },
        sort: 'updatedAt DESC',
        limit: 100,
      })
      .then(data => {
        return res.view('ad/underlist', {
          title: "Babies Pets - annonce " + req.params.type + ', ' + req.params.undertype,
          description:  "Babies Pets - annonce " + req.params.type + ', ' + req.params.undertype,
          data: data,
        });
      })
      .catch(err => {
        sails.log.warn(err);
        res.redirect('/annonces/' + req.params.type);
      });
    } catch (err) {
      return ErrorResp.view(res, err);
    }
  },

  ecrire: function(req, res) {
    try {
      if (!req.body || !req.body.email) {
        return res.json(412, {
          message: "L'email n'est pas renseigné"
        });
      } else if (!req.body.name) {
        return res.json(412, {
          message: "Votre nom et votre prénom ne sont pas renseignés"
        });
      } else if (!req.body.phone) {
        return res.json(412, {
          message: "Votre téléphone n'est pas renseigné"
        });
      } else if (!req.body.message) {
        return res.json(412, {
          message: "Vous n'avez pas rédigé de message"
        });
      } else if (!req.body.annonce) {
        sails.log.warn("Id d'annonce non trouvée");
        return res.json(412, {
          message: 'Id d\'annonce non trouvée'
        });
      }
      return Advertisement.findOne({ad_id: req.body.annonce})
      .then(data => {
        if (!data) {
          sails.log.warn('Annonce non trouvée');
          return res.json(412, {
            message: 'Annonce non trouvée'
          });
        }

        return Message.create(
          {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            message: req.body.message,
            content_id: req.body.annonce,
            type: 'annonce',
          },
          (err, created) => {
            if (err) {
              sails.log.warn(err);
              res.status(404);
              return res.json(res);
            }
            // Send an email.
            EmailService.sendReponseAnnonce({
              email: data.details.email || null,
              name: '',
              nameContact: req.body.name,
              emailContact: req.body.email,
              phone: req.body.phone,
              message: req.body.message,
              ad_id: req.body.annonce,
              url: data.url,
              title: data.title,
            });
            return res.json({
              message: 'Votre message a été envoyé',
            });
          });
      })
      .catch(err => ErrorResp.json(err));
    } catch (err) {
      return ErrorResp.json(err);
    }
  },

  index: function(req, res) {
    try {
      res.locals.scripts = [
        '//maps.googleapis.com/maps/api/js?key=AIzaSyAC_NXSPj45x1dJADdCjvTIfLtvrx6T15E',
        '/js/pages/pageannonce/jquery.ui.widget.js',
        '/js/pages/jquery-form-validator-lg-fr.js',
      ];
      if (!req.params || !req.params.type) {
        res.redirect('/');
        return null;
      }
      if (!req.params || !req.params.undertype) {
        res.redirect('/annonces/' + req.params.type);
        return null;
      }
      if (!req.params || !req.params.title) {
        res.redirect('/annonces/' + req.params.type + '/' + req.params.undertype);
        return null;
      }
      const url = '/annonces/' + req.params.type + '/' + req.params.undertype + '/' + req.params.title;
      let current = {};
      let user = {};
      return Advertisement.findOne({url: url})
      .then(data => {
        if (!data || !data.user_id) {
          throw new Error('Advertisement not found with ' + (url || ''));
        }
        current = data;
        return User.findOne({user_id: current.user_id})
      })
      .then(userData => {
        user = userData || {
            phone: 'non renseigné',
            avatar: '/img/avatar.gif',
            pseudo: 'non renseigné',
            confirmed: false,
            professional: false,
            details: {}
          };
        return Advertisement.find({
          active: true,
          cat: current.cat,
        }).limit(9).sort(current.undercat + ' ASC');
      })
      .then(ads => {
        res.view('ad/index', {
          title: "Babies Pets - annonce " + current.title,
          description: "Babies Pets - annonce " + req.params.type + ', ' + req.params.undertype + ': ' + current.title,
          keywords: '',
          data: current,
          ads: ads,
          user: user,
        });
      })
      .catch(err => {
        sails.log.warn(err);
        res.redirect('/annonces/' + req.params.type + '/' + req.params.undertype);
      });
    } catch (err) {
      return ErrorResp.view(res, err);
    }
  },

  confirm: function(req, res) {
    try {
      res.locals.scripts = [
        '/js/pages/pageannonce/jquery.ui.widget.js',
        '/js/pages/pageannonce/jquery.fileupload.js',
        '/js/pages/jquery-form-validator-lg-fr.js',
      ];
      if (!req.params || !req.params.id) {
        return res.notFound(412, {message: 'Annonce non trouvée'});
      }
      return Advertisement.findOne({ad_id: req.params.id})
        .then(data => {
          if (!data) {
            const error = new Error('Annonce non trouvée');
            error.code = 412;
            throw error;
          }
          res.view('ad/edit', {
            title: "Babies Pets - edition de votre annonce " + data.title,
            description: 'Edition de votre annonce ' + data.title,
            data: data,
            isnew: req.query.c || 0,
          });
        })
        .catch (err => ErrorResp.view(res, err));
    } catch (err) {
      return ErrorResp.view(res, err);
    }
  },

  mesannonces: function(req, res) {
    try {
      return Advertisement.findOne({user_id: req.user_id})
      .then(data => {
        res.view('ad/mesannonces', {
          title: "Babies Pets - Vous venez de créer un compte sur babies-pets",
          'description': "Bienvenu, vous venez de créer un compte sur babies-pets.fr. Vous puvez désormais publiez vos annonces, voir vos messages reçus.",
          data: data,
        });
      })
      .catch (err => {
        if (!req.user_id) {
          sails.log.warn(err);
          res.redirect('/mon-compte/inscription?c=401');
        } else {
          return ErrorResp.view(res, err);
        }
      })
    } catch (err) {
      return ErrorResp.view(res, err);
    }
  },

  cloture:function(req, res) {
    try {
      let error = new Error();
      error.code = 404;
      if (!req.params || !req.params.id) {
        return res.notFound(412, {message: 'L\'annonce n\'a pas été trouvée'});
      }
      return Promise.resolve()
      .then(() => Advertisement.findOne(req.params.id))
      /**
       * Field verification.
       */
      .then(annonce => {
        if (!annonce) {
          error.message = "L'annonce n'a pas été trouvée";
          throw error;
        }
        if (annonce.user_id !== req.user_id) {
          error.code = 401;
          error.message = "Il semblerait que vous ne soyez pas le propriétaire de l'annonce";
          throw error;
        }
        return Advertisement.update(req.params.id, {
          vendu: req.body.cloture === '1' ? 1 : 0,
        });
      })
      .then(() => res.json({
        status: 'ok',
        message: "Votre annonce a été " + (req.body.cloture === '1' ? 'réactivée' : 'cloturée'),
      }))
      .catch(err => ErrorResp.json(err));
    } catch (err) {
      return ErrorResp.json(err);
    }
  },

  /**
   * Edit an ad
   * @param req
   * @param res
     */
  edit:function(req, res) {
    try {
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

      if (!req.params || !req.params.id) {
        return res.notFound(412, {message: 'Annonce non trouvée'});
      }
      return Advertisement.findOne({ad_id: req.params.id})
      .then(data => {
        if (!data) {
          throw new Error('Annonce '+ req.params.id  +'non trouvée');
        }
        res.view('ad/edit', {
          title: "Babies Pets - edition de votre annonce " + data.title,
          description: 'Edition de votre annonce ' + data.title,
          data: data,
          isnew: req.query.c || 0,
        });
      })
      .catch (err => {
        sails.log.warn(err);
        if (req.user_id) {
          res.redirect('/mon-compte/mes-annonces?c=404');
        } else {
          res.redirect('/mon-compte/inscription?c=401');
        }
      })
    } catch (err) {
      return ErrorResp.view(res, err);
    }
  }
};
