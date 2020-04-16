/*-
 * Copyright (c) 2020 Robert Sahlin
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE file.
 */

'use strict';

const mainTopic = process.env.MAIN_TOPIC || 'ga-proxy';
const allowOrigin = process.env.ALLOW_ORIGIN || '*';

// import the Google Cloud Pubsub client library
const {PubSub} = require('@google-cloud/pubsub');
const pubsub = new PubSub();
const topic = pubsub.topic(mainTopic);

const TRANSPARENT_GIF_BUFFER = Buffer.from('R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=', 'base64');

//const util = require('util');
const uuidv4 = require('uuid/v4');
const anonymize = require('ip-anonymize');

const express = require('express');
var cors = require('cors');

// Create an Express object and routes (in order)
const app = express();
app.set('trust proxy', true);
var corsOptions = {
  origin: function (origin, callback) {
    if (allowOrigin === '*' || allowOrigin.split(',').indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.get('/property/:propertyId', apiGet);
app.post('/property/:propertyId', apiPost);
app.get('/headers', apiHeaders);
app.get('/keepalive', apiKeepAlive);



// Set our GCF handler to our Express app.
exports.ga_proxy = app;

async function publish(req, res){
    var beacon = {};
    beacon.body = req.body;
    beacon.query = req.query;
    //beacon.headers = req.headers;
    beacon.headers = ['x-forwarded-for', 'user-agent','x-appengine-city','x-appengine-citylatlong','x-appengine-country','x-appengine-region'].reduce(function(o, k) { o[k] = req.headers[k]; return o; }, {});
    beacon.headers['x-forwarded-for'] = anonymize(beacon.headers['x-forwarded-for']);
    var attributes = {
        property : req.params.propertyId,
        topic : mainTopic,
        timestamp :  new Date().toISOString(),
        uuid : uuidv4()
    };
    var msgData = Buffer.from(JSON.stringify(beacon));
    const messageId = await topic
        .publish(msgData, attributes)
        .catch(function(err) {
            console.error(err.message);
            res.status(400).end(`error when publishing data object to pubsub`); 
        });
        console.log(`Message ${messageId} published.`);
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

async function apiHeaders(req, res) {
    res.json(req.headers).end()
}

async function apiKeepAlive(req, res) {
    res.status(204).end();
}

async function apiPost(req, res) {
    if(req.params.propertyId !== undefined){
        await publish(req, res);
        if(!res.headersSent){
            res.status(204).end();
        }
    }else{
        console.error("property path param undefined");
        res.status(400).end('Property path param undefined. pattern should be https://host/property/:propertyId');    
    }
}