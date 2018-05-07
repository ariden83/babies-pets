"use strict";

const is = require('is_js');

/**
 * ContactsController
 *
 * @description :: Server-side logic for managing Banners
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
module.exports = {

   /**
    * Contact page.
    * @param req
    * @param res
    * @returns {*}
    */
   index: function (req, res) {
     res.locals.scripts = [
       '//www.google.com/recaptcha/api.js',
       '/js/pages/pageannonce/jquery.ui.widget.js',
       '/js/pages/pageannonce/jquery.fileupload.js',
        '/js/pages/jquery-form-validator-lg-fr.js',
     ];
      res.view('contact/index', {
         title: 'Contacter la team babies-pets dès maintenant',
         message: "Vous avez une question sur les annonces, vous voulez signaler un bug, nous faire parvenir des idées d'amélioration, tout se passe ici",
      });
      return res;
   },
   /**
    * Valid contact form.
    * @param req
    * @param res
    */
   message: function (req, res) {
     try {
      // if missing title param
      if (!req.body.email || !is.email(req.body.email)) {
          return res.json(412, {message: req.__('Missing email param')});
      } else if (!req.body.subject || !is.string(req.body.subject)) {
          return res.json(412, {message: req.__('Missing subject param')});
      } else if (!req.body.message || !is.string(req.body.message)) {
          return res.json(412, {message: req.__('Missing message param')});
      } else if (!req.body.name || !is.string(req.body.name)) {
          return res.json(412, {message: req.__('Missing name param')});
      }
       Contacts.create(
       {
         name: req.body.name,
         email: req.body.email,
         subject: req.body.subject,
         message: req.body.message,
       },
       err => {
         if (err) {
             res.status(404);
             res.json(res);
         }
         // Send an email.
         EmailService.sendNewContactMessage({
           email: req.body.email,
           name: req.body.name,
           subject: req.body.subject,
           message: req.body.message,
         });
         return res.json({
             message: 'Un message a été envoyé à la team Babies-pets',
         });
       });
     } catch (err) {
       return res.json(500, err);
     }
   },
    /**
     * Reported bug
     * @param req
     * @param res
     * @returns {Promise.<T>}
     */
    reported:function(req, res) {
      try {
        if (!req.body.message || req.body.message.length < 5) {
            return res.json(412, {message: req.__('Field message is not informed')});
        }
        Contacts.create(
        {
            name: 'Reported bug',
            email: req.body.email || 'unsigned@echangebannieres.fr',
            subject: 'Reported bug',
            message: req.body.message || '',
        },
        err => {
            if (err) {
                res.status(404);
                res.json(res);
            }
            return res.json({
                message: req.__('Bug was reported to the team'),
            });
        });
      } catch (err) {
        return res.json(500, err);
      }
    },
};

