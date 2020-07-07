const path = require("path")
const os = require("os")
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron')
const imagemin = require("imagemin")
const imageminmozjpeg = require("imagemin-mozjpeg")
const imageminpngquant = require("imagemin-pngquant")
const slash = require("slash")
const log = require("electron-log")

process.env.NODE_ENV = "production"

let isDev = process.env.NODE_ENV != "production" ? true : false
let isMac = process.platform === "darwin" ? true : false

let win
let aboutwin

function createWindow(){
	win = new BrowserWindow({
		title: "Image Shrink",
		width: 600,
		height: 600,
		icon: "assets/Icon_256x256.png",
		resize: isDev ? true : false,
		webPreferences: {
			nodeIntegration: true
		}
	})
	win.loadFile("./app/index.html")	
}

function createAboutWindow(){
	aboutwin = new BrowserWindow({
		title: "Image Shrink",
		width: 400,
		height: 300,
		resize: isDev ? true : false,
		webPreferences: {
			nodeIntegration: true
		}
	})
	aboutwin.loadFile("./app/about.html")	
}


app.on("ready", () => {
	createWindow()

	let mainMenu = Menu.buildFromTemplate(menu)
	Menu.setApplicationMenu(mainMenu)

	// globalShortcut.register("CmdOrCtrl+R", () => win.reload())
	// globalShortcut.register(isMac ? "Command+Alt+I" : "Ctrl+Shift+I", () => win.toggleDevTools())
	
	// mainWindow.on("ready", () => mainWindow = null)
})


const menu = [
	...(isMac ? [{
		label: app.name,
		submenu: [
			{
				label: "About",
				click: () => createAboutWindow()
			}
		]
	}] : []),
	// {
	// 	label: "File",
	// 	submenu: [
	// 		{
		// 			label: "Quit",
		// 			accelerator: "CmdOrCtrl+W",
		// 			click: () => app.quit()
	// 		}
	// 	]
	// },
	{ role: "fileMenu"},
	...(isDev? [
		{
			label: "Developer",
			submenu: [
				{ role: "reload" },
				{ role: "forcereload" },
				{ type: "separator" },
				{ role: "toggledevtools" }
			]
		}
	]: []), 
	...(!isMac ? [{
		label: "Help",
		submenu: [
			{
				label: "About",
				click: () => createAboutWindow()
			}
		]
	}]: []),
]

ipcMain.on("image:minimize", (e, options) => {
	options.dest = path.join(os.homedir(), "imageshrink")
	shrinkimages(options)
})

async function shrinkimages({ imgPath, quality, dest }){
	try{
		const files = await imagemin([slash(imgPath)], {
			destination: dest,
			plugins: [
				imageminmozjpeg({quality}),
				imageminpngquant({
					quality:[quality/100, quality/100]
				})
			]
		})
	shell.openPath(dest)
	log.info(files)
	win.webContents.send("image:done")
	}catch (e){
		log.error(e)		
	}
}

app.on("window-all-closed", () => {
	if(!isMac){
		app.quit()
	}
})
