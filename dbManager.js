module.exports = {    
    getDBExpressionData,
    getDBUserData
};

const simplify = require('./simplify.js');

var Connection = require('tedious').Connection;
var Request = require('tedious').Request;

// Refactor method - Replace magic numbers with Symbolic Constants 
const BAD_REQUEST = 400;

// DB Connection 
const connectionString = { 
    userName: 'dbAdmin', 
    password: 'Password1!', 
    server: 'syde322appex3-lilytim.database.windows.net',
    options: {
      database: 'SYDE322AppEx3-LilyTim', 
      encrypt: true,
      rowCollectionOnRequestCompletion: true
    }
};

// run SQL query and obtain result set data
function getDBExpressionData(req, res, inputstring, currentExpression, code) {
    // Connect with database
    var connection = new Connection(connectionString);
    connection.on('connect', function(err) {
      if (err) {
        res.status(BAD_REQUEST).json({ error: "Invalid service request" });      
        console.log(err)
        return;
      }

    console.log("SQL query submitted: " + inputstring);
    var request = new Request(inputstring, function(err, rowCount, rows) {
        if(err) {
            res.status(BAD_REQUEST).json({ error: "Invalid SQL query request" });          
            console.log('Invalid service request');
            connection.close();
            return;
        }

        // process results set data
        var result = "";
        rows.forEach(function(columns){
            var rowdata = new Object();
            columns.forEach(function(column) {
                if (code === 1 && column.metadata.colName === "SimplifiedExpression") {
                    result = column.value;
                } else if (code === 2 && column.metadata.colName === "Postfix") {
                    result = column.value;
                    console.log("results here is: " + result);
                }
            });
        });
        // close the connection and return results set
        connection.close();        
        var ret_value = result;

        if (ret_value) {
            // Already in the dB, just return answer from dB 
            res.send(ret_value); 
        } else {
            if (code === 1) {
                console.log("currentExpression is: " + currentExpression);
                let simplified = simplify.simplify(currentExpression);

                res.send(simplified); 
                
                // Store to DB After 
                insertExpressionIntoDb(res, connectionString, currentExpression, simplify.getPostfix(currentExpression), simplified);    
            } else if (code === 2) {
                let postfix = simplify.getPostfix(currentExpression);
                res.send(postfix); 

                // Store to DB After 
                insertExpressionIntoDb(res, connectionString, currentExpression, postfix, simplify.simplify(currentExpression));    
            }
        }        
    });      
    // execute SQL query
    connection.execSql(request);  
    });   
}

  function insertExpressionIntoDb(res, connectionString, currentExp, postfix, simplifiedExp) {
    // Connect with database
    var connection = new Connection(connectionString);
    connection.on('connect', function(err) {
      if (err) {
        res.status(BAD_REQUEST).json({ error: "Invalid service request" });      
        console.log(err);
        return;
      }
      
      var queryString = "INSERT INTO dbo.Results VALUES (CURRENT_TIMESTAMP, '" + currentExp + "', '" + postfix + "', '" + simplifiedExp + "')";
      var request = new Request(queryString, function(err) {
        if(err) {
            res.status(BAD_REQUEST).json({ error: "Invalid SQL query request" });          
            console.log('Invalid service request');
            connection.close();
            return;
        }
        connection.close();        
      });
      connection.execSql(request);  
    });
  }

  //get user info (passwords and roles) using unique username
  function getDBUserData(userName, callback) {
     // Connect with database
    var connection = new Connection(connectionString);
    connection.on('connect', function(err) {
      if (err) {
        console.log(err)
        return callback(err, null, null);
      }

    console.log("SQL query submitted for: " + userName);
    var queryString = "SELECT * FROM dbo.Users WHERE Name='" + userName + "';";
    var request = new Request(queryString, (err, rows, fields) => {
        if (err) {
            connection.close();
            console.log('Invalid service request');
            return callback(err, null, null);
        } 
        connection.close();        
        callback(null, rows, fields);
    });
    connection.execSql(request);  
    });
}