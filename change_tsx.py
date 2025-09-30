import os

def rename_js_jsx_to_tsx(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            # Kiểm tra file có đuôi .js hoặc .jsx
            if file.endswith('.js') or file.endswith('.jsx'):
                # Tạo tên file mới với đuôi .tsx
                base_name = os.path.splitext(file)[0]
                new_name = base_name + '.tsx'

                # Đường dẫn đầy đủ file cũ và mới
                old_file = os.path.join(root, file)
                new_file = os.path.join(root, new_name)

                print(f'Renaming: {old_file} --> {new_file}')
                os.rename(old_file, new_file)

if __name__ == "__main__":
    path = r"quangcao_web\src\components\chat\src"
    rename_js_jsx_to_tsx(path)
