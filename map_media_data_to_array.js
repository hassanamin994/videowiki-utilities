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

const { Article, Humanvoice } = require('./models');
const dbCOnnection = `${DB_CONNECTION_URL}-${lang}`;

if (!fs.existsSync('tmp')) {
  fs.mkdirSync('tmp');
}

function getRemoteFileDuration(url, callback) {
  const fileName = `tmp/tmpfile_${Date.now()}_${parseInt(Math.random() * 100000)}.${url.split('.').pop().toLowerCase()}`;
  request
    .get(url.indexOf('http') === -1 ? `https:${url}` : url)
    .on('error', (err) => {
      throw (err)
    })
    .pipe(fs.createWriteStream(fileName))
    .on('error', (err) => {
      callback(err)
    })
    .on('finish', () => {
      mp3Duration(fileName, (err, duration) => {
        if (err) throw (err)
        fs.unlink(fileName, () => { })
        callback(null, duration)
      })
    })
}


function updateArticlesMediaAndDurations() {
  console.log('mapping old media field');
  Article
    .find({ published: true })
    .lean()
    .exec((err, articles) => {
      console.log('total count', articles.length)
      const updateArticleFunc = [];

      articles.forEach((article, articleIndex) => {
        updateArticleFunc.push((articleCB) => {
          const updateDurationFunc = [];
          article.slides.forEach((slide, index) => {
            console.log('slide', index, article.title);
            updateDurationFunc.push((cb) => {
              if (typeof slide.media === 'string' && slide.mediaType) {
                const media = slide.media;
                const mediaType = slide.mediaType;
                slide.media = [{ url: media, type: mediaType }]
              } else if (!slide.media) {
                slide.media = [];
              }
              getRemoteFileDuration(slide.audio, (err, duration) => {
                if (err) return cb(err);
                console.log('updated slide', slide.position)
                slide.duration = duration ? duration * 1000 : 0;
                slide.media.forEach((mitem, mitemIndex) => {
                  mitem.time = slide.duration / slide.media.length;
                })
                return cb()
              })
            })
          })
          article.slidesHtml.forEach((slide, index) => {
            console.log('slide', index, article.title);
            updateDurationFunc.push((cb) => {
              if (typeof slide.media === 'string' && slide.mediaType) {
                const media = slide.media;
                const mediaType = slide.mediaType;
                slide.media = [{ url: media, type: mediaType }]
              } else if (!slide.media) {
                slide.media = [];
              }
              getRemoteFileDuration(slide.audio, (err, duration) => {
                if (err) return cb(err);
                console.log('updated slide', slide.position)
                slide.duration = duration ? duration * 1000 : 0;
                slide.media.forEach((mitem, mitemIndex) => {
                  mitem.time = slide.duration / slide.media.length;
                })
                return cb()
              })
            })
          })
          async.parallelLimit(updateDurationFunc, 3, (err, res) => {
            if (err) return console.log('error updating durations', article.title, article.wikiSource, err);
            Article.findByIdAndUpdate(article._id, { $set: { slides: article.slides, slidesHtml: article.slidesHtml } }, (err) => {
              console.log('done', articleIndex, err);
              return articleCB();
            })
          })
        })
      })

      async.series(updateArticleFunc, () => {
        console.log('done all')
      })
    })
}

function updateHumanvoiceDurations() {
  Humanvoice.find({})
  .populate('user')
  .lean()
  .exec((err, humanvoices) => {
    if (err) return console.log('error applying on human voice', err);
    if (!humanvoices) return console.log('no human voices');
    const humanvoiceUpdateFunc = [];
    humanvoices.forEach((humanvoice) => {
      if (!humanvoice.audios || (humanvoice.audios && humanvoice.audios.length === 0)) return;

      humanvoiceUpdateFunc.push((cb) => {
        const audioUpdateFunc = [];

        humanvoice.audios.forEach((audio, index) => {
          audioUpdateFunc.push((singleCB) => {
            getRemoteFileDuration(audio.audioURL, (err, duration) => {
              console.log('done one', index)
              if (err) {
                console.log('error getting audio duration', err);
              } else {
                audio.duration = duration ? duration * 1000 : 0;
              }
              return singleCB();
            })
          })
        })

        async.parallelLimit(audioUpdateFunc, 3, (err) => {
          if (err) {
            console.log('error ', err);
            return cb();
          }
          Humanvoice.findByIdAndUpdate(humanvoice._id, { $set: { audios: humanvoice.audios } }, (err) => {
            console.log('all audios for done', humanvoice.title, err, humanvoice.user);
            return cb()
          })
        })
      })

    })

    async.series(humanvoiceUpdateFunc, (err) => {
      console.log('done all humanvoice', err);
    })
  })
}

mongoose.connect(dbCOnnection, (err) => {
  console.log(err);
  // updateArticlesMediaAndDurations();
  // updateHumanvoiceDurations();
})