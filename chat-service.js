var ChatService = {
	sender: function(message) {}, // function to send out messages
	sessions: {},
	setSender: function(func) {
		this.sender = func;
	},
	createSession: function(o) {
		this.sessions[o.channel] = {
			info: o,
			context: {
				currentMessage: '',
				currentCommand: null
			}
		};
		process.nextTick(function() {
			Commands.list['hello'].run(o.name, function(message, isCmdDone) {
				ChatService.sender({channel: o.channel, message: {name: 'Heliex', message: message}});
			});	
		});
	},
	_sender: function(channel, message) {
		ChatService.sender({channel: channel, message: message});
	},
	process: function(message) {
		console.log('process', message);
		// get session
		var session = this.sessions[message.channel];
		// if session is running a command...
		if (session.currentCommand != null) {
			console.log('currentCommand', session.currentCommand.name);
			// pass it to the command and let it do its thing
			session.currentCommand.run(message.message, function(message, isCmdDone) {
				console.log('currentCommand ', message);
				ChatService.sender({channel: session.info.channel, message: {name: 'Heliex', message: message}});

				if (isCmdDone) {
					session.currentCommand = null;
					console.log('currentCommand', session.currentCommand);
				}
			}, session.info);
		}
		else {
			var command = this.extractCommand(message.message);
			if (command) {
				session.currentCommand = command;
				command.initialize();
				command.run(null, function(message, isCmdDone) {
					console.log('command ', message);
					ChatService.sender({channel: session.info.channel, message: {name: 'Heliex', message: message}});

					if (isCmdDone) {
						session.currentCommand = null;
						console.log('currentCommand', session.currentCommand);
					}
				}, session.info);
			}
		}
	},
	extractCommand: function(commandString) {
		var command = Commands.list[commandString];
		if (command) return command.clone();
	}
};

// Commands
function Command(name, options) {
	this.name = name;
	this.inputs = [];
	this.state = '';
	this.initialize = options.initialize || function(){};
	this.code = options.code || function(){};
}
// called everytime to run a command whether it's 
Command.prototype.run = function(message, out, session_info) {
	console.log('run ', message);
	this.code(message, out, session_info);
};

Command.prototype.clone = function() {
	return new Command(this.name, {initialize: this.initialize, code: this.code});
}

var Commands = {
	list: {
		'hello': new Command('hello', {
			code: function(input, out, session_info) {
				console.log('input ', input);
				console.log('session_info', session_info);
				out('Hi, '+(input||session_info.name), true);
			}
			/*
			states: {
				'greet': function(input, next) {
					// true = command finish run
					next(true, 'Hi, '+input);
				}
			}
			*/
		}),
		'how are you': new Command('how are you', {
			code: function(input, out, session_info) {
				console.log('input ', input);
				console.log('session_info', session_info);
				out('I\'m fine. Thank you. How about you '+(input||session_info.name)+'?', true);
			}
		}),
		'show predicted sales': new Command('show predicted sales', {
			initialize: function() {
				this.state = 'ask which days';
			},
			code: function(input, out, session_info) {
				console.log('input ', input);
				//console.log('out', out);
				console.log('state', this.state);
				console.log('inputs', this.inputs);
				var self = this;

				switch (this.state) {
					case 'ask which days':
						console.log('in ask which days');
						if (input === null) {
							out('w/c day?'); //, {expects: 'date'});
						}
						else {
							this.inputs.push(input);
							this.state = 'ask which sku';
							//process.nextTick(function() {
								self.run(null, out, session_info);	
							//});
						}
					break;
					case 'ask which sku':
						console.log('in ask which sku');
						if (input === null) {
							out('w/c sku?');
						}
						else {
							this.inputs.push(input);
							this.state = 'process inputs';
							//process.nextTick(function() {
								self.run(null, out, session_info);	
							//});
						}
					case 'process inputs':
						console.log('in process inputs');
						setTimeout(function() {
							console.log('tick while in ', self.state);
							if (self.state !== 'process inputs') return;
							self.state = 'done';
							var results = self.inputs.join(',');
							self.inputs = [];
							console.log('here are the results ', results);
							out(session_info.name+', here are the results for '+ results+'.<br>Nothing here yet', true);
						}, 5000);
					break;
				}
			}
			/*states: {
				'ask which days': {
					// input is received message
					run: function(input, next) {
						if (input === null) {
							next(false, 'w/c day?');
						}
						else {
							if (valid(input)) {
								store(input);
								next('ask which sku');
							}
						}
					}
				},
				'ask which sku': {
					run: function(input, next) {
						if (input === null) {
							next(false, 'w/ sku?');
						} 
						else {
							if (valid(input)) {
								store(input);
								next('process inputs');
							}
						}
					}
				},
				'process inputs': {
					run: function(input, next) {
						fetchPredictedSales(getInputs(), function(result) {
							next(true, format(result));
						});
					}
				}
			}
			*/
		})
	},
	find: function(string) {
		// look up in list
	}
};

module.exports = ChatService;