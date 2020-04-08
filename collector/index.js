/*-
 * Copyright (c) 2020 Robert Sahlin
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE file.
 */

'use strict';

const mainTopic = process.env.TOPIC || 'tmp';
const allowOrigin = process.env.ALLOW_ORIGIN || '*';
//const platform = process.env.PLATFORM || 'CF';

// import the Google Cloud Pubsub client library
const {PubSub} = require('@google-cloud/pubsub');
const pubsub = new PubSub();
const topic = pubsub.topic(mainTopic);

const TRANSPARENT_GIF_BUFFER = Buffer.from('R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=', 'base64');

const util = require('util');
const uuidv4 = require('uuid/v4');


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
app.get('/topic/:topicId', apiGet);
app.post('/topic/:topicId', apiPost);
app.post('/cookies', apiCookie);
app.get('/headers', apiHeaders);
app.get('/keepalive', apiKeepAlive);



// Set our GCF handler to our Express app.
exports.collector = app;

async function publish(req, res){
    var payload = {};
    payload.body = req.body;
    payload.query = req.query;
    payload.headers = req.headers;
    var attributes = {
        topic : req.params.topicId,
        timestamp :  new Date().toISOString(),
        uuid : uuidv4()
    };
    var msgData = Buffer.from(JSON.stringify(payload));
    const messageId = await topic
        .publish(msgData, attributes)
        .catch(function(err) {
            console.error(err.message);
            res.status(400).end(`error when publishing data object to pubsub`); 
        });
        console.log(`Message ${messageId} published.`);
}

async function apiCookie(req, res) {
    try{
        (Array.isArray(req.body) ? req.body : [req.body])
            .forEach(cookie => {res.cookie(cookie.name, cookie.value, cookie.options)});
        res.status(204).end();
    }catch(error) {
        console.error(error);
        res.status(400).end(`error when rewriting cookies`);
    }
}

async function apiGet(req, res) {
    if(req.params.topicId !== undefined){
        await publish(req, res);
        if(!res.headersSent){
            res.writeHead(200, { 'Content-Type': 'image/gif' });
            res.end(TRANSPARENT_GIF_BUFFER, 'binary');
        }
    }else{
        console.error("topic path param undefined");
        res.status(400).end('Topic path param undefined. pattern should be https://host/topic/:topicID');    
    }
}

async function apiHeaders(req, res) {
    res.json(req.headers).end()
}

async function apiKeepAlive(req, res) {
    res.status(204).end();
}

async function apiPost(req, res) {
    if(req.params.topicId !== undefined){
        await publish(req, res);
        if(!res.headersSent){
            res.status(204).end();
        }
    }else{
        console.error("topic path param undefined");
        res.status(400).end('Topic path param undefined. pattern should be https://host/topic/:topicID');    
    }
}