'use strict';

var fs = require('fs');
var path = require("path");

const db = require('./database/mysql');
const config = require('config');
const log = require('./logs/logger');

const config_folder = config.get("source_folder");
const config_extensions = config.get("extensionAllowed");
const config_separators = config.get("separators");
const config_table = config.get("table_name");
const config_columns = config.get("columns_name");

console.log('START SCRIPT - INSERT DATA');

var createTable = new Promise((resolve) => {
	var query = "CREATE TABLE IF NOT EXISTS " + config_table + " (id INT NOT NULL AUTO_INCREMENT, ";
	config_columns.forEach(columns => {
		query += columns[1] + " " + columns[2] + ", ";
	});
	query += " PRIMARY KEY (id))";

	db.con_mysql.query(query, function (err) {
		if (err) {
			console.log('... Create table ' + config_table + ' if not exists KO');
			log.logger.error(new Date().toISOString() + ' - ' + err);
			process.exit();
		} else {
			console.log('... Create table ' + config_table + ' if not exists OK');
			resolve();
		}
	});
});

createTable.then(() => {
	fs.readdir(config_folder, function (err, file) {
		if (err) {
			console.log('... Check source KO');
			log.logger.error(new Date().toISOString() + ' - ' + err);
			process.exit();
		} else {
			console.log('... Check source OK');
			if (process.argv[2]) {
				try {
					var data = fs.readFileSync(config_folder + '/' + process.argv[2], 'utf8');
				} catch (err) {
					console.log('... Check file KO');
					log.logger.error(new Date().toISOString() + ' - ' + err);
					process.exit();
				}
				console.log('... Check file OK');
				parseFile(data, process.argv[2]);
			} else {
				for (var i = 0; i < file.length; i++) {
					if (config_extensions.includes(path.extname(file[i])) === true) {
						var data = fs.readFileSync(config_folder + '/' + file[i], 'utf8');
						parseFile(data, file[i]);
					}
				}
			}
		}
	});
})

function parseFile(data, fileName) {
	data = data.split(config_separators.line);
	var columns = data[0].split(config_separators.column);
	var listColumn = [];
	var listColumnPos = [];
	for (var i = 0; i < config_columns.length; i++) {
		for (var j = 0; j < columns.length; j++) {
			if (config_columns[i][0] === columns[j]) {
				listColumn.push(config_columns[i][1]);
				listColumnPos.push(j);
			}
		}
	}
	var query = "INSERT INTO " + config_table + " (";
	listColumn.forEach(line => {
		query += line + ', ';

	});
	query = query.substring(0, query.length - 2);
	query += ') VALUES ';

	var lines = [];
	let regFloat = new RegExp('^[+-]?[0-9]*[.]?[0-9]+$');
	let regQuotes = new RegExp('(?!(([^"]*"){2})*[^"]*$)(,)');
	for (var i = 1; i < data.length -1; i++) {
		var line = '(';
		var data_tmp = data[i].replace(regQuotes, '');
		var values = data_tmp.split(config_separators.column);

		for (var j = 0; j < values.length; j++) {
			if (listColumnPos.includes(j) === true) {
				if (regFloat.test(values[j])) {
					line += values[j] + ', ';
				} else if (values[j] === null || values[j] === '') {
					line += 'NULL, ';
				} else {
					line += '"' + values[j] + '", ';
				}
			}
		}
		line = line.substring(0, line.length - 2);
		line += ')';
		lines.push(line);
	}
	
	lines.forEach(line => {
		query += line + ', ';
	});
	query = query.substring(0, query.length - 2);
	insertData(query, fileName);
}

function insertData(query, fileName) {
	db.con_mysql.query(query, function (err) {
		if (err) {
			console.log('... Insert ' + fileName + ' KO');
			log.logger.error(new Date().toISOString() + ' - ' + err);
			process.emit();
		} else {
			console.log('... Insert ' + fileName + ' OK');
		}
	});
}
