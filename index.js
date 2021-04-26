var app = require('./app');

/* Conexion BD */


var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
/* mongoose.connect('mongodb://localhost:27017/curso_mean_social',{useMongoclient: true}) */
mongoose.connect('mongodb+srv://Biws:graffiti333@cluster0.vbt69.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',{useNewUrlParser: true,useUnifiedTopology:true})
  .then(() =>{
      console.log("La conexion a la base de datos se ha realizado correctamente");

      /* crear servidor */
      app.set('port', process.env.PORT || 3800);
      app.listen(app.get('port'), () => {
         console.log('Servidor corriendo en http://localhost:'+app.get('port'));
      });

  })
  .catch(err => console.log(err));

  
/* Conexion BD */



