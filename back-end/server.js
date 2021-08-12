const express = require('express');
const mysql= require('mysql');
const crypto= require('crypto');
const session = require('express-session');
const mysqlSession = require('express-mysql-session')(session);
const app = express();
const fs = require('fs');
const multer = require('multer');
const send = require('send');
const cors = require('cors');
const { log } = require('console');
const { query } = require('express');
const storage= multer.diskStorage({

  destination: (req,file,cb)=>{
    cb(null,'uploads')
  },
  filename: (req,file,cb)=>{

    const { originalname } = file;
    cb(null, originalname);
  }

})
const upload = multer({storage : storage})
var compteur = 1;
var id_etu_test= null;
//MongoDB connection

// app.set('view engine','ejs');
// const dbURI = 'mongodb+srv://MohamedBk:MohamedBk159@firstcluster.lf4x6.mongodb.net/ForumDB?retryWrites=true&w=majority';

// mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
//     .then( (result) => {
//         app.listen(3000)
//         console.log('Connected successfuly to the DB');
//         })
//     .catch(err => console.log(err));

/***  MySQL connection  ***/ 
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password:"MohamedBk159",
    database:"pfe-final",
    multipleStatements: true
  });
var adminAuth= false;
var id_etudiant_actuel;
connection.connect((err)=>{
    
    if(err){throw err;}
    console.log('Database Connected...');
    app.listen(5000)
})
const sessionStore = new mysqlSession({},connection);

app.use(cors());
var corsMiddleware = function(req, res, next) {
   //replace localhost with actual host
  res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, PATCH, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Authorization');

  next();
}

app.use(corsMiddleware);
// app.use((req,res,next)=>
//     {
//         res.setHeader('Access-Control-Allow-Origin', '*');
//         next();
//     }
// )
app.use(express.static('style'));

app.use(session(

  {
    
    secret: "bimo secret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore
  }

))
app.use(express.json({limit : '50mb'}));
app.use(express.urlencoded({limit: '50mb',extended: true}));
const AdminIsAuth = (req,res,next) =>{

    if(req.session.isAuth && adminAuth ){
      next();
    }
    else{
      res.send({connectionString:"Vous devez vous connectez!"})
    }

}
const isAuth = (req,res,next)=>{

  if(req.session.isAuth){
    next()
  }
  else{
    res.send({message:"Non connecté"});
  }

}


const scrt="how is it"  







//  app.get('/add-discussion', (req,res)=>{

//     const discussion = new Discussion({
//         titreDeDiscussion: 'Première Discussion',
//         description: 'Voici la description du premiere discussion'
//      });
//      discussion.save()
//      .then((result)=>{
//          res.send(result);
//      })
//      .catch((err)=>{
//          console.log(err);
//      })

// });
app.post('/onlyfortest/:id',(req,res)=>{
  const id = req.params.id;
  connection.query(`SELECT * FROM etudiant WHERE id_cne= "${id}";`,(err,first_result)=>{
    console.log(first_result[0]);
  })

})
app.get('/logout',isAuth,(req,res)=>{
  req.session.isAuth = false;
  req.session.user=null;
  adminAuth = false;
  res.redirect('/');
})
app.get('/test',(req,res)=>{


 

})

// Database tables alternatives


