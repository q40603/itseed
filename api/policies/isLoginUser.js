/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function (req, res, next) {

    // User is allowed, proceed to the next policy,
    // or if this is the last policy, the controller
    //console.log(typeof req.session.authorized);
    //console.log(req.session.authorized.user);
    //console.log(req.session)
    if (typeof req.session.authorized !== "undefined" && req.session.authorized.user == true){
        return next();
    }
    // User is not allowed
    // (default res.forbidden() behavior can be overridden in `config/403.js`)
    return res.redirect(`/login?redirect=${req.path}`);
};