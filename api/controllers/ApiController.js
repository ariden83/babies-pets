"use strict";

module.exports = {
  index: function (req, res) {
    res.view('api/index', {
      title: 'Service web proposé par le site babies-pets.fr',
      'description': 'Créez vos annonces depuis votre site web, listez et consultez vos messages reçus via les services web proposés par babies-pets.fr',
    });
    return res;
  },

  swaggerMessages: function (req, res) {
    res.view('api/swaggerMessages', {
      layout: false,
    });
    return res;
  },

  swaggerAnnonces: function (req, res) {
    res.view('api/swaggerAnnonces', {
      layout: false,
    });
    return res;
  },

};
