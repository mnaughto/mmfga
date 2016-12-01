# mmfga
Make MongoDB Fixtures Great Again

## Purpose
I've tried a bunch of different libraries for preloading test data into databases. Some of them are like [barrels](https://www.npmjs.com/package/barrels) and require sails in order to work. There are also several on npm that just don't seem to do the trick. And then there's [mongofixtures for Go](https://github.com/OwlyCode/mongofixtures) which has this cool concept of mapping key strings to generated mongo IDs. Some of them read from files. Others read from an object you pass in. Why are there so many of them? 

## One MongoDB Fixture Library to Rule Them All
That's why I'm making this library. Pull JSON or YAML from the file system or use a raw object. Use one function to reset the database. And there's a way to map key strings to mongo-generated IDs so you don't need to worry about that part. 

## API
    ```JavaScript
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
    faker.connect('<connection string>', fixtures, function(err, conn){
        //conn is a mmfga connection.
        //fixtures can be either a raw object or a string containing a path to either a json or yaml file.
        //you can access underlying stuff via conn.connection

        conn.reset(); //reset the db state to what's in fixtures
        conn.close(); //close the connection and clean everything up
        conn.reset(function(err){
            //if an error occurs we can catch it here. if we don't send a callback, the error will just get thrown
        });
    });
    ```

## Is That It?
Yeah, that's it. Runs on node > 4. Probably runs on older nodes but that seems like a lot of work to deal with. 