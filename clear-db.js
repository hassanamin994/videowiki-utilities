const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DB_CONNECTION_URL = process.env.DB_CONNECTION_URL;
const args = process.argv.slice(2);
const lang = args[0];

const { Article, Video, UploadFormTemplate, Humanvoice } = require('./models');
const dbCOnnection = `${DB_CONNECTION_URL}-${lang}`;
mongoose.connect(dbCOnnection) // connect to our mongoDB database //TODO: !AA: Secure the DB with authentication keys

const requiredTitles = [
	'Wikipedia:VideoWiki/Dengue_fever_2_minute_overview',
	'Wikipedia:VideoWiki/Pneumonia_2_min_overview',
	'Wikipedia:VideoWiki/Typhoid_fever_2_min_overview',
	'Wikipedia:VideoWiki/Cancer_2_min_overview',
	'Wikipedia:VideoWiki/Measles_2_min_overview',
	'Wikipedia:VideoWiki/Periodontitis',
	'Wikipedia:VideoWiki/Dengue_fever_overview',
	'Wikipedia:VideoWiki/Pneumonia_overview',
	'Wikipedia:VideoWiki/Typhoid_fever_overview',
	'Wikipedia:VideoWiki/Cancer_overview',
	'Wikipedia:VideoWiki/Measles_overview',
	'Wikipedia:VideoWiki/Hepatitis_C_overview',
	'Wikipedia:VideoWiki/Major_depressive_disorder_overview',
	'Wikipedia:VideoWiki/Tuberculosis_overview',
	'Wikipedia:VideoWiki/Malaria_overview',
	'Wikipedia:VideoWiki/Hypertension_overview',
	'Wikipedia:VideoWiki/Cholera_overview',
	'%E0%A4%B5%E0%A4%BF%E0%A4%95%E0%A4%BF%E0%A4%AA%E0%A5%80%E0%A4%A1%E0%A4%BF%E0%A4%AF%E0%A4%BE:%E0%A4%B5%E0%A5%80%E0%A4%A1%E0%A4%BF%E0%A4%AF%E0%A5%8B%E0%A4%B5%E0%A4%BF%E0%A4%95%E0%A4%BF/%E0%A4%A1%E0%A5%87%E0%A4%82%E0%A4%97%E0%A5%82_%E0%A4%AC%E0%A5%81%E0%A4%96%E0%A4%BC%E0%A4%BE%E0%A4%B0',
	'%E0%A4%B5%E0%A4%BF%E0%A4%95%E0%A4%BF%E0%A4%AA%E0%A5%80%E0%A4%A1%E0%A4%BF%E0%A4%AF%E0%A4%BE:%E0%A4%B5%E0%A5%80%E0%A4%A1%E0%A4%BF%E0%A4%AF%E0%A5%8B%E0%A4%B5%E0%A4%BF%E0%A4%95%E0%A4%BF/%E0%A4%A8%E0%A4%BF%E0%A4%AE%E0%A5%8B%E0%A4%A8%E0%A4%BF%E0%A4%AF%E0%A4%BE',
	'%E0%A4%B5%E0%A4%BF%E0%A4%95%E0%A4%BF%E0%A4%AA%E0%A5%80%E0%A4%A1%E0%A4%BF%E0%A4%AF%E0%A4%BE:%E0%A4%B5%E0%A5%80%E0%A4%A1%E0%A4%BF%E0%A4%AF%E0%A5%8B%E0%A4%B5%E0%A4%BF%E0%A4%95%E0%A4%BF/%E0%A4%86%E0%A4%82%E0%A4%A4%E0%A5%8D%E0%A4%B0_%E0%A4%9C%E0%A5%8D%E0%A4%B5%E0%A4%B0',
	'%E0%A4%B5%E0%A4%BF%E0%A4%95%E0%A4%BF%E0%A4%AA%E0%A5%80%E0%A4%A1%E0%A4%BF%E0%A4%AF%E0%A4%BE:%E0%A4%B5%E0%A5%80%E0%A4%A1%E0%A4%BF%E0%A4%AF%E0%A5%8B%E0%A4%B5%E0%A4%BF%E0%A4%95%E0%A4%BF/%E0%A4%95%E0%A5%88%E0%A4%82%E0%A4%B8%E0%A4%B0',
	'%E0%A4%B5%E0%A4%BF%E0%A4%95%E0%A4%BF%E0%A4%AA%E0%A5%80%E0%A4%A1%E0%A4%BF%E0%A4%AF%E0%A4%BE:%E0%A4%B5%E0%A5%80%E0%A4%A1%E0%A4%BF%E0%A4%AF%E0%A5%8B%E0%A4%B5%E0%A4%BF%E0%A4%95%E0%A4%BF/%E0%A4%96%E0%A4%B8%E0%A4%B0%E0%A4%BE',
	'%E0%A4%B5%E0%A4%BF%E0%A4%95%E0%A4%BF%E0%A4%AA%E0%A5%80%E0%A4%A1%E0%A4%BF%E0%A4%AF%E0%A4%BE:%E0%A4%B5%E0%A5%80%E0%A4%A1%E0%A4%BF%E0%A4%AF%E0%A5%8B%E0%A4%B5%E0%A4%BF%E0%A4%95%E0%A4%BF/%E0%A4%B9%E0%A5%87%E0%A4%AA%E0%A5%87%E0%A4%9F%E0%A4%BE%E0%A4%87%E0%A4%9F%E0%A4%BF%E0%A4%B8_%E0%A4%B8%E0%A5%80#%E0%A4%9F%E0%A5%80%E0%A4%95%E0%A4%BE',

]

function deleteAllArticlesExcept(requiredTitles) {
	const condition = { title: { $nin: requiredTitles } };
	console.log(condition)
	Video.deleteMany(condition, (err, result) => {
		console.log('remove videos', err, result);
		UploadFormTemplate.deleteMany(condition, (err, result) => {
			console.log('remove uploadformtemplate', err, result);
			Humanvoice.deleteMany(condition, (err, result) => {
				console.log('human voide remove', err, result);
				Article.deleteMany(condition, (err, result) => {
					console.log('remove articles', err, result);
				})
			})
		})
	})
}

deleteAllArticlesExcept(requiredTitles.map(t => decodeURIComponent(t)));