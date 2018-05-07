"use strict";

const Promise = require('bluebird');
const _ = require('lodash');
const uuid = require('uuid');
const Redis = require('redis');
const crypto = require('crypto');

const client = Redis.createClient(6379, '127.0.0.1');
client.on("error", err => {
  sails.log.warn("Error " + err);
  throw Error("Server error");
  return false;
});

const numByPage = 12;

/**
 * EspeceController
 *
 * @description :: Server-side logic for managing ad
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
module.exports = {
  /**
   * Liste des races par type d'animal
   * @param req
   * @param res
   * @returns {*}
   */
  races: function (req, res) {
    res.locals.scripts = [
      '/js/back/jquery.easy-autocomplete.min.js'
    ];

    const query = _.pick(req.params, ['name', 'type', 'group']);
    const currentPage = (req.query.page || 1);

    if (query.type === 'all') {
      delete query.type;
    }

    return Especes.find({
      where: query,
      sort: 'name ASC',
      limit: numByPage,
      skip: (numByPage * currentPage) - numByPage,
    })
    .then(data => {
      return Promise.each(data, (key, i) => {
        return Promise.resolve()
        .then(() => new ThumborService({
          file: key.file || '',
          height: 230,
          width: 262,
        }).read())
        .then(file => {
          key.file = file;
        })
        .catch(err => {
          sails.log.warn(err);
        });
      })
      .then(() => data)
      .catch(err => {
        sails.log.warn(err);
      });
    })
    .then(data => {
      query.page = currentPage;
      query.data = data;
      query.maxPerPage = numByPage;
      query.title =  'Babies Pets - liste des type de ' + (query.type ? query.type : 'tous les animaux domestiques') + (currentPage > 1 ? ', page ' + currentPage : '');
      query.description =  'Babies Pets - retrouvez toutes les races de ' + (query.type ? query.type : 'tous les animaux domestiques') + ' avec leur fiche détaillée, des conseils de santé, poid, type de poils'  + (currentPage > 1 ? ', page ' + currentPage : '');
      query.type = query.type || 'all';
      res.view('espece/races', query);
    })
    .catch(err => {
      sails.log.warn(err);
      res.redirect('/');
      return null;
    });
  },

  race: function (req, res) {

    if (!req.params || !req.params.type || !~['chiens', 'chats', 'rongeurs', 'oiseaux', 'reptiles'].indexOf(req.params.type) ) {
      res.redirect('/');
      return null;
    }

    if (!req.params || !req.params.url) {
      res.redirect('/espece/' + req.params.type);
      return null;
    }

    let dataRace = {};
    let dataImg = '';
    return Especes.find({
      where: {
        type: req.params.type,
        url: req.params.url,
      },
      limit: 1,
    })
    .then(data => {
      if (!data || !data[0]) {
        let error = new Error('La fiche de l\'animal n\'a pas été trouvée :: ' + req.params.url);
        error.code = 404;
        throw error;
      }
      dataRace = data[0];
      return new ThumborService({
        file: dataRace.file || '',
        height: 430,
        width: 780,
      }).read();
    })
    // find 3 other animal in same taille
    .then(img => {
      dataImg = img;
      const where = {
        id: {
          $ne: dataRace.id,
        },
        type: dataRace.type,
      };
      if (dataRace.type === 'chiens') {
        where.group = dataRace.group;
        where.taille = dataRace.taille;
      }
      return Especes.find({
        where: where,
        limit: 2,
        skip: Math.floor(Math.random() * (5 - 1)) + 1
      })
      .catch(err => {
        sails.log.warn(err);
        return [];
      })
    })
    .then(data => {
      data.forEach(function(e) {
        e.file = new ThumborService({
          file: e.file || '',
          height: 230,
          width: 288,
        }).read();
      });
      return data;
    })
    .then(list => res.view('espece/race', {
      img: (dataImg || null),
      data: dataRace,
      other: list,
      title: 'Fiche du ' + dataRace.name + ' (' + dataRace.type +') : caractère, physique, santé sur Babies Pets.fr',
      description: (dataRace.chapeau || Textes.cutText(dataRace.description, 320)),
    }))
    .catch(err => {
      sails.log.warn(err);
      res.redirect('/especes/' + req.params.type);
      return null;
    });
  },

  load:function(req, res) {
    const query = _.pick(req.body, ['name', 'type', 'group']);
    let error = new Error();
    if (query.type === 'all') {
      delete query.type;
    }
    const currentPage = (req.body.page || 1);
    return Especes.find({
      where: query,
      sort: 'name ASC',
      limit: numByPage,
      skip: (numByPage * currentPage) - numByPage,
    })
    .then(data => {
      if (!data.length) {
        error.code = 404;
        error.message = 'Toutes les fiches sont affichées';
        throw error;
      }
      return Promise.each(data, (key, i) => {
        return Promise.resolve()
          .then(() => new ThumborService({
            file: key.file || '',
            height: 230,
            width: 262,
          }).read())
          .then(file => {
            key.file = file;
          })
          .catch(err => {
            sails.log.warn(err);
          });
      })
      .then(() => data)
      .catch(err => {
        sails.log.warn(err);
      });
    })
    .then(data => res.view('espece/load', {
      layout: false,
      data: data,
    }))
    .catch(err => {
      err.noLayout = true;
      return ErrorResp.json(res, err);
    });
  },

  add:function(req, res) {
    res.locals.scripts = [
      '/js/pages/pageannonce/jquery.ui.widget.js',
      '/js/pages/pageannonce/jquery.fileupload.js',
      '/js/pages/jquery-form-validator-lg-fr.js',

      '/js/pages/pageannonce/jquery.iframe-transport.js',
      "/js/pages/pageannonce/bootstrap-wysiwyg.js",

      '/js/pages/pageannonce/load-image.all.min.js',
      '/js/pages/pageannonce/canvas-to-blob.min.js',
      '/js/pages/pageannonce/jquery.Jcrop.js',
      '/js/pages/pageannonce/jquery.iframe-transport.js',
      '/js/pages/pageannonce/jquery.fileupload-process.js',
      '/js/pages/pageannonce/jquery.fileupload-image.js',
      "/js/pages/pageannonce/jquery.fileupload-validate.js",
      "/js/pages/pageannonce/jquery.fileupload-ui.js",
      '/js/back/jquery.easy-autocomplete.min.js',
    ];
    res.view('espece/add', {
      title: 'Babies Pets - proposez à la team babies-pets une nouvelle fiche pour un animal',
      'description': 'Rédigez une  fiche pour un chien, un chats, un poisson, un oiseau, un cheval, un rongeur... La team babies-pets validera la fiche dans les plus brefs délais',
      user_id: req.user_id || null,
    });
  },

  /**
   * Upload file
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
          height: 430,
          width: 780,
        },
        function (err, uploadedFiles){
          if (err) {
            return res.json(err.status || 500, {err: err});
          }
          if (!uploadedFiles || !uploadedFiles[0] || !uploadedFiles[0].extra || !uploadedFiles[0].extra.thumbUrl) {
            return res.json( 500, {err: "Upload file extra data not found"});
          }
          const imgPath = uploadedFiles[0].extra.thumbUrl;
          return res.json({
            message: uploadedFiles.length + ' file(s) uploaded successfully!',
            file: imgPath,
            id: uploadedFiles[0].extra.id,
          });
        });
    } catch (err) {
      return res.json(412, err);
    }
  },

  /**
   * Create a new espece
   * @param req
   * @param res
   * @returns {*}
   */
  create:function(req, res) {
    try {
      if (!req.body) {
        return res.json(412, {message: 'Erreur, veuillez recommencer'});
      } else if (!req.body.nom) {
        return res.json(412, {message: 'Le champ nom est manquant'});
      } else if (!req.body.type) {
        return res.json(412, {message: 'Le champ type est manquant'});
      } else if (!req.body.description) {
        return res.json(412, {message: 'Le champ description est manquant'});
      }
      return Promise.resolve()
      .then(() => {
        const body = _.extend({
          ip: req.ip || null,
        }, req.body);
        return UserService.create(req.user_id, body, res);
      })
      .then(userId => Especes.create({
        type: req.body.type,
        name: req.body.nom,
        taille: req.body.taille,
        poil: req.body.poil,
        hauteur: req.body.hauteur,
        poid: req.body.poid,
        sociabilite: req.body.sociabilite,
        description: req.body.description,
        robe: req.body.robe,
        queue: req.body.queue,
        caracteristic: req.body.caracteristic,
        sante: req.body.sante,
        caractere: req.body.caractere,
        image: req.body.list,
        group: req.body.group,
        esperance: req.body.esperance,
        url: Tag.generate(req.body.nom),
        file: req.body.list,
        active: false,
        user_id: userId,
      }))
      .then(especeData => {
        if (!especeData) {
          let error = new Error('Erreur serveur, impossible de créer la nouvelle espèce, veuillez recommencer');
          throw error;
        }
        return res.json(200, {
          message: 'Created',
          nom: especeData.nom,
        });
      })
      .catch(err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },

  list:function(req, res) {
    try {
      res.type('application/json');
      if (req.query.all) {
        let especes = Espece.getAll();
        especes.forEach(e => {
          e.url = Tag.generate(e.name);
        });
        return res.view('backespeces/list', {
          layout: false,
          especes: especes,
        });
      }
      let query = {};
      if (req.query.type && ~['chiens', 'chats', 'rongeurs', 'oiseaux', 'reptiles'].indexOf(req.query.type)) {
        query.where = {
          type: req.query.type
        };
      }
      return Especes.find(query)
        .then(data => {
          data.forEach(e => {
            e.url = Tag.generate(e.name);
          });
          res.view('backespeces/list', {
            layout: false,
            especes: data,
          });
        })
        .catch(err => ErrorResp.json(res, err));
    } catch (err) {
      return ErrorResp.json(res, err);
    }
  },

  group: function(req, res) {
    res.view('espece/group', {
      title: 'Babies Pets - Description des groupes de races de chiens',
      'description': 'Retrouvez la description et détails de chaque groupe de races de chiens sur babies-pets.fr',
    });
  }
};
