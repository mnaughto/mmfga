# mmfga
Make MongoDB Fixtures Great Again

## Purpose
I've tried a bunch of different libraries for preloading test data into databases. Some of them are like [barrels](https://www.npmjs.com/package/barrels) and require sails in order to work. There are also several on npm that just don't seem to do the trick. And then there's [mongofixtures for Go](https://github.com/OwlyCode/mongofixtures) which has this cool concept of mapping key strings to generated mongo IDs. Some of them read from files. Others read from an object you pass in. Why are there so many of them? 

## One MongoDB Fixture Library to Rule Them All
That's why I'm making this library. Pull JSON or YAML from the file system or use a raw object. Use one function to reset the database. And there's a way to map key strings to mongo-generated IDs so you don't need to worry about that part. 

## API

```javascript
var faker = require('mmfga');

var fixtures = {
    collection1: [
        {
            _id: '__record1__', //will get replaced with a mongo ID, and that ID will get mapped to 'record1'
            field1: 'value'
        },
        {
            field1: 'value'
            friend: '__record1__' //will get replaced with mongo ID for record1
        },
        {
            field1: 'otherValue',
            field2: '___record1___' //will get replaced with hex representation of mongo ID for record1
        }
    ],
    collection2: 
}

// connect to db
// calls conn.open under the hood
faker.connect('<connection string>', fixtures, function(err, conn){
    //conn is a mmfga connection.
    //fixtures can be either a raw object or a string containing a path to either a json or yaml file. It can also be a path to a directory containing a mixture of yaml and json files. In that case, each file is interpreted as a collection and named after the file name. You can also pass null if you want to handle fixtures on a test-by-test basis.
    //you can access underlying stuff via conn.db.

    //we can also add an argument before fixtures, a mapping from string to string, to provide specific IDs for keys in the fixtures. For instance we could have passed {"record1":"somehexstring"}.

    //reset the db state to what's in fixtures    
    conn.reset(function(err){
        //if an error occurs we can catch it here. 
    });

    //pass fixtures specific to the current test
    conn.reset(fixtures, function(err){
        //if an error occurs we can catch it here.
    });

    //close the connection and clean everything up
    conn.close(function(err){
        //maybe we can just exit here without dealing with the error?
    }); 

});
```

## Is That It?
Yeah, that's it. Runs on node > 4. Probably runs on older nodes but that seems like a lot of work to deal with. 
