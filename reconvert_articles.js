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
const { textToSpeech } = require('./utils/TextToSpeechUtils');

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


function reconvertArticles(query) {
  console.log('mapping old media field');
  Article
    .find(query)
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
              //   update here
              textToSpeech({ text: slide.text, langCode: article.langCode }, (err, audioFilePath) => {
                if (err) {
                  return cb(err)
                }
                getRemoteFileDuration(`https:${audioFilePath}`, (err, duration) => {
                  if (err) {
                    console.log('error getting file duration', audioFilePath, err)
                  }
                  console.log('duration', duration, slide.text)
                  const oldAudio = slide.audio;
                  const oldDuration = slide.duration;
                  slide.audio = audioFilePath;
                  slide.duration = duration ? duration * 1000 : 0;
                  const slideHtmlIndex = article.slidesHtml.findIndex((s) => s.audio === oldAudio);
                  if (slideHtmlIndex !== -1) {
                    article.slidesHtml[slideHtmlIndex].audio = audioFilePath;
                    article.slidesHtml[slideHtmlIndex].duration = slide.duration;
                    if (slide.media && slide.media.length === 1) {
                      slide.media[0].time = slide.duration;
                    } else if (slide.media && slide.media.length > 1) {
                      //  if the new duration is greater than the old one, increase the last media item by their difference
                      // Otherwise, reset all durations
                      if (slide.duration > oldDuration) {
                        const timeDiff = oldDuration - slide.duration;
                        slide.media[slide.media.length - 1].time += timeDiff
                        article.slidesHtml[slideHtmlIndex].media[article.slidesHtml[slideHtmlIndex].media.length - 1].time += timeDiff;
                      } else if (slide.duration < oldDuration) {
                        slide.media.forEach((mitem, mitemIndex) => {
                          mitem.time = slide.duration / slide.media.length;
                        })
                        article.slidesHtml[slideHtmlIndex].media.forEach((mitem, mitemIndex) => {
                          mitem.time = slide.duration / slide.media.length;
                        })
                      }
                    }
                  }
                  cb(null)
                })
              })
            })
          })
          async.parallelLimit(updateDurationFunc, 3, (err, res) => {
            if (err) return console.log('error updating article', article.title, article.wikiSource, err);
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

mongoose.connect(dbCOnnection, (err) => {
  console.log(err);
  const query = {
    published: true,
  }
  reconvertArticles(query);
})