// ROUTES
app.get('/',(req,res)=>{
  console.log('/ ::')
 res.redirect('/login');   

});
app.get('/testonly',(req,res)=>{

  var myob = {

  }

})
app.get('/id_etudiant',(req,res)=>{
  connection.query('SELECT * FROM etudiant WHERE id_cne = ?',req.session.user,(err,result)=>{

    if(err) throw err;
    res.send({etudiant: result[0]});

  })
  
})
//GET TABLEAU DES DISCUSSIONS POUR ETUDIANT
app.get('/discussions',(req,res)=>{
  
  connection.query(`SELECT s.*,e.nom,e.prenom  FROM sujet_discussion s inner join etudiant e on s.id_etudiant = e.id_cne WHERE s.etat != 0 ORDER BY s.nb_vues DESC;`,(err,result)=>{
    if(err) throw err;
    for(let i=0;i< result.length;i++){
    connection.query('SELECT count(*) nb_contributions FROM contribution WHERE id_sujet = ?',result[i].id_sujet,(err,result1)=>{
      result[i].nb_contributions = result1[0].nb_contributions;
      if(i== result.length -1) {
        res.send({discussions: result});
      }
    })       
      
    }   
  })
});
// GET LE NOMBRE DES CONTRIBUTION PAR SUJET DE DISCUSSIONS
app.get('/nombre-contributions/:id_sujet',(req,res)=>{
  const id_sujet = req.params.id_sujet;
  connection.query('select count(*) nb_contributions FROM contribution WHERE id_sujet = ?',id_sujet,(err,result)=>{
    res.send({nb_contributions :result[0].nb_contributions });
  })

})
//POST CONTRIBUTIONS A UN SUJET 
app.post('/ajouter-contribution',(req,res)=>{
  const dt = req.body;
  connection.query('INSERT INTO contribution (id_etudiant,id_sujet,description) VALUES (?,?,?);',
  [req.session.user,dt.id_sujet,dt.description],
  (err,result)=>{
    if(err) throw err;
    connection.query('SELECT r.*,e.nom,e.prenom FROM contribution r inner join etudiant e on r.id_etudiant = e.id_cne where r.id_contribution = LAST_INSERT_ID();',(err,result1)=>{
      
      res.send({message: "contribution ajoutée"});
    })
  }
  )
})
// GET A SPECIFIC DISCUSSION WITH ITS CONTRBUTIONS
app.get('/discussion/:id_sujet',isAuth,(req,res)=>{
  const id_sujet = req.params.id_sujet;
  connection.query('SELECT * FROM sujet_discussion s inner join etudiant e on s.id_etudiant = e.id_cne WHERE etat != 0 AND id_sujet = ?;'+
  ' SELECT * FROM contribution c inner join etudiant e on c.id_etudiant = e.id_cne WHERE id_sujet= ?;',
   [id_sujet,id_sujet],(err,result)=>{
    res.send({discussion: result[0],contributions: result[1]});
  } )
});
//GET TABLEAU DES MODULES
app.get('/modules',(req,res)=>{
  connection.query('SELECT * FROM module;',(err,result)=>{
    res.send({modules: result});
  })
});
// GET IF ETUDIANT EST AUTHENTIFIE
app.get('/connected',(req,res)=>{
  if(adminAuth){
    res.send({moderateur: true});
  }else if(req.session.isAuth){
    res.send({connected: true});
  }
  else {
    res.send({connected: false});
  }
})
// 
app.get('/first_module',(req,res)=>{
  connection.query('SELECT * FROM module limit 1;',(err,result)=>{
    console.log("here is the module : ",result[0]);
    res.send({module: result[0]});
  })
})
//INCREMENT VIEWS FOR DISCUSSIONS
app.post('/discussion/vue',(req,res)=>{
  const id_sujet = req.body.id_sujet;
  connection.query('SELECT * FROM sujet_discussion where id_sujet=?',id_sujet,(err,result0)=>{
    if(err) throw err;
      const vue = result0[0].nb_vues + 1;
      connection.query('UPDATE sujet_discussion SET nb_vues= ? WHERE id_sujet = ?',[vue,id_sujet],(err,result1)=>{
        if(err) throw err;
      })
  })
})
//INCREMENT VIEWS FOR QUESTIONS
app.post('/question/vue',(req,res)=>{
  const id_question = req.body.id_question;
  connection.query('SELECT * FROM question where id_question=?',id_question,(err,result0)=>{
    if(err) throw err;
      const vue = result0[0].nb_vues + 1;
      connection.query('UPDATE question SET nb_vues= ? WHERE id_question = ?',[vue,id_question],(err,result1)=>{
        if(err) throw err;
      })
  })
})
//GET QUESTIONS OF A SPECIFIC MODULE
app.get('/:id_module/questions',(req,res)=>{
  const id_module = req.params.id_module;
  connection.query(`SELECT * FROM question q inner join etudiant e on q.id_etudiant = e.id_cne WHERE q.id_module = ${id_module} ORDER BY q.date_creation DESC;`,(err,result)=>{
    for(let i=0;i<result.length;i++){
      connection.query(`SELECT count(*) nb_reponses FROM reponse WHERE id_question = ${result[i].id_question}`,(err,result1)=>{
        result[i].nb_reponses = result1[0].nb_reponses;
        if(i == result.length -1 ){
          res.send({questions: result});
          }
      })
      
    }
  });
})
// GET A SPECIFIC QUESTION WITH ITS SPECIFIC RESPONSES
app.get('/question/:id_question',(req,res)=>{
  const id_question = req.params.id_question;
  connection.query('SELECT * FROM question q inner join etudiant e on e.id_cne = q.id_etudiant WHERE id_question = ? ;SELECT * FROM reponse r inner join etudiant e on r.id_etudiant = e.id_cne WHERE id_question = ? ORDER BY (vote_positive - vote_negative) DESC',[id_question,id_question],(err,result)=>{
     
    res.send({question: result[0],reponses: result[1]});
      
  });
})
//POST SUPPORT PEDAGOGIQUE MODO
app.post('/create-support-moderateur',(req,res)=>{
  const bd = req.body;
  const base64 = bd.contenu;
  const finalBase64 = base64.substring(28);
  console.log("entered");

  const fileBlob = Buffer.from(finalBase64,'base64');

  connection.query('INSERT INTO support_pedagogique (id_etudiant,id_module,description,type_support,contenu,titre,auteur,publie)' + 
                   ' VALUES ("moderateur",?,?,?,?,?,?,1);'
                   ,[bd.id_module,bd.description,bd.type_support,fileBlob,bd.titre,bd.auteur]
                   , (err,result) =>{
                     if(err) console.log(err);
                     else{
                     
                     res.send({messagesuccess: "Felicitations... "})
                     }
                   }
  );
  
})
//POST SUPPORT PEDAGOGIQUE ETUDIANT
app.post('/create-support',(req,res)=>{
  const bd = req.body;
  const base64 = bd.contenu;
  const finalBase64 = base64.substring(28);
  console.log("entered");

  const fileBlob = Buffer.from(finalBase64,'base64');

  connection.query('INSERT INTO support_pedagogique (id_etudiant,id_module,description,type_support,contenu,titre,auteur)' + 
                   ' VALUES (?,?,?,?,?,?,?);'
                   ,[req.session.user,bd.id_module,bd.description,bd.type_support,fileBlob,bd.titre,bd.auteur]
                   , (err,result) =>{
                     if(err) console.log(err);
                     else{
                     res.send({messagesuccess: "Felicitations... "})
                     }
                   }
  );
  
})
// GET SUPPORT PEDAGOGIQUE 
app.get('/support/:id',(req,res)=>{
  const id = req.params.id;
  connection.query('SELECT * FROM support_pedagogique WHERE id_support= ?',id,(err,result)=>{

    const Str64 = "data:application/pdf;base64," + result[0].contenu.toString('base64');
    result[0].contenu = Str64;
    res.send({support: result[0]});

  })

})
app.get('/all-supports',(req,res)=>{


  connection.query('SELECT id_support,id_etudiant,id_module,description,date_creation,type_support,titre,nb_telechargements,auteur FROM support_pedagogique WHERE publie=1',(err,result)=>{

    
    res.send({support: result});

  })

})
app.get('/all-supports-unapproved',(req,res)=>{


  connection.query('SELECT id_support,id_etudiant,id_module,description,date_creation,type_support,titre,nb_telechargements,auteur FROM support_pedagogique WHERE publie=0',(err,result)=>{

    
    res.send({support: result});

  })

})
// POST AJOUTER REPONSE
app.post('/ajouter-reponse',(req,res)=>{
  const dt = req.body;
  connection.query('INSERT INTO reponse (id_etudiant,id_question,description) VALUES (?,?,?);',
  [req.session.user,dt.id_question,dt.description],
  (err,result)=>{
    if(err) throw err;
    connection.query('SELECT * FROM reponse r inner join etudiant e on r.id_etudiant = e.id_cne where r.id_reponse = LAST_INSERT_ID();',(err,result1)=>{
      res.send({reponseAjoute: result1[0]});
    })
  }
  )
})
// GET MODULES 
app.get('/discussions-modules',isAuth, (req,res)=>{     
    connection.query('SELECT * FROM module;SELECT * FROM sujet_discussion WHERE etat != 0;',(err,result)=>{
      res.send({modules : result[0],discussions: result[1]});
    });
})  
//Moderator ROUTES
app.get('/acces-moderateur/bord-moderateur',AdminIsAuth,(req,res)=>{
  res.render('acces-moderateur/bord-moderateur');
})
//CREATE NEW USER
app.post('/edit-utilisateur',(req,res)=>{

  var submit_option = req.body.option;
  var id_user = req.body.id;
  console.log(req.body);
  if(submit_option == "verouiller")
  {
    connection.query('UPDATE etudiant SET compte_actif = 0 WHERE id_cne=?;',id_user,(err,result)=>{
      
      if(err) throw err;
      res.send({message:"compte verouillé"})
    })
  }
  else if(submit_option == "deverouiller")
  {
    connection.query('UPDATE etudiant SET compte_actif = 1 WHERE id_cne=?;',id_user,(err,result)=>{

      if(err) throw err;
      res.send({message:"compte deverouillé"});
    })
  }
  else{
    console.log("undefined variable in edit-utilisateur");
  }
  
})
//MODIFIER UN UTILISATEUR
app.post('/gerer-utilisateurs/modifier-utilisateur',(req,res)=>{

  
 
  
  const bd = req.body;
  var login_mail ='';
  var nom='';
  var prenom='';
  var cin='';
  var mobile='';
  var id_str='';
  var filiere='';
  var pwd_str='';
  var hashedPassword;
 
  if(bd.login_mail != ''){

    
    connection.query(`UPDATE etudiant SET login_mail="${bd.login_mail}" WHERE id_cne="${bd.id_cne}"`,(err,result)=>{


      if(err) console.log(err);
      
    })
  }
  if(bd.nom != ''){
    connection.query(`UPDATE etudiant SET nom="${bd.nom}" WHERE id_cne="${bd.id_cne}"`,(err,result)=>{


      if(err) console.log(err);
      
    })

  }
  if(bd.prenom != ''){
    
    connection.query(`UPDATE etudiant SET prenom="${bd.prenom}" WHERE id_cne="${bd.id_cne}"`,(err,result)=>{


      if(err) console.log(err);
      
    })
  }
  if(bd.cin != ''){
   
    connection.query(`UPDATE etudiant SET cin="${bd.cin}" WHERE id_cne="${bd.id_cne}"`,(err,result)=>{


      if(err) console.log(err);
      
    })
  }
  if(bd.mobile != ''){
    connection.query(`UPDATE etudiant SET mobile="${bd.mobile}" WHERE id_cne="${bd.id_cne}"`,(err,result)=>{


      if(err) console.log(err);
      
    })
  }
  if(bd.id_cne != ''){
    id_str = `id_cne = ${bd.id_cne},`;
  }
  if(bd.filiere != ''){
    connection.query(`UPDATE etudiant SET filiere="${bd.filiere}" WHERE id_cne="${bd.id_cne}"`,(err,result)=>{


      if(err) console.log(err);
      
    })
  }
  if(bd.password != ''){
    hashedPassword = crypto.createHmac('sha256',scrt).update(bd.password).digest('base64');
    connection.query(`UPDATE etudiant SET mdp="${hashedPassword}" WHERE id_cne="${bd.id_cne}"`,(err,result)=>{


      if(err) console.log(err);
      
    })
  }
 
    res.send({message:"modif success"})
    
    
    
    
  }
)
// LE MODERATEUR ACCEPTE OU REFUSE SUPPORT_PEDAGOGIQUE
app.post('/decision-support',(req,res)=>{

  const decision = req.body.decision;
  const id = req.body.id_support;
  console.log(req.body)
  if(decision== "accepter"){
  connection.query('UPDATE support_pedagogique SET publie=1 WHERE id_support=?;',id,(err,res)=>{
    if(err) console.log(err);
  })
  }
  else{
    connection.query(`DELETE FROM support_pedagogique WHERE id_support = ${id}`,(err,res)=>{
      if(err) console.log(err)
    })
  }
  connection.query('SELECT * FROM support_pedagogique WHERE publie=0;',(err,result)=>{
    res.send({supports:result});
  })

})
//SUPPRIMER UTILISATEUR
app.post('/supprimer-compte',(req,res)=>{
  const id = req.body.id_cne;
  connection.query(`UPDATE reponse set id_etudiant="anonyme" WHERE id_etudiant = "${id}";
                    UPDATE question set id_etudiant="anonyme" WHERE id_etudiant = "${id}";
                    UPDATE contribution set id_etudiant="anonyme" WHERE id_etudiant = "${id}";
                    UPDATE sujet_discussion set id_etudiant="anonyme" WHERE id_etudiant = "${id}";
                    UPDATE support_pedagogique set id_etudiant="anonyme" WHERE id_etudiant = "${id}";
                    `,(err,result)=>{
                      if(err) throw err;
                      connection.query(`DELETE FROM etudiant where id_cne = "${id}"`,(err,result)=>{
                        if(err) throw err;
                        res.send({message:"suppression successful"})
                      })
                    })

})
// LE MODERATEUR SUPPRIME UN UTILISATEUR
app.post('/gerer-utilisateurs/supprimer-utilisateur/:id',AdminIsAuth,(req,res)=>{

  const id = req.params.id;
  connection.query('DELETE FROM etudiant where id_cne=?',id,(err,result)=>{

    if(err) console.log(err);

    res.redirect('/gerer-utilisateurs')

  })

})

