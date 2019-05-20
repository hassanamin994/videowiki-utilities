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

const PROCESS_HUMANVOICE_AUDIO_QUEUE = `PROCESS_HUMANVOICE_AUDIO_QUEUE_${lang}`;

const { Article, Video, UploadFormTemplate, Humanvoice } = require('./models');
const dbCOnnection = `${DB_CONNECTION_URL}-${lang}`;
mongoose.connect(dbCOnnection, (err) => {
    console.log(err);
    console.log('mapping old media field');
    Article.find({}, (err, articles) => {
        console.log('total count', articles.length)
        articles.forEach((article, index) => {
            article = article.toObject();
            article.slides.forEach((slide) => {
                if (slide.media && slide.mediaType) {
                    const media = slide.media;
                    const mediaType = slide.mediaType;
                    slide.media = [{ url: media, type: mediaType }]
                } else {
                    slide.media = [];
                }
            })

            article.slidesHtml.forEach((slide) => {
                if (slide.media && slide.mediaType) {
                    const media = slide.media;
                    const mediaType = slide.mediaType;
                    slide.media = [{ url: media, type: mediaType }]
                } else {
                    slide.media = [];
                }
            })
            Article.findByIdAndUpdate(article._id, { $set: { slides: article.slides, slidesHtml: article.slidesHtml } }, (err) => {
                console.log('done',index, err);
            })
        })
    })
})