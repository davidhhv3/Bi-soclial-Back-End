var jwt = require ('jwt-simple');
var moment = require ('moment');
var secret = 'clave_secreta_curso_red_social'

exports.ensureAuth = function(req,res,next){
    if(!req.headers.authorization){
        return res.status(403).send({message: 'La peticion no tiene la cabecera de autenticacion'});
    }
    var token = req.headers.authorization.replace(/['"]+/g, '');/* quitamos las comillar que llegan en el token */
    try{
        var payload = jwt.decode(token,secret);/* decodifica token */
         if (payload.exp <= moment().unix()){
             return res.status(401).send({
                 message: 'El token ha expirado'
             });
         }
    }catch(ex){
        return res.status(404).send({
            message: 'El token no es valido'
        });      
    }
    req.user = payload;/* al decodificar el token se capturan todos los datos del usuario en el payload */
                       /* guardo toda esa informacion en req.user, el req me permite tener acceso a dichos valores */
                       /* en cualquier funcion que tenga req como parametro */

    next(); /* para que ejecute la siguiente funcioncion definida en users controllers*/
    
}
