import os
import subprocess
import json

files = [
    'animetion video.mp4',
    'logoremover_1787500706669.mp4',
    'logoremover_1787501009274.mp4',
    'logoremover_1787501214632.mp4'
]

os.makedirs('scratch/frames', exist_ok=True)

for idx, f in enumerate(files):
    cmd = ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_streams', f]
    p = subprocess.run(cmd, capture_output=True, text=True)
    info = json.loads(p.stdout)
    vstream = [s for s in info.get('streams', []) if s['codec_type'] == 'video'][0]
    w = vstream.get('width')
    h = vstream.get('height')
    dur = float(vstream.get('duration', 0))
    print(f'File {idx+1}: {f} | {w}x{h} | Duration: {dur}s')
    
    for t_ratio, t_name in [(0.1, 'start'), (0.5, 'mid'), (0.9, 'end')]:
        t_sec = dur * t_ratio
        out_name = f'scratch/frames/vid{idx+1}_{t_name}.jpg'
        cmd_img = ['ffmpeg', '-y', '-ss', str(t_sec), '-i', f, '-vframes', '1', '-q:v', '2', out_name]
        subprocess.run(cmd_img, capture_output=True)
print("Done probing!")
