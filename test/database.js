var should = require('chai').should(); 
var database = require('../server/routes/helpers/database_singleton'); 


it('should have a DATABASE_URI defined', function(done) {
    database.DB_URI.should.not.equal(''); 
    done(); 
});
