import ffmpeg

input_file = r'D:\Dropbox\_Documents\_Vlance_2025\September\Cafe Thoi Phu\render\CafeThoiPhu.mp4'
output_file = 'output_compressed.mp4'

(
    ffmpeg
    .input(input_file)
    .output(output_file, vcodec='libx264', crf=23)
    .run()
)
