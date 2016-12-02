var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var mongodbFixture = require('mongodb-fixture');
var jsonfile = require('jsonfile');
var YAML = require('yamljs');
var path = require('path');
var fs = require('fs');
var forEach = require('lodash.foreach');

function Connector(connectionString){
    var _mapping = {};

    this.connectionString = connectionString;

    Object.defineProperty(this, 'idMap', {
        get: function(){
            return _mapping;
        }
    });
}

Connector.prototype = {
    open: function(cb){
        var self = this;

        MongoClient.connect(this.connectionString, function(err, db){
            if(err){return cb(err);}

            self.db = db;
            self.mfix = mongodbFixture(db);
            self.mfix.setup(function(err){
                if(err){return cb(err);}
                self.reset(cb);
            });
        });
    },

    reset: function(fixtures, cb){
        if(!cb){
            cb = fixtures;
            fixtures = null;
        }

        fixtures = fixtures || self.fixtures;

        this.mfix.fixture(fixtures, cb);
    },

    close: function(cb){
        this.mfix.tearDown(cb);
    },

    parse: function(fixtures, cb){
        var result = {};
        var self = this;

        function parseFile(filename, cb){
            var finalFixtures;
            //load from a file
            if(path.extname(filename).toLowerCase() == '.json'){
                try {
                    finalFixtures = jsonfile.readFileSync(filename);
                } catch(ex){
                    return cb(ex);
                }
            } else if(path.extname(filename).toLowerCase() == '.yml'){
                try {
                    finalFixtures = YAML.load(filename);
                } catch(ex) {
                    return cb(ex);
                }
            } else {
                return cb(new Error('Invalid fixture file name: ' + filename));
            }

            cb(null, finalFixtures);
        }

        if(isString(fixtures)){
            var fixturePath = path.resolve(fixtures);
            fs.stat(fixturePath, function(err, stats){
                if(stats.isDirectory()){
                    fs.readdir(fixturePath, function(err, files){
                        var result = {};

                        async.each(files, function(filename, cb){
                            var ext = path.extname(filename);
                            var collection = path.basename(filename, ext);

                            parseFile(filename, function(err, fileFixtures){
                                if(err){return cb(err);}
                                result[collection] = fileFixtures;
                                cb();
                            });
                        }, function(err){
                            if(err){return cb(err);}

                            cb(null, self.import(result));
                        });
                    });
                } else {
                    parseFile(fixturePath, function(err, fileFixtures){
                        if(err){return cb(err);}

                        cb(null, self.import(fileFixtures));
                    });
                }
            });
        } else {
            return cb(null, this.import(fixtures));
        }
    },

    import: function(fixtures){
        var results = {};
        fixtures = fixtures || {};

        forEach(fixtures, function(collection, collectionName){
            var outCollection = [];
            forEach(collection, function(record){
                var outRecord = {};
                forEach(record, function(fieldValue, fieldName){
                    if(isString(fieldValue)){
                        var idMatches = fieldValue.match(/^__(.*)__$/i);
                        var stringMatches = fieldValue.match(/^___(.*)___$/i);

                        if(stringMatches){
                            oid = getObjectId(this, stringMatches[1]);
                            outRecord[fieldName] = oid.toHexString();
                        } else if(idMatches) {
                            oid = getObjectId(this, idMatches[1]);
                            outRecord[fieldName] = oid;
                        } else {
                            outRecord[fieldName] = fieldValue;
                        }
                    } else {
                        outRecord[fieldName] = fieldValue;
                    }
                });
                outCollection.push(outRecord);
            });
            results[collectionName] = outCollection;
        });

        this.fixtures = results;
        return results;
    }    
}

function getObjectId(connector, value){
    var result = connector.idMap[value];

    if(!result){
        result = ObjectID.createFromTime(Date.now() / 1000);
        connector.idMap[value] = result;
    }

    return result;
}

function isString(value){
    return Object.prototype.call(value) == '[object String]';
}

exports.connect = function(connectionString, fixtures, cb){
    var finalFixtures;

    var connector = new Connector(connectionString);    

    connector.parse(fixtures, function(err){
        if(err){return cb(err);}

        connector.open(function(err){
            if(err){return cb(err);}

            cb(null, connector);
        });
    });
};