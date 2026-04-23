export class KaraokeAudioFilter {
  private context: AudioContext;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode;
  private splitter: ChannelSplitterNode;
  private merger: ChannelMergerNode;
  private outputGain: GainNode;
  private bypassNode: GainNode;
  private isKaraoke: boolean = false;

  constructor(private audioElement: HTMLAudioElement) {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Karaoke path nodes
    this.splitter = this.context.createChannelSplitter(2);
    this.merger = this.context.createChannelMerger(2);
    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = -1; // Invert phase
    this.outputGain = this.context.createGain();
    
    // Normal path node
    this.bypassNode = this.context.createGain();
    
    // Route for Karaoke (Phase cancellation)
    // L -> Merger L
    // R -> Inverter -> Merger L
    // (We'll output mono so we will link the same (L-R) signal to both L and R of the destination but let's keep it simple: mono is fine)
    this.splitter.connect(this.merger, 0, 0); // L -> L
    this.splitter.connect(this.gainNode, 1);  // R -> gain
    this.gainNode.connect(this.merger, 0, 0); // Inverted R -> L
    
    // Connect merger to output gain
    this.merger.connect(this.outputGain);
    
    // Connect both paths to destination
    this.outputGain.connect(this.context.destination);
    this.bypassNode.connect(this.context.destination);
    
    this.setMode(false);
  }

  public init() {
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    if (!this.sourceNode) {
      this.sourceNode = this.context.createMediaElementSource(this.audioElement);
      // Connect source to both paths
      this.sourceNode.connect(this.splitter);
      this.sourceNode.connect(this.bypassNode);
    }
  }

  public setMode(karaoke: boolean) {
    this.isKaraoke = karaoke;
    if (karaoke) {
      // Normal path off
      this.bypassNode.gain.value = 0;
      // Karaoke path on
      this.outputGain.gain.value = 1.0;
    } else {
      // Normal path on
      this.bypassNode.gain.value = 1.0;
      // Karaoke path off
      this.outputGain.gain.value = 0;
    }
  }
}
