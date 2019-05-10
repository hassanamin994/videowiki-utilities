/**
 * This script re-exports all videos that have been exported with human voice
 */
const mongoose = require('mongoose');
const path = require('path');
const async = require('async');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const rabbitmqService = require('./rabbitmqService');
const DB_CONNECTION_URL = process.env.DB_CONNECTION_URL;
const args = process.argv.slice(2);
const lang = args[0];

const CONVERT_QUEUE = `CONVERT_ARTICLE_QUEUE_${lang}`;
const exportedVideosIds = [];

const { Article, Video, UploadFormTemplate, Humanvoice } = require('./models');
const dbCOnnection = `${DB_CONNECTION_URL}-${lang}`;
mongoose.connect(dbCOnnection) // connect to our mongoDB database //TODO: !AA: Secure the DB with authentication keys
let exporterChannel;

const humanvoiceIds = [
  "5ca18f6ab5992533e8e5a7ec",
  // "5ca26865b5992533e8e5a7f6",
  // "5cac4f315c1c64455c64aad3",
  // "5caebca7d68e3e2bc22e8ea1",
  // "5caefd13d68e3e2bc22e8eb4",
  // "5cb035e080bdd50fe154f738",
  // "5cb16e446355be3694d92142",
  // "5cb179546355be3694d92147",
  // "5cb1fd8e6355be3694d92199",
];

function reexportHumanvoiceVideos() {
  // videoIds.forEach(videoId => {
  Video
    .find({ status: 'uploaded', archived: false, humanvoice: { $in: humanvoiceIds}, commonsUrl: { $exists: true } })
    .populate('user')
    .exec((err, videos) => {
      if (err) return console.log('Error finding videos', err);
      if (!videos) return console.log('Cannot find videos');

      videos.forEach((video) => {
        console.log('video is ', video);
        const newVideo = new Video({
          title: video.title,
          wikiSource: video.wikiSource,
          article: video.article,
          articleVersion: video.articleVersion,
          formTemplate: video.formTemplate,
          user: video.user._id,
          humanvoice: video.humanvoice,
          extraUsers: video.extraUsers || [],
          withSubtitles: false,
          lang: video.lang,
        });
        
        newVideo.save((err) => {
          if (err) {
            console.log('error saving new video', err);
          } else {
            console.log('exporiting')
            exporterChannel.sendToQueue(CONVERT_QUEUE, new Buffer(JSON.stringify({ videoId: newVideo._id })), { persistent: true });
          }
        })
      })
    })
}

rabbitmqService.createChannel((err, ch) => {
  if (err) {
    console.log('error creating channel for exporter', err);
  } else if (ch) {
    exporterChannel = ch;
    ch.assertQueue(CONVERT_QUEUE, { durable: true })
    console.log('Connected to rabbitmq exporter server successfully');
    reexportHumanvoiceVideos();
  }
})