// LE MODERATEUR AJOUTE UN UTILISATEUR 
app.post('/gerer-utilisateurs/ajouter-utilisateur',AdminIsAuth,(req,res)=>{

  const etudiant = req.body;
  connection.query('SELECT * from etudiant WHERE login_mail = ? OR id_cne = ?',[etudiant.login_mail, etudiant.id_cne],(err,result)=>{
    if(err) {
      res.send({failMessage: "echec d'ajout"});
      throw err;}
    if(result.length>0){
      res.send({failMessage: "user already exists"});
    }
    else{
      
      var password = crypto.createHmac('sha256',scrt).update(etudiant.password).digest('base64')
      connection.query('INSERT INTO etudiant (id_cne,nom,prenom,login_mail,mdp,filiere,mobile,cin) VALUES (?,?,?,?,?,?,?,?)',
      [etudiant.id_cne,etudiant.nom,etudiant.prenom,etudiant.login_mail,password,etudiant.filiere,etudiant.mobile,etudiant.cin],
      (err,result)=>{

        if(err) console.log(err);
        res.send({successMessage: "L'etudiant a été ajouté avec succès! "});
      })
    }
  })

})

//AFFICHER LA LISTE DES ETUDIANTS POUR LE MODO
app.get('/gerer-utilisateurs',AdminIsAuth,(req,res)=>{
  const users = connection.query('SELECT * FROM etudiant',(err,result)=>{

    if(err) console.log(err);
    res.send({Utilisateurs: result});


  })
  
})
// CONFIRMER OU DEMENTIR ABUS
app.post('/gerer-abus/action',(req,res)=>{
  const type = req.body.type;
  const id= req.body.id;
  var bd = req.body;
  
  if(bd.action == "dementir"){
      connection.query(`UPDATE ${type} SET abus= 0  WHERE id_${type}  = ${id};`,(err,result)=>{

        if(err) throw err;
        res.send({message: "l'abus a été dementi"});
      });
  }
  else {
    if(type =="question"){
    connection.query(`DELETE FROM reponse WHERE id_question = ?`,id,(err,result1)=>{
      if(err) throw err;
      connection.query(`SELECT e.nb_abus_commis,e.id_cne,t.id_${type}
                     FROM etudiant e inner join ${type} t 
                     on e.id_cne = t.id_etudiant 
                      WHERE id_${type} = ${id};
                     `,(err,result)=>{
                       if(err) throw err
                       
                       
                       const nb_abus_commis_plus = result[0].nb_abus_commis + 1;
                       const id_cne = result[0].id_cne;
                       connection.query('UPDATE etudiant SET nb_abus_commis = ? WHERE id_cne = ?;DELETE FROM question WHERE id_question=?',[nb_abus_commis_plus,id_cne,id],(err,result)=>{
                         if(err){throw err}
                         else {
                           res.send({message:"l'abus a été confirmé"});
                         }
                       })
                     });
    })
    }
     else{
      connection.query(`SELECT e.nb_abus_commis,e.id_cne 
      FROM etudiant e inner join ${type} t 
      on e.id_cne = t.id_etudiant 
      WHERE t.id_${type} = ${id};
      
      `,(err,result)=>{
        if(err) throw err
        const nb_abus_commis_plus = result[0].nb_abus_commis + 1;
        const id_cne = result[0].id_cne;
        connection.query(`UPDATE etudiant SET nb_abus_commis = ? WHERE id_cne = ?;DELETE FROM ${type} WHERE id_${type}= ${id};`,[nb_abus_commis_plus,id_cne],(err,result)=>{
          if(err){throw err}
          else {
            res.send({message:"l'abus a été confirmé"});
          }
        })
      });
     }                
  }
})
//RECHERCHER QUESTION PAR TITRE
app.get('/research-question/:titre',(req,res)=>{

  const titre = req.params.titre;
  connection.query(`SELECT * FROM question where titre LIKE "%${titre}%"`,(err,result)=>{
    res.send({questions: result});
  })

})
//AFFICHER LES ABUS COMMIS DANS L'INTERFACE MODERATEUR
app.get('/gerer-abus',(req,res)=>{
  connection.query('SELECT q.*,e.nom,e.prenom FROM question q inner join etudiant e on q.id_etudiant=e.id_cne WHERE q.abus = 1;'+
  'SELECT c.*,e.nom,e.prenom FROM contribution c inner join etudiant e on c.id_etudiant = e.id_cne  WHERE abus = 1;'+
  'SELECT r.*,e.nom,e.prenom FROM reponse r inner join etudiant e on r.id_etudiant = e.id_cne WHERE abus = 1;',(err,result)=>{

    result[0].map(element =>{
      element.type = "question"
    })
    result[1].map(element =>{
      element.type = "contribution"
    })
    result[2].map(element =>{
      element.type = "reponse"
    })
    const arr = result[0].concat(result[1].concat(result[2]))
    arr.sort(function compare(a, b) {
      var dateA = new Date(a.date_creation);
      var dateB = new Date(b.date_creation);
      return dateA - dateB;})
    res.send({abus: arr});
  });
})

