var jwt = require('jwt-simple');
var moment = require ('moment');
var secret = 'clave_secreta_curso_red_social'

exports.createToken = function (user){
    var payload = { /* tendra datos del usuario a codificar */
        sub: user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role : user.role,
        image: user.image,
        iat: moment().unix(),/* fecha creacion del toquen */
        exp: moment().add(30, 'days').unix /* fecha expitacion del toquen */
    };

    return jwt.encode(payload,secret);/* codifica todo y genera toquen */
};



