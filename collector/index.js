/*-
 * Copyright (c) 2020 Robert Sahlin
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE file.
 */

'use strict';

const apiKeys = process.env.API_KEYS;
const allowOrigins = process.env.ALLOW_ORIGINS;
const headers = process.env.HEADERS; // 'x-forwarded-for,user-agent,x-appengine-city,x-appengine-citylatlong,x-appengine-country,x-appengine-region';

// import the Google Cloud Pubsub client library
const {PubSub} = require('@google-cloud/pubsub');
const pubsub = new PubSub();
//const topic = pubsub.topic(mainTopic);
//const backup = pubsub.topic(backupTopic);
const TRANSPARENT_GIF_BUFFER = Buffer.from('R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=', 'base64');
const uuidv4 = require('uuid/v4');
//const anonymize = require('ip-anonymize');
const express = require('express');

var cors = require('cors');

// Create an Express object and routes (in order)
const app = express();
app.set('trust proxy', true);

// CORS
var corsOptionsDelegate = function (req, callback) {
    var corsOptions;
    // client -> check allowed origins, server -> check api_key
    const origin = req.header('Origin');
    //if (allowOrigins.split(',').indexOf(origin) !== -1 || (!origin && apiKeys != undefined && apiKeys.split(',').indexOf(req.query.api_key) !== -1)) {
        if (true){
        corsOptions = { origin: true }
        callback(null, corsOptions)
    } else {
      //corsOptions = { origin: false }
      callback(new Error('Not allowed by CORS'));
    }
}

// Pre-flight
app.options('*', cors(corsOptionsDelegate));
// Routing. ex. /namespace/com.google.analytics.v1/name/Hit -> topic = com-google-analytics-v1-hit-collector
app.post('/namespace/:namespace/name/:name', cors(corsOptionsDelegate), apiPost);
app.get('/headers', cors(corsOptionsDelegate), apiHeaders);
app.get('/keepalive', cors(corsOptionsDelegate), apiKeepAlive);

// Set our GCF handler to our Express app.
exports.collector = app;

async function publish(req, res){
    var topic = [req.params.namespace.concat('.', req.params.name)];
    if(req.query.backup) topics.push(req.query.backup); // Add backup topic if backup parameter exist in querystring

    var data = {};
    data.body = req.body;
    // Extract selected headers
    console.log('req.query');
    console.log(req.query.heap);
    const headersFilter = req.query.headers || headers;
    
    data.headers = headersFilter.split(',').reduce(function(o, k) { o[k] = req.headers[k]; return o; }, {});

    var meta = {
        namespace : req.params.namespace,
        name : req.params.name,
        topic : topic,
        timestamp :  new Date().toISOString(),
        uuid : uuidv4()
    };
    attributes = {...req.query,...meta};
    delete attributes.headers;
    delete attributes.api_key;
    
    var msgData = Buffer.from(JSON.stringify(beacon));
    
    // Publish to topics defined by topics query parameter (i.e. &topics=dummy,backup,yet-a-topic)
    await Promise.all(topics.map(currentTopic => pubsub.topic(currentTopic).publish(msgData, attributes)))
    .catch(function(err) {
        console.error(err.message);
        res.status(400).end(`error when publishing data object to pubsub`);
    });
}

async function apiGet(req, res) {
    if(req.params.propertyId !== undefined){
        await publish(req, res);
        if(!res.headersSent){
            res.writeHead(200, { 'Content-Type': 'image/gif' });
            res.end(TRANSPARENT_GIF_BUFFER, 'binary');
        }
    }else{
        console.error("property path param undefined");
        res.status(400).end('Property path param undefined. pattern should be https://host/property/:propertyId');    
    }
}

// Respond with headers
async function apiHeaders(req, res) {
    res.json(req.headers).end()
}

// Schedule requests to keep instance warm
async function apiKeepAlive(req, res) {
    res.status(204).end();
}

async function apiPost(req, res) {
    //if(req.params.propertyId !== undefined){
        await publish(req, res);
        if(!res.headersSent){
            res.status(204).end();
        }
    /*}else{
        console.error("property path param undefined");
        res.status(400).end('Property path param undefined. pattern should be https://host/property/:propertyId');    
    }*/
}