//ACCEPTER OU REFUSER LES SUJET DE DISCUSSIONS MODERATEUR
app.post('/gerer-discussions/evaluer',AdminIsAuth,(req,res)=>{
  var id = req.body.id_sujet;
  var bd = req.body;
  if(bd.option == "accepter"){
    connection.query('UPDATE sujet_discussion SET etat  = 1 WHERE id_sujet = ?',id,(err,result)=>{
      if(err) console.log(err);
      res.send({message:"sujet accepté"})
    })
  }else
  {
    if(bd.option == "refuser"){
      connection.query('DELETE FROM sujet_discussion WHERE id_sujet=?',id,(err,result)=>{
        if (err) console.log(err);
        res.send({message:"sujet refusé et supprimé"});
      })
    }
  }
})

// AFFICHER LES DEMANDES DE SUJETS DE DISCUSSIONS DANS L'INTERFACE MODERATEUR
app.get('/gerer-discussions',AdminIsAuth,(req,res)=>{
  
  connection.query('SELECT * FROM sujet_discussion WHERE etat = 0',(err,result)=>{
  
    res.send({sujets: result});
    
  })
  
})

// SUPPRIMER MODULE
app.post('/supprimer-module',AdminIsAuth,(req,res)=>{
  var id = req.body.id_module;
  connection.query('DELETE FROM module WHERE id_module= ?',id,(err,result)=>{

    if(err) console.log(err);
    res.send({message:"module supprimé"});
  })

})

