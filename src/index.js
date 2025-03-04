const { exec } = require('child_process')
const execPromise = require('util').promisify(exec)

/* MAC PLAY COMMAND */
const macPlayCommand = (path, volume) => `afplay \"${path}\" -v ${volume}`

/* WINDOW PLAY COMMANDS */
const addPresentationCore = `Add-Type -AssemblyName presentationCore;`
const createMediaPlayer = `$player = New-Object system.windows.media.mediaplayer;`
const createDispather = `$dispatchFrame = New-Object System.Windows.Threading.DispatcherFrame;`
const addMediaEndedHook = `$player.add_MediaEnded({ $dispatchFrame.Continue = $false });`
const loadAudioFile = path => `$player.open('${path}');`
const playAudio = `$player.Play();`
const runDispatcher = `[System.Windows.Threading.Dispatcher]::PushFrame($dispatchFrame);`
const stopAudio = `while ($isPlaying) { Start-Sleep -Milliseconds 500; }; Exit;`

const windowPlayCommand = (path, volume) =>
  `powershell -c ${addPresentationCore} ${createMediaPlayer} ${createDispather} ${addMediaEndedHook} ${loadAudioFile(
    path,
  )} $player.Volume = ${volume}; ${playAudio} ${runDispatcher} ${stopAudio}`

module.exports = {
  play: async (path, volume=0.5) => {
    /**
     * Window: mediaplayer's volume is from 0 to 1, default is 0.5
     * Mac: afplay's volume is from 0 to 255, default is 1. However, volume > 2 usually result in distortion.
     * Therefore, it is better to limit the volume on Mac, and set a common scale of 0 to 1 for simplicity
     */
    const volumeAdjustedByOS = process.platform === 'darwin' ? Math.min(2, volume * 2) : volume

    const playCommand =
      process.platform === 'darwin' ? macPlayCommand(path, volumeAdjustedByOS) : windowPlayCommand(path, volumeAdjustedByOS)
    try {
      await execPromise(playCommand, {windowsHide: true});
    } catch (err) {
      throw err
    }
  },
}
