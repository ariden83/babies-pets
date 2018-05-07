"use strict";

const _ = require('lodash');

module.exports = {
  /**
   * Log
   * @param req
   * @param res
     */
  index:function(req, res) {
    try {
      let error = new Error();
      const query = _.assignIn({
        code: 200,
        message: 'Message unsigned',
        url: 'URL unsigned',
        type: 'info',
        navigateur: '',
        env: '',
        lang: 'fr',
        platform: '',
      }, req.query);

      error.code = query.code;
      error.message =  query.message;
      sails.log.info(error, query);

      return  res.json(error.code);

    } catch (err) {
      sails.log.warn(err);
      return ErrorResp.json(res, err);
    }
  },
};

