"use strict";

const Promise = require('bluebird');
const Redis = require('redis');

const client = Redis.createClient(6379, '127.0.0.1');
client.on("error", err => {
  sails.log.warn("Error " + err);
  throw Error("Server error");
  return false;
});

/**
 * ImagesController
 *
 * @description :: Server-side logic for managing Banners
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
module.exports = {
  /**
   * Upload file
   * @param req
   * @param res
   * @returns {*}
   */
  avatar:function(req, res) {
    try {
      req.file('images').upload(
        {
          // 5 mo
          maxBytes: 5000000,
          adapter: ThumborService,
          height: 258,
          width: 258,
        },
        function (err, uploadedFiles){
          if (err) {
            return res.json(err.status || 500, {err: err});
          }
          if (!uploadedFiles || !uploadedFiles[0] || !uploadedFiles[0].extra || !uploadedFiles[0].extra.thumbUrl) {
            return res.json( 500, {err: "Upload file extra data not found"});
          }
          let userAvatar = "";
          return Promise.resolve()
          .then(() => new ThumborService({
              file: uploadedFiles[0].extra.id || '',
              height: 258,
              width: 258,
            }).read())
          .then(avatar => {
            userAvatar = avatar;
            return User.update(req.user_id, {
              avatar: userAvatar,
            })
          })
          .then(() => res.json({
            file: userAvatar,
          }))
          .catch(err => ErrorResp.json(res, err));
        });
    } catch (err) {
      sails.log.warn(err);
      return res.json(412, err);
    }
  },

  /**
   * Upload page
   * @param req
   * @param res
   * @returns {*}
     */
  upload:function(req, res) {
    try {
      req.file('images').upload(
        {
          // 5 mo
          maxBytes: 5000000,
          adapter: ThumborService,
          height: 511,
          width: 683,
        },
        function (err, uploadedFiles){
          if (err) {
            return ErrorResp.json(res, err);
          }
          if (!uploadedFiles || !uploadedFiles[0] || !uploadedFiles[0].extra || !uploadedFiles[0].extra.thumbUrl) {
            let error = new Error("Upload file extra data not found");
            return ErrorResp.json(res, error);
          }
          return Promise.resolve()
          .then(() => new ThumborService({
            file: uploadedFiles[0].extra.id || '',
            height: 239,
            width: 319,
          }).read())
          .then(toff => res.json({
            file: toff,
            id: uploadedFiles[0].extra.id || '',
          }))
          .catch(err => ErrorResp.json(res, err));
        });
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },

  /**
   * Get list of path for images of current created annonce.
   * @param req
   * @param res
   * @returns {*}
     */
  getUploadImage:function(req, res) {
    const returnData = {
      images: [],
    };
    if (!req.body.list || req.body.list.length < 10) {
      return res.json(200, returnData);
    }
    return Promise.each(req.body.list.split(','), id => {
      let data = {
        path: new ThumborService({
            file: id || '',
            height: 239,
            width: 319,
          }).read(),
        id: id,
      };
      returnData.images.push(data);
    })
    .then(() => res.json(200, returnData))
    .catch(err => ErrorResp.json(res, err));
  },

  /**
   * Save an annonce
   * @param req
   * @param res
   * @returns {*}
     */
  save:function(req, res) {
    try {
      let images =  {};
      let error = new Error();
      const date = new Date();
      return Promise.resolve()
      /**
       * Field verification.
       */
      .then(() => {
        error.code = 412;
        error.mustConnect = 0;
        if (!req.body.description || req.body.description.length < 25) {
          error.message = 'Le champ description est invalide';
          throw error;
        } else if (!req.body.list || req.body.list.length < 10) {
          error.message = "Vous n'avez pas uploadé d'images pour votre annonce";
          throw error;
        } else if (!req.body.titre || req.body.titre.length < 5) {
          error.message = "Le champ titre est invalide";
          throw error;
        } else if (!req.body.type) {
          error.message = "Le champ catégorie est invalide";
          throw error;
        }
        /**
         * Si l'utilisateur n'est pas loggué
         */
        if (!req.user_id) {
          if (!req.body.postal || req.body.postal.length < 4) {
            error.message = 'Le champ code postal est erroné';
            throw error;
          }
          if (!req.body.professional) {
            error.message = "Le champ status de l'individu est invalide";
            throw error;
          }
        }
        const body = _.extend({
          ip: req.ip || null,
        }, req.body);
        return UserService.create(req.user_id, body, res);
      })
      /**
       * On le connecte
       */
      .then(userData => {
        let images = req.body.list.split(',');
        let imagesWithPath = {};
        images.forEach(function(e) {
          imagesWithPath[e] = new ThumborService({
            file: e || '',
            height: 511,
            width: 683,
          }).read();
        });
        let adDate = new Date();
        const desc = ToText.setDescription(req.body.description);
        return Advertisement.create({
          images: imagesWithPath,
          image: new ThumborService({
            file: images[0] || '',
            height: 197,
            width: 266,
          }).read(),
          user_id: userData.user_id,
          title: req.body.titre.charAt(0).toUpperCase() + req.body.titre.slice(1),
          description: desc,
          chapeau: ToText.setChapeau(desc),
          text: req.body.description,
          cat: req.body.type,
          date: adDate.getDate() + '/' + (adDate.getMonth() + 1) + '/' + adDate.getFullYear(),
          lat: (userData.details.lat || req.body.latitude || null),
          long: (userData.details.long || req.body.longitude || null),
          undercat: req.body.undertype || 'default',
          youtube: Youtube.setYoutubeEmbed(req.body.youtube || null),
          region: userData.details.region || null,
          departement: userData.departement || null,
          postal: userData.postal,
          price: req.body.price || 'don',
          phone: userData.phone || null,
          pseudo: userData.pseudo || null,
          professional: userData.professional || false,
          details: {
            profil: userData.url || null,
            departement: userData.details.departement || null,
            portee: req.body.portee || null,
            email: userData.email || null,
            siren: req.body.siren || null,
            animalIdent: req.body.animalIdent || null,
          },
          url: '/annonces/' + Tag.generate(req.body.type) + '/' +
            Tag.generate(req.body.undertype || 'default') + '/' +
            date.getFullYear() + '-' +
            (date.getMonth() + 1) + '-' +
            date.getDate() + '-' +
            Tag.generate(req.body.titre),
        })
        .catch(err => {
          error.message = "Des valeurs incorrectes ont été signalées";
          error.values =  err.message || err;
          error.mustConnect = 1;
          throw error;
        });
      })
      .then(adData => Advertisement.update(adData.ad_id, {
        editurl: '/mon-annonce/' + date.getFullYear() + '-' +
        (date.getMonth() + 1) + '-' + date.getDate() + '/' + adData.ad_id
      }))
      .then(adData => {
        EmailService.confirmAnnonce({
          title:  adData[0].title,
          description:  ToText.setDescription(adData[0].description, 100000),
          confirmation: 'http://www.babies-pets.fr/back/confirm/' + adData[0].ad_id,
          front: 'http://www.babies-pets.fr/' + adData[0].url,
        });
        return res.json({
          status: 'ok',
        });
      })
      .catch(err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },

  /**
   * Save an annonce
   * @param req
   * @param res
   * @returns {*}
   */
  edit:function(req, res) {
    let error = new Error();
    try {
      if (!req.params || !req.params.id) {
        return res.json(412, {message: 'L\'annonce n\'a pas été trouvée'});
      }
      // const t = this;
      // const date = new Date();
      let oldAnnonce;
      return Promise.resolve()
        .then(() => Advertisement.findOne(req.params.id))
        /**
         * Field verification.
         */
        .then(annonce => {
          if (!annonce) {
            error.message = "L'annonce n'a pas été trouvée";
            error.code = 404;
            throw error;
          }
          if (annonce.user_id !== req.user_id) {
            error.message = "Il semblerait que vous ne soyez pas le proprietaire de l'annonce";
            error.code = 401;
            throw error;
          }
          oldAnnonce = annonce;
          error.code = 412;
          error.mustConnect = 0;
          if (!req.body.description || req.body.description.length < 25) {
            error.message = "Le champ 'Votre texte' est invalide";
            throw error;
          }
          if (!req.body.list || req.body.list.length < 10) {
            error.message = "Vous n'avez pas uploadé d'images pour votre annonce";
            throw error;
          }
          if (!req.body.titre || req.body.titre.length < 5) {
            error.message = "Le champ 'Titre de l'annonce' est invalide";
            throw error;
          }
          if (!req.body.undertype) {
            error.message = "Le champ 'Espèce / race' est invalide";
            throw error;
          }
          let images = req.body.list.split(',');
          let imagesWithPath = {};
          images.forEach(function(e) {
            imagesWithPath[e] = new ThumborService({
              file: e || '',
              height: 511,
              width: 683,
            }).read();
          });
          let details = oldAnnonce.details;
          details.portee = req.body.portee || details.portee || null;
          details.animalIdent = req.body.animalIdent || details.animalIdent || null;
          const desc = ToText.setDescription(req.body.description);
          return Advertisement.update(req.params.id, {
            images: imagesWithPath,
            image: new ThumborService({
              file: images[0] || '',
              height: 197,
              width: 266,
            }).read(),
            title: req.body.titre.charAt(0).toUpperCase() + req.body.titre.slice(1),
            text: req.body.description,
            description: desc,
            chapeau: ToText.setChapeau(desc),
            undercat: req.body.undertype || oldAnnonce.undercat,
            price: req.body.price || oldAnnonce.price,
            youtube: Youtube.setYoutubeEmbed(req.body.youtube || null),
            details: details,
            active: false,
          });
        })
        .then(adData => {
          EmailService.modifAnnonce({
            title:  adData[0].title,
            description:  ToText.setDescription(adData[0].description, 100000),
            confirmation: 'http://www.babies-pets.fr/back/confirm/' + adData[0].ad_id,
            front: 'http://www.babies-pets.fr' + adData[0].url,
          });
          return res.json({
            status: 'ok',
          });
        })
        .catch(err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },
};
