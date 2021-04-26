var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');
var User = require('../models/user');
var Follow = require('../models/follow');
var Message = require('../models/message');

function probando(req,res){
    res.status(200).send({message: 'Hola desde controlador message'});
}
function saveMessage(req,res){
    var params = req.body;
    if(!params.text || !params.receiver){
        return res.status(200).send({message: 'Envia los campos necesarios'});
    }
    
    var message = new Message();
    message.emitter = req.user.sub;    
    message.receiver = params.receiver;    
    message.text = params.text;    
    message.created_at = moment().unix();
    message.viewed = 'false';
    //console.log(message.creates_at);
    
    message.save((err, messageStored) => {
        if(err)return res.status(500).send({message: 'Error en la peticion'});
        if(!messageStored) return  res.status(500).send({message: 'Error al enviar el mensaje'});
        return res.status(200).send({message: messageStored}); 
    });
}
function getReceivedMessages(req,res)  {/*muestra mensajes que yo he recivido en mi cuenta */
    var userId = req.user.sub;
    var page = 1;
    if (req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 4;
    /* en el segundo parametro del populate escribo los campos que quiero que se muestren, el resto los omite */
    Message.find({receiver: userId}).populate('emitter', 'name surname image nick _id' ).sort('-created_at').paginate(page,itemsPerPage,(err,messages,total) => {
        if(err) return res.status(500).send({message: 'Error en la peticion'});
        if(!messages) return res.status(404).send({message: 'No hay mensajes'});
        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/itemsPerPage),
            messages
        });                 
    });    
}
/* lista mensajes solo los que enviamos */
function getEmmitMessages(req,res)  {/*muestra mensajes que yo he recivido en mi cuenta */
    var userId = req.user.sub;
    var page = 1;
    if (req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 4;
    /* en el segundo parametro del populate escribo los campos que quiero que se muestren, el resto los omite */
    Message.find({emitter: userId}).populate('emitter receiver', 'name surname image nick _id' ).sort('-created_at').paginate(page,itemsPerPage,(err,messages,total) => {
        if(err) return res.status(500).send({message: 'Error en la peticion'});
        if(!messages) return res.status(404).send({message: 'No hay mensajes'});
        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/itemsPerPage),
            messages
        });                 
    });    
}

/* me regresa los mensajes que me han enviado pero que no he leido */
function getUnviewedMessages(req,res){
    var userId = req.user.sub;

    Message.count({receiver: userId, viewed: 'false'}).exec((err, count) => {
        if(err) return res.status(500).send({message: 'Error en la peticion'});                 
        return res.status(200).send({
            'unviewed' : count
        });
    });
}

/* marcar mensajes que me han enviado como leidos */
function saveViewedMessage(req,res){
    var userId = req.user.sub;
    Message.update({receiver:userId, viewed: 'false'}, {viewed : 'true'},{"multi":true}, (err, messageUpdate) => {
        if(err) return res.status(500).send({message: 'Error en la peticion'});
        return res.status(200).send({message: messageUpdate});
    })
}

module.exports = {
    probando ,
    saveMessage ,
    getReceivedMessages,
    getEmmitMessages ,
    getUnviewedMessages,
    saveViewedMessage 
}


