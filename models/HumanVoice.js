const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AudioSchema = new Schema({
  position: { type: Number, required: true },
  audioURL: { type: String, required: true },
  Key: { type: String, required: true },
  duration: Number,
});

const TranslatedSlideSchema = new Schema({
  position: { type: Number, require: true },
  text: { type: String, required: true },
})

const HumanVoiceSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  wikiSource: { type: String, required: true },
  lang: { type: String, required: true },
  audios: [AudioSchema],
  translatedSlides: [TranslatedSlideSchema],
  originalSlides: {
    type: Array,
    default: [],
  },
})

const HumanVoiceModel = mongoose.model('HumanVoice', HumanVoiceSchema);
module.exports = HumanVoiceModel;
