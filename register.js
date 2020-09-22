
const Sequelize = require('sequelize');
const config = require('./config');


var sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        idle: 30000
    }
});

var User = sequelize.define('user', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    name: Sequelize.STRING(100),
    password: Sequelize.STRING(100),
    createdAt: Sequelize.BIGINT
}, {
        timestamps: false
    });

    var now = Date.now();

function re(name,password) {
    if(true) {
        User.create({
            name: name,
            password: password || '123456',
            createdAt: now
        }).then(function (u) {
            console.log('created.'+JSON.stringify(u));
        }).catch(function(err) {
            console.log('failed.'+err)
        });
    }
    else {};
}
    

async function se(name, password) {
  var user = await User.findAll({
      where : {
          name: name
      }
  })
  if (user[0]) {
      return {name: user[0].name, password: user[0].password, id: user[0].id }
  } else {
      return 'null'
  }
}

module.exports = {
  re: re,
  se: se
}       
