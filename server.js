#!/usr/bin/env node
'use strict'
const authenticate = require('./src/authenticate');
const params = require('./src/params');
const proxy = require('./src/proxy');
const app = require('express')();
const fs = require( 'fs' );

const protocol = process.env.PROTOCOL || 'https',
port = process.env.PORT || '8080',
host = process.env.HOST || '0.0.0.0';

let server;

app.enable('trust proxy')
app.get('/', authenticate, params, proxy)
app.get('/favicon.ico', (req, res) => res.status(204).end())

// Start a development HTTPS server.
if ( protocol === 'https' ) {
	const { execSync } = require( 'child_process' );
	const execOptions = { encoding: 'utf-8', windowsHide: true };
	let key = './src/key.pem';
	let certificate = './src/certificate.pem';
	
  //requires run once as sudo
	if ( ! fs.existsSync( key ) || ! fs.existsSync( certificate ) ) {
		try {
			execSync( 'openssl version', execOptions );
			execSync(
				`openssl req -x509 -newkey rsa:2048 -keyout ./src/key.tmp.pem -out ${ certificate } -days 365 -nodes -subj "/C=US/ST=Foo/L=Bar/O=Baz/CN=localhost"`,
				execOptions
			);
			execSync( `openssl rsa -in ./src/key.tmp.pem -out ${ key }`, execOptions );
			execSync( 'rm ./src/key.tmp.pem', execOptions );
		} catch ( error ) {
			console.error( error );
		}
	}

	const options = {
		key: fs.readFileSync( key ),
		cert: fs.readFileSync( certificate ),
		passphrase : 'password'
    };
    
	server = require( 'https' ).createServer( options, app );
    
} else {
    server = require( 'http' ).createServer( app );
}

server.listen( { port, host }, function() {
    console.log(`Listening on ${port}`)
} );
