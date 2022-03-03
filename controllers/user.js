var bcrypt = require('bcrypt-nodejs');/* Para cifrar contraseñas */
var mongoosePaginate = require('mongoose-pagination');
var User = require('../models/user');
var Follow = require('../models/follow');
var Publication = require('../models/publication');
var jwt = require('../services/jwt');
var fs = require ('fs');/* nos permite trabajar con archivos */
var path = require('path'); /*  nos permite trabajar con rutas de ficheros */
//const { exists } = require('../models/user');


function home(req,res) {
    res.status(200).send({message: 'Hola mundo desde el servidor de node.js'});    
}

function pruebas(req,res) {
    res.status(200).send({message: 'Accion de pruebas desde el servidor de node.js'});    
}

function saveUser(req,res){
    var params = req.body; /* capturo lo que me llega del fd */
    var user = new User(); /* creo objeto user con atributos definidos en el modelo User */
    

    if(params.name && params.surname && params.nick && params.email &&params.password){ /* Si  llegan todos los campos hace: */
        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick;
        user.email = params.email; 
        user.role = 'ROLE_USER';
        user.image = null;

        User.find({$or:[ /*busca y compara el user.email y user. nick en todos los registros email y nick de la coleccion de usuarios  */
                           {email: user.email.toLowerCase()},/*toLowerCase: pasa a mayusculas en caso de estar alguna letra en mayuscula */
                           {nick: user.nick.toLowerCase()}
                    ]}).exec((err,users) => {
                        if(err) return res.status(500).send({message: 'Error en la peticion de usuarios'}); /* si regresa eror hace: */
                        if(users && users.length >= 1){ /* si por lo menos  uno concide(email o contraseña) hace: */
                          return res.status(200).send({message: 'El usuario ya fue registrado'});
                        }else{ /* si ninguno coincide hace:*/
                            bcrypt.hash(params.password, null, null,(err,hash) => { /* encripta la contraseña */
                                user.password = hash;/* le damos a la password el valor de la contraseña encriptada */
                                
                                user.save ((err,userStored) => { /* guarda el usuario en la bd */
                                    if(err) return res.status(500).send({message: 'Error al guardar usuario'}); /* si regresa eror hace: */
                                    if(userStored){  /* si regresa userStored es por que el usuario se guardo */
                                        //res.status(500).send({user: userStored})
                                        res.status(200).json({userStored});
                                    }else{
                                        res.status(404).send({message: 'No se ha registrado el usuario'});                    
                                    }
                                })
                            })
                        }
                    })
    }else{/* Si no llegan todos los campos hace: */
        res.status(200).send({
            message: 'Falta información requerida'
        });
    }
}
function loginUser(req,res){
    var params = req.body; /* capturo datos llegados del fd */
    
    var email = params.email;
    var password = params.password;    

    User.findOne({email: email}, (err,user) => {/* busco y comparo en la coleccion user de la bd el email */
        if(err) return res.status(500).send({message: 'Error en la paticion'}); /* Me puede regresar un error */
        if(user) { /* si encontro la coincidencia devuelve un user y hace: */                    
          bcrypt.compare(password,user.password,(err,check) =>{/* desencripta contraseña traida de la bd y la compara */
              if(check){ /* si hay check es por que coinciden las contraseñas y hace */
                if(params.gettoken){ /* si llega el toquen desde el fd */
                    return res.status(200).send({
                        token: jwt.createToken(user) /* muestro toquen */
                    });                   
                }else{
                   user.password=undefined; /* para no mostrar la contraseña por seguridad */  
                   return res.status(200).send({user});
                }
                
                
              }else{ /* si No coinciden las contraseñas hace */
                res.status(404).send({message: 'Contraseña incorrecta'});                   
              }
          }); 
        }else{/* si Nu encontro la coincidencia hace: */ 
            res.status(404).send({message: 'El usuario no está registrado'}); 
        }
    });
}

function getUser(req,res){
    var userId = req.params.id;/* capturo id que llega por url */
    
    User.findById(userId, (err,user) =>{
        if(err) return res.status(500).send({message: 'Error en la peticion'});
        if(!user)return res.send(404).send({message: 'El usuario no existe'});
        
        followThisUsers(req.user.sub, userId).then((value) => {
            user.password = undefined;/* oculto password por seguridad */
            return res.status(200).send({
                user,
                following: value.following,
                followed:value.followed});
        });

        //return res.status(200).send({user});
    });
}
async function followThisUsers(identity_user_id, user_id) {
    /* si yo sigo al usuario con id que lelga por url */
    var following = await Follow.findOne({ "user": identity_user_id, "followed": user_id }).exec().then((follow) => {           
        return follow;
    }).catch((err) => {
        return handleError(err);
    });
 
    /* si  me  sigue el usuario con id que lelga por url */
    var followed = await Follow.findOne({ "user": user_id, "followed": identity_user_id }).exec().then((follow) => {        
        return follow;
    }).catch((err) => {
        return handleError(err);
    });     
 
    return {
        following: following,
        followed: followed
    }
}

function getUsers(req,res){
    var identity_user_id=req.user.sub; /* recoge id del usuario logueado en el momento */        
    page = 1;
    if(req.params.page){
        page = req.params.page;        
    }
    var itemsPerPage = 5; /* cantidad de items mostrados por pagina */
    
    User.find().sort('_id').paginate(page,itemsPerPage,(err,users,total) =>{/* extrae todos la inf de la bd ordenada por id */
        if(err) return res.status(500).send({message: 'Error en la peticion'});
        if(!users) return res.status(404).send({message: 'No hay usuarios disponibles'});
        followUserIds(identity_user_id).then((value) =>{
            return res.status(200).send({
                users, 
                users_following: value.following,
                user_follow_me:value.followed,           
                total,
                pages: Math.ceil(total/itemsPerPage)            
            });
        }); 
        /* return res.status(200).send({
            users,                       
            total,
            pages: Math.ceil(total/itemsPerPage)            
        });   */     
    });
}

