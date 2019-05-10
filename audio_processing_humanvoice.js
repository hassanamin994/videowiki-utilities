/**
 * This script applies audio processing on all human voice audios
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
mongoose.connect(dbCOnnection) // connect to our mongoDB database //TODO: !AA: Secure the DB with authentication keys
let audioProcessorChannel;

const humanvoiceIds = [
    "5ca18f6ab5992533e8e5a7ec",
    "5ca26865b5992533e8e5a7f6",
    "5cac4f315c1c64455c64aad3",
    "5caebca7d68e3e2bc22e8ea1",
    "5caefd13d68e3e2bc22e8eb4",
    "5cb035e080bdd50fe154f738",
    "5cb16e446355be3694d92142",
    "5cb179546355be3694d92147",
    "5cb1fd8e6355be3694d92199",
];

function processHumanvoiceAudios(id) {
    Humanvoice.find({_id: { $in: humanvoiceIds } }, (err, humanvoices) => {
        if (err) return console.log('Error finding human voices', err);
        if (!humanvoices) return console.log('no human voices');
        humanvoices.forEach((humanvoice) => {
            humanvoice.audios.forEach((audio) => {
                audioProcessorChannel.sendToQueue(PROCESS_HUMANVOICE_AUDIO_QUEUE, new Buffer(JSON.stringify({ humanvoiceId: humanvoice._id, audioPosition: audio.position })), { persistent: true });
            })
        })
    })
}

rabbitmqService.createChannel((err, ch) => {
    if (err) {
        console.log('error creating channel for exporter', err);
    } else if (ch) {
        audioProcessorChannel = ch;
        ch.assertQueue(PROCESS_HUMANVOICE_AUDIO_QUEUE, { durable: true })
        console.log('Connected to rabbitmq audio processor server successfully');
        processHumanvoiceAudios('5ca18f6ab5992533e8e5a7ec');
    }
})
