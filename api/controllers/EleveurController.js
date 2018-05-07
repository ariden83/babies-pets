"use strict";

const crypto = require('crypto');

const getURLName = str => {
  const t = str.lastIndexOf('-');
  return str.slice(0, t)+"%";
};

/**
 * EleveurController
 *
 * @description :: Server-side logic for managing accounts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
module.exports = {

  creation: function (req, res) {
    try {
      let _userData;

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

      return User.findOne({user_id: req.user_id})
        .then(userData => {
          if (!userData) {
            throw Error("Erreur serveur, impossible de retrouver l'utilisateur, veuillez recommencer");
          }
          _userData = userData;
          return Advertisement.find({user_id: req.user_id})
        })
        .then(adData => res.view('eleveur/creation', {
          title: "Babies Pets - Informations à propos de votre compte sur babies-pets",
          description: "Interface d'administration de votre compte, pour accéder à vos messages et annonces sur babies-pets",
          user: _userData,
          departments: Geo.getDepartements(),
          ad: adData,
        }))
        .catch(err => ErrorResp.view(res, err));
    } catch (err) {
      return ErrorResp.view(res, err);
    }
  },

  /**
   * Reassign current page to someone
   * @param req
   * @param res
   * @returns {*}
     */
  reassign:function(req, res) {
    try {
      if (!req.body) {
        return res.json(412, {message: 'Veuillez remplir les champs obligatoires'});
      } else if (!req.body.titre) {
        return res.json(412, {message: 'Le champ titre est manquant'});
      } else if (!req.body.description) {
        return res.json(412, {message: 'Le champ description est manquant'});
      } else if (!req.body.siren) {
        return res.json(412, {message: 'Le champ siren est manquant'});
      } else if (!req.body.siret) {
        return res.json(412, {message: 'Le champ siret est manquant'});
      }
      const body = _.extend({
        ip: req.ip || null,
      }, req.body);
      return UserService.create(req.user_id, body, res)
      .then(user => {
        let imagesWithPath = {};
        req.body.list.split(',').forEach(function(e) {
          imagesWithPath[e] = new ThumborService({
            file: e || '',
            height: 511,
            width: 683,
          }).read();
        });
        let details = user.details || {};
        details.parent_id = req.body.parent_id || null;
        details.description = req.body.description;
        details.titre = req.body.titre;
        details.siren = req.body.siren;
        details.siret = req.body.siret;
        details.categorie = req.body.categorie || 'autre';
        details.type = req.body.type || 'autre';
        details.youtube = Youtube.setYoutubeEmbed(req.body.youtube);
        details.web = req.body.web || null;
        details.images = imagesWithPath;
        details.fb = req.body.fb || null;
        details.race =  (req.body.type && req.body[req.body.type] ? req.body[req.body.type] : 'autre');
        return User.update(user.user_id || 'fail', {
          details: details
        });
      })
      .then(user => {
        EmailService.sendFusionCompteEleveurMail({
          pseudo: user.pseudo,
          id: user.id,
          title: req.body.titre,
        });
        return res.json(200, {
          message: 'La page a été associée à votre compte et sera validée par la team babies-pets d\'ici 48h',
        });
      })
      .catch(err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },

  /**
   * Edit
   * @param req
   * @param res
   * @returns {*}
     */
  edit:function(req, res) {
      try {
        if (!req.body) {
          return res.json(412, {message: 'Aucun champs renseignés, veuillez recommencer'});
        } else if (!req.body.titre) {
          return res.json(412, {message: 'Le champ titre est manquant'});
        } else if (!req.body.description) {
          return res.json(412, {message: 'Le champ description est manquant'});
        } else if (!req.body.siren) {
          return res.json(412, {message: 'Le champ siren est manquant'});
        } else if (!req.body.siret) {
          return res.json(412, {message: 'Le champ siret est manquant'});
        }
        return User.findOne({user_id: req.user_id})
          .then(user => {
            if (!user) {
              return res.json(404, {
                message: "Erreur serveur, veuillez vous reconnecter"
              });
            }
            let imagesWithPath = {};
            req.body.list.split(',').forEach(function(e) {
              imagesWithPath[e] = new ThumborService({
                file: e || '',
                height: 511,
                width: 683,
              }).read();
            });
            let details = user.details || {};
            details.description = req.body.description;
            details.titre = req.body.titre;
            details.siren = req.body.siren;
            details.siret = req.body.siret;
            details.categorie = req.body.categorie || 'autre';
            details.type = req.body.type || 'autre';
            details.youtube = Youtube.setYoutubeEmbed(req.body.youtube);
            details.web = req.body.web || null;
            details.fb = req.body.fb || null;
            details.images = imagesWithPath;
            details.race =  (req.body.type && req.body[req.body.type] ? req.body[req.body.type] : 'autre');
            return User.update(req.user_id, {
              details: details
            });
          })
          /**
           * Save crypto in redis
           */
          .then(() => res.json(200, {
            message: "Vptre page a été mise à jour",
          }))
          .catch(err => ErrorResp.json(res, err));
      } catch (err) {
        return ErrorResp.json(res, err);
      }
  },

  /**
   * List of eleveurs.
   * @param req
   * @param res
   * @returns {*}
     */
  annuaires:function(req, res) {
    try {
      res.locals.scripts = [
        '/js/back/jquery.easy-autocomplete.min.js'
      ];
      return User.find({
        professional: true,
      })
      .limit(3)
      .sort('created DESC')
      .then(users => {
        return res.view('eleveur/annuaires', {
          departement: Geo.getDepartements(),
          departmentsUrl: Geo.getDepartementsURL(),
          users: users,
          title: 'Annuaires des éleveurs, élevages et particuliers inscrits sur babies-pets',
          description: 'Retrouvez tous les éleveurs, élevages et particuliers qui proposent régulièrement des annonces sur babies-pets',
        });
      })
      .catch(err =>  ErrorResp.view(res, err));
    } catch (err) {
      return  ErrorResp.view(res, err);;
    }
  },
  /**
   * Ecrire un message.
   * @param req
   * @param res
   * @returns {*}
     */
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
        sails.log.warn("L'éleveur n'a pas été trouvé", req.body);
        return res.json(412, {
          message: "L'éleveur n'a pas été trouvé"
        });
      }
      return User.findOne({user_id: req.body.annonce})
        .then(data => {
          if (!data) {
            sails.log.warn("L'éleveur n'a pas été trouvé");
            return res.json(412, {
              message: "L'éleveur n'a pas été trouvé",
            });
          }
          return Message.create(
            {
              name: req.body.name,
              email: req.body.email,
              phone: req.body.phone,
              message: req.body.message,
              id: req.body.annonce,
              type: 'eleveur',
            },
            (err, created) => {
              if (err) {
                res.status(404);
                res.json(res);
              }
              // Send an email.
              EmailService.sendReponseAnnonce({
                email: data.email,
                name: data.pseudo,
                nameContact: req.body.name,
                emailContact: req.body.email,
                phone: req.body.phone,
                message: req.body.message,
                user_id: req.body.annonce,
                url: data.url,
                title: data.title,
              });
              return res.json({
                message: 'Votre message a été envoyé',
              });
            });
        })
        .catch(err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },
  /**
   * Get eleveur by departement
   * @param req
   * @param res
   * @returns {*}
     */
  departement:function(req, res) {
    try {
      if (!req.params || !req.params.code) {
        res.redirect('/');
        return null;
      }
      let nbr = 0;
      let pagination = 20;
      return User.count({
          departement: req.params.code,
          professional: true,
          /* active: true,
           professional: true,*/
        })
        .then(userNbr => {
          nbr = userNbr;
          return User.find({
              departement: req.params.code,
              professional: true,
              /* active: true,
               professional: true,*/
            })
            .paginate({
              limit: pagination,
              page: (req.query.page || 0),
            })
            .sort('created DESC');
        })
        .then(data => {
          return res.view('eleveur/departement', {
            data: data,
            departement: Geo.getDepartement(req.params.code),
            departmentUrl: (Geo.getDepartementsURL())[req.params.code] || '',
            code: req.params.code,
            nbr: Math.ceil(nbr / pagination),
            title: 'Annonces et annuaire animaux sur ' + req.params.title + ' - babies-pets',
            description: 'Retrouvez tous les éleveurs et élevages de ' + req.params.title + ' qui proposent des annonces sur babies-pets : page ' + (req.query.page || 1),
            page: (req.query.page || 1)
          });
        })
        .catch(err => ErrorResp.view(res, err));
    } catch (err) {
      return ErrorResp.view(res, err);;
    }
  },

  espece:function(req, res) {
    try {
      if (!req.params || !req.params.title) {
        res.redirect('/');
        return null;
      }
      let nbr = 0;
      let pagination = 20;
      return User.count({
        "details.type": req.params.title,
        professional: true,
        /* active: true,
         professional: true,*/
      })
      .then(userNbr => {
        nbr = userNbr;
        return User.find({
            "details.type": req.params.title,
            professional: true,
            /* active: true*/
          })
          .paginate({
            limit: pagination,
            page: (req.query.page || 0),
          })
          .sort('created DESC');
      })
      .then(data => res.view('eleveur/espece', {
        data: data,
        type: req.params.title,
        nbr: Math.ceil(nbr / pagination),
        title: 'Annuaire des professionnels pour ' + req.params.title + ' - babies-pets',
        description: 'Retrouvez tous les professionnels, élevages pour ' + req.params.title + ' qui possèdent une page sur babies-pets : page ' + (req.query.page || 1),
        page: (req.query.page || 1)
      }))
      .catch(err => ErrorResp.view(res, err));
    } catch (err) {
      return ErrorResp.view(res, err);;
    }
  },

  /**
   * Search eleveurs by races
   * @param req
   * @param res
   * @returns {*}
     */
  race:function(req, res) {
    try {
      if (!req.params || !req.params.title) {
        res.redirect('/');
        return null;
      }
      if (!req.params.espece) {
        res.redirect('/');
        return null;
      }
      let nbr = 0;
      let pagination = 20;
      return User.count({
        "details.race": req.params.title,
        "details.type": req.params.espece,
        professional: true,
        /* active: true,
         professional: true,*/
      })
      .then(userNbr => {
        nbr = userNbr;
        return User.find({
            "details.race": req.params.title,
            "details.type": req.params.espece,
            professional: true,
            /* active: true*/
          })
          .paginate({
            limit: pagination,
            page: (req.query.page || 0),
          })
          .sort('created DESC');
      })
      .then(data => res.view('eleveur/race', {
        data: data,
        race: req.params.title,
        espece: req.params.espece,
        nbr: Math.ceil(nbr / pagination),
        title: 'Annuaire des professionnels de ' + req.params.espece + ' > ' + req.params.title + ' - babies-pets',
        description: 'Retrouvez tous les professionnels, élevages pour ' + req.params.title + ' qui possèdent une page sur babies-pets : page ' + (req.query.page || 1),
        page: (req.query.page || 1)
      }))
      .catch(err => ErrorResp.view(res, err));
    } catch (err) {
      return ErrorResp.view(res, err);;
    }
  },

  prestation:function(req, res) {
    try {
      if (!req.params || !req.params.title) {
        res.redirect('/');
        return null;
      }
      let nbr = 0;
      let pagination = 20;
      return User.count({
        "details.categorie": req.params.title,
        professional: true,
        /* active: true,
         professional: true,*/
      })
      .then(userNbr => {
        nbr = userNbr;
        return User.find({
            "details.categorie": req.params.title,
            professional: true,
            /* active: true*/
          })
          .paginate({
            limit: pagination,
            page: (req.query.page || 0),
          })
          .sort('created DESC');
      })
      .then(data => res.view('eleveur/prestation', {
        data: data,
        type: req.params.title,
        nbr: Math.ceil(nbr / pagination),
        title: 'Annuaire d\'' + req.params.title + ' spécialisés dans les animaux - babies-pets',
        description: 'Retrouvez l\'annuaire par ' + req.params.title + ' sur babies-pets : page ' + (req.query.page || 1),
        page: (req.query.page || 1)
      }))
      .catch(err => ErrorResp.view(res, err));
    } catch (err) {
      return ErrorResp.view(res, err);;
    }
  },

  categories:function(req, res) {
    let imagesWithPath = new ThumborService({
      file: 'a8ebf308e9704ce0aa4c44f7cc406553',
      height: 197,
      width: 266,
    }).read();
     res.view('eleveur/categories', {
       imagesWithPath: imagesWithPath,
      title: 'Liste des professionnels spécialisés dans les animaux - babies-pets',
      description: 'Les différentes categories de professionnels spécialisés dans les animaux - babies-pets',
    });
  },

  /**
   * Récupération d'une page eleveur
   * @param req
   * @param res
     */
  recuperation:function(req, res) {
    try {
      if (!req.params || !req.params.url) {
        return res.notFound(404, {message: "L'éleveur n'a pas été trouvé"});
      }
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
      let user;
      let ads;
      return User.findOne({url: req.params.url})
        .then(userData => {
          if (!userData) {
            let error = new Error('L\'éleveur n\'a pas été trouvé');
            error.code = 404;
            throw error;
          }
          user = userData;
          return Advertisement.find({user_id: user.user_id});
        })
        .then(data => {
          ads = data;
          if (user.details.race) {
            return Especes.findOne({name: user.details.race})
              .then(espece => {
                if (espece) {
                  espece.file = new ThumborService({
                    file: (espece.file || null),
                    height: 230,
                    width: 288,
                  }).read();
                  return espece;
                }
                return null;
              })
              .catch(err => {
                sails.log.warn(err);
                return null;
              });
          }
          return null;
        })
        .then(espece => res.view('eleveur/recuperation', {
          title: (user.professional ? 'L\'éleveur' : 'Le particulier') + ' : ' +
          (user.details.title ? user.details.title : (user.pseudo || '')) +
          ' - voir son profil',
          description: (user.professional ? 'L\'éleveur' : 'Le particulier') + ' : ' +
          (user.details.title || user.details.pseudo || '') +
          ' - voir son profil, vos avis et ses annonces postés sur babies-pets',
          user: user,
          user_id: req.user_id || null,
          espece: espece,
          ads: ads,
        }))
        .catch(err => ErrorResp.view(res, err));
    } catch (err) {
      return ErrorResp.view(res, err);
    }
  },

  vote: function(req, res) {
    sails.log.info('Nouveau vote effectué');
    try {
      if (!req.params.url) {
        sails.log.info('L\'éleveur n\'a pas été trouvé sur eleveurcontroller/vote');
        return res.notFound(404, {message: "L'éleveur n'a pas été trouvé"});
      }
      return User.findOne({url: req.params.url})
      .then(userData => {
        if (!userData) {
          sails.log.info('L\'éleveur n\'a pas été trouvé sur eleveurcontroller/vote avec l\id ' + req.params.url);
          let error = new Error('L\'éleveur n\'a pas été trouvé');
          error.code = 404;
          throw error;
        }
        let details = userData.details;
        details.vote = Number(details.vote || 0) + 1;
        return User.update(userData.user_id || 'fail', {
          details: details
        });
      })
      .then(() => res.json(200, {
        message: 'Votre vote a été pris en compte, revenez demain pour voter à nouveau',
      }))
      .catch(err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },

  /**
   * See his profil.
   * @param req
   * @param res
   * @returns {*}
   */
  profil: function(req, res) {
    try {
      if (!req.params || !req.params.url) {
        return res.notFound(404, {message: "L'éleveur n'a pas été trouvé"});
      }
      // res.header('Access-Control-Allow-Origin', '*');
      // res.header('Access-Control-Allow-Headers', '*');
      // res.header('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
      // res.header('Access-Control-Allow-Credentials', true);
      // res.header('X-Frame-Options', 'GOFORIT');

      res.locals.scripts = [
        '//maps.googleapis.com/maps/api/js?key=AIzaSyAC_NXSPj45x1dJADdCjvTIfLtvrx6T15E',
        '/js/pages/pageannonce/jquery.ui.widget.js',
        '/js/pages/jquery-form-validator-lg-fr.js',
      ];
      let user;
      let ads;
      return Promise.resolve()
      .then(() => {
        return User.findOne({url: req.params.url})
        .then(userData => {
          if (userData) {
            return userData;
          }
          return User.findOne({
            url: {
              like:  getURLName(req.params.url),
            }
          })
          .then(userData => {
            if (!userData) {
              let error = new Error('L\'éleveur n\'a pas été trouvé');
              error.code = 404;
              throw error;
            }
            const newURL = "/mon-compte/profil/" + userData.url;
            let error = new Error('L\'URL de la page de l\'éleveur a été modifiée' + newURL);
            error.code = 301;
            error.redirect = newURL;
            throw error;
          });
        });
      })
      .then(userData => {
        user = userData;
        user.departementURL = Geo.getDepartementURL(user.departement);
        return Advertisement.find({user_id: user.user_id});
      })
      .then(data => {
        ads = data;
        if (user.details.race) {
          return Especes.findOne({name: user.details.race})
            .then(espece => {
              if (espece) {
                espece.file = new ThumborService({
                  file: (espece.file || null),
                  height: 230,
                  width: 288,
                }).read();
                return espece;
              }
              return null;
            })
            .catch(err => {
              sails.log.warn(err);
              return null;
            });
          }
          return null;
        })
        .then(espece => res.view('eleveur/profil', {
          title: (user.details.title ? user.details.title : (user.pseudo || '')) + (user.details.race ? ': élevage de ' + user.details.race : '') + ' à ' + user.ville + ' - babies pets.fr',
          description: (user.details.description || ''),
          user: user,
          espece: espece,
          ads: ads,
        }))
        .catch(err => ErrorResp.view(res, err));
    } catch (err) {
      return ErrorResp.view(res, err);
    }
  },

  getTopVote:function(req, res) {
    try {
      return User.find({
          where: {
            "details.vote": {$ne:null}
          },
          sort: 'details.vote DESC',
          limit: 10,
        })
        .then(data => res.view('eleveur/getTopVote', {
          layout: false,
          data: data,
        }))
        .catch(err => ErrorResp.view(res, err));
    } catch (err) {
      return ErrorResp.view(res, err);
    }
  },
};