async function followUserIds(user_id){
    /* usuarios que sigo */
    var following = await Follow.find({"user": user_id}).select({'_id': 0, '__uv': 0, 'user': 0}).exec().then((follows)=>{    
       return follows;    
    }).catch((err)=>{    
        return handleerror(err);    
    }); 

    //procesar following ids
    var following_clean=[];    
    following.forEach((follow)=>{    
        following_clean.push(follow.followed);    
    }); 

    
    /* usuarios que me siguen */
    var followed = await Follow.find({"followed": user_id}).select({'_id': 0, '__uv': 0, 'followed': 0}).exec().then((follows)=>{    
        return follows;     
    }).catch((err)=>{    
         return handleerror(err);    
    });   
    //console.log(following);

    //procesar followed ids
    var followed_clean=[];    
    followed.forEach((follow)=>{    
        followed_clean.push(follow.user);    
    });     


    return {    
    following: following_clean,    
    followed: followed_clean    
    }    
}
function getCounters(req,res){
    var userId = req.user.sub;
    
    if(req.params.id){
        userId = req.params.id;        
    } 
    getCountFollow(userId).then((value) => {
        return res.status(200).send(value);
    });
}

async function getCountFollow(user_id){
    var following = await Follow.countDocuments({ user: user_id }).exec() /* usuarios que sigo */
        .then((count) => {
            console.log(count);
            return count;
        }).catch((err) => { return handleError(err); });
 
    var followed = await Follow.countDocuments({ followed: user_id }).exec()/* usuarios que me siguen */
        .then((count) => {
            return count;
        }).catch((err) => { return handleError(err); });

    //var publications = await Publication.count({"user":user_id}).exec((err,count) => {
    var publications = await Publication.count({"user":user_id}).exec() 
        .then((count) => {
        return count;       
    }).catch((err) => { return handleError(err); });
  
    return { following: following, followed: followed, publications: publications }
}

function updateUser(req,res){
    var userId = req.params.id;/* captura id que llega por url */
    var update = req.body; /* capturo datos que remplezara los existentes en la bs */
    
    delete update.password;/*borramos propiedad password  */

    if(userId != req.user.sub){/*si el ide capturado por url es diferente al id del usuario logueado hace: */
        return res.status(500).send({message: 'No tienes permiso para actualizar los datos del usuario'});
    }
    
    //2
    User.find({$or:[ /*busca y compara el user.email y user. nick en todos los registros email y nick de la coleccion de usuarios  */
              {email: update.email.toLowerCase()},/*toLowerCase: pasa a mayusculas en caso de estar alguna letra en mayuscula */
              {nick: update.nick.toLowerCase()}
        ]}).exec((err,users) => {
            var user_isset = false;
            users.forEach((user) => {
                if(user && user._id != userId) user_isset= true;
            });
            if(user_isset) return res.status(404).send({message: 'Los datos ya estan en uso'});

            User.findByIdAndUpdate(userId,update, {new:true}, (err,userUpdate) => { /* con new:true me regresa el objeto ya actualizado */
              if(err) return res.status(500).send({message: 'Error en la peticion'});
              if (!userUpdate) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});

              return res.status(200).send({user: userUpdate}); 
            });   
        });
        //1
        //User.findByIdAndUpdate(userId,update, {new:true}, (err,userUpdate) => { /* con new:true me regresa el objeto ya actualizado */
        /*     if(err) return res.status(500).send({message: 'Error en la peticion'});
            if (!userUpdate) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});

            return res.status(200).send({user: userUpdate}); 
        });    */   
}

function uploadImage (req,res){
    var userId = req.params.id;
    
    //if(err) return res.status(500).send({message: 'Error en la peticion'});   
    if(req.files){ /*  si se envio algun fichero desde el fd hace:*/
        var file_path = req.files.image.path; /*capturo direccion de donde se encuentra almacenado el archivo */        
        var file_split = file_path.split('\\'); /*divido todas sus partes en array*/       
        var file_name = file_split[2]; /* captulo lo que se encuentra en la posicion 2 del array anterior */        
        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];/* capturo la extencion del archivo */
        console.log(file_ext);

        if(userId != req.user.sub){/*si el ide capturado por url es diferente al id del usuario logueado hace: */
            return removeFilesOfUploads(res,file_path,'No tienes permiso para actualizar los datos del usuario');             
        } 

        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
             /* actualizo documento  del usuario logueado(atributo imagen)*/
             User.findByIdAndUpdate(userId, {image: file_name}, {new:true},(err,userUpdate)  => {
                if(err) return res.status(500).send({message: 'Error en la peticion'});
                if (!userUpdate) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
        
                return res.status(200).send({user: userUpdate});                 
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
   var path_file = './uploads/users/'+image_File;

   fs.exists(path_file, (exists) => {
       if(exists){
           res.sendFile(path.resolve(path_file));
       }else{
           res.status(200).send({message: 'No existe la imagen'});
       }
   })
}


module.exports = {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers, 
    getCounters,   
    updateUser,
    uploadImage,
    getImageFile   
}




