var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var UserSchema = Schema({
    name: String,
    surname: String,
    nick: String,
    email: String,
    password: String,
    role: String,
    image: String
});

module.exports = mongoose.model('User',UserSchema); /*primer parametro es el nombre de la entidad*/
                                                    /*segundo parametro: formato de cada uno de los objetos*/
                                                    /*aunque en el nombre sale 'User' al guardarlo en la bs de pone todo en muscula y se guarda como : "users" osea se pluraliza*/