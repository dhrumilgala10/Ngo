'use strict';

let express = require('express');
let auth = require('../middleware/auth');
let studentRouter = express.Router();
let Student = require('../models/student');
let Videos = require('../models/videos');
const chalk = require('chalk');

// authentication middleware
studentRouter.use((req, res, next) => {
	auth.authenticate(req, res, next, 'student');
});

studentRouter.get('/', (req, res) => {
	console.log(chalk.green('GET ' + chalk.blue('/student')));
	res.render('student_dashboard.ejs', {
		user: req.user
	});
});


studentRouter.get('/details', (req, res) => {
	console.log(chalk.green('GET ' + chalk.blue('/student/details')));
	Student.findOne({
		username: req.user.username
	}, (err, student) => {
		if (err) throw err;
		if (student == null) return res.json({
			success: false
		});
		res.json({
			success: true,
			name: student.name,
			email: student.email,
			username: student.username
		});
	});
});

studentRouter.get('/videos', (req, res) => {
	console.log(chalk.green('GET ' + chalk.blue('/student/videos')));
	Student.findOne({
		username: req.user.username
	}).populate('videos').exec((err, student) => {
		if (err) throw err;
		if (student == null) return res.json({
			success: false
		});
		if (!student.videos || student.videos.length == 0) return res.json({
			success: false
		});
		let videos = [];
		for (let i = 0; i < student.videos.length; i++) {
			videos.push({
				name: student.videos[i].name,
				link: student.videos[i].link
			});
		}
		res.json({
			success: true,
			videos: videos
		});
	});
});


studentRouter.get('/video/:link', (req, res) => {
	console.log(chalk.green('GET ' + chalk.blue('/student/video')));
	let link = decodeURIComponent(req.params.link);
	Videos.findOne({
		link: link
	}).populate('vidComments.student').exec((err, video) => {
		if (err) throw err;
		if (video == null) return res.render('404.ejs');
		let comments = [];
		for (let i = 0; i < video.vidComments.length; i++) {
			if (video.vidComments[i].student) {
				comments.push({
					username: video.vidComments[i].student.username,
					text: video.vidComments[i].text
				});
			}
		}
		res.render('video.ejs', {
			video: {
				username: req.user.username,
				name: video.name,
				link: video.link,
				comments: comments
			}
		});
	});
});

studentRouter.post('/addComment/:link', (req, res) => {
	console.log(chalk.cyan('POST ' + chalk.blue('/student/addComment')));
	let link = decodeURIComponent(req.params.link);
	Student.findOne({
		username: req.user.username
	}, (err, student) => {
		if (err || !student) return res.json({
			success: false
		});
		let comment = {
			student: student,
			text: req.body.text
		};
		Videos.findOneAndUpdate({
			link: link
		}, {
			$push: {
				vidComments: comment
			}
		}, (err, updatedResult) => {
			if (err) return res.json({
				success: false
			});
			res.json({
				success: true,
				username: req.user.username,
				text: req.body.text
			});
		});
	});
});

studentRouter.post('/deleteComment/:link', (req, res) => {
	console.log(chalk.cyan('POST ' + chalk.blue('/student/deleteComment')));
	let link = decodeURIComponent(req.params.link);
	Videos.findOne({
		link: link
	}).populate('vidComments.student').exec((err, video) => {
		for (let i = 0; i < video.vidComments.length; i++) {
			if (video.vidComments[i].student && video.vidComments[i].student.username == req.user.username && video.vidComments[i].text == req.body.text) {
				video.vidComments.splice(i, 1);
				break;
			}
		}
		video.save((err, result) => {
			if (err) {
				console.log(chalk.red(err));
				res.json({
					success: false
				});
			} else res.json({
				success: true
			});
		});
	});
});

module.exports = studentRouter;