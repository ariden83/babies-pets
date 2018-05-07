"use strict";

const crypto = require('crypto');
const Promise = require('bluebird');


/**
 * AccountController
 *
 * @description :: Server-side logic for managing accounts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
module.exports = {
  index: function(req, res) {
    try {
      res.locals.scripts = [
        '//maps.googleapis.com/maps/api/js?v=3.27&key=AIzaSyDK8HrrenYsNXBi2-7eZRJvQVcg7VOaSb8',
      ];
      let _userData;
      return User.findOne({user_id: req.user_id})
      .then(userData => {
        _userData = userData;
        if (!userData.favoris || !userData.favoris.length) {
          return [];
        }
        return Advertisement.find({ad_id: userData.favoris});
      })
      .then(favoris => res.view('favoris/index', {
        title: "Babies Pets - Vous venez de créer un nouveau compte sur babies-pets",
        description: "Bienvenu, vous venez de créer un nouveau compte sur babies-pets.fr. Vous pouvez désormais publiez vos annonces, voir vos messages reçus.",
        user: _userData,
        favoris: favoris,
      }))
      .catch(err => ErrorResp.view(res, err));
    } catch (err) {
      return ErrorResp.view(res, err);
    }
  },

  /**
   * Get all favoris for a user
   * @param req
   * @param res
   * @returns {*}
     */
  list: function (req, res) {
    try {
      if (req.user_id) {
        let _userData;
        return User.findOne({user_id: req.user_id})
        .then(userData => {
          _userData = userData;
          if (!userData.favoris || !userData.favoris.length) {
            return [];
          }
          return Advertisement.find({ad_id: userData.favoris});
        })
        .then(favoris => {
          return res.view('favoris/list', {
            favoris: favoris,
            layout: false,
          });
        });
      } else if (req.body.favoris && req.body.favoris.length) {
        return Advertisement.find({ad_id: req.body.favoris.split(",")})
        .then(favoris => {
          return res.view('favoris/list', {
            favoris: favoris,
            layout: false,
          });
        });
      } else {
        return res.view('favoris/list', {
          favoris: [],
          layout: false,
        });
      }
    } catch (err) {
      sails.log.warn(err);
      return res.view('500', {
        title: "babies-pets - erreur serveur",
        message: "Erreur sur la page babies-pets, contacter la team si l'erreur se reproduit",
        error: 'Erreur serveur, veuillez recommencer',
        statusCode: 500,
      });
    }
  },
  /**
   * Add a new favoris
   * @param req
   * @param res
   * @returns {*}
     */
  ajouter: function (req, res) {
    try {
      if (!req.params || !req.params.id) {
        return res.notFound(412, {message: 'Le favoris n\'a pas été trouvé'});
      }
      return User.findOne({user_id: req.user_id})
        .then(user => {
          if (!user) {
            return res.json(404, {
              message: "Erreur serveur, veuillez vous reconnecter"
            });
          }
          let favoris = user.favoris;
          if (~favoris.indexOf(req.params.id)) {
            return res.json(409, {
              message: "Vous aviez déjà ajouté ce favoris",
            });
          }
          favoris.push(req.params.id);
          return User.update(req.user_id, {
            favoris: favoris
          })
          .then(() => {
            return res.json(200, {
              message: "Votre favoris a été ajouté",
            });
          })
        })
        .catch(err => {
          sails.log.info(err);
          return res.json(err.status || 500, {err: err});
        });
    } catch (err) {
      return res.json(500, err);
    }
  },

  /**
   * Edit an user.
   *
   * @param req
   * @param res
   * @returns {*}
   */
  retirer: function (req, res) {
    try {
      if (!req.params || !req.params.id) {
        return res.notFound(412, {message: 'Le favoris n\'a pas été trouvé'});
      }
      return User.findOne({user_id: req.user_id})
        .then(user => {
          if (!user) {
            return res.json(404, {
              message: "Erreur serveur, veuillez vous reconnecter"
            });
          }
          let favoris = user.favoris;
          if (!~favoris.indexOf(req.params.id)) {
            return res.json(404, {
              message: "Vous aviez déjà supprimé ce favoris",
            });
          }
          favoris.splice(favoris.indexOf(req.params.id), 1);
          return User.update(req.user_id, {
            favoris: favoris
          })
          .then(() => {
            return res.json(200, {
              message: "Votre favoris a été ajouté",
            });
          })
        })
        .catch(err => {
          sails.log.info(err);
          return res.json(err.status || 500, {err: err});
        });
    } catch (err) {
      return res.json(500, err);
    }
  },
};
