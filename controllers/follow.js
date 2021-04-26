//var path = require('path');
//var fs = require('fs');
var mongoosePaginate = require('mongoose-pagination');
var User = require('../models/user');
var Follow = require ('../models/follow');



function saveFollows(req,res) {/* para seguir usuarios */
    var params = req.body;

    var follow = new Follow();
    follow.user = req.user.sub;
    follow.followed = params.followed;

    follow.save((err,followStores) => {
        if(err) return res.status(500).send({message: 'Error al guardar el seguimiento'});
        if(!followStores) return res.status(404).send({message: 'El seguimiento no se ha guardado'});
        res.status(200).send({follow: followStores});
    });        
}

function deleteFollow(req,res){
    var userId = req.user.sub;
    var followId = req.params.id;/* usuario al que dejaremos de seguir */
    Follow.find({'user': userId, 'followed':followId}).remove(err => {
        if(err) return res.status(500).send({message: 'Error al dejar de seguir'});    
        return res.status(200).send({message: 'El follow se ha eliminado'});            
    })
}

function getFollowingUsers(req,res){ /* lista usuarios a los que sigo */
    var userId = req.user.sub;
    if(req.params.id && req.params.page){
        userId = req.params.id;
    }
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }else{
        page = req.params.id;
    }

    var itemsPerPage = 4;
    Follow.find ( { user:userId}).populate({path: 'followed'}).paginate(page,itemsPerPage,(err,follows,total) => { /* busco todos los objetos en donde yo estoy siguiendo un usuario */
                                        /*con populate sustituyo el id de los usuarios al que sigo por toda su informacion */
        if (err) return res.status(500).send({message: 'Error en el servidor'});
        if(!follows) return res.status(404).send({message: 'No estas siguiendo a ningun usuario'});
         
        followUserIds(req.user.sub).then((value) =>{
            return res.status(200).send({                
                total: total,
                pages: Math.ceil(total/itemsPerPage),
                follows,
                users_following: value.following,
                user_follow_me:value.followed,
            });
        });
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


/*saca usuarios que nos siguen*/
function getFollowedUsers(req,res){
    var userId = req.user.sub;
    if(req.params.id && req.params.page){
        userId = req.params.id;
    }
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }else{
        page = req.params.id;
    }

    var itemsPerPage = 4;
    Follow.find ( { followed:userId}).populate( 'user ').paginate(page,itemsPerPage,(err,follows,total) => { /* busco todos los objetos en donde yo estoy siguiendo un usuario */
                                        /*con populate sustituyo el id de los usuarios al que sigo por toda su informacion */
        if (err) return res.status(500).send({message: 'Error en el servidor'});
        if(!follows) return res.status(404).send({message: 'No te sigue ningun usuario'});
        
        followUserIds(req.user.sub).then((value) =>{
            return res.status(200).send({                
                total: total,
                pages: Math.ceil(total/itemsPerPage),
                follows,
                users_following: value.following,
                user_follow_me:value.followed,
            });
        });
        
    });
}

/* sin paginar */
function getMyFollows(req,res){/* lista usuarios que estoy siguiendo o me siguen dependiendo de lo que llgue por url */
   var userId= req.user.sub;     

   var find = Follow.find({user:userId}); /* me saca usuarios que yo  sigo */

   if(req.params.followed){/* me saca usuarios que me estan siguiendo */
       find = Follow.find({followed: userId});
   }

   find.populate('user followed').exec((err,follows) => {
      if (err) return res.status(500).send({message: 'Error en el servidor'});
      if(!follows) return res.status(404).send({message: 'No sigues a ningun usuario'});
      return res.status(200).send({follows});
   });
}


module.exports={
    saveFollows,
    deleteFollow ,
    getFollowingUsers,
    getFollowedUsers,
    getMyFollows  
}