//AJOUTER MODULE MODO
app.post('/gerer-modules',AdminIsAuth,(req,res)=>{
 var module = req.body;
 connection.query('SELECT * FROM module where nom_module = ?',module.nom_module,(err,result)=>{
  if( result.length > 0 ){
    res.render('acces-moderateur/gerer-modules');
  }
  else{
    connection.query('INSERT INTO module (nom_module) VALUES (?)',module.nom_module,(err)=>{
      if(err) console.log(err);
      res.send({message:"module ajouté"});  
   });
  }
 })
})
// MODIFIER MODULE
app.post('/modifier-module',(req,res)=>{

  const id = req.body.id_module;

  connection.query(`UPDATE module set nom_module = "${req.body.nom_module}" WHERE id_module= ${id}`,(err,result)=>{
    if(err) throw err;
    res.send({message:"module updated successfully"});
  })




})

//AFFICHER LES MODULES POUR MODERATEUR
app.get('/gerer-modules',AdminIsAuth,(req,res)=>{
  connection.query('SELECT * FROM module',(err,result)=>{
    {
      res.render('acces-moderateur/gerer-modules',{Modules:result});
      }
  })
})

// AJOUTER SUPPORT PEDAGOGIQUE POUR MODERATEUR
app.post('/gestion-contenu-web',upload.single('file'),(req,res)=>{

var bd = req.body;
if(adminAuth){
connection.query('INSERT INTO support_pedagogique (id_etudiant,id_module,) VALUES ("Moderateur",?,?,?,?,?,?)',module.nom_module,(err)=>{


  if(err) console.log(err);
  res.redirect('/gerer-modules');

});
}

})
// AFFICHER LES DEMANDES DE SUPPORT PEDAGOGIQUES DANS L'INTERFACE MODERATEUR
app.get('/gestion-contenu-web',AdminIsAuth,(req,res)=>{
  connection.query('SELECT * FROM module;SELECT * FROM support_pedagogique WHERE publie = 0;',(err,result)=>{

    
    result[1].forEach(f =>{

        f.file.lastModifiedDate = f.date_creation;
        f.file.name= f.titre+'.pdf';      
        send(f.file);
    })
    res.render('acces-moderateur/gestion-contenu-web',{Modules: result[0],Supports:result[1]});

  })
  
})

