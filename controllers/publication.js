var path = require ('path');
var fs = require('fs');
var moment = require ('moment');
var mongoosePaginate = require('mongoose-pagination');

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');
const { modelName } = require('../models/publication');
const publication = require('../models/publication');

function probando (req,res){
    res.status(200).send({message: ' hola desde el controlador publicaciones'});
}
function savePublication(req,res){
    var params = req.body;   

    if(!params.text ){
        return res.status(200),send({message: 'Debes enviar un texto'});
    }
    var publication = new Publication();
    publication.text= params.text;
    publication.file = 'null';
    publication.user = req.user.sub;
    publication.created_at = moment().unix();

    publication.save((err, publicationStores) => {
        if(err) return res.status(500).send({message: 'Error al guardar la publicacion'});
        if(!publicationStores) return res.status(404).send({message: 'La publicacion no ha sido guardada'});
        return res.status(200).send({publication: publicationStores});
    })
}
/* listar todas las publicaciones SOLO de los usuarios que yo sigo */
function getPublications(req,res){
    var page = 1;
    if(req.params.page){
        page= req.params.page;
    }
    var itemsPerPage= 4;
    Follow.find({user: req.user.sub}).populate('followed').exec((err,follows) => { /* regresa usuarios que yo estoy siguiendo */
        if(err) return res.status(500).send({message: 'Error al devolver el seguimiento'});
        
        var follows_clean = [];
        follows.forEach((follow) => {
            follows_clean.push(follow.followed);/* guardo todos los objetos followed con sus atributos */
        });
        follows_clean.push(req.user.sub);
        /*Busca en la collecion publicaciones los users que esten contenidos dentro de  follows_clean*/
        /* sort('-created_at'):los ordena por fecha de publicacion */
        publication.find({user: {"$in" : follows_clean}}).sort('-created_at').populate('user').paginate(page,itemsPerPage,(err,publications,total) => {
            if(err) return res.status(500).send({message: 'Error al devolver publicaciones'}); 
            if(!publication) return res.status(404).send({message: 'No hay publicaciones'});
            return  res.status(200).send({
                total_items: total,
                pages:Math.ceil(total/itemsPerPage),
                page:page,
                items_per_page: itemsPerPage,
                publications
            });
        })        
    });    
}


function getPublicationsUser(req,res){ /* muestra solo las publicaciones dle usuario especifico que elijamos */
    var page = 1;
    if(req.params.page){
        page= req.params.page;
    }

    var user = req.user.sub;
    if(req.params.user){
      user = req.params.user;        
    }

    var itemsPerPage= 4;    

        /*Busca en la collecion publicaciones los users que esten contenidos dentro de  follows_clean*/
        /* sort('-created_at'):los ordena por fecha de publicacion */
        publication.find({user: user}).sort('-created_at').populate('user').paginate(page,itemsPerPage,(err,publications,total) => {
            if(err) return res.status(500).send({message: 'Error al devolver publicaciones'}); 
            if(!publication) return res.status(404).send({message: 'No hay publicaciones'});
            return  res.status(200).send({
                total_items: total,
                pages:Math.ceil(total/itemsPerPage),
                page:page,
                items_per_page: itemsPerPage,
                publications
            });
        });         
}



/* conseguir publicacion en base a su id */
function getPublication(req,res){
    var  publicationId = req.params.id;
    Publication.findById(publicationId, (err, publication) => {
        if(err) return res.status(500).send({message: 'Error al devolver publicaciones'}); 
        if(!publication) return res.status(404).send({message: 'No existe la publicacion'});   
        return res.status(200).send({publication});     
    });
}
function deletePublication(req,res){
    var  publicationId = req.params.id;

    /* elimina una publicacion, pero solo si fue publicada por mi */
    Publication.find({'user': req.user.sub, '_id':publicationId}).remove(err => {
        if(err) return res.status(500).send({message: 'Error al borrar publicacion'}); 
        //if(!publication) return res.status(404).send({message: 'No se ha borrado la publicacion'});   
        return res.status(200).send({message: 'Publicacion eliminada'}); 
    })
}
function uploadImage (req,res){
    var publicationId = req.params.id;
    
    //if(err) return res.status(500).send({message: 'Error en la peticion'});   
    if(req.files){ /*  si se envio algun fichero desde el fd hace:*/
        var file_path = req.files.image.path; /*capturo direccion de donde se encuentra almacenado el archivo */        
        var file_split = file_path.split('\\'); /*divido todas sus partes en array*/       
        var file_name = file_split[2]; /* captulo lo que se encuentra en la posicion 2 del array anterior */        
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];/* capturo la extencion del archivo */
        console.log(file_ext);        

        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){

            Publication.findOne({'user': req.user.sub, '_id': publicationId}).exec((err,publication) => {
                if(publication){
                    /* actualizo documento  de publicacion*/
                    Publication.findByIdAndUpdate(publicationId, {file: file_name}, {new:true},(err,publicationUpdate)  => {
                        if(err) return res.status(500).send({message: 'Error en la peticion'});
                        if (!publicationUpdate) return res.status(404).send({message: 'No se ha podido actualizar la publicacion'});

                        return res.status(200).send({publication: publicationUpdate});                 
                    })
                }else{
                    return removeFilesOfUploads(res,file_path,'No tienes permiso para actualizar esta publicacion');                    
                }
            })

        }else{            
            return removeFilesOfUploads(res,file_path,'Extencion no valida');            
        }
    }else{        
        return res.status(200).send({message: 'No se han subido  imagenes'});        
    }
}
function removeFilesOfUploads(res,file_path, message){
    fs.unlink(file_path,(err) => { /* me borra el fichero ya guardado en carpeta uploads/users */
         return res.status(200).send({message: message});                
    });
}
function getImageFile(req,res){
   var image_File =  req.params.imageFile;
   var path_file = './uploads/publications/'+image_File;

   fs.exists(path_file, (exists) => {
       if(exists){
           res.sendFile(path.resolve(path_file));
       }else{
           res.status(200).send({message: 'No existe la imagen'});
       }
   })
}

 
module.exports = {
    probando,
    savePublication,
    getPublications,
    getPublicationsUser,
    getPublication,
    deletePublication,
    uploadImage,
    getImageFile
}