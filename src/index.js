const util = require('util');
const fs = require("fs");
const exec = util.promisify(require('child_process').exec);
const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const handle = require('./utils/handle');
const getFilenameFromFilepath = require('./utils/getFilenamefromPath');

// Setup directories
const USER_HOME_DIR = require('os').homedir();
const SS_CACHE_BASE_DIR = `${USER_HOME_DIR}/.cache/soundscape`;
const SS_CACHE_TRANSCODE_DIR = `${SS_CACHE_BASE_DIR}/transcode`;
const SS_CACHE_USER_CLIPS_DIR = `${SS_CACHE_BASE_DIR}/user`;

const initCacheDir = async function() {
  console.log('Initializing cache directory...');
  const cacheDirs = [
    SS_CACHE_BASE_DIR,
    SS_CACHE_TRANSCODE_DIR,
    SS_CACHE_USER_CLIPS_DIR
  ];
  cacheDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      console.log(`Making directory '${dir}'`);
      fs.mkdirSync(dir);
    }
  })
}

/**
 * 
 * @param {Array} soundFilepaths 
 */
const cleanTranscodeDir = async function(soundFilepaths) {
  const soundFilenames = soundFilepaths.map((soundFilepath) => {
    return `${getFilenameFromFilepath(soundFilepath)}.wav`;
  });

  console.log('Cleaning transcode directory...');
  // get list of files existing in transcode cache dir
  const [foundFilenames, readdirErr] = await handle(readdir(SS_CACHE_TRANSCODE_DIR));
  if (readdirErr) throw new Error('Could not read transcode cache directory');

  foundFilenames.forEach((filename) => {
    if (!soundFilenames.includes(filename)) {
      const filepathToDelete = `${SS_CACHE_TRANSCODE_DIR}/${filename}`;
      
      try {
        fs.unlinkSync(filepathToDelete);
        console.log(`${filename} cleaned from cache`);
      } catch(err) {
        console.error(err)
      }
    }
  });
}

/**
 * TODO: validate inputFilepath
 * @param {String} inputFilepath 
 */
const convertToWave = async function(inputFilepath) {
  const filename = getFilenameFromFilepath(inputFilepath);
  const convertCommandString = `${ffmpegPath} -i ${inputFilepath} ${SS_CACHE_TRANSCODE_DIR}/${filename}.wav`;
  
  const { stdout, stderr } = await exec(convertCommandString);
  // console.log('stdout:', stdout);
  // console.log('stderr:', stderr);
}

/**
 * TODO: Figure out how to loop without stack overflow (ie callbacks)
 * @param {String} inputFilepath 
 */
const playWAV = async function(inputFilepath) {
  while (true) {
    const test = await exec(`aplay ${SS_CACHE_TRANSCODE_DIR}/${inputFilepath}.wav`);
    console.log(test);
  }
}

const playMP3 = async function(inputFilepath) {
  const filename = getFilenameFromFilepath(inputFilepath);
  if (!fs.existsSync(`${SS_CACHE_TRANSCODE_DIR}/${filename}.wav`)) {
    await convertToWave(inputFilepath);
  }
  await playWAV(filename);
}

const startPlayer = async function(soundFilepaths) {
  soundFilepaths = soundFilepaths || [
    'assets/audio/flac_test.flac',
    'assets/audio/ding.mp3'
  ];
  
  await initCacheDir();

  await cleanTranscodeDir(soundFilepaths);
  
  soundFilepaths.forEach(file => {
    playMP3(file);
  });
}

startPlayer();

// decouple transcode from play function
// "enqueue" files, and play all when transcoding is done for all