// Discussion Create
app.post('/create-discussion',(req,res)=>{

  var bd = req.body;
  connection.query('INSERT INTO sujet_discussion (id_etudiant,titre,description) VALUES (?,?,?)',[req.session.user,bd.titre,bd.description],(err,result)=>{

    if (err) console.log(err);
    res.redirect('/');

  })


})
app.get('/discussions/create',isAuth,(req,res)=>{

  res.render('create-discussion');   
 
 })

// Question GET and POST   

//CREER QUESTION POUR ETUDIANT
app.post('/create-question',isAuth,(req,res)=>{
  
  const bd = req.body;

  

    connection.query('INSERT INTO question (id_etudiant,id_module,titre,description) VALUES (?,?,?,?)',[req.session.user,bd.id_module,bd.titre,bd.description],(error,result2)=>{

      if(error) console.log(err);
      res.send({messagesuccess:"la question a été ajouté avec succès"});
        
    })


  
  
})
//AFFICHER LES MODULES EXISTANTS POUR L'ETUDIANT;
app.get('/create-question',isAuth,(err,res)=>{

  
  connection.query('SELECT * FROM module',(err,result)=>{

    res.send({Modules: result });

  })

})
//SIGNALER ABUS REPONSE OU QUESTION
app.post('/signaler',(req,res)=>{

  const id = req.body.id;
  const type = req.body.type;
  console.log(id,"  ",type)
  connection.query(`UPDATE ${type} SET abus = 1 WHERE id_${type} = ${id}`,(err,result)=>{
    if(err) throw err;
    connection.query('select nb_abus_signales from etudiant where id_cne = ?',req.session.user,(err,result1)=>{
      if(err) throw err;
      res.send({message: `la ${type} a été signalé correctement`})
    })
    
  });

})
//VOTER DISCUSSION POSITIVEMENT OU NEGATIVEMENT
app.post('/voter_discussion',(req,res)=>{

  var newvote;
  
  const signe = req.body.signe;
  const id = req.body.id_sujet;
  connection.query('select * from sujet_discussion where id_sujet = ? ',id,(err,result0)=>{
    if(signe == "positive"){
    newvote = result0[0].vote_positive + 1;
    }
    else{
    newvote = result0[0].vote_negative + 1;
    }
    connection.query('UPDATE sujet_discussion SET vote_' + signe +  '= ? WHERE id_sujet= ? ;',[newvote,id],(err,result)=>{

      if(err) throw err;
      res.send({message:"Le vote a été effectué!"});

    })
  })

});
// VOTER QUESTION POSITIVEMENT OU NEGATIVEMENT
app.post('/voter_question',(req,res)=>{
  var newvote;
  
  const signe = req.body.signe;
  const id = req.body.id_question;
  connection.query('select * from question where id_question = ? ',id,(err,result0)=>{
    if(signe == "positif"){
    newvote = result0[0].vote_positif + 1;
    }
    else{
    newvote = result0[0].vote_negatif + 1;
    }
    connection.query('UPDATE question SET vote_' + signe +  '= ? WHERE id_question= ? ;',[newvote,id],(err,result)=>{

      if(err) throw err;
      res.send({message:"Le vote a été effectué!"});

    })
  })

});
// VOTER REPONSE POSITIVEMENT OU NEGATIVEMENT
app.post('/voter_reponse',(req,res)=>{
  var newvote;
  
  const signe = req.body.signe;
  const id = req.body.id_reponse;
  connection.query('select * from reponse where id_reponse = ? ',id,(err,result0)=>{
    if(signe == "positive"){
    newvote = result0[0].vote_positive + 1;
    }
    else{
    newvote = result0[0].vote_negative + 1;
    }
    connection.query('UPDATE reponse SET vote_' + signe +  '= ? WHERE id_reponse= ? ;',[newvote,id],(err,result)=>{

      if(err) throw err;
      res.send({message:"Le vote a été effectué!"});

    })
  })

});
//VOTER CONTRIBUTION POSITIVEMENT OU NEGATIVEMENT
app.post('/voter_contribution',(req,res)=>{
  var newvote;
  
  const signe = req.body.signe;
  const id = req.body.id_contribution;
  connection.query('select * from contribution where id_contribution = ? ',id,(err,result0)=>{
    if(signe == "positive"){
    newvote = result0[0].vote_positive + 1;
    }
    else{
    newvote = result0[0].vote_negative + 1;
    }
    connection.query('UPDATE contribution SET vote_' + signe +  '= ? WHERE id_contribution= ? ;',[newvote,id],(err,result)=>{

      if(err) throw err;
      res.send({message:"Le vote a été effectué!"});

    })
  })

});
// VOTER POSITIVEMENT OU NEGATIVEMENT A UNE QUESTION
app.post('question/voter/:id/:signe',(req,res)=>{

  const signe = req.params.signe;
  const id = req.params.id;
  connection.query('select * from question where id_question = ? ',id,(err,result0)=>{
    if(signe == "positive"){
    const newvote = result0[0].vote_positif + 1;
    }
    else{
      const newvote = result0[0].vote_negatif + 1;
    }
    connection.query('UPDATE question SET vote_' + signe +  '= ? WHERE id_question= ? ;',[newvote,id],(err,result)=>{

      if(err) throw err;
      res.send({message:"Le vote a été effectué!"});

    })
  })

});
// AJOUTER REPONSE A UNE QUESTION
app.post('/question/:id',(req,res)=>{

  const id = req.params.id;
  const bd = req.body;
  connection.query('INSERT INTO reponse (id_etudiant,id_question,description) VALUES(?,?,?)',[req.session.user,id,bd.description],(err,result)=>{
    if(err) throw err;
    res.send({message: "la reponse a été ajouté avec succes"});
  })
});
// AFFICHER LA QUESTION ET SES REPONSES
app.get('/questions/:id',(req,res)=>{

  const id = req.params.id;
  connection.query('SELECT * FROM question WHERE id_question = ?;SELECT * FROM reponse WHERE id_question = ?',[id,id],(err,result)=>{

      if(err) throw err;
    
      res.send({

        question : result[0],
        reponse: result[1]

      })


  })
  


})

