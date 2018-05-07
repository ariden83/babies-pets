"use strict";

const crypto = require('crypto');
const Redis = require('redis');
const _ = require('lodash');
const Promise = require('bluebird');

const client = Redis.createClient(6379, '127.0.0.1');
client.on("error", err => {
  sails.log.warn("Error " + err);
  throw Error("Server error");
  return false;
});

/**
 * AccountController
 *
 * @description :: Server-side logic for managing accounts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
module.exports = {
  index: function(req, res) {
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
      .then(adData => {
        return res.view('compte/index', {
          title: "Babies Pets - Informations à propos de votre compte sur babies-pets",
          description: "Interface d'administration de votre compte, pour accéder à vos messages et annonces sur babies-pets",
          user: _userData,
          departments: Geo.getDepartements(),
          ad: adData,
        });
      })
      .catch(err => {
       /* res.set('token', jwToken.issue({id: req.user_id, pseudo: null, exp: 1}));
        res.redirect('/mon-compte/inscription');
        res.end();*/
        res.cookie('token', null);
        res.set('token', null);
        return ErrorResp.view(res, err);
      });
    } catch (err) {
      return ErrorResp.view(res, err);
    }
  },

  inscription: function(req, res) {
    if (req.user_id && !req.query.c) {
      res.redirect('/mon-compte');
      return null;
    }
    res.locals.scripts = [
      '/js/pages/pageannonce/jquery.ui.widget.js',
      '/js/pages/pageannonce/jquery.fileupload.js',
      '/js/pages/jquery-form-validator-lg-fr.js',
    ];
    res.view('compte/inscription', {
      title: "Babies Pets - Créez votre compte et publiez votre petite annonce pour votre animal",
      'description': "Publiez vos petites annonces d'animaux après avoir créer un compte. Déposez vos annonces pour chiens, chats, poissons, oiseaux, cheveaux, rongeurs et reptiles",
    });
  },

  deleteaccount: function (req, res) {
    try {
      return User.findOne({user_id: req.user_id})
        .then(user => {
          if (!user) {
            return res.json(404, {
              message: "Erreur serveur, veuillez vous reconnecter"
            });
          }
          res.set('token', jwToken.issue({id: user.user_id, pseudo: user.pseudo, exp: 1}));
          return User.update(req.user_id, {
            deleted: true,
            deletedAt: new Date().toISOString()
          });
        })
        .then(() => res.json(200, {
          message: "Votre compte vient d'être supprimé",
        }))
        .catch(err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },

  editpassword: function (req, res) {
    try {
      if (!req.body) {
        return res.json(412, {message: 'Erreur, veuillez recommencer'});
      } else if (!req.body.password) {
        return res.json(412, {message: 'Le champ password est manquant / erroné'});
      } else if (!req.body.confirmPassword) {
        return res.json(412, { message: 'Il manque la confirmation du mot de passe'});
      } else if (req.body.password !== req.body.confirmPassword) {
        return res.json(412, {message: 'Le mot de passe et sa confirmation ne sont pas identiques'});
      }
      return User.findOne({user_id: req.user_id})
        .then(user => {
          if (!user) {
            return res.json(404, {
              message: "Erreur serveur, veuillez vous reconnecter"
            });
          }
          return User.update(req.user_id, {
            password: req.body.password,
          });
        })
        /**
         * Save crypto in redis
         */
        .then(() =>  res.json(200, {
          message: "Votre mot de passe vient d'être mis à jour",
        }))
        .catch(err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },

  /**
   * Edit an user.
   *
   * @param req
   * @param res
   * @returns {*}
   */
  edit: function (req, res) {
    try {
      if (!req.body) {
        return res.json(412, {message: 'Erreur, veuillez recommencer'});
      } else if (!req.body.pseudo) {
        return res.json(412, {message: 'Le champ pseudo est manquant / erroné'});
      } else if (!req.body.nom) {
        return res.json(412, {message: 'Le champ nom est manquant / erroné'});
      } else if (!req.body.phone) {
        return res.json(412, {message: 'Le champ téléphone est manquant / erroné'});
      } else if (!req.body.departement) {
        return res.json(412, {message: 'Le champ département est manquant / erroné'});
      } else if (!req.body.adress) {
        return res.json(412, {message: 'Le champ adresse est manquant / erroné'});
      } else if (!req.body.ville) {
        return res.json(412, {message: 'Le champ ville est manquant / erroné'});
      } else if (!req.body.postal) {
        return res.json(412, {message: 'Le champ code postal est manquant / erroné'});
      }
      return User.findOne({user_id: req.user_id})
        .then(user => {
          if (!user) {
            return res.json(404, {
              message: "Erreur serveur, veuillez vous reconnecter"
            });
          }
          let details = user.details || {};
          details.adress = req.body.adress || null;
          details.description = req.body.description || null;
          details.titre = req.body.titre || null;
          details.departement = Geo.getDepartement(req.body.postal);
          details.youtube = Youtube.setYoutubeEmbed(req.body.youtube);
          details.web = req.body.web || null;
          const url = details.titre ? details.titre : req.body.pseudo + '-' + new Date().getTime();
          return User.update(req.user_id, {
            pseudo: req.body.pseudo,
            nom: req.body.nom,
            phone: req.body.phone,
            departement: Geo.getCodeDepartement(req.body.postal),
            ville: req.body.ville,
            postal: req.body.postal,
            url: Tag.generate(url),
            details: details
          });
        })
        /**
         * Save crypto in redis
         */
        .then(() => {
          return res.json(200, {
            message: "Vos données personnelles viennent d'être mise à jour",
          });
        })
        .catch(err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },

  /**
   * Create an user.
   *
   * @param req
   * @param res
   * @returns {*}
   */
  create: function (req, res) {
    try {
      if (!req.body) {
        return res.json(412, {message: 'Erreur, veuillez recommencer'});
      }
      const body = _.extend({
        ip: req.ip || null,
      }, req.body);
      return UserService.create(req.user_id, body, res)
      /**
       * Save crypto in redis
       */
      .then(user => res.json(200, {
        message: 'Connected',
        pseudo: user.pseudo,
        email: user.email,
      }))
      .catch(err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },

  resendconfirmed:function(req, res) {
    try {
      return User.findOne({user_id: req.user_id})
      .then(user => {
        if (!user) {
          return res.json(404, {
            message: "L'utilisateur n'a pas été trouvé"
          });
        }
        return UserService.SendMail(res, userData);
      })
      .then(() => res.json(200, {
        message: 'Email de confirmation est renvoyé',
      }))
      .catch(err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },

  /**
   * Authentification.
   *
   * @param req
   * @param res
   * @returns {*}
   */
  auth: function (req, res) {
    try {
      const email = req.body.email,
        password = req.body.password;
      if (!email || !password) {
        return res.json(412, {message: "L'email et le mot de passe sont requis"});
      }
      return Promise.resolve()
      .then(() => User.findOne({email: email, deleted: false}))
      .then(user => {
        if (!user) {
          let error = new Error('Utilisateur non trouvé');
          error.code = 404;
          throw error;
        }
        User.comparePassword(password, user, (err, valid) => {
          if (err) {
            return res.json(403, {message: 'Utilisateur non trouvé'});
          }
          if (!valid) {
            return res.json(412, {message: 'Le mot de passe est erroné'});
          } else {

            return User.update(user.user_id, {
              connectedAt: new Date().toISOString()
            })
            .then(() => {
              res.set('token', jwToken.issue({
                id: user.user_id,
                pseudo: user.pseudo
              }));
              return res.json(200, {
                message: 'connected',
                pseudo: user.pseudo,
                email: user.email,
                active: user.active,
                favoris: user.favoris || [],
              });
            });
          }
        });
      })
      .catch(err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },

  deconnexion: function (req, res) {
    try {
      User.findOne({user_id: user_id}, (err, user) => {
        if (!user) {
          return res.json(412, {message: 'Utilisateur non trouvé'});
        }
        res.set('token', jwToken.issue({id: user.user_id, pseudo: user.pseudo, exp: 1}));
        return res.json(200, {
          message: 'disconnected'
        });
      });
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },

  /**
   * Email confirmation.
   */
  confirmation:function(req, res) {
    try {
      let key;
      let userData;
      return Promise.resolve()
        .then(() => {
          if (!req.query.c) {
            let error = new Error("Token de confirmation erroné, veuillez redemander un nouveau mail de confirmation");
            error.code = 408;
            throw error;
          }
          key = 'confirm-' + req.query.c.toString();
          key = key.replace(/ /g, "+");
          return new Promise((resolve, reject) => {
            client.get(key, (err, redisData) => {
              let error = new Error();
              error.name = 'redis error';
              if (err) {
                error.message = err || 'error is null';
                reject(err);
              }
              if (redisData) {
                resolve(redisData);
              }
              error.message = 'Erreur serveur, token erroné';
              reject(error);
            });
          });
        })
        .then(userId => {
          if (!userId) {
            reject("Le token de confirmation a expiré, veuillez redemander un nouveau mail de confirmation");
          }
          return User.findOne({user_id: userId});
        })
        .then(user => {
          if (!user) {
            let error = new Error("Utilisateur non trouvé");
            error.code = 404;
            throw error;
          }
          userData = user;
          return User.update(user.user_id, {
            active: true,
            updatedAt: new Date().toISOString()
          });
        })
        .then(() => res.view('compte/index', {
          title: "Votre compte vient d'être confirmé sur babies-pets",
          message: 'Vous venez de valider votre adresse email sur babies-pets, vous pouvez maintenant déposer vos annonces, voir vos messages',
          user: userData,
        }))
        .catch(err => ErrorResp.view(res, err));
    } catch (err) {
      return ErrorResp.view(res, err);
    }
  },

  /**
   * Head > User is logged.
   */
  connecte:function(req, res) {
    try {
      return res.json(200, {
        message: 'connected',
        pseudo: req.pseudo || '',
      });
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },
  /**
   * Get my password.
   * @param req
   * @param res
   */
  getmypassword: function(req, res) {
    res.locals.scripts = [
      '/js/pages/pageannonce/jquery.ui.widget.js',
      '/js/pages/pageannonce/jquery.fileupload.js',
      '/js/pages/jquery-form-validator-lg-fr.js',
    ];
    res.view('compte/getmypassword', {
      title: "Babies Pets - Récuperez votre mot de passe puis connectez-vous sur babies-pets",
      'description': "Récupérez votre mot de passe puis connectez-vous sur babies-pets.fr afin d'accédez à toutes vos annonces, favoris. Visionnez vos messages reçus.",
    });
  },
  /**
   * Get my password.
   * @param req
   * @param res
   */
  sendpassword: function(req, res) {
    try {
      const email = req.body.email;
      const password = Math.random().toString(36).slice(-8);
      let userData;
      return User.findOne({email: email})
        .then(user => {
          if (!user) {
            return res.json(404, {message: "L'email n'a pas été trouvé"});
          }
          userData = user;
          return User.update(user.user_id, {
            password: password,
            updatedAt: new Date().toISOString()
          });
        })
        .then(() => {
          EmailService.sendLostPassword({
            email: email,
            password: password,
            pseudo: (userData.pseudo || ''),
          });
          return res.json(200, {});
        })
        .catch(err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },
  /**
   * Inscription to newsletter beta
   * @param req
   * @param res
     */
  beta:function(req, res) {
    try {
      if (!req.body.email) {
        return res.json(412, {message: "L'email est invalide"});
      }
      return Alerts.findOne({
        email: req.body.email,
        newsletter_id: 1,
      })
      .then(dataAlert => {
        if (dataAlert) {
          return res.json(200, {
            message: 'Vous avez déjà souhaité être prevenu pour la sortie beta du site'
          });
        }
        return Alerts.create({
          email: req.body.email,
          newsletter_id: 1,
        })
      })
      .then(() => res.json(200, {}))
      .catch(err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },

};
