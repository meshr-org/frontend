/*-
 * Copyright (c) 2020 Robert Sahlin
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE file.
 */

'use strict';

// imports
const {PubSub} = require('@google-cloud/pubsub');
const express = require('express');
const pubsub = new PubSub();

// Create an Express object and routes (in order)
const app = express();
app.set('trust proxy', true);
app.post('/', apiPost);
app.get('/keepalive', apiKeepAlive);

// Set our GCF handler to our Express app.
exports.transformer = app;

function transform(req){
    var data = req.body.data;
    var headers = req.body.headers;
    var attributes = req.body.attributes;
    var message = {    
        foo: 'bar'
    };
    return message;
}

async function publish(req, res){
    console.log(req.body);
    // Pubsub topics to publish message on
    var topic = req.body.attributes.namespace.concat('.', req.body.attributes.name, '-transformer');
    var topics =[topic];
    if(req.query.backup) topics.push(req.query.backup); // Add backup topic if backup parameter exist in querystring

    // Pubsub message attributes
    var attributes = req.body.attributes;
    attributes.topic = topic;

    // Pubsub message body
    var body = transform(req);
    console.log(body);
    var msgBody = Buffer.from(JSON.stringify(body));

    // Publish to topics
    let messageIds = await Promise.all(topics.map(currentTopic => pubsub.topic(currentTopic).publish(msgBody, attributes)))
    .catch(function(err) {
        console.error(err.message);
        res.status(400).end(`error when publishing data object to pubsub`);
    });
}

// Schedule requests to this endpoint keep instance warm
async function apiKeepAlive(req, res) {
    res.status(204).end();
}

// Collect request (POST), transform it and publish data on pubsub
async function apiPost(req, res) {
    await publish(req, res);
    if(!res.headersSent){
        res.status(204).end();
    }
}