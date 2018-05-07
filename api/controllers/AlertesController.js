"use strict";

const Promise = require('bluebird');

const listNewsletters = {
  chiens: {
    type: 'chiens',
    id: 2
  },
  chats: {
    type: 'chats',
    id: 3
  },
  rongeurs: {
    type: 'rongeurs',
    id: 4
  },
  oiseaux: {
    type: 'oiseaux',
    id: 5
  },
  reptiles: {
    type: 'reptiles',
    id: 6
  }
};
/**
 * AccountController
 *
 * @description :: Server-side logic for managing accounts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
module.exports = {
  /**
   * Inscription to newsletter beta
   * @param req
   * @param res
   */
  inscription:function(req, res) {
    try {
      if (!req.body.email && !req.user_id) {
        return res.json(412, {message: "L'inscription n'a pas été prise en compte, veuillez vous connecter"});
      }
      let dataUser = {};
      return Promise.resolve()
      .then(() => {
        if (!req.user_id && req.body.email) {
          dataUser.email = req.body.email;
          return dataUser;
        }
        dataUser.user_id = req.user_id;
        return User.findOne({user_id: req.user_id})
        .then(userData => {
          if (!userData) {
            let error = new Error("L'utilisateur n'a pas été trouvé");
            error.code = 404;
            throw error;
          }
          dataUser.email = userData.email;
          return dataUser;
        })
        .catch(() => {
          if (!req.body.email) {
            let error = new Error("La session a expirée, veuillez recommencer");
            error.code = 400;
            throw error;
          }
          return dataUser;
        });
      })
      .then(() => {
        return Promise.each(Object.keys(listNewsletters), key => {
          let newsletter = listNewsletters[key];
          if (!req.body[newsletter.type]) {
            return null;
          }
          const userToSave = dataUser;
          userToSave.newsletter_id = newsletter.id;
          return Alerts.findOne({
            newsletter_id: newsletter.id,
            email: userToSave.email,
          })
          .then(dataAlert => {
            if (dataAlert) {
              return null;
            }
            return Alerts.create(userToSave);
          });
        })
      })
      .then(() => res.json(200, {}))
      .catch(err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },
  /**
   * Signalement d'une annonce.
   * @returns {*}
   */
  signaler:function(req, res) {
    try {
      if (!req.body.message) {
        return res.json(412, {message: "N'oubliez pas de renseigner un message pour soumettre votre alerte"});
      }
      return Advertisement.findOne({ad_id: req.params.id})
      .then(data => {
        if (!data) {
          const error = new Error('Annonce non trouvée');
          error.code = 404;
          throw error;
        }
        EmailService.sendSignalement({
          id: data.ad_id,
          type: 'annonce',
          raison: req.body.raison || 'non renseigné',
          message: req.body.message,
          url: data.url,
          title: data.title,
          user: req.user_id || 'inconnu',
        });
        return res.json({
          message: 'Votre signalement a bien été envoyé',
        });
      })
      .catch (err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },

  /**
   * Signalement d'un éleveur.
   * @returns {*}
   */
  signalerProfil:function(req, res) {
    try {
      if (!req.body.message) {
        return res.json(412, {message: "N'oubliez pas de renseigner un message pour soumettre votre alerte"});
      }
      return User.findOne({user_id: req.params.id})
      .then(data => {
        if (!data) {
          let error = new Error('Professionnel non trouvée');
          error.code = 404;
          throw error;
        }
        EmailService.sendSignalement({
          id: data.user_id,
          type: 'profil',
          raison: req.body.raison || 'non renseigné',
          message: req.body.message,
          url: data.url,
          title: data.title,
          user: req.user_id || 'inconnu',
        });
        return res.json({
          message: 'Votre signalement a bien été envoyé',
        });
      })
      .catch (err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },

  send:function(req, res) {
    try {
      if (!req.params || !req.params.type || !listNewsletters[req.params.type]) {
        res.redirect('/backoffice');
        return null;
      }
      let userToSend = [];
      let annonces = 0;
      return Alerts.find({
        newsletter_id: listNewsletters[req.params.type].id,
        active: true,
      })
      .then(dataUser => {
        if (!dataUser || !dataUser.length) {
          return [];
        };
        dataUser.forEach(function (user) {
          userToSend.push(user.email);
        });
        return Advertisement.find({
          where: {
            active: true,
            cat: listNewsletters[req.params.type].type,
          },
          sort: 'createdAt DESC',
          limit: 3,
        })
      })
      .then(adsData => {
        annonces = adsData.length;
        if (!adsData.length) {
          return null;
        }
        return EmailService.sendNewsletter({
          to: userToSend.toString(),
          cat: req.params.type,
          ads: adsData,
        })
      })
      .then(() => res.json({
        users: userToSend.length,
        list: userToSend.toString(),
        annonces: annonces,
        status: 'send',
      }))
      .catch (err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },
};
