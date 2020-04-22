/*-
 * Copyright (c) 2020 Robert Sahlin
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE file.
 */

'use strict';

// imports
const {PubSub} = require('@google-cloud/pubsub');
const uuidv4 = require('uuid/v4');
const express = require('express');
var cors = require('cors');

const apiKeys = process.env.API_KEYS;
const allowOrigins = process.env.ALLOW_ORIGINS;
const pubsub = new PubSub();

// CORS
var corsOptionsDelegate = function (req, callback) {
    var corsOptions;
    const origin = req.header('Origin');
    if ((allowOrigins != undefined && allowOrigins.split(',').indexOf(origin) !== -1) || // client request -> check allowed origins
        (!origin && apiKeys != undefined && apiKeys.split(',').indexOf(req.query.api_key) !== -1)) { // server request -> check api_key
            corsOptions = { origin: true }
            callback(null, corsOptions)
    } else {
      callback(new Error('Not allowed by CORS'));
    }
}

// Create an Express object and routes (in order)
const app = express();
app.set('trust proxy', true);
app.options('*', cors(corsOptionsDelegate)); // Pre-flight
app.post('/namespace/:namespace/name/:name', cors(corsOptionsDelegate), apiPost); // namespace/com.google.analytics.v1/name/Hit
app.get('/headers', cors(corsOptionsDelegate), apiHeaders);
app.get('/keepalive', cors(corsOptionsDelegate), apiKeepAlive);

// Set our GCF handler to our Express app.
exports.collector = app;

async function publish(req, res){
    
    // Pubsub topics to publish message on
    var topic = req.params.namespace.concat('.', req.params.name, '-collector');
    var topics =[topic];
    if(req.query.backup) topics.push(req.query.backup); // Add backup topic if backup parameter exist in querystring

    // Pubsub message attributes
    var meta = {
        namespace : req.params.namespace,
        name : req.params.name,
        topic : topic,
        timestamp :  new Date().toISOString(),
        uuid : uuidv4()
    };
    var attributes = {...req.query,...meta};
    delete attributes.headers;
    delete attributes.api_key;

    // Pubsub message body
    var body = {};
    body.data = req.body;    
    const headersFilter = req.query.headers; // Keep selected headers ex. 'x-forwarded-for,user-agent,x-appengine-city,x-appengine-citylatlong,x-appengine-country,x-appengine-region'
    body.headers = headersFilter.split(',').reduce(function(o, k) { o[k] = req.headers[k]; return o; }, {});
    var msgBody = Buffer.from(JSON.stringify(body));

    // Publish to topics
    let messageIds = await Promise.all(topics.map(currentTopic => pubsub.topic(currentTopic).publish(msgBody, attributes)))
    .catch(function(err) {
        console.error(err.message);
        res.status(400).end(`error when publishing data object to pubsub`);
    });
    //console.log(messageIds);
}

// Respond with headers
async function apiHeaders(req, res) {
    res.json(req.headers).end()
}

// Schedule requests to this endpoint keep instance warm
async function apiKeepAlive(req, res) {
    res.status(204).end();
}

// Collect request (POST) and publish data on pubsub
async function apiPost(req, res) {
    if(req.params.namespace !== undefined && req.params.name !== undefined){ // Check if required params exist
        await publish(req, res);
        if(!res.headersSent){
            res.status(204).end();
        }
    }else{
        console.error("Path param undefined");
        res.status(400).end('Path param undefined. Pattern should be https://host/namespace/:namespace(*)/name/:name/');    
    }
}