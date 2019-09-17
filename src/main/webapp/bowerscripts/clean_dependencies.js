require('del')(["../plugins/**/{src,test,sample,docs}/", "../plugins/**/*.md"], {force: true, dryRun: false}).then(paths => {
	console.log('Files and folders that would be deleted:\n', paths.join('\n'));
});