// LOGIN GET AND POST
app.post("/login",(req,res)=>{

  const credentials= req.body;
  
  
  connection.query('SELECT * FROM moderateur WHERE login = ?',credentials.login,(err,moderateur)=>{
    
    if(err) console.log(err);
    if(moderateur.length > 0){

      const hashedPassword = crypto.createHmac('sha256',scrt).update(credentials.password).digest('base64')


      if(hashedPassword == moderateur[0].password){
        
        req.session.isAuth = true;
        adminAuth = true;
        
        res.send({admin: true});
      }else{
        res.send({message : "this is not a modo"})
      }
    }
    else{

      connection.query('SELECT * FROM etudiant WHERE login_mail = ?',credentials.login,(err,result)=>{

    if(result.length>0){
    
              var hashedPassword = crypto.createHmac('sha256',scrt).update(credentials.password).digest('base64')
              id_etu_test= result[0].id_cne;
                
            if(hashedPassword == result[0].mdp){
                if(result[0].compte_actif){
                  req.session.isAuth = true;
                  req.session.user= result[0].id_cne;
                  console.log(req.session.user);
                  res.send({message : "Connecté avec succes",user:true});
                }
                else{
                  res.send({message: "Le compte est Verouillé. Contactez le modérateur pour plus d'informations"})
                }
            }
            else{
              if(result[0].compte_actif){
                if(compteur == 3){
                  connection.query('UPDATE etudiant SET compte_actif=0 WHERE id_cne= ?;',id_etu_test,(err,result)=>{
                    if(err) console.log(err);
                    compteur = 1;
                    res.send({message: "Le compte est Verouillé. Contactez le modérateur pour plus d'informations"})
                  })      
              }else{
                  const essais = 3 - compteur;
                  compteur++;
                  res.send({message: "La combinaison Email/Mot de passe est fausse.\n Il vous reste    " + essais + " essais."}) 
                  }
              }
              else{
              res.send({message: "Le compte est Verouillé. Contactez le modérateur pour plus d'informations"})
              }
            }
          
          
        
        
      }
    })
    }

  })
  
}) 
app.get('/login',(req,res)=>{
    if(req.session.isAuth || adminAuth){

      if(adminAuth){
        console.log("adminAuth");
        res.send({admin: adminAuth});
      }
      else{
        res.send({user: req.session.isAuth});
      }

    }
    else{
      res.send({loginMessage: "personne n'est connecté"});  
    }
   })

app.get('/data-test',(req,res)=>{

  
  res.send({
    first_col: 'hello',
    second_int: 3,
  });
  res.render('test');

})
// Render 404 PAGE   
app.use((req,res)=>{

    res.status(404).render('404');
    
})

