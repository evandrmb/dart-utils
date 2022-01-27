const vscode = require('vscode');
const path = require('path');
const fs = require('fs');


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const disposable = vscode.commands.registerCommand('dart-utils.exportFiles', (uri) => createMainLibraryFile(uri));
	const fromContextDisposable = vscode.commands.registerCommand('dart-utils.exportFilesFromContext', (uri) => createMainLibraryFile(uri));

	context.subscriptions.push(disposable, fromContextDisposable);
}

function deactivate() { }


async function createMainLibraryFile(inUri) {
	const openOpts = { canSelectMany: false, canSelectFiles: false, canSelectFolders: true };

	let uri;
	if (inUri === undefined) {
		const userUri = await vscode.window.showOpenDialog(openOpts);
		if (userUri === undefined) {
			vscode.window.showErrorMessage("Aborted");
			return;
		}
		uri = userUri[0];
	}
	else {
		uri = inUri;
	}
	const splittedPath = uri.fsPath.split('\\');

	const folder = splittedPath[splittedPath.length - 1];


	const newFilePath = path.join(uri.fsPath, folder + '.dart');

	let files = getPathsToExport(uri.fsPath, folder);

	if (files.includes(`${folder}.dart`)) {
		files = files.filter((element) => element !== `${folder}.dart`);

		handleCreation(newFilePath, files);
	}
	else {
		handleCreation(newFilePath, files);
	}

}

function handleCreation(newFilePath, filesToExport) {
	const content = filesToExport.map((file) => `export '${file}';\n`).join('');

	fs.writeFileSync(newFilePath, content, 'utf8');
	const openPath = vscode.Uri.parse("file:///" + newFilePath);

	vscode.workspace.openTextDocument(openPath).then(doc => {
		vscode.window.showTextDocument(doc);

	});

	const splittedPath = newFilePath.split('\\');
	const folder = splittedPath[splittedPath.length - 1];
	vscode.window.showInformationMessage(`${folder} sucefully generated!`);
}

/**
 * @param {string} fsPath
 * @param {string} basePath
 */
function getPathsToExport(fsPath, basePath, level = 0) {
	const files = fs.readdirSync(fsPath);
	const resultFiles = [];

	for (const file of files) {
		if (!file.includes('.dart')) {
			const newPath = path.join(fsPath + '\\' + file);

			resultFiles.push(...getPathsToExport(newPath, basePath, level + 1));
		} else {

			const fileContent = fs.readFileSync(`${fsPath}\\${file}`);

			/// "part of" files shouldn't be exported
			if (fileContent.includes('part of')) {
				continue;
			} else
				if (level > 0) {
					const splittedFilePath = fsPath.split(basePath);
					const filePath = splittedFilePath[splittedFilePath.length - 1].replace('\\', '');

					resultFiles.push(`${filePath}/${file}`);
				} else {
					resultFiles.push(file);

				}


		}
	}

	return resultFiles;
}

module.exports = {
	activate,
	deactivate
}

