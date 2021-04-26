var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PublicationSchema = Schema({
    text: String,
    file: String,
    created_at: String,
    user: {type: Schema.ObjectId, ref: 'User'} /*guarda id del usuario que creo esta publicacion junto con todos sus datos(name,surname,email.etc)*/
});

module.exports = mongoose.model('Publication',PublicationSchema);