'use strict';

const Hapi = require('hapi');
const Faye = require('faye');
const ChatService = require('./chat-service');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({
	host: 'localhost',
	port: 8000
});
const bayeux = new Faye.NodeAdapter({mount: '/faye', timeout: 45});

bayeux.addExtension({
	incoming: (message, callback) => {
		console.log('incoming', message);
		if (message.channel !== '/meta/subscribe') {

			if (message.channel === '/chat/service') {
				ChatService.process({channel: message.ext.channel, message: message.data});
				if (message.ext) delete message.ext;
			}

			return callback(message);
		}

		if (message.subscription === '/chat/service' && message.ext) {
			ChatService.createSession(message.ext);
			delete message.ext;
		}
		/*
		ChatService.run(message, function(message) {
			// ask for input, display results, etc
			bayeux.publish(message.channel, message.message);
		})
		*/

		callback(message);
	},
	outgoing: (message, callback) => {
		console.log('outgoing', message);

		callback(message);
	}
});
bayeux.on('handshake', (clientId) => {
	console.log(clientId, ' connected');
});
bayeux.on('subscribe', (clientId, channel) => {
	console.log(clientId, ' subscribed to ', channel);
});
bayeux.on('disconnect', (clientId) => {
	console.log(clientId, ' disconnected');
});

bayeux.attach(server.listener);
ChatService.setSender(function(message) {
	bayeux.getClient().publish(message.channel, message.message);
});

server.register(require('inert'), (err) => {

	if (err) {
		throw err;
	}

	//Add the route
	server.route({
		method: 'GET',
		path: '/',
		handler: function(request, reply) {
			reply.file('./public/index.html');
		}
	});

	server.route({
		method: 'GET',
		path: '/assets/{param*}',
		handler: {
			directory: {
				path: 'bower_components'
			}
		}
	});

	// Start the server
	server.start((err) => {
		if (err) {
			throw err;
		}
		console.log('Server running at:', server.info.uri);
	});
});

