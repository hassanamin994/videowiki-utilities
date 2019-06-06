/**
 * This script maps old media field to an array field
 */

const mongoose = require('mongoose');
const path = require('path');
const async = require('async');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const rabbitmqService = require('./rabbitmqService');
const DB_CONNECTION_URL = process.env.DB_CONNECTION_URL;
const args = process.argv.slice(2);
const lang = args[0];

const fs = require('fs');
const request = require('request');
const mp3Duration = require('mp3-duration');

const PROCESS_HUMANVOICE_AUDIO_QUEUE = `PROCESS_HUMANVOICE_AUDIO_QUEUE_${lang}`;

const { Article } = require('./models');
const dbCOnnection = `${DB_CONNECTION_URL}-${lang}`;

function shouldRemoveTitle(title) {
  if (title.toLowerCase().indexOf('sandbox') !== -1) return false;
  if (title.toLowerCase().indexOf('wikipedia:videowiki/') !== -1) return false;
  return true;
}

function remoteNonCustom() {
  console.log('Removeing non custom and non sandbox articles');
  Article
    .find({})
    .lean()
    .exec((err, articles) => {
        articles.forEach(article => {
            if (shouldRemoveTitle(article.title)) {
              Article.findByIdAndDelete(article._id, (err) => {
                console.log('article ', article.title, ' deleted');
              })
            }
        });
    })
}

mongoose.connect(dbCOnnection, (err) => {
  console.log(err);
  remoteNonCustom();
})