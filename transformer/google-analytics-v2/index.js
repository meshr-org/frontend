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
        version : data.v,
        items : Object.keys(data)
            .filter( key => key.match(/^pr([0-9]{1,3})/) )
            .reduce(function (r, a) {
                r.push(data[a]);
                return r;
            },[])
            .map(x => {
                var y = x.split('~').reduce(function (r, a) {
                    r[a.slice(0,2)] = a.slice(2);
                    return r;
                },{});
                return {
                    id : y.id,
                    brand : y.br,
                    name : decodeURIComponent(y.nm),
                    variant : y.va,
                    category : y.ca,
                    category2 : y.v0,
                    category3 : y.v1,
                    category4 : y.v2,
                    category5 : y.v3,
                    price : y.pr,
                    quantity : y.qt,
                    list_id : y.li,
                    list_name : decodeURIComponent(y.ln)
                };
            })
    };

    var mp = {
        version : parsed.v,
        anonymizeIp : !!+parsed.aip,
        event : parsed.t,
        nonInteraction : !!+parsed.ni,
        documentLocation : decodeURIComponent(parsed.dl),
        documentPath : decodeURIComponent(parsed.dp),
        ecommerce : {
            action : parsed.ea
        },
        product : Object.keys(parsed)
            .filter( key => key.match(/^pr([0-9]{1,3}).*/) )
            .reduce(function (r, a) {
                var index = parseInt(a.match(/^pr([0-9]{1,3}).*/)[1])-1;
                r[index] = r[index] || {};
                r[index][a.replace(/.*pr([0-9]{1,3})/,'pr')] = parsed[a];
                return r;
            },[])
            .map(x => {x.actionList = parsed.pal;
                x.productAction = parsed.pa;
                return x;})
        };
        
        
        console.log(mp);

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