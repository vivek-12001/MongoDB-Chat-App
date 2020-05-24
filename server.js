const mongo = require('mongoose');
const client = require('socket.io').listen(4000).sockets;

mongo.connect("mongodb://localhost:27017/mongochat",
{ useNewUrlParser: true, useUnifiedTopology: true })
const db = mongo.connection

db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to Mongodb'))

client.on('connection', function(socket){
    let chat = db.collection('chats');

    //create function to send status
    sendStatus = function(s){
        socket.emit('status', s);
    }

    //get chats from mongo collection
    chat.find().limit(100).sort({_id: 1}).toArray(function(err, res){
        if(err){
            throw err;
        }

        //emit messages
        socket.emit('output', res);
    });

    //handle input events
    socket.on('input', function(data){
        let name = data.name;
        let message = data.message;

        if(name == '' || message == ''){

            //send error status
            sendStatus('Please enter name and message...!!!');
        }
        else{
            //insert message
            chat.insertOne({name: name, message: message}, function(){
                client.emit('output', [data]);

                //send status object
                sendStatus({
                    message: 'Message Sent',
                    clear: true
                });
            });
        }
    });

    socket.on('clear', function(data){

        //remove all chats from collection
        chat.deleteOne({}, function(){
            //emit cleared
            socket.emit('cleared');
        });
    });
});